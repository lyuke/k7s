// Thin wrapper around clusterStore for backward compatibility
import { useClusterStore } from '../store'

export const useKubernetes = () => {
  const contexts = useClusterStore((s) => s.contexts)
  const namespaces = useClusterStore((s) => s.namespaces)
  const selectedNamespaces = useClusterStore((s) => s.selectedNamespaces)
  const selectedId = useClusterStore((s) => s.selectedId)
  const nodes = useClusterStore((s) => s.nodes)
  const pods = useClusterStore((s) => s.pods)
  const deployments = useClusterStore((s) => s.deployments)
  const daemonSets = useClusterStore((s) => s.daemonSets)
  const statefulSets = useClusterStore((s) => s.statefulSets)
  const replicaSets = useClusterStore((s) => s.replicaSets)
  const jobs = useClusterStore((s) => s.jobs)
  const cronJobs = useClusterStore((s) => s.cronJobs)
  const status = useClusterStore((s) => s.status)
  const error = useClusterStore((s) => s.error)
  const isRefreshing = useClusterStore((s) => s.isRefreshing)
  const lastRefreshTime = useClusterStore((s) => s.lastRefreshTime)
  const selectedContext = useClusterStore((s) => s.selectedContext)
  const loadContexts = useClusterStore((s) => s.loadContexts)
  const loadNamespaces = useClusterStore((s) => s.loadNamespaces)
  const loadResources = useClusterStore((s) => s.loadResources)
  const handleAdd = useClusterStore((s) => s.handleAdd)
  const handleManualRefresh = useClusterStore((s) => s.handleManualRefresh)

  return {
    contexts,
    namespaces,
    selectedNamespaces,
    selectedId,
    nodes,
    pods,
    deployments,
    daemonSets,
    statefulSets,
    replicaSets,
    jobs,
    cronJobs,
    status,
    error,
    isRefreshing,
    lastRefreshTime,
    selectedContext,
    setSelectedId: useClusterStore((s) => s.selectContext),
    toggleNamespace: useClusterStore((s) => s.toggleNamespace),
    setSelectedNamespaces: useClusterStore((s) => s.setSelectedNamespaces),
    loadContexts,
    loadNamespaces,
    loadResources,
    handleAdd,
    handleManualRefresh,
  }
}
