import { create } from 'zustand'
import { ResourceType } from '../../../shared/types'
import { k8sApi } from '../api/provider'

type SortDirection = 'asc' | 'desc'

interface UIState {
  // State
  searchText: string
  sortField: string
  sortDirection: SortDirection
  refreshInterval: number
  selectedResourceType: ResourceType
  nsSearchText: string

  // Node modal
  selectedNode: import('../../../shared/types').NodeInfo | null
  nodeDetailLoading: boolean
  nodeMetrics: import('../../../shared/types').NodeMetrics | null
  nodeMetricsLoading: boolean

  // Pod modal
  selectedPod: import('../../../shared/types').PodInfo | null
  podDetailLoading: boolean
  podDetailError: string | null

  // Pod log viewer modal
  selectedPodForLogs: import('../../../shared/types').PodInfo | null

  // Deployment modal
  selectedDeployment: import('../../../shared/types').DeploymentInfo | null
  deploymentDetailLoading: boolean

  // DaemonSet modal
  selectedDaemonSet: import('../../../shared/types').DaemonSetInfo | null
  daemonSetDetailLoading: boolean

  // StatefulSet modal
  selectedStatefulSet: import('../../../shared/types').StatefulSetInfo | null
  statefulSetDetailLoading: boolean

  // ReplicaSet modal
  selectedReplicaSet: import('../../../shared/types').ReplicaSetInfo | null
  replicaSetDetailLoading: boolean

  // Job modal
  selectedJob: import('../../../shared/types').JobInfo | null
  jobDetailLoading: boolean

  // CronJob modal
  selectedCronJob: import('../../../shared/types').CronJobInfo | null
  cronJobDetailLoading: boolean

  // Create resource modal
  isCreateModalOpen: boolean

  // YAML editor modal
  isYamlEditorOpen: boolean
  yamlEditorMode: 'view' | 'edit' | 'create'
  yamlEditorResource: {
    kind: string
    namespace: string
    name: string
  } | null

  // Actions
  setSearchText: (text: string) => void
  setSortField: (field: string) => void
  setSortDirection: (direction: SortDirection) => void
  setRefreshInterval: (interval: number) => void
  setSelectedResourceType: (type: ResourceType) => void
  setNsSearchText: (text: string) => void
  setSelectedNode: (node: import('../../../shared/types').NodeInfo | null) => void
  setNodeDetailLoading: (loading: boolean) => void
  setNodeMetrics: (metrics: import('../../../shared/types').NodeMetrics | null) => void
  setNodeMetricsLoading: (loading: boolean) => void
  setSelectedPod: (pod: import('../../../shared/types').PodInfo | null) => void
  setPodDetailLoading: (loading: boolean) => void
  setPodDetailError: (error: string | null) => void
  setSelectedPodForLogs: (pod: import('../../../shared/types').PodInfo | null) => void
  setSelectedDeployment: (deploy: import('../../../shared/types').DeploymentInfo | null) => void
  setDeploymentDetailLoading: (loading: boolean) => void
  setSelectedDaemonSet: (ds: import('../../../shared/types').DaemonSetInfo | null) => void
  setDaemonSetDetailLoading: (loading: boolean) => void
  setSelectedStatefulSet: (sts: import('../../../shared/types').StatefulSetInfo | null) => void
  setStatefulSetDetailLoading: (loading: boolean) => void
  setSelectedReplicaSet: (rs: import('../../../shared/types').ReplicaSetInfo | null) => void
  setReplicaSetDetailLoading: (loading: boolean) => void
  setSelectedJob: (job: import('../../../shared/types').JobInfo | null) => void
  setJobDetailLoading: (loading: boolean) => void
  setSelectedCronJob: (cj: import('../../../shared/types').CronJobInfo | null) => void
  setCronJobDetailLoading: (loading: boolean) => void
  setIsCreateModalOpen: (open: boolean) => void
  setIsYamlEditorOpen: (open: boolean, mode?: 'view' | 'edit' | 'create', resource?: { kind: string; namespace: string; name: string }) => void

  // Computed / Utility
  handleSort: (field: string) => void
  sortData: <T extends Record<string, unknown>>(data: T[]) => T[]
  filterData: <T extends { name?: string; namespace?: string }>(data: T[]) => T[]

  // Detail handlers
  handleNodeClick: (nodeName: string, contextId: string) => Promise<void>
  handleCloseNodeDetail: () => void
  handlePodClick: (pod: import('../../../shared/types').PodInfo, contextId: string) => Promise<void>
  handleClosePodDetail: () => void
  handleOpenPodLogs: (pod: import('../../../shared/types').PodInfo) => void
  handleClosePodLogs: () => void
  handleDeploymentClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseDeploymentDetail: () => void
  handleDaemonSetClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseDaemonSetDetail: () => void
  handleStatefulSetClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseStatefulSetDetail: () => void
  handleReplicaSetClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseReplicaSetDetail: () => void
  handleJobClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseJobDetail: () => void
  handleCronJobClick: (namespace: string, name: string, contextId: string) => Promise<void>
  handleCloseCronJobDetail: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  searchText: '',
  sortField: '',
  sortDirection: 'asc' as SortDirection,
  refreshInterval: 30,
  selectedResourceType: 'pods' as ResourceType,
  nsSearchText: '',
  selectedNode: null,
  nodeDetailLoading: false,
  nodeMetrics: null,
  nodeMetricsLoading: false,
  selectedPod: null,
  podDetailLoading: false,
  podDetailError: null,
  selectedPodForLogs: null,
  selectedDeployment: null,
  deploymentDetailLoading: false,
  selectedDaemonSet: null,
  daemonSetDetailLoading: false,
  selectedStatefulSet: null,
  statefulSetDetailLoading: false,
  selectedReplicaSet: null,
  replicaSetDetailLoading: false,
  selectedJob: null,
  jobDetailLoading: false,
  selectedCronJob: null,
  cronJobDetailLoading: false,
  isCreateModalOpen: false,
  isYamlEditorOpen: false,
  yamlEditorMode: 'view' as 'view' | 'edit' | 'create',
  yamlEditorResource: null,

  // Setters
  setSearchText: (text) => set({ searchText: text }),
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  setSelectedResourceType: (type) => set({ selectedResourceType: type }),
  setNsSearchText: (text) => set({ nsSearchText: text }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setNodeDetailLoading: (loading) => set({ nodeDetailLoading: loading }),
  setNodeMetrics: (metrics) => set({ nodeMetrics: metrics }),
  setNodeMetricsLoading: (loading) => set({ nodeMetricsLoading: loading }),
  setSelectedPod: (pod) => set({ selectedPod: pod }),
  setPodDetailLoading: (loading) => set({ podDetailLoading: loading }),
  setPodDetailError: (error) => set({ podDetailError: error }),
  setSelectedPodForLogs: (pod) => set({ selectedPodForLogs: pod }),
  setSelectedDeployment: (deploy) => set({ selectedDeployment: deploy }),
  setDeploymentDetailLoading: (loading) => set({ deploymentDetailLoading: loading }),
  setSelectedDaemonSet: (ds) => set({ selectedDaemonSet: ds }),
  setDaemonSetDetailLoading: (loading) => set({ daemonSetDetailLoading: loading }),
  setSelectedStatefulSet: (sts) => set({ selectedStatefulSet: sts }),
  setStatefulSetDetailLoading: (loading) => set({ statefulSetDetailLoading: loading }),
  setSelectedReplicaSet: (rs) => set({ selectedReplicaSet: rs }),
  setReplicaSetDetailLoading: (loading) => set({ replicaSetDetailLoading: loading }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  setJobDetailLoading: (loading) => set({ jobDetailLoading: loading }),
  setSelectedCronJob: (cj) => set({ selectedCronJob: cj }),
  setCronJobDetailLoading: (loading) => set({ cronJobDetailLoading: loading }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setIsYamlEditorOpen: (open, mode = 'view', resource = null) => set({
    isYamlEditorOpen: open,
    yamlEditorMode: mode,
    yamlEditorResource: resource
  }),

  // Sort and filter
  handleSort: (field) => {
    const { sortField, sortDirection } = get()
    if (sortField === field) {
      set({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' })
    } else {
      set({ sortField: field, sortDirection: 'asc' })
    }
  },

  sortData: <T extends Record<string, unknown>>(data: T[]): T[] => {
    const { sortField, sortDirection } = get()
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
  },

  filterData: <T extends { name?: string; namespace?: string }>(data: T[]): T[] => {
    const { searchText } = get()
    if (!searchText) return data
    const lower = searchText.toLowerCase()
    return data.filter(item =>
      (item.name?.toLowerCase().includes(lower)) ||
      (item.namespace?.toLowerCase().includes(lower))
    )
  },

  // Node handlers
  handleNodeClick: async (nodeName, contextId) => {
    if (!contextId) return
    set({ nodeDetailLoading: true, nodeMetricsLoading: true, selectedNode: null, nodeMetrics: null })
    try {
      const [detail, metrics] = await Promise.all([
        k8sApi.getNodeDetail(contextId, nodeName),
        k8sApi.getNodeMetrics(contextId, nodeName)
      ])
      set({ selectedNode: detail, nodeMetrics: metrics })
    } catch (err) {
      console.error('获取节点详情失败:', err)
    } finally {
      set({ nodeDetailLoading: false, nodeMetricsLoading: false })
    }
  },

  handleCloseNodeDetail: () => {
    set({ selectedNode: null, nodeDetailLoading: false, nodeMetrics: null, nodeMetricsLoading: false })
  },

  // Pod handlers
  handlePodClick: async (pod, contextId) => {
    if (!contextId) return
    set({ podDetailLoading: true, podDetailError: null, selectedPod: pod })
    try {
      const detail = await k8sApi.getPodDetail(contextId, pod.namespace, pod.name)
      set({ selectedPod: detail, podDetailError: null })
    } catch (err) {
      console.error('获取Pod详情失败:', err)
      set({
        selectedPod: pod,
        podDetailError: err instanceof Error ? err.message : '获取Pod详情失败'
      })
    } finally {
      set({ podDetailLoading: false })
    }
  },

  handleClosePodDetail: () => {
    set({ selectedPod: null, podDetailLoading: false, podDetailError: null })
  },

  handleOpenPodLogs: (pod: import('../../../shared/types').PodInfo) => {
    set({ selectedPodForLogs: pod })
  },

  handleClosePodLogs: () => {
    set({ selectedPodForLogs: null })
  },

  // Deployment handlers
  handleDeploymentClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ deploymentDetailLoading: true, selectedDeployment: null })
    try {
      const detail = await k8sApi.getDeploymentDetail(contextId, namespace, name)
      set({ selectedDeployment: detail })
    } catch (err) {
      console.error('获取Deployment详情失败:', err)
    } finally {
      set({ deploymentDetailLoading: false })
    }
  },

  handleCloseDeploymentDetail: () => {
    set({ selectedDeployment: null, deploymentDetailLoading: false })
  },

  // DaemonSet handlers
  handleDaemonSetClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ daemonSetDetailLoading: true, selectedDaemonSet: null })
    try {
      const detail = await k8sApi.getDaemonSetDetail(contextId, namespace, name)
      set({ selectedDaemonSet: detail })
    } catch (err) {
      console.error('获取DaemonSet详情失败:', err)
    } finally {
      set({ daemonSetDetailLoading: false })
    }
  },

  handleCloseDaemonSetDetail: () => {
    set({ selectedDaemonSet: null, daemonSetDetailLoading: false })
  },

  // StatefulSet handlers
  handleStatefulSetClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ statefulSetDetailLoading: true, selectedStatefulSet: null })
    try {
      const detail = await k8sApi.getStatefulSetDetail(contextId, namespace, name)
      set({ selectedStatefulSet: detail })
    } catch (err) {
      console.error('获取StatefulSet详情失败:', err)
    } finally {
      set({ statefulSetDetailLoading: false })
    }
  },

  handleCloseStatefulSetDetail: () => {
    set({ selectedStatefulSet: null, statefulSetDetailLoading: false })
  },

  // ReplicaSet handlers
  handleReplicaSetClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ replicaSetDetailLoading: true, selectedReplicaSet: null })
    try {
      const detail = await k8sApi.getReplicaSetDetail(contextId, namespace, name)
      set({ selectedReplicaSet: detail })
    } catch (err) {
      console.error('获取ReplicaSet详情失败:', err)
    } finally {
      set({ replicaSetDetailLoading: false })
    }
  },

  handleCloseReplicaSetDetail: () => {
    set({ selectedReplicaSet: null, replicaSetDetailLoading: false })
  },

  // Job handlers
  handleJobClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ jobDetailLoading: true, selectedJob: null })
    try {
      const detail = await k8sApi.getJobDetail(contextId, namespace, name)
      set({ selectedJob: detail })
    } catch (err) {
      console.error('获取Job详情失败:', err)
    } finally {
      set({ jobDetailLoading: false })
    }
  },

  handleCloseJobDetail: () => {
    set({ selectedJob: null, jobDetailLoading: false })
  },

  // CronJob handlers
  handleCronJobClick: async (namespace, name, contextId) => {
    if (!contextId) return
    set({ cronJobDetailLoading: true, selectedCronJob: null })
    try {
      const detail = await k8sApi.getCronJobDetail(contextId, namespace, name)
      set({ selectedCronJob: detail })
    } catch (err) {
      console.error('获取CronJob详情失败:', err)
    } finally {
      set({ cronJobDetailLoading: false })
    }
  },

  handleCloseCronJobDetail: () => {
    set({ selectedCronJob: null, cronJobDetailLoading: false })
  },
}))
