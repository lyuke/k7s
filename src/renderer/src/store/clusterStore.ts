import { create } from 'zustand'
import {
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
  selectedNamespace: string
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
  selectNamespace: (ns: string) => void
  loadResources: (isAutoRefresh?: boolean) => Promise<void>
  loadClusterHealth: () => Promise<void>
  loadNewResources: () => Promise<void>
  handleAdd: () => Promise<void>
  handleManualRefresh: () => void
  setIsRefreshing: (value: boolean) => void
}

export const useClusterStore = create<ClusterState>((set, get) => ({
  // Initial state
  contexts: [],
  selectedId: '',
  namespaces: [],
  selectedNamespace: 'all',
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
        set({ selectedId: list[0].id })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载集群列表失败' })
    }
  },

  selectContext: (id: string) => {
    set({ selectedId: id })
  },

  loadNamespaces: async () => {
    const { selectedId } = get()
    if (!selectedId) return
    try {
      const list = await k8sApi.listNamespaces(selectedId)
      set({ namespaces: list })
    } catch {
      set({ namespaces: [] })
    }
  },

  selectNamespace: (ns: string) => {
    set({ selectedNamespace: ns })
  },

  loadResources: async (isAutoRefresh = false) => {
    const { selectedId, selectedNamespace } = get()
    if (!selectedId) return

    if (isAutoRefresh) {
      set({ isRefreshing: true })
    } else {
      set({ status: 'loading' })
    }
    set({ error: '' })

    try {
      const ns = selectedNamespace === 'all' ? undefined : selectedNamespace
      const [nodeList, podList, deployList, dsList, stsList, rsList, jobList, cjList] = await Promise.all([
        k8sApi.listNodes(selectedId),
        k8sApi.listPods(selectedId, ns),
        k8sApi.listDeployments(selectedId, ns),
        k8sApi.listDaemonSets(selectedId, ns),
        k8sApi.listStatefulSets(selectedId, ns),
        k8sApi.listReplicaSets(selectedId, ns),
        k8sApi.listJobs(selectedId, ns),
        k8sApi.listCronJobs(selectedId, ns)
      ])
      set({
        nodes: nodeList,
        pods: podList,
        deployments: deployList,
        daemonSets: dsList,
        statefulSets: stsList,
        replicaSets: rsList,
        jobs: jobList,
        cronJobs: cjList,
        status: 'ready',
        lastRefreshTime: new Date()
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
    const { selectedId, selectedNamespace } = get()
    if (!selectedId) return

    try {
      const ns = selectedNamespace === 'all' ? undefined : selectedNamespace
      const [
        serviceList,
        configMapList,
        secretList,
        ingressList,
        pvList,
        pvcList,
        scList,
        saList,
        roleList,
        roleBindingList,
        crList,
        crbList,
        hpaList,
        eventList
      ] = await Promise.all([
        k8sApi.listServices(selectedId, ns),
        k8sApi.listConfigMaps(selectedId, ns),
        k8sApi.listSecrets(selectedId, ns),
        k8sApi.listIngresses(selectedId, ns),
        k8sApi.listPersistentVolumes(selectedId),
        k8sApi.listPersistentVolumeClaims(selectedId, ns),
        k8sApi.listStorageClasses(selectedId),
        k8sApi.listServiceAccounts(selectedId, ns),
        k8sApi.listRoles(selectedId, ns),
        k8sApi.listRoleBindings(selectedId, ns),
        k8sApi.listClusterRoles(selectedId),
        k8sApi.listClusterRoleBindings(selectedId),
        k8sApi.listHPAs(selectedId, ns),
        k8sApi.listEvents(selectedId, ns)
      ])
      set({
        services: serviceList,
        configMaps: configMapList,
        secrets: secretList,
        ingresses: ingressList,
        persistentVolumes: pvList,
        persistentVolumeClaims: pvcList,
        storageClasses: scList,
        serviceAccounts: saList,
        roles: roleList,
        roleBindings: roleBindingList,
        clusterRoles: crList,
        clusterRoleBindings: crbList,
        hpas: hpaList,
        events: eventList
      })
    } catch {
      // Silently fail for new resource types
    }
  },

  handleAdd: async () => {
    const { selectedId, contexts } = get()
    set({ error: '' })
    try {
      const result = await k8sApi.addKubeconfigFile()
      set({ contexts: result.contexts })
      if (result.addedIds.length > 0) {
        set({ selectedId: result.addedIds[0] })
      } else if (!selectedId && result.contexts.length > 0) {
        set({ selectedId: result.contexts[0].id })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加配置失败' })
    }
  },

  handleManualRefresh: () => {
    const { selectedId, selectedNamespace, loadResources } = get()
    if (selectedId) {
      loadResources(true)
    }
  },

  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value })
  }
}))
