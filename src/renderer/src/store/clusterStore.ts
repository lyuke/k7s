import { create } from 'zustand'
import type {
  AdmissionWebhookConfigurationInfo,
  APIServerHealthInfo,
  APIGroupInfo,
  APIResourceInfo,
  APIServiceInfo,
  CertificateSigningRequestInfo,
  ClusterHealth,
  ClusterTrustBundleInfo,
  ComponentStatusInfo,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapInfo,
  ContextRecord,
  ControllerRevisionInfo,
  CSIDriverInfo,
  CSIStorageCapacityInfo,
  CSINodeInfo,
  CustomResourceDefinitionInfo,
  CronJobInfo,
  DaemonSetInfo,
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
  HelmChartInfo,
  HelmRepositoryInfo,
  HelmReleaseInfo,
  HTTPRouteInfo,
  HPAInfo,
  IngressClassInfo,
  IngressInfo,
  IPAddressInfo,
  JobInfo,
  LeaseCandidateInfo,
  LeaseInfo,
  LimitRangeInfo,
  NamespaceInfo,
  NetworkPolicyInfo,
  NodeInfo,
  OpenIDConfigurationInfo,
  PodCertificateRequestInfo,
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
  RoleBindingInfo,
  RoleInfo,
  RuntimeClassInfo,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
  SecretInfo,
  SelfSubjectAccessReviewInfo,
  SelfSubjectReviewInfo,
  SelfSubjectRuleInfo,
  ServerVersionInfo,
  ServiceAccountInfo,
  ServiceCIDRInfo,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
  StorageVersionInfo,
  StorageVersionMigrationInfo,
  TCPRouteInfo,
  TLSRouteInfo,
  ValidatingAdmissionPolicyBindingInfo,
  ValidatingAdmissionPolicyInfo,
  UDPRouteInfo,
  VolumeAttachmentInfo,
  VolumeAttributesClassInfo,
  VolumeSnapshotClassInfo,
  VolumeSnapshotContentInfo,
  VolumeSnapshotInfo,
} from '../../../shared/types'
import { k8sApi } from '../api/provider'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const defaultNamespacesForContext = (context?: ContextRecord) => {
  const namespace = context?.namespace?.trim()
  return namespace ? [namespace] : []
}

interface ClusterState {
  // State
  contexts: ContextRecord[]
  selectedId: string
  namespaces: NamespaceInfo[]
  selectedNamespaces: string[]
  componentStatuses: ComponentStatusInfo[]
  apiGroups: APIGroupInfo[]
  apiResources: APIResourceInfo[]
  serverVersions: ServerVersionInfo[]
  openIDConfigurations: OpenIDConfigurationInfo[]
  apiServerHealth: APIServerHealthInfo[]
  selfSubjectReviews: SelfSubjectReviewInfo[]
  selfSubjectAccessReviews: SelfSubjectAccessReviewInfo[]
  selfSubjectRulesReviews: SelfSubjectRuleInfo[]
  nodes: NodeInfo[]
  pods: PodInfo[]
  deployments: DeploymentInfo[]
  daemonSets: DaemonSetInfo[]
  statefulSets: StatefulSetInfo[]
  replicaSets: ReplicaSetInfo[]
  replicationControllers: ReplicationControllerInfo[]
  controllerRevisions: ControllerRevisionInfo[]
  podTemplates: PodTemplateInfo[]
  jobs: JobInfo[]
  cronJobs: CronJobInfo[]
  helmCharts: HelmChartInfo[]
  helmReleases: HelmReleaseInfo[]
  helmRepositories: HelmRepositoryInfo[]
  services: ServiceInfo[]
  configMaps: ConfigMapInfo[]
  secrets: SecretInfo[]
  endpoints: EndpointInfo[]
  ingresses: IngressInfo[]
  ingressClasses: IngressClassInfo[]
  networkPolicies: NetworkPolicyInfo[]
  ipAddresses: IPAddressInfo[]
  serviceCIDRs: ServiceCIDRInfo[]
  endpointSlices: EndpointSliceInfo[]
  apiServices: APIServiceInfo[]
  mutatingWebhookConfigurations: AdmissionWebhookConfigurationInfo[]
  validatingWebhookConfigurations: AdmissionWebhookConfigurationInfo[]
  mutatingAdmissionPolicies: MutatingAdmissionPolicyInfo[]
  mutatingAdmissionPolicyBindings: MutatingAdmissionPolicyBindingInfo[]
  validatingAdmissionPolicies: ValidatingAdmissionPolicyInfo[]
  validatingAdmissionPolicyBindings: ValidatingAdmissionPolicyBindingInfo[]
  flowSchemas: FlowSchemaInfo[]
  priorityLevelConfigurations: PriorityLevelConfigurationInfo[]
  certificateSigningRequests: CertificateSigningRequestInfo[]
  clusterTrustBundles: ClusterTrustBundleInfo[]
  podCertificateRequests: PodCertificateRequestInfo[]
  storageVersions: StorageVersionInfo[]
  storageVersionMigrations: StorageVersionMigrationInfo[]
  podDisruptionBudgets: PodDisruptionBudgetInfo[]
  resourceQuotas: ResourceQuotaInfo[]
  limitRanges: LimitRangeInfo[]
  priorityClasses: PriorityClassInfo[]
  runtimeClasses: RuntimeClassInfo[]
  persistentVolumes: PersistentVolumeInfo[]
  persistentVolumeClaims: PersistentVolumeClaimInfo[]
  storageClasses: StorageClassInfo[]
  volumeAttributesClasses: VolumeAttributesClassInfo[]
  csiDrivers: CSIDriverInfo[]
  csiNodes: CSINodeInfo[]
  volumeAttachments: VolumeAttachmentInfo[]
  csiStorageCapacities: CSIStorageCapacityInfo[]
  volumeSnapshotClasses: VolumeSnapshotClassInfo[]
  volumeSnapshots: VolumeSnapshotInfo[]
  volumeSnapshotContents: VolumeSnapshotContentInfo[]
  gatewayClasses: GatewayClassInfo[]
  gateways: GatewayInfo[]
  httpRoutes: HTTPRouteInfo[]
  grpcRoutes: GRPCRouteInfo[]
  tlsRoutes: TLSRouteInfo[]
  tcpRoutes: TCPRouteInfo[]
  udpRoutes: UDPRouteInfo[]
  referenceGrants: ReferenceGrantInfo[]
  deviceClasses: DeviceClassInfo[]
  resourceClaims: ResourceClaimInfo[]
  resourceClaimTemplates: ResourceClaimTemplateInfo[]
  resourceSlices: ResourceSliceInfo[]
  deviceTaintRules: DeviceTaintRuleInfo[]
  serviceAccounts: ServiceAccountInfo[]
  roles: RoleInfo[]
  roleBindings: RoleBindingInfo[]
  clusterRoles: ClusterRoleInfo[]
  clusterRoleBindings: ClusterRoleBindingInfo[]
  customResourceDefinitions: CustomResourceDefinitionInfo[]
  hpas: HPAInfo[]
  leases: LeaseInfo[]
  leaseCandidates: LeaseCandidateInfo[]
  events: EventInfo[]
  clusterHealth: ClusterHealth | null
  status: LoadState
  error: string
  isRefreshing: boolean
  lastRefreshTime: Date | null

  // Computed
  selectedContext: ContextRecord | undefined

  // Actions
  loadContexts: () => Promise<void>
  selectContext: (id: string) => void
  useKubeContext: (id: string) => Promise<void>
  setKubeContextNamespace: (id: string, namespace: string) => Promise<void>
  loadNamespaces: () => Promise<void>
  toggleNamespace: (ns: string) => void
  setSelectedNamespaces: (namespaces: string[]) => void
  loadResources: (isAutoRefresh?: boolean) => Promise<void>
  loadClusterHealth: () => Promise<void>
  loadNewResources: () => Promise<void>
  refreshAll: (isAutoRefresh?: boolean) => Promise<void>
  handleAdd: () => Promise<void>
  handleManualRefresh: () => void
  setIsRefreshing: (value: boolean) => void
}

export const useClusterStore = create<ClusterState>((set, get) => ({
  // Initial state
  contexts: [],
  selectedId: '',
  namespaces: [],
  selectedNamespaces: [],
  componentStatuses: [],
  apiGroups: [],
  apiResources: [],
  serverVersions: [],
  openIDConfigurations: [],
  apiServerHealth: [],
  selfSubjectReviews: [],
  selfSubjectAccessReviews: [],
  selfSubjectRulesReviews: [],
  nodes: [],
  pods: [],
  deployments: [],
  daemonSets: [],
  statefulSets: [],
  replicaSets: [],
  replicationControllers: [],
  controllerRevisions: [],
  podTemplates: [],
  jobs: [],
  cronJobs: [],
  helmCharts: [],
  helmReleases: [],
  helmRepositories: [],
  services: [],
  configMaps: [],
  secrets: [],
  endpoints: [],
  ingresses: [],
  ingressClasses: [],
  networkPolicies: [],
  ipAddresses: [],
  serviceCIDRs: [],
  endpointSlices: [],
  apiServices: [],
  mutatingWebhookConfigurations: [],
  validatingWebhookConfigurations: [],
  mutatingAdmissionPolicies: [],
  mutatingAdmissionPolicyBindings: [],
  validatingAdmissionPolicies: [],
  validatingAdmissionPolicyBindings: [],
  flowSchemas: [],
  priorityLevelConfigurations: [],
  certificateSigningRequests: [],
  clusterTrustBundles: [],
  podCertificateRequests: [],
  storageVersions: [],
  storageVersionMigrations: [],
  podDisruptionBudgets: [],
  resourceQuotas: [],
  limitRanges: [],
  priorityClasses: [],
  runtimeClasses: [],
  persistentVolumes: [],
  persistentVolumeClaims: [],
  storageClasses: [],
  volumeAttributesClasses: [],
  csiDrivers: [],
  csiNodes: [],
  volumeAttachments: [],
  csiStorageCapacities: [],
  volumeSnapshotClasses: [],
  volumeSnapshots: [],
  volumeSnapshotContents: [],
  gatewayClasses: [],
  gateways: [],
  httpRoutes: [],
  grpcRoutes: [],
  tlsRoutes: [],
  tcpRoutes: [],
  udpRoutes: [],
  referenceGrants: [],
  deviceClasses: [],
  resourceClaims: [],
  resourceClaimTemplates: [],
  resourceSlices: [],
  deviceTaintRules: [],
  serviceAccounts: [],
  roles: [],
  roleBindings: [],
  clusterRoles: [],
  clusterRoleBindings: [],
  customResourceDefinitions: [],
  hpas: [],
  leases: [],
  leaseCandidates: [],
  events: [],
  clusterHealth: null,
  status: 'idle',
  error: '',
  isRefreshing: false,
  lastRefreshTime: null,

  // Computed
  get selectedContext() {
    return get().contexts.find((context) => context.id === get().selectedId)
  },

  // Actions
  loadContexts: async () => {
    const { selectedId } = get()
    try {
      const list = await k8sApi.listContexts()
      set({ contexts: list })
      if (list.length === 0) {
        set({ selectedId: '', selectedNamespaces: [] })
        return
      }
      const stillExists = list.some((item) => item.id === selectedId)
      if (!selectedId || !stillExists) {
        const nextContext = list.find((item) => item.current) ?? list[0]
        set({
          selectedId: nextContext.id,
          selectedNamespaces: defaultNamespacesForContext(nextContext),
        })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载集群列表失败' })
    }
  },

  selectContext: (id: string) => {
    set({
      selectedId: id,
      selectedNamespaces: defaultNamespacesForContext(get().contexts.find((context) => context.id === id)),
    })
  },

  useKubeContext: async (id: string) => {
    set({ error: '' })
    try {
      const contexts = await k8sApi.useKubeContext(id)
      const context = contexts.find((item) => item.id === id)
      set({
        contexts,
        selectedId: id,
        selectedNamespaces: defaultNamespacesForContext(context),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '切换当前 context 失败'
      set({ error: message })
      throw err
    }
  },

  setKubeContextNamespace: async (id: string, namespace: string) => {
    set({ error: '' })
    try {
      const contexts = await k8sApi.setKubeContextNamespace(id, namespace)
      const selectedId = get().selectedId
      const context = contexts.find((item) => item.id === id)
      set({
        contexts,
        selectedNamespaces: selectedId === id ? defaultNamespacesForContext(context) : get().selectedNamespaces,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '设置默认命名空间失败'
      set({ error: message })
      throw err
    }
  },

  loadNamespaces: async () => {
    const { selectedId } = get()
    if (!selectedId) return
    try {
      const list = await k8sApi.listNamespaces(selectedId)
      const available = new Set(list.map((item) => item.name))
      const selectedNamespaces = get().selectedNamespaces.filter((name) => available.has(name))
      set({ namespaces: list, selectedNamespaces })
    } catch {
      set({ namespaces: [] })
    }
  },

  toggleNamespace: (ns: string) => {
    const { selectedNamespaces } = get()
    const next = selectedNamespaces.includes(ns)
      ? selectedNamespaces.filter((name) => name !== ns)
      : [...selectedNamespaces, ns]
    set({ selectedNamespaces: next })
  },

  setSelectedNamespaces: (namespaces) => {
    set({ selectedNamespaces: namespaces })
  },

  loadResources: async (isAutoRefresh = false) => {
    const { selectedId } = get()
    if (!selectedId) return

    if (isAutoRefresh) {
      set({ isRefreshing: true })
    } else {
      set({ status: 'loading' })
    }
    set({ error: '' })

    try {
      const current = get()
      const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T => (
        result.status === 'fulfilled' ? result.value : fallback
      )
      const results = await Promise.allSettled([
        k8sApi.listNodes(selectedId),
        k8sApi.listPods(selectedId),
        k8sApi.listDeployments(selectedId),
        k8sApi.listDaemonSets(selectedId),
        k8sApi.listStatefulSets(selectedId),
        k8sApi.listReplicaSets(selectedId),
        k8sApi.listReplicationControllers(selectedId),
        k8sApi.listJobs(selectedId),
        k8sApi.listCronJobs(selectedId),
      ])
      const firstError = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      const hasData = results.some((result) => result.status === 'fulfilled')
      set({
        nodes: settledValue(results[0], current.nodes),
        pods: settledValue(results[1], current.pods),
        deployments: settledValue(results[2], current.deployments),
        daemonSets: settledValue(results[3], current.daemonSets),
        statefulSets: settledValue(results[4], current.statefulSets),
        replicaSets: settledValue(results[5], current.replicaSets),
        replicationControllers: settledValue(results[6], current.replicationControllers),
        jobs: settledValue(results[7], current.jobs),
        cronJobs: settledValue(results[8], current.cronJobs),
        status: firstError ? 'error' : 'ready',
        error: firstError
          ? firstError.reason instanceof Error ? firstError.reason.message : String(firstError.reason)
          : '',
        lastRefreshTime: hasData ? new Date() : current.lastRefreshTime
      })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : '加载失败' })
    } finally {
      set({ isRefreshing: false })
    }
  },

  loadClusterHealth: async () => {
    const { selectedId } = get()
    if (!selectedId) return
    try {
      const health = await k8sApi.getClusterHealth(selectedId)
      set({ clusterHealth: health })
    } catch {
      set({ clusterHealth: null })
    }
  },

  loadNewResources: async () => {
    const { selectedId } = get()
    if (!selectedId) return

    try {
      const current = get()
      const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T => (
        result.status === 'fulfilled' ? result.value : fallback
      )

      const results = await Promise.allSettled([
        k8sApi.listServices(selectedId),
        k8sApi.listConfigMaps(selectedId),
        k8sApi.listSecrets(selectedId),
        k8sApi.listEndpoints(selectedId),
        k8sApi.listIngresses(selectedId),
        k8sApi.listIngressClasses(selectedId),
        k8sApi.listNetworkPolicies(selectedId),
        k8sApi.listIPAddresses(selectedId),
        k8sApi.listServiceCIDRs(selectedId),
        k8sApi.listEndpointSlices(selectedId),
        k8sApi.listAPIServices(selectedId),
        k8sApi.listMutatingWebhookConfigurations(selectedId),
        k8sApi.listValidatingWebhookConfigurations(selectedId),
        k8sApi.listValidatingAdmissionPolicies(selectedId),
        k8sApi.listValidatingAdmissionPolicyBindings(selectedId),
        k8sApi.listFlowSchemas(selectedId),
        k8sApi.listPriorityLevelConfigurations(selectedId),
        k8sApi.listCertificateSigningRequests(selectedId),
        k8sApi.listPodDisruptionBudgets(selectedId),
        k8sApi.listResourceQuotas(selectedId),
        k8sApi.listLimitRanges(selectedId),
        k8sApi.listPriorityClasses(selectedId),
        k8sApi.listRuntimeClasses(selectedId),
        k8sApi.listHelmReleases(selectedId),
        k8sApi.listPersistentVolumes(selectedId),
        k8sApi.listPersistentVolumeClaims(selectedId),
        k8sApi.listStorageClasses(selectedId),
        k8sApi.listVolumeAttributesClasses(selectedId),
        k8sApi.listCSIDrivers(selectedId),
        k8sApi.listCSINodes(selectedId),
        k8sApi.listVolumeAttachments(selectedId),
        k8sApi.listCSIStorageCapacities(selectedId),
        k8sApi.listVolumeSnapshotClasses(selectedId),
        k8sApi.listVolumeSnapshots(selectedId),
        k8sApi.listVolumeSnapshotContents(selectedId),
        k8sApi.listGatewayClasses(selectedId),
        k8sApi.listGateways(selectedId),
        k8sApi.listHTTPRoutes(selectedId),
        k8sApi.listGRPCRoutes(selectedId),
        k8sApi.listTLSRoutes(selectedId),
        k8sApi.listTCPRoutes(selectedId),
        k8sApi.listUDPRoutes(selectedId),
        k8sApi.listReferenceGrants(selectedId),
        k8sApi.listDeviceClasses(selectedId),
        k8sApi.listResourceClaims(selectedId),
        k8sApi.listResourceClaimTemplates(selectedId),
        k8sApi.listResourceSlices(selectedId),
        k8sApi.listDeviceTaintRules(selectedId),
        k8sApi.listServiceAccounts(selectedId),
        k8sApi.listRoles(selectedId),
        k8sApi.listRoleBindings(selectedId),
        k8sApi.listClusterRoles(selectedId),
        k8sApi.listClusterRoleBindings(selectedId),
        k8sApi.listCustomResourceDefinitions(selectedId),
        k8sApi.listHPAs(selectedId),
        k8sApi.listLeases(selectedId),
        k8sApi.listEvents(selectedId),
        k8sApi.listControllerRevisions(selectedId),
        k8sApi.listPodTemplates(selectedId),
        k8sApi.listClusterTrustBundles(selectedId),
        k8sApi.listMutatingAdmissionPolicies(selectedId),
        k8sApi.listMutatingAdmissionPolicyBindings(selectedId),
        k8sApi.listLeaseCandidates(selectedId),
        k8sApi.listStorageVersions(selectedId),
        k8sApi.listStorageVersionMigrations(selectedId),
        k8sApi.listPodCertificateRequests(selectedId),
        k8sApi.listComponentStatuses(selectedId),
        k8sApi.listAPIGroups(selectedId),
        k8sApi.listAPIResources(selectedId),
        k8sApi.listServerVersions(selectedId),
        k8sApi.listOpenIDConfigurations(selectedId),
        k8sApi.listAPIServerHealth(selectedId),
        k8sApi.listSelfSubjectReviews(selectedId),
        k8sApi.listSelfSubjectAccessReviews(
          selectedId,
          current.selectedNamespaces.length > 0
            ? current.selectedNamespaces
            : current.namespaces.map((namespace) => namespace.name),
        ),
        k8sApi.listSelfSubjectRulesReviews(
          selectedId,
          current.selectedNamespaces.length > 0
            ? current.selectedNamespaces
            : current.namespaces.map((namespace) => namespace.name),
        ),
        k8sApi.listHelmRepositories(selectedId),
        k8sApi.listHelmCharts(selectedId),
      ])
      set({
        services: settledValue(results[0], current.services),
        configMaps: settledValue(results[1], current.configMaps),
        secrets: settledValue(results[2], current.secrets),
        endpoints: settledValue(results[3], current.endpoints),
        ingresses: settledValue(results[4], current.ingresses),
        ingressClasses: settledValue(results[5], current.ingressClasses),
        networkPolicies: settledValue(results[6], current.networkPolicies),
        ipAddresses: settledValue(results[7], current.ipAddresses),
        serviceCIDRs: settledValue(results[8], current.serviceCIDRs),
        endpointSlices: settledValue(results[9], current.endpointSlices),
        apiServices: settledValue(results[10], current.apiServices),
        mutatingWebhookConfigurations: settledValue(results[11], current.mutatingWebhookConfigurations),
        validatingWebhookConfigurations: settledValue(results[12], current.validatingWebhookConfigurations),
        validatingAdmissionPolicies: settledValue(results[13], current.validatingAdmissionPolicies),
        validatingAdmissionPolicyBindings: settledValue(results[14], current.validatingAdmissionPolicyBindings),
        flowSchemas: settledValue(results[15], current.flowSchemas),
        priorityLevelConfigurations: settledValue(results[16], current.priorityLevelConfigurations),
        certificateSigningRequests: settledValue(results[17], current.certificateSigningRequests),
        podDisruptionBudgets: settledValue(results[18], current.podDisruptionBudgets),
        resourceQuotas: settledValue(results[19], current.resourceQuotas),
        limitRanges: settledValue(results[20], current.limitRanges),
        priorityClasses: settledValue(results[21], current.priorityClasses),
        runtimeClasses: settledValue(results[22], current.runtimeClasses),
        helmReleases: settledValue(results[23], current.helmReleases),
        persistentVolumes: settledValue(results[24], current.persistentVolumes),
        persistentVolumeClaims: settledValue(results[25], current.persistentVolumeClaims),
        storageClasses: settledValue(results[26], current.storageClasses),
        volumeAttributesClasses: settledValue(results[27], current.volumeAttributesClasses),
        csiDrivers: settledValue(results[28], current.csiDrivers),
        csiNodes: settledValue(results[29], current.csiNodes),
        volumeAttachments: settledValue(results[30], current.volumeAttachments),
        csiStorageCapacities: settledValue(results[31], current.csiStorageCapacities),
        volumeSnapshotClasses: settledValue(results[32], current.volumeSnapshotClasses),
        volumeSnapshots: settledValue(results[33], current.volumeSnapshots),
        volumeSnapshotContents: settledValue(results[34], current.volumeSnapshotContents),
        gatewayClasses: settledValue(results[35], current.gatewayClasses),
        gateways: settledValue(results[36], current.gateways),
        httpRoutes: settledValue(results[37], current.httpRoutes),
        grpcRoutes: settledValue(results[38], current.grpcRoutes),
        tlsRoutes: settledValue(results[39], current.tlsRoutes),
        tcpRoutes: settledValue(results[40], current.tcpRoutes),
        udpRoutes: settledValue(results[41], current.udpRoutes),
        referenceGrants: settledValue(results[42], current.referenceGrants),
        deviceClasses: settledValue(results[43], current.deviceClasses),
        resourceClaims: settledValue(results[44], current.resourceClaims),
        resourceClaimTemplates: settledValue(results[45], current.resourceClaimTemplates),
        resourceSlices: settledValue(results[46], current.resourceSlices),
        deviceTaintRules: settledValue(results[47], current.deviceTaintRules),
        serviceAccounts: settledValue(results[48], current.serviceAccounts),
        roles: settledValue(results[49], current.roles),
        roleBindings: settledValue(results[50], current.roleBindings),
        clusterRoles: settledValue(results[51], current.clusterRoles),
        clusterRoleBindings: settledValue(results[52], current.clusterRoleBindings),
        customResourceDefinitions: settledValue(results[53], current.customResourceDefinitions),
        hpas: settledValue(results[54], current.hpas),
        leases: settledValue(results[55], current.leases),
        events: settledValue(results[56], current.events),
        controllerRevisions: settledValue(results[57], current.controllerRevisions),
        podTemplates: settledValue(results[58], current.podTemplates),
        clusterTrustBundles: settledValue(results[59], current.clusterTrustBundles),
        mutatingAdmissionPolicies: settledValue(results[60], current.mutatingAdmissionPolicies),
        mutatingAdmissionPolicyBindings: settledValue(results[61], current.mutatingAdmissionPolicyBindings),
        leaseCandidates: settledValue(results[62], current.leaseCandidates),
        storageVersions: settledValue(results[63], current.storageVersions),
        storageVersionMigrations: settledValue(results[64], current.storageVersionMigrations),
        podCertificateRequests: settledValue(results[65], current.podCertificateRequests),
        componentStatuses: settledValue(results[66], current.componentStatuses),
        apiGroups: settledValue(results[67], current.apiGroups),
        apiResources: settledValue(results[68], current.apiResources),
        serverVersions: settledValue(results[69], current.serverVersions),
        openIDConfigurations: settledValue(results[70], current.openIDConfigurations),
        apiServerHealth: settledValue(results[71], current.apiServerHealth),
        selfSubjectReviews: settledValue(results[72], current.selfSubjectReviews),
        selfSubjectAccessReviews: settledValue(results[73], current.selfSubjectAccessReviews),
        selfSubjectRulesReviews: settledValue(results[74], current.selfSubjectRulesReviews),
        helmRepositories: settledValue(results[75], current.helmRepositories),
        helmCharts: settledValue(results[76], current.helmCharts),
      })
    } catch {
      // Silently fail for new resource types
    }
  },

  refreshAll: async (isAutoRefresh = false) => {
    const { selectedId, loadNamespaces, loadResources, loadClusterHealth, loadNewResources } = get()
    if (!selectedId) return

    await Promise.all([
      loadNamespaces(),
      loadResources(isAutoRefresh),
      loadClusterHealth(),
      loadNewResources(),
    ])
  },

  handleAdd: async () => {
    const { selectedId, contexts } = get()
    set({ error: '' })
    try {
      const result = await k8sApi.addKubeconfigFile()
      set({ contexts: result.contexts })
      if (result.addedIds.length > 0) {
        const nextContext = result.contexts.find((context) => context.id === result.addedIds[0])
        set({
          selectedId: result.addedIds[0],
          selectedNamespaces: defaultNamespacesForContext(nextContext),
        })
      } else if (!selectedId && result.contexts.length > 0) {
        const nextContext = result.contexts.find((context) => context.current) ?? result.contexts[0]
        set({
          selectedId: nextContext.id,
          selectedNamespaces: defaultNamespacesForContext(nextContext),
        })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加配置失败' })
    }
  },

  handleManualRefresh: () => {
    const { selectedId, refreshAll } = get()
    if (selectedId) {
      void refreshAll(true)
    }
  },

  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value })
  }
}))
