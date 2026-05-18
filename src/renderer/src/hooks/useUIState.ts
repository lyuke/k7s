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
  const handleReplicationControllerClick = useUIStore((s) => s.handleReplicationControllerClick)
  const handleCloseReplicationControllerDetail = useUIStore((s) => s.handleCloseReplicationControllerDetail)
  const handleJobClick = useUIStore((s) => s.handleJobClick)
  const handleCloseJobDetail = useUIStore((s) => s.handleCloseJobDetail)
  const handleCronJobClick = useUIStore((s) => s.handleCronJobClick)
  const handleCloseCronJobDetail = useUIStore((s) => s.handleCloseCronJobDetail)
  const handleCloseHPADetail = useUIStore((s) => s.handleCloseHPADetail)
  const handleClosePodDisruptionBudgetDetail = useUIStore((s) => s.handleClosePodDisruptionBudgetDetail)
  const handleCloseResourceQuotaDetail = useUIStore((s) => s.handleCloseResourceQuotaDetail)
  const handleCloseLimitRangeDetail = useUIStore((s) => s.handleCloseLimitRangeDetail)
  const handleClosePersistentVolumeDetail = useUIStore((s) => s.handleClosePersistentVolumeDetail)
  const handleClosePersistentVolumeClaimDetail = useUIStore((s) => s.handleClosePersistentVolumeClaimDetail)
  const handleCloseStorageClassDetail = useUIStore((s) => s.handleCloseStorageClassDetail)

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
    selectedReplicationController,
    replicationControllerDetailLoading,
    selectedJob,
    jobDetailLoading,
    selectedCronJob,
    cronJobDetailLoading,
    selectedHPA,
    selectedPodDisruptionBudget,
    selectedResourceQuota,
    selectedLimitRange,
    selectedPersistentVolume,
    selectedPersistentVolumeClaim,
    selectedStorageClass,
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
    setSelectedReplicationController: useUIStore((s) => s.setSelectedReplicationController),
    setReplicationControllerDetailLoading: useUIStore((s) => s.setReplicationControllerDetailLoading),
    setSelectedJob: useUIStore((s) => s.setSelectedJob),
    setJobDetailLoading: useUIStore((s) => s.setJobDetailLoading),
    setSelectedCronJob: useUIStore((s) => s.setSelectedCronJob),
    setCronJobDetailLoading: useUIStore((s) => s.setCronJobDetailLoading),
    setSelectedHPA: useUIStore((s) => s.setSelectedHPA),
    setSelectedPodDisruptionBudget: useUIStore((s) => s.setSelectedPodDisruptionBudget),
    setSelectedResourceQuota: useUIStore((s) => s.setSelectedResourceQuota),
    setSelectedLimitRange: useUIStore((s) => s.setSelectedLimitRange),
    setSelectedPersistentVolume: useUIStore((s) => s.setSelectedPersistentVolume),
    setSelectedPersistentVolumeClaim: useUIStore((s) => s.setSelectedPersistentVolumeClaim),
    setSelectedStorageClass: useUIStore((s) => s.setSelectedStorageClass),
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
    handleReplicationControllerClick,
    handleCloseReplicationControllerDetail,
    handleJobClick,
    handleCloseJobDetail,
    handleCronJobClick,
    handleCloseCronJobDetail,
    handleCloseHPADetail,
    handleClosePodDisruptionBudgetDetail,
    handleCloseResourceQuotaDetail,
    handleCloseLimitRangeDetail,
    handleClosePersistentVolumeDetail,
    handleClosePersistentVolumeClaimDetail,
    handleCloseStorageClassDetail,
  }
}
