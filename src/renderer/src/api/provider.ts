// API provider that works in both Electron and Web modes
// Detects the environment and uses the appropriate API

import {
  AddContextsResult,
  ClusterHealth,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapInfo,
  ConfigMapFormData,
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
  NamespaceInfo,
  NodeInfo,
  NodeMetrics,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PodInfo,
  ReplicaSetInfo,
  RoleBindingInfo,
  RoleInfo,
  ScaleResult,
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
} from '../../../shared/types'
import { wsClient } from './webSocketClient'

// Detect if we're in Electron mode
const isElectronMode = typeof window !== 'undefined' && 'k7s' in window

// Get the appropriate API
const electronApi = isElectronMode ? window.k7s : null

// WebSocket client type for web mode
interface WebSocketApi {
  listContexts: () => Promise<ContextRecord[]>
  listNamespaces: (contextId: string) => Promise<NamespaceInfo[]>
  listNodes: (contextId: string) => Promise<NodeInfo[]>
  getNodeDetail: (contextId: string, nodeName: string) => Promise<NodeInfo>
  getNodeMetrics: (contextId: string, nodeName: string) => Promise<NodeMetrics | null>
  listPods: (contextId: string, namespace?: string) => Promise<PodInfo[]>
  getPodDetail: (contextId: string, namespace: string, podName: string) => Promise<PodInfo>
  listDeployments: (contextId: string, namespace?: string) => Promise<DeploymentInfo[]>
  getDeploymentDetail: (contextId: string, namespace: string, name: string) => Promise<DeploymentInfo>
  listDaemonSets: (contextId: string, namespace?: string) => Promise<DaemonSetInfo[]>
  getDaemonSetDetail: (contextId: string, namespace: string, name: string) => Promise<DaemonSetInfo>
  listStatefulSets: (contextId: string, namespace?: string) => Promise<StatefulSetInfo[]>
  getStatefulSetDetail: (contextId: string, namespace: string, name: string) => Promise<StatefulSetInfo>
  listReplicaSets: (contextId: string, namespace?: string) => Promise<ReplicaSetInfo[]>
  getReplicaSetDetail: (contextId: string, namespace: string, name: string) => Promise<ReplicaSetInfo>
  listJobs: (contextId: string, namespace?: string) => Promise<JobInfo[]>
  getJobDetail: (contextId: string, namespace: string, name: string) => Promise<JobInfo>
  listCronJobs: (contextId: string, namespace?: string) => Promise<CronJobInfo[]>
  getCronJobDetail: (contextId: string, namespace: string, name: string) => Promise<CronJobInfo>
  listServices: (contextId: string, namespace?: string) => Promise<ServiceInfo[]>
  listConfigMaps: (contextId: string, namespace?: string) => Promise<ConfigMapInfo[]>
  listSecrets: (contextId: string, namespace?: string) => Promise<SecretInfo[]>
  listIngresses: (contextId: string, namespace?: string) => Promise<IngressInfo[]>
  listPersistentVolumes: (contextId: string) => Promise<PersistentVolumeInfo[]>
  listPersistentVolumeClaims: (contextId: string, namespace?: string) => Promise<PersistentVolumeClaimInfo[]>
  listStorageClasses: (contextId: string) => Promise<StorageClassInfo[]>
  listServiceAccounts: (contextId: string, namespace?: string) => Promise<ServiceAccountInfo[]>
  listRoles: (contextId: string, namespace?: string) => Promise<RoleInfo[]>
  listRoleBindings: (contextId: string, namespace?: string) => Promise<RoleBindingInfo[]>
  listClusterRoles: (contextId: string) => Promise<ClusterRoleInfo[]>
  listClusterRoleBindings: (contextId: string) => Promise<ClusterRoleBindingInfo[]>
  listHPAs: (contextId: string, namespace?: string) => Promise<HPAInfo[]>
  listEvents: (contextId: string, namespace?: string) => Promise<EventInfo[]>
  addKubeconfigFile: () => Promise<AddContextsResult>
  getContextPrefs: () => Promise<ContextPrefs>
  updateContextName: (contextId: string, name: string) => Promise<ContextPrefs>
  updateContextGrouping: (groups: ContextGroup[], ungrouped: string[]) => Promise<ContextPrefs>
  deletePod: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteDeployment: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteDaemonSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteStatefulSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteReplicaSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteJob: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteCronJob: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
  deleteNamespace: (contextId: string, name: string) => Promise<DeleteResult>
  scaleDeployment: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
  scaleStatefulSet: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
  scaleReplicaSet: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
  getPodLogs: (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number) => Promise<string>
  getClusterHealth: (contextId: string) => Promise<ClusterHealth>
  createNamespace: (contextId: string, name: string) => Promise<CreateResult>
  createDeployment: (contextId: string, data: DeploymentFormData) => Promise<CreateResult>
  createService: (contextId: string, data: ServiceFormData) => Promise<CreateResult>
  createConfigMap: (contextId: string, data: ConfigMapFormData) => Promise<CreateResult>
  createSecret: (contextId: string, data: SecretFormData) => Promise<CreateResult>
  createIngress: (contextId: string, data: IngressFormData) => Promise<CreateResult>
  updateDeployment: (contextId: string, namespace: string, name: string, data: Partial<DeploymentFormData>) => Promise<UpdateResult>
  applyYaml: (contextId: string, yaml: string) => Promise<CreateResult>
  getResourceYaml: (contextId: string, kind: string, namespace: string, name: string) => Promise<string>
}

export type { WebSocketApi }

// The API interface exposed to the app
export const k8sApi: WebSocketApi = {
  listContexts: async () => {
    if (electronApi) return electronApi.listContexts()
    return wsClient.listContexts() as Promise<ContextRecord[]>
  },

  listNamespaces: async (contextId: string) => {
    if (electronApi) return electronApi.listNamespaces(contextId)
    return wsClient.listNamespaces(contextId) as Promise<NamespaceInfo[]>
  },

  listNodes: async (contextId: string) => {
    if (electronApi) return electronApi.listNodes(contextId)
    return wsClient.listNodes(contextId) as Promise<NodeInfo[]>
  },

  getNodeDetail: async (contextId: string, nodeName: string) => {
    if (electronApi) return electronApi.getNodeDetail(contextId, nodeName)
    return wsClient.getNodeDetail(contextId, nodeName) as Promise<NodeInfo>
  },

  getNodeMetrics: async (contextId: string, nodeName: string) => {
    if (electronApi) return electronApi.getNodeMetrics(contextId, nodeName)
    return wsClient.getNodeMetrics(contextId, nodeName) as Promise<NodeMetrics | null>
  },

  listPods: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listPods(contextId, namespace)
    return wsClient.listPods(contextId, namespace) as Promise<PodInfo[]>
  },

  getPodDetail: async (contextId: string, namespace: string, podName: string) => {
    if (electronApi) return electronApi.getPodDetail(contextId, namespace, podName)
    return wsClient.getPodDetail(contextId, namespace, podName) as Promise<PodInfo>
  },

  listDeployments: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listDeployments(contextId, namespace)
    return wsClient.listDeployments(contextId, namespace) as Promise<DeploymentInfo[]>
  },

  getDeploymentDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getDeploymentDetail(contextId, namespace, name)
    return wsClient.getDeploymentDetail(contextId, namespace, name) as Promise<DeploymentInfo>
  },

  listDaemonSets: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listDaemonSets(contextId, namespace)
    return wsClient.listDaemonSets(contextId, namespace) as Promise<DaemonSetInfo[]>
  },

  getDaemonSetDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getDaemonSetDetail(contextId, namespace, name)
    return wsClient.getDaemonSetDetail(contextId, namespace, name) as Promise<DaemonSetInfo>
  },

  listStatefulSets: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listStatefulSets(contextId, namespace)
    return wsClient.listStatefulSets(contextId, namespace) as Promise<StatefulSetInfo[]>
  },

  getStatefulSetDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getStatefulSetDetail(contextId, namespace, name)
    return wsClient.getStatefulSetDetail(contextId, namespace, name) as Promise<StatefulSetInfo>
  },

  listReplicaSets: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listReplicaSets(contextId, namespace)
    return wsClient.listReplicaSets(contextId, namespace) as Promise<ReplicaSetInfo[]>
  },

  getReplicaSetDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getReplicaSetDetail(contextId, namespace, name)
    return wsClient.getReplicaSetDetail(contextId, namespace, name) as Promise<ReplicaSetInfo>
  },

  listJobs: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listJobs(contextId, namespace)
    return wsClient.listJobs(contextId, namespace) as Promise<JobInfo[]>
  },

  getJobDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getJobDetail(contextId, namespace, name)
    return wsClient.getJobDetail(contextId, namespace, name) as Promise<JobInfo>
  },

  listCronJobs: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listCronJobs(contextId, namespace)
    return wsClient.listCronJobs(contextId, namespace) as Promise<CronJobInfo[]>
  },

  getCronJobDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getCronJobDetail(contextId, namespace, name)
    return wsClient.getCronJobDetail(contextId, namespace, name) as Promise<CronJobInfo>
  },

  listServices: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listServices(contextId, namespace)
    return wsClient.listServices(contextId, namespace) as Promise<ServiceInfo[]>
  },

  listConfigMaps: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listConfigMaps(contextId, namespace)
    return wsClient.listConfigMaps(contextId, namespace) as Promise<ConfigMapInfo[]>
  },

  listSecrets: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listSecrets(contextId, namespace)
    return wsClient.listSecrets(contextId, namespace) as Promise<SecretInfo[]>
  },

  listIngresses: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listIngresses(contextId, namespace)
    return wsClient.listIngresses(contextId, namespace) as Promise<IngressInfo[]>
  },

  listPersistentVolumes: async (contextId: string) => {
    if (electronApi) return electronApi.listPersistentVolumes(contextId)
    return wsClient.listPersistentVolumes(contextId) as Promise<PersistentVolumeInfo[]>
  },

  listPersistentVolumeClaims: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listPersistentVolumeClaims(contextId, namespace)
    return wsClient.listPersistentVolumeClaims(contextId, namespace) as Promise<PersistentVolumeClaimInfo[]>
  },

  listStorageClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listStorageClasses(contextId)
    return wsClient.listStorageClasses(contextId) as Promise<StorageClassInfo[]>
  },

  listServiceAccounts: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listServiceAccounts(contextId, namespace)
    return wsClient.listServiceAccounts(contextId, namespace) as Promise<ServiceAccountInfo[]>
  },

  listRoles: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listRoles(contextId, namespace)
    return wsClient.listRoles(contextId, namespace) as Promise<RoleInfo[]>
  },

  listRoleBindings: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listRoleBindings(contextId, namespace)
    return wsClient.listRoleBindings(contextId, namespace) as Promise<RoleBindingInfo[]>
  },

  listClusterRoles: async (contextId: string) => {
    if (electronApi) return electronApi.listClusterRoles(contextId)
    return wsClient.listClusterRoles(contextId) as Promise<ClusterRoleInfo[]>
  },

  listClusterRoleBindings: async (contextId: string) => {
    if (electronApi) return electronApi.listClusterRoleBindings(contextId)
    return wsClient.listClusterRoleBindings(contextId) as Promise<ClusterRoleBindingInfo[]>
  },

  listHPAs: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listHPAs(contextId, namespace)
    return wsClient.listHPAs(contextId, namespace) as Promise<HPAInfo[]>
  },

  listEvents: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listEvents(contextId, namespace)
    return wsClient.listEvents(contextId, namespace) as Promise<EventInfo[]>
  },

  addKubeconfigFile: async () => {
    if (electronApi) return electronApi.addKubeconfigFile()
    return wsClient.addKubeconfigFile() as Promise<AddContextsResult>
  },

  getContextPrefs: async () => {
    if (electronApi) return electronApi.getContextPrefs()
    return wsClient.getContextPrefs() as Promise<ContextPrefs>
  },

  updateContextName: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.updateContextName(contextId, name)
    return wsClient.updateContextName(contextId, name) as Promise<ContextPrefs>
  },

  updateContextGrouping: async (groups: ContextGroup[], ungrouped: string[]) => {
    if (electronApi) return electronApi.updateContextGrouping(groups, ungrouped)
    return wsClient.updateContextGrouping(groups, ungrouped) as Promise<ContextPrefs>
  },

  deletePod: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deletePod(contextId, namespace, name)
    return wsClient.deletePod(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteDeployment: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteDeployment(contextId, namespace, name)
    return wsClient.deleteDeployment(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteDaemonSet: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteDaemonSet(contextId, namespace, name)
    return wsClient.deleteDaemonSet(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteStatefulSet: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteStatefulSet(contextId, namespace, name)
    return wsClient.deleteStatefulSet(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteReplicaSet: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteReplicaSet(contextId, namespace, name)
    return wsClient.deleteReplicaSet(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteJob: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteJob(contextId, namespace, name)
    return wsClient.deleteJob(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteCronJob: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteCronJob(contextId, namespace, name)
    return wsClient.deleteCronJob(contextId, namespace, name) as Promise<DeleteResult>
  },

  deleteNamespace: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.deleteNamespace(contextId, name)
    return wsClient.deleteNamespace(contextId, name) as Promise<DeleteResult>
  },

  scaleDeployment: async (contextId: string, namespace: string, name: string, replicas: number) => {
    if (electronApi) return electronApi.scaleDeployment(contextId, namespace, name, replicas)
    return wsClient.scaleDeployment(contextId, namespace, name, replicas) as Promise<ScaleResult>
  },

  scaleStatefulSet: async (contextId: string, namespace: string, name: string, replicas: number) => {
    if (electronApi) return electronApi.scaleStatefulSet(contextId, namespace, name, replicas)
    return wsClient.scaleStatefulSet(contextId, namespace, name, replicas) as Promise<ScaleResult>
  },

  scaleReplicaSet: async (contextId: string, namespace: string, name: string, replicas: number) => {
    if (electronApi) return electronApi.scaleReplicaSet(contextId, namespace, name, replicas)
    return wsClient.scaleReplicaSet(contextId, namespace, name, replicas) as Promise<ScaleResult>
  },

  getPodLogs: async (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number) => {
    if (electronApi) return electronApi.getPodLogs(contextId, namespace, podName, containerName, tailLines)
    return wsClient.getPodLogs(contextId, namespace, podName, containerName, tailLines) as Promise<string>
  },

  getClusterHealth: async (contextId: string) => {
    if (electronApi) return electronApi.getClusterHealth(contextId)
    return wsClient.getClusterHealth(contextId) as Promise<ClusterHealth>
  },

  createNamespace: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.createNamespace(contextId, name)
    return wsClient.createNamespace(contextId, name) as Promise<CreateResult>
  },

  createDeployment: async (contextId: string, data: DeploymentFormData) => {
    if (electronApi) return electronApi.createDeployment(contextId, data)
    return wsClient.createDeployment(contextId, data) as Promise<CreateResult>
  },

  createService: async (contextId: string, data: ServiceFormData) => {
    if (electronApi) return electronApi.createService(contextId, data)
    return wsClient.createService(contextId, data) as Promise<CreateResult>
  },

  createConfigMap: async (contextId: string, data: ConfigMapFormData) => {
    if (electronApi) return electronApi.createConfigMap(contextId, data)
    return wsClient.createConfigMap(contextId, data) as Promise<CreateResult>
  },

  createSecret: async (contextId: string, data: SecretFormData) => {
    if (electronApi) return electronApi.createSecret(contextId, data)
    return wsClient.createSecret(contextId, data) as Promise<CreateResult>
  },

  createIngress: async (contextId: string, data: IngressFormData) => {
    if (electronApi) return electronApi.createIngress(contextId, data)
    return wsClient.createIngress(contextId, data) as Promise<CreateResult>
  },

  updateDeployment: async (contextId: string, namespace: string, name: string, data: Partial<DeploymentFormData>) => {
    if (electronApi) return electronApi.updateDeployment(contextId, namespace, name, data)
    return wsClient.updateDeployment(contextId, namespace, name, data) as Promise<UpdateResult>
  },

  applyYaml: async (contextId: string, yaml: string) => {
    if (electronApi) return electronApi.applyYaml(contextId, yaml)
    return wsClient.applyYaml(contextId, yaml) as Promise<CreateResult>
  },

  getResourceYaml: async (contextId: string, kind: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getResourceYaml(contextId, kind, namespace, name)
    return wsClient.getResourceYaml(contextId, kind, namespace, name) as Promise<string>
  }
}

export const isWebMode = !isElectronMode
export { wsClient }
