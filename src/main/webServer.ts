/* node:coverage disable */
import express from 'express'
import type { Request, Response } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer, IncomingMessage } from 'http'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  addKubeconfigPath,
  applyYaml,
  createConfigMap,
  createDeployment,
  createIngress,
  createNamespace,
  createSecret,
  createService,
  deleteCronJob,
  deleteDaemonSet,
  deleteDeployment,
  deleteJob,
  deleteNamespace,
  deletePod,
  deleteResource,
  deleteReplicaSet,
  deleteStatefulSet,
  getClusterHealth,
  getContextPrefs,
  getCronJobDetail,
  getDaemonSetDetail,
  getDeploymentDetail,
  getResourceYaml,
  updateContextGrouping,
  updateContextName,
  getEntry,
  getJobDetail,
  getNodeDetail,
  getNodeMetrics,
  getPodDetail,
  getPodLogs,
  getReplicaSetDetail,
  getStatefulSetDetail,
  listConfigMaps,
  listContexts,
  listCronJobs,
  listDaemonSets,
  listDeployments,
  listIngresses,
  listJobs,
  listNamespaces,
  listNodes,
  listPods,
  listReplicaSets,
  listSecrets,
  listServices,
  listStatefulSets,
  restartWorkload,
  scaleDeployment,
  scaleReplicaSet,
  scaleWorkload,
  scaleStatefulSet,
  updateDeployment
} from './kube'
import {
  cleanupRuntimeOwner,
  rollbackWorkload,
  subscribeToContextWatch,
  unsubscribeFromContextWatch,
} from './runtime'
import type {
  KubernetesResourceKind,
  RolloutWorkloadKind,
  ScaleableWorkloadKind,
} from '../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ConnectionMeta = {
  ownerId: string
  ws: WebSocket
}

type WsHandler = (data: unknown, respond: (result: unknown) => void, meta: ConnectionMeta) => Promise<void>

interface WsMessage {
  id: string
  method: string
  params?: unknown[]
  data?: unknown
}

interface WsResponse {
  id: string
  result?: unknown
  error?: string
  event?: string
  data?: unknown
}

// Store active WebSocket connections
const clients = new Map<WebSocket, { ownerId: string }>()

const sendEvent = (ws: WebSocket, event: string, data: unknown) => {
  ws.send(JSON.stringify({ id: '', event, data }))
}

// Handlers map - mirrors IPC handlers but for WebSocket
const handlers: Record<string, WsHandler> = {
  'k7s:list-contexts': async (_data, respond) => respond(await listContexts()),
  'k7s:get-context-prefs': async (_data, respond) => respond(await getContextPrefs()),
  'k7s:update-context-name': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await updateContextName(contextId, name))
  },
  'k7s:update-context-grouping': async (data, respond) => {
    const { groups, ungrouped } = data as { groups: { id: string; name: string; items: string[] }[]; ungrouped: string[] }
    respond(await updateContextGrouping(groups, ungrouped))
  },
  'k7s:list-namespaces': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listNamespaces(contextId))
  },
  'k7s:list-nodes': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listNodes(contextId))
  },
  'k7s:get-node-detail': async (data, respond) => {
    const { contextId, nodeName } = data as { contextId: string; nodeName: string }
    respond(await getNodeDetail(contextId, nodeName))
  },
  'k7s:get-node-metrics': async (data, respond) => {
    const { contextId, nodeName } = data as { contextId: string; nodeName: string }
    respond(await getNodeMetrics(contextId, nodeName))
  },
  'k7s:get-pod-detail': async (data, respond) => {
    const { contextId, namespace, podName } = data as { contextId: string; namespace: string; podName: string }
    respond(await getPodDetail(contextId, namespace, podName))
  },
  'k7s:get-deployment-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getDeploymentDetail(contextId, namespace, name))
  },
  'k7s:get-daemonset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getDaemonSetDetail(contextId, namespace, name))
  },
  'k7s:get-statefulset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getStatefulSetDetail(contextId, namespace, name))
  },
  'k7s:get-replicaset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getReplicaSetDetail(contextId, namespace, name))
  },
  'k7s:get-job-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getJobDetail(contextId, namespace, name))
  },
  'k7s:get-cronjob-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getCronJobDetail(contextId, namespace, name))
  },
  'k7s:list-pods': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPods(contextId, namespace))
  },
  'k7s:list-deployments': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listDeployments(contextId, namespace))
  },
  'k7s:list-daemonsets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listDaemonSets(contextId, namespace))
  },
  'k7s:list-statefulsets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listStatefulSets(contextId, namespace))
  },
  'k7s:list-replicasets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listReplicaSets(contextId, namespace))
  },
  'k7s:list-jobs': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listJobs(contextId, namespace))
  },
  'k7s:list-cronjobs': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listCronJobs(contextId, namespace))
  },
  'k7s:list-services': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listServices(contextId, namespace))
  },
  'k7s:list-configmaps': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listConfigMaps(contextId, namespace))
  },
  'k7s:list-secrets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listSecrets(contextId, namespace))
  },
  'k7s:list-ingresses': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listIngresses(contextId, namespace))
  },
  'k7s:delete-pod': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deletePod(contextId, namespace, name))
  },
  'k7s:delete-deployment': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteDeployment(contextId, namespace, name))
  },
  'k7s:delete-daemonset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteDaemonSet(contextId, namespace, name))
  },
  'k7s:delete-statefulset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteStatefulSet(contextId, namespace, name))
  },
  'k7s:delete-replicaset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteReplicaSet(contextId, namespace, name))
  },
  'k7s:delete-job': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteJob(contextId, namespace, name))
  },
  'k7s:delete-cronjob': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteCronJob(contextId, namespace, name))
  },
  'k7s:delete-namespace': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await deleteNamespace(contextId, name))
  },
  'k7s:scale-deployment': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleDeployment(contextId, namespace, name, replicas))
  },
  'k7s:scale-statefulset': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleStatefulSet(contextId, namespace, name, replicas))
  },
  'k7s:scale-replicaset': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleReplicaSet(contextId, namespace, name, replicas))
  },
  'k7s:get-pod-logs': async (data, respond) => {
    const { contextId, namespace, podName, containerName, tailLines } = data as { contextId: string; namespace: string; podName: string; containerName?: string; tailLines?: number }
    respond(await getPodLogs(contextId, namespace, podName, containerName, tailLines))
  },
  'k7s:get-cluster-health': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await getClusterHealth(contextId))
  },
  'k7s:create-namespace': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await createNamespace(contextId, name))
  },
  'k7s:create-deployment': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createDeployment(contextId, formData as Parameters<typeof createDeployment>[1]))
  },
  'k7s:create-service': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createService(contextId, formData as Parameters<typeof createService>[1]))
  },
  'k7s:create-configmap': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createConfigMap(contextId, formData as Parameters<typeof createConfigMap>[1]))
  },
  'k7s:create-secret': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createSecret(contextId, formData as Parameters<typeof createSecret>[1]))
  },
  'k7s:create-ingress': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createIngress(contextId, formData as Parameters<typeof createIngress>[1]))
  },
  'k7s:update-deployment': async (data, respond) => {
    const { contextId, namespace, name, formData } = data as { contextId: string; namespace: string; name: string; formData: unknown }
    respond(await updateDeployment(contextId, namespace, name, formData as Parameters<typeof updateDeployment>[3]))
  },
  'k7s:delete-resource': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: KubernetesResourceKind; namespace: string; name: string }
    respond(await deleteResource(contextId, kind, namespace, name))
  },
  'k7s:scale-workload': async (data, respond) => {
    const { contextId, kind, namespace, name, replicas } = data as {
      contextId: string
      kind: ScaleableWorkloadKind
      namespace: string
      name: string
      replicas: number
    }
    respond(await scaleWorkload(contextId, kind, namespace, name, replicas))
  },
  'k7s:restart-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await restartWorkload(contextId, kind, namespace, name))
  },
  'k7s:rollback-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await rollbackWorkload(contextId, kind, namespace, name))
  },
  'k7s:apply-yaml': async (data, respond) => {
    const { contextId, yaml } = data as { contextId: string; yaml: string }
    respond(await applyYaml(contextId, yaml))
  },
  'k7s:get-resource-yaml': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: string; namespace: string; name: string }
    respond(await getResourceYaml(contextId, kind, namespace, name))
  },
  'k7s:subscribe-watch': async (data, respond, meta) => {
    const { contextId } = data as { contextId: string }
    await subscribeToContextWatch(meta.ownerId, contextId, (event) => {
      sendEvent(meta.ws, 'k7s:push-event', event)
    })
    respond({ success: true })
  },
  'k7s:unsubscribe-watch': async (_data, respond, meta) => {
    await unsubscribeFromContextWatch(meta.ownerId)
    respond({ success: true })
  }
}

const WS_MAX_MESSAGE_BYTES = 1 * 1024 * 1024 // 1 MB
const WS_RATE_LIMIT_WINDOW_MS = 1000
const WS_RATE_LIMIT_MAX = 30 // max 30 messages per second per connection
const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const isLocalRequest = (request: IncomingMessage | Request) => {
  const remoteAddress = 'socket' in request ? request.socket.remoteAddress : request.ip
  return !!remoteAddress && LOCAL_ADDRESSES.has(remoteAddress)
}

const hasValidSessionCookie = (cookieHeader: string | undefined, token: string) => {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((cookie) => cookie.trim() === `k7s_session=${token}`)
}

function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    const ownerId = randomUUID()
    clients.set(ws, { ownerId })

    let messageCount = 0
    let windowStart = Date.now()

    ws.on('message', async (message: Buffer) => {
      // Message size guard
      if (message.length > WS_MAX_MESSAGE_BYTES) {
        ws.send(JSON.stringify({ id: 'error', error: 'Message too large' }))
        return
      }

      // Rate limit guard
      const now = Date.now()
      if (now - windowStart > WS_RATE_LIMIT_WINDOW_MS) {
        messageCount = 0
        windowStart = now
      }
      messageCount++
      if (messageCount > WS_RATE_LIMIT_MAX) {
        ws.send(JSON.stringify({ id: 'error', error: 'Rate limit exceeded' }))
        return
      }

      try {
        const msg: WsMessage = JSON.parse(message.toString())
        const handler = handlers[msg.method]

        if (!handler) {
          const response: WsResponse = { id: msg.id, error: `Unknown method: ${msg.method}` }
          ws.send(JSON.stringify(response))
          return
        }

        const respond = (result: unknown) => {
          const response: WsResponse = { id: msg.id, result }
          ws.send(JSON.stringify(response))
        }

        await handler(msg.data || msg.params, respond, { ownerId, ws })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        ws.send(JSON.stringify({ id: 'error', error: errorMsg }))
      }
    })

    ws.on('close', () => {
      void cleanupRuntimeOwner(ownerId)
      clients.delete(ws)
    })

    ws.on('error', () => {
      void cleanupRuntimeOwner(ownerId)
      clients.delete(ws)
    })
  })
}

export function startWebServer(port: number = 3000): { server: ReturnType<typeof createServer>; wss: WebSocketServer } {
  const app = express()
  const host = process.env.K7S_WEB_HOST || '127.0.0.1'
  const sessionToken = randomUUID().replace(/-/g, '')

  // CORS: only allow same-origin and localhost (web mode is local-only)
  const allowedOrigins = new Set([
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ])
  app.use((req, res, next) => {
    if (!isLocalRequest(req)) {
      res.status(403).json({ error: 'Local access only' })
      return
    }

    res.header('Set-Cookie', `k7s_session=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`)
    const origin = req.headers.origin
    if (origin && allowedOrigins.has(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  // Serve static files from renderer build
  const rendererDistPath = path.join(__dirname, '../renderer')
  app.use(express.static(rendererDistPath))

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', mode: 'web' })
  })

  // API endpoint for adding kubeconfig (web upload)
  app.post('/api/k7s/add-kubeconfig', express.json(), async (req: Request, res: Response) => {
    try {
      // In web mode, we'd typically handle file upload differently
      // For now, we return a message about the desktop app
      res.json({ message: 'Please use the desktop app to add kubeconfig files', contexts: [], addedIds: [] })
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  // SPA fallback - serve index.html for all non-API routes
  app.get('/{*path}', (_req: Request, res: Response) => {
    const indexPath = path.join(rendererDistPath, 'index.html')
    res.sendFile(indexPath)
  })

  const server = createServer(app)
  const wss = new WebSocketServer({ noServer: true })

  setupWebSocket(wss)

  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      socket.destroy()
      return
    }

    if (!isLocalRequest(request)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    if (!hasValidSessionCookie(request.headers.cookie, sessionToken)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    const origin = request.headers.origin
    if (origin && !allowedOrigins.has(origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  })

  server.listen(port, host, () => {
    console.log(`k7s web server running at http://${host}:${port}`)
    console.log(`WebSocket server running at ws://${host}:${port}/ws`)
  })

  return { server, wss }
}

export function broadcastToClients(message: unknown) {
  const data = JSON.stringify(message)
  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}
/* node:coverage enable */
