import { 
  AppsV1Api, 
  BatchV1Api,
  CoreV1Api, 
  KubeConfig, 
  V1CronJob,
  V1DaemonSet,
  V1Deployment,
  V1Job,
  V1Node, 
  V1Pod,
  V1ReplicaSet,
  V1StatefulSet
} from '@kubernetes/client-node'
import { app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { 
  AddContextsResult, 
  ContextRecord, 
  CronJobInfo,
  DaemonSetInfo,
  DeploymentInfo,
  JobInfo,
  NamespaceInfo,
  NodeCapacity,
  NodeInfo, 
  PodContainer,
  PodInfo,
  ReplicaSetInfo,
  StatefulSetInfo,
  ContextPrefs,
  ContextGroup
} from '../shared/types'

type ContextEntry = {
  id: string
  contextName: string
  kubeConfig: KubeConfig
}

type StoreData = {
  paths: string[]
  prefs?: {
    customNames?: Record<string, string>
    groups?: ContextGroup[]
    ungrouped?: string[]
  }
}

const storeFile = () => path.join(app.getPath('userData'), 'k7s.config.json')

const readStore = async (): Promise<StoreData> => {
  try {
    const raw = await fs.readFile(storeFile(), 'utf-8')
    const data = JSON.parse(raw) as StoreData
    const paths = Array.isArray(data.paths) ? data.paths : []
    const prefs = data.prefs ?? {}
    return { paths, prefs }
  } catch {
    return { paths: [], prefs: {} }
  }
}

const writeStore = async (data: StoreData) => {
  await fs.mkdir(path.dirname(storeFile()), { recursive: true })
  await fs.writeFile(storeFile(), JSON.stringify(data, null, 2), 'utf-8')
}

const buildId = (source: string, contextName: string) => {
  const sanitizedSource = source.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `${sanitizedSource}::${contextName}`
}

let contextCache: {
  records: ContextRecord[]
  entries: Map<string, ContextEntry>
  paths: string[]
} | null = null

const loadFromFile = (filePath: string): KubeConfig => {
  const kubeConfig = new KubeConfig()
  try {
    kubeConfig.loadFromFile(filePath)
    return kubeConfig
  } catch (err) {
    throw new Error(`无法加载 kubeconfig 文件: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const loadDefault = (): KubeConfig => {
  const kubeConfig = new KubeConfig()
  try {
    kubeConfig.loadFromDefault()
    return kubeConfig
  } catch {
    return kubeConfig
  }
}

const ensureCache = async () => {
  const store = await readStore()
  const paths = store.paths.filter(Boolean)
  if (contextCache && contextCache.paths.join('|') === paths.join('|')) {
    return
  }
  const records: ContextRecord[] = []
  const entries = new Map<string, ContextEntry>()
  const sources: Array<{ source: string; kubeConfig: KubeConfig }> = []
  
  const defaultConfig = loadDefault()
  if (defaultConfig.getContexts().length > 0) {
    sources.push({ source: 'default', kubeConfig: defaultConfig })
  }
  
  for (const filePath of paths) {
    try {
      const config = loadFromFile(filePath)
      const sourceName = path.basename(filePath)
      sources.push({ source: sourceName, kubeConfig: config })
    } catch {
      continue
    }
  }
  
  for (const { source, kubeConfig } of sources) {
    for (const ctx of kubeConfig.getContexts()) {
      const id = buildId(source, ctx.name)
      records.push({
        id,
        name: ctx.name,
        cluster: ctx.cluster ?? '',
        user: ctx.user ?? '',
        source
      })
      entries.set(id, { id, contextName: ctx.name, kubeConfig })
    }
  }
  contextCache = { records, entries, paths }
}

export const listContexts = async (): Promise<ContextRecord[]> => {
  await ensureCache()
  return contextCache?.records ?? []
}

const sanitizePrefs = (records: ContextRecord[], prefs?: StoreData['prefs']): ContextPrefs => {
  const validIds = new Set(records.map(r => r.id))
  const customNamesRaw = prefs?.customNames ?? {}
  const customNames: Record<string, string> = {}
  for (const [id, name] of Object.entries(customNamesRaw)) {
    if (validIds.has(id) && name) customNames[id] = name
  }
  const groupsRaw = (prefs?.groups ?? []).map(g => ({
    id: g.id,
    name: g.name,
    items: (g.items ?? []).filter(id => validIds.has(id))
  }))
  const assignedIds = new Set<string>()
  for (const g of groupsRaw) {
    for (const id of g.items) assignedIds.add(id)
  }
  const ungroupedStored = (prefs?.ungrouped ?? []).filter(id => validIds.has(id))
  const allIds = records.map(r => r.id)
  const ungrouped = [...ungroupedStored]
  for (const id of allIds) {
    if (!assignedIds.has(id) && !ungrouped.includes(id)) {
      ungrouped.push(id)
    }
  }
  return { customNames, groups: groupsRaw, ungrouped }
}

export const getContextPrefs = async (): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const updateContextName = async (contextId: string, name: string): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  if (!store.prefs) store.prefs = {}
  if (!store.prefs.customNames) store.prefs.customNames = {}
  store.prefs.customNames[contextId] = name
  await writeStore(store)
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const updateContextGrouping = async (groups: ContextGroup[], ungrouped: string[]): Promise<ContextPrefs> => {
  await ensureCache()
  const store = await readStore()
  if (!store.prefs) store.prefs = {}
  store.prefs.groups = groups
  store.prefs.ungrouped = ungrouped
  await writeStore(store)
  return sanitizePrefs(contextCache?.records ?? [], store.prefs)
}

export const addKubeconfigPath = async (filePath: string): Promise<AddContextsResult> => {
  try {
    await fs.access(filePath, fs.constants.R_OK)
  } catch {
    throw new Error('无法读取所选文件，请检查文件权限')
  }
  
  let config: KubeConfig
  try {
    config = loadFromFile(filePath)
  } catch (err) {
    throw new Error(`kubeconfig 格式错误: ${err instanceof Error ? err.message : String(err)}`)
  }
  
  const contexts = config.getContexts()
  if (contexts.length === 0) {
    throw new Error('所选文件不包含任何 Kubernetes context')
  }
  
  const store = await readStore()
  const sourceName = path.basename(filePath)
  
  const existingContexts = await listContexts()
  const existingIds = new Set(existingContexts.map(c => c.id))
  
  const existingIndex = store.paths.indexOf(filePath)
  if (existingIndex >= 0) {
    store.paths.splice(existingIndex, 1)
  }
  
  store.paths.push(filePath)
  await writeStore(store)
  
  contextCache = null
  const newContexts = await listContexts()
  
  const addedIds = contexts
    .map(ctx => buildId(sourceName, ctx.name))
    .filter(id => !existingIds.has(id))
  
  return { contexts: newContexts, addedIds }
}

const getEntry = (contextId: string): ContextEntry => {
  if (!contextCache) {
    throw new Error('context cache not ready')
  }
  const entry = contextCache.entries.get(contextId)
  if (!entry) {
    throw new Error('context not found')
  }
  return entry
}

const setupKubeConfig = (entry: ContextEntry) => {
  entry.kubeConfig.setCurrentContext(entry.contextName)
  
  const currentCluster = entry.kubeConfig.getCurrentCluster()
  if (currentCluster && currentCluster.server.startsWith('http://')) {
    const clusterName = currentCluster.name
    const clusterIndex = entry.kubeConfig.clusters.findIndex(c => c.name === clusterName)
    if (clusterIndex >= 0) {
      const cluster = entry.kubeConfig.clusters[clusterIndex]
      entry.kubeConfig.clusters[clusterIndex] = {
        name: cluster.name,
        caData: cluster.caData,
        caFile: cluster.caFile,
        server: cluster.server,
        skipTLSVerify: true,
        tlsServerName: cluster.tlsServerName,
        proxyUrl: cluster.proxyUrl
      }
    }
  }
}

const createCoreV1Api = (entry: ContextEntry): CoreV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CoreV1Api)
}

const createAppsV1Api = (entry: ContextEntry): AppsV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AppsV1Api)
}

const createBatchV1Api = (entry: ContextEntry): BatchV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(BatchV1Api)
}

const roleFromLabels = (labels: Record<string, string>): string => {
  const roles = Object.keys(labels)
    .filter((key) => key.startsWith('node-role.kubernetes.io/'))
    .map((key) => key.replace('node-role.kubernetes.io/', ''))
    .filter(Boolean)
  if (roles.length === 0) {
    return 'worker'
  }
  return roles.join(', ')
}

const nodeReadyStatus = (node: V1Node): string => {
  const conditions = (node.status?.conditions ?? []) as Array<{ type?: string; status?: string }>
  const ready = conditions.find((condition) => condition.type === 'Ready')
  return ready?.status === 'True' ? 'Ready' : 'NotReady'
}

const formatAge = (date?: Date): string => {
  if (!date) {
    return ''
  }
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return `${hours}h`
  }
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const podRestarts = (pod: V1Pod): number => {
  const statuses = (pod.status?.containerStatuses ?? []) as Array<{ restartCount?: number }>
  return statuses.reduce((sum, status) => sum + (status.restartCount ?? 0), 0)
}

export const listNamespaces = async (contextId: string): Promise<NamespaceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = (await api.listNamespace()) as unknown as { 
      body?: { items?: Array<{ metadata?: { name?: string; creationTimestamp?: Date }; status?: { phase?: string } }> }
    }
    const items = res.body?.items ?? []
    return items.map((ns) => ({
      name: ns.metadata?.name ?? '',
      status: ns.status?.phase ?? '',
      age: formatAge(ns.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取命名空间失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listNodes = async (contextId: string): Promise<NodeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = (await api.listNode()) as unknown as { body?: { items?: V1Node[] }; items?: V1Node[] }
    const items = res.body?.items ?? res.items ?? []
    return items.map((node) => mapNodeToInfo(node))
  } catch (err) {
    throw new Error(`获取节点失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const mapNodeToInfo = (node: V1Node): NodeInfo => {
  const addresses = (node.status?.addresses ?? []).map(addr => ({
    type: addr.type ?? '',
    address: addr.address ?? ''
  }))
  
  const taints = (node.spec?.taints ?? []).map(taint => ({
    key: taint.key ?? '',
    value: taint.value ?? '',
    effect: taint.effect ?? ''
  }))
  
  const conditions = (node.status?.conditions ?? []).map(cond => ({
    type: cond.type ?? '',
    status: cond.status ?? '',
    reason: cond.reason,
    message: cond.message,
    lastTransitionTime: cond.lastTransitionTime?.toISOString()
  }))
  
  const capacity: NodeCapacity | undefined = node.status?.capacity ? {
    cpu: node.status.capacity.cpu ?? '',
    memory: node.status.capacity.memory ?? '',
    pods: node.status.capacity.pods ?? '',
    ephemeralStorage: node.status.capacity['ephemeral-storage']
  } : undefined
  
  return {
    name: node.metadata?.name ?? '',
    status: nodeReadyStatus(node),
    version: node.status?.nodeInfo?.kubeletVersion ?? '',
    roles: roleFromLabels(node.metadata?.labels ?? {}),
    age: formatAge(node.metadata?.creationTimestamp),
    addresses,
    os: node.status?.nodeInfo?.operatingSystem,
    architecture: node.status?.nodeInfo?.architecture,
    kernelVersion: node.status?.nodeInfo?.kernelVersion,
    containerRuntime: node.status?.nodeInfo?.containerRuntimeVersion,
    capacity,
    labels: node.metadata?.labels,
    taints,
    conditions,
    podCIDR: node.spec?.podCIDR,
    providerID: node.spec?.providerID,
    unschedulable: node.spec?.unschedulable
  }
}

export const getNodeDetail = async (contextId: string, nodeName: string): Promise<NodeInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNode({ name: nodeName })
    const typedRes = res as { body?: V1Node; response?: V1Node } | V1Node
    let node: V1Node | undefined
    if (typedRes && 'body' in typedRes && typedRes.body) {
      node = typedRes.body
    } else if (typedRes && 'response' in typedRes && typedRes.response) {
      node = typedRes.response
    } else if (typedRes && 'metadata' in typedRes) {
      node = typedRes as V1Node
    }
    if (!node) {
      throw new Error('节点不存在')
    }
    return mapNodeToInfo(node)
  } catch (err) {
    throw new Error(`获取节点详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPods = async (contextId: string, namespace?: string): Promise<PodInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPod({ namespace })
    } else {
      res = await api.listPodForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Pod[] }; items?: V1Pod[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pod) => ({
      name: pod.metadata?.name ?? '',
      namespace: pod.metadata?.namespace ?? '',
      status: pod.status?.phase ?? '',
      nodeName: pod.spec?.nodeName ?? '',
      restarts: podRestarts(pod),
      age: formatAge(pod.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 Pod 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listDeployments = async (contextId: string, namespace?: string): Promise<DeploymentInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedDeployment({ namespace })
    } else {
      res = await api.listDeploymentForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Deployment[] }; items?: V1Deployment[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((deploy) => ({
      name: deploy.metadata?.name ?? '',
      namespace: deploy.metadata?.namespace ?? '',
      replicas: deploy.spec?.replicas ?? 0,
      readyReplicas: deploy.status?.readyReplicas ?? 0,
      availableReplicas: deploy.status?.availableReplicas ?? 0,
      age: formatAge(deploy.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 Deployment 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listDaemonSets = async (contextId: string, namespace?: string): Promise<DaemonSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedDaemonSet({ namespace })
    } else {
      res = await api.listDaemonSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1DaemonSet[] }; items?: V1DaemonSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((ds) => ({
      name: ds.metadata?.name ?? '',
      namespace: ds.metadata?.namespace ?? '',
      desiredNumberScheduled: ds.status?.desiredNumberScheduled ?? 0,
      currentNumberScheduled: ds.status?.currentNumberScheduled ?? 0,
      numberReady: ds.status?.numberReady ?? 0,
      age: formatAge(ds.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 DaemonSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStatefulSets = async (contextId: string, namespace?: string): Promise<StatefulSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedStatefulSet({ namespace })
    } else {
      res = await api.listStatefulSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1StatefulSet[] }; items?: V1StatefulSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sts) => ({
      name: sts.metadata?.name ?? '',
      namespace: sts.metadata?.namespace ?? '',
      replicas: sts.spec?.replicas ?? 0,
      readyReplicas: sts.status?.readyReplicas ?? 0,
      age: formatAge(sts.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 StatefulSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listReplicaSets = async (contextId: string, namespace?: string): Promise<ReplicaSetInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedReplicaSet({ namespace })
    } else {
      res = await api.listReplicaSetForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ReplicaSet[] }; items?: V1ReplicaSet[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((rs) => ({
      name: rs.metadata?.name ?? '',
      namespace: rs.metadata?.namespace ?? '',
      replicas: rs.spec?.replicas ?? 0,
      readyReplicas: rs.status?.readyReplicas ?? 0,
      age: formatAge(rs.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 ReplicaSet 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listJobs = async (contextId: string, namespace?: string): Promise<JobInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedJob({ namespace })
    } else {
      res = await api.listJobForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Job[] }; items?: V1Job[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((job) => ({
      name: job.metadata?.name ?? '',
      namespace: job.metadata?.namespace ?? '',
      completions: job.spec?.completions ?? 0,
      succeeded: job.status?.succeeded ?? 0,
      active: job.status?.active ?? 0,
      failed: job.status?.failed ?? 0,
      age: formatAge(job.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 Job 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listCronJobs = async (contextId: string, namespace?: string): Promise<CronJobInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedCronJob({ namespace })
    } else {
      res = await api.listCronJobForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1CronJob[] }; items?: V1CronJob[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cj) => ({
      name: cj.metadata?.name ?? '',
      namespace: cj.metadata?.namespace ?? '',
      schedule: cj.spec?.schedule ?? '',
      suspend: cj.spec?.suspend ?? false,
      active: cj.status?.active?.length ?? 0,
      lastSchedule: cj.status?.lastScheduleTime ? formatAge(cj.status.lastScheduleTime) : '',
      age: formatAge(cj.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取 CronJob 失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const extractResponse = <T>(res: unknown): T | undefined => {
  const typed = res as { body?: T; response?: T } | T
  if (typed && typeof typed === 'object') {
    if ('body' in typed && typed.body) return typed.body
    if ('response' in typed && typed.response) return typed.response
    if ('metadata' in typed) return typed as T
  }
  return undefined
}

const getContainerState = (state?: { running?: unknown; waiting?: { reason?: string }; terminated?: unknown }): string => {
  if (!state) return 'Unknown'
  if (state.running) return 'Running'
  if (state.waiting) return `Waiting: ${state.waiting.reason ?? 'Unknown'}`
  if (state.terminated) return 'Terminated'
  return 'Unknown'
}

export const getPodDetail = async (contextId: string, namespace: string, podName: string): Promise<PodInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedPod({ name: podName, namespace })
    const pod = extractResponse<V1Pod>(res)
    if (!pod) throw new Error('Pod不存在')
    
    const containers: PodContainer[] = (pod.status?.containerStatuses ?? []).map(c => ({
      name: c.name ?? '',
      image: c.image ?? '',
      restartCount: c.restartCount ?? 0,
      ready: c.ready ?? false,
      state: getContainerState(c.state as Parameters<typeof getContainerState>[0])
    }))
    
    const initContainers: PodContainer[] = (pod.status?.initContainerStatuses ?? []).map(c => ({
      name: c.name ?? '',
      image: c.image ?? '',
      restartCount: c.restartCount ?? 0,
      ready: c.ready ?? false,
      state: getContainerState(c.state as Parameters<typeof getContainerState>[0])
    }))
    
    return {
      name: pod.metadata?.name ?? '',
      namespace: pod.metadata?.namespace ?? '',
      status: pod.status?.phase ?? '',
      nodeName: pod.spec?.nodeName ?? '',
      restarts: podRestarts(pod),
      age: formatAge(pod.metadata?.creationTimestamp),
      podIP: pod.status?.podIP,
      hostIP: pod.status?.hostIP,
      startTime: pod.status?.startTime?.toISOString(),
      labels: pod.metadata?.labels,
      containers,
      initContainers,
      serviceAccount: pod.spec?.serviceAccountName,
      priority: pod.spec?.priorityClassName,
      qosClass: pod.status?.qosClass
    }
  } catch (err) {
    throw new Error(`获取Pod详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getDeploymentDetail = async (contextId: string, namespace: string, name: string): Promise<DeploymentInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedDeployment({ name, namespace })
    const deploy = extractResponse<V1Deployment>(res)
    if (!deploy) throw new Error('Deployment不存在')
    
    return {
      name: deploy.metadata?.name ?? '',
      namespace: deploy.metadata?.namespace ?? '',
      replicas: deploy.spec?.replicas ?? 0,
      readyReplicas: deploy.status?.readyReplicas ?? 0,
      availableReplicas: deploy.status?.availableReplicas ?? 0,
      age: formatAge(deploy.metadata?.creationTimestamp),
      labels: deploy.metadata?.labels,
      selector: deploy.spec?.selector?.matchLabels,
      strategy: deploy.spec?.strategy?.type,
      updatedReplicas: deploy.status?.updatedReplicas,
      unavailableReplicas: deploy.status?.unavailableReplicas
    }
  } catch (err) {
    throw new Error(`获取Deployment详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getDaemonSetDetail = async (contextId: string, namespace: string, name: string): Promise<DaemonSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedDaemonSet({ name, namespace })
    const ds = extractResponse<V1DaemonSet>(res)
    if (!ds) throw new Error('DaemonSet不存在')
    
    return {
      name: ds.metadata?.name ?? '',
      namespace: ds.metadata?.namespace ?? '',
      desiredNumberScheduled: ds.status?.desiredNumberScheduled ?? 0,
      currentNumberScheduled: ds.status?.currentNumberScheduled ?? 0,
      numberReady: ds.status?.numberReady ?? 0,
      age: formatAge(ds.metadata?.creationTimestamp),
      labels: ds.metadata?.labels,
      selector: ds.spec?.selector?.matchLabels,
      updatedNumberScheduled: ds.status?.updatedNumberScheduled,
      numberAvailable: ds.status?.numberAvailable,
      numberUnavailable: ds.status?.numberUnavailable
    }
  } catch (err) {
    throw new Error(`获取DaemonSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getStatefulSetDetail = async (contextId: string, namespace: string, name: string): Promise<StatefulSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedStatefulSet({ name, namespace })
    const sts = extractResponse<V1StatefulSet>(res)
    if (!sts) throw new Error('StatefulSet不存在')
    
    return {
      name: sts.metadata?.name ?? '',
      namespace: sts.metadata?.namespace ?? '',
      replicas: sts.spec?.replicas ?? 0,
      readyReplicas: sts.status?.readyReplicas ?? 0,
      age: formatAge(sts.metadata?.creationTimestamp),
      labels: sts.metadata?.labels,
      selector: sts.spec?.selector?.matchLabels,
      serviceName: sts.spec?.serviceName,
      updateStrategy: sts.spec?.updateStrategy?.type,
      currentReplicas: sts.status?.currentReplicas,
      updatedReplicas: sts.status?.updatedReplicas
    }
  } catch (err) {
    throw new Error(`获取StatefulSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getReplicaSetDetail = async (contextId: string, namespace: string, name: string): Promise<ReplicaSetInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.readNamespacedReplicaSet({ name, namespace })
    const rs = extractResponse<V1ReplicaSet>(res)
    if (!rs) throw new Error('ReplicaSet不存在')
    
    return {
      name: rs.metadata?.name ?? '',
      namespace: rs.metadata?.namespace ?? '',
      replicas: rs.spec?.replicas ?? 0,
      readyReplicas: rs.status?.readyReplicas ?? 0,
      age: formatAge(rs.metadata?.creationTimestamp),
      labels: rs.metadata?.labels,
      selector: rs.spec?.selector?.matchLabels,
      fullyLabeledReplicas: rs.status?.fullyLabeledReplicas,
      availableReplicas: rs.status?.availableReplicas
    }
  } catch (err) {
    throw new Error(`获取ReplicaSet详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getJobDetail = async (contextId: string, namespace: string, name: string): Promise<JobInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    const res = await api.readNamespacedJob({ name, namespace })
    const job = extractResponse<V1Job>(res)
    if (!job) throw new Error('Job不存在')
    
    let duration: string | undefined
    if (job.status?.startTime && job.status?.completionTime) {
      const diff = job.status.completionTime.getTime() - job.status.startTime.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      if (hours > 0) duration = `${hours}h ${minutes % 60}m`
      else if (minutes > 0) duration = `${minutes}m ${seconds % 60}s`
      else duration = `${seconds}s`
    }
    
    return {
      name: job.metadata?.name ?? '',
      namespace: job.metadata?.namespace ?? '',
      completions: job.spec?.completions ?? 0,
      succeeded: job.status?.succeeded ?? 0,
      active: job.status?.active ?? 0,
      failed: job.status?.failed ?? 0,
      age: formatAge(job.metadata?.creationTimestamp),
      labels: job.metadata?.labels,
      selector: job.spec?.selector?.matchLabels,
      startTime: job.status?.startTime?.toISOString(),
      completionTime: job.status?.completionTime?.toISOString(),
      duration,
      parallelism: job.spec?.parallelism,
      backoffLimit: job.spec?.backoffLimit
    }
  } catch (err) {
    throw new Error(`获取Job详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const getCronJobDetail = async (contextId: string, namespace: string, name: string): Promise<CronJobInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    const res = await api.readNamespacedCronJob({ name, namespace })
    const cj = extractResponse<V1CronJob>(res)
    if (!cj) throw new Error('CronJob不存在')
    
    return {
      name: cj.metadata?.name ?? '',
      namespace: cj.metadata?.namespace ?? '',
      schedule: cj.spec?.schedule ?? '',
      suspend: cj.spec?.suspend ?? false,
      active: cj.status?.active?.length ?? 0,
      lastSchedule: cj.status?.lastScheduleTime ? formatAge(cj.status.lastScheduleTime) : '',
      age: formatAge(cj.metadata?.creationTimestamp),
      labels: cj.metadata?.labels,
      selector: cj.spec?.jobTemplate?.spec?.selector?.matchLabels,
      concurrencyPolicy: cj.spec?.concurrencyPolicy,
      successfulJobsHistoryLimit: cj.spec?.successfulJobsHistoryLimit,
      failedJobsHistoryLimit: cj.spec?.failedJobsHistoryLimit,
      startingDeadlineSeconds: cj.spec?.startingDeadlineSeconds
    }
  } catch (err) {
    throw new Error(`获取CronJob详情失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}
