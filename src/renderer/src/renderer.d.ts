import type {
  AddContextsResult,
  APIServerHealthInfo,
  AdmissionWebhookConfigurationInfo,
  APIGroupInfo,
  APIResourceInfo,
  APIServiceInfo,
  CertificateSigningRequestDecision,
  CertificateSigningRequestInfo,
  ClusterHealth,
  PodCertificateRequestInfo,
  ClusterTrustBundleInfo,
  ComponentStatusInfo,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapFormData,
  ConfigMapInfo,
  ContextRecord,
  ControllerRevisionInfo,
  CSIDriverInfo,
  CSIStorageCapacityInfo,
  CSINodeInfo,
  CustomResourceDefinitionInfo,
  CustomResourceInstanceInfo,
  CronJobInfo,
  CreateResult,
  DaemonSetInfo,
  DeleteResult,
  DeploymentFormData,
  DeploymentInfo,
  DeviceClassInfo,
  DeviceTaintRuleInfo,
  EndpointInfo,
  EndpointSliceInfo,
  EventInfo,
  FlowSchemaInfo,
  GatewayClassInfo,
  GatewayInfo,
  GRPCRouteInfo,
  HTTPRouteInfo,
  HelmChartInfo,
  HelmRepositoryInfo,
  HelmReleaseInfo,
  HelmReleaseUpgradeRequest,
  HPAInfo,
  IngressClassInfo,
  IngressFormData,
  IngressInfo,
  IPAddressInfo,
  CanIReviewRequest,
  JobSuspensionKind,
  JobInfo,
  K7sPushEvent,
  K8sTermApi,
  KubernetesResourceKind,
  LeaseCandidateInfo,
  LeaseInfo,
  LimitRangeInfo,
  MetadataField,
  NamespaceInfo,
  NetworkPolicyInfo,
  NodeInfo,
  NodeMetrics,
  PodExecData,
  PodExecResult,
  PodLogStreamRequest,
  PodLogStreamResult,
  PodDisruptionBudgetInfo,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PausableWorkloadKind,
  PodInfo,
  PodTemplateInfo,
  PriorityClassInfo,
  PriorityLevelConfigurationInfo,
  ReplicaSetInfo,
  ReplicationControllerInfo,
  ResourceClaimInfo,
  ResourceClaimTemplateInfo,
  ResourceQuotaInfo,
  ResourceSliceInfo,
  ReferenceGrantInfo,
  RolloutResult,
  RolloutWorkloadKind,
  RoleBindingInfo,
  RoleInfo,
  RuntimeClassInfo,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
  OpenIDConfigurationInfo,
  PortForwardRequest,
  PortForwardResult,
  PortForwardSessionInfo,
  ScaleResult,
  ScaleableWorkloadKind,
  SecretFormData,
  SecretInfo,
  SelfSubjectAccessReviewInfo,
  SelfSubjectReviewInfo,
  SelfSubjectRuleInfo,
  ServerVersionInfo,
  ServiceAccountInfo,
  ServiceCIDRInfo,
  ServiceFormData,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
  StorageVersionInfo,
  StorageVersionMigrationInfo,
  TCPRouteInfo,
  TLSRouteInfo,
  UpdateResult,
  UDPRouteInfo,
  ValidatingAdmissionPolicyBindingInfo,
  ValidatingAdmissionPolicyInfo,
  VolumeAttachmentInfo,
  VolumeAttributesClassInfo,
  VolumeSnapshotClassInfo,
  VolumeSnapshotContentInfo,
  VolumeSnapshotInfo,
  AppThemeName,
  ContextPrefs,
  ContextGroup,
  WorkloadImageKind,
} from '../../shared/types'

export {}

declare global {
  interface Window {
    k7s: {
      platform: string
      listContexts: () => Promise<ContextRecord[]>
      useKubeContext: (contextId: string) => Promise<ContextRecord[]>
      setKubeContextNamespace: (contextId: string, namespace: string) => Promise<ContextRecord[]>
      listNamespaces: (contextId: string) => Promise<NamespaceInfo[]>
      listComponentStatuses: (contextId: string) => Promise<ComponentStatusInfo[]>
      listAPIGroups: (contextId: string) => Promise<APIGroupInfo[]>
      listAPIResources: (contextId: string) => Promise<APIResourceInfo[]>
      listServerVersions: (contextId: string) => Promise<ServerVersionInfo[]>
      listOpenIDConfigurations: (contextId: string) => Promise<OpenIDConfigurationInfo[]>
      listAPIServerHealth: (contextId: string) => Promise<APIServerHealthInfo[]>
      listSelfSubjectReviews: (contextId: string) => Promise<SelfSubjectReviewInfo[]>
      listSelfSubjectAccessReviews: (contextId: string, namespaces?: string | string[]) => Promise<SelfSubjectAccessReviewInfo[]>
      checkCanI: (contextId: string, request: CanIReviewRequest) => Promise<SelfSubjectAccessReviewInfo>
      listSelfSubjectRulesReviews: (contextId: string, namespaces?: string | string[]) => Promise<SelfSubjectRuleInfo[]>
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
      listReplicationControllers: (contextId: string, namespace?: string) => Promise<ReplicationControllerInfo[]>
      getReplicationControllerDetail: (contextId: string, namespace: string, name: string) => Promise<ReplicationControllerInfo>
      listControllerRevisions: (contextId: string, namespace?: string) => Promise<ControllerRevisionInfo[]>
      listPodTemplates: (contextId: string, namespace?: string) => Promise<PodTemplateInfo[]>
      getReplicaSetDetail: (contextId: string, namespace: string, name: string) => Promise<ReplicaSetInfo>
      listJobs: (contextId: string, namespace?: string) => Promise<JobInfo[]>
      getJobDetail: (contextId: string, namespace: string, name: string) => Promise<JobInfo>
      listCronJobs: (contextId: string, namespace?: string) => Promise<CronJobInfo[]>
      getCronJobDetail: (contextId: string, namespace: string, name: string) => Promise<CronJobInfo>
      listServices: (contextId: string, namespace?: string) => Promise<ServiceInfo[]>
      listConfigMaps: (contextId: string, namespace?: string) => Promise<ConfigMapInfo[]>
      listSecrets: (contextId: string, namespace?: string) => Promise<SecretInfo[]>
      listEndpoints: (contextId: string, namespace?: string) => Promise<EndpointInfo[]>
      listIngresses: (contextId: string, namespace?: string) => Promise<IngressInfo[]>
      listIngressClasses: (contextId: string) => Promise<IngressClassInfo[]>
      listHelmReleases: (contextId: string, namespace?: string) => Promise<HelmReleaseInfo[]>
      listHelmCharts: (contextId: string) => Promise<HelmChartInfo[]>
      listHelmRepositories: (contextId: string) => Promise<HelmRepositoryInfo[]>
      listNetworkPolicies: (contextId: string, namespace?: string) => Promise<NetworkPolicyInfo[]>
      listIPAddresses: (contextId: string) => Promise<IPAddressInfo[]>
      listServiceCIDRs: (contextId: string) => Promise<ServiceCIDRInfo[]>
      listEndpointSlices: (contextId: string, namespace?: string) => Promise<EndpointSliceInfo[]>
      listAPIServices: (contextId: string) => Promise<APIServiceInfo[]>
      listMutatingWebhookConfigurations: (contextId: string) => Promise<AdmissionWebhookConfigurationInfo[]>
      listValidatingWebhookConfigurations: (contextId: string) => Promise<AdmissionWebhookConfigurationInfo[]>
      listMutatingAdmissionPolicies: (contextId: string) => Promise<MutatingAdmissionPolicyInfo[]>
      listMutatingAdmissionPolicyBindings: (contextId: string) => Promise<MutatingAdmissionPolicyBindingInfo[]>
      listValidatingAdmissionPolicies: (contextId: string) => Promise<ValidatingAdmissionPolicyInfo[]>
      listValidatingAdmissionPolicyBindings: (contextId: string) => Promise<ValidatingAdmissionPolicyBindingInfo[]>
      listFlowSchemas: (contextId: string) => Promise<FlowSchemaInfo[]>
      listPriorityLevelConfigurations: (contextId: string) => Promise<PriorityLevelConfigurationInfo[]>
      listCertificateSigningRequests: (contextId: string) => Promise<CertificateSigningRequestInfo[]>
      updateCertificateSigningRequestApproval: (
        contextId: string,
        name: string,
        decision: CertificateSigningRequestDecision,
      ) => Promise<UpdateResult>
      listClusterTrustBundles: (contextId: string) => Promise<ClusterTrustBundleInfo[]>
      listPodCertificateRequests: (contextId: string, namespace?: string) => Promise<PodCertificateRequestInfo[]>
      listStorageVersions: (contextId: string) => Promise<StorageVersionInfo[]>
      listStorageVersionMigrations: (contextId: string) => Promise<StorageVersionMigrationInfo[]>
      listPodDisruptionBudgets: (contextId: string, namespace?: string) => Promise<PodDisruptionBudgetInfo[]>
      listResourceQuotas: (contextId: string, namespace?: string) => Promise<ResourceQuotaInfo[]>
      listLimitRanges: (contextId: string, namespace?: string) => Promise<LimitRangeInfo[]>
      listLeases: (contextId: string, namespace?: string) => Promise<LeaseInfo[]>
      listLeaseCandidates: (contextId: string, namespace?: string) => Promise<LeaseCandidateInfo[]>
      listPriorityClasses: (contextId: string) => Promise<PriorityClassInfo[]>
      listRuntimeClasses: (contextId: string) => Promise<RuntimeClassInfo[]>
      listPersistentVolumes: (contextId: string) => Promise<PersistentVolumeInfo[]>
      listPersistentVolumeClaims: (contextId: string, namespace?: string) => Promise<PersistentVolumeClaimInfo[]>
      listStorageClasses: (contextId: string) => Promise<StorageClassInfo[]>
      listVolumeAttributesClasses: (contextId: string) => Promise<VolumeAttributesClassInfo[]>
      listCSIDrivers: (contextId: string) => Promise<CSIDriverInfo[]>
      listCSINodes: (contextId: string) => Promise<CSINodeInfo[]>
      listVolumeAttachments: (contextId: string) => Promise<VolumeAttachmentInfo[]>
      listCSIStorageCapacities: (contextId: string, namespace?: string) => Promise<CSIStorageCapacityInfo[]>
      listVolumeSnapshotClasses: (contextId: string) => Promise<VolumeSnapshotClassInfo[]>
      listVolumeSnapshots: (contextId: string, namespace?: string) => Promise<VolumeSnapshotInfo[]>
      listVolumeSnapshotContents: (contextId: string) => Promise<VolumeSnapshotContentInfo[]>
      listGatewayClasses: (contextId: string) => Promise<GatewayClassInfo[]>
      listGateways: (contextId: string, namespace?: string) => Promise<GatewayInfo[]>
      listHTTPRoutes: (contextId: string, namespace?: string) => Promise<HTTPRouteInfo[]>
      listGRPCRoutes: (contextId: string, namespace?: string) => Promise<GRPCRouteInfo[]>
      listTLSRoutes: (contextId: string, namespace?: string) => Promise<TLSRouteInfo[]>
      listTCPRoutes: (contextId: string, namespace?: string) => Promise<TCPRouteInfo[]>
      listUDPRoutes: (contextId: string, namespace?: string) => Promise<UDPRouteInfo[]>
      listReferenceGrants: (contextId: string, namespace?: string) => Promise<ReferenceGrantInfo[]>
      listDeviceClasses: (contextId: string) => Promise<DeviceClassInfo[]>
      listResourceClaims: (contextId: string, namespace?: string) => Promise<ResourceClaimInfo[]>
      listResourceClaimTemplates: (contextId: string, namespace?: string) => Promise<ResourceClaimTemplateInfo[]>
      listResourceSlices: (contextId: string) => Promise<ResourceSliceInfo[]>
      listDeviceTaintRules: (contextId: string) => Promise<DeviceTaintRuleInfo[]>
      listServiceAccounts: (contextId: string, namespace?: string) => Promise<ServiceAccountInfo[]>
      listRoles: (contextId: string, namespace?: string) => Promise<RoleInfo[]>
      listRoleBindings: (contextId: string, namespace?: string) => Promise<RoleBindingInfo[]>
      listClusterRoles: (contextId: string) => Promise<ClusterRoleInfo[]>
      listClusterRoleBindings: (contextId: string) => Promise<ClusterRoleBindingInfo[]>
      listCustomResourceDefinitions: (contextId: string) => Promise<CustomResourceDefinitionInfo[]>
      listCustomResourceInstances: (contextId: string, crdName: string, namespace?: string) => Promise<CustomResourceInstanceInfo[]>
      listHPAs: (contextId: string, namespace?: string) => Promise<HPAInfo[]>
      listEvents: (contextId: string, namespace?: string) => Promise<EventInfo[]>
      addKubeconfigFile: () => Promise<AddContextsResult>
      getContextPrefs: () => Promise<ContextPrefs>
      updateContextName: (contextId: string, name: string) => Promise<ContextPrefs>
      updateContextGrouping: (groups: ContextGroup[], ungrouped: string[]) => Promise<ContextPrefs>
      updateAppTheme: (theme: AppThemeName) => Promise<ContextPrefs>
      deletePod: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      evictPod: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteDeployment: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteDaemonSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteStatefulSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteReplicaSet: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteJob: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      deleteCronJob: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      triggerCronJob: (contextId: string, namespace: string, name: string) => Promise<CreateResult>
      deleteNamespace: (contextId: string, name: string) => Promise<DeleteResult>
      cordonNode: (contextId: string, name: string) => Promise<UpdateResult>
      uncordonNode: (contextId: string, name: string) => Promise<UpdateResult>
      drainNode: (contextId: string, name: string) => Promise<UpdateResult>
      deleteNode: (contextId: string, name: string) => Promise<DeleteResult>
      deleteCustomResourceDefinition: (contextId: string, name: string) => Promise<DeleteResult>
      deleteCustomResourceInstance: (contextId: string, crdName: string, namespace: string, name: string) => Promise<DeleteResult>
      scaleDeployment: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
      scaleStatefulSet: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
      scaleReplicaSet: (contextId: string, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
      getPodLogs: (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number, previous?: boolean, timestamps?: boolean) => Promise<string>
      getClusterHealth: (contextId: string) => Promise<ClusterHealth>
      createNamespace: (contextId: string, name: string) => Promise<CreateResult>
      createDeployment: (contextId: string, data: DeploymentFormData) => Promise<CreateResult>
      createService: (contextId: string, data: ServiceFormData) => Promise<CreateResult>
      createConfigMap: (contextId: string, data: ConfigMapFormData) => Promise<CreateResult>
      createSecret: (contextId: string, data: SecretFormData) => Promise<CreateResult>
      createIngress: (contextId: string, data: IngressFormData) => Promise<CreateResult>
      updateDeployment: (contextId: string, namespace: string, name: string, data: Partial<DeploymentFormData>) => Promise<UpdateResult>
      deleteResource: (contextId: string, kind: KubernetesResourceKind, namespace: string, name: string) => Promise<DeleteResult>
      forceDeletePod: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      scaleWorkload: (contextId: string, kind: ScaleableWorkloadKind, namespace: string, name: string, replicas: number) => Promise<ScaleResult>
      restartWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      setWorkloadImage: (contextId: string, kind: WorkloadImageKind, namespace: string, name: string, containerName: string, image: string) => Promise<UpdateResult>
      installOrUpgradeHelmRelease: (contextId: string, request: HelmReleaseUpgradeRequest) => Promise<RolloutResult>
      addHelmRepository: (contextId: string, name: string, url: string) => Promise<RolloutResult>
      updateHelmRepository: (contextId: string, name?: string) => Promise<RolloutResult>
      removeHelmRepository: (contextId: string, name: string) => Promise<DeleteResult>
      rollbackWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      rollbackHelmRelease: (contextId: string, namespace: string, name: string, revision?: number) => Promise<RolloutResult>
      rolloutHistory: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseHistory: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseStatus: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseResources: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseManifest: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseMetadata: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseValues: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseNotes: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseHooks: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      helmReleaseAll: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      rolloutStatus: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      testHelmRelease: (contextId: string, namespace: string, name: string) => Promise<RolloutResult>
      uninstallHelmRelease: (contextId: string, namespace: string, name: string) => Promise<DeleteResult>
      pauseWorkload: (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      resumeWorkload: (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string) => Promise<RolloutResult>
      updateJobSuspension: (
        contextId: string,
        kind: JobSuspensionKind,
        namespace: string,
        name: string,
        suspend: boolean
      ) => Promise<UpdateResult>
      applyYaml: (contextId: string, yaml: string) => Promise<CreateResult>
      diffYaml: (contextId: string, yaml: string) => Promise<string>
      getResourceYaml: (contextId: string, kind: string, namespace: string, name: string) => Promise<string>
      describeResource: (contextId: string, kind: string, namespace: string, name: string) => Promise<string>
      mutateResourceMetadata: (
        contextId: string,
        kind: string,
        namespace: string,
        name: string,
        field: MetadataField,
        key: string,
        value: string,
        remove: boolean
      ) => Promise<UpdateResult>
      getCustomResourceInstanceYaml: (contextId: string, crdName: string, namespace: string, name: string) => Promise<string>
      startPodLogStream: (contextId: string, request: PodLogStreamRequest) => Promise<PodLogStreamResult>
      stopPodLogStream: (streamId: string) => Promise<{ success: boolean }>
      startPodExec: (contextId: string, request: PodExecData) => Promise<PodExecResult>
      stopPodExec: (sessionId: string) => Promise<{ success: boolean }>
      startPortForward: (contextId: string, request: PortForwardRequest) => Promise<PortForwardResult>
      listPortForwards: () => Promise<PortForwardSessionInfo[]>
      stopPortForward: (sessionId: string) => Promise<{ success: boolean }>
      subscribeWatch: (contextId: string) => Promise<{ success: boolean }>
      unsubscribeWatch: () => Promise<{ success: boolean }>
      onPushEvent: (callback: (event: K7sPushEvent) => void) => void
    }
    k8sTerm?: K8sTermApi
  }
}
