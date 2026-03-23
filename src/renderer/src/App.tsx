import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import {
  AddContextsResult,
  ContextRecord,
  CronJobInfo,
  DaemonSetInfo,
  DeploymentInfo,
  JobInfo,
  NamespaceInfo,
  NodeInfo,
  PodInfo,
  ReplicaSetInfo,
  ResourceType,
  StatefulSetInfo,
  ContextPrefs,
  ContextGroup
} from '../../shared/types'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type SortDirection = 'asc' | 'desc'

const formatSource = (source: string) => (source === 'default' ? '默认配置' : source)

const RESOURCE_TYPES: { key: ResourceType; label: string }[] = [
  { key: 'nodes', label: 'Node' },
  { key: 'pods', label: 'Pod' },
  { key: 'deployments', label: 'Deployment' },
  { key: 'daemonsets', label: 'DaemonSet' },
  { key: 'statefulsets', label: 'StatefulSet' },
  { key: 'replicasets', label: 'ReplicaSet' },
  { key: 'jobs', label: 'Job' },
  { key: 'cronjobs', label: 'CronJob' }
]

interface NodeDetailModalProps {
  node: NodeInfo | null
  loading: boolean
  onClose: () => void
}

interface ResourceDetailModalProps<T> {
  resource: T | null
  loading: boolean
  onClose: () => void
  type: ResourceType
}

const NodeDetailModal = ({ node, loading, onClose }: NodeDetailModalProps) => {
  if (!node && !loading) return null

  const getInternalIP = () => {
    return node?.addresses?.find(a => a.type === 'InternalIP')?.address ?? '-'
  }

  const getExternalIP = () => {
    return node?.addresses?.find(a => a.type === 'ExternalIP')?.address ?? '-'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>节点详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : node && (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{node.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">角色</span>
                  <span className="detail-value">{node.roles}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">版本</span>
                  <span className="detail-value">{node.version}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{node.age}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">不可调度</span>
                  <span className="detail-value">{node.unschedulable ? '是' : '否'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">网络信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">内部IP</span>
                  <span className="detail-value">{getInternalIP()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">外部IP</span>
                  <span className="detail-value">{getExternalIP()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod CIDR</span>
                  <span className="detail-value">{node.podCIDR ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Provider ID</span>
                  <span className="detail-value detail-value-truncate">{node.providerID ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">系统信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">操作系统</span>
                  <span className="detail-value">{node.os ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">架构</span>
                  <span className="detail-value">{node.architecture ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">内核版本</span>
                  <span className="detail-value">{node.kernelVersion ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">容器运行时</span>
                  <span className="detail-value">{node.containerRuntime ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">资源容量</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">CPU</span>
                  <span className="detail-value">{node.capacity?.cpu ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">内存</span>
                  <span className="detail-value">{node.capacity?.memory ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod 数量</span>
                  <span className="detail-value">{node.capacity?.pods ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">临时存储</span>
                  <span className="detail-value">{node.capacity?.ephemeralStorage ?? '-'}</span>
                </div>
              </div>
            </div>

            {node.taints && node.taints.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">污点</div>
                <div className="taint-list">
                  {node.taints.map((taint, idx) => (
                    <div key={idx} className="taint-item">
                      <span className="taint-key">{taint.key}</span>
                      {taint.value && <span className="taint-value">={taint.value}</span>}
                      <span className="taint-effect">:{taint.effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.conditions && node.conditions.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">条件状态</div>
                <div className="conditions-table">
                  <div className="conditions-row conditions-head">
                    <div>类型</div>
                    <div>状态</div>
                    <div>原因</div>
                  </div>
                  {node.conditions.map((cond, idx) => (
                    <div key={idx} className="conditions-row">
                      <div>{cond.type}</div>
                      <div className={cond.status === 'True' ? 'status ok' : 'status warn'}>{cond.status}</div>
                      <div>{cond.reason ?? '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {node.labels && Object.keys(node.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(node.labels).map(([key, value]) => (
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
        )}
      </div>
    </div>
  )
}

const PodDetailModal = ({ pod, loading, onClose }: { pod: PodInfo | null; loading: boolean; onClose: () => void }) => {
  if (!pod && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pod 详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : pod && (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{pod.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{pod.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态</span>
                  <span className={`detail-value status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">节点</span>
                  <span className="detail-value">{pod.nodeName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pod IP</span>
                  <span className="detail-value">{pod.podIP ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Host IP</span>
                  <span className="detail-value">{pod.hostIP ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">重启次数</span>
                  <span className="detail-value">{pod.restarts}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{pod.age}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">服务账户</span>
                  <span className="detail-value">{pod.serviceAccount ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">优先级</span>
                  <span className="detail-value">{pod.priority ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">QoS</span>
                  <span className="detail-value">{pod.qosClass ?? '-'}</span>
                </div>
              </div>
            </div>

            {pod.containers && pod.containers.length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">容器</div>
                <div className="conditions-table">
                  <div className="conditions-row conditions-head">
                    <div>名称</div>
                    <div>镜像</div>
                    <div>状态</div>
                    <div>重启</div>
                    <div>就绪</div>
                  </div>
                  {pod.containers.map((c, idx) => (
                    <div key={idx} className="conditions-row">
                      <div>{c.name}</div>
                      <div className="detail-value-truncate" style={{maxWidth: '150px'}}>{c.image}</div>
                      <div className={`status ${c.ready ? 'ok' : 'warn'}`}>{c.state}</div>
                      <div>{c.restartCount}</div>
                      <div>{c.ready ? '是' : '否'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pod.labels && Object.keys(pod.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(pod.labels).map(([key, value]) => (
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
        )}
      </div>
    </div>
  )
}

const DeploymentDetailModal = ({ deploy, loading, onClose }: { deploy: DeploymentInfo | null; loading: boolean; onClose: () => void }) => {
  if (!deploy && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Deployment 详情</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : deploy && (
          <div className="modal-body">
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">名称</span>
                  <span className="detail-value">{deploy.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">命名空间</span>
                  <span className="detail-value">{deploy.namespace}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">期望副本</span>
                  <span className="detail-value">{deploy.replicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">就绪副本</span>
                  <span className="detail-value">{deploy.readyReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">可用副本</span>
                  <span className="detail-value">{deploy.availableReplicas}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新副本</span>
                  <span className="detail-value">{deploy.updatedReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">不可用副本</span>
                  <span className="detail-value">{deploy.unavailableReplicas ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">策略</span>
                  <span className="detail-value">{deploy.strategy ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{deploy.age}</span>
                </div>
              </div>
            </div>

            {deploy.labels && Object.keys(deploy.labels).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">标签</div>
                <div className="labels-list">
                  {Object.entries(deploy.labels).map(([key, value]) => (
                    <div key={key} className="label-item">
                      <span className="label-key">{key}</span>
                      <span className="label-eq">=</span>
                      <span className="label-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deploy.selector && Object.keys(deploy.selector).length > 0 && (
              <div className="detail-section">
                <div className="detail-section-title">选择器</div>
                <div className="labels-list">
                  {Object.entries(deploy.selector).map(([key, value]) => (
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
        )}
      </div>
    </div>
  )
}

const GenericDetailModal = <T extends DeploymentInfo | DaemonSetInfo | StatefulSetInfo | ReplicaSetInfo | JobInfo | CronJobInfo>({
  resource,
  loading,
  onClose,
  title,
  renderDetails
}: {
  resource: T | null
  loading: boolean
  onClose: () => void
  title: string
  renderDetails: (res: T) => React.ReactNode
}) => {
  if (!resource && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {loading ? (
          <div className="modal-loading">加载中...</div>
        ) : resource && renderDetails(resource)}
      </div>
    </div>
  )
}

interface ClusterCardProps {
  context: ContextRecord
  isActive: boolean
  nodeCount: number
  podCount: number
  status: LoadState
  onClick: () => void
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
          <div className="cluster-card-subtitle">{context.cluster}</div>
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

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="empty-state">
    <div className="empty-state-icon">☸️</div>
    <div className="empty-state-title">暂无集群配置</div>
    <div className="empty-state-desc">点击添加按钮导入 kubeconfig 文件开始使用</div>
    <button className="empty-state-btn" onClick={onAdd}>
      添加集群
    </button>
  </div>
)

const SortIcon = ({ direction }: { direction?: SortDirection }) => (
  <span className="sort-icon">
    {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
  </span>
)

const App = () => {
  const [contexts, setContexts] = useState<ContextRecord[]>([])
  const [contextPrefs, setContextPrefs] = useState<ContextPrefs | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [namespaces, setNamespaces] = useState<NamespaceInfo[]>([])
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>('pods')
  const [nodes, setNodes] = useState<NodeInfo[]>([])
  const [pods, setPods] = useState<PodInfo[]>([])
  const [deployments, setDeployments] = useState<DeploymentInfo[]>([])
  const [daemonSets, setDaemonSets] = useState<DaemonSetInfo[]>([])
  const [statefulSets, setStatefulSets] = useState<StatefulSetInfo[]>([])
  const [replicaSets, setReplicaSets] = useState<ReplicaSetInfo[]>([])
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [cronJobs, setCronJobs] = useState<CronJobInfo[]>([])
  const [status, setStatus] = useState<LoadState>('idle')
  const [error, setError] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null)
  const [nodeDetailLoading, setNodeDetailLoading] = useState(false)
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null)
  const [podDetailLoading, setPodDetailLoading] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentInfo | null>(null)
  const [deploymentDetailLoading, setDeploymentDetailLoading] = useState(false)
  const [selectedDaemonSet, setSelectedDaemonSet] = useState<DaemonSetInfo | null>(null)
  const [daemonSetDetailLoading, setDaemonSetDetailLoading] = useState(false)
  const [selectedStatefulSet, setSelectedStatefulSet] = useState<StatefulSetInfo | null>(null)
  const [statefulSetDetailLoading, setStatefulSetDetailLoading] = useState(false)
  const [selectedReplicaSet, setSelectedReplicaSet] = useState<ReplicaSetInfo | null>(null)
  const [replicaSetDetailLoading, setReplicaSetDetailLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobInfo | null>(null)
  const [jobDetailLoading, setJobDetailLoading] = useState(false)
  const [selectedCronJob, setSelectedCronJob] = useState<CronJobInfo | null>(null)
  const [cronJobDetailLoading, setCronJobDetailLoading] = useState(false)
  const [nsSearchText, setNsSearchText] = useState('')
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [editingContextId, setEditingContextId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [dragging, setDragging] = useState<{ id: string; fromGroupId: string } | null>(null)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showTerminal, setShowTerminal] = useState(false)
  const terminalRef = useRef<Terminal | null>(null)
  const terminalContainerRef = useRef<HTMLDivElement>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  const selectedContext = useMemo(
    () => contexts.find((context) => context.id === selectedId),
    [contexts, selectedId]
  )
  const ctxMap = useMemo(() => {
    const m = new Map<string, ContextRecord>()
    for (const c of contexts) m.set(c.id, c)
    return m
  }, [contexts])

  const loadContexts = async () => {
    try {
      const list = await window.k7s.listContexts()
      setContexts(list)
      const prefs = await window.k7s.getContextPrefs()
      setContextPrefs(prefs)
      if (list.length === 0) {
        setSelectedId('')
        return
      }
      const stillExists = list.some((item) => item.id === selectedId)
      if (!selectedId || !stillExists) {
        setSelectedId(list[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载集群列表失败')
    }
  }

  const loadNamespaces = async (contextId: string) => {
    try {
      const list = await window.k7s.listNamespaces(contextId)
      setNamespaces(list)
    } catch {
      setNamespaces([])
    }
  }

  const loadResources = async (contextId: string, namespace?: string, isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true)
    } else {
      setStatus('loading')
    }
    setError('')
    try {
      const ns = namespace === 'all' ? undefined : namespace
      const [nodeList, podList, deployList, dsList, stsList, rsList, jobList, cjList] = await Promise.all([
        window.k7s.listNodes(contextId),
        window.k7s.listPods(contextId, ns),
        window.k7s.listDeployments(contextId, ns),
        window.k7s.listDaemonSets(contextId, ns),
        window.k7s.listStatefulSets(contextId, ns),
        window.k7s.listReplicaSets(contextId, ns),
        window.k7s.listJobs(contextId, ns),
        window.k7s.listCronJobs(contextId, ns)
      ])
      setNodes(nodeList)
      setPods(podList)
      setDeployments(deployList)
      setDaemonSets(dsList)
      setStatefulSets(stsList)
      setReplicaSets(rsList)
      setJobs(jobList)
      setCronJobs(cjList)
      setStatus('ready')
      setLastRefreshTime(new Date())
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAdd = async () => {
    setIsAdding(true)
    setError('')
    try {
      const result: AddContextsResult = await window.k7s.addKubeconfigFile()
      setContexts(result.contexts)
      if (result.addedIds.length > 0) {
        setSelectedId(result.addedIds[0])
      } else if (!selectedId && result.contexts.length > 0) {
        setSelectedId(result.contexts[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加配置失败')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortData = <T extends Record<string, unknown>>(data: T[]): T[] => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      let cmp = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }

  const filterData = <T extends { name?: string; namespace?: string }>(data: T[]): T[] => {
    if (!searchText) return data
    const lower = searchText.toLowerCase()
    return data.filter(item => 
      (item.name?.toLowerCase().includes(lower)) ||
      (item.namespace?.toLowerCase().includes(lower))
    )
  }

  const handleNodeClick = async (nodeName: string) => {
    if (!selectedId) return
    setNodeDetailLoading(true)
    setSelectedNode(null)
    try {
      const detail = await window.k7s.getNodeDetail(selectedId, nodeName)
      setSelectedNode(detail)
    } catch (err) {
      console.error('获取节点详情失败:', err)
    } finally {
      setNodeDetailLoading(false)
    }
  }

  const handleCloseNodeDetail = () => {
    setSelectedNode(null)
    setNodeDetailLoading(false)
  }

  const handlePodClick = async (namespace: string, podName: string) => {
    if (!selectedId) return
    setPodDetailLoading(true)
    setSelectedPod(null)
    try {
      const detail = await window.k7s.getPodDetail(selectedId, namespace, podName)
      setSelectedPod(detail)
    } catch (err) {
      console.error('获取Pod详情失败:', err)
    } finally {
      setPodDetailLoading(false)
    }
  }

  const handleClosePodDetail = () => {
    setSelectedPod(null)
    setPodDetailLoading(false)
  }

  const handleDeploymentClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setDeploymentDetailLoading(true)
    setSelectedDeployment(null)
    try {
      const detail = await window.k7s.getDeploymentDetail(selectedId, namespace, name)
      setSelectedDeployment(detail)
    } catch (err) {
      console.error('获取Deployment详情失败:', err)
    } finally {
      setDeploymentDetailLoading(false)
    }
  }

  const handleCloseDeploymentDetail = () => {
    setSelectedDeployment(null)
    setDeploymentDetailLoading(false)
  }

  const handleDaemonSetClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setDaemonSetDetailLoading(true)
    setSelectedDaemonSet(null)
    try {
      const detail = await window.k7s.getDaemonSetDetail(selectedId, namespace, name)
      setSelectedDaemonSet(detail)
    } catch (err) {
      console.error('获取DaemonSet详情失败:', err)
    } finally {
      setDaemonSetDetailLoading(false)
    }
  }

  const handleCloseDaemonSetDetail = () => {
    setSelectedDaemonSet(null)
    setDaemonSetDetailLoading(false)
  }

  const handleStatefulSetClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setStatefulSetDetailLoading(true)
    setSelectedStatefulSet(null)
    try {
      const detail = await window.k7s.getStatefulSetDetail(selectedId, namespace, name)
      setSelectedStatefulSet(detail)
    } catch (err) {
      console.error('获取StatefulSet详情失败:', err)
    } finally {
      setStatefulSetDetailLoading(false)
    }
  }

  const handleCloseStatefulSetDetail = () => {
    setSelectedStatefulSet(null)
    setStatefulSetDetailLoading(false)
  }

  const handleReplicaSetClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setReplicaSetDetailLoading(true)
    setSelectedReplicaSet(null)
    try {
      const detail = await window.k7s.getReplicaSetDetail(selectedId, namespace, name)
      setSelectedReplicaSet(detail)
    } catch (err) {
      console.error('获取ReplicaSet详情失败:', err)
    } finally {
      setReplicaSetDetailLoading(false)
    }
  }

  const handleCloseReplicaSetDetail = () => {
    setSelectedReplicaSet(null)
    setReplicaSetDetailLoading(false)
  }

  const handleJobClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setJobDetailLoading(true)
    setSelectedJob(null)
    try {
      const detail = await window.k7s.getJobDetail(selectedId, namespace, name)
      setSelectedJob(detail)
    } catch (err) {
      console.error('获取Job详情失败:', err)
    } finally {
      setJobDetailLoading(false)
    }
  }

  const handleCloseJobDetail = () => {
    setSelectedJob(null)
    setJobDetailLoading(false)
  }

  const handleCronJobClick = async (namespace: string, name: string) => {
    if (!selectedId) return
    setCronJobDetailLoading(true)
    setSelectedCronJob(null)
    try {
      const detail = await window.k7s.getCronJobDetail(selectedId, namespace, name)
      setSelectedCronJob(detail)
    } catch (err) {
      console.error('获取CronJob详情失败:', err)
    } finally {
      setCronJobDetailLoading(false)
    }
  }

  const handleCloseCronJobDetail = () => {
    setSelectedCronJob(null)
    setCronJobDetailLoading(false)
  }

  const handleManualRefresh = useCallback(() => {
    if (selectedId) {
      loadResources(selectedId, selectedNamespace, true)
    }
  }, [selectedId, selectedNamespace])

  const filteredNamespaces = useMemo(() => {
    if (!nsSearchText) return namespaces
    const lower = nsSearchText.toLowerCase()
    return namespaces.filter(ns => ns.name.toLowerCase().includes(lower))
  }, [namespaces, nsSearchText])

  useEffect(() => {
    loadContexts()
  }, [])

  useEffect(() => {
    if (selectedId) {
      loadNamespaces(selectedId)
      loadResources(selectedId, selectedNamespace)
    }
  }, [selectedId, selectedNamespace])

  useEffect(() => {
    if (!selectedId || refreshInterval === 0) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      return
    }

    refreshTimerRef.current = setInterval(() => {
      if (selectedId) {
        loadResources(selectedId, selectedNamespace, true)
      }
    }, refreshInterval * 1000)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [selectedId, selectedNamespace, refreshInterval])

  useEffect(() => {
    if (!showTerminal) {
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      window.k8sTerm.destroy()
      return
    }

    if (!terminalContainerRef.current || terminalRef.current) return
    if (!selectedId) return

    const term = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)'
      },
      rows: 12,
      cols: 80,
      cursorBlink: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    fitAddonRef.current = fitAddon

    term.open(terminalContainerRef.current)
    fitAddon.fit()

    terminalRef.current = term

    window.k8sTerm.create(selectedId).then(({ shell, cwd }) => {
      term.write(`Connected to cluster (${shell})\r\n`)
      term.write(`${cwd}$ `)

      term.onData((data) => {
        window.k8sTerm.write(data)
      })

      window.k8sTerm.onData((data) => {
        term.write(data)
      })

      window.k8sTerm.onExit((exitCode) => {
        term.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
      })
    })

    const handleResize = () => {
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit()
        const dims = fitAddonRef.current.proposeDimensions()
        if (dims) {
          window.k8sTerm.resize(dims.cols, dims.rows)
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      window.k8sTerm.destroy()
      fitAddonRef.current = null
    }
  }, [showTerminal, selectedId])

  const getStatusPillClass = () => {
    if (status === 'loading') return 'loading'
    if (status === 'ready') return 'ready'
    if (status === 'error') return 'error'
    return ''
  }

  const getDisplayName = (ctx: ContextRecord): string => {
    if (!contextPrefs) return ctx.name
    return contextPrefs.customNames[ctx.id] ?? ctx.name
  }

  const persistGrouping = async (groups: ContextGroup[], ungrouped: string[]) => {
    const updated = await window.k7s.updateContextGrouping(groups, ungrouped)
    setContextPrefs(updated)
  }

  const handleAddGroup = () => {
    setIsAddingGroup(true)
    setNewGroupName('')
  }

  const handleConfirmAddGroup = async () => {
    const name = newGroupName.trim()
    if (!name) {
      setIsAddingGroup(false)
      return
    }
    const id = 'g_' + Math.random().toString(36).slice(2)
    const groups = [...(contextPrefs?.groups ?? []), { id, name, items: [] }]
    const ungrouped = contextPrefs?.ungrouped ?? []
    await persistGrouping(groups, ungrouped)
    setIsAddingGroup(false)
    setNewGroupName('')
  }

  const handleCancelAddGroup = () => {
    setIsAddingGroup(false)
    setNewGroupName('')
  }

  const allowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const startDrag = (contextId: string, fromGroupId: string) => (e: React.DragEvent) => {
    setDragging({ id: contextId, fromGroupId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const dropOnItem = (targetId: string, targetGroupId: string) => async (e: React.DragEvent) => {
    e.preventDefault()
    if (!dragging || !contextPrefs) return
    const { id, fromGroupId } = dragging
    if (id === targetId && fromGroupId === targetGroupId) return
    let groups = contextPrefs.groups
    let ungrouped = [...contextPrefs.ungrouped]
    const removeFrom = (gid: string) => {
      if (gid === '__ungrouped__') {
        ungrouped = ungrouped.filter(x => x !== id)
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: g.items.filter(x => x !== id) } : g)
      }
    }
    const insertInto = (gid: string, beforeId?: string) => {
      if (gid === '__ungrouped__') {
        const items = ungrouped.filter(x => x !== id)
        const idx = items.indexOf(beforeId ?? '')
        if (idx >= 0) items.splice(idx, 0, id)
        else items.push(id)
        ungrouped = items
      } else {
        groups = groups.map(g => {
          if (g.id !== gid) return g
          const items = g.items.filter(x => x !== id)
          const idx = items.indexOf(beforeId ?? '')
          if (idx >= 0) items.splice(idx, 0, id)
          else items.push(id)
          return { ...g, items }
        })
      }
    }
    removeFrom(fromGroupId)
    insertInto(targetGroupId, targetId)
    await persistGrouping(groups, ungrouped)
    setDragging(null)
  }

  const dropOnGroup = (targetGroupId: string) => async (e: React.DragEvent) => {
    e.preventDefault()
    if (!dragging || !contextPrefs) return
    const { id, fromGroupId } = dragging
    let groups = contextPrefs.groups
    let ungrouped = [...contextPrefs.ungrouped]
    const removeFrom = (gid: string) => {
      if (gid === '__ungrouped__') {
        ungrouped = ungrouped.filter(x => x !== id)
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: g.items.filter(x => x !== id) } : g)
      }
    }
    const appendTo = (gid: string) => {
      if (gid === '__ungrouped__') {
        const items = ungrouped.filter(x => x !== id)
        items.push(id)
        ungrouped = items
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: [...g.items.filter(x => x !== id), id] } : g)
      }
    }
    removeFrom(fromGroupId)
    appendTo(targetGroupId)
    await persistGrouping(groups, ungrouped)
    setDragging(null)
  }

  const beginRename = (id: string, current: string) => {
    setEditingContextId(id)
    setEditingName(current)
  }

  const submitRename = async () => {
    if (!editingContextId) return
    const name = editingName.trim()
    const updated = await window.k7s.updateContextName(editingContextId, name)
    setContextPrefs(updated)
    setEditingContextId(null)
  }

  const handleRenameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitRename()
    } else if (e.key === 'Escape') {
      setEditingContextId(null)
    }
  }

  const renderResourceTable = () => {
    const handleHeaderClick = (field: string) => () => handleSort(field)

    switch (selectedResourceType) {
      case 'nodes':
        const filteredNodes = filterData(nodes)
        const sortedNodes = sortData(filteredNodes)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('status')}>状态 <SortIcon direction={sortField === 'status' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('version')}>版本 <SortIcon direction={sortField === 'version' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('roles')}>角色 <SortIcon direction={sortField === 'roles' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedNodes.map((node) => (
              <div className="table-row clickable" key={node.name} onClick={() => handleNodeClick(node.name)}>
                <div>{node.name}</div>
                <div className={`status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</div>
                <div>{node.version}</div>
                <div>{node.roles}</div>
                <div>{node.age}</div>
              </div>
            ))}
            {sortedNodes.length === 0 && <div className="table-empty">暂无节点数据</div>}
          </div>
        )

      case 'pods':
        const filteredPods = filterData(pods)
        const sortedPods = sortData(filteredPods)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('status')}>状态 <SortIcon direction={sortField === 'status' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('nodeName')}>节点 <SortIcon direction={sortField === 'nodeName' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('restarts')}>重启 <SortIcon direction={sortField === 'restarts' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedPods.map((pod) => (
              <div className="table-row clickable" key={`${pod.namespace}-${pod.name}`} onClick={() => handlePodClick(pod.namespace, pod.name)}>
                <div>{pod.name}</div>
                <div>{pod.namespace}</div>
                <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                <div>{pod.nodeName}</div>
                <div>{pod.restarts}</div>
                <div>{pod.age}</div>
              </div>
            ))}
            {sortedPods.length === 0 && <div className="table-empty">暂无Pod数据</div>}
          </div>
        )

      case 'deployments':
        const filteredDeployments = filterData(deployments)
        const sortedDeployments = sortData(filteredDeployments)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('replicas')}>副本 <SortIcon direction={sortField === 'replicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('readyReplicas')}>就绪 <SortIcon direction={sortField === 'readyReplicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('availableReplicas')}>可用 <SortIcon direction={sortField === 'availableReplicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedDeployments.map((deploy) => (
              <div className="table-row clickable" key={`${deploy.namespace}-${deploy.name}`} onClick={() => handleDeploymentClick(deploy.namespace, deploy.name)}>
                <div>{deploy.name}</div>
                <div>{deploy.namespace}</div>
                <div>{deploy.replicas}</div>
                <div>{deploy.readyReplicas}</div>
                <div>{deploy.availableReplicas}</div>
                <div>{deploy.age}</div>
              </div>
            ))}
            {sortedDeployments.length === 0 && <div className="table-empty">暂无Deployment数据</div>}
          </div>
        )

      case 'daemonsets':
        const filteredDaemonSets = filterData(daemonSets)
        const sortedDaemonSets = sortData(filteredDaemonSets)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('desiredNumberScheduled')}>期望 <SortIcon direction={sortField === 'desiredNumberScheduled' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('currentNumberScheduled')}>当前 <SortIcon direction={sortField === 'currentNumberScheduled' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('numberReady')}>就绪 <SortIcon direction={sortField === 'numberReady' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedDaemonSets.map((ds) => (
              <div className="table-row clickable" key={`${ds.namespace}-${ds.name}`} onClick={() => handleDaemonSetClick(ds.namespace, ds.name)}>
                <div>{ds.name}</div>
                <div>{ds.namespace}</div>
                <div>{ds.desiredNumberScheduled}</div>
                <div>{ds.currentNumberScheduled}</div>
                <div>{ds.numberReady}</div>
                <div>{ds.age}</div>
              </div>
            ))}
            {sortedDaemonSets.length === 0 && <div className="table-empty">暂无DaemonSet数据</div>}
          </div>
        )

      case 'statefulsets':
        const filteredStatefulSets = filterData(statefulSets)
        const sortedStatefulSets = sortData(filteredStatefulSets)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('replicas')}>副本 <SortIcon direction={sortField === 'replicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('readyReplicas')}>就绪 <SortIcon direction={sortField === 'readyReplicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedStatefulSets.map((sts) => (
              <div className="table-row clickable" key={`${sts.namespace}-${sts.name}`} onClick={() => handleStatefulSetClick(sts.namespace, sts.name)}>
                <div>{sts.name}</div>
                <div>{sts.namespace}</div>
                <div>{sts.replicas}</div>
                <div>{sts.readyReplicas}</div>
                <div>{sts.age}</div>
              </div>
            ))}
            {sortedStatefulSets.length === 0 && <div className="table-empty">暂无StatefulSet数据</div>}
          </div>
        )

      case 'replicasets':
        const filteredReplicaSets = filterData(replicaSets)
        const sortedReplicaSets = sortData(filteredReplicaSets)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('replicas')}>副本 <SortIcon direction={sortField === 'replicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('readyReplicas')}>就绪 <SortIcon direction={sortField === 'readyReplicas' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedReplicaSets.map((rs) => (
              <div className="table-row clickable" key={`${rs.namespace}-${rs.name}`} onClick={() => handleReplicaSetClick(rs.namespace, rs.name)}>
                <div>{rs.name}</div>
                <div>{rs.namespace}</div>
                <div>{rs.replicas}</div>
                <div>{rs.readyReplicas}</div>
                <div>{rs.age}</div>
              </div>
            ))}
            {sortedReplicaSets.length === 0 && <div className="table-empty">暂无ReplicaSet数据</div>}
          </div>
        )

      case 'jobs':
        const filteredJobs = filterData(jobs)
        const sortedJobs = sortData(filteredJobs)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('completions')}>完成数 <SortIcon direction={sortField === 'completions' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('succeeded')}>成功 <SortIcon direction={sortField === 'succeeded' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('failed')}>失败 <SortIcon direction={sortField === 'failed' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedJobs.map((job) => (
              <div className="table-row clickable" key={`${job.namespace}-${job.name}`} onClick={() => handleJobClick(job.namespace, job.name)}>
                <div>{job.name}</div>
                <div>{job.namespace}</div>
                <div>{job.completions}</div>
                <div>{job.succeeded}</div>
                <div className={`status ${job.failed > 0 ? 'warn' : 'ok'}`}>{job.failed}</div>
                <div>{job.age}</div>
              </div>
            ))}
            {sortedJobs.length === 0 && <div className="table-empty">暂无Job数据</div>}
          </div>
        )

      case 'cronjobs':
        const filteredCronJobs = filterData(cronJobs)
        const sortedCronJobs = sortData(filteredCronJobs)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('schedule')}>调度 <SortIcon direction={sortField === 'schedule' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('suspend')}>暂停 <SortIcon direction={sortField === 'suspend' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('active')}>活跃 <SortIcon direction={sortField === 'active' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('lastSchedule')}>上次调度 <SortIcon direction={sortField === 'lastSchedule' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedCronJobs.map((cj) => (
              <div className="table-row clickable" key={`${cj.namespace}-${cj.name}`} onClick={() => handleCronJobClick(cj.namespace, cj.name)}>
                <div>{cj.name}</div>
                <div>{cj.namespace}</div>
                <div>{cj.schedule}</div>
                <div>{cj.suspend ? '是' : '否'}</div>
                <div>{cj.active}</div>
                <div>{cj.lastSchedule}</div>
                <div>{cj.age}</div>
              </div>
            ))}
            {sortedCronJobs.length === 0 && <div className="table-empty">暂无CronJob数据</div>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title">k7s</div>
            <div className="sidebar-subtitle">本地集群管理</div>
          </div>
          <button className="add-btn" onClick={handleAdd} disabled={isAdding}>
            {isAdding ? '添加中...' : '添加'}
          </button>
        </div>
        <div className="sidebar-list">
          {contexts.length === 0 && <div className="sidebar-empty">暂无集群</div>}
          {contextPrefs ? (
            <>
              <div className="group-controls">
                {isAddingGroup ? (
                  <>
                    <input
                      className="group-input"
                      placeholder="分组名称"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmAddGroup()
                        if (e.key === 'Escape') handleCancelAddGroup()
                      }}
                      autoFocus
                    />
                    <button className="add-btn" onClick={handleConfirmAddGroup}>保存</button>
                    <button className="add-btn" onClick={handleCancelAddGroup}>取消</button>
                  </>
                ) : (
                  <button className="add-btn" onClick={handleAddGroup}>添加分组</button>
                )}
              </div>
              {contextPrefs.groups.map((group) => (
                <div key={group.id} className="sidebar-group">
                  <div className="sidebar-group-header" onDragOver={allowDragOver} onDrop={dropOnGroup(group.id)}>
                    {group.name}
                  </div>
                  <div className="sidebar-group-list" onDragOver={allowDragOver} onDrop={dropOnGroup(group.id)}>
                    {group.items.map((cid) => {
                      const ctx = ctxMap.get(cid)
                      if (!ctx) return null
                      const title = getDisplayName(ctx)
                      const isActive = cid === selectedId
                      return (
                        <button
                          key={cid}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedId(cid)}
                          draggable
                          onDragStart={startDrag(cid, group.id)}
                          onDragOver={allowDragOver}
                          onDrop={dropOnItem(cid, group.id)}
                        >
                          <div className="sidebar-item-title">
                            {editingContextId === cid ? (
                              <input
                                className="sidebar-item-input"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={submitRename}
                                onKeyDown={handleRenameKey}
                                autoFocus
                              />
                            ) : (
                              title
                            )}
                          </div>
                          <div className="sidebar-item-meta">
                            {formatSource(ctx.source)} · {ctx.cluster}
                            <span
                              className="edit-icon"
                              onClick={(e) => { e.stopPropagation(); beginRename(cid, title) }}
                              title="重命名"
                            >
                              ✎
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="sidebar-group">
                <div className="sidebar-group-header" onDragOver={allowDragOver} onDrop={dropOnGroup('__ungrouped__')}>
                  未分组
                </div>
                <div className="sidebar-group-list" onDragOver={allowDragOver} onDrop={dropOnGroup('__ungrouped__')}>
                  {contextPrefs.ungrouped.map((cid) => {
                    const ctx = ctxMap.get(cid)
                    if (!ctx) return null
                    const title = getDisplayName(ctx)
                    const isActive = cid === selectedId
                    return (
                      <button
                        key={cid}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedId(cid)}
                        draggable
                        onDragStart={startDrag(cid, '__ungrouped__')}
                        onDragOver={allowDragOver}
                        onDrop={dropOnItem(cid, '__ungrouped__')}
                      >
                        <div className="sidebar-item-title">
                          {editingContextId === cid ? (
                            <input
                              className="sidebar-item-input"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={submitRename}
                              onKeyDown={handleRenameKey}
                              autoFocus
                            />
                          ) : (
                            title
                          )}
                        </div>
                        <div className="sidebar-item-meta">
                          {formatSource(ctx.source)} · {ctx.cluster}
                          <span
                            className="edit-icon"
                            onClick={(e) => { e.stopPropagation(); beginRename(cid, title) }}
                            title="重命名"
                          >
                            ✎
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            contexts.map((context: ContextRecord) => (
              <button
                key={context.id}
                className={`sidebar-item ${context.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(context.id)}
              >
                <div className="sidebar-item-title">{context.name}</div>
                <div className="sidebar-item-meta">
                  {formatSource(context.source)} · {context.cluster}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
      <main className="main">
        <div className="main-header">
          <div>
            <div className="main-title">
              {selectedContext ? (contextPrefs?.customNames[selectedContext.id] ?? selectedContext.name) : '请选择集群'}
            </div>
            {selectedContext && (
              <div className="main-subtitle">
                {selectedContext.cluster} · {selectedContext.user}
              </div>
            )}
          </div>
          <div className={`status-pill ${getStatusPillClass()}`}>
            {status === 'loading' && '加载中'}
            {status === 'ready' && '已连接'}
            {status === 'error' && '连接失败'}
            {status === 'idle' && '等待中'}
          </div>
          <button
            className={`terminal-btn ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
            title="终端"
          >
            Terminal
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {contexts.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <div className="content-wrapper">
            <aside className="resource-sidebar">
              <div className="resource-sidebar-title">资源类型</div>
              <div className="resource-sidebar-list">
                {RESOURCE_TYPES.map((type) => (
                  <button
                    key={type.key}
                    className={`resource-sidebar-item ${selectedResourceType === type.key ? 'active' : ''}`}
                    onClick={() => setSelectedResourceType(type.key)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </aside>
            <div className="content-main">
              <section className="resource-section compact">
                <div className="resource-toolbar">
                  <div className="resource-filters">
                    <div className="namespace-filter">
                      <select 
                        className="namespace-select"
                        value={selectedNamespace}
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                      >
                        <option value="all">全部命名空间</option>
                        {filteredNamespaces.map((ns) => (
                          <option key={ns.name} value={ns.name}>{ns.name}</option>
                        ))}
                      </select>
                      {namespaces.length > 10 && (
                        <input
                          type="text"
                          className="ns-search-input"
                          placeholder="筛选命名空间..."
                          value={nsSearchText}
                          onChange={(e) => setNsSearchText(e.target.value)}
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="搜索..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                  <div className="refresh-controls">
                    <select 
                      className="refresh-interval-select"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
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
                <div className="table-container">
                  {renderResourceTable()}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
      <NodeDetailModal 
        node={selectedNode} 
        loading={nodeDetailLoading} 
        onClose={handleCloseNodeDetail} 
      />
      <PodDetailModal
        pod={selectedPod}
        loading={podDetailLoading}
        onClose={handleClosePodDetail}
      />
      <DeploymentDetailModal
        deploy={selectedDeployment}
        loading={deploymentDetailLoading}
        onClose={handleCloseDeploymentDetail}
      />
      <GenericDetailModal
        resource={selectedDaemonSet}
        loading={daemonSetDetailLoading}
        onClose={handleCloseDaemonSetDetail}
        title="DaemonSet 详情"
        renderDetails={(ds) => (
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
          </div>
        )}
      />
      <GenericDetailModal
        resource={selectedStatefulSet}
        loading={statefulSetDetailLoading}
        onClose={handleCloseStatefulSetDetail}
        title="StatefulSet 详情"
        renderDetails={(sts) => (
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
          </div>
        )}
      />
      <GenericDetailModal
        resource={selectedReplicaSet}
        loading={replicaSetDetailLoading}
        onClose={handleCloseReplicaSetDetail}
        title="ReplicaSet 详情"
        renderDetails={(rs) => (
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
                  <span className="detail-label">存活时间</span>
                  <span className="detail-value">{rs.age}</span>
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
          </div>
        )}
      />
      <GenericDetailModal
        resource={selectedJob}
        loading={jobDetailLoading}
        onClose={handleCloseJobDetail}
        title="Job 详情"
        renderDetails={(job) => (
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
                  <span className="detail-label">并行度</span>
                  <span className="detail-value">{job.parallelism ?? '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">重试限制</span>
                  <span className="detail-value">{job.backoffLimit ?? '-'}</span>
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
          </div>
        )}
      />
      <GenericDetailModal
        resource={selectedCronJob}
        loading={cronJobDetailLoading}
        onClose={handleCloseCronJobDetail}
        title="CronJob 详情"
        renderDetails={(cj) => (
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
          </div>
        )}
      />

      {showTerminal && (
        <div className="terminal-panel">
          <div className="terminal-header">
            <span>Terminal</span>
            <button className="terminal-close" onClick={() => setShowTerminal(false)}>×</button>
          </div>
          <div className="terminal-container" ref={terminalContainerRef} />
        </div>
      )}
    </div>
  )
}

export default App
