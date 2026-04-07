import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import '@xterm/xterm/css/xterm.css'
import { useClusterStore, useUIStore, usePreferencesStore, useTerminalStore, useTerminalInit } from './store'
import type {
  ContextRecord,
  KubernetesResourceKind,
  ResourceType,
  RolloutWorkloadKind,
  ScaleableWorkloadKind,
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
} from './components/Modals'
import { isWebMode, k8sApi } from './api/provider'
import { EmptyState, SortIcon } from './components/Clusters'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type NoticeTone = 'info' | 'success' | 'error'
type NoticeState = {
  tone: NoticeTone
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

const formatSource = (source: string) => (source === 'default' ? '默认配置' : source)

const RESOURCE_TYPES: { key: ResourceType; label: string }[] = [
  { key: 'nodes', label: 'Node' },
  { key: 'pods', label: 'Pod' },
  { key: 'deployments', label: 'Deployment' },
  { key: 'daemonsets', label: 'DaemonSet' },
  { key: 'statefulsets', label: 'StatefulSet' },
  { key: 'replicasets', label: 'ReplicaSet' },
  { key: 'jobs', label: 'Job' },
  { key: 'cronjobs', label: 'CronJob' },
  { key: 'services', label: 'Service' },
  { key: 'configmaps', label: 'ConfigMap' },
  { key: 'secrets', label: 'Secret' },
  { key: 'ingresses', label: 'Ingress' },
  { key: 'persistentvolumes', label: 'PV' },
  { key: 'persistentvolumeclaims', label: 'PVC' },
  { key: 'storageclasses', label: 'StorageClass' },
  { key: 'serviceaccounts', label: 'ServiceAccount' },
  { key: 'roles', label: 'Role' },
  { key: 'rolebindings', label: 'RoleBinding' },
  { key: 'clusterroles', label: 'ClusterRole' },
  { key: 'clusterrolebindings', label: 'ClusterRoleBinding' },
  { key: 'horizontalpodautoscalers', label: 'HPA' },
  { key: 'events', label: 'Event' }
]

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

const SummaryCard = ({ label, value, detail, tone = 'default' }: SummaryCardProps) => (
  <div className={`summary-card ${tone}`}>
    <div className="summary-card-label">{label}</div>
    <div className="summary-card-value">{value}</div>
    <div className="summary-card-detail">{detail}</div>
  </div>
)

const App = () => {
  // Cluster store
  const contexts = useClusterStore((s) => s.contexts)
  const selectedId = useClusterStore((s) => s.selectedId)
  const namespaces = useClusterStore((s) => s.namespaces)
  const selectedNamespaces = useClusterStore((s) => s.selectedNamespaces)
  const nodes = useClusterStore((s) => s.nodes)
  const pods = useClusterStore((s) => s.pods)
  const deployments = useClusterStore((s) => s.deployments)
  const daemonSets = useClusterStore((s) => s.daemonSets)
  const statefulSets = useClusterStore((s) => s.statefulSets)
  const replicaSets = useClusterStore((s) => s.replicaSets)
  const jobs = useClusterStore((s) => s.jobs)
  const cronJobs = useClusterStore((s) => s.cronJobs)
  const services = useClusterStore((s) => s.services)
  const configMaps = useClusterStore((s) => s.configMaps)
  const secrets = useClusterStore((s) => s.secrets)
  const ingresses = useClusterStore((s) => s.ingresses)
  const persistentVolumes = useClusterStore((s) => s.persistentVolumes)
  const persistentVolumeClaims = useClusterStore((s) => s.persistentVolumeClaims)
  const storageClasses = useClusterStore((s) => s.storageClasses)
  const serviceAccounts = useClusterStore((s) => s.serviceAccounts)
  const roles = useClusterStore((s) => s.roles)
  const roleBindings = useClusterStore((s) => s.roleBindings)
  const clusterRoles = useClusterStore((s) => s.clusterRoles)
  const clusterRoleBindings = useClusterStore((s) => s.clusterRoleBindings)
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
  const selectedJob = useUIStore((s) => s.selectedJob)
  const jobDetailLoading = useUIStore((s) => s.jobDetailLoading)
  const selectedCronJob = useUIStore((s) => s.selectedCronJob)
  const cronJobDetailLoading = useUIStore((s) => s.cronJobDetailLoading)
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
  const handleJobClick = useUIStore((s) => s.handleJobClick)
  const handleCloseJobDetail = useUIStore((s) => s.handleCloseJobDetail)
  const handleCronJobClick = useUIStore((s) => s.handleCronJobClick)
  const handleCloseCronJobDetail = useUIStore((s) => s.handleCloseCronJobDetail)
  const isCreateModalOpen = useUIStore((s) => s.isCreateModalOpen)
  const setIsCreateModalOpen = useUIStore((s) => s.setIsCreateModalOpen)
  const setIsYamlEditorOpen = useUIStore((s) => s.setIsYamlEditorOpen)
  const isYamlEditorOpen = useUIStore((s) => s.isYamlEditorOpen)
  const yamlEditorMode = useUIStore((s) => s.yamlEditorMode)
  const yamlEditorResource = useUIStore((s) => s.yamlEditorResource)

  // Preferences store
  const contextPrefs = usePreferencesStore((s) => s.contextPrefs)
  const editingContextId = usePreferencesStore((s) => s.editingContextId)
  const editingName = usePreferencesStore((s) => s.editingName)
  const isAddingGroup = usePreferencesStore((s) => s.isAddingGroup)
  const newGroupName = usePreferencesStore((s) => s.newGroupName)
  const setEditingName = usePreferencesStore((s) => s.setEditingName)
  const setNewGroupName = usePreferencesStore((s) => s.setNewGroupName)
  const getDisplayName = usePreferencesStore((s) => s.getDisplayName)
  const loadContextPrefs = usePreferencesStore((s) => s.loadContextPrefs)
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
  const toggleTerminal = useTerminalStore((s) => s.toggleTerminal)
  const setShowTerminal = useTerminalStore((s) => s.setShowTerminal)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Initialize terminal
  useTerminalInit(showTerminal, selectedId, terminalRef)

  // Local state
  const [isAdding, setIsAdding] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const [watchConnected, setWatchConnected] = useState(false)
  const [selectedPodForExec, setSelectedPodForExec] = useState<typeof pods[number] | null>(null)
  const [selectedPodForPortForward, setSelectedPodForPortForward] = useState<typeof pods[number] | null>(null)
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

  const selectedNamespace = selectedNamespaces[0] ?? ''
  const selectedContextDisplayName = selectedContext
    ? contextPrefs?.customNames[selectedContext.id] ?? selectedContext.name
    : '请选择集群'
  const currentResourceLabel = RESOURCE_TYPES.find((type) => type.key === selectedResourceType)?.label ?? 'Resource'

  const filterNamespacedData = <T extends { namespace: string }>(data: T[]) => {
    if (!selectedNamespace) return data
    return data.filter((item) => item.namespace === selectedNamespace)
  }

  const getVisibleData = <T extends { name?: string; namespace?: string }>(data: T[]) => sortData(filterData(data))

  const getVisibleNamespacedData = <T extends { name?: string; namespace: string }>(data: T[]) => (
    getVisibleData(filterNamespacedData(data))
  )

  const showNotice = (tone: NoticeTone, message: string) => {
    setNotice({ tone, message })
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current)
    }
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null)
      noticeTimerRef.current = null
    }, 4000)
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

  const stopRowAction = (event: MouseEvent<HTMLButtonElement>, action: () => void | Promise<void>) => {
    event.stopPropagation()
    void action()
  }

  const handleAddClick = async () => {
    setIsAdding(true)
    await handleAdd()
    setIsAdding(false)
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

  const getStatusPillClass = () => {
    if (status === 'loading') return 'loading'
    if (status === 'ready') return 'ready'
    if (status === 'error') return 'error'
    return ''
  }

  const renderTableHead = (fields: TableField[], includeActions = false) => (
    <div className="table-row table-head">
      {fields.map(({ label, field }) => (
        <div key={field} onClick={() => handleSort(field)}>
          {label}
          <SortIcon direction={sortField === field ? sortDirection : undefined} />
        </div>
      ))}
      {includeActions && <div>操作</div>}
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

  const currentResourceCount = useMemo(() => {
    switch (selectedResourceType) {
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
      case 'jobs':
        return getVisibleNamespacedData(jobs).length
      case 'cronjobs':
        return getVisibleNamespacedData(cronJobs).length
      case 'services':
        return getVisibleNamespacedData(services).length
      case 'configmaps':
        return getVisibleNamespacedData(configMaps).length
      case 'secrets':
        return getVisibleNamespacedData(secrets).length
      case 'ingresses':
        return getVisibleNamespacedData(ingresses).length
      case 'persistentvolumes':
        return getVisibleData(persistentVolumes).length
      case 'persistentvolumeclaims':
        return getVisibleNamespacedData(persistentVolumeClaims).length
      case 'storageclasses':
        return getVisibleData(storageClasses).length
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
      case 'horizontalpodautoscalers':
        return getVisibleNamespacedData(hpas).length
      case 'events':
        return getVisibleNamespacedData(events).length
      default:
        return 0
    }
  }, [
    clusterRoleBindings,
    clusterRoles,
    configMaps,
    cronJobs,
    daemonSets,
    deployments,
    events,
    getVisibleData,
    getVisibleNamespacedData,
    hpas,
    ingresses,
    jobs,
    nodes,
    persistentVolumeClaims,
    persistentVolumes,
    pods,
    replicaSets,
    roleBindings,
    roles,
    secrets,
    selectedResourceType,
    serviceAccounts,
    services,
    statefulSets,
    storageClasses,
  ])

  const warningEventsCount = useMemo(() => events.filter((event) => event.type === 'Warning').length, [events])
  const readyNodeCount = clusterHealth?.readyNodes ?? nodes.filter((node) => node.status === 'Ready').length
  const totalNodeCount = clusterHealth?.totalNodes ?? nodes.length
  const runningPodCount = clusterHealth?.runningPods ?? pods.filter((pod) => pod.status === 'Running').length
  const totalPodCount = clusterHealth?.totalPods ?? pods.length
  const pendingPodCount = clusterHealth?.pendingPods ?? pods.filter((pod) => pod.status === 'Pending').length
  const failedPodCount = clusterHealth?.failedPods ?? pods.filter((pod) => pod.status === 'Failed').length
  const workloadCount = deployments.length + daemonSets.length + statefulSets.length + replicaSets.length + jobs.length + cronJobs.length
  const selectedClusterCardStatus: LoadState = watchConnected && status === 'ready' ? 'ready' : status

  // Preferences and initial context loading
  useEffect(() => {
    loadContextPrefs()
  }, [loadContextPrefs])

  useEffect(() => {
    loadContexts()
  }, [loadContexts])

  useEffect(() => {
    if (!selectedId) return
    void refreshSelectedContext()
  }, [selectedId, refreshAll])

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
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
      if (watchRefreshTimerRef.current) clearTimeout(watchRefreshTimerRef.current)
    }
  }, [])

  const renderResourceTable = () => {
    switch (selectedResourceType) {
      case 'nodes': {
        const sortedNodes = getVisibleData(nodes)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '状态', field: 'status' },
              { label: '版本', field: 'version' },
              { label: '角色', field: 'roles' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedNodes.map((node) => (
              <div className="table-row clickable" key={node.name} onClick={() => handleNodeClick(node.name, selectedId)}>
                <div>{node.name}</div>
                <div className={`status ${node.status === 'Ready' ? 'ok' : 'warn'}`}>{node.status}</div>
                <div>{node.version}</div>
                <div>{node.roles}</div>
                <div>{node.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'Node', '', node.name),
                    title: '查看 YAML',
                  },
                ])}
              </div>
            ))}
            {sortedNodes.length === 0 && <div className="table-empty">暂无节点数据</div>}
          </div>
        )
      }

      case 'pods': {
        const sortedPods = getVisibleNamespacedData(pods)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '状态', field: 'status' },
              { label: '节点', field: 'nodeName' },
              { label: '重启', field: 'restarts' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPods.map((pod) => (
              <div className="table-row clickable" key={`${pod.namespace}-${pod.name}`} onClick={() => handlePodClick(pod, selectedId)}>
                <div>{pod.name}</div>
                <div>{pod.namespace}</div>
                <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                <div>{pod.nodeName}</div>
                <div>{pod.restarts}</div>
                <div>{pod.age}</div>
                {renderActions([
                  {
                    key: 'logs',
                    label: 'Logs',
                    className: 'logs-btn',
                    onClick: () => handleOpenPodLogs(pod),
                    title: '查看日志',
                  },
                  {
                    key: 'exec',
                    label: 'Exec',
                    className: 'scale-btn',
                    onClick: () => setSelectedPodForExec(pod),
                    title: '执行命令',
                  },
                  {
                    key: 'port',
                    label: 'Port',
                    className: 'scale-btn',
                    onClick: () => setSelectedPodForPortForward(pod),
                    title: '端口转发',
                  },
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'Pod', pod.namespace, pod.name),
                    title: '查看 YAML',
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    className: 'delete-btn',
                    onClick: () => handleDeleteResource('Pod', pod.namespace, pod.name),
                    title: '删除 Pod',
                  },
                ])}
              </div>
            ))}
            {sortedPods.length === 0 && <div className="table-empty">暂无 Pod 数据</div>}
          </div>
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedDeployments.map((deploy) => (
              <div className="table-row clickable" key={`${deploy.namespace}-${deploy.name}`} onClick={() => handleDeploymentClick(deploy.namespace, deploy.name, selectedId)}>
                <div>{deploy.name}</div>
                <div>{deploy.namespace}</div>
                <div>{deploy.replicas}</div>
                <div>{deploy.readyReplicas}</div>
                <div>{deploy.availableReplicas}</div>
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
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('Deployment', deploy.namespace, deploy.name),
                    title: '回滚到上一版本',
                  },
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
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('DaemonSet', daemonSet.namespace, daemonSet.name),
                    title: '回滚到上一版本',
                  },
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
                    key: 'rollback',
                    label: 'Rollback',
                    className: 'yaml-btn',
                    onClick: () => handleRollbackWorkload('StatefulSet', statefulSet.namespace, statefulSet.name),
                    title: '回滚到上一版本',
                  },
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedJobs.map((job) => (
              <div className="table-row clickable" key={`${job.namespace}-${job.name}`} onClick={() => handleJobClick(job.namespace, job.name, selectedId)}>
                <div>{job.name}</div>
                <div>{job.namespace}</div>
                <div>{job.completions}</div>
                <div>{job.succeeded}</div>
                <div className={`status ${job.failed > 0 ? 'warn' : 'ok'}`}>{job.failed}</div>
                <div>{job.age}</div>
                {renderActions([
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
              <div className="table-row" key={`${service.namespace}-${service.name}`}>
                <div>{service.name}</div>
                <div>{service.namespace}</div>
                <div>{service.type}</div>
                <div>{service.clusterIP}</div>
                <div>{service.ports}</div>
                <div>{service.age}</div>
                {renderActions([
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

      case 'configmaps': {
        const sortedConfigMaps = getVisibleNamespacedData(configMaps)
        return (
          <div className="table">
            {renderTableHead([
              { label: '名称', field: 'name' },
              { label: '命名空间', field: 'namespace' },
              { label: '存活', field: 'age' },
            ], true)}
            {sortedConfigMaps.map((configMap) => (
              <div className="table-row" key={`${configMap.namespace}-${configMap.name}`}>
                <div>{configMap.name}</div>
                <div>{configMap.namespace}</div>
                <div>{configMap.age}</div>
                {renderActions([
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedSecrets.map((secret) => (
              <div className="table-row" key={`${secret.namespace}-${secret.name}`}>
                <div>{secret.name}</div>
                <div>{secret.namespace}</div>
                <div>{secret.type}</div>
                <div>{secret.age}</div>
                {renderActions([
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedIngresses.map((ingress) => (
              <div className="table-row" key={`${ingress.namespace}-${ingress.name}`}>
                <div>{ingress.name}</div>
                <div>{ingress.namespace}</div>
                <div>{ingress.hosts}</div>
                <div>{ingress.address || '-'}</div>
                <div>{ingress.age}</div>
                {renderActions([
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPVs.map((pv) => (
              <div className="table-row" key={pv.name}>
                <div>{pv.name}</div>
                <div>{pv.capacity}</div>
                <div>{pv.accessModes}</div>
                <div>{pv.reclaimPolicy}</div>
                <div>{pv.status}</div>
                <div>{pv.storageClass || '-'}</div>
                <div>{pv.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'PersistentVolume', '', pv.name),
                    title: '查看 YAML',
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedPVCs.map((pvc) => (
              <div className="table-row" key={`${pvc.namespace}-${pvc.name}`}>
                <div>{pvc.name}</div>
                <div>{pvc.namespace}</div>
                <div>{pvc.status}</div>
                <div>{pvc.capacity}</div>
                <div>{pvc.accessModes}</div>
                <div>{pvc.storageClass || '-'}</div>
                <div>{pvc.age}</div>
                {renderActions([
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
              { label: '存活', field: 'age' },
            ], true)}
            {sortedStorageClasses.map((storageClass) => (
              <div className="table-row" key={storageClass.name}>
                <div>{storageClass.name}</div>
                <div>{storageClass.provisioner}</div>
                <div>{storageClass.reclaimPolicy}</div>
                <div>{storageClass.volumeBindingMode}</div>
                <div>{storageClass.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'StorageClass', '', storageClass.name),
                    title: '查看 YAML',
                  },
                ])}
              </div>
            ))}
            {sortedStorageClasses.length === 0 && <div className="table-empty">暂无 StorageClass 数据</div>}
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
              <div className="table-row" key={`${serviceAccount.namespace}-${serviceAccount.name}`}>
                <div>{serviceAccount.name}</div>
                <div>{serviceAccount.namespace}</div>
                <div>{serviceAccount.secrets}</div>
                <div>{serviceAccount.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'ServiceAccount', serviceAccount.namespace, serviceAccount.name),
                    title: '编辑 YAML',
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
              <div className="table-row" key={`${role.namespace}-${role.name}`}>
                <div>{role.name}</div>
                <div>{role.namespace}</div>
                <div>{role.rules}</div>
                <div>{role.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'Role', role.namespace, role.name),
                    title: '编辑 YAML',
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
              <div className="table-row" key={`${roleBinding.namespace}-${roleBinding.name}`}>
                <div>{roleBinding.name}</div>
                <div>{roleBinding.namespace}</div>
                <div>{roleBinding.roleRef}</div>
                <div>{roleBinding.subjects}</div>
                <div>{roleBinding.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'RoleBinding', roleBinding.namespace, roleBinding.name),
                    title: '编辑 YAML',
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
              <div className="table-row" key={clusterRole.name}>
                <div>{clusterRole.name}</div>
                <div>{clusterRole.rules}</div>
                <div>{clusterRole.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'ClusterRole', '', clusterRole.name),
                    title: '查看 YAML',
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
              <div className="table-row" key={clusterRoleBinding.name}>
                <div>{clusterRoleBinding.name}</div>
                <div>{clusterRoleBinding.roleRef}</div>
                <div>{clusterRoleBinding.subjects}</div>
                <div>{clusterRoleBinding.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'ClusterRoleBinding', '', clusterRoleBinding.name),
                    title: '查看 YAML',
                  },
                ])}
              </div>
            ))}
            {sortedClusterRoleBindings.length === 0 && <div className="table-empty">暂无 ClusterRoleBinding 数据</div>}
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
              <div className="table-row" key={`${hpa.namespace}-${hpa.name}`}>
                <div>{hpa.name}</div>
                <div>{hpa.namespace}</div>
                <div>{hpa.reference}</div>
                <div>{hpa.minPods}</div>
                <div>{hpa.maxPods}</div>
                <div>{hpa.currentReplicas}</div>
                <div>{hpa.desiredReplicas}</div>
                <div>{hpa.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('edit', 'HorizontalPodAutoscaler', hpa.namespace, hpa.name),
                    title: '编辑 YAML',
                  },
                ])}
              </div>
            ))}
            {sortedHPAs.length === 0 && <div className="table-empty">暂无 HPA 数据</div>}
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
              <div className={`table-row${event.type === 'Warning' ? ' row-warning' : ''}`} key={`${event.namespace}-${event.name}`}>
                <div>{event.namespace}</div>
                <div>{event.type}</div>
                <div>{event.reason}</div>
                <div>{event.object}</div>
                <div className="cell-truncate" title={event.message}>{event.message}</div>
                <div>{event.count}</div>
                <div>{event.age}</div>
                {renderActions([
                  {
                    key: 'yaml',
                    label: 'YAML',
                    className: 'yaml-btn',
                    onClick: () => openYamlEditor('view', 'Event', event.namespace, event.name),
                    title: '查看 YAML',
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
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-title">k7s</div>
            <div className="sidebar-subtitle">本地集群管理</div>
          </div>
          <button className="add-btn" onClick={handleAddClick} disabled={isAdding}>
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
                      onChange={(event) => setNewGroupName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleConfirmAddGroup()
                        if (event.key === 'Escape') handleCancelAddGroup()
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
                    {group.items.map((contextId) => {
                      const context = ctxMap.get(contextId)
                      if (!context) return null

                      const title = getDisplayName(context)
                      const isActive = contextId === selectedId

                      return (
                        <button
                          key={contextId}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                          onClick={() => selectContext(contextId)}
                          draggable
                          onDragStart={startDrag(contextId, group.id)}
                          onDragOver={allowDragOver}
                          onDrop={dropOnItem(contextId, group.id)}
                        >
                          <div className="sidebar-item-title">
                            {editingContextId === contextId ? (
                              <input
                                className="sidebar-item-input"
                                value={editingName}
                                onChange={(event) => setEditingName(event.target.value)}
                                onBlur={submitRename}
                                onKeyDown={handleRenameKey}
                                autoFocus
                              />
                            ) : (
                              title
                            )}
                          </div>
                          <div className="sidebar-item-meta">
                            {formatSource(context.source)} · {context.cluster}
                            <span
                              className="edit-icon"
                              onClick={(event) => {
                                event.stopPropagation()
                                beginRename(contextId, title)
                              }}
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
                  {contextPrefs.ungrouped.map((contextId) => {
                    const context = ctxMap.get(contextId)
                    if (!context) return null

                    const title = getDisplayName(context)
                    const isActive = contextId === selectedId

                    return (
                      <button
                        key={contextId}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        onClick={() => selectContext(contextId)}
                        draggable
                        onDragStart={startDrag(contextId, '__ungrouped__')}
                        onDragOver={allowDragOver}
                        onDrop={dropOnItem(contextId, '__ungrouped__')}
                      >
                        <div className="sidebar-item-title">
                          {editingContextId === contextId ? (
                            <input
                              className="sidebar-item-input"
                              value={editingName}
                              onChange={(event) => setEditingName(event.target.value)}
                              onBlur={submitRename}
                              onKeyDown={handleRenameKey}
                              autoFocus
                            />
                          ) : (
                            title
                          )}
                        </div>
                        <div className="sidebar-item-meta">
                          {formatSource(context.source)} · {context.cluster}
                          <span
                            className="edit-icon"
                            onClick={(event) => {
                              event.stopPropagation()
                              beginRename(contextId, title)
                            }}
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
            contexts.map((context) => (
              <button
                key={context.id}
                className={`sidebar-item ${context.id === selectedId ? 'active' : ''}`}
                onClick={() => selectContext(context.id)}
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
            <div className="main-title">{selectedContextDisplayName}</div>
            {selectedContext && (
              <div className="main-subtitle">
                {selectedContext.cluster} · {selectedContext.user}
                <span className={`mode-badge ${isWebMode ? 'web' : 'desktop'}`}>
                  {isWebMode ? 'Web / Local Only' : 'Desktop'}
                </span>
              </div>
            )}
          </div>
          <div className="main-header-actions">
            <div className={`status-pill ${getStatusPillClass()}`}>
              {status === 'loading' && '加载中'}
              {status === 'ready' && '已连接'}
              {status === 'error' && '连接失败'}
              {status === 'idle' && '等待中'}
            </div>
            <div className={`watch-status ${watchConnected ? 'connected' : 'disconnected'}`}>
              {watchConnected ? 'Push Watch On' : 'Push Watch Off'}
            </div>
            <button
              className={`terminal-btn ${showTerminal ? 'active' : ''}`}
              onClick={toggleTerminal}
              title="终端"
            >
              Terminal
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {notice && <div className={`notice-banner ${notice.tone}`}>{notice.message}</div>}

        {contexts.length === 0 ? (
          <EmptyState onAdd={handleAddClick} />
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
              {selectedContext && (
                <section className="overview-section">
                  <div className="overview-grid">
                    <ClusterCard
                      context={selectedContext}
                      isActive
                      nodeCount={totalNodeCount}
                      podCount={totalPodCount}
                      status={selectedClusterCardStatus}
                      onClick={() => selectContext(selectedContext.id)}
                    />
                    <SummaryCard
                      label="Node 健康"
                      value={`${readyNodeCount}/${totalNodeCount}`}
                      detail={totalNodeCount === 0 ? '暂无节点数据' : `未就绪 ${Math.max(totalNodeCount - readyNodeCount, 0)} 个`}
                      tone={readyNodeCount === totalNodeCount ? 'ready' : 'warn'}
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
                </section>
              )}

              <section className="resource-section compact">
                <div className="resource-header">
                  <div className="resource-title">{currentResourceLabel}</div>
                  <div className="resource-header-meta">
                    <div className="resource-count">{currentResourceCount} 项</div>
                    {clusterHealth?.lastUpdated && (
                      <div className="resource-meta-text">
                        健康检查: {new Date(clusterHealth.lastUpdated).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="resource-toolbar">
                  <div className="resource-filters">
                    <div className="namespace-filter">
                      <select
                        className="namespace-select"
                        value={selectedNamespace}
                        onChange={(event) => setSelectedNamespaces(event.target.value ? [event.target.value] : [])}
                      >
                        <option value="">全部命名空间</option>
                        {namespaces.map((namespace) => (
                          <option key={namespace.name} value={namespace.name}>
                            {namespace.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="search-input-wrap">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="搜索资源名称或 namespace..."
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="create-controls">
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
        metrics={nodeMetrics}
        metricsLoading={nodeMetricsLoading}
        pods={selectedNode ? pods.filter((pod) => pod.nodeName === selectedNode.name) : []}
        events={selectedNode ? events.filter((event) => event.object === `Node/${selectedNode.name}`) : []}
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
        pod={selectedPodForPortForward}
        contextId={selectedId}
        onClose={() => setSelectedPodForPortForward(null)}
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

      {showTerminal && (
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
