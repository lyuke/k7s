/* node:coverage disable */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { Writable } from 'node:stream'
import { CoreV1Api, Exec, Log, Watch } from '@kubernetes/client-node'
import type {
  K7sPushEvent,
  PodExecData,
  PodExecResult,
  PodLogStreamRequest,
  PodLogStreamResult,
  PortForwardRequest,
  PortForwardResult,
  RolloutResult,
  RolloutWorkloadKind,
} from '../shared/types'
import { getConfiguredKubeConfig } from './kube'

type PushEmitter = (event: K7sPushEvent) => void

type WatchSubscription = {
  closed: boolean
  contextId: string
  emit: PushEmitter
  kubeConfig: Awaited<ReturnType<typeof getConfiguredKubeConfig>>
  controllers: Map<string, AbortController>
  timers: Set<NodeJS.Timeout>
}

type LogSession = {
  controller: AbortController
  emit: PushEmitter
  ended: boolean
}

type ExecSession = {
  emit: PushEmitter
  ended: boolean
  socket: { close: () => void } | null
}

type PortForwardSession = {
  emit: PushEmitter
  localPort: number
  namespace: string
  podName: string
  process: ChildProcessWithoutNullStreams
  targetPort: number
  tempKubeconfig: string
}

const watchSubscriptions = new Map<string, WatchSubscription>()
const logSessions = new Map<string, LogSession>()
const execSessions = new Map<string, ExecSession>()
const portForwardSessions = new Map<string, PortForwardSession>()

const WATCH_DEFINITIONS = [
  { resource: 'namespaces', path: '/api/v1/namespaces' },
  { resource: 'nodes', path: '/api/v1/nodes' },
  { resource: 'pods', path: '/api/v1/pods' },
  { resource: 'deployments', path: '/apis/apps/v1/deployments' },
  { resource: 'daemonsets', path: '/apis/apps/v1/daemonsets' },
  { resource: 'statefulsets', path: '/apis/apps/v1/statefulsets' },
  { resource: 'replicasets', path: '/apis/apps/v1/replicasets' },
  { resource: 'jobs', path: '/apis/batch/v1/jobs' },
  { resource: 'cronjobs', path: '/apis/batch/v1/cronjobs' },
  { resource: 'services', path: '/api/v1/services' },
  { resource: 'configmaps', path: '/api/v1/configmaps' },
  { resource: 'secrets', path: '/api/v1/secrets' },
  { resource: 'ingresses', path: '/apis/networking.k8s.io/v1/ingresses' },
  { resource: 'persistentvolumes', path: '/api/v1/persistentvolumes' },
  { resource: 'persistentvolumeclaims', path: '/api/v1/persistentvolumeclaims' },
  { resource: 'storageclasses', path: '/apis/storage.k8s.io/v1/storageclasses' },
  { resource: 'serviceaccounts', path: '/api/v1/serviceaccounts' },
  { resource: 'roles', path: '/apis/rbac.authorization.k8s.io/v1/roles' },
  { resource: 'rolebindings', path: '/apis/rbac.authorization.k8s.io/v1/rolebindings' },
  { resource: 'clusterroles', path: '/apis/rbac.authorization.k8s.io/v1/clusterroles' },
  { resource: 'clusterrolebindings', path: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings' },
  { resource: 'horizontalpodautoscalers', path: '/apis/autoscaling/v2/horizontalpodautoscalers' },
  { resource: 'events', path: '/api/v1/events' },
] as const

const ROLLOUT_KIND_TO_RESOURCE: Record<RolloutWorkloadKind, string> = {
  Deployment: 'deployment',
  DaemonSet: 'daemonset',
  StatefulSet: 'statefulset',
}

const shouldRetryWatch = (error: unknown) => {
  if (!error) return true
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number((error as { statusCode?: number }).statusCode)
    : undefined
  if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
    return false
  }
  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name?: string }).name)
    : ''
  return name !== 'AbortError'
}

const delayForAttempt = (attempt: number) => Math.min(5000, 500 * Math.pow(2, attempt))

const removeFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath)
  } catch {
    // Ignore cleanup errors.
  }
}

const createTempKubeconfig = async (contextId: string) => {
  const kubeConfig = await getConfiguredKubeConfig(contextId)
  const filePath = path.join(os.tmpdir(), `k7s-runtime-${randomUUID()}.yaml`)
  await fs.writeFile(filePath, kubeConfig.exportConfig(), { mode: 0o600 })
  return filePath
}

const resolveLogContainerName = async (
  kubeConfig: Awaited<ReturnType<typeof getConfiguredKubeConfig>>,
  namespace: string,
  podName: string,
  requestedContainerName?: string,
) => {
  const normalizedContainerName = requestedContainerName?.trim()
  if (normalizedContainerName) {
    return normalizedContainerName
  }

  const api = kubeConfig.makeApiClient(CoreV1Api)
  const res = await api.readNamespacedPod({ name: podName, namespace })
  const pod = res as {
    body?: {
      spec?: {
        containers?: Array<{ name?: string }>
      }
    }
    spec?: {
      containers?: Array<{ name?: string }>
    }
  }
  const containers = pod.body?.spec?.containers ?? pod.spec?.containers ?? []
  const firstContainerName = containers[0]?.name?.trim()

  if (!firstContainerName) {
    throw new Error('Pod 没有可用容器，无法读取日志')
  }

  return firstContainerName
}

const allocatePort = async (preferredPort?: number) => new Promise<number>((resolve, reject) => {
  const server = net.createServer()

  server.on('error', (error) => {
    reject(error)
  })

  server.listen(preferredPort ?? 0, '127.0.0.1', () => {
    const address = server.address()
    if (!address || typeof address === 'string') {
      server.close(() => reject(new Error('无法分配本地端口')))
      return
    }
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve(address.port)
    })
  })
})

const endLogSession = (streamId: string, error?: string) => {
  const session = logSessions.get(streamId)
  if (!session || session.ended) return
  session.ended = true
  logSessions.delete(streamId)
  session.emit({ type: 'log:end', streamId, error })
}

const endExecSession = (sessionId: string, payload?: { error?: string; message?: string }) => {
  const session = execSessions.get(sessionId)
  if (!session || session.ended) return
  session.ended = true
  execSessions.delete(sessionId)
  session.emit({
    type: 'exec:end',
    sessionId,
    error: payload?.error,
    message: payload?.message,
  })
}

const startWatch = async (
  ownerId: string,
  resource: (typeof WATCH_DEFINITIONS)[number],
  attempt: number,
) => {
  const subscription = watchSubscriptions.get(ownerId)
  if (!subscription || subscription.closed) return

  const watcher = new Watch(subscription.kubeConfig)
  const controller = await watcher.watch(
    resource.path,
    {},
    (phase) => {
      const activeSubscription = watchSubscriptions.get(ownerId)
      if (!activeSubscription || activeSubscription.closed) return
      activeSubscription.emit({
        type: 'watch',
        contextId: activeSubscription.contextId,
        resource: resource.resource,
        phase,
      })
    },
    (error) => {
      const activeSubscription = watchSubscriptions.get(ownerId)
      if (!activeSubscription || activeSubscription.closed) return
      activeSubscription.controllers.delete(resource.resource)
      if (!shouldRetryWatch(error)) return
      const timer = setTimeout(() => {
        activeSubscription.timers.delete(timer)
        void startWatch(ownerId, resource, attempt + 1)
      }, delayForAttempt(attempt))
      activeSubscription.timers.add(timer)
    },
  )

  subscription.controllers.set(resource.resource, controller)
}

export const subscribeToContextWatch = async (ownerId: string, contextId: string, emit: PushEmitter) => {
  await unsubscribeFromContextWatch(ownerId)

  const subscription: WatchSubscription = {
    closed: false,
    contextId,
    emit,
    kubeConfig: await getConfiguredKubeConfig(contextId),
    controllers: new Map(),
    timers: new Set(),
  }

  watchSubscriptions.set(ownerId, subscription)
  await Promise.all(WATCH_DEFINITIONS.map((resource) => startWatch(ownerId, resource, 0)))
}

export const unsubscribeFromContextWatch = async (ownerId: string) => {
  const subscription = watchSubscriptions.get(ownerId)
  if (!subscription) return

  subscription.closed = true
  for (const controller of subscription.controllers.values()) {
    controller.abort()
  }
  for (const timer of subscription.timers) {
    clearTimeout(timer)
  }

  watchSubscriptions.delete(ownerId)
}

export const startPodLogStream = async (
  contextId: string,
  request: PodLogStreamRequest,
  emit: PushEmitter,
): Promise<PodLogStreamResult> => {
  const streamId = randomUUID()
  const kubeConfig = await getConfiguredKubeConfig(contextId)
  const containerName = await resolveLogContainerName(
    kubeConfig,
    request.namespace,
    request.podName,
    request.containerName,
  )
  const writer = new Writable({
    write(chunk, _encoding, callback) {
      emit({
        type: 'log:chunk',
        streamId,
        chunk: Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk),
      })
      callback()
    },
    final(callback) {
      endLogSession(streamId)
      callback()
    },
  })

  writer.on('error', (error) => {
    endLogSession(streamId, error instanceof Error ? error.message : String(error))
  })

  const controller = await new Log(kubeConfig).log(
    request.namespace,
    request.podName,
    containerName,
    writer,
    {
      follow: true,
      tailLines: request.tailLines ?? 200,
    },
  )

  logSessions.set(streamId, { controller, emit, ended: false })
  return { streamId }
}

export const stopPodLogStream = async (streamId: string) => {
  const session = logSessions.get(streamId)
  if (!session) return
  session.controller.abort()
  endLogSession(streamId)
}

export const startPodExec = async (
  contextId: string,
  request: PodExecData,
  emit: PushEmitter,
): Promise<PodExecResult> => {
  const sessionId = randomUUID()
  const kubeConfig = await getConfiguredKubeConfig(contextId)
  const stdout = new Writable({
    write(chunk, _encoding, callback) {
      emit({
        type: 'exec:chunk',
        sessionId,
        stream: 'stdout',
        chunk: Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk),
      })
      callback()
    },
  })
  const stderr = new Writable({
    write(chunk, _encoding, callback) {
      emit({
        type: 'exec:chunk',
        sessionId,
        stream: 'stderr',
        chunk: Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk),
      })
      callback()
    },
  })

  execSessions.set(sessionId, { emit, ended: false, socket: null })

  const socket = await new Exec(kubeConfig).exec(
    request.namespace,
    request.podName,
    request.containerName ?? '',
    ['/bin/sh', '-lc', request.command],
    stdout,
    stderr,
    null,
    false,
    (status) => {
      endExecSession(sessionId, { message: status.message })
    },
  )

  const session = execSessions.get(sessionId)
  if (session) {
    session.socket = socket as unknown as { close: () => void }
  }

  if (typeof (socket as { on?: unknown }).on === 'function') {
    ;(socket as { on: (event: string, handler: (value?: unknown) => void) => void }).on('close', () => {
      endExecSession(sessionId)
    })
    ;(socket as { on: (event: string, handler: (value?: unknown) => void) => void }).on('error', (error) => {
      endExecSession(sessionId, { error: error instanceof Error ? error.message : String(error) })
    })
  }

  return { sessionId }
}

export const stopPodExec = async (sessionId: string) => {
  const session = execSessions.get(sessionId)
  if (!session) return
  session.socket?.close()
  endExecSession(sessionId, { message: '命令已终止' })
}

export const startPortForward = async (
  contextId: string,
  request: PortForwardRequest,
  emit: PushEmitter,
): Promise<PortForwardResult> => {
  const localPort = await allocatePort(request.localPort)
  const tempKubeconfig = await createTempKubeconfig(contextId)
  const sessionId = randomUUID()

  return new Promise<PortForwardResult>((resolve, reject) => {
    const child = spawn(
      'kubectl',
      [
        'port-forward',
        `pod/${request.podName}`,
        `${localPort}:${request.targetPort}`,
        '-n',
        request.namespace,
        '--address',
        '127.0.0.1',
      ],
      {
        env: {
          ...process.env,
          KUBECONFIG: tempKubeconfig,
        },
      },
    )

    let settled = false
    let started = false
    let stderrOutput = ''
    let stdoutOutput = ''

    const finalize = async (error?: string) => {
      await removeFile(tempKubeconfig)
      if (!started && !settled) {
        settled = true
        reject(new Error(error || '启动端口转发失败'))
      }
    }

    const handleOutput = (chunk: Buffer | string) => {
      const text = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk
      if (/Forwarding from/i.test(text) && !started) {
        started = true
        portForwardSessions.set(sessionId, {
          emit,
          localPort,
          namespace: request.namespace,
          podName: request.podName,
          process: child,
          targetPort: request.targetPort,
          tempKubeconfig,
        })
        emit({
          type: 'port-forward',
          sessionId,
          state: 'running',
          namespace: request.namespace,
          podName: request.podName,
          localPort,
          targetPort: request.targetPort,
          message: text.trim(),
        })
        if (!settled) {
          settled = true
          resolve({
            sessionId,
            localPort,
            message: `127.0.0.1:${localPort} -> ${request.targetPort}`,
          })
        }
      }
    }

    child.stdout.on('data', (chunk) => {
      stdoutOutput += chunk.toString('utf-8')
      handleOutput(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString('utf-8')
      handleOutput(chunk)
    })

    const startupTimeout = setTimeout(() => {
      if (started || settled) return
      child.kill()
      void finalize('启动端口转发超时')
    }, 10000)

    child.on('error', (error) => {
      clearTimeout(startupTimeout)
      if (started) {
        emit({
          type: 'port-forward',
          sessionId,
          state: 'error',
          namespace: request.namespace,
          podName: request.podName,
          localPort,
          targetPort: request.targetPort,
          message: error.message,
        })
      } else {
        void finalize(error.message)
      }
    })

    child.on('close', (code) => {
      clearTimeout(startupTimeout)
      portForwardSessions.delete(sessionId)
      void removeFile(tempKubeconfig)
      if (started) {
        emit({
          type: 'port-forward',
          sessionId,
          state: code === 0 ? 'stopped' : 'error',
          namespace: request.namespace,
          podName: request.podName,
          localPort,
          targetPort: request.targetPort,
          message: (stderrOutput || stdoutOutput || '').trim() || `port-forward exited with code ${code ?? -1}`,
        })
      } else if (!settled) {
        settled = true
        reject(new Error((stderrOutput || stdoutOutput || '').trim() || `port-forward exited with code ${code ?? -1}`))
      }
    })
  })
}

export const stopPortForward = async (sessionId: string) => {
  const session = portForwardSessions.get(sessionId)
  if (!session) return
  session.process.kill()
}

const runKubectlCommand = async (
  contextId: string,
  args: string[],
): Promise<RolloutResult> => {
  const tempKubeconfig = await createTempKubeconfig(contextId)

  return new Promise<RolloutResult>((resolve) => {
    const child = spawn('kubectl', args, {
      env: {
        ...process.env,
        KUBECONFIG: tempKubeconfig,
      },
    })

    let stdoutOutput = ''
    let stderrOutput = ''

    child.stdout.on('data', (chunk) => {
      stdoutOutput += chunk.toString('utf-8')
    })

    child.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString('utf-8')
    })

    child.on('error', async (error) => {
      await removeFile(tempKubeconfig)
      resolve({ success: false, message: error.message })
    })

    child.on('close', async (code) => {
      await removeFile(tempKubeconfig)
      const message = (stderrOutput || stdoutOutput || '').trim()
      resolve({
        success: code === 0,
        message: message || (code === 0 ? '操作完成' : `kubectl exited with code ${code ?? -1}`),
      })
    })
  })
}

export const rollbackWorkload = async (
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  return runKubectlCommand(
    contextId,
    ['rollout', 'undo', `${ROLLOUT_KIND_TO_RESOURCE[kind]}/${name}`, '-n', namespace],
  )
}

export const cleanupRuntimeOwner = async (ownerId: string) => {
  await unsubscribeFromContextWatch(ownerId)
}
/* node:coverage enable */
