export type ContextRecord = {
  id: string
  name: string
  cluster: string
  user: string
  source: string
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
