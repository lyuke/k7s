// WebSocket-based API client for web mode
// This provides the same interface as window.k7s but uses WebSocket instead of IPC

type RequestId = string
type Handler = (result: unknown) => void

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

export class WebSocketClient {
  private ws: WebSocket | null = null
  private pendingRequests = new Map<RequestId, {
    resolve: (result: unknown) => void
    reject: (error: Error) => void
  }>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageId = 0
  private wsUrl: string
  private eventHandlers = new Map<string, Set<Handler>>()

  constructor() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host || 'localhost:3000'
    this.wsUrl = `${protocol}//${host}/ws`
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const response: WsResponse = JSON.parse(event.data)
            if (response.event) {
              const handlers = this.eventHandlers.get(response.event)
              handlers?.forEach((handler) => handler(response.data))
              return
            }

            const pending = this.pendingRequests.get(response.id)
            if (pending) {
              if (response.error) {
                pending.reject(new Error(response.error))
              } else {
                pending.resolve(response.result)
              }
              this.pendingRequests.delete(response.id)
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          if (this.reconnectAttempts === 0) {
            reject(error)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(() => {
        // Reconnect failed, will try again or give up
      })
    }, delay)
  }

  private send(method: string, data?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const id = `msg_${++this.messageId}`
      const message: WsMessage = { id, method, data }

      this.pendingRequests.set(id, {
        resolve,
        reject,
      })

      this.ws.send(JSON.stringify(message))

      // Timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.pendingRequests.clear()
  }

  onEvent(event: string, handler: Handler) {
    const handlers = this.eventHandlers.get(event) ?? new Set<Handler>()
    handlers.add(handler)
    this.eventHandlers.set(event, handlers)
    return () => {
      const currentHandlers = this.eventHandlers.get(event)
      if (!currentHandlers) return
      currentHandlers.delete(handler)
      if (currentHandlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  // API Methods
  async listContexts() {
    return this.send('k7s:list-contexts') as Promise<unknown[]>
  }

  async getContextPrefs() {
    return this.send('k7s:get-context-prefs') as Promise<unknown>
  }

  async updateContextName(contextId: string, name: string) {
    return this.send('k7s:update-context-name', { contextId, name }) as Promise<unknown>
  }

  async updateContextGrouping(groups: unknown[], ungrouped: string[]) {
    return this.send('k7s:update-context-grouping', { groups, ungrouped }) as Promise<unknown>
  }

  async listNamespaces(contextId: string) {
    return this.send('k7s:list-namespaces', { contextId }) as Promise<unknown[]>
  }

  async listNodes(contextId: string) {
    return this.send('k7s:list-nodes', { contextId }) as Promise<unknown[]>
  }

  async getNodeDetail(contextId: string, nodeName: string) {
    return this.send('k7s:get-node-detail', { contextId, nodeName }) as Promise<unknown>
  }

  async listPods(contextId: string, namespace?: string) {
    return this.send('k7s:list-pods', { contextId, namespace }) as Promise<unknown[]>
  }

  async getPodDetail(contextId: string, namespace: string, podName: string) {
    return this.send('k7s:get-pod-detail', { contextId, namespace, podName }) as Promise<unknown>
  }

  async listDeployments(contextId: string, namespace?: string) {
    return this.send('k7s:list-deployments', { contextId, namespace }) as Promise<unknown[]>
  }

  async getDeploymentDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-deployment-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listDaemonSets(contextId: string, namespace?: string) {
    return this.send('k7s:list-daemonsets', { contextId, namespace }) as Promise<unknown[]>
  }

  async getDaemonSetDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-daemonset-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listStatefulSets(contextId: string, namespace?: string) {
    return this.send('k7s:list-statefulsets', { contextId, namespace }) as Promise<unknown[]>
  }

  async getStatefulSetDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-statefulset-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listReplicaSets(contextId: string, namespace?: string) {
    return this.send('k7s:list-replicasets', { contextId, namespace }) as Promise<unknown[]>
  }

  async getReplicaSetDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-replicaset-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listJobs(contextId: string, namespace?: string) {
    return this.send('k7s:list-jobs', { contextId, namespace }) as Promise<unknown[]>
  }

  async getJobDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-job-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listCronJobs(contextId: string, namespace?: string) {
    return this.send('k7s:list-cronjobs', { contextId, namespace }) as Promise<unknown[]>
  }

  async getCronJobDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-cronjob-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listServices(contextId: string, namespace?: string) {
    return this.send('k7s:list-services', { contextId, namespace }) as Promise<unknown[]>
  }

  async listConfigMaps(contextId: string, namespace?: string) {
    return this.send('k7s:list-configmaps', { contextId, namespace }) as Promise<unknown[]>
  }

  async listSecrets(contextId: string, namespace?: string) {
    return this.send('k7s:list-secrets', { contextId, namespace }) as Promise<unknown[]>
  }

  async listIngresses(contextId: string, namespace?: string) {
    return this.send('k7s:list-ingresses', { contextId, namespace }) as Promise<unknown[]>
  }

  async deletePod(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-pod', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteDeployment(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-deployment', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteDaemonSet(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-daemonset', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteStatefulSet(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-statefulset', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteReplicaSet(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-replicaset', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteJob(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-job', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteCronJob(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-cronjob', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteNamespace(contextId: string, name: string) {
    return this.send('k7s:delete-namespace', { contextId, name }) as Promise<unknown>
  }

  async scaleDeployment(contextId: string, namespace: string, name: string, replicas: number) {
    return this.send('k7s:scale-deployment', { contextId, namespace, name, replicas }) as Promise<unknown>
  }

  async scaleStatefulSet(contextId: string, namespace: string, name: string, replicas: number) {
    return this.send('k7s:scale-statefulset', { contextId, namespace, name, replicas }) as Promise<unknown>
  }

  async scaleReplicaSet(contextId: string, namespace: string, name: string, replicas: number) {
    return this.send('k7s:scale-replicaset', { contextId, namespace, name, replicas }) as Promise<unknown>
  }

  async getPodLogs(contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number) {
    return this.send('k7s:get-pod-logs', { contextId, namespace, podName, containerName, tailLines }) as Promise<string>
  }

  async getClusterHealth(contextId: string) {
    return this.send('k7s:get-cluster-health', { contextId }) as Promise<unknown>
  }

  async createNamespace(contextId: string, name: string) {
    return this.send('k7s:create-namespace', { contextId, name }) as Promise<unknown>
  }

  async createDeployment(contextId: string, data: unknown) {
    return this.send('k7s:create-deployment', { contextId, formData: data }) as Promise<unknown>
  }

  async createService(contextId: string, data: unknown) {
    return this.send('k7s:create-service', { contextId, formData: data }) as Promise<unknown>
  }

  async createConfigMap(contextId: string, data: unknown) {
    return this.send('k7s:create-configmap', { contextId, formData: data }) as Promise<unknown>
  }

  async createSecret(contextId: string, data: unknown) {
    return this.send('k7s:create-secret', { contextId, formData: data }) as Promise<unknown>
  }

  async createIngress(contextId: string, data: unknown) {
    return this.send('k7s:create-ingress', { contextId, formData: data }) as Promise<unknown>
  }

  async updateDeployment(contextId: string, namespace: string, name: string, data: unknown) {
    return this.send('k7s:update-deployment', { contextId, namespace, name, formData: data }) as Promise<unknown>
  }

  async deleteResource(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:delete-resource', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async scaleWorkload(contextId: string, kind: string, namespace: string, name: string, replicas: number) {
    return this.send('k7s:scale-workload', { contextId, kind, namespace, name, replicas }) as Promise<unknown>
  }

  async restartWorkload(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:restart-workload', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async rollbackWorkload(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:rollback-workload', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async applyYaml(contextId: string, yaml: string) {
    return this.send('k7s:apply-yaml', { contextId, yaml }) as Promise<unknown>
  }

  async getResourceYaml(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:get-resource-yaml', { contextId, kind, namespace, name }) as Promise<string>
  }

  async addKubeconfigFile() {
    // In web mode, this will return a message to use desktop app
    return this.send('k7s:add-kubeconfig') as Promise<unknown>
  }

  async listPersistentVolumes(contextId: string) {
    return this.send('k7s:list-persistentvolumes', { contextId }) as Promise<unknown[]>
  }

  async listPersistentVolumeClaims(contextId: string, namespace?: string) {
    return this.send('k7s:list-persistentvolumeclaims', { contextId, namespace }) as Promise<unknown[]>
  }

  async listStorageClasses(contextId: string) {
    return this.send('k7s:list-storageclasses', { contextId }) as Promise<unknown[]>
  }

  async listServiceAccounts(contextId: string, namespace?: string) {
    return this.send('k7s:list-serviceaccounts', { contextId, namespace }) as Promise<unknown[]>
  }

  async listRoles(contextId: string, namespace?: string) {
    return this.send('k7s:list-roles', { contextId, namespace }) as Promise<unknown[]>
  }

  async listRoleBindings(contextId: string, namespace?: string) {
    return this.send('k7s:list-rolebindings', { contextId, namespace }) as Promise<unknown[]>
  }

  async listClusterRoles(contextId: string) {
    return this.send('k7s:list-clusterroles', { contextId }) as Promise<unknown[]>
  }

  async listClusterRoleBindings(contextId: string) {
    return this.send('k7s:list-clusterrolebindings', { contextId }) as Promise<unknown[]>
  }

  async listHPAs(contextId: string, namespace?: string) {
    return this.send('k7s:list-horizontalpodautoscalers', { contextId, namespace }) as Promise<unknown[]>
  }

  async listEvents(contextId: string, namespace?: string) {
    return this.send('k7s:list-events', { contextId, namespace }) as Promise<unknown[]>
  }

  async subscribeWatch(contextId: string) {
    return this.send('k7s:subscribe-watch', { contextId }) as Promise<unknown>
  }

  async unsubscribeWatch() {
    return this.send('k7s:unsubscribe-watch') as Promise<unknown>
  }
}

export const wsClient = new WebSocketClient()
export default wsClient
