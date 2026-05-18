// API provider that works in both Electron and Web modes
// Detects the environment and uses the appropriate API

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
  PausableWorkloadKind,
  PodCertificateRequestInfo,
  ClusterTrustBundleInfo,
  ComponentStatusInfo,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapInfo,
  ConfigMapFormData,
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
  OpenIDConfigurationInfo,
  PortForwardRequest,
  PortForwardResult,
  PortForwardSessionInfo,
  ScaleResult,
  ScaleableWorkloadKind,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
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
} from '../../../shared/types'
import { wsClient } from './webSocketClient'

// Detect if we're in Electron mode
const isElectronMode = typeof window !== 'undefined' && 'k7s' in window

// Get the appropriate API
const electronApi = isElectronMode ? window.k7s : null
const electronTermApi = isElectronMode ? window.k8sTerm : undefined

const terminalDataListeners = new Set<(data: string) => void>()
const terminalExitListeners = new Set<(exitCode: number) => void>()
let terminalBridgeInitialized = false

const reportTerminalError = (error: unknown) => {
  console.error('Terminal operation failed:', error)
}

const ensureWebTerminalBridge = () => {
  if (terminalBridgeInitialized) return
  terminalBridgeInitialized = true

  wsClient.onEvent('terminal:data', (data) => {
    for (const listener of terminalDataListeners) {
      listener(String(data ?? ''))
    }
  })

  wsClient.onEvent('terminal:exit', (exitCode) => {
    const normalizedExitCode = Number(exitCode)
    for (const listener of terminalExitListeners) {
      listener(Number.isFinite(normalizedExitCode) ? normalizedExitCode : -1)
    }
  })
}

const webTerminalApi: K8sTermApi | undefined = typeof window === 'undefined' || isElectronMode
  ? undefined
  : {
      create: (contextId: string) => (
        wsClient.createTerminal(contextId) as Promise<{ shell: string; cwd: string }>
      ),
      write: (data: string) => {
        void wsClient.writeTerminal(data).catch(reportTerminalError)
      },
      resize: (cols: number, rows: number) => {
        void wsClient.resizeTerminal(cols, rows).catch(reportTerminalError)
      },
      destroy: () => {
        void wsClient.destroyTerminal().catch(reportTerminalError)
      },
      onData: (callback: (data: string) => void) => {
        ensureWebTerminalBridge()
        terminalDataListeners.clear()
        terminalDataListeners.add(callback)
      },
      onExit: (callback: (exitCode: number) => void) => {
        ensureWebTerminalBridge()
        terminalExitListeners.clear()
        terminalExitListeners.add(callback)
      },
    }

export const terminalApi = electronTermApi ?? webTerminalApi

type BrowserKubeconfigFile = {
  sourceName: string
  content: string
}

type WindowWithFilePicker = Window & {
  showOpenFilePicker?: (options?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>
}

const KUBECONFIG_FILE_PICKER_OPTIONS = {
  multiple: false,
  types: [{
    description: 'Kubeconfig',
    accept: {
      'text/yaml': ['.yaml', '.yml'],
      'text/plain': ['.conf', '.config', '.txt'],
    },
  }],
}

const readKubeconfigFile = async (file: File): Promise<BrowserKubeconfigFile> => ({
  sourceName: file.name || 'kubeconfig.yaml',
  content: await file.text(),
})

const selectKubeconfigFromBrowser = async (): Promise<BrowserKubeconfigFile | null> => {
  if (typeof window === 'undefined') return null

  const filePicker = (window as WindowWithFilePicker).showOpenFilePicker
  if (filePicker) {
    try {
      const [handle] = await filePicker(KUBECONFIG_FILE_PICKER_OPTIONS)
      if (!handle) throw new Error('未选择 kubeconfig 文件')
      return readKubeconfigFile(await handle.getFile())
    } catch (error) {
      if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('未选择 kubeconfig 文件')
      }
      throw error
    }
  }

  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    let settled = false

    const cleanup = () => {
      window.removeEventListener('focus', handleFocus)
      input.remove()
    }

    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      callback()
    }

    const rejectCancel = () => settle(() => reject(new Error('未选择 kubeconfig 文件')))

    const handleFocus = () => {
      window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          rejectCancel()
        }
      }, 300)
    }

    input.type = 'file'
    input.accept = '.yaml,.yml,.conf,.config,.txt'
    input.style.display = 'none'
    input.addEventListener('cancel', rejectCancel)
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) {
        rejectCancel()
        return
      }
      void readKubeconfigFile(file)
        .then((result) => settle(() => resolve(result)))
        .catch((error) => settle(() => reject(error)))
    })

    const parent = document.body ?? document.documentElement
    if (!parent) {
      rejectCancel()
      return
    }

    window.addEventListener('focus', handleFocus, { once: true })
    parent.appendChild(input)
    input.click()
  })
}

// WebSocket client type for web mode
interface WebSocketApi {
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
    suspend: boolean,
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
  onPushEvent: (listener: (event: K7sPushEvent) => void) => () => void
}

export type { WebSocketApi }

const pushListeners = new Set<(event: K7sPushEvent) => void>()
let pushBridgeInitialized = false

const dispatchPushEvent = (event: K7sPushEvent) => {
  for (const listener of pushListeners) {
    listener(event)
  }
}

const ensurePushBridge = () => {
  if (pushBridgeInitialized) return
  pushBridgeInitialized = true

  if (electronApi) {
    electronApi.onPushEvent(dispatchPushEvent)
    return
  }

  wsClient.onEvent('k7s:push-event', (event) => {
    dispatchPushEvent(event as K7sPushEvent)
  })
}

// The API interface exposed to the app
export const k8sApi: WebSocketApi = {
  listContexts: async () => {
    if (electronApi) return electronApi.listContexts()
    return wsClient.listContexts() as Promise<ContextRecord[]>
  },

  useKubeContext: async (contextId: string) => {
    if (electronApi) return electronApi.useKubeContext(contextId)
    return wsClient.useKubeContext(contextId) as Promise<ContextRecord[]>
  },

  setKubeContextNamespace: async (contextId: string, namespace: string) => {
    if (electronApi) return electronApi.setKubeContextNamespace(contextId, namespace)
    return wsClient.setKubeContextNamespace(contextId, namespace) as Promise<ContextRecord[]>
  },

  listNamespaces: async (contextId: string) => {
    if (electronApi) return electronApi.listNamespaces(contextId)
    return wsClient.listNamespaces(contextId) as Promise<NamespaceInfo[]>
  },

  listComponentStatuses: async (contextId: string) => {
    if (electronApi) return electronApi.listComponentStatuses(contextId)
    return wsClient.listComponentStatuses(contextId) as Promise<ComponentStatusInfo[]>
  },

  listAPIGroups: async (contextId: string) => {
    if (electronApi) return electronApi.listAPIGroups(contextId)
    return wsClient.listAPIGroups(contextId) as Promise<APIGroupInfo[]>
  },

  listAPIResources: async (contextId: string) => {
    if (electronApi) return electronApi.listAPIResources(contextId)
    return wsClient.listAPIResources(contextId) as Promise<APIResourceInfo[]>
  },

  listServerVersions: async (contextId: string) => {
    if (electronApi) return electronApi.listServerVersions(contextId)
    return wsClient.listServerVersions(contextId) as Promise<ServerVersionInfo[]>
  },

  listOpenIDConfigurations: async (contextId: string) => {
    if (electronApi) return electronApi.listOpenIDConfigurations(contextId)
    return wsClient.listOpenIDConfigurations(contextId) as Promise<OpenIDConfigurationInfo[]>
  },

  listAPIServerHealth: async (contextId: string) => {
    if (electronApi) return electronApi.listAPIServerHealth(contextId)
    return wsClient.listAPIServerHealth(contextId) as Promise<APIServerHealthInfo[]>
  },

  listSelfSubjectReviews: async (contextId: string) => {
    if (electronApi) return electronApi.listSelfSubjectReviews(contextId)
    return wsClient.listSelfSubjectReviews(contextId) as Promise<SelfSubjectReviewInfo[]>
  },

  listSelfSubjectAccessReviews: async (contextId: string, namespaces?: string | string[]) => {
    if (electronApi) return electronApi.listSelfSubjectAccessReviews(contextId, namespaces)
    return wsClient.listSelfSubjectAccessReviews(contextId, namespaces) as Promise<SelfSubjectAccessReviewInfo[]>
  },

  checkCanI: async (contextId: string, request: CanIReviewRequest) => {
    if (electronApi) return electronApi.checkCanI(contextId, request)
    return wsClient.checkCanI(contextId, request) as Promise<SelfSubjectAccessReviewInfo>
  },

  listSelfSubjectRulesReviews: async (contextId: string, namespaces?: string | string[]) => {
    if (electronApi) return electronApi.listSelfSubjectRulesReviews(contextId, namespaces)
    return wsClient.listSelfSubjectRulesReviews(contextId, namespaces) as Promise<SelfSubjectRuleInfo[]>
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

  listReplicationControllers: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listReplicationControllers(contextId, namespace)
    return wsClient.listReplicationControllers(contextId, namespace) as Promise<ReplicationControllerInfo[]>
  },

  getReplicationControllerDetail: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getReplicationControllerDetail(contextId, namespace, name)
    return wsClient.getReplicationControllerDetail(contextId, namespace, name) as Promise<ReplicationControllerInfo>
  },

  listControllerRevisions: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listControllerRevisions(contextId, namespace)
    return wsClient.listControllerRevisions(contextId, namespace) as Promise<ControllerRevisionInfo[]>
  },

  listPodTemplates: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listPodTemplates(contextId, namespace)
    return wsClient.listPodTemplates(contextId, namespace) as Promise<PodTemplateInfo[]>
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

  listEndpoints: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listEndpoints(contextId, namespace)
    return wsClient.listEndpoints(contextId, namespace) as Promise<EndpointInfo[]>
  },

  listIngresses: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listIngresses(contextId, namespace)
    return wsClient.listIngresses(contextId, namespace) as Promise<IngressInfo[]>
  },

  listIngressClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listIngressClasses(contextId)
    return wsClient.listIngressClasses(contextId) as Promise<IngressClassInfo[]>
  },

  listHelmReleases: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listHelmReleases(contextId, namespace)
    return wsClient.listHelmReleases(contextId, namespace) as Promise<HelmReleaseInfo[]>
  },

  listHelmCharts: async (contextId: string) => {
    if (electronApi) return electronApi.listHelmCharts(contextId)
    return wsClient.listHelmCharts(contextId) as Promise<HelmChartInfo[]>
  },

  listHelmRepositories: async (contextId: string) => {
    if (electronApi) return electronApi.listHelmRepositories(contextId)
    return wsClient.listHelmRepositories(contextId) as Promise<HelmRepositoryInfo[]>
  },

  listNetworkPolicies: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listNetworkPolicies(contextId, namespace)
    return wsClient.listNetworkPolicies(contextId, namespace) as Promise<NetworkPolicyInfo[]>
  },

  listIPAddresses: async (contextId: string) => {
    if (electronApi) return electronApi.listIPAddresses(contextId)
    return wsClient.listIPAddresses(contextId) as Promise<IPAddressInfo[]>
  },

  listServiceCIDRs: async (contextId: string) => {
    if (electronApi) return electronApi.listServiceCIDRs(contextId)
    return wsClient.listServiceCIDRs(contextId) as Promise<ServiceCIDRInfo[]>
  },

  listEndpointSlices: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listEndpointSlices(contextId, namespace)
    return wsClient.listEndpointSlices(contextId, namespace) as Promise<EndpointSliceInfo[]>
  },

  listAPIServices: async (contextId: string) => {
    if (electronApi) return electronApi.listAPIServices(contextId)
    return wsClient.listAPIServices(contextId) as Promise<APIServiceInfo[]>
  },

  listMutatingWebhookConfigurations: async (contextId: string) => {
    if (electronApi) return electronApi.listMutatingWebhookConfigurations(contextId)
    return wsClient.listMutatingWebhookConfigurations(contextId) as Promise<AdmissionWebhookConfigurationInfo[]>
  },

  listValidatingWebhookConfigurations: async (contextId: string) => {
    if (electronApi) return electronApi.listValidatingWebhookConfigurations(contextId)
    return wsClient.listValidatingWebhookConfigurations(contextId) as Promise<AdmissionWebhookConfigurationInfo[]>
  },

  listMutatingAdmissionPolicies: async (contextId: string) => {
    if (electronApi) return electronApi.listMutatingAdmissionPolicies(contextId)
    return wsClient.listMutatingAdmissionPolicies(contextId) as Promise<MutatingAdmissionPolicyInfo[]>
  },

  listMutatingAdmissionPolicyBindings: async (contextId: string) => {
    if (electronApi) return electronApi.listMutatingAdmissionPolicyBindings(contextId)
    return wsClient.listMutatingAdmissionPolicyBindings(contextId) as Promise<MutatingAdmissionPolicyBindingInfo[]>
  },

  listValidatingAdmissionPolicies: async (contextId: string) => {
    if (electronApi) return electronApi.listValidatingAdmissionPolicies(contextId)
    return wsClient.listValidatingAdmissionPolicies(contextId) as Promise<ValidatingAdmissionPolicyInfo[]>
  },

  listValidatingAdmissionPolicyBindings: async (contextId: string) => {
    if (electronApi) return electronApi.listValidatingAdmissionPolicyBindings(contextId)
    return wsClient.listValidatingAdmissionPolicyBindings(contextId) as Promise<ValidatingAdmissionPolicyBindingInfo[]>
  },

  listFlowSchemas: async (contextId: string) => {
    if (electronApi) return electronApi.listFlowSchemas(contextId)
    return wsClient.listFlowSchemas(contextId) as Promise<FlowSchemaInfo[]>
  },

  listPriorityLevelConfigurations: async (contextId: string) => {
    if (electronApi) return electronApi.listPriorityLevelConfigurations(contextId)
    return wsClient.listPriorityLevelConfigurations(contextId) as Promise<PriorityLevelConfigurationInfo[]>
  },

  listCertificateSigningRequests: async (contextId: string) => {
    if (electronApi) return electronApi.listCertificateSigningRequests(contextId)
    return wsClient.listCertificateSigningRequests(contextId) as Promise<CertificateSigningRequestInfo[]>
  },

  updateCertificateSigningRequestApproval: async (
    contextId: string,
    name: string,
    decision: CertificateSigningRequestDecision,
  ) => {
    if (electronApi) return electronApi.updateCertificateSigningRequestApproval(contextId, name, decision)
    return wsClient.updateCertificateSigningRequestApproval(contextId, name, decision) as Promise<UpdateResult>
  },

  listClusterTrustBundles: async (contextId: string) => {
    if (electronApi) return electronApi.listClusterTrustBundles(contextId)
    return wsClient.listClusterTrustBundles(contextId) as Promise<ClusterTrustBundleInfo[]>
  },

  listPodCertificateRequests: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listPodCertificateRequests(contextId, namespace)
    return wsClient.listPodCertificateRequests(contextId, namespace) as Promise<PodCertificateRequestInfo[]>
  },

  listStorageVersions: async (contextId: string) => {
    if (electronApi) return electronApi.listStorageVersions(contextId)
    return wsClient.listStorageVersions(contextId) as Promise<StorageVersionInfo[]>
  },

  listStorageVersionMigrations: async (contextId: string) => {
    if (electronApi) return electronApi.listStorageVersionMigrations(contextId)
    return wsClient.listStorageVersionMigrations(contextId) as Promise<StorageVersionMigrationInfo[]>
  },

  listPodDisruptionBudgets: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listPodDisruptionBudgets(contextId, namespace)
    return wsClient.listPodDisruptionBudgets(contextId, namespace) as Promise<PodDisruptionBudgetInfo[]>
  },

  listResourceQuotas: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listResourceQuotas(contextId, namespace)
    return wsClient.listResourceQuotas(contextId, namespace) as Promise<ResourceQuotaInfo[]>
  },

  listLimitRanges: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listLimitRanges(contextId, namespace)
    return wsClient.listLimitRanges(contextId, namespace) as Promise<LimitRangeInfo[]>
  },

  listLeases: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listLeases(contextId, namespace)
    return wsClient.listLeases(contextId, namespace) as Promise<LeaseInfo[]>
  },

  listLeaseCandidates: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listLeaseCandidates(contextId, namespace)
    return wsClient.listLeaseCandidates(contextId, namespace) as Promise<LeaseCandidateInfo[]>
  },

  listPriorityClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listPriorityClasses(contextId)
    return wsClient.listPriorityClasses(contextId) as Promise<PriorityClassInfo[]>
  },

  listRuntimeClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listRuntimeClasses(contextId)
    return wsClient.listRuntimeClasses(contextId) as Promise<RuntimeClassInfo[]>
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

  listVolumeAttributesClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listVolumeAttributesClasses(contextId)
    return wsClient.listVolumeAttributesClasses(contextId) as Promise<VolumeAttributesClassInfo[]>
  },

  listCSIDrivers: async (contextId: string) => {
    if (electronApi) return electronApi.listCSIDrivers(contextId)
    return wsClient.listCSIDrivers(contextId) as Promise<CSIDriverInfo[]>
  },

  listCSINodes: async (contextId: string) => {
    if (electronApi) return electronApi.listCSINodes(contextId)
    return wsClient.listCSINodes(contextId) as Promise<CSINodeInfo[]>
  },

  listVolumeAttachments: async (contextId: string) => {
    if (electronApi) return electronApi.listVolumeAttachments(contextId)
    return wsClient.listVolumeAttachments(contextId) as Promise<VolumeAttachmentInfo[]>
  },

  listCSIStorageCapacities: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listCSIStorageCapacities(contextId, namespace)
    return wsClient.listCSIStorageCapacities(contextId, namespace) as Promise<CSIStorageCapacityInfo[]>
  },

  listVolumeSnapshotClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listVolumeSnapshotClasses(contextId)
    return wsClient.listVolumeSnapshotClasses(contextId) as Promise<VolumeSnapshotClassInfo[]>
  },

  listVolumeSnapshots: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listVolumeSnapshots(contextId, namespace)
    return wsClient.listVolumeSnapshots(contextId, namespace) as Promise<VolumeSnapshotInfo[]>
  },

  listVolumeSnapshotContents: async (contextId: string) => {
    if (electronApi) return electronApi.listVolumeSnapshotContents(contextId)
    return wsClient.listVolumeSnapshotContents(contextId) as Promise<VolumeSnapshotContentInfo[]>
  },

  listGatewayClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listGatewayClasses(contextId)
    return wsClient.listGatewayClasses(contextId) as Promise<GatewayClassInfo[]>
  },

  listGateways: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listGateways(contextId, namespace)
    return wsClient.listGateways(contextId, namespace) as Promise<GatewayInfo[]>
  },

  listHTTPRoutes: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listHTTPRoutes(contextId, namespace)
    return wsClient.listHTTPRoutes(contextId, namespace) as Promise<HTTPRouteInfo[]>
  },

  listGRPCRoutes: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listGRPCRoutes(contextId, namespace)
    return wsClient.listGRPCRoutes(contextId, namespace) as Promise<GRPCRouteInfo[]>
  },

  listTLSRoutes: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listTLSRoutes(contextId, namespace)
    return wsClient.listTLSRoutes(contextId, namespace) as Promise<TLSRouteInfo[]>
  },

  listTCPRoutes: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listTCPRoutes(contextId, namespace)
    return wsClient.listTCPRoutes(contextId, namespace) as Promise<TCPRouteInfo[]>
  },

  listUDPRoutes: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listUDPRoutes(contextId, namespace)
    return wsClient.listUDPRoutes(contextId, namespace) as Promise<UDPRouteInfo[]>
  },

  listReferenceGrants: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listReferenceGrants(contextId, namespace)
    return wsClient.listReferenceGrants(contextId, namespace) as Promise<ReferenceGrantInfo[]>
  },

  listDeviceClasses: async (contextId: string) => {
    if (electronApi) return electronApi.listDeviceClasses(contextId)
    return wsClient.listDeviceClasses(contextId) as Promise<DeviceClassInfo[]>
  },

  listResourceClaims: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listResourceClaims(contextId, namespace)
    return wsClient.listResourceClaims(contextId, namespace) as Promise<ResourceClaimInfo[]>
  },

  listResourceClaimTemplates: async (contextId: string, namespace?: string) => {
    if (electronApi) return electronApi.listResourceClaimTemplates(contextId, namespace)
    return wsClient.listResourceClaimTemplates(contextId, namespace) as Promise<ResourceClaimTemplateInfo[]>
  },

  listResourceSlices: async (contextId: string) => {
    if (electronApi) return electronApi.listResourceSlices(contextId)
    return wsClient.listResourceSlices(contextId) as Promise<ResourceSliceInfo[]>
  },

  listDeviceTaintRules: async (contextId: string) => {
    if (electronApi) return electronApi.listDeviceTaintRules(contextId)
    return wsClient.listDeviceTaintRules(contextId) as Promise<DeviceTaintRuleInfo[]>
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

  listCustomResourceDefinitions: async (contextId: string) => {
    if (electronApi) return electronApi.listCustomResourceDefinitions(contextId)
    return wsClient.listCustomResourceDefinitions(contextId) as Promise<CustomResourceDefinitionInfo[]>
  },

  listCustomResourceInstances: async (contextId: string, crdName: string, namespace?: string) => {
    if (electronApi) return electronApi.listCustomResourceInstances(contextId, crdName, namespace)
    return wsClient.listCustomResourceInstances(contextId, crdName, namespace) as Promise<CustomResourceInstanceInfo[]>
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
    const selectedFile = await selectKubeconfigFromBrowser()
    if (!selectedFile) return wsClient.addKubeconfigFile() as Promise<AddContextsResult>
    return wsClient.addKubeconfigFile(selectedFile.sourceName, selectedFile.content) as Promise<AddContextsResult>
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

  updateAppTheme: async (theme: AppThemeName) => {
    if (electronApi) return electronApi.updateAppTheme(theme)
    return wsClient.updateAppTheme(theme) as Promise<ContextPrefs>
  },

  deletePod: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deletePod(contextId, namespace, name)
    return wsClient.deletePod(contextId, namespace, name) as Promise<DeleteResult>
  },

  evictPod: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.evictPod(contextId, namespace, name)
    return wsClient.evictPod(contextId, namespace, name) as Promise<DeleteResult>
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

  triggerCronJob: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.triggerCronJob(contextId, namespace, name)
    return wsClient.triggerCronJob(contextId, namespace, name) as Promise<CreateResult>
  },

  deleteNamespace: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.deleteNamespace(contextId, name)
    return wsClient.deleteNamespace(contextId, name) as Promise<DeleteResult>
  },

  cordonNode: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.cordonNode(contextId, name)
    return wsClient.cordonNode(contextId, name) as Promise<UpdateResult>
  },

  uncordonNode: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.uncordonNode(contextId, name)
    return wsClient.uncordonNode(contextId, name) as Promise<UpdateResult>
  },

  drainNode: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.drainNode(contextId, name)
    return wsClient.drainNode(contextId, name) as Promise<UpdateResult>
  },

  deleteNode: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.deleteNode(contextId, name)
    return wsClient.deleteNode(contextId, name) as Promise<DeleteResult>
  },

  deleteCustomResourceDefinition: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.deleteCustomResourceDefinition(contextId, name)
    return wsClient.deleteCustomResourceDefinition(contextId, name) as Promise<DeleteResult>
  },

  deleteCustomResourceInstance: async (contextId: string, crdName: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteCustomResourceInstance(contextId, crdName, namespace, name)
    return wsClient.deleteCustomResourceInstance(contextId, crdName, namespace, name) as Promise<DeleteResult>
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

  getPodLogs: async (contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number, previous?: boolean, timestamps?: boolean) => {
    if (electronApi) {
      return previous === undefined && timestamps === undefined
        ? electronApi.getPodLogs(contextId, namespace, podName, containerName, tailLines)
        : electronApi.getPodLogs(contextId, namespace, podName, containerName, tailLines, previous, timestamps)
    }
    return wsClient.getPodLogs(contextId, namespace, podName, containerName, tailLines, previous, timestamps) as Promise<string>
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

  deleteResource: async (contextId: string, kind: KubernetesResourceKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.deleteResource(contextId, kind, namespace, name)
    return wsClient.deleteResource(contextId, kind, namespace, name) as Promise<DeleteResult>
  },

  forceDeletePod: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.forceDeletePod(contextId, namespace, name)
    return wsClient.forceDeletePod(contextId, namespace, name) as Promise<DeleteResult>
  },

  scaleWorkload: async (contextId: string, kind: ScaleableWorkloadKind, namespace: string, name: string, replicas: number) => {
    if (electronApi) return electronApi.scaleWorkload(contextId, kind, namespace, name, replicas)
    return wsClient.scaleWorkload(contextId, kind, namespace, name, replicas) as Promise<ScaleResult>
  },

  restartWorkload: async (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.restartWorkload(contextId, kind, namespace, name)
    return wsClient.restartWorkload(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  setWorkloadImage: async (contextId: string, kind: WorkloadImageKind, namespace: string, name: string, containerName: string, image: string) => {
    if (electronApi) return electronApi.setWorkloadImage(contextId, kind, namespace, name, containerName, image)
    return wsClient.setWorkloadImage(contextId, kind, namespace, name, containerName, image) as Promise<UpdateResult>
  },

  installOrUpgradeHelmRelease: async (contextId: string, request: HelmReleaseUpgradeRequest) => {
    if (electronApi) return electronApi.installOrUpgradeHelmRelease(contextId, request)
    return wsClient.installOrUpgradeHelmRelease(contextId, request) as Promise<RolloutResult>
  },

  addHelmRepository: async (contextId: string, name: string, url: string) => {
    if (electronApi) return electronApi.addHelmRepository(contextId, name, url)
    return wsClient.addHelmRepository(contextId, name, url) as Promise<RolloutResult>
  },

  updateHelmRepository: async (contextId: string, name?: string) => {
    if (electronApi) return electronApi.updateHelmRepository(contextId, name)
    return wsClient.updateHelmRepository(contextId, name) as Promise<RolloutResult>
  },

  removeHelmRepository: async (contextId: string, name: string) => {
    if (electronApi) return electronApi.removeHelmRepository(contextId, name)
    return wsClient.removeHelmRepository(contextId, name) as Promise<DeleteResult>
  },

  rollbackWorkload: async (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.rollbackWorkload(contextId, kind, namespace, name)
    return wsClient.rollbackWorkload(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  rollbackHelmRelease: async (contextId: string, namespace: string, name: string, revision?: number) => {
    if (electronApi) return electronApi.rollbackHelmRelease(contextId, namespace, name, revision)
    return wsClient.rollbackHelmRelease(contextId, namespace, name, revision) as Promise<RolloutResult>
  },

  rolloutHistory: async (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.rolloutHistory(contextId, kind, namespace, name)
    return wsClient.rolloutHistory(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseHistory: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseHistory(contextId, namespace, name)
    return wsClient.helmReleaseHistory(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseStatus: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseStatus(contextId, namespace, name)
    return wsClient.helmReleaseStatus(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseResources: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseResources(contextId, namespace, name)
    return wsClient.helmReleaseResources(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseManifest: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseManifest(contextId, namespace, name)
    return wsClient.helmReleaseManifest(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseMetadata: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseMetadata(contextId, namespace, name)
    return wsClient.helmReleaseMetadata(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseValues: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseValues(contextId, namespace, name)
    return wsClient.helmReleaseValues(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseNotes: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseNotes(contextId, namespace, name)
    return wsClient.helmReleaseNotes(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseHooks: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseHooks(contextId, namespace, name)
    return wsClient.helmReleaseHooks(contextId, namespace, name) as Promise<RolloutResult>
  },

  helmReleaseAll: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.helmReleaseAll(contextId, namespace, name)
    return wsClient.helmReleaseAll(contextId, namespace, name) as Promise<RolloutResult>
  },

  rolloutStatus: async (contextId: string, kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.rolloutStatus(contextId, kind, namespace, name)
    return wsClient.rolloutStatus(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  testHelmRelease: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.testHelmRelease(contextId, namespace, name)
    return wsClient.testHelmRelease(contextId, namespace, name) as Promise<RolloutResult>
  },

  uninstallHelmRelease: async (contextId: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.uninstallHelmRelease(contextId, namespace, name)
    return wsClient.uninstallHelmRelease(contextId, namespace, name) as Promise<DeleteResult>
  },

  pauseWorkload: async (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.pauseWorkload(contextId, kind, namespace, name)
    return wsClient.pauseWorkload(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  resumeWorkload: async (contextId: string, kind: PausableWorkloadKind, namespace: string, name: string) => {
    if (electronApi) return electronApi.resumeWorkload(contextId, kind, namespace, name)
    return wsClient.resumeWorkload(contextId, kind, namespace, name) as Promise<RolloutResult>
  },

  updateJobSuspension: async (
    contextId: string,
    kind: JobSuspensionKind,
    namespace: string,
    name: string,
    suspend: boolean,
  ) => {
    if (electronApi) return electronApi.updateJobSuspension(contextId, kind, namespace, name, suspend)
    return wsClient.updateJobSuspension(contextId, kind, namespace, name, suspend) as Promise<UpdateResult>
  },

  applyYaml: async (contextId: string, yaml: string) => {
    if (electronApi) return electronApi.applyYaml(contextId, yaml)
    return wsClient.applyYaml(contextId, yaml) as Promise<CreateResult>
  },

  diffYaml: async (contextId: string, yaml: string) => {
    if (electronApi) return electronApi.diffYaml(contextId, yaml)
    return wsClient.diffYaml(contextId, yaml) as Promise<string>
  },

  getResourceYaml: async (contextId: string, kind: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getResourceYaml(contextId, kind, namespace, name)
    return wsClient.getResourceYaml(contextId, kind, namespace, name) as Promise<string>
  },

  describeResource: async (contextId: string, kind: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.describeResource(contextId, kind, namespace, name)
    return wsClient.describeResource(contextId, kind, namespace, name) as Promise<string>
  },

  mutateResourceMetadata: async (
    contextId: string,
    kind: string,
    namespace: string,
    name: string,
    field: MetadataField,
    key: string,
    value: string,
    remove: boolean,
  ) => {
    if (electronApi) return electronApi.mutateResourceMetadata(contextId, kind, namespace, name, field, key, value, remove)
    return wsClient.mutateResourceMetadata(contextId, kind, namespace, name, field, key, value, remove) as Promise<UpdateResult>
  },

  getCustomResourceInstanceYaml: async (contextId: string, crdName: string, namespace: string, name: string) => {
    if (electronApi) return electronApi.getCustomResourceInstanceYaml(contextId, crdName, namespace, name)
    return wsClient.getCustomResourceInstanceYaml(contextId, crdName, namespace, name) as Promise<string>
  },

  startPodLogStream: async (contextId: string, request: PodLogStreamRequest) => {
    if (electronApi) return electronApi.startPodLogStream(contextId, request)
    return wsClient.startPodLogStream(contextId, request) as Promise<PodLogStreamResult>
  },

  stopPodLogStream: async (streamId: string) => {
    if (electronApi) return electronApi.stopPodLogStream(streamId)
    return wsClient.stopPodLogStream(streamId) as Promise<{ success: boolean }>
  },

  startPodExec: async (contextId: string, request: PodExecData) => {
    if (electronApi) return electronApi.startPodExec(contextId, request)
    return wsClient.startPodExec(contextId, request) as Promise<PodExecResult>
  },

  stopPodExec: async (sessionId: string) => {
    if (electronApi) return electronApi.stopPodExec(sessionId)
    return wsClient.stopPodExec(sessionId) as Promise<{ success: boolean }>
  },

  startPortForward: async (contextId: string, request: PortForwardRequest) => {
    if (electronApi) return electronApi.startPortForward(contextId, request)
    return wsClient.startPortForward(contextId, request) as Promise<PortForwardResult>
  },

  listPortForwards: async () => {
    if (electronApi) return electronApi.listPortForwards()
    return wsClient.listPortForwards() as Promise<PortForwardSessionInfo[]>
  },

  stopPortForward: async (sessionId: string) => {
    if (electronApi) return electronApi.stopPortForward(sessionId)
    return wsClient.stopPortForward(sessionId) as Promise<{ success: boolean }>
  },

  subscribeWatch: async (contextId: string) => {
    if (electronApi) return electronApi.subscribeWatch(contextId)
    return wsClient.subscribeWatch(contextId) as Promise<{ success: boolean }>
  },

  unsubscribeWatch: async () => {
    if (electronApi) return electronApi.unsubscribeWatch()
    return wsClient.unsubscribeWatch() as Promise<{ success: boolean }>
  },

  onPushEvent: (listener) => {
    ensurePushBridge()
    pushListeners.add(listener)
    return () => {
      pushListeners.delete(listener)
    }
  }
}

export const isWebMode = !isElectronMode
export { wsClient }
