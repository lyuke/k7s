import { contextBridge, ipcRenderer } from 'electron'
import type {
  AddContextsResult,
  ClusterHealth,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapFormData,
  ConfigMapInfo,
  ContextRecord,
  CronJobInfo,
  CreateResult,
  DaemonSetInfo,
  DeleteResult,
  DeploymentFormData,
  DeploymentInfo,
  EventInfo,
  HPAInfo,
  IngressFormData,
  IngressInfo,
  JobInfo,
  K7sPushEvent,
  KubernetesResourceKind,
  NamespaceInfo,
  NodeInfo,
  NodeMetrics,
  PodExecData,
  PodExecResult,
  PodLogStreamRequest,
  PodLogStreamResult,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PodInfo,
  ReplicaSetInfo,
  RolloutResult,
  RolloutWorkloadKind,
  RoleBindingInfo,
  RoleInfo,
  PortForwardRequest,
  PortForwardResult,
  ScaleResult,
  ScaleableWorkloadKind,
  SecretFormData,
  SecretInfo,
  ServiceAccountInfo,
  ServiceFormData,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
  UpdateResult,
  ContextPrefs,
  ContextGroup
} from '../shared/types'

contextBridge.exposeInMainWorld('k7s', {
  listContexts: (): Promise<ContextRecord[]> => ipcRenderer.invoke('k7s:list-contexts'),
  listNamespaces: (contextId: string): Promise<NamespaceInfo[]> =>
    ipcRenderer.invoke('k7s:list-namespaces', contextId),
  listNodes: (contextId: string): Promise<NodeInfo[]> =>
    ipcRenderer.invoke('k7s:list-nodes', contextId),
  getNodeDetail: (contextId: string, nodeName: string): Promise<NodeInfo> =>
    ipcRenderer.invoke('k7s:get-node-detail', contextId, nodeName),
  getNodeMetrics: (contextId: string, nodeName: string): Promise<NodeMetrics | null> =>
    ipcRenderer.invoke('k7s:get-node-metrics', contextId, nodeName),
  listPods: (contextId: string, namespace?: string): Promise<PodInfo[]> =>
    ipcRenderer.invoke('k7s:list-pods', contextId, namespace),
  getPodDetail: (contextId: string, namespace: string, podName: string): Promise<PodInfo> =>
    ipcRenderer.invoke('k7s:get-pod-detail', contextId, namespace, podName),
  listDeployments: (contextId: string, namespace?: string): Promise<DeploymentInfo[]> =>
    ipcRenderer.invoke('k7s:list-deployments', contextId, namespace),
  getDeploymentDetail: (contextId: string, namespace: string, name: string): Promise<DeploymentInfo> =>
    ipcRenderer.invoke('k7s:get-deployment-detail', contextId, namespace, name),
  listDaemonSets: (contextId: string, namespace?: string): Promise<DaemonSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-daemonsets', contextId, namespace),
  getDaemonSetDetail: (contextId: string, namespace: string, name: string): Promise<DaemonSetInfo> =>
    ipcRenderer.invoke('k7s:get-daemonset-detail', contextId, namespace, name),
  listStatefulSets: (contextId: string, namespace?: string): Promise<StatefulSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-statefulsets', contextId, namespace),
  getStatefulSetDetail: (contextId: string, namespace: string, name: string): Promise<StatefulSetInfo> =>
    ipcRenderer.invoke('k7s:get-statefulset-detail', contextId, namespace, name),
  listReplicaSets: (contextId: string, namespace?: string): Promise<ReplicaSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-replicasets', contextId, namespace),
  getReplicaSetDetail: (contextId: string, namespace: string, name: string): Promise<ReplicaSetInfo> =>
    ipcRenderer.invoke('k7s:get-replicaset-detail', contextId, namespace, name),
  listJobs: (contextId: string, namespace?: string): Promise<JobInfo[]> =>
    ipcRenderer.invoke('k7s:list-jobs', contextId, namespace),
  getJobDetail: (contextId: string, namespace: string, name: string): Promise<JobInfo> =>
    ipcRenderer.invoke('k7s:get-job-detail', contextId, namespace, name),
  listCronJobs: (contextId: string, namespace?: string): Promise<CronJobInfo[]> =>
    ipcRenderer.invoke('k7s:list-cronjobs', contextId, namespace),
  getCronJobDetail: (contextId: string, namespace: string, name: string): Promise<CronJobInfo> =>
    ipcRenderer.invoke('k7s:get-cronjob-detail', contextId, namespace, name),
  addKubeconfigFile: (): Promise<AddContextsResult> =>
    ipcRenderer.invoke('k7s:add-kubeconfig')
  ,
  getContextPrefs: (): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:get-context-prefs'),
  updateContextName: (contextId: string, name: string): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:update-context-name', contextId, name),
  updateContextGrouping: (groups: ContextGroup[], ungrouped: string[]): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:update-context-grouping', { groups, ungrouped }),

  // Delete operations
  deletePod: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-pod', contextId, namespace, name),
  deleteDeployment: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-deployment', contextId, namespace, name),
  deleteDaemonSet: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-daemonset', contextId, namespace, name),
  deleteStatefulSet: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-statefulset', contextId, namespace, name),
  deleteReplicaSet: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-replicaset', contextId, namespace, name),
  deleteJob: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-job', contextId, namespace, name),
  deleteCronJob: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-cronjob', contextId, namespace, name),
  deleteNamespace: (contextId: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-namespace', contextId, name),

  // Scale operations
  scaleDeployment: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-deployment', contextId, namespace, name, replicas),
  scaleStatefulSet: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-statefulset', contextId, namespace, name, replicas),
  scaleReplicaSet: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-replicaset', contextId, namespace, name, replicas),

  // Log operations
  getPodLogs: (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number): Promise<string> =>
    ipcRenderer.invoke('k7s:get-pod-logs', contextId, namespace, podName, containerName, tailLines),
  startPodLogStream: (contextId: string, request: PodLogStreamRequest): Promise<PodLogStreamResult> =>
    ipcRenderer.invoke('k7s:start-pod-log-stream', contextId, request),
  stopPodLogStream: (streamId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('k7s:stop-pod-log-stream', streamId),
  startPodExec: (contextId: string, request: PodExecData): Promise<PodExecResult> =>
    ipcRenderer.invoke('k7s:start-pod-exec', contextId, request),
  stopPodExec: (sessionId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('k7s:stop-pod-exec', sessionId),
  startPortForward: (contextId: string, request: PortForwardRequest): Promise<PortForwardResult> =>
    ipcRenderer.invoke('k7s:start-port-forward', contextId, request),
  stopPortForward: (sessionId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('k7s:stop-port-forward', sessionId),

  // Cluster health
  getClusterHealth: (contextId: string): Promise<ClusterHealth> =>
    ipcRenderer.invoke('k7s:get-cluster-health', contextId),

  // List new resource types
  listServices: (contextId: string, namespace?: string): Promise<ServiceInfo[]> =>
    ipcRenderer.invoke('k7s:list-services', contextId, namespace),
  listConfigMaps: (contextId: string, namespace?: string): Promise<ConfigMapInfo[]> =>
    ipcRenderer.invoke('k7s:list-configmaps', contextId, namespace),
  listSecrets: (contextId: string, namespace?: string): Promise<SecretInfo[]> =>
    ipcRenderer.invoke('k7s:list-secrets', contextId, namespace),
  listIngresses: (contextId: string, namespace?: string): Promise<IngressInfo[]> =>
    ipcRenderer.invoke('k7s:list-ingresses', contextId, namespace),
  listPersistentVolumes: (contextId: string): Promise<PersistentVolumeInfo[]> =>
    ipcRenderer.invoke('k7s:list-persistentvolumes', contextId),
  listPersistentVolumeClaims: (contextId: string, namespace?: string): Promise<PersistentVolumeClaimInfo[]> =>
    ipcRenderer.invoke('k7s:list-persistentvolumeclaims', contextId, namespace),
  listStorageClasses: (contextId: string): Promise<StorageClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-storageclasses', contextId),
  listServiceAccounts: (contextId: string, namespace?: string): Promise<ServiceAccountInfo[]> =>
    ipcRenderer.invoke('k7s:list-serviceaccounts', contextId, namespace),
  listRoles: (contextId: string, namespace?: string): Promise<RoleInfo[]> =>
    ipcRenderer.invoke('k7s:list-roles', contextId, namespace),
  listRoleBindings: (contextId: string, namespace?: string): Promise<RoleBindingInfo[]> =>
    ipcRenderer.invoke('k7s:list-rolebindings', contextId, namespace),
  listClusterRoles: (contextId: string): Promise<ClusterRoleInfo[]> =>
    ipcRenderer.invoke('k7s:list-clusterroles', contextId),
  listClusterRoleBindings: (contextId: string): Promise<ClusterRoleBindingInfo[]> =>
    ipcRenderer.invoke('k7s:list-clusterrolebindings', contextId),
  listHPAs: (contextId: string, namespace?: string): Promise<HPAInfo[]> =>
    ipcRenderer.invoke('k7s:list-horizontalpodautoscalers', contextId, namespace),
  listEvents: (contextId: string, namespace?: string): Promise<EventInfo[]> =>
    ipcRenderer.invoke('k7s:list-events', contextId, namespace),

  // Create operations
  createNamespace: (contextId: string, name: string): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-namespace', contextId, name),
  createDeployment: (contextId: string, data: DeploymentFormData): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-deployment', contextId, data),
  createService: (contextId: string, data: ServiceFormData): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-service', contextId, data),
  createConfigMap: (contextId: string, data: ConfigMapFormData): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-configmap', contextId, data),
  createSecret: (contextId: string, data: SecretFormData): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-secret', contextId, data),
  createIngress: (contextId: string, data: IngressFormData): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:create-ingress', contextId, data),

  // Update operations
  updateDeployment: (contextId: string, namespace: string, name: string, data: Partial<DeploymentFormData>): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:update-deployment', contextId, namespace, name, data),
  deleteResource: (contextId: string, kind: KubernetesResourceKind, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-resource', contextId, kind, namespace, name),
  scaleWorkload: (contextId: string, kind: ScaleableWorkloadKind, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-workload', contextId, kind, namespace, name, replicas),
  restartWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:restart-workload', contextId, kind, namespace, name),
  rollbackWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:rollback-workload', contextId, kind, namespace, name),

  // YAML operations
  applyYaml: (contextId: string, yaml: string): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:apply-yaml', contextId, yaml),
  getResourceYaml: (contextId: string, kind: string, namespace: string, name: string): Promise<string> =>
    ipcRenderer.invoke('k7s:get-resource-yaml', contextId, kind, namespace, name),

  // Watch / push events
  subscribeWatch: (contextId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('k7s:subscribe-watch', contextId),
  unsubscribeWatch: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('k7s:unsubscribe-watch'),
  onPushEvent: (callback: (event: K7sPushEvent) => void): void => {
    ipcRenderer.removeAllListeners('k7s:push-event')
    ipcRenderer.on('k7s:push-event', (_event, event) => callback(event as K7sPushEvent))
  }
})

contextBridge.exposeInMainWorld('k8sTerm', {
  create: (contextId: string): Promise<{ shell: string; cwd: string }> =>
    ipcRenderer.invoke('terminal:create', contextId),
  write: (data: string): void => {
    ipcRenderer.invoke('terminal:write', data)
  },
  resize: (cols: number, rows: number): void => {
    ipcRenderer.invoke('terminal:resize', cols, rows)
  },
  destroy: (): void => {
    ipcRenderer.invoke('terminal:destroy')
  },
  onData: (callback: (data: string) => void): void => {
    ipcRenderer.removeAllListeners('terminal:data')
    ipcRenderer.on('terminal:data', (_event, data) => callback(data))
  },
  onExit: (callback: (exitCode: number) => void): void => {
    ipcRenderer.removeAllListeners('terminal:exit')
    ipcRenderer.on('terminal:exit', (_event, exitCode) => callback(exitCode))
  }
})
