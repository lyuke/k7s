// WebSocket-based API client for web mode
// This provides the same interface as window.k7s but uses WebSocket instead of IPC

import type { AppThemeName, HelmReleaseUpgradeRequest } from '../../../shared/types'

type RequestId = string
type Handler = (result: unknown) => void
type PendingRequest = {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

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

const unrefTimer = <T extends ReturnType<typeof setTimeout>>(timerId: T): T => {
  const unref = (timerId as { unref?: () => void }).unref
  unref?.call(timerId)
  return timerId
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private pendingRequests = new Map<RequestId, PendingRequest>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageId = 0
  private wsUrl: string
  private eventHandlers = new Map<string, Set<Handler>>()
  private connectionPromise: Promise<void> | null = null
  private intentionalClose = false
  private connectionTimeoutMs = 10000
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null

  constructor() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host || 'localhost:3000'
    this.wsUrl = `${protocol}//${host}/ws`
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.intentionalClose = false
    this.connectionPromise = new Promise((resolve, reject) => {
      let settled = false
      let opened = false

      const clearConnectionTimeout = () => {
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId)
          this.connectionTimeoutId = null
        }
      }

      const resolveConnection = () => {
        if (settled) return
        settled = true
        clearConnectionTimeout()
        this.connectionPromise = null
        resolve()
      }

      const rejectConnection = (error: Error) => {
        if (settled) return
        settled = true
        clearConnectionTimeout()
        this.connectionPromise = null
        reject(error)
      }

      try {
        this.ws = new WebSocket(this.wsUrl)
        this.connectionTimeoutId = unrefTimer(setTimeout(() => {
          rejectConnection(new Error('WebSocket connection timeout'))
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close()
          }
        }, this.connectionTimeoutMs))

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          opened = true
          this.reconnectAttempts = 0
          resolveConnection()
        }

        this.ws.onmessage = (event) => {
          try {
            const response: WsResponse = JSON.parse(event.data)
            if (response.event) {
              const handlers = this.eventHandlers.get(response.event)
              handlers?.forEach((handler) => handler(response.data))
              return
            }

            const pendingRequest = this.pendingRequests.get(response.id)
            if (pendingRequest) {
              if (pendingRequest.timeoutId) {
                clearTimeout(pendingRequest.timeoutId)
              }
              if (response.error) {
                pendingRequest.reject(new Error(response.error))
              } else {
                pendingRequest.resolve(response.result)
              }
              this.pendingRequests.delete(response.id)
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.ws = null
          rejectConnection(new Error('WebSocket disconnected'))
          this.rejectPendingRequests(new Error('WebSocket disconnected'))
          if (!this.intentionalClose && opened) {
            this.attemptReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          const message = error instanceof Error ? error.message : 'WebSocket connection failed'
          rejectConnection(new Error(message))
        }
      } catch (error) {
        rejectConnection(error instanceof Error ? error : new Error(String(error)))
      }
    })

    return this.connectionPromise
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId)
    }

    this.reconnectTimerId = unrefTimer(setTimeout(() => {
      this.reconnectTimerId = null
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect().catch(() => {
        // Reconnect failed, will try again or give up
      })
    }, delay))
  }

  private rejectPendingRequests(error: Error) {
    this.pendingRequests.forEach((pendingRequest) => {
      if (pendingRequest.timeoutId) {
        clearTimeout(pendingRequest.timeoutId)
      }
      pendingRequest.reject(error)
    })
    this.pendingRequests.clear()
  }

  private async send(method: string, data?: unknown): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const id = `msg_${++this.messageId}`
      const message: WsMessage = { id, method, data }
      const pendingRequest: PendingRequest = {
        resolve,
        reject,
      }
      this.pendingRequests.set(id, pendingRequest)

      pendingRequest.timeoutId = unrefTimer(setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000))

      if (!this.pendingRequests.has(id)) {
        return
      }

      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        if (pendingRequest.timeoutId) {
          clearTimeout(pendingRequest.timeoutId)
        }
        this.pendingRequests.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  disconnect() {
    this.intentionalClose = true
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId)
      this.reconnectTimerId = null
    }
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId)
      this.connectionTimeoutId = null
    }
    this.rejectPendingRequests(new Error('WebSocket disconnected'))
    this.connectionPromise = null
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
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

  async useKubeContext(contextId: string) {
    return this.send('k7s:use-kube-context', { contextId }) as Promise<unknown[]>
  }

  async setKubeContextNamespace(contextId: string, namespace: string) {
    return this.send('k7s:set-kube-context-namespace', { contextId, namespace }) as Promise<unknown[]>
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

  async updateAppTheme(theme: AppThemeName) {
    return this.send('k7s:update-app-theme', { theme }) as Promise<unknown>
  }

  async listNamespaces(contextId: string) {
    return this.send('k7s:list-namespaces', { contextId }) as Promise<unknown[]>
  }

  async listComponentStatuses(contextId: string) {
    return this.send('k7s:list-componentstatuses', { contextId }) as Promise<unknown[]>
  }

  async listAPIGroups(contextId: string) {
    return this.send('k7s:list-apigroups', { contextId }) as Promise<unknown[]>
  }

  async listAPIResources(contextId: string) {
    return this.send('k7s:list-apiresources', { contextId }) as Promise<unknown[]>
  }

  async listServerVersions(contextId: string) {
    return this.send('k7s:list-serverversions', { contextId }) as Promise<unknown[]>
  }

  async listOpenIDConfigurations(contextId: string) {
    return this.send('k7s:list-openidconfigs', { contextId }) as Promise<unknown[]>
  }

  async listAPIServerHealth(contextId: string) {
    return this.send('k7s:list-apiserverhealth', { contextId }) as Promise<unknown[]>
  }

  async listSelfSubjectReviews(contextId: string) {
    return this.send('k7s:list-selfsubjectreviews', { contextId }) as Promise<unknown[]>
  }

  async listSelfSubjectAccessReviews(contextId: string, namespaces?: string | string[]) {
    return this.send('k7s:list-selfsubjectaccessreviews', { contextId, namespaces }) as Promise<unknown[]>
  }

  async checkCanI(contextId: string, request: unknown) {
    return this.send('k7s:check-can-i', { contextId, request }) as Promise<unknown>
  }

  async listSelfSubjectRulesReviews(contextId: string, namespaces?: string | string[]) {
    return this.send('k7s:list-selfsubjectrulesreviews', { contextId, namespaces }) as Promise<unknown[]>
  }

  async listNodes(contextId: string) {
    return this.send('k7s:list-nodes', { contextId }) as Promise<unknown[]>
  }

  async getNodeDetail(contextId: string, nodeName: string) {
    return this.send('k7s:get-node-detail', { contextId, nodeName }) as Promise<unknown>
  }

  async getNodeMetrics(contextId: string, nodeName: string) {
    return this.send('k7s:get-node-metrics', { contextId, nodeName }) as Promise<unknown>
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

  async listReplicationControllers(contextId: string, namespace?: string) {
    return this.send('k7s:list-replicationcontrollers', { contextId, namespace }) as Promise<unknown[]>
  }

  async getReplicationControllerDetail(contextId: string, namespace: string, name: string) {
    return this.send('k7s:get-replicationcontroller-detail', { contextId, namespace, name }) as Promise<unknown>
  }

  async listControllerRevisions(contextId: string, namespace?: string) {
    return this.send('k7s:list-controllerrevisions', { contextId, namespace }) as Promise<unknown[]>
  }

  async listPodTemplates(contextId: string, namespace?: string) {
    return this.send('k7s:list-podtemplates', { contextId, namespace }) as Promise<unknown[]>
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

  async listEndpoints(contextId: string, namespace?: string) {
    return this.send('k7s:list-endpoints', { contextId, namespace }) as Promise<unknown[]>
  }

  async listIngresses(contextId: string, namespace?: string) {
    return this.send('k7s:list-ingresses', { contextId, namespace }) as Promise<unknown[]>
  }

  async listIngressClasses(contextId: string) {
    return this.send('k7s:list-ingressclasses', { contextId }) as Promise<unknown[]>
  }

  async listHelmReleases(contextId: string, namespace?: string) {
    return this.send('k7s:list-helmreleases', { contextId, namespace }) as Promise<unknown[]>
  }

  async listHelmCharts(contextId: string) {
    return this.send('k7s:list-helmcharts', { contextId }) as Promise<unknown[]>
  }

  async listHelmRepositories(contextId: string) {
    return this.send('k7s:list-helmrepositories', { contextId }) as Promise<unknown[]>
  }

  async listNetworkPolicies(contextId: string, namespace?: string) {
    return this.send('k7s:list-networkpolicies', { contextId, namespace }) as Promise<unknown[]>
  }

  async listIPAddresses(contextId: string) {
    return this.send('k7s:list-ipaddresses', { contextId }) as Promise<unknown[]>
  }

  async listServiceCIDRs(contextId: string) {
    return this.send('k7s:list-servicecidrs', { contextId }) as Promise<unknown[]>
  }

  async listEndpointSlices(contextId: string, namespace?: string) {
    return this.send('k7s:list-endpointslices', { contextId, namespace }) as Promise<unknown[]>
  }

  async listAPIServices(contextId: string) {
    return this.send('k7s:list-apiservices', { contextId }) as Promise<unknown[]>
  }

  async listMutatingWebhookConfigurations(contextId: string) {
    return this.send('k7s:list-mutatingwebhookconfigurations', { contextId }) as Promise<unknown[]>
  }

  async listValidatingWebhookConfigurations(contextId: string) {
    return this.send('k7s:list-validatingwebhookconfigurations', { contextId }) as Promise<unknown[]>
  }

  async listMutatingAdmissionPolicies(contextId: string) {
    return this.send('k7s:list-mutatingadmissionpolicies', { contextId }) as Promise<unknown[]>
  }

  async listMutatingAdmissionPolicyBindings(contextId: string) {
    return this.send('k7s:list-mutatingadmissionpolicybindings', { contextId }) as Promise<unknown[]>
  }

  async listValidatingAdmissionPolicies(contextId: string) {
    return this.send('k7s:list-validatingadmissionpolicies', { contextId }) as Promise<unknown[]>
  }

  async listValidatingAdmissionPolicyBindings(contextId: string) {
    return this.send('k7s:list-validatingadmissionpolicybindings', { contextId }) as Promise<unknown[]>
  }

  async listFlowSchemas(contextId: string) {
    return this.send('k7s:list-flowschemas', { contextId }) as Promise<unknown[]>
  }

  async listPriorityLevelConfigurations(contextId: string) {
    return this.send('k7s:list-prioritylevelconfigurations', { contextId }) as Promise<unknown[]>
  }

  async listCertificateSigningRequests(contextId: string) {
    return this.send('k7s:list-certificatesigningrequests', { contextId }) as Promise<unknown[]>
  }

  async updateCertificateSigningRequestApproval(contextId: string, name: string, decision: string) {
    return this.send('k7s:update-certificate-signing-request-approval', { contextId, name, decision })
  }

  async listClusterTrustBundles(contextId: string) {
    return this.send('k7s:list-clustertrustbundles', { contextId }) as Promise<unknown[]>
  }

  async listPodCertificateRequests(contextId: string, namespace?: string) {
    return this.send('k7s:list-podcertificaterequests', { contextId, namespace }) as Promise<unknown[]>
  }

  async listStorageVersions(contextId: string) {
    return this.send('k7s:list-storageversions', { contextId }) as Promise<unknown[]>
  }

  async listStorageVersionMigrations(contextId: string) {
    return this.send('k7s:list-storageversionmigrations', { contextId }) as Promise<unknown[]>
  }

  async listPodDisruptionBudgets(contextId: string, namespace?: string) {
    return this.send('k7s:list-poddisruptionbudgets', { contextId, namespace }) as Promise<unknown[]>
  }

  async listResourceQuotas(contextId: string, namespace?: string) {
    return this.send('k7s:list-resourcequotas', { contextId, namespace }) as Promise<unknown[]>
  }

  async listLimitRanges(contextId: string, namespace?: string) {
    return this.send('k7s:list-limitranges', { contextId, namespace }) as Promise<unknown[]>
  }

  async listLeases(contextId: string, namespace?: string) {
    return this.send('k7s:list-leases', { contextId, namespace }) as Promise<unknown[]>
  }

  async listLeaseCandidates(contextId: string, namespace?: string) {
    return this.send('k7s:list-leasecandidates', { contextId, namespace }) as Promise<unknown[]>
  }

  async listPriorityClasses(contextId: string) {
    return this.send('k7s:list-priorityclasses', { contextId }) as Promise<unknown[]>
  }

  async listRuntimeClasses(contextId: string) {
    return this.send('k7s:list-runtimeclasses', { contextId }) as Promise<unknown[]>
  }

  async deletePod(contextId: string, namespace: string, name: string) {
    return this.send('k7s:delete-pod', { contextId, namespace, name }) as Promise<unknown>
  }

  async evictPod(contextId: string, namespace: string, name: string) {
    return this.send('k7s:evict-pod', { contextId, namespace, name }) as Promise<unknown>
  }

  async forceDeletePod(contextId: string, namespace: string, name: string) {
    return this.send('k7s:force-delete-pod', { contextId, namespace, name }) as Promise<unknown>
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

  async triggerCronJob(contextId: string, namespace: string, name: string) {
    return this.send('k7s:trigger-cronjob', { contextId, namespace, name }) as Promise<unknown>
  }

  async deleteNamespace(contextId: string, name: string) {
    return this.send('k7s:delete-namespace', { contextId, name }) as Promise<unknown>
  }

  async cordonNode(contextId: string, name: string) {
    return this.send('k7s:cordon-node', { contextId, name }) as Promise<unknown>
  }

  async uncordonNode(contextId: string, name: string) {
    return this.send('k7s:uncordon-node', { contextId, name }) as Promise<unknown>
  }

  async drainNode(contextId: string, name: string) {
    return this.send('k7s:drain-node', { contextId, name }) as Promise<unknown>
  }

  async deleteNode(contextId: string, name: string) {
    return this.send('k7s:delete-node', { contextId, name }) as Promise<unknown>
  }

  async deleteCustomResourceDefinition(contextId: string, name: string) {
    return this.send('k7s:delete-customresourcedefinition', { contextId, name }) as Promise<unknown>
  }

  async deleteCustomResourceInstance(contextId: string, crdName: string, namespace: string, name: string) {
    return this.send('k7s:delete-customresource-instance', {
      contextId,
      crdName,
      namespace,
      name,
    }) as Promise<unknown>
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

  async getPodLogs(contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number, previous?: boolean, timestamps?: boolean) {
    return this.send('k7s:get-pod-logs', {
      contextId,
      namespace,
      podName,
      containerName,
      tailLines,
      ...(previous === undefined ? {} : { previous }),
      ...(timestamps === undefined ? {} : { timestamps }),
    }) as Promise<string>
  }

  async startPodLogStream(contextId: string, request: unknown) {
    return this.send('k7s:start-pod-log-stream', { contextId, request }) as Promise<unknown>
  }

  async stopPodLogStream(streamId: string) {
    return this.send('k7s:stop-pod-log-stream', { streamId }) as Promise<unknown>
  }

  async startPodExec(contextId: string, request: unknown) {
    return this.send('k7s:start-pod-exec', { contextId, request }) as Promise<unknown>
  }

  async stopPodExec(sessionId: string) {
    return this.send('k7s:stop-pod-exec', { sessionId }) as Promise<unknown>
  }

  async startPortForward(contextId: string, request: unknown) {
    return this.send('k7s:start-port-forward', { contextId, request }) as Promise<unknown>
  }

  async listPortForwards() {
    return this.send('k7s:list-port-forwards') as Promise<unknown[]>
  }

  async stopPortForward(sessionId: string) {
    return this.send('k7s:stop-port-forward', { sessionId }) as Promise<unknown>
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

  async setWorkloadImage(contextId: string, kind: string, namespace: string, name: string, containerName: string, image: string) {
    return this.send('k7s:set-workload-image', { contextId, kind, namespace, name, containerName, image }) as Promise<unknown>
  }

  async installOrUpgradeHelmRelease(contextId: string, request: HelmReleaseUpgradeRequest) {
    return this.send('k7s:install-or-upgrade-helm-release', { contextId, request }) as Promise<unknown>
  }

  async addHelmRepository(contextId: string, name: string, url: string) {
    return this.send('k7s:add-helm-repository', { contextId, name, url }) as Promise<unknown>
  }

  async updateHelmRepository(contextId: string, name?: string) {
    return this.send('k7s:update-helm-repository', { contextId, ...(name === undefined ? {} : { name }) }) as Promise<unknown>
  }

  async removeHelmRepository(contextId: string, name: string) {
    return this.send('k7s:remove-helm-repository', { contextId, name }) as Promise<unknown>
  }

  async rollbackWorkload(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:rollback-workload', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async rollbackHelmRelease(contextId: string, namespace: string, name: string, revision?: number) {
    return this.send('k7s:rollback-helm-release', {
      contextId,
      namespace,
      name,
      ...(revision === undefined ? {} : { revision }),
    }) as Promise<unknown>
  }

  async rolloutHistory(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:rollout-history', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async helmReleaseHistory(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-history', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseStatus(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-status', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseResources(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-resources', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseManifest(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-manifest', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseMetadata(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-metadata', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseValues(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-values', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseNotes(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-notes', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseHooks(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-hooks', { contextId, namespace, name }) as Promise<unknown>
  }

  async helmReleaseAll(contextId: string, namespace: string, name: string) {
    return this.send('k7s:helm-release-all', { contextId, namespace, name }) as Promise<unknown>
  }

  async rolloutStatus(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:rollout-status', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async testHelmRelease(contextId: string, namespace: string, name: string) {
    return this.send('k7s:test-helm-release', { contextId, namespace, name }) as Promise<unknown>
  }

  async uninstallHelmRelease(contextId: string, namespace: string, name: string) {
    return this.send('k7s:uninstall-helm-release', { contextId, namespace, name }) as Promise<unknown>
  }

  async pauseWorkload(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:pause-workload', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async resumeWorkload(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:resume-workload', { contextId, kind, namespace, name }) as Promise<unknown>
  }

  async updateJobSuspension(contextId: string, kind: string, namespace: string, name: string, suspend: boolean) {
    return this.send('k7s:update-job-suspension', { contextId, kind, namespace, name, suspend }) as Promise<unknown>
  }

  async applyYaml(contextId: string, yaml: string) {
    return this.send('k7s:apply-yaml', { contextId, yaml }) as Promise<unknown>
  }

  async diffYaml(contextId: string, yaml: string) {
    return this.send('k7s:diff-yaml', { contextId, yaml }) as Promise<string>
  }

  async getResourceYaml(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:get-resource-yaml', { contextId, kind, namespace, name }) as Promise<string>
  }

  async describeResource(contextId: string, kind: string, namespace: string, name: string) {
    return this.send('k7s:describe-resource', { contextId, kind, namespace, name }) as Promise<string>
  }

  async mutateResourceMetadata(
    contextId: string,
    kind: string,
    namespace: string,
    name: string,
    field: string,
    key: string,
    value: string,
    remove: boolean,
  ) {
    return this.send('k7s:mutate-resource-metadata', {
      contextId,
      kind,
      namespace,
      name,
      field,
      key,
      value,
      remove,
    }) as Promise<unknown>
  }

  async getCustomResourceInstanceYaml(contextId: string, crdName: string, namespace: string, name: string) {
    return this.send('k7s:get-customresource-instance-yaml', {
      contextId,
      crdName,
      namespace,
      name,
    }) as Promise<string>
  }

  async addKubeconfigFile(sourceName?: string, content?: string) {
    return this.send(
      'k7s:add-kubeconfig',
      typeof content === 'string' ? { sourceName, content } : undefined,
    ) as Promise<unknown>
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

  async listVolumeAttributesClasses(contextId: string) {
    return this.send('k7s:list-volumeattributesclasses', { contextId }) as Promise<unknown[]>
  }

  async listCSIDrivers(contextId: string) {
    return this.send('k7s:list-csidrivers', { contextId }) as Promise<unknown[]>
  }

  async listCSINodes(contextId: string) {
    return this.send('k7s:list-csinodes', { contextId }) as Promise<unknown[]>
  }

  async listVolumeAttachments(contextId: string) {
    return this.send('k7s:list-volumeattachments', { contextId }) as Promise<unknown[]>
  }

  async listCSIStorageCapacities(contextId: string, namespace?: string) {
    return this.send('k7s:list-csistoragecapacities', { contextId, namespace }) as Promise<unknown[]>
  }

  async listVolumeSnapshotClasses(contextId: string) {
    return this.send('k7s:list-volumesnapshotclasses', { contextId }) as Promise<unknown[]>
  }

  async listVolumeSnapshots(contextId: string, namespace?: string) {
    return this.send('k7s:list-volumesnapshots', { contextId, namespace }) as Promise<unknown[]>
  }

  async listVolumeSnapshotContents(contextId: string) {
    return this.send('k7s:list-volumesnapshotcontents', { contextId }) as Promise<unknown[]>
  }

  async listGatewayClasses(contextId: string) {
    return this.send('k7s:list-gatewayclasses', { contextId }) as Promise<unknown[]>
  }

  async listGateways(contextId: string, namespace?: string) {
    return this.send('k7s:list-gateways', { contextId, namespace }) as Promise<unknown[]>
  }

  async listHTTPRoutes(contextId: string, namespace?: string) {
    return this.send('k7s:list-httproutes', { contextId, namespace }) as Promise<unknown[]>
  }

  async listGRPCRoutes(contextId: string, namespace?: string) {
    return this.send('k7s:list-grpcroutes', { contextId, namespace }) as Promise<unknown[]>
  }

  async listTLSRoutes(contextId: string, namespace?: string) {
    return this.send('k7s:list-tlsroutes', { contextId, namespace }) as Promise<unknown[]>
  }

  async listTCPRoutes(contextId: string, namespace?: string) {
    return this.send('k7s:list-tcproutes', { contextId, namespace }) as Promise<unknown[]>
  }

  async listUDPRoutes(contextId: string, namespace?: string) {
    return this.send('k7s:list-udproutes', { contextId, namespace }) as Promise<unknown[]>
  }

  async listReferenceGrants(contextId: string, namespace?: string) {
    return this.send('k7s:list-referencegrants', { contextId, namespace }) as Promise<unknown[]>
  }

  async listDeviceClasses(contextId: string) {
    return this.send('k7s:list-deviceclasses', { contextId }) as Promise<unknown[]>
  }

  async listResourceClaims(contextId: string, namespace?: string) {
    return this.send('k7s:list-resourceclaims', { contextId, namespace }) as Promise<unknown[]>
  }

  async listResourceClaimTemplates(contextId: string, namespace?: string) {
    return this.send('k7s:list-resourceclaimtemplates', { contextId, namespace }) as Promise<unknown[]>
  }

  async listResourceSlices(contextId: string) {
    return this.send('k7s:list-resourceslices', { contextId }) as Promise<unknown[]>
  }

  async listDeviceTaintRules(contextId: string) {
    return this.send('k7s:list-devicetaintrules', { contextId }) as Promise<unknown[]>
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

  async listCustomResourceDefinitions(contextId: string) {
    return this.send('k7s:list-customresourcedefinitions', { contextId }) as Promise<unknown[]>
  }

  async listCustomResourceInstances(contextId: string, crdName: string, namespace?: string) {
    return this.send('k7s:list-customresource-instances', { contextId, crdName, namespace }) as Promise<unknown[]>
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

  async createTerminal(contextId: string) {
    return this.send('terminal:create', { contextId }) as Promise<unknown>
  }

  async writeTerminal(value: string) {
    return this.send('terminal:write', { value }) as Promise<unknown>
  }

  async resizeTerminal(cols: number, rows: number) {
    return this.send('terminal:resize', { cols, rows }) as Promise<unknown>
  }

  async destroyTerminal() {
    return this.send('terminal:destroy') as Promise<unknown>
  }
}

export const wsClient = new WebSocketClient()
export default wsClient
