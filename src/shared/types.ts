export type ContextRecord = {
  id: string
  name: string
  cluster: string
  user: string
  source: string
  current: boolean
  namespace: string
}

export type ClusterHealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export type ClusterHealth = {
  status: ClusterHealthStatus
  totalNodes: number
  readyNodes: number
  totalPods: number
  runningPods: number
  pendingPods: number
  failedPods: number
  lastUpdated: string
}

export type ComponentStatusConditionInfo = {
  type: string
  status: string
  message: string
  error: string
}

export type ComponentStatusInfo = {
  name: string
  status: string
  message: string
  error: string
  age: string
  labels?: Record<string, string>
  conditionDetails?: ComponentStatusConditionInfo[]
}

export type APIGroupInfo = {
  name: string
  preferredVersion: string
  versions: string
  versionCount: number
  apiVersion: string
  kind: string
  serverAddressCount: number
  serverAddresses: string
}

export type APIResourceInfo = {
  name: string
  kind: string
  apiGroup: string
  version: string
  groupVersion: string
  namespaced: boolean
  scope: string
  verbs: string
  shortNames: string
  categories: string
  singularName: string
  storageVersionHash: string
  preferred: boolean
  subresource: boolean
}

export type ServerVersionInfo = {
  name: string
  gitVersion: string
  major: string
  minor: string
  platform: string
  buildDate: string
  gitCommit: string
  gitTreeState: string
  goVersion: string
  compiler: string
  emulationVersion: string
  minCompatibilityVersion: string
}

export type OpenIDConfigurationInfo = {
  name: string
  issuer: string
  jwksUri: string
  responseTypesSupported: string
  subjectTypesSupported: string
  signingAlgorithms: string
  keyCount: number
  keyIds: string
  keyTypes: string
  keyUses: string
  scopesSupported: string
  claimsSupported: string
  rawConfigurationKeys: string
}

export type APIServerHealthInfo = {
  name: string
  path: string
  status: string
  healthy: boolean
  message: string
}

export type SelfSubjectReviewInfo = {
  name: string
  username: string
  uid: string
  groups: string
  groupCount: number
  extraKeys: string
  extra: string
}

export type SelfSubjectAccessReviewScope = 'Cluster' | 'Namespaced' | 'NonResource'

export type SelfSubjectAccessReviewInfo = {
  name: string
  namespace: string
  scope: SelfSubjectAccessReviewScope
  verb: string
  apiGroup: string
  resource: string
  subresource: string
  resourceName: string
  path: string
  allowed: boolean
  denied: boolean
  status: string
  reason: string
  evaluationError: string
}

export type CanIReviewRequest = {
  verb: string
  namespace?: string
  apiGroup?: string
  resource?: string
  subresource?: string
  resourceName?: string
  nonResourceUrl?: string
}

export type SelfSubjectRuleType = 'Resource' | 'NonResource'

export type SelfSubjectRuleInfo = {
  name: string
  namespace: string
  type: SelfSubjectRuleType
  verbs: string
  apiGroups: string
  resources: string
  resourceNames: string
  nonResourceURLs: string
  incomplete: boolean
  evaluationError: string
}

export type CreateResult = {
  success: boolean
  name?: string
  namespace?: string
  message?: string
}

export type UpdateResult = {
  success: boolean
  message?: string
}

export type CertificateSigningRequestDecision = 'approve' | 'deny'

export type MetadataField = 'labels' | 'annotations'

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

export type NodeMetrics = {
  name: string
  timestamp: string
  cpu: string
  memory: string
}

export type NodeInfo = {
  name: string
  status: string
  version: string
  roles: string
  cpuUsage?: string
  memoryUsage?: string
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
  cpu?: string
  memory?: string
  ports?: number[]
}

export type PodInfo = {
  name: string
  namespace: string
  status: string
  nodeName: string
  restarts: number
  cpu?: string
  memory?: string
  age: string
  podIP?: string
  hostIP?: string
  startTime?: string
  labels?: Record<string, string>
  containers?: PodContainer[]
  initContainers?: PodContainer[]
  serviceAccount?: string
  priority?: string
  runtimeClass?: string
  qosClass?: string
  pvcClaims?: string[]
}

export type NamespaceInfo = {
  name: string
  status: string
  age: string
  labels?: Record<string, string>
  finalizers?: string[]
}

export type DeploymentInfo = {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  age: string
  paused?: boolean
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
  owner?: string
  fullyLabeledReplicas?: number
  availableReplicas?: number
}

export type ReplicationControllerInfo = {
  name: string
  namespace: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  fullyLabeledReplicas?: number
}

export type ControllerRevisionInfo = {
  name: string
  namespace: string
  revision: number
  owner: string
  dataKind: string
  age: string
  labels?: Record<string, string>
}

export type PodTemplateInfo = {
  name: string
  namespace: string
  containers: number
  images: string
  restartPolicy: string
  serviceAccount: string
  templateLabels: string
  nodeSelector: string
  age: string
  labels?: Record<string, string>
}

export type JobInfo = {
  name: string
  namespace: string
  completions: number
  succeeded: number
  active: number
  failed: number
  suspend: boolean
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  owner?: string
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

export type DeleteResult = {
  success: boolean
  message?: string
}

export type ServiceInfo = {
  name: string
  namespace: string
  type: string
  clusterIP: string
  externalIP?: string
  ports: string
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  portDetails?: ServicePortInfo[]
}

export type ServicePortInfo = {
  name: string
  port: number
  targetPort: string
  protocol: string
  appProtocol: string
  nodePort?: number
}

export type ConfigMapInfo = {
  name: string
  namespace: string
  age: string
  labels?: Record<string, string>
  data?: Record<string, string>
  binaryDataKeys?: string[]
  immutable?: boolean
}

export type SecretInfo = {
  name: string
  namespace: string
  type: string
  age: string
  labels?: Record<string, string>
  dataKeys?: string[]
  dataSizes?: Record<string, number>
  immutable?: boolean
}

export type IngressRuleInfo = {
  host: string
  path: string
  pathType: string
  serviceName: string
  servicePort: string
}

export type IngressTlsInfo = {
  hosts: string
  secretName: string
}

export type IngressInfo = {
  name: string
  namespace: string
  ingressClass?: string
  hosts: string
  address: string
  ports: string
  age: string
  labels?: Record<string, string>
  rules?: IngressRuleInfo[]
  tls?: IngressTlsInfo[]
  defaultBackend?: string
  defaultBackendServiceName?: string
  defaultBackendServicePort?: string
}

export type IngressClassInfo = {
  name: string
  controller: string
  parameters: string
  default: boolean
  age: string
  labels?: Record<string, string>
  parameterApiGroup?: string
  parameterKind?: string
  parameterNamespace?: string
  parameterName?: string
  parameterScope?: string
}

export type NetworkPolicyInfo = {
  name: string
  namespace: string
  podSelector: string
  selector?: Record<string, string>
  policyTypes: string
  ingressRules: number
  egressRules: number
  age: string
  labels?: Record<string, string>
  ruleDetails?: NetworkPolicyRuleInfo[]
}

export type NetworkPolicyRuleInfo = {
  direction: 'Ingress' | 'Egress'
  peers: string
  ports: string
}

export type IPAddressInfo = {
  name: string
  parentRef: string
  parentGroup: string
  parentResource: string
  parentNamespace: string
  parentName: string
  age: string
  labels?: Record<string, string>
}

export type ServiceCIDRConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type ServiceCIDRInfo = {
  name: string
  cidrs: string
  cidrCount: number
  ready: string
  conditions: ServiceCIDRConditionInfo[]
  age: string
  labels?: Record<string, string>
}

export type EndpointInfo = {
  name: string
  namespace: string
  ready: number
  notReady: number
  addresses: string
  ports: string
  age: string
  labels?: Record<string, string>
  addressDetails?: EndpointAddressInfo[]
  portDetails?: EndpointPortInfo[]
}

export type EndpointAddressInfo = {
  ip: string
  ready: boolean
  hostname: string
  nodeName: string
  targetKind: string
  targetName: string
}

export type EndpointPortInfo = {
  name: string
  port: string
  protocol: string
  appProtocol: string
}

export type EndpointSliceInfo = {
  name: string
  namespace: string
  addressType: string
  service: string
  endpoints: number
  ready: number
  notReady: number
  addresses: string
  ports: string
  age: string
  labels?: Record<string, string>
  endpointDetails?: EndpointSliceEndpointInfo[]
  portDetails?: EndpointSlicePortInfo[]
}

export type EndpointSliceEndpointInfo = {
  addresses: string
  ready: boolean
  serving: boolean
  terminating: boolean
  hostname: string
  nodeName: string
  zone: string
  targetKind: string
  targetName: string
}

export type EndpointSlicePortInfo = {
  name: string
  port: string
  protocol: string
  appProtocol: string
}

export type AdmissionWebhookConfigurationInfo = {
  name: string
  webhooks: number
  failurePolicies: string
  sideEffects: string
  admissionReviewVersions: string
  clients: string
  rules: string
  age: string
  labels?: Record<string, string>
  webhookDetails?: AdmissionWebhookInfo[]
  ruleDetails?: AdmissionWebhookRuleInfo[]
}

export type AdmissionWebhookInfo = {
  name: string
  client: string
  serviceNamespace?: string
  serviceName?: string
  servicePort?: number
  servicePath?: string
  failurePolicy: string
  sideEffects: string
  admissionReviewVersions: string
  matchPolicy: string
  reinvocationPolicy: string
  timeoutSeconds: string
  namespaceSelector: string
  objectSelector: string
  rules: number
  matchConditions: number
  caBundleConfigured: boolean
}

export type AdmissionWebhookRuleInfo = {
  webhookName: string
  operations: string
  apiGroups: string
  apiVersions: string
  resources: string
  scope: string
}

export type ValidatingAdmissionPolicyInfo = {
  name: string
  failurePolicy: string
  validations: number
  auditAnnotations: number
  matchConstraints: string
  paramKind: string
  condition: string
  warnings: number
  age: string
  labels?: Record<string, string>
  validationDetails?: ValidatingAdmissionValidationInfo[]
  auditAnnotationDetails?: ValidatingAdmissionAuditAnnotationInfo[]
  matchRuleDetails?: AdmissionPolicyRuleInfo[]
  conditionDetails?: AdmissionPolicyConditionInfo[]
  warningDetails?: AdmissionPolicyWarningInfo[]
}

export type ValidatingAdmissionPolicyBindingInfo = {
  name: string
  policyName: string
  validationActions: string
  paramRef: string
  matchResources: string
  age: string
  labels?: Record<string, string>
  paramRefDetails?: AdmissionPolicyParamRefInfo
  matchRuleDetails?: AdmissionPolicyRuleInfo[]
}

export type MutatingAdmissionPolicyInfo = {
  name: string
  failurePolicy: string
  reinvocationPolicy: string
  mutations: number
  variables: number
  matchConditions: number
  matchConstraints: string
  paramKind: string
  age: string
  labels?: Record<string, string>
  mutationDetails?: MutatingAdmissionMutationInfo[]
  variableDetails?: MutatingAdmissionVariableInfo[]
  matchConditionDetails?: MutatingAdmissionMatchConditionInfo[]
  matchRuleDetails?: AdmissionPolicyRuleInfo[]
}

export type MutatingAdmissionPolicyBindingInfo = {
  name: string
  policyName: string
  paramRef: string
  matchResources: string
  age: string
  labels?: Record<string, string>
  paramRefDetails?: AdmissionPolicyParamRefInfo
  matchRuleDetails?: AdmissionPolicyRuleInfo[]
}

export type MutatingAdmissionMutationInfo = {
  index: number
  patchType: string
  applyConfigurationConfigured: boolean
  jsonPatchConfigured: boolean
}

export type MutatingAdmissionVariableInfo = {
  name: string
  expressionConfigured: boolean
}

export type MutatingAdmissionMatchConditionInfo = {
  name: string
  expressionConfigured: boolean
}

export type ValidatingAdmissionValidationInfo = {
  index: number
  expressionConfigured: boolean
  message: string
  reason: string
  messageExpressionConfigured: boolean
}

export type ValidatingAdmissionAuditAnnotationInfo = {
  key: string
  valueExpressionConfigured: boolean
}

export type AdmissionPolicyRuleInfo = {
  direction: 'Include' | 'Exclude'
  operations: string
  apiGroups: string
  apiVersions: string
  resources: string
  resourceNames: string
  scope: string
}

export type AdmissionPolicyConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type AdmissionPolicyWarningInfo = {
  fieldRef: string
  warning: string
}

export type AdmissionPolicyParamRefInfo = {
  name: string
  namespace: string
  selector: string
  parameterNotFoundAction: string
}

export type FlowSchemaInfo = {
  name: string
  priorityLevel: string
  matchingPrecedence: number
  distinguisherMethod: string
  subjects: string
  rules: string
  condition: string
  age: string
  labels?: Record<string, string>
  subjectDetails?: FlowSchemaSubjectInfo[]
  resourceRuleDetails?: FlowSchemaResourceRuleInfo[]
  nonResourceRuleDetails?: FlowSchemaNonResourceRuleInfo[]
  conditionDetails?: FlowControlConditionInfo[]
}

export type FlowSchemaSubjectInfo = {
  ruleIndex: number
  kind: string
  name: string
  namespace: string
}

export type FlowSchemaResourceRuleInfo = {
  ruleIndex: number
  subjects: string
  verbs: string
  apiGroups: string
  resources: string
  namespaces: string
  clusterScope: boolean
}

export type FlowSchemaNonResourceRuleInfo = {
  ruleIndex: number
  subjects: string
  verbs: string
  nonResourceURLs: string
}

export type FlowControlConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type PriorityLevelConfigurationInfo = {
  name: string
  type: string
  nominalConcurrencyShares: string
  lendablePercent: string
  borrowingLimitPercent: string
  limitResponse: string
  queues: string
  handSize: string
  queueLengthLimit: string
  condition: string
  age: string
  labels?: Record<string, string>
  conditionDetails?: FlowControlConditionInfo[]
}

export type CertificateSigningRequestInfo = {
  name: string
  signerName: string
  requestor: string
  groups: string
  condition: string
  reason: string
  usages: string
  expirationSeconds: number
  requestConfigured: boolean
  certificateConfigured: boolean
  age: string
  labels?: Record<string, string>
  conditionDetails?: CertificateSigningRequestConditionInfo[]
}

export type CertificateSigningRequestConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastUpdateTime: string
  lastTransitionTime: string
}

export type ClusterTrustBundleInfo = {
  name: string
  signerName: string
  certificateCount: number
  trustBundleBytes: number
  trustBundleConfigured: boolean
  age: string
  labels?: Record<string, string>
}

export type PodCertificateRequestConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type PodCertificateRequestInfo = {
  name: string
  namespace: string
  signerName: string
  podName: string
  nodeName: string
  serviceAccountName: string
  maxExpirationSeconds: number
  condition: string
  certificateChainConfigured: boolean
  notBefore: string
  notAfter: string
  beginRefreshAt: string
  age: string
  labels?: Record<string, string>
  podUID?: string
  nodeUID?: string
  serviceAccountUID?: string
  conditionDetails?: PodCertificateRequestConditionInfo[]
}

export type StorageVersionServerInfo = {
  apiServerID: string
  encodingVersion: string
  decodableVersions: string
  servedVersions: string
}

export type StorageVersionConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type StorageVersionInfo = {
  name: string
  commonEncodingVersion: string
  storageVersions: number
  condition: string
  age: string
  labels?: Record<string, string>
  serverDetails?: StorageVersionServerInfo[]
  conditionDetails?: StorageVersionConditionInfo[]
}

export type StorageVersionMigrationConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastUpdateTime: string
}

export type StorageVersionMigrationInfo = {
  name: string
  resource: string
  resourceName: string
  group: string
  version: string
  continueToken: string
  resourceVersion: string
  condition: string
  age: string
  labels?: Record<string, string>
  conditionDetails?: StorageVersionMigrationConditionInfo[]
}

export type APIServiceInfo = {
  name: string
  group: string
  version: string
  service: string
  serviceNamespace?: string
  serviceName?: string
  servicePort?: number
  available: string
  reason: string
  groupPriority: number
  versionPriority: number
  insecureSkipTLSVerify: boolean
  caBundleConfigured: boolean
  age: string
  labels?: Record<string, string>
  conditionDetails?: APIServiceConditionInfo[]
}

export type APIServiceConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type PriorityClassInfo = {
  name: string
  value: number
  globalDefault: boolean
  preemptionPolicy: string
  description: string
  age: string
  labels?: Record<string, string>
}

export type RuntimeClassInfo = {
  name: string
  handler: string
  overhead: string
  nodeSelector: string
  tolerations: number
  age: string
  labels?: Record<string, string>
  nodeSelectorLabels?: Record<string, string>
  tolerationDetails?: RuntimeClassTolerationInfo[]
}

export type RuntimeClassTolerationInfo = {
  key: string
  operator: string
  value: string
  effect: string
  tolerationSeconds: string
}

export type LeaseInfo = {
  name: string
  namespace: string
  holder: string
  leaseDuration: number
  acquireTime: string
  renewTime: string
  transitions: number
  age: string
  labels?: Record<string, string>
}

export type LeaseCandidateInfo = {
  name: string
  namespace: string
  leaseName: string
  binaryVersion: string
  emulationVersion: string
  strategy: string
  pingTime: string
  renewTime: string
  age: string
  labels?: Record<string, string>
}

export type HelmReleaseInfo = {
  name: string
  namespace: string
  revision: number
  status: string
  chart: string
  appVersion: string
  updated: string
  age: string
  storage: 'Secret' | 'ConfigMap'
  labels?: Record<string, string>
}

export type HelmRepositoryInfo = {
  name: string
  url: string
}

export type HelmChartInfo = {
  name: string
  repository: string
  chart: string
  version: string
  appVersion: string
  description: string
}

export type HelmReleaseUpgradeRequest = {
  name: string
  namespace: string
  chart: string
  version?: string
  valuesFile?: string
  setValues?: string[]
  createNamespace?: boolean
  install?: boolean
  wait?: boolean
  timeout?: string
}

export type PodDisruptionBudgetInfo = {
  name: string
  namespace: string
  minAvailable: string
  maxUnavailable: string
  allowedDisruptions: number
  currentHealthy: number
  desiredHealthy: number
  expectedPods: number
  age: string
  labels?: Record<string, string>
  selector?: Record<string, string>
  unhealthyPodEvictionPolicy?: string
  observedGeneration?: number
  disruptedPods?: string
  conditionDetails?: PodDisruptionBudgetConditionInfo[]
}

export type PodDisruptionBudgetConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type ResourceQuotaInfo = {
  name: string
  namespace: string
  hard: string
  used: string
  scopes: string
  age: string
  labels?: Record<string, string>
  quotaDetails?: ResourceQuotaUsageInfo[]
  scopeSelector?: string
  scopeSelectorDetails?: ResourceQuotaScopeSelectorInfo[]
}

export type ResourceQuotaUsageInfo = {
  resource: string
  hard: string
  used: string
}

export type ResourceQuotaScopeSelectorInfo = {
  scopeName: string
  operator: string
  values: string
}

export type LimitRangeInfo = {
  name: string
  namespace: string
  types: string
  min: string
  max: string
  default: string
  defaultRequest: string
  maxLimitRequestRatio: string
  age: string
  labels?: Record<string, string>
  limitDetails?: LimitRangeItemInfo[]
}

export type LimitRangeItemInfo = {
  type: string
  min: string
  max: string
  default: string
  defaultRequest: string
  maxLimitRequestRatio: string
}

export type PersistentVolumeInfo = {
  name: string
  capacity: string
  accessModes: string
  reclaimPolicy: string
  status: string
  storageClass: string
  age: string
  labels?: Record<string, string>
  claim?: string
  volumeMode?: string
  source?: string
  reason?: string
  message?: string
}

export type PersistentVolumeClaimInfo = {
  name: string
  namespace: string
  status: string
  capacity: string
  accessModes: string
  storageClass: string
  age: string
  labels?: Record<string, string>
  volumeName?: string
  volumeMode?: string
  requestedCapacity?: string
}

export type StorageClassInfo = {
  name: string
  provisioner: string
  reclaimPolicy: string
  volumeBindingMode: string
  age: string
  labels?: Record<string, string>
  defaultClass?: boolean
  allowVolumeExpansion?: boolean
  parameters?: string
  mountOptions?: string
}

export type VolumeAttributesClassInfo = {
  name: string
  driverName: string
  parameters: string
  parameterCount: number
  age: string
  labels?: Record<string, string>
  parameterDetails?: Record<string, string>
}

export type CSIDriverInfo = {
  name: string
  attachRequired: boolean
  podInfoOnMount: boolean
  storageCapacity: boolean
  requiresRepublish: boolean
  seLinuxMount: boolean
  volumeLifecycleModes: string
  fsGroupPolicy: string
  age: string
  labels?: Record<string, string>
}

export type CSINodeInfo = {
  name: string
  drivers: number
  driverNames: string
  nodeIds: string
  topologyKeys: string
  allocatable: string
  age: string
  labels?: Record<string, string>
  driverDetails?: CSINodeDriverInfo[]
}

export type CSINodeDriverInfo = {
  name: string
  nodeId: string
  topologyKeys: string
  allocatable: string
}

export type VolumeAttachmentInfo = {
  name: string
  attacher: string
  node: string
  source: string
  attached: boolean
  attachError: string
  detachError: string
  age: string
  labels?: Record<string, string>
  sourcePersistentVolume?: string
  sourceInline?: boolean
}

export type CSIStorageCapacityInfo = {
  name: string
  namespace: string
  storageClass: string
  capacity: string
  maximumVolumeSize: string
  topology: string
  age: string
  labels?: Record<string, string>
  nodeTopologyLabels?: Record<string, string>
  nodeTopologyExpressions?: CSIStorageTopologyExpressionInfo[]
}

export type CSIStorageTopologyExpressionInfo = {
  key: string
  operator: string
  values: string
}

export type VolumeSnapshotClassInfo = {
  name: string
  driver: string
  deletionPolicy: string
  parameters: string
  age: string
  labels?: Record<string, string>
  parameterDetails?: Record<string, string>
}

export type VolumeSnapshotInfo = {
  name: string
  namespace: string
  snapshotClass: string
  source: string
  boundContent: string
  readyToUse: boolean
  restoreSize: string
  error: string
  age: string
  labels?: Record<string, string>
  sourcePVC?: string
  sourceContent?: string
}

export type VolumeSnapshotContentInfo = {
  name: string
  snapshotClass: string
  driver: string
  deletionPolicy: string
  source: string
  volumeSnapshot: string
  readyToUse: boolean
  restoreSize: string
  handle: string
  error: string
  age: string
  labels?: Record<string, string>
  sourceVolumeHandle?: string
  sourceSnapshotHandle?: string
  volumeSnapshotNamespace?: string
  volumeSnapshotName?: string
}

export type GatewayConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type GatewayClassInfo = {
  name: string
  controllerName: string
  accepted: string
  description: string
  parametersRef: string
  age: string
  labels?: Record<string, string>
  conditions?: GatewayConditionInfo[]
}

export type GatewayListenerInfo = {
  name: string
  protocol: string
  port: string
  hostname: string
  attachedRoutes: number
  accepted: string
  resolvedRefs: string
  programmed: string
}

export type GatewayInfo = {
  name: string
  namespace: string
  gatewayClass: string
  addresses: string
  listeners: string
  attachedRoutes: number
  accepted: string
  programmed: string
  age: string
  labels?: Record<string, string>
  listenerDetails?: GatewayListenerInfo[]
  conditions?: GatewayConditionInfo[]
}

export type GatewayRouteParentInfo = {
  parentRef: string
  controllerName: string
  accepted: string
  resolvedRefs: string
  programmed: string
  conditions?: GatewayConditionInfo[]
}

export type HTTPRouteInfo = {
  name: string
  namespace: string
  hostnames: string
  parentRefs: string
  rules: number
  backendRefs: string
  accepted: string
  resolvedRefs: string
  age: string
  labels?: Record<string, string>
  parentDetails?: GatewayRouteParentInfo[]
}

export type GRPCRouteInfo = {
  name: string
  namespace: string
  hostnames: string
  parentRefs: string
  rules: number
  backendRefs: string
  accepted: string
  resolvedRefs: string
  age: string
  labels?: Record<string, string>
  parentDetails?: GatewayRouteParentInfo[]
}

export type TLSRouteInfo = {
  name: string
  namespace: string
  hostnames: string
  parentRefs: string
  rules: number
  backendRefs: string
  accepted: string
  resolvedRefs: string
  age: string
  labels?: Record<string, string>
  parentDetails?: GatewayRouteParentInfo[]
}

export type TCPRouteInfo = {
  name: string
  namespace: string
  parentRefs: string
  rules: number
  backendRefs: string
  accepted: string
  resolvedRefs: string
  age: string
  labels?: Record<string, string>
  parentDetails?: GatewayRouteParentInfo[]
}

export type UDPRouteInfo = {
  name: string
  namespace: string
  parentRefs: string
  rules: number
  backendRefs: string
  accepted: string
  resolvedRefs: string
  age: string
  labels?: Record<string, string>
  parentDetails?: GatewayRouteParentInfo[]
}

export type ReferenceGrantRefInfo = {
  group: string
  kind: string
  namespace?: string
  name?: string
}

export type ReferenceGrantInfo = {
  name: string
  namespace: string
  from: string
  to: string
  age: string
  labels?: Record<string, string>
  fromDetails?: ReferenceGrantRefInfo[]
  toDetails?: ReferenceGrantRefInfo[]
}

export type DeviceClassInfo = {
  name: string
  selectors: number
  config: number
  extendedResourceName: string
  age: string
  labels?: Record<string, string>
}

export type ResourceClaimInfo = {
  name: string
  namespace: string
  requests: number
  deviceClasses: string
  allocated: boolean
  allocatedDevices: number
  reservedFor: number
  age: string
  labels?: Record<string, string>
  requestDetails?: string[]
  allocationDetails?: string[]
}

export type ResourceClaimTemplateInfo = {
  name: string
  namespace: string
  requests: number
  deviceClasses: string
  age: string
  labels?: Record<string, string>
  requestDetails?: string[]
}

export type ResourceSliceInfo = {
  name: string
  driver: string
  pool: string
  node: string
  devices: number
  allNodes: boolean
  age: string
  labels?: Record<string, string>
  deviceNames?: string[]
}

export type DeviceTaintRuleInfo = {
  name: string
  driver: string
  pool: string
  deviceClassName: string
  device: string
  celSelectors: number
  taintKey: string
  taintValue: string
  taintEffect: string
  timeAdded: string
  age: string
  labels?: Record<string, string>
}

export type ServiceAccountInfo = {
  name: string
  namespace: string
  secrets: number
  age: string
  labels?: Record<string, string>
  secretNames?: string[]
  imagePullSecretNames?: string[]
  automountServiceAccountToken?: boolean
}

export type RbacRuleInfo = {
  verbs: string
  apiGroups: string
  resources: string
  resourceNames: string
  nonResourceURLs: string
}

export type RbacSubjectInfo = {
  kind: string
  name: string
  namespace?: string
  apiGroup?: string
}

export type RoleInfo = {
  name: string
  namespace: string
  rules: number
  age: string
  labels?: Record<string, string>
  ruleDetails?: RbacRuleInfo[]
}

export type RoleBindingInfo = {
  name: string
  namespace: string
  roleRef: string
  subjects: number
  age: string
  labels?: Record<string, string>
  roleRefKind?: string
  roleRefName?: string
  roleRefApiGroup?: string
  subjectDetails?: RbacSubjectInfo[]
}

export type ClusterRoleInfo = {
  name: string
  rules: number
  age: string
  labels?: Record<string, string>
  ruleDetails?: RbacRuleInfo[]
  aggregationRule?: string
}

export type ClusterRoleBindingInfo = {
  name: string
  roleRef: string
  subjects: number
  age: string
  labels?: Record<string, string>
  roleRefKind?: string
  roleRefName?: string
  roleRefApiGroup?: string
  subjectDetails?: RbacSubjectInfo[]
}

export type CustomResourceDefinitionInfo = {
  name: string
  group: string
  scope: string
  kind: string
  plural: string
  versions: string
  established: boolean
  age: string
  labels?: Record<string, string>
}

export type CustomResourceInstanceInfo = {
  crdName: string
  apiVersion: string
  kind: string
  plural: string
  scope: string
  name: string
  namespace: string
  status: string
  age: string
  labels?: Record<string, string>
}

export type HPAInfo = {
  name: string
  namespace: string
  reference: string
  minPods: number
  maxPods: number
  currentReplicas: number
  desiredReplicas: number
  age: string
  labels?: Record<string, string>
  targetApiVersion?: string
  targetKind?: string
  targetName?: string
  metricDetails?: HPAMetricInfo[]
  conditionDetails?: HPAConditionInfo[]
}

export type HPAMetricInfo = {
  type: string
  name: string
  target: string
  current: string
}

export type HPAConditionInfo = {
  type: string
  status: string
  reason: string
  message: string
  lastTransitionTime: string
}

export type EventInfo = {
  name: string
  namespace: string
  reason: string
  message: string
  type: string
  object: string
  count: number
  age: string
  labels?: Record<string, string>
  objectApiVersion?: string
  objectKind?: string
  objectName?: string
  objectNamespace?: string
  objectUid?: string
  objectFieldPath?: string
  relatedObject?: string
  relatedObjectKind?: string
  relatedObjectName?: string
  relatedObjectNamespace?: string
  relatedObjectApiVersion?: string
  relatedObjectFieldPath?: string
  sourceComponent?: string
  sourceHost?: string
  action?: string
  reportingComponent?: string
  reportingInstance?: string
  firstTimestamp?: string
  lastTimestamp?: string
  eventTime?: string
}

export type ScaleResult = {
  success: boolean
  replicas: number
  message?: string
}

export type KubernetesResourceKind =
  | 'Namespace'
  | 'ComponentStatus'
  | 'APIGroup'
  | 'APIResource'
  | 'ServerVersion'
  | 'OpenIDConfiguration'
  | 'APIServerHealth'
  | 'SelfSubjectReview'
  | 'SelfSubjectAccessReview'
  | 'SelfSubjectRulesReview'
  | 'Node'
  | 'Pod'
  | 'Deployment'
  | 'DaemonSet'
  | 'StatefulSet'
  | 'ReplicaSet'
  | 'ReplicationController'
  | 'ControllerRevision'
  | 'PodTemplate'
  | 'Job'
  | 'CronJob'
  | 'Service'
  | 'ConfigMap'
  | 'Secret'
  | 'Endpoints'
  | 'Ingress'
  | 'IngressClass'
  | 'NetworkPolicy'
  | 'IPAddress'
  | 'ServiceCIDR'
  | 'EndpointSlice'
  | 'APIService'
  | 'MutatingWebhookConfiguration'
  | 'ValidatingWebhookConfiguration'
  | 'MutatingAdmissionPolicy'
  | 'MutatingAdmissionPolicyBinding'
  | 'ValidatingAdmissionPolicy'
  | 'ValidatingAdmissionPolicyBinding'
  | 'FlowSchema'
  | 'PriorityLevelConfiguration'
  | 'CertificateSigningRequest'
  | 'ClusterTrustBundle'
  | 'PodCertificateRequest'
  | 'StorageVersion'
  | 'StorageVersionMigration'
  | 'PodDisruptionBudget'
  | 'ResourceQuota'
  | 'LimitRange'
  | 'PriorityClass'
  | 'RuntimeClass'
  | 'Lease'
  | 'LeaseCandidate'
  | 'PersistentVolume'
  | 'PersistentVolumeClaim'
  | 'StorageClass'
  | 'VolumeAttributesClass'
  | 'CSIDriver'
  | 'CSINode'
  | 'VolumeAttachment'
  | 'CSIStorageCapacity'
  | 'VolumeSnapshotClass'
  | 'VolumeSnapshot'
  | 'VolumeSnapshotContent'
  | 'GatewayClass'
  | 'Gateway'
  | 'HTTPRoute'
  | 'GRPCRoute'
  | 'TLSRoute'
  | 'TCPRoute'
  | 'UDPRoute'
  | 'ReferenceGrant'
  | 'DeviceClass'
  | 'ResourceClaim'
  | 'ResourceClaimTemplate'
  | 'ResourceSlice'
  | 'DeviceTaintRule'
  | 'ServiceAccount'
  | 'Role'
  | 'RoleBinding'
  | 'ClusterRole'
  | 'ClusterRoleBinding'
  | 'CustomResourceDefinition'
  | 'HorizontalPodAutoscaler'
  | 'Event'

export type ScaleableWorkloadKind = 'Deployment' | 'StatefulSet' | 'ReplicaSet' | 'ReplicationController'

export type RolloutWorkloadKind = 'Deployment' | 'DaemonSet' | 'StatefulSet'

export type WorkloadImageKind = 'Deployment' | 'DaemonSet' | 'StatefulSet'

export type PausableWorkloadKind = 'Deployment'

export type JobSuspensionKind = 'Job' | 'CronJob'

export type RolloutResult = {
  success: boolean
  message?: string
}

export type PodLogStreamRequest = {
  namespace: string
  podName: string
  containerName?: string
  tailLines?: number
  previous?: boolean
  timestamps?: boolean
}

export type PodLogStreamResult = {
  streamId: string
}

export type PodExecResult = {
  sessionId: string
}

export type PortForwardRequest = {
  namespace: string
  targetKind?: PortForwardTargetKind
  targetName?: string
  podName?: string
  serviceName?: string
  targetPort: number
  localPort?: number
}

export type PortForwardTargetKind = 'Pod' | 'Service'

export type PortForwardState = 'running' | 'stopped' | 'error'

export type PortForwardResult = {
  sessionId: string
  localPort: number
  message?: string
}

export type PortForwardSessionInfo = {
  sessionId: string
  contextId: string
  name: string
  targetKind: PortForwardTargetKind
  targetName: string
  namespace: string
  podName: string
  serviceName?: string
  localPort: number
  targetPort: number
  protocol: string
  state: PortForwardState
  startedAt: string
  message?: string
}

export type K7sPushEvent =
  | {
      type: 'watch'
      contextId: string
      resource: string
      phase: string
    }
  | {
      type: 'log:chunk'
      streamId: string
      chunk: string
    }
  | {
      type: 'log:end'
      streamId: string
      error?: string
    }
  | {
      type: 'exec:chunk'
      sessionId: string
      stream: 'stdout' | 'stderr'
      chunk: string
    }
  | {
      type: 'exec:end'
      sessionId: string
      message?: string
      error?: string
    }
  | {
      type: 'port-forward'
      sessionId: string
      contextId: string
      targetKind: PortForwardTargetKind
      targetName: string
      state: PortForwardState
      namespace: string
      podName: string
      serviceName?: string
      localPort: number
      targetPort: number
      protocol: string
      startedAt: string
      message?: string
    }

export type AddContextsResult = {
  contexts: ContextRecord[]
  addedIds: string[]
}

export type ResourceType =
  | 'overview'
  | 'workloads'
  | 'componentstatuses'
  | 'apigroups'
  | 'apiresources'
  | 'serverversions'
  | 'openidconfigs'
  | 'apiserverhealth'
  | 'selfsubjectreviews'
  | 'selfsubjectaccessreviews'
  | 'selfsubjectrulesreviews'
  | 'toppods'
  | 'topcontainers'
  | 'namespaces'
  | 'nodes'
  | 'pods'
  | 'deployments'
  | 'daemonsets'
  | 'statefulsets'
  | 'replicasets'
  | 'replicationcontrollers'
  | 'controllerrevisions'
  | 'podtemplates'
  | 'jobs'
  | 'cronjobs'
  | 'helmcharts'
  | 'helmreleases'
  | 'helmrepositories'
  | 'poddisruptionbudgets'
  | 'resourcequotas'
  | 'limitranges'
  | 'priorityclasses'
  | 'runtimeclasses'
  | 'leases'
  | 'leasecandidates'
  | 'services'
  | 'configmaps'
  | 'secrets'
  | 'endpoints'
  | 'portforwards'
  | 'ingresses'
  | 'ingressclasses'
  | 'networkpolicies'
  | 'ipaddresses'
  | 'servicecidrs'
  | 'endpointslices'
  | 'apiservices'
  | 'mutatingwebhookconfigurations'
  | 'validatingwebhookconfigurations'
  | 'mutatingadmissionpolicies'
  | 'mutatingadmissionpolicybindings'
  | 'validatingadmissionpolicies'
  | 'validatingadmissionpolicybindings'
  | 'flowschemas'
  | 'prioritylevelconfigurations'
  | 'certificatesigningrequests'
  | 'clustertrustbundles'
  | 'podcertificaterequests'
  | 'storageversions'
  | 'storageversionmigrations'
  | 'persistentvolumes'
  | 'persistentvolumeclaims'
  | 'storageclasses'
  | 'volumeattributesclasses'
  | 'csidrivers'
  | 'csinodes'
  | 'volumeattachments'
  | 'csistoragecapacities'
  | 'volumesnapshotclasses'
  | 'volumesnapshots'
  | 'volumesnapshotcontents'
  | 'gatewayclasses'
  | 'gateways'
  | 'httproutes'
  | 'grpcroutes'
  | 'tlsroutes'
  | 'tcproutes'
  | 'udproutes'
  | 'referencegrants'
  | 'deviceclasses'
  | 'resourceclaims'
  | 'resourceclaimtemplates'
  | 'resourceslices'
  | 'devicetaintrules'
  | 'serviceaccounts'
  | 'roles'
  | 'rolebindings'
  | 'clusterroles'
  | 'clusterrolebindings'
  | 'customresourcedefinitions'
  | 'customresources'
  | 'horizontalpodautoscalers'
  | 'events'

export type ContextGroup = {
  id: string
  name: string
  items: string[]
}

export type AppThemeName = 'aurora' | 'ocean' | 'forest' | 'ember' | 'graphite'

export type ContextPrefs = {
  customNames: Record<string, string>
  groups: ContextGroup[]
  ungrouped: string[]
  theme: AppThemeName
}

export interface K8sTermApi {
  create(contextId: string): Promise<{ shell: string; cwd: string }>
  write(data: string): void
  resize(cols: number, rows: number): void
  destroy(): void
  onData(callback: (data: string) => void): void
  onExit(callback: (exitCode: number) => void): void
}

// Form data types for CRUD operations
export type DeploymentFormData = {
  name: string
  namespace: string
  replicas: number
  image: string
  port: number
  targetPort: number
  protocol: string
  labels: Array<{ key: string; value: string }>
  env: Array<{ key: string; value: string }>
}

export type ServiceFormData = {
  name: string
  namespace: string
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  selector: Array<{ key: string; value: string }>
  port: number
  targetPort: number
  protocol: string
}

export type ConfigMapFormData = {
  name: string
  namespace: string
  data: Array<{ key: string; value: string }>
}

export type SecretFormData = {
  name: string
  namespace: string
  type: 'Opaque' | 'kubernetes.io/service-account-token' | 'kubernetes.io/dockercfg' | 'kubernetes.io/dockerconfigjson'
  data: Array<{ key: string; value: string }>
}

export type NamespaceFormData = {
  name: string
}

export type IngressFormData = {
  name: string
  namespace: string
  ingressClass?: string
  host: string
  serviceName: string
  servicePort: number
  tls: boolean
  tlsSecret?: string
}

export type PodExecData = {
  namespace: string
  podName: string
  containerName?: string
  command: string
}

declare global {
  interface Window {
    k8sTerm?: K8sTermApi
  }
}
