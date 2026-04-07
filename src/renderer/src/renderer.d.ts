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
} from '../../shared/types'

export {}

declare global {
  interface Window {
    k7s: {
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
      deleteResource: (contextId: string, kind: KubernetesResourceKind, namespace: string, name: string) => Promise<DeleteResult>
      scaleWorkload: (contextId: string, kind: ScaleableWorkloadKind, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
      restartWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      rollbackWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      applyYaml: (contextId: string, yaml: string) => Promise<CreateResult>
      getResourceYaml: (contextId: string, kind: string, namespace: string, name: string) => Promise<string>
      startPodLogStream: (contextId: string, request: PodLogStreamRequest) => Promise<PodLogStreamResult>
      stopPodLogStream: (streamId: string) => Promise<{ success: boolean }>
      startPodExec: (contextId: string, request: PodExecData) => Promise<PodExecResult>
      stopPodExec: (sessionId: string) => Promise<{ success: boolean }>
      startPortForward: (contextId: string, request: PortForwardRequest) => Promise<PortForwardResult>
      stopPortForward: (sessionId: string) => Promise<{ success: boolean }>
      subscribeWatch: (contextId: string) => Promise<{ success: boolean }>
      unsubscribeWatch: () => Promise<{ success: boolean }>
      onPushEvent: (callback: (event: K7sPushEvent) => void) => void
    }
  }
}
