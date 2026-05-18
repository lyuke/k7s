/* node:coverage disable */
import {
  AdmissionregistrationV1Api,
  AdmissionregistrationV1beta1Api,
  ApisApi,
  ApiextensionsV1Api,
  ApiregistrationV1Api,
  AppsV1Api,
  AuthenticationV1Api,
  AuthorizationV1Api,
  AutoscalingV2Api,
  BatchV1Api,
  CertificatesV1Api,
  CertificatesV1alpha1Api,
  CertificatesV1beta1Api,
  CoordinationV1Api,
  CoordinationV1beta1Api,
  CoreV1Api,
  CoreApi,
  CustomObjectsApi,
  DiscoveryV1Api,
  EventsV1Api,
  FlowcontrolApiserverV1Api,
  Health,
  InternalApiserverV1alpha1Api,
  KubeConfig,
  NetworkingV1Api,
  NodeV1Api,
  OpenidApi,
  PolicyV1Api,
  RbacAuthorizationV1Api,
  ResourceV1ResourceClaim,
  ResourceV1Api,
  ResourceV1alpha3Api,
  SchedulingV1Api,
  StorageV1Api,
  StoragemigrationV1alpha1Api,
  VersionApi,
  VersionInfo,
  WellKnownApi,
  V1APIGroup,
  V1APIGroupList,
  V1APIResource,
  V1APIResourceList,
  V1APIService,
  V1APIVersions,
  V1CertificateSigningRequest,
  V1beta1ClusterTrustBundle,
  V1beta1LeaseCandidate,
  V1beta1MutatingAdmissionPolicy,
  V1beta1MutatingAdmissionPolicyBinding,
  V1CSIDriver,
  V1CSINode,
  V1CSIStorageCapacity,
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1ComponentStatus,
  V1ConfigMap,
  V1ControllerRevision,
  V1CustomResourceDefinition,
  V1CronJob,
  V1DaemonSet,
  V1DeleteOptions,
  V1Deployment,
  V1DeviceClass,
  V1Eviction,
  V1EndpointSlice,
  V1Endpoints,
  V1FlowSchema,
  V1IPAddress,
  V1Job,
  V1Lease,
  V1LimitRange,
  V1MutatingWebhookConfiguration,
  V1Namespace,
  V1NetworkPolicy,
  V1Node,
  V1PersistentVolume,
  V1PersistentVolumeClaim,
  V1Pod,
  V1PodDisruptionBudget,
  V1PodTemplate,
  V1PriorityClass,
  V1PriorityLevelConfiguration,
  V1ReplicaSet,
  V1ReplicationController,
  V1ResourceClaimTemplate,
  V1ResourceQuota,
  V1ResourceSlice,
  V1Role,
  V1RoleBinding,
  V1RuntimeClass,
  V1Secret,
  V1Service,
  V1ServiceAccount,
  V1ServiceCIDR,
  V1SelfSubjectAccessReview,
  V1SelfSubjectRulesReview,
  V1SelfSubjectReview,
  V1StatefulSet,
  V1StorageClass,
  V1Ingress,
  V1IngressClass,
  V1ValidatingAdmissionPolicy,
  V1ValidatingAdmissionPolicyBinding,
  V1ValidatingWebhookConfiguration,
  V1VolumeAttachment,
  V1VolumeAttributesClass,
  V1alpha1MigrationCondition,
  V1alpha1ServerStorageVersion,
  V1alpha1StorageVersion,
  V1alpha1StorageVersionCondition,
  V1alpha1StorageVersionMigration,
  V1alpha1PodCertificateRequest,
  V1alpha3DeviceTaintRule,
  EventsV1Event,
  V2HorizontalPodAutoscaler,
  CoreV1Event,
  PatchStrategy,
} from '@kubernetes/client-node'
import { app } from 'electron'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { loadAll as yamlLoadAll } from 'js-yaml'
import type {
  AddContextsResult,
  APIServerHealthInfo,
  APIGroupInfo,
  APIResourceInfo,
  APIServiceConditionInfo,
  AdmissionPolicyConditionInfo,
  AdmissionPolicyParamRefInfo,
  AdmissionPolicyRuleInfo,
  AdmissionPolicyWarningInfo,
  AdmissionWebhookInfo,
  AdmissionWebhookRuleInfo,
  AdmissionWebhookConfigurationInfo,
  APIServiceInfo,
  CertificateSigningRequestConditionInfo,
  CertificateSigningRequestDecision,
  CertificateSigningRequestInfo,
  ClusterTrustBundleInfo,
  ClusterHealth,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ComponentStatusConditionInfo,
  ComponentStatusInfo,
  ConfigMapFormData,
  ConfigMapInfo,
  ContextRecord,
  ControllerRevisionInfo,
  CSIDriverInfo,
  CSINodeDriverInfo,
  CSINodeInfo,
  CSIStorageCapacityInfo,
  CSIStorageTopologyExpressionInfo,
  CustomResourceDefinitionInfo,
  CustomResourceInstanceInfo,
  CronJobInfo,
  CreateResult,
  DaemonSetInfo,
  DeploymentFormData,
  DeploymentInfo,
  DeleteResult,
  DeviceClassInfo,
  DeviceTaintRuleInfo,
  EndpointAddressInfo,
  EndpointInfo,
  EndpointPortInfo,
  EndpointSliceEndpointInfo,
  EndpointSliceInfo,
  EndpointSlicePortInfo,
  EventInfo,
  FlowControlConditionInfo,
  FlowSchemaNonResourceRuleInfo,
  FlowSchemaInfo,
  FlowSchemaResourceRuleInfo,
  FlowSchemaSubjectInfo,
  GatewayClassInfo,
  GatewayConditionInfo,
  GatewayInfo,
  GatewayListenerInfo,
  GatewayRouteParentInfo,
  GRPCRouteInfo,
  HelmReleaseInfo,
  HTTPRouteInfo,
  HPAConditionInfo,
  HPAInfo,
  HPAMetricInfo,
  IngressRuleInfo,
  IngressTlsInfo,
  IngressClassInfo,
  IngressFormData,
  IngressInfo,
  IPAddressInfo,
  CanIReviewRequest,
  JobSuspensionKind,
  JobInfo,
  KubernetesResourceKind,
  LeaseCandidateInfo,
  LeaseInfo,
  LimitRangeItemInfo,
  LimitRangeInfo,
  MutatingAdmissionMatchConditionInfo,
  MutatingAdmissionMutationInfo,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
  MutatingAdmissionVariableInfo,
  NamespaceInfo,
  NetworkPolicyInfo,
  NetworkPolicyRuleInfo,
  NodeCapacity,
  NodeInfo,
  NodeMetrics,
  OpenIDConfigurationInfo,
  PausableWorkloadKind,
  PodDisruptionBudgetConditionInfo,
  PodDisruptionBudgetInfo,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PodContainer,
  PodCertificateRequestConditionInfo,
  PodCertificateRequestInfo,
  PodInfo,
  PodTemplateInfo,
  PriorityClassInfo,
  PriorityLevelConfigurationInfo,
  RbacRuleInfo,
  RbacSubjectInfo,
  ReplicaSetInfo,
  ReplicationControllerInfo,
  ResourceQuotaScopeSelectorInfo,
  ResourceQuotaUsageInfo,
  ResourceQuotaInfo,
  ReferenceGrantInfo,
  ReferenceGrantRefInfo,
  ResourceClaimInfo,
  ResourceClaimTemplateInfo,
  ResourceSliceInfo,
  RolloutResult,
  RolloutWorkloadKind,
  RoleBindingInfo,
  RoleInfo,
  RuntimeClassInfo,
  RuntimeClassTolerationInfo,
  ScaleResult,
  ScaleableWorkloadKind,
  SecretFormData,
  SecretInfo,
  SelfSubjectAccessReviewInfo,
  SelfSubjectReviewInfo,
  SelfSubjectRuleInfo,
  ServerVersionInfo,
  ServiceAccountInfo,
  ServiceFormData,
  ServiceCIDRConditionInfo,
  ServiceCIDRInfo,
  ServiceInfo,
  ServicePortInfo,
  StatefulSetInfo,
  StorageClassInfo,
  StorageVersionConditionInfo,
  StorageVersionInfo,
  StorageVersionMigrationConditionInfo,
  StorageVersionMigrationInfo,
  StorageVersionServerInfo,
  TCPRouteInfo,
  TLSRouteInfo,
  UpdateResult,
  UDPRouteInfo,
  ValidatingAdmissionAuditAnnotationInfo,
  ValidatingAdmissionValidationInfo,
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
import { request as httpsRequest } from 'node:https'
import type { RequestOptions as HttpsRequestOptions } from 'node:https'
import { request as httpRequest } from 'node:http'

type ContextEntry = {
  id: string
  contextName: string
  kubeConfig: KubeConfig
  filePath?: string
}

type PatchOptions = {
  middleware: Array<{
    pre: (context: { setHeaderParam: (name: string, value: string) => void }) => Promise<unknown>
    post: (context: unknown) => Promise<unknown>
  }>
  middlewareMergeStrategy: 'append'
}

type KubernetesManifest = Record<string, unknown>

type CustomResourceDescriptor = {
  crdName: string
  group: string
  version: string
  plural: string
  kind: string
  scope: string
}

type CustomResourceObject = Record<string, unknown> & {
  apiVersion?: string
  kind?: string
  metadata?: {
    name?: string
    namespace?: string
    creationTimestamp?: Date | string
    labels?: Record<string, string>
  }
  status?: unknown
}

type EndpointAddressLike = {
  ip?: string
  hostname?: string
  nodeName?: string
  targetRef?: {
    kind?: string
    name?: string
    namespace?: string
  }
}

type EndpointPortLike = {
  name?: string
  port?: number
  protocol?: string
  appProtocol?: string
}

type PodMetricsObject = {
  metadata?: {
    name?: string
    namespace?: string
  }
  containers?: Array<{
    name?: string
    usage?: {
      cpu?: string
      memory?: string
    }
  }>
}

type NodeMetricsObject = {
  metadata?: {
    name?: string
  }
  usage?: {
    cpu?: string
    memory?: string
  }
}

type PodMetricUsage = {
  name?: string
  namespace?: string
  cpu: string
  memory: string
  containers?: Map<string, {
    cpu: string
    memory: string
  }>
}

type HelmReleaseRecord = HelmReleaseInfo & {
  updatedTime: number
}

type AdmissionWebhook = {
  name?: string
  admissionReviewVersions?: string[]
  clientConfig?: {
    service?: {
      namespace?: string
      name?: string
      path?: string
      port?: number
    }
    url?: string
    caBundle?: string
  }
  failurePolicy?: string
  matchConditions?: Array<{
    name?: string
  }>
  matchPolicy?: string
  namespaceSelector?: LabelSelectorLike
  objectSelector?: LabelSelectorLike
  reinvocationPolicy?: string
  rules?: Array<{
    operations?: string[]
    apiGroups?: string[]
    apiVersions?: string[]
    resources?: string[]
    scope?: string
  }>
  sideEffects?: string
  timeoutSeconds?: number
}

type AdmissionMatchRule = {
  operations?: string[]
  apiGroups?: string[]
  apiVersions?: string[]
  resources?: string[]
  resourceNames?: string[]
  scope?: string
}

type AdmissionMatchResources = {
  resourceRules?: AdmissionMatchRule[]
  excludeResourceRules?: AdmissionMatchRule[]
  matchPolicy?: string
}

type AdmissionValidationLike = {
  expression?: string
  message?: string
  messageExpression?: string
  reason?: string
}

type AdmissionAuditAnnotationLike = {
  key?: string
  valueExpression?: string
}

type AdmissionExpressionWarningLike = {
  fieldRef?: string
  warning?: string
}

type AdmissionPolicyConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date
}

type AdmissionParamRefLike = {
  name?: string
  namespace?: string
  selector?: LabelSelectorLike
  parameterNotFoundAction?: string
}

type AdmissionMutationLike = {
  patchType?: string
  applyConfiguration?: {
    expression?: string
  }
  jsonPatch?: {
    expression?: string
  }
}

type AdmissionVariableLike = {
  name?: string
  expression?: string
}

type AdmissionMatchConditionLike = {
  name?: string
  expression?: string
}

type PodDisruptionBudgetConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date
}

type ResourceQuotaScopeSelectorLike = {
  matchExpressions?: Array<{
    scopeName?: string
    operator?: string
    values?: string[]
  }>
}

type LimitRangeLimitLike = {
  type?: string
  min?: Record<string, unknown>
  max?: Record<string, unknown>
  default?: Record<string, unknown>
  defaultRequest?: Record<string, unknown>
  maxLimitRequestRatio?: Record<string, unknown>
}

type RuntimeClassTolerationLike = {
  key?: string
  operator?: string
  value?: string
  effect?: string
  tolerationSeconds?: number
}

type CSINodeDriverLike = {
  name?: string
  nodeID?: string
  topologyKeys?: string[]
  allocatable?: {
    count?: number
  }
}

type FlowSubject = {
  kind?: string
  group?: { name?: string }
  serviceAccount?: { namespace?: string; name?: string }
  user?: { name?: string }
}

type FlowResourcePolicyRule = {
  verbs?: string[]
  apiGroups?: string[]
  resources?: string[]
  namespaces?: string[]
  clusterScope?: boolean
}

type FlowNonResourcePolicyRule = {
  verbs?: string[]
  nonResourceURLs?: string[]
}

type FlowPolicyRule = {
  subjects?: FlowSubject[]
  resourceRules?: FlowResourcePolicyRule[]
  nonResourceRules?: FlowNonResourcePolicyRule[]
}

type FlowControlCondition = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date
}

type HPAMetricTargetLike = {
  type?: string
  value?: unknown
  averageValue?: unknown
  averageUtilization?: number
}

type HPAMetricSourceLike = {
  type?: string
  resource?: {
    name?: string
    target?: HPAMetricTargetLike
    current?: HPAMetricTargetLike
  }
  containerResource?: {
    name?: string
    container?: string
    target?: HPAMetricTargetLike
    current?: HPAMetricTargetLike
  }
  pods?: {
    metric?: { name?: string }
    target?: HPAMetricTargetLike
    current?: HPAMetricTargetLike
  }
  object?: {
    metric?: { name?: string }
    describedObject?: { kind?: string; name?: string }
    target?: HPAMetricTargetLike
    current?: HPAMetricTargetLike
  }
  external?: {
    metric?: { name?: string }
    target?: HPAMetricTargetLike
    current?: HPAMetricTargetLike
  }
}

type HPAConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date
}

type EventObjectReferenceLike = {
  apiVersion?: string
  kind?: string
  name?: string
  namespace?: string
  uid?: string
  fieldPath?: string
}

type VolumeSnapshotClassObject = CustomResourceObject & {
  driver?: string
  deletionPolicy?: string
  parameters?: Record<string, unknown>
}

type VolumeSnapshotObject = CustomResourceObject & {
  spec?: {
    volumeSnapshotClassName?: string
    source?: {
      persistentVolumeClaimName?: string
      volumeSnapshotContentName?: string
    }
  }
  status?: {
    boundVolumeSnapshotContentName?: string
    readyToUse?: boolean
    restoreSize?: unknown
    error?: {
      message?: string
      time?: Date
    }
  }
}

type VolumeSnapshotContentObject = CustomResourceObject & {
  spec?: {
    deletionPolicy?: string
    driver?: string
    source?: {
      volumeHandle?: string
      snapshotHandle?: string
    }
    volumeSnapshotClassName?: string
    volumeSnapshotRef?: {
      name?: string
      namespace?: string
    }
  }
  status?: {
    readyToUse?: boolean
    restoreSize?: unknown
    snapshotHandle?: string
    error?: {
      message?: string
      time?: Date
    }
  }
}

type GatewayConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date | string
}

type GatewayRefLike = {
  group?: string
  kind?: string
  namespace?: string
  name?: string
  sectionName?: string
  port?: number
}

type GatewayClassObject = CustomResourceObject & {
  spec?: {
    controllerName?: string
    description?: string
    parametersRef?: GatewayRefLike
  }
  status?: {
    conditions?: GatewayConditionLike[]
  }
}

type GatewayListenerLike = {
  name?: string
  hostname?: string
  port?: number
  protocol?: string
  conditions?: GatewayConditionLike[]
  attachedRoutes?: number
  supportedKinds?: Array<{
    group?: string
    kind?: string
  }>
}

type GatewayObject = CustomResourceObject & {
  spec?: {
    gatewayClassName?: string
    addresses?: Array<{
      type?: string
      value?: string
    }>
    listeners?: GatewayListenerLike[]
  }
  status?: {
    addresses?: Array<{
      type?: string
      value?: string
    }>
    conditions?: GatewayConditionLike[]
    listeners?: GatewayListenerLike[]
  }
}

type GatewayBackendRefLike = GatewayRefLike & {
  weight?: number
}

type GatewayRouteRuleLike = {
  backendRefs?: GatewayBackendRefLike[]
  filters?: unknown[]
  matches?: unknown[]
}

type GatewayRouteParentStatusLike = {
  parentRef?: GatewayRefLike
  controllerName?: string
  conditions?: GatewayConditionLike[]
}

type GatewayRouteObject = CustomResourceObject & {
  spec?: {
    hostnames?: string[]
    parentRefs?: GatewayRefLike[]
    rules?: GatewayRouteRuleLike[]
  }
  status?: {
    parents?: GatewayRouteParentStatusLike[]
  }
}

type ReferenceGrantRefLike = {
  group?: string
  kind?: string
  namespace?: string
  name?: string
}

type ReferenceGrantObject = CustomResourceObject & {
  spec?: {
    from?: ReferenceGrantRefLike[]
    to?: ReferenceGrantRefLike[]
  }
}

type DeviceRequestLike = {
  name?: string
  exactly?: {
    deviceClassName?: string
    allocationMode?: string
    count?: number
  }
  firstAvailable?: Array<{
    name?: string
    deviceClassName?: string
    allocationMode?: string
    count?: number
  }>
}

type DeviceClassObject = CustomResourceObject & {
  spec?: {
    selectors?: unknown[]
    config?: unknown[]
    extendedResourceName?: string
  }
}

type ResourceClaimObject = CustomResourceObject & {
  spec?: {
    devices?: {
      requests?: DeviceRequestLike[]
      constraints?: unknown[]
      config?: unknown[]
    }
  }
  status?: {
    allocation?: {
      devices?: {
        results?: Array<{
          request?: string
          driver?: string
          pool?: string
          device?: string
        }>
      }
    }
    reservedFor?: unknown[]
  }
}

type ResourceClaimTemplateObject = CustomResourceObject & {
  spec?: {
    spec?: ResourceClaimObject['spec']
  }
}

type ResourceSliceObject = CustomResourceObject & {
  spec?: {
    driver?: string
    pool?: {
      name?: string
      generation?: number
      resourceSliceCount?: number
    }
    nodeName?: string
    allNodes?: boolean
    devices?: Array<{ name?: string }>
  }
}

type CertificateSigningRequestConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastUpdateTime?: Date
  lastTransitionTime?: Date
}

type PodCertificateRequestConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date | string
}

type LabelSelectorLike = {
  matchLabels?: Record<string, string>
  matchExpressions?: Array<{
    key?: string
    operator?: string
    values?: string[]
  }>
}

type NetworkPolicyPeerLike = {
  ipBlock?: {
    cidr?: string
    except?: string[]
  }
  namespaceSelector?: LabelSelectorLike
  podSelector?: LabelSelectorLike
}

type NetworkPolicyPortLike = {
  protocol?: string
  port?: number | string
  endPort?: number
}

type NetworkPolicyIngressRuleLike = {
  _from?: NetworkPolicyPeerLike[]
  from?: NetworkPolicyPeerLike[]
  ports?: NetworkPolicyPortLike[]
}

type NetworkPolicyEgressRuleLike = {
  to?: NetworkPolicyPeerLike[]
  ports?: NetworkPolicyPortLike[]
}

type ParentReferenceLike = {
  group?: string
  resource?: string
  namespace?: string
  name?: string
}

type ConditionLike = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: Date | string
}

type EndpointSliceEndpointLike = {
  addresses?: string[]
  conditions?: {
    ready?: boolean
    serving?: boolean
    terminating?: boolean
  }
  hostname?: string
  nodeName?: string
  zone?: string
  targetRef?: {
    kind?: string
    name?: string
  }
}

type EndpointSlicePortLike = {
  name?: string
  port?: number
  protocol?: string
  appProtocol?: string
}

const SNAPSHOT_GROUP = 'snapshot.storage.k8s.io'
const SNAPSHOT_VERSION = 'v1'
const VOLUME_SNAPSHOT_CLASSES_PLURAL = 'volumesnapshotclasses'
const VOLUME_SNAPSHOTS_PLURAL = 'volumesnapshots'
const VOLUME_SNAPSHOT_CONTENTS_PLURAL = 'volumesnapshotcontents'
const GATEWAY_GROUP = 'gateway.networking.k8s.io'
const GATEWAY_VERSION = 'v1'
const GATEWAY_ALPHA_VERSION = 'v1alpha2'
const GATEWAY_CLASSES_PLURAL = 'gatewayclasses'
const GATEWAYS_PLURAL = 'gateways'
const HTTP_ROUTES_PLURAL = 'httproutes'
const GRPC_ROUTES_PLURAL = 'grpcroutes'
const TLS_ROUTES_PLURAL = 'tlsroutes'
const TCP_ROUTES_PLURAL = 'tcproutes'
const UDP_ROUTES_PLURAL = 'udproutes'
const REFERENCE_GRANTS_PLURAL = 'referencegrants'
const RESOURCE_GROUP = 'resource.k8s.io'
const RESOURCE_VERSION = 'v1'
const DEVICE_CLASSES_PLURAL = 'deviceclasses'
const RESOURCE_CLAIMS_PLURAL = 'resourceclaims'
const RESOURCE_CLAIM_TEMPLATES_PLURAL = 'resourceclaimtemplates'
const RESOURCE_SLICES_PLURAL = 'resourceslices'

type StoreData = {
  paths: string[]
  prefs?: {
    customNames?: Record<string, string>
    groups?: ContextGroup[]
    ungrouped?: string[]
    theme?: AppThemeName
  }
}

const DEFAULT_APP_THEME: AppThemeName = 'aurora'
const APP_THEME_NAMES = new Set<AppThemeName>(['aurora', 'ocean', 'forest', 'ember', 'graphite'])

const patchOptions = (strategy: string): any => ({
  middleware: [{
    pre: async (context: { setHeaderParam: (name: string, value: string) => void }) => {
      context.setHeaderParam('Content-Type', strategy)
      return context
    },
    post: async (context: any) => context,
  }] as any,
  middlewareMergeStrategy: 'append',
})

const mergePatchOptions = () => patchOptions(PatchStrategy.MergePatch)
const strategicMergePatchOptions = () => patchOptions(PatchStrategy.StrategicMergePatch)

const getErrorStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined
  const record = error as {
    statusCode?: unknown
    status?: unknown
    code?: unknown
    response?: { statusCode?: unknown; status?: unknown }
    body?: { code?: unknown }
  }
  const candidates = [
    record.statusCode,
    record.status,
    record.code,
    record.response?.statusCode,
    record.response?.status,
    record.body?.code,
  ]
  for (const candidate of candidates) {
    const code = Number(candidate)
    if (Number.isInteger(code)) return code
  }
  return undefined
}

const isNotFoundError = (error: unknown) => getErrorStatusCode(error) === 404

const patchOrCreate = async (
  patch: () => Promise<unknown>,
  create: () => Promise<unknown>,
) => {
  try {
    await patch()
  } catch (err) {
    if (!isNotFoundError(err)) {
      throw err
    }
    await create()
  }
}

const manifestMetadata = (manifest: KubernetesManifest): Record<string, unknown> => (
  manifest.metadata && typeof manifest.metadata === 'object' && !Array.isArray(manifest.metadata)
    ? manifest.metadata as Record<string, unknown>
    : {}
)

const storeFile = () => path.join(app.getPath('userData'), 'k7s.config.json')

const readStore = async (): Promise<StoreData> => {
  try {
    const raw = await fs.readFile(storeFile(), 'utf-8')
    const data = JSON.parse(raw) as StoreData
    const paths = Array.isArray(data.paths) ? data.paths : []
    const prefs = data.prefs ?? {}
    return { paths, prefs }
  } catch {
    return { paths: [], prefs: {} }
  }
}

const writeStore = async (data: StoreData) => {
  await fs.mkdir(path.dirname(storeFile()), { recursive: true })
  await fs.writeFile(storeFile(), JSON.stringify(data, null, 2), 'utf-8')
}

const buildId = (source: string, contextName: string) => {
  const sanitizedSource = source.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `${sanitizedSource}::${contextName}`
}

const uploadedKubeconfigDir = () => path.join(app.getPath('userData'), 'kubeconfigs')

const uploadedKubeconfigFileName = (sourceName?: string) => {
  const baseName = path.basename(sourceName?.trim() || 'kubeconfig.yaml')
  const safeName = baseName
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    || 'kubeconfig.yaml'
  return `web-${safeName}`
}

const defaultKubeconfigPath = () => {
  const configuredPath = process.env.KUBECONFIG
    ?.split(path.delimiter)
    .map(item => item.trim())
    .find(Boolean)
  return configuredPath ?? path.join(os.homedir(), '.kube', 'config')
}

let contextCache: {
  records: ContextRecord[]
  entries: Map<string, ContextEntry>
  paths: string[]
} | null = null

// Mutex for cache rebuild to prevent race conditions
let cacheBuildPromise: Promise<void> | null = null

const loadFromFile = (filePath: string): KubeConfig => {
  const kubeConfig = new KubeConfig()
  try {
    kubeConfig.loadFromFile(filePath)
    return kubeConfig
  } catch (err) {
    throw new Error(`无法加载 kubeconfig 文件: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const loadDefault = (): KubeConfig => {
  const kubeConfig = new KubeConfig()
  try {
    kubeConfig.loadFromDefault()
    return kubeConfig
  } catch {
    return kubeConfig
  }
}

const rebuildCache = async (force = false) => {
  const store = await readStore()
  const paths = store.paths.filter(Boolean)
  if (!force && contextCache && contextCache.paths.join('|') === paths.join('|')) {
    return
  }
  const records: ContextRecord[] = []
  const entries = new Map<string, ContextEntry>()
  const sources: Array<{ source: string; kubeConfig: KubeConfig; filePath?: string }> = []

  const defaultConfig = loadDefault()
  if (defaultConfig.getContexts().length > 0) {
    sources.push({ source: 'default', kubeConfig: defaultConfig, filePath: defaultKubeconfigPath() })
  }

  for (const filePath of paths) {
    try {
      const config = loadFromFile(filePath)
      const sourceName = path.basename(filePath)
      sources.push({ source: sourceName, kubeConfig: config, filePath })
    } catch {
      continue
    }
  }

  for (const { source, kubeConfig, filePath } of sources) {
    const currentContext = kubeConfig.getCurrentContext()
    for (const ctx of kubeConfig.getContexts()) {
      const id = buildId(source, ctx.name)
      records.push({
        id,
        name: ctx.name,
        cluster: ctx.cluster ?? '',
        user: ctx.user ?? '',
        source,
        current: ctx.name === currentContext,
        namespace: ctx.namespace ?? '',
      })
      entries.set(id, { id, contextName: ctx.name, kubeConfig, filePath })
    }
  }
  contextCache = { records, entries, paths }
}

const ensureCache = async (force = false) => {
  // If already building, wait for that to complete
  if (cacheBuildPromise) {
    await cacheBuildPromise
    if (!force) return
  }

  const store = await readStore()
  const paths = store.paths.filter(Boolean)
  if (!force && contextCache && contextCache.paths.join('|') === paths.join('|')) {
    return
  }

  // Start new build and store promise
  cacheBuildPromise = rebuildCache(force)
  try {
    await cacheBuildPromise
  } finally {
    cacheBuildPromise = null
  }
}

export const listContexts = async (): Promise<ContextRecord[]> => {
  await ensureCache(true)
  return contextCache?.records ?? []
}

const writeKubeConfig = async (entry: ContextEntry) => {
  if (!entry.filePath) {
    throw new Error('无法确定 kubeconfig 文件路径')
  }
  await fs.mkdir(path.dirname(entry.filePath), { recursive: true })
  await fs.writeFile(entry.filePath, entry.kubeConfig.exportConfig(), 'utf-8')
}

const reloadContextsAfterWrite = async () => {
  contextCache = null
  return listContexts()
}

export const useKubeContext = async (contextId: string): Promise<ContextRecord[]> => {
  await ensureCache(true)
  const entry = getEntry(contextId)
  entry.kubeConfig.setCurrentContext(entry.contextName)
  await writeKubeConfig(entry)
  return reloadContextsAfterWrite()
}

export const setKubeContextNamespace = async (contextId: string, namespace: string): Promise<ContextRecord[]> => {
  const targetNamespace = namespace.trim()
  if (!targetNamespace) {
    throw new Error('命名空间不能为空')
  }

  await ensureCache(true)
  const entry = getEntry(contextId)
  const context = entry.kubeConfig.getContexts().find(item => item.name === entry.contextName)
  if (!context) {
    throw new Error('无法在 kubeconfig 中找到 context')
  }

  ;(context as any).namespace = targetNamespace
  await writeKubeConfig(entry)
  return reloadContextsAfterWrite()
}

const sanitizePrefs = (records: ContextRecord[], prefs?: StoreData['prefs']): ContextPrefs => {
  const validIds = new Set(records.map(r => r.id))
  const rawTheme = prefs?.theme as AppThemeName | undefined
  const theme = rawTheme && APP_THEME_NAMES.has(rawTheme) ? rawTheme : DEFAULT_APP_THEME
  const customNamesRaw = prefs?.customNames ?? {}
  const customNames: Record<string, string> = {}
  for (const [id, name] of Object.entries(customNamesRaw)) {
    if (validIds.has(id) && name) customNames[id] = name
  }
  const groupsRaw = (prefs?.groups ?? []).map(g => ({
    id: g.id,
    name: g.name,
    items: (g.items ?? []).filter(id => validIds.has(id))
  }))
  const assignedIds = new Set<string>()
  for (const g of groupsRaw) {
    for (const id of g.items) assignedIds.add(id)
  }
  const ungroupedStored = (prefs?.ungrouped ?? []).filter(id => validIds.has(id))
  const allIds = records.map(r => r.id)
  const ungrouped = [...ungroupedStored]
  for (const id of allIds) {
    if (!assignedIds.has(id) && !ungrouped.includes(id)) {
      ungrouped.push(id)
    }
  }
  return { customNames, groups: groupsRaw, ungrouped, theme }
}

export const getContextPrefs = async (): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const updateContextName = async (contextId: string, name: string): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  if (!store.prefs) store.prefs = {}
  if (!store.prefs.customNames) store.prefs.customNames = {}
  store.prefs.customNames[contextId] = name
  await writeStore(store)
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const updateContextGrouping = async (groups: ContextGroup[], ungrouped: string[]): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  if (!store.prefs) store.prefs = {}
  store.prefs.groups = groups
  store.prefs.ungrouped = ungrouped
  await writeStore(store)
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const updateAppTheme = async (theme: AppThemeName): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  if (!store.prefs) store.prefs = {}
  store.prefs.theme = APP_THEME_NAMES.has(theme) ? theme : DEFAULT_APP_THEME
  await writeStore(store)
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const addKubeconfigPath = async (filePath: string): Promise<AddContextsResult> => {
  try {
    await fs.access(filePath, fs.constants.R_OK)
  } catch {
    throw new Error('无法读取所选文件，请检查文件权限')
  }
  
  let config: KubeConfig
  try {
    config = loadFromFile(filePath)
  } catch (err) {
    throw new Error(`kubeconfig 格式错误: ${err instanceof Error ? err.message : String(err)}`)
  }
  
  const contexts = config.getContexts()
  if (contexts.length === 0) {
    throw new Error('所选文件不包含任何 Kubernetes context')
  }
  
  const store = await readStore()
  const sourceName = path.basename(filePath)
  
  const existingContexts = await listContexts()
  const existingIds = new Set(existingContexts.map(c => c.id))
  
  const existingIndex = store.paths.indexOf(filePath)
  if (existingIndex >= 0) {
    store.paths.splice(existingIndex, 1)
  }
  
  store.paths.push(filePath)
  await writeStore(store)
  
  contextCache = null
  const newContexts = await listContexts()
  
  const addedIds = contexts
    .map(ctx => buildId(sourceName, ctx.name))
    .filter(id => !existingIds.has(id))
  
  return { contexts: newContexts, addedIds }
}

export const addKubeconfigContent = async (
  sourceName: string,
  content: string,
): Promise<AddContextsResult> => {
  if (!content.trim()) {
    throw new Error('kubeconfig 内容不能为空')
  }

  const config = new KubeConfig()
  try {
    config.loadFromString(content)
  } catch (err) {
    throw new Error(`kubeconfig 格式错误: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (config.getContexts().length === 0) {
    throw new Error('所选文件不包含任何 Kubernetes context')
  }

  const targetDir = uploadedKubeconfigDir()
  await fs.mkdir(targetDir, { recursive: true })
  const filePath = path.join(targetDir, uploadedKubeconfigFileName(sourceName))
  await fs.writeFile(filePath, config.exportConfig(), { mode: 0o600 })

  return addKubeconfigPath(filePath)
}

export const getEntry = (contextId: string): ContextEntry => {
  if (!contextCache) {
    throw new Error('context cache not ready')
  }
  const entry = contextCache.entries.get(contextId)
  if (!entry) {
    throw new Error('context not found')
  }
  return entry
}

export const getConfiguredKubeConfig = async (contextId: string): Promise<KubeConfig> => {
  await ensureCache()
  const entry = getEntry(contextId)
  setupKubeConfig(entry)
  return entry.kubeConfig
}

const setupKubeConfig = (entry: ContextEntry) => {
  entry.kubeConfig.setCurrentContext(entry.contextName)
  
  const currentCluster = entry.kubeConfig.getCurrentCluster()
  if (currentCluster && currentCluster.server.startsWith('http://')) {
    const clusterName = currentCluster.name
    const clusterIndex = entry.kubeConfig.clusters.findIndex(c => c.name === clusterName)
    if (clusterIndex >= 0) {
      const cluster = entry.kubeConfig.clusters[clusterIndex]
      entry.kubeConfig.clusters[clusterIndex] = {
        name: cluster.name,
        caData: cluster.caData,
        caFile: cluster.caFile,
        server: cluster.server,
        skipTLSVerify: true,
        tlsServerName: cluster.tlsServerName,
        proxyUrl: cluster.proxyUrl
      }
    }
  }
}

const createCoreV1Api = (entry: ContextEntry): CoreV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CoreV1Api)
}

const createCoreApi = (entry: ContextEntry): CoreApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CoreApi)
}

const createCoordinationV1Api = (entry: ContextEntry): CoordinationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CoordinationV1Api)
}

const createCoordinationV1beta1Api = (entry: ContextEntry): CoordinationV1beta1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CoordinationV1beta1Api)
}

const createApiextensionsV1Api = (entry: ContextEntry): ApiextensionsV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(ApiextensionsV1Api)
}

const createAdmissionregistrationV1Api = (entry: ContextEntry): AdmissionregistrationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AdmissionregistrationV1Api)
}

const createAdmissionregistrationV1beta1Api = (entry: ContextEntry): AdmissionregistrationV1beta1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AdmissionregistrationV1beta1Api)
}

const createApiregistrationV1Api = (entry: ContextEntry): ApiregistrationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(ApiregistrationV1Api)
}

const createApisApi = (entry: ContextEntry): ApisApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(ApisApi)
}

const createVersionApi = (entry: ContextEntry): VersionApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(VersionApi)
}

const createWellKnownApi = (entry: ContextEntry): WellKnownApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(WellKnownApi)
}

const createOpenidApi = (entry: ContextEntry): OpenidApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(OpenidApi)
}

const createHealthClient = (entry: ContextEntry): Health => {
  setupKubeConfig(entry)
  return new Health(entry.kubeConfig)
}

const createAuthenticationV1Api = (entry: ContextEntry): AuthenticationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AuthenticationV1Api)
}

const createAuthorizationV1Api = (entry: ContextEntry): AuthorizationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AuthorizationV1Api)
}

const createCustomObjectsApi = (entry: ContextEntry): CustomObjectsApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CustomObjectsApi)
}

const createAppsV1Api = (entry: ContextEntry): AppsV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AppsV1Api)
}

const createBatchV1Api = (entry: ContextEntry): BatchV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(BatchV1Api)
}

const createCertificatesV1Api = (entry: ContextEntry): CertificatesV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CertificatesV1Api)
}

const createCertificatesV1alpha1Api = (entry: ContextEntry): CertificatesV1alpha1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CertificatesV1alpha1Api)
}

const createCertificatesV1beta1Api = (entry: ContextEntry): CertificatesV1beta1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CertificatesV1beta1Api)
}

const createNetworkingV1Api = (entry: ContextEntry): NetworkingV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(NetworkingV1Api)
}

const createNodeV1Api = (entry: ContextEntry): NodeV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(NodeV1Api)
}

const createPolicyV1Api = (entry: ContextEntry): PolicyV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(PolicyV1Api)
}

const createRbacV1Api = (entry: ContextEntry): RbacAuthorizationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(RbacAuthorizationV1Api)
}

const createSchedulingV1Api = (entry: ContextEntry): SchedulingV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(SchedulingV1Api)
}

const createStorageV1Api = (entry: ContextEntry): StorageV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(StorageV1Api)
}

const createInternalApiserverV1alpha1Api = (entry: ContextEntry): InternalApiserverV1alpha1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(InternalApiserverV1alpha1Api)
}

const createStoragemigrationV1alpha1Api = (entry: ContextEntry): StoragemigrationV1alpha1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(StoragemigrationV1alpha1Api)
}

const createResourceV1Api = (entry: ContextEntry): ResourceV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(ResourceV1Api)
}

const createResourceV1alpha3Api = (entry: ContextEntry): ResourceV1alpha3Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(ResourceV1alpha3Api)
}

const createAutoscalingV2Api = (entry: ContextEntry): AutoscalingV2Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AutoscalingV2Api)
}

const createDiscoveryV1Api = (entry: ContextEntry): DiscoveryV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(DiscoveryV1Api)
}

const createEventsV1Api = (entry: ContextEntry): EventsV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(EventsV1Api)
}

const createFlowcontrolV1Api = (entry: ContextEntry): FlowcontrolApiserverV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(FlowcontrolApiserverV1Api)
}

const roleFromLabels = (labels: Record<string, string>): string => {
  const roles = Object.keys(labels)
    .filter((key) => key.startsWith('node-role.kubernetes.io/'))
    .map((key) => key.replace('node-role.kubernetes.io/', ''))
    .filter(Boolean)
  if (roles.length === 0) {
    return 'worker'
  }
  return roles.join(', ')
}

const nodeReadyStatus = (node: V1Node): string => {
  const conditions = (node.status?.conditions ?? []) as Array<{ type?: string; status?: string }>
  const ready = conditions.find((condition) => condition.type === 'Ready')
  return ready?.status === 'True' ? 'Ready' : 'NotReady'
}

const formatAge = (date?: Date | string): string => {
  if (!date) {
    return ''
  }
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const decodedBase64Size = (value?: string): number => {
  const normalized = value?.replace(/\s/g, '') ?? ''
  if (!normalized) return 0
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding)
}

const customResourceListItems = (res: unknown): CustomResourceObject[] => {
  const typed = res as {
    body?: { items?: CustomResourceObject[] }
    items?: CustomResourceObject[]
  }
  return typed.body?.items ?? typed.items ?? []
}

const customResourceObject = (res: unknown): CustomResourceObject | undefined => {
  const typed = res as any
  if (!typed || typeof typed !== 'object') return undefined
  if ('body' in typed && typed.body) return typed.body
  if ('response' in typed && typed.response) return typed.response
  return typed as CustomResourceObject
}

const customObjectListItems = <T>(res: unknown): T[] => {
  const typed = res as {
    body?: { items?: T[] }
    items?: T[]
  }
  return typed.body?.items ?? typed.items ?? []
}

const parseCpuToNanocores = (value?: string): number => {
  if (!value) return 0
  const match = value.trim().match(/^([0-9.]+)(n|u|m|)?$/)
  if (!match) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0
  switch (match[2]) {
    case 'n':
      return Math.round(amount)
    case 'u':
      return Math.round(amount * 1000)
    case 'm':
      return Math.round(amount * 1000000)
    default:
      return Math.round(amount * 1000000000)
  }
}

const formatNanocores = (value: number): string => {
  if (value <= 0) return '-'
  if (value < 1000000) return `${Math.round(value)}n`
  const millicores = value / 1000000
  return `${Number.isInteger(millicores) ? millicores : Number(millicores.toFixed(1))}m`
}

const parseMemoryToBytes = (value?: string): number => {
  if (!value) return 0
  const match = value.trim().match(/^([0-9.]+)(Ki|Mi|Gi|Ti|Pi|Ei|K|M|G|T|P|E|)?$/)
  if (!match) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0
  const binaryUnits: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
    Ei: 1024 ** 6,
  }
  const decimalUnits: Record<string, number> = {
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
    P: 1000 ** 5,
    E: 1000 ** 6,
  }
  const unit = match[2] ?? ''
  return Math.round(amount * (binaryUnits[unit] ?? decimalUnits[unit] ?? 1))
}

const formatBytes = (value: number): string => {
  if (value <= 0) return '-'
  const units = [
    ['Gi', 1024 ** 3],
    ['Mi', 1024 ** 2],
    ['Ki', 1024],
  ] as const
  const unit = units.find(([, size]) => value >= size)
  if (!unit) return `${value}B`
  const amount = value / unit[1]
  return `${Number.isInteger(amount) ? amount : Number(amount.toFixed(1))}${unit[0]}`
}

const podMetricsKey = (namespace?: string, name?: string): string => `${namespace ?? ''}/${name ?? ''}`

const listPodMetricUsage = async (entry: ContextEntry, namespace?: string): Promise<Map<string, PodMetricUsage>> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = namespace && namespace !== 'all'
      ? await api.listNamespacedCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        namespace,
        plural: 'pods',
      })
      : await api.listClusterCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        plural: 'pods',
      })
    const usage = new Map<string, PodMetricUsage>()
    for (const metric of customObjectListItems<PodMetricsObject>(res)) {
      const name = metric.metadata?.name ?? ''
      const metricNamespace = metric.metadata?.namespace ?? namespace ?? ''
      if (!name || !metricNamespace) continue
      const containers = new Map<string, { cpu: string; memory: string }>()
      const totals = (metric.containers ?? []).reduce((acc, container) => {
        const cpu = parseCpuToNanocores(container.usage?.cpu)
        const memory = parseMemoryToBytes(container.usage?.memory)
        const containerName = container.name ?? ''
        if (containerName) {
          containers.set(containerName, {
            cpu: formatNanocores(cpu),
            memory: formatBytes(memory),
          })
        }
        return {
          cpu: acc.cpu + cpu,
          memory: acc.memory + memory,
        }
      }, { cpu: 0, memory: 0 })
      usage.set(podMetricsKey(metricNamespace, name), {
        name,
        namespace: metricNamespace,
        cpu: formatNanocores(totals.cpu),
        memory: formatBytes(totals.memory),
        containers,
      })
    }
    return usage
  } catch {
    return new Map()
  }
}

const listNodeMetricUsage = async (entry: ContextEntry): Promise<Map<string, PodMetricUsage>> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = await api.listClusterCustomObject({
      group: 'metrics.k8s.io',
      version: 'v1beta1',
      plural: 'nodes',
    })
    const usage = new Map<string, PodMetricUsage>()
    for (const metric of customObjectListItems<NodeMetricsObject>(res)) {
      const name = metric.metadata?.name ?? ''
      if (!name) continue
      usage.set(name, {
        cpu: formatNanocores(parseCpuToNanocores(metric.usage?.cpu)),
        memory: formatBytes(parseMemoryToBytes(metric.usage?.memory)),
      })
    }
    return usage
  } catch {
    return new Map()
  }
}

const preferredCustomResourceVersion = (crd: V1CustomResourceDefinition): string => {
  const versions = crd.spec?.versions ?? []
  return versions.find((version) => version.storage)?.name
    ?? versions.find((version) => version.served)?.name
    ?? versions[0]?.name
    ?? ''
}

const descriptorFromCrd = (crd: V1CustomResourceDefinition): CustomResourceDescriptor => {
  const name = crd.metadata?.name ?? ''
  const version = preferredCustomResourceVersion(crd)
  const group = crd.spec?.group ?? ''
  const plural = crd.spec?.names?.plural ?? ''
  const kind = crd.spec?.names?.kind ?? ''
  const scope = crd.spec?.scope ?? ''

  if (!name || !version || !group || !plural || !kind || !scope) {
    throw new Error(`CRD ${name || 'unknown'} 信息不完整`)
  }

  return {
    crdName: name,
    group,
    version,
    plural,
    kind,
    scope,
  }
}

const getCustomResourceDescriptor = async (
  entry: ContextEntry,
  crdName: string,
): Promise<CustomResourceDescriptor> => {
  const api = createApiextensionsV1Api(entry)
  const res = await api.readCustomResourceDefinition({ name: crdName })
  const crd = extractResponse<V1CustomResourceDefinition>(res)
  if (!crd) {
    throw new Error(`CRD ${crdName} 不存在`)
  }
  return descriptorFromCrd(crd)
}

const findCustomResourceDescriptor = async (
  entry: ContextEntry,
  manifest: KubernetesManifest,
): Promise<CustomResourceDescriptor | null> => {
  const kind = typeof manifest.kind === 'string' ? manifest.kind : ''
  const apiVersion = typeof manifest.apiVersion === 'string' ? manifest.apiVersion : ''
  if (!kind || !apiVersion || !apiVersion.includes('/')) return null

  const [group, version] = apiVersion.split('/')
  if (!group || !version) return null

  const api = createApiextensionsV1Api(entry)
  const res = await api.listCustomResourceDefinition()
  const typedRes = res as { body?: { items?: V1CustomResourceDefinition[] }; items?: V1CustomResourceDefinition[] }
  const crds = typedRes.body?.items ?? typedRes.items ?? []
  const match = crds.find((crd) => (
    crd.spec?.group === group
    && crd.spec?.names?.kind === kind
    && (crd.spec?.versions ?? []).some((candidate) => candidate.name === version && candidate.served !== false)
  ))

  if (!match) return null

  return {
    ...descriptorFromCrd(match),
    version,
  }
}

const customResourceStatus = (resource: CustomResourceObject): string => {
  const status = resource.status
  if (!status || typeof status !== 'object') return ''
  const record = status as Record<string, unknown>
  for (const key of ['phase', 'state', 'status']) {
    if (typeof record[key] === 'string') return record[key] as string
  }
  if (Array.isArray(record.conditions)) {
    const ready = record.conditions.find((condition) => (
      condition
      && typeof condition === 'object'
      && 'type' in condition
      && (condition as { type?: unknown }).type === 'Ready'
    )) as { status?: string; reason?: string } | undefined
    if (ready) {
      return ready.status === 'True' ? 'Ready' : ready.reason ?? ready.status ?? ''
    }
    const active = record.conditions.find((condition) => (
      condition
      && typeof condition === 'object'
      && (condition as { status?: unknown }).status === 'True'
      && typeof (condition as { type?: unknown }).type === 'string'
    )) as { type?: string } | undefined
    if (active?.type) return active.type
  }
  return ''
}

const formatResourceAge = (value?: Date | string): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : formatAge(date)
}

const formatNetworkPolicySelector = (selector?: LabelSelectorLike): string => {
  const labelParts = Object.entries(selector?.matchLabels ?? {})
    .map(([key, value]) => `${key}=${value}`)
  const expressionParts = (selector?.matchExpressions ?? [])
    .map((expression) => {
      if (!expression.key || !expression.operator) return ''
      const values = expression.values?.join(',') ?? ''
      return values ? `${expression.key} ${expression.operator} (${values})` : `${expression.key} ${expression.operator}`
    })
    .filter(Boolean)
  return [...labelParts, ...expressionParts].join(', ') || 'all'
}

const formatNetworkPolicyPeer = (peer: NetworkPolicyPeerLike): string => {
  const parts: string[] = []
  if (peer.namespaceSelector) {
    parts.push(`NamespaceSelector: ${formatNetworkPolicySelector(peer.namespaceSelector)}`)
  }
  if (peer.podSelector) {
    parts.push(`PodSelector: ${formatNetworkPolicySelector(peer.podSelector)}`)
  }
  if (peer.ipBlock?.cidr) {
    const except = peer.ipBlock.except?.length ? ` except ${peer.ipBlock.except.join(', ')}` : ''
    parts.push(`IPBlock: ${peer.ipBlock.cidr}${except}`)
  }
  return parts.join('; ') || 'all'
}

const formatNetworkPolicyPeers = (peers?: NetworkPolicyPeerLike[]): string => (
  peers?.map(formatNetworkPolicyPeer).join(' | ') || 'all'
)

const formatNetworkPolicyPort = (port: NetworkPolicyPortLike): string => {
  const protocol = port.protocol ?? 'TCP'
  if (port.port === undefined) return protocol
  const endPort = port.endPort !== undefined ? `-${port.endPort}` : ''
  return `${protocol}/${port.port}${endPort}`
}

const formatNetworkPolicyPorts = (ports?: NetworkPolicyPortLike[]): string => (
  ports?.map(formatNetworkPolicyPort).join(', ') || 'all'
)

const formatParentReference = (parent?: ParentReferenceLike): string => {
  if (!parent) return '-'
  const group = parent.group ? `${parent.group}/` : ''
  const namespace = parent.namespace ? `${parent.namespace}/` : ''
  return `${group}${parent.resource || '-'}/${namespace}${parent.name || '-'}`
}

const formatTimestamp = (value?: Date | string): string => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().replace('T', ' ').slice(0, 19)
}

const networkPolicyRuleDetails = (policy: V1NetworkPolicy): NetworkPolicyRuleInfo[] => {
  const ingress = ((policy.spec?.ingress ?? []) as NetworkPolicyIngressRuleLike[]).map((rule) => ({
    direction: 'Ingress' as const,
    peers: formatNetworkPolicyPeers(rule._from ?? rule.from),
    ports: formatNetworkPolicyPorts(rule.ports),
  }))
  const egress = ((policy.spec?.egress ?? []) as NetworkPolicyEgressRuleLike[]).map((rule) => ({
    direction: 'Egress' as const,
    peers: formatNetworkPolicyPeers(rule.to),
    ports: formatNetworkPolicyPorts(rule.ports),
  }))
  return [...ingress, ...egress]
}

const ipAddressInfo = (address: V1IPAddress): IPAddressInfo => {
  const parent = address.spec?.parentRef as ParentReferenceLike | undefined
  return {
    name: address.metadata?.name ?? '',
    parentRef: formatParentReference(parent),
    parentGroup: parent?.group || '-',
    parentResource: parent?.resource || '-',
    parentNamespace: parent?.namespace || '-',
    parentName: parent?.name || '-',
    age: formatAge(address.metadata?.creationTimestamp),
    labels: address.metadata?.labels,
  }
}

const serviceCIDRConditions = (serviceCIDR: V1ServiceCIDR): ServiceCIDRConditionInfo[] => (
  ((serviceCIDR.status?.conditions ?? []) as ConditionLike[]).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatTimestamp(condition.lastTransitionTime),
  }))
)

const serviceCIDRInfo = (serviceCIDR: V1ServiceCIDR): ServiceCIDRInfo => {
  const conditions = serviceCIDRConditions(serviceCIDR)
  const ready = conditions.find((condition) => condition.type === 'Ready')
  const cidrs = serviceCIDR.spec?.cidrs ?? []
  return {
    name: serviceCIDR.metadata?.name ?? '',
    cidrs: cidrs.join(', ') || '-',
    cidrCount: cidrs.length,
    ready: ready?.status ?? '-',
    conditions,
    age: formatAge(serviceCIDR.metadata?.creationTimestamp),
    labels: serviceCIDR.metadata?.labels,
  }
}

const formatOptionalValue = (value: unknown): string => (
  value === undefined || value === null || value === '' ? '-' : String(value)
)

const formatQuotaValues = (values?: Record<string, unknown>): string => {
  const entries = Object.entries(values ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${formatOptionalValue(value)}`)
  return entries.join(', ') || '-'
}

const resourceQuotaUsageDetails = (
  hard?: Record<string, unknown>,
  used?: Record<string, unknown>,
): ResourceQuotaUsageInfo[] => {
  const keys = [...new Set([...Object.keys(hard ?? {}), ...Object.keys(used ?? {})])]
    .sort((left, right) => left.localeCompare(right))
  return keys.map((resource) => ({
    resource,
    hard: formatOptionalValue(hard?.[resource]),
    used: formatOptionalValue(used?.[resource]),
  }))
}

const formatResourceQuotaScopeSelector = (scopeSelector?: ResourceQuotaScopeSelectorLike): string => {
  const expressions = scopeSelector?.matchExpressions ?? []
  return expressions
    .map((expression) => {
      const scopeName = expression.scopeName ?? '-'
      const operator = expression.operator ?? '-'
      const values = expression.values?.join(',') ?? ''
      return values ? `${scopeName} ${operator} (${values})` : `${scopeName} ${operator}`
    })
    .join(', ') || '-'
}

const resourceQuotaScopeSelectorDetails = (
  scopeSelector?: ResourceQuotaScopeSelectorLike,
): ResourceQuotaScopeSelectorInfo[] => (
  (scopeSelector?.matchExpressions ?? []).map((expression) => ({
    scopeName: expression.scopeName ?? '-',
    operator: expression.operator ?? '-',
    values: expression.values?.join(', ') || '-',
  }))
)

const formatLimitRangeValues = (
  limits: LimitRangeLimitLike[] | undefined,
  field: 'min' | 'max' | 'default' | 'defaultRequest' | 'maxLimitRequestRatio',
): string => {
  const entries = (limits ?? []).flatMap((limit) => {
    const values = limit[field]
    const formatted = formatQuotaValues(values)
    if (formatted === '-') return []
    return `${limit.type ?? 'Resource'}:${formatted}`
  })
  return entries.join('; ') || '-'
}

const limitRangeItemDetails = (limits?: LimitRangeLimitLike[]): LimitRangeItemInfo[] => (
  (limits ?? []).map((limit) => ({
    type: limit.type ?? 'Resource',
    min: formatQuotaValues(limit.min),
    max: formatQuotaValues(limit.max),
    default: formatQuotaValues(limit.default),
    defaultRequest: formatQuotaValues(limit.defaultRequest),
    maxLimitRequestRatio: formatQuotaValues(limit.maxLimitRequestRatio),
  }))
)

const podDisruptionBudgetConditionDetails = (
  conditions?: PodDisruptionBudgetConditionLike[],
): PodDisruptionBudgetConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const formatEndpointPorts = (ports?: Array<{ name?: string; port?: number; protocol?: string }>): string => (
  (ports ?? [])
    .map((port) => {
      const protocol = port.protocol?.toLowerCase() ?? 'tcp'
      return port.name ? `${port.name}:${port.port ?? '-'}/${protocol}` : `${port.port ?? '-'}/${protocol}`
    })
    .join(', ') || '-'
)

const endpointAddressDetails = (subsets: Array<{
  addresses?: EndpointAddressLike[]
  notReadyAddresses?: EndpointAddressLike[]
}>): EndpointAddressInfo[] => (
  subsets.flatMap((subset) => [
    ...(subset.addresses ?? []).map((address) => ({
      ip: address.ip ?? '-',
      ready: true,
      hostname: address.hostname ?? '-',
      nodeName: address.nodeName ?? '-',
      targetKind: address.targetRef?.kind ?? '-',
      targetName: address.targetRef?.name ?? '-',
    })),
    ...(subset.notReadyAddresses ?? []).map((address) => ({
      ip: address.ip ?? '-',
      ready: false,
      hostname: address.hostname ?? '-',
      nodeName: address.nodeName ?? '-',
      targetKind: address.targetRef?.kind ?? '-',
      targetName: address.targetRef?.name ?? '-',
    })),
  ])
)

const endpointPortDetails = (subsets: Array<{ ports?: EndpointPortLike[] }>): EndpointPortInfo[] => {
  const details = subsets.flatMap((subset) => (
    (subset.ports ?? []).map((port) => ({
      name: port.name || '-',
      port: port.port !== undefined ? String(port.port) : '-',
      protocol: port.protocol ?? 'TCP',
      appProtocol: port.appProtocol ?? '-',
    }))
  ))
  return details.filter((port, index, list) => (
    list.findIndex((item) => (
      item.name === port.name
        && item.port === port.port
        && item.protocol === port.protocol
        && item.appProtocol === port.appProtocol
    )) === index
  ))
}

const endpointSliceEndpointDetails = (endpoints?: EndpointSliceEndpointLike[]): EndpointSliceEndpointInfo[] => (
  (endpoints ?? []).map((endpoint) => ({
    addresses: endpoint.addresses?.join(', ') || '-',
    ready: endpoint.conditions?.ready !== false,
    serving: endpoint.conditions?.serving !== false,
    terminating: endpoint.conditions?.terminating === true,
    hostname: endpoint.hostname ?? '-',
    nodeName: endpoint.nodeName ?? '-',
    zone: endpoint.zone ?? '-',
    targetKind: endpoint.targetRef?.kind ?? '-',
    targetName: endpoint.targetRef?.name ?? '-',
  }))
)

const endpointSlicePortDetails = (ports?: EndpointSlicePortLike[]): EndpointSlicePortInfo[] => (
  (ports ?? []).map((port) => ({
    name: port.name || '-',
    port: port.port !== undefined ? String(port.port) : '-',
    protocol: port.protocol ?? 'TCP',
    appProtocol: port.appProtocol ?? '-',
  }))
)

const uniqueValues = (values: string[]): string[] => [...new Set(values.filter(Boolean))]

const formatOwnerReferences = (owners?: Array<{ kind?: string; name?: string; controller?: boolean }>): string => {
  const controller = owners?.find((owner) => owner.controller)
  const owner = controller ?? owners?.[0]
  if (!owner?.kind && !owner?.name) return '-'
  return `${owner.kind ?? 'Owner'}/${owner.name ?? '-'}`
}

const formatObjectKind = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '-'
  const object = value as { apiVersion?: unknown; kind?: unknown }
  if (typeof object.kind !== 'string' || !object.kind) return '-'
  return typeof object.apiVersion === 'string' && object.apiVersion
    ? `${object.apiVersion}/${object.kind}`
    : object.kind
}

const podPersistentVolumeClaims = (pod: V1Pod): string[] => (
  uniqueValues((pod.spec?.volumes ?? []).map((volume) => volume.persistentVolumeClaim?.claimName ?? ''))
)

const formatPersistentVolumeClaimRef = (pv: V1PersistentVolume): string => {
  const claimRef = pv.spec?.claimRef
  if (!claimRef?.name) return '-'
  return claimRef.namespace ? `${claimRef.namespace}/${claimRef.name}` : claimRef.name
}

const formatPersistentVolumeSource = (pv: V1PersistentVolume): string => {
  const spec = pv.spec
  if (!spec) return '-'
  if (spec.csi) return `CSI ${spec.csi.driver ?? '-'}`
  if (spec.hostPath) return `HostPath ${spec.hostPath.path ?? '-'}`
  if (spec.nfs) return `NFS ${spec.nfs.server ?? '-'}:${spec.nfs.path ?? '-'}`
  if (spec.awsElasticBlockStore) return `AWSEBS ${spec.awsElasticBlockStore.volumeID ?? '-'}`
  if (spec.gcePersistentDisk) return `GCEPD ${spec.gcePersistentDisk.pdName ?? '-'}`
  if (spec.azureDisk) return `AzureDisk ${spec.azureDisk.diskName ?? '-'}`
  if (spec.azureFile) return `AzureFile ${spec.azureFile.shareName ?? '-'}`
  if (spec.fc) return `FC ${spec.fc.wwids?.join(', ') || spec.fc.targetWWNs?.join(', ') || '-'}`
  if (spec.iscsi) return `iSCSI ${spec.iscsi.targetPortal ?? '-'}`
  if (spec.local) return `Local ${spec.local.path ?? '-'}`
  if (spec.rbd) return `RBD ${spec.rbd.image ?? '-'}`
  if (spec.vsphereVolume) return `vSphere ${spec.vsphereVolume.volumePath ?? '-'}`
  if (spec.cinder) return `Cinder ${spec.cinder.volumeID ?? '-'}`
  if (spec.cephfs) return 'CephFS'
  if (spec.glusterfs) return `GlusterFS ${spec.glusterfs.path ?? '-'}`
  if (spec.photonPersistentDisk) return `PhotonPD ${spec.photonPersistentDisk.pdID ?? '-'}`
  if (spec.portworxVolume) return `Portworx ${spec.portworxVolume.volumeID ?? '-'}`
  if (spec.quobyte) return `Quobyte ${spec.quobyte.volume ?? '-'}`
  if (spec.scaleIO) return `ScaleIO ${spec.scaleIO.volumeName ?? '-'}`
  if (spec.storageos) return `StorageOS ${spec.storageos.volumeName ?? '-'}`
  if (spec.flexVolume) return `FlexVolume ${spec.flexVolume.driver ?? '-'}`
  return '-'
}

const isDefaultStorageClass = (annotations?: Record<string, string>): boolean => (
  annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true'
    || annotations?.['storageclass.beta.kubernetes.io/is-default-class'] === 'true'
)

const formatRbacValues = (values?: string[], fallback = '*'): string => (
  values && values.filter(Boolean).length > 0 ? values.filter(Boolean).join(', ') : fallback
)

const formatRbacApiGroups = (values?: string[]): string => (
  formatRbacValues(values, 'core')
)

const rbacRuleInfo = (rule: {
  verbs?: string[]
  apiGroups?: string[]
  resources?: string[]
  resourceNames?: string[]
  nonResourceURLs?: string[]
}): RbacRuleInfo => ({
  verbs: formatRbacValues(rule.verbs),
  apiGroups: formatRbacApiGroups(rule.apiGroups),
  resources: formatRbacValues(rule.resources),
  resourceNames: formatRbacValues(rule.resourceNames, '-'),
  nonResourceURLs: formatRbacValues(rule.nonResourceURLs, '-'),
})

const selfSubjectRuleNamespaces = (namespaces?: string | string[]): string[] => {
  const values = Array.isArray(namespaces) ? namespaces : namespaces ? [namespaces] : ['default']
  const unique = [...new Set(values.map((namespace) => String(namespace ?? '').trim()).filter(Boolean))]
  return unique.length > 0 ? unique : ['default']
}

type SelfSubjectAccessReviewCheck = {
  name: string
  scope: SelfSubjectAccessReviewInfo['scope']
  verb: string
  namespace?: string
  group?: string
  resource?: string
  subresource?: string
  resourceName?: string
  path?: string
}

const CLUSTER_ACCESS_REVIEW_CHECKS: SelfSubjectAccessReviewCheck[] = [
  { name: 'list nodes', scope: 'Cluster', verb: 'list', resource: 'nodes' },
  { name: 'list namespaces', scope: 'Cluster', verb: 'list', resource: 'namespaces' },
  { name: 'list persistentvolumes', scope: 'Cluster', verb: 'list', resource: 'persistentvolumes' },
  { name: 'list storageclasses', scope: 'Cluster', verb: 'list', group: 'storage.k8s.io', resource: 'storageclasses' },
  { name: 'list clusterroles', scope: 'Cluster', verb: 'list', group: 'rbac.authorization.k8s.io', resource: 'clusterroles' },
  { name: 'list crds', scope: 'Cluster', verb: 'list', group: 'apiextensions.k8s.io', resource: 'customresourcedefinitions' },
]

const NAMESPACED_ACCESS_REVIEW_CHECKS: Omit<SelfSubjectAccessReviewCheck, 'namespace' | 'scope'>[] = [
  { name: 'list pods', verb: 'list', resource: 'pods' },
  { name: 'delete pods', verb: 'delete', resource: 'pods' },
  { name: 'get pod logs', verb: 'get', resource: 'pods', subresource: 'log' },
  { name: 'exec into pods', verb: 'create', resource: 'pods', subresource: 'exec' },
  { name: 'list deployments', verb: 'list', group: 'apps', resource: 'deployments' },
  { name: 'scale deployments', verb: 'update', group: 'apps', resource: 'deployments', subresource: 'scale' },
  { name: 'list services', verb: 'list', resource: 'services' },
  { name: 'get secrets', verb: 'get', resource: 'secrets' },
  { name: 'list configmaps', verb: 'list', resource: 'configmaps' },
  { name: 'list events', verb: 'list', group: 'events.k8s.io', resource: 'events' },
]

const NON_RESOURCE_ACCESS_REVIEW_CHECKS: SelfSubjectAccessReviewCheck[] = [
  { name: 'get /readyz', scope: 'NonResource', verb: 'get', path: '/readyz' },
  { name: 'get /livez', scope: 'NonResource', verb: 'get', path: '/livez' },
  { name: 'get /healthz', scope: 'NonResource', verb: 'get', path: '/healthz' },
]

const selfSubjectAccessReviewChecks = (namespaces: string[]): SelfSubjectAccessReviewCheck[] => [
  ...CLUSTER_ACCESS_REVIEW_CHECKS,
  ...NON_RESOURCE_ACCESS_REVIEW_CHECKS,
  ...namespaces.flatMap((namespace) => (
    NAMESPACED_ACCESS_REVIEW_CHECKS.map((check) => ({
      ...check,
      name: `${namespace}/${check.name}`,
      namespace,
      scope: 'Namespaced' as const,
    }))
  )),
]

const selfSubjectAccessReviewBody = (check: SelfSubjectAccessReviewCheck): V1SelfSubjectAccessReview => {
  if (check.path) {
    return {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        nonResourceAttributes: {
          path: check.path,
          verb: check.verb,
        },
      },
    } as V1SelfSubjectAccessReview
  }

  return {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        namespace: check.namespace,
        verb: check.verb,
        group: check.group,
        resource: check.resource,
        subresource: check.subresource,
        name: check.resourceName,
      },
    },
  } as V1SelfSubjectAccessReview
}

const selfSubjectAccessReviewInfo = (
  check: SelfSubjectAccessReviewCheck,
  result: PromiseSettledResult<V1SelfSubjectAccessReview>,
): SelfSubjectAccessReviewInfo => {
  if (result.status === 'rejected') {
    return {
      name: check.name,
      namespace: check.namespace ?? '-',
      scope: check.scope,
      verb: check.verb,
      apiGroup: check.group || (check.path ? '-' : 'core'),
      resource: check.resource ?? '-',
      subresource: check.subresource ?? '-',
      resourceName: check.resourceName ?? '-',
      path: check.path ?? '-',
      allowed: false,
      denied: false,
      status: 'Error',
      reason: '-',
      evaluationError: result.reason instanceof Error ? result.reason.message : String(result.reason),
    }
  }

  const status = result.value.status
  const allowed = Boolean(status?.allowed)
  const denied = Boolean(status?.denied)
  return {
    name: check.name,
    namespace: check.namespace ?? '-',
    scope: check.scope,
    verb: check.verb,
    apiGroup: check.group || (check.path ? '-' : 'core'),
    resource: check.resource ?? '-',
    subresource: check.subresource ?? '-',
    resourceName: check.resourceName ?? '-',
    path: check.path ?? '-',
    allowed,
    denied,
    status: denied ? 'Denied' : allowed ? 'Allowed' : 'NoOpinion',
    reason: status?.reason || '-',
    evaluationError: status?.evaluationError || '-',
  }
}

const selfSubjectResourceRuleInfo = (
  namespace: string,
  rule: {
    verbs?: string[]
    apiGroups?: string[]
    resources?: string[]
    resourceNames?: string[]
  },
  index: number,
  incomplete: boolean,
  evaluationError: string,
): SelfSubjectRuleInfo => ({
  name: `${namespace}/resource-${index + 1}`,
  namespace,
  type: 'Resource',
  verbs: formatRbacValues(rule.verbs),
  apiGroups: formatRbacApiGroups(rule.apiGroups),
  resources: formatRbacValues(rule.resources),
  resourceNames: formatRbacValues(rule.resourceNames, '-'),
  nonResourceURLs: '-',
  incomplete,
  evaluationError,
})

const selfSubjectNonResourceRuleInfo = (
  namespace: string,
  rule: {
    verbs?: string[]
    nonResourceURLs?: string[]
  },
  index: number,
  incomplete: boolean,
  evaluationError: string,
): SelfSubjectRuleInfo => ({
  name: `${namespace}/nonresource-${index + 1}`,
  namespace,
  type: 'NonResource',
  verbs: formatRbacValues(rule.verbs),
  apiGroups: '-',
  resources: '-',
  resourceNames: '-',
  nonResourceURLs: formatRbacValues(rule.nonResourceURLs),
  incomplete,
  evaluationError,
})

const rbacSubjectInfo = (subject: {
  kind?: string
  name?: string
  namespace?: string
  apiGroup?: string
}): RbacSubjectInfo => ({
  kind: subject.kind ?? '-',
  name: subject.name ?? '-',
  namespace: subject.namespace,
  apiGroup: subject.apiGroup,
})

const formatClusterRoleAggregation = (selectors?: Array<{
  matchLabels?: Record<string, string>
  matchExpressions?: Array<{
    key?: string
    operator?: string
    values?: string[]
  }>
}>): string => (
  (selectors ?? []).map(formatNetworkPolicySelector).join('; ') || '-'
)

const formatAdmissionClient = (webhook: AdmissionWebhook): string => {
  const service = webhook.clientConfig?.service
  if (service?.name) {
    const namespace = service.namespace ? `${service.namespace}/` : ''
    const port = service.port ? `:${service.port}` : ''
    const path = service.path ?? ''
    return `svc:${namespace}${service.name}${port}${path}`
  }
  return webhook.clientConfig?.url ?? '-'
}

const formatAdmissionRules = (webhooks: AdmissionWebhook[]): string => {
  const rules = webhooks.flatMap((webhook) => webhook.rules ?? [])
  const resources = uniqueValues(rules.flatMap((rule) => rule.resources ?? []))
  const operations = uniqueValues(rules.flatMap((rule) => rule.operations ?? []))
  if (resources.length === 0 && operations.length === 0) return '-'
  const resourceText = resources.join(',') || '*'
  const operationText = operations.join(',') || '*'
  return `${operationText} ${resourceText}`
}

const admissionWebhookDetails = (webhooks: AdmissionWebhook[]): AdmissionWebhookInfo[] => (
  webhooks.map((webhook) => {
    const service = webhook.clientConfig?.service
    return {
      name: webhook.name ?? '-',
      client: formatAdmissionClient(webhook),
      serviceNamespace: service?.namespace,
      serviceName: service?.name,
      servicePort: service?.port,
      servicePath: service?.path,
      failurePolicy: webhook.failurePolicy ?? 'Fail',
      sideEffects: webhook.sideEffects ?? '-',
      admissionReviewVersions: webhook.admissionReviewVersions?.join(', ') || '-',
      matchPolicy: webhook.matchPolicy ?? 'Equivalent',
      reinvocationPolicy: webhook.reinvocationPolicy ?? '-',
      timeoutSeconds: webhook.timeoutSeconds !== undefined ? String(webhook.timeoutSeconds) : '-',
      namespaceSelector: formatNetworkPolicySelector(webhook.namespaceSelector),
      objectSelector: formatNetworkPolicySelector(webhook.objectSelector),
      rules: webhook.rules?.length ?? 0,
      matchConditions: webhook.matchConditions?.length ?? 0,
      caBundleConfigured: Boolean(webhook.clientConfig?.caBundle),
    }
  })
)

const admissionWebhookRuleDetails = (webhooks: AdmissionWebhook[]): AdmissionWebhookRuleInfo[] => (
  webhooks.flatMap((webhook) => (
    (webhook.rules ?? []).map((rule) => ({
      webhookName: webhook.name ?? '-',
      operations: formatRbacValues(rule.operations),
      apiGroups: formatRbacApiGroups(rule.apiGroups),
      apiVersions: formatRbacValues(rule.apiVersions),
      resources: formatRbacValues(rule.resources),
      scope: rule.scope ?? '*',
    }))
  ))
)

const admissionWebhookConfigurationInfo = (
  config: V1MutatingWebhookConfiguration | V1ValidatingWebhookConfiguration,
): AdmissionWebhookConfigurationInfo => {
  const webhooks = (config.webhooks ?? []) as AdmissionWebhook[]
  return {
    name: config.metadata?.name ?? '',
    webhooks: webhooks.length,
    failurePolicies: uniqueValues(webhooks.map((webhook) => webhook.failurePolicy ?? 'Fail')).join(', ') || '-',
    sideEffects: uniqueValues(webhooks.map((webhook) => webhook.sideEffects ?? '-')).join(', ') || '-',
    admissionReviewVersions: uniqueValues(webhooks.flatMap((webhook) => webhook.admissionReviewVersions ?? [])).join(', ') || '-',
    clients: uniqueValues(webhooks.map(formatAdmissionClient)).join(', ') || '-',
    rules: formatAdmissionRules(webhooks),
    age: formatAge(config.metadata?.creationTimestamp),
    labels: config.metadata?.labels,
    webhookDetails: admissionWebhookDetails(webhooks),
    ruleDetails: admissionWebhookRuleDetails(webhooks),
  }
}

const formatAdmissionPolicyRules = (rules?: AdmissionMatchRule[]): string => {
  const resources = uniqueValues((rules ?? []).flatMap((rule) => rule.resources ?? []))
  const operations = uniqueValues((rules ?? []).flatMap((rule) => rule.operations ?? []))
  if (resources.length === 0 && operations.length === 0) return '-'
  return `${operations.join(',') || '*'} ${resources.join(',') || '*'}`
}

const formatAdmissionMatchResources = (matchResources?: AdmissionMatchResources): string => {
  const included = formatAdmissionPolicyRules(matchResources?.resourceRules)
  const excluded = formatAdmissionPolicyRules(matchResources?.excludeResourceRules)
  if (included === '-' && excluded === '-') return '-'
  return excluded === '-' ? included : `${included}; exclude ${excluded}`
}

const formatParamKind = (paramKind?: { apiVersion?: string; kind?: string }): string => {
  if (!paramKind?.kind) return '-'
  return paramKind.apiVersion ? `${paramKind.apiVersion}/${paramKind.kind}` : paramKind.kind
}

const formatParamRef = (paramRef?: { name?: string; namespace?: string; parameterNotFoundAction?: string }): string => {
  if (!paramRef) return '-'
  const target = paramRef.name ? `${paramRef.namespace ? `${paramRef.namespace}/` : ''}${paramRef.name}` : 'selector'
  return paramRef.parameterNotFoundAction ? `${target} (${paramRef.parameterNotFoundAction})` : target
}

const admissionPolicyRuleDetails = (matchResources?: AdmissionMatchResources): AdmissionPolicyRuleInfo[] => {
  const mapRule = (direction: 'Include' | 'Exclude') => (rule: AdmissionMatchRule) => ({
    direction,
    operations: formatRbacValues(rule.operations),
    apiGroups: formatRbacApiGroups(rule.apiGroups),
    apiVersions: formatRbacValues(rule.apiVersions),
    resources: formatRbacValues(rule.resources),
    resourceNames: formatRbacValues(rule.resourceNames, '-'),
    scope: rule.scope ?? '*',
  })
  return [
    ...(matchResources?.resourceRules ?? []).map(mapRule('Include')),
    ...(matchResources?.excludeResourceRules ?? []).map(mapRule('Exclude')),
  ]
}

const admissionValidationDetails = (
  validations?: AdmissionValidationLike[],
): ValidatingAdmissionValidationInfo[] => (
  (validations ?? []).map((validation, index) => ({
    index: index + 1,
    expressionConfigured: Boolean(validation.expression),
    message: validation.message ?? '-',
    reason: validation.reason ?? '-',
    messageExpressionConfigured: Boolean(validation.messageExpression),
  }))
)

const admissionAuditAnnotationDetails = (
  annotations?: AdmissionAuditAnnotationLike[],
): ValidatingAdmissionAuditAnnotationInfo[] => (
  (annotations ?? []).map((annotation) => ({
    key: annotation.key ?? '-',
    valueExpressionConfigured: Boolean(annotation.valueExpression),
  }))
)

const admissionPolicyConditionDetails = (
  conditions?: AdmissionPolicyConditionLike[],
): AdmissionPolicyConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const admissionPolicyWarningDetails = (
  warnings?: AdmissionExpressionWarningLike[],
): AdmissionPolicyWarningInfo[] => (
  (warnings ?? []).map((warning) => ({
    fieldRef: warning.fieldRef ?? '-',
    warning: warning.warning ?? '-',
  }))
)

const admissionParamRefDetails = (paramRef?: AdmissionParamRefLike): AdmissionPolicyParamRefInfo | undefined => {
  if (!paramRef) return undefined
  return {
    name: paramRef.name ?? '-',
    namespace: paramRef.namespace ?? '-',
    selector: formatNetworkPolicySelector(paramRef.selector),
    parameterNotFoundAction: paramRef.parameterNotFoundAction ?? '-',
  }
}

const mutatingAdmissionMutationDetails = (
  mutations?: AdmissionMutationLike[],
): MutatingAdmissionMutationInfo[] => (
  (mutations ?? []).map((mutation, index) => ({
    index: index + 1,
    patchType: mutation.patchType ?? '-',
    applyConfigurationConfigured: Boolean(mutation.applyConfiguration?.expression),
    jsonPatchConfigured: Boolean(mutation.jsonPatch?.expression),
  }))
)

const mutatingAdmissionVariableDetails = (
  variables?: AdmissionVariableLike[],
): MutatingAdmissionVariableInfo[] => (
  (variables ?? []).map((variable) => ({
    name: variable.name ?? '-',
    expressionConfigured: Boolean(variable.expression),
  }))
)

const mutatingAdmissionMatchConditionDetails = (
  conditions?: AdmissionMatchConditionLike[],
): MutatingAdmissionMatchConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    name: condition.name ?? '-',
    expressionConfigured: Boolean(condition.expression),
  }))
)

const admissionPolicyCondition = (policy: V1ValidatingAdmissionPolicy): string => {
  const ready = policy.status?.conditions?.find((condition) => condition.type === 'Ready')
  if (ready) return ready.status === 'True' ? 'Ready' : ready.reason ?? ready.status ?? 'NotReady'
  const active = policy.status?.conditions?.find((condition) => condition.status === 'True')
  return active?.type ?? '-'
}

const mutatingAdmissionPolicyInfo = (
  policy: V1beta1MutatingAdmissionPolicy,
): MutatingAdmissionPolicyInfo => ({
  name: policy.metadata?.name ?? '',
  failurePolicy: policy.spec?.failurePolicy ?? 'Fail',
  reinvocationPolicy: policy.spec?.reinvocationPolicy ?? '-',
  mutations: policy.spec?.mutations?.length ?? 0,
  variables: policy.spec?.variables?.length ?? 0,
  matchConditions: policy.spec?.matchConditions?.length ?? 0,
  matchConstraints: formatAdmissionMatchResources(policy.spec?.matchConstraints),
  paramKind: formatParamKind(policy.spec?.paramKind),
  age: formatAge(policy.metadata?.creationTimestamp),
  labels: policy.metadata?.labels,
  mutationDetails: mutatingAdmissionMutationDetails(policy.spec?.mutations as AdmissionMutationLike[] | undefined),
  variableDetails: mutatingAdmissionVariableDetails(policy.spec?.variables as AdmissionVariableLike[] | undefined),
  matchConditionDetails: mutatingAdmissionMatchConditionDetails(
    policy.spec?.matchConditions as AdmissionMatchConditionLike[] | undefined,
  ),
  matchRuleDetails: admissionPolicyRuleDetails(policy.spec?.matchConstraints),
})

const mutatingAdmissionPolicyBindingInfo = (
  binding: V1beta1MutatingAdmissionPolicyBinding,
): MutatingAdmissionPolicyBindingInfo => ({
  name: binding.metadata?.name ?? '',
  policyName: binding.spec?.policyName ?? '-',
  paramRef: formatParamRef(binding.spec?.paramRef),
  matchResources: formatAdmissionMatchResources(binding.spec?.matchResources),
  age: formatAge(binding.metadata?.creationTimestamp),
  labels: binding.metadata?.labels,
  paramRefDetails: admissionParamRefDetails(binding.spec?.paramRef),
  matchRuleDetails: admissionPolicyRuleDetails(binding.spec?.matchResources),
})

const validatingAdmissionPolicyInfo = (policy: V1ValidatingAdmissionPolicy): ValidatingAdmissionPolicyInfo => ({
  name: policy.metadata?.name ?? '',
  failurePolicy: policy.spec?.failurePolicy ?? 'Fail',
  validations: policy.spec?.validations?.length ?? 0,
  auditAnnotations: policy.spec?.auditAnnotations?.length ?? 0,
  matchConstraints: formatAdmissionMatchResources(policy.spec?.matchConstraints),
  paramKind: formatParamKind(policy.spec?.paramKind),
  condition: admissionPolicyCondition(policy),
  warnings: policy.status?.typeChecking?.expressionWarnings?.length ?? 0,
  age: formatAge(policy.metadata?.creationTimestamp),
  labels: policy.metadata?.labels,
  validationDetails: admissionValidationDetails(policy.spec?.validations as AdmissionValidationLike[] | undefined),
  auditAnnotationDetails: admissionAuditAnnotationDetails(policy.spec?.auditAnnotations as AdmissionAuditAnnotationLike[] | undefined),
  matchRuleDetails: admissionPolicyRuleDetails(policy.spec?.matchConstraints),
  conditionDetails: admissionPolicyConditionDetails(policy.status?.conditions as AdmissionPolicyConditionLike[] | undefined),
  warningDetails: admissionPolicyWarningDetails(
    policy.status?.typeChecking?.expressionWarnings as AdmissionExpressionWarningLike[] | undefined,
  ),
})

const validatingAdmissionPolicyBindingInfo = (
  binding: V1ValidatingAdmissionPolicyBinding,
): ValidatingAdmissionPolicyBindingInfo => ({
  name: binding.metadata?.name ?? '',
  policyName: binding.spec?.policyName ?? '-',
  validationActions: binding.spec?.validationActions?.join(', ') || '-',
  paramRef: formatParamRef(binding.spec?.paramRef),
  matchResources: formatAdmissionMatchResources(binding.spec?.matchResources),
  age: formatAge(binding.metadata?.creationTimestamp),
  labels: binding.metadata?.labels,
  paramRefDetails: admissionParamRefDetails(binding.spec?.paramRef),
  matchRuleDetails: admissionPolicyRuleDetails(binding.spec?.matchResources),
})

const formatFlowSubject = (subject: FlowSubject): string => {
  if (subject.kind === 'User') return `user:${subject.user?.name ?? '*'}`
  if (subject.kind === 'Group') return `group:${subject.group?.name ?? '*'}`
  if (subject.kind === 'ServiceAccount') {
    const namespace = subject.serviceAccount?.namespace ? `${subject.serviceAccount.namespace}/` : ''
    return `sa:${namespace}${subject.serviceAccount?.name ?? '*'}`
  }
  return subject.kind ?? '-'
}

const formatFlowSubjects = (rules?: FlowPolicyRule[]): string => {
  const subjects = uniqueValues((rules ?? []).flatMap((rule) => rule.subjects ?? []).map(formatFlowSubject))
  return subjects.join(', ') || '-'
}

const flowRuleSubjectText = (subjects?: FlowSubject[]): string => (
  (subjects ?? []).map(formatFlowSubject).join(', ') || '-'
)

const flowSubjectDetails = (rules?: FlowPolicyRule[]): FlowSchemaSubjectInfo[] => (
  (rules ?? []).flatMap((rule, ruleIndex) => (
    (rule.subjects ?? []).map((subject) => ({
      ruleIndex: ruleIndex + 1,
      kind: subject.kind ?? '-',
      name: subject.user?.name ?? subject.group?.name ?? subject.serviceAccount?.name ?? '*',
      namespace: subject.serviceAccount?.namespace ?? '-',
    }))
  ))
)

const formatFlowResourceRules = (rules?: FlowResourcePolicyRule[]): string => {
  const resources = uniqueValues((rules ?? []).flatMap((rule) => rule.resources ?? []))
  const verbs = uniqueValues((rules ?? []).flatMap((rule) => rule.verbs ?? []))
  if (resources.length === 0 && verbs.length === 0) return '-'
  return `${verbs.join(',') || '*'} ${resources.join(',') || '*'}`
}

const formatFlowNonResourceRules = (rules?: FlowNonResourcePolicyRule[]): string => {
  const urls = uniqueValues((rules ?? []).flatMap((rule) => rule.nonResourceURLs ?? []))
  const verbs = uniqueValues((rules ?? []).flatMap((rule) => rule.verbs ?? []))
  if (urls.length === 0 && verbs.length === 0) return '-'
  return `${verbs.join(',') || '*'} ${urls.join(',') || '*'}`
}

const formatFlowRules = (rules?: FlowPolicyRule[]): string => {
  const resourceRules = formatFlowResourceRules((rules ?? []).flatMap((rule) => rule.resourceRules ?? []))
  const nonResourceRules = formatFlowNonResourceRules((rules ?? []).flatMap((rule) => rule.nonResourceRules ?? []))
  if (resourceRules === '-' && nonResourceRules === '-') return '-'
  if (resourceRules === '-') return `nonResource ${nonResourceRules}`
  return nonResourceRules === '-' ? resourceRules : `${resourceRules}; nonResource ${nonResourceRules}`
}

const flowResourceRuleDetails = (rules?: FlowPolicyRule[]): FlowSchemaResourceRuleInfo[] => (
  (rules ?? []).flatMap((rule, ruleIndex) => (
    (rule.resourceRules ?? []).map((resourceRule) => ({
      ruleIndex: ruleIndex + 1,
      subjects: flowRuleSubjectText(rule.subjects),
      verbs: formatRbacValues(resourceRule.verbs),
      apiGroups: formatRbacApiGroups(resourceRule.apiGroups),
      resources: formatRbacValues(resourceRule.resources),
      namespaces: formatRbacValues(resourceRule.namespaces),
      clusterScope: resourceRule.clusterScope === true,
    }))
  ))
)

const flowNonResourceRuleDetails = (rules?: FlowPolicyRule[]): FlowSchemaNonResourceRuleInfo[] => (
  (rules ?? []).flatMap((rule, ruleIndex) => (
    (rule.nonResourceRules ?? []).map((nonResourceRule) => ({
      ruleIndex: ruleIndex + 1,
      subjects: flowRuleSubjectText(rule.subjects),
      verbs: formatRbacValues(nonResourceRule.verbs),
      nonResourceURLs: formatRbacValues(nonResourceRule.nonResourceURLs),
    }))
  ))
)

const flowControlCondition = (conditions?: FlowControlCondition[]): string => {
  const dangling = conditions?.find((condition) => condition.type === 'Dangling')
  if (dangling) return dangling.status === 'True' ? dangling.reason ?? 'Dangling' : 'Ready'
  const active = conditions?.find((condition) => condition.status === 'True')
  return active?.type ?? '-'
}

const flowControlConditionDetails = (
  conditions?: FlowControlCondition[],
): FlowControlConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const formatHPATargetValue = (target?: HPAMetricTargetLike): string => {
  if (!target) return '-'
  const parts = [
    target.type,
    target.averageUtilization !== undefined ? `${target.averageUtilization}%` : '',
    target.averageValue !== undefined ? `avg=${formatOptionalValue(target.averageValue)}` : '',
    target.value !== undefined ? `value=${formatOptionalValue(target.value)}` : '',
  ].filter(Boolean)
  return parts.join(' ') || '-'
}

const hpaMetricName = (metric: HPAMetricSourceLike): string => {
  if (metric.resource) return metric.resource.name ?? '-'
  if (metric.containerResource) {
    const container = metric.containerResource.container ? `/${metric.containerResource.container}` : ''
    return `${metric.containerResource.name ?? '-'}${container}`
  }
  if (metric.pods) return metric.pods.metric?.name ?? '-'
  if (metric.object) {
    const object = metric.object.describedObject
    const describedObject = object?.kind || object?.name ? ` ${object?.kind ?? '-'}/${object?.name ?? '-'}` : ''
    return `${metric.object.metric?.name ?? '-'}${describedObject}`
  }
  if (metric.external) return metric.external.metric?.name ?? '-'
  return '-'
}

const hpaMetricTarget = (metric: HPAMetricSourceLike): string => (
  formatHPATargetValue(
    metric.resource?.target
      ?? metric.containerResource?.target
      ?? metric.pods?.target
      ?? metric.object?.target
      ?? metric.external?.target,
  )
)

const hpaMetricCurrent = (metric: HPAMetricSourceLike): string => (
  formatHPATargetValue(
    metric.resource?.current
      ?? metric.containerResource?.current
      ?? metric.pods?.current
      ?? metric.object?.current
      ?? metric.external?.current,
  )
)

const hpaMetricDetails = (
  specMetrics?: HPAMetricSourceLike[],
  currentMetrics?: HPAMetricSourceLike[],
): HPAMetricInfo[] => {
  const maxLength = Math.max(specMetrics?.length ?? 0, currentMetrics?.length ?? 0)
  return Array.from({ length: maxLength }, (_, index) => {
    const specMetric = specMetrics?.[index]
    const currentMetric = currentMetrics?.[index]
    const metric = specMetric ?? currentMetric ?? {}
    return {
      type: metric.type ?? currentMetric?.type ?? '-',
      name: hpaMetricName(metric),
      target: hpaMetricTarget(metric),
      current: hpaMetricCurrent(currentMetric ?? {}),
    }
  })
}

const hpaConditionDetails = (conditions?: HPAConditionLike[]): HPAConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const eventObjectReference = (ref?: EventObjectReferenceLike): string => (
  ref?.kind || ref?.name ? `${ref.kind ?? '-'}/${ref.name ?? '-'}` : ''
)

const coreEventInfo = (ev: CoreV1Event): EventInfo => {
  const involvedObj = ev.involvedObject
  const relatedObj = ev.related
  const lastTimestamp = ev.series?.lastObservedTime ?? ev.lastTimestamp
  const latestTimestamp = lastTimestamp ?? ev.eventTime ?? ev.firstTimestamp ?? ev.metadata?.creationTimestamp
  return {
    name: ev.metadata?.name ?? '',
    namespace: ev.metadata?.namespace ?? '',
    reason: ev.reason ?? '',
    message: ev.message ?? '',
    type: ev.type ?? 'Normal',
    object: eventObjectReference(involvedObj),
    count: ev.series?.count ?? ev.count ?? 1,
    age: formatAge(latestTimestamp),
    labels: ev.metadata?.labels,
    objectApiVersion: involvedObj?.apiVersion,
    objectKind: involvedObj?.kind,
    objectName: involvedObj?.name,
    objectNamespace: involvedObj?.namespace ?? ev.metadata?.namespace,
    objectUid: involvedObj?.uid,
    objectFieldPath: involvedObj?.fieldPath,
    relatedObject: eventObjectReference(relatedObj),
    relatedObjectKind: relatedObj?.kind,
    relatedObjectName: relatedObj?.name,
    relatedObjectNamespace: relatedObj?.namespace ?? ev.metadata?.namespace,
    relatedObjectApiVersion: relatedObj?.apiVersion,
    relatedObjectFieldPath: relatedObj?.fieldPath,
    sourceComponent: ev.source?.component,
    sourceHost: ev.source?.host,
    action: ev.action,
    reportingComponent: ev.reportingComponent,
    reportingInstance: ev.reportingInstance,
    firstTimestamp: formatConditionTime(ev.firstTimestamp),
    lastTimestamp: formatConditionTime(lastTimestamp),
    eventTime: formatConditionTime(ev.eventTime),
  }
}

const eventsV1EventInfo = (ev: EventsV1Event): EventInfo => {
  const regardingObj = ev.regarding
  const relatedObj = ev.related
  const lastTimestamp = ev.series?.lastObservedTime ?? ev.deprecatedLastTimestamp
  const latestTimestamp = lastTimestamp ?? ev.eventTime ?? ev.deprecatedFirstTimestamp ?? ev.metadata?.creationTimestamp
  return {
    name: ev.metadata?.name ?? '',
    namespace: ev.metadata?.namespace ?? '',
    reason: ev.reason ?? '',
    message: ev.note ?? '',
    type: ev.type ?? 'Normal',
    object: eventObjectReference(regardingObj),
    count: ev.series?.count ?? ev.deprecatedCount ?? 1,
    age: formatAge(latestTimestamp),
    labels: ev.metadata?.labels,
    objectApiVersion: regardingObj?.apiVersion,
    objectKind: regardingObj?.kind,
    objectName: regardingObj?.name,
    objectNamespace: regardingObj?.namespace ?? ev.metadata?.namespace,
    objectUid: regardingObj?.uid,
    objectFieldPath: regardingObj?.fieldPath,
    relatedObject: eventObjectReference(relatedObj),
    relatedObjectKind: relatedObj?.kind,
    relatedObjectName: relatedObj?.name,
    relatedObjectNamespace: relatedObj?.namespace ?? ev.metadata?.namespace,
    relatedObjectApiVersion: relatedObj?.apiVersion,
    relatedObjectFieldPath: relatedObj?.fieldPath,
    sourceComponent: ev.deprecatedSource?.component,
    sourceHost: ev.deprecatedSource?.host,
    action: ev.action,
    reportingComponent: ev.reportingController,
    reportingInstance: ev.reportingInstance,
    firstTimestamp: formatConditionTime(ev.deprecatedFirstTimestamp),
    lastTimestamp: formatConditionTime(lastTimestamp),
    eventTime: formatConditionTime(ev.eventTime),
  }
}

const formatOptionalNumber = (value?: number): string => (
  typeof value === 'number' ? String(value) : '-'
)

const flowSchemaInfo = (schema: V1FlowSchema): FlowSchemaInfo => {
  const rules = (schema.spec?.rules ?? []) as FlowPolicyRule[]
  return {
    name: schema.metadata?.name ?? '',
    priorityLevel: schema.spec?.priorityLevelConfiguration?.name ?? '-',
    matchingPrecedence: schema.spec?.matchingPrecedence ?? 0,
    distinguisherMethod: schema.spec?.distinguisherMethod?.type ?? '-',
    subjects: formatFlowSubjects(rules),
    rules: formatFlowRules(rules),
    condition: flowControlCondition(schema.status?.conditions),
    age: formatAge(schema.metadata?.creationTimestamp),
    labels: schema.metadata?.labels,
    subjectDetails: flowSubjectDetails(rules),
    resourceRuleDetails: flowResourceRuleDetails(rules),
    nonResourceRuleDetails: flowNonResourceRuleDetails(rules),
    conditionDetails: flowControlConditionDetails(schema.status?.conditions),
  }
}

const priorityLevelConfigurationInfo = (
  config: V1PriorityLevelConfiguration,
): PriorityLevelConfigurationInfo => {
  const limited = config.spec?.limited
  const exempt = config.spec?.exempt
  const queuing = limited?.limitResponse?.queuing
  return {
    name: config.metadata?.name ?? '',
    type: config.spec?.type ?? '-',
    nominalConcurrencyShares: formatOptionalNumber(limited?.nominalConcurrencyShares ?? exempt?.nominalConcurrencyShares),
    lendablePercent: formatOptionalNumber(limited?.lendablePercent ?? exempt?.lendablePercent),
    borrowingLimitPercent: formatOptionalNumber(limited?.borrowingLimitPercent),
    limitResponse: limited?.limitResponse?.type ?? '-',
    queues: formatOptionalNumber(queuing?.queues),
    handSize: formatOptionalNumber(queuing?.handSize),
    queueLengthLimit: formatOptionalNumber(queuing?.queueLengthLimit),
    condition: flowControlCondition(config.status?.conditions),
    age: formatAge(config.metadata?.creationTimestamp),
    labels: config.metadata?.labels,
    conditionDetails: flowControlConditionDetails(config.status?.conditions),
  }
}

const certificateSigningRequestCondition = (
  csr: V1CertificateSigningRequest,
): { condition: string; reason: string } => {
  const active = (csr.status?.conditions ?? []).find((condition) => condition.status === 'True')
  if (active?.type) {
    return {
      condition: active.type,
      reason: active.reason ?? '-',
    }
  }
  return { condition: 'Pending', reason: '-' }
}

const certificateSigningRequestConditionDetails = (
  conditions?: CertificateSigningRequestConditionLike[],
): CertificateSigningRequestConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastUpdateTime: formatConditionTime(condition.lastUpdateTime),
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const certificateSigningRequestInfo = (csr: V1CertificateSigningRequest): CertificateSigningRequestInfo => {
  const { condition, reason } = certificateSigningRequestCondition(csr)
  return {
    name: csr.metadata?.name ?? '',
    signerName: csr.spec?.signerName ?? '-',
    requestor: csr.spec?.username ?? '-',
    groups: csr.spec?.groups?.join(', ') || '-',
    condition,
    reason,
    usages: csr.spec?.usages?.join(', ') || '-',
    expirationSeconds: csr.spec?.expirationSeconds ?? 0,
    requestConfigured: Boolean(csr.spec?.request),
    certificateConfigured: Boolean(csr.status?.certificate),
    age: formatAge(csr.metadata?.creationTimestamp),
    labels: csr.metadata?.labels,
    conditionDetails: certificateSigningRequestConditionDetails(
      csr.status?.conditions as CertificateSigningRequestConditionLike[] | undefined,
    ),
  }
}

const certificateSigningRequestApprovalPatch = (
  name: string,
  decision: CertificateSigningRequestDecision,
): Record<string, unknown> => {
  const approved = decision === 'approve'
  const timestamp = new Date().toISOString()
  return {
    apiVersion: 'certificates.k8s.io/v1',
    kind: 'CertificateSigningRequest',
    metadata: {
      name,
    },
    status: {
      conditions: [{
        type: approved ? 'Approved' : 'Denied',
        status: 'True',
        reason: approved ? 'K7sApproved' : 'K7sDenied',
        message: `CertificateSigningRequest ${name} ${approved ? 'approved' : 'denied'} by k7s`,
        lastUpdateTime: timestamp,
        lastTransitionTime: timestamp,
      }],
    },
  }
}

const countPemCertificates = (value?: string): number => (
  value?.match(/-----BEGIN CERTIFICATE-----/g)?.length ?? 0
)

const clusterTrustBundleInfo = (bundle: V1beta1ClusterTrustBundle): ClusterTrustBundleInfo => {
  const trustBundle = bundle.spec?.trustBundle ?? ''
  return {
    name: bundle.metadata?.name ?? '',
    signerName: bundle.spec?.signerName || '-',
    certificateCount: countPemCertificates(trustBundle),
    trustBundleBytes: Buffer.byteLength(trustBundle),
    trustBundleConfigured: trustBundle.length > 0,
    age: formatAge(bundle.metadata?.creationTimestamp),
    labels: bundle.metadata?.labels,
  }
}

const podCertificateRequestConditionDetails = (
  conditions?: PodCertificateRequestConditionLike[],
): PodCertificateRequestConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const podCertificateRequestCondition = (request: V1alpha1PodCertificateRequest): string => {
  const conditions = podCertificateRequestConditionDetails(
    request.status?.conditions as PodCertificateRequestConditionLike[] | undefined,
  )
  const active = conditions.filter((condition) => condition.status === 'True')
  if (active.length > 0) return active.map((condition) => condition.type).join(', ')
  if (request.status?.certificateChain) return 'Issued'
  return conditions[0]?.type ?? 'Pending'
}

const podCertificateRequestInfo = (request: V1alpha1PodCertificateRequest): PodCertificateRequestInfo => ({
  name: request.metadata?.name ?? '',
  namespace: request.metadata?.namespace ?? '',
  signerName: request.spec?.signerName ?? '-',
  podName: request.spec?.podName ?? '-',
  nodeName: request.spec?.nodeName ?? '-',
  serviceAccountName: request.spec?.serviceAccountName ?? '-',
  maxExpirationSeconds: request.spec?.maxExpirationSeconds ?? 0,
  condition: podCertificateRequestCondition(request),
  certificateChainConfigured: Boolean(request.status?.certificateChain),
  notBefore: formatConditionTime(request.status?.notBefore),
  notAfter: formatConditionTime(request.status?.notAfter),
  beginRefreshAt: formatConditionTime(request.status?.beginRefreshAt),
  age: formatAge(request.metadata?.creationTimestamp),
  labels: request.metadata?.labels,
  podUID: request.spec?.podUID,
  nodeUID: request.spec?.nodeUID,
  serviceAccountUID: request.spec?.serviceAccountUID,
  conditionDetails: podCertificateRequestConditionDetails(
    request.status?.conditions as PodCertificateRequestConditionLike[] | undefined,
  ),
})

const storageVersionServerDetails = (
  servers?: V1alpha1ServerStorageVersion[],
): StorageVersionServerInfo[] => (
  (servers ?? []).map((server) => ({
    apiServerID: server.apiServerID ?? '-',
    encodingVersion: server.encodingVersion ?? '-',
    decodableVersions: server.decodableVersions?.join(', ') || '-',
    servedVersions: server.servedVersions?.join(', ') || '-',
  }))
)

const storageVersionConditionDetails = (
  conditions?: V1alpha1StorageVersionCondition[],
): StorageVersionConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const formatConditionSummary = (conditions?: Array<{ type?: string; status?: string }>): string => {
  const condition = conditions?.find((item) => item.status === 'True') ?? conditions?.[0]
  if (!condition) return '-'
  return `${condition.type ?? '-'}=${condition.status ?? '-'}`
}

const storageVersionInfo = (version: V1alpha1StorageVersion): StorageVersionInfo => ({
  name: version.metadata?.name ?? '',
  commonEncodingVersion: version.status?.commonEncodingVersion ?? '-',
  storageVersions: version.status?.storageVersions?.length ?? 0,
  condition: formatConditionSummary(version.status?.conditions),
  age: formatAge(version.metadata?.creationTimestamp),
  labels: version.metadata?.labels,
  serverDetails: storageVersionServerDetails(version.status?.storageVersions),
  conditionDetails: storageVersionConditionDetails(version.status?.conditions),
})

const formatMigrationResource = (migration: V1alpha1StorageVersionMigration): string => {
  const resource = migration.spec?.resource
  if (!resource?.resource) return '-'
  const group = resource.group ? `${resource.group}/` : ''
  const version = resource.version ? `${resource.version}/` : ''
  return `${group}${version}${resource.resource}`
}

const storageVersionMigrationConditionDetails = (
  conditions?: V1alpha1MigrationCondition[],
): StorageVersionMigrationConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastUpdateTime: formatConditionTime(condition.lastUpdateTime),
  }))
)

const storageVersionMigrationInfo = (
  migration: V1alpha1StorageVersionMigration,
): StorageVersionMigrationInfo => ({
  name: migration.metadata?.name ?? '',
  resource: formatMigrationResource(migration),
  resourceName: migration.spec?.resource?.resource ?? '-',
  group: migration.spec?.resource?.group || '-',
  version: migration.spec?.resource?.version || '-',
  continueToken: migration.spec?.continueToken || '-',
  resourceVersion: migration.status?.resourceVersion || '-',
  condition: formatConditionSummary(migration.status?.conditions),
  age: formatAge(migration.metadata?.creationTimestamp),
  labels: migration.metadata?.labels,
  conditionDetails: storageVersionMigrationConditionDetails(migration.status?.conditions),
})

const formatIngressClassParameters = (ingressClass: V1IngressClass): string => {
  const parameters = ingressClass.spec?.parameters
  if (!parameters?.name) return '-'
  const apiGroup = parameters.apiGroup ? `${parameters.apiGroup}/` : ''
  const namespace = parameters.namespace ? `${parameters.namespace}/` : ''
  return `${apiGroup}${parameters.kind}/${namespace}${parameters.name}`
}

const formatIngressServicePort = (port?: { name?: string; number?: number }): string => {
  if (!port) return '-'
  if (port.name) return port.name
  if (port.number !== undefined) return String(port.number)
  return '-'
}

const ingressRuleDetails = (ingress: V1Ingress): IngressRuleInfo[] => (
  (ingress.spec?.rules ?? []).flatMap((rule) => {
    const paths = rule.http?.paths ?? []
    if (paths.length === 0) {
      return [{
        host: rule.host ?? '*',
        path: '-',
        pathType: '-',
        serviceName: '-',
        servicePort: '-',
      }]
    }
    return paths.map((path) => {
      const service = path.backend?.service
      return {
        host: rule.host ?? '*',
        path: path.path ?? '/',
        pathType: path.pathType ?? '-',
        serviceName: service?.name ?? '-',
        servicePort: formatIngressServicePort(service?.port),
      }
    })
  })
)

const ingressTlsDetails = (ingress: V1Ingress): IngressTlsInfo[] => (
  (ingress.spec?.tls ?? []).map((tls) => ({
    hosts: tls.hosts?.join(', ') || '-',
    secretName: tls.secretName ?? '-',
  }))
)

const ingressDefaultBackend = (ingress: V1Ingress) => {
  const service = ingress.spec?.defaultBackend?.service
  if (!service?.name) {
    return {
      defaultBackend: undefined,
      defaultBackendServiceName: undefined,
      defaultBackendServicePort: undefined,
    }
  }
  const servicePort = formatIngressServicePort(service.port)
  return {
    defaultBackend: `${service.name}:${servicePort}`,
    defaultBackendServiceName: service.name,
    defaultBackendServicePort: servicePort,
  }
}

const ingressClassInfo = (ingressClass: V1IngressClass): IngressClassInfo => {
  const parameters = ingressClass.spec?.parameters
  return {
    name: ingressClass.metadata?.name ?? '',
    controller: ingressClass.spec?.controller ?? '-',
    parameters: formatIngressClassParameters(ingressClass),
    default: ingressClass.metadata?.annotations?.['ingressclass.kubernetes.io/is-default-class'] === 'true',
    age: formatAge(ingressClass.metadata?.creationTimestamp),
    labels: ingressClass.metadata?.labels,
    parameterApiGroup: parameters?.apiGroup,
    parameterKind: parameters?.kind,
    parameterNamespace: parameters?.namespace,
    parameterName: parameters?.name,
    parameterScope: parameters?.scope,
  }
}

const formatAPIServiceBackend = (apiService: V1APIService): string => {
  const service = apiService.spec?.service
  if (!service?.name) return 'local'
  const namespace = service.namespace ? `${service.namespace}/` : ''
  const port = service.port ? `:${service.port}` : ''
  return `${namespace}${service.name}${port}`
}

const formatConditionTime = (date?: Date | string): string => {
  if (!date) return '-'
  const value = date instanceof Date ? date : new Date(date)
  return Number.isNaN(value.getTime()) ? '-' : value.toISOString().replace('T', ' ').slice(0, 19)
}

const apiServiceConditions = (apiService: V1APIService): APIServiceConditionInfo[] => (
  (apiService.status?.conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatConditionTime(condition.lastTransitionTime),
  }))
)

const apiServiceInfo = (apiService: V1APIService): APIServiceInfo => {
  const available = apiService.status?.conditions?.find((condition) => condition.type === 'Available')
  const service = apiService.spec?.service
  return {
    name: apiService.metadata?.name ?? '',
    group: apiService.spec?.group || '-',
    version: apiService.spec?.version || '-',
    service: formatAPIServiceBackend(apiService),
    serviceNamespace: service?.namespace,
    serviceName: service?.name,
    servicePort: service?.port,
    available: available?.status ?? 'Unknown',
    reason: available?.reason ?? '-',
    groupPriority: apiService.spec?.groupPriorityMinimum ?? 0,
    versionPriority: apiService.spec?.versionPriority ?? 0,
    insecureSkipTLSVerify: apiService.spec?.insecureSkipTLSVerify ?? false,
    caBundleConfigured: Boolean(apiService.spec?.caBundle),
    age: formatAge(apiService.metadata?.creationTimestamp),
    labels: apiService.metadata?.labels,
    conditionDetails: apiServiceConditions(apiService),
  }
}

const priorityClassInfo = (priorityClass: V1PriorityClass): PriorityClassInfo => ({
  name: priorityClass.metadata?.name ?? '',
  value: priorityClass.value ?? 0,
  globalDefault: priorityClass.globalDefault ?? false,
  preemptionPolicy: priorityClass.preemptionPolicy ?? '-',
  description: priorityClass.description ?? '-',
  age: formatAge(priorityClass.metadata?.creationTimestamp),
  labels: priorityClass.metadata?.labels,
})

const runtimeClassTolerationDetails = (
  tolerations?: RuntimeClassTolerationLike[],
): RuntimeClassTolerationInfo[] => (
  (tolerations ?? []).map((toleration) => ({
    key: toleration.key ?? '-',
    operator: toleration.operator ?? 'Equal',
    value: toleration.value ?? '-',
    effect: toleration.effect ?? '-',
    tolerationSeconds: toleration.tolerationSeconds === undefined ? '-' : String(toleration.tolerationSeconds),
  }))
)

const runtimeClassInfo = (runtimeClass: V1RuntimeClass): RuntimeClassInfo => ({
  name: runtimeClass.metadata?.name ?? '',
  handler: runtimeClass.handler ?? '-',
  overhead: formatQuotaValues(runtimeClass.overhead?.podFixed),
  nodeSelector: formatQuotaValues(runtimeClass.scheduling?.nodeSelector),
  tolerations: runtimeClass.scheduling?.tolerations?.length ?? 0,
  age: formatAge(runtimeClass.metadata?.creationTimestamp),
  labels: runtimeClass.metadata?.labels,
  nodeSelectorLabels: runtimeClass.scheduling?.nodeSelector,
  tolerationDetails: runtimeClassTolerationDetails(runtimeClass.scheduling?.tolerations),
})

const formatLeaseTime = (date?: Date): string => (
  date ? date.toISOString().replace('T', ' ').slice(0, 19) : '-'
)

const leaseInfo = (lease: V1Lease): LeaseInfo => ({
  name: lease.metadata?.name ?? '',
  namespace: lease.metadata?.namespace ?? '',
  holder: lease.spec?.holderIdentity ?? '-',
  leaseDuration: lease.spec?.leaseDurationSeconds ?? 0,
  acquireTime: formatLeaseTime(lease.spec?.acquireTime),
  renewTime: formatLeaseTime(lease.spec?.renewTime),
  transitions: lease.spec?.leaseTransitions ?? 0,
  age: formatAge(lease.metadata?.creationTimestamp),
  labels: lease.metadata?.labels,
})

const leaseCandidateInfo = (candidate: V1beta1LeaseCandidate): LeaseCandidateInfo => ({
  name: candidate.metadata?.name ?? '',
  namespace: candidate.metadata?.namespace ?? '',
  leaseName: candidate.spec?.leaseName ?? '-',
  binaryVersion: candidate.spec?.binaryVersion ?? '-',
  emulationVersion: candidate.spec?.emulationVersion ?? '-',
  strategy: candidate.spec?.strategy ?? '-',
  pingTime: formatLeaseTime(candidate.spec?.pingTime),
  renewTime: formatLeaseTime(candidate.spec?.renewTime),
  age: formatAge(candidate.metadata?.creationTimestamp),
  labels: candidate.metadata?.labels,
})

const csiDriverInfo = (driver: V1CSIDriver): CSIDriverInfo => ({
  name: driver.metadata?.name ?? '',
  attachRequired: driver.spec?.attachRequired ?? true,
  podInfoOnMount: driver.spec?.podInfoOnMount ?? false,
  storageCapacity: driver.spec?.storageCapacity ?? false,
  requiresRepublish: driver.spec?.requiresRepublish ?? false,
  seLinuxMount: driver.spec?.seLinuxMount ?? false,
  volumeLifecycleModes: driver.spec?.volumeLifecycleModes?.join(', ') || 'Persistent',
  fsGroupPolicy: driver.spec?.fsGroupPolicy ?? 'ReadWriteOnceWithFSType',
  age: formatAge(driver.metadata?.creationTimestamp),
  labels: driver.metadata?.labels,
})

const csiNodeDriverDetails = (drivers?: CSINodeDriverLike[]): CSINodeDriverInfo[] => (
  (drivers ?? []).map((driver) => ({
    name: driver.name ?? '-',
    nodeId: driver.nodeID ?? '-',
    topologyKeys: driver.topologyKeys?.join(', ') || '-',
    allocatable: driver.allocatable?.count === undefined ? '-' : String(driver.allocatable.count),
  }))
)

const csiNodeInfo = (node: V1CSINode): CSINodeInfo => {
  const drivers = node.spec?.drivers ?? []
  const driverDetails = csiNodeDriverDetails(drivers)
  return {
    name: node.metadata?.name ?? '',
    drivers: drivers.length,
    driverNames: drivers.map((driver) => driver.name).filter(Boolean).join(', ') || '-',
    nodeIds: drivers.map((driver) => driver.nodeID).filter(Boolean).join(', ') || '-',
    topologyKeys: [...new Set(drivers.flatMap((driver) => driver.topologyKeys ?? []))].join(', ') || '-',
    allocatable: drivers
      .map((driver) => driver.allocatable?.count === undefined ? '' : `${driver.name}=${driver.allocatable.count}`)
      .filter(Boolean)
      .join(', ') || '-',
    age: formatAge(node.metadata?.creationTimestamp),
    labels: node.metadata?.labels,
    driverDetails,
  }
}

const volumeAttachmentSource = (attachment: V1VolumeAttachment): string => {
  const source = attachment.spec?.source
  if (source?.persistentVolumeName) return `pv/${source.persistentVolumeName}`
  if (source?.inlineVolumeSpec) return 'inline'
  return '-'
}

const volumeAttachmentInfo = (attachment: V1VolumeAttachment): VolumeAttachmentInfo => ({
  name: attachment.metadata?.name ?? '',
  attacher: attachment.spec?.attacher ?? '-',
  node: attachment.spec?.nodeName ?? '-',
  source: volumeAttachmentSource(attachment),
  attached: attachment.status?.attached ?? false,
  attachError: attachment.status?.attachError?.message ?? '-',
  detachError: attachment.status?.detachError?.message ?? '-',
  age: formatAge(attachment.metadata?.creationTimestamp),
  labels: attachment.metadata?.labels,
  sourcePersistentVolume: attachment.spec?.source?.persistentVolumeName,
  sourceInline: Boolean(attachment.spec?.source?.inlineVolumeSpec),
})

const csiStorageTopologyExpressions = (selector?: LabelSelectorLike): CSIStorageTopologyExpressionInfo[] => (
  (selector?.matchExpressions ?? []).map((expression) => ({
    key: expression.key ?? '-',
    operator: expression.operator ?? '-',
    values: expression.values?.join(', ') || '-',
  }))
)

const csiStorageCapacityInfo = (capacity: V1CSIStorageCapacity): CSIStorageCapacityInfo => ({
  name: capacity.metadata?.name ?? '',
  namespace: capacity.metadata?.namespace ?? '',
  storageClass: capacity.storageClassName ?? '-',
  capacity: capacity.capacity ?? '-',
  maximumVolumeSize: capacity.maximumVolumeSize ?? '-',
  topology: formatNetworkPolicySelector(capacity.nodeTopology),
  age: formatAge(capacity.metadata?.creationTimestamp),
  labels: capacity.metadata?.labels,
  nodeTopologyLabels: capacity.nodeTopology?.matchLabels,
  nodeTopologyExpressions: csiStorageTopologyExpressions(capacity.nodeTopology),
})

const snapshotParameterDetails = (parameters?: Record<string, unknown>): Record<string, string> | undefined => {
  if (!parameters) return undefined
  return Object.fromEntries(
    Object.entries(parameters).map(([key, value]) => [key, formatOptionalValue(value)]),
  )
}

const volumeAttributesClassInfo = (resource: V1VolumeAttributesClass): VolumeAttributesClassInfo => ({
  name: resource.metadata?.name ?? '',
  driverName: resource.driverName ?? '-',
  parameters: formatQuotaValues(resource.parameters),
  parameterCount: Object.keys(resource.parameters ?? {}).length,
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  parameterDetails: snapshotParameterDetails(resource.parameters),
})

const snapshotErrorMessage = (error?: { message?: string; time?: Date }): string => {
  if (!error) return '-'
  const time = formatConditionTime(error.time)
  return [error.message, time !== '-' ? time : ''].filter(Boolean).join(' @ ') || '-'
}

const volumeSnapshotClassInfo = (resource: VolumeSnapshotClassObject): VolumeSnapshotClassInfo => ({
  name: resource.metadata?.name ?? '',
  driver: resource.driver ?? '-',
  deletionPolicy: resource.deletionPolicy ?? '-',
  parameters: formatQuotaValues(resource.parameters),
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  parameterDetails: snapshotParameterDetails(resource.parameters),
})

const volumeSnapshotSource = (snapshot: VolumeSnapshotObject): string => {
  const source = snapshot.spec?.source
  if (source?.persistentVolumeClaimName) return `pvc/${source.persistentVolumeClaimName}`
  if (source?.volumeSnapshotContentName) return `content/${source.volumeSnapshotContentName}`
  return '-'
}

const volumeSnapshotInfo = (resource: VolumeSnapshotObject): VolumeSnapshotInfo => ({
  name: resource.metadata?.name ?? '',
  namespace: resource.metadata?.namespace ?? '',
  snapshotClass: resource.spec?.volumeSnapshotClassName ?? '-',
  source: volumeSnapshotSource(resource),
  boundContent: resource.status?.boundVolumeSnapshotContentName ?? '-',
  readyToUse: resource.status?.readyToUse ?? false,
  restoreSize: formatOptionalValue(resource.status?.restoreSize),
  error: snapshotErrorMessage(resource.status?.error),
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  sourcePVC: resource.spec?.source?.persistentVolumeClaimName,
  sourceContent: resource.spec?.source?.volumeSnapshotContentName,
})

const volumeSnapshotContentSource = (content: VolumeSnapshotContentObject): string => {
  const source = content.spec?.source
  if (source?.snapshotHandle) return `snapshot/${source.snapshotHandle}`
  if (source?.volumeHandle) return `volume/${source.volumeHandle}`
  return '-'
}

const volumeSnapshotContentInfo = (resource: VolumeSnapshotContentObject): VolumeSnapshotContentInfo => {
  const ref = resource.spec?.volumeSnapshotRef
  return {
    name: resource.metadata?.name ?? '',
    snapshotClass: resource.spec?.volumeSnapshotClassName ?? '-',
    driver: resource.spec?.driver ?? '-',
    deletionPolicy: resource.spec?.deletionPolicy ?? '-',
    source: volumeSnapshotContentSource(resource),
    volumeSnapshot: ref?.name ? `${ref.namespace ?? '-'}/${ref.name}` : '-',
    readyToUse: resource.status?.readyToUse ?? false,
    restoreSize: formatOptionalValue(resource.status?.restoreSize),
    handle: resource.status?.snapshotHandle ?? resource.spec?.source?.snapshotHandle ?? '-',
    error: snapshotErrorMessage(resource.status?.error),
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    sourceVolumeHandle: resource.spec?.source?.volumeHandle,
    sourceSnapshotHandle: resource.spec?.source?.snapshotHandle,
    volumeSnapshotNamespace: ref?.namespace,
    volumeSnapshotName: ref?.name,
  }
}

const formatGatewayConditionTime = (time?: Date | string): string => {
  if (!time) return '-'
  const date = time instanceof Date ? time : new Date(time)
  return Number.isNaN(date.getTime()) ? String(time) : formatConditionTime(date)
}

const gatewayConditionDetails = (conditions?: GatewayConditionLike[]): GatewayConditionInfo[] => (
  (conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    reason: condition.reason ?? '-',
    message: condition.message ?? '-',
    lastTransitionTime: formatGatewayConditionTime(condition.lastTransitionTime),
  }))
)

const gatewayConditionValue = (conditions: GatewayConditionLike[] | undefined, type: string): string => {
  const condition = conditions?.find((item) => item.type === type)
  if (!condition) return '-'
  if (condition.status === 'True') return 'True'
  return condition.reason || condition.status || '-'
}

const formatGatewayRef = (ref?: GatewayRefLike): string => {
  if (!ref?.name) return '-'
  const kind = ref.kind ?? 'Gateway'
  const namespace = ref.namespace ? `${ref.namespace}/` : ''
  const section = ref.sectionName ? `#${ref.sectionName}` : ''
  const port = ref.port ? `:${ref.port}` : ''
  return `${kind}/${namespace}${ref.name}${section}${port}`
}

const formatGatewayAddresses = (
  specAddresses?: Array<{ type?: string; value?: string }>,
  statusAddresses?: Array<{ type?: string; value?: string }>,
): string => {
  const addresses = statusAddresses?.length ? statusAddresses : specAddresses
  return (addresses ?? [])
    .map((address) => [address.type, address.value].filter(Boolean).join('/'))
    .filter(Boolean)
    .join(', ') || '-'
}

const gatewayListenerDetails = (gateway: GatewayObject): GatewayListenerInfo[] => {
  const statusByName = new Map(
    (gateway.status?.listeners ?? [])
      .filter((listener) => listener.name)
      .map((listener) => [listener.name, listener]),
  )

  return (gateway.spec?.listeners ?? gateway.status?.listeners ?? []).map((listener) => {
    const status = listener.name ? statusByName.get(listener.name) : undefined
    const conditions = status?.conditions ?? listener.conditions
    return {
      name: listener.name ?? '-',
      protocol: listener.protocol ?? '-',
      port: formatOptionalValue(listener.port),
      hostname: listener.hostname ?? '-',
      attachedRoutes: status?.attachedRoutes ?? listener.attachedRoutes ?? 0,
      accepted: gatewayConditionValue(conditions, 'Accepted'),
      resolvedRefs: gatewayConditionValue(conditions, 'ResolvedRefs'),
      programmed: gatewayConditionValue(conditions, 'Programmed'),
    }
  })
}

const gatewayInfo = (resource: GatewayObject): GatewayInfo => {
  const listenerDetails = gatewayListenerDetails(resource)
  const attachedRoutes = listenerDetails.reduce((total, listener) => total + listener.attachedRoutes, 0)
  return {
    name: resource.metadata?.name ?? '',
    namespace: resource.metadata?.namespace ?? '',
    gatewayClass: resource.spec?.gatewayClassName ?? '-',
    addresses: formatGatewayAddresses(resource.spec?.addresses, resource.status?.addresses),
    listeners: listenerDetails.map((listener) => `${listener.name}:${listener.port}/${listener.protocol}`).join(', ') || '-',
    attachedRoutes,
    accepted: gatewayConditionValue(resource.status?.conditions, 'Accepted'),
    programmed: gatewayConditionValue(resource.status?.conditions, 'Programmed'),
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    listenerDetails,
    conditions: gatewayConditionDetails(resource.status?.conditions),
  }
}

const gatewayClassInfo = (resource: GatewayClassObject): GatewayClassInfo => ({
  name: resource.metadata?.name ?? '',
  controllerName: resource.spec?.controllerName ?? '-',
  accepted: gatewayConditionValue(resource.status?.conditions, 'Accepted'),
  description: resource.spec?.description ?? '-',
  parametersRef: formatGatewayRef(resource.spec?.parametersRef),
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  conditions: gatewayConditionDetails(resource.status?.conditions),
})

const gatewayRouteBackendRefs = (route: GatewayRouteObject): string => {
  const refs = (route.spec?.rules ?? []).flatMap((rule) => rule.backendRefs ?? [])
  return refs.map((ref) => {
    const base = formatGatewayRef({ kind: ref.kind ?? 'Service', namespace: ref.namespace, name: ref.name, port: ref.port })
    return ref.weight !== undefined ? `${base} weight=${ref.weight}` : base
  }).join(', ') || '-'
}

const gatewayRouteParentDetails = (route: GatewayRouteObject): GatewayRouteParentInfo[] => (
  (route.status?.parents ?? []).map((parent) => ({
    parentRef: formatGatewayRef(parent.parentRef),
    controllerName: parent.controllerName ?? '-',
    accepted: gatewayConditionValue(parent.conditions, 'Accepted'),
    resolvedRefs: gatewayConditionValue(parent.conditions, 'ResolvedRefs'),
    programmed: gatewayConditionValue(parent.conditions, 'Programmed'),
    conditions: gatewayConditionDetails(parent.conditions),
  }))
)

const routeAcceptedValue = (parents?: GatewayRouteParentInfo[]): string => {
  if (!parents?.length) return '-'
  if (parents.some((parent) => parent.accepted === 'True')) return 'True'
  return parents.map((parent) => parent.accepted).filter((value) => value !== '-').join(', ') || '-'
}

const routeResolvedRefsValue = (parents?: GatewayRouteParentInfo[]): string => {
  if (!parents?.length) return '-'
  if (parents.every((parent) => parent.resolvedRefs === 'True')) return 'True'
  return parents.map((parent) => parent.resolvedRefs).filter((value) => value !== '-').join(', ') || '-'
}

const gatewayRouteInfo = <T extends HTTPRouteInfo | GRPCRouteInfo | TLSRouteInfo>(resource: GatewayRouteObject): T => {
  const parentDetails = gatewayRouteParentDetails(resource)
  const parentRefs = (resource.spec?.parentRefs ?? []).map(formatGatewayRef).join(', ') || '-'
  return {
    name: resource.metadata?.name ?? '',
    namespace: resource.metadata?.namespace ?? '',
    hostnames: resource.spec?.hostnames?.join(', ') || '-',
    parentRefs,
    rules: resource.spec?.rules?.length ?? 0,
    backendRefs: gatewayRouteBackendRefs(resource),
    accepted: routeAcceptedValue(parentDetails),
    resolvedRefs: routeResolvedRefsValue(parentDetails),
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    parentDetails,
  } as T
}

const gatewayL4RouteInfo = <T extends TCPRouteInfo | UDPRouteInfo>(resource: GatewayRouteObject): T => {
  const parentDetails = gatewayRouteParentDetails(resource)
  const parentRefs = (resource.spec?.parentRefs ?? []).map(formatGatewayRef).join(', ') || '-'
  return {
    name: resource.metadata?.name ?? '',
    namespace: resource.metadata?.namespace ?? '',
    parentRefs,
    rules: resource.spec?.rules?.length ?? 0,
    backendRefs: gatewayRouteBackendRefs(resource),
    accepted: routeAcceptedValue(parentDetails),
    resolvedRefs: routeResolvedRefsValue(parentDetails),
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    parentDetails,
  } as T
}

const referenceGrantRefInfo = (ref: ReferenceGrantRefLike): ReferenceGrantRefInfo => ({
  group: ref.group ?? '',
  kind: ref.kind ?? '-',
  namespace: ref.namespace,
  name: ref.name,
})

const formatReferenceGrantRefs = (refs?: ReferenceGrantRefLike[]): string => (
  (refs ?? []).map((ref) => {
    const namespace = ref.namespace ? `${ref.namespace}/` : ''
    const name = ref.name ?? '*'
    return `${ref.group ?? ''}/${ref.kind ?? '-'}:${namespace}${name}`
  }).join(', ') || '-'
)

const referenceGrantInfo = (resource: ReferenceGrantObject): ReferenceGrantInfo => ({
  name: resource.metadata?.name ?? '',
  namespace: resource.metadata?.namespace ?? '',
  from: formatReferenceGrantRefs(resource.spec?.from),
  to: formatReferenceGrantRefs(resource.spec?.to),
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  fromDetails: resource.spec?.from?.map(referenceGrantRefInfo),
  toDetails: resource.spec?.to?.map(referenceGrantRefInfo),
})

const deviceRequestClassNames = (requests?: DeviceRequestLike[]): string[] => {
  const names = new Set<string>()
  for (const request of requests ?? []) {
    if (request.exactly?.deviceClassName) names.add(request.exactly.deviceClassName)
    for (const subRequest of request.firstAvailable ?? []) {
      if (subRequest.deviceClassName) names.add(subRequest.deviceClassName)
    }
  }
  return [...names]
}

const formatDeviceRequest = (request: DeviceRequestLike): string => {
  if (request.exactly) {
    const count = request.exactly.count ?? 1
    const mode = request.exactly.allocationMode ?? 'ExactCount'
    return `${request.name ?? '-'}: ${request.exactly.deviceClassName ?? '-'} ${mode} x${count}`
  }
  const choices = (request.firstAvailable ?? [])
    .map((item) => `${item.name ?? '-'}:${item.deviceClassName ?? '-'} x${item.count ?? 1}`)
    .join(' | ')
  return `${request.name ?? '-'}: ${choices || '-'}`
}

const resourceClaimRequests = (claimSpec?: ResourceClaimObject['spec']): DeviceRequestLike[] => (
  claimSpec?.devices?.requests ?? []
)

const resourceClaimInfo = (resource: ResourceClaimObject): ResourceClaimInfo => {
  const requests = resourceClaimRequests(resource.spec)
  const allocatedDevices = resource.status?.allocation?.devices?.results ?? []
  return {
    name: resource.metadata?.name ?? '',
    namespace: resource.metadata?.namespace ?? '',
    requests: requests.length,
    deviceClasses: deviceRequestClassNames(requests).join(', ') || '-',
    allocated: allocatedDevices.length > 0,
    allocatedDevices: allocatedDevices.length,
    reservedFor: resource.status?.reservedFor?.length ?? 0,
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    requestDetails: requests.map(formatDeviceRequest),
    allocationDetails: allocatedDevices.map((device) => (
      `${device.request ?? '-'}: ${device.driver ?? '-'}/${device.pool ?? '-'}/${device.device ?? '-'}`
    )),
  }
}

const resourceClaimTemplateInfo = (resource: ResourceClaimTemplateObject): ResourceClaimTemplateInfo => {
  const requests = resourceClaimRequests(resource.spec?.spec)
  return {
    name: resource.metadata?.name ?? '',
    namespace: resource.metadata?.namespace ?? '',
    requests: requests.length,
    deviceClasses: deviceRequestClassNames(requests).join(', ') || '-',
    age: formatAge(resource.metadata?.creationTimestamp),
    labels: resource.metadata?.labels,
    requestDetails: requests.map(formatDeviceRequest),
  }
}

const deviceClassInfo = (resource: DeviceClassObject): DeviceClassInfo => ({
  name: resource.metadata?.name ?? '',
  selectors: resource.spec?.selectors?.length ?? 0,
  config: resource.spec?.config?.length ?? 0,
  extendedResourceName: resource.spec?.extendedResourceName ?? '-',
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
})

const resourceSliceInfo = (resource: ResourceSliceObject): ResourceSliceInfo => ({
  name: resource.metadata?.name ?? '',
  driver: resource.spec?.driver ?? '-',
  pool: resource.spec?.pool?.name ?? '-',
  node: resource.spec?.nodeName ?? (resource.spec?.allNodes ? 'all' : '-'),
  devices: resource.spec?.devices?.length ?? 0,
  allNodes: resource.spec?.allNodes ?? false,
  age: formatAge(resource.metadata?.creationTimestamp),
  labels: resource.metadata?.labels,
  deviceNames: resource.spec?.devices?.map((device) => device.name ?? '-'),
})

const deviceTaintRuleInfo = (rule: V1alpha3DeviceTaintRule): DeviceTaintRuleInfo => {
  const selector = rule.spec?.deviceSelector
  const taint = rule.spec?.taint
  return {
    name: rule.metadata?.name ?? '',
    driver: selector?.driver ?? '-',
    pool: selector?.pool ?? '-',
    deviceClassName: selector?.deviceClassName ?? '-',
    device: selector?.device ?? '-',
    celSelectors: selector?.selectors?.length ?? 0,
    taintKey: taint?.key ?? '-',
    taintValue: taint?.value ?? '-',
    taintEffect: taint?.effect ?? '-',
    timeAdded: formatConditionTime(taint?.timeAdded),
    age: formatAge(rule.metadata?.creationTimestamp),
    labels: rule.metadata?.labels,
  }
}

const parseHelmStorageName = (storageName?: string): { name: string; revision: number } | null => {
  const match = storageName?.match(/^sh\.helm\.release\.v1\.(.+)\.v(\d+)$/)
  if (!match) return null
  return {
    name: match[1],
    revision: Number.parseInt(match[2], 10),
  }
}

const parseHelmTimestamp = (value?: string): Date | undefined => {
  if (!value) return undefined
  const numeric = Number(value)
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 1000000000000 ? numeric : numeric * 1000)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const formatHelmUpdated = (date?: Date): string => (
  date ? date.toISOString().replace('T', ' ').slice(0, 19) : '-'
)

const helmReleaseFromStorage = (
  storage: 'Secret' | 'ConfigMap',
  resource: Pick<V1Secret, 'metadata' | 'type' | 'data'> | Pick<V1ConfigMap, 'metadata' | 'data'>,
): HelmReleaseRecord | null => {
  const labels = resource.metadata?.labels ?? {}
  const parsedName = parseHelmStorageName(resource.metadata?.name)
  const releaseName = labels.name ?? parsedName?.name ?? ''
  const labelRevision = Number.parseInt(labels.version ?? '', 10)
  const revision = Number.isFinite(labelRevision) ? labelRevision : parsedName?.revision ?? 0
  const isHelmStorage = labels.owner === 'helm'
    || (storage === 'Secret' && 'type' in resource && resource.type === 'helm.sh/release.v1')

  if (!isHelmStorage || !releaseName) return null

  const updatedDate = parseHelmTimestamp(labels.modifiedAt ?? labels.createdAt)
    ?? resource.metadata?.creationTimestamp
  return {
    name: releaseName,
    namespace: resource.metadata?.namespace ?? '',
    revision,
    status: labels.status ?? '-',
    chart: labels.chart ?? labels['helm.sh/chart'] ?? '-',
    appVersion: labels.appVersion ?? labels['app.kubernetes.io/version'] ?? '-',
    updated: formatHelmUpdated(updatedDate),
    age: formatAge(resource.metadata?.creationTimestamp),
    storage,
    labels,
    updatedTime: updatedDate?.getTime() ?? 0,
  }
}

const customResourceInstanceInfo = (
  descriptor: CustomResourceDescriptor,
  resource: CustomResourceObject,
): CustomResourceInstanceInfo => {
  const metadata = resource.metadata ?? {}
  return {
    crdName: descriptor.crdName,
    apiVersion: resource.apiVersion ?? `${descriptor.group}/${descriptor.version}`,
    kind: resource.kind ?? descriptor.kind,
    plural: descriptor.plural,
    scope: descriptor.scope,
    name: metadata.name ?? '',
    namespace: metadata.namespace ?? '',
    status: customResourceStatus(resource),
    age: formatResourceAge(metadata.creationTimestamp),
    labels: metadata.labels,
  }
}

const podRestarts = (pod: V1Pod): number => {
  const statuses = (pod.status?.containerStatuses ?? []) as Array<{ restartCount?: number }>
  return statuses.reduce((sum, status) => sum + (status.restartCount ?? 0), 0)
}

const componentStatusConditions = (component: V1ComponentStatus): ComponentStatusConditionInfo[] => (
  (component.conditions ?? []).map((condition) => ({
    type: condition.type ?? '-',
    status: condition.status ?? '-',
    message: condition.message || '-',
    error: condition.error || '-',
  }))
)

const componentStatusSummary = (component: V1ComponentStatus): Pick<ComponentStatusInfo, 'status' | 'message' | 'error'> => {
  const healthy = component.conditions?.find((condition) => condition.type === 'Healthy')
    ?? component.conditions?.[0]
  if (!healthy) {
    return { status: 'Unknown', message: '-', error: '-' }
  }
  const status = healthy.status === 'True'
    ? 'Healthy'
    : healthy.status === 'False'
      ? 'Unhealthy'
      : healthy.status ?? 'Unknown'
  return {
    status,
    message: healthy.message || '-',
    error: healthy.error || '-',
  }
}

const componentStatusInfo = (component: V1ComponentStatus): ComponentStatusInfo => {
  const summary = componentStatusSummary(component)
  return {
    name: component.metadata?.name ?? '',
    status: summary.status,
    message: summary.message,
    error: summary.error,
    age: formatAge(component.metadata?.creationTimestamp),
    labels: component.metadata?.labels,
    conditionDetails: componentStatusConditions(component),
  }
}

const discoveryListFrom = (res: unknown): V1APIResourceList => {
  const typed = res as { body?: V1APIResourceList; response?: V1APIResourceList } | V1APIResourceList
  if (typed && typeof typed === 'object' && 'body' in typed && typed.body) return typed.body
  if (typed && typeof typed === 'object' && 'response' in typed && typed.response) return typed.response
  return typed as V1APIResourceList
}

const apiGroupListFrom = (res: unknown): V1APIGroupList => {
  const typed = res as { body?: V1APIGroupList; response?: V1APIGroupList } | V1APIGroupList
  if (typed && typeof typed === 'object' && 'body' in typed && typed.body) return typed.body
  if (typed && typeof typed === 'object' && 'response' in typed && typed.response) return typed.response
  return typed as V1APIGroupList
}

const apiVersionsFrom = (res: unknown): V1APIVersions => {
  const typed = res as { body?: V1APIVersions; response?: V1APIVersions } | V1APIVersions
  if (typed && typeof typed === 'object' && 'body' in typed && typed.body) return typed.body
  if (typed && typeof typed === 'object' && 'response' in typed && typed.response) return typed.response
  return typed as V1APIVersions
}

const versionInfoFrom = (res: unknown): VersionInfo => {
  const typed = res as { body?: VersionInfo; response?: VersionInfo } | VersionInfo
  if (typed && typeof typed === 'object' && 'body' in typed && typed.body) return typed.body
  if (typed && typeof typed === 'object' && 'response' in typed && typed.response) return typed.response
  return typed as VersionInfo
}

const jsonPayloadFrom = (res: unknown): Record<string, unknown> => {
  const typed = res as { body?: unknown; response?: unknown } | unknown
  const value = typed && typeof typed === 'object' && 'body' in typed && typed.body !== undefined
    ? typed.body
    : typed && typeof typed === 'object' && 'response' in typed && typed.response !== undefined
      ? typed.response
      : typed

  if (typeof value === 'string') {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  }

  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

const stringArrayValue = (value: unknown): string[] => (
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
)

const formatDiscoveryServerAddresses = (addresses?: Array<{ clientCIDR?: string; serverAddress?: string }>): string => (
  (addresses ?? []).map((address) => {
    const cidr = address.clientCIDR || '*'
    const server = address.serverAddress || '-'
    return `${cidr}->${server}`
  }).join(', ') || '-'
)

const coreAPIGroupInfo = (versions: V1APIVersions): APIGroupInfo => {
  const apiVersions = (versions.versions ?? []).filter(Boolean)
  const preferredVersion = apiVersions.includes('v1') ? 'v1' : apiVersions[0] ?? '-'
  return {
    name: 'core',
    preferredVersion,
    versions: apiVersions.join(', ') || '-',
    versionCount: apiVersions.length,
    apiVersion: versions.apiVersion || '-',
    kind: versions.kind || 'APIVersions',
    serverAddressCount: versions.serverAddressByClientCIDRs?.length ?? 0,
    serverAddresses: formatDiscoveryServerAddresses(versions.serverAddressByClientCIDRs),
  }
}

const apiGroupInfo = (group: V1APIGroup): APIGroupInfo => {
  const versions = (group.versions ?? []).map((version) => version.groupVersion).filter(Boolean)
  return {
    name: group.name || '-',
    preferredVersion: group.preferredVersion?.groupVersion || '-',
    versions: versions.join(', ') || '-',
    versionCount: versions.length,
    apiVersion: group.apiVersion || '-',
    kind: group.kind || 'APIGroup',
    serverAddressCount: group.serverAddressByClientCIDRs?.length ?? 0,
    serverAddresses: formatDiscoveryServerAddresses(group.serverAddressByClientCIDRs),
  }
}

const formatVersionPair = (major?: string, minor?: string): string => {
  if (!major && !minor) return '-'
  return `${major || '?'}.${minor || '?'}`
}

const serverVersionInfo = (version: VersionInfo): ServerVersionInfo => ({
  name: version.gitVersion || `${version.major || '?'}.${version.minor || '?'}`,
  gitVersion: version.gitVersion || '-',
  major: version.major || '-',
  minor: version.minor || '-',
  platform: version.platform || '-',
  buildDate: version.buildDate || '-',
  gitCommit: version.gitCommit || '-',
  gitTreeState: version.gitTreeState || '-',
  goVersion: version.goVersion || '-',
  compiler: version.compiler || '-',
  emulationVersion: formatVersionPair(version.emulationMajor, version.emulationMinor),
  minCompatibilityVersion: formatVersionPair(version.minCompatibilityMajor, version.minCompatibilityMinor),
})

const openIDConfigurationInfo = (
  configuration: Record<string, unknown>,
  keyset: Record<string, unknown>,
): OpenIDConfigurationInfo => {
  const keys = Array.isArray(keyset.keys)
    ? keyset.keys.filter((key): key is Record<string, unknown> => Boolean(key) && typeof key === 'object' && !Array.isArray(key))
    : []
  const issuer = String(configuration.issuer ?? '-')

  return {
    name: issuer === '-' ? 'service-account-issuer' : issuer,
    issuer,
    jwksUri: String(configuration.jwks_uri ?? '-'),
    responseTypesSupported: formatRbacValues(stringArrayValue(configuration.response_types_supported), '-'),
    subjectTypesSupported: formatRbacValues(stringArrayValue(configuration.subject_types_supported), '-'),
    signingAlgorithms: formatRbacValues(stringArrayValue(configuration.id_token_signing_alg_values_supported), '-'),
    keyCount: keys.length,
    keyIds: formatRbacValues(keys.map((key) => String(key.kid ?? '')).filter(Boolean), '-'),
    keyTypes: formatRbacValues([...new Set(keys.map((key) => String(key.kty ?? '')).filter(Boolean))], '-'),
    keyUses: formatRbacValues([...new Set(keys.map((key) => String(key.use ?? '')).filter(Boolean))], '-'),
    scopesSupported: formatRbacValues(stringArrayValue(configuration.scopes_supported), '-'),
    claimsSupported: formatRbacValues(stringArrayValue(configuration.claims_supported), '-'),
    rawConfigurationKeys: Object.keys(configuration).sort().join(', ') || '-',
  }
}

const apiServerHealthInfo = (
  name: string,
  path: string,
  result: PromiseSettledResult<boolean>,
): APIServerHealthInfo => {
  if (result.status === 'fulfilled') {
    return {
      name,
      path,
      status: result.value ? 'Healthy' : 'Unhealthy',
      healthy: result.value,
      message: result.value ? 'ok' : 'check returned false',
    }
  }

  return {
    name,
    path,
    status: 'Error',
    healthy: false,
    message: result.reason instanceof Error ? result.reason.message : String(result.reason),
  }
}

const splitDiscoveryGroupVersion = (groupVersion: string): { apiGroup: string; version: string } => {
  const slashIndex = groupVersion.lastIndexOf('/')
  if (slashIndex < 0) {
    return { apiGroup: '', version: groupVersion || '-' }
  }
  return {
    apiGroup: groupVersion.slice(0, slashIndex),
    version: groupVersion.slice(slashIndex + 1) || '-',
  }
}

const apiResourceInfo = (
  resource: V1APIResource,
  listGroupVersion: string,
  fallbackApiGroup: string,
  fallbackVersion: string,
  preferredGroupVersion: string,
): APIResourceInfo => {
  const parsed = splitDiscoveryGroupVersion(listGroupVersion)
  const apiGroup = resource.group ?? parsed.apiGroup ?? fallbackApiGroup
  const version = resource.version ?? parsed.version ?? fallbackVersion
  const groupVersion = apiGroup && version ? `${apiGroup}/${version}` : version
  const namespaced = Boolean(resource.namespaced)

  return {
    name: resource.name ?? '',
    kind: resource.kind ?? '-',
    apiGroup: apiGroup || 'core',
    version: version || '-',
    groupVersion: groupVersion || listGroupVersion || '-',
    namespaced,
    scope: namespaced ? 'Namespaced' : 'Cluster',
    verbs: formatRbacValues(resource.verbs, '-'),
    shortNames: formatRbacValues(resource.shortNames, '-'),
    categories: formatRbacValues(resource.categories, '-'),
    singularName: resource.singularName || '-',
    storageVersionHash: resource.storageVersionHash || '-',
    preferred: preferredGroupVersion === (groupVersion || listGroupVersion),
    subresource: Boolean(resource.name?.includes('/')),
  }
}

const apiResourceInfosFromList = (
  list: V1APIResourceList,
  fallbackApiGroup: string,
  fallbackVersion: string,
  preferredGroupVersion: string,
): APIResourceInfo[] => {
  const groupVersion = list.groupVersion || (fallbackApiGroup ? `${fallbackApiGroup}/${fallbackVersion}` : fallbackVersion)
  return (list.resources ?? []).map((resource) => (
    apiResourceInfo(resource, groupVersion, fallbackApiGroup, fallbackVersion, preferredGroupVersion)
  ))
}

export const listComponentStatuses = async (contextId: string): Promise<ComponentStatusInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = (await api.listComponentStatus()) as unknown as {
      body?: { items?: V1ComponentStatus[] }; items?: V1ComponentStatus[]
    }
    const items = res.body?.items ?? res.items ?? []
    return items.map(componentStatusInfo)
  } catch (err) {
    throw new Error(`获取ComponentStatus失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listAPIGroups = async (contextId: string): Promise<APIGroupInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const coreApi = createCoreApi(entry)
  const apisApi = createApisApi(entry)

  const [coreResult, groupedResult] = await Promise.allSettled([
    coreApi.getAPIVersions(),
    apisApi.getAPIVersions(),
  ])
  const firstError = [coreResult, groupedResult]
    .find((result): result is PromiseRejectedResult => result.status === 'rejected')
  const rows = [
    ...(coreResult.status === 'fulfilled' ? [coreAPIGroupInfo(apiVersionsFrom(coreResult.value))] : []),
    ...(groupedResult.status === 'fulfilled'
      ? (apiGroupListFrom(groupedResult.value).groups ?? []).map(apiGroupInfo)
      : []),
  ]

  if (rows.length === 0 && firstError) {
    throw new Error(`获取APIGroup失败: ${firstError.reason instanceof Error ? firstError.reason.message : String(firstError.reason)}`)
  }

  return rows.sort((left, right) => (
    left.name === 'core' ? -1 : right.name === 'core' ? 1 : left.name.localeCompare(right.name)
  ))
}

export const listServerVersions = async (contextId: string): Promise<ServerVersionInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createVersionApi(entry)

  try {
    return [serverVersionInfo(versionInfoFrom(await api.getCode()))]
  } catch (err) {
    throw new Error(`获取ServerVersion失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listOpenIDConfigurations = async (contextId: string): Promise<OpenIDConfigurationInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const wellKnownApi = createWellKnownApi(entry)
  const openidApi = createOpenidApi(entry)

  try {
    const configuration = jsonPayloadFrom(await wellKnownApi.getServiceAccountIssuerOpenIDConfiguration())
    const keysetResult = await Promise.allSettled([
      openidApi.getServiceAccountIssuerOpenIDKeyset(),
    ])
    const keyset = keysetResult[0].status === 'fulfilled' ? jsonPayloadFrom(keysetResult[0].value) : {}
    return [openIDConfigurationInfo(configuration, keyset)]
  } catch (err) {
    throw new Error(`获取OpenIDConfiguration失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listAPIServerHealth = async (contextId: string): Promise<APIServerHealthInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const health = createHealthClient(entry)
  const healthz = (health as unknown as { healthz: (opts: Record<string, never>) => Promise<boolean> }).healthz.bind(health)
  const checks = [
    { name: 'readyz', path: '/readyz', run: () => health.readyz({}) },
    { name: 'livez', path: '/livez', run: () => health.livez({}) },
    { name: 'healthz', path: '/healthz', run: () => healthz({}) },
  ]
  const results = await Promise.allSettled(checks.map((check) => check.run()))
  return checks.map((check, index) => apiServerHealthInfo(check.name, check.path, results[index]))
}

export const listAPIResources = async (contextId: string): Promise<APIResourceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const coreApi = createCoreV1Api(entry)
  const apisApi = createApisApi(entry)
  const customObjectsApi = createCustomObjectsApi(entry)

  try {
    const coreList = discoveryListFrom(await coreApi.getAPIResources())
    const groupList = apiGroupListFrom(await apisApi.getAPIVersions())
    const groups = groupList.groups ?? []
    const versionRequests = groups.flatMap((group: V1APIGroup) => (
      (group.versions ?? []).map((version) => ({
        apiGroup: group.name,
        version: version.version,
        groupVersion: version.groupVersion,
        preferredGroupVersion: group.preferredVersion?.groupVersion ?? version.groupVersion,
      }))
    ))
    const groupedResults = await Promise.allSettled(versionRequests.map(async (request) => {
      const list = discoveryListFrom(await customObjectsApi.getAPIResources({
        group: request.apiGroup,
        version: request.version,
      }))
      return apiResourceInfosFromList(
        list,
        request.apiGroup,
        request.version,
        request.preferredGroupVersion,
      )
    }))

    return [
      ...apiResourceInfosFromList(coreList, '', 'v1', 'v1'),
      ...groupedResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
    ].sort((left, right) => (
      left.apiGroup.localeCompare(right.apiGroup)
        || left.version.localeCompare(right.version)
        || left.name.localeCompare(right.name)
    ))
  } catch (err) {
    throw new Error(`获取APIResource失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const formatUserExtra = (extra?: { [key: string]: string[] }): string => {
  const entries = Object.entries(extra ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, values]) => `${key}=${formatRbacValues(values, '-')}`)
  return entries.join('; ') || '-'
}

const selfSubjectReviewInfo = (review: V1SelfSubjectReview): SelfSubjectReviewInfo => {
  const userInfo = review.status?.userInfo
  const username = userInfo?.username || '-'
  const groups = (userInfo?.groups ?? []).filter(Boolean)
  const extraKeys = Object.keys(userInfo?.extra ?? {}).sort()

  return {
    name: username === '-' ? 'current-user' : username,
    username,
    uid: userInfo?.uid || '-',
    groups: formatRbacValues(groups, '-'),
    groupCount: groups.length,
    extraKeys: extraKeys.join(', ') || '-',
    extra: formatUserExtra(userInfo?.extra),
  }
}

export const listSelfSubjectReviews = async (contextId: string): Promise<SelfSubjectReviewInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAuthenticationV1Api(entry)

  try {
    const body = {
      apiVersion: 'authentication.k8s.io/v1',
      kind: 'SelfSubjectReview',
    } as V1SelfSubjectReview
    const review = await api.createSelfSubjectReview({ body })
    return [selfSubjectReviewInfo(review)]
  } catch (err) {
    throw new Error(`获取SelfSubjectReview失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listSelfSubjectAccessReviews = async (
  contextId: string,
  namespaces?: string | string[],
): Promise<SelfSubjectAccessReviewInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAuthorizationV1Api(entry)
  const checks = selfSubjectAccessReviewChecks(selfSubjectRuleNamespaces(namespaces))
  const results = await Promise.allSettled(checks.map((check) => (
    api.createSelfSubjectAccessReview({ body: selfSubjectAccessReviewBody(check) })
  )))
  return checks.map((check, index) => selfSubjectAccessReviewInfo(check, results[index]))
}

const canIReviewName = (check: SelfSubjectAccessReviewCheck) => {
  if (check.path) {
    return `${check.verb} ${check.path}`
  }
  const groupPrefix = check.group ? `${check.group}/` : ''
  const subresourceSuffix = check.subresource ? `/${check.subresource}` : ''
  const resourceNameSuffix = check.resourceName ? ` ${check.resourceName}` : ''
  const namespacePrefix = check.namespace ? `${check.namespace}/` : ''
  return `${namespacePrefix}${check.verb} ${groupPrefix}${check.resource ?? '-'}${subresourceSuffix}${resourceNameSuffix}`
}

export const checkCanI = async (
  contextId: string,
  request: CanIReviewRequest,
): Promise<SelfSubjectAccessReviewInfo> => {
  await ensureCache()
  const verb = request.verb.trim().toLowerCase()
  if (!verb) {
    throw new Error('can-i 需要 verb')
  }

  const nonResourceUrl = request.nonResourceUrl?.trim()
  if (nonResourceUrl) {
    if (!nonResourceUrl.startsWith('/')) {
      throw new Error('非资源 URL 必须以 / 开头')
    }
    const check: SelfSubjectAccessReviewCheck = {
      name: '',
      scope: 'NonResource',
      verb,
      path: nonResourceUrl,
    }
    check.name = canIReviewName(check)
    const api = createAuthorizationV1Api(getEntry(contextId))
    const review = await api.createSelfSubjectAccessReview({ body: selfSubjectAccessReviewBody(check) })
    return selfSubjectAccessReviewInfo(check, { status: 'fulfilled', value: review })
  }

  const resource = request.resource?.trim()
  if (!resource) {
    throw new Error('can-i 需要 resource 或 nonResourceUrl')
  }

  const namespace = request.namespace?.trim()
  const check: SelfSubjectAccessReviewCheck = {
    name: '',
    scope: namespace ? 'Namespaced' : 'Cluster',
    verb,
    namespace: namespace || undefined,
    group: request.apiGroup?.trim() || undefined,
    resource,
    subresource: request.subresource?.trim() || undefined,
    resourceName: request.resourceName?.trim() || undefined,
  }
  check.name = canIReviewName(check)

  const api = createAuthorizationV1Api(getEntry(contextId))
  const review = await api.createSelfSubjectAccessReview({ body: selfSubjectAccessReviewBody(check) })
  return selfSubjectAccessReviewInfo(check, { status: 'fulfilled', value: review })
}

export const listSelfSubjectRulesReviews = async (
  contextId: string,
  namespaces?: string | string[],
): Promise<SelfSubjectRuleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAuthorizationV1Api(entry)
  const reviewNamespaces = selfSubjectRuleNamespaces(namespaces)

  try {
    const reviews = await Promise.all(reviewNamespaces.map(async (namespace) => {
      const body = {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectRulesReview',
        spec: { namespace },
      } as V1SelfSubjectRulesReview
      const review = await api.createSelfSubjectRulesReview({ body })
      const status = review.status
      const incomplete = Boolean(status?.incomplete)
      const evaluationError = status?.evaluationError || '-'
      const resourceRules = (status?.resourceRules ?? []).map((rule, index) => (
        selfSubjectResourceRuleInfo(namespace, rule, index, incomplete, evaluationError)
      ))
      const nonResourceRules = (status?.nonResourceRules ?? []).map((rule, index) => (
        selfSubjectNonResourceRuleInfo(namespace, rule, index, incomplete, evaluationError)
      ))
      return [...resourceRules, ...nonResourceRules]
    }))
    return reviews.flat()
  } catch (err) {
    throw new Error(`获取SelfSubjectRulesReview失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listNamespaces = async (contextId: string): Promise<NamespaceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = (await api.listNamespace()) as unknown as {
      body?: { items?: V1Namespace[] }; items?: V1Namespace[]
    }
    const items = res.body?.items ?? res.items ?? []
    return items.map((ns) => ({
      name: ns.metadata?.name ?? '',
      status: ns.status?.phase ?? '',
      age: formatAge(ns.metadata?.creationTimestamp),
      labels: ns.metadata?.labels,
      finalizers: ns.spec?.finalizers,
    }))
  } catch (err) {
    throw new Error(`获取命名空间失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listNodes = async (contextId: string): Promise<NodeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = (await api.listNode()) as unknown as { body?: { items?: V1Node[] }; items?: V1Node[] }
    const items = res.body?.items ?? res.items ?? []
    const nodeMetrics = await listNodeMetricUsage(entry)
    return items.map((node) => mapNodeToInfo(node, nodeMetrics.get(node.metadata?.name ?? '')))
  } catch (err) {
    throw new Error(`获取节点失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const mapNodeToInfo = (node: V1Node, metrics?: PodMetricUsage): NodeInfo => {
  const addresses = (node.status?.addresses ?? []).map(addr => ({
    type: addr.type ?? '',
    address: addr.address ?? ''
  }))

  const taints = (node.spec?.taints ?? []).map(taint => ({
    key: taint.key ?? '',
    value: taint.value ?? '',
    effect: taint.effect ?? ''
  }))

  const conditions = (node.status?.conditions ?? []).map(cond => ({
    type: cond.type ?? '',
    status: cond.status ?? '',
    reason: cond.reason,
    message: cond.message,
    lastTransitionTime: cond.lastTransitionTime?.toISOString()
  }))

  const capacity: NodeCapacity | undefined = node.status?.capacity ? {
    cpu: node.status.capacity.cpu ?? '',
    memory: node.status.capacity.memory ?? '',
    pods: node.status.capacity.pods ?? '',
    ephemeralStorage: node.status.capacity['ephemeral-storage']
  } : undefined

  return {
    name: node.metadata?.name ?? '',
    status: nodeReadyStatus(node),
    version: node.status?.nodeInfo?.kubeletVersion ?? '',
    roles: roleFromLabels(node.metadata?.labels ?? {}),
    cpuUsage: metrics?.cpu ?? '-',
    memoryUsage: metrics?.memory ?? '-',
    age: formatAge(node.metadata?.creationTimestamp),
    addresses,
    os: node.status?.nodeInfo?.operatingSystem,
    architecture: node.status?.nodeInfo?.architecture,
    kernelVersion: node.status?.nodeInfo?.kernelVersion,
    containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion,
    capacity,
    labels: node.metadata?.labels,
    taints,
    conditions,
    podCIDR: node.spec?.podCIDR,
    providerID: node.spec?.providerID,
    unschedulable: node.spec?.unschedulable
  }
}

export const getNodeDetail = async (contextId: string, nodeName: string): Promise<NodeInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNode({ name: nodeName })
    const typedRes = res as { body?: V1Node; response?: V1Node } | V1Node
    let node: V1Node | undefined
    if (typedRes && 'body' in typedRes && typedRes.body) {
      node = typedRes.body
    } else if (typedRes && 'response' in typedRes && typedRes.response) {
      node = typedRes.response
    } else if (typedRes && 'metadata' in typedRes) {
      node = typedRes as V1Node
    }
    if (!node) {
      throw new Error('节点不存在')
    }
    return mapNodeToInfo(node)
  } catch (err) {
    throw new Error(`获取节点详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getNodeMetrics = async (contextId: string, nodeName: string): Promise<NodeMetrics | null> => {
  await ensureCache()
  const entry = getEntry(contextId)
  setupKubeConfig(entry)

  const currentCluster = entry.kubeConfig.getCurrentCluster()
  if (!currentCluster) {
    return null
  }

  const isHTTPS = currentCluster.server.startsWith('https://')
  const requestModule = isHTTPS ? httpsRequest : httpRequest

  const url = new URL(currentCluster.server)
  const path = `/apis/metrics.k8s.io/v1beta1/nodes/${nodeName}`
  const options: HttpsRequestOptions = {
    hostname: url.hostname,
    port: url.port ? Number(url.port) : (isHTTPS ? 443 : 80),
    path,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }

  try {
    await entry.kubeConfig.applyToHTTPSOptions(options)
  } catch {
    return null
  }

  return new Promise((resolve) => {
    const req = requestModule(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve(null)
          return
        }
        try {
          const parsed = JSON.parse(data) as {
            metadata?: { name?: string }
            timestamp?: string
            usage?: { cpu?: string; memory?: string }
          }
          const name = parsed.metadata?.name || nodeName
          if (!parsed.usage) {
            resolve(null)
            return
          }
          resolve({
            name,
            timestamp: parsed.timestamp || '',
            cpu: parsed.usage.cpu || '0',
            memory: parsed.usage.memory || '0'
          })
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

export const listPods = async (contextId: string, namespace?: string): Promise<PodInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPod({ namespace })
    } else {
      res = await api.listPodForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Pod[] }; items?: V1Pod[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    const podMetrics = await listPodMetricUsage(entry, namespace)
    return items.map((pod) => {
      const podNamespace = pod.metadata?.namespace ?? namespace ?? ''
      const usage = podMetrics.get(podMetricsKey(podNamespace, pod.metadata?.name))
      const pvcClaims = podPersistentVolumeClaims(pod)
      return {
        name: pod.metadata?.name ?? '',
        namespace: podNamespace,
        status: pod.status?.phase ?? '',
        nodeName: pod.spec?.nodeName ?? '',
        restarts: podRestarts(pod),
        cpu: usage?.cpu ?? '-',
        memory: usage?.memory ?? '-',
        age: formatAge(pod.metadata?.creationTimestamp),
        ...(pod.metadata?.labels ? { labels: pod.metadata.labels } : {}),
        ...(pod.spec?.serviceAccountName ? { serviceAccount: pod.spec.serviceAccountName } : {}),
        ...(pod.spec?.priorityClassName ? { priority: pod.spec.priorityClassName } : {}),
        ...(pod.spec?.runtimeClassName ? { runtimeClass: pod.spec.runtimeClassName } : {}),
        ...(pvcClaims.length > 0 ? { pvcClaims } : {}),
      }
    })
  } catch (err) {
    throw new Error(`获取 Pod 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listDeployments = async (contextId: string, namespace?: string): Promise<DeploymentInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedDeployment({ namespace })
    } else {
      res = await api.listDeploymentForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Deployment[] }; items?: V1Deployment[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((deploy) => ({
      name: deploy.metadata?.name ?? '',
      namespace: deploy.metadata?.namespace ?? '',
      replicas: deploy.spec?.replicas ?? 0,
      readyReplicas: deploy.status?.readyReplicas ?? 0,
      availableReplicas: deploy.status?.availableReplicas ?? 0,
      age: formatAge(deploy.metadata?.creationTimestamp),
      paused: deploy.spec?.paused ?? false,
    }))
  } catch (err) {
    throw new Error(`获取 Deployment 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listDaemonSets = async (contextId: string, namespace?: string): Promise<DaemonSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedDaemonSet({ namespace })
    } else {
      res = await api.listDaemonSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1DaemonSet[] }; items?: V1DaemonSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((ds) => ({
      name: ds.metadata?.name ?? '',
      namespace: ds.metadata?.namespace ?? '',
      desiredNumberScheduled: ds.status?.desiredNumberScheduled ?? 0,
      currentNumberScheduled: ds.status?.currentNumberScheduled ?? 0,
      numberReady: ds.status?.numberReady ?? 0,
      age: formatAge(ds.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 DaemonSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStatefulSets = async (contextId: string, namespace?: string): Promise<StatefulSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedStatefulSet({ namespace })
    } else {
      res = await api.listStatefulSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1StatefulSet[] }; items?: V1StatefulSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sts) => ({
      name: sts.metadata?.name ?? '',
      namespace: sts.metadata?.namespace ?? '',
      replicas: sts.spec?.replicas ?? 0,
      readyReplicas: sts.status?.readyReplicas ?? 0,
      age: formatAge(sts.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 StatefulSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listReplicaSets = async (contextId: string, namespace?: string): Promise<ReplicaSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedReplicaSet({ namespace })
    } else {
      res = await api.listReplicaSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ReplicaSet[] }; items?: V1ReplicaSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((rs) => ({
      name: rs.metadata?.name ?? '',
      namespace: rs.metadata?.namespace ?? '',
      replicas: rs.spec?.replicas ?? 0,
      readyReplicas: rs.status?.readyReplicas ?? 0,
      age: formatAge(rs.metadata?.creationTimestamp),
      labels: rs.metadata?.labels,
      selector: rs.spec?.selector?.matchLabels,
      owner: formatOwnerReferences(rs.metadata?.ownerReferences),
      fullyLabeledReplicas: rs.status?.fullyLabeledReplicas,
      availableReplicas: rs.status?.availableReplicas
    }))
  } catch (err) {
    throw new Error(`获取 ReplicaSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listReplicationControllers = async (contextId: string, namespace?: string): Promise<ReplicationControllerInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedReplicationController({ namespace })
    } else {
      res = await api.listReplicationControllerForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ReplicationController[] }; items?: V1ReplicationController[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((rc) => ({
      name: rc.metadata?.name ?? '',
      namespace: rc.metadata?.namespace ?? '',
      replicas: rc.spec?.replicas ?? 0,
      readyReplicas: rc.status?.readyReplicas ?? 0,
      availableReplicas: rc.status?.availableReplicas ?? 0,
      age: formatAge(rc.metadata?.creationTimestamp),
      labels: rc.metadata?.labels,
      selector: rc.spec?.selector,
      fullyLabeledReplicas: rc.status?.fullyLabeledReplicas,
    }))
  } catch (err) {
    throw new Error(`获取 ReplicationController 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getReplicationControllerDetail = async (contextId: string, namespace: string, name: string): Promise<ReplicationControllerInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedReplicationController({ name, namespace })
    const rc = extractResponse<V1ReplicationController>(res)
    if (!rc) throw new Error('ReplicationController不存在')

    return {
      name: rc.metadata?.name ?? '',
      namespace: rc.metadata?.namespace ?? '',
      replicas: rc.spec?.replicas ?? 0,
      readyReplicas: rc.status?.readyReplicas ?? 0,
      availableReplicas: rc.status?.availableReplicas ?? 0,
      age: formatAge(rc.metadata?.creationTimestamp),
      labels: rc.metadata?.labels,
      selector: rc.spec?.selector,
      fullyLabeledReplicas: rc.status?.fullyLabeledReplicas,
    }
  } catch (err) {
    throw new Error(`获取ReplicationController详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listControllerRevisions = async (contextId: string, namespace?: string): Promise<ControllerRevisionInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedControllerRevision({ namespace })
    } else {
      res = await api.listControllerRevisionForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ControllerRevision[] }; items?: V1ControllerRevision[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((revision) => ({
      name: revision.metadata?.name ?? '',
      namespace: revision.metadata?.namespace ?? '',
      revision: revision.revision ?? 0,
      owner: formatOwnerReferences(revision.metadata?.ownerReferences),
      dataKind: formatObjectKind(revision.data),
      age: formatAge(revision.metadata?.creationTimestamp),
      labels: revision.metadata?.labels,
    }))
  } catch (err) {
    throw new Error(`获取 ControllerRevision 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPodTemplates = async (contextId: string, namespace?: string): Promise<PodTemplateInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPodTemplate({ namespace })
    } else {
      res = await api.listPodTemplateForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1PodTemplate[] }; items?: V1PodTemplate[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((template) => {
      const containers = template.template?.spec?.containers ?? []
      return {
        name: template.metadata?.name ?? '',
        namespace: template.metadata?.namespace ?? '',
        containers: containers.length,
        images: containers.map((container) => container.image).filter(Boolean).join(', ') || '-',
        restartPolicy: template.template?.spec?.restartPolicy ?? '-',
        serviceAccount: template.template?.spec?.serviceAccountName ?? '-',
        templateLabels: formatQuotaValues(template.template?.metadata?.labels),
        nodeSelector: formatQuotaValues(template.template?.spec?.nodeSelector),
        age: formatAge(template.metadata?.creationTimestamp),
        labels: template.metadata?.labels,
      }
    })
  } catch (err) {
    throw new Error(`获取 PodTemplate 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listJobs = async (contextId: string, namespace?: string): Promise<JobInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedJob({ namespace })
    } else {
      res = await api.listJobForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Job[] }; items?: V1Job[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((job) => ({
      name: job.metadata?.name ?? '',
      namespace: job.metadata?.namespace ?? '',
      completions: job.spec?.completions ?? 0,
      succeeded: job.status?.succeeded ?? 0,
      active: job.status?.active ?? 0,
      failed: job.status?.failed ?? 0,
      suspend: job.spec?.suspend ?? false,
      age: formatAge(job.metadata?.creationTimestamp),
      labels: job.metadata?.labels,
      selector: job.spec?.selector?.matchLabels,
      owner: formatOwnerReferences(job.metadata?.ownerReferences),
    }))
  } catch (err) {
    throw new Error(`获取 Job 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCronJobs = async (contextId: string, namespace?: string): Promise<CronJobInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedCronJob({ namespace })
    } else {
      res = await api.listCronJobForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1CronJob[] }; items?: V1CronJob[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cj) => ({
      name: cj.metadata?.name ?? '',
      namespace: cj.metadata?.namespace ?? '',
      schedule: cj.spec?.schedule ?? '',
      suspend: cj.spec?.suspend ?? false,
      active: cj.status?.active?.length ?? 0,
      lastSchedule: cj.status?.lastScheduleTime ? formatAge(cj.status.lastScheduleTime) : '',
      age: formatAge(cj.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 CronJob 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const extractResponse = <T>(res: unknown): T | undefined => {
  const typed = res as { body?: T; response?: T } | T
  if (typed === undefined || typed === null) {
    return undefined
  }
  if (typeof typed !== 'object') {
    return typed as T
  }
  if ('body' in typed && typed.body !== undefined) return typed.body
  if ('response' in typed && typed.response !== undefined) return typed.response
  if (typed && typeof typed === 'object') {
    if ('metadata' in typed) return typed as T
  }
  return undefined
}

const getContainerState = (state?: { running?: unknown; waiting?: { reason?: string }; terminated?: unknown }): string => {
  if (!state) return 'Unknown'
  if (state.running) return 'Running'
  if (state.waiting) return `Waiting: ${state.waiting.reason ?? 'Unknown'}`
  if (state.terminated) return 'Terminated'
  return 'Unknown'
}

const mapPodContainers = (
  specContainers: Array<{
    name?: string
    image?: string
    ports?: Array<{ containerPort?: number }>
  }> = [],
  statusContainers: Array<{
    name?: string
    image?: string
    restartCount?: number
    ready?: boolean
    state?: Parameters<typeof getContainerState>[0]
  }> = [],
  metrics?: Map<string, { cpu: string; memory: string }>,
): PodContainer[] => {
  const statusByName = new Map(
    statusContainers
      .filter((container) => Boolean(container.name))
      .map((container) => [container.name as string, container]),
  )
  const orderedNames = specContainers
    .map((container) => container.name?.trim())
    .filter((name): name is string => Boolean(name))

  for (const status of statusContainers) {
    const name = status.name?.trim()
    if (name && !orderedNames.includes(name)) {
      orderedNames.push(name)
    }
  }

  return orderedNames.map((name) => {
    const spec = specContainers.find((container) => container.name === name)
    const status = statusByName.get(name)
    const usage = metrics?.get(name)
    return {
      name,
      image: status?.image ?? spec?.image ?? '',
      restartCount: status?.restartCount ?? 0,
      ready: status?.ready ?? false,
      state: getContainerState(status?.state),
      cpu: usage?.cpu ?? '-',
      memory: usage?.memory ?? '-',
      ports: (spec?.ports ?? [])
        .map((port) => port.containerPort)
        .filter((port): port is number => Number.isInteger(port)),
    }
  })
}

export const getPodDetail = async (contextId: string, namespace: string, podName: string): Promise<PodInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedPod({ name: podName, namespace })
    const pod = extractResponse<V1Pod>(res)
    if (!pod) throw new Error('Pod不存在')
    const usage = (await listPodMetricUsage(entry, namespace)).get(podMetricsKey(namespace, podName))

    const containers = mapPodContainers(
      pod.spec?.containers ?? [],
      (pod.status?.containerStatuses ?? []).map((container) => ({
        name: container.name,
        image: container.image,
        restartCount: container.restartCount,
        ready: container.ready,
        state: container.state as Parameters<typeof getContainerState>[0],
      })),
      usage?.containers,
    )

    const initContainers = mapPodContainers(
      pod.spec?.initContainers ?? [],
      (pod.status?.initContainerStatuses ?? []).map((container) => ({
        name: container.name,
        image: container.image,
        restartCount: container.restartCount,
        ready: container.ready,
        state: container.state as Parameters<typeof getContainerState>[0],
      })),
      usage?.containers,
    )
    const pvcClaims = podPersistentVolumeClaims(pod)

    return {
      name: pod.metadata?.name ?? '',
      namespace: pod.metadata?.namespace ?? '',
      status: pod.status?.phase ?? '',
      nodeName: pod.spec?.nodeName ?? '',
      restarts: podRestarts(pod),
      cpu: usage?.cpu ?? '-',
      memory: usage?.memory ?? '-',
      age: formatAge(pod.metadata?.creationTimestamp),
      podIP: pod.status?.podIP,
      hostIP: pod.status?.hostIP,
      startTime: pod.status?.startTime?.toISOString(),
      labels: pod.metadata?.labels,
      containers,
      initContainers,
      serviceAccount: pod.spec?.serviceAccountName,
      priority: pod.spec?.priorityClassName,
      runtimeClass: pod.spec?.runtimeClassName,
      qosClass: pod.status?.qosClass,
      ...(pvcClaims.length > 0 ? { pvcClaims } : {}),
    }
  } catch (err) {
    throw new Error(`获取Pod详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getDeploymentDetail = async (contextId: string, namespace: string, name: string): Promise<DeploymentInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedDeployment({ name, namespace })
    const deploy = extractResponse<V1Deployment>(res)
    if (!deploy) throw new Error('Deployment不存在')

    return {
      name: deploy.metadata?.name ?? '',
      namespace: deploy.metadata?.namespace ?? '',
      replicas: deploy.spec?.replicas ?? 0,
      readyReplicas: deploy.status?.readyReplicas ?? 0,
      availableReplicas: deploy.status?.availableReplicas ?? 0,
      age: formatAge(deploy.metadata?.creationTimestamp),
      paused: deploy.spec?.paused ?? false,
      labels: deploy.metadata?.labels,
      selector: deploy.spec?.selector?.matchLabels,
      strategy: deploy.spec?.strategy?.type,
      updatedReplicas: deploy.status?.updatedReplicas,
      unavailableReplicas: deploy.status?.unavailableReplicas
    }
  } catch (err) {
    throw new Error(`获取Deployment详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getDaemonSetDetail = async (contextId: string, namespace: string, name: string): Promise<DaemonSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedDaemonSet({ name, namespace })
    const ds = extractResponse<V1DaemonSet>(res)
    if (!ds) throw new Error('DaemonSet不存在')

    return {
      name: ds.metadata?.name ?? '',
      namespace: ds.metadata?.namespace ?? '',
      desiredNumberScheduled: ds.status?.desiredNumberScheduled ?? 0,
      currentNumberScheduled: ds.status?.currentNumberScheduled ?? 0,
      numberReady: ds.status?.numberReady ?? 0,
      age: formatAge(ds.metadata?.creationTimestamp),
      labels: ds.metadata?.labels,
      selector: ds.spec?.selector?.matchLabels,
      updatedNumberScheduled: ds.status?.updatedNumberScheduled,
      numberAvailable: ds.status?.numberAvailable,
      numberUnavailable: ds.status?.numberUnavailable
    }
  } catch (err) {
    throw new Error(`获取DaemonSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getStatefulSetDetail = async (contextId: string, namespace: string, name: string): Promise<StatefulSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedStatefulSet({ name, namespace })
    const sts = extractResponse<V1StatefulSet>(res)
    if (!sts) throw new Error('StatefulSet不存在')

    return {
      name: sts.metadata?.name ?? '',
      namespace: sts.metadata?.namespace ?? '',
      replicas: sts.spec?.replicas ?? 0,
      readyReplicas: sts.status?.readyReplicas ?? 0,
      age: formatAge(sts.metadata?.creationTimestamp),
      labels: sts.metadata?.labels,
      selector: sts.spec?.selector?.matchLabels,
      serviceName: sts.spec?.serviceName,
      updateStrategy: sts.spec?.updateStrategy?.type,
      currentReplicas: sts.status?.currentReplicas,
      updatedReplicas: sts.status?.updatedReplicas
    }
  } catch (err) {
    throw new Error(`获取StatefulSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getReplicaSetDetail = async (contextId: string, namespace: string, name: string): Promise<ReplicaSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedReplicaSet({ name, namespace })
    const rs = extractResponse<V1ReplicaSet>(res)
    if (!rs) throw new Error('ReplicaSet不存在')

    return {
      name: rs.metadata?.name ?? '',
      namespace: rs.metadata?.namespace ?? '',
      replicas: rs.spec?.replicas ?? 0,
      readyReplicas: rs.status?.readyReplicas ?? 0,
      age: formatAge(rs.metadata?.creationTimestamp),
      labels: rs.metadata?.labels,
      selector: rs.spec?.selector?.matchLabels,
      owner: formatOwnerReferences(rs.metadata?.ownerReferences),
      fullyLabeledReplicas: rs.status?.fullyLabeledReplicas,
      availableReplicas: rs.status?.availableReplicas
    }
  } catch (err) {
    throw new Error(`获取ReplicaSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getJobDetail = async (contextId: string, namespace: string, name: string): Promise<JobInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    const res = await api.readNamespacedJob({ name, namespace })
    const job = extractResponse<V1Job>(res)
    if (!job) throw new Error('Job不存在')

    let duration: string | undefined
    if (job.status?.startTime && job.status?.completionTime) {
      const diff = job.status.completionTime.getTime() - job.status.startTime.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) duration = `${hours}h ${minutes % 60}m`
      else if (minutes > 0) duration = `${minutes}m ${seconds % 60}s`
      else duration = `${seconds}s`
    }

    return {
      name: job.metadata?.name ?? '',
      namespace: job.metadata?.namespace ?? '',
      completions: job.spec?.completions ?? 0,
      succeeded: job.status?.succeeded ?? 0,
      active: job.status?.active ?? 0,
      failed: job.status?.failed ?? 0,
      suspend: job.spec?.suspend ?? false,
      age: formatAge(job.metadata?.creationTimestamp),
      labels: job.metadata?.labels,
      selector: job.spec?.selector?.matchLabels,
      owner: formatOwnerReferences(job.metadata?.ownerReferences),
      startTime: job.status?.startTime?.toISOString(),
      completionTime: job.status?.completionTime?.toISOString(),
      duration,
      parallelism: job.spec?.parallelism,
      backoffLimit: job.spec?.backoffLimit,
    }
  } catch (err) {
    throw new Error(`获取Job详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getCronJobDetail = async (contextId: string, namespace: string, name: string): Promise<CronJobInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    const res = await api.readNamespacedCronJob({ name, namespace })
    const cj = extractResponse<V1CronJob>(res)
    if (!cj) throw new Error('CronJob不存在')

    return {
      name: cj.metadata?.name ?? '',
      namespace: cj.metadata?.namespace ?? '',
      schedule: cj.spec?.schedule ?? '',
      suspend: cj.spec?.suspend ?? false,
      active: cj.status?.active?.length ?? 0,
      lastSchedule: cj.status?.lastScheduleTime ? formatAge(cj.status.lastScheduleTime) : '',
      age: formatAge(cj.metadata?.creationTimestamp),
      labels: cj.metadata?.labels,
      selector: cj.spec?.jobTemplate?.spec?.selector?.matchLabels,
      concurrencyPolicy: cj.spec?.concurrencyPolicy,
      successfulJobsHistoryLimit: cj.spec?.successfulJobsHistoryLimit,
      failedJobsHistoryLimit: cj.spec?.failedJobsHistoryLimit,
      startingDeadlineSeconds: cj.spec?.startingDeadlineSeconds
    }
  } catch (err) {
    throw new Error(`获取CronJob详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const cronJobManualJobGenerateName = (name: string): string => {
  const normalized = (name || 'cronjob')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9]+$/, '')
  const base = (normalized || 'cronjob').slice(0, 47).replace(/[^a-z0-9]+$/, '') || 'cronjob'
  return `${base}-manual-`
}

const jobFromCronJobTemplate = (cronJob: V1CronJob, namespace: string): V1Job => {
  const cronJobName = cronJob.metadata?.name ?? 'cronjob'
  const template = cronJob.spec?.jobTemplate
  if (!template?.spec) {
    throw new Error('CronJob缺少jobTemplate.spec')
  }

  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      generateName: cronJobManualJobGenerateName(cronJobName),
      namespace,
      labels: template.metadata?.labels,
      annotations: template.metadata?.annotations,
    },
    spec: template.spec,
  }
}

export const triggerCronJob = async (contextId: string, namespace: string, name: string): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)

  try {
    const cronJob = extractResponse<V1CronJob>(await api.readNamespacedCronJob({ namespace, name }))
    if (!cronJob) throw new Error('CronJob不存在')

    const job = jobFromCronJobTemplate(cronJob, namespace)
    const created = extractResponse<V1Job>(await api.createNamespacedJob({ namespace, body: job }))
    const jobName = created?.metadata?.name ?? job.metadata?.generateName
    return {
      success: true,
      name: jobName,
      namespace,
      message: `CronJob ${namespace}/${name} 已触发 Job ${jobName ?? '-'}`,
    }
  } catch (err) {
    return { success: false, message: `触发CronJob失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Delete operations
export const deletePod = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespacedPod({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Pod失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const evictPod = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const body: V1Eviction = {
      apiVersion: 'policy/v1',
      kind: 'Eviction',
      metadata: { name, namespace },
    }
    await api.createNamespacedPodEviction({ name, namespace, body })
    return { success: true, message: `Pod ${namespace}/${name} 已发起 Evict` }
  } catch (err) {
    return { success: false, message: `Evict Pod失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const forceDeletePod = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespacedPod({
      name,
      namespace,
      gracePeriodSeconds: 0,
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
        gracePeriodSeconds: 0,
      } as V1DeleteOptions,
    })
    return { success: true, message: `Pod ${namespace}/${name} 已强制删除` }
  } catch (err) {
    return { success: false, message: `强制删除Pod失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteDeployment = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedDeployment({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteDaemonSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedDaemonSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除DaemonSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteStatefulSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedStatefulSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除StatefulSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteReplicaSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedReplicaSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除ReplicaSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteReplicationController = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespacedReplicationController({ name, namespace, body: {} as V1DeleteOptions })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除ReplicationController失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteJob = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    await api.deleteNamespacedJob({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Job失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteCronJob = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    await api.deleteNamespacedCronJob({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除CronJob失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteNamespace = async (contextId: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespace({ name })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Namespace失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

const setNodeUnschedulable = async (
  contextId: string,
  nodeName: string,
  unschedulable: boolean
): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.patchNode({
      name: nodeName,
      body: { spec: { unschedulable } },
    }, mergePatchOptions())
    return {
      success: true,
      message: `Node ${nodeName} 已${unschedulable ? '设为不可调度' : '恢复调度'}`,
    }
  } catch (err) {
    return {
      success: false,
      message: `${unschedulable ? 'Cordon' : 'Uncordon'} Node失败: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export const cordonNode = async (contextId: string, nodeName: string): Promise<UpdateResult> => {
  return setNodeUnschedulable(contextId, nodeName, true)
}

export const uncordonNode = async (contextId: string, nodeName: string): Promise<UpdateResult> => {
  return setNodeUnschedulable(contextId, nodeName, false)
}

const shouldSkipDrainPod = (pod: V1Pod): string | null => {
  if (!pod.metadata?.name || !pod.metadata.namespace) return 'Pod 信息不完整'
  if (pod.metadata.annotations?.['kubernetes.io/config.mirror']) return '静态 Pod'
  const owners = pod.metadata.ownerReferences ?? []
  if (owners.some((owner) => owner.kind === 'DaemonSet')) return 'DaemonSet Pod'
  if (owners.length === 0) return '裸 Pod'
  const hasControllerOwner = owners.some((owner) => owner.controller === true)
  if (!hasControllerOwner) return '无控制器 Pod'
  if ((pod.spec?.volumes ?? []).some((volume) => volume.emptyDir || volume.hostPath)) {
    return '使用本地存储'
  }
  return null
}

export const drainNode = async (contextId: string, nodeName: string): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const cordonResult = await cordonNode(contextId, nodeName)
  if (!cordonResult.success) {
    return cordonResult
  }

  try {
    const res = (await api.listPodForAllNamespaces({
      fieldSelector: `spec.nodeName=${nodeName}`,
    })) as unknown as { body?: { items?: V1Pod[] }; items?: V1Pod[] }
    const pods = res.body?.items ?? res.items ?? []
    const skippedPods: string[] = []
    const drainablePods = pods.filter((pod) => {
      const reason = shouldSkipDrainPod(pod)
      if (reason) {
        skippedPods.push(`${pod.metadata?.namespace ?? '-'}/${pod.metadata?.name ?? '-'} (${reason})`)
        return false
      }
      return true
    })

    let evictedPods = 0
    const failures: string[] = []

    for (const pod of drainablePods) {
      const name = pod.metadata?.name
      const namespace = pod.metadata?.namespace
      if (!name || !namespace) continue

      const body: V1Eviction = {
        apiVersion: 'policy/v1',
        kind: 'Eviction',
        metadata: { name, namespace },
      }

      try {
        await api.createNamespacedPodEviction({ name, namespace, body })
        evictedPods += 1
      } catch (err) {
        failures.push(`${namespace}/${name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    const skippedText = skippedPods.length > 0
      ? `，跳过 ${skippedPods.length} 个 Pod: ${skippedPods.slice(0, 3).join('; ')}`
      : ''
    if (failures.length > 0) {
      return {
        success: false,
        message: `Node ${nodeName} 已 cordon，已驱逐 ${evictedPods} 个 Pod${skippedText}，失败 ${failures.length} 个: ${failures.slice(0, 3).join('; ')}`,
      }
    }

    return {
      success: true,
      message: `Node ${nodeName} 已 drain，已驱逐 ${evictedPods} 个 Pod${skippedText}`,
    }
  } catch (err) {
    return { success: false, message: `Drain Node失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteNode = async (contextId: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNode({ name, body: {} as V1DeleteOptions })
    return { success: true, message: `Node ${name} 已删除` }
  } catch (err) {
    return { success: false, message: `删除Node失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteCustomResourceDefinition = async (contextId: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createApiextensionsV1Api(entry)
  try {
    await api.deleteCustomResourceDefinition({ name, body: {} as V1DeleteOptions })
    return { success: true, message: `CustomResourceDefinition ${name} 已删除` }
  } catch (err) {
    return { success: false, message: `删除CustomResourceDefinition失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteResource = async (
  contextId: string,
  kind: KubernetesResourceKind,
  namespace: string,
  name: string
): Promise<DeleteResult> => {
  await ensureCache()
  switch (kind) {
    case 'Pod':
      return deletePod(contextId, namespace, name)
    case 'Deployment':
      return deleteDeployment(contextId, namespace, name)
    case 'DaemonSet':
      return deleteDaemonSet(contextId, namespace, name)
    case 'StatefulSet':
      return deleteStatefulSet(contextId, namespace, name)
    case 'ReplicaSet':
      return deleteReplicaSet(contextId, namespace, name)
    case 'ReplicationController':
      return deleteReplicationController(contextId, namespace, name)
    case 'ControllerRevision': {
      const api = createAppsV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedControllerRevision({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `ControllerRevision ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ControllerRevision失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PodTemplate': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedPodTemplate({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `PodTemplate ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PodTemplate失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Job':
      return deleteJob(contextId, namespace, name)
    case 'CronJob':
      return deleteCronJob(contextId, namespace, name)
    case 'Namespace':
      return deleteNamespace(contextId, name)
    case 'Node':
      return deleteNode(contextId, name)
    case 'CustomResourceDefinition':
      return deleteCustomResourceDefinition(contextId, name)
    case 'Service': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedService({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Service ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Service失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ConfigMap': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedConfigMap({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `ConfigMap ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ConfigMap失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Secret': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedSecret({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Secret ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Secret失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Endpoints': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedEndpoints({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Endpoints ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Endpoints失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Event': {
      const entry = getEntry(contextId)
      const eventsApi = createEventsV1Api(entry)
      const coreApi = createCoreV1Api(entry)
      try {
        await eventsApi.deleteNamespacedEvent({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Event ${name} 已删除` }
      } catch (err) {
        if (!isNotFoundError(err)) {
          return { success: false, message: `删除Event失败: ${err instanceof Error ? err.message : String(err)}` }
        }
        try {
          await coreApi.deleteNamespacedEvent({ namespace, name, body: {} as V1DeleteOptions })
          return { success: true, message: `Event ${name} 已删除` }
        } catch (coreErr) {
          return { success: false, message: `删除Event失败: ${coreErr instanceof Error ? coreErr.message : String(coreErr)}` }
        }
      }
    }
    case 'Ingress': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedIngress({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Ingress ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Ingress失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'IngressClass': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteIngressClass({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `IngressClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除IngressClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'NetworkPolicy': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedNetworkPolicy({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `NetworkPolicy ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除NetworkPolicy失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'IPAddress': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteIPAddress({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `IPAddress ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除IPAddress失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ServiceCIDR': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteServiceCIDR({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ServiceCIDR ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ServiceCIDR失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'EndpointSlice': {
      const api = createDiscoveryV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedEndpointSlice({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `EndpointSlice ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除EndpointSlice失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'APIService': {
      const api = createApiregistrationV1Api(getEntry(contextId))
      try {
        await api.deleteAPIService({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `APIService ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除APIService失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'MutatingWebhookConfiguration': {
      const api = createAdmissionregistrationV1Api(getEntry(contextId))
      try {
        await api.deleteMutatingWebhookConfiguration({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `MutatingWebhookConfiguration ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除MutatingWebhookConfiguration失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ValidatingWebhookConfiguration': {
      const api = createAdmissionregistrationV1Api(getEntry(contextId))
      try {
        await api.deleteValidatingWebhookConfiguration({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ValidatingWebhookConfiguration ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ValidatingWebhookConfiguration失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'MutatingAdmissionPolicy': {
      const api = createAdmissionregistrationV1beta1Api(getEntry(contextId))
      try {
        await api.deleteMutatingAdmissionPolicy({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `MutatingAdmissionPolicy ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除MutatingAdmissionPolicy失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'MutatingAdmissionPolicyBinding': {
      const api = createAdmissionregistrationV1beta1Api(getEntry(contextId))
      try {
        await api.deleteMutatingAdmissionPolicyBinding({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `MutatingAdmissionPolicyBinding ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除MutatingAdmissionPolicyBinding失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ValidatingAdmissionPolicy': {
      const api = createAdmissionregistrationV1Api(getEntry(contextId))
      try {
        await api.deleteValidatingAdmissionPolicy({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ValidatingAdmissionPolicy ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ValidatingAdmissionPolicy失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ValidatingAdmissionPolicyBinding': {
      const api = createAdmissionregistrationV1Api(getEntry(contextId))
      try {
        await api.deleteValidatingAdmissionPolicyBinding({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ValidatingAdmissionPolicyBinding ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ValidatingAdmissionPolicyBinding失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'FlowSchema': {
      const api = createFlowcontrolV1Api(getEntry(contextId))
      try {
        await api.deleteFlowSchema({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `FlowSchema ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除FlowSchema失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PriorityLevelConfiguration': {
      const api = createFlowcontrolV1Api(getEntry(contextId))
      try {
        await api.deletePriorityLevelConfiguration({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `PriorityLevelConfiguration ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PriorityLevelConfiguration失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'CertificateSigningRequest': {
      const api = createCertificatesV1Api(getEntry(contextId))
      try {
        await api.deleteCertificateSigningRequest({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `CertificateSigningRequest ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除CertificateSigningRequest失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ClusterTrustBundle': {
      const api = createCertificatesV1beta1Api(getEntry(contextId))
      try {
        await api.deleteClusterTrustBundle({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ClusterTrustBundle ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ClusterTrustBundle失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PodCertificateRequest': {
      const api = createCertificatesV1alpha1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedPodCertificateRequest({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `PodCertificateRequest ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PodCertificateRequest失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'StorageVersion': {
      const api = createInternalApiserverV1alpha1Api(getEntry(contextId))
      try {
        await api.deleteStorageVersion({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `StorageVersion ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除StorageVersion失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'StorageVersionMigration': {
      const api = createStoragemigrationV1alpha1Api(getEntry(contextId))
      try {
        await api.deleteStorageVersionMigration({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `StorageVersionMigration ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除StorageVersionMigration失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PodDisruptionBudget': {
      const api = createPolicyV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedPodDisruptionBudget({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `PodDisruptionBudget ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PodDisruptionBudget失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'HorizontalPodAutoscaler': {
      const api = createAutoscalingV2Api(getEntry(contextId))
      try {
        await api.deleteNamespacedHorizontalPodAutoscaler({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `HorizontalPodAutoscaler ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除HorizontalPodAutoscaler失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ResourceQuota': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedResourceQuota({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `ResourceQuota ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ResourceQuota失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'LimitRange': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedLimitRange({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `LimitRange ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除LimitRange失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PriorityClass': {
      const api = createSchedulingV1Api(getEntry(contextId))
      try {
        await api.deletePriorityClass({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `PriorityClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PriorityClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'RuntimeClass': {
      const api = createNodeV1Api(getEntry(contextId))
      try {
        await api.deleteRuntimeClass({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `RuntimeClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除RuntimeClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Lease': {
      const api = createCoordinationV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedLease({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Lease ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Lease失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'LeaseCandidate': {
      const api = createCoordinationV1beta1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedLeaseCandidate({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `LeaseCandidate ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除LeaseCandidate失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PersistentVolumeClaim': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedPersistentVolumeClaim({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `PersistentVolumeClaim ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PersistentVolumeClaim失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PersistentVolume': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deletePersistentVolume({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `PersistentVolume ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PersistentVolume失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'StorageClass': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteStorageClass({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `StorageClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除StorageClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'VolumeAttributesClass': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteVolumeAttributesClass({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `VolumeAttributesClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除VolumeAttributesClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'CSIDriver': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteCSIDriver({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `CSIDriver ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除CSIDriver失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'CSINode': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteCSINode({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `CSINode ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除CSINode失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'VolumeAttachment': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteVolumeAttachment({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `VolumeAttachment ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除VolumeAttachment失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'CSIStorageCapacity': {
      const api = createStorageV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedCSIStorageCapacity({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `CSIStorageCapacity ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除CSIStorageCapacity失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'VolumeSnapshotClass': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteClusterCustomObject({
          group: SNAPSHOT_GROUP,
          version: SNAPSHOT_VERSION,
          plural: VOLUME_SNAPSHOT_CLASSES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `VolumeSnapshotClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除VolumeSnapshotClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'VolumeSnapshot': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: SNAPSHOT_GROUP,
          version: SNAPSHOT_VERSION,
          namespace,
          plural: VOLUME_SNAPSHOTS_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `VolumeSnapshot ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除VolumeSnapshot失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'VolumeSnapshotContent': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteClusterCustomObject({
          group: SNAPSHOT_GROUP,
          version: SNAPSHOT_VERSION,
          plural: VOLUME_SNAPSHOT_CONTENTS_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `VolumeSnapshotContent ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除VolumeSnapshotContent失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'GatewayClass': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteClusterCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          plural: GATEWAY_CLASSES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `GatewayClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除GatewayClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Gateway': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          namespace,
          plural: GATEWAYS_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `Gateway ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Gateway失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'HTTPRoute': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          namespace,
          plural: HTTP_ROUTES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `HTTPRoute ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除HTTPRoute失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'GRPCRoute': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          namespace,
          plural: GRPC_ROUTES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `GRPCRoute ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除GRPCRoute失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'TLSRoute': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          namespace,
          plural: TLS_ROUTES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `TLSRoute ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除TLSRoute失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'TCPRoute': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_ALPHA_VERSION,
          namespace,
          plural: TCP_ROUTES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `TCPRoute ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除TCPRoute失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'UDPRoute': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_ALPHA_VERSION,
          namespace,
          plural: UDP_ROUTES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `UDPRoute ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除UDPRoute失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ReferenceGrant': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version: GATEWAY_VERSION,
          namespace,
          plural: REFERENCE_GRANTS_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `ReferenceGrant ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ReferenceGrant失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'DeviceClass': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteClusterCustomObject({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          plural: DEVICE_CLASSES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `DeviceClass ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除DeviceClass失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ResourceClaim': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          namespace,
          plural: RESOURCE_CLAIMS_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `ResourceClaim ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ResourceClaim失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ResourceClaimTemplate': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteNamespacedCustomObject({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          namespace,
          plural: RESOURCE_CLAIM_TEMPLATES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `ResourceClaimTemplate ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ResourceClaimTemplate失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ResourceSlice': {
      const api = createCustomObjectsApi(getEntry(contextId))
      try {
        await api.deleteClusterCustomObject({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          plural: RESOURCE_SLICES_PLURAL,
          name,
          body: {} as V1DeleteOptions,
        })
        return { success: true, message: `ResourceSlice ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ResourceSlice失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ServiceAccount': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedServiceAccount({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `ServiceAccount ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ServiceAccount失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Role': {
      const api = createRbacV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedRole({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Role ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Role失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'RoleBinding': {
      const api = createRbacV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedRoleBinding({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `RoleBinding ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除RoleBinding失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ClusterRole': {
      const api = createRbacV1Api(getEntry(contextId))
      try {
        await api.deleteClusterRole({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ClusterRole ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ClusterRole失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ClusterRoleBinding': {
      const api = createRbacV1Api(getEntry(contextId))
      try {
        await api.deleteClusterRoleBinding({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `ClusterRoleBinding ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ClusterRoleBinding失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'DeviceTaintRule': {
      const api = createResourceV1alpha3Api(getEntry(contextId))
      try {
        await api.deleteDeviceTaintRule({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `DeviceTaintRule ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除DeviceTaintRule失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    default:
      return { success: false, message: `暂不支持删除 ${kind}` }
  }
}

// Scale operations
export const scaleDeployment = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedDeploymentScale(
      { name, namespace, body: { spec: { replicas } } },
      mergePatchOptions(),
    )
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleWorkload = async (
  contextId: string,
  kind: ScaleableWorkloadKind,
  namespace: string,
  name: string,
  replicas: number
): Promise<ScaleResult> => {
  switch (kind) {
    case 'Deployment':
      return scaleDeployment(contextId, namespace, name, replicas)
    case 'StatefulSet':
      return scaleStatefulSet(contextId, namespace, name, replicas)
    case 'ReplicaSet':
      return scaleReplicaSet(contextId, namespace, name, replicas)
    case 'ReplicationController':
      return scaleReplicationController(contextId, namespace, name, replicas)
  }
}

export const restartWorkload = async (
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
): Promise<RolloutResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  const restartedAt = new Date().toISOString()
  const patch = {
    spec: {
      template: {
        metadata: {
          annotations: {
            'kubectl.kubernetes.io/restartedAt': restartedAt
          }
        }
      }
    }
  }

  try {
    switch (kind) {
      case 'Deployment':
        await api.patchNamespacedDeployment({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
      case 'DaemonSet':
        await api.patchNamespacedDaemonSet({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
      case 'StatefulSet':
        await api.patchNamespacedStatefulSet({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
    }
    return { success: true, message: `${kind} ${name} 已触发重启` }
  } catch (err) {
    return { success: false, message: `重启${kind}失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const setWorkloadImage = async (
  contextId: string,
  kind: WorkloadImageKind,
  namespace: string,
  name: string,
  containerName: string,
  image: string,
): Promise<UpdateResult> => {
  const resolvedContainer = containerName.trim()
  const resolvedImage = image.trim()
  if (!resolvedContainer) {
    return { success: false, message: '请输入容器名称' }
  }
  if (!resolvedImage) {
    return { success: false, message: '请输入镜像名称' }
  }

  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  const patch = {
    spec: {
      template: {
        spec: {
          containers: [{
            name: resolvedContainer,
            image: resolvedImage,
          }],
        },
      },
    },
  }

  try {
    switch (kind) {
      case 'Deployment':
        await api.patchNamespacedDeployment({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
      case 'DaemonSet':
        await api.patchNamespacedDaemonSet({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
      case 'StatefulSet':
        await api.patchNamespacedStatefulSet({ name, namespace, body: patch }, strategicMergePatchOptions())
        break
      default:
        return { success: false, message: `不支持更新 ${kind} 镜像` }
    }
    return { success: true, message: `${kind} ${namespace}/${name} 容器 ${resolvedContainer} 已更新为 ${resolvedImage}` }
  } catch (err) {
    return { success: false, message: `更新${kind}镜像失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

const setDeploymentPaused = async (
  contextId: string,
  namespace: string,
  name: string,
  paused: boolean,
): Promise<RolloutResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.patchNamespacedDeployment(
      { name, namespace, body: { spec: { paused } } },
      strategicMergePatchOptions(),
    )
    return { success: true, message: `Deployment ${namespace}/${name} 已${paused ? '暂停' : '恢复'} rollout` }
  } catch (err) {
    return { success: false, message: `${paused ? '暂停' : '恢复'}Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const pauseWorkload = async (
  contextId: string,
  kind: PausableWorkloadKind,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  switch (kind) {
    case 'Deployment':
      return setDeploymentPaused(contextId, namespace, name, true)
  }
}

export const resumeWorkload = async (
  contextId: string,
  kind: PausableWorkloadKind,
  namespace: string,
  name: string,
): Promise<RolloutResult> => {
  switch (kind) {
    case 'Deployment':
      return setDeploymentPaused(contextId, namespace, name, false)
  }
}

export const updateJobSuspension = async (
  contextId: string,
  kind: JobSuspensionKind,
  namespace: string,
  name: string,
  suspend: boolean,
): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  const body = { spec: { suspend } }
  const actionLabel = suspend ? '暂停' : '恢复'

  try {
    switch (kind) {
      case 'Job':
        await api.patchNamespacedJob({ name, namespace, body }, strategicMergePatchOptions())
        break
      case 'CronJob':
        await api.patchNamespacedCronJob({ name, namespace, body }, strategicMergePatchOptions())
        break
      default:
        return { success: false, message: `不支持${kind}暂停状态更新` }
    }
    return { success: true, message: `${kind} ${namespace}/${name} 已${actionLabel}` }
  } catch (err) {
    return { success: false, message: `${actionLabel}${kind}失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleStatefulSet = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedStatefulSetScale(
      { name, namespace, body: { spec: { replicas } } },
      mergePatchOptions(),
    )
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容StatefulSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleReplicaSet = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedReplicaSetScale(
      { name, namespace, body: { spec: { replicas } } },
      mergePatchOptions(),
    )
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容ReplicaSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleReplicationController = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.patchNamespacedReplicationControllerScale(
      { name, namespace, body: { spec: { replicas } } },
      mergePatchOptions(),
    )
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容ReplicationController失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const getPodLogs = async (
  contextId: string,
  namespace: string,
  podName: string,
  containerName?: string,
  tailLines: number = 100,
  previous: boolean = false,
  timestamps: boolean = false,
): Promise<string> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedPodLog({
      name: podName,
      namespace,
      container: containerName,
      tailLines: tailLines,
      ...(previous ? { previous: true } : {}),
      ...(timestamps ? { timestamps: true } : {}),
    })
    const log = extractResponse<string>(res)
    return log ?? ''
  } catch (err) {
    throw new Error(`获取日志失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// Cluster Health
export const getClusterHealth = async (contextId: string): Promise<ClusterHealth> => {
  await ensureCache()
  const entry = getEntry(contextId)

  try {
    const [nodes, pods] = await Promise.all([
      listNodes(contextId),
      listPods(contextId)
    ])

    const totalNodes = nodes.length
    const readyNodes = nodes.filter(n => n.status === 'Ready').length

    const totalPods = pods.length
    const runningPods = pods.filter(p => p.status === 'Running').length
    const pendingPods = pods.filter(p => p.status === 'Pending').length
    const failedPods = pods.filter(p => p.status === 'Failed' || p.status === 'Unknown').length

    let status: ClusterHealth['status'] = 'unknown'
    if (totalNodes === 0 && totalPods === 0) {
      status = 'unknown'
    } else if (failedPods > 0 || (totalNodes > 0 && readyNodes === 0)) {
      status = 'unhealthy'
    } else if (pendingPods > totalPods * 0.1 || readyNodes < totalNodes * 0.9) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    return {
      status,
      totalNodes,
      readyNodes,
      totalPods,
      runningPods,
      pendingPods,
      failedPods,
      lastUpdated: new Date().toISOString()
    }
  } catch {
    return {
      status: 'unknown',
      totalNodes: 0,
      readyNodes: 0,
      totalPods: 0,
      runningPods: 0,
      pendingPods: 0,
      failedPods: 0,
      lastUpdated: new Date().toISOString()
    }
  }
}

// List operations for new resource types
export const listServices = async (contextId: string, namespace?: string): Promise<ServiceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedService({ namespace })
    } else {
      res = await api.listServiceForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Service[] }; items?: V1Service[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((svc) => {
      const portDetails: ServicePortInfo[] = svc.spec?.ports?.map(p => ({
        name: p.name ?? '',
        port: p.port,
        targetPort: String(p.targetPort ?? p.port),
        protocol: p.protocol ?? 'TCP',
        appProtocol: p.appProtocol ?? '',
        nodePort: p.nodePort,
      })) ?? []
      const ports = portDetails.map(p => `${p.port}:${p.targetPort}/${p.protocol}`).join(', ')
      const hosts = svc.spec?.externalIPs?.join(', ') ?? ''
      return {
        name: svc.metadata?.name ?? '',
        namespace: svc.metadata?.namespace ?? '',
        type: svc.spec?.type ?? 'ClusterIP',
        clusterIP: svc.spec?.clusterIP ?? '',
        externalIP: hosts || undefined,
        ports,
        age: formatAge(svc.metadata?.creationTimestamp),
        labels: svc.metadata?.labels,
        selector: svc.spec?.selector,
        portDetails,
      }
    })
  } catch (err) {
    throw new Error(`获取Service失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listConfigMaps = async (contextId: string, namespace?: string): Promise<ConfigMapInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedConfigMap({ namespace })
    } else {
      res = await api.listConfigMapForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ConfigMap[] }; items?: V1ConfigMap[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cm) => ({
      name: cm.metadata?.name ?? '',
      namespace: cm.metadata?.namespace ?? '',
      age: formatAge(cm.metadata?.creationTimestamp),
      labels: cm.metadata?.labels,
      data: cm.data,
      binaryDataKeys: Object.keys(cm.binaryData ?? {}).sort(),
      ...(typeof cm.immutable === 'boolean' ? { immutable: cm.immutable } : {}),
    }))
  } catch (err) {
    throw new Error(`获取ConfigMap失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listSecrets = async (contextId: string, namespace?: string): Promise<SecretInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedSecret({ namespace })
    } else {
      res = await api.listSecretForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Secret[] }; items?: V1Secret[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((secret) => {
      const dataEntries = Object.entries(secret.data ?? {}).sort(([left], [right]) => left.localeCompare(right))
      return {
        name: secret.metadata?.name ?? '',
        namespace: secret.metadata?.namespace ?? '',
        type: secret.type ?? 'Opaque',
        age: formatAge(secret.metadata?.creationTimestamp),
        labels: secret.metadata?.labels,
        dataKeys: dataEntries.map(([key]) => key),
        dataSizes: Object.fromEntries(dataEntries.map(([key, value]) => [key, decodedBase64Size(value)])),
        ...(typeof secret.immutable === 'boolean' ? { immutable: secret.immutable } : {}),
      }
    })
  } catch (err) {
    throw new Error(`获取Secret失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listEndpoints = async (contextId: string, namespace?: string): Promise<EndpointInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedEndpoints({ namespace })
    } else {
      res = await api.listEndpointsForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Endpoints[] }; items?: V1Endpoints[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((endpoint) => {
      const subsets = endpoint.subsets ?? []
      const readyAddresses = subsets.flatMap((subset) => subset.addresses?.map((address) => address.ip) ?? [])
      const notReadyAddresses = subsets.flatMap((subset) => subset.notReadyAddresses?.map((address) => address.ip) ?? [])
      const ports = uniqueValues(subsets.map((subset) => formatEndpointPorts(subset.ports)).filter((value) => value !== '-'))
      const addressDetails = endpointAddressDetails(subsets)
      const portDetails = endpointPortDetails(subsets)
      return {
        name: endpoint.metadata?.name ?? '',
        namespace: endpoint.metadata?.namespace ?? '',
        ready: readyAddresses.length,
        notReady: notReadyAddresses.length,
        addresses: uniqueValues([...readyAddresses, ...notReadyAddresses]).join(', ') || '-',
        ports: ports.join('; ') || '-',
        age: formatAge(endpoint.metadata?.creationTimestamp),
        labels: endpoint.metadata?.labels,
        addressDetails,
        portDetails,
      }
    })
  } catch (err) {
    throw new Error(`获取Endpoints失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listHelmReleases = async (contextId: string, namespace?: string): Promise<HelmReleaseInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const listNamespace = namespace && namespace !== 'all' ? namespace : undefined
    const results = await Promise.allSettled([
      listNamespace
        ? api.listNamespacedSecret({ namespace: listNamespace })
        : api.listSecretForAllNamespaces(),
      listNamespace
        ? api.listNamespacedConfigMap({ namespace: listNamespace })
        : api.listConfigMapForAllNamespaces(),
    ])
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) => result.reason)
    const secretItems = results[0].status === 'fulfilled'
      ? ((results[0].value as { body?: { items?: V1Secret[] }; items?: V1Secret[] }).body?.items
        ?? (results[0].value as { items?: V1Secret[] }).items
        ?? [])
      : []
    const configMapItems = results[1].status === 'fulfilled'
      ? ((results[1].value as { body?: { items?: V1ConfigMap[] }; items?: V1ConfigMap[] }).body?.items
        ?? (results[1].value as { items?: V1ConfigMap[] }).items
        ?? [])
      : []
    const latest = new Map<string, HelmReleaseRecord>()

    for (const secret of secretItems) {
      const release = helmReleaseFromStorage('Secret', secret)
      if (!release) continue
      const key = `${release.namespace}/${release.name}`
      const previous = latest.get(key)
      if (!previous || release.revision > previous.revision || (
        release.revision === previous.revision && release.updatedTime > previous.updatedTime
      )) {
        latest.set(key, release)
      }
    }

    for (const configMap of configMapItems) {
      const release = helmReleaseFromStorage('ConfigMap', configMap)
      if (!release) continue
      const key = `${release.namespace}/${release.name}`
      const previous = latest.get(key)
      if (!previous || release.revision > previous.revision || (
        release.revision === previous.revision && release.updatedTime > previous.updatedTime
      )) {
        latest.set(key, release)
      }
    }

    if (latest.size === 0 && errors.length > 0) {
      const firstError = errors[0]
      throw firstError instanceof Error ? firstError : new Error(String(firstError))
    }

    return [...latest.values()]
      .map(({ updatedTime: _updatedTime, ...release }) => release)
      .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name))
  } catch (err) {
    throw new Error(`获取Helm Release失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listIngresses = async (contextId: string, namespace?: string): Promise<IngressInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedIngress({ namespace })
    } else {
      res = await api.listIngressForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Ingress[] }; items?: V1Ingress[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((ing) => {
      const rules = ingressRuleDetails(ing)
      const tls = ingressTlsDetails(ing)
      const defaultBackend = ingressDefaultBackend(ing)
      const hosts = uniqueValues([
        ...rules.map((rule) => rule.host).filter((host) => host !== '*'),
        ...tls.flatMap((item) => item.hosts === '-' ? [] : item.hosts.split(', ')),
      ]).join(', ') || '*'
      const address = ing.status?.loadBalancer?.ingress?.map(i => i.ip || i.hostname).join(', ') ?? ''
      return {
        name: ing.metadata?.name ?? '',
        namespace: ing.metadata?.namespace ?? '',
        ingressClass: ing.spec?.ingressClassName,
        hosts,
        address,
        ports: tls.length > 0 ? '80, 443' : '80',
        age: formatAge(ing.metadata?.creationTimestamp),
        labels: ing.metadata?.labels,
        rules,
        tls,
        ...defaultBackend,
      }
    })
  } catch (err) {
    throw new Error(`获取Ingress失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listIngressClasses = async (contextId: string): Promise<IngressClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    const res = await api.listIngressClass()
    const typedRes = res as { body?: { items?: V1IngressClass[] }; items?: V1IngressClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(ingressClassInfo)
  } catch (err) {
    throw new Error(`获取IngressClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listNetworkPolicies = async (contextId: string, namespace?: string): Promise<NetworkPolicyInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedNetworkPolicy({ namespace })
    } else {
      res = await api.listNetworkPolicyForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1NetworkPolicy[] }; items?: V1NetworkPolicy[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((policy) => {
      const podSelector = policy.spec?.podSelector
      return {
        name: policy.metadata?.name ?? '',
        namespace: policy.metadata?.namespace ?? '',
        podSelector: formatNetworkPolicySelector(podSelector),
        selector: podSelector?.matchLabels,
        policyTypes: policy.spec?.policyTypes?.join(', ') || '-',
        ingressRules: policy.spec?.ingress?.length ?? 0,
        egressRules: policy.spec?.egress?.length ?? 0,
        age: formatAge(policy.metadata?.creationTimestamp),
        labels: policy.metadata?.labels,
        ruleDetails: networkPolicyRuleDetails(policy),
      }
    })
  } catch (err) {
    throw new Error(`获取NetworkPolicy失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listIPAddresses = async (contextId: string): Promise<IPAddressInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    const res = await api.listIPAddress()
    const typedRes = res as { body?: { items?: V1IPAddress[] }; items?: V1IPAddress[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(ipAddressInfo)
  } catch (err) {
    throw new Error(`获取IPAddress失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listServiceCIDRs = async (contextId: string): Promise<ServiceCIDRInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    const res = await api.listServiceCIDR()
    const typedRes = res as { body?: { items?: V1ServiceCIDR[] }; items?: V1ServiceCIDR[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(serviceCIDRInfo)
  } catch (err) {
    throw new Error(`获取ServiceCIDR失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listEndpointSlices = async (contextId: string, namespace?: string): Promise<EndpointSliceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createDiscoveryV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedEndpointSlice({ namespace })
    } else {
      res = await api.listEndpointSliceForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1EndpointSlice[] }; items?: V1EndpointSlice[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((slice) => {
      const endpoints = slice.endpoints ?? []
      const ready = endpoints.filter((endpoint) => endpoint.conditions?.ready !== false).length
      const notReady = endpoints.filter((endpoint) => endpoint.conditions?.ready === false).length
      const endpointDetails = endpointSliceEndpointDetails(endpoints)
      const portDetails = endpointSlicePortDetails(slice.ports)
      return {
        name: slice.metadata?.name ?? '',
        namespace: slice.metadata?.namespace ?? '',
        addressType: slice.addressType ?? '-',
        service: slice.metadata?.labels?.['kubernetes.io/service-name'] ?? '-',
        endpoints: endpoints.length,
        ready,
        notReady,
        addresses: uniqueValues(endpoints.flatMap((endpoint) => endpoint.addresses ?? [])).join(', ') || '-',
        ports: formatEndpointPorts(slice.ports),
        age: formatAge(slice.metadata?.creationTimestamp),
        labels: slice.metadata?.labels,
        endpointDetails,
        portDetails,
      }
    })
  } catch (err) {
    throw new Error(`获取EndpointSlice失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listAPIServices = async (contextId: string): Promise<APIServiceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createApiregistrationV1Api(entry)
  try {
    const res = await api.listAPIService()
    const typedRes = res as { body?: { items?: V1APIService[] }; items?: V1APIService[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(apiServiceInfo)
  } catch (err) {
    throw new Error(`获取APIService失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listMutatingWebhookConfigurations = async (contextId: string): Promise<AdmissionWebhookConfigurationInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1Api(entry)
  try {
    const res = await api.listMutatingWebhookConfiguration()
    const typedRes = res as { body?: { items?: V1MutatingWebhookConfiguration[] }; items?: V1MutatingWebhookConfiguration[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(admissionWebhookConfigurationInfo)
  } catch (err) {
    throw new Error(`获取MutatingWebhookConfiguration失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listValidatingWebhookConfigurations = async (contextId: string): Promise<AdmissionWebhookConfigurationInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1Api(entry)
  try {
    const res = await api.listValidatingWebhookConfiguration()
    const typedRes = res as { body?: { items?: V1ValidatingWebhookConfiguration[] }; items?: V1ValidatingWebhookConfiguration[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(admissionWebhookConfigurationInfo)
  } catch (err) {
    throw new Error(`获取ValidatingWebhookConfiguration失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listMutatingAdmissionPolicies = async (contextId: string): Promise<MutatingAdmissionPolicyInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1beta1Api(entry)
  try {
    const res = await api.listMutatingAdmissionPolicy()
    const typedRes = res as { body?: { items?: V1beta1MutatingAdmissionPolicy[] }; items?: V1beta1MutatingAdmissionPolicy[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(mutatingAdmissionPolicyInfo)
  } catch (err) {
    throw new Error(`获取MutatingAdmissionPolicy失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listMutatingAdmissionPolicyBindings = async (contextId: string): Promise<MutatingAdmissionPolicyBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1beta1Api(entry)
  try {
    const res = await api.listMutatingAdmissionPolicyBinding()
    const typedRes = res as { body?: { items?: V1beta1MutatingAdmissionPolicyBinding[] }; items?: V1beta1MutatingAdmissionPolicyBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(mutatingAdmissionPolicyBindingInfo)
  } catch (err) {
    throw new Error(`获取MutatingAdmissionPolicyBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listValidatingAdmissionPolicies = async (contextId: string): Promise<ValidatingAdmissionPolicyInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1Api(entry)
  try {
    const res = await api.listValidatingAdmissionPolicy()
    const typedRes = res as { body?: { items?: V1ValidatingAdmissionPolicy[] }; items?: V1ValidatingAdmissionPolicy[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(validatingAdmissionPolicyInfo)
  } catch (err) {
    throw new Error(`获取ValidatingAdmissionPolicy失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listValidatingAdmissionPolicyBindings = async (contextId: string): Promise<ValidatingAdmissionPolicyBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAdmissionregistrationV1Api(entry)
  try {
    const res = await api.listValidatingAdmissionPolicyBinding()
    const typedRes = res as { body?: { items?: V1ValidatingAdmissionPolicyBinding[] }; items?: V1ValidatingAdmissionPolicyBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(validatingAdmissionPolicyBindingInfo)
  } catch (err) {
    throw new Error(`获取ValidatingAdmissionPolicyBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listFlowSchemas = async (contextId: string): Promise<FlowSchemaInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createFlowcontrolV1Api(entry)
  try {
    const res = await api.listFlowSchema()
    const typedRes = res as { body?: { items?: V1FlowSchema[] }; items?: V1FlowSchema[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(flowSchemaInfo)
  } catch (err) {
    throw new Error(`获取FlowSchema失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPriorityLevelConfigurations = async (contextId: string): Promise<PriorityLevelConfigurationInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createFlowcontrolV1Api(entry)
  try {
    const res = await api.listPriorityLevelConfiguration()
    const typedRes = res as { body?: { items?: V1PriorityLevelConfiguration[] }; items?: V1PriorityLevelConfiguration[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(priorityLevelConfigurationInfo)
  } catch (err) {
    throw new Error(`获取PriorityLevelConfiguration失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCertificateSigningRequests = async (contextId: string): Promise<CertificateSigningRequestInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCertificatesV1Api(entry)
  try {
    const res = await api.listCertificateSigningRequest()
    const typedRes = res as { body?: { items?: V1CertificateSigningRequest[] }; items?: V1CertificateSigningRequest[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(certificateSigningRequestInfo)
  } catch (err) {
    throw new Error(`获取CertificateSigningRequest失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const updateCertificateSigningRequestApproval = async (
  contextId: string,
  name: string,
  decision: CertificateSigningRequestDecision,
): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCertificatesV1Api(entry)
  const actionLabel = decision === 'approve' ? '批准' : '拒绝'

  try {
    if (decision !== 'approve' && decision !== 'deny') {
      return { success: false, message: 'CertificateSigningRequest 操作只支持 approve 或 deny' }
    }
    await api.patchCertificateSigningRequestApproval({
      name,
      body: certificateSigningRequestApprovalPatch(name, decision),
    }, strategicMergePatchOptions())
    return { success: true, message: `CertificateSigningRequest ${name} 已${actionLabel}` }
  } catch (err) {
    return {
      success: false,
      message: `${actionLabel}CertificateSigningRequest失败: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export const listClusterTrustBundles = async (contextId: string): Promise<ClusterTrustBundleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCertificatesV1beta1Api(entry)
  try {
    const res = await api.listClusterTrustBundle()
    const typedRes = res as { body?: { items?: V1beta1ClusterTrustBundle[] }; items?: V1beta1ClusterTrustBundle[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(clusterTrustBundleInfo)
  } catch (err) {
    throw new Error(`获取ClusterTrustBundle失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPodCertificateRequests = async (
  contextId: string,
  namespace?: string,
): Promise<PodCertificateRequestInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCertificatesV1alpha1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPodCertificateRequest({ namespace })
    } else {
      res = await api.listPodCertificateRequestForAllNamespaces()
    }
    const typedRes = res as {
      body?: { items?: V1alpha1PodCertificateRequest[] }
      items?: V1alpha1PodCertificateRequest[]
    }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(podCertificateRequestInfo)
  } catch (err) {
    throw new Error(`获取PodCertificateRequest失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStorageVersions = async (contextId: string): Promise<StorageVersionInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createInternalApiserverV1alpha1Api(entry)
  try {
    const res = await api.listStorageVersion()
    const typedRes = res as { body?: { items?: V1alpha1StorageVersion[] }; items?: V1alpha1StorageVersion[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(storageVersionInfo)
  } catch (err) {
    throw new Error(`获取StorageVersion失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStorageVersionMigrations = async (contextId: string): Promise<StorageVersionMigrationInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStoragemigrationV1alpha1Api(entry)
  try {
    const res = await api.listStorageVersionMigration()
    const typedRes = res as { body?: { items?: V1alpha1StorageVersionMigration[] }; items?: V1alpha1StorageVersionMigration[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(storageVersionMigrationInfo)
  } catch (err) {
    throw new Error(`获取StorageVersionMigration失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPodDisruptionBudgets = async (contextId: string, namespace?: string): Promise<PodDisruptionBudgetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createPolicyV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPodDisruptionBudget({ namespace })
    } else {
      res = await api.listPodDisruptionBudgetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1PodDisruptionBudget[] }; items?: V1PodDisruptionBudget[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pdb) => ({
      name: pdb.metadata?.name ?? '',
      namespace: pdb.metadata?.namespace ?? '',
      minAvailable: formatOptionalValue(pdb.spec?.minAvailable),
      maxUnavailable: formatOptionalValue(pdb.spec?.maxUnavailable),
      allowedDisruptions: pdb.status?.disruptionsAllowed ?? 0,
      currentHealthy: pdb.status?.currentHealthy ?? 0,
      desiredHealthy: pdb.status?.desiredHealthy ?? 0,
      expectedPods: pdb.status?.expectedPods ?? 0,
      age: formatAge(pdb.metadata?.creationTimestamp),
      labels: pdb.metadata?.labels,
      selector: pdb.spec?.selector?.matchLabels,
      unhealthyPodEvictionPolicy: pdb.spec?.unhealthyPodEvictionPolicy,
      observedGeneration: pdb.status?.observedGeneration,
      disruptedPods: formatQuotaValues(pdb.status?.disruptedPods as Record<string, unknown> | undefined),
      conditionDetails: podDisruptionBudgetConditionDetails(
        pdb.status?.conditions as PodDisruptionBudgetConditionLike[] | undefined,
      ),
    }))
  } catch (err) {
    throw new Error(`获取PodDisruptionBudget失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listResourceQuotas = async (contextId: string, namespace?: string): Promise<ResourceQuotaInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedResourceQuota({ namespace })
    } else {
      res = await api.listResourceQuotaForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ResourceQuota[] }; items?: V1ResourceQuota[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((quota) => {
      const hard = (quota.status?.hard ?? quota.spec?.hard) as Record<string, unknown> | undefined
      const used = quota.status?.used as Record<string, unknown> | undefined
      const scopeSelector = quota.spec?.scopeSelector as ResourceQuotaScopeSelectorLike | undefined
      return {
        name: quota.metadata?.name ?? '',
        namespace: quota.metadata?.namespace ?? '',
        hard: formatQuotaValues(hard),
        used: formatQuotaValues(used),
        scopes: quota.spec?.scopes?.join(', ') || '-',
        age: formatAge(quota.metadata?.creationTimestamp),
        labels: quota.metadata?.labels,
        quotaDetails: resourceQuotaUsageDetails(hard, used),
        scopeSelector: formatResourceQuotaScopeSelector(scopeSelector),
        scopeSelectorDetails: resourceQuotaScopeSelectorDetails(scopeSelector),
      }
    })
  } catch (err) {
    throw new Error(`获取ResourceQuota失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listLimitRanges = async (contextId: string, namespace?: string): Promise<LimitRangeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedLimitRange({ namespace })
    } else {
      res = await api.listLimitRangeForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1LimitRange[] }; items?: V1LimitRange[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((limitRange) => {
      const limits = (limitRange.spec?.limits ?? []) as LimitRangeLimitLike[]
      return {
        name: limitRange.metadata?.name ?? '',
        namespace: limitRange.metadata?.namespace ?? '',
        types: limits.map((limit) => limit.type).filter(Boolean).join(', ') || '-',
        min: formatLimitRangeValues(limits, 'min'),
        max: formatLimitRangeValues(limits, 'max'),
        default: formatLimitRangeValues(limits, 'default'),
        defaultRequest: formatLimitRangeValues(limits, 'defaultRequest'),
        maxLimitRequestRatio: formatLimitRangeValues(limits, 'maxLimitRequestRatio'),
        age: formatAge(limitRange.metadata?.creationTimestamp),
        labels: limitRange.metadata?.labels,
        limitDetails: limitRangeItemDetails(limits),
      }
    })
  } catch (err) {
    throw new Error(`获取LimitRange失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPriorityClasses = async (contextId: string): Promise<PriorityClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createSchedulingV1Api(entry)
  try {
    const res = await api.listPriorityClass()
    const typedRes = res as { body?: { items?: V1PriorityClass[] }; items?: V1PriorityClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(priorityClassInfo)
  } catch (err) {
    throw new Error(`获取PriorityClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listRuntimeClasses = async (contextId: string): Promise<RuntimeClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNodeV1Api(entry)
  try {
    const res = await api.listRuntimeClass()
    const typedRes = res as { body?: { items?: V1RuntimeClass[] }; items?: V1RuntimeClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(runtimeClassInfo)
  } catch (err) {
    throw new Error(`获取RuntimeClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listLeases = async (contextId: string, namespace?: string): Promise<LeaseInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoordinationV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedLease({ namespace })
    } else {
      res = await api.listLeaseForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Lease[] }; items?: V1Lease[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(leaseInfo)
  } catch (err) {
    throw new Error(`获取Lease失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listLeaseCandidates = async (contextId: string, namespace?: string): Promise<LeaseCandidateInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoordinationV1beta1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedLeaseCandidate({ namespace })
    } else {
      res = await api.listLeaseCandidateForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1beta1LeaseCandidate[] }; items?: V1beta1LeaseCandidate[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(leaseCandidateInfo)
  } catch (err) {
    throw new Error(`获取LeaseCandidate失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// Create operations
export const createNamespace = async (contextId: string, name: string): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const namespace: V1Namespace = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name }
    }
    await api.createNamespace({ body: namespace })
    return { success: true, name, message: `Namespace ${name} created successfully` }
  } catch (err) {
    return { success: false, message: `创建Namespace失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createDeployment = async (contextId: string, data: DeploymentFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)

  const labels: Record<string, string> = {}
  data.labels.forEach(l => {
    if (l.key) labels[l.key] = l.value
  })

  const env: Array<{ name: string; value: string }> = []
  data.env.forEach(e => {
    if (e.key) env.push({ name: e.key, value: e.value })
  })

  const deployment: V1Deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: data.name,
      namespace: data.namespace,
      labels
    },
    spec: {
      replicas: data.replicas,
      selector: {
        matchLabels: labels
      },
      template: {
        metadata: {
          labels
        },
        spec: {
          containers: [{
            name: data.name,
            image: data.image,
            ports: [{
              containerPort: data.targetPort,
              protocol: data.protocol as 'TCP' | 'UDP'
            }],
            env
          }]
        }
      }
    }
  }

  try {
    await api.createNamespacedDeployment({ namespace: data.namespace, body: deployment })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createService = async (contextId: string, data: ServiceFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const selector: Record<string, string> = {}
  data.selector.forEach(s => {
    if (s.key) selector[s.key] = s.value
  })

  const service: V1Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    spec: {
      type: data.type,
      selector,
      ports: [{
        port: data.port,
        targetPort: data.targetPort,
        protocol: data.protocol as 'TCP' | 'UDP'
      }]
    }
  }

  try {
    await api.createNamespacedService({ namespace: data.namespace, body: service })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Service失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createConfigMap = async (contextId: string, data: ConfigMapFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const cmData: Record<string, string> = {}
  data.data.forEach(d => {
    if (d.key) cmData[d.key] = d.value
  })

  const configMap: V1ConfigMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    data: cmData
  }

  try {
    await api.createNamespacedConfigMap({ namespace: data.namespace, body: configMap })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建ConfigMap失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createSecret = async (contextId: string, data: SecretFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const stringData: Record<string, string> = {}
  data.data.forEach(d => {
    if (d.key) stringData[d.key] = d.value
  })

  const secret: V1Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    type: data.type,
    stringData
  }

  try {
    await api.createNamespacedSecret({ namespace: data.namespace, body: secret })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Secret失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createIngress = async (contextId: string, data: IngressFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)

  const ingress: V1Ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: data.name,
      namespace: data.namespace,
      annotations: data.ingressClass ? { 'kubernetes.io/ingress.class': data.ingressClass } : undefined
    },
    spec: {
      ingressClassName: data.ingressClass,
      rules: [{
        host: data.host,
        http: {
          paths: [{
            path: '/',
            pathType: 'Prefix',
            backend: {
              service: {
                name: data.serviceName,
                port: { number: data.servicePort }
              }
            }
          }]
        }
      }],
      tls: data.tls ? [{ hosts: [data.host], secretName: data.tlsSecret }] : undefined
    }
  }

  try {
    await api.createNamespacedIngress({ namespace: data.namespace, body: ingress })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Ingress失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Update operations
export const updateDeployment = async (
  contextId: string,
  namespace: string,
  name: string,
  data: Partial<DeploymentFormData>
): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)

  try {
    const existing = await api.readNamespacedDeployment({ name, namespace })
    const deploy = extractResponse<V1Deployment>(existing)
    if (!deploy) {
      return { success: false, message: 'Deployment不存在' }
    }

    const patchBody: Record<string, unknown> = {}

    if (data.replicas !== undefined) {
      patchBody.spec = { ...deploy.spec, replicas: data.replicas }
    }

    if (data.image !== undefined) {
      const containers = deploy.spec?.template?.spec?.containers ?? []
      if (containers.length > 0) {
        containers[0].image = data.image
        patchBody.spec = {
          ...deploy.spec,
          template: {
            ...deploy.spec?.template,
            spec: {
              ...deploy.spec?.template?.spec,
              containers
            }
          }
        }
      }
    }

    await api.patchNamespacedDeployment({ name, namespace, body: patchBody }, strategicMergePatchOptions())
    return { success: true }
  } catch (err) {
    return { success: false, message: `更新Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

const applyKnownResource = async (
  entry: ContextEntry,
  manifest: KubernetesManifest,
) => {
  const kind = typeof manifest.kind === 'string' ? manifest.kind : ''
  const apiVersion = typeof manifest.apiVersion === 'string' ? manifest.apiVersion : ''
  const metadata = manifestMetadata(manifest)
  const resourceName = typeof metadata.name === 'string' ? metadata.name : ''

  if (!kind || !apiVersion || !resourceName) {
    throw new Error('YAML 缺少 apiVersion、kind 或 metadata.name')
  }

  const namespace = typeof metadata.namespace === 'string' && metadata.namespace
    ? metadata.namespace
    : 'default'
  const patchOptionsForResource = strategicMergePatchOptions()

  switch (kind) {
    case 'Namespace': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespace({ name: resourceName, body: manifest as unknown as V1Namespace }, patchOptionsForResource),
        () => api.createNamespace({ body: manifest as unknown as V1Namespace }),
      )
      return
    }
    case 'Node': {
      const api = createCoreV1Api(entry)
      await api.patchNode({ name: resourceName, body: manifest as unknown as V1Node }, patchOptionsForResource)
      return
    }
    case 'Pod': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedPod({ name: resourceName, namespace, body: manifest as unknown as V1Pod }, patchOptionsForResource),
        () => api.createNamespacedPod({ namespace, body: manifest as unknown as V1Pod }),
      )
      return
    }
    case 'Deployment': {
      const api = createAppsV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedDeployment({ name: resourceName, namespace, body: manifest as unknown as V1Deployment }, patchOptionsForResource),
        () => api.createNamespacedDeployment({ namespace, body: manifest as unknown as V1Deployment }),
      )
      return
    }
    case 'DaemonSet': {
      const api = createAppsV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedDaemonSet({ name: resourceName, namespace, body: manifest as unknown as V1DaemonSet }, patchOptionsForResource),
        () => api.createNamespacedDaemonSet({ namespace, body: manifest as unknown as V1DaemonSet }),
      )
      return
    }
    case 'StatefulSet': {
      const api = createAppsV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedStatefulSet({ name: resourceName, namespace, body: manifest as unknown as V1StatefulSet }, patchOptionsForResource),
        () => api.createNamespacedStatefulSet({ namespace, body: manifest as unknown as V1StatefulSet }),
      )
      return
    }
    case 'ReplicaSet': {
      const api = createAppsV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedReplicaSet({ name: resourceName, namespace, body: manifest as unknown as V1ReplicaSet }, patchOptionsForResource),
        () => api.createNamespacedReplicaSet({ namespace, body: manifest as unknown as V1ReplicaSet }),
      )
      return
    }
    case 'ReplicationController': {
      if (apiVersion !== 'v1') {
        throw new Error('暂只支持 v1 ReplicationController')
      }
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedReplicationController({ name: resourceName, namespace, body: manifest as unknown as V1ReplicationController }, patchOptionsForResource),
        () => api.createNamespacedReplicationController({ namespace, body: manifest as unknown as V1ReplicationController }),
      )
      return
    }
    case 'ControllerRevision': {
      if (apiVersion !== 'apps/v1') {
        throw new Error('暂只支持 apps/v1 ControllerRevision')
      }
      const api = createAppsV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedControllerRevision({ name: resourceName, namespace, body: manifest as unknown as V1ControllerRevision }, patchOptionsForResource),
        () => api.createNamespacedControllerRevision({ namespace, body: manifest as unknown as V1ControllerRevision }),
      )
      return
    }
    case 'PodTemplate': {
      if (apiVersion !== 'v1') {
        throw new Error('暂只支持 v1 PodTemplate')
      }
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedPodTemplate({ name: resourceName, namespace, body: manifest as unknown as V1PodTemplate }, patchOptionsForResource),
        () => api.createNamespacedPodTemplate({ namespace, body: manifest as unknown as V1PodTemplate }),
      )
      return
    }
    case 'Job': {
      const api = createBatchV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedJob({ name: resourceName, namespace, body: manifest as unknown as V1Job }, patchOptionsForResource),
        () => api.createNamespacedJob({ namespace, body: manifest as unknown as V1Job }),
      )
      return
    }
    case 'CronJob': {
      const api = createBatchV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedCronJob({ name: resourceName, namespace, body: manifest as unknown as V1CronJob }, patchOptionsForResource),
        () => api.createNamespacedCronJob({ namespace, body: manifest as unknown as V1CronJob }),
      )
      return
    }
    case 'Service': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedService({ name: resourceName, namespace, body: manifest as unknown as V1Service }, patchOptionsForResource),
        () => api.createNamespacedService({ namespace, body: manifest as unknown as V1Service }),
      )
      return
    }
    case 'ConfigMap': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedConfigMap({ name: resourceName, namespace, body: manifest as unknown as V1ConfigMap }, patchOptionsForResource),
        () => api.createNamespacedConfigMap({ namespace, body: manifest as unknown as V1ConfigMap }),
      )
      return
    }
    case 'Secret': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedSecret({ name: resourceName, namespace, body: manifest as unknown as V1Secret }, patchOptionsForResource),
        () => api.createNamespacedSecret({ namespace, body: manifest as unknown as V1Secret }),
      )
      return
    }
    case 'Endpoints': {
      if (apiVersion !== 'v1') {
        throw new Error('暂只支持 v1 Endpoints')
      }
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedEndpoints({ name: resourceName, namespace, body: manifest as unknown as V1Endpoints }, patchOptionsForResource),
        () => api.createNamespacedEndpoints({ namespace, body: manifest as unknown as V1Endpoints }),
      )
      return
    }
    case 'Event': {
      if (apiVersion === 'events.k8s.io/v1') {
        const api = createEventsV1Api(entry)
        await patchOrCreate(
          () => api.patchNamespacedEvent({ name: resourceName, namespace, body: manifest as unknown as EventsV1Event }, patchOptionsForResource),
          () => api.createNamespacedEvent({ namespace, body: manifest as unknown as EventsV1Event }),
        )
        return
      }
      if (apiVersion === 'v1') {
        const api = createCoreV1Api(entry)
        await patchOrCreate(
          () => api.patchNamespacedEvent({ name: resourceName, namespace, body: manifest as unknown as CoreV1Event }, patchOptionsForResource),
          () => api.createNamespacedEvent({ namespace, body: manifest as unknown as CoreV1Event }),
        )
        return
      }
      throw new Error('暂只支持 events.k8s.io/v1 或 v1 Event')
    }
    case 'Ingress': {
      const api = createNetworkingV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedIngress({ name: resourceName, namespace, body: manifest as unknown as V1Ingress }, patchOptionsForResource),
        () => api.createNamespacedIngress({ namespace, body: manifest as unknown as V1Ingress }),
      )
      return
    }
    case 'IngressClass': {
      if (apiVersion !== 'networking.k8s.io/v1') {
        throw new Error('暂只支持 networking.k8s.io/v1 IngressClass')
      }
      const api = createNetworkingV1Api(entry)
      await patchOrCreate(
        () => api.patchIngressClass({ name: resourceName, body: manifest as unknown as V1IngressClass }, patchOptionsForResource),
        () => api.createIngressClass({ body: manifest as unknown as V1IngressClass }),
      )
      return
    }
    case 'NetworkPolicy': {
      if (apiVersion !== 'networking.k8s.io/v1') {
        throw new Error('暂只支持 networking.k8s.io/v1 NetworkPolicy')
      }
      const api = createNetworkingV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedNetworkPolicy({ name: resourceName, namespace, body: manifest as unknown as V1NetworkPolicy }, patchOptionsForResource),
        () => api.createNamespacedNetworkPolicy({ namespace, body: manifest as unknown as V1NetworkPolicy }),
      )
      return
    }
    case 'IPAddress': {
      if (apiVersion !== 'networking.k8s.io/v1') {
        throw new Error('暂只支持 networking.k8s.io/v1 IPAddress')
      }
      const api = createNetworkingV1Api(entry)
      await patchOrCreate(
        () => api.patchIPAddress({ name: resourceName, body: manifest as unknown as V1IPAddress }, patchOptionsForResource),
        () => api.createIPAddress({ body: manifest as unknown as V1IPAddress }),
      )
      return
    }
    case 'ServiceCIDR': {
      if (apiVersion !== 'networking.k8s.io/v1') {
        throw new Error('暂只支持 networking.k8s.io/v1 ServiceCIDR')
      }
      const api = createNetworkingV1Api(entry)
      await patchOrCreate(
        () => api.patchServiceCIDR({ name: resourceName, body: manifest as unknown as V1ServiceCIDR }, patchOptionsForResource),
        () => api.createServiceCIDR({ body: manifest as unknown as V1ServiceCIDR }),
      )
      return
    }
    case 'EndpointSlice': {
      if (apiVersion !== 'discovery.k8s.io/v1') {
        throw new Error('暂只支持 discovery.k8s.io/v1 EndpointSlice')
      }
      const api = createDiscoveryV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedEndpointSlice({ name: resourceName, namespace, body: manifest as unknown as V1EndpointSlice }, patchOptionsForResource),
        () => api.createNamespacedEndpointSlice({ namespace, body: manifest as unknown as V1EndpointSlice }),
      )
      return
    }
    case 'APIService': {
      if (apiVersion !== 'apiregistration.k8s.io/v1') {
        throw new Error('暂只支持 apiregistration.k8s.io/v1 APIService')
      }
      const api = createApiregistrationV1Api(entry)
      await patchOrCreate(
        () => api.patchAPIService({ name: resourceName, body: manifest as unknown as V1APIService }, patchOptionsForResource),
        () => api.createAPIService({ body: manifest as unknown as V1APIService }),
      )
      return
    }
    case 'MutatingWebhookConfiguration': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1 MutatingWebhookConfiguration')
      }
      const api = createAdmissionregistrationV1Api(entry)
      await patchOrCreate(
        () => api.patchMutatingWebhookConfiguration({ name: resourceName, body: manifest as unknown as V1MutatingWebhookConfiguration }, patchOptionsForResource),
        () => api.createMutatingWebhookConfiguration({ body: manifest as unknown as V1MutatingWebhookConfiguration }),
      )
      return
    }
    case 'ValidatingWebhookConfiguration': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration')
      }
      const api = createAdmissionregistrationV1Api(entry)
      await patchOrCreate(
        () => api.patchValidatingWebhookConfiguration({ name: resourceName, body: manifest as unknown as V1ValidatingWebhookConfiguration }, patchOptionsForResource),
        () => api.createValidatingWebhookConfiguration({ body: manifest as unknown as V1ValidatingWebhookConfiguration }),
      )
      return
    }
    case 'MutatingAdmissionPolicy': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1beta1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1beta1 MutatingAdmissionPolicy')
      }
      const api = createAdmissionregistrationV1beta1Api(entry)
      await patchOrCreate(
        () => api.patchMutatingAdmissionPolicy({ name: resourceName, body: manifest as unknown as V1beta1MutatingAdmissionPolicy }, patchOptionsForResource),
        () => api.createMutatingAdmissionPolicy({ body: manifest as unknown as V1beta1MutatingAdmissionPolicy }),
      )
      return
    }
    case 'MutatingAdmissionPolicyBinding': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1beta1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1beta1 MutatingAdmissionPolicyBinding')
      }
      const api = createAdmissionregistrationV1beta1Api(entry)
      await patchOrCreate(
        () => api.patchMutatingAdmissionPolicyBinding({ name: resourceName, body: manifest as unknown as V1beta1MutatingAdmissionPolicyBinding }, patchOptionsForResource),
        () => api.createMutatingAdmissionPolicyBinding({ body: manifest as unknown as V1beta1MutatingAdmissionPolicyBinding }),
      )
      return
    }
    case 'ValidatingAdmissionPolicy': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1 ValidatingAdmissionPolicy')
      }
      const api = createAdmissionregistrationV1Api(entry)
      await patchOrCreate(
        () => api.patchValidatingAdmissionPolicy({ name: resourceName, body: manifest as unknown as V1ValidatingAdmissionPolicy }, patchOptionsForResource),
        () => api.createValidatingAdmissionPolicy({ body: manifest as unknown as V1ValidatingAdmissionPolicy }),
      )
      return
    }
    case 'ValidatingAdmissionPolicyBinding': {
      if (apiVersion !== 'admissionregistration.k8s.io/v1') {
        throw new Error('暂只支持 admissionregistration.k8s.io/v1 ValidatingAdmissionPolicyBinding')
      }
      const api = createAdmissionregistrationV1Api(entry)
      await patchOrCreate(
        () => api.patchValidatingAdmissionPolicyBinding({ name: resourceName, body: manifest as unknown as V1ValidatingAdmissionPolicyBinding }, patchOptionsForResource),
        () => api.createValidatingAdmissionPolicyBinding({ body: manifest as unknown as V1ValidatingAdmissionPolicyBinding }),
      )
      return
    }
    case 'FlowSchema': {
      if (apiVersion !== 'flowcontrol.apiserver.k8s.io/v1') {
        throw new Error('暂只支持 flowcontrol.apiserver.k8s.io/v1 FlowSchema')
      }
      const api = createFlowcontrolV1Api(entry)
      await patchOrCreate(
        () => api.patchFlowSchema({ name: resourceName, body: manifest as unknown as V1FlowSchema }, patchOptionsForResource),
        () => api.createFlowSchema({ body: manifest as unknown as V1FlowSchema }),
      )
      return
    }
    case 'PriorityLevelConfiguration': {
      if (apiVersion !== 'flowcontrol.apiserver.k8s.io/v1') {
        throw new Error('暂只支持 flowcontrol.apiserver.k8s.io/v1 PriorityLevelConfiguration')
      }
      const api = createFlowcontrolV1Api(entry)
      await patchOrCreate(
        () => api.patchPriorityLevelConfiguration({ name: resourceName, body: manifest as unknown as V1PriorityLevelConfiguration }, patchOptionsForResource),
        () => api.createPriorityLevelConfiguration({ body: manifest as unknown as V1PriorityLevelConfiguration }),
      )
      return
    }
    case 'CertificateSigningRequest': {
      if (apiVersion !== 'certificates.k8s.io/v1') {
        throw new Error('暂只支持 certificates.k8s.io/v1 CertificateSigningRequest')
      }
      const api = createCertificatesV1Api(entry)
      await patchOrCreate(
        () => api.patchCertificateSigningRequest({ name: resourceName, body: manifest as unknown as V1CertificateSigningRequest }, patchOptionsForResource),
        () => api.createCertificateSigningRequest({ body: manifest as unknown as V1CertificateSigningRequest }),
      )
      return
    }
    case 'ClusterTrustBundle': {
      if (apiVersion !== 'certificates.k8s.io/v1beta1') {
        throw new Error('暂只支持 certificates.k8s.io/v1beta1 ClusterTrustBundle')
      }
      const api = createCertificatesV1beta1Api(entry)
      await patchOrCreate(
        () => api.patchClusterTrustBundle({ name: resourceName, body: manifest as unknown as V1beta1ClusterTrustBundle }, patchOptionsForResource),
        () => api.createClusterTrustBundle({ body: manifest as unknown as V1beta1ClusterTrustBundle }),
      )
      return
    }
    case 'PodCertificateRequest': {
      if (apiVersion !== 'certificates.k8s.io/v1alpha1') {
        throw new Error('暂只支持 certificates.k8s.io/v1alpha1 PodCertificateRequest')
      }
      const api = createCertificatesV1alpha1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedPodCertificateRequest({
          name: resourceName,
          namespace,
          body: manifest as unknown as V1alpha1PodCertificateRequest,
        }, patchOptionsForResource),
        () => api.createNamespacedPodCertificateRequest({
          namespace,
          body: manifest as unknown as V1alpha1PodCertificateRequest,
        }),
      )
      return
    }
    case 'StorageVersion': {
      if (apiVersion !== 'internal.apiserver.k8s.io/v1alpha1') {
        throw new Error('暂只支持 internal.apiserver.k8s.io/v1alpha1 StorageVersion')
      }
      const api = createInternalApiserverV1alpha1Api(entry)
      await patchOrCreate(
        () => api.patchStorageVersion({ name: resourceName, body: manifest as unknown as V1alpha1StorageVersion }, patchOptionsForResource),
        () => api.createStorageVersion({ body: manifest as unknown as V1alpha1StorageVersion }),
      )
      return
    }
    case 'StorageVersionMigration': {
      if (apiVersion !== 'storagemigration.k8s.io/v1alpha1') {
        throw new Error('暂只支持 storagemigration.k8s.io/v1alpha1 StorageVersionMigration')
      }
      const api = createStoragemigrationV1alpha1Api(entry)
      await patchOrCreate(
        () => api.patchStorageVersionMigration({ name: resourceName, body: manifest as unknown as V1alpha1StorageVersionMigration }, patchOptionsForResource),
        () => api.createStorageVersionMigration({ body: manifest as unknown as V1alpha1StorageVersionMigration }),
      )
      return
    }
    case 'DeviceClass': {
      if (apiVersion !== 'resource.k8s.io/v1') {
        throw new Error('暂只支持 resource.k8s.io/v1 DeviceClass')
      }
      const api = createResourceV1Api(entry)
      await patchOrCreate(
        () => api.patchDeviceClass({ name: resourceName, body: manifest as unknown as V1DeviceClass }, patchOptionsForResource),
        () => api.createDeviceClass({ body: manifest as unknown as V1DeviceClass }),
      )
      return
    }
    case 'ResourceClaim': {
      if (apiVersion !== 'resource.k8s.io/v1') {
        throw new Error('暂只支持 resource.k8s.io/v1 ResourceClaim')
      }
      const api = createResourceV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedResourceClaim({
          name: resourceName,
          namespace,
          body: manifest as unknown as ResourceV1ResourceClaim,
        }, patchOptionsForResource),
        () => api.createNamespacedResourceClaim({
          namespace,
          body: manifest as unknown as ResourceV1ResourceClaim,
        }),
      )
      return
    }
    case 'ResourceClaimTemplate': {
      if (apiVersion !== 'resource.k8s.io/v1') {
        throw new Error('暂只支持 resource.k8s.io/v1 ResourceClaimTemplate')
      }
      const api = createResourceV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedResourceClaimTemplate({
          name: resourceName,
          namespace,
          body: manifest as unknown as V1ResourceClaimTemplate,
        }, patchOptionsForResource),
        () => api.createNamespacedResourceClaimTemplate({
          namespace,
          body: manifest as unknown as V1ResourceClaimTemplate,
        }),
      )
      return
    }
    case 'ResourceSlice': {
      if (apiVersion !== 'resource.k8s.io/v1') {
        throw new Error('暂只支持 resource.k8s.io/v1 ResourceSlice')
      }
      const api = createResourceV1Api(entry)
      await patchOrCreate(
        () => api.patchResourceSlice({ name: resourceName, body: manifest as unknown as V1ResourceSlice }, patchOptionsForResource),
        () => api.createResourceSlice({ body: manifest as unknown as V1ResourceSlice }),
      )
      return
    }
    case 'DeviceTaintRule': {
      if (apiVersion !== 'resource.k8s.io/v1alpha3') {
        throw new Error('暂只支持 resource.k8s.io/v1alpha3 DeviceTaintRule')
      }
      const api = createResourceV1alpha3Api(entry)
      await patchOrCreate(
        () => api.patchDeviceTaintRule({ name: resourceName, body: manifest as unknown as V1alpha3DeviceTaintRule }, patchOptionsForResource),
        () => api.createDeviceTaintRule({ body: manifest as unknown as V1alpha3DeviceTaintRule }),
      )
      return
    }
    case 'PodDisruptionBudget': {
      if (apiVersion !== 'policy/v1') {
        throw new Error('暂只支持 policy/v1 PodDisruptionBudget')
      }
      const api = createPolicyV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedPodDisruptionBudget({ name: resourceName, namespace, body: manifest as unknown as V1PodDisruptionBudget }, patchOptionsForResource),
        () => api.createNamespacedPodDisruptionBudget({ namespace, body: manifest as unknown as V1PodDisruptionBudget }),
      )
      return
    }
    case 'ResourceQuota': {
      if (apiVersion !== 'v1') {
        throw new Error('暂只支持 v1 ResourceQuota')
      }
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedResourceQuota({ name: resourceName, namespace, body: manifest as unknown as V1ResourceQuota }, patchOptionsForResource),
        () => api.createNamespacedResourceQuota({ namespace, body: manifest as unknown as V1ResourceQuota }),
      )
      return
    }
    case 'LimitRange': {
      if (apiVersion !== 'v1') {
        throw new Error('暂只支持 v1 LimitRange')
      }
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedLimitRange({ name: resourceName, namespace, body: manifest as unknown as V1LimitRange }, patchOptionsForResource),
        () => api.createNamespacedLimitRange({ namespace, body: manifest as unknown as V1LimitRange }),
      )
      return
    }
    case 'PriorityClass': {
      if (apiVersion !== 'scheduling.k8s.io/v1') {
        throw new Error('暂只支持 scheduling.k8s.io/v1 PriorityClass')
      }
      const api = createSchedulingV1Api(entry)
      await patchOrCreate(
        () => api.patchPriorityClass({ name: resourceName, body: manifest as unknown as V1PriorityClass }, patchOptionsForResource),
        () => api.createPriorityClass({ body: manifest as unknown as V1PriorityClass }),
      )
      return
    }
    case 'RuntimeClass': {
      if (apiVersion !== 'node.k8s.io/v1') {
        throw new Error('暂只支持 node.k8s.io/v1 RuntimeClass')
      }
      const api = createNodeV1Api(entry)
      await patchOrCreate(
        () => api.patchRuntimeClass({ name: resourceName, body: manifest as unknown as V1RuntimeClass }, patchOptionsForResource),
        () => api.createRuntimeClass({ body: manifest as unknown as V1RuntimeClass }),
      )
      return
    }
    case 'Lease': {
      if (apiVersion !== 'coordination.k8s.io/v1') {
        throw new Error('暂只支持 coordination.k8s.io/v1 Lease')
      }
      const api = createCoordinationV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedLease({ name: resourceName, namespace, body: manifest as unknown as V1Lease }, patchOptionsForResource),
        () => api.createNamespacedLease({ namespace, body: manifest as unknown as V1Lease }),
      )
      return
    }
    case 'LeaseCandidate': {
      if (apiVersion !== 'coordination.k8s.io/v1beta1') {
        throw new Error('暂只支持 coordination.k8s.io/v1beta1 LeaseCandidate')
      }
      const api = createCoordinationV1beta1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedLeaseCandidate({ name: resourceName, namespace, body: manifest as unknown as V1beta1LeaseCandidate }, patchOptionsForResource),
        () => api.createNamespacedLeaseCandidate({ namespace, body: manifest as unknown as V1beta1LeaseCandidate }),
      )
      return
    }
    case 'PersistentVolumeClaim': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedPersistentVolumeClaim({ name: resourceName, namespace, body: manifest as unknown as V1PersistentVolumeClaim }, patchOptionsForResource),
        () => api.createNamespacedPersistentVolumeClaim({ namespace, body: manifest as unknown as V1PersistentVolumeClaim }),
      )
      return
    }
    case 'PersistentVolume': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchPersistentVolume({ name: resourceName, body: manifest as unknown as V1PersistentVolume }, patchOptionsForResource),
        () => api.createPersistentVolume({ body: manifest as unknown as V1PersistentVolume }),
      )
      return
    }
    case 'StorageClass': {
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchStorageClass({ name: resourceName, body: manifest as unknown as V1StorageClass }, patchOptionsForResource),
        () => api.createStorageClass({ body: manifest as unknown as V1StorageClass }),
      )
      return
    }
    case 'VolumeAttributesClass': {
      if (apiVersion !== 'storage.k8s.io/v1') {
        throw new Error('暂只支持 storage.k8s.io/v1 VolumeAttributesClass')
      }
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchVolumeAttributesClass({ name: resourceName, body: manifest as unknown as V1VolumeAttributesClass }, patchOptionsForResource),
        () => api.createVolumeAttributesClass({ body: manifest as unknown as V1VolumeAttributesClass }),
      )
      return
    }
    case 'CSIDriver': {
      if (apiVersion !== 'storage.k8s.io/v1') {
        throw new Error('暂只支持 storage.k8s.io/v1 CSIDriver')
      }
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchCSIDriver({ name: resourceName, body: manifest as unknown as V1CSIDriver }, patchOptionsForResource),
        () => api.createCSIDriver({ body: manifest as unknown as V1CSIDriver }),
      )
      return
    }
    case 'CSINode': {
      if (apiVersion !== 'storage.k8s.io/v1') {
        throw new Error('暂只支持 storage.k8s.io/v1 CSINode')
      }
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchCSINode({ name: resourceName, body: manifest as unknown as V1CSINode }, patchOptionsForResource),
        () => api.createCSINode({ body: manifest as unknown as V1CSINode }),
      )
      return
    }
    case 'VolumeAttachment': {
      if (apiVersion !== 'storage.k8s.io/v1') {
        throw new Error('暂只支持 storage.k8s.io/v1 VolumeAttachment')
      }
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchVolumeAttachment({ name: resourceName, body: manifest as unknown as V1VolumeAttachment }, patchOptionsForResource),
        () => api.createVolumeAttachment({ body: manifest as unknown as V1VolumeAttachment }),
      )
      return
    }
    case 'CSIStorageCapacity': {
      if (apiVersion !== 'storage.k8s.io/v1') {
        throw new Error('暂只支持 storage.k8s.io/v1 CSIStorageCapacity')
      }
      const api = createStorageV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedCSIStorageCapacity({ name: resourceName, namespace, body: manifest as unknown as V1CSIStorageCapacity }, patchOptionsForResource),
        () => api.createNamespacedCSIStorageCapacity({ namespace, body: manifest as unknown as V1CSIStorageCapacity }),
      )
      return
    }
    case 'VolumeSnapshotClass': {
      if (apiVersion !== `${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION}`) {
        throw new Error(`暂只支持 ${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION} VolumeSnapshotClass`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        plural: VOLUME_SNAPSHOT_CLASSES_PLURAL,
        scope: 'Cluster',
      })
      return
    }
    case 'VolumeSnapshot': {
      if (apiVersion !== `${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION}`) {
        throw new Error(`暂只支持 ${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION} VolumeSnapshot`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        plural: VOLUME_SNAPSHOTS_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'VolumeSnapshotContent': {
      if (apiVersion !== `${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION}`) {
        throw new Error(`暂只支持 ${SNAPSHOT_GROUP}/${SNAPSHOT_VERSION} VolumeSnapshotContent`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        plural: VOLUME_SNAPSHOT_CONTENTS_PLURAL,
        scope: 'Cluster',
      })
      return
    }
    case 'GatewayClass': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} GatewayClass`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: GATEWAY_CLASSES_PLURAL,
        scope: 'Cluster',
      })
      return
    }
    case 'Gateway': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} Gateway`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: GATEWAYS_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'HTTPRoute': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} HTTPRoute`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: HTTP_ROUTES_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'GRPCRoute': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} GRPCRoute`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: GRPC_ROUTES_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'TLSRoute': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} TLSRoute`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: TLS_ROUTES_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'TCPRoute': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_ALPHA_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_ALPHA_VERSION} TCPRoute`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_ALPHA_VERSION,
        plural: TCP_ROUTES_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'UDPRoute': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_ALPHA_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_ALPHA_VERSION} UDPRoute`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_ALPHA_VERSION,
        plural: UDP_ROUTES_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'ReferenceGrant': {
      if (apiVersion !== `${GATEWAY_GROUP}/${GATEWAY_VERSION}`) {
        throw new Error(`暂只支持 ${GATEWAY_GROUP}/${GATEWAY_VERSION} ReferenceGrant`)
      }
      await applyCustomResourceWithDescriptor(entry, manifest, namespace, {
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: REFERENCE_GRANTS_PLURAL,
        scope: 'Namespaced',
      })
      return
    }
    case 'CustomResourceDefinition': {
      const api = createApiextensionsV1Api(entry)
      await patchOrCreate(
        () => api.patchCustomResourceDefinition({ name: resourceName, body: manifest as unknown as V1CustomResourceDefinition }, patchOptionsForResource),
        () => api.createCustomResourceDefinition({ body: manifest as unknown as V1CustomResourceDefinition }),
      )
      return
    }
    case 'ServiceAccount': {
      const api = createCoreV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedServiceAccount({ name: resourceName, namespace, body: manifest as unknown as V1ServiceAccount }, patchOptionsForResource),
        () => api.createNamespacedServiceAccount({ namespace, body: manifest as unknown as V1ServiceAccount }),
      )
      return
    }
    case 'Role': {
      const api = createRbacV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedRole({ name: resourceName, namespace, body: manifest as unknown as V1Role }, patchOptionsForResource),
        () => api.createNamespacedRole({ namespace, body: manifest as unknown as V1Role }),
      )
      return
    }
    case 'RoleBinding': {
      const api = createRbacV1Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedRoleBinding({ name: resourceName, namespace, body: manifest as unknown as V1RoleBinding }, patchOptionsForResource),
        () => api.createNamespacedRoleBinding({ namespace, body: manifest as unknown as V1RoleBinding }),
      )
      return
    }
    case 'ClusterRole': {
      const api = createRbacV1Api(entry)
      await patchOrCreate(
        () => api.patchClusterRole({ name: resourceName, body: manifest as unknown as V1ClusterRole }, patchOptionsForResource),
        () => api.createClusterRole({ body: manifest as unknown as V1ClusterRole }),
      )
      return
    }
    case 'ClusterRoleBinding': {
      const api = createRbacV1Api(entry)
      await patchOrCreate(
        () => api.patchClusterRoleBinding({ name: resourceName, body: manifest as unknown as V1ClusterRoleBinding }, patchOptionsForResource),
        () => api.createClusterRoleBinding({ body: manifest as unknown as V1ClusterRoleBinding }),
      )
      return
    }
    case 'HorizontalPodAutoscaler': {
      if (apiVersion !== 'autoscaling/v2') {
        throw new Error('暂只支持 autoscaling/v2 HorizontalPodAutoscaler')
      }
      const api = createAutoscalingV2Api(entry)
      await patchOrCreate(
        () => api.patchNamespacedHorizontalPodAutoscaler({ name: resourceName, namespace, body: manifest as V2HorizontalPodAutoscaler }, patchOptionsForResource),
        () => api.createNamespacedHorizontalPodAutoscaler({ namespace, body: manifest as V2HorizontalPodAutoscaler }),
      )
      return
    }
    default:
      await applyCustomResource(entry, manifest, namespace)
  }
}

type ApplyCustomResourceDescriptor = Pick<CustomResourceDescriptor, 'group' | 'version' | 'plural' | 'scope'>

const applyCustomResourceWithDescriptor = async (
  entry: ContextEntry,
  manifest: KubernetesManifest,
  fallbackNamespace: string,
  descriptor: ApplyCustomResourceDescriptor,
) => {
  const metadata = manifestMetadata(manifest)
  const name = typeof metadata.name === 'string' ? metadata.name : ''
  if (!name) {
    throw new Error('YAML 缺少 metadata.name')
  }

  const api = createCustomObjectsApi(entry)
  const patchOptionsForResource = mergePatchOptions()

  if (descriptor.scope === 'Namespaced') {
    const namespace = typeof metadata.namespace === 'string' && metadata.namespace
      ? metadata.namespace
      : fallbackNamespace
    await patchOrCreate(
      () => api.patchNamespacedCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        namespace,
        plural: descriptor.plural,
        name,
        body: manifest,
      }, patchOptionsForResource),
      () => api.createNamespacedCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        namespace,
        plural: descriptor.plural,
        body: manifest,
      }),
    )
    return
  }

  await patchOrCreate(
    () => api.patchClusterCustomObject({
      group: descriptor.group,
      version: descriptor.version,
      plural: descriptor.plural,
      name,
      body: manifest,
    }, patchOptionsForResource),
    () => api.createClusterCustomObject({
      group: descriptor.group,
      version: descriptor.version,
      plural: descriptor.plural,
      body: manifest,
    }),
  )
}

const applyCustomResource = async (
  entry: ContextEntry,
  manifest: KubernetesManifest,
  fallbackNamespace: string,
) => {
  const descriptor = await findCustomResourceDescriptor(entry, manifest)
  if (!descriptor) {
    const kind = typeof manifest.kind === 'string' ? manifest.kind : 'Unknown'
    const apiVersion = typeof manifest.apiVersion === 'string' ? manifest.apiVersion : 'unknown'
    throw new Error(`暂不支持 Apply ${apiVersion}/${kind}`)
  }

  await applyCustomResourceWithDescriptor(entry, manifest, fallbackNamespace, descriptor)
}

// YAML apply
export const applyYaml = async (contextId: string, yaml: string): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)

  try {
    const docs = yamlLoadAll(yaml).filter((doc): doc is Record<string, unknown> => (
      Boolean(doc) && typeof doc === 'object' && !Array.isArray(doc)
    ))

    if (docs.length === 0) {
      return { success: false, message: '未找到可 Apply 的资源' }
    }

    const failures: string[] = []
    for (const parsed of docs) {
      try {
        await applyKnownResource(entry, parsed)
      } catch (err) {
        const kind = typeof parsed.kind === 'string' ? parsed.kind : 'Unknown'
        const metadata = manifestMetadata(parsed)
        const resourceName = typeof metadata.name === 'string' ? metadata.name : 'unknown'
        failures.push(`${kind}/${resourceName}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (failures.length > 0) {
      return { success: false, message: `Apply失败: ${failures.slice(0, 5).join('; ')}` }
    }

    return { success: true, message: `Applied ${docs.length} resource(s) successfully` }
  } catch (err) {
    return { success: false, message: `Apply失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Get resource YAML
export const getResourceYaml = async (
  contextId: string,
  kind: string,
  namespace: string,
  name: string
): Promise<string> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const stringifyResource = (resource: unknown) => {
    if (resource === undefined) {
      throw new Error(`Resource ${kind}/${name} not found`)
    }
    return JSON.stringify(resource, null, 2)
  }

  try {
    const coordinationApi = createCoordinationV1Api(entry)
    const coordinationBetaApi = createCoordinationV1beta1Api(entry)
    const coreApi = createCoreV1Api(entry)
    const apiextensionsApi = createApiextensionsV1Api(entry)
    const appsApi = createAppsV1Api(entry)
    const batchApi = createBatchV1Api(entry)
    const networkingApi = createNetworkingV1Api(entry)
    const nodeApi = createNodeV1Api(entry)
    const policyApi = createPolicyV1Api(entry)
    const discoveryApi = createDiscoveryV1Api(entry)
    const eventsApi = createEventsV1Api(entry)
    const admissionApi = createAdmissionregistrationV1Api(entry)
    const admissionBetaApi = createAdmissionregistrationV1beta1Api(entry)
    const apiregistrationApi = createApiregistrationV1Api(entry)
    const certificatesApi = createCertificatesV1Api(entry)
    const certificatesAlphaApi = createCertificatesV1alpha1Api(entry)
    const certificatesBetaApi = createCertificatesV1beta1Api(entry)
    const storageApi = createStorageV1Api(entry)
    const internalApiserverApi = createInternalApiserverV1alpha1Api(entry)
    const storagemigrationApi = createStoragemigrationV1alpha1Api(entry)
    const resourceAlphaApi = createResourceV1alpha3Api(entry)
    const rbacApi = createRbacV1Api(entry)
    const schedulingApi = createSchedulingV1Api(entry)
    const autoscalingApi = createAutoscalingV2Api(entry)
    const flowcontrolApi = createFlowcontrolV1Api(entry)
    const customObjectsApi = createCustomObjectsApi(entry)

    if (kind === 'ComponentStatus') {
      return stringifyResource(extractResponse<V1ComponentStatus>(await coreApi.readComponentStatus({ name })))
    }
    if (kind === 'Pod') {
      return stringifyResource(extractResponse<V1Pod>(await coreApi.readNamespacedPod({ name, namespace })))
    }
    if (kind === 'Deployment') {
      return stringifyResource(extractResponse<V1Deployment>(await appsApi.readNamespacedDeployment({ name, namespace })))
    }
    if (kind === 'DaemonSet') {
      return stringifyResource(extractResponse<V1DaemonSet>(await appsApi.readNamespacedDaemonSet({ name, namespace })))
    }
    if (kind === 'StatefulSet') {
      return stringifyResource(extractResponse<V1StatefulSet>(await appsApi.readNamespacedStatefulSet({ name, namespace })))
    }
    if (kind === 'ReplicaSet') {
      return stringifyResource(extractResponse<V1ReplicaSet>(await appsApi.readNamespacedReplicaSet({ name, namespace })))
    }
    if (kind === 'ReplicationController') {
      return stringifyResource(extractResponse<V1ReplicationController>(await coreApi.readNamespacedReplicationController({ name, namespace })))
    }
    if (kind === 'ControllerRevision') {
      return stringifyResource(extractResponse<V1ControllerRevision>(await appsApi.readNamespacedControllerRevision({ name, namespace })))
    }
    if (kind === 'PodTemplate') {
      return stringifyResource(extractResponse<V1PodTemplate>(await coreApi.readNamespacedPodTemplate({ name, namespace })))
    }
    if (kind === 'Job') {
      return stringifyResource(extractResponse<V1Job>(await batchApi.readNamespacedJob({ name, namespace })))
    }
    if (kind === 'CronJob') {
      return stringifyResource(extractResponse<V1CronJob>(await batchApi.readNamespacedCronJob({ name, namespace })))
    }
    if (kind === 'Service') {
      return stringifyResource(extractResponse<V1Service>(await coreApi.readNamespacedService({ name, namespace })))
    }
    if (kind === 'ConfigMap') {
      return stringifyResource(extractResponse<V1ConfigMap>(await coreApi.readNamespacedConfigMap({ name, namespace })))
    }
    if (kind === 'Secret') {
      return stringifyResource(extractResponse<V1Secret>(await coreApi.readNamespacedSecret({ name, namespace })))
    }
    if (kind === 'Endpoints') {
      return stringifyResource(extractResponse<V1Endpoints>(await coreApi.readNamespacedEndpoints({ name, namespace })))
    }
    if (kind === 'Ingress') {
      return stringifyResource(extractResponse<V1Ingress>(await networkingApi.readNamespacedIngress({ name, namespace })))
    }
    if (kind === 'IngressClass') {
      return stringifyResource(extractResponse<V1IngressClass>(await networkingApi.readIngressClass({ name })))
    }
    if (kind === 'NetworkPolicy') {
      return stringifyResource(extractResponse<V1NetworkPolicy>(await networkingApi.readNamespacedNetworkPolicy({ name, namespace })))
    }
    if (kind === 'IPAddress') {
      return stringifyResource(extractResponse<V1IPAddress>(await networkingApi.readIPAddress({ name })))
    }
    if (kind === 'ServiceCIDR') {
      return stringifyResource(extractResponse<V1ServiceCIDR>(await networkingApi.readServiceCIDR({ name })))
    }
    if (kind === 'EndpointSlice') {
      return stringifyResource(extractResponse<V1EndpointSlice>(await discoveryApi.readNamespacedEndpointSlice({ name, namespace })))
    }
    if (kind === 'APIService') {
      return stringifyResource(extractResponse<V1APIService>(await apiregistrationApi.readAPIService({ name })))
    }
    if (kind === 'MutatingWebhookConfiguration') {
      return stringifyResource(extractResponse<V1MutatingWebhookConfiguration>(await admissionApi.readMutatingWebhookConfiguration({ name })))
    }
    if (kind === 'ValidatingWebhookConfiguration') {
      return stringifyResource(extractResponse<V1ValidatingWebhookConfiguration>(await admissionApi.readValidatingWebhookConfiguration({ name })))
    }
    if (kind === 'MutatingAdmissionPolicy') {
      return stringifyResource(extractResponse<V1beta1MutatingAdmissionPolicy>(await admissionBetaApi.readMutatingAdmissionPolicy({ name })))
    }
    if (kind === 'MutatingAdmissionPolicyBinding') {
      return stringifyResource(extractResponse<V1beta1MutatingAdmissionPolicyBinding>(await admissionBetaApi.readMutatingAdmissionPolicyBinding({ name })))
    }
    if (kind === 'ValidatingAdmissionPolicy') {
      return stringifyResource(extractResponse<V1ValidatingAdmissionPolicy>(await admissionApi.readValidatingAdmissionPolicy({ name })))
    }
    if (kind === 'ValidatingAdmissionPolicyBinding') {
      return stringifyResource(extractResponse<V1ValidatingAdmissionPolicyBinding>(await admissionApi.readValidatingAdmissionPolicyBinding({ name })))
    }
    if (kind === 'FlowSchema') {
      return stringifyResource(extractResponse<V1FlowSchema>(await flowcontrolApi.readFlowSchema({ name })))
    }
    if (kind === 'PriorityLevelConfiguration') {
      return stringifyResource(extractResponse<V1PriorityLevelConfiguration>(await flowcontrolApi.readPriorityLevelConfiguration({ name })))
    }
    if (kind === 'CertificateSigningRequest') {
      return stringifyResource(extractResponse<V1CertificateSigningRequest>(await certificatesApi.readCertificateSigningRequest({ name })))
    }
    if (kind === 'ClusterTrustBundle') {
      return stringifyResource(extractResponse<V1beta1ClusterTrustBundle>(await certificatesBetaApi.readClusterTrustBundle({ name })))
    }
    if (kind === 'PodCertificateRequest') {
      return stringifyResource(extractResponse<V1alpha1PodCertificateRequest>(
        await certificatesAlphaApi.readNamespacedPodCertificateRequest({ name, namespace }),
      ))
    }
    if (kind === 'StorageVersion') {
      return stringifyResource(extractResponse<V1alpha1StorageVersion>(await internalApiserverApi.readStorageVersion({ name })))
    }
    if (kind === 'StorageVersionMigration') {
      return stringifyResource(extractResponse<V1alpha1StorageVersionMigration>(await storagemigrationApi.readStorageVersionMigration({ name })))
    }
    if (kind === 'DeviceTaintRule') {
      return stringifyResource(extractResponse<V1alpha3DeviceTaintRule>(await resourceAlphaApi.readDeviceTaintRule({ name })))
    }
    if (kind === 'PodDisruptionBudget') {
      return stringifyResource(extractResponse<V1PodDisruptionBudget>(await policyApi.readNamespacedPodDisruptionBudget({ name, namespace })))
    }
    if (kind === 'ResourceQuota') {
      return stringifyResource(extractResponse<V1ResourceQuota>(await coreApi.readNamespacedResourceQuota({ name, namespace })))
    }
    if (kind === 'LimitRange') {
      return stringifyResource(extractResponse<V1LimitRange>(await coreApi.readNamespacedLimitRange({ name, namespace })))
    }
    if (kind === 'PriorityClass') {
      return stringifyResource(extractResponse<V1PriorityClass>(await schedulingApi.readPriorityClass({ name })))
    }
    if (kind === 'RuntimeClass') {
      return stringifyResource(extractResponse<V1RuntimeClass>(await nodeApi.readRuntimeClass({ name })))
    }
    if (kind === 'Lease') {
      return stringifyResource(extractResponse<V1Lease>(await coordinationApi.readNamespacedLease({ name, namespace })))
    }
    if (kind === 'LeaseCandidate') {
      return stringifyResource(extractResponse<V1beta1LeaseCandidate>(await coordinationBetaApi.readNamespacedLeaseCandidate({ name, namespace })))
    }
    if (kind === 'Namespace') {
      return stringifyResource(extractResponse<V1Namespace>(await coreApi.readNamespace({ name })))
    }
    if (kind === 'PersistentVolume') {
      return stringifyResource(extractResponse<V1PersistentVolume>(await coreApi.readPersistentVolume({ name })))
    }
    if (kind === 'PersistentVolumeClaim') {
      return stringifyResource(extractResponse<V1PersistentVolumeClaim>(await coreApi.readNamespacedPersistentVolumeClaim({ name, namespace })))
    }
    if (kind === 'StorageClass') {
      return stringifyResource(extractResponse<V1StorageClass>(await storageApi.readStorageClass({ name })))
    }
    if (kind === 'VolumeAttributesClass') {
      return stringifyResource(extractResponse<V1VolumeAttributesClass>(await storageApi.readVolumeAttributesClass({ name })))
    }
    if (kind === 'CSIDriver') {
      return stringifyResource(extractResponse<V1CSIDriver>(await storageApi.readCSIDriver({ name })))
    }
    if (kind === 'CSINode') {
      return stringifyResource(extractResponse<V1CSINode>(await storageApi.readCSINode({ name })))
    }
    if (kind === 'VolumeAttachment') {
      return stringifyResource(extractResponse<V1VolumeAttachment>(await storageApi.readVolumeAttachment({ name })))
    }
    if (kind === 'CSIStorageCapacity') {
      return stringifyResource(extractResponse<V1CSIStorageCapacity>(await storageApi.readNamespacedCSIStorageCapacity({ name, namespace })))
    }
    if (kind === 'VolumeSnapshotClass') {
      return stringifyResource(customResourceObject(await customObjectsApi.getClusterCustomObject({
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        plural: VOLUME_SNAPSHOT_CLASSES_PLURAL,
        name,
      })))
    }
    if (kind === 'VolumeSnapshot') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        namespace,
        plural: VOLUME_SNAPSHOTS_PLURAL,
        name,
      })))
    }
    if (kind === 'VolumeSnapshotContent') {
      return stringifyResource(customResourceObject(await customObjectsApi.getClusterCustomObject({
        group: SNAPSHOT_GROUP,
        version: SNAPSHOT_VERSION,
        plural: VOLUME_SNAPSHOT_CONTENTS_PLURAL,
        name,
      })))
    }
    if (kind === 'GatewayClass') {
      return stringifyResource(customResourceObject(await customObjectsApi.getClusterCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        plural: GATEWAY_CLASSES_PLURAL,
        name,
      })))
    }
    if (kind === 'Gateway') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        namespace,
        plural: GATEWAYS_PLURAL,
        name,
      })))
    }
    if (kind === 'HTTPRoute') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        namespace,
        plural: HTTP_ROUTES_PLURAL,
        name,
      })))
    }
    if (kind === 'GRPCRoute') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        namespace,
        plural: GRPC_ROUTES_PLURAL,
        name,
      })))
    }
    if (kind === 'TLSRoute') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        namespace,
        plural: TLS_ROUTES_PLURAL,
        name,
      })))
    }
    if (kind === 'TCPRoute') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_ALPHA_VERSION,
        namespace,
        plural: TCP_ROUTES_PLURAL,
        name,
      })))
    }
    if (kind === 'UDPRoute') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_ALPHA_VERSION,
        namespace,
        plural: UDP_ROUTES_PLURAL,
        name,
      })))
    }
    if (kind === 'ReferenceGrant') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: GATEWAY_GROUP,
        version: GATEWAY_VERSION,
        namespace,
        plural: REFERENCE_GRANTS_PLURAL,
        name,
      })))
    }
    if (kind === 'DeviceClass') {
      return stringifyResource(customResourceObject(await customObjectsApi.getClusterCustomObject({
        group: RESOURCE_GROUP,
        version: RESOURCE_VERSION,
        plural: DEVICE_CLASSES_PLURAL,
        name,
      })))
    }
    if (kind === 'ResourceClaim') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: RESOURCE_GROUP,
        version: RESOURCE_VERSION,
        namespace,
        plural: RESOURCE_CLAIMS_PLURAL,
        name,
      })))
    }
    if (kind === 'ResourceClaimTemplate') {
      return stringifyResource(customResourceObject(await customObjectsApi.getNamespacedCustomObject({
        group: RESOURCE_GROUP,
        version: RESOURCE_VERSION,
        namespace,
        plural: RESOURCE_CLAIM_TEMPLATES_PLURAL,
        name,
      })))
    }
    if (kind === 'ResourceSlice') {
      return stringifyResource(customResourceObject(await customObjectsApi.getClusterCustomObject({
        group: RESOURCE_GROUP,
        version: RESOURCE_VERSION,
        plural: RESOURCE_SLICES_PLURAL,
        name,
      })))
    }
    if (kind === 'ServiceAccount') {
      return stringifyResource(extractResponse<V1ServiceAccount>(await coreApi.readNamespacedServiceAccount({ name, namespace })))
    }
    if (kind === 'Role') {
      return stringifyResource(extractResponse<V1Role>(await rbacApi.readNamespacedRole({ name, namespace })))
    }
    if (kind === 'RoleBinding') {
      return stringifyResource(extractResponse<V1RoleBinding>(await rbacApi.readNamespacedRoleBinding({ name, namespace })))
    }
    if (kind === 'ClusterRole') {
      return stringifyResource(extractResponse<V1ClusterRole>(await rbacApi.readClusterRole({ name })))
    }
    if (kind === 'ClusterRoleBinding') {
      return stringifyResource(extractResponse<V1ClusterRoleBinding>(await rbacApi.readClusterRoleBinding({ name })))
    }
    if (kind === 'HorizontalPodAutoscaler') {
      return stringifyResource(extractResponse<V2HorizontalPodAutoscaler>(await autoscalingApi.readNamespacedHorizontalPodAutoscaler({ name, namespace })))
    }
    if (kind === 'Event') {
      try {
        return stringifyResource(extractResponse<EventsV1Event>(await eventsApi.readNamespacedEvent({ name, namespace })))
      } catch (err) {
        if (!isNotFoundError(err)) throw err
        return stringifyResource(extractResponse<CoreV1Event>(await coreApi.readNamespacedEvent({ name, namespace })))
      }
    }
    if (kind === 'Node') {
      return stringifyResource(extractResponse<V1Node>(await coreApi.readNode({ name })))
    }
    if (kind === 'CustomResourceDefinition') {
      return stringifyResource(extractResponse<V1CustomResourceDefinition>(await apiextensionsApi.readCustomResourceDefinition({ name })))
    }

    throw new Error(`Resource ${kind}/${name} not found`)
  } catch (err) {
    throw new Error(`获取YAML失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPersistentVolumes = async (contextId: string): Promise<PersistentVolumeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.listPersistentVolume()
    const typedRes = res as { body?: { items?: V1PersistentVolume[] }; items?: V1PersistentVolume[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pv) => ({
      name: pv.metadata?.name ?? '',
      capacity: pv.spec?.capacity?.['storage'] ?? '',
      accessModes: pv.spec?.accessModes?.join(', ') ?? '',
      reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy ?? '',
      status: pv.status?.phase ?? '',
      storageClass: pv.spec?.storageClassName ?? '',
      age: formatAge(pv.metadata?.creationTimestamp),
      labels: pv.metadata?.labels,
      claim: formatPersistentVolumeClaimRef(pv),
      volumeMode: pv.spec?.volumeMode,
      source: formatPersistentVolumeSource(pv),
      reason: pv.status?.reason,
      message: pv.status?.message,
    }))
  } catch (err) {
    throw new Error(`获取PersistentVolume失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPersistentVolumeClaims = async (contextId: string, namespace?: string): Promise<PersistentVolumeClaimInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPersistentVolumeClaim({ namespace })
    } else {
      res = await api.listPersistentVolumeClaimForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1PersistentVolumeClaim[] }; items?: V1PersistentVolumeClaim[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pvc) => ({
      name: pvc.metadata?.name ?? '',
      namespace: pvc.metadata?.namespace ?? '',
      status: pvc.status?.phase ?? '',
      capacity: pvc.status?.capacity?.['storage'] ?? pvc.spec?.resources?.requests?.['storage'] ?? '',
      accessModes: pvc.spec?.accessModes?.join(', ') ?? '',
      storageClass: pvc.spec?.storageClassName ?? '',
      age: formatAge(pvc.metadata?.creationTimestamp),
      labels: pvc.metadata?.labels,
      volumeName: pvc.spec?.volumeName,
      volumeMode: pvc.spec?.volumeMode,
      requestedCapacity: pvc.spec?.resources?.requests?.['storage'],
    }))
  } catch (err) {
    throw new Error(`获取PersistentVolumeClaim失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStorageClasses = async (contextId: string): Promise<StorageClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listStorageClass()
    const typedRes = res as { body?: { items?: V1StorageClass[] }; items?: V1StorageClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sc) => ({
      name: sc.metadata?.name ?? '',
      provisioner: sc.provisioner ?? '',
      reclaimPolicy: sc.reclaimPolicy ?? 'Delete',
      volumeBindingMode: sc.volumeBindingMode ?? 'Immediate',
      age: formatAge(sc.metadata?.creationTimestamp),
      labels: sc.metadata?.labels,
      defaultClass: isDefaultStorageClass(sc.metadata?.annotations),
      allowVolumeExpansion: sc.allowVolumeExpansion,
      parameters: formatQuotaValues(sc.parameters),
      mountOptions: sc.mountOptions?.join(', ') ?? '-',
    }))
  } catch (err) {
    throw new Error(`获取StorageClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listVolumeAttributesClasses = async (contextId: string): Promise<VolumeAttributesClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listVolumeAttributesClass()
    const typedRes = res as { body?: { items?: V1VolumeAttributesClass[] }; items?: V1VolumeAttributesClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(volumeAttributesClassInfo)
  } catch (err) {
    throw new Error(`获取VolumeAttributesClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCSIDrivers = async (contextId: string): Promise<CSIDriverInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listCSIDriver()
    const typedRes = res as { body?: { items?: V1CSIDriver[] }; items?: V1CSIDriver[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(csiDriverInfo)
  } catch (err) {
    throw new Error(`获取CSIDriver失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCSINodes = async (contextId: string): Promise<CSINodeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listCSINode()
    const typedRes = res as { body?: { items?: V1CSINode[] }; items?: V1CSINode[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(csiNodeInfo)
  } catch (err) {
    throw new Error(`获取CSINode失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listVolumeAttachments = async (contextId: string): Promise<VolumeAttachmentInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listVolumeAttachment()
    const typedRes = res as { body?: { items?: V1VolumeAttachment[] }; items?: V1VolumeAttachment[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(volumeAttachmentInfo)
  } catch (err) {
    throw new Error(`获取VolumeAttachment失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCSIStorageCapacities = async (contextId: string, namespace?: string): Promise<CSIStorageCapacityInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedCSIStorageCapacity({ namespace })
    } else {
      res = await api.listCSIStorageCapacityForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1CSIStorageCapacity[] }; items?: V1CSIStorageCapacity[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(csiStorageCapacityInfo)
  } catch (err) {
    throw new Error(`获取CSIStorageCapacity失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const listSnapshotClusterObjects = async (entry: ContextEntry, plural: string): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = await api.listClusterCustomObject({
      group: SNAPSHOT_GROUP,
      version: SNAPSHOT_VERSION,
      plural,
    })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

const listSnapshotNamespacedObjects = async (
  entry: ContextEntry,
  plural: string,
  namespace?: string,
): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = namespace && namespace !== 'all'
      ? await api.listNamespacedCustomObject({
          group: SNAPSHOT_GROUP,
          version: SNAPSHOT_VERSION,
          namespace,
          plural,
        })
      : await api.listCustomObjectForAllNamespaces({
          group: SNAPSHOT_GROUP,
          version: SNAPSHOT_VERSION,
          plural,
        })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

export const listVolumeSnapshotClasses = async (contextId: string): Promise<VolumeSnapshotClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listSnapshotClusterObjects(entry, VOLUME_SNAPSHOT_CLASSES_PLURAL)
    return items.map((item) => volumeSnapshotClassInfo(item as VolumeSnapshotClassObject))
  } catch (err) {
    throw new Error(`获取VolumeSnapshotClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listVolumeSnapshots = async (contextId: string, namespace?: string): Promise<VolumeSnapshotInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listSnapshotNamespacedObjects(entry, VOLUME_SNAPSHOTS_PLURAL, namespace)
    return items.map((item) => volumeSnapshotInfo(item as VolumeSnapshotObject))
  } catch (err) {
    throw new Error(`获取VolumeSnapshot失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listVolumeSnapshotContents = async (contextId: string): Promise<VolumeSnapshotContentInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listSnapshotClusterObjects(entry, VOLUME_SNAPSHOT_CONTENTS_PLURAL)
    return items.map((item) => volumeSnapshotContentInfo(item as VolumeSnapshotContentObject))
  } catch (err) {
    throw new Error(`获取VolumeSnapshotContent失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const listGatewayClusterObjects = async (
  entry: ContextEntry,
  plural: string,
  version = GATEWAY_VERSION,
): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = await api.listClusterCustomObject({
      group: GATEWAY_GROUP,
      version,
      plural,
    })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

const listGatewayNamespacedObjects = async (
  entry: ContextEntry,
  plural: string,
  namespace?: string,
  version = GATEWAY_VERSION,
): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = namespace && namespace !== 'all'
      ? await api.listNamespacedCustomObject({
          group: GATEWAY_GROUP,
          version,
          namespace,
          plural,
        })
      : await api.listCustomObjectForAllNamespaces({
          group: GATEWAY_GROUP,
          version,
          plural,
        })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

export const listGatewayClasses = async (contextId: string): Promise<GatewayClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayClusterObjects(entry, GATEWAY_CLASSES_PLURAL)
    return items.map((item) => gatewayClassInfo(item as GatewayClassObject))
  } catch (err) {
    throw new Error(`获取GatewayClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listGateways = async (contextId: string, namespace?: string): Promise<GatewayInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, GATEWAYS_PLURAL, namespace)
    return items.map((item) => gatewayInfo(item as GatewayObject))
  } catch (err) {
    throw new Error(`获取Gateway失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listHTTPRoutes = async (contextId: string, namespace?: string): Promise<HTTPRouteInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, HTTP_ROUTES_PLURAL, namespace)
    return items.map((item) => gatewayRouteInfo<HTTPRouteInfo>(item as GatewayRouteObject))
  } catch (err) {
    throw new Error(`获取HTTPRoute失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listGRPCRoutes = async (contextId: string, namespace?: string): Promise<GRPCRouteInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, GRPC_ROUTES_PLURAL, namespace)
    return items.map((item) => gatewayRouteInfo<GRPCRouteInfo>(item as GatewayRouteObject))
  } catch (err) {
    throw new Error(`获取GRPCRoute失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listTLSRoutes = async (contextId: string, namespace?: string): Promise<TLSRouteInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, TLS_ROUTES_PLURAL, namespace)
    return items.map((item) => gatewayRouteInfo<TLSRouteInfo>(item as GatewayRouteObject))
  } catch (err) {
    throw new Error(`获取TLSRoute失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listTCPRoutes = async (contextId: string, namespace?: string): Promise<TCPRouteInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, TCP_ROUTES_PLURAL, namespace, GATEWAY_ALPHA_VERSION)
    return items.map((item) => gatewayL4RouteInfo<TCPRouteInfo>(item as GatewayRouteObject))
  } catch (err) {
    throw new Error(`获取TCPRoute失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listUDPRoutes = async (contextId: string, namespace?: string): Promise<UDPRouteInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, UDP_ROUTES_PLURAL, namespace, GATEWAY_ALPHA_VERSION)
    return items.map((item) => gatewayL4RouteInfo<UDPRouteInfo>(item as GatewayRouteObject))
  } catch (err) {
    throw new Error(`获取UDPRoute失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listReferenceGrants = async (contextId: string, namespace?: string): Promise<ReferenceGrantInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listGatewayNamespacedObjects(entry, REFERENCE_GRANTS_PLURAL, namespace)
    return items.map((item) => referenceGrantInfo(item as ReferenceGrantObject))
  } catch (err) {
    throw new Error(`获取ReferenceGrant失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const listResourceClusterObjects = async (entry: ContextEntry, plural: string): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = await api.listClusterCustomObject({
      group: RESOURCE_GROUP,
      version: RESOURCE_VERSION,
      plural,
    })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

const listResourceNamespacedObjects = async (
  entry: ContextEntry,
  plural: string,
  namespace?: string,
): Promise<CustomResourceObject[]> => {
  const api = createCustomObjectsApi(entry)
  try {
    const res = namespace && namespace !== 'all'
      ? await api.listNamespacedCustomObject({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          namespace,
          plural,
        })
      : await api.listCustomObjectForAllNamespaces({
          group: RESOURCE_GROUP,
          version: RESOURCE_VERSION,
          plural,
        })
    return customResourceListItems(res)
  } catch (err) {
    if (isNotFoundError(err)) return []
    throw err
  }
}

export const listDeviceClasses = async (contextId: string): Promise<DeviceClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listResourceClusterObjects(entry, DEVICE_CLASSES_PLURAL)
    return items.map((item) => deviceClassInfo(item as DeviceClassObject))
  } catch (err) {
    throw new Error(`获取DeviceClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listResourceClaims = async (contextId: string, namespace?: string): Promise<ResourceClaimInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listResourceNamespacedObjects(entry, RESOURCE_CLAIMS_PLURAL, namespace)
    return items.map((item) => resourceClaimInfo(item as ResourceClaimObject))
  } catch (err) {
    throw new Error(`获取ResourceClaim失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listResourceClaimTemplates = async (contextId: string, namespace?: string): Promise<ResourceClaimTemplateInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listResourceNamespacedObjects(entry, RESOURCE_CLAIM_TEMPLATES_PLURAL, namespace)
    return items.map((item) => resourceClaimTemplateInfo(item as ResourceClaimTemplateObject))
  } catch (err) {
    throw new Error(`获取ResourceClaimTemplate失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listResourceSlices = async (contextId: string): Promise<ResourceSliceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  try {
    const items = await listResourceClusterObjects(entry, RESOURCE_SLICES_PLURAL)
    return items.map((item) => resourceSliceInfo(item as ResourceSliceObject))
  } catch (err) {
    throw new Error(`获取ResourceSlice失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listDeviceTaintRules = async (contextId: string): Promise<DeviceTaintRuleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createResourceV1alpha3Api(entry)
  try {
    const res = await api.listDeviceTaintRule()
    const typedRes = res as { body?: { items?: V1alpha3DeviceTaintRule[] }; items?: V1alpha3DeviceTaintRule[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(deviceTaintRuleInfo)
  } catch (err) {
    throw new Error(`获取DeviceTaintRule失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listServiceAccounts = async (contextId: string, namespace?: string): Promise<ServiceAccountInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedServiceAccount({ namespace })
    } else {
      res = await api.listServiceAccountForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ServiceAccount[] }; items?: V1ServiceAccount[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sa) => ({
      name: sa.metadata?.name ?? '',
      namespace: sa.metadata?.namespace ?? '',
      secrets: sa.secrets?.length ?? 0,
      age: formatAge(sa.metadata?.creationTimestamp),
      labels: sa.metadata?.labels,
      secretNames: (sa.secrets ?? []).map((secret) => secret.name ?? '').filter(Boolean),
      imagePullSecretNames: (sa.imagePullSecrets ?? []).map((secret) => secret.name ?? '').filter(Boolean),
      automountServiceAccountToken: sa.automountServiceAccountToken,
    }))
  } catch (err) {
    throw new Error(`获取ServiceAccount失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listRoles = async (contextId: string, namespace?: string): Promise<RoleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedRole({ namespace })
    } else {
      res = await api.listRoleForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Role[] }; items?: V1Role[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((role) => ({
      name: role.metadata?.name ?? '',
      namespace: role.metadata?.namespace ?? '',
      rules: role.rules?.length ?? 0,
      age: formatAge(role.metadata?.creationTimestamp),
      labels: role.metadata?.labels,
      ruleDetails: (role.rules ?? []).map(rbacRuleInfo),
    }))
  } catch (err) {
    throw new Error(`获取Role失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listRoleBindings = async (contextId: string, namespace?: string): Promise<RoleBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedRoleBinding({ namespace })
    } else {
      res = await api.listRoleBindingForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1RoleBinding[] }; items?: V1RoleBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((rb) => ({
      name: rb.metadata?.name ?? '',
      namespace: rb.metadata?.namespace ?? '',
      roleRef: `${rb.roleRef?.kind ?? ''}/${rb.roleRef?.name ?? ''}`,
      subjects: rb.subjects?.length ?? 0,
      age: formatAge(rb.metadata?.creationTimestamp),
      labels: rb.metadata?.labels,
      roleRefKind: rb.roleRef?.kind,
      roleRefName: rb.roleRef?.name,
      roleRefApiGroup: rb.roleRef?.apiGroup,
      subjectDetails: (rb.subjects ?? []).map(rbacSubjectInfo),
    }))
  } catch (err) {
    throw new Error(`获取RoleBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listClusterRoles = async (contextId: string): Promise<ClusterRoleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    const res = await api.listClusterRole()
    const typedRes = res as { body?: { items?: V1ClusterRole[] }; items?: V1ClusterRole[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cr) => ({
      name: cr.metadata?.name ?? '',
      rules: cr.rules?.length ?? 0,
      age: formatAge(cr.metadata?.creationTimestamp),
      labels: cr.metadata?.labels,
      ruleDetails: (cr.rules ?? []).map(rbacRuleInfo),
      aggregationRule: formatClusterRoleAggregation(cr.aggregationRule?.clusterRoleSelectors),
    }))
  } catch (err) {
    throw new Error(`获取ClusterRole失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listClusterRoleBindings = async (contextId: string): Promise<ClusterRoleBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    const res = await api.listClusterRoleBinding()
    const typedRes = res as { body?: { items?: V1ClusterRoleBinding[] }; items?: V1ClusterRoleBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((crb) => ({
      name: crb.metadata?.name ?? '',
      roleRef: `${crb.roleRef?.kind ?? ''}/${crb.roleRef?.name ?? ''}`,
      subjects: crb.subjects?.length ?? 0,
      age: formatAge(crb.metadata?.creationTimestamp),
      labels: crb.metadata?.labels,
      roleRefKind: crb.roleRef?.kind,
      roleRefName: crb.roleRef?.name,
      roleRefApiGroup: crb.roleRef?.apiGroup,
      subjectDetails: (crb.subjects ?? []).map(rbacSubjectInfo),
    }))
  } catch (err) {
    throw new Error(`获取ClusterRoleBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCustomResourceDefinitions = async (contextId: string): Promise<CustomResourceDefinitionInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createApiextensionsV1Api(entry)
  try {
    const res = await api.listCustomResourceDefinition()
    const typedRes = res as { body?: { items?: V1CustomResourceDefinition[] }; items?: V1CustomResourceDefinition[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((crd) => ({
      name: crd.metadata?.name ?? '',
      group: crd.spec?.group ?? '',
      scope: crd.spec?.scope ?? '',
      kind: crd.spec?.names?.kind ?? '',
      plural: crd.spec?.names?.plural ?? '',
      versions: crd.spec?.versions?.map((version) => version.name).join(', ') ?? '',
      established: (crd.status?.conditions ?? []).some((condition) => (
        condition.type === 'Established' && condition.status === 'True'
      )),
      age: formatAge(crd.metadata?.creationTimestamp),
      labels: crd.metadata?.labels,
    }))
  } catch (err) {
    throw new Error(`获取CustomResourceDefinition失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCustomResourceInstances = async (
  contextId: string,
  crdName: string,
  namespace?: string,
): Promise<CustomResourceInstanceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const descriptor = await getCustomResourceDescriptor(entry, crdName)
  const api = createCustomObjectsApi(entry)

  try {
    let res: unknown
    if (descriptor.scope === 'Namespaced') {
      if (namespace && namespace !== 'all') {
        res = await api.listNamespacedCustomObject({
          group: descriptor.group,
          version: descriptor.version,
          namespace,
          plural: descriptor.plural,
        })
      } else {
        res = await api.listCustomObjectForAllNamespaces({
          group: descriptor.group,
          version: descriptor.version,
          plural: descriptor.plural,
        })
      }
    } else {
      res = await api.listClusterCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        plural: descriptor.plural,
      })
    }

    return customResourceListItems(res).map((resource) => customResourceInstanceInfo(descriptor, resource))
  } catch (err) {
    throw new Error(`获取CustomResource实例失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getCustomResourceInstanceYaml = async (
  contextId: string,
  crdName: string,
  namespace: string,
  name: string,
): Promise<string> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const descriptor = await getCustomResourceDescriptor(entry, crdName)
  const api = createCustomObjectsApi(entry)

  try {
    const res = descriptor.scope === 'Namespaced'
      ? await api.getNamespacedCustomObject({
          group: descriptor.group,
          version: descriptor.version,
          namespace,
          plural: descriptor.plural,
          name,
        })
      : await api.getClusterCustomObject({
          group: descriptor.group,
          version: descriptor.version,
          plural: descriptor.plural,
          name,
        })
    const resource = customResourceObject(res)
    if (!resource) {
      throw new Error(`CustomResource ${name} 不存在`)
    }
    return JSON.stringify(resource, null, 2)
  } catch (err) {
    throw new Error(`获取CustomResource YAML失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const deleteCustomResourceInstance = async (
  contextId: string,
  crdName: string,
  namespace: string,
  name: string,
): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const descriptor = await getCustomResourceDescriptor(entry, crdName)
  const api = createCustomObjectsApi(entry)

  try {
    if (descriptor.scope === 'Namespaced') {
      await api.deleteNamespacedCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        namespace,
        plural: descriptor.plural,
        name,
        body: {} as V1DeleteOptions,
      })
    } else {
      await api.deleteClusterCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        plural: descriptor.plural,
        name,
        body: {} as V1DeleteOptions,
      })
    }
    return {
      success: true,
      message: `CustomResource ${name} 已删除`,
    }
  } catch (err) {
    return {
      success: false,
      message: `删除CustomResource失败: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export const listHPAs = async (contextId: string, namespace?: string): Promise<HPAInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAutoscalingV2Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedHorizontalPodAutoscaler({ namespace })
    } else {
      res = await api.listHorizontalPodAutoscalerForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V2HorizontalPodAutoscaler[] }; items?: V2HorizontalPodAutoscaler[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((hpa) => {
      const ref = hpa.spec?.scaleTargetRef
      return {
        name: hpa.metadata?.name ?? '',
        namespace: hpa.metadata?.namespace ?? '',
        reference: ref ? `${ref.kind}/${ref.name}` : '',
        minPods: hpa.spec?.minReplicas ?? 1,
        maxPods: hpa.spec?.maxReplicas ?? 0,
        currentReplicas: hpa.status?.currentReplicas ?? 0,
        desiredReplicas: hpa.status?.desiredReplicas ?? 0,
        age: formatAge(hpa.metadata?.creationTimestamp),
        labels: hpa.metadata?.labels,
        targetApiVersion: ref?.apiVersion,
        targetKind: ref?.kind,
        targetName: ref?.name,
        metricDetails: hpaMetricDetails(
          hpa.spec?.metrics as HPAMetricSourceLike[] | undefined,
          hpa.status?.currentMetrics as HPAMetricSourceLike[] | undefined,
        ),
        conditionDetails: hpaConditionDetails(hpa.status?.conditions as HPAConditionLike[] | undefined),
      }
    })
  } catch (err) {
    throw new Error(`获取HorizontalPodAutoscaler失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listEvents = async (contextId: string, namespace?: string): Promise<EventInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const eventsApi = createEventsV1Api(entry)
  const coreApi = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await eventsApi.listNamespacedEvent({ namespace })
    } else {
      res = await eventsApi.listEventForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: EventsV1Event[] }; items?: EventsV1Event[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map(eventsV1EventInfo)
  } catch (err) {
    if (!isNotFoundError(err)) {
      throw new Error(`获取Event失败: ${err instanceof Error ? err.message : String(err)}`)
    }
    try {
      let res: unknown
      if (namespace && namespace !== 'all') {
        res = await coreApi.listNamespacedEvent({ namespace })
      } else {
        res = await coreApi.listEventForAllNamespaces()
      }
      const typedRes = res as { body?: { items?: CoreV1Event[] }; items?: CoreV1Event[] }
      const items = typedRes.body?.items ?? typedRes.items ?? []
      return items.map(coreEventInfo)
    } catch (coreErr) {
      throw new Error(`获取Event失败: ${coreErr instanceof Error ? coreErr.message : String(coreErr)}`)
    }
  }
}
/* node:coverage enable */
