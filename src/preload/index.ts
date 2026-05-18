import { contextBridge, ipcRenderer } from 'electron'
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
  KubernetesResourceKind,
  LeaseCandidateInfo,
  LeaseInfo,
  LimitRangeInfo,
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
  PortForwardSessionInfo,
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
} from '../shared/types'

contextBridge.exposeInMainWorld('k7s', {
  platform: process.platform,
  listContexts: (): Promise<ContextRecord[]> => ipcRenderer.invoke('k7s:list-contexts'),
  useKubeContext: (contextId: string): Promise<ContextRecord[]> =>
    ipcRenderer.invoke('k7s:use-kube-context', contextId),
  setKubeContextNamespace: (contextId: string, namespace: string): Promise<ContextRecord[]> =>
    ipcRenderer.invoke('k7s:set-kube-context-namespace', contextId, namespace),
  listNamespaces: (contextId: string): Promise<NamespaceInfo[]> =>
    ipcRenderer.invoke('k7s:list-namespaces', contextId),
  listComponentStatuses: (contextId: string): Promise<ComponentStatusInfo[]> =>
    ipcRenderer.invoke('k7s:list-componentstatuses', contextId),
  listAPIGroups: (contextId: string): Promise<APIGroupInfo[]> =>
    ipcRenderer.invoke('k7s:list-apigroups', contextId),
  listAPIResources: (contextId: string): Promise<APIResourceInfo[]> =>
    ipcRenderer.invoke('k7s:list-apiresources', contextId),
  listServerVersions: (contextId: string): Promise<ServerVersionInfo[]> =>
    ipcRenderer.invoke('k7s:list-serverversions', contextId),
  listOpenIDConfigurations: (contextId: string): Promise<OpenIDConfigurationInfo[]> =>
    ipcRenderer.invoke('k7s:list-openidconfigs', contextId),
  listAPIServerHealth: (contextId: string): Promise<APIServerHealthInfo[]> =>
    ipcRenderer.invoke('k7s:list-apiserverhealth', contextId),
  listSelfSubjectReviews: (contextId: string): Promise<SelfSubjectReviewInfo[]> =>
    ipcRenderer.invoke('k7s:list-selfsubjectreviews', contextId),
  listSelfSubjectAccessReviews: (contextId: string, namespaces?: string | string[]): Promise<SelfSubjectAccessReviewInfo[]> =>
    ipcRenderer.invoke('k7s:list-selfsubjectaccessreviews', contextId, namespaces),
  checkCanI: (contextId: string, request: CanIReviewRequest): Promise<SelfSubjectAccessReviewInfo> =>
    ipcRenderer.invoke('k7s:check-can-i', contextId, request),
  listSelfSubjectRulesReviews: (contextId: string, namespaces?: string | string[]): Promise<SelfSubjectRuleInfo[]> =>
    ipcRenderer.invoke('k7s:list-selfsubjectrulesreviews', contextId, namespaces),
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
  listReplicationControllers: (contextId: string, namespace?: string): Promise<ReplicationControllerInfo[]> =>
    ipcRenderer.invoke('k7s:list-replicationcontrollers', contextId, namespace),
  getReplicationControllerDetail: (contextId: string, namespace: string, name: string): Promise<ReplicationControllerInfo> =>
    ipcRenderer.invoke('k7s:get-replicationcontroller-detail', contextId, namespace, name),
  listControllerRevisions: (contextId: string, namespace?: string): Promise<ControllerRevisionInfo[]> =>
    ipcRenderer.invoke('k7s:list-controllerrevisions', contextId, namespace),
  listPodTemplates: (contextId: string, namespace?: string): Promise<PodTemplateInfo[]> =>
    ipcRenderer.invoke('k7s:list-podtemplates', contextId, namespace),
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
  updateAppTheme: (theme: AppThemeName): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:update-app-theme', theme),

  // Delete operations
  deletePod: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-pod', contextId, namespace, name),
  evictPod: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:evict-pod', contextId, namespace, name),
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
  triggerCronJob: (contextId: string, namespace: string, name: string): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:trigger-cronjob', contextId, namespace, name),
  deleteNamespace: (contextId: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-namespace', contextId, name),
  cordonNode: (contextId: string, name: string): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:cordon-node', contextId, name),
  uncordonNode: (contextId: string, name: string): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:uncordon-node', contextId, name),
  drainNode: (contextId: string, name: string): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:drain-node', contextId, name),
  deleteNode: (contextId: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-node', contextId, name),
  deleteCustomResourceDefinition: (contextId: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-customresourcedefinition', contextId, name),
  deleteCustomResourceInstance: (contextId: string, crdName: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:delete-customresource-instance', contextId, crdName, namespace, name),

  // Scale operations
  scaleDeployment: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-deployment', contextId, namespace, name, replicas),
  scaleStatefulSet: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-statefulset', contextId, namespace, name, replicas),
  scaleReplicaSet: (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-replicaset', contextId, namespace, name, replicas),

  // Log operations
  getPodLogs: (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number, previous?: boolean, timestamps?: boolean): Promise<string> => {
    const args = previous === undefined && timestamps === undefined
      ? [contextId, namespace, podName, containerName, tailLines]
      : [contextId, namespace, podName, containerName, tailLines, previous, timestamps]
    return ipcRenderer.invoke('k7s:get-pod-logs', ...args)
  },
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
  listPortForwards: (): Promise<PortForwardSessionInfo[]> =>
    ipcRenderer.invoke('k7s:list-port-forwards'),
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
  listEndpoints: (contextId: string, namespace?: string): Promise<EndpointInfo[]> =>
    ipcRenderer.invoke('k7s:list-endpoints', contextId, namespace),
  listIngresses: (contextId: string, namespace?: string): Promise<IngressInfo[]> =>
    ipcRenderer.invoke('k7s:list-ingresses', contextId, namespace),
  listIngressClasses: (contextId: string): Promise<IngressClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-ingressclasses', contextId),
  listHelmReleases: (contextId: string, namespace?: string): Promise<HelmReleaseInfo[]> =>
    ipcRenderer.invoke('k7s:list-helmreleases', contextId, namespace),
  listHelmCharts: (contextId: string): Promise<HelmChartInfo[]> =>
    ipcRenderer.invoke('k7s:list-helmcharts', contextId),
  listHelmRepositories: (contextId: string): Promise<HelmRepositoryInfo[]> =>
    ipcRenderer.invoke('k7s:list-helmrepositories', contextId),
  listNetworkPolicies: (contextId: string, namespace?: string): Promise<NetworkPolicyInfo[]> =>
    ipcRenderer.invoke('k7s:list-networkpolicies', contextId, namespace),
  listIPAddresses: (contextId: string): Promise<IPAddressInfo[]> =>
    ipcRenderer.invoke('k7s:list-ipaddresses', contextId),
  listServiceCIDRs: (contextId: string): Promise<ServiceCIDRInfo[]> =>
    ipcRenderer.invoke('k7s:list-servicecidrs', contextId),
  listEndpointSlices: (contextId: string, namespace?: string): Promise<EndpointSliceInfo[]> =>
    ipcRenderer.invoke('k7s:list-endpointslices', contextId, namespace),
  listAPIServices: (contextId: string): Promise<APIServiceInfo[]> =>
    ipcRenderer.invoke('k7s:list-apiservices', contextId),
  listMutatingWebhookConfigurations: (contextId: string): Promise<AdmissionWebhookConfigurationInfo[]> =>
    ipcRenderer.invoke('k7s:list-mutatingwebhookconfigurations', contextId),
  listValidatingWebhookConfigurations: (contextId: string): Promise<AdmissionWebhookConfigurationInfo[]> =>
    ipcRenderer.invoke('k7s:list-validatingwebhookconfigurations', contextId),
  listMutatingAdmissionPolicies: (contextId: string): Promise<MutatingAdmissionPolicyInfo[]> =>
    ipcRenderer.invoke('k7s:list-mutatingadmissionpolicies', contextId),
  listMutatingAdmissionPolicyBindings: (contextId: string): Promise<MutatingAdmissionPolicyBindingInfo[]> =>
    ipcRenderer.invoke('k7s:list-mutatingadmissionpolicybindings', contextId),
  listValidatingAdmissionPolicies: (contextId: string): Promise<ValidatingAdmissionPolicyInfo[]> =>
    ipcRenderer.invoke('k7s:list-validatingadmissionpolicies', contextId),
  listValidatingAdmissionPolicyBindings: (contextId: string): Promise<ValidatingAdmissionPolicyBindingInfo[]> =>
    ipcRenderer.invoke('k7s:list-validatingadmissionpolicybindings', contextId),
  listFlowSchemas: (contextId: string): Promise<FlowSchemaInfo[]> =>
    ipcRenderer.invoke('k7s:list-flowschemas', contextId),
  listPriorityLevelConfigurations: (contextId: string): Promise<PriorityLevelConfigurationInfo[]> =>
    ipcRenderer.invoke('k7s:list-prioritylevelconfigurations', contextId),
  listCertificateSigningRequests: (contextId: string): Promise<CertificateSigningRequestInfo[]> =>
    ipcRenderer.invoke('k7s:list-certificatesigningrequests', contextId),
  updateCertificateSigningRequestApproval: (
    contextId: string,
    name: string,
    decision: CertificateSigningRequestDecision,
  ): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:update-certificate-signing-request-approval', contextId, name, decision),
  listClusterTrustBundles: (contextId: string): Promise<ClusterTrustBundleInfo[]> =>
    ipcRenderer.invoke('k7s:list-clustertrustbundles', contextId),
  listPodCertificateRequests: (contextId: string, namespace?: string): Promise<PodCertificateRequestInfo[]> =>
    ipcRenderer.invoke('k7s:list-podcertificaterequests', contextId, namespace),
  listStorageVersions: (contextId: string): Promise<StorageVersionInfo[]> =>
    ipcRenderer.invoke('k7s:list-storageversions', contextId),
  listStorageVersionMigrations: (contextId: string): Promise<StorageVersionMigrationInfo[]> =>
    ipcRenderer.invoke('k7s:list-storageversionmigrations', contextId),
  listPodDisruptionBudgets: (contextId: string, namespace?: string): Promise<PodDisruptionBudgetInfo[]> =>
    ipcRenderer.invoke('k7s:list-poddisruptionbudgets', contextId, namespace),
  listResourceQuotas: (contextId: string, namespace?: string): Promise<ResourceQuotaInfo[]> =>
    ipcRenderer.invoke('k7s:list-resourcequotas', contextId, namespace),
  listLimitRanges: (contextId: string, namespace?: string): Promise<LimitRangeInfo[]> =>
    ipcRenderer.invoke('k7s:list-limitranges', contextId, namespace),
  listLeases: (contextId: string, namespace?: string): Promise<LeaseInfo[]> =>
    ipcRenderer.invoke('k7s:list-leases', contextId, namespace),
  listLeaseCandidates: (contextId: string, namespace?: string): Promise<LeaseCandidateInfo[]> =>
    ipcRenderer.invoke('k7s:list-leasecandidates', contextId, namespace),
  listPriorityClasses: (contextId: string): Promise<PriorityClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-priorityclasses', contextId),
  listRuntimeClasses: (contextId: string): Promise<RuntimeClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-runtimeclasses', contextId),
  listPersistentVolumes: (contextId: string): Promise<PersistentVolumeInfo[]> =>
    ipcRenderer.invoke('k7s:list-persistentvolumes', contextId),
  listPersistentVolumeClaims: (contextId: string, namespace?: string): Promise<PersistentVolumeClaimInfo[]> =>
    ipcRenderer.invoke('k7s:list-persistentvolumeclaims', contextId, namespace),
  listStorageClasses: (contextId: string): Promise<StorageClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-storageclasses', contextId),
  listVolumeAttributesClasses: (contextId: string): Promise<VolumeAttributesClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-volumeattributesclasses', contextId),
  listCSIDrivers: (contextId: string): Promise<CSIDriverInfo[]> =>
    ipcRenderer.invoke('k7s:list-csidrivers', contextId),
  listCSINodes: (contextId: string): Promise<CSINodeInfo[]> =>
    ipcRenderer.invoke('k7s:list-csinodes', contextId),
  listVolumeAttachments: (contextId: string): Promise<VolumeAttachmentInfo[]> =>
    ipcRenderer.invoke('k7s:list-volumeattachments', contextId),
  listCSIStorageCapacities: (contextId: string, namespace?: string): Promise<CSIStorageCapacityInfo[]> =>
    ipcRenderer.invoke('k7s:list-csistoragecapacities', contextId, namespace),
  listVolumeSnapshotClasses: (contextId: string): Promise<VolumeSnapshotClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-volumesnapshotclasses', contextId),
  listVolumeSnapshots: (contextId: string, namespace?: string): Promise<VolumeSnapshotInfo[]> =>
    ipcRenderer.invoke('k7s:list-volumesnapshots', contextId, namespace),
  listVolumeSnapshotContents: (contextId: string): Promise<VolumeSnapshotContentInfo[]> =>
    ipcRenderer.invoke('k7s:list-volumesnapshotcontents', contextId),
  listGatewayClasses: (contextId: string): Promise<GatewayClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-gatewayclasses', contextId),
  listGateways: (contextId: string, namespace?: string): Promise<GatewayInfo[]> =>
    ipcRenderer.invoke('k7s:list-gateways', contextId, namespace),
  listHTTPRoutes: (contextId: string, namespace?: string): Promise<HTTPRouteInfo[]> =>
    ipcRenderer.invoke('k7s:list-httproutes', contextId, namespace),
  listGRPCRoutes: (contextId: string, namespace?: string): Promise<GRPCRouteInfo[]> =>
    ipcRenderer.invoke('k7s:list-grpcroutes', contextId, namespace),
  listTLSRoutes: (contextId: string, namespace?: string): Promise<TLSRouteInfo[]> =>
    ipcRenderer.invoke('k7s:list-tlsroutes', contextId, namespace),
  listTCPRoutes: (contextId: string, namespace?: string): Promise<TCPRouteInfo[]> =>
    ipcRenderer.invoke('k7s:list-tcproutes', contextId, namespace),
  listUDPRoutes: (contextId: string, namespace?: string): Promise<UDPRouteInfo[]> =>
    ipcRenderer.invoke('k7s:list-udproutes', contextId, namespace),
  listReferenceGrants: (contextId: string, namespace?: string): Promise<ReferenceGrantInfo[]> =>
    ipcRenderer.invoke('k7s:list-referencegrants', contextId, namespace),
  listDeviceClasses: (contextId: string): Promise<DeviceClassInfo[]> =>
    ipcRenderer.invoke('k7s:list-deviceclasses', contextId),
  listResourceClaims: (contextId: string, namespace?: string): Promise<ResourceClaimInfo[]> =>
    ipcRenderer.invoke('k7s:list-resourceclaims', contextId, namespace),
  listResourceClaimTemplates: (contextId: string, namespace?: string): Promise<ResourceClaimTemplateInfo[]> =>
    ipcRenderer.invoke('k7s:list-resourceclaimtemplates', contextId, namespace),
  listResourceSlices: (contextId: string): Promise<ResourceSliceInfo[]> =>
    ipcRenderer.invoke('k7s:list-resourceslices', contextId),
  listDeviceTaintRules: (contextId: string): Promise<DeviceTaintRuleInfo[]> =>
    ipcRenderer.invoke('k7s:list-devicetaintrules', contextId),
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
  listCustomResourceDefinitions: (contextId: string): Promise<CustomResourceDefinitionInfo[]> =>
    ipcRenderer.invoke('k7s:list-customresourcedefinitions', contextId),
  listCustomResourceInstances: (contextId: string, crdName: string, namespace?: string): Promise<CustomResourceInstanceInfo[]> =>
    ipcRenderer.invoke('k7s:list-customresource-instances', contextId, crdName, namespace),
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
  forceDeletePod: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:force-delete-pod', contextId, namespace, name),
  scaleWorkload: (contextId: string, kind: ScaleableWorkloadKind, namespace: string, name: string, replicas: number): Promise<ScaleResult> =>
    ipcRenderer.invoke('k7s:scale-workload', contextId, kind, namespace, name, replicas),
  restartWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:restart-workload', contextId, kind, namespace, name),
  setWorkloadImage: (contextId: string, kind: WorkloadImageKind, namespace: string, name: string, containerName: string, image: string): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:set-workload-image', contextId, kind, namespace, name, containerName, image),
  installOrUpgradeHelmRelease: (contextId: string, request: HelmReleaseUpgradeRequest): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:install-or-upgrade-helm-release', contextId, request),
  addHelmRepository: (contextId: string, name: string, url: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:add-helm-repository', contextId, name, url),
  updateHelmRepository: (contextId: string, name?: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:update-helm-repository', contextId, name),
  removeHelmRepository: (contextId: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:remove-helm-repository', contextId, name),
  rollbackWorkload: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:rollback-workload', contextId, kind, namespace, name),
  rollbackHelmRelease: (contextId: string, namespace: string, name: string, revision?: number): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:rollback-helm-release', contextId, namespace, name, revision),
  rolloutHistory: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:rollout-history', contextId, kind, namespace, name),
  helmReleaseHistory: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-history', contextId, namespace, name),
  helmReleaseStatus: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-status', contextId, namespace, name),
  helmReleaseResources: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-resources', contextId, namespace, name),
  helmReleaseManifest: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-manifest', contextId, namespace, name),
  helmReleaseMetadata: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-metadata', contextId, namespace, name),
  helmReleaseValues: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-values', contextId, namespace, name),
  helmReleaseNotes: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-notes', contextId, namespace, name),
  helmReleaseHooks: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-hooks', contextId, namespace, name),
  helmReleaseAll: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:helm-release-all', contextId, namespace, name),
  rolloutStatus: (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:rollout-status', contextId, kind, namespace, name),
  testHelmRelease: (contextId: string, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:test-helm-release', contextId, namespace, name),
  uninstallHelmRelease: (contextId: string, namespace: string, name: string): Promise<DeleteResult> =>
    ipcRenderer.invoke('k7s:uninstall-helm-release', contextId, namespace, name),
  pauseWorkload: (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:pause-workload', contextId, kind, namespace, name),
  resumeWorkload: (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string): Promise<RolloutResult> =>
    ipcRenderer.invoke('k7s:resume-workload', contextId, kind, namespace, name),
  updateJobSuspension: (
    contextId: string,
    kind: JobSuspensionKind,
    namespace: string,
    name: string,
    suspend: boolean,
  ): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:update-job-suspension', contextId, kind, namespace, name, suspend),

  // YAML operations
  applyYaml: (contextId: string, yaml: string): Promise<CreateResult> =>
    ipcRenderer.invoke('k7s:apply-yaml', contextId, yaml),
  diffYaml: (contextId: string, yaml: string): Promise<string> =>
    ipcRenderer.invoke('k7s:diff-yaml', contextId, yaml),
  getResourceYaml: (contextId: string, kind: string, namespace: string, name: string): Promise<string> =>
    ipcRenderer.invoke('k7s:get-resource-yaml', contextId, kind, namespace, name),
  describeResource: (contextId: string, kind: string, namespace: string, name: string): Promise<string> =>
    ipcRenderer.invoke('k7s:describe-resource', contextId, kind, namespace, name),
  mutateResourceMetadata: (
    contextId: string,
    kind: string,
    namespace: string,
    name: string,
    field: 'labels' | 'annotations',
    key: string,
    value: string,
    remove: boolean
  ): Promise<UpdateResult> =>
    ipcRenderer.invoke('k7s:mutate-resource-metadata', contextId, kind, namespace, name, field, key, value, remove),
  getCustomResourceInstanceYaml: (contextId: string, crdName: string, namespace: string, name: string): Promise<string> =>
    ipcRenderer.invoke('k7s:get-customresource-instance-yaml', contextId, crdName, namespace, name),

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
