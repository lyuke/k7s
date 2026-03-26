import { useEffect, useMemo, useRef, useState } from 'react'
import '@xterm/xterm/css/xterm.css'
import { useClusterStore, useUIStore, usePreferencesStore, useTerminalStore, useTerminalInit } from './store'
import {
  ContextRecord,
  ResourceType,
  ContextPrefs,
} from '../../shared/types'
import { NodeDetailModal, PodDetailModal, DeploymentDetailModal, GenericDetailModal, LogViewerModal, CreateResourceModal, YamlEditorModal } from './components/Modals'
import { EmptyState, SortIcon } from './components/Clusters'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

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
  { key: 'ingresses', label: 'Ingress' }
]

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

const App = () => {
  // Cluster store
  const contexts = useClusterStore((s) => s.contexts)
  const selectedId = useClusterStore((s) => s.selectedId)
  const namespaces = useClusterStore((s) => s.namespaces)
  const selectedNamespace = useClusterStore((s) => s.selectedNamespace)
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
  const clusterHealth = useClusterStore((s) => s.clusterHealth)
  const status = useClusterStore((s) => s.status)
  const error = useClusterStore((s) => s.error)
  const isRefreshing = useClusterStore((s) => s.isRefreshing)
  const lastRefreshTime = useClusterStore((s) => s.lastRefreshTime)
  const selectedContext = useClusterStore((s) => s.selectedContext)
  const loadContexts = useClusterStore((s) => s.loadContexts)
  const selectContext = useClusterStore((s) => s.selectContext)
  const loadNamespaces = useClusterStore((s) => s.loadNamespaces)
  const selectNamespace = useClusterStore((s) => s.selectNamespace)
  const loadResources = useClusterStore((s) => s.loadResources)
  const loadClusterHealth = useClusterStore((s) => s.loadClusterHealth)
  const loadNewResources = useClusterStore((s) => s.loadNewResources)
  const handleAdd = useClusterStore((s) => s.handleAdd)
  const handleManualRefresh = useClusterStore((s) => s.handleManualRefresh)

  // UI store
  const searchText = useUIStore((s) => s.searchText)
  const sortField = useUIStore((s) => s.sortField)
  const sortDirection = useUIStore((s) => s.sortDirection)
  const refreshInterval = useUIStore((s) => s.refreshInterval)
  const selectedResourceType = useUIStore((s) => s.selectedResourceType)
  const nsSearchText = useUIStore((s) => s.nsSearchText)
  const setSearchText = useUIStore((s) => s.setSearchText)
  const setSortField = useUIStore((s) => s.setSortField)
  const setSortDirection = useUIStore((s) => s.setSortDirection)
  const setRefreshInterval = useUIStore((s) => s.setRefreshInterval)
  const setSelectedResourceType = useUIStore((s) => s.setSelectedResourceType)
  const setNsSearchText = useUIStore((s) => s.setNsSearchText)
  const sortData = useUIStore((s) => s.sortData)
  const filterData = useUIStore((s) => s.filterData)
  const handleSort = useUIStore((s) => s.handleSort)

  // Detail modal states
  const selectedNode = useUIStore((s) => s.selectedNode)
  const nodeDetailLoading = useUIStore((s) => s.nodeDetailLoading)
  const selectedPod = useUIStore((s) => s.selectedPod)
  const podDetailLoading = useUIStore((s) => s.podDetailLoading)
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
  const dragging = usePreferencesStore((s) => s.dragging)
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
  const terminalContainerRef = useTerminalStore((s) => s.terminalContainerRef)
  const toggleTerminal = useTerminalStore((s) => s.toggleTerminal)
  const setShowTerminal = useTerminalStore((s) => s.setShowTerminal)
  const setTerminalContainerRef = useTerminalStore((s) => s.setTerminalContainerRef)

  // Initialize terminal with effect
  useTerminalInit(showTerminal, selectedId, terminalContainerRef)

  // Additional local state
  const [isAdding, setIsAdding] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Context map for quick lookup
  const ctxMap = useMemo(() => {
    const m = new Map<string, ContextRecord>()
    for (const c of contexts) m.set(c.id, c)
    return m
  }, [contexts])

  const filteredNamespaces = useMemo(() => {
    const q = nsSearchText.trim().toLowerCase()
    if (!q) return namespaces
    return namespaces.filter((ns) => ns.name.toLowerCase().includes(q))
  }, [namespaces, nsSearchText])

  // Load context preferences on mount
  useEffect(() => {
    loadContextPrefs()
  }, [loadContextPrefs])

  // Initial load of contexts
  useEffect(() => {
    loadContexts()
  }, [loadContexts])

  // Load namespaces and resources when selected context or namespace changes
  useEffect(() => {
    if (selectedId) {
      loadNamespaces()
      loadResources()
      loadClusterHealth()
      loadNewResources()
    }
  }, [selectedId, selectedNamespace, loadNamespaces, loadResources, loadClusterHealth, loadNewResources])

  // Refresh timer effect
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
        loadResources(true)
      }
    }, refreshInterval * 1000)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [selectedId, selectedNamespace, refreshInterval, loadResources])

  // Handle add with loading state
  const handleAddClick = async () => {
    setIsAdding(true)
    await handleAdd()
    setIsAdding(false)
  }

  // Status pill class
  const getStatusPillClass = () => {
    if (status === 'loading') return 'loading'
    if (status === 'ready') return 'ready'
    if (status === 'error') return 'error'
    return ''
  }

  // Set terminal container ref
  const setTerminalRef = (ref: HTMLDivElement | null) => {
    setTerminalContainerRef({ current: ref } as React.RefObject<HTMLDivElement | null>)
  }

  // Render resource table based on selected type
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
              <div className="table-row clickable" key={node.name} onClick={() => handleNodeClick(node.name, selectedId)}>
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
              <div className="table-row clickable" key={`${pod.namespace}-${pod.name}`} onClick={() => handlePodClick(pod.namespace, pod.name, selectedId)}>
                <div>{pod.name}</div>
                <div>{pod.namespace}</div>
                <div className={`status ${pod.status === 'Running' ? 'ok' : 'warn'}`}>{pod.status}</div>
                <div>{pod.nodeName}</div>
                <div>{pod.restarts}</div>
                <div>{pod.age}</div>
                <div className="table-row-actions">
                  <button
                    className="action-btn logs-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPodLogs(pod)
                    }}
                    title="查看日志"
                  >
                    Logs
                  </button>
                </div>
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
              <div className="table-row clickable" key={`${deploy.namespace}-${deploy.name}`} onClick={() => handleDeploymentClick(deploy.namespace, deploy.name, selectedId)}>
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
              <div className="table-row clickable" key={`${ds.namespace}-${ds.name}`} onClick={() => handleDaemonSetClick(ds.namespace, ds.name, selectedId)}>
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
              <div className="table-row clickable" key={`${sts.namespace}-${sts.name}`} onClick={() => handleStatefulSetClick(sts.namespace, sts.name, selectedId)}>
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
              <div className="table-row clickable" key={`${rs.namespace}-${rs.name}`} onClick={() => handleReplicaSetClick(rs.namespace, rs.name, selectedId)}>
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
              <div className="table-row clickable" key={`${job.namespace}-${job.name}`} onClick={() => handleJobClick(job.namespace, job.name, selectedId)}>
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
              <div className="table-row clickable" key={`${cj.namespace}-${cj.name}`} onClick={() => handleCronJobClick(cj.namespace, cj.name, selectedId)}>
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

      case 'services':
        const filteredServices = filterData(services)
        const sortedServices = sortData(filteredServices)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('type')}>类型 <SortIcon direction={sortField === 'type' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('clusterIP')}>Cluster IP <SortIcon direction={sortField === 'clusterIP' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('ports')}>端口 <SortIcon direction={sortField === 'ports' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedServices.map((svc) => (
              <div className="table-row clickable" key={`${svc.namespace}-${svc.name}`}>
                <div>{svc.name}</div>
                <div>{svc.namespace}</div>
                <div>{svc.type}</div>
                <div>{svc.clusterIP}</div>
                <div>{svc.ports}</div>
                <div>{svc.age}</div>
                <div className="table-row-actions">
                  <button
                    className="action-btn yaml-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsYamlEditorOpen(true, 'view', { kind: 'Service', namespace: svc.namespace, name: svc.name })
                    }}
                    title="View YAML"
                  >
                    YAML
                  </button>
                </div>
              </div>
            ))}
            {sortedServices.length === 0 && <div className="table-empty">暂无Service数据</div>}
          </div>
        )

      case 'configmaps':
        const filteredConfigMaps = filterData(configMaps)
        const sortedConfigMaps = sortData(filteredConfigMaps)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedConfigMaps.map((cm) => (
              <div className="table-row clickable" key={`${cm.namespace}-${cm.name}`}>
                <div>{cm.name}</div>
                <div>{cm.namespace}</div>
                <div>{cm.age}</div>
                <div className="table-row-actions">
                  <button
                    className="action-btn yaml-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsYamlEditorOpen(true, 'view', { kind: 'ConfigMap', namespace: cm.namespace, name: cm.name })
                    }}
                    title="View YAML"
                  >
                    YAML
                  </button>
                </div>
              </div>
            ))}
            {sortedConfigMaps.length === 0 && <div className="table-empty">暂无ConfigMap数据</div>}
          </div>
        )

      case 'secrets':
        const filteredSecrets = filterData(secrets)
        const sortedSecrets = sortData(filteredSecrets)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('type')}>类型 <SortIcon direction={sortField === 'type' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedSecrets.map((secret) => (
              <div className="table-row clickable" key={`${secret.namespace}-${secret.name}`}>
                <div>{secret.name}</div>
                <div>{secret.namespace}</div>
                <div>{secret.type}</div>
                <div>{secret.age}</div>
                <div className="table-row-actions">
                  <button
                    className="action-btn yaml-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsYamlEditorOpen(true, 'view', { kind: 'Secret', namespace: secret.namespace, name: secret.name })
                    }}
                    title="View YAML"
                  >
                    YAML
                  </button>
                </div>
              </div>
            ))}
            {sortedSecrets.length === 0 && <div className="table-empty">暂无Secret数据</div>}
          </div>
        )

      case 'ingresses':
        const filteredIngresses = filterData(ingresses)
        const sortedIngresses = sortData(filteredIngresses)
        return (
          <div className="table">
            <div className="table-row table-head">
              <div onClick={handleHeaderClick('name')}>名称 <SortIcon direction={sortField === 'name' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('namespace')}>命名空间 <SortIcon direction={sortField === 'namespace' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('hosts')}>主机 <SortIcon direction={sortField === 'hosts' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('address')}>地址 <SortIcon direction={sortField === 'address' ? sortDirection : undefined} /></div>
              <div onClick={handleHeaderClick('age')}>存活 <SortIcon direction={sortField === 'age' ? sortDirection : undefined} /></div>
            </div>
            {sortedIngresses.map((ing) => (
              <div className="table-row clickable" key={`${ing.namespace}-${ing.name}`}>
                <div>{ing.name}</div>
                <div>{ing.namespace}</div>
                <div>{ing.hosts}</div>
                <div>{ing.address || '-'}</div>
                <div>{ing.age}</div>
                <div className="table-row-actions">
                  <button
                    className="action-btn yaml-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsYamlEditorOpen(true, 'view', { kind: 'Ingress', namespace: ing.namespace, name: ing.name })
                    }}
                    title="View YAML"
                  >
                    YAML
                  </button>
                </div>
              </div>
            ))}
            {sortedIngresses.length === 0 && <div className="table-empty">暂无Ingress数据</div>}
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
                          onClick={() => selectContext(cid)}
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
                        onClick={() => selectContext(cid)}
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
            onClick={toggleTerminal}
            title="终端"
          >
            Terminal
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

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
              <section className="resource-section compact">
                <div className="resource-toolbar">
                  <div className="resource-filters">
                    <div className="namespace-filter">
                      <select
                        className="namespace-select"
                        value={selectedNamespace}
                        onChange={(e) => selectNamespace(e.target.value)}
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
                  <div className="create-controls">
                    <button
                      className="create-btn"
                      onClick={() => setIsCreateModalOpen(true)}
                      title="创建资源"
                    >
                      + Create
                    </button>
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
      <LogViewerModal
        pod={selectedPodForLogs}
        contextId={selectedId}
        onClose={handleClosePodLogs}
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
        namespace={selectedNamespace}
        onSuccess={() => {
          loadResources()
          loadNewResources()
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
            loadResources()
            loadNewResources()
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
          <div className="terminal-container" ref={setTerminalRef} />
        </div>
      )}
    </div>
  )
}

export default App
