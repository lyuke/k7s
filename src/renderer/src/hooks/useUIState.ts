// Thin wrapper around uiStore for backward compatibility
import { useUIStore } from '../store'
import type { NamespaceInfo } from '../../../shared/types'

export const useUIState = (
  namespaces: NamespaceInfo[],
  nsSearchText: string,
  _setNsSearchText: (text: string) => void
) => {
  const searchText = useUIStore((s) => s.searchText)
  const sortField = useUIStore((s) => s.sortField)
  const sortDirection = useUIStore((s) => s.sortDirection)
  const refreshInterval = useUIStore((s) => s.refreshInterval)
  const selectedResourceType = useUIStore((s) => s.selectedResourceType)
  const selectedNode = useUIStore((s) => s.selectedNode)
  const nodeDetailLoading = useUIStore((s) => s.nodeDetailLoading)
  const selectedPod = useUIStore((s) => s.selectedPod)
  const podDetailLoading = useUIStore((s) => s.podDetailLoading)
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
  const filteredNamespaces = useUIStore((s) => s.filterData(namespaces))
  const handleSort = useUIStore((s) => s.handleSort)
  const sortData = useUIStore((s) => s.sortData)
  const filterData = useUIStore((s) => s.filterData)
  const handleNodeClick = useUIStore((s) => s.handleNodeClick)
  const handleCloseNodeDetail = useUIStore((s) => s.handleCloseNodeDetail)
  const handlePodClick = useUIStore((s) => s.handlePodClick)
  const handleClosePodDetail = useUIStore((s) => s.handleClosePodDetail)
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

  return {
    searchText,
    sortField,
    sortDirection,
    refreshInterval,
    selectedResourceType,
    nsSearchText,
    selectedNode,
    nodeDetailLoading,
    selectedPod,
    podDetailLoading,
    selectedDeployment,
    deploymentDetailLoading,
    selectedDaemonSet,
    daemonSetDetailLoading,
    selectedStatefulSet,
    statefulSetDetailLoading,
    selectedReplicaSet,
    replicaSetDetailLoading,
    selectedJob,
    jobDetailLoading,
    selectedCronJob,
    cronJobDetailLoading,
    filteredNamespaces,
    setSearchText: useUIStore((s) => s.setSearchText),
    setSortField: useUIStore((s) => s.setSortField),
    setSortDirection: useUIStore((s) => s.setSortDirection),
    setRefreshInterval: useUIStore((s) => s.setRefreshInterval),
    setSelectedResourceType: useUIStore((s) => s.setSelectedResourceType),
    setNsSearchText: useUIStore((s) => s.setNsSearchText),
    setSelectedNode: useUIStore((s) => s.setSelectedNode),
    setNodeDetailLoading: useUIStore((s) => s.setNodeDetailLoading),
    setSelectedPod: useUIStore((s) => s.setSelectedPod),
    setPodDetailLoading: useUIStore((s) => s.setPodDetailLoading),
    setSelectedDeployment: useUIStore((s) => s.setSelectedDeployment),
    setDeploymentDetailLoading: useUIStore((s) => s.setDeploymentDetailLoading),
    setSelectedDaemonSet: useUIStore((s) => s.setSelectedDaemonSet),
    setDaemonSetDetailLoading: useUIStore((s) => s.setDaemonSetDetailLoading),
    setSelectedStatefulSet: useUIStore((s) => s.setSelectedStatefulSet),
    setStatefulSetDetailLoading: useUIStore((s) => s.setStatefulSetDetailLoading),
    setSelectedReplicaSet: useUIStore((s) => s.setSelectedReplicaSet),
    setReplicaSetDetailLoading: useUIStore((s) => s.setReplicaSetDetailLoading),
    setSelectedJob: useUIStore((s) => s.setSelectedJob),
    setJobDetailLoading: useUIStore((s) => s.setJobDetailLoading),
    setSelectedCronJob: useUIStore((s) => s.setSelectedCronJob),
    setCronJobDetailLoading: useUIStore((s) => s.setCronJobDetailLoading),
    handleSort,
    sortData,
    filterData,
    handleNodeClick,
    handleCloseNodeDetail,
    handlePodClick,
    handleClosePodDetail,
    handleDeploymentClick,
    handleCloseDeploymentDetail,
    handleDaemonSetClick,
    handleCloseDaemonSetDetail,
    handleStatefulSetClick,
    handleCloseStatefulSetDetail,
    handleReplicaSetClick,
    handleCloseReplicaSetDetail,
    handleJobClick,
    handleCloseJobDetail,
    handleCronJobClick,
    handleCloseCronJobDetail,
  }
}
