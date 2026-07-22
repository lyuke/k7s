import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import '@xterm/xterm/css/xterm.css'
import { useClusterStore, useUIStore, usePreferencesStore, useTerminalStore, useTerminalInit } from './store'
import type {
  APIServerHealthInfo,
  APIGroupInfo,
  APIResourceInfo,
  APIServiceInfo,
  AdmissionWebhookConfigurationInfo,
  AppThemeName,
  CertificateSigningRequestDecision,
  CertificateSigningRequestInfo,
  ClusterTrustBundleInfo,
  ComponentStatusInfo,
  ConfigMapInfo,
  ContextRecord,
  CSIDriverInfo,
  CSINodeInfo,
  CSIStorageCapacityInfo,
  CustomResourceDefinitionInfo,
  CustomResourceInstanceInfo,
  DeviceClassInfo,
  DeviceTaintRuleInfo,
  EventInfo,
  EndpointInfo,
  EndpointSliceInfo,
  FlowSchemaInfo,
  GatewayClassInfo,
  GatewayInfo,
  GRPCRouteInfo,
  HelmChartInfo,
  HelmRepositoryInfo,
  HelmReleaseInfo,
  HelmReleaseUpgradeRequest,
  HTTPRouteInfo,
  IngressClassInfo,
  IngressInfo,
  IPAddressInfo,
  CanIReviewRequest,
  JobSuspensionKind,
  K7sPushEvent,
  KubernetesResourceKind,
  LeaseCandidateInfo,
  LeaseInfo,
  MetadataField,
  MutatingAdmissionPolicyBindingInfo,
  MutatingAdmissionPolicyInfo,
  NamespaceInfo,
  NetworkPolicyInfo,
  NodeInfo,
  PodCertificateRequestInfo,
  PodInfo,
  OpenIDConfigurationInfo,
  PausableWorkloadKind,
  PortForwardSessionInfo,
  PriorityClassInfo,
  PriorityLevelConfigurationInfo,
  ResourceType,
  ResourceClaimInfo,
  ResourceClaimTemplateInfo,
  ResourceSliceInfo,
  ReferenceGrantInfo,
  RoleBindingInfo,
  RoleInfo,
  RolloutWorkloadKind,
  RuntimeClassInfo,
  ScaleableWorkloadKind,
  SecretInfo,
  SelfSubjectAccessReviewInfo,
  SelfSubjectReviewInfo,
  SelfSubjectRuleInfo,
  ServerVersionInfo,
  ServiceAccountInfo,
  ServiceCIDRInfo,
  ServiceInfo,
  StorageVersionInfo,
  StorageVersionMigrationInfo,
  TCPRouteInfo,
  TLSRouteInfo,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ValidatingAdmissionPolicyBindingInfo,
  ValidatingAdmissionPolicyInfo,
  UDPRouteInfo,
  VolumeAttachmentInfo,
  VolumeAttributesClassInfo,
  VolumeSnapshotClassInfo,
  VolumeSnapshotContentInfo,
  VolumeSnapshotInfo,
  WorkloadImageKind,
} from '../../shared/types'
import {
  NodeDetailModal,
  PodDetailModal,
  DeploymentDetailModal,
  GenericDetailModal,
  LogViewerModal,
  CreateResourceModal,
  YamlEditorModal,
  PodExecModal,
  PortForwardModal,
  type PortForwardTarget,
} from './components/Modals'
import { isWebMode, k8sApi } from './api/provider'
import { EmptyState, SortIcon } from './components/Clusters'
import { VirtualizedResourceTable } from './components/Resources'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type NoticeTone = 'info' | 'success' | 'error'
type NodeActionLoading = 'cordon' | 'uncordon' | 'drain' | 'delete'
type NoticeState = {
  tone: NoticeTone
  message: string
} | null
type RolloutOutputState = {
  title: string
  message: string
} | null
type TableField = {
  label: string
  field: string
}
type ActionSpec = {
  key: string
  label: string
  className: string
  onClick: () => void | Promise<void>
  title?: string
  disabled?: boolean
}
type TopContainerRow = {
  name: string
  namespace: string
  podName: string
  nodeName: string
  state: string
  restartCount: number
  ready: boolean
  cpu: string
  memory: string
  pod: PodInfo
}
type ThemeOption = {
  key: AppThemeName
  label: string
  description: string
  swatches: string[]
}
type SelectableWorkload = {
  name: string
  namespace: string
  selector?: Record<string, string>
}
type RolloutDetailWorkload = {
  name: string
  namespace: string
  replicas?: number
}
type MetadataMutationInput = {
  field: MetadataField
  key: string
  value: string
  remove: boolean
}
type LabelMutationInput = Pick<MetadataMutationInput, 'key' | 'value' | 'remove'>
type NodeLabelBatchModalProps = {
  open: boolean
  selectedNames: string[]
  value: string
  loading: boolean
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void | Promise<void>
}

const formatSource = (source: string) => (source === 'default' ? '默认配置' : source)

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`

const formatPortForwardStartedAt = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleTimeString()
}

const getNodeSchedulingStatus = (node: Pick<NodeInfo, 'unschedulable'>) => (
  node.unschedulable ? 'SchedulingDisabled' : 'SchedulingEnabled'
)

const getNodeSchedulingStatusClass = (node: Pick<NodeInfo, 'unschedulable'>) => (
  node.unschedulable ? 'scheduling-disabled' : 'ok'
)

const buildPodShellCommand = (pod: PodInfo) => {
  const containerName = pod.containers?.[0]?.name
  const containerArg = containerName ? ` -c ${shellQuote(containerName)}` : ''
  return `kubectl exec -it -n ${shellQuote(pod.namespace)} ${shellQuote(pod.name)}${containerArg} -- /bin/sh`
}

const buildPodAttachCommand = (pod: PodInfo) => {
  const containerName = pod.containers?.[0]?.name
  const containerArg = containerName ? ` -c ${shellQuote(containerName)}` : ''
  return `kubectl attach -it -n ${shellQuote(pod.namespace)} ${shellQuote(`pod/${pod.name}`)}${containerArg}`
}

const buildNodeShellCommand = (node: NodeInfo) => (
  `kubectl debug ${shellQuote(`node/${node.name}`)} -it --image=busybox -- chroot /host sh`
)

const parseMetadataMutationInput = (input: string): MetadataMutationInput | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const [fieldToken, ...rest] = trimmed.split(/\s+/)
  const normalizedField = fieldToken.toLowerCase()
  const field = ['annotation', 'annotations', 'annotate', 'anno', 'a'].includes(normalizedField)
    ? 'annotations'
    : ['label', 'labels', 'l'].includes(normalizedField)
      ? 'labels'
      : null
  if (!field || rest.length === 0) return null

  const mutation = rest.join(' ').trim()
  if (!mutation) return null
  if (!mutation.includes('=') && mutation.endsWith('-')) {
    const key = mutation.slice(0, -1).trim()
    return key ? { field, key, value: '', remove: true } : null
  }

  const separatorIndex = mutation.indexOf('=')
  if (separatorIndex <= 0) return null
  const key = mutation.slice(0, separatorIndex).trim()
  const value = mutation.slice(separatorIndex + 1)
  return key ? { field, key, value, remove: false } : null
}

const parseNodeLabelMutationInput = (input: string): LabelMutationInput[] | null => {
  const tokens = input
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !['label', 'labels'].includes(token.toLowerCase()))

  if (tokens.length === 0) return null

  const mutations = new Map<string, LabelMutationInput>()
  for (const token of tokens) {
    if (!token.includes('=') && token.endsWith('-')) {
      const key = token.slice(0, -1).trim()
      if (!key) return null
      mutations.set(key, { key, value: '', remove: true })
      continue
    }

    const separatorIndex = token.indexOf('=')
    if (separatorIndex <= 0) return null
    const key = token.slice(0, separatorIndex).trim()
    const value = token.slice(separatorIndex + 1)
    if (!key) return null
    mutations.set(key, { key, value, remove: false })
  }

  return Array.from(mutations.values())
}

const NodeLabelBatchModal = ({
  open,
  selectedNames,
  value,
  loading,
  onChange,
  onClose,
  onSubmit,
}: NodeLabelBatchModalProps) => {
  if (!open) return null

  const previewNames = selectedNames.slice(0, 8)
  const hiddenCount = Math.max(selectedNames.length - previewNames.length, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content node-label-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>批量修改 Node Label</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-section-title">目标 Node ({selectedNames.length})</div>
            <div className="node-selection-list">
              {previewNames.map((name) => (
                <span key={name} className="node-selection-chip">{name}</span>
              ))}
              {hiddenCount > 0 && <span className="node-selection-chip more">+{hiddenCount}</span>}
            </div>
          </div>
          <div className="detail-section">
            <label className="form-label" htmlFor="node-label-batch-input">Labels</label>
            <textarea
              id="node-label-batch-input"
              className="label-textarea"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={'team=platform\nnode-role.kubernetes.io/worker=true'}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="create-btn secondary" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button
            type="button"
            className="create-btn"
            disabled={loading || selectedNames.length === 0}
            onClick={() => void onSubmit()}
          >
            {loading ? '应用中...' : '应用 Label'}
          </button>
        </div>
      </div>
    </div>
  )
}

const parseCanIInput = (input: string, defaultNamespace: string): CanIReviewRequest | null => {
  const tokens = input.trim().split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null

  const verb = tokens[0].toLowerCase()
  const target = tokens[1]
  const request: CanIReviewRequest = { verb }
  let namespace = defaultNamespace && defaultNamespace !== 'all' ? defaultNamespace : ''
  let clusterScope = false

  if (target.startsWith('/')) {
    request.nonResourceUrl = target
  } else if (target.includes('/')) {
    const [apiGroup, resource] = target.split('/', 2)
    request.apiGroup = apiGroup
    request.resource = resource
  } else {
    request.resource = target
  }

  for (let index = 2; index < tokens.length; index += 1) {
    const token = tokens[index]
    const nextValue = () => {
      index += 1
      return tokens[index]
    }

    if (token === '--cluster') {
      clusterScope = true
      namespace = ''
    } else if (token === '-n' || token === '--namespace') {
      namespace = nextValue() ?? ''
    } else if (token === '--group' || token === '--api-group') {
      request.apiGroup = nextValue() ?? ''
    } else if (token === '--subresource') {
      request.subresource = nextValue() ?? ''
    } else if (token === '--name' || token === '--resource-name') {
      request.resourceName = nextValue() ?? ''
    } else if (!token.startsWith('-') && !namespace) {
      namespace = token
    } else {
      return null
    }
  }

  if (request.nonResourceUrl) {
    return request.nonResourceUrl.startsWith('/') ? { verb, nonResourceUrl: request.nonResourceUrl } : null
  }

  if (!request.resource?.trim()) return null
  return {
    ...request,
    namespace: clusterScope ? undefined : namespace || undefined,
  }
}

const uniquePorts = (ports: Array<number | undefined>) => Array.from(new Set(
  ports.filter((port): port is number => port !== undefined && Number.isInteger(port) && port > 0),
))

const portForwardTargetForPod = (pod: PodInfo): PortForwardTarget => ({
  kind: 'Pod',
  name: pod.name,
  namespace: pod.namespace,
  ports: uniquePorts(pod.containers?.flatMap((container) => container.ports ?? []) ?? []),
})

const portForwardTargetForService = (service: ServiceInfo): PortForwardTarget => ({
  kind: 'Service',
  name: service.name,
  namespace: service.namespace,
  ports: uniquePorts(
    service.portDetails?.map((port) => port.port)
      ?? service.ports.split(',').map((port) => Number(port.trim().split(':')[0])),
  ),
})

const parseCpuMetric = (value?: string): number => {
  if (!value || value === '-') return 0
  const match = value.trim().match(/^([0-9.]+)(n|u|m|)?$/)
  if (!match) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0
  if (match[2] === 'n') return amount
  if (match[2] === 'u') return amount * 1000
  if (match[2] === 'm') return amount * 1000000
  return amount * 1000000000
}

const parseMemoryMetric = (value?: string): number => {
  if (!value || value === '-') return 0
  const match = value.trim().match(/^([0-9.]+)(Ki|Mi|Gi|Ti|Pi|Ei|K|M|G|T|P|E|B|)?$/)
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
  if (unit === 'B') return amount
  return amount * (binaryUnits[unit] ?? decimalUnits[unit] ?? 1)
}

const formatByteSize = (value?: number): string => {
  const bytes = typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
  if (bytes < 1024) return `${bytes} B`
  const units = [
    ['GiB', 1024 ** 3],
    ['MiB', 1024 ** 2],
    ['KiB', 1024],
  ] as const
  const unit = units.find(([, size]) => bytes >= size)
  if (!unit) return `${bytes} B`
  const amount = bytes / unit[1]
  return `${Number.isInteger(amount) ? amount : Number(amount.toFixed(1))} ${unit[0]}`
}

const metricBarWidth = (value?: string, kind: 'cpu' | 'memory' | 'disk' = 'cpu'): number => {
  if (!value || value === '-' || kind === 'disk') return 0
  const rank = kind === 'memory' ? parseMemoryMetric(value) : parseCpuMetric(value)
  if (!Number.isFinite(rank) || rank <= 0) return 0
  const scale = kind === 'memory' ? 1024 ** 3 : 1000000000
  return Math.max(10, Math.min(100, Math.round((rank / scale) * 18)))
}

const MetricUsageBar = ({
  value,
  kind = 'cpu',
}: {
  value?: string
  kind?: 'cpu' | 'memory' | 'disk'
}) => {
  const width = metricBarWidth(value, kind)
  const title = value && value !== '-' ? value : '未采集'

  return (
    <span className={`metric-bar ${width > 0 ? 'has-value' : 'empty'}`} title={title}>
      <span className="metric-bar-fill" style={{ width: `${width}%` }} />
    </span>
  )
}

const configValuePreview = (value: string): string => {
  const normalized = value.replace(/\r\n/g, '\n')
  if (!normalized) return '(empty)'
  return normalized.length > 240 ? `${normalized.slice(0, 240)}...` : normalized
}

const textByteSize = (value: string): number => new TextEncoder().encode(value).length

const metricRank = (value: unknown, field: string): number => {
  const text = typeof value === 'string' ? value : ''
  return field.toLowerCase().includes('memory') ? parseMemoryMetric(text) : parseCpuMetric(text)
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'aurora',
    label: '极光',
    description: '高对比深色，适合夜间巡检',
    swatches: ['#03080f', '#00d4ff', '#a855f7'],
  },
  {
    key: 'ocean',
    label: '深海',
    description: '冷静蓝绿，长时间查看更沉稳',
    swatches: ['#06111d', '#38bdf8', '#14b8a6'],
  },
  {
    key: 'forest',
    label: '松林',
    description: '低饱和绿金，突出健康状态',
    swatches: ['#07120d', '#34d399', '#f4c95d'],
  },
  {
    key: 'ember',
    label: '暖曜',
    description: '炭黑暖色，适合故障排查场景',
    swatches: ['#120b0b', '#fb7185', '#f59e0b'],
  },
  {
    key: 'graphite',
    label: '石墨',
    description: '浅色工作台，适合白天和投屏',
    swatches: ['#eef2f7', '#2563eb', '#10b981'],
  },
]

const RESOURCE_TYPE_GROUPS: { title: string; items: { key: ResourceType; label: string }[] }[] = [
  {
    title: 'Overview',
    items: [
      { key: 'overview', label: 'Overview' },
    ],
  },
  {
    title: 'Node',
    items: [
      { key: 'nodes', label: 'Nodes' },
    ],
  },
  {
    title: 'Workloads',
    items: [
      { key: 'workloads', label: 'Overview' },
      { key: 'pods', label: 'Pods' },
      { key: 'deployments', label: 'Deployments' },
      { key: 'daemonsets', label: 'Daemon Sets' },
      { key: 'statefulsets', label: 'Stateful Sets' },
      { key: 'replicasets', label: 'Replica Sets' },
      { key: 'replicationcontrollers', label: 'Replication Controllers' },
      { key: 'jobs', label: 'Jobs' },
      { key: 'cronjobs', label: 'Cron Jobs' },
      { key: 'toppods', label: 'Top Pods' },
      { key: 'topcontainers', label: 'Top Containers' },
      { key: 'controllerrevisions', label: 'Controller Revisions' },
      { key: 'podtemplates', label: 'Pod Templates' },
      { key: 'helmcharts', label: 'Helm Charts' },
      { key: 'helmreleases', label: 'Helm Releases' },
      { key: 'helmrepositories', label: 'Helm Repositories' },
      { key: 'horizontalpodautoscalers', label: 'HPA' },
      { key: 'poddisruptionbudgets', label: 'PDB' },
    ],
  },
  {
    title: 'Config',
    items: [
      { key: 'configmaps', label: 'Config Maps' },
      { key: 'secrets', label: 'Secrets' },
      { key: 'serviceaccounts', label: 'Service Accounts' },
      { key: 'resourcequotas', label: 'Resource Quotas' },
      { key: 'limitranges', label: 'Limit Ranges' },
      { key: 'priorityclasses', label: 'Priority Classes' },
      { key: 'runtimeclasses', label: 'Runtime Classes' },
      { key: 'leases', label: 'Lease' },
      { key: 'leasecandidates', label: 'LeaseCandidate' },
    ],
  },
  {
    title: 'Network',
    items: [
      { key: 'services', label: 'Services' },
      { key: 'endpoints', label: 'Endpoints' },
      { key: 'portforwards', label: 'PortForwarding' },
      { key: 'ingresses', label: 'Ingress' },
      { key: 'ingressclasses', label: 'IngressClass' },
      { key: 'gatewayclasses', label: 'GatewayClass' },
      { key: 'gateways', label: 'Gateway' },
      { key: 'httproutes', label: 'HTTPRoute' },
      { key: 'grpcroutes', label: 'GRPCRoute' },
      { key: 'tlsroutes', label: 'TLSRoute' },
      { key: 'tcproutes', label: 'TCPRoute' },
      { key: 'udproutes', label: 'UDPRoute' },
      { key: 'referencegrants', label: 'ReferenceGrant' },
      { key: 'networkpolicies', label: 'NetworkPolicy' },
      { key: 'ipaddresses', label: 'IPAddress' },
      { key: 'servicecidrs', label: 'ServiceCIDR' },
      { key: 'endpointslices', label: 'EndpointSlice' },
    ],
  },
  {
    title: 'Storage',
    items: [
      { key: 'persistentvolumes', label: 'Persistent Volumes' },
      { key: 'persistentvolumeclaims', label: 'Persistent Volume Claims' },
      { key: 'storageclasses', label: 'Storage Classes' },
      { key: 'volumeattributesclasses', label: 'VolumeAttributesClass' },
      { key: 'csidrivers', label: 'CSIDriver' },
      { key: 'csinodes', label: 'CSINode' },
      { key: 'volumeattachments', label: 'VolumeAttachment' },
      { key: 'csistoragecapacities', label: 'CSIStorageCapacity' },
      { key: 'volumesnapshotclasses', label: 'VolumeSnapshotClass' },
      { key: 'volumesnapshots', label: 'VolumeSnapshot' },
      { key: 'volumesnapshotcontents', label: 'VolumeSnapshotContent' },
      { key: 'deviceclasses', label: 'DeviceClass' },
      { key: 'devicetaintrules', label: 'DeviceTaintRule' },
      { key: 'resourceclaims', label: 'ResourceClaim' },
      { key: 'resourceclaimtemplates', label: 'ResourceClaimTemplate' },
      { key: 'resourceslices', label: 'ResourceSlice' },
    ],
  },
  {
    title: 'Namespace',
    items: [
      { key: 'namespaces', label: 'Namespaces' },
    ],
  },
  {
    title: 'System',
    items: [
      { key: 'componentstatuses', label: 'ComponentStatus' },
      { key: 'apigroups', label: 'APIGroup' },
      { key: 'apiresources', label: 'APIResource' },
      { key: 'serverversions', label: 'ServerVersion' },
      { key: 'openidconfigs', label: 'OpenIDConfiguration' },
      { key: 'apiserverhealth', label: 'APIServerHealth' },
      { key: 'apiservices', label: 'APIService' },
      { key: 'mutatingwebhookconfigurations', label: 'MutatingWebhook' },
      { key: 'validatingwebhookconfigurations', label: 'ValidatingWebhook' },
      { key: 'mutatingadmissionpolicies', label: 'MutatingPolicy' },
      { key: 'mutatingadmissionpolicybindings', label: 'MutatingBinding' },
      { key: 'validatingadmissionpolicies', label: 'ValidatingPolicy' },
      { key: 'validatingadmissionpolicybindings', label: 'ValidatingBinding' },
      { key: 'flowschemas', label: 'FlowSchema' },
      { key: 'prioritylevelconfigurations', label: 'PriorityLevel' },
      { key: 'certificatesigningrequests', label: 'CSR' },
      { key: 'clustertrustbundles', label: 'ClusterTrustBundle' },
      { key: 'podcertificaterequests', label: 'PodCertificateRequest' },
      { key: 'storageversions', label: 'StorageVersion' },
      { key: 'storageversionmigrations', label: 'StorageVersionMigration' },
      { key: 'roles', label: 'Role' },
      { key: 'rolebindings', label: 'RoleBinding' },
      { key: 'clusterroles', label: 'ClusterRole' },
      { key: 'clusterrolebindings', label: 'ClusterRoleBinding' },
      { key: 'selfsubjectreviews', label: 'SelfSubjectReview' },
      { key: 'selfsubjectaccessreviews', label: 'SelfSubjectAccessReview' },
      { key: 'selfsubjectrulesreviews', label: 'SelfSubjectRulesReview' },
      { key: 'customresourcedefinitions', label: 'CRD' },
      { key: 'customresources', label: 'CustomResource' },
    ],
  },
  {
    title: 'Events',
    items: [
      { key: 'events', label: 'Events' },
    ],
  },
]

const RESOURCE_TYPES = RESOURCE_TYPE_GROUPS.flatMap((group) => group.items)

const RESOURCE_GROUP_ICONS: Record<string, string> = {
  Overview: '▦',
  Node: '◎',
  Workloads: '◈',
  Config: '⚙',
  Network: '↕',
  Storage: '▰',
  Namespace: '◇',
  System: '◒',
  Events: '!',
  事件: '!',
}

const NAMESPACE_FILTER_EXCLUDED_TYPES = new Set<ResourceType>([
  'overview',
  'workloads',
  'nodes',
  'namespaces',
  'componentstatuses',
  'apigroups',
  'apiresources',
  'serverversions',
  'openidconfigs',
  'apiserverhealth',
  'apiservices',
  'priorityclasses',
  'runtimeclasses',
  'persistentvolumes',
  'storageclasses',
  'volumeattributesclasses',
  'csidrivers',
  'csinodes',
  'volumeattachments',
  'gatewayclasses',
  'ingressclasses',
  'clusterroles',
  'clusterrolebindings',
  'certificatesigningrequests',
  'clustertrustbundles',
  'storageversions',
  'storageversionmigrations',
  'customresourcedefinitions',
])

const formatContextMeta = (context: ContextRecord) => [
  formatSource(context.source),
  context.cluster,
  context.namespace ? `ns:${context.namespace}` : '',
  context.current ? '当前' : '',
].filter(Boolean).join(' · ')

const getContextInitials = (name: string) => {
  const normalized = name.trim()
  if (!normalized) return 'K7'
  const parts = normalized.split(/[-_\s.]+/).filter(Boolean)
  const initials = parts.length > 1
    ? parts.slice(0, 2).map((part) => part[0]).join('')
    : normalized.slice(0, 2)
  return initials.toUpperCase()
}

const getNodeWarningCount = (node: NodeInfo) => (
  node.conditions?.filter((condition) => (
    condition.type !== 'Ready' && condition.status !== 'False'
  )).length ?? 0
)

interface ClusterCardProps {
  context: ContextRecord
  isActive: boolean
  nodeCount: number
  podCount: number
  status: LoadState
  onClick: () => void
}

interface SummaryCardProps {
  label: string
  value: string | number
  detail: string
  tone?: 'default' | 'ready' | 'warn' | 'error'
}

const ClusterCard = ({ context, isActive, nodeCount, podCount, status, onClick }: ClusterCardProps) => {
  const getStatusClass = () => {
    if (status === 'loading') return 'loading'
    if (status === 'ready') return 'ready'
    if (status === 'error') return 'error'
    return ''
  }

  return (
    <div className={`cluster-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="cluster-card-source">{formatSource(context.source)}</div>
      <div className="cluster-card-header">
        <div>
          <div className="cluster-card-title">{context.name}</div>
          <div className="cluster-card-subtitle">{formatContextMeta(context)}</div>
        </div>
        <div className={`cluster-status-indicator ${getStatusClass()}`} />
      </div>
      <div className="cluster-card-stats">
        <div className="cluster-stat">
          <div className="cluster-stat-value">{nodeCount}</div>
          <div className="cluster-stat-label">节点</div>
        </div>
        <div className="cluster-stat">
          <div className="cluster-stat-value">{podCount}</div>
          <div className="cluster-stat-label">Pod</div>
        </div>
      </div>
    </div>
  )
}

const SummaryCard = ({ label, value, detail, tone = 'default' }: SummaryCardProps) => (
  <div className={`summary-card ${tone}`}>
    <div className="summary-card-label">{label}</div>
    <div className="summary-card-value">{value}</div>
    <div className="summary-card-detail">{detail}</div>
  </div>
)

const SettingsModal = ({
  currentTheme,
  onSelectTheme,
  onClose,
}: {
  currentTheme: AppThemeName
  onSelectTheme: (theme: AppThemeName) => void
  onClose: () => void
}) => (
  <div className="modal-overlay settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div className="modal-content settings-modal">
      <div className="modal-header">
        <div>
          <h2 id="settings-title">设置</h2>
          <div className="settings-subtitle">界面配色会自动保存到本机配置</div>
        </div>
        <button className="modal-close" onClick={onClose} title="关闭设置">×</button>
      </div>
      <div className="modal-body settings-body">
        <div className="settings-section-title">配色方案</div>
        <div className="theme-grid">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.key}
              className={`theme-option ${currentTheme === theme.key ? 'active' : ''}`}
              onClick={() => onSelectTheme(theme.key)}
              aria-pressed={currentTheme === theme.key}
            >
              <span className="theme-preview" aria-hidden="true">
                {theme.swatches.map((swatch) => (
                  <span key={swatch} style={{ background: swatch }} />
                ))}
              </span>
              <span className="theme-option-copy">
                <span className="theme-option-title">{theme.label}</span>
                <span className="theme-option-desc">{theme.description}</span>
              </span>
              <span className="theme-option-check">{currentTheme === theme.key ? '已启用' : '切换'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const RolloutOutputModal = ({
  output,
  onClose,
}: {
  output: RolloutOutputState
  onClose: () => void
}) => {
  if (!output) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rollout-output-title" onClick={onClose}>
      <div className="modal-content rollout-output-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id="rollout-output-title">{output.title}</h2>
          <button className="modal-close" onClick={onClose} title="关闭">×</button>
        </div>
        <div className="modal-body rollout-output-body">
          <pre className="rollout-output-content">{output.message}</pre>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  // Cluster store
  const contexts = useClusterStore((s) => s.contexts)
  const selectedId = useClusterStore((s) => s.selectedId)
  const namespaces = useClusterStore((s) => s.namespaces)
  const selectedNamespaces = useClusterStore((s) => s.selectedNamespaces)
  const componentStatuses = useClusterStore((s) => s.componentStatuses)
  const apiGroups = useClusterStore((s) => s.apiGroups)
  const apiResources = useClusterStore((s) => s.apiResources)
  const serverVersions = useClusterStore((s) => s.serverVersions)
  const openIDConfigurations = useClusterStore((s) => s.openIDConfigurations)
  const apiServerHealth = useClusterStore((s) => s.apiServerHealth)
  const selfSubjectReviews = useClusterStore((s) => s.selfSubjectReviews)
  const selfSubjectAccessReviews = useClusterStore((s) => s.selfSubjectAccessReviews)
  const selfSubjectRulesReviews = useClusterStore((s) => s.selfSubjectRulesReviews)
  const nodes = useClusterStore((s) => s.nodes)
  const pods = useClusterStore((s) => s.pods)
  const deployments = useClusterStore((s) => s.deployments)
  const daemonSets = useClusterStore((s) => s.daemonSets)
  const statefulSets = useClusterStore((s) => s.statefulSets)
  const replicaSets = useClusterStore((s) => s.replicaSets)
  const replicationControllers = useClusterStore((s) => s.replicationControllers)
  const controllerRevisions = useClusterStore((s) => s.controllerRevisions)
  const podTemplates = useClusterStore((s) => s.podTemplates)
  const jobs = useClusterStore((s) => s.jobs)
  const cronJobs = useClusterStore((s) => s.cronJobs)
  const helmCharts = useClusterStore((s) => s.helmCharts)
  const helmReleases = useClusterStore((s) => s.helmReleases)
  const helmRepositories = useClusterStore((s) => s.helmRepositories)
  const services = useClusterStore((s) => s.services)
  const configMaps = useClusterStore((s) => s.configMaps)
  const secrets = useClusterStore((s) => s.secrets)
  const endpoints = useClusterStore((s) => s.endpoints)
  const leases = useClusterStore((s) => s.leases)
  const leaseCandidates = useClusterStore((s) => s.leaseCandidates)
  const ingresses = useClusterStore((s) => s.ingresses)
  const ingressClasses = useClusterStore((s) => s.ingressClasses)
  const networkPolicies = useClusterStore((s) => s.networkPolicies)
  const ipAddresses = useClusterStore((s) => s.ipAddresses)
  const serviceCIDRs = useClusterStore((s) => s.serviceCIDRs)
  const endpointSlices = useClusterStore((s) => s.endpointSlices)
  const apiServices = useClusterStore((s) => s.apiServices)
  const mutatingWebhookConfigurations = useClusterStore((s) => s.mutatingWebhookConfigurations)
  const validatingWebhookConfigurations = useClusterStore((s) => s.validatingWebhookConfigurations)
  const mutatingAdmissionPolicies = useClusterStore((s) => s.mutatingAdmissionPolicies)
  const mutatingAdmissionPolicyBindings = useClusterStore((s) => s.mutatingAdmissionPolicyBindings)
  const validatingAdmissionPolicies = useClusterStore((s) => s.validatingAdmissionPolicies)
  const validatingAdmissionPolicyBindings = useClusterStore((s) => s.validatingAdmissionPolicyBindings)
  const flowSchemas = useClusterStore((s) => s.flowSchemas)
  const priorityLevelConfigurations = useClusterStore((s) => s.priorityLevelConfigurations)
  const certificateSigningRequests = useClusterStore((s) => s.certificateSigningRequests)
  const clusterTrustBundles = useClusterStore((s) => s.clusterTrustBundles)
  const podCertificateRequests = useClusterStore((s) => s.podCertificateRequests)
  const storageVersions = useClusterStore((s) => s.storageVersions)
  const storageVersionMigrations = useClusterStore((s) => s.storageVersionMigrations)
  const podDisruptionBudgets = useClusterStore((s) => s.podDisruptionBudgets)
  const resourceQuotas = useClusterStore((s) => s.resourceQuotas)
  const limitRanges = useClusterStore((s) => s.limitRanges)
  const priorityClasses = useClusterStore((s) => s.priorityClasses)
  const runtimeClasses = useClusterStore((s) => s.runtimeClasses)
  const persistentVolumes = useClusterStore((s) => s.persistentVolumes)
  const persistentVolumeClaims = useClusterStore((s) => s.persistentVolumeClaims)
  const storageClasses = useClusterStore((s) => s.storageClasses)
  const volumeAttributesClasses = useClusterStore((s) => s.volumeAttributesClasses)
  const csiDrivers = useClusterStore((s) => s.csiDrivers)
  const csiNodes = useClusterStore((s) => s.csiNodes)
  const volumeAttachments = useClusterStore((s) => s.volumeAttachments)
  const csiStorageCapacities = useClusterStore((s) => s.csiStorageCapacities)
  const volumeSnapshotClasses = useClusterStore((s) => s.volumeSnapshotClasses)
  const volumeSnapshots = useClusterStore((s) => s.volumeSnapshots)
  const volumeSnapshotContents = useClusterStore((s) => s.volumeSnapshotContents)
  const gatewayClasses = useClusterStore((s) => s.gatewayClasses)
  const gateways = useClusterStore((s) => s.gateways)
  const httpRoutes = useClusterStore((s) => s.httpRoutes)
  const grpcRoutes = useClusterStore((s) => s.grpcRoutes)
  const tlsRoutes = useClusterStore((s) => s.tlsRoutes)
  const tcpRoutes = useClusterStore((s) => s.tcpRoutes)
  const udpRoutes = useClusterStore((s) => s.udpRoutes)
  const referenceGrants = useClusterStore((s) => s.referenceGrants)
  const deviceClasses = useClusterStore((s) => s.deviceClasses)
  const deviceTaintRules = useClusterStore((s) => s.deviceTaintRules)
  const resourceClaims = useClusterStore((s) => s.resourceClaims)
  const resourceClaimTemplates = useClusterStore((s) => s.resourceClaimTemplates)
  const resourceSlices = useClusterStore((s) => s.resourceSlices)
  const serviceAccounts = useClusterStore((s) => s.serviceAccounts)
  const roles = useClusterStore((s) => s.roles)
  const roleBindings = useClusterStore((s) => s.roleBindings)
  const clusterRoles = useClusterStore((s) => s.clusterRoles)
  const clusterRoleBindings = useClusterStore((s) => s.clusterRoleBindings)
  const customResourceDefinitions = useClusterStore((s) => s.customResourceDefinitions)
  const hpas = useClusterStore((s) => s.hpas)
  const events = useClusterStore((s) => s.events)
  const clusterHealth = useClusterStore((s) => s.clusterHealth)
  const status = useClusterStore((s) => s.status)
  const error = useClusterStore((s) => s.error)
  const isRefreshing = useClusterStore((s) => s.isRefreshing)
  const lastRefreshTime = useClusterStore((s) => s.lastRefreshTime)
  const selectedContext = useClusterStore((s) => s.selectedContext)
  const loadContexts = useClusterStore((s) => s.loadContexts)
  const refreshAll = useClusterStore((s) => s.refreshAll)
  const selectContext = useClusterStore((s) => s.selectContext)
  const useKubeContextAction = useClusterStore((s) => s.useKubeContext)
  const setKubeContextNamespaceAction = useClusterStore((s) => s.setKubeContextNamespace)
  const setSelectedNamespaces = useClusterStore((s) => s.setSelectedNamespaces)
  const handleAdd = useClusterStore((s) => s.handleAdd)
  const handleManualRefresh = useClusterStore((s) => s.handleManualRefresh)

  // UI store
  const searchText = useUIStore((s) => s.searchText)
  const sortField = useUIStore((s) => s.sortField)
  const sortDirection = useUIStore((s) => s.sortDirection)
  const refreshInterval = useUIStore((s) => s.refreshInterval)
  const selectedResourceType = useUIStore((s) => s.selectedResourceType)
  const setSearchText = useUIStore((s) => s.setSearchText)
  const setRefreshInterval = useUIStore((s) => s.setRefreshInterval)
  const setSelectedResourceType = useUIStore((s) => s.setSelectedResourceType)
  const sortData = useUIStore((s) => s.sortData)
  const filterData = useUIStore((s) => s.filterData)
  const handleSort = useUIStore((s) => s.handleSort)

  // Detail modal states
  const selectedNode = useUIStore((s) => s.selectedNode)
  const nodeDetailLoading = useUIStore((s) => s.nodeDetailLoading)
  const nodeMetrics = useUIStore((s) => s.nodeMetrics)
  const nodeMetricsLoading = useUIStore((s) => s.nodeMetricsLoading)
  const selectedPod = useUIStore((s) => s.selectedPod)
  const podDetailLoading = useUIStore((s) => s.podDetailLoading)
  const podDetailError = useUIStore((s) => s.podDetailError)
  const selectedPodForLogs = useUIStore((s) => s.selectedPodForLogs)
  const selectedDeployment = useUIStore((s) => s.selectedDeployment)
  const deploymentDetailLoading = useUIStore((s) => s.deploymentDetailLoading)
  const selectedDaemonSet = useUIStore((s) => s.selectedDaemonSet)
  const daemonSetDetailLoading = useUIStore((s) => s.daemonSetDetailLoading)
  const selectedStatefulSet = useUIStore((s) => s.selectedStatefulSet)
  const statefulSetDetailLoading = useUIStore((s) => s.statefulSetDetailLoading)
  const selectedReplicaSet = useUIStore((s) => s.selectedReplicaSet)
  const replicaSetDetailLoading = useUIStore((s) => s.replicaSetDetailLoading)
  const selectedReplicationController = useUIStore((s) => s.selectedReplicationController)
  const replicationControllerDetailLoading = useUIStore((s) => s.replicationControllerDetailLoading)
  const selectedJob = useUIStore((s) => s.selectedJob)
  const jobDetailLoading = useUIStore((s) => s.jobDetailLoading)
  const selectedCronJob = useUIStore((s) => s.selectedCronJob)
  const cronJobDetailLoading = useUIStore((s) => s.cronJobDetailLoading)
  const selectedHPA = useUIStore((s) => s.selectedHPA)
  const selectedPodDisruptionBudget = useUIStore((s) => s.selectedPodDisruptionBudget)
  const selectedResourceQuota = useUIStore((s) => s.selectedResourceQuota)
  const selectedLimitRange = useUIStore((s) => s.selectedLimitRange)
  const selectedPersistentVolume = useUIStore((s) => s.selectedPersistentVolume)
  const selectedPersistentVolumeClaim = useUIStore((s) => s.selectedPersistentVolumeClaim)
  const selectedStorageClass = useUIStore((s) => s.selectedStorageClass)
  const handleNodeClick = useUIStore((s) => s.handleNodeClick)
  const handleCloseNodeDetail = useUIStore((s) => s.handleCloseNodeDetail)
  const handlePodClick = useUIStore((s) => s.handlePodClick)
  const handleClosePodDetail = useUIStore((s) => s.handleClosePodDetail)
  const handleOpenPodLogs = useUIStore((s) => s.handleOpenPodLogs)
  const handleClosePodLogs = useUIStore((s) => s.handleClosePodLogs)
  const handleDeploymentClick = useUIStore((s) => s.handleDeploymentClick)
  const handleCloseDeploymentDetail = useUIStore((s) => s.handleCloseDeploymentDetail)
  const handleDaemonSetClick = useUIStore((s) => s.handleDaemonSetClick)
  const handleCloseDaemonSetDetail = useUIStore((s) => s.handleCloseDaemonSetDetail)
  const handleStatefulSetClick = useUIStore((s) => s.handleStatefulSetClick)
  const handleCloseStatefulSetDetail = useUIStore((s) => s.handleCloseStatefulSetDetail)
  const handleReplicaSetClick = useUIStore((s) => s.handleReplicaSetClick)
  const handleCloseReplicaSetDetail = useUIStore((s) => s.handleCloseReplicaSetDetail)
  const handleReplicationControllerClick = useUIStore((s) => s.handleReplicationControllerClick)
  const handleCloseReplicationControllerDetail = useUIStore((s) => s.handleCloseReplicationControllerDetail)
  const handleJobClick = useUIStore((s) => s.handleJobClick)
  const handleCloseJobDetail = useUIStore((s) => s.handleCloseJobDetail)
  const handleCronJobClick = useUIStore((s) => s.handleCronJobClick)
  const handleCloseCronJobDetail = useUIStore((s) => s.handleCloseCronJobDetail)
  const setSelectedHPA = useUIStore((s) => s.setSelectedHPA)
  const handleCloseHPADetail = useUIStore((s) => s.handleCloseHPADetail)
  const setSelectedPodDisruptionBudget = useUIStore((s) => s.setSelectedPodDisruptionBudget)
  const handleClosePodDisruptionBudgetDetail = useUIStore((s) => s.handleClosePodDisruptionBudgetDetail)
  const setSelectedResourceQuota = useUIStore((s) => s.setSelectedResourceQuota)
  const handleCloseResourceQuotaDetail = useUIStore((s) => s.handleCloseResourceQuotaDetail)
  const setSelectedLimitRange = useUIStore((s) => s.setSelectedLimitRange)
  const handleCloseLimitRangeDetail = useUIStore((s) => s.handleCloseLimitRangeDetail)
  const setSelectedPersistentVolume = useUIStore((s) => s.setSelectedPersistentVolume)
  const handleClosePersistentVolumeDetail = useUIStore((s) => s.handleClosePersistentVolumeDetail)
  const setSelectedPersistentVolumeClaim = useUIStore((s) => s.setSelectedPersistentVolumeClaim)
  const handleClosePersistentVolumeClaimDetail = useUIStore((s) => s.handleClosePersistentVolumeClaimDetail)
  const setSelectedStorageClass = useUIStore((s) => s.setSelectedStorageClass)
  const handleCloseStorageClassDetail = useUIStore((s) => s.handleCloseStorageClassDetail)
  const isCreateModalOpen = useUIStore((s) => s.isCreateModalOpen)
  const setIsCreateModalOpen = useUIStore((s) => s.setIsCreateModalOpen)
  const setIsYamlEditorOpen = useUIStore((s) => s.setIsYamlEditorOpen)
  const isYamlEditorOpen = useUIStore((s) => s.isYamlEditorOpen)
  const yamlEditorMode = useUIStore((s) => s.yamlEditorMode)
  const yamlEditorResource = useUIStore((s) => s.yamlEditorResource)

  // Preferences store
  const contextPrefs = usePreferencesStore((s) => s.contextPrefs)
  const appTheme = usePreferencesStore((s) => s.appTheme)
  const editingContextId = usePreferencesStore((s) => s.editingContextId)
  const editingName = usePreferencesStore((s) => s.editingName)
  const isAddingGroup = usePreferencesStore((s) => s.isAddingGroup)
  const newGroupName = usePreferencesStore((s) => s.newGroupName)
  const setEditingName = usePreferencesStore((s) => s.setEditingName)
  const setNewGroupName = usePreferencesStore((s) => s.setNewGroupName)
  const getDisplayName = usePreferencesStore((s) => s.getDisplayName)
  const loadContextPrefs = usePreferencesStore((s) => s.loadContextPrefs)
  const updateAppTheme = usePreferencesStore((s) => s.updateAppTheme)
  const submitRename = usePreferencesStore((s) => s.submitRename)
  const handleRenameKey = usePreferencesStore((s) => s.handleRenameKey)
  const beginRename = usePreferencesStore((s) => s.beginRename)
  const handleAddGroup = usePreferencesStore((s) => s.handleAddGroup)
  const handleConfirmAddGroup = usePreferencesStore((s) => s.handleConfirmAddGroup)
  const handleCancelAddGroup = usePreferencesStore((s) => s.handleCancelAddGroup)
  const allowDragOver = usePreferencesStore((s) => s.allowDragOver)
  const startDrag = usePreferencesStore((s) => s.startDrag)
  const dropOnItem = usePreferencesStore((s) => s.dropOnItem)
  const dropOnGroup = usePreferencesStore((s) => s.dropOnGroup)

  // Terminal store
  const showTerminal = useTerminalStore((s) => s.showTerminal)
  const terminalAvailable = useTerminalStore((s) => s.terminalAvailable)
  const toggleTerminal = useTerminalStore((s) => s.toggleTerminal)
  const setShowTerminal = useTerminalStore((s) => s.setShowTerminal)
  const openTerminalWithCommand = useTerminalStore((s) => s.openTerminalWithCommand)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Initialize terminal
  useTerminalInit(showTerminal, selectedId, terminalRef)

  // Local state
  const [isAdding, setIsAdding] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [rolloutOutput, setRolloutOutput] = useState<RolloutOutputState>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [watchConnected, setWatchConnected] = useState(false)
  const [nodeActionLoading, setNodeActionLoading] = useState<NodeActionLoading | null>(null)
  const [selectedNodeNames, setSelectedNodeNames] = useState<string[]>([])
  const [isNodeLabelModalOpen, setIsNodeLabelModalOpen] = useState(false)
  const [nodeLabelDraft, setNodeLabelDraft] = useState('')
  const [nodeLabelLoading, setNodeLabelLoading] = useState(false)
  const [selectedPodForExec, setSelectedPodForExec] = useState<typeof pods[number] | null>(null)
  const [selectedPortForwardTarget, setSelectedPortForwardTarget] = useState<PortForwardTarget | null>(null)
  const [portForwardSessions, setPortForwardSessions] = useState<PortForwardSessionInfo[]>([])
  const [selectedComponentStatus, setSelectedComponentStatus] = useState<ComponentStatusInfo | null>(null)
  const [selectedAPIGroup, setSelectedAPIGroup] = useState<APIGroupInfo | null>(null)
  const [selectedAPIResource, setSelectedAPIResource] = useState<APIResourceInfo | null>(null)
  const [selectedServerVersion, setSelectedServerVersion] = useState<ServerVersionInfo | null>(null)
  const [selectedOpenIDConfiguration, setSelectedOpenIDConfiguration] =
    useState<OpenIDConfigurationInfo | null>(null)
  const [selectedAPIServerHealth, setSelectedAPIServerHealth] = useState<APIServerHealthInfo | null>(null)
  const [selectedNamespaceResource, setSelectedNamespaceResource] = useState<NamespaceInfo | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null)
  const [selectedConfigMap, setSelectedConfigMap] = useState<ConfigMapInfo | null>(null)
  const [selectedSecret, setSelectedSecret] = useState<SecretInfo | null>(null)
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointInfo | null>(null)
  const [selectedIngress, setSelectedIngress] = useState<IngressInfo | null>(null)
  const [selectedIngressClass, setSelectedIngressClass] = useState<IngressClassInfo | null>(null)
  const [selectedNetworkPolicy, setSelectedNetworkPolicy] = useState<NetworkPolicyInfo | null>(null)
  const [selectedIPAddress, setSelectedIPAddress] = useState<IPAddressInfo | null>(null)
  const [selectedServiceCIDR, setSelectedServiceCIDR] = useState<ServiceCIDRInfo | null>(null)
  const [selectedEndpointSlice, setSelectedEndpointSlice] = useState<EndpointSliceInfo | null>(null)
  const [selectedAPIService, setSelectedAPIService] = useState<APIServiceInfo | null>(null)
  const [selectedMutatingWebhookConfig, setSelectedMutatingWebhookConfig] =
    useState<AdmissionWebhookConfigurationInfo | null>(null)
  const [selectedValidatingWebhookConfig, setSelectedValidatingWebhookConfig] =
    useState<AdmissionWebhookConfigurationInfo | null>(null)
  const [selectedMutatingAdmissionPolicy, setSelectedMutatingAdmissionPolicy] =
    useState<MutatingAdmissionPolicyInfo | null>(null)
  const [selectedMutatingAdmissionPolicyBinding, setSelectedMutatingAdmissionPolicyBinding] =
    useState<MutatingAdmissionPolicyBindingInfo | null>(null)
  const [selectedValidatingAdmissionPolicy, setSelectedValidatingAdmissionPolicy] =
    useState<ValidatingAdmissionPolicyInfo | null>(null)
  const [selectedValidatingAdmissionPolicyBinding, setSelectedValidatingAdmissionPolicyBinding] =
    useState<ValidatingAdmissionPolicyBindingInfo | null>(null)
  const [selectedFlowSchema, setSelectedFlowSchema] = useState<FlowSchemaInfo | null>(null)
  const [selectedPriorityLevel, setSelectedPriorityLevel] = useState<PriorityLevelConfigurationInfo | null>(null)
  const [selectedCertificateSigningRequest, setSelectedCertificateSigningRequest] =
    useState<CertificateSigningRequestInfo | null>(null)
  const [selectedClusterTrustBundle, setSelectedClusterTrustBundle] = useState<ClusterTrustBundleInfo | null>(null)
  const [selectedPodCertificateRequest, setSelectedPodCertificateRequest] =
    useState<PodCertificateRequestInfo | null>(null)
  const [selectedStorageVersion, setSelectedStorageVersion] = useState<StorageVersionInfo | null>(null)
  const [selectedStorageVersionMigration, setSelectedStorageVersionMigration] =
    useState<StorageVersionMigrationInfo | null>(null)
  const [selectedLease, setSelectedLease] = useState<LeaseInfo | null>(null)
  const [selectedLeaseCandidate, setSelectedLeaseCandidate] = useState<LeaseCandidateInfo | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null)
  const [selectedPriorityClass, setSelectedPriorityClass] = useState<PriorityClassInfo | null>(null)
  const [selectedRuntimeClass, setSelectedRuntimeClass] = useState<RuntimeClassInfo | null>(null)
  const [selectedVolumeAttributesClass, setSelectedVolumeAttributesClass] =
    useState<VolumeAttributesClassInfo | null>(null)
  const [selectedCSIDriver, setSelectedCSIDriver] = useState<CSIDriverInfo | null>(null)
  const [selectedCSINode, setSelectedCSINode] = useState<CSINodeInfo | null>(null)
  const [selectedVolumeAttachment, setSelectedVolumeAttachment] = useState<VolumeAttachmentInfo | null>(null)
  const [selectedCSIStorageCapacity, setSelectedCSIStorageCapacity] = useState<CSIStorageCapacityInfo | null>(null)
  const [selectedVolumeSnapshotClass, setSelectedVolumeSnapshotClass] = useState<VolumeSnapshotClassInfo | null>(null)
  const [selectedVolumeSnapshot, setSelectedVolumeSnapshot] = useState<VolumeSnapshotInfo | null>(null)
  const [selectedVolumeSnapshotContent, setSelectedVolumeSnapshotContent] = useState<VolumeSnapshotContentInfo | null>(null)
  const [selectedGatewayClass, setSelectedGatewayClass] = useState<GatewayClassInfo | null>(null)
  const [selectedGateway, setSelectedGateway] = useState<GatewayInfo | null>(null)
  const [selectedHTTPRoute, setSelectedHTTPRoute] = useState<HTTPRouteInfo | null>(null)
  const [selectedGRPCRoute, setSelectedGRPCRoute] = useState<GRPCRouteInfo | null>(null)
  const [selectedTLSRoute, setSelectedTLSRoute] = useState<TLSRouteInfo | null>(null)
  const [selectedTCPRoute, setSelectedTCPRoute] = useState<TCPRouteInfo | null>(null)
  const [selectedUDPRoute, setSelectedUDPRoute] = useState<UDPRouteInfo | null>(null)
  const [selectedReferenceGrant, setSelectedReferenceGrant] = useState<ReferenceGrantInfo | null>(null)
  const [selectedDeviceClass, setSelectedDeviceClass] = useState<DeviceClassInfo | null>(null)
  const [selectedDeviceTaintRule, setSelectedDeviceTaintRule] = useState<DeviceTaintRuleInfo | null>(null)
  const [selectedResourceClaim, setSelectedResourceClaim] = useState<ResourceClaimInfo | null>(null)
  const [selectedResourceClaimTemplate, setSelectedResourceClaimTemplate] =
    useState<ResourceClaimTemplateInfo | null>(null)
  const [selectedResourceSlice, setSelectedResourceSlice] = useState<ResourceSliceInfo | null>(null)
  const [selectedServiceAccount, setSelectedServiceAccount] = useState<ServiceAccountInfo | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null)
  const [selectedRoleBinding, setSelectedRoleBinding] = useState<RoleBindingInfo | null>(null)
  const [selectedClusterRole, setSelectedClusterRole] = useState<ClusterRoleInfo | null>(null)
  const [selectedClusterRoleBinding, setSelectedClusterRoleBinding] = useState<ClusterRoleBindingInfo | null>(null)
  const [selectedSelfSubjectReview, setSelectedSelfSubjectReview] = useState<SelfSubjectReviewInfo | null>(null)
  const [selectedSelfSubjectAccessReview, setSelectedSelfSubjectAccessReview] =
    useState<SelfSubjectAccessReviewInfo | null>(null)
  const [selectedSelfSubjectRule, setSelectedSelfSubjectRule] = useState<SelfSubjectRuleInfo | null>(null)
  const [selectedCRDForInstances, setSelectedCRDForInstances] = useState<CustomResourceDefinitionInfo | null>(null)
  const [customResourceInstances, setCustomResourceInstances] = useState<CustomResourceInstanceInfo[]>([])
  const [customResourceLoading, setCustomResourceLoading] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ctxMap = useMemo(() => {
    const map = new Map<string, ContextRecord>()
    for (const context of contexts) {
      map.set(context.id, context)
    }
    return map
  }, [contexts])

  const activeContext = selectedContext ?? ctxMap.get(selectedId)
  const selectedNamespace = selectedNamespaces[0] ?? ''
  const selectedContextDisplayName = activeContext
    ? contextPrefs?.customNames[activeContext.id] ?? activeContext.name
    : '请选择集群'
  const selectedClusterName = activeContext?.cluster ?? selectedContextDisplayName
  const currentResourceLabel = selectedResourceType === 'workloads'
    ? 'Workloads Overview'
    : RESOURCE_TYPES.find((type) => type.key === selectedResourceType)?.label ?? 'Resource'
  const activeVersion = serverVersions[0]?.gitVersion ?? ''
  const statusBarClusterLabel = activeContext
    ? `${selectedContextDisplayName}${activeVersion ? ` (${activeVersion})` : ''}`
    : 'No cluster selected'
  const searchPlaceholder = `Search ${currentResourceLabel}...`
  const showNamespaceFilter = !NAMESPACE_FILTER_EXCLUDED_TYPES.has(selectedResourceType)
  const hasClientShell = !isWebMode && typeof window !== 'undefined' && window.k7s?.platform === 'darwin'
  const appClassName = [
    'app',
    hasClientShell ? 'client-shell-app' : '',
  ].filter(Boolean).join(' ')
  const selectedNodeNameSet = useMemo(() => new Set(selectedNodeNames), [selectedNodeNames])

  const filterNamespacedData = <T extends { namespace: string }>(data: T[]) => {
    if (!selectedNamespace) return data
    return data.filter((item) => item.namespace === selectedNamespace)
  }

  const getVisibleData = <T extends { name?: string; namespace?: string }>(data: T[]) => sortData(filterData(data))

  const getVisibleNamespaces = () => getVisibleData(
    selectedNamespace ? namespaces.filter((namespace) => namespace.name === selectedNamespace) : namespaces,
  )

  const getVisibleNamespacedData = <T extends { name?: string; namespace: string }>(data: T[]) => (
    getVisibleData(filterNamespacedData(data))
  )

  const sortTopMetricData = <T,>(data: T[], defaultField: string) => {
    const field = sortField || defaultField
    if (!['cpu', 'memory', 'cpuUsage', 'memoryUsage'].includes(field)) {
      return sortField ? sortData(data as Record<string, unknown>[]) as T[] : [...data]
    }
    return [...data].sort((left, right) => {
      const leftValue = (left as Record<string, unknown>)[field]
      const rightValue = (right as Record<string, unknown>)[field]
      const diff = metricRank(rightValue, field) - metricRank(leftValue, field)
      const direction = sortField ? sortDirection : 'desc'
      return direction === 'asc' ? -diff : diff
    })
  }

  const getTopPods = () => sortTopMetricData(filterData(filterNamespacedData(pods)), 'cpu')

  const getTopContainers = () => {
    const rows = filterData(filterNamespacedData(pods)).flatMap((pod): TopContainerRow[] => (
      (pod.containers ?? []).map((container) => ({
        name: container.name,
        namespace: pod.namespace,
        podName: pod.name,
        nodeName: pod.nodeName,
        state: container.state ?? pod.status,
        restartCount: container.restartCount,
        ready: container.ready,
        cpu: container.cpu ?? '-',
        memory: container.memory ?? '-',
        pod,
      }))
    ))
    return sortTopMetricData(rows, 'cpu')
  }

  const labelsMatchSelector = (labels?: Record<string, string>, selector?: Record<string, string>) => {
    const selectorEntries = Object.entries(selector ?? {})
    return selectorEntries.length > 0 && selectorEntries.every(([key, value]) => labels?.[key] === value)
  }

  const labelsMatchTopology = (
    labels?: Record<string, string>,
    matchLabels?: Record<string, string>,
    expressions?: CSIStorageCapacityInfo['nodeTopologyExpressions'],
  ) => {
    const labelEntries = Object.entries(matchLabels ?? {})
    const expressionEntries = expressions ?? []
    if (labelEntries.length === 0 && expressionEntries.length === 0) return false

    const labelsMatch = labelEntries.every(([key, value]) => labels?.[key] === value)
    const expressionsMatch = expressionEntries.every((expression) => {
      const value = labels?.[expression.key]
      const values = expression.values === '-' ? [] : expression.values.split(', ').filter(Boolean)
      switch (expression.operator) {
        case 'In':
          return typeof value === 'string' && values.includes(value)
        case 'NotIn':
          return typeof value !== 'string' || !values.includes(value)
        case 'Exists':
          return value !== undefined
        case 'DoesNotExist':
          return value === undefined
        default:
          return true
      }
    })
    return labelsMatch && expressionsMatch
  }

  const csiNodeHasDriver = (node: CSINodeInfo, driverName: string) => {
    const driverDetails = node.driverDetails ?? []
    if (driverDetails.some((driver) => driver.name === driverName)) return true
    return node.driverNames.split(', ').includes(driverName)
  }

  const getWorkloadRelatedPods = (workload: SelectableWorkload) => (
    pods.filter((pod) => pod.namespace === workload.namespace && labelsMatchSelector(pod.labels, workload.selector))
  )

  const getControllerRelatedEvents = (
    kind: string,
    workload: SelectableWorkload,
    relatedPods = getWorkloadRelatedPods(workload),
    extraObjects: string[] = [],
  ) => {
    const relatedObjects = new Set([
      `${kind}/${workload.name}`,
      ...relatedPods.map((pod) => `Pod/${pod.name}`),
      ...extraObjects,
    ])
    return events.filter((event) => (
      event.namespace === workload.namespace && relatedObjects.has(event.object)
    ))
  }

  const getWorkloadControllerRevisions = (kind: 'DaemonSet' | 'StatefulSet', workload: SelectableWorkload) => (
    controllerRevisions.filter((revision) => (
      revision.namespace === workload.namespace && revision.owner === `${kind}/${workload.name}`
    ))
  )

  const getDeploymentRelatedPods = (deployment: ServiceInfo | typeof deployments[number]) => (
    getWorkloadRelatedPods(deployment)
  )

  const getDeploymentRelatedReplicaSets = (deployment: typeof deployments[number]) => (
    replicaSets.filter((replicaSet) => (
      replicaSet.namespace === deployment.namespace
        && (
          replicaSet.owner === `Deployment/${deployment.name}`
            || labelsMatchSelector(replicaSet.labels, deployment.selector)
            || labelsMatchSelector(replicaSet.selector, deployment.selector)
        )
    ))
  )

  const getDeploymentRelatedEvents = (deployment: typeof deployments[number]) => {
    const relatedPods = getDeploymentRelatedPods(deployment)
    const relatedReplicaSets = getDeploymentRelatedReplicaSets(deployment)
    return getControllerRelatedEvents(
      'Deployment',
      deployment,
      relatedPods,
      relatedReplicaSets.map((replicaSet) => `ReplicaSet/${replicaSet.name}`),
    )
  }

  const getCronJobRelatedJobs = (cronJob: typeof cronJobs[number]) => (
    jobs.filter((job) => (
      job.namespace === cronJob.namespace
        && (
          job.owner === `CronJob/${cronJob.name}`
            || labelsMatchSelector(job.labels, cronJob.selector)
            || labelsMatchSelector(job.selector, cronJob.selector)
        )
    ))
  )

  const getCronJobRelatedPods = (cronJob: typeof cronJobs[number], relatedJobs = getCronJobRelatedJobs(cronJob)) => {
    const relatedByJob = relatedJobs.flatMap((job) => getWorkloadRelatedPods(job))
    if (relatedByJob.length > 0) {
      return relatedByJob.filter((pod, index, list) => (
        list.findIndex((item) => item.namespace === pod.namespace && item.name === pod.name) === index
      ))
    }
    return getWorkloadRelatedPods(cronJob)
  }

  const getCronJobRelatedEvents = (
    cronJob: typeof cronJobs[number],
    relatedJobs = getCronJobRelatedJobs(cronJob),
    relatedPods = getCronJobRelatedPods(cronJob, relatedJobs),
  ) => getControllerRelatedEvents(
    'CronJob',
    cronJob,
    relatedPods,
    relatedJobs.map((job) => `Job/${job.name}`),
  )

  const renderSelectorSection = (selector?: Record<string, string>) => {
    const selectorEntries = Object.entries(selector ?? {})
    if (selectorEntries.length === 0) return null
    return (
      <div className="detail-section">
        <div className="detail-section-title">选择器</div>
        <div className="labels-list">
          {selectorEntries.map(([key, value]) => (
            <div key={key} className="label-item">
              <span className="label-key">{key}</span>
              <span className="label-eq">=</span>
              <span className="label-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRelatedControllerRevisions = (relatedRevisions: typeof controllerRevisions) => (
    relatedRevisions.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">关联 ControllerRevisions</div>
        <div className="conditions-table workload-revisions-table">
          <div className="conditions-row conditions-head">
            <div>名称</div>
            <div>版本</div>
            <div>Owner</div>
            <div>数据</div>
            <div>存活</div>
          </div>
          {relatedRevisions.map((revision) => (
            <div key={`${revision.namespace}-${revision.name}`} className="conditions-row">
              <div>{revision.name}</div>
              <div>{revision.revision}</div>
              <div>{revision.owner}</div>
              <div className="detail-value-truncate">{revision.dataKind}</div>
              <div>{revision.age}</div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const renderRelatedPods = (relatedPods: PodInfo[]) => (
    relatedPods.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">关联 Pods</div>
        <div className="pods-table workload-pods-table">
          <div className="conditions-row conditions-head">
            <div>名称</div>
            <div>状态</div>
            <div>CPU</div>
            <div>Memory</div>
            <div>重启</div>
            <div>节点</div>
          </div>
          {relatedPods.map((pod) => (
            <div key={`${pod.namespace}-${pod.name}`} className="conditions-row">
              <div>{pod.name}</div>
              <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
              <div>{pod.cpu ?? '-'}</div>
              <div>{pod.memory ?? '-'}</div>
              <div>{pod.restarts}</div>
              <div>{pod.nodeName}</div>
              <div className="table-row-actions">
                <button
                  className="action-btn yaml-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handlePodClick(pod, selectedId)
                  }}
                >
                  Open
                </button>
                <button
                  className="action-btn logs-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleOpenPodLogs(pod)
                  }}
                >
                  Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const renderRelatedJobs = (relatedJobs: typeof jobs) => (
    relatedJobs.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">关联 Jobs</div>
        <div className="conditions-table cronjob-jobs-table">
          <div className="conditions-row conditions-head">
            <div>名称</div>
            <div>完成</div>
            <div>活跃</div>
            <div>失败</div>
            <div>Owner</div>
            <div>存活</div>
          </div>
          {relatedJobs.map((job) => (
            <div key={`${job.namespace}-${job.name}`} className="conditions-row">
              <div>{job.name}</div>
              <div>{job.succeeded}/{job.completions}</div>
              <div>{job.active}</div>
              <div className={`status ${job.failed > 0 ? 'warn' : 'ok'}`}>{job.failed}</div>
              <div>{job.owner ?? '-'}</div>
              <div>{job.age}</div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const renderRelatedEvents = (relatedEvents: typeof events) => (
    relatedEvents.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">关联 Events</div>
        <div className="conditions-table workload-events-table">
          <div className="conditions-row conditions-head">
            <div>类型</div>
            <div>原因</div>
            <div>对象</div>
            <div>消息</div>
            <div>次数</div>
            <div>时间</div>
          </div>
          {relatedEvents.map((item) => (
            <div key={`${item.namespace}-${item.name}`} className="conditions-row">
              <div className={`status ${item.type === 'Warning' ? 'warn' : 'ok'}`}>{item.type}</div>
              <div>{item.reason}</div>
              <div>{item.object}</div>
              <div className="detail-value-truncate">{item.message}</div>
              <div>{item.count}</div>
              <div>{item.age}</div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const renderAdmissionWebhookConfigurationDetails = (
    config: AdmissionWebhookConfigurationInfo,
    kind: 'MutatingWebhookConfiguration' | 'ValidatingWebhookConfiguration',
  ) => {
    const webhookDetails = config.webhookDetails ?? []
    const ruleDetails = config.ruleDetails ?? []
    const backendKeys = new Set(webhookDetails
      .filter((webhook) => webhook.serviceNamespace && webhook.serviceName)
      .map((webhook) => `${webhook.serviceNamespace}/${webhook.serviceName}`))
    const backendNamespaces = new Set(webhookDetails
      .map((webhook) => webhook.serviceNamespace)
      .filter((namespace): namespace is string => Boolean(namespace)))
    const relatedServices = services.filter((service) => (
      backendKeys.has(`${service.namespace}/${service.name}`)
    ))
    const relatedEndpoints = endpoints.filter((endpoint) => (
      backendKeys.has(`${endpoint.namespace}/${endpoint.name}`)
    ))
    const relatedEndpointSlices = endpointSlices.filter((slice) => (
      backendKeys.has(`${slice.namespace}/${slice.service}`)
    ))
    const targetPodNames = new Set(relatedEndpointSlices
      .flatMap((slice) => slice.endpointDetails ?? [])
      .filter((endpoint) => endpoint.targetKind === 'Pod' && endpoint.targetName !== '-')
      .map((endpoint) => endpoint.targetName))
    const endpointAddresses = new Set(relatedEndpointSlices
      .flatMap((slice) => slice.endpointDetails ?? [])
      .flatMap((endpoint) => endpoint.addresses === '-' ? [] : endpoint.addresses.split(', ')))
    const selectorPods = relatedServices.flatMap((service) => (
      pods.filter((pod) => (
        pod.namespace === service.namespace && labelsMatchSelector(pod.labels, service.selector)
      ))
    ))
    const endpointPods = pods.filter((pod) => (
      backendNamespaces.has(pod.namespace)
        && (
          targetPodNames.has(pod.name)
            || (pod.podIP ? endpointAddresses.has(pod.podIP) : false)
        )
    ))
    const relatedPods = [...selectorPods, ...endpointPods].filter((pod, index, list) => (
      list.findIndex((item) => item.namespace === pod.namespace && item.name === pod.name) === index
    ))
    const relatedObjects = new Set([
      `${kind}/${config.name}`,
      ...relatedServices.map((service) => `Service/${service.name}`),
      ...relatedEndpoints.map((endpoint) => `Endpoints/${endpoint.name}`),
      ...relatedEndpointSlices.map((slice) => `EndpointSlice/${slice.name}`),
      ...relatedPods.map((pod) => `Pod/${pod.name}`),
    ])
    const relatedEvents = events.filter((event) => (
      relatedObjects.has(event.object)
        && (!event.namespace || backendNamespaces.size === 0 || backendNamespaces.has(event.namespace))
    ))

    return (
      <div className="modal-body">
        <div className="detail-section">
          <div className="detail-section-title">基本信息</div>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">名称</span>
              <span className="detail-value">{config.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">类型</span>
              <span className="detail-value">{kind}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Webhooks</span>
              <span className="detail-value">{config.webhooks}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Failure Policies</span>
              <span className="detail-value">{config.failurePolicies}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Side Effects</span>
              <span className="detail-value">{config.sideEffects}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Review Versions</span>
              <span className="detail-value">{config.admissionReviewVersions}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">存活时间</span>
              <span className="detail-value">{config.age}</span>
            </div>
          </div>
        </div>

        {webhookDetails.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Webhooks</div>
            <div className="conditions-table admission-webhooks-table">
              <div className="conditions-row conditions-head">
                <div>名称</div>
                <div>Client</div>
                <div>Failure</div>
                <div>Side Effects</div>
                <div>Match</div>
                <div>Timeout</div>
                <div>CA</div>
                <div>Rules</div>
                <div>Conditions</div>
              </div>
              {webhookDetails.map((webhook) => (
                <div key={webhook.name} className="conditions-row">
                  <div className="detail-value-truncate" title={webhook.name}>{webhook.name}</div>
                  <div className="detail-value-truncate" title={webhook.client}>{webhook.client}</div>
                  <div>{webhook.failurePolicy}</div>
                  <div>{webhook.sideEffects}</div>
                  <div>{webhook.matchPolicy}</div>
                  <div>{webhook.timeoutSeconds}</div>
                  <div>{webhook.caBundleConfigured ? 'true' : 'false'}</div>
                  <div>{webhook.rules}</div>
                  <div>{webhook.matchConditions}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {webhookDetails.some((webhook) => webhook.namespaceSelector !== 'all' || webhook.objectSelector !== 'all') && (
          <div className="detail-section">
            <div className="detail-section-title">选择器</div>
            <div className="conditions-table admission-selectors-table">
              <div className="conditions-row conditions-head">
                <div>Webhook</div>
                <div>Namespace Selector</div>
                <div>Object Selector</div>
              </div>
              {webhookDetails.map((webhook) => (
                <div key={`${webhook.name}-selectors`} className="conditions-row">
                  <div className="detail-value-truncate">{webhook.name}</div>
                  <div className="detail-value-truncate" title={webhook.namespaceSelector}>{webhook.namespaceSelector}</div>
                  <div className="detail-value-truncate" title={webhook.objectSelector}>{webhook.objectSelector}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ruleDetails.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Rules</div>
            <div className="conditions-table admission-rules-table">
              <div className="conditions-row conditions-head">
                <div>Webhook</div>
                <div>Operations</div>
                <div>API Groups</div>
                <div>Versions</div>
                <div>Resources</div>
                <div>Scope</div>
              </div>
              {ruleDetails.map((rule, index) => (
                <div key={`${rule.webhookName}-${index}`} className="conditions-row">
                  <div className="detail-value-truncate">{rule.webhookName}</div>
                  <div>{rule.operations}</div>
                  <div>{rule.apiGroups}</div>
                  <div>{rule.apiVersions}</div>
                  <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                  <div>{rule.scope}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {relatedServices.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">关联 Services</div>
            <div className="conditions-table admission-backends-table">
              <div className="conditions-row conditions-head">
                <div>命名空间</div>
                <div>名称</div>
                <div>类型</div>
                <div>ClusterIP</div>
                <div>端口</div>
              </div>
              {relatedServices.map((service) => (
                <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                  <div>{service.namespace}</div>
                  <div>{service.name}</div>
                  <div>{service.type}</div>
                  <div>{service.clusterIP}</div>
                  <div className="detail-value-truncate">{service.ports}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(relatedEndpointSlices.length > 0 || relatedEndpoints.length > 0) && (
          <div className="detail-section">
            <div className="detail-section-title">关联端点</div>
            <div className="conditions-table admission-endpoints-table">
              <div className="conditions-row conditions-head">
                <div>类型</div>
                <div>名称</div>
                <div>Ready</div>
                <div>Not Ready</div>
                <div>地址</div>
                <div>端口</div>
              </div>
              {relatedEndpointSlices.map((slice) => (
                <div key={`slice-${slice.namespace}-${slice.name}`} className="conditions-row">
                  <div>EndpointSlice</div>
                  <div>{slice.name}</div>
                  <div className={slice.ready > 0 ? 'status ok' : 'status warn'}>{slice.ready}</div>
                  <div className={slice.notReady > 0 ? 'status warn' : 'status ok'}>{slice.notReady}</div>
                  <div className="detail-value-truncate">{slice.addresses}</div>
                  <div className="detail-value-truncate">{slice.ports}</div>
                </div>
              ))}
              {relatedEndpoints.map((endpoint) => (
                <div key={`endpoint-${endpoint.namespace}-${endpoint.name}`} className="conditions-row">
                  <div>Endpoints</div>
                  <div>{endpoint.name}</div>
                  <div className={endpoint.ready > 0 ? 'status ok' : 'status warn'}>{endpoint.ready}</div>
                  <div className={endpoint.notReady > 0 ? 'status warn' : 'status ok'}>{endpoint.notReady}</div>
                  <div className="detail-value-truncate">{endpoint.addresses}</div>
                  <div className="detail-value-truncate">{endpoint.ports}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {renderRelatedPods(relatedPods)}
        {renderRelatedEvents(relatedEvents)}

        {config.labels && Object.keys(config.labels).length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">标签</div>
            <div className="labels-list">
              {Object.entries(config.labels).map(([key, value]) => (
                <div key={key} className="label-item">
                  <span className="label-key">{key}</span>
                  <span className="label-eq">=</span>
                  <span className="label-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRbacRules = (ruleDetails?: RoleInfo['ruleDetails']) => (
    ruleDetails && ruleDetails.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">规则</div>
        <div className="conditions-table rbac-rules-table">
          <div className="conditions-row conditions-head">
            <div>Verbs</div>
            <div>API Groups</div>
            <div>Resources</div>
            <div>Resource Names</div>
            <div>Non-resource URLs</div>
          </div>
          {ruleDetails.map((rule, index) => (
            <div key={`${rule.verbs}-${rule.resources}-${index}`} className="conditions-row">
              <div className="detail-value-truncate">{rule.verbs}</div>
              <div className="detail-value-truncate">{rule.apiGroups}</div>
              <div className="detail-value-truncate">{rule.resources}</div>
              <div className="detail-value-truncate">{rule.resourceNames}</div>
              <div className="detail-value-truncate">{rule.nonResourceURLs}</div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const renderRbacSubjects = (subjectDetails?: RoleBindingInfo['subjectDetails']) => (
    subjectDetails && subjectDetails.length > 0 && (
      <div className="detail-section">
        <div className="detail-section-title">Subjects</div>
        <div className="conditions-table rbac-subjects-table">
          <div className="conditions-row conditions-head">
            <div>Kind</div>
            <div>Name</div>
            <div>Namespace</div>
            <div>API Group</div>
          </div>
          {subjectDetails.map((subject, index) => (
            <div key={`${subject.kind}-${subject.namespace ?? ''}-${subject.name}-${index}`} className="conditions-row">
              <div>{subject.kind}</div>
              <div className="detail-value-truncate">{subject.name}</div>
              <div>{subject.namespace ?? '-'}</div>
              <div>{subject.apiGroup ?? '-'}</div>
            </div>
          ))}
        </div>
      </div>
    )
  )

  const roleRefParts = (roleRef: string, kind?: string, name?: string) => {
    const parts = roleRef.split('/')
    return {
      kind: kind ?? parts[0] ?? '',
      name: name ?? parts[1] ?? '',
    }
  }

  const showNotice = useCallback((tone: NoticeTone, message: string) => {
    setNotice({ tone, message })
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current)
    }
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null)
      noticeTimerRef.current = null
    }, 4000)
  }, [])

  const upsertPortForwardSession = useCallback((session: PortForwardSessionInfo) => {
    setPortForwardSessions((current) => {
      const index = current.findIndex((item) => item.sessionId === session.sessionId)
      if (index < 0) return [session, ...current]
      const next = [...current]
      next[index] = { ...current[index], ...session }
      return next
    })
  }, [])

  const handlePortForwardEvent = useCallback((event: K7sPushEvent) => {
    if (event.type !== 'port-forward') return
    upsertPortForwardSession({
      sessionId: event.sessionId,
      contextId: event.contextId,
      name: event.targetName,
      targetKind: event.targetKind,
      targetName: event.targetName,
      namespace: event.namespace,
      podName: event.podName,
      serviceName: event.serviceName,
      localPort: event.localPort,
      targetPort: event.targetPort,
      protocol: event.protocol,
      state: event.state,
      startedAt: event.startedAt,
      message: event.message,
    })
    if (event.state === 'error') {
      showNotice('error', event.message || `端口转发 ${event.namespace}/${event.targetKind}/${event.targetName} 异常退出`)
    }
  }, [showNotice, upsertPortForwardSession])

  const handleStopPortForward = useCallback(async (session: PortForwardSessionInfo) => {
    try {
      await k8sApi.stopPortForward(session.sessionId)
      setPortForwardSessions((current) => current.map((item) => (
        item.sessionId === session.sessionId
          ? { ...item, state: 'stopped', message: '已停止' }
          : item
      )))
      showNotice('success', `端口转发 ${session.namespace}/${session.targetKind}/${session.targetName} 已停止`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '停止端口转发失败')
    }
  }, [showNotice])

  const handleClearPortForward = useCallback((sessionId: string) => {
    setPortForwardSessions((current) => current.filter((item) => item.sessionId !== sessionId))
  }, [])

  const handleOpenPortForward = useCallback((localPort: number) => {
    if (typeof window === 'undefined') return
    window.open(`http://127.0.0.1:${localPort}`, '_blank', 'noopener,noreferrer')
  }, [])

  const handleThemeChange = (theme: AppThemeName) => {
    void updateAppTheme(theme)
      .then(() => showNotice('success', `已切换到 ${THEME_OPTIONS.find((option) => option.key === theme)?.label ?? '新'} 配色`))
      .catch((err) => showNotice('error', err instanceof Error ? err.message : '保存配色失败'))
  }

  const openInteractiveTerminal = (command: string, targetLabel: string) => {
    if (!terminalAvailable) {
      showNotice('error', '当前终端不可用')
      return
    }

    openTerminalWithCommand(command)
    showNotice('info', `已在终端执行命令: ${targetLabel}`)
  }

  const resolvePodForTerminal = async (pod: PodInfo) => {
    try {
      return await k8sApi.getPodDetail(selectedId, pod.namespace, pod.name)
    } catch {
      return pod
    }
  }

  const handleEnterPodShell = async (pod: PodInfo) => {
    if (!selectedId) return
    const terminalPod = await resolvePodForTerminal(pod)
    openInteractiveTerminal(buildPodShellCommand(terminalPod), `Shell ${terminalPod.namespace}/${terminalPod.name}`)
  }

  const handleAttachPod = async (pod: PodInfo) => {
    if (!selectedId) return
    const terminalPod = await resolvePodForTerminal(pod)
    openInteractiveTerminal(buildPodAttachCommand(terminalPod), `Attach ${terminalPod.namespace}/${terminalPod.name}`)
  }

  const handleEnterNodeShell = (node: NodeInfo) => {
    openInteractiveTerminal(buildNodeShellCommand(node), `Node ${node.name}`)
  }

  const openYamlEditor = (
    mode: 'view' | 'edit' | 'create',
    kind = 'YAML',
    namespace = selectedNamespace,
    name = '',
  ) => {
    setIsYamlEditorOpen(true, mode, { kind, namespace, name })
  }

  const refreshSelectedContext = async (isAutoRefresh = false) => {
    if (!selectedId) return
    await refreshAll(isAutoRefresh)
  }

  const refreshNodeAfterAction = async (nodeName: string) => {
    if (!selectedId) return
    await refreshSelectedContext(true)
    if (selectedNode?.name === nodeName) {
      await handleNodeClick(nodeName, selectedId)
    }
  }

  const toggleNodeSelection = (nodeName: string) => {
    setSelectedNodeNames((names) => (
      names.includes(nodeName)
        ? names.filter((name) => name !== nodeName)
        : [...names, nodeName]
    ))
  }

  const toggleVisibleNodeSelection = (visibleNodeNames: string[]) => {
    if (visibleNodeNames.length === 0) return
    setSelectedNodeNames((names) => {
      const selected = new Set(names)
      const allVisibleSelected = visibleNodeNames.every((name) => selected.has(name))
      if (allVisibleSelected) {
        const visibleNames = new Set(visibleNodeNames)
        return names.filter((name) => !visibleNames.has(name))
      }
      for (const name of visibleNodeNames) {
        selected.add(name)
      }
      return Array.from(selected)
    })
  }

  const openNodeLabelModal = () => {
    if (selectedNodeNames.length === 0) {
      showNotice('error', '请先选择要修改 Label 的 Node')
      return
    }
    setIsNodeLabelModalOpen(true)
  }

  const closeNodeLabelModal = () => {
    if (nodeLabelLoading) return
    setIsNodeLabelModalOpen(false)
  }

  const handleApplyNodeLabels = async () => {
    if (!selectedId) return
    const liveNodeNames = new Set(nodes.map((node) => node.name))
    const targetNames = selectedNodeNames.filter((name) => liveNodeNames.has(name))
    if (targetNames.length === 0) {
      showNotice('error', '请先选择要修改 Label 的 Node')
      return
    }

    const mutations = parseNodeLabelMutationInput(nodeLabelDraft)
    if (!mutations) {
      showNotice('error', '请输入 key=value，可用逗号、空格或换行分隔')
      return
    }

    setNodeLabelLoading(true)
    const failures: string[] = []
    try {
      for (const nodeName of targetNames) {
        for (const mutation of mutations) {
          const result = await k8sApi.mutateResourceMetadata(
            selectedId,
            'Node',
            '',
            nodeName,
            'labels',
            mutation.key,
            mutation.value,
            mutation.remove,
          )
          if (!result.success) {
            failures.push(`${nodeName}: ${result.message || `${mutation.key} 更新失败`}`)
          }
        }
      }

      if (failures.length > 0) {
        throw new Error(`部分 Node Label 更新失败: ${failures.slice(0, 3).join('；')}`)
      }

      const detailNodeName = selectedNode && targetNames.includes(selectedNode.name) ? selectedNode.name : ''
      showNotice('success', `已更新 ${targetNames.length} 个 Node 的 ${mutations.length} 个 Label`)
      setSelectedNodeNames([])
      setNodeLabelDraft('')
      setIsNodeLabelModalOpen(false)
      void refreshSelectedContext(true)
        .then(() => {
          if (detailNodeName) {
            return handleNodeClick(detailNodeName, selectedId)
          }
        })
        .catch((err) => {
          showNotice('error', err instanceof Error ? `Node Label 已更新，刷新失败: ${err.message}` : 'Node Label 已更新，刷新失败')
        })
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '批量更新 Node Label 失败')
    } finally {
      setNodeLabelLoading(false)
    }
  }

  const stopRowAction = (event: MouseEvent<HTMLButtonElement>, action: () => void | Promise<void>) => {
    event.stopPropagation()
    void action()
  }

  const handleAddClick = async () => {
    setIsAdding(true)
    await handleAdd()
    setIsAdding(false)
  }

  const handleUseKubeContext = async () => {
    if (!activeContext) return
    if (activeContext.current) {
      showNotice('info', `${selectedContextDisplayName} 已是当前 context`)
      return
    }

    const confirmed = window.confirm(`将 kubeconfig 当前 context 切换为 ${selectedContextDisplayName}？`)
    if (!confirmed) return

    try {
      await useKubeContextAction(activeContext.id)
      showNotice('success', `已将 ${selectedContextDisplayName} 设为当前 context`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '切换当前 context 失败')
    }
  }

  const handleSetKubeContextNamespace = async () => {
    if (!activeContext) return

    const value = window.prompt(
      `设置 ${selectedContextDisplayName} 的默认命名空间`,
      selectedNamespace || activeContext.namespace || 'default',
    )
    if (value === null) return

    const namespace = value.trim()
    if (!namespace) {
      showNotice('error', '命名空间不能为空')
      return
    }

    try {
      await setKubeContextNamespaceAction(activeContext.id, namespace)
      showNotice('success', `已将默认命名空间设为 ${namespace}`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '设置默认命名空间失败')
    }
  }

  const handleDeleteResource = async (kind: KubernetesResourceKind, namespace: string, name: string) => {
    if (!selectedId) return

    const target = namespace ? `${namespace}/${name}` : name
    const confirmed = window.confirm(`确认删除 ${kind} ${target}？此操作不可撤销。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.deleteResource(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `删除 ${kind} 失败`)
      }
      showNotice('success', result.message || `${kind} ${target} 已删除`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `删除 ${kind} 失败`)
    }
  }

  const handleEvictPod = async (pod: PodInfo) => {
    if (!selectedId) return

    const target = `${pod.namespace}/${pod.name}`
    const confirmed = window.confirm(`确认 Evict Pod ${target}？将通过 policy/v1 Eviction 子资源驱逐 Pod，并遵守 PodDisruptionBudget。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.evictPod(selectedId, pod.namespace, pod.name)
      if (!result.success) {
        throw new Error(result.message || 'Evict Pod 失败')
      }
      showNotice('success', result.message || `Pod ${target} 已发起 Evict`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Evict Pod 失败')
    }
  }

  const handleForceDeletePod = async (pod: PodInfo) => {
    if (!selectedId) return

    const target = `${pod.namespace}/${pod.name}`
    const confirmed = window.confirm(`确认强制删除 Pod ${target}？将使用 gracePeriodSeconds=0，不等待节点上的 kubelet 确认。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.forceDeletePod(selectedId, pod.namespace, pod.name)
      if (!result.success) {
        throw new Error(result.message || '强制删除 Pod 失败')
      }
      showNotice('success', result.message || `Pod ${target} 已强制删除`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '强制删除 Pod 失败')
    }
  }

  const handleUninstallHelmRelease = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    const confirmed = window.confirm(`确认卸载 Helm Release ${target}？这会执行 helm uninstall。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.uninstallHelmRelease(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '卸载 Helm Release 失败')
      }
      showNotice('success', result.message || `Helm Release ${target} 已卸载`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '卸载 Helm Release 失败')
    }
  }

  const handleTestHelmRelease = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    const confirmed = window.confirm(`确认测试 Helm Release ${target}？这会执行 helm test 并运行 chart 定义的测试 hook。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.testHelmRelease(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '测试 Helm Release 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Test`,
        message: result.message || 'Helm Release 测试完成',
      })
      showNotice('success', result.message || `Helm Release ${target} 测试完成`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '测试 Helm Release 失败')
    }
  }

  const handleInstallOrUpgradeHelmRelease = async (release?: HelmReleaseInfo) => {
    if (!selectedId) return

    const defaultNamespace = release?.namespace || selectedNamespace || activeContext?.namespace || 'default'
    const nameValue = window.prompt('Helm Release 名称', release?.name ?? '')
    if (nameValue === null) return
    const name = nameValue.trim()
    if (!name) {
      showNotice('error', 'Helm Release 名称不能为空')
      return
    }

    const namespaceValue = window.prompt('Helm Release 命名空间', defaultNamespace)
    if (namespaceValue === null) return
    const namespace = namespaceValue.trim()
    if (!namespace) {
      showNotice('error', 'Helm Release 命名空间不能为空')
      return
    }

    const chartValue = window.prompt('Helm Chart 引用或本地路径', release?.chart && release.chart !== '-' ? release.chart : '')
    if (chartValue === null) return
    const chart = chartValue.trim()
    if (!chart) {
      showNotice('error', 'Helm Chart 不能为空')
      return
    }

    const versionValue = window.prompt('Chart version，可留空', '')
    if (versionValue === null) return
    const valuesFileValue = window.prompt('Values 文件路径，可留空', '')
    if (valuesFileValue === null) return
    const setValuesValue = window.prompt('Helm --set 参数，多个用逗号分隔，可留空', '')
    if (setValuesValue === null) return

    const request: HelmReleaseUpgradeRequest = {
      name,
      namespace,
      chart,
      install: true,
      ...(versionValue.trim() ? { version: versionValue.trim() } : {}),
      ...(valuesFileValue.trim() ? { valuesFile: valuesFileValue.trim() } : {}),
      ...(setValuesValue.trim()
        ? { setValues: setValuesValue.split(',').map((value) => value.trim()).filter(Boolean) }
        : {}),
    }

    const confirmed = window.confirm(`确认执行 helm upgrade --install ${name} ${chart} -n ${namespace}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.installOrUpgradeHelmRelease(selectedId, request)
      if (!result.success) {
        throw new Error(result.message || '安装/升级 Helm Release 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${namespace}/${name} Install/Upgrade`,
        message: result.message || 'Helm Release 安装/升级完成',
      })
      showNotice('success', result.message || `Helm Release ${namespace}/${name} 已安装/升级`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '安装/升级 Helm Release 失败')
    }
  }

  const handleInstallHelmChart = async (chartInfo: HelmChartInfo) => {
    if (!selectedId) return

    const defaultNamespace = selectedNamespace || activeContext?.namespace || 'default'
    const nameValue = window.prompt('Helm Release 名称', chartInfo.chart || chartInfo.name.split('/').pop() || '')
    if (nameValue === null) return
    const name = nameValue.trim()
    if (!name) {
      showNotice('error', 'Helm Release 名称不能为空')
      return
    }

    const namespaceValue = window.prompt('Helm Release 命名空间', defaultNamespace)
    if (namespaceValue === null) return
    const namespace = namespaceValue.trim()
    if (!namespace) {
      showNotice('error', 'Helm Release 命名空间不能为空')
      return
    }

    const versionValue = window.prompt('Chart version，可留空', chartInfo.version !== '-' ? chartInfo.version : '')
    if (versionValue === null) return
    const valuesFileValue = window.prompt('Values 文件路径，可留空', '')
    if (valuesFileValue === null) return
    const setValuesValue = window.prompt('Helm --set 参数，多个用逗号分隔，可留空', '')
    if (setValuesValue === null) return

    const request: HelmReleaseUpgradeRequest = {
      name,
      namespace,
      chart: chartInfo.name,
      install: true,
      ...(versionValue.trim() ? { version: versionValue.trim() } : {}),
      ...(valuesFileValue.trim() ? { valuesFile: valuesFileValue.trim() } : {}),
      ...(setValuesValue.trim()
        ? { setValues: setValuesValue.split(',').map((value) => value.trim()).filter(Boolean) }
        : {}),
    }

    const confirmed = window.confirm(`确认执行 helm upgrade --install ${name} ${chartInfo.name} -n ${namespace}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.installOrUpgradeHelmRelease(selectedId, request)
      if (!result.success) {
        throw new Error(result.message || '安装 Helm Chart 失败')
      }
      setRolloutOutput({
        title: `Helm Chart ${chartInfo.name} Install`,
        message: result.message || 'Helm Chart 安装完成',
      })
      showNotice('success', result.message || `Helm Chart ${chartInfo.name} 已安装`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '安装 Helm Chart 失败')
    }
  }

  const handleAddHelmRepository = async () => {
    if (!selectedId) return

    const nameValue = window.prompt('Helm Repository 名称', '')
    if (nameValue === null) return
    const name = nameValue.trim()
    if (!name) {
      showNotice('error', 'Helm Repository 名称不能为空')
      return
    }

    const urlValue = window.prompt('Helm Repository URL', '')
    if (urlValue === null) return
    const url = urlValue.trim()
    if (!url) {
      showNotice('error', 'Helm Repository URL 不能为空')
      return
    }

    const confirmed = window.confirm(`确认新增 Helm Repository ${name}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.addHelmRepository(selectedId, name, url)
      if (!result.success) {
        throw new Error(result.message || '新增 Helm Repository 失败')
      }
      showNotice('success', result.message || `Helm Repository ${name} 已新增`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '新增 Helm Repository 失败')
    }
  }

  const handleUpdateHelmRepository = async (repository?: HelmRepositoryInfo) => {
    if (!selectedId) return

    const targetLabel = repository?.name ?? '全部 Helm Repository'
    const confirmed = window.confirm(`确认更新 ${targetLabel}？这会执行 helm repo update。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.updateHelmRepository(selectedId, repository?.name)
      if (!result.success) {
        throw new Error(result.message || '更新 Helm Repository 失败')
      }
      showNotice('success', result.message || `${targetLabel} 已更新`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '更新 Helm Repository 失败')
    }
  }

  const handleRemoveHelmRepository = async (repository: HelmRepositoryInfo) => {
    if (!selectedId) return

    const confirmed = window.confirm(`确认删除 Helm Repository ${repository.name}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.removeHelmRepository(selectedId, repository.name)
      if (!result.success) {
        throw new Error(result.message || '删除 Helm Repository 失败')
      }
      showNotice('success', result.message || `Helm Repository ${repository.name} 已删除`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '删除 Helm Repository 失败')
    }
  }

  const handleOpenCustomResourceInstances = async (crd: CustomResourceDefinitionInfo) => {
    if (!selectedId) return

    setSelectedCRDForInstances(crd)
    setCustomResourceLoading(true)
    setSelectedResourceType('customresources')
    try {
      const list = await k8sApi.listCustomResourceInstances(selectedId, crd.name, selectedNamespace || undefined)
      setCustomResourceInstances(list)
      showNotice('success', `已加载 ${crd.kind} 实例 ${list.length} 个`)
    } catch (err) {
      setCustomResourceInstances([])
      showNotice('error', err instanceof Error ? err.message : `加载 ${crd.kind} 实例失败`)
    } finally {
      setCustomResourceLoading(false)
    }
  }

  const refreshCustomResourceInstances = async () => {
    if (!selectedId || !selectedCRDForInstances) return

    setCustomResourceLoading(true)
    try {
      const list = await k8sApi.listCustomResourceInstances(
        selectedId,
        selectedCRDForInstances.name,
        selectedNamespace || undefined,
      )
      setCustomResourceInstances(list)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `刷新 ${selectedCRDForInstances.kind} 实例失败`)
    } finally {
      setCustomResourceLoading(false)
    }
  }

  const handleDeleteCustomResourceInstance = async (resource: CustomResourceInstanceInfo) => {
    if (!selectedId || !selectedCRDForInstances) return

    const target = resource.namespace ? `${resource.namespace}/${resource.name}` : resource.name
    const confirmed = window.confirm(`确认删除 ${resource.kind} ${target}？此操作不可撤销。`)
    if (!confirmed) return

    try {
      const result = await k8sApi.deleteCustomResourceInstance(
        selectedId,
        selectedCRDForInstances.name,
        resource.namespace,
        resource.name,
      )
      if (!result.success) {
        throw new Error(result.message || `删除 ${resource.kind} 失败`)
      }
      showNotice('success', result.message || `${resource.kind} ${target} 已删除`)
      await refreshCustomResourceInstances()
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `删除 ${resource.kind} 失败`)
    }
  }

  const handleToggleNodeScheduling = async (node: NodeInfo) => {
    if (!selectedId) return

    const action: NodeActionLoading = node.unschedulable ? 'uncordon' : 'cordon'
    setNodeActionLoading(action)
    try {
      const result = node.unschedulable
        ? await k8sApi.uncordonNode(selectedId, node.name)
        : await k8sApi.cordonNode(selectedId, node.name)
      if (!result.success) {
        throw new Error(result.message || `${action === 'cordon' ? 'Cordon' : 'Uncordon'} Node 失败`)
      }
      showNotice('success', result.message || `Node ${node.name} 已${node.unschedulable ? '恢复调度' : '设为不可调度'}`)
      await refreshNodeAfterAction(node.name)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `${action === 'cordon' ? 'Cordon' : 'Uncordon'} Node 失败`)
    } finally {
      setNodeActionLoading(null)
    }
  }

  const handleDrainNode = async (node: NodeInfo) => {
    if (!selectedId) return

    const confirmed = window.confirm(`确认 drain Node ${node.name}？将先 cordon 并驱逐该节点上的 Pod。`)
    if (!confirmed) return

    setNodeActionLoading('drain')
    try {
      const result = await k8sApi.drainNode(selectedId, node.name)
      if (!result.success) {
        throw new Error(result.message || 'Drain Node 失败')
      }
      showNotice('success', result.message || `Node ${node.name} 已 drain`)
      await refreshNodeAfterAction(node.name)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Drain Node 失败')
    } finally {
      setNodeActionLoading(null)
    }
  }

  const handleDeleteNode = async (node: NodeInfo) => {
    if (!selectedId) return

    const confirmed = window.confirm(`确认删除 Node ${node.name}？此操作不可撤销。`)
    if (!confirmed) return

    setNodeActionLoading('delete')
    try {
      const result = await k8sApi.deleteNode(selectedId, node.name)
      if (!result.success) {
        throw new Error(result.message || '删除 Node 失败')
      }
      showNotice('success', result.message || `Node ${node.name} 已删除`)
      handleCloseNodeDetail()
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '删除 Node 失败')
    } finally {
      setNodeActionLoading(null)
    }
  }

  const handleScaleWorkload = async (
    kind: ScaleableWorkloadKind,
    namespace: string,
    name: string,
    currentReplicas: number,
  ) => {
    if (!selectedId) return

    const value = window.prompt(`设置 ${kind} ${namespace}/${name} 的副本数`, String(currentReplicas))
    if (value === null) return

    const replicas = Number(value)
    if (!Number.isInteger(replicas) || replicas < 0) {
      showNotice('error', '请输入大于等于 0 的整数副本数')
      return
    }

    try {
      const result = await k8sApi.scaleWorkload(selectedId, kind, namespace, name, replicas)
      if (!result.success) {
        throw new Error(result.message || `扩缩容 ${kind} 失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 已调整到 ${result.replicas} 副本`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `扩缩容 ${kind} 失败`)
    }
  }

  const handleRestartWorkload = async (kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (!selectedId) return
    try {
      const result = await k8sApi.restartWorkload(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `重启 ${kind} 失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 已触发重启`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `重启 ${kind} 失败`)
    }
  }

  const handleSetWorkloadImage = async (kind: WorkloadImageKind, namespace: string, name: string) => {
    if (!selectedId) return

    const value = window.prompt(`设置 ${kind} ${namespace}/${name} 的容器镜像，格式: container=image`, '')
    if (value === null) return

    const separatorIndex = value.indexOf('=')
    if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
      showNotice('error', '请输入 container=image 格式')
      return
    }

    const containerName = value.slice(0, separatorIndex).trim()
    const image = value.slice(separatorIndex + 1).trim()
    if (!containerName || !image) {
      showNotice('error', '容器名称和镜像名称不能为空')
      return
    }

    const confirmed = window.confirm(`确认将 ${kind} ${namespace}/${name} 的容器 ${containerName} 更新为 ${image}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.setWorkloadImage(selectedId, kind, namespace, name, containerName, image)
      if (!result.success) {
        throw new Error(result.message || `更新 ${kind} 镜像失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 镜像已更新`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `更新 ${kind} 镜像失败`)
    }
  }

  const handleRollbackWorkload = async (kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (!selectedId) return

    const confirmed = window.confirm(`确认回滚 ${kind} ${namespace}/${name} 到上一个版本？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.rollbackWorkload(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `回滚 ${kind} 失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 已开始回滚`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `回滚 ${kind} 失败`)
    }
  }

  const handleRollbackHelmRelease = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    const value = window.prompt(`回滚 Helm Release ${target} 到指定 revision；留空则回滚到上一版。`, '')
    if (value === null) return

    const trimmedValue = value.trim()
    const revision = trimmedValue ? Number(trimmedValue) : undefined
    if (revision !== undefined && (!Number.isInteger(revision) || revision < 1)) {
      showNotice('error', 'Helm revision 必须是正整数')
      return
    }

    const revisionLabel = revision === undefined ? '上一版' : `revision ${revision}`
    const confirmed = window.confirm(`确认回滚 Helm Release ${target} 到 ${revisionLabel}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.rollbackHelmRelease(selectedId, release.namespace, release.name, revision)
      if (!result.success) {
        throw new Error(result.message || '回滚 Helm Release 失败')
      }
      showNotice('success', result.message || `Helm Release ${target} 已开始回滚`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '回滚 Helm Release 失败')
    }
  }

  const handleRolloutHistory = async (kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (!selectedId) return

    try {
      const result = await k8sApi.rolloutHistory(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `加载 ${kind} rollout 历史失败`)
      }
      setRolloutOutput({
        title: `${kind} ${namespace}/${name} Rollout History`,
        message: result.message || '暂无 rollout 历史输出',
      })
      showNotice('success', `已加载 ${kind} ${namespace}/${name} rollout 历史`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `加载 ${kind} rollout 历史失败`)
    }
  }

  const handleHelmReleaseHistory = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseHistory(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release 历史失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} History`,
        message: result.message || '暂无 Helm Release 历史输出',
      })
      showNotice('success', `已加载 Helm Release ${target} 历史`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release 历史失败')
    }
  }

  const handleHelmReleaseStatus = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseStatus(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release 状态失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Status`,
        message: result.message || '暂无 Helm Release 状态输出',
      })
      showNotice('success', `已加载 Helm Release ${target} 状态`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release 状态失败')
    }
  }

  const handleHelmReleaseResources = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseResources(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Resources 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Resources`,
        message: result.message || '暂无 Helm Release resources 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} resources`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Resources 失败')
    }
  }

  const handleHelmReleaseManifest = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseManifest(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Manifest 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Manifest`,
        message: result.message || '暂无 Helm Release manifest 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} manifest`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Manifest 失败')
    }
  }

  const handleHelmReleaseMetadata = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseMetadata(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Metadata 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Metadata`,
        message: result.message || '暂无 Helm Release metadata 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} metadata`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Metadata 失败')
    }
  }

  const handleHelmReleaseValues = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseValues(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Values 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Values`,
        message: result.message || '暂无 Helm Release values 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} values`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Values 失败')
    }
  }

  const handleHelmReleaseNotes = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseNotes(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Notes 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Notes`,
        message: result.message || '暂无 Helm Release notes 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} notes`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Notes 失败')
    }
  }

  const handleHelmReleaseHooks = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseHooks(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release Hooks 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} Hooks`,
        message: result.message || '暂无 Helm Release hooks 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} hooks`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release Hooks 失败')
    }
  }

  const handleHelmReleaseAll = async (release: HelmReleaseInfo) => {
    if (!selectedId) return

    const target = `${release.namespace}/${release.name}`
    try {
      const result = await k8sApi.helmReleaseAll(selectedId, release.namespace, release.name)
      if (!result.success) {
        throw new Error(result.message || '加载 Helm Release All 失败')
      }
      setRolloutOutput({
        title: `Helm Release ${target} All`,
        message: result.message || '暂无 Helm Release all 输出',
      })
      showNotice('success', `已加载 Helm Release ${target} all 输出`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '加载 Helm Release All 失败')
    }
  }

  const handleRolloutStatus = async (kind: RolloutWorkloadKind, namespace: string, name: string) => {
    if (!selectedId) return

    try {
      const result = await k8sApi.rolloutStatus(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `加载 ${kind} rollout 状态失败`)
      }
      setRolloutOutput({
        title: `${kind} ${namespace}/${name} Rollout Status`,
        message: result.message || '暂无 rollout 状态输出',
      })
      showNotice('success', `已加载 ${kind} ${namespace}/${name} rollout 状态`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `加载 ${kind} rollout 状态失败`)
    }
  }

  const handleDescribeResource = async (kind: string, namespace: string, name: string) => {
    if (!selectedId) return

    const resourceLabel = namespace ? `${kind} ${namespace}/${name}` : `${kind} ${name}`
    try {
      const output = await k8sApi.describeResource(selectedId, kind, namespace, name)
      setRolloutOutput({
        title: `${resourceLabel} Describe`,
        message: output.trim() || '暂无 describe 输出',
      })
      showNotice('success', `已加载 ${resourceLabel} describe 输出`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `加载 ${resourceLabel} describe 输出失败`)
    }
  }

  const handleMutateResourceMetadata = async (kind: string, namespace: string, name: string) => {
    if (!selectedId) return

    const resourceLabel = namespace ? `${kind} ${namespace}/${name}` : `${kind} ${name}`
    const input = window.prompt(
      `更新 ${resourceLabel} 元数据`,
      'label team=platform',
    )
    if (input === null) return

    const mutation = parseMetadataMutationInput(input)
    if (!mutation) {
      showNotice('error', '请输入 label key=value、annotation key=value，或用 key- 删除')
      return
    }

    try {
      const result = await k8sApi.mutateResourceMetadata(
        selectedId,
        kind,
        namespace,
        name,
        mutation.field,
        mutation.key,
        mutation.value,
        mutation.remove,
      )
      if (!result.success) {
        throw new Error(result.message || `更新 ${resourceLabel} 元数据失败`)
      }
      showNotice('success', result.message || `${resourceLabel} 元数据已更新`)
      if (kind.startsWith('CustomResource:')) {
        await refreshCustomResourceInstances()
      } else {
        await refreshSelectedContext(true)
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `更新 ${resourceLabel} 元数据失败`)
    }
  }

  const handleUpdateCertificateSigningRequestApproval = async (
    csr: CertificateSigningRequestInfo,
    decision: CertificateSigningRequestDecision,
  ) => {
    if (!selectedId) return

    const actionLabel = decision === 'approve' ? '批准' : '拒绝'
    const confirmed = window.confirm(`确认${actionLabel} CertificateSigningRequest ${csr.name}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.updateCertificateSigningRequestApproval(selectedId, csr.name, decision)
      if (!result.success) {
        throw new Error(result.message || `${actionLabel} CertificateSigningRequest 失败`)
      }
      showNotice('success', result.message || `CertificateSigningRequest ${csr.name} 已${actionLabel}`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `${actionLabel} CertificateSigningRequest 失败`)
    }
  }

  const handleUpdateJobSuspension = async (
    kind: JobSuspensionKind,
    namespace: string,
    name: string,
    suspend: boolean,
  ) => {
    if (!selectedId) return

    const actionLabel = suspend ? '暂停' : '恢复'
    const confirmed = window.confirm(`确认${actionLabel} ${kind} ${namespace}/${name}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.updateJobSuspension(selectedId, kind, namespace, name, suspend)
      if (!result.success) {
        throw new Error(result.message || `${actionLabel} ${kind} 失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 已${actionLabel}`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `${actionLabel} ${kind} 失败`)
    }
  }

  const handleTriggerCronJob = async (namespace: string, name: string) => {
    if (!selectedId) return

    const confirmed = window.confirm(`确认立即触发 CronJob ${namespace}/${name}？`)
    if (!confirmed) return

    try {
      const result = await k8sApi.triggerCronJob(selectedId, namespace, name)
      if (!result.success) {
        throw new Error(result.message || '触发 CronJob 失败')
      }
      showNotice('success', result.message || `CronJob ${namespace}/${name} 已触发`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '触发 CronJob 失败')
    }
  }

  const handleCanICheck = async () => {
    if (!selectedId) return

    const defaultInput = selectedNamespace && selectedNamespace !== 'all'
      ? `get pods -n ${selectedNamespace}`
      : 'get pods'
    const input = window.prompt(
      '检查当前用户权限: verb resource [-n namespace] [--group apiGroup] [--subresource name] [--name resourceName]，或 verb /readyz',
      defaultInput,
    )
    if (input === null) return

    const request = parseCanIInput(input, selectedNamespace)
    if (!request) {
      showNotice('error', '请输入类似 get pods -n default、update apps/deployments --subresource scale，或 get /readyz')
      return
    }

    try {
      const result = await k8sApi.checkCanI(selectedId, request)
      setSelectedSelfSubjectAccessReview(result)
      showNotice(result.allowed ? 'success' : result.denied ? 'error' : 'info', `Can-I ${result.status}: ${result.name}`)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : '权限检查失败')
    }
  }

  const handlePauseResumeWorkload = async (
    kind: PausableWorkloadKind,
    namespace: string,
    name: string,
    paused: boolean,
  ) => {
    if (!selectedId) return

    const actionLabel = paused ? '恢复' : '暂停'
    const confirmed = window.confirm(`确认${actionLabel} ${kind} ${namespace}/${name} 的 rollout？`)
    if (!confirmed) return

    try {
      const result = paused
        ? await k8sApi.resumeWorkload(selectedId, kind, namespace, name)
        : await k8sApi.pauseWorkload(selectedId, kind, namespace, name)
      if (!result.success) {
        throw new Error(result.message || `${actionLabel} ${kind} rollout 失败`)
      }
      showNotice('success', result.message || `${kind} ${namespace}/${name} 已${actionLabel} rollout`)
      await refreshSelectedContext(true)
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : `${actionLabel} ${kind} rollout 失败`)
    }
  }

  const getStatusPillClass = () => {
    if (status === 'loading') return 'loading'
    if (status === 'ready') return 'ready'
    if (status === 'error') return 'error'
    return ''
  }

  const renderTableHead = (fields: TableField[], includeActions = false, rowClassName = '') => (
    <div className={['table-row', 'table-head', rowClassName].filter(Boolean).join(' ')}>
      {fields.map(({ label, field }) => (
        <div key={field} onClick={() => handleSort(field)}>
          {label}
          <SortIcon direction={sortField === field ? sortDirection : undefined} />
        </div>
      ))}
      {includeActions && <div className="table-actions-head">操作</div>}
    </div>
  )

  const renderActions = (actions: ActionSpec[]) => (
    <div className="table-row-actions">
      {actions.map((action) => (
        <button
          key={action.key}
          className={`action-btn ${action.className}`}
          onClick={(event) => stopRowAction(event, action.onClick)}
          title={action.title}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  )

  const describeAction = (kind: string, namespace: string, name: string): ActionSpec => ({
    key: 'describe',
    label: 'Describe',
    className: 'describe-btn',
    onClick: () => handleDescribeResource(kind, namespace, name),
    title: '查看 Describe 输出',
  })

  const metadataAction = (kind: string, namespace: string, name: string): ActionSpec => ({
    key: 'metadata',
    label: 'Meta',
    className: 'metadata-btn',
    onClick: () => handleMutateResourceMetadata(kind, namespace, name),
    title: '更新标签或注解',
  })

  const renderRolloutWorkloadActions = (
    kind: RolloutWorkloadKind,
    workload: RolloutDetailWorkload,
    options: { scaleKind?: ScaleableWorkloadKind; closeBeforeYaml?: () => void } = {},
  ) => (
    <div className="detail-section workload-actions-section">
      <div className="detail-section-header">
        <div className="detail-section-title">{kind} 操作</div>
        <div className="workload-action-bar">
          {options.scaleKind && typeof workload.replicas === 'number' && (
            <button
              className="action-btn scale-btn"
              onClick={() => handleScaleWorkload(options.scaleKind!, workload.namespace, workload.name, workload.replicas!)}
            >
              Scale
            </button>
          )}
          <button className="action-btn logs-btn" onClick={() => handleRestartWorkload(kind, workload.namespace, workload.name)}>
            Restart
          </button>
          <button className="action-btn scale-btn" onClick={() => handleSetWorkloadImage(kind, workload.namespace, workload.name)}>
            Image
          </button>
          <button className="action-btn logs-btn" onClick={() => handleRolloutStatus(kind, workload.namespace, workload.name)}>
            Status
          </button>
          <button className="action-btn logs-btn" onClick={() => handleRolloutHistory(kind, workload.namespace, workload.name)}>
            History
          </button>
          <button className="action-btn yaml-btn" onClick={() => handleRollbackWorkload(kind, workload.namespace, workload.name)}>
            Rollback
          </button>
          <button className="action-btn describe-btn" onClick={() => handleDescribeResource(kind, workload.namespace, workload.name)}>
            Describe
          </button>
          <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata(kind, workload.namespace, workload.name)}>
            Meta
          </button>
          <button
            className="action-btn yaml-btn"
            onClick={() => {
              options.closeBeforeYaml?.()
              openYamlEditor('edit', kind, workload.namespace, workload.name)
            }}
          >
            YAML
          </button>
          <button className="action-btn delete-btn" onClick={() => handleDeleteResource(kind, workload.namespace, workload.name)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  const nodeRowActions = (node: NodeInfo): ActionSpec[] => {
    const schedulingAction: NodeActionLoading = node.unschedulable ? 'uncordon' : 'cordon'
    const nodeActionBusy = nodeActionLoading !== null

    return [
      {
        key: 'shell',
        label: '进入',
        className: 'shell-btn',
        onClick: () => handleEnterNodeShell(node),
        title: '进入 Node 调试 Shell',
      },
      {
        key: schedulingAction,
        label: node.unschedulable ? 'Uncordon' : 'Cordon',
        className: 'cordon-btn',
        onClick: () => handleToggleNodeScheduling(node),
        title: node.unschedulable ? '恢复 Node 调度' : '禁止 Node 调度',
        disabled: nodeActionBusy,
      },
      {
        key: 'drain',
        label: 'Drain',
        className: 'drain-btn',
        onClick: () => handleDrainNode(node),
        title: 'Cordon 并驱逐该 Node 上可迁移的 Pod',
        disabled: nodeActionBusy,
      },
      describeAction('Node', '', node.name),
      metadataAction('Node', '', node.name),
      {
        key: 'yaml',
        label: 'YAML',
        className: 'yaml-btn',
        onClick: () => openYamlEditor('edit', 'Node', '', node.name),
        title: '编辑 YAML',
      },
      {
        key: 'delete',
        label: 'Delete',
        className: 'delete-btn',
        onClick: () => handleDeleteNode(node),
        title: '删除 Node',
        disabled: nodeActionBusy,
      },
    ]
  }

  const currentResourceCount = useMemo(() => {
    switch (selectedResourceType) {
      case 'overview':
        return events.length
      case 'workloads':
        return getVisibleNamespacedData(pods).length
          + getVisibleNamespacedData(deployments).length
          + getVisibleNamespacedData(daemonSets).length
          + getVisibleNamespacedData(statefulSets).length
          + getVisibleNamespacedData(replicaSets).length
          + getVisibleNamespacedData(replicationControllers).length
          + getVisibleNamespacedData(jobs).length
          + getVisibleNamespacedData(cronJobs).length
      case 'componentstatuses':
        return getVisibleData(componentStatuses).length
      case 'apigroups':
        return getVisibleData(apiGroups).length
      case 'apiresources':
        return getVisibleData(apiResources).length
      case 'serverversions':
        return getVisibleData(serverVersions).length
      case 'openidconfigs':
        return getVisibleData(openIDConfigurations).length
      case 'apiserverhealth':
        return getVisibleData(apiServerHealth).length
      case 'toppods':
        return getVisibleNamespacedData(pods).length
      case 'topcontainers':
        return filterData(filterNamespacedData(pods)).reduce(
          (count, pod) => count + (pod.containers?.length ?? 0),
          0,
        )
      case 'namespaces':
        return getVisibleNamespaces().length
      case 'nodes':
        return getVisibleData(nodes).length
      case 'pods':
        return getVisibleNamespacedData(pods).length
      case 'deployments':
        return getVisibleNamespacedData(deployments).length
      case 'daemonsets':
        return getVisibleNamespacedData(daemonSets).length
      case 'statefulsets':
        return getVisibleNamespacedData(statefulSets).length
      case 'replicasets':
        return getVisibleNamespacedData(replicaSets).length
      case 'replicationcontrollers':
        return getVisibleNamespacedData(replicationControllers).length
      case 'controllerrevisions':
        return getVisibleNamespacedData(controllerRevisions).length
      case 'podtemplates':
        return getVisibleNamespacedData(podTemplates).length
      case 'jobs':
        return getVisibleNamespacedData(jobs).length
      case 'cronjobs':
        return getVisibleNamespacedData(cronJobs).length
      case 'helmcharts':
        return getVisibleData(helmCharts).length
      case 'helmreleases':
        return getVisibleNamespacedData(helmReleases).length
      case 'helmrepositories':
        return getVisibleData(helmRepositories).length
      case 'services':
        return getVisibleNamespacedData(services).length
      case 'configmaps':
        return getVisibleNamespacedData(configMaps).length
      case 'secrets':
        return getVisibleNamespacedData(secrets).length
      case 'endpoints':
        return getVisibleNamespacedData(endpoints).length
      case 'portforwards':
        return getVisibleNamespacedData(portForwardSessions).length
      case 'leases':
        return getVisibleNamespacedData(leases).length
      case 'leasecandidates':
        return getVisibleNamespacedData(leaseCandidates).length
      case 'ingresses':
        return getVisibleNamespacedData(ingresses).length
      case 'ingressclasses':
        return getVisibleData(ingressClasses).length
      case 'gatewayclasses':
        return getVisibleData(gatewayClasses).length
      case 'gateways':
        return getVisibleNamespacedData(gateways).length
      case 'httproutes':
        return getVisibleNamespacedData(httpRoutes).length
      case 'grpcroutes':
        return getVisibleNamespacedData(grpcRoutes).length
      case 'tlsroutes':
        return getVisibleNamespacedData(tlsRoutes).length
      case 'tcproutes':
        return getVisibleNamespacedData(tcpRoutes).length
      case 'udproutes':
        return getVisibleNamespacedData(udpRoutes).length
      case 'referencegrants':
        return getVisibleNamespacedData(referenceGrants).length
      case 'networkpolicies':
        return getVisibleNamespacedData(networkPolicies).length
      case 'ipaddresses':
        return getVisibleData(ipAddresses).length
      case 'servicecidrs':
        return getVisibleData(serviceCIDRs).length
      case 'endpointslices':
        return getVisibleNamespacedData(endpointSlices).length
      case 'apiservices':
        return getVisibleData(apiServices).length
      case 'mutatingwebhookconfigurations':
        return getVisibleData(mutatingWebhookConfigurations).length
      case 'validatingwebhookconfigurations':
        return getVisibleData(validatingWebhookConfigurations).length
      case 'mutatingadmissionpolicies':
        return getVisibleData(mutatingAdmissionPolicies).length
      case 'mutatingadmissionpolicybindings':
        return getVisibleData(mutatingAdmissionPolicyBindings).length
      case 'validatingadmissionpolicies':
        return getVisibleData(validatingAdmissionPolicies).length
      case 'validatingadmissionpolicybindings':
        return getVisibleData(validatingAdmissionPolicyBindings).length
      case 'flowschemas':
        return getVisibleData(flowSchemas).length
      case 'prioritylevelconfigurations':
        return getVisibleData(priorityLevelConfigurations).length
      case 'certificatesigningrequests':
        return getVisibleData(certificateSigningRequests).length
      case 'clustertrustbundles':
        return getVisibleData(clusterTrustBundles).length
      case 'podcertificaterequests':
        return getVisibleNamespacedData(podCertificateRequests).length
      case 'storageversions':
        return getVisibleData(storageVersions).length
      case 'storageversionmigrations':
        return getVisibleData(storageVersionMigrations).length
      case 'persistentvolumes':
        return getVisibleData(persistentVolumes).length
      case 'persistentvolumeclaims':
        return getVisibleNamespacedData(persistentVolumeClaims).length
      case 'storageclasses':
        return getVisibleData(storageClasses).length
      case 'volumeattributesclasses':
        return getVisibleData(volumeAttributesClasses).length
      case 'csidrivers':
        return getVisibleData(csiDrivers).length
      case 'csinodes':
        return getVisibleData(csiNodes).length
      case 'volumeattachments':
        return getVisibleData(volumeAttachments).length
      case 'csistoragecapacities':
        return getVisibleNamespacedData(csiStorageCapacities).length
      case 'volumesnapshotclasses':
        return getVisibleData(volumeSnapshotClasses).length
      case 'volumesnapshots':
        return getVisibleNamespacedData(volumeSnapshots).length
      case 'volumesnapshotcontents':
        return getVisibleData(volumeSnapshotContents).length
      case 'deviceclasses':
        return getVisibleData(deviceClasses).length
      case 'devicetaintrules':
        return getVisibleData(deviceTaintRules).length
      case 'resourceclaims':
        return getVisibleNamespacedData(resourceClaims).length
      case 'resourceclaimtemplates':
        return getVisibleNamespacedData(resourceClaimTemplates).length
      case 'resourceslices':
        return getVisibleData(resourceSlices).length
      case 'serviceaccounts':
        return getVisibleNamespacedData(serviceAccounts).length
      case 'roles':
        return getVisibleNamespacedData(roles).length
      case 'rolebindings':
        return getVisibleNamespacedData(roleBindings).length
      case 'clusterroles':
        return getVisibleData(clusterRoles).length
      case 'clusterrolebindings':
        return getVisibleData(clusterRoleBindings).length
      case 'selfsubjectreviews':
        return getVisibleData(selfSubjectReviews).length
      case 'selfsubjectaccessreviews':
        return getVisibleData(selfSubjectAccessReviews).length
      case 'selfsubjectrulesreviews':
        return getVisibleNamespacedData(selfSubjectRulesReviews).length
      case 'customresourcedefinitions':
        return getVisibleData(customResourceDefinitions).length
      case 'customresources':
        return getVisibleData(customResourceInstances).length
      case 'horizontalpodautoscalers':
        return getVisibleNamespacedData(hpas).length
      case 'poddisruptionbudgets':
        return getVisibleNamespacedData(podDisruptionBudgets).length
      case 'resourcequotas':
        return getVisibleNamespacedData(resourceQuotas).length
      case 'limitranges':
        return getVisibleNamespacedData(limitRanges).length
      case 'priorityclasses':
        return getVisibleData(priorityClasses).length
      case 'runtimeclasses':
        return getVisibleData(runtimeClasses).length
      case 'events':
        return getVisibleNamespacedData(events).length
      default:
        return 0
    }
  }, [
    apiServerHealth,
    apiGroups,
    apiResources,
    apiServices,
    certificateSigningRequests,
    clusterTrustBundles,
    clusterRoleBindings,
    clusterRoles,
    componentStatuses,
    configMaps,
    controllerRevisions,
    cronJobs,
    csiDrivers,
    csiNodes,
    csiStorageCapacities,
    customResourceDefinitions,
    customResourceInstances,
    daemonSets,
    deployments,
    deviceClasses,
    deviceTaintRules,
    endpoints,
    endpointSlices,
    events,
    flowSchemas,
    gatewayClasses,
    gateways,
    getVisibleData,
    getVisibleNamespaces,
    getVisibleNamespacedData,
    grpcRoutes,
    helmCharts,
    helmReleases,
    helmRepositories,
    httpRoutes,
    hpas,
    ingressClasses,
    ingresses,
    ipAddresses,
    jobs,
    leaseCandidates,
    leases,
    limitRanges,
    mutatingAdmissionPolicies,
    mutatingAdmissionPolicyBindings,
    mutatingWebhookConfigurations,
    networkPolicies,
    namespaces,
    nodes,
    openIDConfigurations,
    persistentVolumeClaims,
    persistentVolumes,
    podCertificateRequests,
    podDisruptionBudgets,
    pods,
    podTemplates,
    portForwardSessions,
    priorityClasses,
    priorityLevelConfigurations,
    replicaSets,
    replicationControllers,
    referenceGrants,
    resourceClaimTemplates,
    resourceClaims,
    resourceQuotas,
    resourceSlices,
    roleBindings,
    roles,
    runtimeClasses,
    secrets,
    selectedResourceType,
    selfSubjectAccessReviews,
    selfSubjectReviews,
    selfSubjectRulesReviews,
    serverVersions,
    serviceAccounts,
    serviceCIDRs,
    services,
    statefulSets,
    storageClasses,
    storageVersionMigrations,
    storageVersions,
    tcpRoutes,
    tlsRoutes,
    udpRoutes,
    validatingAdmissionPolicies,
    validatingAdmissionPolicyBindings,
    validatingWebhookConfigurations,
    volumeAttachments,
    volumeAttributesClasses,
    volumeSnapshotClasses,
    volumeSnapshotContents,
    volumeSnapshots,
  ])

  const currentResourceCountLabel = selectedResourceType === 'overview'
    ? `${currentResourceCount} events`
    : `${currentResourceCount} items`

  const warningEventsCount = useMemo(() => events.filter((event) => event.type === 'Warning').length, [events])
  const readyNodeCount = clusterHealth?.readyNodes ?? nodes.filter((node) => node.status === 'Ready').length
  const totalNodeCount = clusterHealth?.totalNodes ?? nodes.length
  const unreadyNodeCount = Math.max(totalNodeCount - readyNodeCount, 0)
  const unschedulableNodeCount = nodes.filter((node) => node.unschedulable).length
  const nodeHealthDetail = totalNodeCount === 0
    ? '暂无节点数据'
    : `未就绪 ${unreadyNodeCount} 个 · 禁止调度 ${unschedulableNodeCount} 个`
  const runningPodCount = clusterHealth?.runningPods ?? pods.filter((pod) => pod.status === 'Running').length
  const totalPodCount = clusterHealth?.totalPods ?? pods.length
  const pendingPodCount = clusterHealth?.pendingPods ?? pods.filter((pod) => pod.status === 'Pending').length
  const failedPodCount = clusterHealth?.failedPods ?? pods.filter((pod) => pod.status === 'Failed').length
  const workloadCount = deployments.length + daemonSets.length + statefulSets.length + replicaSets.length + replicationControllers.length + jobs.length + cronJobs.length + helmReleases.length + podDisruptionBudgets.length
  const systemLogEvents = useMemo(() => events.slice(0, 12), [events])
  const clusterStatusLabel = status === 'loading'
    ? '加载中'
    : status === 'error'
      ? '异常'
      : watchConnected
        ? '实时同步'
        : '已就绪'
  const clusterStatusTone: SummaryCardProps['tone'] = status === 'error' ? 'error' : status === 'loading' ? 'warn' : 'ready'
  const selectedClusterCardStatus: LoadState = watchConnected && status === 'ready' ? 'ready' : status

  // Preferences and initial context loading
  useEffect(() => {
    loadContextPrefs()
  }, [loadContextPrefs])

  useEffect(() => {
    if (typeof document === 'undefined' || !document.documentElement) return
    document.documentElement.dataset.theme = appTheme
    document.documentElement.dataset.shell = hasClientShell ? 'desktop' : 'web'
  }, [appTheme, hasClientShell])

  useEffect(() => {
    loadContexts()
  }, [loadContexts])

  useEffect(() => {
    if (!selectedId) return
    void refreshSelectedContext()
  }, [selectedId, refreshAll])

  useEffect(() => {
    const liveNodeNames = new Set(nodes.map((node) => node.name))
    setSelectedNodeNames((names) => {
      const nextNames = names.filter((name) => liveNodeNames.has(name))
      return nextNames.length === names.length ? names : nextNames
    })
  }, [nodes])

  useEffect(() => {
    if (selectedResourceType !== 'nodes') {
      setSelectedNodeNames([])
      setIsNodeLabelModalOpen(false)
    }
  }, [selectedResourceType])

  useEffect(() => {
    if (!selectedId || refreshInterval === 0) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      return
    }

    refreshTimerRef.current = setInterval(() => {
      void refreshSelectedContext(true)
    }, refreshInterval * 1000)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [selectedId, refreshInterval, refreshAll])

  useEffect(() => {
    if (!selectedId) {
      setWatchConnected(false)
      return
    }

    let active = true
    const unsubscribePush = k8sApi.onPushEvent((event) => {
      if (event.type !== 'watch' || event.contextId !== selectedId) return

      if (watchRefreshTimerRef.current) {
        clearTimeout(watchRefreshTimerRef.current)
      }

      watchRefreshTimerRef.current = setTimeout(() => {
        if (active) {
          void refreshSelectedContext(true)
        }
      }, 700)
    })

    void k8sApi.subscribeWatch(selectedId)
      .then(() => {
        if (active) {
          setWatchConnected(true)
        }
      })
      .catch((err) => {
        if (!active) return
        setWatchConnected(false)
        showNotice('error', err instanceof Error ? `Watch 订阅失败: ${err.message}` : 'Watch 订阅失败')
      })

    return () => {
      active = false
      setWatchConnected(false)
      if (watchRefreshTimerRef.current) {
        clearTimeout(watchRefreshTimerRef.current)
        watchRefreshTimerRef.current = null
      }
      unsubscribePush()
      void k8sApi.unsubscribeWatch()
    }
  }, [selectedId, refreshAll])

  useEffect(() => {
    let active = true
    void k8sApi.listPortForwards()
      .then((sessions) => {
        if (active) setPortForwardSessions(sessions)
      })
      .catch((err) => {
        if (active) {
          showNotice('error', err instanceof Error ? `加载端口转发会话失败: ${err.message}` : '加载端口转发会话失败')
        }
      })
    return () => {
      active = false
    }
  }, [showNotice])

  useEffect(() => k8sApi.onPushEvent(handlePortForwardEvent), [handlePortForwardEvent])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
      if (watchRefreshTimerRef.current) clearTimeout(watchRefreshTimerRef.current)
    }
  }, [])

  const renderWorkloadOverview = () => {
    const visiblePods = getVisibleNamespacedData(pods)
    const visibleDeployments = getVisibleNamespacedData(deployments)
    const visibleDaemonSets = getVisibleNamespacedData(daemonSets)
    const visibleStatefulSets = getVisibleNamespacedData(statefulSets)
    const visibleReplicaSets = getVisibleNamespacedData(replicaSets)
    const visibleReplicationControllers = getVisibleNamespacedData(replicationControllers)
    const visibleJobs = getVisibleNamespacedData(jobs)
    const visibleCronJobs = getVisibleNamespacedData(cronJobs)
    const visibleRunningPods = visiblePods.filter((pod) => pod.status === 'Running').length
    const visibleFailedPods = visiblePods.filter((pod) => pod.status === 'Failed').length
    const readyDeployments = visibleDeployments.filter((deploy) => deploy.readyReplicas >= deploy.replicas).length
    const readyDaemonSets = visibleDaemonSets.filter((ds) => ds.numberReady >= ds.desiredNumberScheduled).length
    const readyStatefulSets = visibleStatefulSets.filter((sts) => sts.readyReplicas >= sts.replicas).length
    const activeJobs = visibleJobs.filter((job) => job.active > 0).length
    const suspendedCronJobs = visibleCronJobs.filter((cronJob) => cronJob.suspend).length
    const workloadRows: {
      key: ResourceType
      label: string
      count: number
      health: string
      tone: 'ok' | 'warn'
    }[] = [
      {
        key: 'pods',
        label: 'Pods',
        count: visiblePods.length,
        health: `Running ${visibleRunningPods} · Failed ${visibleFailedPods}`,
        tone: visibleFailedPods > 0 ? 'warn' : 'ok',
      },
      {
        key: 'deployments',
        label: 'Deployments',
        count: visibleDeployments.length,
        health: `${readyDeployments}/${visibleDeployments.length} ready`,
        tone: readyDeployments === visibleDeployments.length ? 'ok' : 'warn',
      },
      {
        key: 'daemonsets',
        label: 'Daemon Sets',
        count: visibleDaemonSets.length,
        health: `${readyDaemonSets}/${visibleDaemonSets.length} ready`,
        tone: readyDaemonSets === visibleDaemonSets.length ? 'ok' : 'warn',
      },
      {
        key: 'statefulsets',
        label: 'Stateful Sets',
        count: visibleStatefulSets.length,
        health: `${readyStatefulSets}/${visibleStatefulSets.length} ready`,
        tone: readyStatefulSets === visibleStatefulSets.length ? 'ok' : 'warn',
      },
      {
        key: 'replicasets',
        label: 'Replica Sets',
        count: visibleReplicaSets.length,
        health: `${visibleReplicaSets.reduce((sum, rs) => sum + rs.readyReplicas, 0)} ready replicas`,
        tone: 'ok',
      },
      {
        key: 'replicationcontrollers',
        label: 'Replication Controllers',
        count: visibleReplicationControllers.length,
        health: `${visibleReplicationControllers.reduce((sum, rc) => sum + rc.readyReplicas, 0)} ready replicas`,
        tone: 'ok',
      },
      {
        key: 'jobs',
        label: 'Jobs',
        count: visibleJobs.length,
        health: `${activeJobs} active`,
        tone: activeJobs > 0 ? 'warn' : 'ok',
      },
      {
        key: 'cronjobs',
        label: 'CronJobs',
        count: visibleCronJobs.length,
        health: `${suspendedCronJobs} suspended`,
        tone: suspendedCronJobs > 0 ? 'warn' : 'ok',
      },
    ]

    return (
      <div className="overview-detail workload-overview">
        <div className="overview-grid overview-status-grid">
          <SummaryCard
            label="Pods"
            value={`${visibleRunningPods}/${visiblePods.length}`}
            detail={`Failed ${visibleFailedPods}`}
            tone={visibleFailedPods > 0 ? 'error' : 'ready'}
          />
          <SummaryCard
            label="Deployments"
            value={`${readyDeployments}/${visibleDeployments.length}`}
            detail="Ready deployments"
            tone={readyDeployments === visibleDeployments.length ? 'ready' : 'warn'}
          />
          <SummaryCard
            label="Daemon Sets"
            value={`${readyDaemonSets}/${visibleDaemonSets.length}`}
            detail="Ready daemon sets"
            tone={readyDaemonSets === visibleDaemonSets.length ? 'ready' : 'warn'}
          />
          <SummaryCard
            label="Stateful Sets"
            value={`${readyStatefulSets}/${visibleStatefulSets.length}`}
            detail="Ready stateful sets"
            tone={readyStatefulSets === visibleStatefulSets.length ? 'ready' : 'warn'}
          />
        </div>

        <div className="system-log-panel">
          <div className="system-log-header">
            <div>
              <div className="system-log-title">Workload Overview</div>
              <div className="system-log-subtitle">按命名空间和搜索条件汇总当前工作负载</div>
            </div>
            <div className="system-log-count">{workloadRows.reduce((sum, row) => sum + row.count, 0)} 项</div>
          </div>
          <div className="table workload-overview-table">
            <div className="table-row table-head workload-overview-row">
              <div>类型</div>
              <div>数量</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {workloadRows.map((row) => (
              <div
                className="table-row clickable workload-overview-row"
                key={row.key}
                onClick={() => setSelectedResourceType(row.key)}
              >
                <div>{row.label}</div>
                <div>{row.count}</div>
                <div className={`status ${row.tone}`}>{row.health}</div>
                <div className="detail-value-truncate">打开 {row.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="overview-detail">
      <div className="overview-grid overview-status-grid">
        {activeContext && (
          <ClusterCard
            context={activeContext}
            isActive
            nodeCount={totalNodeCount}
            podCount={totalPodCount}
            status={selectedClusterCardStatus}
            onClick={() => selectContext(activeContext.id)}
          />
        )}
        <SummaryCard
          label="Cluster 状态"
          value={clusterStatusLabel}
          detail={activeContext ? `${selectedContextDisplayName} · ${activeContext.user}` : '请选择集群'}
          tone={clusterStatusTone}
        />
        <SummaryCard
          label="Node 健康"
          value={`${readyNodeCount}/${totalNodeCount}`}
          detail={nodeHealthDetail}
          tone={unreadyNodeCount === 0 && unschedulableNodeCount === 0 ? 'ready' : 'warn'}
        />
        <SummaryCard
          label="Pod 运行态"
          value={`${runningPodCount}/${totalPodCount}`}
          detail={`Pending ${pendingPodCount} · Failed ${failedPodCount}`}
          tone={failedPodCount > 0 ? 'error' : pendingPodCount > 0 ? 'warn' : 'ready'}
        />
        <SummaryCard
          label="Workload"
          value={workloadCount}
          detail={`${deployments.length} Deploy · ${daemonSets.length} DS · ${statefulSets.length} STS`}
        />
        <SummaryCard
          label="Warning Event"
          value={warningEventsCount}
          detail={watchConnected ? '实时 watch 刷新已启用' : '使用轮询刷新'}
          tone={warningEventsCount > 0 ? 'warn' : 'ready'}
        />
      </div>

      <div className="system-log-panel">
        <div className="system-log-header">
          <div>
            <div className="system-log-title">系统日志</div>
            <div className="system-log-subtitle">来自 Kubernetes Event 的最新集群事件</div>
          </div>
          <div className="system-log-count">{events.length} 条</div>
        </div>
        <div className="system-log-list">
          {systemLogEvents.map((event) => (
            <div
              key={`${event.namespace}-${event.name}`}
              className={`system-log-item ${event.type === 'Warning' ? 'warning' : 'normal'}`}
            >
              <div className="system-log-item-main">
                <span className="system-log-type">{event.type || 'Normal'}</span>
                <span className="system-log-reason">{event.reason || 'Unknown'}</span>
                <span className="system-log-object">{event.object || 'Cluster'}</span>
              </div>
              <div className="system-log-message" title={event.message}>
                {event.message || '暂无消息内容'}
              </div>
              <div className="system-log-meta">
                <span>{event.namespace || 'cluster'}</span>
                <span>{event.count} 次</span>
                <span>{event.age}</span>
              </div>
            </div>
          ))}
          {systemLogEvents.length === 0 && <div className="system-log-empty">暂无系统事件</div>}
        </div>
      </div>
    </div>
  )

  const renderResourceTable = () => {
    switch (selectedResourceType) {
      case 'overview':
        return renderOverview()

      case 'workloads':
        return renderWorkloadOverview()

      case 'componentstatuses': {
        const sortedComponents = getVisibleData(componentStatuses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '状态', field: 'status' },
              { label: 'Message', field: 'message' },
              { label: 'Error', field: 'error' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedComponents.map((component) => (
              <div
                className="table-row clickable"
                key={component.name}
                onClick={() => setSelectedComponentStatus(component)}
              >
                <div>{component.name}</div>
                <div className={`status ${component.status === 'Healthy' ? 'ok' : component.status === 'Unhealthy' ? 'error' : 'warn'}`}>
                  {component.status}
                </div>
                <div className="cell-truncate" title={component.message}>{component.message}</div>
                <div className="cell-truncate" title={component.error}>{component.error}</div>
                <div>{component.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'ComponentStatus', '', component.name),
                    title: '查看 YAML',
                  },
                ])}
              </div>
            ))}
            {sortedComponents.length === 0 && <div className="table-empty">暂无 ComponentStatus 数据</div>}
          </div>
        )
      }

      case 'apigroups': {
        const sortedGroups = getVisibleData(apiGroups)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Preferred', field: 'preferredVersion' },
              { label: 'Versions', field: 'versions' },
              { label: 'Version Count', field: 'versionCount' },
              { label: 'Kind', field: 'kind' },
              { label: 'Server Addresses', field: 'serverAddresses' },
            ])}
            {sortedGroups.map((group) => (
              <div
                className="table-row clickable"
                key={group.name}
                onClick={() => setSelectedAPIGroup(group)}
              >
                <div>{group.name}</div>
                <div>{group.preferredVersion}</div>
                <div className="cell-truncate" title={group.versions}>{group.versions}</div>
                <div>{group.versionCount}</div>
                <div>{group.kind}</div>
                <div className="cell-truncate" title={group.serverAddresses}>{group.serverAddresses}</div>
              </div>
            ))}
            {sortedGroups.length === 0 && <div className="table-empty">暂无 APIGroup 数据</div>}
          </div>
        )
      }

      case 'apiresources': {
        const sortedResources = getVisibleData(apiResources)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Kind', field: 'kind' },
              { label: 'API Group', field: 'apiGroup' },
              { label: 'Version', field: 'version' },
              { label: 'Scope', field: 'scope' },
              { label: 'Verbs', field: 'verbs' },
              { label: 'Short Names', field: 'shortNames' },
              { label: 'Preferred', field: 'preferred' },
              { label: 'Subresource', field: 'subresource' },
            ])}
            {sortedResources.map((resource) => (
              <div
                className="table-row clickable"
                key={`${resource.groupVersion}-${resource.name}`}
                onClick={() => setSelectedAPIResource(resource)}
              >
                <div>{resource.name}</div>
                <div>{resource.kind}</div>
                <div>{resource.apiGroup}</div>
                <div>{resource.version}</div>
                <div>{resource.scope}</div>
                <div className="cell-truncate" title={resource.verbs}>{resource.verbs}</div>
                <div className="cell-truncate" title={resource.shortNames}>{resource.shortNames}</div>
                <div className={`status ${resource.preferred ? 'ok' : 'warn'}`}>
                  {resource.preferred ? 'Yes' : 'No'}
                </div>
                <div className={`status ${resource.subresource ? 'warn' : 'ok'}`}>
                  {resource.subresource ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
            {sortedResources.length === 0 && <div className="table-empty">暂无 APIResource 数据</div>}
          </div>
        )
      }

      case 'serverversions': {
        const sortedVersions = getVisibleData(serverVersions)
        return (
          <div className="table">
            {renderTableHead([
              { label: 'Git Version', field: 'gitVersion' },
              { label: 'Major', field: 'major' },
              { label: 'Minor', field: 'minor' },
              { label: 'Platform', field: 'platform' },
              { label: 'Build Date', field: 'buildDate' },
              { label: 'Git Commit', field: 'gitCommit' },
              { label: 'Tree State', field: 'gitTreeState' },
              { label: 'Go Version', field: 'goVersion' },
            ])}
            {sortedVersions.map((version) => (
              <div
                className="table-row clickable"
                key={version.name}
                onClick={() => setSelectedServerVersion(version)}
              >
                <div>{version.gitVersion}</div>
                <div>{version.major}</div>
                <div>{version.minor}</div>
                <div>{version.platform}</div>
                <div>{version.buildDate}</div>
                <div className="cell-truncate" title={version.gitCommit}>{version.gitCommit}</div>
                <div>{version.gitTreeState}</div>
                <div>{version.goVersion}</div>
              </div>
            ))}
            {sortedVersions.length === 0 && <div className="table-empty">暂无 ServerVersion 数据</div>}
          </div>
        )
      }

      case 'openidconfigs': {
        const sortedConfigs = getVisibleData(openIDConfigurations)
        return (
          <div className="table">
            {renderTableHead([
              { label: 'Issuer', field: 'issuer' },
              { label: 'JWKS URI', field: 'jwksUri' },
              { label: 'Signing Algs', field: 'signingAlgorithms' },
              { label: 'Subject Types', field: 'subjectTypesSupported' },
              { label: 'Keys', field: 'keyCount' },
              { label: 'Key IDs', field: 'keyIds' },
              { label: 'Claims', field: 'claimsSupported' },
            ])}
            {sortedConfigs.map((config) => (
              <div
                className="table-row clickable"
                key={config.name}
                onClick={() => setSelectedOpenIDConfiguration(config)}
              >
                <div className="cell-truncate" title={config.issuer}>{config.issuer}</div>
                <div className="cell-truncate" title={config.jwksUri}>{config.jwksUri}</div>
                <div className="cell-truncate" title={config.signingAlgorithms}>{config.signingAlgorithms}</div>
                <div className="cell-truncate" title={config.subjectTypesSupported}>{config.subjectTypesSupported}</div>
                <div>{config.keyCount}</div>
                <div className="cell-truncate" title={config.keyIds}>{config.keyIds}</div>
                <div className="cell-truncate" title={config.claimsSupported}>{config.claimsSupported}</div>
              </div>
            ))}
            {sortedConfigs.length === 0 && <div className="table-empty">暂无 OpenIDConfiguration 数据</div>}
          </div>
        )
      }

      case 'apiserverhealth': {
        const sortedHealth = getVisibleData(apiServerHealth)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Path', field: 'path' },
              { label: '状态', field: 'status' },
              { label: 'Healthy', field: 'healthy' },
              { label: 'Message', field: 'message' },
            ])}
            {sortedHealth.map((check) => (
              <div
                className="table-row clickable"
                key={check.name}
                onClick={() => setSelectedAPIServerHealth(check)}
              >
                <div>{check.name}</div>
                <div>{check.path}</div>
                <div className={`status ${check.status === 'Healthy' ? 'ok' : check.status === 'Unhealthy' ? 'warn' : 'error'}`}>
                  {check.status}
                </div>
                <div className={`status ${check.healthy ? 'ok' : 'error'}`}>
                  {check.healthy ? 'Yes' : 'No'}
                </div>
                <div className="cell-truncate" title={check.message}>{check.message}</div>
              </div>
            ))}
            {sortedHealth.length === 0 && <div className="table-empty">暂无 APIServerHealth 数据</div>}
          </div>
        )
      }

      case 'toppods': {
        const topPods = getTopPods()
        return (
          <VirtualizedResourceTable
            rows={topPods}
            rowHeight={32}
            resetKey={`toppods:${selectedNamespace}:${searchText}:${sortField}:${sortDirection}`}
            header={renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'CPU', field: 'cpu' },
              { label: 'Memory', field: 'memory' },
              { label: '状态', field: 'status' },
              { label: '节点', field: 'nodeName' },
              { label: '重启', field: 'restarts' },
              { label: '存活', field: 'age' },
            ], false, 'pod-table-row')}
            emptyState={<div className="table-empty">暂无 Pod metrics 数据</div>}
            getRowKey={(pod) => `${pod.namespace}-${pod.name}`}
            renderRow={(pod) => (
              <div className="table-row clickable pod-table-row" key={`${pod.namespace}-${pod.name}`} onClick={() => handlePodClick(pod, selectedId)}>
                <div>{pod.name}</div>
                <div>{pod.namespace}</div>
                <div>{pod.cpu ?? '-'}</div>
                <div>{pod.memory ?? '-'}</div>
                <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                <div>{pod.nodeName}</div>
                <div>{pod.restarts}</div>
                <div>{pod.age}</div>
              </div>
            )}
          />
        )
      }

      case 'topcontainers': {
        const topContainers = getTopContainers()
        return (
          <div className="table">
            {renderTableHead([
              { label: '容器', field: 'name' },
              { label: 'Pod', field: 'podName' },
              { label: '命名空间', field: 'namespace' },
              { label: 'CPU', field: 'cpu' },
              { label: 'Memory', field: 'memory' },
              { label: '状态', field: 'state' },
              { label: '重启', field: 'restartCount' },
              { label: '节点', field: 'nodeName' },
            ], false, 'container-table-row')}
            {topContainers.map((container) => (
              <div
                className="table-row clickable container-table-row"
                key={`${container.namespace}-${container.podName}-${container.name}`}
                onClick={() => handlePodClick(container.pod, selectedId)}
              >
                <div>{container.name}</div>
                <div>{container.podName}</div>
                <div>{container.namespace}</div>
                <div>{container.cpu}</div>
                <div>{container.memory}</div>
                <div className={`status ${container.ready ? 'ok' : 'warn'}`}>{container.state}</div>
                <div>{container.restartCount}</div>
                <div>{container.nodeName}</div>
              </div>
            ))}
            {topContainers.length === 0 && <div className="table-empty">暂无 Container metrics 数据</div>}
          </div>
        )
      }

      case 'namespaces': {
        const namespaceRows = (selectedNamespace
          ? namespaces.filter((namespace) => namespace.name === selectedNamespace)
          : namespaces
        ).map((namespace) => ({
          ...namespace,
          podCount: pods.filter((pod) => pod.namespace === namespace.name).length,
          quotaCount: resourceQuotas.filter((quota) => quota.namespace === namespace.name).length,
          limitRangeCount: limitRanges.filter((limitRange) => limitRange.namespace === namespace.name).length,
          warningCount: events.filter((event) => event.namespace === namespace.name && event.type === 'Warning').length,
        }))
        const sortedNamespaces = sortData(filterData(namespaceRows))
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '状态', field: 'status' },
              { label: 'Pods', field: 'podCount' },
              { label: 'Quotas', field: 'quotaCount' },
              { label: 'LimitRanges', field: 'limitRangeCount' },
              { label: 'Warnings', field: 'warningCount' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedNamespaces.map((namespace) => (
              <div
                className="table-row clickable"
                key={namespace.name}
                onClick={() => setSelectedNamespaceResource(namespace)}
              >
                <div>{namespace.name}</div>
                <div className={`status ${namespace.status === 'Active' ? 'ok' : 'warn'}`}>{namespace.status}</div>
                <div>{namespace.podCount}</div>
                <div>{namespace.quotaCount}</div>
                <div>{namespace.limitRangeCount}</div>
                <div className={`status ${namespace.warningCount > 0 ? 'warn' : 'ok'}`}>{namespace.warningCount}</div>
                <div>{namespace.age}</div>
                {renderActions([
                  describeAction('Namespace', '', namespace.name),
                  metadataAction('Namespace', '', namespace.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Namespace', '', namespace.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Namespace', '', namespace.name),
                    title: '删除 Namespace',
                  },
                ])}
              </div>
            ))}
            {sortedNamespaces.length === 0 && <div className="table-empty">暂无 Namespace 数据</div>}
          </div>
        )
      }

      case 'nodes': {
        const sortedNodes = getVisibleData(nodes)
        const visibleNodeNames = sortedNodes.map((node) => node.name)
        const selectedVisibleNodeCount = visibleNodeNames.filter((name) => selectedNodeNameSet.has(name)).length
        const allVisibleNodesSelected = visibleNodeNames.length > 0 && selectedVisibleNodeCount === visibleNodeNames.length
        const someVisibleNodesSelected = selectedVisibleNodeCount > 0 && !allVisibleNodesSelected
        const renderNodeHeadCell = (label: string, field: string) => (
          <div
            key={field}
            className={!label ? 'table-head-icon-cell' : undefined}
            onClick={label ? () => handleSort(field) : undefined}
          >
            {label}
            {label && <SortIcon direction={sortField === field ? sortDirection : undefined} />}
          </div>
        )
        return (
          <VirtualizedResourceTable
            rows={sortedNodes}
            rowHeight={32}
            resetKey={`nodes:${searchText}:${sortField}:${sortDirection}`}
            header={(
              <div className="table-row table-head node-table-row">
                <div className="table-select-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label="选择全部可见 Node"
                    checked={allVisibleNodesSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someVisibleNodesSelected
                    }}
                    onChange={() => toggleVisibleNodeSelection(visibleNodeNames)}
                  />
                </div>
                {[
                  { label: 'Name', field: 'name' },
                  { label: '', field: 'nodeWarnings' },
                  { label: 'CPU', field: 'cpuUsage' },
                  { label: 'Memory', field: 'memoryUsage' },
                  { label: 'Disk', field: 'diskUsage' },
                  { label: 'Taints', field: 'taints' },
                  { label: 'Roles', field: 'roles' },
                  { label: 'Version', field: 'version' },
                  { label: 'Age', field: 'age' },
                  { label: 'Conditions', field: 'status' },
                  { label: 'Scheduling', field: 'unschedulable' },
                ].map(({ label, field }) => renderNodeHeadCell(label, field))}
                <div>Actions</div>
              </div>
            )}
            emptyState={<div className="table-empty">暂无节点数据</div>}
            getRowKey={(node) => node.name}
            renderRow={(node) => (
              <div
                className={`table-row clickable node-table-row ${selectedNodeNameSet.has(node.name) ? 'selected' : ''}`}
                key={node.name}
                onClick={() => handleNodeClick(node.name, selectedId)}
              >
                <div className="table-select-cell" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`选择 Node ${node.name}`}
                    checked={selectedNodeNameSet.has(node.name)}
                    onChange={() => toggleNodeSelection(node.name)}
                  />
                </div>
                <div className="cell-truncate" title={node.name}>{node.name}</div>
                <div className={`node-warning-cell ${getNodeWarningCount(node) > 0 ? 'has-warning' : ''}`} title={`${getNodeWarningCount(node)} warning conditions`}>
                  {getNodeWarningCount(node) > 0 ? '!' : ''}
                </div>
                <div><MetricUsageBar value={node.cpuUsage} kind="cpu" /></div>
                <div><MetricUsageBar value={node.memoryUsage} kind="memory" /></div>
                <div><MetricUsageBar kind="disk" /></div>
                <div>{node.taints?.length ?? 0}</div>
                <div className="cell-truncate" title={node.roles}>{node.roles}</div>
                <div>{node.version}</div>
                <div>{node.age}</div>
                <div className={`condition-text ${node.status === 'Ready' ? 'ready' : 'warn'}`}>
                  {node.status}
                </div>
                <div className={`status ${getNodeSchedulingStatusClass(node)}`}>
                  {node.unschedulable ? 'Disabled' : 'Enabled'}
                </div>
                {renderActions([{
                  key: 'metadata',
                  label: '设置',
                  className: 'metadata-btn',
                  onClick: () => handleMutateResourceMetadata('Node', '', node.name),
                  title: `单独设置 Node ${node.name} 的 Label 或 Annotation`,
                }])}
              </div>
            )}
          />
        )
      }

      case 'pods': {
        const sortedPods = getVisibleNamespacedData(pods)
        return (
          <VirtualizedResourceTable
            rows={sortedPods}
            rowHeight={32}
            resetKey={`pods:${selectedNamespace}:${searchText}:${sortField}:${sortDirection}`}
            header={renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '状态', field: 'status' },
              { label: '节点', field: 'nodeName' },
              { label: '重启', field: 'restarts' },
              { label: 'CPU', field: 'cpu' },
              { label: 'Memory', field: 'memory' },
              { label: '存活', field: 'age' },
            ], false, 'pod-table-row')}
            emptyState={<div className="table-empty">暂无 Pod 数据</div>}
            getRowKey={(pod) => `${pod.namespace}-${pod.name}`}
            renderRow={(pod) => (
              <div className="table-row clickable pod-table-row" key={`${pod.namespace}-${pod.name}`} onClick={() => handlePodClick(pod, selectedId)}>
                <div>{pod.name}</div>
                <div>{pod.namespace}</div>
                <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                <div>{pod.nodeName}</div>
                <div>{pod.restarts}</div>
                <div>{pod.cpu ?? '-'}</div>
                <div>{pod.memory ?? '-'}</div>
                <div>{pod.age}</div>
              </div>
            )}
          />
        )
      }

      case 'deployments': {
        const sortedDeployments = getVisibleNamespacedData(deployments)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '副本', field: 'replicas' },
              { label: '就绪', field: 'readyReplicas' },
              { label: '可用', field: 'availableReplicas' },
              { label: '状态', field: 'paused' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedDeployments.map((deploy) => (
              <div className="table-row clickable" key={`${deploy.namespace}-${deploy.name}`} onClick={() => handleDeploymentClick(deploy.namespace, deploy.name, selectedId)}>
                <div>{deploy.name}</div>
                <div>{deploy.namespace}</div>
                <div>{deploy.replicas}</div>
                <div>{deploy.readyReplicas}</div>
                <div>{deploy.availableReplicas}</div>
                <div>{deploy.paused ? 'Paused' : 'Running'}</div>
                <div>{deploy.age}</div>
                {renderActions([
                  {
                    key: 'scale',
                    label: 'Scale',
                    className: 'scale-btn',
                    onClick: () => handleScaleWorkload('Deployment', deploy.namespace, deploy.name, deploy.replicas),
                    title: '扩缩容',
                  },
                  {
                    key: 'restart',
                    label: 'Restart',
                    className: 'logs-btn',
                    onClick: () => handleRestartWorkload('Deployment', deploy.namespace, deploy.name),
                    title: '滚动重启',
                  },
                  {
                    key: 'image',
                    label: 'Image',
                    className: 'scale-btn',
                    onClick: () => handleSetWorkloadImage('Deployment', deploy.namespace, deploy.name),
                    title: '更新容器镜像',
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    className: 'logs-btn',
                    onClick: () => handleRolloutStatus('Deployment', deploy.namespace, deploy.name),
                    title: '查看 rollout 状态',
                  },
                  {
                    key: 'history',
                    label: 'History',
                    className: 'logs-btn',
                    onClick: () => handleRolloutHistory('Deployment', deploy.namespace, deploy.name),
                    title: '查看 rollout 历史',
                  },
                  {
                    key: deploy.paused ? 'resume' : 'pause',
                    label: deploy.paused ? 'Resume' : 'Pause',
                    className: 'logs-btn',
                    onClick: () => handlePauseResumeWorkload('Deployment', deploy.namespace, deploy.name, deploy.paused ?? false),
                    title: deploy.paused ? '恢复 rollout' : '暂停 rollout',
                  },
                  {
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('Deployment', deploy.namespace, deploy.name),
                    title: '回滚到上一版本',
                  },
                  describeAction('Deployment', deploy.namespace, deploy.name),
                  metadataAction('Deployment', deploy.namespace, deploy.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Deployment', deploy.namespace, deploy.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Deployment', deploy.namespace, deploy.name),
                    title: '删除 Deployment',
                  },
                ])}
              </div>
            ))}
            {sortedDeployments.length === 0 && <div className="table-empty">暂无 Deployment 数据</div>}
          </div>
        )
      }

      case 'daemonsets': {
        const sortedDaemonSets = getVisibleNamespacedData(daemonSets)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '期望', field: 'desiredNumberScheduled' },
              { label: '当前', field: 'currentNumberScheduled' },
              { label: '就绪', field: 'numberReady' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedDaemonSets.map((daemonSet) => (
              <div className="table-row clickable" key={`${daemonSet.namespace}-${daemonSet.name}`} onClick={() => handleDaemonSetClick(daemonSet.namespace, daemonSet.name, selectedId)}>
                <div>{daemonSet.name}</div>
                <div>{daemonSet.namespace}</div>
                <div>{daemonSet.desiredNumberScheduled}</div>
                <div>{daemonSet.currentNumberScheduled}</div>
                <div>{daemonSet.numberReady}</div>
                <div>{daemonSet.age}</div>
                {renderActions([
                  {
                    key: 'restart',
                    label: 'Restart',
                    className: 'logs-btn',
                    onClick: () => handleRestartWorkload('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '滚动重启',
                  },
                  {
                    key: 'image',
                    label: 'Image',
                    className: 'scale-btn',
                    onClick: () => handleSetWorkloadImage('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '更新容器镜像',
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    className: 'logs-btn',
                    onClick: () => handleRolloutStatus('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '查看 rollout 状态',
                  },
                  {
                    key: 'history',
                    label: 'History',
                    className: 'logs-btn',
                    onClick: () => handleRolloutHistory('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '查看 rollout 历史',
                  },
                  {
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '回滚到上一版本',
                  },
                  describeAction('DaemonSet', daemonSet.namespace, daemonSet.name),
                  metadataAction('DaemonSet', daemonSet.namespace, daemonSet.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '删除 DaemonSet',
                  },
                ])}
              </div>
            ))}
            {sortedDaemonSets.length === 0 && <div className="table-empty">暂无 DaemonSet 数据</div>}
          </div>
        )
      }

      case 'statefulsets': {
        const sortedStatefulSets = getVisibleNamespacedData(statefulSets)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '副本', field: 'replicas' },
              { label: '就绪', field: 'readyReplicas' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedStatefulSets.map((statefulSet) => (
              <div className="table-row clickable" key={`${statefulSet.namespace}-${statefulSet.name}`} onClick={() => handleStatefulSetClick(statefulSet.namespace, statefulSet.name, selectedId)}>
                <div>{statefulSet.name}</div>
                <div>{statefulSet.namespace}</div>
                <div>{statefulSet.replicas}</div>
                <div>{statefulSet.readyReplicas}</div>
                <div>{statefulSet.age}</div>
                {renderActions([
                  {
                    key: 'scale',
                    label: 'Scale',
                    className: 'scale-btn',
                    onClick: () => handleScaleWorkload('StatefulSet', statefulSet.namespace, statefulSet.name, statefulSet.replicas),
                    title: '扩缩容',
                  },
                  {
                    key: 'restart',
                    label: 'Restart',
                    className: 'logs-btn',
                    onClick: () => handleRestartWorkload('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '滚动重启',
                  },
                  {
                    key: 'image',
                    label: 'Image',
                    className: 'scale-btn',
                    onClick: () => handleSetWorkloadImage('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '更新容器镜像',
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    className: 'logs-btn',
                    onClick: () => handleRolloutStatus('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '查看 rollout 状态',
                  },
                  {
                    key: 'history',
                    label: 'History',
                    className: 'logs-btn',
                    onClick: () => handleRolloutHistory('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '查看 rollout 历史',
                  },
                  {
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '回滚到上一版本',
                  },
                  describeAction('StatefulSet', statefulSet.namespace, statefulSet.name),
                  metadataAction('StatefulSet', statefulSet.namespace, statefulSet.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '删除 StatefulSet',
                  },
                ])}
              </div>
            ))}
            {sortedStatefulSets.length === 0 && <div className="table-empty">暂无 StatefulSet 数据</div>}
          </div>
        )
      }

      case 'replicasets': {
        const sortedReplicaSets = getVisibleNamespacedData(replicaSets)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '副本', field: 'replicas' },
              { label: '就绪', field: 'readyReplicas' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedReplicaSets.map((replicaSet) => (
              <div className="table-row clickable" key={`${replicaSet.namespace}-${replicaSet.name}`} onClick={() => handleReplicaSetClick(replicaSet.namespace, replicaSet.name, selectedId)}>
                <div>{replicaSet.name}</div>
                <div>{replicaSet.namespace}</div>
                <div>{replicaSet.replicas}</div>
                <div>{replicaSet.readyReplicas}</div>
                <div>{replicaSet.age}</div>
                {renderActions([
                  {
                    key: 'scale',
                    label: 'Scale',
                    className: 'scale-btn',
                    onClick: () => handleScaleWorkload('ReplicaSet', replicaSet.namespace, replicaSet.name, replicaSet.replicas),
                    title: '扩缩容',
                  },
                  describeAction('ReplicaSet', replicaSet.namespace, replicaSet.name),
                  metadataAction('ReplicaSet', replicaSet.namespace, replicaSet.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ReplicaSet', replicaSet.namespace, replicaSet.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ReplicaSet', replicaSet.namespace, replicaSet.name),
                    title: '删除 ReplicaSet',
                  },
                ])}
              </div>
            ))}
            {sortedReplicaSets.length === 0 && <div className="table-empty">暂无 ReplicaSet 数据</div>}
          </div>
        )
      }

      case 'replicationcontrollers': {
        const sortedReplicationControllers = getVisibleNamespacedData(replicationControllers)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '期望副本', field: 'replicas' },
              { label: '就绪', field: 'readyReplicas' },
              { label: '可用', field: 'availableReplicas' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedReplicationControllers.map((controller) => (
              <div className="table-row clickable" key={`${controller.namespace}-${controller.name}`} onClick={() => handleReplicationControllerClick(controller.namespace, controller.name, selectedId)}>
                <div>{controller.name}</div>
                <div>{controller.namespace}</div>
                <div>{controller.replicas}</div>
                <div>{controller.readyReplicas}</div>
                <div>{controller.availableReplicas}</div>
                <div>{controller.age}</div>
                {renderActions([
                  {
                    key: 'scale',
                    label: 'Scale',
                    className: 'scale-btn',
                    onClick: () => handleScaleWorkload('ReplicationController', controller.namespace, controller.name, controller.replicas),
                    title: '扩缩容',
                  },
                  describeAction('ReplicationController', controller.namespace, controller.name),
                  metadataAction('ReplicationController', controller.namespace, controller.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ReplicationController', controller.namespace, controller.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ReplicationController', controller.namespace, controller.name),
                    title: '删除 ReplicationController',
                  },
                ])}
              </div>
            ))}
            {sortedReplicationControllers.length === 0 && <div className="table-empty">暂无 ReplicationController 数据</div>}
          </div>
        )
      }

      case 'controllerrevisions': {
        const sortedControllerRevisions = getVisibleNamespacedData(controllerRevisions)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Revision', field: 'revision' },
              { label: 'Owner', field: 'owner' },
              { label: 'Data', field: 'dataKind' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedControllerRevisions.map((revision) => (
              <div className="table-row" key={`${revision.namespace}-${revision.name}`}>
                <div>{revision.name}</div>
                <div>{revision.namespace}</div>
                <div>{revision.revision}</div>
                <div className="cell-truncate" title={revision.owner}>{revision.owner}</div>
                <div className="cell-truncate" title={revision.dataKind}>{revision.dataKind}</div>
                <div>{revision.age}</div>
                {renderActions([
                  describeAction('ControllerRevision', revision.namespace, revision.name),
                  metadataAction('ControllerRevision', revision.namespace, revision.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ControllerRevision', revision.namespace, revision.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ControllerRevision', revision.namespace, revision.name),
                    title: '删除 ControllerRevision',
                  },
                ])}
              </div>
            ))}
            {sortedControllerRevisions.length === 0 && <div className="table-empty">暂无 ControllerRevision 数据</div>}
          </div>
        )
      }

      case 'podtemplates': {
        const sortedPodTemplates = getVisibleNamespacedData(podTemplates)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Containers', field: 'containers' },
              { label: 'Images', field: 'images' },
              { label: 'Restart', field: 'restartPolicy' },
              { label: 'ServiceAccount', field: 'serviceAccount' },
              { label: 'Template Labels', field: 'templateLabels' },
              { label: 'Node Selector', field: 'nodeSelector' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPodTemplates.map((template) => (
              <div className="table-row" key={`${template.namespace}-${template.name}`}>
                <div>{template.name}</div>
                <div>{template.namespace}</div>
                <div>{template.containers}</div>
                <div className="cell-truncate" title={template.images}>{template.images}</div>
                <div>{template.restartPolicy}</div>
                <div className="cell-truncate" title={template.serviceAccount}>{template.serviceAccount}</div>
                <div className="cell-truncate" title={template.templateLabels}>{template.templateLabels}</div>
                <div className="cell-truncate" title={template.nodeSelector}>{template.nodeSelector}</div>
                <div>{template.age}</div>
                {renderActions([
                  describeAction('PodTemplate', template.namespace, template.name),
                  metadataAction('PodTemplate', template.namespace, template.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PodTemplate', template.namespace, template.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PodTemplate', template.namespace, template.name),
                    title: '删除 PodTemplate',
                  },
                ])}
              </div>
            ))}
            {sortedPodTemplates.length === 0 && <div className="table-empty">暂无 PodTemplate 数据</div>}
          </div>
        )
      }

      case 'jobs': {
        const sortedJobs = getVisibleNamespacedData(jobs)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '完成数', field: 'completions' },
              { label: '成功', field: 'succeeded' },
              { label: '失败', field: 'failed' },
              { label: '暂停', field: 'suspend' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedJobs.map((job) => (
              <div className="table-row clickable" key={`${job.namespace}-${job.name}`} onClick={() => handleJobClick(job.namespace, job.name, selectedId)}>
                <div>{job.name}</div>
                <div>{job.namespace}</div>
                <div>{job.completions}</div>
                <div>{job.succeeded}</div>
                <div className={`status ${job.failed > 0 ? 'warn' : 'ok'}`}>{job.failed}</div>
                <div>{job.suspend ? '是' : '否'}</div>
                <div>{job.age}</div>
                {renderActions([
                  {
                    key: job.suspend ? 'resume' : 'suspend',
                    label: job.suspend ? 'Resume' : 'Suspend',
                    className: 'scale-btn',
                    onClick: () => handleUpdateJobSuspension('Job', job.namespace, job.name, !job.suspend),
                    title: job.suspend ? '恢复 Job' : '暂停 Job',
                  },
                  describeAction('Job', job.namespace, job.name),
                  metadataAction('Job', job.namespace, job.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Job', job.namespace, job.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Job', job.namespace, job.name),
                    title: '删除 Job',
                  },
                ])}
              </div>
            ))}
            {sortedJobs.length === 0 && <div className="table-empty">暂无 Job 数据</div>}
          </div>
        )
      }

      case 'cronjobs': {
        const sortedCronJobs = getVisibleNamespacedData(cronJobs)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '调度', field: 'schedule' },
              { label: '暂停', field: 'suspend' },
              { label: '活跃', field: 'active' },
              { label: '上次调度', field: 'lastSchedule' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCronJobs.map((cronJob) => (
              <div className="table-row clickable" key={`${cronJob.namespace}-${cronJob.name}`} onClick={() => handleCronJobClick(cronJob.namespace, cronJob.name, selectedId)}>
                <div>{cronJob.name}</div>
                <div>{cronJob.namespace}</div>
                <div>{cronJob.schedule}</div>
                <div>{cronJob.suspend ? '是' : '否'}</div>
                <div>{cronJob.active}</div>
                <div>{cronJob.lastSchedule}</div>
                <div>{cronJob.age}</div>
                {renderActions([
                  {
                    key: 'trigger',
                    label: 'Trigger',
                    className: 'scale-btn',
                    onClick: () => handleTriggerCronJob(cronJob.namespace, cronJob.name),
                    title: '立即触发 CronJob',
                  },
                  {
                    key: cronJob.suspend ? 'resume' : 'suspend',
                    label: cronJob.suspend ? 'Resume' : 'Suspend',
                    className: 'scale-btn',
                    onClick: () => handleUpdateJobSuspension('CronJob', cronJob.namespace, cronJob.name, !cronJob.suspend),
                    title: cronJob.suspend ? '恢复 CronJob' : '暂停 CronJob',
                  },
                  describeAction('CronJob', cronJob.namespace, cronJob.name),
                  metadataAction('CronJob', cronJob.namespace, cronJob.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CronJob', cronJob.namespace, cronJob.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CronJob', cronJob.namespace, cronJob.name),
                    title: '删除 CronJob',
                  },
                ])}
              </div>
            ))}
            {sortedCronJobs.length === 0 && <div className="table-empty">暂无 CronJob 数据</div>}
          </div>
        )
      }

      case 'helmcharts': {
        const sortedHelmCharts = getVisibleData(helmCharts)
        return (
          <div className="table">
            <div className="custom-resource-toolbar">
              <div>
                <div className="custom-resource-title">Helm Chart</div>
                <div className="custom-resource-subtitle">
                  本地 Helm Repository 中可安装的 chart
                </div>
              </div>
            </div>
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Repository', field: 'repository' },
              { label: 'Chart', field: 'chart' },
              { label: 'Version', field: 'version' },
              { label: 'App Version', field: 'appVersion' },
              { label: 'Description', field: 'description' },
            ], true)}
            {sortedHelmCharts.map((chart) => (
              <div className="table-row" key={`${chart.name}-${chart.version}`}>
                <div>{chart.name || '-'}</div>
                <div>{chart.repository || '-'}</div>
                <div>{chart.chart || '-'}</div>
                <div>{chart.version || '-'}</div>
                <div>{chart.appVersion || '-'}</div>
                <div title={chart.description}>{chart.description || '-'}</div>
                {renderActions([
                  {
                    key: 'install',
                    label: 'Install',
                    className: 'scale-btn',
                    onClick: () => handleInstallHelmChart(chart),
                    title: '安装 Helm Chart',
                  },
                ])}
              </div>
            ))}
            {sortedHelmCharts.length === 0 && <div className="table-empty">暂无 Helm Chart 数据</div>}
          </div>
        )
      }

      case 'helmreleases': {
        const sortedHelmReleases = getVisibleNamespacedData(helmReleases)
        return (
          <div className="table">
            <div className="custom-resource-toolbar">
              <div>
                <div className="custom-resource-title">Helm Release</div>
                <div className="custom-resource-subtitle">
                  {selectedNamespace ? selectedNamespace : '全部命名空间'}
                </div>
              </div>
              <button
                className="action-btn scale-btn"
                disabled={!selectedId}
                onClick={() => void handleInstallOrUpgradeHelmRelease()}
                title="安装或升级 Helm Release"
              >
                Install / Upgrade
              </button>
            </div>
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Revision', field: 'revision' },
              { label: '状态', field: 'status' },
              { label: 'Chart', field: 'chart' },
              { label: 'App Version', field: 'appVersion' },
              { label: '更新时间', field: 'updated' },
              { label: '存储', field: 'storage' },
            ], true)}
            {sortedHelmReleases.map((release) => (
              <div className="table-row" key={`${release.namespace}-${release.name}`}>
                <div>{release.name}</div>
                <div>{release.namespace}</div>
                <div>{release.revision}</div>
                <div className={`status ${release.status === 'deployed' ? 'ok' : release.status ? 'warn' : ''}`}>
                  {release.status || '-'}
                </div>
                <div>{release.chart}</div>
                <div>{release.appVersion}</div>
                <div>{release.updated}</div>
                <div>{release.storage}</div>
                {renderActions([
                  {
                    key: 'status',
                    label: 'Status',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseStatus(release),
                    title: '查看 Helm Release 状态',
                  },
                  {
                    key: 'resources',
                    label: 'Resources',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseResources(release),
                    title: '查看 Helm Release 资源',
                  },
                  {
                    key: 'manifest',
                    label: 'Manifest',
                    className: 'yaml-btn',
                    onClick: () => handleHelmReleaseManifest(release),
                    title: '查看 Helm Release Manifest',
                  },
                  {
                    key: 'metadata',
                    label: 'Metadata',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseMetadata(release),
                    title: '查看 Helm Release Metadata',
                  },
                  {
                    key: 'values',
                    label: 'Values',
                    className: 'yaml-btn',
                    onClick: () => handleHelmReleaseValues(release),
                    title: '查看 Helm Release Values',
                  },
                  {
                    key: 'notes',
                    label: 'Notes',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseNotes(release),
                    title: '查看 Helm Release Notes',
                  },
                  {
                    key: 'hooks',
                    label: 'Hooks',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseHooks(release),
                    title: '查看 Helm Release Hooks',
                  },
                  {
                    key: 'all',
                    label: 'All',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseAll(release),
                    title: '查看 Helm Release All 输出',
                  },
                  {
                    key: 'test',
                    label: 'Test',
                    className: 'scale-btn',
                    onClick: () => handleTestHelmRelease(release),
                    title: '执行 Helm Release 测试',
                  },
                  {
                    key: 'history',
                    label: 'History',
                    className: 'logs-btn',
                    onClick: () => handleHelmReleaseHistory(release),
                    title: '查看 Helm Release 历史',
                  },
                  {
                    key: 'upgrade',
                    label: 'Upgrade',
                    className: 'scale-btn',
                    onClick: () => handleInstallOrUpgradeHelmRelease(release),
                    title: '升级 Helm Release',
                  },
                  {
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'scale-btn',
                    onClick: () => handleRollbackHelmRelease(release),
                    title: '回滚 Helm Release',
                  },
                  {
                    key: 'uninstall',
                    label: 'Uninstall',
                    className: 'delete-btn',
                    onClick: () => handleUninstallHelmRelease(release),
                    title: '卸载 Helm Release',
                  },
                ])}
              </div>
            ))}
            {sortedHelmReleases.length === 0 && <div className="table-empty">暂无 Helm Release 数据</div>}
          </div>
        )
      }

      case 'helmrepositories': {
        const sortedHelmRepositories = getVisibleData(helmRepositories)
        return (
          <div className="table">
            <div className="custom-resource-toolbar">
              <div>
                <div className="custom-resource-title">Helm Repository</div>
                <div className="custom-resource-subtitle">
                  本地 Helm chart 仓库配置
                </div>
              </div>
              <div className="table-row-actions">
                <button
                  className="action-btn scale-btn"
                  disabled={!selectedId}
                  onClick={() => void handleAddHelmRepository()}
                  title="新增 Helm Repository"
                >
                  Add
                </button>
                <button
                  className="action-btn logs-btn"
                  disabled={!selectedId}
                  onClick={() => void handleUpdateHelmRepository()}
                  title="更新全部 Helm Repository"
                >
                  Update All
                </button>
              </div>
            </div>
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'URL', field: 'url' },
            ], true)}
            {sortedHelmRepositories.map((repository) => (
              <div className="table-row" key={repository.name || repository.url}>
                <div>{repository.name || '-'}</div>
                <div>{repository.url || '-'}</div>
                {renderActions([
                  {
                    key: 'update',
                    label: 'Update',
                    className: 'logs-btn',
                    onClick: () => handleUpdateHelmRepository(repository),
                    title: '更新 Helm Repository',
                  },
                  {
                    key: 'remove',
                    label: 'Remove',
                    className: 'delete-btn',
                    onClick: () => handleRemoveHelmRepository(repository),
                    title: '删除 Helm Repository',
                  },
                ])}
              </div>
            ))}
            {sortedHelmRepositories.length === 0 && <div className="table-empty">暂无 Helm Repository 数据</div>}
          </div>
        )
      }

      case 'services': {
        const sortedServices = getVisibleNamespacedData(services)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '类型', field: 'type' },
              { label: 'Cluster IP', field: 'clusterIP' },
              { label: '端口', field: 'ports' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedServices.map((service) => (
              <div
                className="table-row clickable"
                key={`${service.namespace}-${service.name}`}
                onClick={() => setSelectedService(service)}
              >
                <div>{service.name}</div>
                <div>{service.namespace}</div>
                <div>{service.type}</div>
                <div>{service.clusterIP}</div>
                <div>{service.ports}</div>
                <div>{service.age}</div>
                {renderActions([
                  {
                    key: 'port',
                    label: 'Port',
                    className: 'scale-btn',
                    onClick: () => setSelectedPortForwardTarget(portForwardTargetForService(service)),
                    title: '端口转发',
                  },
                  describeAction('Service', service.namespace, service.name),
                  metadataAction('Service', service.namespace, service.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Service', service.namespace, service.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Service', service.namespace, service.name),
                    title: '删除 Service',
                  },
                ])}
              </div>
            ))}
            {sortedServices.length === 0 && <div className="table-empty">暂无 Service 数据</div>}
          </div>
        )
      }

      case 'endpoints': {
        const sortedEndpoints = getVisibleNamespacedData(endpoints)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Ready', field: 'ready' },
              { label: 'Not Ready', field: 'notReady' },
              { label: '地址', field: 'addresses' },
              { label: '端口', field: 'ports' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedEndpoints.map((endpoint) => (
              <div
                className="table-row clickable"
                key={`${endpoint.namespace}-${endpoint.name}`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div>{endpoint.name}</div>
                <div>{endpoint.namespace}</div>
                <div className={endpoint.ready > 0 ? 'status ok' : 'status warn'}>{endpoint.ready}</div>
                <div className={endpoint.notReady > 0 ? 'status warn' : 'status ok'}>{endpoint.notReady}</div>
                <div className="cell-truncate" title={endpoint.addresses}>{endpoint.addresses}</div>
                <div className="cell-truncate" title={endpoint.ports}>{endpoint.ports}</div>
                <div>{endpoint.age}</div>
                {renderActions([
                  describeAction('Endpoints', endpoint.namespace, endpoint.name),
                  metadataAction('Endpoints', endpoint.namespace, endpoint.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Endpoints', endpoint.namespace, endpoint.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Endpoints', endpoint.namespace, endpoint.name),
                    title: '删除 Endpoints',
                  },
                ])}
              </div>
            ))}
            {sortedEndpoints.length === 0 && <div className="table-empty">暂无 Endpoints 数据</div>}
          </div>
        )
      }

      case 'portforwards': {
        const sortedSessions = getVisibleNamespacedData(portForwardSessions)
        return (
          <div className="table">
            {renderTableHead([
              { label: 'Kind', field: 'targetKind' },
              { label: '名称', field: 'targetName' },
              { label: '命名空间', field: 'namespace' },
              { label: '本地端口', field: 'localPort' },
              { label: '目标端口', field: 'targetPort' },
              { label: '协议', field: 'protocol' },
              { label: '状态', field: 'state' },
              { label: '启动时间', field: 'startedAt' },
              { label: 'Message', field: 'message' },
            ], true)}
            {sortedSessions.map((session) => (
              <div className="table-row" key={session.sessionId}>
                <div>{session.targetKind}</div>
                <div>{session.targetName}</div>
                <div>{session.namespace}</div>
                <div>127.0.0.1:{session.localPort}</div>
                <div>{session.targetPort}</div>
                <div>{session.protocol}</div>
                <div className={`status ${session.state === 'running' ? 'ok' : session.state === 'error' ? 'error' : 'warn'}`}>
                  {session.state}
                </div>
                <div>{formatPortForwardStartedAt(session.startedAt)}</div>
                <div className="cell-truncate" title={session.message}>{session.message ?? '-'}</div>
                {renderActions([
                  {
                    key: 'open',
                    label: 'Open',
                    className: 'logs-btn',
                    onClick: () => handleOpenPortForward(session.localPort),
                    title: '打开本地端口',
                    disabled: session.state !== 'running',
                  },
                  {
                    key: 'stop',
                    label: 'Stop',
                    className: 'delete-btn',
                    onClick: () => handleStopPortForward(session),
                    title: '停止端口转发',
                    disabled: session.state !== 'running',
                  },
                  {
                    key: 'clear',
                    label: 'Clear',
                    className: 'yaml-btn',
                    onClick: () => handleClearPortForward(session.sessionId),
                    title: '从列表清除记录',
                    disabled: session.state === 'running',
                  },
                ])}
              </div>
            ))}
            {sortedSessions.length === 0 && <div className="table-empty">暂无 Port Forwarding 会话</div>}
          </div>
        )
      }

      case 'leases': {
        const sortedLeases = getVisibleNamespacedData(leases)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Holder', field: 'holder' },
              { label: 'Duration', field: 'leaseDuration' },
              { label: 'Acquire Time', field: 'acquireTime' },
              { label: 'Renew Time', field: 'renewTime' },
              { label: 'Transitions', field: 'transitions' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedLeases.map((lease) => (
              <div
                className="table-row clickable"
                key={`${lease.namespace}-${lease.name}`}
                onClick={() => setSelectedLease(lease)}
              >
                <div>{lease.name}</div>
                <div>{lease.namespace}</div>
                <div className="cell-truncate" title={lease.holder}>{lease.holder}</div>
                <div>{lease.leaseDuration}</div>
                <div>{lease.acquireTime}</div>
                <div>{lease.renewTime}</div>
                <div>{lease.transitions}</div>
                <div>{lease.age}</div>
                {renderActions([
                  describeAction('Lease', lease.namespace, lease.name),
                  metadataAction('Lease', lease.namespace, lease.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Lease', lease.namespace, lease.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Lease', lease.namespace, lease.name),
                    title: '删除 Lease',
                  },
                ])}
              </div>
            ))}
            {sortedLeases.length === 0 && <div className="table-empty">暂无 Lease 数据</div>}
          </div>
        )
      }

      case 'leasecandidates': {
        const sortedCandidates = getVisibleNamespacedData(leaseCandidates)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Lease', field: 'leaseName' },
              { label: 'Binary', field: 'binaryVersion' },
              { label: 'Emulation', field: 'emulationVersion' },
              { label: 'Strategy', field: 'strategy' },
              { label: 'Ping Time', field: 'pingTime' },
              { label: 'Renew Time', field: 'renewTime' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCandidates.map((candidate) => (
              <div
                className="table-row clickable"
                key={`${candidate.namespace}-${candidate.name}`}
                onClick={() => setSelectedLeaseCandidate(candidate)}
              >
                <div>{candidate.name}</div>
                <div>{candidate.namespace}</div>
                <div className="cell-truncate" title={candidate.leaseName}>{candidate.leaseName}</div>
                <div>{candidate.binaryVersion}</div>
                <div>{candidate.emulationVersion}</div>
                <div className="cell-truncate" title={candidate.strategy}>{candidate.strategy}</div>
                <div>{candidate.pingTime}</div>
                <div>{candidate.renewTime}</div>
                <div>{candidate.age}</div>
                {renderActions([
                  describeAction('LeaseCandidate', candidate.namespace, candidate.name),
                  metadataAction('LeaseCandidate', candidate.namespace, candidate.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'LeaseCandidate', candidate.namespace, candidate.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('LeaseCandidate', candidate.namespace, candidate.name),
                    title: '删除 LeaseCandidate',
                  },
                ])}
              </div>
            ))}
            {sortedCandidates.length === 0 && <div className="table-empty">暂无 LeaseCandidate 数据</div>}
          </div>
        )
      }

      case 'configmaps': {
        const sortedConfigMaps = getVisibleNamespacedData(configMaps)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Data', field: 'data' },
              { label: 'Binary', field: 'binaryDataKeys' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedConfigMaps.map((configMap) => (
              <div
                className="table-row clickable"
                key={`${configMap.namespace}-${configMap.name}`}
                onClick={() => setSelectedConfigMap(configMap)}
              >
                <div>{configMap.name}</div>
                <div>{configMap.namespace}</div>
                <div>{Object.keys(configMap.data ?? {}).length}</div>
                <div>{configMap.binaryDataKeys?.length ?? 0}</div>
                <div>{configMap.age}</div>
                {renderActions([
                  describeAction('ConfigMap', configMap.namespace, configMap.name),
                  metadataAction('ConfigMap', configMap.namespace, configMap.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ConfigMap', configMap.namespace, configMap.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ConfigMap', configMap.namespace, configMap.name),
                    title: '删除 ConfigMap',
                  },
                ])}
              </div>
            ))}
            {sortedConfigMaps.length === 0 && <div className="table-empty">暂无 ConfigMap 数据</div>}
          </div>
        )
      }

      case 'secrets': {
        const sortedSecrets = getVisibleNamespacedData(secrets)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '类型', field: 'type' },
              { label: 'Keys', field: 'dataKeys' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedSecrets.map((secret) => (
              <div
                className="table-row clickable"
                key={`${secret.namespace}-${secret.name}`}
                onClick={() => setSelectedSecret(secret)}
              >
                <div>{secret.name}</div>
                <div>{secret.namespace}</div>
                <div>{secret.type}</div>
                <div>{secret.dataKeys?.length ?? 0}</div>
                <div>{secret.age}</div>
                {renderActions([
                  describeAction('Secret', secret.namespace, secret.name),
                  metadataAction('Secret', secret.namespace, secret.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Secret', secret.namespace, secret.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Secret', secret.namespace, secret.name),
                    title: '删除 Secret',
                  },
                ])}
              </div>
            ))}
            {sortedSecrets.length === 0 && <div className="table-empty">暂无 Secret 数据</div>}
          </div>
        )
      }

      case 'ingresses': {
        const sortedIngresses = getVisibleNamespacedData(ingresses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '主机', field: 'hosts' },
              { label: '地址', field: 'address' },
              { label: '规则', field: 'rules' },
              { label: 'TLS', field: 'tls' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedIngresses.map((ingress) => (
              <div
                className="table-row clickable"
                key={`${ingress.namespace}-${ingress.name}`}
                onClick={() => setSelectedIngress(ingress)}
              >
                <div>{ingress.name}</div>
                <div>{ingress.namespace}</div>
                <div>{ingress.hosts}</div>
                <div>{ingress.address || '-'}</div>
                <div>{ingress.rules?.length ?? 0}</div>
                <div>{ingress.tls?.length ?? 0}</div>
                <div>{ingress.age}</div>
                {renderActions([
                  describeAction('Ingress', ingress.namespace, ingress.name),
                  metadataAction('Ingress', ingress.namespace, ingress.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Ingress', ingress.namespace, ingress.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Ingress', ingress.namespace, ingress.name),
                    title: '删除 Ingress',
                  },
                ])}
              </div>
            ))}
            {sortedIngresses.length === 0 && <div className="table-empty">暂无 Ingress 数据</div>}
          </div>
        )
      }

      case 'ingressclasses': {
        const sortedIngressClasses = getVisibleData(ingressClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Controller', field: 'controller' },
              { label: 'Parameters', field: 'parameters' },
              { label: 'Default', field: 'default' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedIngressClasses.map((ingressClass) => (
              <div
                className="table-row clickable"
                key={ingressClass.name}
                onClick={() => setSelectedIngressClass(ingressClass)}
              >
                <div>{ingressClass.name}</div>
                <div className="cell-truncate" title={ingressClass.controller}>{ingressClass.controller}</div>
                <div className="cell-truncate" title={ingressClass.parameters}>{ingressClass.parameters}</div>
                <div className={`status ${ingressClass.default ? 'ok' : ''}`}>
                  {ingressClass.default ? 'true' : 'false'}
                </div>
                <div>{ingressClass.age}</div>
                {renderActions([
                  describeAction('IngressClass', '', ingressClass.name),
                  metadataAction('IngressClass', '', ingressClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'IngressClass', '', ingressClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('IngressClass', '', ingressClass.name),
                    title: '删除 IngressClass',
                  },
                ])}
              </div>
            ))}
            {sortedIngressClasses.length === 0 && <div className="table-empty">暂无 IngressClass 数据</div>}
          </div>
        )
      }

      case 'gatewayclasses': {
        const sortedGatewayClasses = getVisibleData(gatewayClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Controller', field: 'controllerName' },
              { label: 'Accepted', field: 'accepted' },
              { label: 'Parameters', field: 'parametersRef' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedGatewayClasses.map((gatewayClass) => (
              <div
                className="table-row clickable"
                key={gatewayClass.name}
                onClick={() => setSelectedGatewayClass(gatewayClass)}
              >
                <div>{gatewayClass.name}</div>
                <div className="cell-truncate" title={gatewayClass.controllerName}>{gatewayClass.controllerName}</div>
                <div className={`status ${gatewayClass.accepted === 'True' ? 'ok' : 'warn'}`}>{gatewayClass.accepted}</div>
                <div className="cell-truncate" title={gatewayClass.parametersRef}>{gatewayClass.parametersRef}</div>
                <div>{gatewayClass.age}</div>
                {renderActions([
                  describeAction('GatewayClass', '', gatewayClass.name),
                  metadataAction('GatewayClass', '', gatewayClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'GatewayClass', '', gatewayClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('GatewayClass', '', gatewayClass.name),
                    title: '删除 GatewayClass',
                  },
                ])}
              </div>
            ))}
            {sortedGatewayClasses.length === 0 && <div className="table-empty">暂无 GatewayClass 数据</div>}
          </div>
        )
      }

      case 'gateways': {
        const sortedGateways = getVisibleNamespacedData(gateways)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Class', field: 'gatewayClass' },
              { label: '地址', field: 'addresses' },
              { label: 'Listeners', field: 'listeners' },
              { label: 'Routes', field: 'attachedRoutes' },
              { label: 'Programmed', field: 'programmed' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedGateways.map((gateway) => (
              <div
                className="table-row clickable"
                key={`${gateway.namespace}-${gateway.name}`}
                onClick={() => setSelectedGateway(gateway)}
              >
                <div>{gateway.name}</div>
                <div>{gateway.namespace}</div>
                <div>{gateway.gatewayClass}</div>
                <div className="cell-truncate" title={gateway.addresses}>{gateway.addresses}</div>
                <div className="cell-truncate" title={gateway.listeners}>{gateway.listeners}</div>
                <div>{gateway.attachedRoutes}</div>
                <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                <div>{gateway.age}</div>
                {renderActions([
                  describeAction('Gateway', gateway.namespace, gateway.name),
                  metadataAction('Gateway', gateway.namespace, gateway.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Gateway', gateway.namespace, gateway.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Gateway', gateway.namespace, gateway.name),
                    title: '删除 Gateway',
                  },
                ])}
              </div>
            ))}
            {sortedGateways.length === 0 && <div className="table-empty">暂无 Gateway 数据</div>}
          </div>
        )
      }

      case 'httproutes': {
        const sortedHTTPRoutes = getVisibleNamespacedData(httpRoutes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Hostnames', field: 'hostnames' },
              { label: 'Parents', field: 'parentRefs' },
              { label: 'Rules', field: 'rules' },
              { label: 'Backends', field: 'backendRefs' },
              { label: 'Accepted', field: 'accepted' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedHTTPRoutes.map((route) => (
              <div
                className="table-row clickable"
                key={`${route.namespace}-${route.name}`}
                onClick={() => setSelectedHTTPRoute(route)}
              >
                <div>{route.name}</div>
                <div>{route.namespace}</div>
                <div className="cell-truncate" title={route.hostnames}>{route.hostnames}</div>
                <div className="cell-truncate" title={route.parentRefs}>{route.parentRefs}</div>
                <div>{route.rules}</div>
                <div className="cell-truncate" title={route.backendRefs}>{route.backendRefs}</div>
                <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                <div>{route.age}</div>
                {renderActions([
                  describeAction('HTTPRoute', route.namespace, route.name),
                  metadataAction('HTTPRoute', route.namespace, route.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'HTTPRoute', route.namespace, route.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('HTTPRoute', route.namespace, route.name),
                    title: '删除 HTTPRoute',
                  },
                ])}
              </div>
            ))}
            {sortedHTTPRoutes.length === 0 && <div className="table-empty">暂无 HTTPRoute 数据</div>}
          </div>
        )
      }

      case 'grpcroutes': {
        const sortedGRPCRoutes = getVisibleNamespacedData(grpcRoutes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Hostnames', field: 'hostnames' },
              { label: 'Parents', field: 'parentRefs' },
              { label: 'Rules', field: 'rules' },
              { label: 'Backends', field: 'backendRefs' },
              { label: 'Accepted', field: 'accepted' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedGRPCRoutes.map((route) => (
              <div
                className="table-row clickable"
                key={`${route.namespace}-${route.name}`}
                onClick={() => setSelectedGRPCRoute(route)}
              >
                <div>{route.name}</div>
                <div>{route.namespace}</div>
                <div className="cell-truncate" title={route.hostnames}>{route.hostnames}</div>
                <div className="cell-truncate" title={route.parentRefs}>{route.parentRefs}</div>
                <div>{route.rules}</div>
                <div className="cell-truncate" title={route.backendRefs}>{route.backendRefs}</div>
                <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                <div>{route.age}</div>
                {renderActions([
                  describeAction('GRPCRoute', route.namespace, route.name),
                  metadataAction('GRPCRoute', route.namespace, route.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'GRPCRoute', route.namespace, route.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('GRPCRoute', route.namespace, route.name),
                    title: '删除 GRPCRoute',
                  },
                ])}
              </div>
            ))}
            {sortedGRPCRoutes.length === 0 && <div className="table-empty">暂无 GRPCRoute 数据</div>}
          </div>
        )
      }

      case 'tlsroutes': {
        const sortedTLSRoutes = getVisibleNamespacedData(tlsRoutes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Hostnames', field: 'hostnames' },
              { label: 'Parents', field: 'parentRefs' },
              { label: 'Rules', field: 'rules' },
              { label: 'Backends', field: 'backendRefs' },
              { label: 'Accepted', field: 'accepted' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedTLSRoutes.map((route) => (
              <div
                className="table-row clickable"
                key={`${route.namespace}-${route.name}`}
                onClick={() => setSelectedTLSRoute(route)}
              >
                <div>{route.name}</div>
                <div>{route.namespace}</div>
                <div className="cell-truncate" title={route.hostnames}>{route.hostnames}</div>
                <div className="cell-truncate" title={route.parentRefs}>{route.parentRefs}</div>
                <div>{route.rules}</div>
                <div className="cell-truncate" title={route.backendRefs}>{route.backendRefs}</div>
                <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                <div>{route.age}</div>
                {renderActions([
                  describeAction('TLSRoute', route.namespace, route.name),
                  metadataAction('TLSRoute', route.namespace, route.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'TLSRoute', route.namespace, route.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('TLSRoute', route.namespace, route.name),
                    title: '删除 TLSRoute',
                  },
                ])}
              </div>
            ))}
            {sortedTLSRoutes.length === 0 && <div className="table-empty">暂无 TLSRoute 数据</div>}
          </div>
        )
      }

      case 'tcproutes': {
        const sortedTCPRoutes = getVisibleNamespacedData(tcpRoutes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Parents', field: 'parentRefs' },
              { label: 'Rules', field: 'rules' },
              { label: 'Backends', field: 'backendRefs' },
              { label: 'Accepted', field: 'accepted' },
              { label: 'Refs', field: 'resolvedRefs' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedTCPRoutes.map((route) => (
              <div
                className="table-row clickable"
                key={`${route.namespace}-${route.name}`}
                onClick={() => setSelectedTCPRoute(route)}
              >
                <div>{route.name}</div>
                <div>{route.namespace}</div>
                <div className="cell-truncate" title={route.parentRefs}>{route.parentRefs}</div>
                <div>{route.rules}</div>
                <div className="cell-truncate" title={route.backendRefs}>{route.backendRefs}</div>
                <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                <div className={`status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</div>
                <div>{route.age}</div>
                {renderActions([
                  describeAction('TCPRoute', route.namespace, route.name),
                  metadataAction('TCPRoute', route.namespace, route.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'TCPRoute', route.namespace, route.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('TCPRoute', route.namespace, route.name),
                    title: '删除 TCPRoute',
                  },
                ])}
              </div>
            ))}
            {sortedTCPRoutes.length === 0 && <div className="table-empty">暂无 TCPRoute 数据</div>}
          </div>
        )
      }

      case 'udproutes': {
        const sortedUDPRoutes = getVisibleNamespacedData(udpRoutes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Parents', field: 'parentRefs' },
              { label: 'Rules', field: 'rules' },
              { label: 'Backends', field: 'backendRefs' },
              { label: 'Accepted', field: 'accepted' },
              { label: 'Refs', field: 'resolvedRefs' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedUDPRoutes.map((route) => (
              <div
                className="table-row clickable"
                key={`${route.namespace}-${route.name}`}
                onClick={() => setSelectedUDPRoute(route)}
              >
                <div>{route.name}</div>
                <div>{route.namespace}</div>
                <div className="cell-truncate" title={route.parentRefs}>{route.parentRefs}</div>
                <div>{route.rules}</div>
                <div className="cell-truncate" title={route.backendRefs}>{route.backendRefs}</div>
                <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                <div className={`status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</div>
                <div>{route.age}</div>
                {renderActions([
                  describeAction('UDPRoute', route.namespace, route.name),
                  metadataAction('UDPRoute', route.namespace, route.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'UDPRoute', route.namespace, route.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('UDPRoute', route.namespace, route.name),
                    title: '删除 UDPRoute',
                  },
                ])}
              </div>
            ))}
            {sortedUDPRoutes.length === 0 && <div className="table-empty">暂无 UDPRoute 数据</div>}
          </div>
        )
      }

      case 'referencegrants': {
        const sortedReferenceGrants = getVisibleNamespacedData(referenceGrants)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'From', field: 'from' },
              { label: 'To', field: 'to' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedReferenceGrants.map((grant) => (
              <div
                className="table-row clickable"
                key={`${grant.namespace}-${grant.name}`}
                onClick={() => setSelectedReferenceGrant(grant)}
              >
                <div>{grant.name}</div>
                <div>{grant.namespace}</div>
                <div className="cell-truncate" title={grant.from}>{grant.from}</div>
                <div className="cell-truncate" title={grant.to}>{grant.to}</div>
                <div>{grant.age}</div>
                {renderActions([
                  describeAction('ReferenceGrant', grant.namespace, grant.name),
                  metadataAction('ReferenceGrant', grant.namespace, grant.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ReferenceGrant', grant.namespace, grant.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ReferenceGrant', grant.namespace, grant.name),
                    title: '删除 ReferenceGrant',
                  },
                ])}
              </div>
            ))}
            {sortedReferenceGrants.length === 0 && <div className="table-empty">暂无 ReferenceGrant 数据</div>}
          </div>
        )
      }

      case 'networkpolicies': {
        const sortedNetworkPolicies = getVisibleNamespacedData(networkPolicies)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Pod Selector', field: 'podSelector' },
              { label: '类型', field: 'policyTypes' },
              { label: 'Ingress', field: 'ingressRules' },
              { label: 'Egress', field: 'egressRules' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedNetworkPolicies.map((policy) => (
              <div
                className="table-row clickable"
                key={`${policy.namespace}-${policy.name}`}
                onClick={() => setSelectedNetworkPolicy(policy)}
              >
                <div>{policy.name}</div>
                <div>{policy.namespace}</div>
                <div>{policy.podSelector}</div>
                <div>{policy.policyTypes}</div>
                <div>{policy.ingressRules}</div>
                <div>{policy.egressRules}</div>
                <div>{policy.age}</div>
                {renderActions([
                  describeAction('NetworkPolicy', policy.namespace, policy.name),
                  metadataAction('NetworkPolicy', policy.namespace, policy.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'NetworkPolicy', policy.namespace, policy.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('NetworkPolicy', policy.namespace, policy.name),
                    title: '删除 NetworkPolicy',
                  },
                ])}
              </div>
            ))}
            {sortedNetworkPolicies.length === 0 && <div className="table-empty">暂无 NetworkPolicy 数据</div>}
          </div>
        )
      }

      case 'ipaddresses': {
        const sortedIPAddresses = getVisibleData(ipAddresses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Parent Ref', field: 'parentRef' },
              { label: 'Group', field: 'parentGroup' },
              { label: 'Resource', field: 'parentResource' },
              { label: 'Namespace', field: 'parentNamespace' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedIPAddresses.map((address) => (
              <div
                className="table-row clickable"
                key={address.name}
                onClick={() => setSelectedIPAddress(address)}
              >
                <div>{address.name}</div>
                <div className="cell-truncate" title={address.parentRef}>{address.parentRef}</div>
                <div>{address.parentGroup}</div>
                <div>{address.parentResource}</div>
                <div>{address.parentNamespace}</div>
                <div>{address.age}</div>
                {renderActions([
                  describeAction('IPAddress', '', address.name),
                  metadataAction('IPAddress', '', address.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'IPAddress', '', address.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('IPAddress', '', address.name),
                    title: '删除 IPAddress',
                  },
                ])}
              </div>
            ))}
            {sortedIPAddresses.length === 0 && <div className="table-empty">暂无 IPAddress 数据</div>}
          </div>
        )
      }

      case 'servicecidrs': {
        const sortedServiceCIDRs = getVisibleData(serviceCIDRs)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'CIDRs', field: 'cidrs' },
              { label: 'CIDR Count', field: 'cidrCount' },
              { label: 'Ready', field: 'ready' },
              { label: 'Conditions', field: 'conditions' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedServiceCIDRs.map((cidr) => (
              <div
                className="table-row clickable"
                key={cidr.name}
                onClick={() => setSelectedServiceCIDR(cidr)}
              >
                <div>{cidr.name}</div>
                <div className="cell-truncate" title={cidr.cidrs}>{cidr.cidrs}</div>
                <div>{cidr.cidrCount}</div>
                <div className={`status ${cidr.ready === 'True' ? 'ok' : 'warn'}`}>{cidr.ready}</div>
                <div>{cidr.conditions.length}</div>
                <div>{cidr.age}</div>
                {renderActions([
                  describeAction('ServiceCIDR', '', cidr.name),
                  metadataAction('ServiceCIDR', '', cidr.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ServiceCIDR', '', cidr.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ServiceCIDR', '', cidr.name),
                    title: '删除 ServiceCIDR',
                  },
                ])}
              </div>
            ))}
            {sortedServiceCIDRs.length === 0 && <div className="table-empty">暂无 ServiceCIDR 数据</div>}
          </div>
        )
      }

      case 'endpointslices': {
        const sortedEndpointSlices = getVisibleNamespacedData(endpointSlices)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Service', field: 'service' },
              { label: '地址类型', field: 'addressType' },
              { label: 'Endpoints', field: 'endpoints' },
              { label: 'Ready', field: 'ready' },
              { label: 'Not Ready', field: 'notReady' },
              { label: '地址', field: 'addresses' },
              { label: '端口', field: 'ports' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedEndpointSlices.map((slice) => (
              <div
                className="table-row clickable"
                key={`${slice.namespace}-${slice.name}`}
                onClick={() => setSelectedEndpointSlice(slice)}
              >
                <div>{slice.name}</div>
                <div>{slice.namespace}</div>
                <div>{slice.service}</div>
                <div>{slice.addressType}</div>
                <div>{slice.endpoints}</div>
                <div className={slice.ready > 0 ? 'status ok' : 'status warn'}>{slice.ready}</div>
                <div className={slice.notReady > 0 ? 'status warn' : 'status ok'}>{slice.notReady}</div>
                <div className="cell-truncate" title={slice.addresses}>{slice.addresses}</div>
                <div className="cell-truncate" title={slice.ports}>{slice.ports}</div>
                <div>{slice.age}</div>
                {renderActions([
                  describeAction('EndpointSlice', slice.namespace, slice.name),
                  metadataAction('EndpointSlice', slice.namespace, slice.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'EndpointSlice', slice.namespace, slice.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('EndpointSlice', slice.namespace, slice.name),
                    title: '删除 EndpointSlice',
                  },
                ])}
              </div>
            ))}
            {sortedEndpointSlices.length === 0 && <div className="table-empty">暂无 EndpointSlice 数据</div>}
          </div>
        )
      }

      case 'apiservices': {
        const sortedAPIServices = getVisibleData(apiServices)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Group', field: 'group' },
              { label: 'Version', field: 'version' },
              { label: 'Service', field: 'service' },
              { label: 'Available', field: 'available' },
              { label: 'Reason', field: 'reason' },
              { label: 'Group Pri', field: 'groupPriority' },
              { label: 'Version Pri', field: 'versionPriority' },
              { label: 'Skip TLS', field: 'insecureSkipTLSVerify' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedAPIServices.map((apiService) => (
              <div
                className="table-row clickable"
                key={apiService.name}
                onClick={() => setSelectedAPIService(apiService)}
              >
                <div>{apiService.name}</div>
                <div>{apiService.group}</div>
                <div>{apiService.version}</div>
                <div className="cell-truncate" title={apiService.service}>{apiService.service}</div>
                <div className={`status ${apiService.available === 'True' ? 'ok' : 'warn'}`}>
                  {apiService.available}
                </div>
                <div>{apiService.reason}</div>
                <div>{apiService.groupPriority}</div>
                <div>{apiService.versionPriority}</div>
                <div>{apiService.insecureSkipTLSVerify ? 'true' : 'false'}</div>
                <div>{apiService.age}</div>
                {renderActions([
                  describeAction('APIService', '', apiService.name),
                  metadataAction('APIService', '', apiService.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'APIService', '', apiService.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('APIService', '', apiService.name),
                    title: '删除 APIService',
                  },
                ])}
              </div>
            ))}
            {sortedAPIServices.length === 0 && <div className="table-empty">暂无 APIService 数据</div>}
          </div>
        )
      }

      case 'mutatingwebhookconfigurations': {
        const sortedMutatingWebhooks = getVisibleData(mutatingWebhookConfigurations)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Webhooks', field: 'webhooks' },
              { label: 'Failure Policy', field: 'failurePolicies' },
              { label: 'Side Effects', field: 'sideEffects' },
              { label: 'Review Versions', field: 'admissionReviewVersions' },
              { label: 'Clients', field: 'clients' },
              { label: 'Rules', field: 'rules' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedMutatingWebhooks.map((config) => (
              <div
                className="table-row clickable"
                key={config.name}
                onClick={() => setSelectedMutatingWebhookConfig(config)}
              >
                <div>{config.name}</div>
                <div>{config.webhooks}</div>
                <div>{config.failurePolicies}</div>
                <div>{config.sideEffects}</div>
                <div>{config.admissionReviewVersions}</div>
                <div className="cell-truncate" title={config.clients}>{config.clients}</div>
                <div className="cell-truncate" title={config.rules}>{config.rules}</div>
                <div>{config.age}</div>
                {renderActions([
                  describeAction('MutatingWebhookConfiguration', '', config.name),
                  metadataAction('MutatingWebhookConfiguration', '', config.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'MutatingWebhookConfiguration', '', config.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('MutatingWebhookConfiguration', '', config.name),
                    title: '删除 MutatingWebhookConfiguration',
                  },
                ])}
              </div>
            ))}
            {sortedMutatingWebhooks.length === 0 && <div className="table-empty">暂无 MutatingWebhookConfiguration 数据</div>}
          </div>
        )
      }

      case 'validatingwebhookconfigurations': {
        const sortedValidatingWebhooks = getVisibleData(validatingWebhookConfigurations)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Webhooks', field: 'webhooks' },
              { label: 'Failure Policy', field: 'failurePolicies' },
              { label: 'Side Effects', field: 'sideEffects' },
              { label: 'Review Versions', field: 'admissionReviewVersions' },
              { label: 'Clients', field: 'clients' },
              { label: 'Rules', field: 'rules' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedValidatingWebhooks.map((config) => (
              <div
                className="table-row clickable"
                key={config.name}
                onClick={() => setSelectedValidatingWebhookConfig(config)}
              >
                <div>{config.name}</div>
                <div>{config.webhooks}</div>
                <div>{config.failurePolicies}</div>
                <div>{config.sideEffects}</div>
                <div>{config.admissionReviewVersions}</div>
                <div className="cell-truncate" title={config.clients}>{config.clients}</div>
                <div className="cell-truncate" title={config.rules}>{config.rules}</div>
                <div>{config.age}</div>
                {renderActions([
                  describeAction('ValidatingWebhookConfiguration', '', config.name),
                  metadataAction('ValidatingWebhookConfiguration', '', config.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ValidatingWebhookConfiguration', '', config.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ValidatingWebhookConfiguration', '', config.name),
                    title: '删除 ValidatingWebhookConfiguration',
                  },
                ])}
              </div>
            ))}
            {sortedValidatingWebhooks.length === 0 && <div className="table-empty">暂无 ValidatingWebhookConfiguration 数据</div>}
          </div>
        )
      }

      case 'mutatingadmissionpolicies': {
        const sortedPolicies = getVisibleData(mutatingAdmissionPolicies)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Failure', field: 'failurePolicy' },
              { label: 'Reinvoke', field: 'reinvocationPolicy' },
              { label: 'Mutations', field: 'mutations' },
              { label: 'Variables', field: 'variables' },
              { label: 'Conditions', field: 'matchConditions' },
              { label: 'Rules', field: 'matchConstraints' },
              { label: 'Param', field: 'paramKind' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPolicies.map((policy) => (
              <div
                className="table-row clickable"
                key={policy.name}
                onClick={() => setSelectedMutatingAdmissionPolicy(policy)}
              >
                <div>{policy.name}</div>
                <div>{policy.failurePolicy}</div>
                <div>{policy.reinvocationPolicy}</div>
                <div>{policy.mutations}</div>
                <div>{policy.variables}</div>
                <div>{policy.matchConditions}</div>
                <div className="cell-truncate" title={policy.matchConstraints}>{policy.matchConstraints}</div>
                <div className="cell-truncate" title={policy.paramKind}>{policy.paramKind}</div>
                <div>{policy.age}</div>
                {renderActions([
                  describeAction('MutatingAdmissionPolicy', '', policy.name),
                  metadataAction('MutatingAdmissionPolicy', '', policy.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'MutatingAdmissionPolicy', '', policy.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('MutatingAdmissionPolicy', '', policy.name),
                    title: '删除 MutatingAdmissionPolicy',
                  },
                ])}
              </div>
            ))}
            {sortedPolicies.length === 0 && <div className="table-empty">暂无 MutatingAdmissionPolicy 数据</div>}
          </div>
        )
      }

      case 'mutatingadmissionpolicybindings': {
        const sortedBindings = getVisibleData(mutatingAdmissionPolicyBindings)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Policy', field: 'policyName' },
              { label: 'Param', field: 'paramRef' },
              { label: 'Rules', field: 'matchResources' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedBindings.map((binding) => (
              <div
                className="table-row clickable"
                key={binding.name}
                onClick={() => setSelectedMutatingAdmissionPolicyBinding(binding)}
              >
                <div>{binding.name}</div>
                <div className="cell-truncate" title={binding.policyName}>{binding.policyName}</div>
                <div className="cell-truncate" title={binding.paramRef}>{binding.paramRef}</div>
                <div className="cell-truncate" title={binding.matchResources}>{binding.matchResources}</div>
                <div>{binding.age}</div>
                {renderActions([
                  describeAction('MutatingAdmissionPolicyBinding', '', binding.name),
                  metadataAction('MutatingAdmissionPolicyBinding', '', binding.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'MutatingAdmissionPolicyBinding', '', binding.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('MutatingAdmissionPolicyBinding', '', binding.name),
                    title: '删除 MutatingAdmissionPolicyBinding',
                  },
                ])}
              </div>
            ))}
            {sortedBindings.length === 0 && <div className="table-empty">暂无 MutatingAdmissionPolicyBinding 数据</div>}
          </div>
        )
      }

      case 'validatingadmissionpolicies': {
        const sortedPolicies = getVisibleData(validatingAdmissionPolicies)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Failure', field: 'failurePolicy' },
              { label: 'Validations', field: 'validations' },
              { label: 'Audit', field: 'auditAnnotations' },
              { label: 'Rules', field: 'matchConstraints' },
              { label: 'Param', field: 'paramKind' },
              { label: '状态', field: 'condition' },
              { label: 'Warnings', field: 'warnings' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPolicies.map((policy) => (
              <div
                className="table-row clickable"
                key={policy.name}
                onClick={() => setSelectedValidatingAdmissionPolicy(policy)}
              >
                <div>{policy.name}</div>
                <div>{policy.failurePolicy}</div>
                <div>{policy.validations}</div>
                <div>{policy.auditAnnotations}</div>
                <div className="cell-truncate" title={policy.matchConstraints}>{policy.matchConstraints}</div>
                <div className="cell-truncate" title={policy.paramKind}>{policy.paramKind}</div>
                <div className={`status ${policy.condition === 'Ready' ? 'ok' : policy.condition === '-' ? 'warn' : 'error'}`}>
                  {policy.condition}
                </div>
                <div className={policy.warnings > 0 ? 'status warn' : ''}>{policy.warnings}</div>
                <div>{policy.age}</div>
                {renderActions([
                  describeAction('ValidatingAdmissionPolicy', '', policy.name),
                  metadataAction('ValidatingAdmissionPolicy', '', policy.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ValidatingAdmissionPolicy', '', policy.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ValidatingAdmissionPolicy', '', policy.name),
                    title: '删除 ValidatingAdmissionPolicy',
                  },
                ])}
              </div>
            ))}
            {sortedPolicies.length === 0 && <div className="table-empty">暂无 ValidatingAdmissionPolicy 数据</div>}
          </div>
        )
      }

      case 'validatingadmissionpolicybindings': {
        const sortedBindings = getVisibleData(validatingAdmissionPolicyBindings)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Policy', field: 'policyName' },
              { label: 'Actions', field: 'validationActions' },
              { label: 'Param', field: 'paramRef' },
              { label: 'Rules', field: 'matchResources' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedBindings.map((binding) => (
              <div
                className="table-row clickable"
                key={binding.name}
                onClick={() => setSelectedValidatingAdmissionPolicyBinding(binding)}
              >
                <div>{binding.name}</div>
                <div className="cell-truncate" title={binding.policyName}>{binding.policyName}</div>
                <div className="cell-truncate" title={binding.validationActions}>{binding.validationActions}</div>
                <div className="cell-truncate" title={binding.paramRef}>{binding.paramRef}</div>
                <div className="cell-truncate" title={binding.matchResources}>{binding.matchResources}</div>
                <div>{binding.age}</div>
                {renderActions([
                  describeAction('ValidatingAdmissionPolicyBinding', '', binding.name),
                  metadataAction('ValidatingAdmissionPolicyBinding', '', binding.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ValidatingAdmissionPolicyBinding', '', binding.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ValidatingAdmissionPolicyBinding', '', binding.name),
                    title: '删除 ValidatingAdmissionPolicyBinding',
                  },
                ])}
              </div>
            ))}
            {sortedBindings.length === 0 && <div className="table-empty">暂无 ValidatingAdmissionPolicyBinding 数据</div>}
          </div>
        )
      }

      case 'flowschemas': {
        const sortedFlowSchemas = getVisibleData(flowSchemas)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Priority', field: 'priorityLevel' },
              { label: 'Precedence', field: 'matchingPrecedence' },
              { label: 'Distinguisher', field: 'distinguisherMethod' },
              { label: 'Subjects', field: 'subjects' },
              { label: 'Rules', field: 'rules' },
              { label: '状态', field: 'condition' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedFlowSchemas.map((schema) => (
              <div
                className="table-row clickable"
                key={schema.name}
                onClick={() => setSelectedFlowSchema(schema)}
              >
                <div>{schema.name}</div>
                <div className="cell-truncate" title={schema.priorityLevel}>{schema.priorityLevel}</div>
                <div>{schema.matchingPrecedence || '-'}</div>
                <div>{schema.distinguisherMethod}</div>
                <div className="cell-truncate" title={schema.subjects}>{schema.subjects}</div>
                <div className="cell-truncate" title={schema.rules}>{schema.rules}</div>
                <div className={`status ${schema.condition === 'Ready' ? 'ok' : schema.condition === '-' ? 'warn' : 'error'}`}>
                  {schema.condition}
                </div>
                <div>{schema.age}</div>
                {renderActions([
                  describeAction('FlowSchema', '', schema.name),
                  metadataAction('FlowSchema', '', schema.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'FlowSchema', '', schema.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('FlowSchema', '', schema.name),
                    title: '删除 FlowSchema',
                  },
                ])}
              </div>
            ))}
            {sortedFlowSchemas.length === 0 && <div className="table-empty">暂无 FlowSchema 数据</div>}
          </div>
        )
      }

      case 'prioritylevelconfigurations': {
        const sortedPriorityLevels = getVisibleData(priorityLevelConfigurations)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Type', field: 'type' },
              { label: 'Shares', field: 'nominalConcurrencyShares' },
              { label: 'Lendable', field: 'lendablePercent' },
              { label: 'Borrowing', field: 'borrowingLimitPercent' },
              { label: 'Response', field: 'limitResponse' },
              { label: 'Queues', field: 'queues' },
              { label: 'Hand', field: 'handSize' },
              { label: 'Queue Limit', field: 'queueLengthLimit' },
              { label: '状态', field: 'condition' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPriorityLevels.map((level) => (
              <div
                className="table-row clickable"
                key={level.name}
                onClick={() => setSelectedPriorityLevel(level)}
              >
                <div>{level.name}</div>
                <div>{level.type}</div>
                <div>{level.nominalConcurrencyShares}</div>
                <div>{level.lendablePercent}</div>
                <div>{level.borrowingLimitPercent}</div>
                <div>{level.limitResponse}</div>
                <div>{level.queues}</div>
                <div>{level.handSize}</div>
                <div>{level.queueLengthLimit}</div>
                <div className={`status ${level.condition === '-' ? 'warn' : 'ok'}`}>
                  {level.condition}
                </div>
                <div>{level.age}</div>
                {renderActions([
                  describeAction('PriorityLevelConfiguration', '', level.name),
                  metadataAction('PriorityLevelConfiguration', '', level.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PriorityLevelConfiguration', '', level.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PriorityLevelConfiguration', '', level.name),
                    title: '删除 PriorityLevelConfiguration',
                  },
                ])}
              </div>
            ))}
            {sortedPriorityLevels.length === 0 && <div className="table-empty">暂无 PriorityLevelConfiguration 数据</div>}
          </div>
        )
      }

      case 'certificatesigningrequests': {
        const sortedCSRs = getVisibleData(certificateSigningRequests)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Signer', field: 'signerName' },
              { label: 'Requestor', field: 'requestor' },
              { label: '状态', field: 'condition' },
              { label: 'Reason', field: 'reason' },
              { label: 'Usages', field: 'usages' },
              { label: 'Expiration', field: 'expirationSeconds' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCSRs.map((csr) => (
              <div
                className="table-row clickable"
                key={csr.name}
                onClick={() => setSelectedCertificateSigningRequest(csr)}
              >
                <div>{csr.name}</div>
                <div className="cell-truncate" title={csr.signerName}>{csr.signerName}</div>
                <div className="cell-truncate" title={csr.requestor}>{csr.requestor}</div>
                <div className={`status ${csr.condition === 'Approved' ? 'ok' : csr.condition === 'Denied' || csr.condition === 'Failed' ? 'error' : 'warn'}`}>
                  {csr.condition}
                </div>
                <div className="cell-truncate" title={csr.reason}>{csr.reason}</div>
                <div className="cell-truncate" title={csr.usages}>{csr.usages}</div>
                <div>{csr.expirationSeconds || '-'}</div>
                <div>{csr.age}</div>
                {renderActions([
                  {
                    key: 'approve',
                    label: 'Approve',
                    className: 'scale-btn',
                    onClick: () => handleUpdateCertificateSigningRequestApproval(csr, 'approve'),
                    title: '批准 CertificateSigningRequest',
                    disabled: ['Approved', 'Denied', 'Failed'].includes(csr.condition),
                  },
                  {
                    key: 'deny',
                    label: 'Deny',
                    className: 'delete-btn',
                    onClick: () => handleUpdateCertificateSigningRequestApproval(csr, 'deny'),
                    title: '拒绝 CertificateSigningRequest',
                    disabled: ['Approved', 'Denied', 'Failed'].includes(csr.condition),
                  },
                  describeAction('CertificateSigningRequest', '', csr.name),
                  metadataAction('CertificateSigningRequest', '', csr.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CertificateSigningRequest', '', csr.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CertificateSigningRequest', '', csr.name),
                    title: '删除 CertificateSigningRequest',
                  },
                ])}
              </div>
            ))}
            {sortedCSRs.length === 0 && <div className="table-empty">暂无 CertificateSigningRequest 数据</div>}
          </div>
        )
      }

      case 'clustertrustbundles': {
        const sortedBundles = getVisibleData(clusterTrustBundles)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Signer', field: 'signerName' },
              { label: 'Certificates', field: 'certificateCount' },
              { label: 'Bundle Bytes', field: 'trustBundleBytes' },
              { label: 'Configured', field: 'trustBundleConfigured' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedBundles.map((bundle) => (
              <div
                className="table-row clickable"
                key={bundle.name}
                onClick={() => setSelectedClusterTrustBundle(bundle)}
              >
                <div>{bundle.name}</div>
                <div className="cell-truncate" title={bundle.signerName}>{bundle.signerName}</div>
                <div>{bundle.certificateCount}</div>
                <div>{bundle.trustBundleBytes}</div>
                <div className={`status ${bundle.trustBundleConfigured ? 'ok' : 'warn'}`}>{bundle.trustBundleConfigured ? 'true' : 'false'}</div>
                <div>{bundle.age}</div>
                {renderActions([
                  describeAction('ClusterTrustBundle', '', bundle.name),
                  metadataAction('ClusterTrustBundle', '', bundle.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ClusterTrustBundle', '', bundle.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ClusterTrustBundle', '', bundle.name),
                    title: '删除 ClusterTrustBundle',
                  },
                ])}
              </div>
            ))}
            {sortedBundles.length === 0 && <div className="table-empty">暂无 ClusterTrustBundle 数据</div>}
          </div>
        )
      }

      case 'podcertificaterequests': {
        const sortedRequests = getVisibleNamespacedData(podCertificateRequests)
        const requestStatusClass = (request: PodCertificateRequestInfo) => (
          request.condition.includes('Issued') || request.certificateChainConfigured
            ? 'ok'
            : request.condition.includes('Denied') || request.condition.includes('Failed')
              ? 'error'
              : 'warn'
        )
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Signer', field: 'signerName' },
              { label: 'Pod', field: 'podName' },
              { label: 'Node', field: 'nodeName' },
              { label: 'ServiceAccount', field: 'serviceAccountName' },
              { label: 'Condition', field: 'condition' },
              { label: 'Cert', field: 'certificateChainConfigured' },
              { label: 'Not After', field: 'notAfter' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedRequests.map((request) => (
              <div
                className="table-row clickable"
                key={`${request.namespace}-${request.name}`}
                onClick={() => setSelectedPodCertificateRequest(request)}
              >
                <div>{request.name}</div>
                <div>{request.namespace}</div>
                <div className="cell-truncate" title={request.signerName}>{request.signerName}</div>
                <div className="cell-truncate" title={request.podName}>{request.podName}</div>
                <div className="cell-truncate" title={request.nodeName}>{request.nodeName}</div>
                <div className="cell-truncate" title={request.serviceAccountName}>{request.serviceAccountName}</div>
                <div className={`status ${requestStatusClass(request)}`}>{request.condition}</div>
                <div className={`status ${request.certificateChainConfigured ? 'ok' : 'warn'}`}>
                  {request.certificateChainConfigured ? 'true' : 'false'}
                </div>
                <div>{request.notAfter}</div>
                <div>{request.age}</div>
                {renderActions([
                  describeAction('PodCertificateRequest', request.namespace, request.name),
                  metadataAction('PodCertificateRequest', request.namespace, request.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PodCertificateRequest', request.namespace, request.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PodCertificateRequest', request.namespace, request.name),
                    title: '删除 PodCertificateRequest',
                  },
                ])}
              </div>
            ))}
            {sortedRequests.length === 0 && <div className="table-empty">暂无 PodCertificateRequest 数据</div>}
          </div>
        )
      }

      case 'storageversions': {
        const sortedStorageVersions = getVisibleData(storageVersions)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Common Encoding', field: 'commonEncodingVersion' },
              { label: 'API Servers', field: 'storageVersions' },
              { label: 'Condition', field: 'condition' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedStorageVersions.map((version) => (
              <div
                className="table-row clickable"
                key={version.name}
                onClick={() => setSelectedStorageVersion(version)}
              >
                <div>{version.name}</div>
                <div>{version.commonEncodingVersion}</div>
                <div>{version.storageVersions}</div>
                <div className={`status ${version.condition.includes('=True') ? 'ok' : 'warn'}`}>{version.condition}</div>
                <div>{version.age}</div>
                {renderActions([
                  describeAction('StorageVersion', '', version.name),
                  metadataAction('StorageVersion', '', version.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'StorageVersion', '', version.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('StorageVersion', '', version.name),
                    title: '删除 StorageVersion',
                  },
                ])}
              </div>
            ))}
            {sortedStorageVersions.length === 0 && <div className="table-empty">暂无 StorageVersion 数据</div>}
          </div>
        )
      }

      case 'storageversionmigrations': {
        const sortedMigrations = getVisibleData(storageVersionMigrations)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Resource', field: 'resource' },
              { label: 'Group', field: 'group' },
              { label: 'Version', field: 'version' },
              { label: 'ResourceVersion', field: 'resourceVersion' },
              { label: 'Condition', field: 'condition' },
              { label: 'Continue', field: 'continueToken' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedMigrations.map((migration) => (
              <div
                className="table-row clickable"
                key={migration.name}
                onClick={() => setSelectedStorageVersionMigration(migration)}
              >
                <div>{migration.name}</div>
                <div className="cell-truncate" title={migration.resource}>{migration.resource}</div>
                <div>{migration.group}</div>
                <div>{migration.version}</div>
                <div>{migration.resourceVersion}</div>
                <div className={`status ${migration.condition.startsWith('Succeeded=True') ? 'ok' : migration.condition.startsWith('Failed=True') ? 'error' : 'warn'}`}>
                  {migration.condition}
                </div>
                <div className="cell-truncate" title={migration.continueToken}>{migration.continueToken}</div>
                <div>{migration.age}</div>
                {renderActions([
                  describeAction('StorageVersionMigration', '', migration.name),
                  metadataAction('StorageVersionMigration', '', migration.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'StorageVersionMigration', '', migration.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('StorageVersionMigration', '', migration.name),
                    title: '删除 StorageVersionMigration',
                  },
                ])}
              </div>
            ))}
            {sortedMigrations.length === 0 && <div className="table-empty">暂无 StorageVersionMigration 数据</div>}
          </div>
        )
      }

      case 'persistentvolumes': {
        const sortedPVs = getVisibleData(persistentVolumes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '容量', field: 'capacity' },
              { label: '访问模式', field: 'accessModes' },
              { label: '回收策略', field: 'reclaimPolicy' },
              { label: '状态', field: 'status' },
              { label: 'StorageClass', field: 'storageClass' },
              { label: 'Claim', field: 'claim' },
              { label: 'Source', field: 'source' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPVs.map((pv) => (
              <div className="table-row clickable" key={pv.name} onClick={() => setSelectedPersistentVolume(pv)}>
                <div>{pv.name}</div>
                <div>{pv.capacity}</div>
                <div>{pv.accessModes}</div>
                <div>{pv.reclaimPolicy}</div>
                <div className={`status ${pv.status === 'Bound' ? 'ok' : pv.status === 'Released' || pv.status === 'Failed' ? 'warn' : ''}`}>{pv.status}</div>
                <div>{pv.storageClass || '-'}</div>
                <div className="cell-truncate" title={pv.claim}>{pv.claim || '-'}</div>
                <div className="cell-truncate" title={pv.source}>{pv.source || '-'}</div>
                <div>{pv.age}</div>
                {renderActions([
                  describeAction('PersistentVolume', '', pv.name),
                  metadataAction('PersistentVolume', '', pv.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PersistentVolume', '', pv.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PersistentVolume', '', pv.name),
                    title: '删除 PV',
                  },
                ])}
              </div>
            ))}
            {sortedPVs.length === 0 && <div className="table-empty">暂无 PersistentVolume 数据</div>}
          </div>
        )
      }

      case 'persistentvolumeclaims': {
        const sortedPVCs = getVisibleNamespacedData(persistentVolumeClaims)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '状态', field: 'status' },
              { label: '容量', field: 'capacity' },
              { label: '访问模式', field: 'accessModes' },
              { label: 'StorageClass', field: 'storageClass' },
              { label: 'Volume', field: 'volumeName' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPVCs.map((pvc) => (
              <div
                className="table-row clickable"
                key={`${pvc.namespace}-${pvc.name}`}
                onClick={() => setSelectedPersistentVolumeClaim(pvc)}
              >
                <div>{pvc.name}</div>
                <div>{pvc.namespace}</div>
                <div className={`status ${pvc.status === 'Bound' ? 'ok' : pvc.status === 'Lost' ? 'warn' : ''}`}>{pvc.status}</div>
                <div>{pvc.capacity}</div>
                <div>{pvc.accessModes}</div>
                <div>{pvc.storageClass || '-'}</div>
                <div className="cell-truncate" title={pvc.volumeName}>{pvc.volumeName || '-'}</div>
                <div>{pvc.age}</div>
                {renderActions([
                  describeAction('PersistentVolumeClaim', pvc.namespace, pvc.name),
                  metadataAction('PersistentVolumeClaim', pvc.namespace, pvc.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PersistentVolumeClaim', pvc.namespace, pvc.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PersistentVolumeClaim', pvc.namespace, pvc.name),
                    title: '删除 PVC',
                  },
                ])}
              </div>
            ))}
            {sortedPVCs.length === 0 && <div className="table-empty">暂无 PersistentVolumeClaim 数据</div>}
          </div>
        )
      }

      case 'storageclasses': {
        const sortedStorageClasses = getVisibleData(storageClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Provisioner', field: 'provisioner' },
              { label: '回收策略', field: 'reclaimPolicy' },
              { label: '绑定模式', field: 'volumeBindingMode' },
              { label: 'Default', field: 'defaultClass' },
              { label: 'Expansion', field: 'allowVolumeExpansion' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedStorageClasses.map((storageClass) => (
              <div
                className="table-row clickable"
                key={storageClass.name}
                onClick={() => setSelectedStorageClass(storageClass)}
              >
                <div>{storageClass.name}</div>
                <div>{storageClass.provisioner}</div>
                <div>{storageClass.reclaimPolicy}</div>
                <div>{storageClass.volumeBindingMode}</div>
                <div className={`status ${storageClass.defaultClass ? 'ok' : ''}`}>{storageClass.defaultClass ? 'true' : 'false'}</div>
                <div className={`status ${storageClass.allowVolumeExpansion ? 'ok' : ''}`}>{storageClass.allowVolumeExpansion ? 'true' : 'false'}</div>
                <div>{storageClass.age}</div>
                {renderActions([
                  describeAction('StorageClass', '', storageClass.name),
                  metadataAction('StorageClass', '', storageClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'StorageClass', '', storageClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('StorageClass', '', storageClass.name),
                    title: '删除 StorageClass',
                  },
                ])}
              </div>
            ))}
            {sortedStorageClasses.length === 0 && <div className="table-empty">暂无 StorageClass 数据</div>}
          </div>
        )
      }

      case 'volumeattributesclasses': {
        const sortedVolumeAttributesClasses = getVisibleData(volumeAttributesClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Driver', field: 'driverName' },
              { label: 'Parameters', field: 'parameters' },
              { label: 'Param Count', field: 'parameterCount' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedVolumeAttributesClasses.map((attributesClass) => (
              <div
                className="table-row clickable"
                key={attributesClass.name}
                onClick={() => setSelectedVolumeAttributesClass(attributesClass)}
              >
                <div>{attributesClass.name}</div>
                <div>{attributesClass.driverName}</div>
                <div className="detail-value-truncate">{attributesClass.parameters}</div>
                <div>{attributesClass.parameterCount}</div>
                <div>{attributesClass.age}</div>
                {renderActions([
                  describeAction('VolumeAttributesClass', '', attributesClass.name),
                  metadataAction('VolumeAttributesClass', '', attributesClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'VolumeAttributesClass', '', attributesClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('VolumeAttributesClass', '', attributesClass.name),
                    title: '删除 VolumeAttributesClass',
                  },
                ])}
              </div>
            ))}
            {sortedVolumeAttributesClasses.length === 0 && <div className="table-empty">暂无 VolumeAttributesClass 数据</div>}
          </div>
        )
      }

      case 'csidrivers': {
        const sortedCSIDrivers = getVisibleData(csiDrivers)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Attach', field: 'attachRequired' },
              { label: 'PodInfo', field: 'podInfoOnMount' },
              { label: 'Capacity', field: 'storageCapacity' },
              { label: 'Republish', field: 'requiresRepublish' },
              { label: 'SELinux', field: 'seLinuxMount' },
              { label: 'Lifecycle', field: 'volumeLifecycleModes' },
              { label: 'FSGroup', field: 'fsGroupPolicy' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCSIDrivers.map((driver) => (
              <div
                className="table-row clickable"
                key={driver.name}
                onClick={() => setSelectedCSIDriver(driver)}
              >
                <div>{driver.name}</div>
                <div>{driver.attachRequired ? 'true' : 'false'}</div>
                <div>{driver.podInfoOnMount ? 'true' : 'false'}</div>
                <div>{driver.storageCapacity ? 'true' : 'false'}</div>
                <div>{driver.requiresRepublish ? 'true' : 'false'}</div>
                <div>{driver.seLinuxMount ? 'true' : 'false'}</div>
                <div>{driver.volumeLifecycleModes}</div>
                <div>{driver.fsGroupPolicy}</div>
                <div>{driver.age}</div>
                {renderActions([
                  describeAction('CSIDriver', '', driver.name),
                  metadataAction('CSIDriver', '', driver.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CSIDriver', '', driver.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CSIDriver', '', driver.name),
                    title: '删除 CSIDriver',
                  },
                ])}
              </div>
            ))}
            {sortedCSIDrivers.length === 0 && <div className="table-empty">暂无 CSIDriver 数据</div>}
          </div>
        )
      }

      case 'csinodes': {
        const sortedCSINodes = getVisibleData(csiNodes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Drivers', field: 'drivers' },
              { label: 'Driver Names', field: 'driverNames' },
              { label: 'Node IDs', field: 'nodeIds' },
              { label: 'Topology Keys', field: 'topologyKeys' },
              { label: 'Allocatable', field: 'allocatable' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCSINodes.map((node) => (
              <div
                className="table-row clickable"
                key={node.name}
                onClick={() => setSelectedCSINode(node)}
              >
                <div>{node.name}</div>
                <div>{node.drivers}</div>
                <div>{node.driverNames}</div>
                <div>{node.nodeIds}</div>
                <div>{node.topologyKeys}</div>
                <div>{node.allocatable}</div>
                <div>{node.age}</div>
                {renderActions([
                  describeAction('CSINode', '', node.name),
                  metadataAction('CSINode', '', node.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CSINode', '', node.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CSINode', '', node.name),
                    title: '删除 CSINode',
                  },
                ])}
              </div>
            ))}
            {sortedCSINodes.length === 0 && <div className="table-empty">暂无 CSINode 数据</div>}
          </div>
        )
      }

      case 'volumeattachments': {
        const sortedVolumeAttachments = getVisibleData(volumeAttachments)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Attacher', field: 'attacher' },
              { label: 'Node', field: 'node' },
              { label: 'Source', field: 'source' },
              { label: 'Attached', field: 'attached' },
              { label: 'Attach Error', field: 'attachError' },
              { label: 'Detach Error', field: 'detachError' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedVolumeAttachments.map((attachment) => (
              <div
                className="table-row clickable"
                key={attachment.name}
                onClick={() => setSelectedVolumeAttachment(attachment)}
              >
                <div>{attachment.name}</div>
                <div>{attachment.attacher}</div>
                <div>{attachment.node}</div>
                <div>{attachment.source}</div>
                <div>{attachment.attached ? 'true' : 'false'}</div>
                <div>{attachment.attachError}</div>
                <div>{attachment.detachError}</div>
                <div>{attachment.age}</div>
                {renderActions([
                  describeAction('VolumeAttachment', '', attachment.name),
                  metadataAction('VolumeAttachment', '', attachment.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'VolumeAttachment', '', attachment.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('VolumeAttachment', '', attachment.name),
                    title: '删除 VolumeAttachment',
                  },
                ])}
              </div>
            ))}
            {sortedVolumeAttachments.length === 0 && <div className="table-empty">暂无 VolumeAttachment 数据</div>}
          </div>
        )
      }

      case 'csistoragecapacities': {
        const sortedCSIStorageCapacities = getVisibleNamespacedData(csiStorageCapacities)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'StorageClass', field: 'storageClass' },
              { label: 'Capacity', field: 'capacity' },
              { label: 'Max Volume', field: 'maximumVolumeSize' },
              { label: 'Topology', field: 'topology' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCSIStorageCapacities.map((capacity) => (
              <div
                className="table-row clickable"
                key={`${capacity.namespace}-${capacity.name}`}
                onClick={() => setSelectedCSIStorageCapacity(capacity)}
              >
                <div>{capacity.name}</div>
                <div>{capacity.namespace}</div>
                <div>{capacity.storageClass}</div>
                <div>{capacity.capacity}</div>
                <div>{capacity.maximumVolumeSize}</div>
                <div>{capacity.topology}</div>
                <div>{capacity.age}</div>
                {renderActions([
                  describeAction('CSIStorageCapacity', capacity.namespace, capacity.name),
                  metadataAction('CSIStorageCapacity', capacity.namespace, capacity.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CSIStorageCapacity', capacity.namespace, capacity.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CSIStorageCapacity', capacity.namespace, capacity.name),
                    title: '删除 CSIStorageCapacity',
                  },
                ])}
              </div>
            ))}
            {sortedCSIStorageCapacities.length === 0 && <div className="table-empty">暂无 CSIStorageCapacity 数据</div>}
          </div>
        )
      }

      case 'volumesnapshotclasses': {
        const sortedSnapshotClasses = getVisibleData(volumeSnapshotClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Driver', field: 'driver' },
              { label: 'Deletion Policy', field: 'deletionPolicy' },
              { label: 'Parameters', field: 'parameters' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedSnapshotClasses.map((snapshotClass) => (
              <div
                className="table-row clickable"
                key={snapshotClass.name}
                onClick={() => setSelectedVolumeSnapshotClass(snapshotClass)}
              >
                <div>{snapshotClass.name}</div>
                <div>{snapshotClass.driver}</div>
                <div>{snapshotClass.deletionPolicy}</div>
                <div className="cell-truncate" title={snapshotClass.parameters}>{snapshotClass.parameters}</div>
                <div>{snapshotClass.age}</div>
                {renderActions([
                  describeAction('VolumeSnapshotClass', '', snapshotClass.name),
                  metadataAction('VolumeSnapshotClass', '', snapshotClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'VolumeSnapshotClass', '', snapshotClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('VolumeSnapshotClass', '', snapshotClass.name),
                    title: '删除 VolumeSnapshotClass',
                  },
                ])}
              </div>
            ))}
            {sortedSnapshotClasses.length === 0 && <div className="table-empty">暂无 VolumeSnapshotClass 数据</div>}
          </div>
        )
      }

      case 'volumesnapshots': {
        const sortedSnapshots = getVisibleNamespacedData(volumeSnapshots)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Class', field: 'snapshotClass' },
              { label: 'Source', field: 'source' },
              { label: 'Content', field: 'boundContent' },
              { label: 'Ready', field: 'readyToUse' },
              { label: 'Restore Size', field: 'restoreSize' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedSnapshots.map((snapshot) => (
              <div
                className="table-row clickable"
                key={`${snapshot.namespace}-${snapshot.name}`}
                onClick={() => setSelectedVolumeSnapshot(snapshot)}
              >
                <div>{snapshot.name}</div>
                <div>{snapshot.namespace}</div>
                <div>{snapshot.snapshotClass}</div>
                <div>{snapshot.source}</div>
                <div>{snapshot.boundContent}</div>
                <div className={`status ${snapshot.readyToUse ? 'ok' : 'warn'}`}>{snapshot.readyToUse ? 'true' : 'false'}</div>
                <div>{snapshot.restoreSize}</div>
                <div>{snapshot.age}</div>
                {renderActions([
                  describeAction('VolumeSnapshot', snapshot.namespace, snapshot.name),
                  metadataAction('VolumeSnapshot', snapshot.namespace, snapshot.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'VolumeSnapshot', snapshot.namespace, snapshot.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('VolumeSnapshot', snapshot.namespace, snapshot.name),
                    title: '删除 VolumeSnapshot',
                  },
                ])}
              </div>
            ))}
            {sortedSnapshots.length === 0 && <div className="table-empty">暂无 VolumeSnapshot 数据</div>}
          </div>
        )
      }

      case 'volumesnapshotcontents': {
        const sortedSnapshotContents = getVisibleData(volumeSnapshotContents)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Class', field: 'snapshotClass' },
              { label: 'Driver', field: 'driver' },
              { label: 'Deletion Policy', field: 'deletionPolicy' },
              { label: 'Snapshot', field: 'volumeSnapshot' },
              { label: 'Ready', field: 'readyToUse' },
              { label: 'Handle', field: 'handle' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedSnapshotContents.map((content) => (
              <div
                className="table-row clickable"
                key={content.name}
                onClick={() => setSelectedVolumeSnapshotContent(content)}
              >
                <div>{content.name}</div>
                <div>{content.snapshotClass}</div>
                <div>{content.driver}</div>
                <div>{content.deletionPolicy}</div>
                <div>{content.volumeSnapshot}</div>
                <div className={`status ${content.readyToUse ? 'ok' : 'warn'}`}>{content.readyToUse ? 'true' : 'false'}</div>
                <div className="cell-truncate" title={content.handle}>{content.handle}</div>
                <div>{content.age}</div>
                {renderActions([
                  describeAction('VolumeSnapshotContent', '', content.name),
                  metadataAction('VolumeSnapshotContent', '', content.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'VolumeSnapshotContent', '', content.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('VolumeSnapshotContent', '', content.name),
                    title: '删除 VolumeSnapshotContent',
                  },
                ])}
              </div>
            ))}
            {sortedSnapshotContents.length === 0 && <div className="table-empty">暂无 VolumeSnapshotContent 数据</div>}
          </div>
        )
      }

      case 'deviceclasses': {
        const sortedDeviceClasses = getVisibleData(deviceClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Extended Resource', field: 'extendedResourceName' },
              { label: 'Selectors', field: 'selectors' },
              { label: 'Config', field: 'config' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedDeviceClasses.map((deviceClass) => (
              <div
                className="table-row clickable"
                key={deviceClass.name}
                onClick={() => setSelectedDeviceClass(deviceClass)}
              >
                <div>{deviceClass.name}</div>
                <div className="cell-truncate" title={deviceClass.extendedResourceName}>{deviceClass.extendedResourceName}</div>
                <div>{deviceClass.selectors}</div>
                <div>{deviceClass.config}</div>
                <div>{deviceClass.age}</div>
                {renderActions([
                  describeAction('DeviceClass', '', deviceClass.name),
                  metadataAction('DeviceClass', '', deviceClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'DeviceClass', '', deviceClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('DeviceClass', '', deviceClass.name),
                    title: '删除 DeviceClass',
                  },
                ])}
              </div>
            ))}
            {sortedDeviceClasses.length === 0 && <div className="table-empty">暂无 DeviceClass 数据</div>}
          </div>
        )
      }

      case 'devicetaintrules': {
        const sortedDeviceTaintRules = getVisibleData(deviceTaintRules)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Driver', field: 'driver' },
              { label: 'Pool', field: 'pool' },
              { label: 'DeviceClass', field: 'deviceClassName' },
              { label: 'Device', field: 'device' },
              { label: 'CEL', field: 'celSelectors' },
              { label: 'Taint Key', field: 'taintKey' },
              { label: 'Value', field: 'taintValue' },
              { label: 'Effect', field: 'taintEffect' },
              { label: 'Time Added', field: 'timeAdded' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedDeviceTaintRules.map((rule) => (
              <div
                className="table-row clickable"
                key={rule.name}
                onClick={() => setSelectedDeviceTaintRule(rule)}
              >
                <div>{rule.name}</div>
                <div className="cell-truncate" title={rule.driver}>{rule.driver}</div>
                <div className="cell-truncate" title={rule.pool}>{rule.pool}</div>
                <div className="cell-truncate" title={rule.deviceClassName}>{rule.deviceClassName}</div>
                <div className="cell-truncate" title={rule.device}>{rule.device}</div>
                <div>{rule.celSelectors}</div>
                <div className="cell-truncate" title={rule.taintKey}>{rule.taintKey}</div>
                <div className="cell-truncate" title={rule.taintValue}>{rule.taintValue}</div>
                <div>{rule.taintEffect}</div>
                <div>{rule.timeAdded}</div>
                <div>{rule.age}</div>
                {renderActions([
                  describeAction('DeviceTaintRule', '', rule.name),
                  metadataAction('DeviceTaintRule', '', rule.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'DeviceTaintRule', '', rule.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('DeviceTaintRule', '', rule.name),
                    title: '删除 DeviceTaintRule',
                  },
                ])}
              </div>
            ))}
            {sortedDeviceTaintRules.length === 0 && <div className="table-empty">暂无 DeviceTaintRule 数据</div>}
          </div>
        )
      }

      case 'resourceclaims': {
        const sortedResourceClaims = getVisibleNamespacedData(resourceClaims)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Device Classes', field: 'deviceClasses' },
              { label: 'Requests', field: 'requests' },
              { label: 'Allocated', field: 'allocated' },
              { label: 'Devices', field: 'allocatedDevices' },
              { label: 'Reserved', field: 'reservedFor' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedResourceClaims.map((claim) => (
              <div
                className="table-row clickable"
                key={`${claim.namespace}-${claim.name}`}
                onClick={() => setSelectedResourceClaim(claim)}
              >
                <div>{claim.name}</div>
                <div>{claim.namespace}</div>
                <div className="cell-truncate" title={claim.deviceClasses}>{claim.deviceClasses}</div>
                <div>{claim.requests}</div>
                <div className={`status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'true' : 'false'}</div>
                <div>{claim.allocatedDevices}</div>
                <div>{claim.reservedFor}</div>
                <div>{claim.age}</div>
                {renderActions([
                  describeAction('ResourceClaim', claim.namespace, claim.name),
                  metadataAction('ResourceClaim', claim.namespace, claim.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ResourceClaim', claim.namespace, claim.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ResourceClaim', claim.namespace, claim.name),
                    title: '删除 ResourceClaim',
                  },
                ])}
              </div>
            ))}
            {sortedResourceClaims.length === 0 && <div className="table-empty">暂无 ResourceClaim 数据</div>}
          </div>
        )
      }

      case 'resourceclaimtemplates': {
        const sortedResourceClaimTemplates = getVisibleNamespacedData(resourceClaimTemplates)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Device Classes', field: 'deviceClasses' },
              { label: 'Requests', field: 'requests' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedResourceClaimTemplates.map((template) => (
              <div
                className="table-row clickable"
                key={`${template.namespace}-${template.name}`}
                onClick={() => setSelectedResourceClaimTemplate(template)}
              >
                <div>{template.name}</div>
                <div>{template.namespace}</div>
                <div className="cell-truncate" title={template.deviceClasses}>{template.deviceClasses}</div>
                <div>{template.requests}</div>
                <div>{template.age}</div>
                {renderActions([
                  describeAction('ResourceClaimTemplate', template.namespace, template.name),
                  metadataAction('ResourceClaimTemplate', template.namespace, template.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ResourceClaimTemplate', template.namespace, template.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ResourceClaimTemplate', template.namespace, template.name),
                    title: '删除 ResourceClaimTemplate',
                  },
                ])}
              </div>
            ))}
            {sortedResourceClaimTemplates.length === 0 && <div className="table-empty">暂无 ResourceClaimTemplate 数据</div>}
          </div>
        )
      }

      case 'resourceslices': {
        const sortedResourceSlices = getVisibleData(resourceSlices)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Driver', field: 'driver' },
              { label: 'Pool', field: 'pool' },
              { label: 'Node', field: 'node' },
              { label: 'Devices', field: 'devices' },
              { label: 'All Nodes', field: 'allNodes' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedResourceSlices.map((slice) => (
              <div
                className="table-row clickable"
                key={slice.name}
                onClick={() => setSelectedResourceSlice(slice)}
              >
                <div>{slice.name}</div>
                <div className="cell-truncate" title={slice.driver}>{slice.driver}</div>
                <div className="cell-truncate" title={slice.pool}>{slice.pool}</div>
                <div>{slice.node}</div>
                <div>{slice.devices}</div>
                <div>{slice.allNodes ? 'true' : 'false'}</div>
                <div>{slice.age}</div>
                {renderActions([
                  describeAction('ResourceSlice', '', slice.name),
                  metadataAction('ResourceSlice', '', slice.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ResourceSlice', '', slice.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ResourceSlice', '', slice.name),
                    title: '删除 ResourceSlice',
                  },
                ])}
              </div>
            ))}
            {sortedResourceSlices.length === 0 && <div className="table-empty">暂无 ResourceSlice 数据</div>}
          </div>
        )
      }

      case 'serviceaccounts': {
        const sortedServiceAccounts = getVisibleNamespacedData(serviceAccounts)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Secrets', field: 'secrets' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedServiceAccounts.map((serviceAccount) => (
              <div
                className="table-row clickable"
                key={`${serviceAccount.namespace}-${serviceAccount.name}`}
                onClick={() => setSelectedServiceAccount(serviceAccount)}
              >
                <div>{serviceAccount.name}</div>
                <div>{serviceAccount.namespace}</div>
                <div>{serviceAccount.secrets}</div>
                <div>{serviceAccount.age}</div>
                {renderActions([
                  describeAction('ServiceAccount', serviceAccount.namespace, serviceAccount.name),
                  metadataAction('ServiceAccount', serviceAccount.namespace, serviceAccount.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ServiceAccount', serviceAccount.namespace, serviceAccount.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ServiceAccount', serviceAccount.namespace, serviceAccount.name),
                    title: '删除 ServiceAccount',
                  },
                ])}
              </div>
            ))}
            {sortedServiceAccounts.length === 0 && <div className="table-empty">暂无 ServiceAccount 数据</div>}
          </div>
        )
      }

      case 'roles': {
        const sortedRoles = getVisibleNamespacedData(roles)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '规则数', field: 'rules' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedRoles.map((role) => (
              <div className="table-row clickable" key={`${role.namespace}-${role.name}`} onClick={() => setSelectedRole(role)}>
                <div>{role.name}</div>
                <div>{role.namespace}</div>
                <div>{role.rules}</div>
                <div>{role.age}</div>
                {renderActions([
                  describeAction('Role', role.namespace, role.name),
                  metadataAction('Role', role.namespace, role.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Role', role.namespace, role.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Role', role.namespace, role.name),
                    title: '删除 Role',
                  },
                ])}
              </div>
            ))}
            {sortedRoles.length === 0 && <div className="table-empty">暂无 Role 数据</div>}
          </div>
        )
      }

      case 'rolebindings': {
        const sortedRoleBindings = getVisibleNamespacedData(roleBindings)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'RoleRef', field: 'roleRef' },
              { label: '主体数', field: 'subjects' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedRoleBindings.map((roleBinding) => (
              <div
                className="table-row clickable"
                key={`${roleBinding.namespace}-${roleBinding.name}`}
                onClick={() => setSelectedRoleBinding(roleBinding)}
              >
                <div>{roleBinding.name}</div>
                <div>{roleBinding.namespace}</div>
                <div>{roleBinding.roleRef}</div>
                <div>{roleBinding.subjects}</div>
                <div>{roleBinding.age}</div>
                {renderActions([
                  describeAction('RoleBinding', roleBinding.namespace, roleBinding.name),
                  metadataAction('RoleBinding', roleBinding.namespace, roleBinding.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'RoleBinding', roleBinding.namespace, roleBinding.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('RoleBinding', roleBinding.namespace, roleBinding.name),
                    title: '删除 RoleBinding',
                  },
                ])}
              </div>
            ))}
            {sortedRoleBindings.length === 0 && <div className="table-empty">暂无 RoleBinding 数据</div>}
          </div>
        )
      }

      case 'clusterroles': {
        const sortedClusterRoles = getVisibleData(clusterRoles)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '规则数', field: 'rules' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedClusterRoles.map((clusterRole) => (
              <div className="table-row clickable" key={clusterRole.name} onClick={() => setSelectedClusterRole(clusterRole)}>
                <div>{clusterRole.name}</div>
                <div>{clusterRole.rules}</div>
                <div>{clusterRole.age}</div>
                {renderActions([
                  describeAction('ClusterRole', '', clusterRole.name),
                  metadataAction('ClusterRole', '', clusterRole.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ClusterRole', '', clusterRole.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ClusterRole', '', clusterRole.name),
                    title: '删除 ClusterRole',
                  },
                ])}
              </div>
            ))}
            {sortedClusterRoles.length === 0 && <div className="table-empty">暂无 ClusterRole 数据</div>}
          </div>
        )
      }

      case 'clusterrolebindings': {
        const sortedClusterRoleBindings = getVisibleData(clusterRoleBindings)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'RoleRef', field: 'roleRef' },
              { label: '主体数', field: 'subjects' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedClusterRoleBindings.map((clusterRoleBinding) => (
              <div
                className="table-row clickable"
                key={clusterRoleBinding.name}
                onClick={() => setSelectedClusterRoleBinding(clusterRoleBinding)}
              >
                <div>{clusterRoleBinding.name}</div>
                <div>{clusterRoleBinding.roleRef}</div>
                <div>{clusterRoleBinding.subjects}</div>
                <div>{clusterRoleBinding.age}</div>
                {renderActions([
                  describeAction('ClusterRoleBinding', '', clusterRoleBinding.name),
                  metadataAction('ClusterRoleBinding', '', clusterRoleBinding.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ClusterRoleBinding', '', clusterRoleBinding.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ClusterRoleBinding', '', clusterRoleBinding.name),
                    title: '删除 ClusterRoleBinding',
                  },
                ])}
              </div>
            ))}
            {sortedClusterRoleBindings.length === 0 && <div className="table-empty">暂无 ClusterRoleBinding 数据</div>}
          </div>
        )
      }

      case 'selfsubjectreviews': {
        const sortedReviews = getVisibleData(selfSubjectReviews)
        return (
          <div className="table">
            {renderTableHead([
              { label: 'Username', field: 'username' },
              { label: 'UID', field: 'uid' },
              { label: 'Groups', field: 'groups' },
              { label: 'Group Count', field: 'groupCount' },
              { label: 'Extra Keys', field: 'extraKeys' },
            ])}
            {sortedReviews.map((review) => (
              <div
                className="table-row clickable"
                key={review.name}
                onClick={() => setSelectedSelfSubjectReview(review)}
              >
                <div className="cell-truncate" title={review.username}>{review.username}</div>
                <div className="cell-truncate" title={review.uid}>{review.uid}</div>
                <div className="cell-truncate" title={review.groups}>{review.groups}</div>
                <div>{review.groupCount}</div>
                <div className="cell-truncate" title={review.extraKeys}>{review.extraKeys}</div>
              </div>
            ))}
            {sortedReviews.length === 0 && <div className="table-empty">暂无 SelfSubjectReview 数据</div>}
          </div>
        )
      }

      case 'selfsubjectaccessreviews': {
        const sortedAccessReviews = getVisibleData(selfSubjectAccessReviews)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Scope', field: 'scope' },
              { label: 'Verb', field: 'verb' },
              { label: 'API Group', field: 'apiGroup' },
              { label: 'Resource', field: 'resource' },
              { label: 'Subresource', field: 'subresource' },
              { label: '状态', field: 'status' },
            ])}
            {sortedAccessReviews.map((review) => (
              <div
                className="table-row clickable"
                key={review.name}
                onClick={() => setSelectedSelfSubjectAccessReview(review)}
              >
                <div className="cell-truncate" title={review.name}>{review.name}</div>
                <div>{review.namespace}</div>
                <div>{review.scope}</div>
                <div>{review.verb}</div>
                <div className="cell-truncate" title={review.apiGroup}>{review.apiGroup}</div>
                <div className="cell-truncate" title={review.resource}>{review.resource}</div>
                <div>{review.subresource}</div>
                <div className={`status ${review.denied ? 'error' : review.allowed ? 'ok' : 'warn'}`}>
                  {review.status}
                </div>
              </div>
            ))}
            {sortedAccessReviews.length === 0 && <div className="table-empty">暂无 SelfSubjectAccessReview 数据</div>}
          </div>
        )
      }

      case 'selfsubjectrulesreviews': {
        const sortedRules = getVisibleNamespacedData(selfSubjectRulesReviews)
        return (
          <div className="table">
            {renderTableHead([
              { label: '命名空间', field: 'namespace' },
              { label: '类型', field: 'type' },
              { label: 'Verbs', field: 'verbs' },
              { label: 'API Groups', field: 'apiGroups' },
              { label: 'Resources', field: 'resources' },
              { label: 'Resource Names', field: 'resourceNames' },
              { label: 'Non-resource URLs', field: 'nonResourceURLs' },
              { label: '完整性', field: 'incomplete' },
            ])}
            {sortedRules.map((rule) => (
              <div
                className="table-row clickable"
                key={rule.name}
                onClick={() => setSelectedSelfSubjectRule(rule)}
              >
                <div>{rule.namespace}</div>
                <div>{rule.type}</div>
                <div className="cell-truncate" title={rule.verbs}>{rule.verbs}</div>
                <div className="cell-truncate" title={rule.apiGroups}>{rule.apiGroups}</div>
                <div className="cell-truncate" title={rule.resources}>{rule.resources}</div>
                <div className="cell-truncate" title={rule.resourceNames}>{rule.resourceNames}</div>
                <div className="cell-truncate" title={rule.nonResourceURLs}>{rule.nonResourceURLs}</div>
                <div className={`status ${rule.incomplete ? 'warn' : 'ok'}`}>
                  {rule.incomplete ? 'Incomplete' : 'Complete'}
                </div>
              </div>
            ))}
            {sortedRules.length === 0 && <div className="table-empty">暂无 SelfSubjectRulesReview 数据</div>}
          </div>
        )
      }

      case 'customresourcedefinitions': {
        const sortedCRDs = getVisibleData(customResourceDefinitions)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Group', field: 'group' },
              { label: 'Kind', field: 'kind' },
              { label: 'Scope', field: 'scope' },
              { label: 'Versions', field: 'versions' },
              { label: '状态', field: 'established' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCRDs.map((crd) => (
              <div className="table-row" key={crd.name}>
                <div>{crd.name}</div>
                <div>{crd.group}</div>
                <div>{crd.kind}</div>
                <div>{crd.scope}</div>
                <div>{crd.versions}</div>
                <div className={`status ${crd.established ? 'ok' : 'warn'}`}>{crd.established ? 'Established' : 'Pending'}</div>
                <div>{crd.age}</div>
                {renderActions([
                  {
                    key: 'instances',
                    label: 'Instances',
                    className: 'scale-btn',
                    onClick: () => handleOpenCustomResourceInstances(crd),
                    title: '查看自定义资源实例',
                  },
                  describeAction('CustomResourceDefinition', '', crd.name),
                  metadataAction('CustomResourceDefinition', '', crd.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'CustomResourceDefinition', '', crd.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('CustomResourceDefinition', '', crd.name),
                    title: '删除 CRD',
                  },
                ])}
              </div>
            ))}
            {sortedCRDs.length === 0 && <div className="table-empty">暂无 CustomResourceDefinition 数据</div>}
          </div>
        )
      }

      case 'customresources': {
        const sortedCustomResources = getVisibleData(customResourceInstances)
        return (
          <div className="table">
            <div className="custom-resource-toolbar">
              <div>
                <div className="custom-resource-title">
                  {selectedCRDForInstances ? selectedCRDForInstances.kind : 'CustomResource'}
                </div>
                <div className="custom-resource-subtitle">
                  {selectedCRDForInstances
                    ? `${selectedCRDForInstances.name} · ${selectedCRDForInstances.scope} · ${selectedCRDForInstances.versions}`
                    : '从 CRD 列表选择 Instances'}
                </div>
              </div>
              <button
                className="action-btn logs-btn"
                disabled={!selectedCRDForInstances || customResourceLoading}
                onClick={() => void refreshCustomResourceInstances()}
              >
                {customResourceLoading ? '刷新中...' : '刷新实例'}
              </button>
            </div>
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Kind', field: 'kind' },
              { label: '版本', field: 'apiVersion' },
              { label: '状态', field: 'status' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedCustomResources.map((resource) => (
              <div className="table-row" key={`${resource.crdName}-${resource.namespace}-${resource.name}`}>
                <div>{resource.name}</div>
                <div>{resource.namespace || '-'}</div>
                <div>{resource.kind}</div>
                <div>{resource.apiVersion}</div>
                <div className={`status ${resource.status === 'Ready' ? 'ok' : resource.status ? 'warn' : ''}`}>
                  {resource.status || '-'}
                </div>
                <div>{resource.age}</div>
                {renderActions([
                  describeAction(`CustomResource:${resource.crdName}`, resource.namespace, resource.name),
                  metadataAction(`CustomResource:${resource.crdName}`, resource.namespace, resource.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', `CustomResource:${resource.crdName}`, resource.namespace, resource.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteCustomResourceInstance(resource),
                    title: '删除自定义资源实例',
                  },
                ])}
              </div>
            ))}
            {sortedCustomResources.length === 0 && (
              <div className="table-empty">
                {customResourceLoading ? '正在加载 CustomResource 实例...' : '暂无 CustomResource 实例'}
              </div>
            )}
          </div>
        )
      }

      case 'horizontalpodautoscalers': {
        const sortedHPAs = getVisibleNamespacedData(hpas)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '目标资源', field: 'reference' },
              { label: '最小副本', field: 'minPods' },
              { label: '最大副本', field: 'maxPods' },
              { label: '当前副本', field: 'currentReplicas' },
              { label: '期望副本', field: 'desiredReplicas' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedHPAs.map((hpa) => (
              <div
                className="table-row clickable"
                key={`${hpa.namespace}-${hpa.name}`}
                onClick={() => setSelectedHPA(hpa)}
              >
                <div>{hpa.name}</div>
                <div>{hpa.namespace}</div>
                <div>{hpa.reference}</div>
                <div>{hpa.minPods}</div>
                <div>{hpa.maxPods}</div>
                <div>{hpa.currentReplicas}</div>
                <div>{hpa.desiredReplicas}</div>
                <div>{hpa.age}</div>
                {renderActions([
                  describeAction('HorizontalPodAutoscaler', hpa.namespace, hpa.name),
                  metadataAction('HorizontalPodAutoscaler', hpa.namespace, hpa.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'HorizontalPodAutoscaler', hpa.namespace, hpa.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('HorizontalPodAutoscaler', hpa.namespace, hpa.name),
                    title: '删除 HPA',
                  },
                ])}
              </div>
            ))}
            {sortedHPAs.length === 0 && <div className="table-empty">暂无 HPA 数据</div>}
          </div>
        )
      }

      case 'poddisruptionbudgets': {
        const sortedPDBs = getVisibleNamespacedData(podDisruptionBudgets)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Min Available', field: 'minAvailable' },
              { label: 'Max Unavailable', field: 'maxUnavailable' },
              { label: '允许中断', field: 'allowedDisruptions' },
              { label: '当前健康', field: 'currentHealthy' },
              { label: '期望健康', field: 'desiredHealthy' },
              { label: 'Pod 数', field: 'expectedPods' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPDBs.map((pdb) => (
              <div
                className="table-row clickable"
                key={`${pdb.namespace}-${pdb.name}`}
                onClick={() => setSelectedPodDisruptionBudget(pdb)}
              >
                <div>{pdb.name}</div>
                <div>{pdb.namespace}</div>
                <div>{pdb.minAvailable}</div>
                <div>{pdb.maxUnavailable}</div>
                <div className={`status ${pdb.allowedDisruptions > 0 ? 'ok' : 'warn'}`}>
                  {pdb.allowedDisruptions}
                </div>
                <div>{pdb.currentHealthy}</div>
                <div>{pdb.desiredHealthy}</div>
                <div>{pdb.expectedPods}</div>
                <div>{pdb.age}</div>
                {renderActions([
                  describeAction('PodDisruptionBudget', pdb.namespace, pdb.name),
                  metadataAction('PodDisruptionBudget', pdb.namespace, pdb.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PodDisruptionBudget', pdb.namespace, pdb.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PodDisruptionBudget', pdb.namespace, pdb.name),
                    title: '删除 PodDisruptionBudget',
                  },
                ])}
              </div>
            ))}
            {sortedPDBs.length === 0 && <div className="table-empty">暂无 PodDisruptionBudget 数据</div>}
          </div>
        )
      }

      case 'resourcequotas': {
        const sortedResourceQuotas = getVisibleNamespacedData(resourceQuotas)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Hard', field: 'hard' },
              { label: 'Used', field: 'used' },
              { label: 'Scopes', field: 'scopes' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedResourceQuotas.map((quota) => (
              <div
                className="table-row clickable"
                key={`${quota.namespace}-${quota.name}`}
                onClick={() => setSelectedResourceQuota(quota)}
              >
                <div>{quota.name}</div>
                <div>{quota.namespace}</div>
                <div className="cell-truncate" title={quota.hard}>{quota.hard}</div>
                <div className="cell-truncate" title={quota.used}>{quota.used}</div>
                <div>{quota.scopes}</div>
                <div>{quota.age}</div>
                {renderActions([
                  describeAction('ResourceQuota', quota.namespace, quota.name),
                  metadataAction('ResourceQuota', quota.namespace, quota.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ResourceQuota', quota.namespace, quota.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('ResourceQuota', quota.namespace, quota.name),
                    title: '删除 ResourceQuota',
                  },
                ])}
              </div>
            ))}
            {sortedResourceQuotas.length === 0 && <div className="table-empty">暂无 ResourceQuota 数据</div>}
          </div>
        )
      }

      case 'limitranges': {
        const sortedLimitRanges = getVisibleNamespacedData(limitRanges)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: 'Types', field: 'types' },
              { label: 'Min', field: 'min' },
              { label: 'Max', field: 'max' },
              { label: 'Default', field: 'default' },
              { label: 'DefaultRequest', field: 'defaultRequest' },
              { label: 'Ratio', field: 'maxLimitRequestRatio' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedLimitRanges.map((limitRange) => (
              <div
                className="table-row clickable"
                key={`${limitRange.namespace}-${limitRange.name}`}
                onClick={() => setSelectedLimitRange(limitRange)}
              >
                <div>{limitRange.name}</div>
                <div>{limitRange.namespace}</div>
                <div>{limitRange.types}</div>
                <div className="cell-truncate" title={limitRange.min}>{limitRange.min}</div>
                <div className="cell-truncate" title={limitRange.max}>{limitRange.max}</div>
                <div className="cell-truncate" title={limitRange.default}>{limitRange.default}</div>
                <div className="cell-truncate" title={limitRange.defaultRequest}>{limitRange.defaultRequest}</div>
                <div className="cell-truncate" title={limitRange.maxLimitRequestRatio}>{limitRange.maxLimitRequestRatio}</div>
                <div>{limitRange.age}</div>
                {renderActions([
                  describeAction('LimitRange', limitRange.namespace, limitRange.name),
                  metadataAction('LimitRange', limitRange.namespace, limitRange.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'LimitRange', limitRange.namespace, limitRange.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('LimitRange', limitRange.namespace, limitRange.name),
                    title: '删除 LimitRange',
                  },
                ])}
              </div>
            ))}
            {sortedLimitRanges.length === 0 && <div className="table-empty">暂无 LimitRange 数据</div>}
          </div>
        )
      }

      case 'priorityclasses': {
        const sortedPriorityClasses = getVisibleData(priorityClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Value', field: 'value' },
              { label: 'Global Default', field: 'globalDefault' },
              { label: 'Preemption', field: 'preemptionPolicy' },
              { label: 'Description', field: 'description' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPriorityClasses.map((priorityClass) => (
              <div
                className="table-row clickable"
                key={priorityClass.name}
                onClick={() => setSelectedPriorityClass(priorityClass)}
              >
                <div>{priorityClass.name}</div>
                <div>{priorityClass.value}</div>
                <div className={`status ${priorityClass.globalDefault ? 'ok' : ''}`}>
                  {priorityClass.globalDefault ? 'true' : 'false'}
                </div>
                <div>{priorityClass.preemptionPolicy}</div>
                <div className="cell-truncate" title={priorityClass.description}>{priorityClass.description}</div>
                <div>{priorityClass.age}</div>
                {renderActions([
                  describeAction('PriorityClass', '', priorityClass.name),
                  metadataAction('PriorityClass', '', priorityClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'PriorityClass', '', priorityClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('PriorityClass', '', priorityClass.name),
                    title: '删除 PriorityClass',
                  },
                ])}
              </div>
            ))}
            {sortedPriorityClasses.length === 0 && <div className="table-empty">暂无 PriorityClass 数据</div>}
          </div>
        )
      }

      case 'runtimeclasses': {
        const sortedRuntimeClasses = getVisibleData(runtimeClasses)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: 'Handler', field: 'handler' },
              { label: 'Overhead', field: 'overhead' },
              { label: 'Node Selector', field: 'nodeSelector' },
              { label: 'Tolerations', field: 'tolerations' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedRuntimeClasses.map((runtimeClass) => (
              <div
                className="table-row clickable"
                key={runtimeClass.name}
                onClick={() => setSelectedRuntimeClass(runtimeClass)}
              >
                <div>{runtimeClass.name}</div>
                <div>{runtimeClass.handler}</div>
                <div className="cell-truncate" title={runtimeClass.overhead}>{runtimeClass.overhead}</div>
                <div className="cell-truncate" title={runtimeClass.nodeSelector}>{runtimeClass.nodeSelector}</div>
                <div>{runtimeClass.tolerations}</div>
                <div>{runtimeClass.age}</div>
                {renderActions([
                  describeAction('RuntimeClass', '', runtimeClass.name),
                  metadataAction('RuntimeClass', '', runtimeClass.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'RuntimeClass', '', runtimeClass.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('RuntimeClass', '', runtimeClass.name),
                    title: '删除 RuntimeClass',
                  },
                ])}
              </div>
            ))}
            {sortedRuntimeClasses.length === 0 && <div className="table-empty">暂无 RuntimeClass 数据</div>}
          </div>
        )
      }

      case 'events': {
        const sortedEvents = getVisibleNamespacedData(events)
        return (
          <div className="table">
            {renderTableHead([
              { label: '命名空间', field: 'namespace' },
              { label: '类型', field: 'type' },
              { label: '原因', field: 'reason' },
              { label: '对象', field: 'object' },
              { label: '消息', field: 'message' },
              { label: '次数', field: 'count' },
              { label: '时间', field: 'age' },
            ], true)}
            {sortedEvents.map((event) => (
              <div
                className={`table-row clickable${event.type === 'Warning' ? ' row-warning' : ''}`}
                key={`${event.namespace}-${event.name}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div>{event.namespace}</div>
                <div>{event.type}</div>
                <div>{event.reason}</div>
                <div>{event.object}</div>
                <div className="cell-truncate" title={event.message}>{event.message}</div>
                <div>{event.count}</div>
                <div>{event.age}</div>
                {renderActions([
                  describeAction('Event', event.namespace, event.name),
                  metadataAction('Event', event.namespace, event.name),
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Event', event.namespace, event.name),
                    title: '编辑 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Event', event.namespace, event.name),
                    title: '删除 Event',
                  },
                ])}
              </div>
            ))}
            {sortedEvents.length === 0 && <div className="table-empty">暂无 Event 数据</div>}
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className={appClassName} data-theme={appTheme}>
      {hasClientShell && (
        <div className="client-shell" aria-hidden="true">
          <div className="client-shell-title">k7s</div>
        </div>
      )}
      <aside className="cluster-rail" aria-label="Clusters">
        <button className="cluster-rail-logo" type="button" onClick={() => setSelectedResourceType('overview')} title="k7s">
          <span className="cluster-rail-emblem">K7</span>
        </button>
        <div className="cluster-rail-list">
          {contexts.map((context) => {
            const title = getDisplayName(context)
            const isActive = context.id === selectedId

            return (
              <button
                key={context.id}
                className={`cluster-rail-item ${isActive ? 'active' : ''}`}
                type="button"
                onClick={() => selectContext(context.id)}
                title={`${title} · ${context.cluster}`}
              >
                <span className="cluster-rail-mark">{getContextInitials(title)}</span>
                <span className={`cluster-rail-status ${context.current ? 'current' : ''}`} />
              </button>
            )
          })}
        </div>
        <button className="cluster-rail-add" type="button" onClick={handleAddClick} disabled={isAdding} title="添加集群">
          +
        </button>
      </aside>

      <aside className="navigator" aria-label="Navigator">
        <div className="navigator-header">
          <div className="navigator-title">Navigator</div>
        </div>
        <div className="navigator-controls">
          <select
            className="navigator-context-select"
            value={selectedId}
            onChange={(event) => selectContext(event.target.value)}
            aria-label="选择集群"
          >
            {contexts.length === 0 && <option value="">No clusters</option>}
            {contexts.map((context) => (
              <option key={context.id} value={context.id}>
                {getDisplayName(context)}
              </option>
            ))}
          </select>
          <button className="navigator-icon-btn" type="button" onClick={handleAddClick} disabled={isAdding} title="添加集群">
            +
          </button>
        </div>
        <div className="navigator-tree">
          {activeContext && (
            <div className="navigator-cluster-root">
              <button
                className={`navigator-tree-row root ${selectedResourceType === 'overview' ? 'active' : ''}`}
                type="button"
                onClick={() => setSelectedResourceType('overview')}
              >
                <span className="navigator-caret">‹</span>
                <span className="navigator-root-badge">{getContextInitials(selectedContextDisplayName)}</span>
                <span className="navigator-row-label">{selectedContextDisplayName}</span>
                <span className={`navigator-health-dot ${status}`} />
              </button>
              <div className="navigator-tree-children">
                {RESOURCE_TYPE_GROUPS.map((group) => {
                  const groupActive = group.items.some((item) => item.key === selectedResourceType)
                  const singleItem = group.items.length === 1 ? group.items[0] : null

                  if (singleItem) {
                    return (
                      <button
                        key={group.title}
                        className={`navigator-tree-row ${groupActive ? 'active' : ''}`}
                        type="button"
                        onClick={() => setSelectedResourceType(singleItem.key)}
                        aria-pressed={groupActive}
                      >
                        <span className="navigator-caret">›</span>
                        <span className="navigator-row-icon">{RESOURCE_GROUP_ICONS[group.title] ?? '•'}</span>
                        <span className="navigator-row-label">{singleItem.label}</span>
                      </button>
                    )
                  }

                  return (
                    <div className={`navigator-tree-group ${groupActive ? 'active' : ''}`} key={group.title}>
                      <div className="navigator-tree-row group">
                        <span className="navigator-caret">⌄</span>
                        <span className="navigator-row-icon">{RESOURCE_GROUP_ICONS[group.title] ?? '•'}</span>
                        <span className="navigator-row-label">{group.title}</span>
                      </div>
                      <div className="navigator-tree-children nested">
                        {group.items.map((type) => (
                          <button
                            key={type.key}
                            className={`navigator-tree-row child ${selectedResourceType === type.key ? 'active' : ''}`}
                            type="button"
                            onClick={() => setSelectedResourceType(type.key)}
                            aria-pressed={selectedResourceType === type.key}
                          >
                            <span className="navigator-row-label">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!activeContext && <div className="navigator-empty">暂无集群</div>}
        </div>
      </aside>

      <main className="workspace">
        <div className="workspace-tabs">
          <button
            className={`workspace-tab ${selectedResourceType === 'overview' ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedResourceType('overview')}
          >
            <span className="workspace-tab-icon">▤</span>
            <span>Release Notes</span>
            <span className="workspace-tab-close">×</span>
          </button>
          <button
            className={`workspace-tab ${selectedResourceType === 'workloads' ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedResourceType('workloads')}
          >
            <span className="workspace-tab-icon">{getContextInitials(selectedContextDisplayName)}</span>
            <span>Workloads Overview - {selectedContextDisplayName}</span>
            <span className="workspace-tab-close">×</span>
          </button>
          {selectedResourceType !== 'overview' && selectedResourceType !== 'workloads' && (
            <button className="workspace-tab active" type="button">
              <span className="workspace-tab-icon">{getContextInitials(selectedContextDisplayName)}</span>
              <span>{currentResourceLabel} - {selectedContextDisplayName}</span>
              <span className="workspace-tab-close">×</span>
            </button>
          )}
          <div className="workspace-top-actions">
            <span className={`status-pill ${getStatusPillClass()}`}>
              {status === 'loading' && 'Loading'}
              {status === 'ready' && 'Ready'}
              {status === 'error' && 'Error'}
              {status === 'idle' && 'Idle'}
            </span>
            <span className={`watch-status ${watchConnected ? 'connected' : 'disconnected'}`}>
              {watchConnected ? 'Watch' : 'Watch off'}
            </span>
            {activeContext && !activeContext.current && (
              <button className="settings-btn context-action-btn" type="button" onClick={handleUseKubeContext} title="写回 kubeconfig current-context">
                设为当前
              </button>
            )}
            {activeContext && (
              <button className="settings-btn context-action-btn" type="button" onClick={handleSetKubeContextNamespace} title="写回 kubeconfig 默认命名空间">
                默认命名空间
              </button>
            )}
            {terminalAvailable && (
              <button className={`terminal-btn ${showTerminal ? 'active' : ''}`} type="button" onClick={toggleTerminal} title="终端">
                Terminal
              </button>
            )}
            <button className="settings-btn" type="button" onClick={() => setIsSettingsOpen(true)} title="设置">
              设置
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {notice && <div className={`notice-banner ${notice.tone}`}>{notice.message}</div>}

        {contexts.length === 0 ? (
          <EmptyState onAdd={handleAddClick} />
        ) : (
          <section className="resource-section compact lens-resource-section">
                {selectedResourceType !== 'overview' && (
                  <div className="resource-toolbar lens-resource-toolbar">
                    <div className="resource-filters">
                      {showNamespaceFilter && (
                        <div className="namespace-filter">
                          <select
                            className="namespace-select"
                            value={selectedNamespace}
                            onChange={(event) => setSelectedNamespaces(event.target.value ? [event.target.value] : [])}
                          >
                            <option value="">all namespaces</option>
                            {namespaces.map((namespace) => (
                              <option key={namespace.name} value={namespace.name}>
                                {namespace.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="search-input-wrap lens-search-input-wrap">
                        <span className="search-mode-token">Aa</span>
                        <span className="search-mode-token">.*</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder={searchPlaceholder}
                          value={searchText}
                          onChange={(event) => setSearchText(event.target.value)}
                        />
                      </div>
                      <span className="toolbar-download-icon">↓</span>
                      <span className="resource-count">{currentResourceCountLabel}</span>
                      {clusterHealth?.lastUpdated && (
                        <span className="resource-meta-text">
                          {new Date(clusterHealth.lastUpdated).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <div className="create-controls">
                      {selectedResourceType === 'nodes' && (
                        <div className="node-bulk-controls">
                          <span className="bulk-selection-count">已选 {selectedNodeNames.length}</span>
                          <button
                            className="create-btn secondary"
                            onClick={openNodeLabelModal}
                            disabled={selectedNodeNames.length === 0 || nodeLabelLoading}
                            title="批量增加或修改 Node labels"
                          >
                            Label Nodes
                          </button>
                          {selectedNodeNames.length > 0 && (
                            <button
                              className="create-btn secondary compact"
                              onClick={() => setSelectedNodeNames([])}
                              disabled={nodeLabelLoading}
                              title="清空 Node 选择"
                            >
                              清空
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        className="create-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        title="创建资源"
                      >
                        + Create
                      </button>
                      <button
                        className="create-btn secondary"
                        onClick={() => openYamlEditor('create')}
                        title="从 YAML 创建"
                      >
                        Apply YAML
                      </button>
                      <button
                        className="create-btn secondary"
                        onClick={handleCanICheck}
                        title="检查当前用户权限"
                      >
                        Can-I
                      </button>
                    </div>

                    <div className="refresh-controls">
                      <select
                        className="refresh-interval-select"
                        value={refreshInterval}
                        onChange={(event) => setRefreshInterval(Number(event.target.value))}
                      >
                        <option value={0}>不刷新</option>
                        <option value={10}>10秒</option>
                        <option value={30}>30秒</option>
                        <option value={60}>1分钟</option>
                        <option value={300}>5分钟</option>
                      </select>
                      <button
                        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                        onClick={handleManualRefresh}
                        disabled={isRefreshing || status === 'loading'}
                        title="手动刷新"
                      >
                        ⟳
                      </button>
                      {lastRefreshTime && (
                        <span className="last-refresh">
                          {lastRefreshTime.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="table-container">
                  {renderResourceTable()}
                </div>
          </section>
        )}
      </main>

      <div className="app-status-bar" aria-live="polite">
        <span>You're using k7s Desktop</span>
        <span className="status-bar-separator" />
        <span className="status-bar-cluster">{statusBarClusterLabel}</span>
      </div>

      <NodeLabelBatchModal
        open={isNodeLabelModalOpen}
        selectedNames={selectedNodeNames}
        value={nodeLabelDraft}
        loading={nodeLabelLoading}
        onChange={setNodeLabelDraft}
        onClose={closeNodeLabelModal}
        onSubmit={handleApplyNodeLabels}
      />

      {isSettingsOpen && (
        <SettingsModal
          currentTheme={appTheme}
          onSelectTheme={handleThemeChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <RolloutOutputModal
        output={rolloutOutput}
        onClose={() => setRolloutOutput(null)}
      />

      <NodeDetailModal
        node={selectedNode}
        loading={nodeDetailLoading}
        metrics={nodeMetrics}
        metricsLoading={nodeMetricsLoading}
        pods={selectedNode ? pods.filter((pod) => pod.nodeName === selectedNode.name) : []}
        events={selectedNode ? events.filter((event) => event.object === `Node/${selectedNode.name}`) : []}
        actionLoading={nodeActionLoading}
        onEnterNode={handleEnterNodeShell}
        onEnterPod={handleEnterPodShell}
        onToggleScheduling={handleToggleNodeScheduling}
        onDrainNode={handleDrainNode}
        onDescribeNode={(node) => handleDescribeResource('Node', '', node.name)}
        onEditMetadata={(node) => handleMutateResourceMetadata('Node', '', node.name)}
        onEditYaml={(node) => {
          handleCloseNodeDetail()
          openYamlEditor('edit', 'Node', '', node.name)
        }}
        onDeleteNode={handleDeleteNode}
        onClose={handleCloseNodeDetail}
      />

      <PodDetailModal
        pod={selectedPod}
        loading={podDetailLoading}
        error={podDetailError}
        onViewLogs={(pod) => {
          handleClosePodDetail()
          handleOpenPodLogs(pod)
        }}
        onEnterShell={handleEnterPodShell}
        onAttachPod={handleAttachPod}
        onExecPod={(pod) => {
          handleClosePodDetail()
          setSelectedPodForExec(pod)
        }}
        onPortForwardPod={(pod) => {
          handleClosePodDetail()
          setSelectedPortForwardTarget(portForwardTargetForPod(pod))
        }}
        onDescribePod={(pod) => handleDescribeResource('Pod', pod.namespace, pod.name)}
        onEditMetadata={(pod) => handleMutateResourceMetadata('Pod', pod.namespace, pod.name)}
        onEditYaml={(pod) => {
          handleClosePodDetail()
          openYamlEditor('edit', 'Pod', pod.namespace, pod.name)
        }}
        onEvictPod={handleEvictPod}
        onDeletePod={(pod) => handleDeleteResource('Pod', pod.namespace, pod.name)}
        onForceDeletePod={handleForceDeletePod}
        onClose={handleClosePodDetail}
      />

      <LogViewerModal
        pod={selectedPodForLogs}
        contextId={selectedId}
        onClose={handleClosePodLogs}
      />

      <PodExecModal
        pod={selectedPodForExec}
        contextId={selectedId}
        onClose={() => setSelectedPodForExec(null)}
      />

      <PortForwardModal
        target={selectedPortForwardTarget}
        contextId={selectedId}
        onSessionStarted={upsertPortForwardSession}
        onClose={() => setSelectedPortForwardTarget(null)}
      />

      <GenericDetailModal
        resource={selectedComponentStatus}
        loading={false}
        onClose={() => setSelectedComponentStatus(null)}
        title="ComponentStatus 详情"
        renderDetails={(component) => {
          const conditions = component.conditionDetails ?? []
          const relatedEvents = events.filter((event) => event.object === `ComponentStatus/${component.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{component.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${component.status === 'Healthy' ? 'ok' : component.status === 'Unhealthy' ? 'error' : 'warn'}`}>
                      {component.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Message</span>
                    <span className="detail-value">{component.message}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Error</span>
                    <span className="detail-value">{component.error}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{component.age}</span>
                  </div>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table componentstatus-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>消息</div>
                      <div>Error</div>
                    </div>
                    {conditions.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : condition.status === 'False' ? 'error' : 'warn'}`}>
                          {condition.status}
                        </div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div className="detail-value-truncate">{condition.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {component.labels && Object.keys(component.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(component.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedAPIGroup}
        loading={false}
        onClose={() => setSelectedAPIGroup(null)}
        title="APIGroup 详情"
        renderDetails={(group) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{group.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred Version</span>
                  <span className="detail-value">{group.preferredVersion}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Version Count</span>
                  <span className="detail-value">{group.versionCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">API Version</span>
                  <span className="detail-value">{group.apiVersion}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kind</span>
                  <span className="detail-value">{group.kind}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Server Address Count</span>
                  <span className="detail-value">{group.serverAddressCount}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Discovery</div>
              <div className="conditions-table apigroup-versions-table">
                <div className="conditions-row conditions-head">
                  <div>Versions</div>
                  <div>Server Addresses</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={group.versions}>{group.versions}</div>
                  <div className="detail-value-truncate" title={group.serverAddresses}>{group.serverAddresses}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedAPIResource}
        loading={false}
        onClose={() => setSelectedAPIResource(null)}
        title="APIResource 详情"
        renderDetails={(resource) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{resource.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Kind</span>
                  <span className="detail-value">{resource.kind}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">API Group</span>
                  <span className="detail-value">{resource.apiGroup}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Group Version</span>
                  <span className="detail-value">{resource.groupVersion}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scope</span>
                  <span className="detail-value">{resource.scope}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Preferred</span>
                  <span className={`detail-value status ${resource.preferred ? 'ok' : 'warn'}`}>
                    {resource.preferred ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Subresource</span>
                  <span className={`detail-value status ${resource.subresource ? 'warn' : 'ok'}`}>
                    {resource.subresource ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Storage Hash</span>
                  <span className="detail-value">{resource.storageVersionHash}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Discovery</div>
              <div className="conditions-table apiresource-discovery-table">
                <div className="conditions-row conditions-head">
                  <div>Verbs</div>
                  <div>Short Names</div>
                  <div>Categories</div>
                  <div>Singular</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={resource.verbs}>{resource.verbs}</div>
                  <div className="detail-value-truncate" title={resource.shortNames}>{resource.shortNames}</div>
                  <div className="detail-value-truncate" title={resource.categories}>{resource.categories}</div>
                  <div className="detail-value-truncate" title={resource.singularName}>{resource.singularName}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedServerVersion}
        loading={false}
        onClose={() => setSelectedServerVersion(null)}
        title="ServerVersion 详情"
        renderDetails={(version) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Git Version</span>
                  <span className="detail-value">{version.gitVersion}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Major</span>
                  <span className="detail-value">{version.major}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Minor</span>
                  <span className="detail-value">{version.minor}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Platform</span>
                  <span className="detail-value">{version.platform}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Build Date</span>
                  <span className="detail-value">{version.buildDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Git Tree State</span>
                  <span className={`detail-value status ${version.gitTreeState === 'clean' ? 'ok' : 'warn'}`}>
                    {version.gitTreeState}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Build</div>
              <div className="conditions-table serverversion-build-table">
                <div className="conditions-row conditions-head">
                  <div>Git Commit</div>
                  <div>Go Version</div>
                  <div>Compiler</div>
                  <div>Emulation</div>
                  <div>Min Compatibility</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={version.gitCommit}>{version.gitCommit}</div>
                  <div>{version.goVersion}</div>
                  <div>{version.compiler}</div>
                  <div>{version.emulationVersion}</div>
                  <div>{version.minCompatibilityVersion}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedOpenIDConfiguration}
        loading={false}
        onClose={() => setSelectedOpenIDConfiguration(null)}
        title="OpenIDConfiguration 详情"
        renderDetails={(config) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Issuer</span>
                  <span className="detail-value">{config.issuer}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">JWKS URI</span>
                  <span className="detail-value">{config.jwksUri}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Keys</span>
                  <span className="detail-value">{config.keyCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Key Types</span>
                  <span className="detail-value">{config.keyTypes}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Key Uses</span>
                  <span className="detail-value">{config.keyUses}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Raw Keys</span>
                  <span className="detail-value">{config.rawConfigurationKeys}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">Discovery</div>
              <div className="conditions-table openid-discovery-table">
                <div className="conditions-row conditions-head">
                  <div>Signing Algs</div>
                  <div>Response Types</div>
                  <div>Subject Types</div>
                  <div>Scopes</div>
                  <div>Claims</div>
                  <div>Key IDs</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={config.signingAlgorithms}>{config.signingAlgorithms}</div>
                  <div className="detail-value-truncate" title={config.responseTypesSupported}>{config.responseTypesSupported}</div>
                  <div className="detail-value-truncate" title={config.subjectTypesSupported}>{config.subjectTypesSupported}</div>
                  <div className="detail-value-truncate" title={config.scopesSupported}>{config.scopesSupported}</div>
                  <div className="detail-value-truncate" title={config.claimsSupported}>{config.claimsSupported}</div>
                  <div className="detail-value-truncate" title={config.keyIds}>{config.keyIds}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedAPIServerHealth}
        loading={false}
        onClose={() => setSelectedAPIServerHealth(null)}
        title="APIServerHealth 详情"
        renderDetails={(check) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{check.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Path</span>
                  <span className="detail-value">{check.path}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${check.status === 'Healthy' ? 'ok' : check.status === 'Unhealthy' ? 'warn' : 'error'}`}>
                    {check.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Healthy</span>
                  <span className={`detail-value status ${check.healthy ? 'ok' : 'error'}`}>
                    {check.healthy ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Message</span>
                  <span className="detail-value">{check.message}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedNamespaceResource}
        loading={false}
        onClose={() => setSelectedNamespaceResource(null)}
        title="Namespace 详情"
        renderDetails={(namespace) => {
          const namespacePods = pods.filter((pod) => pod.namespace === namespace.name)
          const namespaceQuotas = resourceQuotas.filter((quota) => quota.namespace === namespace.name)
          const namespaceLimitRanges = limitRanges.filter((limitRange) => limitRange.namespace === namespace.name)
          const namespaceEvents = events.filter((event) => (
            event.namespace === namespace.name || event.object === `Namespace/${namespace.name}`
          ))
          const warningCount = namespaceEvents.filter((event) => event.type === 'Warning').length
          const finalizers = namespace.finalizers ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{namespace.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${namespace.status === 'Active' ? 'ok' : 'warn'}`}>
                      {namespace.status || '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{namespace.age}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Finalizers</span>
                    <span className="detail-value">{finalizers.length > 0 ? finalizers.join(', ') : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">资源概览</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Pods</span>
                    <span className="detail-value">{namespacePods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ResourceQuotas</span>
                    <span className="detail-value">{namespaceQuotas.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">LimitRanges</span>
                    <span className="detail-value">{namespaceLimitRanges.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Warning Events</span>
                    <span className={`detail-value status ${warningCount > 0 ? 'warn' : 'ok'}`}>{warningCount}</span>
                  </div>
                </div>
              </div>

              {namespaceQuotas.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">ResourceQuotas</div>
                  <div className="conditions-table namespace-quotas-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Hard</div>
                      <div>Used</div>
                      <div>Scopes</div>
                      <div>存活</div>
                    </div>
                    {namespaceQuotas.map((quota) => (
                      <div key={`${quota.namespace}-${quota.name}`} className="conditions-row">
                        <div>{quota.name}</div>
                        <div className="detail-value-truncate">{quota.hard}</div>
                        <div className="detail-value-truncate">{quota.used}</div>
                        <div>{quota.scopes || '-'}</div>
                        <div>{quota.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {namespaceLimitRanges.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">LimitRanges</div>
                  <div className="conditions-table namespace-limits-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Types</div>
                      <div>Min</div>
                      <div>Max</div>
                      <div>Default</div>
                      <div>DefaultRequest</div>
                      <div>Ratio</div>
                    </div>
                    {namespaceLimitRanges.map((limitRange) => (
                      <div key={`${limitRange.namespace}-${limitRange.name}`} className="conditions-row">
                        <div>{limitRange.name}</div>
                        <div>{limitRange.types}</div>
                        <div className="detail-value-truncate">{limitRange.min}</div>
                        <div className="detail-value-truncate">{limitRange.max}</div>
                        <div className="detail-value-truncate">{limitRange.default}</div>
                        <div className="detail-value-truncate">{limitRange.defaultRequest}</div>
                        <div className="detail-value-truncate">{limitRange.maxLimitRequestRatio}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(namespacePods)}
              {renderRelatedEvents(namespaceEvents)}

              {namespace.labels && Object.keys(namespace.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(namespace.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedLease}
        loading={false}
        onClose={() => setSelectedLease(null)}
        title="Lease 详情"
        renderDetails={(lease) => {
          const relatedCandidates = leaseCandidates.filter((candidate) => (
            candidate.namespace === lease.namespace && candidate.leaseName === lease.name
          ))
          const relatedPods = pods.filter((pod) => (
            pod.namespace === lease.namespace
              && (
                lease.holder === pod.name
                  || lease.holder.startsWith(`${pod.name}_`)
                  || lease.holder.startsWith(`${pod.name}.`)
                  || lease.holder.includes(`/${pod.name}`)
              )
          ))
          const relatedNode = lease.namespace === 'kube-node-lease'
            ? nodes.find((node) => node.name === lease.name || lease.holder.includes(node.name))
            : nodes.find((node) => node.name === lease.holder)
          const relatedEvents = events.filter((event) => (
            (event.namespace === lease.namespace && event.object === `Lease/${lease.name}`)
              || relatedPods.some((pod) => event.namespace === pod.namespace && event.object === `Pod/${pod.name}`)
              || (relatedNode && event.object === `Node/${relatedNode.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{lease.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{lease.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Holder</span>
                    <span className="detail-value">{lease.holder}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{lease.leaseDuration}s</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Transitions</span>
                    <span className={`detail-value status ${lease.transitions > 0 ? 'warn' : 'ok'}`}>{lease.transitions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Node</span>
                    <span className="detail-value">{relatedNode?.name ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Candidates</span>
                    <span className="detail-value">{relatedCandidates.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{lease.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">时间线</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Acquire Time</span>
                    <span className="detail-value">{lease.acquireTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Renew Time</span>
                    <span className="detail-value">{lease.renewTime}</span>
                  </div>
                </div>
              </div>

              {relatedNode && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Node</div>
                  <div className="conditions-table runtime-nodes-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>版本</div>
                      <div>角色</div>
                      <div>存活</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedNode.name}</div>
                      <div className={`status ${relatedNode.status === 'Ready' ? 'ok' : 'warn'}`}>{relatedNode.status}</div>
                      <div>{relatedNode.version}</div>
                      <div className="detail-value-truncate">{relatedNode.roles}</div>
                      <div>{relatedNode.age}</div>
                    </div>
                  </div>
                </div>
              )}

              {relatedCandidates.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 LeaseCandidates</div>
                  <div className="conditions-table lease-candidates-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Binary</div>
                      <div>Emulation</div>
                      <div>Strategy</div>
                      <div>Renew</div>
                    </div>
                    {relatedCandidates.map((candidate) => (
                      <div key={candidate.name} className="conditions-row">
                        <div>{candidate.name}</div>
                        <div>{candidate.binaryVersion}</div>
                        <div>{candidate.emulationVersion}</div>
                        <div className="detail-value-truncate">{candidate.strategy}</div>
                        <div>{candidate.renewTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {lease.labels && Object.keys(lease.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(lease.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedLeaseCandidate}
        loading={false}
        onClose={() => setSelectedLeaseCandidate(null)}
        title="LeaseCandidate 详情"
        renderDetails={(candidate) => {
          const relatedLease = leases.find((lease) => (
            lease.namespace === candidate.namespace && lease.name === candidate.leaseName
          ))
          const relatedEvents = events.filter((event) => (
            event.namespace === candidate.namespace
              && (
                event.object === `LeaseCandidate/${candidate.name}`
                  || event.object === `Lease/${candidate.leaseName}`
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{candidate.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{candidate.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Lease</span>
                    <span className="detail-value">{candidate.leaseName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Binary Version</span>
                    <span className="detail-value">{candidate.binaryVersion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Emulation Version</span>
                    <span className="detail-value">{candidate.emulationVersion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Strategy</span>
                    <span className="detail-value">{candidate.strategy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ping Time</span>
                    <span className="detail-value">{candidate.pingTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Renew Time</span>
                    <span className="detail-value">{candidate.renewTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{candidate.age}</span>
                  </div>
                </div>
              </div>

              {relatedLease && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Lease</div>
                  <div className="conditions-table lease-candidate-lease-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Holder</div>
                      <div>Duration</div>
                      <div>Renew</div>
                      <div>Transitions</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedLease.name}</div>
                      <div className="detail-value-truncate">{relatedLease.holder}</div>
                      <div>{relatedLease.leaseDuration}s</div>
                      <div>{relatedLease.renewTime}</div>
                      <div>{relatedLease.transitions}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {candidate.labels && Object.keys(candidate.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(candidate.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedEndpoint}
        loading={false}
        onClose={() => setSelectedEndpoint(null)}
        title="Endpoints 详情"
        renderDetails={(endpoint) => {
          const addressDetails = endpoint.addressDetails ?? []
          const portDetails = endpoint.portDetails ?? []
          const relatedService = services.find((service) => (
            service.namespace === endpoint.namespace && service.name === endpoint.name
          ))
          const relatedEndpointSlices = endpointSlices.filter((slice) => (
            slice.namespace === endpoint.namespace && slice.service === endpoint.name
          ))
          const targetPodNames = new Set(addressDetails
            .filter((address) => address.targetKind === 'Pod' && address.targetName !== '-')
            .map((address) => address.targetName))
          const endpointAddresses = new Set(addressDetails.map((address) => address.ip).filter((ip) => ip !== '-'))
          const relatedPods = pods.filter((pod) => (
            pod.namespace === endpoint.namespace
              && (
                targetPodNames.has(pod.name)
                  || (pod.podIP ? endpointAddresses.has(pod.podIP) : false)
                  || (relatedService ? labelsMatchSelector(pod.labels, relatedService.selector) : false)
              )
          ))
          const relatedIngresses = ingresses.filter((ingress) => (
            ingress.namespace === endpoint.namespace
              && (
                ingress.rules?.some((rule) => rule.serviceName === endpoint.name)
                  || ingress.defaultBackendServiceName === endpoint.name
              )
          ))
          const relatedObjects = new Set([
            `Endpoints/${endpoint.name}`,
            ...(relatedService ? [`Service/${relatedService.name}`] : []),
            ...relatedEndpointSlices.map((slice) => `EndpointSlice/${slice.name}`),
            ...relatedIngresses.map((ingress) => `Ingress/${ingress.name}`),
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.namespace === endpoint.namespace && relatedObjects.has(event.object)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{endpoint.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{endpoint.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ready</span>
                    <span className={`detail-value status ${endpoint.ready > 0 ? 'ok' : 'warn'}`}>{endpoint.ready}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Not Ready</span>
                    <span className={`detail-value status ${endpoint.notReady > 0 ? 'warn' : 'ok'}`}>{endpoint.notReady}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ports</span>
                    <span className="detail-value">{endpoint.ports}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Service</span>
                    <span className="detail-value">{relatedService?.name ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">EndpointSlices</span>
                    <span className="detail-value">{relatedEndpointSlices.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{endpoint.age}</span>
                  </div>
                </div>
              </div>

              {portDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">端口</div>
                  <div className="conditions-table endpoint-slice-ports-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>端口</div>
                      <div>协议</div>
                      <div>App Protocol</div>
                    </div>
                    {portDetails.map((port, index) => (
                      <div key={`${port.name}-${port.port}-${index}`} className="conditions-row">
                        <div>{port.name}</div>
                        <div>{port.port}</div>
                        <div>{port.protocol}</div>
                        <div className="detail-value-truncate">{port.appProtocol}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addressDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">端点</div>
                  <div className="conditions-table endpoints-addresses-table">
                    <div className="conditions-row conditions-head">
                      <div>IP</div>
                      <div>Ready</div>
                      <div>Hostname</div>
                      <div>Node</div>
                      <div>目标</div>
                    </div>
                    {addressDetails.map((address, index) => (
                      <div key={`${address.ip}-${index}`} className="conditions-row">
                        <div>{address.ip}</div>
                        <div className={address.ready ? 'status ok' : 'status warn'}>{address.ready ? 'true' : 'false'}</div>
                        <div className="detail-value-truncate">{address.hostname}</div>
                        <div className="detail-value-truncate">{address.nodeName}</div>
                        <div className="detail-value-truncate">
                          {address.targetKind !== '-' ? `${address.targetKind}/${address.targetName}` : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedService && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Service</div>
                  <div className="conditions-table endpoint-slice-service-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>ClusterIP</div>
                      <div>端口</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedService.name}</div>
                      <div>{relatedService.type}</div>
                      <div>{relatedService.clusterIP}</div>
                      <div className="detail-value-truncate">{relatedService.ports}</div>
                    </div>
                  </div>
                </div>
              )}

              {relatedEndpointSlices.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">EndpointSlices</div>
                  <div className="conditions-table apiservice-endpointslices-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Ready</div>
                      <div>Not Ready</div>
                      <div>地址</div>
                      <div>端口</div>
                    </div>
                    {relatedEndpointSlices.map((slice) => (
                      <div key={`${slice.namespace}-${slice.name}`} className="conditions-row">
                        <div>{slice.name}</div>
                        <div className={slice.ready > 0 ? 'status ok' : 'status warn'}>{slice.ready}</div>
                        <div className={slice.notReady > 0 ? 'status warn' : 'status ok'}>{slice.notReady}</div>
                        <div className="detail-value-truncate">{slice.addresses}</div>
                        <div className="detail-value-truncate">{slice.ports}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedIngresses.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Ingresses</div>
                  <div className="conditions-table endpoints-ingresses-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Class</div>
                      <div>Hosts</div>
                      <div>Address</div>
                      <div>存活</div>
                    </div>
                    {relatedIngresses.map((ingress) => (
                      <div key={`${ingress.namespace}-${ingress.name}`} className="conditions-row">
                        <div>{ingress.name}</div>
                        <div>{ingress.ingressClass ?? '-'}</div>
                        <div className="detail-value-truncate">{ingress.hosts}</div>
                        <div className="detail-value-truncate">{ingress.address}</div>
                        <div>{ingress.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {endpoint.labels && Object.keys(endpoint.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(endpoint.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedHPA}
        loading={false}
        onClose={handleCloseHPADetail}
        title="HorizontalPodAutoscaler 详情"
        renderDetails={(hpa) => {
          const targetKind = hpa.targetKind ?? hpa.reference.split('/')[0] ?? ''
          const targetName = hpa.targetName ?? hpa.reference.split('/')[1] ?? ''
          const targetWorkloads = [
            ...deployments.map((workload) => ({ kind: 'Deployment', workload, replicas: workload.replicas, readyReplicas: workload.readyReplicas })),
            ...statefulSets.map((workload) => ({ kind: 'StatefulSet', workload, replicas: workload.replicas, readyReplicas: workload.readyReplicas })),
            ...replicaSets.map((workload) => ({ kind: 'ReplicaSet', workload, replicas: workload.replicas, readyReplicas: workload.readyReplicas })),
            ...replicationControllers.map((workload) => ({ kind: 'ReplicationController', workload, replicas: workload.replicas, readyReplicas: workload.readyReplicas })),
          ]
          const targetWorkload = targetWorkloads.find((item) => (
            item.kind === targetKind
              && item.workload.namespace === hpa.namespace
              && item.workload.name === targetName
          ))
          const relatedPods = targetWorkload ? getWorkloadRelatedPods(targetWorkload.workload) : []
          const metricDetails = hpa.metricDetails ?? []
          const conditionDetails = hpa.conditionDetails ?? []
          const relatedEvents = events.filter((event) => (
            event.namespace === hpa.namespace
              && (
                event.object === `HorizontalPodAutoscaler/${hpa.name}`
                  || (targetWorkload && event.object === `${targetWorkload.kind}/${targetWorkload.workload.name}`)
                  || relatedPods.some((pod) => event.object === `Pod/${pod.name}`)
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{hpa.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{hpa.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">目标资源</span>
                    <span className="detail-value">{hpa.reference || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">API Version</span>
                    <span className="detail-value">{hpa.targetApiVersion ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">副本范围</span>
                    <span className="detail-value">{hpa.minPods} - {hpa.maxPods}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">当前副本</span>
                    <span className="detail-value">{hpa.currentReplicas}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">期望副本</span>
                    <span className={`detail-value status ${hpa.desiredReplicas > hpa.currentReplicas ? 'warn' : 'ok'}`}>{hpa.desiredReplicas}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{hpa.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">HPA 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('HorizontalPodAutoscaler', hpa.namespace, hpa.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('HorizontalPodAutoscaler', hpa.namespace, hpa.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleCloseHPADetail()
                        openYamlEditor('edit', 'HorizontalPodAutoscaler', hpa.namespace, hpa.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('HorizontalPodAutoscaler', hpa.namespace, hpa.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {metricDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Metrics</div>
                  <div className="conditions-table hpa-metrics-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>目标</div>
                      <div>当前</div>
                    </div>
                    {metricDetails.map((metric, index) => (
                      <div key={`${metric.type}-${metric.name}-${index}`} className="conditions-row">
                        <div>{metric.type}</div>
                        <div className="detail-value-truncate">{metric.name}</div>
                        <div className="detail-value-truncate">{metric.target}</div>
                        <div className="detail-value-truncate">{metric.current}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table hpa-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate" title={condition.message}>{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {targetWorkload && (
                <div className="detail-section">
                  <div className="detail-section-title">目标 Workload</div>
                  <div className="conditions-table hpa-target-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>副本</div>
                      <div>就绪</div>
                      <div>存活</div>
                    </div>
                    <div className="conditions-row">
                      <div>{targetWorkload.kind}</div>
                      <div>{targetWorkload.workload.name}</div>
                      <div>{targetWorkload.replicas}</div>
                      <div>{targetWorkload.readyReplicas}</div>
                      <div>{targetWorkload.workload.age}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {hpa.labels && Object.keys(hpa.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(hpa.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPodDisruptionBudget}
        loading={false}
        onClose={handleClosePodDisruptionBudgetDetail}
        title="PodDisruptionBudget 详情"
        renderDetails={(pdb) => {
          const conditionDetails = pdb.conditionDetails ?? []
          const relatedPods = pods.filter((pod) => (
            pod.namespace === pdb.namespace && labelsMatchSelector(pod.labels, pdb.selector)
          ))
          const relatedEvents = events.filter((event) => (
            event.namespace === pdb.namespace
              && (
                event.object === `PodDisruptionBudget/${pdb.name}`
                  || relatedPods.some((pod) => event.object === `Pod/${pod.name}`)
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{pdb.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{pdb.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Min Available</span>
                    <span className="detail-value">{pdb.minAvailable}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Max Unavailable</span>
                    <span className="detail-value">{pdb.maxUnavailable}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">允许中断</span>
                    <span className={`detail-value status ${pdb.allowedDisruptions > 0 ? 'ok' : 'warn'}`}>{pdb.allowedDisruptions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">当前健康</span>
                    <span className="detail-value">{pdb.currentHealthy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">期望健康</span>
                    <span className="detail-value">{pdb.desiredHealthy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pod 数</span>
                    <span className="detail-value">{pdb.expectedPods}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Observed Generation</span>
                    <span className="detail-value">{pdb.observedGeneration ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Unhealthy Eviction</span>
                    <span className="detail-value">{pdb.unhealthyPodEvictionPolicy ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{pdb.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">PDB 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('PodDisruptionBudget', pdb.namespace, pdb.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('PodDisruptionBudget', pdb.namespace, pdb.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleClosePodDisruptionBudgetDetail()
                        openYamlEditor('edit', 'PodDisruptionBudget', pdb.namespace, pdb.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('PodDisruptionBudget', pdb.namespace, pdb.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {pdb.disruptedPods && pdb.disruptedPods !== '-' && (
                <div className="detail-section">
                  <div className="detail-section-title">中断中的 Pods</div>
                  <div className="detail-code-block">{pdb.disruptedPods}</div>
                </div>
              )}

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">条件</div>
                  <div className="conditions-table pdb-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderSelectorSection(pdb.selector)}
              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {pdb.labels && Object.keys(pdb.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(pdb.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedResourceQuota}
        loading={false}
        onClose={handleCloseResourceQuotaDetail}
        title="ResourceQuota 详情"
        renderDetails={(quota) => {
          const quotaDetails = quota.quotaDetails ?? []
          const scopeSelectorDetails = quota.scopeSelectorDetails ?? []
          const relatedEvents = events.filter((event) => (
            event.namespace === quota.namespace && event.object === `ResourceQuota/${quota.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{quota.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{quota.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Scopes</span>
                    <span className="detail-value">{quota.scopes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Scope Selector</span>
                    <span className="detail-value">{quota.scopeSelector ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{quota.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">ResourceQuota 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('ResourceQuota', quota.namespace, quota.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('ResourceQuota', quota.namespace, quota.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleCloseResourceQuotaDetail()
                        openYamlEditor('edit', 'ResourceQuota', quota.namespace, quota.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('ResourceQuota', quota.namespace, quota.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {quotaDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">资源用量</div>
                  <div className="conditions-table resource-quota-usage-table">
                    <div className="conditions-row conditions-head">
                      <div>资源</div>
                      <div>Hard</div>
                      <div>Used</div>
                    </div>
                    {quotaDetails.map((detail) => (
                      <div key={detail.resource} className="conditions-row">
                        <div>{detail.resource}</div>
                        <div>{detail.hard}</div>
                        <div>{detail.used}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scopeSelectorDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Scope Selector</div>
                  <div className="conditions-table resource-quota-scopes-table">
                    <div className="conditions-row conditions-head">
                      <div>Scope</div>
                      <div>Operator</div>
                      <div>Values</div>
                    </div>
                    {scopeSelectorDetails.map((scope, index) => (
                      <div key={`${scope.scopeName}-${index}`} className="conditions-row">
                        <div>{scope.scopeName}</div>
                        <div>{scope.operator}</div>
                        <div>{scope.values}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {quota.labels && Object.keys(quota.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(quota.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedLimitRange}
        loading={false}
        onClose={handleCloseLimitRangeDetail}
        title="LimitRange 详情"
        renderDetails={(limitRange) => {
          const limitDetails = limitRange.limitDetails ?? []
          const relatedEvents = events.filter((event) => (
            event.namespace === limitRange.namespace && event.object === `LimitRange/${limitRange.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{limitRange.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{limitRange.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Types</span>
                    <span className="detail-value">{limitRange.types}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{limitRange.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">LimitRange 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('LimitRange', limitRange.namespace, limitRange.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('LimitRange', limitRange.namespace, limitRange.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleCloseLimitRangeDetail()
                        openYamlEditor('edit', 'LimitRange', limitRange.namespace, limitRange.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('LimitRange', limitRange.namespace, limitRange.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {limitDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">限制项</div>
                  <div className="conditions-table limit-range-items-table">
                    <div className="conditions-row conditions-head">
                      <div>Type</div>
                      <div>Min</div>
                      <div>Max</div>
                      <div>Default</div>
                      <div>DefaultRequest</div>
                      <div>Ratio</div>
                    </div>
                    {limitDetails.map((detail, index) => (
                      <div key={`${detail.type}-${index}`} className="conditions-row">
                        <div>{detail.type}</div>
                        <div className="detail-value-truncate">{detail.min}</div>
                        <div className="detail-value-truncate">{detail.max}</div>
                        <div className="detail-value-truncate">{detail.default}</div>
                        <div className="detail-value-truncate">{detail.defaultRequest}</div>
                        <div className="detail-value-truncate">{detail.maxLimitRequestRatio}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {limitRange.labels && Object.keys(limitRange.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(limitRange.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPriorityClass}
        loading={false}
        onClose={() => setSelectedPriorityClass(null)}
        title="PriorityClass 详情"
        renderDetails={(priorityClass) => {
          const relatedPods = pods.filter((pod) => pod.priority === priorityClass.name)
          const relatedEvents = events.filter((event) => (
            event.object === `PriorityClass/${priorityClass.name}`
              || relatedPods.some((pod) => event.namespace === pod.namespace && event.object === `Pod/${pod.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{priorityClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Value</span>
                    <span className="detail-value">{priorityClass.value}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Global Default</span>
                    <span className={`detail-value status ${priorityClass.globalDefault ? 'ok' : ''}`}>
                      {priorityClass.globalDefault ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Preemption</span>
                    <span className="detail-value">{priorityClass.preemptionPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{priorityClass.age}</span>
                  </div>
                </div>
              </div>

              {priorityClass.description && priorityClass.description !== '-' && (
                <div className="detail-section">
                  <div className="detail-section-title">Description</div>
                  <div className="detail-code-block">{priorityClass.description}</div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {priorityClass.labels && Object.keys(priorityClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(priorityClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedRuntimeClass}
        loading={false}
        onClose={() => setSelectedRuntimeClass(null)}
        title="RuntimeClass 详情"
        renderDetails={(runtimeClass) => {
          const tolerationDetails = runtimeClass.tolerationDetails ?? []
          const relatedPods = pods.filter((pod) => pod.runtimeClass === runtimeClass.name)
          const relatedNodes = nodes.filter((node) => labelsMatchSelector(node.labels, runtimeClass.nodeSelectorLabels))
          const relatedEvents = events.filter((event) => (
            event.object === `RuntimeClass/${runtimeClass.name}`
              || relatedPods.some((pod) => event.namespace === pod.namespace && event.object === `Pod/${pod.name}`)
              || relatedNodes.some((node) => event.object === `Node/${node.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{runtimeClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Handler</span>
                    <span className="detail-value">{runtimeClass.handler}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Overhead</span>
                    <span className="detail-value">{runtimeClass.overhead}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Node Selector</span>
                    <span className="detail-value">{runtimeClass.nodeSelector}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tolerations</span>
                    <span className="detail-value">{runtimeClass.tolerations}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">匹配 Nodes</span>
                    <span className="detail-value">{relatedNodes.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{runtimeClass.age}</span>
                  </div>
                </div>
              </div>

              {tolerationDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Tolerations</div>
                  <div className="conditions-table runtime-tolerations-table">
                    <div className="conditions-row conditions-head">
                      <div>Key</div>
                      <div>Operator</div>
                      <div>Value</div>
                      <div>Effect</div>
                      <div>Seconds</div>
                    </div>
                    {tolerationDetails.map((toleration, index) => (
                      <div key={`${toleration.key}-${index}`} className="conditions-row">
                        <div className="detail-value-truncate">{toleration.key}</div>
                        <div>{toleration.operator}</div>
                        <div className="detail-value-truncate">{toleration.value}</div>
                        <div>{toleration.effect}</div>
                        <div>{toleration.tolerationSeconds}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedNodes.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">匹配 Nodes</div>
                  <div className="conditions-table runtime-nodes-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>版本</div>
                      <div>角色</div>
                      <div>存活</div>
                    </div>
                    {relatedNodes.map((node) => (
                      <div key={node.name} className="conditions-row">
                        <div>{node.name}</div>
                        <div className={`status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</div>
                        <div>{node.version}</div>
                        <div className="detail-value-truncate">{node.roles}</div>
                        <div>{node.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {runtimeClass.labels && Object.keys(runtimeClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(runtimeClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPersistentVolume}
        loading={false}
        onClose={handleClosePersistentVolumeDetail}
        title="PersistentVolume 详情"
        renderDetails={(pv) => {
          const boundClaim = persistentVolumeClaims.find((pvc) => (
            pvc.volumeName === pv.name || pv.claim === `${pvc.namespace}/${pvc.name}`
          ))
          const relatedStorageClass = storageClasses.find((storageClass) => storageClass.name === pv.storageClass)
          const relatedEvents = events.filter((event) => (
            event.object === `PersistentVolume/${pv.name}`
              || (boundClaim && event.namespace === boundClaim.namespace && event.object === `PersistentVolumeClaim/${boundClaim.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{pv.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${pv.status === 'Bound' ? 'ok' : pv.status === 'Released' || pv.status === 'Failed' ? 'warn' : ''}`}>{pv.status || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">容量</span>
                    <span className="detail-value">{pv.capacity || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">访问模式</span>
                    <span className="detail-value">{pv.accessModes || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">回收策略</span>
                    <span className="detail-value">{pv.reclaimPolicy || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Volume Mode</span>
                    <span className="detail-value">{pv.volumeMode ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">StorageClass</span>
                    <span className="detail-value">{pv.storageClass || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Source</span>
                    <span className="detail-value">{pv.source || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Claim</span>
                    <span className="detail-value">{pv.claim || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{pv.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">PV 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('PersistentVolume', '', pv.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('PersistentVolume', '', pv.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleClosePersistentVolumeDetail()
                        openYamlEditor('edit', 'PersistentVolume', '', pv.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('PersistentVolume', '', pv.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {(pv.reason || pv.message) && (
                <div className="detail-section">
                  <div className="detail-section-title">状态消息</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">{pv.reason ?? '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Message</span>
                      <span className="detail-value">{pv.message ?? '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {(boundClaim || relatedStorageClass) && (
                <div className="detail-section">
                  <div className="detail-section-title">绑定关系</div>
                  <div className="conditions-table storage-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>模式</div>
                    </div>
                    {boundClaim && (
                      <div className="conditions-row">
                        <div>PVC</div>
                        <div>{boundClaim.namespace}/{boundClaim.name}</div>
                        <div className={`status ${boundClaim.status === 'Bound' ? 'ok' : 'warn'}`}>{boundClaim.status}</div>
                        <div>{boundClaim.capacity || boundClaim.requestedCapacity || '-'}</div>
                        <div>{boundClaim.accessModes || '-'}</div>
                      </div>
                    )}
                    {relatedStorageClass && (
                      <div className="conditions-row">
                        <div>StorageClass</div>
                        <div>{relatedStorageClass.name}</div>
                        <div>{relatedStorageClass.provisioner}</div>
                        <div>{relatedStorageClass.reclaimPolicy}</div>
                        <div>{relatedStorageClass.volumeBindingMode}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {pv.labels && Object.keys(pv.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(pv.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPersistentVolumeClaim}
        loading={false}
        onClose={handleClosePersistentVolumeClaimDetail}
        title="PersistentVolumeClaim 详情"
        renderDetails={(pvc) => {
          const boundPV = persistentVolumes.find((pv) => (
            pv.name === pvc.volumeName || pv.claim === `${pvc.namespace}/${pvc.name}`
          ))
          const relatedStorageClass = storageClasses.find((storageClass) => storageClass.name === pvc.storageClass)
          const relatedPods = pods.filter((pod) => (
            pod.namespace === pvc.namespace && pod.pvcClaims?.includes(pvc.name)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === pvc.namespace && event.object === `PersistentVolumeClaim/${pvc.name}`)
              || (boundPV && event.object === `PersistentVolume/${boundPV.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{pvc.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{pvc.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${pvc.status === 'Bound' ? 'ok' : pvc.status === 'Lost' ? 'warn' : ''}`}>{pvc.status || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">容量</span>
                    <span className="detail-value">{pvc.capacity || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">请求容量</span>
                    <span className="detail-value">{pvc.requestedCapacity || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">访问模式</span>
                    <span className="detail-value">{pvc.accessModes || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Volume Mode</span>
                    <span className="detail-value">{pvc.volumeMode ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">StorageClass</span>
                    <span className="detail-value">{pvc.storageClass || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Volume</span>
                    <span className="detail-value">{pvc.volumeName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{pvc.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">PVC 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('PersistentVolumeClaim', pvc.namespace, pvc.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('PersistentVolumeClaim', pvc.namespace, pvc.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleClosePersistentVolumeClaimDetail()
                        openYamlEditor('edit', 'PersistentVolumeClaim', pvc.namespace, pvc.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('PersistentVolumeClaim', pvc.namespace, pvc.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {(boundPV || relatedStorageClass) && (
                <div className="detail-section">
                  <div className="detail-section-title">绑定关系</div>
                  <div className="conditions-table storage-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>模式</div>
                    </div>
                    {boundPV && (
                      <div className="conditions-row">
                        <div>PV</div>
                        <div>{boundPV.name}</div>
                        <div className={`status ${boundPV.status === 'Bound' ? 'ok' : 'warn'}`}>{boundPV.status}</div>
                        <div>{boundPV.capacity || '-'}</div>
                        <div>{boundPV.accessModes || '-'}</div>
                      </div>
                    )}
                    {relatedStorageClass && (
                      <div className="conditions-row">
                        <div>StorageClass</div>
                        <div>{relatedStorageClass.name}</div>
                        <div>{relatedStorageClass.provisioner}</div>
                        <div>{relatedStorageClass.reclaimPolicy}</div>
                        <div>{relatedStorageClass.volumeBindingMode}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {pvc.labels && Object.keys(pvc.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(pvc.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedStorageClass}
        loading={false}
        onClose={handleCloseStorageClassDetail}
        title="StorageClass 详情"
        renderDetails={(storageClass) => {
          const relatedPVs = persistentVolumes.filter((pv) => pv.storageClass === storageClass.name)
          const relatedPVCs = persistentVolumeClaims.filter((pvc) => pvc.storageClass === storageClass.name)
          const relatedEvents = events.filter((event) => event.object === `StorageClass/${storageClass.name}`)
          const parameterEntries = storageClass.parameters && storageClass.parameters !== '-'
            ? storageClass.parameters.split(', ').filter(Boolean)
            : []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{storageClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Provisioner</span>
                    <span className="detail-value">{storageClass.provisioner}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">回收策略</span>
                    <span className="detail-value">{storageClass.reclaimPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">绑定模式</span>
                    <span className="detail-value">{storageClass.volumeBindingMode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Default</span>
                    <span className={`detail-value status ${storageClass.defaultClass ? 'ok' : ''}`}>{storageClass.defaultClass ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expansion</span>
                    <span className={`detail-value status ${storageClass.allowVolumeExpansion ? 'ok' : ''}`}>{storageClass.allowVolumeExpansion ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mount Options</span>
                    <span className="detail-value">{storageClass.mountOptions || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{storageClass.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section workload-actions-section">
                <div className="detail-section-header">
                  <div className="detail-section-title">StorageClass 操作</div>
                  <div className="workload-action-bar">
                    <button className="action-btn describe-btn" onClick={() => handleDescribeResource('StorageClass', '', storageClass.name)}>
                      Describe
                    </button>
                    <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('StorageClass', '', storageClass.name)}>
                      Meta
                    </button>
                    <button
                      className="action-btn yaml-btn"
                      onClick={() => {
                        handleCloseStorageClassDetail()
                        openYamlEditor('edit', 'StorageClass', '', storageClass.name)
                      }}
                    >
                      YAML
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteResource('StorageClass', '', storageClass.name)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {parameterEntries.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parameters</div>
                  <div className="labels-list">
                    {parameterEntries.map((entry) => {
                      const [key, ...valueParts] = entry.split('=')
                      return (
                        <div key={entry} className="label-item">
                          <span className="label-key">{key}</span>
                          <span className="label-eq">=</span>
                          <span className="label-value">{valueParts.join('=') || '-'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {relatedPVs.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">PersistentVolumes</div>
                  <div className="conditions-table storage-pvs-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>访问模式</div>
                      <div>Claim</div>
                      <div>存活</div>
                    </div>
                    {relatedPVs.map((pv) => (
                      <div key={pv.name} className="conditions-row">
                        <div>{pv.name}</div>
                        <div className={`status ${pv.status === 'Bound' ? 'ok' : pv.status === 'Released' || pv.status === 'Failed' ? 'warn' : ''}`}>{pv.status}</div>
                        <div>{pv.capacity || '-'}</div>
                        <div>{pv.accessModes || '-'}</div>
                        <div className="detail-value-truncate">{pv.claim || '-'}</div>
                        <div>{pv.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedPVCs.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">PersistentVolumeClaims</div>
                  <div className="conditions-table storage-pvcs-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>Volume</div>
                      <div>存活</div>
                    </div>
                    {relatedPVCs.map((pvc) => (
                      <div key={`${pvc.namespace}-${pvc.name}`} className="conditions-row">
                        <div>{pvc.name}</div>
                        <div>{pvc.namespace}</div>
                        <div className={`status ${pvc.status === 'Bound' ? 'ok' : pvc.status === 'Lost' ? 'warn' : ''}`}>{pvc.status}</div>
                        <div>{pvc.capacity || pvc.requestedCapacity || '-'}</div>
                        <div className="detail-value-truncate">{pvc.volumeName || '-'}</div>
                        <div>{pvc.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {storageClass.labels && Object.keys(storageClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(storageClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedVolumeAttributesClass}
        loading={false}
        onClose={() => setSelectedVolumeAttributesClass(null)}
        title="VolumeAttributesClass 详情"
        renderDetails={(attributesClass) => {
          const relatedDriver = csiDrivers.find((driver) => driver.name === attributesClass.driverName)
          const relatedStorageClasses = storageClasses.filter((storageClass) => storageClass.provisioner === attributesClass.driverName)
          const relatedEvents = events.filter((event) => (
            event.object === `VolumeAttributesClass/${attributesClass.name}`
              || relatedStorageClasses.some((storageClass) => event.object === `StorageClass/${storageClass.name}`)
          ))
          const parameterEntries = Object.entries(attributesClass.parameterDetails ?? {})

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{attributesClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{attributesClass.driverName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parameters</span>
                    <span className="detail-value">{attributesClass.parameterCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 CSIDriver</span>
                    <span className={`detail-value status ${relatedDriver ? 'ok' : 'warn'}`}>{relatedDriver ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 StorageClasses</span>
                    <span className="detail-value">{relatedStorageClasses.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{attributesClass.age}</span>
                  </div>
                </div>
              </div>

              {parameterEntries.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parameters</div>
                  <div className="labels-list">
                    {parameterEntries.map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedStorageClasses.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">StorageClasses</div>
                  <div className="conditions-table csi-storageclasses-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>回收策略</div>
                      <div>绑定模式</div>
                      <div>Default</div>
                      <div>存活</div>
                    </div>
                    {relatedStorageClasses.map((storageClass) => (
                      <div key={storageClass.name} className="conditions-row">
                        <div>{storageClass.name}</div>
                        <div>{storageClass.reclaimPolicy}</div>
                        <div>{storageClass.volumeBindingMode}</div>
                        <div className={`status ${storageClass.defaultClass ? 'ok' : ''}`}>{storageClass.defaultClass ? 'true' : 'false'}</div>
                        <div>{storageClass.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {attributesClass.labels && Object.keys(attributesClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(attributesClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedCSIDriver}
        loading={false}
        onClose={() => setSelectedCSIDriver(null)}
        title="CSIDriver 详情"
        renderDetails={(driver) => {
          const relatedStorageClasses = storageClasses.filter((storageClass) => storageClass.provisioner === driver.name)
          const relatedVolumeAttributesClasses = volumeAttributesClasses.filter((attributesClass) => attributesClass.driverName === driver.name)
          const relatedStorageClassNames = new Set(relatedStorageClasses.map((storageClass) => storageClass.name))
          const relatedCSINodes = csiNodes.filter((node) => csiNodeHasDriver(node, driver.name))
          const relatedAttachments = volumeAttachments.filter((attachment) => attachment.attacher === driver.name)
          const relatedCapacities = csiStorageCapacities.filter((capacity) => relatedStorageClassNames.has(capacity.storageClass))
          const relatedEvents = events.filter((event) => (
            event.object === `CSIDriver/${driver.name}`
              || relatedStorageClasses.some((storageClass) => event.object === `StorageClass/${storageClass.name}`)
              || relatedVolumeAttributesClasses.some((attributesClass) => event.object === `VolumeAttributesClass/${attributesClass.name}`)
              || relatedAttachments.some((attachment) => event.object === `VolumeAttachment/${attachment.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{driver.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Attach Required</span>
                    <span className={`detail-value status ${driver.attachRequired ? 'ok' : ''}`}>{driver.attachRequired ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PodInfo On Mount</span>
                    <span className={`detail-value status ${driver.podInfoOnMount ? 'ok' : ''}`}>{driver.podInfoOnMount ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Storage Capacity</span>
                    <span className={`detail-value status ${driver.storageCapacity ? 'ok' : ''}`}>{driver.storageCapacity ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Requires Republish</span>
                    <span className={`detail-value status ${driver.requiresRepublish ? 'ok' : ''}`}>{driver.requiresRepublish ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">SELinux Mount</span>
                    <span className={`detail-value status ${driver.seLinuxMount ? 'ok' : ''}`}>{driver.seLinuxMount ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Lifecycle</span>
                    <span className="detail-value">{driver.volumeLifecycleModes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">FSGroup Policy</span>
                    <span className="detail-value">{driver.fsGroupPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 StorageClasses</span>
                    <span className="detail-value">{relatedStorageClasses.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">VolumeAttributesClasses</span>
                    <span className="detail-value">{relatedVolumeAttributesClasses.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 CSINodes</span>
                    <span className="detail-value">{relatedCSINodes.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">VolumeAttachments</span>
                    <span className="detail-value">{relatedAttachments.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{driver.age}</span>
                  </div>
                </div>
              </div>

              {relatedStorageClasses.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">StorageClasses</div>
                  <div className="conditions-table csi-storageclasses-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>回收策略</div>
                      <div>绑定模式</div>
                      <div>Default</div>
                      <div>存活</div>
                    </div>
                    {relatedStorageClasses.map((storageClass) => (
                      <div key={storageClass.name} className="conditions-row">
                        <div>{storageClass.name}</div>
                        <div>{storageClass.reclaimPolicy}</div>
                        <div>{storageClass.volumeBindingMode}</div>
                        <div className={`status ${storageClass.defaultClass ? 'ok' : ''}`}>{storageClass.defaultClass ? 'true' : 'false'}</div>
                        <div>{storageClass.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedVolumeAttributesClasses.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">VolumeAttributesClasses</div>
                  <div className="conditions-table volumeattributesclasses-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Parameters</div>
                      <div>Count</div>
                      <div>存活</div>
                    </div>
                    {relatedVolumeAttributesClasses.map((attributesClass) => (
                      <div key={attributesClass.name} className="conditions-row">
                        <div>{attributesClass.name}</div>
                        <div className="detail-value-truncate">{attributesClass.parameters}</div>
                        <div>{attributesClass.parameterCount}</div>
                        <div>{attributesClass.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedCSINodes.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">CSINodes</div>
                  <div className="conditions-table csi-nodes-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Drivers</div>
                      <div>Node IDs</div>
                      <div>Topology Keys</div>
                      <div>Allocatable</div>
                    </div>
                    {relatedCSINodes.map((node) => {
                      const driverDetail = node.driverDetails?.find((item) => item.name === driver.name)
                      return (
                        <div key={node.name} className="conditions-row">
                          <div>{node.name}</div>
                          <div>{node.drivers}</div>
                          <div className="detail-value-truncate">{driverDetail?.nodeId ?? node.nodeIds}</div>
                          <div className="detail-value-truncate">{driverDetail?.topologyKeys ?? node.topologyKeys}</div>
                          <div>{driverDetail?.allocatable ?? node.allocatable}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {relatedAttachments.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">VolumeAttachments</div>
                  <div className="conditions-table csi-attachments-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Node</div>
                      <div>Source</div>
                      <div>Attached</div>
                      <div>存活</div>
                    </div>
                    {relatedAttachments.map((attachment) => (
                      <div key={attachment.name} className="conditions-row">
                        <div>{attachment.name}</div>
                        <div>{attachment.node}</div>
                        <div className="detail-value-truncate">{attachment.source}</div>
                        <div className={`status ${attachment.attached ? 'ok' : 'warn'}`}>{attachment.attached ? 'true' : 'false'}</div>
                        <div>{attachment.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedCapacities.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">CSIStorageCapacities</div>
                  <div className="conditions-table csi-capacities-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>StorageClass</div>
                      <div>Capacity</div>
                      <div>Topology</div>
                    </div>
                    {relatedCapacities.map((capacity) => (
                      <div key={`${capacity.namespace}-${capacity.name}`} className="conditions-row">
                        <div>{capacity.name}</div>
                        <div>{capacity.namespace}</div>
                        <div>{capacity.storageClass}</div>
                        <div>{capacity.capacity}</div>
                        <div className="detail-value-truncate">{capacity.topology}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {driver.labels && Object.keys(driver.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(driver.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedCSINode}
        loading={false}
        onClose={() => setSelectedCSINode(null)}
        title="CSINode 详情"
        renderDetails={(csiNode) => {
          const driverDetails = csiNode.driverDetails ?? []
          const relatedNode = nodes.find((node) => node.name === csiNode.name)
          const relatedAttachments = volumeAttachments.filter((attachment) => attachment.node === csiNode.name)
          const relatedEvents = events.filter((event) => (
            event.object === `CSINode/${csiNode.name}`
              || event.object === `Node/${csiNode.name}`
              || relatedAttachments.some((attachment) => event.object === `VolumeAttachment/${attachment.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{csiNode.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Node 状态</span>
                    <span className={`detail-value status ${relatedNode?.status === 'Ready' ? 'ok' : relatedNode ? 'warn' : ''}`}>{relatedNode?.status ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Drivers</span>
                    <span className="detail-value">{csiNode.drivers}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">VolumeAttachments</span>
                    <span className="detail-value">{relatedAttachments.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Topology Keys</span>
                    <span className="detail-value">{csiNode.topologyKeys}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Allocatable</span>
                    <span className="detail-value">{csiNode.allocatable}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{csiNode.age}</span>
                  </div>
                </div>
              </div>

              {driverDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Drivers</div>
                  <div className="conditions-table csi-node-drivers-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Node ID</div>
                      <div>Topology Keys</div>
                      <div>Allocatable</div>
                    </div>
                    {driverDetails.map((driver) => (
                      <div key={driver.name} className="conditions-row">
                        <div>{driver.name}</div>
                        <div className="detail-value-truncate">{driver.nodeId}</div>
                        <div className="detail-value-truncate">{driver.topologyKeys}</div>
                        <div>{driver.allocatable}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedAttachments.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">VolumeAttachments</div>
                  <div className="conditions-table csi-attachments-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Attacher</div>
                      <div>Source</div>
                      <div>Attached</div>
                      <div>存活</div>
                    </div>
                    {relatedAttachments.map((attachment) => (
                      <div key={attachment.name} className="conditions-row">
                        <div>{attachment.name}</div>
                        <div>{attachment.attacher}</div>
                        <div className="detail-value-truncate">{attachment.source}</div>
                        <div className={`status ${attachment.attached ? 'ok' : 'warn'}`}>{attachment.attached ? 'true' : 'false'}</div>
                        <div>{attachment.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {csiNode.labels && Object.keys(csiNode.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(csiNode.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedVolumeAttachment}
        loading={false}
        onClose={() => setSelectedVolumeAttachment(null)}
        title="VolumeAttachment 详情"
        renderDetails={(attachment) => {
          const sourcePVName = attachment.sourcePersistentVolume
            ?? (attachment.source.startsWith('pv/') ? attachment.source.slice(3) : undefined)
          const relatedPV = sourcePVName ? persistentVolumes.find((pv) => pv.name === sourcePVName) : undefined
          const relatedPVC = relatedPV?.claim
            ? persistentVolumeClaims.find((pvc) => `${pvc.namespace}/${pvc.name}` === relatedPV.claim)
            : undefined
          const relatedNode = nodes.find((node) => node.name === attachment.node)
          const relatedDriver = csiDrivers.find((driver) => driver.name === attachment.attacher)
          const relatedEvents = events.filter((event) => (
            event.object === `VolumeAttachment/${attachment.name}`
              || (relatedPV && event.object === `PersistentVolume/${relatedPV.name}`)
              || (relatedPVC && event.namespace === relatedPVC.namespace && event.object === `PersistentVolumeClaim/${relatedPVC.name}`)
              || (relatedNode && event.object === `Node/${relatedNode.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{attachment.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Attacher</span>
                    <span className="detail-value">{attachment.attacher}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Node</span>
                    <span className="detail-value">{attachment.node}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Source</span>
                    <span className="detail-value">{attachment.source}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Attached</span>
                    <span className={`detail-value status ${attachment.attached ? 'ok' : 'warn'}`}>{attachment.attached ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Inline Source</span>
                    <span className={`detail-value status ${attachment.sourceInline ? 'ok' : ''}`}>{attachment.sourceInline ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{attachment.age}</span>
                  </div>
                </div>
              </div>

              {(attachment.attachError !== '-' || attachment.detachError !== '-') && (
                <div className="detail-section">
                  <div className="detail-section-title">错误信息</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Attach Error</span>
                      <span className="detail-value">{attachment.attachError}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Detach Error</span>
                      <span className="detail-value">{attachment.detachError}</span>
                    </div>
                  </div>
                </div>
              )}

              {(relatedDriver || relatedNode || relatedPV || relatedPVC) && (
                <div className="detail-section">
                  <div className="detail-section-title">绑定关系</div>
                  <div className="conditions-table volumeattachment-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>状态</div>
                      <div>详情</div>
                    </div>
                    {relatedDriver && (
                      <div className="conditions-row">
                        <div>CSIDriver</div>
                        <div>{relatedDriver.name}</div>
                        <div>{relatedDriver.fsGroupPolicy}</div>
                        <div>{relatedDriver.volumeLifecycleModes}</div>
                      </div>
                    )}
                    {relatedNode && (
                      <div className="conditions-row">
                        <div>Node</div>
                        <div>{relatedNode.name}</div>
                        <div className={`status ${relatedNode.status === 'Ready' ? 'ok' : 'warn'}`}>{relatedNode.status}</div>
                        <div>{relatedNode.version}</div>
                      </div>
                    )}
                    {relatedPV && (
                      <div className="conditions-row">
                        <div>PV</div>
                        <div>{relatedPV.name}</div>
                        <div className={`status ${relatedPV.status === 'Bound' ? 'ok' : 'warn'}`}>{relatedPV.status}</div>
                        <div>{relatedPV.capacity || '-'}</div>
                      </div>
                    )}
                    {relatedPVC && (
                      <div className="conditions-row">
                        <div>PVC</div>
                        <div>{relatedPVC.namespace}/{relatedPVC.name}</div>
                        <div className={`status ${relatedPVC.status === 'Bound' ? 'ok' : 'warn'}`}>{relatedPVC.status}</div>
                        <div>{relatedPVC.capacity || relatedPVC.requestedCapacity || '-'}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {attachment.labels && Object.keys(attachment.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(attachment.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedCSIStorageCapacity}
        loading={false}
        onClose={() => setSelectedCSIStorageCapacity(null)}
        title="CSIStorageCapacity 详情"
        renderDetails={(capacity) => {
          const relatedStorageClass = storageClasses.find((storageClass) => storageClass.name === capacity.storageClass)
          const relatedDriver = relatedStorageClass
            ? csiDrivers.find((driver) => driver.name === relatedStorageClass.provisioner)
            : undefined
          const relatedPVs = persistentVolumes.filter((pv) => pv.storageClass === capacity.storageClass)
          const relatedPVCs = persistentVolumeClaims.filter((pvc) => pvc.storageClass === capacity.storageClass)
          const matchingNodes = nodes.filter((node) => (
            labelsMatchTopology(node.labels, capacity.nodeTopologyLabels, capacity.nodeTopologyExpressions)
          ))
          const topologyLabelEntries = Object.entries(capacity.nodeTopologyLabels ?? {})
          const topologyExpressions = capacity.nodeTopologyExpressions ?? []
          const relatedEvents = events.filter((event) => (
            (event.namespace === capacity.namespace && event.object === `CSIStorageCapacity/${capacity.name}`)
              || event.object === `StorageClass/${capacity.storageClass}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{capacity.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{capacity.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">StorageClass</span>
                    <span className="detail-value">{capacity.storageClass}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity</span>
                    <span className="detail-value">{capacity.capacity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Max Volume</span>
                    <span className="detail-value">{capacity.maximumVolumeSize}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">匹配 Nodes</span>
                    <span className="detail-value">{matchingNodes.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{capacity.age}</span>
                  </div>
                </div>
              </div>

              {(topologyLabelEntries.length > 0 || topologyExpressions.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">Node Topology</div>
                  <div className="conditions-table csi-capacity-topology-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>Key</div>
                      <div>Operator</div>
                      <div>Values</div>
                    </div>
                    {topologyLabelEntries.map(([key, value]) => (
                      <div key={key} className="conditions-row">
                        <div>Label</div>
                        <div>{key}</div>
                        <div>Equal</div>
                        <div>{value}</div>
                      </div>
                    ))}
                    {topologyExpressions.map((expression, index) => (
                      <div key={`${expression.key}-${index}`} className="conditions-row">
                        <div>Expression</div>
                        <div>{expression.key}</div>
                        <div>{expression.operator}</div>
                        <div className="detail-value-truncate">{expression.values}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedStorageClass || relatedDriver) && (
                <div className="detail-section">
                  <div className="detail-section-title">Provisioning</div>
                  <div className="conditions-table volumeattachment-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>状态</div>
                      <div>详情</div>
                    </div>
                    {relatedStorageClass && (
                      <div className="conditions-row">
                        <div>StorageClass</div>
                        <div>{relatedStorageClass.name}</div>
                        <div>{relatedStorageClass.reclaimPolicy}</div>
                        <div>{relatedStorageClass.volumeBindingMode}</div>
                      </div>
                    )}
                    {relatedDriver && (
                      <div className="conditions-row">
                        <div>CSIDriver</div>
                        <div>{relatedDriver.name}</div>
                        <div>{relatedDriver.fsGroupPolicy}</div>
                        <div>{relatedDriver.volumeLifecycleModes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {matchingNodes.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">匹配 Nodes</div>
                  <div className="conditions-table csi-capacity-nodes-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>版本</div>
                      <div>角色</div>
                      <div>存活</div>
                    </div>
                    {matchingNodes.map((node) => (
                      <div key={node.name} className="conditions-row">
                        <div>{node.name}</div>
                        <div className={`status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</div>
                        <div>{node.version}</div>
                        <div className="detail-value-truncate">{node.roles}</div>
                        <div>{node.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedPVs.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">PersistentVolumes</div>
                  <div className="conditions-table storage-pvs-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>访问模式</div>
                      <div>Claim</div>
                      <div>存活</div>
                    </div>
                    {relatedPVs.map((pv) => (
                      <div key={pv.name} className="conditions-row">
                        <div>{pv.name}</div>
                        <div className={`status ${pv.status === 'Bound' ? 'ok' : pv.status === 'Released' || pv.status === 'Failed' ? 'warn' : ''}`}>{pv.status}</div>
                        <div>{pv.capacity || '-'}</div>
                        <div>{pv.accessModes || '-'}</div>
                        <div className="detail-value-truncate">{pv.claim || '-'}</div>
                        <div>{pv.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedPVCs.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">PersistentVolumeClaims</div>
                  <div className="conditions-table storage-pvcs-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                      <div>容量</div>
                      <div>Volume</div>
                      <div>存活</div>
                    </div>
                    {relatedPVCs.map((pvc) => (
                      <div key={`${pvc.namespace}-${pvc.name}`} className="conditions-row">
                        <div>{pvc.name}</div>
                        <div>{pvc.namespace}</div>
                        <div className={`status ${pvc.status === 'Bound' ? 'ok' : pvc.status === 'Lost' ? 'warn' : ''}`}>{pvc.status}</div>
                        <div>{pvc.capacity || pvc.requestedCapacity || '-'}</div>
                        <div className="detail-value-truncate">{pvc.volumeName || '-'}</div>
                        <div>{pvc.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {capacity.labels && Object.keys(capacity.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(capacity.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedGatewayClass}
        loading={false}
        onClose={() => setSelectedGatewayClass(null)}
        title="GatewayClass 详情"
        renderDetails={(gatewayClass) => {
          const relatedGateways = gateways.filter((gateway) => gateway.gatewayClass === gatewayClass.name)
          const relatedEvents = events.filter((event) => (
            event.object === `GatewayClass/${gatewayClass.name}`
              || relatedGateways.some((gateway) => (
                event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`
              ))
          ))
          const conditions = gatewayClass.conditions ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{gatewayClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Controller</span>
                    <span className="detail-value">{gatewayClass.controllerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${gatewayClass.accepted === 'True' ? 'ok' : 'warn'}`}>{gatewayClass.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parameters</span>
                    <span className="detail-value">{gatewayClass.parametersRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gateways</span>
                    <span className="detail-value">{relatedGateways.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{gatewayClass.age}</span>
                  </div>
                </div>
              </div>

              {gatewayClass.description !== '-' && (
                <div className="detail-section">
                  <div className="detail-section-title">描述</div>
                  <div className="detail-text">{gatewayClass.description}</div>
                </div>
              )}

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table gateway-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>Type</div>
                      <div>Status</div>
                      <div>Reason</div>
                      <div>Message</div>
                      <div>Transition</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={`${condition.type}-${condition.reason}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedGateways.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Gateways</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>地址</div>
                      <div>Routes</div>
                      <div>Programmed</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className="detail-value-truncate">{gateway.addresses}</div>
                        <div>{gateway.attachedRoutes}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {gatewayClass.labels && Object.keys(gatewayClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(gatewayClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedGateway}
        loading={false}
        onClose={() => setSelectedGateway(null)}
        title="Gateway 详情"
        renderDetails={(gateway) => {
          const relatedClass = gatewayClasses.find((gatewayClass) => gatewayClass.name === gateway.gatewayClass)
          const relatedHTTPRoutes = httpRoutes.filter((route) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedGRPCRoutes = grpcRoutes.filter((route) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
              || relatedHTTPRoutes.some((route) => event.namespace === route.namespace && event.object === `HTTPRoute/${route.name}`)
              || relatedGRPCRoutes.some((route) => event.namespace === route.namespace && event.object === `GRPCRoute/${route.name}`)
          ))
          const listeners = gateway.listenerDetails ?? []
          const conditions = gateway.conditions ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{gateway.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{gateway.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value">{gateway.gatewayClass}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">地址</span>
                    <span className="detail-value">{gateway.addresses}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${gateway.accepted === 'True' ? 'ok' : 'warn'}`}>{gateway.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Programmed</span>
                    <span className={`detail-value status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Attached Routes</span>
                    <span className="detail-value">{gateway.attachedRoutes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{gateway.age}</span>
                  </div>
                </div>
              </div>

              {listeners.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Listeners</div>
                  <div className="conditions-table gateway-listeners-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>协议</div>
                      <div>端口</div>
                      <div>Hostname</div>
                      <div>Routes</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                    </div>
                    {listeners.map((listener) => (
                      <div key={`${listener.name}-${listener.port}`} className="conditions-row">
                        <div>{listener.name}</div>
                        <div>{listener.protocol}</div>
                        <div>{listener.port}</div>
                        <div className="detail-value-truncate">{listener.hostname}</div>
                        <div>{listener.attachedRoutes}</div>
                        <div className={`status ${listener.accepted === 'True' ? 'ok' : 'warn'}`}>{listener.accepted}</div>
                        <div className={`status ${listener.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{listener.resolvedRefs}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table gateway-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>Type</div>
                      <div>Status</div>
                      <div>Reason</div>
                      <div>Message</div>
                      <div>Transition</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={`${condition.type}-${condition.reason}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedClass || relatedHTTPRoutes.length > 0 || relatedGRPCRoutes.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClass && (
                      <div className="conditions-row">
                        <div>GatewayClass</div>
                        <div>{relatedClass.name}</div>
                        <div>-</div>
                        <div className={`status ${relatedClass.accepted === 'True' ? 'ok' : 'warn'}`}>{relatedClass.accepted}</div>
                      </div>
                    )}
                    {relatedHTTPRoutes.map((route) => (
                      <div key={`${route.namespace}-${route.name}`} className="conditions-row">
                        <div>HTTPRoute</div>
                        <div>{route.name}</div>
                        <div>{route.namespace}</div>
                        <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                      </div>
                    ))}
                    {relatedGRPCRoutes.map((route) => (
                      <div key={`${route.namespace}-${route.name}`} className="conditions-row">
                        <div>GRPCRoute</div>
                        <div>{route.name}</div>
                        <div>{route.namespace}</div>
                        <div className={`status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {gateway.labels && Object.keys(gateway.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(gateway.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedHTTPRoute}
        loading={false}
        onClose={() => setSelectedHTTPRoute(null)}
        title="HTTPRoute 详情"
        renderDetails={(route) => {
          const relatedGateways = gateways.filter((gateway) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedServices = services.filter((service) => (
            route.backendRefs.includes(`Service/${service.name}`)
              || route.backendRefs.includes(`Service/${service.namespace}/${service.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === route.namespace && event.object === `HTTPRoute/${route.name}`)
              || relatedGateways.some((gateway) => event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
          ))
          const parents = route.parentDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{route.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{route.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hostnames</span>
                    <span className="detail-value">{route.hostnames}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parents</span>
                    <span className="detail-value">{route.parentRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rules</span>
                    <span className="detail-value">{route.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved Refs</span>
                    <span className={`detail-value status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{route.age}</span>
                  </div>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parent Status</div>
                  <div className="conditions-table gateway-route-parents-table">
                    <div className="conditions-row conditions-head">
                      <div>Parent</div>
                      <div>Controller</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                      <div>Programmed</div>
                    </div>
                    {parents.map((parent) => (
                      <div key={`${parent.parentRef}-${parent.controllerName}`} className="conditions-row">
                        <div className="detail-value-truncate">{parent.parentRef}</div>
                        <div className="detail-value-truncate">{parent.controllerName}</div>
                        <div className={`status ${parent.accepted === 'True' ? 'ok' : 'warn'}`}>{parent.accepted}</div>
                        <div className={`status ${parent.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{parent.resolvedRefs}</div>
                        <div>{parent.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedGateways.length > 0 || relatedServices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>Gateway</div>
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Backend Refs</div>
                <div className="detail-text">{route.backendRefs}</div>
              </div>

              {renderRelatedEvents(relatedEvents)}

              {route.labels && Object.keys(route.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(route.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedGRPCRoute}
        loading={false}
        onClose={() => setSelectedGRPCRoute(null)}
        title="GRPCRoute 详情"
        renderDetails={(route) => {
          const relatedGateways = gateways.filter((gateway) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedServices = services.filter((service) => (
            route.backendRefs.includes(`Service/${service.name}`)
              || route.backendRefs.includes(`Service/${service.namespace}/${service.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === route.namespace && event.object === `GRPCRoute/${route.name}`)
              || relatedGateways.some((gateway) => event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
          ))
          const parents = route.parentDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{route.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{route.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hostnames</span>
                    <span className="detail-value">{route.hostnames}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parents</span>
                    <span className="detail-value">{route.parentRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rules</span>
                    <span className="detail-value">{route.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved Refs</span>
                    <span className={`detail-value status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{route.age}</span>
                  </div>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parent Status</div>
                  <div className="conditions-table gateway-route-parents-table">
                    <div className="conditions-row conditions-head">
                      <div>Parent</div>
                      <div>Controller</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                      <div>Programmed</div>
                    </div>
                    {parents.map((parent) => (
                      <div key={`${parent.parentRef}-${parent.controllerName}`} className="conditions-row">
                        <div className="detail-value-truncate">{parent.parentRef}</div>
                        <div className="detail-value-truncate">{parent.controllerName}</div>
                        <div className={`status ${parent.accepted === 'True' ? 'ok' : 'warn'}`}>{parent.accepted}</div>
                        <div className={`status ${parent.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{parent.resolvedRefs}</div>
                        <div>{parent.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedGateways.length > 0 || relatedServices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>Gateway</div>
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Backend Refs</div>
                <div className="detail-text">{route.backendRefs}</div>
              </div>

              {renderRelatedEvents(relatedEvents)}

              {route.labels && Object.keys(route.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(route.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedTLSRoute}
        loading={false}
        onClose={() => setSelectedTLSRoute(null)}
        title="TLSRoute 详情"
        renderDetails={(route) => {
          const relatedGateways = gateways.filter((gateway) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedServices = services.filter((service) => (
            route.backendRefs.includes(`Service/${service.name}`)
              || route.backendRefs.includes(`Service/${service.namespace}/${service.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === route.namespace && event.object === `TLSRoute/${route.name}`)
              || relatedGateways.some((gateway) => event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
          ))
          const parents = route.parentDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{route.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{route.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hostnames</span>
                    <span className="detail-value">{route.hostnames}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parents</span>
                    <span className="detail-value">{route.parentRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rules</span>
                    <span className="detail-value">{route.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved Refs</span>
                    <span className={`detail-value status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{route.age}</span>
                  </div>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parent Status</div>
                  <div className="conditions-table gateway-route-parents-table">
                    <div className="conditions-row conditions-head">
                      <div>Parent</div>
                      <div>Controller</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                      <div>Programmed</div>
                    </div>
                    {parents.map((parent) => (
                      <div key={`${parent.parentRef}-${parent.controllerName}`} className="conditions-row">
                        <div className="detail-value-truncate">{parent.parentRef}</div>
                        <div className="detail-value-truncate">{parent.controllerName}</div>
                        <div className={`status ${parent.accepted === 'True' ? 'ok' : 'warn'}`}>{parent.accepted}</div>
                        <div className={`status ${parent.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{parent.resolvedRefs}</div>
                        <div>{parent.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedGateways.length > 0 || relatedServices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>Gateway</div>
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Backend Refs</div>
                <div className="detail-text">{route.backendRefs}</div>
              </div>

              {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedTCPRoute}
        loading={false}
        onClose={() => setSelectedTCPRoute(null)}
        title="TCPRoute 详情"
        renderDetails={(route) => {
          const relatedGateways = gateways.filter((gateway) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedServices = services.filter((service) => (
            route.backendRefs.includes(`Service/${service.name}`)
              || route.backendRefs.includes(`Service/${service.namespace}/${service.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === route.namespace && event.object === `TCPRoute/${route.name}`)
              || relatedGateways.some((gateway) => event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
          ))
          const parents = route.parentDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{route.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{route.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parents</span>
                    <span className="detail-value">{route.parentRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rules</span>
                    <span className="detail-value">{route.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved Refs</span>
                    <span className={`detail-value status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{route.age}</span>
                  </div>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parent Status</div>
                  <div className="conditions-table gateway-route-parents-table">
                    <div className="conditions-row conditions-head">
                      <div>Parent</div>
                      <div>Controller</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                      <div>Programmed</div>
                    </div>
                    {parents.map((parent) => (
                      <div key={`${parent.parentRef}-${parent.controllerName}`} className="conditions-row">
                        <div className="detail-value-truncate">{parent.parentRef}</div>
                        <div className="detail-value-truncate">{parent.controllerName}</div>
                        <div className={`status ${parent.accepted === 'True' ? 'ok' : 'warn'}`}>{parent.accepted}</div>
                        <div className={`status ${parent.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{parent.resolvedRefs}</div>
                        <div>{parent.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedGateways.length > 0 || relatedServices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>Gateway</div>
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Backend Refs</div>
                <div className="detail-text">{route.backendRefs}</div>
              </div>

              {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedUDPRoute}
        loading={false}
        onClose={() => setSelectedUDPRoute(null)}
        title="UDPRoute 详情"
        renderDetails={(route) => {
          const relatedGateways = gateways.filter((gateway) => (
            route.parentRefs.includes(`Gateway/${gateway.name}`)
              || route.parentRefs.includes(`Gateway/${gateway.namespace}/${gateway.name}`)
          ))
          const relatedServices = services.filter((service) => (
            route.backendRefs.includes(`Service/${service.name}`)
              || route.backendRefs.includes(`Service/${service.namespace}/${service.name}`)
          ))
          const relatedEvents = events.filter((event) => (
            (event.namespace === route.namespace && event.object === `UDPRoute/${route.name}`)
              || relatedGateways.some((gateway) => event.namespace === gateway.namespace && event.object === `Gateway/${gateway.name}`)
          ))
          const parents = route.parentDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{route.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{route.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parents</span>
                    <span className="detail-value">{route.parentRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rules</span>
                    <span className="detail-value">{route.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Accepted</span>
                    <span className={`detail-value status ${route.accepted === 'True' ? 'ok' : 'warn'}`}>{route.accepted}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved Refs</span>
                    <span className={`detail-value status ${route.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{route.resolvedRefs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{route.age}</span>
                  </div>
                </div>
              </div>

              {parents.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parent Status</div>
                  <div className="conditions-table gateway-route-parents-table">
                    <div className="conditions-row conditions-head">
                      <div>Parent</div>
                      <div>Controller</div>
                      <div>Accepted</div>
                      <div>Refs</div>
                      <div>Programmed</div>
                    </div>
                    {parents.map((parent) => (
                      <div key={`${parent.parentRef}-${parent.controllerName}`} className="conditions-row">
                        <div className="detail-value-truncate">{parent.parentRef}</div>
                        <div className="detail-value-truncate">{parent.controllerName}</div>
                        <div className={`status ${parent.accepted === 'True' ? 'ok' : 'warn'}`}>{parent.accepted}</div>
                        <div className={`status ${parent.resolvedRefs === 'True' ? 'ok' : 'warn'}`}>{parent.resolvedRefs}</div>
                        <div>{parent.programmed}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedGateways.length > 0 || relatedServices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table gateway-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedGateways.map((gateway) => (
                      <div key={`${gateway.namespace}-${gateway.name}`} className="conditions-row">
                        <div>Gateway</div>
                        <div>{gateway.name}</div>
                        <div>{gateway.namespace}</div>
                        <div className={`status ${gateway.programmed === 'True' ? 'ok' : 'warn'}`}>{gateway.programmed}</div>
                      </div>
                    ))}
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <div className="detail-section-title">Backend Refs</div>
                <div className="detail-text">{route.backendRefs}</div>
              </div>

              {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedReferenceGrant}
        loading={false}
        onClose={() => setSelectedReferenceGrant(null)}
        title="ReferenceGrant 详情"
        renderDetails={(grant) => {
          const relatedEvents = events.filter((event) => (
            event.namespace === grant.namespace && event.object === `ReferenceGrant/${grant.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{grant.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{grant.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">From</span>
                    <span className="detail-value">{grant.from}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To</span>
                    <span className="detail-value">{grant.to}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{grant.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">授权来源与目标</div>
                <div className="conditions-table referencegrant-table">
                  <div className="conditions-row conditions-head">
                    <div>方向</div>
                    <div>Group</div>
                    <div>Kind</div>
                    <div>Namespace</div>
                    <div>Name</div>
                  </div>
                  {(grant.fromDetails ?? []).map((ref, index) => (
                    <div key={`from-${index}`} className="conditions-row">
                      <div>From</div>
                      <div>{ref.group || '-'}</div>
                      <div>{ref.kind}</div>
                      <div>{ref.namespace || '-'}</div>
                      <div>{ref.name || '*'}</div>
                    </div>
                  ))}
                  {(grant.toDetails ?? []).map((ref, index) => (
                    <div key={`to-${index}`} className="conditions-row">
                      <div>To</div>
                      <div>{ref.group || '-'}</div>
                      <div>{ref.kind}</div>
                      <div>{ref.namespace || grant.namespace}</div>
                      <div>{ref.name || '*'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {renderRelatedEvents(relatedEvents)}

              {grant.labels && Object.keys(grant.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(grant.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedDeviceClass}
        loading={false}
        onClose={() => setSelectedDeviceClass(null)}
        title="DeviceClass 详情"
        renderDetails={(deviceClass) => {
          const relatedClaims = resourceClaims.filter((claim) => claim.deviceClasses.includes(deviceClass.name))
          const relatedTemplates = resourceClaimTemplates.filter((template) => template.deviceClasses.includes(deviceClass.name))
          const relatedSlices = resourceSlices.filter((slice) => slice.driver === deviceClass.name)
          const relatedEvents = events.filter((event) => (
            event.object === `DeviceClass/${deviceClass.name}`
              || relatedClaims.some((claim) => (
                event.namespace === claim.namespace && event.object === `ResourceClaim/${claim.name}`
              ))
              || relatedTemplates.some((template) => (
                event.namespace === template.namespace && event.object === `ResourceClaimTemplate/${template.name}`
              ))
              || relatedSlices.some((slice) => event.object === `ResourceSlice/${slice.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{deviceClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Extended Resource</span>
                    <span className="detail-value">{deviceClass.extendedResourceName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Selectors</span>
                    <span className="detail-value">{deviceClass.selectors}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Config</span>
                    <span className="detail-value">{deviceClass.config}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ResourceClaims</span>
                    <span className="detail-value">{relatedClaims.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{deviceClass.age}</span>
                  </div>
                </div>
              </div>

              {(relatedClaims.length > 0 || relatedTemplates.length > 0 || relatedSlices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table dra-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClaims.map((claim) => (
                      <div key={`${claim.namespace}-${claim.name}`} className="conditions-row">
                        <div>ResourceClaim</div>
                        <div>{claim.name}</div>
                        <div>{claim.namespace}</div>
                        <div className={`status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'Allocated' : 'Pending'}</div>
                      </div>
                    ))}
                    {relatedTemplates.map((template) => (
                      <div key={`${template.namespace}-${template.name}`} className="conditions-row">
                        <div>ResourceClaimTemplate</div>
                        <div>{template.name}</div>
                        <div>{template.namespace}</div>
                        <div>{template.requests} requests</div>
                      </div>
                    ))}
                    {relatedSlices.map((slice) => (
                      <div key={slice.name} className="conditions-row">
                        <div>ResourceSlice</div>
                        <div>{slice.name}</div>
                        <div>{slice.node}</div>
                        <div>{slice.devices} devices</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {deviceClass.labels && Object.keys(deviceClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(deviceClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedDeviceTaintRule}
        loading={false}
        onClose={() => setSelectedDeviceTaintRule(null)}
        title="DeviceTaintRule 详情"
        renderDetails={(rule) => {
          const relatedDeviceClass = rule.deviceClassName !== '-'
            ? deviceClasses.find((deviceClass) => deviceClass.name === rule.deviceClassName)
            : undefined
          const relatedSlices = resourceSlices.filter((slice) => {
            const driverMatches = rule.driver === '-' || slice.driver === rule.driver
            const poolMatches = rule.pool === '-' || slice.pool === rule.pool
            const deviceMatches = rule.device === '-' || (slice.deviceNames ?? []).includes(rule.device)
            return driverMatches && poolMatches && deviceMatches
          })
          const relatedClaims = resourceClaims.filter((claim) => (
            (rule.deviceClassName !== '-' && claim.deviceClasses.includes(rule.deviceClassName))
              || (claim.allocationDetails ?? []).some((allocation) => {
                const driverMatches = rule.driver === '-' || allocation.includes(`${rule.driver}/`)
                const poolMatches = rule.pool === '-' || allocation.includes(`/${rule.pool}/`)
                const deviceMatches = rule.device === '-' || allocation.endsWith(`/${rule.device}`)
                return driverMatches && poolMatches && deviceMatches
              })
          ))
          const relatedEvents = events.filter((event) => (
            event.object === `DeviceTaintRule/${rule.name}`
              || (relatedDeviceClass && event.object === `DeviceClass/${relatedDeviceClass.name}`)
              || relatedSlices.some((slice) => event.object === `ResourceSlice/${slice.name}`)
              || relatedClaims.some((claim) => (
                event.namespace === claim.namespace && event.object === `ResourceClaim/${claim.name}`
              ))
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{rule.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{rule.driver}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pool</span>
                    <span className="detail-value">{rule.pool}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">DeviceClass</span>
                    <span className="detail-value">{rule.deviceClassName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Device</span>
                    <span className="detail-value">{rule.device}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CEL Selectors</span>
                    <span className="detail-value">{rule.celSelectors}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 ResourceSlices</span>
                    <span className="detail-value">{relatedSlices.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{rule.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Taint</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Key</span>
                    <span className="detail-value">{rule.taintKey}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Value</span>
                    <span className="detail-value">{rule.taintValue}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Effect</span>
                    <span className="detail-value">{rule.taintEffect}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time Added</span>
                    <span className="detail-value">{rule.timeAdded}</span>
                  </div>
                </div>
              </div>

              {(relatedDeviceClass || relatedSlices.length > 0 || relatedClaims.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table dra-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>范围</div>
                      <div>状态</div>
                    </div>
                    {relatedDeviceClass && (
                      <div className="conditions-row">
                        <div>DeviceClass</div>
                        <div>{relatedDeviceClass.name}</div>
                        <div>cluster</div>
                        <div>{relatedDeviceClass.selectors} selectors</div>
                      </div>
                    )}
                    {relatedSlices.map((slice) => (
                      <div key={slice.name} className="conditions-row">
                        <div>ResourceSlice</div>
                        <div>{slice.name}</div>
                        <div>{slice.node}</div>
                        <div>{slice.devices} devices</div>
                      </div>
                    ))}
                    {relatedClaims.map((claim) => (
                      <div key={`${claim.namespace}-${claim.name}`} className="conditions-row">
                        <div>ResourceClaim</div>
                        <div>{claim.name}</div>
                        <div>{claim.namespace}</div>
                        <div className={`status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'Allocated' : 'Pending'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {rule.labels && Object.keys(rule.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(rule.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedResourceClaim}
        loading={false}
        onClose={() => setSelectedResourceClaim(null)}
        title="ResourceClaim 详情"
        renderDetails={(claim) => {
          const relatedClasses = deviceClasses.filter((deviceClass) => claim.deviceClasses.includes(deviceClass.name))
          const relatedSlices = resourceSlices.filter((slice) => (
            (claim.allocationDetails ?? []).some((allocation) => allocation.includes(`${slice.driver}/${slice.pool}/`))
          ))
          const relatedEvents = events.filter((event) => (
            event.namespace === claim.namespace && event.object === `ResourceClaim/${claim.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{claim.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{claim.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Device Classes</span>
                    <span className="detail-value">{claim.deviceClasses}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Requests</span>
                    <span className="detail-value">{claim.requests}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Allocated</span>
                    <span className={`detail-value status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Allocated Devices</span>
                    <span className="detail-value">{claim.allocatedDevices}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reserved For</span>
                    <span className="detail-value">{claim.reservedFor}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{claim.age}</span>
                  </div>
                </div>
              </div>

              {(claim.requestDetails ?? []).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Device Requests</div>
                  <div className="conditions-table dra-list-table">
                    {(claim.requestDetails ?? []).map((request) => (
                      <div key={request} className="conditions-row">
                        <div className="detail-value-truncate" title={request}>{request}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(claim.allocationDetails ?? []).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Allocation</div>
                  <div className="conditions-table dra-list-table">
                    {(claim.allocationDetails ?? []).map((allocation) => (
                      <div key={allocation} className="conditions-row">
                        <div className="detail-value-truncate" title={allocation}>{allocation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedClasses.length > 0 || relatedSlices.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table dra-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClasses.map((deviceClass) => (
                      <div key={deviceClass.name} className="conditions-row">
                        <div>DeviceClass</div>
                        <div>{deviceClass.name}</div>
                        <div>-</div>
                        <div>{deviceClass.extendedResourceName}</div>
                      </div>
                    ))}
                    {relatedSlices.map((slice) => (
                      <div key={slice.name} className="conditions-row">
                        <div>ResourceSlice</div>
                        <div>{slice.name}</div>
                        <div>{slice.node}</div>
                        <div>{slice.devices} devices</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {claim.labels && Object.keys(claim.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(claim.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedResourceClaimTemplate}
        loading={false}
        onClose={() => setSelectedResourceClaimTemplate(null)}
        title="ResourceClaimTemplate 详情"
        renderDetails={(template) => {
          const relatedClasses = deviceClasses.filter((deviceClass) => template.deviceClasses.includes(deviceClass.name))
          const relatedClaims = resourceClaims.filter((claim) => (
            claim.namespace === template.namespace && claim.deviceClasses === template.deviceClasses
          ))
          const relatedEvents = events.filter((event) => (
            event.namespace === template.namespace && event.object === `ResourceClaimTemplate/${template.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{template.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{template.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Device Classes</span>
                    <span className="detail-value">{template.deviceClasses}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Requests</span>
                    <span className="detail-value">{template.requests}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Related Claims</span>
                    <span className="detail-value">{relatedClaims.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{template.age}</span>
                  </div>
                </div>
              </div>

              {(template.requestDetails ?? []).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Device Requests</div>
                  <div className="conditions-table dra-list-table">
                    {(template.requestDetails ?? []).map((request) => (
                      <div key={request} className="conditions-row">
                        <div className="detail-value-truncate" title={request}>{request}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedClasses.length > 0 || relatedClaims.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table dra-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClasses.map((deviceClass) => (
                      <div key={deviceClass.name} className="conditions-row">
                        <div>DeviceClass</div>
                        <div>{deviceClass.name}</div>
                        <div>-</div>
                        <div>{deviceClass.extendedResourceName}</div>
                      </div>
                    ))}
                    {relatedClaims.map((claim) => (
                      <div key={`${claim.namespace}-${claim.name}`} className="conditions-row">
                        <div>ResourceClaim</div>
                        <div>{claim.name}</div>
                        <div>{claim.namespace}</div>
                        <div className={`status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'Allocated' : 'Pending'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {template.labels && Object.keys(template.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(template.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedResourceSlice}
        loading={false}
        onClose={() => setSelectedResourceSlice(null)}
        title="ResourceSlice 详情"
        renderDetails={(slice) => {
          const relatedClaims = resourceClaims.filter((claim) => (
            (claim.allocationDetails ?? []).some((allocation) => allocation.includes(`${slice.driver}/${slice.pool}/`))
          ))
          const relatedEvents = events.filter((event) => (
            event.object === `ResourceSlice/${slice.name}`
              || relatedClaims.some((claim) => (
                event.namespace === claim.namespace && event.object === `ResourceClaim/${claim.name}`
              ))
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{slice.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{slice.driver}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pool</span>
                    <span className="detail-value">{slice.pool}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Node</span>
                    <span className="detail-value">{slice.node}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Devices</span>
                    <span className="detail-value">{slice.devices}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">All Nodes</span>
                    <span className="detail-value">{slice.allNodes ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Related Claims</span>
                    <span className="detail-value">{relatedClaims.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{slice.age}</span>
                  </div>
                </div>
              </div>

              {(slice.deviceNames ?? []).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Devices</div>
                  <div className="conditions-table dra-list-table">
                    {(slice.deviceNames ?? []).map((deviceName) => (
                      <div key={deviceName} className="conditions-row">
                        <div className="detail-value-truncate" title={deviceName}>{deviceName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedClaims.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 ResourceClaims</div>
                  <div className="conditions-table dra-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClaims.map((claim) => (
                      <div key={`${claim.namespace}-${claim.name}`} className="conditions-row">
                        <div>ResourceClaim</div>
                        <div>{claim.name}</div>
                        <div>{claim.namespace}</div>
                        <div className={`status ${claim.allocated ? 'ok' : 'warn'}`}>{claim.allocated ? 'Allocated' : 'Pending'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {slice.labels && Object.keys(slice.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(slice.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedVolumeSnapshotClass}
        loading={false}
        onClose={() => setSelectedVolumeSnapshotClass(null)}
        title="VolumeSnapshotClass 详情"
        renderDetails={(snapshotClass) => {
          const relatedSnapshots = volumeSnapshots.filter((snapshot) => snapshot.snapshotClass === snapshotClass.name)
          const relatedContents = volumeSnapshotContents.filter((content) => content.snapshotClass === snapshotClass.name)
          const relatedDriver = csiDrivers.find((driver) => driver.name === snapshotClass.driver)
          const relatedEvents = events.filter((event) => (
            event.object === `VolumeSnapshotClass/${snapshotClass.name}`
              || relatedSnapshots.some((snapshot) => (
                event.namespace === snapshot.namespace && event.object === `VolumeSnapshot/${snapshot.name}`
              ))
              || relatedContents.some((content) => event.object === `VolumeSnapshotContent/${content.name}`)
          ))
          const parameterEntries = Object.entries(snapshotClass.parameterDetails ?? {})

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{snapshotClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{snapshotClass.driver}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deletion Policy</span>
                    <span className="detail-value">{snapshotClass.deletionPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Snapshots</span>
                    <span className="detail-value">{relatedSnapshots.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contents</span>
                    <span className="detail-value">{relatedContents.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{snapshotClass.age}</span>
                  </div>
                </div>
              </div>

              {parameterEntries.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Parameters</div>
                  <div className="conditions-table snapshot-parameters-table">
                    <div className="conditions-row conditions-head">
                      <div>Key</div>
                      <div>Value</div>
                    </div>
                    {parameterEntries.map(([key, value]) => (
                      <div key={key} className="conditions-row">
                        <div>{key}</div>
                        <div className="detail-value-truncate">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedDriver || relatedSnapshots.length > 0 || relatedContents.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table snapshot-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedDriver && (
                      <div className="conditions-row">
                        <div>CSIDriver</div>
                        <div>{relatedDriver.name}</div>
                        <div>-</div>
                        <div>{relatedDriver.volumeLifecycleModes}</div>
                      </div>
                    )}
                    {relatedSnapshots.map((snapshot) => (
                      <div key={`${snapshot.namespace}-${snapshot.name}`} className="conditions-row">
                        <div>VolumeSnapshot</div>
                        <div>{snapshot.name}</div>
                        <div>{snapshot.namespace}</div>
                        <div className={`status ${snapshot.readyToUse ? 'ok' : 'warn'}`}>{snapshot.readyToUse ? 'Ready' : 'NotReady'}</div>
                      </div>
                    ))}
                    {relatedContents.map((content) => (
                      <div key={content.name} className="conditions-row">
                        <div>VolumeSnapshotContent</div>
                        <div>{content.name}</div>
                        <div>-</div>
                        <div className={`status ${content.readyToUse ? 'ok' : 'warn'}`}>{content.readyToUse ? 'Ready' : 'NotReady'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {snapshotClass.labels && Object.keys(snapshotClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(snapshotClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedVolumeSnapshot}
        loading={false}
        onClose={() => setSelectedVolumeSnapshot(null)}
        title="VolumeSnapshot 详情"
        renderDetails={(snapshot) => {
          const relatedClass = volumeSnapshotClasses.find((snapshotClass) => snapshotClass.name === snapshot.snapshotClass)
          const relatedContent = volumeSnapshotContents.find((content) => (
            content.name === snapshot.boundContent
              || (
                content.volumeSnapshotName === snapshot.name
                  && content.volumeSnapshotNamespace === snapshot.namespace
              )
          ))
          const sourcePVC = snapshot.sourcePVC
            ? persistentVolumeClaims.find((pvc) => pvc.namespace === snapshot.namespace && pvc.name === snapshot.sourcePVC)
            : undefined
          const sourcePV = sourcePVC?.volumeName
            ? persistentVolumes.find((pv) => pv.name === sourcePVC.volumeName)
            : undefined
          const relatedEvents = events.filter((event) => (
            event.namespace === snapshot.namespace
              && (
                event.object === `VolumeSnapshot/${snapshot.name}`
                  || (sourcePVC && event.object === `PersistentVolumeClaim/${sourcePVC.name}`)
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{snapshot.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{snapshot.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value">{snapshot.snapshotClass}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Source</span>
                    <span className="detail-value">{snapshot.source}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Content</span>
                    <span className="detail-value">{snapshot.boundContent}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ready</span>
                    <span className={`detail-value status ${snapshot.readyToUse ? 'ok' : 'warn'}`}>{snapshot.readyToUse ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Restore Size</span>
                    <span className="detail-value">{snapshot.restoreSize}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Error</span>
                    <span className="detail-value">{snapshot.error}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{snapshot.age}</span>
                  </div>
                </div>
              </div>

              {(relatedClass || relatedContent || sourcePVC || sourcePV) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table snapshot-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClass && (
                      <div className="conditions-row">
                        <div>VolumeSnapshotClass</div>
                        <div>{relatedClass.name}</div>
                        <div>-</div>
                        <div>{relatedClass.deletionPolicy}</div>
                      </div>
                    )}
                    {relatedContent && (
                      <div className="conditions-row">
                        <div>VolumeSnapshotContent</div>
                        <div>{relatedContent.name}</div>
                        <div>-</div>
                        <div className={`status ${relatedContent.readyToUse ? 'ok' : 'warn'}`}>{relatedContent.readyToUse ? 'Ready' : 'NotReady'}</div>
                      </div>
                    )}
                    {sourcePVC && (
                      <div className="conditions-row">
                        <div>PersistentVolumeClaim</div>
                        <div>{sourcePVC.name}</div>
                        <div>{sourcePVC.namespace}</div>
                        <div>{sourcePVC.status}</div>
                      </div>
                    )}
                    {sourcePV && (
                      <div className="conditions-row">
                        <div>PersistentVolume</div>
                        <div>{sourcePV.name}</div>
                        <div>-</div>
                        <div>{sourcePV.status}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {snapshot.labels && Object.keys(snapshot.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(snapshot.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedVolumeSnapshotContent}
        loading={false}
        onClose={() => setSelectedVolumeSnapshotContent(null)}
        title="VolumeSnapshotContent 详情"
        renderDetails={(content) => {
          const relatedClass = volumeSnapshotClasses.find((snapshotClass) => snapshotClass.name === content.snapshotClass)
          const relatedSnapshot = content.volumeSnapshotName && content.volumeSnapshotNamespace
            ? volumeSnapshots.find((snapshot) => (
                snapshot.name === content.volumeSnapshotName
                  && snapshot.namespace === content.volumeSnapshotNamespace
              ))
            : undefined
          const relatedDriver = csiDrivers.find((driver) => driver.name === content.driver)
          const relatedEvents = events.filter((event) => (
            event.object === `VolumeSnapshotContent/${content.name}`
              || (relatedSnapshot && event.namespace === relatedSnapshot.namespace && event.object === `VolumeSnapshot/${relatedSnapshot.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{content.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value">{content.snapshotClass}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driver</span>
                    <span className="detail-value">{content.driver}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deletion Policy</span>
                    <span className="detail-value">{content.deletionPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Source</span>
                    <span className="detail-value">{content.source}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">VolumeSnapshot</span>
                    <span className="detail-value">{content.volumeSnapshot}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ready</span>
                    <span className={`detail-value status ${content.readyToUse ? 'ok' : 'warn'}`}>{content.readyToUse ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Restore Size</span>
                    <span className="detail-value">{content.restoreSize}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Handle</span>
                    <span className="detail-value">{content.handle}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Error</span>
                    <span className="detail-value">{content.error}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{content.age}</span>
                  </div>
                </div>
              </div>

              {(relatedClass || relatedSnapshot || relatedDriver) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联资源</div>
                  <div className="conditions-table snapshot-links-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>状态</div>
                    </div>
                    {relatedClass && (
                      <div className="conditions-row">
                        <div>VolumeSnapshotClass</div>
                        <div>{relatedClass.name}</div>
                        <div>-</div>
                        <div>{relatedClass.deletionPolicy}</div>
                      </div>
                    )}
                    {relatedSnapshot && (
                      <div className="conditions-row">
                        <div>VolumeSnapshot</div>
                        <div>{relatedSnapshot.name}</div>
                        <div>{relatedSnapshot.namespace}</div>
                        <div className={`status ${relatedSnapshot.readyToUse ? 'ok' : 'warn'}`}>{relatedSnapshot.readyToUse ? 'Ready' : 'NotReady'}</div>
                      </div>
                    )}
                    {relatedDriver && (
                      <div className="conditions-row">
                        <div>CSIDriver</div>
                        <div>{relatedDriver.name}</div>
                        <div>-</div>
                        <div>{relatedDriver.volumeLifecycleModes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {content.labels && Object.keys(content.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(content.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedServiceAccount}
        loading={false}
        onClose={() => setSelectedServiceAccount(null)}
        title="ServiceAccount 详情"
        renderDetails={(serviceAccount) => {
          const secretNames = serviceAccount.secretNames ?? []
          const imagePullSecretNames = serviceAccount.imagePullSecretNames ?? []
          const relatedPods = pods.filter((pod) => (
            pod.namespace === serviceAccount.namespace && pod.serviceAccount === serviceAccount.name
          ))
          const relatedRoleBindings = roleBindings.filter((binding) => (
            binding.subjectDetails?.some((subject) => (
              subject.kind === 'ServiceAccount'
                && subject.name === serviceAccount.name
                && (subject.namespace ?? binding.namespace) === serviceAccount.namespace
            ))
          ))
          const relatedClusterRoleBindings = clusterRoleBindings.filter((binding) => (
            binding.subjectDetails?.some((subject) => (
              subject.kind === 'ServiceAccount'
                && subject.name === serviceAccount.name
                && subject.namespace === serviceAccount.namespace
            ))
          ))
          const relatedSecrets = secrets.filter((secret) => (
            secret.namespace === serviceAccount.namespace && secretNames.includes(secret.name)
          ))
          const relatedObjects = new Set([
            `ServiceAccount/${serviceAccount.name}`,
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
            ...relatedRoleBindings.map((binding) => `RoleBinding/${binding.name}`),
            ...relatedClusterRoleBindings.map((binding) => `ClusterRoleBinding/${binding.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.namespace === serviceAccount.namespace
              ? relatedObjects.has(event.object)
              : relatedClusterRoleBindings.some((binding) => event.object === `ClusterRoleBinding/${binding.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{serviceAccount.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{serviceAccount.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Secrets</span>
                    <span className="detail-value">{serviceAccount.secrets}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ImagePullSecrets</span>
                    <span className="detail-value">{imagePullSecretNames.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Automount Token</span>
                    <span className="detail-value">{serviceAccount.automountServiceAccountToken === undefined ? '-' : serviceAccount.automountServiceAccountToken ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">RoleBindings</span>
                    <span className="detail-value">{relatedRoleBindings.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ClusterRoleBindings</span>
                    <span className="detail-value">{relatedClusterRoleBindings.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{serviceAccount.age}</span>
                  </div>
                </div>
              </div>

              {(secretNames.length > 0 || imagePullSecretNames.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Secrets</div>
                  <div className="conditions-table serviceaccount-secrets-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>来源</div>
                      <div>类型</div>
                      <div>Keys</div>
                      <div>存活</div>
                    </div>
                    {secretNames.map((name) => {
                      const secret = relatedSecrets.find((item) => item.name === name)
                      return (
                        <div key={`token-${name}`} className="conditions-row">
                          <div>{name}</div>
                          <div>Secret</div>
                          <div>{secret?.type ?? '-'}</div>
                          <div>{secret?.dataKeys?.length ?? '-'}</div>
                          <div>{secret?.age ?? '-'}</div>
                        </div>
                      )
                    })}
                    {imagePullSecretNames.map((name) => {
                      const secret = secrets.find((item) => item.namespace === serviceAccount.namespace && item.name === name)
                      return (
                        <div key={`pull-${name}`} className="conditions-row">
                          <div>{name}</div>
                          <div>ImagePullSecret</div>
                          <div>{secret?.type ?? '-'}</div>
                          <div>{secret?.dataKeys?.length ?? '-'}</div>
                          <div>{secret?.age ?? '-'}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(relatedRoleBindings.length > 0 || relatedClusterRoleBindings.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 RBAC Bindings</div>
                  <div className="conditions-table serviceaccount-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>RoleRef</div>
                      <div>命名空间</div>
                      <div>存活</div>
                    </div>
                    {relatedRoleBindings.map((binding) => (
                      <div key={`${binding.namespace}-${binding.name}`} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>RoleBinding</div>
                        <div className="detail-value-truncate">{binding.roleRef}</div>
                        <div>{binding.namespace}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                    {relatedClusterRoleBindings.map((binding) => (
                      <div key={binding.name} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>ClusterRoleBinding</div>
                        <div className="detail-value-truncate">{binding.roleRef}</div>
                        <div>-</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {serviceAccount.labels && Object.keys(serviceAccount.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(serviceAccount.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedRole}
        loading={false}
        onClose={() => setSelectedRole(null)}
        title="Role 详情"
        renderDetails={(role) => {
          const relatedBindings = roleBindings.filter((binding) => {
            const ref = roleRefParts(binding.roleRef, binding.roleRefKind, binding.roleRefName)
            return binding.namespace === role.namespace && ref.kind === 'Role' && ref.name === role.name
          })
          const relatedEvents = events.filter((event) => (
            event.namespace === role.namespace
              && (
                event.object === `Role/${role.name}`
                  || relatedBindings.some((binding) => event.object === `RoleBinding/${binding.name}`)
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{role.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{role.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">规则数</span>
                    <span className="detail-value">{role.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">RoleBindings</span>
                    <span className="detail-value">{relatedBindings.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{role.age}</span>
                  </div>
                </div>
              </div>
              {renderRbacRules(role.ruleDetails)}
              {relatedBindings.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 RoleBindings</div>
                  <div className="conditions-table rbac-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>RoleRef</div>
                      <div>Subjects</div>
                      <div>数量</div>
                      <div>存活</div>
                    </div>
                    {relatedBindings.map((binding) => (
                      <div key={`${binding.namespace}-${binding.name}`} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>{binding.roleRef}</div>
                        <div className="detail-value-truncate">
                          {(binding.subjectDetails ?? []).map((subject) => `${subject.kind}/${subject.namespace ? `${subject.namespace}/` : ''}${subject.name}`).join(', ') || '-'}
                        </div>
                        <div>{binding.subjects}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderRelatedEvents(relatedEvents)}
              {role.labels && Object.keys(role.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(role.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedRoleBinding}
        loading={false}
        onClose={() => setSelectedRoleBinding(null)}
        title="RoleBinding 详情"
        renderDetails={(binding) => {
          const ref = roleRefParts(binding.roleRef, binding.roleRefKind, binding.roleRefName)
          const relatedRole = ref.kind === 'Role'
            ? roles.find((role) => role.namespace === binding.namespace && role.name === ref.name)
            : undefined
          const relatedClusterRole = ref.kind === 'ClusterRole'
            ? clusterRoles.find((role) => role.name === ref.name)
            : undefined
          const relatedEvents = events.filter((event) => (
            event.namespace === binding.namespace && event.object === `RoleBinding/${binding.name}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{binding.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{binding.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">RoleRef</span>
                    <span className="detail-value">{binding.roleRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">API Group</span>
                    <span className="detail-value">{binding.roleRefApiGroup ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Subjects</span>
                    <span className="detail-value">{binding.subjects}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{binding.age}</span>
                  </div>
                </div>
              </div>
              {renderRbacSubjects(binding.subjectDetails)}
              {(relatedRole || relatedClusterRole) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联角色</div>
                  <div className="conditions-table rbac-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>命名空间</div>
                      <div>规则数</div>
                      <div>存活</div>
                    </div>
                    {relatedRole && (
                      <div className="conditions-row">
                        <div>{relatedRole.name}</div>
                        <div>Role</div>
                        <div>{relatedRole.namespace}</div>
                        <div>{relatedRole.rules}</div>
                        <div>{relatedRole.age}</div>
                      </div>
                    )}
                    {relatedClusterRole && (
                      <div className="conditions-row">
                        <div>{relatedClusterRole.name}</div>
                        <div>ClusterRole</div>
                        <div>-</div>
                        <div>{relatedClusterRole.rules}</div>
                        <div>{relatedClusterRole.age}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {renderRelatedEvents(relatedEvents)}
              {binding.labels && Object.keys(binding.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(binding.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedClusterRole}
        loading={false}
        onClose={() => setSelectedClusterRole(null)}
        title="ClusterRole 详情"
        renderDetails={(role) => {
          const relatedRoleBindings = roleBindings.filter((binding) => {
            const ref = roleRefParts(binding.roleRef, binding.roleRefKind, binding.roleRefName)
            return ref.kind === 'ClusterRole' && ref.name === role.name
          })
          const relatedClusterRoleBindings = clusterRoleBindings.filter((binding) => {
            const ref = roleRefParts(binding.roleRef, binding.roleRefKind, binding.roleRefName)
            return ref.kind === 'ClusterRole' && ref.name === role.name
          })
          const relatedEvents = events.filter((event) => (
            event.object === `ClusterRole/${role.name}`
              || relatedRoleBindings.some((binding) => event.namespace === binding.namespace && event.object === `RoleBinding/${binding.name}`)
              || relatedClusterRoleBindings.some((binding) => event.object === `ClusterRoleBinding/${binding.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{role.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">规则数</span>
                    <span className="detail-value">{role.rules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">RoleBindings</span>
                    <span className="detail-value">{relatedRoleBindings.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ClusterRoleBindings</span>
                    <span className="detail-value">{relatedClusterRoleBindings.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Aggregation</span>
                    <span className="detail-value">{role.aggregationRule ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{role.age}</span>
                  </div>
                </div>
              </div>
              {renderRbacRules(role.ruleDetails)}
              {(relatedRoleBindings.length > 0 || relatedClusterRoleBindings.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Bindings</div>
                  <div className="conditions-table rbac-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>命名空间</div>
                      <div>Subjects</div>
                      <div>存活</div>
                    </div>
                    {relatedRoleBindings.map((binding) => (
                      <div key={`${binding.namespace}-${binding.name}`} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>RoleBinding</div>
                        <div>{binding.namespace}</div>
                        <div>{binding.subjects}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                    {relatedClusterRoleBindings.map((binding) => (
                      <div key={binding.name} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>ClusterRoleBinding</div>
                        <div>-</div>
                        <div>{binding.subjects}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderRelatedEvents(relatedEvents)}
              {role.labels && Object.keys(role.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(role.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedClusterRoleBinding}
        loading={false}
        onClose={() => setSelectedClusterRoleBinding(null)}
        title="ClusterRoleBinding 详情"
        renderDetails={(binding) => {
          const ref = roleRefParts(binding.roleRef, binding.roleRefKind, binding.roleRefName)
          const relatedClusterRole = ref.kind === 'ClusterRole'
            ? clusterRoles.find((role) => role.name === ref.name)
            : undefined
          const relatedEvents = events.filter((event) => event.object === `ClusterRoleBinding/${binding.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{binding.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">RoleRef</span>
                    <span className="detail-value">{binding.roleRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">API Group</span>
                    <span className="detail-value">{binding.roleRefApiGroup ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Subjects</span>
                    <span className="detail-value">{binding.subjects}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{binding.age}</span>
                  </div>
                </div>
              </div>
              {renderRbacSubjects(binding.subjectDetails)}
              {relatedClusterRole && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 ClusterRole</div>
                  <div className="conditions-table rbac-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>命名空间</div>
                      <div>规则数</div>
                      <div>存活</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedClusterRole.name}</div>
                      <div>ClusterRole</div>
                      <div>-</div>
                      <div>{relatedClusterRole.rules}</div>
                      <div>{relatedClusterRole.age}</div>
                    </div>
                  </div>
                </div>
              )}
              {renderRelatedEvents(relatedEvents)}
              {binding.labels && Object.keys(binding.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(binding.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedSelfSubjectReview}
        loading={false}
        onClose={() => setSelectedSelfSubjectReview(null)}
        title="SelfSubjectReview 详情"
        renderDetails={(review) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">{review.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">UID</span>
                  <span className="detail-value">{review.uid}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Group Count</span>
                  <span className="detail-value">{review.groupCount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Extra Keys</span>
                  <span className="detail-value">{review.extraKeys}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">身份属性</div>
              <div className="conditions-table selfsubject-review-table">
                <div className="conditions-row conditions-head">
                  <div>Groups</div>
                  <div>Extra</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={review.groups}>{review.groups}</div>
                  <div className="detail-value-truncate" title={review.extra}>{review.extra}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedSelfSubjectAccessReview}
        loading={false}
        onClose={() => setSelectedSelfSubjectAccessReview(null)}
        title="SelfSubjectAccessReview 详情"
        renderDetails={(review) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{review.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{review.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scope</span>
                  <span className="detail-value">{review.scope}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${review.denied ? 'error' : review.allowed ? 'ok' : 'warn'}`}>
                    {review.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">检查目标</div>
              <div className="conditions-table selfsubject-access-table">
                <div className="conditions-row conditions-head">
                  <div>Verb</div>
                  <div>API Group</div>
                  <div>Resource</div>
                  <div>Subresource</div>
                  <div>Path</div>
                </div>
                <div className="conditions-row">
                  <div>{review.verb}</div>
                  <div className="detail-value-truncate" title={review.apiGroup}>{review.apiGroup}</div>
                  <div className="detail-value-truncate" title={review.resource}>{review.resource}</div>
                  <div>{review.subresource}</div>
                  <div className="detail-value-truncate" title={review.path}>{review.path}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">评估结果</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Allowed</span>
                  <span className={`detail-value status ${review.allowed ? 'ok' : 'warn'}`}>
                    {review.allowed ? 'true' : 'false'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Denied</span>
                  <span className={`detail-value status ${review.denied ? 'error' : 'ok'}`}>
                    {review.denied ? 'true' : 'false'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reason</span>
                  <span className="detail-value">{review.reason}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Error</span>
                  <span className="detail-value">{review.evaluationError}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedSelfSubjectRule}
        loading={false}
        onClose={() => setSelectedSelfSubjectRule(null)}
        title="SelfSubjectRulesReview 详情"
        renderDetails={(rule) => (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{rule.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">类型</span>
                  <span className="detail-value">{rule.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Verbs</span>
                  <span className="detail-value">{rule.verbs}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">完整性</span>
                  <span className={`detail-value status ${rule.incomplete ? 'warn' : 'ok'}`}>
                    {rule.incomplete ? 'Incomplete' : 'Complete'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Evaluation Error</span>
                  <span className="detail-value">{rule.evaluationError}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">规则</div>
              <div className="conditions-table selfsubject-rules-table">
                <div className="conditions-row conditions-head">
                  <div>API Groups</div>
                  <div>Resources</div>
                  <div>Resource Names</div>
                  <div>Non-resource URLs</div>
                </div>
                <div className="conditions-row">
                  <div className="detail-value-truncate" title={rule.apiGroups}>{rule.apiGroups}</div>
                  <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                  <div className="detail-value-truncate" title={rule.resourceNames}>{rule.resourceNames}</div>
                  <div className="detail-value-truncate" title={rule.nonResourceURLs}>{rule.nonResourceURLs}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <GenericDetailModal
        resource={selectedIngress}
        loading={false}
        onClose={() => setSelectedIngress(null)}
        title="Ingress 详情"
        renderDetails={(ingress) => {
          const backendNames = [
            ...(ingress.rules ?? []).map((rule) => rule.serviceName),
            ingress.defaultBackendServiceName ?? '',
          ].filter((name) => name && name !== '-')
          const backendNameSet = new Set(backendNames)
          const relatedServices = services.filter((service) => (
            service.namespace === ingress.namespace && backendNameSet.has(service.name)
          ))
          const relatedEndpoints = endpoints.filter((endpoint) => (
            endpoint.namespace === ingress.namespace && backendNameSet.has(endpoint.name)
          ))
          const relatedPods = relatedServices.flatMap((service) => {
            const selectorEntries = Object.entries(service.selector ?? {})
            if (selectorEntries.length === 0) return []
            return pods.filter((pod) => (
              pod.namespace === service.namespace && labelsMatchSelector(pod.labels, service.selector)
            ))
          }).filter((pod, index, list) => (
            list.findIndex((item) => item.namespace === pod.namespace && item.name === pod.name) === index
          ))
          const relatedObjects = new Set([
            `Ingress/${ingress.name}`,
            ...relatedServices.map((service) => `Service/${service.name}`),
            ...relatedEndpoints.map((endpoint) => `Endpoints/${endpoint.name}`),
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.namespace === ingress.namespace && relatedObjects.has(event.object)
          ))
          const ingressClass = ingress.ingressClass
            ? ingressClasses.find((item) => item.name === ingress.ingressClass)
            : undefined

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{ingress.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{ingress.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">IngressClass</span>
                    <span className="detail-value">{ingress.ingressClass ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Controller</span>
                    <span className="detail-value">{ingressClass?.controller ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hosts</span>
                    <span className="detail-value">{ingress.hosts || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{ingress.address || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ports</span>
                    <span className="detail-value">{ingress.ports}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Default Backend</span>
                    <span className="detail-value">{ingress.defaultBackend ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{ingress.age}</span>
                  </div>
                </div>
              </div>

              {ingress.rules && ingress.rules.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Rules</div>
                  <div className="conditions-table ingress-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>Host</div>
                      <div>Path</div>
                      <div>PathType</div>
                      <div>Service</div>
                      <div>Port</div>
                    </div>
                    {ingress.rules.map((rule, index) => (
                      <div key={`${rule.host}-${rule.path}-${index}`} className="conditions-row">
                        <div className="detail-value-truncate">{rule.host}</div>
                        <div className="detail-value-truncate">{rule.path}</div>
                        <div>{rule.pathType}</div>
                        <div>{rule.serviceName}</div>
                        <div>{rule.servicePort}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ingress.tls && ingress.tls.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">TLS</div>
                  <div className="conditions-table ingress-tls-table">
                    <div className="conditions-row conditions-head">
                      <div>Hosts</div>
                      <div>Secret</div>
                    </div>
                    {ingress.tls.map((tls, index) => (
                      <div key={`${tls.secretName}-${index}`} className="conditions-row">
                        <div className="detail-value-truncate">{tls.hosts}</div>
                        <div>{tls.secretName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(relatedServices.length > 0 || relatedEndpoints.length > 0) && (
                <div className="detail-section">
                  <div className="detail-section-title">关联后端</div>
                  <div className="conditions-table ingress-backends-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>Ready</div>
                      <div>Not Ready</div>
                      <div>端口</div>
                    </div>
                    {relatedServices.map((service) => (
                      <div key={`service-${service.namespace}-${service.name}`} className="conditions-row">
                        <div>Service</div>
                        <div>{service.name}</div>
                        <div>-</div>
                        <div>-</div>
                        <div className="detail-value-truncate">{service.ports || '-'}</div>
                      </div>
                    ))}
                    {relatedEndpoints.map((endpoint) => (
                      <div key={`endpoint-${endpoint.namespace}-${endpoint.name}`} className="conditions-row">
                        <div>Endpoints</div>
                        <div>{endpoint.name}</div>
                        <div>{endpoint.ready}</div>
                        <div>{endpoint.notReady}</div>
                        <div className="detail-value-truncate">{endpoint.ports || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {ingress.labels && Object.keys(ingress.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(ingress.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedIngressClass}
        loading={false}
        onClose={() => setSelectedIngressClass(null)}
        title="IngressClass 详情"
        renderDetails={(ingressClass) => {
          const relatedIngresses = ingresses.filter((ingress) => ingress.ingressClass === ingressClass.name)
          const serviceKeys = new Set(relatedIngresses.flatMap((ingress) => [
            ...(ingress.rules ?? []).map((rule) => `${ingress.namespace}/${rule.serviceName}`),
            ingress.defaultBackendServiceName ? `${ingress.namespace}/${ingress.defaultBackendServiceName}` : '',
          ].filter((key) => key && !key.endsWith('/-'))))
          const relatedServices = services.filter((service) => serviceKeys.has(`${service.namespace}/${service.name}`))
          const relatedPods = pods.filter((pod) => relatedServices.some((service) => (
            pod.namespace === service.namespace && labelsMatchSelector(pod.labels, service.selector)
          )))
          const relatedObjects = new Set([
            `IngressClass/${ingressClass.name}`,
            ...relatedIngresses.map((ingress) => `Ingress/${ingress.name}`),
            ...relatedServices.map((service) => `Service/${service.name}`),
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.object === `IngressClass/${ingressClass.name}`
              || relatedIngresses.some((ingress) => event.namespace === ingress.namespace && event.object === `Ingress/${ingress.name}`)
              || relatedServices.some((service) => event.namespace === service.namespace && event.object === `Service/${service.name}`)
              || relatedPods.some((pod) => event.namespace === pod.namespace && event.object === `Pod/${pod.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{ingressClass.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Controller</span>
                    <span className="detail-value">{ingressClass.controller}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Default</span>
                    <span className={`detail-value status ${ingressClass.default ? 'ok' : ''}`}>
                      {ingressClass.default ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parameters</span>
                    <span className="detail-value">{ingressClass.parameters}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Ingresses</span>
                    <span className="detail-value">{relatedIngresses.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Services</span>
                    <span className="detail-value">{relatedServices.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">关联 Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{ingressClass.age}</span>
                  </div>
                </div>
              </div>

              {ingressClass.parameters !== '-' && (
                <div className="detail-section">
                  <div className="detail-section-title">Parameters</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">API Group</span>
                      <span className="detail-value">{ingressClass.parameterApiGroup ?? '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Kind</span>
                      <span className="detail-value">{ingressClass.parameterKind ?? '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Namespace</span>
                      <span className="detail-value">{ingressClass.parameterNamespace ?? '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{ingressClass.parameterName ?? '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Scope</span>
                      <span className="detail-value">{ingressClass.parameterScope ?? '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {relatedIngresses.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Ingresses</div>
                  <div className="conditions-table ingressclass-ingresses-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>Hosts</div>
                      <div>Address</div>
                      <div>存活</div>
                    </div>
                    {relatedIngresses.map((ingress) => (
                      <div key={`${ingress.namespace}-${ingress.name}`} className="conditions-row">
                        <div>{ingress.name}</div>
                        <div>{ingress.namespace}</div>
                        <div className="detail-value-truncate">{ingress.hosts}</div>
                        <div className="detail-value-truncate">{ingress.address}</div>
                        <div>{ingress.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedServices.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Services</div>
                  <div className="conditions-table ingressclass-services-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>类型</div>
                      <div>ClusterIP</div>
                      <div>端口</div>
                    </div>
                    {relatedServices.map((service) => (
                      <div key={`${service.namespace}-${service.name}`} className="conditions-row">
                        <div>{service.name}</div>
                        <div>{service.namespace}</div>
                        <div>{service.type}</div>
                        <div>{service.clusterIP}</div>
                        <div className="detail-value-truncate">{service.ports}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {ingressClass.labels && Object.keys(ingressClass.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(ingressClass.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedNetworkPolicy}
        loading={false}
        onClose={() => setSelectedNetworkPolicy(null)}
        title="NetworkPolicy 详情"
        renderDetails={(policy) => {
          const selectorEntries = Object.entries(policy.selector ?? {})
          const relatedPods = policy.podSelector === 'all'
            ? pods.filter((pod) => pod.namespace === policy.namespace)
            : selectorEntries.length > 0
              ? pods.filter((pod) => (
                pod.namespace === policy.namespace && labelsMatchSelector(pod.labels, policy.selector)
              ))
              : []
          const relatedObjects = new Set([
            `NetworkPolicy/${policy.name}`,
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.namespace === policy.namespace && relatedObjects.has(event.object)
          ))
          const ruleDetails = policy.ruleDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{policy.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{policy.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pod Selector</span>
                    <span className="detail-value">{policy.podSelector}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Policy Types</span>
                    <span className="detail-value">{policy.policyTypes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ingress Rules</span>
                    <span className="detail-value">{policy.ingressRules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Egress Rules</span>
                    <span className="detail-value">{policy.egressRules}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{policy.age}</span>
                  </div>
                </div>
              </div>

              {ruleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">规则</div>
                  <div className="conditions-table networkpolicy-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>方向</div>
                      <div>Peers</div>
                      <div>Ports</div>
                    </div>
                    {ruleDetails.map((rule, index) => (
                      <div key={`${rule.direction}-${index}`} className="conditions-row">
                        <div>{rule.direction}</div>
                        <div className="detail-value-truncate" title={rule.peers}>{rule.peers}</div>
                        <div className="detail-value-truncate" title={rule.ports}>{rule.ports}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderSelectorSection(policy.selector)}
              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {policy.labels && Object.keys(policy.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(policy.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedIPAddress}
        loading={false}
        onClose={() => setSelectedIPAddress(null)}
        title="IPAddress 详情"
        renderDetails={(address) => {
          const relatedService = address.parentResource === 'services' && address.parentName !== '-'
            ? services.find((service) => (
              service.name === address.parentName
                && (
                  address.parentNamespace === '-'
                    || service.namespace === address.parentNamespace
                )
            ))
            : undefined
          const relatedEvents = events.filter((event) => (
            event.object === `IPAddress/${address.name}`
              || (
                relatedService
                  && event.namespace === relatedService.namespace
                  && event.object === `Service/${relatedService.name}`
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{address.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parent Ref</span>
                    <span className="detail-value">{address.parentRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parent Group</span>
                    <span className="detail-value">{address.parentGroup}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parent Resource</span>
                    <span className="detail-value">{address.parentResource}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parent Namespace</span>
                    <span className="detail-value">{address.parentNamespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parent Name</span>
                    <span className="detail-value">{address.parentName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{address.age}</span>
                  </div>
                </div>
              </div>

              {relatedService && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Service</div>
                  <div className="conditions-table ipaddress-parent-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>类型</div>
                      <div>Cluster IP</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedService.name}</div>
                      <div>{relatedService.namespace}</div>
                      <div>{relatedService.type}</div>
                      <div>{relatedService.clusterIP}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {address.labels && Object.keys(address.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(address.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedServiceCIDR}
        loading={false}
        onClose={() => setSelectedServiceCIDR(null)}
        title="ServiceCIDR 详情"
        renderDetails={(cidr) => {
          const relatedEvents = events.filter((event) => event.object === `ServiceCIDR/${cidr.name}`)
          const conditions = cidr.conditions ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{cidr.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CIDRs</span>
                    <span className="detail-value">{cidr.cidrs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CIDR Count</span>
                    <span className="detail-value">{cidr.cidrCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ready</span>
                    <span className={`detail-value status ${cidr.ready === 'True' ? 'ok' : 'warn'}`}>{cidr.ready}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Conditions</span>
                    <span className="detail-value">{conditions.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{cidr.age}</span>
                  </div>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table servicecidr-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>Type</div>
                      <div>Status</div>
                      <div>Reason</div>
                      <div>Message</div>
                      <div>Transition</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={`${condition.type}-${condition.reason}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate" title={condition.message}>{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {cidr.labels && Object.keys(cidr.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(cidr.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedEndpointSlice}
        loading={false}
        onClose={() => setSelectedEndpointSlice(null)}
        title="EndpointSlice 详情"
        renderDetails={(slice) => {
          const endpointDetails = slice.endpointDetails ?? []
          const portDetails = slice.portDetails ?? []
          const relatedService = slice.service !== '-'
            ? services.find((service) => service.namespace === slice.namespace && service.name === slice.service)
            : undefined
          const targetPodNames = new Set(endpointDetails
            .filter((endpoint) => endpoint.targetKind === 'Pod' && endpoint.targetName !== '-')
            .map((endpoint) => endpoint.targetName))
          const endpointAddresses = new Set(endpointDetails.flatMap((endpoint) => (
            endpoint.addresses === '-' ? [] : endpoint.addresses.split(', ')
          )))
          const relatedPods = pods.filter((pod) => (
            pod.namespace === slice.namespace
              && (
                targetPodNames.has(pod.name)
                  || (pod.podIP ? endpointAddresses.has(pod.podIP) : false)
              )
          ))
          const relatedObjects = new Set([
            `EndpointSlice/${slice.name}`,
            ...(relatedService ? [`Service/${relatedService.name}`] : []),
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            event.namespace === slice.namespace && relatedObjects.has(event.object)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{slice.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{slice.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Service</span>
                    <span className="detail-value">{slice.service}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">地址类型</span>
                    <span className="detail-value">{slice.addressType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Endpoints</span>
                    <span className="detail-value">{slice.endpoints}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ready</span>
                    <span className="detail-value">{slice.ready}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Not Ready</span>
                    <span className="detail-value">{slice.notReady}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{slice.age}</span>
                  </div>
                </div>
              </div>

              {portDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">端口</div>
                  <div className="conditions-table endpoint-slice-ports-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>端口</div>
                      <div>协议</div>
                      <div>App Protocol</div>
                    </div>
                    {portDetails.map((port, index) => (
                      <div key={`${port.name}-${port.port}-${index}`} className="conditions-row">
                        <div>{port.name}</div>
                        <div>{port.port}</div>
                        <div>{port.protocol}</div>
                        <div className="detail-value-truncate">{port.appProtocol}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endpointDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">端点</div>
                  <div className="conditions-table endpoint-slice-endpoints-table">
                    <div className="conditions-row conditions-head">
                      <div>地址</div>
                      <div>Ready</div>
                      <div>Serving</div>
                      <div>Terminating</div>
                      <div>目标</div>
                      <div>Node</div>
                      <div>Zone</div>
                    </div>
                    {endpointDetails.map((endpoint, index) => (
                      <div key={`${endpoint.addresses}-${index}`} className="conditions-row">
                        <div className="detail-value-truncate" title={endpoint.addresses}>{endpoint.addresses}</div>
                        <div className={endpoint.ready ? 'status ok' : 'status warn'}>{endpoint.ready ? 'true' : 'false'}</div>
                        <div className={endpoint.serving ? 'status ok' : 'status warn'}>{endpoint.serving ? 'true' : 'false'}</div>
                        <div className={endpoint.terminating ? 'status warn' : 'status ok'}>{endpoint.terminating ? 'true' : 'false'}</div>
                        <div className="detail-value-truncate">
                          {endpoint.targetKind !== '-' ? `${endpoint.targetKind}/${endpoint.targetName}` : '-'}
                        </div>
                        <div className="detail-value-truncate">{endpoint.nodeName}</div>
                        <div className="detail-value-truncate">{endpoint.zone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedService && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Service</div>
                  <div className="conditions-table endpoint-slice-service-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>类型</div>
                      <div>ClusterIP</div>
                      <div>端口</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedService.name}</div>
                      <div>{relatedService.type}</div>
                      <div>{relatedService.clusterIP}</div>
                      <div className="detail-value-truncate">{relatedService.ports}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {slice.labels && Object.keys(slice.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(slice.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedAPIService}
        loading={false}
        onClose={() => setSelectedAPIService(null)}
        title="APIService 详情"
        renderDetails={(apiService) => {
          const serviceNamespace = apiService.serviceNamespace ?? ''
          const serviceName = apiService.serviceName ?? ''
          const relatedService = serviceNamespace && serviceName
            ? services.find((service) => service.namespace === serviceNamespace && service.name === serviceName)
            : undefined
          const relatedEndpoints = serviceNamespace && serviceName
            ? endpoints.filter((endpoint) => endpoint.namespace === serviceNamespace && endpoint.name === serviceName)
            : []
          const relatedEndpointSlices = serviceNamespace && serviceName
            ? endpointSlices.filter((slice) => slice.namespace === serviceNamespace && slice.service === serviceName)
            : []
          const targetPodNames = new Set(relatedEndpointSlices
            .flatMap((slice) => slice.endpointDetails ?? [])
            .filter((endpoint) => endpoint.targetKind === 'Pod' && endpoint.targetName !== '-')
            .map((endpoint) => endpoint.targetName))
          const endpointAddresses = new Set(relatedEndpointSlices
            .flatMap((slice) => slice.endpointDetails ?? [])
            .flatMap((endpoint) => endpoint.addresses === '-' ? [] : endpoint.addresses.split(', ')))
          const selectorPods = relatedService
            ? pods.filter((pod) => (
              pod.namespace === relatedService.namespace && labelsMatchSelector(pod.labels, relatedService.selector)
            ))
            : []
          const endpointPods = pods.filter((pod) => (
            pod.namespace === serviceNamespace
              && (
                targetPodNames.has(pod.name)
                  || (pod.podIP ? endpointAddresses.has(pod.podIP) : false)
              )
          ))
          const relatedPods = [...selectorPods, ...endpointPods].filter((pod, index, list) => (
            list.findIndex((item) => item.namespace === pod.namespace && item.name === pod.name) === index
          ))
          const relatedObjects = new Set([
            `APIService/${apiService.name}`,
            ...(relatedService ? [`Service/${relatedService.name}`] : []),
            ...relatedEndpoints.map((endpoint) => `Endpoints/${endpoint.name}`),
            ...relatedEndpointSlices.map((slice) => `EndpointSlice/${slice.name}`),
            ...relatedPods.map((pod) => `Pod/${pod.name}`),
          ])
          const relatedEvents = events.filter((event) => (
            relatedObjects.has(event.object)
              && (!event.namespace || event.namespace === serviceNamespace)
          ))
          const conditions = apiService.conditionDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{apiService.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Group</span>
                    <span className="detail-value">{apiService.group}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Version</span>
                    <span className="detail-value">{apiService.version}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Service</span>
                    <span className="detail-value">{apiService.service}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Available</span>
                    <span className={`detail-value status ${apiService.available === 'True' ? 'ok' : 'warn'}`}>
                      {apiService.available}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reason</span>
                    <span className="detail-value">{apiService.reason}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Group Priority</span>
                    <span className="detail-value">{apiService.groupPriority}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Version Priority</span>
                    <span className="detail-value">{apiService.versionPriority}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Skip TLS</span>
                    <span className="detail-value">{apiService.insecureSkipTLSVerify ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CA Bundle</span>
                    <span className="detail-value">{apiService.caBundleConfigured ? 'configured' : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{apiService.age}</span>
                  </div>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table apiservice-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={condition.type} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate" title={condition.message}>{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedService && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Service</div>
                  <div className="conditions-table apiservice-backend-table">
                    <div className="conditions-row conditions-head">
                      <div>命名空间</div>
                      <div>名称</div>
                      <div>类型</div>
                      <div>ClusterIP</div>
                      <div>端口</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedService.namespace}</div>
                      <div>{relatedService.name}</div>
                      <div>{relatedService.type}</div>
                      <div>{relatedService.clusterIP}</div>
                      <div className="detail-value-truncate">{relatedService.ports}</div>
                    </div>
                  </div>
                </div>
              )}

              {relatedEndpointSlices.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 EndpointSlices</div>
                  <div className="conditions-table apiservice-endpointslices-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Ready</div>
                      <div>Not Ready</div>
                      <div>地址</div>
                      <div>端口</div>
                    </div>
                    {relatedEndpointSlices.map((slice) => (
                      <div key={`${slice.namespace}-${slice.name}`} className="conditions-row">
                        <div>{slice.name}</div>
                        <div className={slice.ready > 0 ? 'status ok' : 'status warn'}>{slice.ready}</div>
                        <div className={slice.notReady > 0 ? 'status warn' : 'status ok'}>{slice.notReady}</div>
                        <div className="detail-value-truncate">{slice.addresses}</div>
                        <div className="detail-value-truncate">{slice.ports}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedEndpoints.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Endpoints</div>
                  <div className="conditions-table apiservice-endpoints-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Ready</div>
                      <div>Not Ready</div>
                      <div>地址</div>
                      <div>端口</div>
                    </div>
                    {relatedEndpoints.map((endpoint) => (
                      <div key={`${endpoint.namespace}-${endpoint.name}`} className="conditions-row">
                        <div>{endpoint.name}</div>
                        <div className={endpoint.ready > 0 ? 'status ok' : 'status warn'}>{endpoint.ready}</div>
                        <div className={endpoint.notReady > 0 ? 'status warn' : 'status ok'}>{endpoint.notReady}</div>
                        <div className="detail-value-truncate">{endpoint.addresses}</div>
                        <div className="detail-value-truncate">{endpoint.ports}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {apiService.labels && Object.keys(apiService.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(apiService.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedMutatingWebhookConfig}
        loading={false}
        onClose={() => setSelectedMutatingWebhookConfig(null)}
        title="MutatingWebhookConfiguration 详情"
        renderDetails={(config) => (
          renderAdmissionWebhookConfigurationDetails(config, 'MutatingWebhookConfiguration')
        )}
      />

      <GenericDetailModal
        resource={selectedValidatingWebhookConfig}
        loading={false}
        onClose={() => setSelectedValidatingWebhookConfig(null)}
        title="ValidatingWebhookConfiguration 详情"
        renderDetails={(config) => (
          renderAdmissionWebhookConfigurationDetails(config, 'ValidatingWebhookConfiguration')
        )}
      />

      <GenericDetailModal
        resource={selectedMutatingAdmissionPolicy}
        loading={false}
        onClose={() => setSelectedMutatingAdmissionPolicy(null)}
        title="MutatingAdmissionPolicy 详情"
        renderDetails={(policy) => {
          const mutationDetails = policy.mutationDetails ?? []
          const variableDetails = policy.variableDetails ?? []
          const matchConditionDetails = policy.matchConditionDetails ?? []
          const ruleDetails = policy.matchRuleDetails ?? []
          const relatedBindings = mutatingAdmissionPolicyBindings.filter((binding) => binding.policyName === policy.name)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{policy.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Failure Policy</span>
                    <span className="detail-value">{policy.failurePolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reinvocation</span>
                    <span className="detail-value">{policy.reinvocationPolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mutations</span>
                    <span className="detail-value">{policy.mutations}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Variables</span>
                    <span className="detail-value">{policy.variables}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Match Conditions</span>
                    <span className="detail-value">{policy.matchConditions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Param Kind</span>
                    <span className="detail-value">{policy.paramKind}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{policy.age}</span>
                  </div>
                </div>
              </div>

              {mutationDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Mutations</div>
                  <div className="conditions-table admission-mutating-mutations-table">
                    <div className="conditions-row conditions-head">
                      <div>#</div>
                      <div>Patch Type</div>
                      <div>Apply Config</div>
                      <div>JSON Patch</div>
                    </div>
                    {mutationDetails.map((mutation) => (
                      <div key={mutation.index} className="conditions-row">
                        <div>{mutation.index}</div>
                        <div>{mutation.patchType}</div>
                        <div>{mutation.applyConfigurationConfigured ? 'configured' : '-'}</div>
                        <div>{mutation.jsonPatchConfigured ? 'configured' : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variableDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Variables</div>
                  <div className="conditions-table admission-mutating-variables-table">
                    <div className="conditions-row conditions-head">
                      <div>Name</div>
                      <div>Expression</div>
                    </div>
                    {variableDetails.map((variable) => (
                      <div key={variable.name} className="conditions-row">
                        <div>{variable.name}</div>
                        <div>{variable.expressionConfigured ? 'configured' : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchConditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Match Conditions</div>
                  <div className="conditions-table admission-mutating-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>Name</div>
                      <div>Expression</div>
                    </div>
                    {matchConditionDetails.map((condition) => (
                      <div key={condition.name} className="conditions-row">
                        <div>{condition.name}</div>
                        <div>{condition.expressionConfigured ? 'configured' : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ruleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Match Constraints</div>
                  <div className="conditions-table admission-policy-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>方向</div>
                      <div>Operations</div>
                      <div>API Groups</div>
                      <div>Versions</div>
                      <div>Resources</div>
                      <div>Names</div>
                      <div>Scope</div>
                    </div>
                    {ruleDetails.map((rule, index) => (
                      <div key={`${rule.direction}-${index}`} className="conditions-row">
                        <div>{rule.direction}</div>
                        <div>{rule.operations}</div>
                        <div>{rule.apiGroups}</div>
                        <div>{rule.apiVersions}</div>
                        <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                        <div className="detail-value-truncate">{rule.resourceNames}</div>
                        <div>{rule.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedBindings.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Bindings</div>
                  <div className="conditions-table admission-mutating-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Param</div>
                      <div>Rules</div>
                      <div>存活</div>
                    </div>
                    {relatedBindings.map((binding) => (
                      <div key={binding.name} className="conditions-row">
                        <div>{binding.name}</div>
                        <div className="detail-value-truncate">{binding.paramRef}</div>
                        <div className="detail-value-truncate">{binding.matchResources}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {policy.labels && Object.keys(policy.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(policy.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedMutatingAdmissionPolicyBinding}
        loading={false}
        onClose={() => setSelectedMutatingAdmissionPolicyBinding(null)}
        title="MutatingAdmissionPolicyBinding 详情"
        renderDetails={(binding) => {
          const relatedPolicy = mutatingAdmissionPolicies.find((policy) => policy.name === binding.policyName)
          const paramRefDetails = binding.paramRefDetails
          const ruleDetails = binding.matchRuleDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{binding.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Policy</span>
                    <span className="detail-value">{binding.policyName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Param</span>
                    <span className="detail-value">{binding.paramRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{binding.age}</span>
                  </div>
                </div>
              </div>

              {relatedPolicy && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Policy</div>
                  <div className="conditions-table admission-mutating-binding-policy-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Failure</div>
                      <div>Reinvoke</div>
                      <div>Mutations</div>
                      <div>Variables</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedPolicy.name}</div>
                      <div>{relatedPolicy.failurePolicy}</div>
                      <div>{relatedPolicy.reinvocationPolicy}</div>
                      <div>{relatedPolicy.mutations}</div>
                      <div>{relatedPolicy.variables}</div>
                    </div>
                  </div>
                </div>
              )}

              {paramRefDetails && (
                <div className="detail-section">
                  <div className="detail-section-title">ParamRef</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{paramRefDetails.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Namespace</span>
                      <span className="detail-value">{paramRefDetails.namespace}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Selector</span>
                      <span className="detail-value">{paramRefDetails.selector}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Not Found</span>
                      <span className="detail-value">{paramRefDetails.parameterNotFoundAction}</span>
                    </div>
                  </div>
                </div>
              )}

              {ruleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Match Resources</div>
                  <div className="conditions-table admission-policy-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>方向</div>
                      <div>Operations</div>
                      <div>API Groups</div>
                      <div>Versions</div>
                      <div>Resources</div>
                      <div>Names</div>
                      <div>Scope</div>
                    </div>
                    {ruleDetails.map((rule, index) => (
                      <div key={`${rule.direction}-${index}`} className="conditions-row">
                        <div>{rule.direction}</div>
                        <div>{rule.operations}</div>
                        <div>{rule.apiGroups}</div>
                        <div>{rule.apiVersions}</div>
                        <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                        <div className="detail-value-truncate">{rule.resourceNames}</div>
                        <div>{rule.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {binding.labels && Object.keys(binding.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(binding.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedValidatingAdmissionPolicy}
        loading={false}
        onClose={() => setSelectedValidatingAdmissionPolicy(null)}
        title="ValidatingAdmissionPolicy 详情"
        renderDetails={(policy) => {
          const validationDetails = policy.validationDetails ?? []
          const auditAnnotationDetails = policy.auditAnnotationDetails ?? []
          const ruleDetails = policy.matchRuleDetails ?? []
          const conditionDetails = policy.conditionDetails ?? []
          const warningDetails = policy.warningDetails ?? []
          const relatedBindings = validatingAdmissionPolicyBindings.filter((binding) => binding.policyName === policy.name)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{policy.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Failure Policy</span>
                    <span className="detail-value">{policy.failurePolicy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Validations</span>
                    <span className="detail-value">{policy.validations}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Audit Annotations</span>
                    <span className="detail-value">{policy.auditAnnotations}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Param Kind</span>
                    <span className="detail-value">{policy.paramKind}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${policy.condition === 'Ready' ? 'ok' : policy.condition === '-' ? 'warn' : 'error'}`}>
                      {policy.condition}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Warnings</span>
                    <span className={`detail-value ${policy.warnings > 0 ? 'status warn' : ''}`}>{policy.warnings}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{policy.age}</span>
                  </div>
                </div>
              </div>

              {validationDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Validations</div>
                  <div className="conditions-table admission-policy-validations-table">
                    <div className="conditions-row conditions-head">
                      <div>#</div>
                      <div>Expression</div>
                      <div>Message</div>
                      <div>Reason</div>
                      <div>Message Expression</div>
                    </div>
                    {validationDetails.map((validation) => (
                      <div key={validation.index} className="conditions-row">
                        <div>{validation.index}</div>
                        <div>{validation.expressionConfigured ? 'configured' : '-'}</div>
                        <div className="detail-value-truncate" title={validation.message}>{validation.message}</div>
                        <div>{validation.reason}</div>
                        <div>{validation.messageExpressionConfigured ? 'configured' : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {auditAnnotationDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Audit Annotations</div>
                  <div className="conditions-table admission-policy-audit-table">
                    <div className="conditions-row conditions-head">
                      <div>Key</div>
                      <div>Value Expression</div>
                    </div>
                    {auditAnnotationDetails.map((annotation) => (
                      <div key={annotation.key} className="conditions-row">
                        <div>{annotation.key}</div>
                        <div>{annotation.valueExpressionConfigured ? 'configured' : '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ruleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Match Constraints</div>
                  <div className="conditions-table admission-policy-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>方向</div>
                      <div>Operations</div>
                      <div>API Groups</div>
                      <div>Versions</div>
                      <div>Resources</div>
                      <div>Names</div>
                      <div>Scope</div>
                    </div>
                    {ruleDetails.map((rule, index) => (
                      <div key={`${rule.direction}-${index}`} className="conditions-row">
                        <div>{rule.direction}</div>
                        <div>{rule.operations}</div>
                        <div>{rule.apiGroups}</div>
                        <div>{rule.apiVersions}</div>
                        <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                        <div className="detail-value-truncate">{rule.resourceNames}</div>
                        <div>{rule.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table admission-policy-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditionDetails.map((condition) => (
                      <div key={condition.type} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate" title={condition.message}>{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warningDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Type Warnings</div>
                  <div className="conditions-table admission-policy-warnings-table">
                    <div className="conditions-row conditions-head">
                      <div>Field</div>
                      <div>Warning</div>
                    </div>
                    {warningDetails.map((warning, index) => (
                      <div key={`${warning.fieldRef}-${index}`} className="conditions-row">
                        <div>{warning.fieldRef}</div>
                        <div className="detail-value-truncate" title={warning.warning}>{warning.warning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedBindings.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Bindings</div>
                  <div className="conditions-table admission-policy-bindings-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Actions</div>
                      <div>Param</div>
                      <div>Rules</div>
                      <div>存活</div>
                    </div>
                    {relatedBindings.map((binding) => (
                      <div key={binding.name} className="conditions-row">
                        <div>{binding.name}</div>
                        <div>{binding.validationActions}</div>
                        <div className="detail-value-truncate">{binding.paramRef}</div>
                        <div className="detail-value-truncate">{binding.matchResources}</div>
                        <div>{binding.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {policy.labels && Object.keys(policy.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(policy.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedValidatingAdmissionPolicyBinding}
        loading={false}
        onClose={() => setSelectedValidatingAdmissionPolicyBinding(null)}
        title="ValidatingAdmissionPolicyBinding 详情"
        renderDetails={(binding) => {
          const relatedPolicy = validatingAdmissionPolicies.find((policy) => policy.name === binding.policyName)
          const paramRefDetails = binding.paramRefDetails
          const ruleDetails = binding.matchRuleDetails ?? []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{binding.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Policy</span>
                    <span className="detail-value">{binding.policyName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Actions</span>
                    <span className="detail-value">{binding.validationActions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Param</span>
                    <span className="detail-value">{binding.paramRef}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{binding.age}</span>
                  </div>
                </div>
              </div>

              {relatedPolicy && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Policy</div>
                  <div className="conditions-table admission-binding-policy-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Failure</div>
                      <div>Validations</div>
                      <div>状态</div>
                      <div>Warnings</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedPolicy.name}</div>
                      <div>{relatedPolicy.failurePolicy}</div>
                      <div>{relatedPolicy.validations}</div>
                      <div className={`status ${relatedPolicy.condition === 'Ready' ? 'ok' : relatedPolicy.condition === '-' ? 'warn' : 'error'}`}>
                        {relatedPolicy.condition}
                      </div>
                      <div className={relatedPolicy.warnings > 0 ? 'status warn' : ''}>{relatedPolicy.warnings}</div>
                    </div>
                  </div>
                </div>
              )}

              {paramRefDetails && (
                <div className="detail-section">
                  <div className="detail-section-title">ParamRef</div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{paramRefDetails.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Namespace</span>
                      <span className="detail-value">{paramRefDetails.namespace}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Selector</span>
                      <span className="detail-value">{paramRefDetails.selector}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Not Found</span>
                      <span className="detail-value">{paramRefDetails.parameterNotFoundAction}</span>
                    </div>
                  </div>
                </div>
              )}

              {ruleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Match Resources</div>
                  <div className="conditions-table admission-policy-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>方向</div>
                      <div>Operations</div>
                      <div>API Groups</div>
                      <div>Versions</div>
                      <div>Resources</div>
                      <div>Names</div>
                      <div>Scope</div>
                    </div>
                    {ruleDetails.map((rule, index) => (
                      <div key={`${rule.direction}-${index}`} className="conditions-row">
                        <div>{rule.direction}</div>
                        <div>{rule.operations}</div>
                        <div>{rule.apiGroups}</div>
                        <div>{rule.apiVersions}</div>
                        <div className="detail-value-truncate" title={rule.resources}>{rule.resources}</div>
                        <div className="detail-value-truncate">{rule.resourceNames}</div>
                        <div>{rule.scope}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {binding.labels && Object.keys(binding.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(binding.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedFlowSchema}
        loading={false}
        onClose={() => setSelectedFlowSchema(null)}
        title="FlowSchema 详情"
        renderDetails={(schema) => {
          const subjectDetails = schema.subjectDetails ?? []
          const resourceRuleDetails = schema.resourceRuleDetails ?? []
          const nonResourceRuleDetails = schema.nonResourceRuleDetails ?? []
          const conditionDetails = schema.conditionDetails ?? []
          const relatedPriorityLevel = priorityLevelConfigurations.find((level) => level.name === schema.priorityLevel)
          const relatedEvents = events.filter((event) => event.object === `FlowSchema/${schema.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{schema.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PriorityLevel</span>
                    <span className="detail-value">{schema.priorityLevel}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Precedence</span>
                    <span className="detail-value">{schema.matchingPrecedence || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distinguisher</span>
                    <span className="detail-value">{schema.distinguisherMethod}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${schema.condition === 'Ready' ? 'ok' : schema.condition === '-' ? 'warn' : 'error'}`}>{schema.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{schema.age}</span>
                  </div>
                </div>
              </div>

              {relatedPriorityLevel && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 PriorityLevel</div>
                  <div className="conditions-table flow-priority-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Type</div>
                      <div>Shares</div>
                      <div>Response</div>
                      <div>Queues</div>
                      <div>状态</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedPriorityLevel.name}</div>
                      <div>{relatedPriorityLevel.type}</div>
                      <div>{relatedPriorityLevel.nominalConcurrencyShares}</div>
                      <div>{relatedPriorityLevel.limitResponse}</div>
                      <div>{relatedPriorityLevel.queues}</div>
                      <div className={`status ${relatedPriorityLevel.condition === '-' ? 'warn' : 'ok'}`}>{relatedPriorityLevel.condition}</div>
                    </div>
                  </div>
                </div>
              )}

              {subjectDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Subjects</div>
                  <div className="conditions-table flow-subjects-table">
                    <div className="conditions-row conditions-head">
                      <div>Rule</div>
                      <div>Kind</div>
                      <div>Name</div>
                      <div>Namespace</div>
                    </div>
                    {subjectDetails.map((subject, index) => (
                      <div key={`${subject.ruleIndex}-${subject.kind}-${subject.name}-${index}`} className="conditions-row">
                        <div>{subject.ruleIndex}</div>
                        <div>{subject.kind}</div>
                        <div className="detail-value-truncate">{subject.name}</div>
                        <div>{subject.namespace}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resourceRuleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Resource Rules</div>
                  <div className="conditions-table flow-resource-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>Rule</div>
                      <div>Subjects</div>
                      <div>Verbs</div>
                      <div>API Groups</div>
                      <div>Resources</div>
                      <div>Namespaces</div>
                      <div>Cluster</div>
                    </div>
                    {resourceRuleDetails.map((rule, index) => (
                      <div key={`${rule.ruleIndex}-${rule.resources}-${index}`} className="conditions-row">
                        <div>{rule.ruleIndex}</div>
                        <div className="detail-value-truncate">{rule.subjects}</div>
                        <div className="detail-value-truncate">{rule.verbs}</div>
                        <div>{rule.apiGroups}</div>
                        <div className="detail-value-truncate">{rule.resources}</div>
                        <div className="detail-value-truncate">{rule.namespaces}</div>
                        <div>{rule.clusterScope ? 'true' : 'false'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nonResourceRuleDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Non-resource Rules</div>
                  <div className="conditions-table flow-nonresource-rules-table">
                    <div className="conditions-row conditions-head">
                      <div>Rule</div>
                      <div>Subjects</div>
                      <div>Verbs</div>
                      <div>URLs</div>
                    </div>
                    {nonResourceRuleDetails.map((rule, index) => (
                      <div key={`${rule.ruleIndex}-${rule.nonResourceURLs}-${index}`} className="conditions-row">
                        <div>{rule.ruleIndex}</div>
                        <div className="detail-value-truncate">{rule.subjects}</div>
                        <div>{rule.verbs}</div>
                        <div className="detail-value-truncate">{rule.nonResourceURLs}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table flow-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {schema.labels && Object.keys(schema.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(schema.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPriorityLevel}
        loading={false}
        onClose={() => setSelectedPriorityLevel(null)}
        title="PriorityLevelConfiguration 详情"
        renderDetails={(level) => {
          const conditionDetails = level.conditionDetails ?? []
          const relatedFlowSchemas = flowSchemas.filter((schema) => schema.priorityLevel === level.name)
          const relatedEvents = events.filter((event) => event.object === `PriorityLevelConfiguration/${level.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{level.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{level.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${level.condition === '-' ? 'warn' : 'ok'}`}>{level.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{level.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">并发与队列</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Shares</span>
                    <span className="detail-value">{level.nominalConcurrencyShares}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Lendable %</span>
                    <span className="detail-value">{level.lendablePercent}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Borrowing %</span>
                    <span className="detail-value">{level.borrowingLimitPercent}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Limit Response</span>
                    <span className="detail-value">{level.limitResponse}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Queues</span>
                    <span className="detail-value">{level.queues}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hand Size</span>
                    <span className="detail-value">{level.handSize}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Queue Limit</span>
                    <span className="detail-value">{level.queueLengthLimit}</span>
                  </div>
                </div>
              </div>

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table flow-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedFlowSchemas.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 FlowSchemas</div>
                  <div className="conditions-table priority-flow-schemas-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Precedence</div>
                      <div>Distinguisher</div>
                      <div>Subjects</div>
                      <div>Rules</div>
                      <div>状态</div>
                    </div>
                    {relatedFlowSchemas.map((schema) => (
                      <div key={schema.name} className="conditions-row">
                        <div>{schema.name}</div>
                        <div>{schema.matchingPrecedence || '-'}</div>
                        <div>{schema.distinguisherMethod}</div>
                        <div className="detail-value-truncate">{schema.subjects}</div>
                        <div className="detail-value-truncate">{schema.rules}</div>
                        <div className={`status ${schema.condition === 'Ready' ? 'ok' : schema.condition === '-' ? 'warn' : 'error'}`}>{schema.condition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {level.labels && Object.keys(level.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(level.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedCertificateSigningRequest}
        loading={false}
        onClose={() => setSelectedCertificateSigningRequest(null)}
        title="CertificateSigningRequest 详情"
        renderDetails={(csr) => {
          const conditionDetails = csr.conditionDetails ?? []
          const relatedEvents = events.filter((event) => event.object === `CertificateSigningRequest/${csr.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{csr.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Signer</span>
                    <span className="detail-value">{csr.signerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Requestor</span>
                    <span className="detail-value">{csr.requestor}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Groups</span>
                    <span className="detail-value">{csr.groups}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">状态</span>
                    <span className={`detail-value status ${csr.condition === 'Approved' ? 'ok' : csr.condition === 'Denied' || csr.condition === 'Failed' ? 'error' : 'warn'}`}>{csr.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reason</span>
                    <span className="detail-value">{csr.reason}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Usages</span>
                    <span className="detail-value">{csr.usages}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expiration</span>
                    <span className="detail-value">{csr.expirationSeconds || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{csr.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Payload 元数据</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Request Configured</span>
                    <span className="detail-value">{csr.requestConfigured ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Certificate Issued</span>
                    <span className={`detail-value status ${csr.certificateConfigured ? 'ok' : 'warn'}`}>
                      {csr.certificateConfigured ? 'true' : 'false'}
                    </span>
                  </div>
                </div>
              </div>

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table csr-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                      <div>转换时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastUpdateTime}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {csr.labels && Object.keys(csr.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(csr.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedClusterTrustBundle}
        loading={false}
        onClose={() => setSelectedClusterTrustBundle(null)}
        title="ClusterTrustBundle 详情"
        renderDetails={(bundle) => {
          const relatedCSRs = bundle.signerName !== '-'
            ? certificateSigningRequests.filter((csr) => csr.signerName === bundle.signerName)
            : []
          const relatedEvents = events.filter((event) => event.object === `ClusterTrustBundle/${bundle.name}`)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{bundle.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Signer</span>
                    <span className="detail-value">{bundle.signerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Certificates</span>
                    <span className="detail-value">{bundle.certificateCount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bundle Bytes</span>
                    <span className="detail-value">{bundle.trustBundleBytes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Configured</span>
                    <span className={`detail-value status ${bundle.trustBundleConfigured ? 'ok' : 'warn'}`}>
                      {bundle.trustBundleConfigured ? 'true' : 'false'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">相关 CSR</span>
                    <span className="detail-value">{relatedCSRs.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{bundle.age}</span>
                  </div>
                </div>
              </div>

              {relatedCSRs.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">CertificateSigningRequests</div>
                  <div className="conditions-table clustertrustbundle-csrs-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Requestor</div>
                      <div>状态</div>
                      <div>Reason</div>
                      <div>存活</div>
                    </div>
                    {relatedCSRs.map((csr) => (
                      <div key={csr.name} className="conditions-row">
                        <div>{csr.name}</div>
                        <div className="detail-value-truncate">{csr.requestor}</div>
                        <div className={`status ${csr.condition === 'Approved' ? 'ok' : csr.condition === 'Denied' || csr.condition === 'Failed' ? 'error' : 'warn'}`}>{csr.condition}</div>
                        <div className="detail-value-truncate">{csr.reason}</div>
                        <div>{csr.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {bundle.labels && Object.keys(bundle.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(bundle.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedPodCertificateRequest}
        loading={false}
        onClose={() => setSelectedPodCertificateRequest(null)}
        title="PodCertificateRequest 详情"
        renderDetails={(request) => {
          const conditionDetails = request.conditionDetails ?? []
          const conditionClass = request.condition.includes('Issued') || request.certificateChainConfigured
            ? 'ok'
            : request.condition.includes('Denied') || request.condition.includes('Failed')
              ? 'error'
              : 'warn'
          const relatedPods = pods.filter((pod) => (
            pod.namespace === request.namespace && pod.name === request.podName
          ))
          const relatedNodes = nodes.filter((node) => node.name === request.nodeName)
          const relatedServiceAccounts = serviceAccounts.filter((account) => (
            account.namespace === request.namespace && account.name === request.serviceAccountName
          ))
          const relatedObjects = new Set([
            `PodCertificateRequest/${request.name}`,
            request.podName ? `Pod/${request.podName}` : '',
            request.nodeName ? `Node/${request.nodeName}` : '',
            request.serviceAccountName ? `ServiceAccount/${request.serviceAccountName}` : '',
          ].filter(Boolean))
          const relatedEvents = events.filter((event) => (
            relatedObjects.has(event.object)
              && (
                event.namespace === request.namespace
                  || event.namespace === '-'
                  || event.namespace === ''
                  || event.object === `Node/${request.nodeName}`
              )
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{request.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{request.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Signer</span>
                    <span className="detail-value">{request.signerName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Pod</span>
                    <span className="detail-value">{request.podName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Node</span>
                    <span className="detail-value">{request.nodeName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ServiceAccount</span>
                    <span className="detail-value">{request.serviceAccountName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Max Expiration</span>
                    <span className="detail-value">{request.maxExpirationSeconds || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Condition</span>
                    <span className={`detail-value status ${conditionClass}`}>{request.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Certificate</span>
                    <span className={`detail-value status ${request.certificateChainConfigured ? 'ok' : 'warn'}`}>
                      {request.certificateChainConfigured ? 'configured' : 'missing'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Not Before</span>
                    <span className="detail-value">{request.notBefore}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Not After</span>
                    <span className="detail-value">{request.notAfter}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Refresh At</span>
                    <span className="detail-value">{request.beginRefreshAt}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{request.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">关联资源</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Pods</span>
                    <span className="detail-value">{relatedPods.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nodes</span>
                    <span className="detail-value">{relatedNodes.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ServiceAccounts</span>
                    <span className="detail-value">{relatedServiceAccounts.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Events</span>
                    <span className="detail-value">{relatedEvents.length}</span>
                  </div>
                </div>
              </div>

              {conditionDetails.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table podcertificaterequest-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>转换时间</div>
                    </div>
                    {conditionDetails.map((condition, index) => (
                      <div key={`${condition.type}-${index}`} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedNodes.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Nodes</div>
                  <div className="conditions-table podcertificaterequest-nodes-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>角色</div>
                      <div>版本</div>
                      <div>存活</div>
                    </div>
                    {relatedNodes.map((node) => (
                      <div key={node.name} className="conditions-row">
                        <div>{node.name}</div>
                        <div className={`status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</div>
                        <div>{node.roles}</div>
                        <div>{node.version}</div>
                        <div>{node.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedServiceAccounts.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 ServiceAccounts</div>
                  <div className="conditions-table podcertificaterequest-serviceaccounts-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>Secrets</div>
                      <div>Auto Mount</div>
                      <div>存活</div>
                    </div>
                    {relatedServiceAccounts.map((account) => (
                      <div key={`${account.namespace}-${account.name}`} className="conditions-row">
                        <div>{account.name}</div>
                        <div>{account.namespace}</div>
                        <div>{account.secrets}</div>
                        <div>{account.automountServiceAccountToken === undefined ? '-' : account.automountServiceAccountToken ? 'true' : 'false'}</div>
                        <div>{account.age}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedEvents)}

              {request.labels && Object.keys(request.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(request.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedStorageVersion}
        loading={false}
        onClose={() => setSelectedStorageVersion(null)}
        title="StorageVersion 详情"
        renderDetails={(version) => {
          const servers = version.serverDetails ?? []
          const conditions = version.conditionDetails ?? []
          const relatedMigrations = storageVersionMigrations.filter((migration) => {
            const expectedName = migration.group !== '-'
              ? `${migration.resourceName}.${migration.group}`
              : migration.resourceName
            return expectedName === version.name
          })
          const relatedEvents = events.filter((event) => (
            event.object === `StorageVersion/${version.name}`
              || relatedMigrations.some((migration) => event.object === `StorageVersionMigration/${migration.name}`)
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{version.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Common Encoding</span>
                    <span className="detail-value">{version.commonEncodingVersion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">API Servers</span>
                    <span className="detail-value">{version.storageVersions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Condition</span>
                    <span className={`detail-value status ${version.condition.includes('=True') ? 'ok' : 'warn'}`}>
                      {version.condition}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">相关迁移</span>
                    <span className="detail-value">{relatedMigrations.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{version.age}</span>
                  </div>
                </div>
              </div>

              {servers.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">API Servers</div>
                  <div className="conditions-table storage-version-servers-table">
                    <div className="conditions-row conditions-head">
                      <div>API Server</div>
                      <div>Encoding</div>
                      <div>Decodable</div>
                      <div>Served</div>
                    </div>
                    {servers.map((server) => (
                      <div key={server.apiServerID} className="conditions-row">
                        <div className="detail-value-truncate">{server.apiServerID}</div>
                        <div>{server.encodingVersion}</div>
                        <div className="detail-value-truncate">{server.decodableVersions}</div>
                        <div className="detail-value-truncate">{server.servedVersions}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table storage-version-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={condition.type} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastTransitionTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedMigrations.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">StorageVersionMigrations</div>
                  <div className="conditions-table storage-version-migrations-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Resource</div>
                      <div>Version</div>
                      <div>Condition</div>
                      <div>ResourceVersion</div>
                    </div>
                    {relatedMigrations.map((migration) => (
                      <div key={migration.name} className="conditions-row">
                        <div>{migration.name}</div>
                        <div className="detail-value-truncate">{migration.resource}</div>
                        <div>{migration.version}</div>
                        <div className={`status ${migration.condition.startsWith('Succeeded=True') ? 'ok' : migration.condition.startsWith('Failed=True') ? 'error' : 'warn'}`}>
                          {migration.condition}
                        </div>
                        <div>{migration.resourceVersion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {version.labels && Object.keys(version.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(version.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedStorageVersionMigration}
        loading={false}
        onClose={() => setSelectedStorageVersionMigration(null)}
        title="StorageVersionMigration 详情"
        renderDetails={(migration) => {
          const expectedStorageVersionName = migration.group !== '-'
            ? `${migration.resourceName}.${migration.group}`
            : migration.resourceName
          const relatedStorageVersion = storageVersions.find((version) => version.name === expectedStorageVersionName)
          const conditions = migration.conditionDetails ?? []
          const relatedEvents = events.filter((event) => (
            event.object === `StorageVersionMigration/${migration.name}`
              || event.object === `StorageVersion/${expectedStorageVersionName}`
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{migration.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resource</span>
                    <span className="detail-value">{migration.resource}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Group</span>
                    <span className="detail-value">{migration.group}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Version</span>
                    <span className="detail-value">{migration.version}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ResourceVersion</span>
                    <span className="detail-value">{migration.resourceVersion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Condition</span>
                    <span className={`detail-value status ${migration.condition.startsWith('Succeeded=True') ? 'ok' : migration.condition.startsWith('Failed=True') ? 'error' : 'warn'}`}>
                      {migration.condition}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Continue Token</span>
                    <span className="detail-value">{migration.continueToken}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{migration.age}</span>
                  </div>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Conditions</div>
                  <div className="conditions-table storage-migration-conditions-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>状态</div>
                      <div>原因</div>
                      <div>消息</div>
                      <div>更新时间</div>
                    </div>
                    {conditions.map((condition) => (
                      <div key={condition.type} className="conditions-row">
                        <div>{condition.type}</div>
                        <div className={`status ${condition.status === 'True' ? 'ok' : 'warn'}`}>{condition.status}</div>
                        <div>{condition.reason}</div>
                        <div className="detail-value-truncate">{condition.message}</div>
                        <div>{condition.lastUpdateTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relatedStorageVersion && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 StorageVersion</div>
                  <div className="conditions-table storage-migration-version-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Common Encoding</div>
                      <div>API Servers</div>
                      <div>Condition</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedStorageVersion.name}</div>
                      <div>{relatedStorageVersion.commonEncodingVersion}</div>
                      <div>{relatedStorageVersion.storageVersions}</div>
                      <div className={`status ${relatedStorageVersion.condition.includes('=True') ? 'ok' : 'warn'}`}>
                        {relatedStorageVersion.condition}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedEvents(relatedEvents)}

              {migration.labels && Object.keys(migration.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(migration.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedConfigMap}
        loading={false}
        onClose={() => setSelectedConfigMap(null)}
        title="ConfigMap 详情"
        renderDetails={(configMap) => {
          const dataEntries = Object.entries(configMap.data ?? {}).sort(([left], [right]) => left.localeCompare(right))
          const binaryDataKeys = [...(configMap.binaryDataKeys ?? [])].sort()

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{configMap.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{configMap.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Data Keys</span>
                    <span className="detail-value">{dataEntries.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Binary Keys</span>
                    <span className="detail-value">{binaryDataKeys.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Immutable</span>
                    <span className="detail-value">{configMap.immutable ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{configMap.age}</span>
                  </div>
                </div>
              </div>

              {dataEntries.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Data</div>
                  <div className="conditions-table config-data-table">
                    <div className="conditions-row conditions-head">
                      <div>Key</div>
                      <div>Size</div>
                      <div>Preview</div>
                    </div>
                    {dataEntries.map(([key, value]) => (
                      <div key={key} className="conditions-row">
                        <div className="detail-value-truncate">{key}</div>
                        <div>{formatByteSize(textByteSize(value))}</div>
                        <pre className="config-value-preview">{configValuePreview(value)}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {binaryDataKeys.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Binary Data</div>
                  <div className="labels-list">
                    {binaryDataKeys.map((key) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {configMap.labels && Object.keys(configMap.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(configMap.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedSecret}
        loading={false}
        onClose={() => setSelectedSecret(null)}
        title="Secret 详情"
        renderDetails={(secret) => {
          const dataKeys = [...(secret.dataKeys ?? [])].sort()
          const totalSize = dataKeys.reduce((sum, key) => sum + (secret.dataSizes?.[key] ?? 0), 0)

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{secret.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{secret.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">类型</span>
                    <span className="detail-value">{secret.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Keys</span>
                    <span className="detail-value">{dataKeys.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Size</span>
                    <span className="detail-value">{formatByteSize(totalSize)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Immutable</span>
                    <span className="detail-value">{secret.immutable ? 'true' : 'false'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{secret.age}</span>
                  </div>
                </div>
              </div>

              {dataKeys.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Keys</div>
                  <div className="conditions-table secret-keys-table">
                    <div className="conditions-row conditions-head">
                      <div>Key</div>
                      <div>Size</div>
                    </div>
                    {dataKeys.map((key) => (
                      <div key={key} className="conditions-row">
                        <div className="detail-value-truncate">{key}</div>
                        <div>{formatByteSize(secret.dataSizes?.[key])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {secret.labels && Object.keys(secret.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(secret.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedService}
        loading={false}
        onClose={() => setSelectedService(null)}
        title="Service 详情"
        renderDetails={(service) => {
          const selectorEntries = Object.entries(service.selector ?? {})
          const serviceEndpoints = endpoints.filter((endpoint) => (
            endpoint.namespace === service.namespace && endpoint.name === service.name
          ))
          const servicePods = selectorEntries.length > 0
            ? pods.filter((pod) => (
              pod.namespace === service.namespace
                && selectorEntries.every(([key, value]) => pod.labels?.[key] === value)
            ))
            : []

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{service.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{service.namespace}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">类型</span>
                    <span className="detail-value">{service.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Cluster IP</span>
                    <span className="detail-value">{service.clusterIP || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">External IP</span>
                    <span className="detail-value">{service.externalIP ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">端口</span>
                    <span className="detail-value">{service.ports || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">存活时间</span>
                    <span className="detail-value">{service.age}</span>
                  </div>
                </div>
              </div>

              {selectorEntries.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Selector</div>
                  <div className="labels-list">
                    {selectorEntries.map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceEndpoints.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Endpoints</div>
                  <div className="conditions-table service-endpoints-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>Ready</div>
                      <div>Not Ready</div>
                      <div>地址</div>
                      <div>端口</div>
                    </div>
                    {serviceEndpoints.map((endpoint) => (
                      <div key={`${endpoint.namespace}-${endpoint.name}`} className="conditions-row">
                        <div>{endpoint.name}</div>
                        <div>{endpoint.ready}</div>
                        <div>{endpoint.notReady}</div>
                        <div className="detail-value-truncate">{endpoint.addresses || '-'}</div>
                        <div>{endpoint.ports || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {servicePods.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">后端 Pods</div>
                  <div className="pods-table">
                    <div className="conditions-row conditions-head">
                      <div>名称</div>
                      <div>状态</div>
                      <div>CPU</div>
                      <div>Memory</div>
                      <div>重启</div>
                      <div>节点</div>
                    </div>
                    {servicePods.map((pod) => (
                      <div key={`${pod.namespace}-${pod.name}`} className="conditions-row">
                        <div>{pod.name}</div>
                        <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                        <div>{pod.cpu ?? '-'}</div>
                        <div>{pod.memory ?? '-'}</div>
                        <div>{pod.restarts}</div>
                        <div>{pod.nodeName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {service.labels && Object.keys(service.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(service.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <DeploymentDetailModal
        deploy={selectedDeployment}
        loading={deploymentDetailLoading}
        pods={selectedDeployment ? getDeploymentRelatedPods(selectedDeployment) : []}
        replicaSets={selectedDeployment ? getDeploymentRelatedReplicaSets(selectedDeployment) : []}
        events={selectedDeployment ? getDeploymentRelatedEvents(selectedDeployment) : []}
        onViewPod={(pod) => {
          void handlePodClick(pod, selectedId)
        }}
        onViewPodLogs={handleOpenPodLogs}
        onScale={(deploy) => handleScaleWorkload('Deployment', deploy.namespace, deploy.name, deploy.replicas)}
        onRestart={(deploy) => handleRestartWorkload('Deployment', deploy.namespace, deploy.name)}
        onSetImage={(deploy) => handleSetWorkloadImage('Deployment', deploy.namespace, deploy.name)}
        onRolloutStatus={(deploy) => handleRolloutStatus('Deployment', deploy.namespace, deploy.name)}
        onRolloutHistory={(deploy) => handleRolloutHistory('Deployment', deploy.namespace, deploy.name)}
        onPauseResume={(deploy) => handlePauseResumeWorkload('Deployment', deploy.namespace, deploy.name, deploy.paused ?? false)}
        onRollback={(deploy) => handleRollbackWorkload('Deployment', deploy.namespace, deploy.name)}
        onDescribe={(deploy) => handleDescribeResource('Deployment', deploy.namespace, deploy.name)}
        onEditMetadata={(deploy) => handleMutateResourceMetadata('Deployment', deploy.namespace, deploy.name)}
        onEditYaml={(deploy) => {
          handleCloseDeploymentDetail()
          openYamlEditor('edit', 'Deployment', deploy.namespace, deploy.name)
        }}
        onDelete={(deploy) => handleDeleteResource('Deployment', deploy.namespace, deploy.name)}
        onClose={handleCloseDeploymentDetail}
      />

      <GenericDetailModal
        resource={selectedDaemonSet}
        loading={daemonSetDetailLoading}
        onClose={handleCloseDaemonSetDetail}
        title="DaemonSet 详情"
        renderDetails={(ds) => {
          const relatedPods = getWorkloadRelatedPods(ds)
          const relatedRevisions = getWorkloadControllerRevisions('DaemonSet', ds)
          const relatedEvents = getControllerRelatedEvents(
            'DaemonSet',
            ds,
            relatedPods,
            relatedRevisions.map((revision) => `ControllerRevision/${revision.name}`),
          )
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{ds.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{ds.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望节点数</span>
                  <span className="detail-value">{ds.desiredNumberScheduled}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">当前节点数</span>
                  <span className="detail-value">{ds.currentNumberScheduled}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪节点数</span>
                  <span className="detail-value">{ds.numberReady}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新节点数</span>
                  <span className="detail-value">{ds.updatedNumberScheduled ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">可用节点数</span>
                  <span className="detail-value">{ds.numberAvailable ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">不可用节点数</span>
                  <span className="detail-value">{ds.numberUnavailable ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{ds.age}</span>
                </div>
              </div>
            </div>
            {renderRolloutWorkloadActions('DaemonSet', ds, { closeBeforeYaml: handleCloseDaemonSetDetail })}
            {ds.labels && Object.keys(ds.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(ds.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(ds.selector)}
            {renderRelatedControllerRevisions(relatedRevisions)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedStatefulSet}
        loading={statefulSetDetailLoading}
        onClose={handleCloseStatefulSetDetail}
        title="StatefulSet 详情"
        renderDetails={(sts) => {
          const relatedPods = getWorkloadRelatedPods(sts)
          const relatedRevisions = getWorkloadControllerRevisions('StatefulSet', sts)
          const relatedEvents = getControllerRelatedEvents(
            'StatefulSet',
            sts,
            relatedPods,
            relatedRevisions.map((revision) => `ControllerRevision/${revision.name}`),
          )
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{sts.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{sts.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望副本</span>
                  <span className="detail-value">{sts.replicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪副本</span>
                  <span className="detail-value">{sts.readyReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">当前副本</span>
                  <span className="detail-value">{sts.currentReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新副本</span>
                  <span className="detail-value">{sts.updatedReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">服务名称</span>
                  <span className="detail-value">{sts.serviceName ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新策略</span>
                  <span className="detail-value">{sts.updateStrategy ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{sts.age}</span>
                </div>
              </div>
            </div>
            {renderRolloutWorkloadActions('StatefulSet', sts, { scaleKind: 'StatefulSet', closeBeforeYaml: handleCloseStatefulSetDetail })}
            {sts.labels && Object.keys(sts.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(sts.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(sts.selector)}
            {renderRelatedControllerRevisions(relatedRevisions)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedReplicaSet}
        loading={replicaSetDetailLoading}
        onClose={handleCloseReplicaSetDetail}
        title="ReplicaSet 详情"
        renderDetails={(rs) => {
          const relatedPods = getWorkloadRelatedPods(rs)
          const relatedEvents = getControllerRelatedEvents('ReplicaSet', rs, relatedPods)
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{rs.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{rs.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望副本</span>
                  <span className="detail-value">{rs.replicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪副本</span>
                  <span className="detail-value">{rs.readyReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">完全标签副本</span>
                  <span className="detail-value">{rs.fullyLabeledReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">可用副本</span>
                  <span className="detail-value">{rs.availableReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Owner</span>
                  <span className="detail-value">{rs.owner ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{rs.age}</span>
                </div>
              </div>
            </div>
            <div className="detail-section workload-actions-section">
              <div className="detail-section-header">
                <div className="detail-section-title">ReplicaSet 操作</div>
                <div className="workload-action-bar">
                  <button
                    className="action-btn scale-btn"
                    onClick={() => handleScaleWorkload('ReplicaSet', rs.namespace, rs.name, rs.replicas)}
                  >
                    Scale
                  </button>
                  <button className="action-btn describe-btn" onClick={() => handleDescribeResource('ReplicaSet', rs.namespace, rs.name)}>
                    Describe
                  </button>
                  <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('ReplicaSet', rs.namespace, rs.name)}>
                    Meta
                  </button>
                  <button
                    className="action-btn yaml-btn"
                    onClick={() => {
                      handleCloseReplicaSetDetail()
                      openYamlEditor('edit', 'ReplicaSet', rs.namespace, rs.name)
                    }}
                  >
                    YAML
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteResource('ReplicaSet', rs.namespace, rs.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            {rs.labels && Object.keys(rs.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(rs.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(rs.selector)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedReplicationController}
        loading={replicationControllerDetailLoading}
        onClose={handleCloseReplicationControllerDetail}
        title="ReplicationController 详情"
        renderDetails={(rc) => {
          const relatedPods = getWorkloadRelatedPods(rc)
          const relatedEvents = getControllerRelatedEvents('ReplicationController', rc, relatedPods)
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{rc.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{rc.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望副本</span>
                  <span className="detail-value">{rc.replicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪副本</span>
                  <span className="detail-value">{rc.readyReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">可用副本</span>
                  <span className="detail-value">{rc.availableReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">完全标签副本</span>
                  <span className="detail-value">{rc.fullyLabeledReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{rc.age}</span>
                </div>
              </div>
            </div>
            <div className="detail-section workload-actions-section">
              <div className="detail-section-header">
                <div className="detail-section-title">ReplicationController 操作</div>
                <div className="workload-action-bar">
                  <button
                    className="action-btn scale-btn"
                    onClick={() => handleScaleWorkload('ReplicationController', rc.namespace, rc.name, rc.replicas)}
                  >
                    Scale
                  </button>
                  <button className="action-btn describe-btn" onClick={() => handleDescribeResource('ReplicationController', rc.namespace, rc.name)}>
                    Describe
                  </button>
                  <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('ReplicationController', rc.namespace, rc.name)}>
                    Meta
                  </button>
                  <button
                    className="action-btn yaml-btn"
                    onClick={() => {
                      handleCloseReplicationControllerDetail()
                      openYamlEditor('edit', 'ReplicationController', rc.namespace, rc.name)
                    }}
                  >
                    YAML
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteResource('ReplicationController', rc.namespace, rc.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            {rc.labels && Object.keys(rc.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(rc.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(rc.selector)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedJob}
        loading={jobDetailLoading}
        onClose={handleCloseJobDetail}
        title="Job 详情"
        renderDetails={(job) => {
          const relatedPods = getWorkloadRelatedPods(job)
          const relatedEvents = getControllerRelatedEvents('Job', job, relatedPods)
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{job.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{job.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">完成数</span>
                  <span className="detail-value">{job.completions}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">成功</span>
                  <span className="detail-value">{job.succeeded}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">活跃</span>
                  <span className="detail-value">{job.active}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">失败</span>
                  <span className={`detail-value status ${job.failed > 0 ? 'warn' : 'ok'}`}>{job.failed}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">暂停</span>
                  <span className="detail-value">{job.suspend ? '是' : '否'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">并行度</span>
                  <span className="detail-value">{job.parallelism ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">重试限制</span>
                  <span className="detail-value">{job.backoffLimit ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Owner</span>
                  <span className="detail-value">{job.owner ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">开始时间</span>
                  <span className="detail-value">{job.startTime ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">完成时间</span>
                  <span className="detail-value">{job.completionTime ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">运行时长</span>
                  <span className="detail-value">{job.duration ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{job.age}</span>
                </div>
              </div>
            </div>
            <div className="detail-section workload-actions-section">
              <div className="detail-section-header">
                <div className="detail-section-title">Job 操作</div>
                <div className="workload-action-bar">
                  <button
                    className="action-btn scale-btn"
                    onClick={() => handleUpdateJobSuspension('Job', job.namespace, job.name, !job.suspend)}
                  >
                    {job.suspend ? 'Resume' : 'Suspend'}
                  </button>
                  <button className="action-btn describe-btn" onClick={() => handleDescribeResource('Job', job.namespace, job.name)}>
                    Describe
                  </button>
                  <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('Job', job.namespace, job.name)}>
                    Meta
                  </button>
                  <button
                    className="action-btn yaml-btn"
                    onClick={() => {
                      handleCloseJobDetail()
                      openYamlEditor('edit', 'Job', job.namespace, job.name)
                    }}
                  >
                    YAML
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteResource('Job', job.namespace, job.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            {job.labels && Object.keys(job.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(job.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(job.selector)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedCronJob}
        loading={cronJobDetailLoading}
        onClose={handleCloseCronJobDetail}
        title="CronJob 详情"
        renderDetails={(cj) => {
          const relatedJobs = getCronJobRelatedJobs(cj)
          const relatedPods = getCronJobRelatedPods(cj, relatedJobs)
          const relatedEvents = getCronJobRelatedEvents(cj, relatedJobs, relatedPods)
          return (
            <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{cj.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{cj.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">调度</span>
                  <span className="detail-value">{cj.schedule}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">暂停</span>
                  <span className="detail-value">{cj.suspend ? '是' : '否'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">活跃任务</span>
                  <span className="detail-value">{cj.active}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">上次调度</span>
                  <span className="detail-value">{cj.lastSchedule}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">并发策略</span>
                  <span className="detail-value">{cj.concurrencyPolicy ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">成功历史限制</span>
                  <span className="detail-value">{cj.successfulJobsHistoryLimit ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">失败历史限制</span>
                  <span className="detail-value">{cj.failedJobsHistoryLimit ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">启动截止秒数</span>
                  <span className="detail-value">{cj.startingDeadlineSeconds ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{cj.age}</span>
                </div>
              </div>
            </div>
            <div className="detail-section workload-actions-section">
              <div className="detail-section-header">
                <div className="detail-section-title">CronJob 操作</div>
                <div className="workload-action-bar">
                  <button
                    className="action-btn scale-btn"
                    onClick={() => handleTriggerCronJob(cj.namespace, cj.name)}
                  >
                    Trigger
                  </button>
                  <button
                    className="action-btn scale-btn"
                    onClick={() => handleUpdateJobSuspension('CronJob', cj.namespace, cj.name, !cj.suspend)}
                  >
                    {cj.suspend ? 'Resume' : 'Suspend'}
                  </button>
                  <button className="action-btn describe-btn" onClick={() => handleDescribeResource('CronJob', cj.namespace, cj.name)}>
                    Describe
                  </button>
                  <button className="action-btn metadata-btn" onClick={() => handleMutateResourceMetadata('CronJob', cj.namespace, cj.name)}>
                    Meta
                  </button>
                  <button
                    className="action-btn yaml-btn"
                    onClick={() => {
                      handleCloseCronJobDetail()
                      openYamlEditor('edit', 'CronJob', cj.namespace, cj.name)
                    }}
                  >
                    YAML
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteResource('CronJob', cj.namespace, cj.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            {cj.labels && Object.keys(cj.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(cj.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderSelectorSection(cj.selector)}
            {renderRelatedJobs(relatedJobs)}
            {renderRelatedPods(relatedPods)}
            {renderRelatedEvents(relatedEvents)}
            </div>
          )
        }}
      />

      <GenericDetailModal
        resource={selectedEvent}
        loading={false}
        onClose={() => setSelectedEvent(null)}
        title="Event 详情"
        renderDetails={(event) => {
          const objectKind = event.objectKind ?? event.object.split('/')[0] ?? ''
          const objectName = event.objectName ?? event.object.split('/')[1] ?? ''
          const objectNamespace = event.objectNamespace ?? event.namespace
          const workloadCandidates = [
            ...deployments.map((workload) => ({ kind: 'Deployment', workload })),
            ...daemonSets.map((workload) => ({ kind: 'DaemonSet', workload })),
            ...statefulSets.map((workload) => ({ kind: 'StatefulSet', workload })),
            ...replicaSets.map((workload) => ({ kind: 'ReplicaSet', workload })),
            ...replicationControllers.map((workload) => ({ kind: 'ReplicationController', workload })),
            ...jobs.map((workload) => ({ kind: 'Job', workload })),
          ]
          const relatedWorkload = workloadCandidates.find((item) => (
            item.kind === objectKind
              && item.workload.namespace === objectNamespace
              && item.workload.name === objectName
          ))
          const relatedPods = objectKind === 'Pod'
            ? pods.filter((pod) => pod.namespace === objectNamespace && pod.name === objectName)
            : relatedWorkload
              ? getWorkloadRelatedPods(relatedWorkload.workload)
              : []
          const relatedObjectEvents = events.filter((item) => (
            item !== event
              && item.namespace === event.namespace
              && item.object === event.object
          ))

          return (
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-section-title">基本信息</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">名称</span>
                    <span className="detail-value">{event.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">命名空间</span>
                    <span className="detail-value">{event.namespace || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">类型</span>
                    <span className={`detail-value status ${event.type === 'Warning' ? 'warn' : 'ok'}`}>{event.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">原因</span>
                    <span className="detail-value">{event.reason || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">次数</span>
                    <span className="detail-value">{event.count}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">动作</span>
                    <span className="detail-value">{event.action ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">来源</span>
                    <span className="detail-value">{event.sourceComponent ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">来源节点</span>
                    <span className="detail-value">{event.sourceHost ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reporting</span>
                    <span className="detail-value">{event.reportingComponent ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">实例</span>
                    <span className="detail-value">{event.reportingInstance ?? '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">时间</span>
                    <span className="detail-value">{event.age}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">消息</div>
                <div className="event-message-box">{event.message || '-'}</div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">时间线</div>
                <div className="conditions-table event-timestamps-table">
                  <div className="conditions-row conditions-head">
                    <div>首次记录</div>
                    <div>最近记录</div>
                    <div>Event Time</div>
                  </div>
                  <div className="conditions-row">
                    <div>{event.firstTimestamp ?? '-'}</div>
                    <div>{event.lastTimestamp ?? '-'}</div>
                    <div>{event.eventTime ?? '-'}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Involved Object</div>
                <div className="conditions-table event-object-table">
                  <div className="conditions-row conditions-head">
                    <div>Kind</div>
                    <div>Name</div>
                    <div>Namespace</div>
                    <div>API Version</div>
                    <div>Field Path</div>
                    <div>UID</div>
                  </div>
                  <div className="conditions-row">
                    <div>{objectKind || '-'}</div>
                    <div>{objectName || '-'}</div>
                    <div>{objectNamespace || '-'}</div>
                    <div>{event.objectApiVersion ?? '-'}</div>
                    <div className="detail-value-truncate" title={event.objectFieldPath}>{event.objectFieldPath ?? '-'}</div>
                    <div className="detail-value-truncate" title={event.objectUid}>{event.objectUid ?? '-'}</div>
                  </div>
                </div>
              </div>

              {event.relatedObject && (
                <div className="detail-section">
                  <div className="detail-section-title">Related Object</div>
                  <div className="conditions-table event-related-object-table">
                    <div className="conditions-row conditions-head">
                      <div>Kind</div>
                      <div>Name</div>
                      <div>Namespace</div>
                      <div>API Version</div>
                      <div>Field Path</div>
                    </div>
                    <div className="conditions-row">
                      <div>{event.relatedObjectKind ?? '-'}</div>
                      <div>{event.relatedObjectName ?? '-'}</div>
                      <div>{event.relatedObjectNamespace ?? '-'}</div>
                      <div>{event.relatedObjectApiVersion ?? '-'}</div>
                      <div className="detail-value-truncate" title={event.relatedObjectFieldPath}>{event.relatedObjectFieldPath ?? '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {relatedWorkload && (
                <div className="detail-section">
                  <div className="detail-section-title">关联 Workload</div>
                  <div className="conditions-table event-workload-table">
                    <div className="conditions-row conditions-head">
                      <div>类型</div>
                      <div>名称</div>
                      <div>命名空间</div>
                      <div>Pods</div>
                    </div>
                    <div className="conditions-row">
                      <div>{relatedWorkload.kind}</div>
                      <div>{relatedWorkload.workload.name}</div>
                      <div>{relatedWorkload.workload.namespace}</div>
                      <div>{relatedPods.length}</div>
                    </div>
                  </div>
                </div>
              )}

              {renderRelatedPods(relatedPods)}
              {renderRelatedEvents(relatedObjectEvents)}

              {event.labels && Object.keys(event.labels).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">标签</div>
                  <div className="labels-list">
                    {Object.entries(event.labels).map(([key, value]) => (
                      <div key={key} className="label-item">
                        <span className="label-key">{key}</span>
                        <span className="label-eq">=</span>
                        <span className="label-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }}
      />

      <CreateResourceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        contextId={selectedId}
        selectedNamespaces={selectedNamespaces}
        availableNamespaces={namespaces.map((namespace) => namespace.name)}
        onSuccess={() => {
          void refreshSelectedContext()
        }}
      />

      {yamlEditorResource && (
        <YamlEditorModal
          isOpen={isYamlEditorOpen}
          onClose={() => setIsYamlEditorOpen(false)}
          contextId={selectedId}
          kind={yamlEditorResource.kind}
          namespace={yamlEditorResource.namespace}
          name={yamlEditorResource.name}
          onSuccess={() => {
            void refreshSelectedContext()
          }}
          mode={yamlEditorMode}
        />
      )}

      {showTerminal && terminalAvailable && (
        <div className="terminal-panel">
          <div className="terminal-header">
            <span>Terminal</span>
            <button className="terminal-close" onClick={() => setShowTerminal(false)}>×</button>
          </div>
          <div className="terminal-container" ref={terminalRef} />
        </div>
      )}
    </div>
  )
}

export default App
