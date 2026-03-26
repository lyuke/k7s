import express, { Request, Response } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
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
  scaleDeployment,
  scaleReplicaSet,
  scaleStatefulSet,
  updateDeployment
} from './kube'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type WsHandler = (data: unknown, respond: (result: unknown) => void) => Promise<void>

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
}

// Store active WebSocket connections
const clients = new Map<WebSocket, boolean>()

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
  'k7s:apply-yaml': async (data, respond) => {
    const { contextId, yaml } = data as { contextId: string; yaml: string }
    respond(await applyYaml(contextId, yaml))
  },
  'k7s:get-resource-yaml': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: string; namespace: string; name: string }
    respond(await getResourceYaml(contextId, kind, namespace, name))
  }
}

function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, true)

    ws.on('message', async (message: Buffer) => {
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

        await handler(msg.data || msg.params, respond)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        ws.send(JSON.stringify({ id: 'error', error: errorMsg }))
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
    })

    ws.on('error', () => {
      clients.delete(ws)
    })
  })
}

export function startWebServer(port: number = 3000): { server: ReturnType<typeof createServer>; wss: WebSocketServer } {
  const app = express()

  // CORS headers for web mode
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
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
  const wss = new WebSocketServer({ server, path: '/ws' })

  setupWebSocket(wss)

  server.listen(port, () => {
    console.log(`k7s web server running at http://localhost:${port}`)
    console.log(`WebSocket server running at ws://localhost:${port}/ws`)
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
