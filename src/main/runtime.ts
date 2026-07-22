/* node:coverage disable */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { Writable } from 'node:stream'
import * as pty from 'node-pty'
import { CoreV1Api, Exec, Log, PatchStrategy, Watch, setHeaderOptions } from '@kubernetes/client-node'
import type {
  K7sPushEvent,
  DeleteResult,
  HelmChartInfo,
  HelmRepositoryInfo,
  HelmReleaseUpgradeRequest,
  MetadataField,
  PodExecData,
  PodExecResult,
  PodLogStreamRequest,
  PodLogStreamResult,
  PortForwardRequest,
  PortForwardResult,
  PortForwardSessionInfo,
  RolloutResult,
  RolloutWorkloadKind,
  UpdateResult,
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
  contextId: string
  emit: PushEmitter
  localPort: number
  namespace: string
  podName: string
  process: ChildProcessWithoutNullStreams
  protocol: string
  serviceName?: string
  startedAt: string
  targetKind: 'Pod' | 'Service'
  targetName: string
  targetPort: number
  tempKubeconfig: string
}

type TerminalEmitter = {
  onData: (data: string) => void
  onExit: (exitCode: number) => void
}

type TerminalSession = {
  process: pty.IPty
  tempKubeconfig: string
}

const watchSubscriptions = new Map<string, WatchSubscription>()
const logSessions = new Map<string, LogSession>()
const execSessions = new Map<string, ExecSession>()
const portForwardSessions = new Map<string, PortForwardSession>()
const terminalSessions = new Map<string, TerminalSession>()

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
      previous: request.previous ?? false,
      timestamps: request.timestamps ?? false,
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
  const startedAt = new Date().toISOString()
  const targetKind = request.targetKind ?? (request.serviceName ? 'Service' : 'Pod')
  const targetName = request.targetName ?? request.serviceName ?? request.podName

  if (!targetName) {
    await removeFile(tempKubeconfig)
    throw new Error('端口转发目标不能为空')
  }

  return new Promise<PortForwardResult>((resolve, reject) => {
    const child = spawn(
      'kubectl',
      [
        'port-forward',
        `${targetKind.toLowerCase()}/${targetName}`,
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
          contextId,
          emit,
          localPort,
          namespace: request.namespace,
          podName: targetKind === 'Pod' ? targetName : '',
          process: child,
          protocol: 'TCP',
          serviceName: targetKind === 'Service' ? targetName : undefined,
          startedAt,
          targetKind,
          targetName,
          targetPort: request.targetPort,
          tempKubeconfig,
        })
        emit({
          type: 'port-forward',
          sessionId,
          contextId,
          targetKind,
          targetName,
          state: 'running',
          namespace: request.namespace,
          podName: targetKind === 'Pod' ? targetName : '',
          serviceName: targetKind === 'Service' ? targetName : undefined,
          localPort,
          targetPort: request.targetPort,
          protocol: 'TCP',
          startedAt,
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
          contextId,
          targetKind,
          targetName,
          state: 'error',
          namespace: request.namespace,
          podName: targetKind === 'Pod' ? targetName : '',
          serviceName: targetKind === 'Service' ? targetName : undefined,
          localPort,
          targetPort: request.targetPort,
          protocol: 'TCP',
          startedAt,
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
          contextId,
          targetKind,
          targetName,
          state: code === 0 ? 'stopped' : 'error',
          namespace: request.namespace,
          podName: targetKind === 'Pod' ? targetName : '',
          serviceName: targetKind === 'Service' ? targetName : undefined,
          localPort,
          targetPort: request.targetPort,
          protocol: 'TCP',
          startedAt,
          message: (stderrOutput || stdoutOutput || '').trim() || `port-forward exited with code ${code ?? -1}`,
        })
      } else if (!settled) {
        settled = true
        reject(new Error((stderrOutput || stdoutOutput || '').trim() || `port-forward exited with code ${code ?? -1}`))
      }
    })
  })
}

export const listPortForwards = async (): Promise<PortForwardSessionInfo[]> => (
  Array.from(portForwardSessions.entries(), ([sessionId, session]) => ({
    sessionId,
    contextId: session.contextId,
    name: session.targetName,
    targetKind: session.targetKind,
    targetName: session.targetName,
    namespace: session.namespace,
    podName: session.podName,
    serviceName: session.serviceName,
    localPort: session.localPort,
    targetPort: session.targetPort,
    protocol: session.protocol,
    state: 'running',
    startedAt: session.startedAt,
    message: `127.0.0.1:${session.localPort} -> ${session.targetPort}`,
  }))
)

export const stopPortForward = async (sessionId: string) => {
  const session = portForwardSessions.get(sessionId)
  if (!session) return
  session.process.kill()
}

export const createTerminalSession = async (
  ownerId: string,
  contextId: string,
  emit: TerminalEmitter,
): Promise<{ shell: string; cwd: string }> => {
  await destroyTerminalSession(ownerId)

  const tempKubeconfig = await createTempKubeconfig(contextId)
  const shellEnv = process.env.SHELL || ''
  const shell = process.platform === 'win32'
    ? 'powershell.exe'
    : (/^[a-zA-Z0-9/_-]+$/.test(shellEnv) ? shellEnv : '/bin/sh')
  const cwd = os.homedir()

  try {
    const terminalProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: {
        ...process.env,
        KUBECONFIG: tempKubeconfig,
      } as Record<string, string>,
    })

    terminalSessions.set(ownerId, {
      process: terminalProcess,
      tempKubeconfig,
    })

    terminalProcess.onData((data) => {
      emit.onData(data)
    })

    terminalProcess.onExit(({ exitCode }) => {
      terminalSessions.delete(ownerId)
      emit.onExit(exitCode)
      void removeFile(tempKubeconfig)
    })

    return { shell, cwd }
  } catch (error) {
    await removeFile(tempKubeconfig)
    throw error
  }
}

export const writeTerminalSession = async (ownerId: string, data: string) => {
  terminalSessions.get(ownerId)?.process.write(data)
}

export const resizeTerminalSession = async (ownerId: string, cols: number, rows: number) => {
  terminalSessions.get(ownerId)?.process.resize(cols, rows)
}

export const destroyTerminalSession = async (ownerId: string) => {
  const session = terminalSessions.get(ownerId)
  if (!session) return

  terminalSessions.delete(ownerId)
  session.process.kill()
  await removeFile(session.tempKubeconfig)
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

const patchOptions = (strategy: string): any => setHeaderOptions('Content-Type', strategy)
const mergePatchOptions = () => patchOptions(PatchStrategy.MergePatch)

const runHelmCommand = async (
  contextId: string,
  args: string[],
  successMessage = 'Helm 操作完成',
): Promise<RolloutResult> => {
  const tempKubeconfig = await createTempKubeconfig(contextId)

  return new Promise<RolloutResult>((resolve) => {
    const child = spawn('helm', args, {
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
        message: message || (code === 0 ? successMessage : `helm exited with code ${code ?? -1}`),
      })
    })
  })
}

const runLocalHelmCommand = async (
  args: string[],
  successMessage = 'Helm 操作完成',
): Promise<RolloutResult> => new Promise<RolloutResult>((resolve) => {
  const child = spawn('helm', args)

  let stdoutOutput = ''
  let stderrOutput = ''

  child.stdout.on('data', (chunk) => {
    stdoutOutput += chunk.toString('utf-8')
  })

  child.stderr.on('data', (chunk) => {
    stderrOutput += chunk.toString('utf-8')
  })

  child.on('error', (error) => {
    resolve({ success: false, message: error.message })
  })

  child.on('close', (code) => {
    const message = (stderrOutput || stdoutOutput || '').trim()
    resolve({
      success: code === 0,
      message: message || (code === 0 ? successMessage : `helm exited with code ${code ?? -1}`),
    })
  })
})

const runLocalHelmJsonCommand = async <T>(
  args: string[],
  emptyValue: T,
  emptyPattern?: RegExp,
): Promise<T> => new Promise<T>((resolve, reject) => {
  const child = spawn('helm', args)

  let stdoutOutput = ''
  let stderrOutput = ''

  child.stdout.on('data', (chunk) => {
    stdoutOutput += chunk.toString('utf-8')
  })

  child.stderr.on('data', (chunk) => {
    stderrOutput += chunk.toString('utf-8')
  })

  child.on('error', (error) => {
    reject(error)
  })

  child.on('close', (code) => {
    const message = (stderrOutput || stdoutOutput || '').trim()
    if (code !== 0) {
      if (emptyPattern?.test(message)) {
        resolve(emptyValue)
        return
      }
      reject(new Error(message || `helm exited with code ${code ?? -1}`))
      return
    }

    try {
      resolve(JSON.parse(stdoutOutput || '[]') as T)
    } catch (err) {
      reject(new Error(`Helm JSON 解析失败: ${err instanceof Error ? err.message : String(err)}`))
    }
  })
})

export const listHelmRepositories = async (_contextId: string): Promise<HelmRepositoryInfo[]> => {
  const repositories = await runLocalHelmJsonCommand<Array<{ name?: string; url?: string }>>(
    ['repo', 'list', '-o', 'json'],
    [],
    /no repositories/i,
  )

  return repositories
    .map((repository) => ({
      name: repository.name?.trim() ?? '',
      url: repository.url?.trim() ?? '',
    }))
    .filter((repository) => repository.name || repository.url)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const listHelmCharts = async (_contextId: string): Promise<HelmChartInfo[]> => {
  const charts = await runLocalHelmJsonCommand<Array<{
    name?: string
    version?: string
    chart_version?: string
    app_version?: string
    appVersion?: string
    description?: string
  }>>(
    ['search', 'repo', '-o', 'json'],
    [],
    /no repositories|no results found/i,
  )

  return charts
    .map((chart) => {
      const name = chart.name?.trim() ?? ''
      const separatorIndex = name.indexOf('/')
      return {
        name,
        repository: separatorIndex > 0 ? name.slice(0, separatorIndex) : '',
        chart: separatorIndex > 0 ? name.slice(separatorIndex + 1) : name,
        version: chart.version?.trim() || chart.chart_version?.trim() || '-',
        appVersion: chart.app_version?.trim() || chart.appVersion?.trim() || '-',
        description: chart.description?.trim() || '-',
      }
    })
    .filter((chart) => chart.name)
    .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
}

export const addHelmRepository = async (
  _contextId: string,
  name: string,
  url: string,
): Promise<RolloutResult> => {
  const normalizedName = name.trim()
  const normalizedUrl = url.trim()

  if (!normalizedName) {
    return { success: false, message: 'Helm Repository 新增需要名称' }
  }
  if (!normalizedUrl) {
    return { success: false, message: 'Helm Repository 新增需要 URL' }
  }

  return runLocalHelmCommand(
    ['repo', 'add', normalizedName, normalizedUrl],
    `Helm Repository ${normalizedName} 已新增`,
  )
}

export const updateHelmRepository = async (
  _contextId: string,
  name?: string,
): Promise<RolloutResult> => {
  const normalizedName = name?.trim()

  return runLocalHelmCommand(
    ['repo', 'update', ...(normalizedName ? [normalizedName] : [])],
    normalizedName ? `Helm Repository ${normalizedName} 已更新` : 'Helm Repositories 已更新',
  )
}

export const removeHelmRepository = async (
  _contextId: string,
  name: string,
): Promise<DeleteResult> => {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return { success: false, message: 'Helm Repository 删除需要名称' }
  }

  return runLocalHelmCommand(
    ['repo', 'remove', normalizedName],
    `Helm Repository ${normalizedName} 已删除`,
  )
}

const normalizeHelmUpgradeRequest = (request: HelmReleaseUpgradeRequest) => {
  const name = request.name.trim()
  const namespace = request.namespace.trim()
  const chart = request.chart.trim()
  const version = request.version?.trim()
  const valuesFile = request.valuesFile?.trim()
  const timeout = request.timeout?.trim()
  const setValues = (request.setValues ?? []).map((value) => value.trim())

  if (!name) {
    return { error: 'Helm Release 安装/升级需要名称' }
  }
  if (!namespace) {
    return { error: 'Helm Release 安装/升级需要命名空间' }
  }
  if (!chart) {
    return { error: 'Helm Release 安装/升级需要 Chart' }
  }
  if (request.version !== undefined && !version) {
    return { error: 'Helm Release 安装/升级 version 不能为空' }
  }
  if (request.valuesFile !== undefined && !valuesFile) {
    return { error: 'Helm Release 安装/升级 values file 不能为空' }
  }
  if (setValues.some((value) => !value)) {
    return { error: 'Helm Release 安装/升级 --set 参数不能为空' }
  }
  if (request.timeout !== undefined && !timeout) {
    return { error: 'Helm Release 安装/升级 timeout 不能为空' }
  }

  return {
    args: [
      'upgrade',
      ...(request.install !== false ? ['--install'] : []),
      name,
      chart,
      '-n',
      namespace,
      ...(version ? ['--version', version] : []),
      ...(valuesFile ? ['--values', valuesFile] : []),
      ...setValues.flatMap((value) => ['--set', value]),
      ...(request.createNamespace ? ['--create-namespace'] : []),
      ...(request.wait ? ['--wait'] : []),
      ...(timeout ? ['--timeout', timeout] : []),
    ],
    chart,
    name,
    namespace,
  }
}

const runKubectlTextCommand = async (
  contextId: string,
  args: string[],
): Promise<string> => {
  const tempKubeconfig = await createTempKubeconfig(contextId)

  return new Promise<string>((resolve, reject) => {
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
      reject(error)
    })

    child.on('close', async (code) => {
      await removeFile(tempKubeconfig)
      if (code === 0) {
        resolve(stdoutOutput)
        return
      }
      reject(new Error((stderrOutput || stdoutOutput || `kubectl exited with code ${code ?? -1}`).trim()))
    })
  })
}

const kubectlResourceTarget = (kind: string, name: string) => {
  const normalizedKind = kind.trim()
  const normalizedName = name.trim()
  if (!normalizedName) {
    throw new Error('需要资源名称')
  }
  if (!normalizedKind) {
    throw new Error('需要资源类型')
  }

  const customResourcePrefix = 'CustomResource:'
  if (normalizedKind.startsWith(customResourcePrefix)) {
    const crdName = normalizedKind.slice(customResourcePrefix.length).trim()
    if (!crdName) {
      throw new Error('CustomResource 需要 CustomResourceDefinition 名称')
    }
    return `${crdName}/${normalizedName}`
  }

  return `${normalizedKind}/${normalizedName}`
}

const isNodeKind = (kind: string) => ['node', 'nodes'].includes(kind.trim().toLowerCase())

const mutateNodeMetadata = async (
  contextId: string,
  name: string,
  field: MetadataField,
  key: string,
  value: string,
  remove: boolean,
): Promise<UpdateResult> => {
  const nodeName = name.trim()
  if (!nodeName) {
    return { success: false, message: '需要资源名称' }
  }

  const kubeConfig = await getConfiguredKubeConfig(contextId)
  const api = kubeConfig.makeApiClient(CoreV1Api)
  const patchBody = {
    metadata: {
      [field]: {
        [key]: remove ? null : value,
      },
    },
  }

  try {
    await api.patchNode({ name: nodeName, body: patchBody as any }, mergePatchOptions())
    return {
      success: true,
      message: `Node ${nodeName} ${field === 'labels' ? 'Label' : 'Annotation'} 已${remove ? '删除' : '更新'}: ${key}`,
    }
  } catch (err) {
    return {
      success: false,
      message: `更新Node元数据失败: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export const describeResource = async (
  contextId: string,
  kind: string,
  namespace: string,
  name: string,
): Promise<string> => {
  const args = ['describe', kubectlResourceTarget(kind, name)]
  const normalizedNamespace = namespace?.trim()
  if (normalizedNamespace && normalizedNamespace !== 'all') {
    args.push('-n', normalizedNamespace)
  }
  return runKubectlTextCommand(contextId, args)
}

export const diffYaml = async (contextId: string, yaml: string): Promise<string> => {
  if (!yaml.trim()) {
    return '请输入 YAML 后再 Diff'
  }

  const tempKubeconfig = await createTempKubeconfig(contextId)
  const tempManifest = path.join(os.tmpdir(), `k7s-diff-${randomUUID()}.yaml`)
  try {
    await fs.writeFile(tempManifest, yaml, { mode: 0o600 })
  } catch (error) {
    await removeFile(tempKubeconfig)
    throw error
  }

  return new Promise<string>((resolve, reject) => {
    const child = spawn('kubectl', ['diff', '-f', tempManifest], {
      env: {
        ...process.env,
        KUBECONFIG: tempKubeconfig,
      },
    })

    let stdoutOutput = ''
    let stderrOutput = ''
    const cleanup = async () => {
      await removeFile(tempKubeconfig)
      await removeFile(tempManifest)
    }

    child.stdout.on('data', (chunk) => {
      stdoutOutput += chunk.toString('utf-8')
    })

    child.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString('utf-8')
    })

    child.on('error', async (error) => {
      await cleanup()
      reject(error)
    })

    child.on('close', async (code) => {
      await cleanup()
      const output = [stdoutOutput, stderrOutput].filter(Boolean).join('\n').trim()
      if (code === 0) {
        resolve(output || 'No changes')
        return
      }
      if (code === 1) {
        resolve(output || 'Diff detected')
        return
      }
      reject(new Error(output || `kubectl diff exited with code ${code ?? -1}`))
    })
  })
}

export const mutateResourceMetadata = async (
  contextId: string,
  kind: string,
  namespace: string,
  name: string,
  field: MetadataField,
  key: string,
  value: string,
  remove: boolean,
): Promise<UpdateResult> => {
  const metadataKey = key.trim()
  if (!metadataKey) {
    return { success: false, message: '请输入标签或注解键' }
  }
  if (field !== 'labels' && field !== 'annotations') {
    return { success: false, message: '元数据字段仅支持 labels 或 annotations' }
  }

  const command = field === 'annotations' ? 'annotate' : 'label'
  const mutation = remove ? `${metadataKey}-` : `${metadataKey}=${value}`
  if (isNodeKind(kind)) {
    return mutateNodeMetadata(contextId, name, field, metadataKey, value, remove)
  }

  const args = [command, kubectlResourceTarget(kind, name), mutation, '--overwrite']
  const normalizedNamespace = namespace?.trim()
  if (normalizedNamespace && normalizedNamespace !== 'all') {
    args.push('-n', normalizedNamespace)
  }

  return runKubectlCommand(contextId, args)
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

export const installOrUpgradeHelmRelease = async (
  contextId: string,
  request: HelmReleaseUpgradeRequest,
): Promise<RolloutResult> => {
  const normalized = normalizeHelmUpgradeRequest(request)
  if ('error' in normalized) {
    return { success: false, message: normalized.error }
  }

  return runHelmCommand(
    contextId,
    normalized.args,
    `Helm Release ${normalized.namespace}/${normalized.name} 已安装/升级自 ${normalized.chart}`,
  )
}

export const rollbackHelmRelease = async (
  contextId: string,
  namespace: string,
  name: string,
  revision?: number,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release 回滚需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release 回滚需要名称' }
  }
  if (revision !== undefined && (!Number.isInteger(revision) || revision < 1)) {
    return { success: false, message: 'Helm Release 回滚 revision 必须是正整数' }
  }

  return runHelmCommand(
    contextId,
    ['rollback', normalizedName, ...(revision !== undefined ? [String(revision)] : []), '-n', normalizedNamespace],
  )
}

export const rolloutHistory = async (
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  return runKubectlCommand(
    contextId,
    ['rollout', 'history', `${ROLLOUT_KIND_TO_RESOURCE[kind]}/${name}`, '-n', namespace],
  )
}

export const helmReleaseHistory = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release 历史需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release 历史需要名称' }
  }

  return runHelmCommand(contextId, ['history', normalizedName, '-n', normalizedNamespace])
}

export const helmReleaseStatus = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release 状态需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release 状态需要名称' }
  }

  return runHelmCommand(contextId, ['status', normalizedName, '-n', normalizedNamespace])
}

export const helmReleaseResources = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Resources 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Resources 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['status', normalizedName, '-n', normalizedNamespace, '--show-resources'],
    'Helm Release resources 为空',
  )
}

export const helmReleaseManifest = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Manifest 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Manifest 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'manifest', normalizedName, '-n', normalizedNamespace],
    'Helm Release manifest 为空',
  )
}

export const helmReleaseMetadata = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Metadata 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Metadata 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'metadata', normalizedName, '-n', normalizedNamespace],
    'Helm Release metadata 为空',
  )
}

export const helmReleaseValues = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Values 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Values 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'values', normalizedName, '-n', normalizedNamespace, '--all'],
    'Helm Release values 为空',
  )
}

export const helmReleaseNotes = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Notes 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Notes 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'notes', normalizedName, '-n', normalizedNamespace],
    'Helm Release notes 为空',
  )
}

export const helmReleaseHooks = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release Hooks 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release Hooks 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'hooks', normalizedName, '-n', normalizedNamespace],
    'Helm Release hooks 为空',
  )
}

export const helmReleaseAll = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release All 需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release All 需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['get', 'all', normalizedName, '-n', normalizedNamespace],
    'Helm Release all 输出为空',
  )
}

export const testHelmRelease = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release 测试需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release 测试需要名称' }
  }

  return runHelmCommand(
    contextId,
    ['test', normalizedName, '-n', normalizedNamespace],
    'Helm Release 测试完成',
  )
}

export const rolloutStatus = async (
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  return runKubectlCommand(
    contextId,
    ['rollout', 'status', `${ROLLOUT_KIND_TO_RESOURCE[kind]}/${name}`, '-n', namespace, '--watch=false'],
  )
}

export const uninstallHelmRelease = async (
  contextId: string,
  namespace: string,
  name: string,
): Promise<DeleteResult> => {
  const normalizedNamespace = namespace.trim()
  const normalizedName = name.trim()

  if (!normalizedNamespace) {
    return { success: false, message: 'Helm Release 卸载需要命名空间' }
  }
  if (!normalizedName) {
    return { success: false, message: 'Helm Release 卸载需要名称' }
  }

  return runHelmCommand(contextId, ['uninstall', normalizedName, '-n', normalizedNamespace])
}

export const cleanupRuntimeOwner = async (ownerId: string) => {
  await Promise.allSettled([
    unsubscribeFromContextWatch(ownerId),
    destroyTerminalSession(ownerId),
  ])
}
/* node:coverage enable */
