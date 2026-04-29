import { create } from 'zustand'
import type {
  ClusterHealth,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapInfo,
  ContextRecord,
  CronJobInfo,
  DaemonSetInfo,
  DeploymentInfo,
  EventInfo,
  HPAInfo,
  IngressInfo,
  JobInfo,
  NamespaceInfo,
  NodeInfo,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PodInfo,
  ReplicaSetInfo,
  RoleBindingInfo,
  RoleInfo,
  SecretInfo,
  ServiceAccountInfo,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
} from '../../../shared/types'
import { k8sApi } from '../api/provider'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

interface ClusterState {
  // State
  contexts: ContextRecord[]
  selectedId: string
  namespaces: NamespaceInfo[]
  selectedNamespaces: string[]
  nodes: NodeInfo[]
  pods: PodInfo[]
  deployments: DeploymentInfo[]
  daemonSets: DaemonSetInfo[]
  statefulSets: StatefulSetInfo[]
  replicaSets: ReplicaSetInfo[]
  jobs: JobInfo[]
  cronJobs: CronJobInfo[]
  services: ServiceInfo[]
  configMaps: ConfigMapInfo[]
  secrets: SecretInfo[]
  ingresses: IngressInfo[]
  persistentVolumes: PersistentVolumeInfo[]
  persistentVolumeClaims: PersistentVolumeClaimInfo[]
  storageClasses: StorageClassInfo[]
  serviceAccounts: ServiceAccountInfo[]
  roles: RoleInfo[]
  roleBindings: RoleBindingInfo[]
  clusterRoles: ClusterRoleInfo[]
  clusterRoleBindings: ClusterRoleBindingInfo[]
  hpas: HPAInfo[]
  events: EventInfo[]
  clusterHealth: ClusterHealth | null
  status: LoadState
  error: string
  isRefreshing: boolean
  lastRefreshTime: Date | null

  // Computed
  selectedContext: ContextRecord | undefined

  // Actions
  loadContexts: () => Promise<void>
  selectContext: (id: string) => void
  loadNamespaces: () => Promise<void>
  toggleNamespace: (ns: string) => void
  setSelectedNamespaces: (namespaces: string[]) => void
  loadResources: (isAutoRefresh?: boolean) => Promise<void>
  loadClusterHealth: () => Promise<void>
  loadNewResources: () => Promise<void>
  refreshAll: (isAutoRefresh?: boolean) => Promise<void>
  handleAdd: () => Promise<void>
  handleManualRefresh: () => void
  setIsRefreshing: (value: boolean) => void
}

export const useClusterStore = create<ClusterState>((set, get) => ({
  // Initial state
  contexts: [],
  selectedId: '',
  namespaces: [],
  selectedNamespaces: [],
  nodes: [],
  pods: [],
  deployments: [],
  daemonSets: [],
  statefulSets: [],
  replicaSets: [],
  jobs: [],
  cronJobs: [],
  services: [],
  configMaps: [],
  secrets: [],
  ingresses: [],
  persistentVolumes: [],
  persistentVolumeClaims: [],
  storageClasses: [],
  serviceAccounts: [],
  roles: [],
  roleBindings: [],
  clusterRoles: [],
  clusterRoleBindings: [],
  hpas: [],
  events: [],
  clusterHealth: null,
  status: 'idle',
  error: '',
  isRefreshing: false,
  lastRefreshTime: null,

  // Computed
  get selectedContext() {
    return get().contexts.find((context) => context.id === get().selectedId)
  },

  // Actions
  loadContexts: async () => {
    const { selectedId } = get()
    try {
      const list = await k8sApi.listContexts()
      set({ contexts: list })
      if (list.length === 0) {
        set({ selectedId: '' })
        return
      }
      const stillExists = list.some((item) => item.id === selectedId)
      if (!selectedId || !stillExists) {
        set({ selectedId: list[0].id, selectedNamespaces: [] })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载集群列表失败' })
    }
  },

  selectContext: (id: string) => {
    set({ selectedId: id, selectedNamespaces: [] })
  },

  loadNamespaces: async () => {
    const { selectedId } = get()
    if (!selectedId) return
    try {
      const list = await k8sApi.listNamespaces(selectedId)
      const available = new Set(list.map((item) => item.name))
      const selectedNamespaces = get().selectedNamespaces.filter((name) => available.has(name))
      set({ namespaces: list, selectedNamespaces })
    } catch {
      set({ namespaces: [] })
    }
  },

  toggleNamespace: (ns: string) => {
    const { selectedNamespaces } = get()
    const next = selectedNamespaces.includes(ns)
      ? selectedNamespaces.filter((name) => name !== ns)
      : [...selectedNamespaces, ns]
    set({ selectedNamespaces: next })
  },

  setSelectedNamespaces: (namespaces) => {
    set({ selectedNamespaces: namespaces })
  },

  loadResources: async (isAutoRefresh = false) => {
    const { selectedId } = get()
    if (!selectedId) return

    if (isAutoRefresh) {
      set({ isRefreshing: true })
    } else {
      set({ status: 'loading' })
    }
    set({ error: '' })

    try {
      const current = get()
      const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T => (
        result.status === 'fulfilled' ? result.value : fallback
      )
      const results = await Promise.allSettled([
        k8sApi.listNodes(selectedId),
        k8sApi.listPods(selectedId),
        k8sApi.listDeployments(selectedId),
        k8sApi.listDaemonSets(selectedId),
        k8sApi.listStatefulSets(selectedId),
        k8sApi.listReplicaSets(selectedId),
        k8sApi.listJobs(selectedId),
        k8sApi.listCronJobs(selectedId)
      ])
      const firstError = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      const hasData = results.some((result) => result.status === 'fulfilled')
      set({
        nodes: settledValue(results[0], current.nodes),
        pods: settledValue(results[1], current.pods),
        deployments: settledValue(results[2], current.deployments),
        daemonSets: settledValue(results[3], current.daemonSets),
        statefulSets: settledValue(results[4], current.statefulSets),
        replicaSets: settledValue(results[5], current.replicaSets),
        jobs: settledValue(results[6], current.jobs),
        cronJobs: settledValue(results[7], current.cronJobs),
        status: firstError ? 'error' : 'ready',
        error: firstError
          ? firstError.reason instanceof Error ? firstError.reason.message : String(firstError.reason)
          : '',
        lastRefreshTime: hasData ? new Date() : current.lastRefreshTime
      })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : '加载失败' })
    } finally {
      set({ isRefreshing: false })
    }
  },

  loadClusterHealth: async () => {
    const { selectedId } = get()
    if (!selectedId) return
    try {
      const health = await k8sApi.getClusterHealth(selectedId)
      set({ clusterHealth: health })
    } catch {
      set({ clusterHealth: null })
    }
  },

  loadNewResources: async () => {
    const { selectedId } = get()
    if (!selectedId) return

    try {
      const current = get()
      const settledValue = <T>(result: PromiseSettledResult<T>, fallback: T): T => (
        result.status === 'fulfilled' ? result.value : fallback
      )

      const results = await Promise.allSettled([
        k8sApi.listServices(selectedId),
        k8sApi.listConfigMaps(selectedId),
        k8sApi.listSecrets(selectedId),
        k8sApi.listIngresses(selectedId),
        k8sApi.listPersistentVolumes(selectedId),
        k8sApi.listPersistentVolumeClaims(selectedId),
        k8sApi.listStorageClasses(selectedId),
        k8sApi.listServiceAccounts(selectedId),
        k8sApi.listRoles(selectedId),
        k8sApi.listRoleBindings(selectedId),
        k8sApi.listClusterRoles(selectedId),
        k8sApi.listClusterRoleBindings(selectedId),
        k8sApi.listHPAs(selectedId),
        k8sApi.listEvents(selectedId)
      ])
      set({
        services: settledValue(results[0], current.services),
        configMaps: settledValue(results[1], current.configMaps),
        secrets: settledValue(results[2], current.secrets),
        ingresses: settledValue(results[3], current.ingresses),
        persistentVolumes: settledValue(results[4], current.persistentVolumes),
        persistentVolumeClaims: settledValue(results[5], current.persistentVolumeClaims),
        storageClasses: settledValue(results[6], current.storageClasses),
        serviceAccounts: settledValue(results[7], current.serviceAccounts),
        roles: settledValue(results[8], current.roles),
        roleBindings: settledValue(results[9], current.roleBindings),
        clusterRoles: settledValue(results[10], current.clusterRoles),
        clusterRoleBindings: settledValue(results[11], current.clusterRoleBindings),
        hpas: settledValue(results[12], current.hpas),
        events: settledValue(results[13], current.events)
      })
    } catch {
      // Silently fail for new resource types
    }
  },

  refreshAll: async (isAutoRefresh = false) => {
    const { selectedId, loadNamespaces, loadResources, loadClusterHealth, loadNewResources } = get()
    if (!selectedId) return

    await Promise.all([
      loadNamespaces(),
      loadResources(isAutoRefresh),
      loadClusterHealth(),
      loadNewResources(),
    ])
  },

  handleAdd: async () => {
    const { selectedId, contexts } = get()
    set({ error: '' })
    try {
      const result = await k8sApi.addKubeconfigFile()
      set({ contexts: result.contexts })
      if (result.addedIds.length > 0) {
        set({ selectedId: result.addedIds[0], selectedNamespaces: [] })
      } else if (!selectedId && result.contexts.length > 0) {
        set({ selectedId: result.contexts[0].id, selectedNamespaces: [] })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加配置失败' })
    }
  },

  handleManualRefresh: () => {
    const { selectedId, refreshAll } = get()
    if (selectedId) {
      void refreshAll(true)
    }
  },

  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value })
  }
}))
