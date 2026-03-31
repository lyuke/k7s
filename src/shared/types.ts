export type ContextRecord = {
  id: string
  name: string
  cluster: string
  user: string
  source: string
}

export type ClusterHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export type ClusterHealth = {
  status: ClusterHealthStatus
  totalNodes: number
  readyNodes: number
  totalPods: number
  runningPods: number
  pendingPods: number
  failedPods: number
  lastUpdated: string
}

export type CreateResult = {
  success: boolean
  name?: string
  namespace?: string
  message?: string
}

export type UpdateResult = {
  success: boolean
  message?: string
}

export type NodeCondition = {
  type: string
  status: string
  reason?: string
  message?: string
  lastTransitionTime?: string
}

export type NodeTaint = {
  key: string
  value: string
  effect: string
}

export type NodeAddress = {
  type: string
  address: string
}

export type NodeCapacity = {
  cpu: string
  memory: string
  pods: string
  ephemeralStorage?: string
}

export type NodeInfo = {
  name: string
  status: string
  version: string
  roles: string
  age: string
  addresses?: NodeAddress[]
  os?: string
  architecture?: string
  kernelVersion?: string
  containerRuntime?: string
  capacity?: NodeCapacity
  labels?: Record<string, string>
  taints?: NodeTaint[]
  conditions?: NodeCondition[]
  podCIDR?: string
  providerID?: string
  unschedulable?: boolean
}

export type PodContainer = {
  name: string
  image: string
  restartCount: number
  ready: boolean
  state?: string
}

export type PodInfo = {
  name: string
  namespace: string
  status: string
  nodeName: string
  restarts: number
  age: string
  podIP?: string
  hostIP?: string
  startTime?: string
  labels?: Record<string, string>
  containers?: PodContainer[]
  initContainers?: PodContainer[]
  serviceAccount?: string
  priority?: string
  qosClass?: string
}

export type NamespaceInfo = {
  name: string
  status: string
  age: string
}

export type DeploymentInfo = {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  strategy?: string
  updatedReplicas?: number
  unavailableReplicas?: number
}

export type DaemonSetInfo = {
  name: string
  namespace: string
  desiredNumberScheduled: number
  currentNumberScheduled: number
  numberReady: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  updatedNumberScheduled?: number
  numberAvailable?: number
  numberUnavailable?: number
}

export type StatefulSetInfo = {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  serviceName?: string
  updateStrategy?: string
  currentReplicas?: number
  updatedReplicas?: number
}

export type ReplicaSetInfo = {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  fullyLabeledReplicas?: number
  availableReplicas?: number
}

export type JobInfo = {
  name: string
  namespace: string
  completions: number
  succeeded: number
  active: number
  failed: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  startTime?: string
  completionTime?: string
  duration?: string
  parallelism?: number
  backoffLimit?: number
}

export type CronJobInfo = {
  name: string
  namespace: string
  schedule: string
  suspend: boolean
  active: number
  lastSchedule: string
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  concurrencyPolicy?: string
  successfulJobsHistoryLimit?: number
  failedJobsHistoryLimit?: number
  startingDeadlineSeconds?: number
}

export type DeleteResult = {
  success: boolean
  message?: string
}

export type ServiceInfo = {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIP?: string
  ports: string
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
}

export type ConfigMapInfo = {
  name: string
  namespace: string
  age: string
  labels?: Record<string, string>
  data?: Record<string, string>
}

export type SecretInfo = {
  name: string
  namespace: string
  type: string
  age: string
  labels?: Record<string, string>
  data?: Record<string, string>
}

export type IngressInfo = {
  name: string
  namespace: string
  ingressClass?: string
  hosts: string
  address: string
  ports: string
  age: string
  labels?: Record<string, string>
}

export type PersistentVolumeInfo = {
  name: string
  capacity: string
  accessModes: string
  reclaimPolicy: string
  status: string
  storageClass: string
  age: string
}

export type PersistentVolumeClaimInfo = {
  name: string
  namespace: string
  status: string
  capacity: string
  accessModes: string
  storageClass: string
  age: string
}

export type StorageClassInfo = {
  name: string
  provisioner: string
  reclaimPolicy: string
  volumeBindingMode: string
  age: string
}

export type ServiceAccountInfo = {
  name: string
  namespace: string
  secrets: number
  age: string
}

export type RoleInfo = {
  name: string
  namespace: string
  rules: number
  age: string
}

export type RoleBindingInfo = {
  name: string
  namespace: string
  roleRef: string
  subjects: number
  age: string
}

export type ClusterRoleInfo = {
  name: string
  rules: number
  age: string
}

export type ClusterRoleBindingInfo = {
  name: string
  roleRef: string
  subjects: number
  age: string
}

export type HPAInfo = {
  name: string
  namespace: string
  reference: string
  minPods: number
  maxPods: number
  currentReplicas: number
  desiredReplicas: number
  age: string
}

export type EventInfo = {
  name: string
  namespace: string
  reason: string
  message: string
  type: string
  object: string
  count: number
  age: string
}

export type ScaleResult = {
  success: boolean
  replicas: number
  message?: string
}

export type AddContextsResult = {
  contexts: ContextRecord[]
  addedIds: string[]
}

export type ResourceType =
  | 'nodes'
  | 'pods'
  | 'deployments'
  | 'daemonsets'
  | 'statefulsets'
  | 'replicasets'
  | 'jobs'
  | 'cronjobs'
  | 'services'
  | 'configmaps'
  | 'secrets'
  | 'ingresses'
  | 'persistentvolumes'
  | 'persistentvolumeclaims'
  | 'storageclasses'
  | 'serviceaccounts'
  | 'roles'
  | 'rolebindings'
  | 'clusterroles'
  | 'clusterrolebindings'
  | 'horizontalpodautoscalers'
  | 'events'

export type ContextGroup = {
  id: string
  name: string
  items: string[]
}

export type ContextPrefs = {
  customNames: Record<string, string>
  groups: ContextGroup[]
  ungrouped: string[]
}

export interface K8sTermApi {
  create(contextId: string): Promise<{ shell: string; cwd: string }>
  write(data: string): void
  resize(cols: number, rows: number): void
  destroy(): void
  onData(callback: (data: string) => void): void
  onExit(callback: (exitCode: number) => void): void
}

// Form data types for CRUD operations
export type DeploymentFormData = {
  name: string
  namespace: string
  replicas: number
  image: string
  port: number
  targetPort: number
  protocol: string
  labels: Array<{ key: string; value: string }>
  env: Array<{ key: string; value: string }>
}

export type ServiceFormData = {
  name: string
  namespace: string
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  selector: Array<{ key: string; value: string }>
  port: number
  targetPort: number
  protocol: string
}

export type ConfigMapFormData = {
  name: string
  namespace: string
  data: Array<{ key: string; value: string }>
}

export type SecretFormData = {
  name: string
  namespace: string
  type: 'Opaque' | 'kubernetes.io/service-account-token' | 'kubernetes.io/dockercfg' | 'kubernetes.io/dockerconfigjson'
  data: Array<{ key: string; value: string }>
}

export type NamespaceFormData = {
  name: string
}

export type IngressFormData = {
  name: string
  namespace: string
  ingressClass?: string
  host: string
  serviceName: string
  servicePort: number
  tls: boolean
  tlsSecret?: string
}

export type PodExecData = {
  namespace: string
  podName: string
  containerName?: string
  command: string
}

declare global {
  interface Window {
    k8sTerm: K8sTermApi
  }
}
