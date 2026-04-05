/* node:coverage disable */
import {
  AppsV1Api,
  AutoscalingV2Api,
  BatchV1Api,
  CoreV1Api,
  CustomObjectsApi,
  KubeConfig,
  NetworkingV1Api,
  RbacAuthorizationV1Api,
  StorageV1Api,
  V1APIVersions,
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1ConfigMap,
  V1CronJob,
  V1DaemonSet,
  V1DeleteOptions,
  V1Deployment,
  V1Job,
  V1Namespace,
  V1Node,
  V1PersistentVolume,
  V1PersistentVolumeClaim,
  V1Pod,
  V1ReplicaSet,
  V1Role,
  V1RoleBinding,
  V1Secret,
  V1Service,
  V1ServiceAccount,
  V1StatefulSet,
  V1StorageClass,
  V1Ingress,
  V2HorizontalPodAutoscaler,
  CoreV1Event
} from '@kubernetes/client-node'
import { app } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import { load as yamlLoad } from 'js-yaml'
import type {
  AddContextsResult,
  ClusterHealth,
  ClusterRoleBindingInfo,
  ClusterRoleInfo,
  ConfigMapFormData,
  ConfigMapInfo,
  ContextRecord,
  CronJobInfo,
  CreateResult,
  DaemonSetInfo,
  DeploymentFormData,
  DeploymentInfo,
  DeleteResult,
  EventInfo,
  HPAInfo,
  IngressFormData,
  IngressInfo,
  JobInfo,
  KubernetesResourceKind,
  NamespaceInfo,
  NodeCapacity,
  NodeInfo,
  NodeMetrics,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  PodContainer,
  PodInfo,
  ReplicaSetInfo,
  RolloutResult,
  RolloutWorkloadKind,
  RoleBindingInfo,
  RoleInfo,
  ScaleResult,
  ScaleableWorkloadKind,
  SecretFormData,
  SecretInfo,
  ServiceAccountInfo,
  ServiceFormData,
  ServiceInfo,
  StatefulSetInfo,
  StorageClassInfo,
  UpdateResult,
  ContextPrefs,
  ContextGroup
} from '../shared/types'
import { request as httpsRequest, Agent } from 'node:https'
import { request as httpRequest } from 'node:http'

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

// Mutex for cache rebuild to prevent race conditions
let cacheBuildPromise: Promise<void> | null = null

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

const rebuildCache = async () => {
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

const ensureCache = async () => {
  // If already building, wait for that to complete
  if (cacheBuildPromise) {
    await cacheBuildPromise
    return
  }

  const store = await readStore()
  const paths = store.paths.filter(Boolean)
  if (contextCache && contextCache.paths.join('|') === paths.join('|')) {
    return
  }

  // Start new build and store promise
  cacheBuildPromise = rebuildCache()
  try {
    await cacheBuildPromise
  } finally {
    cacheBuildPromise = null
  }
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

export const getEntry = (contextId: string): ContextEntry => {
  if (!contextCache) {
    throw new Error('context cache not ready')
  }
  const entry = contextCache.entries.get(contextId)
  if (!entry) {
    throw new Error('context not found')
  }
  return entry
}

export const getConfiguredKubeConfig = async (contextId: string): Promise<KubeConfig> => {
  await ensureCache()
  const entry = getEntry(contextId)
  setupKubeConfig(entry)
  return entry.kubeConfig
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

const createNetworkingV1Api = (entry: ContextEntry): NetworkingV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(NetworkingV1Api)
}

const createCustomObjectsApi = (entry: ContextEntry): CustomObjectsApi => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(CustomObjectsApi)
}

const createRbacV1Api = (entry: ContextEntry): RbacAuthorizationV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(RbacAuthorizationV1Api)
}

const createStorageV1Api = (entry: ContextEntry): StorageV1Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(StorageV1Api)
}

const createAutoscalingV2Api = (entry: ContextEntry): AutoscalingV2Api => {
  setupKubeConfig(entry)
  return entry.kubeConfig.makeApiClient(AutoscalingV2Api)
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

export const getNodeMetrics = async (contextId: string, nodeName: string): Promise<NodeMetrics | null> => {
  await ensureCache()
  const entry = getEntry(contextId)
  setupKubeConfig(entry)

  const currentCluster = entry.kubeConfig.getCurrentCluster()
  if (!currentCluster) {
    return null
  }

  const cluster = entry.kubeConfig.clusters.find(c => c.name === currentCluster.name)
  if (!cluster) {
    return null
  }

  const user = entry.kubeConfig.getCurrentUser()
  if (!user) {
    return null
  }

  const isHTTPS = currentCluster.server.startsWith('https://')
  const requestModule = isHTTPS ? httpsRequest : httpRequest

  const url = new URL(currentCluster.server)
  const path = `/apis/metrics.k8s.io/v1beta1/nodes/${nodeName}`

  const options: {
    hostname: string
    port?: number
    path: string
    method: string
    headers: Record<string, string>
    agent?: Agent
  } = {
    hostname: url.hostname,
    port: url.port || (isHTTPS ? 443 : 80),
    path,
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }

  // Add auth header
  if (user.token) {
    options.headers['Authorization'] = `Bearer ${user.token}`
  }

  // Add client certs for HTTPS
  if (isHTTPS && cluster.caData) {
    options.agent = new Agent({
      ca: Buffer.from(cluster.caData, 'base64')
    })
  }

  // Add client certificate authentication
  if (user.certData && user.keyData) {
    const agent = options.agent as Agent | undefined
    if (agent) {
      (agent as Agent & { key?: Buffer; cert?: Buffer }).key = Buffer.from(user.keyData, 'base64')
      ;(agent as Agent & { key?: Buffer; cert?: Buffer }).cert = Buffer.from(user.certData, 'base64')
    }
  }

  return new Promise((resolve) => {
    const req = requestModule(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve(null)
          return
        }
        try {
          const parsed = JSON.parse(data)
          const node = parsed.items?.[0]
          if (!node) {
            resolve(null)
            return
          }
          resolve({
            name: node.name,
            timestamp: node.timestamp || '',
            cpu: node.usage?.cpu || '0',
            memory: node.usage?.memory || '0'
          })
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
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
  if (typed === undefined || typed === null) {
    return undefined
  }
  if (typeof typed !== 'object') {
    return typed as T
  }
  if ('body' in typed && typed.body !== undefined) return typed.body
  if ('response' in typed && typed.response !== undefined) return typed.response
  if (typed && typeof typed === 'object') {
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

const mapPodContainers = (
  specContainers: Array<{ name?: string; image?: string }> = [],
  statusContainers: Array<{
    name?: string
    image?: string
    restartCount?: number
    ready?: boolean
    state?: Parameters<typeof getContainerState>[0]
  }> = [],
): PodContainer[] => {
  const statusByName = new Map(
    statusContainers
      .filter((container) => Boolean(container.name))
      .map((container) => [container.name as string, container]),
  )
  const orderedNames = specContainers
    .map((container) => container.name?.trim())
    .filter((name): name is string => Boolean(name))

  for (const status of statusContainers) {
    const name = status.name?.trim()
    if (name && !orderedNames.includes(name)) {
      orderedNames.push(name)
    }
  }

  return orderedNames.map((name) => {
    const spec = specContainers.find((container) => container.name === name)
    const status = statusByName.get(name)
    return {
      name,
      image: status?.image ?? spec?.image ?? '',
      restartCount: status?.restartCount ?? 0,
      ready: status?.ready ?? false,
      state: getContainerState(status?.state),
    }
  })
}

export const getPodDetail = async (contextId: string, namespace: string, podName: string): Promise<PodInfo> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedPod({ name: podName, namespace })
    const pod = extractResponse<V1Pod>(res)
    if (!pod) throw new Error('Pod不存在')

    const containers = mapPodContainers(
      pod.spec?.containers ?? [],
      (pod.status?.containerStatuses ?? []).map((container) => ({
        name: container.name,
        image: container.image,
        restartCount: container.restartCount,
        ready: container.ready,
        state: container.state as Parameters<typeof getContainerState>[0],
      })),
    )

    const initContainers = mapPodContainers(
      pod.spec?.initContainers ?? [],
      (pod.status?.initContainerStatuses ?? []).map((container) => ({
        name: container.name,
        image: container.image,
        restartCount: container.restartCount,
        ready: container.ready,
        state: container.state as Parameters<typeof getContainerState>[0],
      })),
    )

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

// Delete operations
export const deletePod = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespacedPod({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Pod失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteDeployment = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedDeployment({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteDaemonSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedDaemonSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除DaemonSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteStatefulSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedStatefulSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除StatefulSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteReplicaSet = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    await api.deleteNamespacedReplicaSet({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除ReplicaSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteJob = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    await api.deleteNamespacedJob({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Job失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteCronJob = async (contextId: string, namespace: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createBatchV1Api(entry)
  try {
    await api.deleteNamespacedCronJob({ name, namespace })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除CronJob失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteNamespace = async (contextId: string, name: string): Promise<DeleteResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    await api.deleteNamespace({ name })
    return { success: true }
  } catch (err) {
    return { success: false, message: `删除Namespace失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const deleteResource = async (
  contextId: string,
  kind: KubernetesResourceKind,
  namespace: string,
  name: string
): Promise<DeleteResult> => {
  await ensureCache()
  switch (kind) {
    case 'Pod':
      return deletePod(contextId, namespace, name)
    case 'Deployment':
      return deleteDeployment(contextId, namespace, name)
    case 'DaemonSet':
      return deleteDaemonSet(contextId, namespace, name)
    case 'StatefulSet':
      return deleteStatefulSet(contextId, namespace, name)
    case 'ReplicaSet':
      return deleteReplicaSet(contextId, namespace, name)
    case 'Job':
      return deleteJob(contextId, namespace, name)
    case 'CronJob':
      return deleteCronJob(contextId, namespace, name)
    case 'Namespace':
      return deleteNamespace(contextId, name)
    case 'Service': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedService({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Service ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Service失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'ConfigMap': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedConfigMap({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `ConfigMap ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除ConfigMap失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Secret': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedSecret({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Secret ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Secret失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'Ingress': {
      const api = createNetworkingV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedIngress({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `Ingress ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除Ingress失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PersistentVolumeClaim': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deleteNamespacedPersistentVolumeClaim({ namespace, name, body: {} as V1DeleteOptions })
        return { success: true, message: `PersistentVolumeClaim ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PersistentVolumeClaim失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    case 'PersistentVolume': {
      const api = createCoreV1Api(getEntry(contextId))
      try {
        await api.deletePersistentVolume({ name, body: {} as V1DeleteOptions })
        return { success: true, message: `PersistentVolume ${name} 已删除` }
      } catch (err) {
        return { success: false, message: `删除PersistentVolume失败: ${err instanceof Error ? err.message : String(err)}` }
      }
    }
    default:
      return { success: false, message: `暂不支持删除 ${kind}` }
  }
}

// Scale operations
export const scaleDeployment = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedDeploymentScale({ name, namespace, body: { spec: { replicas } } })
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleWorkload = async (
  contextId: string,
  kind: ScaleableWorkloadKind,
  namespace: string,
  name: string,
  replicas: number
): Promise<ScaleResult> => {
  switch (kind) {
    case 'Deployment':
      return scaleDeployment(contextId, namespace, name, replicas)
    case 'StatefulSet':
      return scaleStatefulSet(contextId, namespace, name, replicas)
    case 'ReplicaSet':
      return scaleReplicaSet(contextId, namespace, name, replicas)
  }
}

export const restartWorkload = async (
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
): Promise<RolloutResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  const restartedAt = new Date().toISOString()
  const patch = {
    spec: {
      template: {
        metadata: {
          annotations: {
            'kubectl.kubernetes.io/restartedAt': restartedAt
          }
        }
      }
    }
  }

  try {
    switch (kind) {
      case 'Deployment':
        await api.patchNamespacedDeployment({ name, namespace, body: patch })
        break
      case 'DaemonSet':
        await api.patchNamespacedDaemonSet({ name, namespace, body: patch })
        break
      case 'StatefulSet':
        await api.patchNamespacedStatefulSet({ name, namespace, body: patch })
        break
    }
    return { success: true, message: `${kind} ${name} 已触发重启` }
  } catch (err) {
    return { success: false, message: `重启${kind}失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleStatefulSet = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedStatefulSetScale({ name, namespace, body: { spec: { replicas } } })
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容StatefulSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const scaleReplicaSet = async (contextId: string, namespace: string, name: string, replicas: number): Promise<ScaleResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)
  try {
    const res = await api.patchNamespacedReplicaSetScale({ name, namespace, body: { spec: { replicas } } })
    const scale = extractResponse<{ spec?: { replicas?: number } }>(res)
    return { success: true, replicas: scale?.spec?.replicas ?? replicas }
  } catch (err) {
    return { success: false, replicas, message: `扩缩容ReplicaSet失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const getPodLogs = async (
  contextId: string,
  namespace: string,
  podName: string,
  containerName?: string,
  tailLines: number = 100
): Promise<string> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.readNamespacedPodLog({
      name: podName,
      namespace,
      container: containerName,
      tailLines: tailLines
    })
    const log = extractResponse<string>(res)
    return log ?? ''
  } catch (err) {
    throw new Error(`获取日志失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// Cluster Health
export const getClusterHealth = async (contextId: string): Promise<ClusterHealth> => {
  await ensureCache()
  const entry = getEntry(contextId)

  try {
    const [nodes, pods] = await Promise.all([
      listNodes(contextId),
      listPods(contextId)
    ])

    const totalNodes = nodes.length
    const readyNodes = nodes.filter(n => n.status === 'Ready').length

    const totalPods = pods.length
    const runningPods = pods.filter(p => p.status === 'Running').length
    const pendingPods = pods.filter(p => p.status === 'Pending').length
    const failedPods = pods.filter(p => p.status === 'Failed' || p.status === 'Unknown').length

    let status: ClusterHealth['status'] = 'unknown'
    if (totalNodes === 0 && totalPods === 0) {
      status = 'unknown'
    } else if (failedPods > 0 || (totalNodes > 0 && readyNodes === 0)) {
      status = 'unhealthy'
    } else if (pendingPods > totalPods * 0.1 || readyNodes < totalNodes * 0.9) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    return {
      status,
      totalNodes,
      readyNodes,
      totalPods,
      runningPods,
      pendingPods,
      failedPods,
      lastUpdated: new Date().toISOString()
    }
  } catch {
    return {
      status: 'unknown',
      totalNodes: 0,
      readyNodes: 0,
      totalPods: 0,
      runningPods: 0,
      pendingPods: 0,
      failedPods: 0,
      lastUpdated: new Date().toISOString()
    }
  }
}

// List operations for new resource types
export const listServices = async (contextId: string, namespace?: string): Promise<ServiceInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedService({ namespace })
    } else {
      res = await api.listServiceForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Service[] }; items?: V1Service[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((svc) => {
      const ports = svc.spec?.ports?.map(p => `${p.port}:${p.targetPort}/${p.protocol ?? 'TCP'}`).join(', ') ?? ''
      const hosts = svc.spec?.externalIPs?.join(', ') ?? ''
      return {
        name: svc.metadata?.name ?? '',
        namespace: svc.metadata?.namespace ?? '',
        type: svc.spec?.type ?? 'ClusterIP',
        clusterIP: svc.spec?.clusterIP ?? '',
        externalIP: hosts || undefined,
        ports,
        age: formatAge(svc.metadata?.creationTimestamp),
        labels: svc.metadata?.labels,
        selector: svc.spec?.selector
      }
    })
  } catch (err) {
    throw new Error(`获取Service失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listConfigMaps = async (contextId: string, namespace?: string): Promise<ConfigMapInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedConfigMap({ namespace })
    } else {
      res = await api.listConfigMapForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ConfigMap[] }; items?: V1ConfigMap[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cm) => ({
      name: cm.metadata?.name ?? '',
      namespace: cm.metadata?.namespace ?? '',
      age: formatAge(cm.metadata?.creationTimestamp),
      labels: cm.metadata?.labels,
      data: cm.data
    }))
  } catch (err) {
    throw new Error(`获取ConfigMap失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listSecrets = async (contextId: string, namespace?: string): Promise<SecretInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedSecret({ namespace })
    } else {
      res = await api.listSecretForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Secret[] }; items?: V1Secret[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((secret) => ({
      name: secret.metadata?.name ?? '',
      namespace: secret.metadata?.namespace ?? '',
      type: secret.type ?? 'Opaque',
      age: formatAge(secret.metadata?.creationTimestamp),
      labels: secret.metadata?.labels,
      data: secret.data
    }))
  } catch (err) {
    throw new Error(`获取Secret失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listIngresses = async (contextId: string, namespace?: string): Promise<IngressInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedIngress({ namespace })
    } else {
      res = await api.listIngressForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Ingress[] }; items?: V1Ingress[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((ing) => {
      const hosts = ing.spec?.rules?.map(r => r.host).join(', ') ?? '*'
      const address = ing.status?.loadBalancer?.ingress?.map(i => i.ip || i.hostname).join(', ') ?? ''
      return {
        name: ing.metadata?.name ?? '',
        namespace: ing.metadata?.namespace ?? '',
        ingressClass: ing.spec?.ingressClassName,
        hosts,
        address,
        ports: '80, 443',
        age: formatAge(ing.metadata?.creationTimestamp),
        labels: ing.metadata?.labels
      }
    })
  } catch (err) {
    throw new Error(`获取Ingress失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// Create operations
export const createNamespace = async (contextId: string, name: string): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const namespace: V1Namespace = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name }
    }
    await api.createNamespace({ body: namespace })
    return { success: true, name, message: `Namespace ${name} created successfully` }
  } catch (err) {
    return { success: false, message: `创建Namespace失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createDeployment = async (contextId: string, data: DeploymentFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)

  const labels: Record<string, string> = {}
  data.labels.forEach(l => {
    if (l.key) labels[l.key] = l.value
  })

  const env: Array<{ name: string; value: string }> = []
  data.env.forEach(e => {
    if (e.key) env.push({ name: e.key, value: e.value })
  })

  const deployment: V1Deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: data.name,
      namespace: data.namespace,
      labels
    },
    spec: {
      replicas: data.replicas,
      selector: {
        matchLabels: labels
      },
      template: {
        metadata: {
          labels
        },
        spec: {
          containers: [{
            name: data.name,
            image: data.image,
            ports: [{
              containerPort: data.targetPort,
              protocol: data.protocol as 'TCP' | 'UDP'
            }],
            env
          }]
        }
      }
    }
  }

  try {
    await api.createNamespacedDeployment({ namespace: data.namespace, body: deployment })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createService = async (contextId: string, data: ServiceFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const selector: Record<string, string> = {}
  data.selector.forEach(s => {
    if (s.key) selector[s.key] = s.value
  })

  const service: V1Service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    spec: {
      type: data.type,
      selector,
      ports: [{
        port: data.port,
        targetPort: data.targetPort,
        protocol: data.protocol as 'TCP' | 'UDP'
      }]
    }
  }

  try {
    await api.createNamespacedService({ namespace: data.namespace, body: service })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Service失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createConfigMap = async (contextId: string, data: ConfigMapFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const cmData: Record<string, string> = {}
  data.data.forEach(d => {
    if (d.key) cmData[d.key] = d.value
  })

  const configMap: V1ConfigMap = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    data: cmData
  }

  try {
    await api.createNamespacedConfigMap({ namespace: data.namespace, body: configMap })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建ConfigMap失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createSecret = async (contextId: string, data: SecretFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)

  const secretData: Record<string, string> = {}
  data.data.forEach(d => {
    if (d.key) secretData[d.key] = d.value
  })

  const secret: V1Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: data.name,
      namespace: data.namespace
    },
    type: data.type,
    data: secretData
  }

  try {
    await api.createNamespacedSecret({ namespace: data.namespace, body: secret })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Secret失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export const createIngress = async (contextId: string, data: IngressFormData): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createNetworkingV1Api(entry)

  const ingress: V1Ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: data.name,
      namespace: data.namespace,
      annotations: data.ingressClass ? { 'kubernetes.io/ingress.class': data.ingressClass } : undefined
    },
    spec: {
      ingressClassName: data.ingressClass,
      rules: [{
        host: data.host,
        http: {
          paths: [{
            path: '/',
            pathType: 'Prefix',
            backend: {
              service: {
                name: data.serviceName,
                port: { number: data.servicePort }
              }
            }
          }]
        }
      }],
      tls: data.tls ? [{ hosts: [data.host], secretName: data.tlsSecret }] : undefined
    }
  }

  try {
    await api.createNamespacedIngress({ namespace: data.namespace, body: ingress })
    return { success: true, name: data.name, namespace: data.namespace }
  } catch (err) {
    return { success: false, message: `创建Ingress失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Update operations
export const updateDeployment = async (
  contextId: string,
  namespace: string,
  name: string,
  data: Partial<DeploymentFormData>
): Promise<UpdateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAppsV1Api(entry)

  try {
    const existing = await api.readNamespacedDeployment({ name, namespace })
    const deploy = extractResponse<V1Deployment>(existing)
    if (!deploy) {
      return { success: false, message: 'Deployment不存在' }
    }

    const patchBody: Record<string, unknown> = {}

    if (data.replicas !== undefined) {
      patchBody.spec = { ...deploy.spec, replicas: data.replicas }
    }

    if (data.image !== undefined) {
      const containers = deploy.spec?.template?.spec?.containers ?? []
      if (containers.length > 0) {
        containers[0].image = data.image
        patchBody.spec = {
          ...deploy.spec,
          template: {
            ...deploy.spec?.template,
            spec: {
              ...deploy.spec?.template?.spec,
              containers
            }
          }
        }
      }
    }

    await api.patchNamespacedDeployment({ name, namespace, body: patchBody })
    return { success: true }
  } catch (err) {
    return { success: false, message: `更新Deployment失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// YAML apply
export const applyYaml = async (contextId: string, yaml: string): Promise<CreateResult> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const customApi = createCustomObjectsApi(entry)

  try {
    const docs = yaml.split('---').filter(d => d.trim())

    for (const doc of docs) {
      if (!doc.trim()) continue

      const parsed = yamlLoad(doc) as Record<string, unknown>
      if (!parsed || typeof parsed !== 'object') continue
      const kind = parsed.kind as string | undefined
      const apiVersion = parsed.apiVersion as string | undefined
      const metadata = (parsed.metadata || {}) as Record<string, unknown>

      if (!kind || !apiVersion || !metadata.name) {
        continue
      }

      const namespace = (metadata.namespace as string | undefined) || 'default'

      if (kind === 'Namespace') {
        const api = createCoreV1Api(entry)
        await api.createNamespace({ body: parsed })
      } else if (kind === 'Deployment') {
        const api = createAppsV1Api(entry)
        try {
          await api.patchNamespacedDeployment({ name: metadata.name, namespace, body: parsed })
        } catch {
          await api.createNamespacedDeployment({ namespace, body: parsed })
        }
      } else if (kind === 'Service') {
        const api = createCoreV1Api(entry)
        try {
          await api.patchNamespacedService({ name: metadata.name, namespace, body: parsed })
        } catch {
          await api.createNamespacedService({ namespace, body: parsed })
        }
      } else if (kind === 'ConfigMap') {
        const api = createCoreV1Api(entry)
        try {
          await api.patchNamespacedConfigMap({ name: metadata.name, namespace, body: parsed })
        } catch {
          await api.createNamespacedConfigMap({ namespace, body: parsed })
        }
      } else if (kind === 'Secret') {
        const api = createCoreV1Api(entry)
        try {
          await api.patchNamespacedSecret({ name: metadata.name, namespace, body: parsed })
        } catch {
          await api.createNamespacedSecret({ namespace, body: parsed })
        }
      } else if (kind === 'Ingress') {
        const api = createNetworkingV1Api(entry)
        try {
          await api.patchNamespacedIngress({ name: metadata.name, namespace, body: parsed })
        } catch {
          await api.createNamespacedIngress({ namespace, body: parsed })
        }
      } else {
        // For other types, use CustomObjectsApi
        const group = apiVersion.split('/')[0]
        const version = apiVersion.split('/')[1] || 'v1'
        await customApi.patchNamespacedCustomObject(group, version, namespace, kind.toLowerCase() + 's', metadata.name, parsed)
      }
    }

    return { success: true, message: `Applied ${docs.length} resource(s) successfully` }
  } catch (err) {
    return { success: false, message: `Apply失败: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// Get resource YAML
export const getResourceYaml = async (
  contextId: string,
  kind: string,
  namespace: string,
  name: string
): Promise<string> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const stringifyResource = (resource: unknown) => {
    if (resource === undefined) {
      throw new Error(`Resource ${kind}/${name} not found`)
    }
    return JSON.stringify(resource, null, 2)
  }

  try {
    const coreApi = createCoreV1Api(entry)
    const appsApi = createAppsV1Api(entry)
    const batchApi = createBatchV1Api(entry)
    const networkingApi = createNetworkingV1Api(entry)
    const storageApi = createStorageV1Api(entry)
    const rbacApi = createRbacV1Api(entry)
    const autoscalingApi = createAutoscalingV2Api(entry)

    if (kind === 'Pod') {
      return stringifyResource(extractResponse<V1Pod>(await coreApi.readNamespacedPod({ name, namespace })))
    }
    if (kind === 'Deployment') {
      return stringifyResource(extractResponse<V1Deployment>(await appsApi.readNamespacedDeployment({ name, namespace })))
    }
    if (kind === 'DaemonSet') {
      return stringifyResource(extractResponse<V1DaemonSet>(await appsApi.readNamespacedDaemonSet({ name, namespace })))
    }
    if (kind === 'StatefulSet') {
      return stringifyResource(extractResponse<V1StatefulSet>(await appsApi.readNamespacedStatefulSet({ name, namespace })))
    }
    if (kind === 'ReplicaSet') {
      return stringifyResource(extractResponse<V1ReplicaSet>(await appsApi.readNamespacedReplicaSet({ name, namespace })))
    }
    if (kind === 'Job') {
      return stringifyResource(extractResponse<V1Job>(await batchApi.readNamespacedJob({ name, namespace })))
    }
    if (kind === 'CronJob') {
      return stringifyResource(extractResponse<V1CronJob>(await batchApi.readNamespacedCronJob({ name, namespace })))
    }
    if (kind === 'Service') {
      return stringifyResource(extractResponse<V1Service>(await coreApi.readNamespacedService({ name, namespace })))
    }
    if (kind === 'ConfigMap') {
      return stringifyResource(extractResponse<V1ConfigMap>(await coreApi.readNamespacedConfigMap({ name, namespace })))
    }
    if (kind === 'Secret') {
      return stringifyResource(extractResponse<V1Secret>(await coreApi.readNamespacedSecret({ name, namespace })))
    }
    if (kind === 'Ingress') {
      return stringifyResource(extractResponse<V1Ingress>(await networkingApi.readNamespacedIngress({ name, namespace })))
    }
    if (kind === 'Namespace') {
      return stringifyResource(extractResponse<V1Namespace>(await coreApi.readNamespace({ name })))
    }
    if (kind === 'PersistentVolume') {
      return stringifyResource(extractResponse<V1PersistentVolume>(await coreApi.readPersistentVolume({ name })))
    }
    if (kind === 'PersistentVolumeClaim') {
      return stringifyResource(extractResponse<V1PersistentVolumeClaim>(await coreApi.readNamespacedPersistentVolumeClaim({ name, namespace })))
    }
    if (kind === 'StorageClass') {
      return stringifyResource(extractResponse<V1StorageClass>(await storageApi.readStorageClass({ name })))
    }
    if (kind === 'ServiceAccount') {
      return stringifyResource(extractResponse<V1ServiceAccount>(await coreApi.readNamespacedServiceAccount({ name, namespace })))
    }
    if (kind === 'Role') {
      return stringifyResource(extractResponse<V1Role>(await rbacApi.readNamespacedRole({ name, namespace })))
    }
    if (kind === 'RoleBinding') {
      return stringifyResource(extractResponse<V1RoleBinding>(await rbacApi.readNamespacedRoleBinding({ name, namespace })))
    }
    if (kind === 'ClusterRole') {
      return stringifyResource(extractResponse<V1ClusterRole>(await rbacApi.readClusterRole({ name })))
    }
    if (kind === 'ClusterRoleBinding') {
      return stringifyResource(extractResponse<V1ClusterRoleBinding>(await rbacApi.readClusterRoleBinding({ name })))
    }
    if (kind === 'HorizontalPodAutoscaler') {
      return stringifyResource(extractResponse<V2HorizontalPodAutoscaler>(await autoscalingApi.readNamespacedHorizontalPodAutoscaler({ name, namespace })))
    }
    if (kind === 'Event') {
      return stringifyResource(extractResponse<CoreV1Event>(await coreApi.readNamespacedEvent({ name, namespace })))
    }
    if (kind === 'Node') {
      return stringifyResource(extractResponse<V1Node>(await coreApi.readNode({ name })))
    }

    throw new Error(`Resource ${kind}/${name} not found`)
  } catch (err) {
    throw new Error(`获取YAML失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPersistentVolumes = async (contextId: string): Promise<PersistentVolumeInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    const res = await api.listPersistentVolume()
    const typedRes = res as { body?: { items?: V1PersistentVolume[] }; items?: V1PersistentVolume[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pv) => ({
      name: pv.metadata?.name ?? '',
      capacity: pv.spec?.capacity?.['storage'] ?? '',
      accessModes: pv.spec?.accessModes?.join(', ') ?? '',
      reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy ?? '',
      status: pv.status?.phase ?? '',
      storageClass: pv.spec?.storageClassName ?? '',
      age: formatAge(pv.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取PersistentVolume失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listPersistentVolumeClaims = async (contextId: string, namespace?: string): Promise<PersistentVolumeClaimInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedPersistentVolumeClaim({ namespace })
    } else {
      res = await api.listPersistentVolumeClaimForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1PersistentVolumeClaim[] }; items?: V1PersistentVolumeClaim[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((pvc) => ({
      name: pvc.metadata?.name ?? '',
      namespace: pvc.metadata?.namespace ?? '',
      status: pvc.status?.phase ?? '',
      capacity: pvc.status?.capacity?.['storage'] ?? pvc.spec?.resources?.requests?.['storage'] ?? '',
      accessModes: pvc.spec?.accessModes?.join(', ') ?? '',
      storageClass: pvc.spec?.storageClassName ?? '',
      age: formatAge(pvc.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取PersistentVolumeClaim失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listStorageClasses = async (contextId: string): Promise<StorageClassInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createStorageV1Api(entry)
  try {
    const res = await api.listStorageClass()
    const typedRes = res as { body?: { items?: V1StorageClass[] }; items?: V1StorageClass[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sc) => ({
      name: sc.metadata?.name ?? '',
      provisioner: sc.provisioner ?? '',
      reclaimPolicy: sc.reclaimPolicy ?? 'Delete',
      volumeBindingMode: sc.volumeBindingMode ?? 'Immediate',
      age: formatAge(sc.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取StorageClass失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listServiceAccounts = async (contextId: string, namespace?: string): Promise<ServiceAccountInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedServiceAccount({ namespace })
    } else {
      res = await api.listServiceAccountForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1ServiceAccount[] }; items?: V1ServiceAccount[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((sa) => ({
      name: sa.metadata?.name ?? '',
      namespace: sa.metadata?.namespace ?? '',
      secrets: sa.secrets?.length ?? 0,
      age: formatAge(sa.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取ServiceAccount失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listRoles = async (contextId: string, namespace?: string): Promise<RoleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedRole({ namespace })
    } else {
      res = await api.listRoleForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1Role[] }; items?: V1Role[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((role) => ({
      name: role.metadata?.name ?? '',
      namespace: role.metadata?.namespace ?? '',
      rules: role.rules?.length ?? 0,
      age: formatAge(role.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取Role失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listRoleBindings = async (contextId: string, namespace?: string): Promise<RoleBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedRoleBinding({ namespace })
    } else {
      res = await api.listRoleBindingForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V1RoleBinding[] }; items?: V1RoleBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((rb) => ({
      name: rb.metadata?.name ?? '',
      namespace: rb.metadata?.namespace ?? '',
      roleRef: `${rb.roleRef?.kind ?? ''}/${rb.roleRef?.name ?? ''}`,
      subjects: rb.subjects?.length ?? 0,
      age: formatAge(rb.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取RoleBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listClusterRoles = async (contextId: string): Promise<ClusterRoleInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    const res = await api.listClusterRole()
    const typedRes = res as { body?: { items?: V1ClusterRole[] }; items?: V1ClusterRole[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((cr) => ({
      name: cr.metadata?.name ?? '',
      rules: cr.rules?.length ?? 0,
      age: formatAge(cr.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取ClusterRole失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listClusterRoleBindings = async (contextId: string): Promise<ClusterRoleBindingInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createRbacV1Api(entry)
  try {
    const res = await api.listClusterRoleBinding()
    const typedRes = res as { body?: { items?: V1ClusterRoleBinding[] }; items?: V1ClusterRoleBinding[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((crb) => ({
      name: crb.metadata?.name ?? '',
      roleRef: `${crb.roleRef?.kind ?? ''}/${crb.roleRef?.name ?? ''}`,
      subjects: crb.subjects?.length ?? 0,
      age: formatAge(crb.metadata?.creationTimestamp)
    }))
  } catch (err) {
    throw new Error(`获取ClusterRoleBinding失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listHPAs = async (contextId: string, namespace?: string): Promise<HPAInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createAutoscalingV2Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedHorizontalPodAutoscaler({ namespace })
    } else {
      res = await api.listHorizontalPodAutoscalerForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: V2HorizontalPodAutoscaler[] }; items?: V2HorizontalPodAutoscaler[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((hpa) => {
      const ref = hpa.spec?.scaleTargetRef
      return {
        name: hpa.metadata?.name ?? '',
        namespace: hpa.metadata?.namespace ?? '',
        reference: ref ? `${ref.kind}/${ref.name}` : '',
        minPods: hpa.spec?.minReplicas ?? 1,
        maxPods: hpa.spec?.maxReplicas ?? 0,
        currentReplicas: hpa.status?.currentReplicas ?? 0,
        desiredReplicas: hpa.status?.desiredReplicas ?? 0,
        age: formatAge(hpa.metadata?.creationTimestamp)
      }
    })
  } catch (err) {
    throw new Error(`获取HorizontalPodAutoscaler失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const listEvents = async (contextId: string, namespace?: string): Promise<EventInfo[]> => {
  await ensureCache()
  const entry = getEntry(contextId)
  const api = createCoreV1Api(entry)
  try {
    let res: unknown
    if (namespace && namespace !== 'all') {
      res = await api.listNamespacedEvent({ namespace })
    } else {
      res = await api.listEventForAllNamespaces()
    }
    const typedRes = res as { body?: { items?: CoreV1Event[] }; items?: CoreV1Event[] }
    const items = typedRes.body?.items ?? typedRes.items ?? []
    return items.map((ev) => {
      const involvedObj = ev.involvedObject
      return {
        name: ev.metadata?.name ?? '',
        namespace: ev.metadata?.namespace ?? '',
        reason: ev.reason ?? '',
        message: ev.message ?? '',
        type: ev.type ?? 'Normal',
        object: involvedObj ? `${involvedObj.kind}/${involvedObj.name}` : '',
        count: ev.count ?? 1,
        age: formatAge(ev.metadata?.creationTimestamp)
      }
    })
  } catch (err) {
    throw new Error(`获取Event失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}
/* node:coverage enable */
