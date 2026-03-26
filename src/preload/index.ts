import { contextBridge, ipcRenderer } from 'electron'
import {
  AddContextsResult,
  ClusterHealth,
  ConfigMapFormData,
  ConfigMapInfo,
  ContextRecord,
  CronJobInfo,
  CreateResult,
  DaemonSetInfo,
  DeleteResult,
  DeploymentFormData,
  DeploymentInfo,
  IngressFormData,
  IngressInfo,
  JobInfo,
  NamespaceInfo,
  NodeInfo,
  PodInfo,
  ReplicaSetInfo,
  ScaleResult,
  SecretFormData,
  SecretInfo,
  ServiceFormData,
  ServiceInfo,
  StatefulSetInfo,
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

  // YAML operations
  applyYaml: (contextId: string, yaml: string): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:apply-yaml', contextId, yaml),
  getResourceYaml: (contextId: string, kind: string, namespace: string, name: string): Promise<string> =>
    ipcRenderer.invoke('k7s:get-resource-yaml', contextId, kind, namespace, name)
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
    ipcRenderer.on('terminal:data', (_event, data) => callback(data))
  },
  onExit: (callback: (exitCode: number) => void): void => {
    ipcRenderer.on('terminal:exit', (_event, exitCode) => callback(exitCode))
  }
})
