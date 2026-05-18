/* node:coverage disable */
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import type { IpcMainInvokeEvent } from 'electron'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import crypto from 'node:crypto'
import * as pty from 'node-pty'
import { startWebServer } from './webServer'
import {
  addKubeconfigPath,
  applyYaml,
  createConfigMap,
  createDeployment,
  createIngress,
  createNamespace,
  createSecret,
  createService,
  checkCanI,
  cordonNode,
  deleteCronJob,
  deleteCustomResourceDefinition,
  deleteCustomResourceInstance,
  deleteDaemonSet,
  deleteDeployment,
  deleteJob,
  deleteNamespace,
  deleteNode,
  deletePod,
  deleteResource,
  deleteReplicaSet,
  deleteStatefulSet,
  drainNode,
  evictPod,
  forceDeletePod,
  getClusterHealth,
  getContextPrefs,
  getCronJobDetail,
  getCustomResourceInstanceYaml,
  getDaemonSetDetail,
  getDeploymentDetail,
  getResourceYaml,
  updateContextGrouping,
  updateAppTheme,
  updateContextName,
  getEntry,
  getJobDetail,
  getNodeDetail,
  getNodeMetrics,
  getPodDetail,
  getPodLogs,
  getReplicaSetDetail,
  getReplicationControllerDetail,
  getStatefulSetDetail,
  listAPIGroups,
  listAPIServices,
  listAPIResources,
  listCertificateSigningRequests,
  listClusterTrustBundles,
  listClusterRoleBindings,
  listClusterRoles,
  listComponentStatuses,
  listConfigMaps,
  listControllerRevisions,
  listContexts,
  listCronJobs,
  listCSIDrivers,
  listCSIStorageCapacities,
  listCSINodes,
  listCustomResourceDefinitions,
  listCustomResourceInstances,
  listDaemonSets,
  listDeployments,
  listDeviceClasses,
  listDeviceTaintRules,
  listEndpoints,
  listEndpointSlices,
  listEvents,
  listFlowSchemas,
  listGatewayClasses,
  listGateways,
  listGRPCRoutes,
  listHelmReleases,
  listHTTPRoutes,
  listHPAs,
  listIngressClasses,
  listIngresses,
  listIPAddresses,
  listJobs,
  listAPIServerHealth,
  listLeaseCandidates,
  listLeases,
  listLimitRanges,
  listMutatingAdmissionPolicies,
  listMutatingAdmissionPolicyBindings,
  listMutatingWebhookConfigurations,
  listNamespaces,
  listNetworkPolicies,
  listNodes,
  listOpenIDConfigurations,
  listPodCertificateRequests,
  listPodDisruptionBudgets,
  listPersistentVolumeClaims,
  listPersistentVolumes,
  listPods,
  listPodTemplates,
  listPriorityClasses,
  listPriorityLevelConfigurations,
  listReplicaSets,
  listReplicationControllers,
  listReferenceGrants,
  listResourceClaimTemplates,
  listResourceClaims,
  listResourceQuotas,
  listResourceSlices,
  listRoleBindings,
  listRoles,
  listRuntimeClasses,
  listSecrets,
  listServiceCIDRs,
  listServiceAccounts,
  listSelfSubjectAccessReviews,
  listSelfSubjectReviews,
  listSelfSubjectRulesReviews,
  listServerVersions,
  listServices,
  listStatefulSets,
  listStorageClasses,
  listStorageVersionMigrations,
  listStorageVersions,
  listVolumeAttributesClasses,
  listTCPRoutes,
  listTLSRoutes,
  listUDPRoutes,
  listValidatingAdmissionPolicies,
  listValidatingAdmissionPolicyBindings,
  listValidatingWebhookConfigurations,
  listVolumeAttachments,
  listVolumeSnapshotClasses,
  listVolumeSnapshotContents,
  listVolumeSnapshots,
  pauseWorkload,
  restartWorkload,
  resumeWorkload,
  scaleDeployment,
  scaleReplicaSet,
  scaleWorkload,
  setKubeContextNamespace,
  setWorkloadImage,
  scaleStatefulSet,
  uncordonNode,
  useKubeContext,
  triggerCronJob,
  updateCertificateSigningRequestApproval,
  updateJobSuspension,
  updateDeployment,
} from './kube'
import {
  describeResource,
  diffYaml,
  addHelmRepository,
  helmReleaseAll,
  helmReleaseHistory,
  helmReleaseHooks,
  helmReleaseManifest,
  helmReleaseMetadata,
  helmReleaseNotes,
  helmReleaseResources,
  helmReleaseStatus,
  helmReleaseValues,
  installOrUpgradeHelmRelease,
  listHelmCharts,
  listHelmRepositories,
  listPortForwards,
  mutateResourceMetadata,
  removeHelmRepository,
  rollbackHelmRelease,
  rollbackWorkload,
  rolloutHistory,
  rolloutStatus,
  startPodExec,
  startPodLogStream,
  startPortForward,
  stopPodExec,
  stopPodLogStream,
  stopPortForward,
  subscribeToContextWatch,
  testHelmRelease,
  uninstallHelmRelease,
  unsubscribeFromContextWatch,
  updateHelmRepository,
} from './runtime'
import type {
  AppThemeName,
  CanIReviewRequest,
  CertificateSigningRequestDecision,
  HelmReleaseUpgradeRequest,
  K7sPushEvent,
  JobSuspensionKind,
  KubernetesResourceKind,
  PausableWorkloadKind,
  PodExecData,
  PodLogStreamRequest,
  PortForwardRequest,
  PortForwardSessionInfo,
  RolloutWorkloadKind,
  ScaleableWorkloadKind,
  WorkloadImageKind,
} from '../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ensureWritableDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true })
  const probePath = path.join(dir, '.probe')
  fs.writeFileSync(probePath, '1')
  fs.unlinkSync(probePath)
}

const configureDataDirs = () => {
  const preferredUserData = app.getPath('userData')
  try {
    ensureWritableDir(preferredUserData)
    app.commandLine.appendSwitch('disk-cache-dir', path.join(preferredUserData, 'cache'))
    return
  } catch {
    const fallbackUserData = path.join(process.cwd(), '.k7s-userdata')
    ensureWritableDir(fallbackUserData)
    app.setPath('userData', fallbackUserData)
    app.commandLine.appendSwitch('disk-cache-dir', path.join(fallbackUserData, 'cache'))
  }
}

configureDataDirs()

let mainWindow: BrowserWindow | null = null
const ELECTRON_WATCH_OWNER = 'electron-main-window'
const DEFAULT_APP_THEME: AppThemeName = 'aurora'
const SHELL_THEME_COLORS: Record<AppThemeName, string> = {
  aurora: '#03080f',
  ocean: '#031018',
  forest: '#06100b',
  ember: '#110909',
  graphite: '#d9e2ec',
}

const getShellThemeColor = (theme: AppThemeName) => SHELL_THEME_COLORS[theme] ?? SHELL_THEME_COLORS[DEFAULT_APP_THEME]

const getInitialAppTheme = async (): Promise<AppThemeName> => {
  try {
    const prefs = await getContextPrefs()
    return prefs.theme
  } catch {
    return DEFAULT_APP_THEME
  }
}

const applyWindowTheme = (theme: AppThemeName, win = mainWindow) => {
  if (win && typeof win.setBackgroundColor === 'function') {
    win.setBackgroundColor(getShellThemeColor(theme))
  }
}

const emitPushEvent = (event: K7sPushEvent) => {
  mainWindow?.webContents.send('k7s:push-event', event)
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'k7s',
    backgroundColor: getShellThemeColor(DEFAULT_APP_THEME),
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 13, y: 13 },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_RENDERER_URL
  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  void getInitialAppTheme().then((theme) => applyWindowTheme(theme, win))
}

app.whenReady().then(() => {
  // Start optional local web server (runs alongside Electron)
  // Web server is only enabled when K7S_ENABLE_WEB=true is set
  const parsedWebPort = Number.parseInt(process.env.K7S_WEB_PORT || '3000', 10)
  const webPort = Number.isInteger(parsedWebPort) && parsedWebPort > 0 ? parsedWebPort : 3000
  const webHost = process.env.K7S_WEB_HOST || '127.0.0.1'
  const enableWeb = process.env.K7S_ENABLE_WEB === 'true'
  const noWindow = process.env.K7S_NO_WINDOW === 'true'
  if (enableWeb) {
    startWebServer(webPort, {
      host: webHost,
      rendererDevServerUrl: process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_RENDERER_URL,
    })
    console.log(`k7s web server enabled on ${webHost}:${webPort}`)
  }

  if (!noWindow) {
    createWindow()
  }

  app.on('activate', () => {
    if (!noWindow && BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// IPC error handling helper with timeout
const DEFAULT_TIMEOUT = 30000 // 30 seconds

const wrapHandler = <TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
  timeout = DEFAULT_TIMEOUT
) => {
  return async (...args: TArgs): Promise<TResult> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeout)
    })
    try {
      const result = await Promise.race([handler(...args), timeoutPromise])
      return result as TResult
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`IPC Error: ${message}`)
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }
}

app.on('window-all-closed', () => {
  void unsubscribeFromContextWatch(ELECTRON_WATCH_OWNER)
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('k7s:list-contexts', wrapHandler(async () => {
  return listContexts()
}))

ipcMain.handle('k7s:use-kube-context', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return useKubeContext(contextId)
}))

ipcMain.handle('k7s:set-kube-context-namespace', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string) => {
  return setKubeContextNamespace(contextId, namespace)
}))

ipcMain.handle('k7s:get-context-prefs', wrapHandler(async () => {
  return getContextPrefs()
}))

ipcMain.handle('k7s:update-context-name', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return updateContextName(contextId, name)
}))

ipcMain.handle('k7s:update-context-grouping', wrapHandler(async (_event: IpcMainInvokeEvent, payload: { groups: { id: string; name: string; items: string[] }[]; ungrouped: string[] }) => {
  return updateContextGrouping(payload.groups, payload.ungrouped)
}))

ipcMain.handle('k7s:update-app-theme', wrapHandler(async (_event: IpcMainInvokeEvent, theme: AppThemeName) => {
  const prefs = await updateAppTheme(theme)
  applyWindowTheme(prefs.theme)
  return prefs
}))

ipcMain.handle('k7s:list-namespaces', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNamespaces(contextId)
}))

ipcMain.handle('k7s:list-componentstatuses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listComponentStatuses(contextId)
}))

ipcMain.handle('k7s:list-apigroups', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listAPIGroups(contextId)
}))

ipcMain.handle('k7s:list-apiresources', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listAPIResources(contextId)
}))

ipcMain.handle('k7s:list-serverversions', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listServerVersions(contextId)
}))

ipcMain.handle('k7s:list-openidconfigs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listOpenIDConfigurations(contextId)
}))

ipcMain.handle('k7s:list-apiserverhealth', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listAPIServerHealth(contextId)
}))

ipcMain.handle('k7s:list-selfsubjectreviews', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listSelfSubjectReviews(contextId)
}))

ipcMain.handle('k7s:list-selfsubjectaccessreviews', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespaces?: string | string[]) => {
  return listSelfSubjectAccessReviews(contextId, namespaces)
}))

ipcMain.handle('k7s:check-can-i', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, request: CanIReviewRequest) => {
  return checkCanI(contextId, request)
}))

ipcMain.handle('k7s:list-selfsubjectrulesreviews', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespaces?: string | string[]) => {
  return listSelfSubjectRulesReviews(contextId, namespaces)
}))

ipcMain.handle('k7s:list-nodes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNodes(contextId)
}))

ipcMain.handle('k7s:get-node-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, nodeName: string) => {
  return getNodeDetail(contextId, nodeName)
}))

ipcMain.handle('k7s:get-node-metrics', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, nodeName: string) => {
  return getNodeMetrics(contextId, nodeName)
}))

ipcMain.handle('k7s:get-pod-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, podName: string) => {
  return getPodDetail(contextId, namespace, podName)
}))

ipcMain.handle('k7s:get-deployment-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getDeploymentDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-daemonset-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getDaemonSetDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-statefulset-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getStatefulSetDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-replicaset-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getReplicaSetDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-replicationcontroller-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getReplicationControllerDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-job-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getJobDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:get-cronjob-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getCronJobDetail(contextId, namespace, name)
}))

ipcMain.handle('k7s:list-pods', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPods(contextId, namespace)
}))

ipcMain.handle('k7s:list-deployments', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listDeployments(contextId, namespace)
}))

ipcMain.handle('k7s:list-daemonsets', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listDaemonSets(contextId, namespace)
}))

ipcMain.handle('k7s:list-statefulsets', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listStatefulSets(contextId, namespace)
}))

ipcMain.handle('k7s:list-replicasets', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listReplicaSets(contextId, namespace)
}))

ipcMain.handle('k7s:list-replicationcontrollers', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listReplicationControllers(contextId, namespace)
}))

ipcMain.handle('k7s:list-controllerrevisions', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listControllerRevisions(contextId, namespace)
}))

ipcMain.handle('k7s:list-podtemplates', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPodTemplates(contextId, namespace)
}))

ipcMain.handle('k7s:list-jobs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listJobs(contextId, namespace)
}))

ipcMain.handle('k7s:list-cronjobs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listCronJobs(contextId, namespace)
}))

ipcMain.handle('k7s:add-kubeconfig', wrapHandler(async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Kubeconfig', extensions: ['yaml', 'yml', 'conf', 'config'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) {
    const contexts = await listContexts()
    return { contexts, addedIds: [] }
  }
  const filePath = result.filePaths[0]
  return addKubeconfigPath(filePath)
}))

// Delete handlers
ipcMain.handle('k7s:delete-pod', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deletePod(contextId, namespace, name)
}))

ipcMain.handle('k7s:evict-pod', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return evictPod(contextId, namespace, name)
}))

ipcMain.handle('k7s:force-delete-pod', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return forceDeletePod(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-deployment', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteDeployment(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-daemonset', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteDaemonSet(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-statefulset', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteStatefulSet(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-replicaset', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteReplicaSet(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-job', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteJob(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-cronjob', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return deleteCronJob(contextId, namespace, name)
}))

ipcMain.handle('k7s:trigger-cronjob', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return triggerCronJob(contextId, namespace, name)
}))

ipcMain.handle('k7s:delete-namespace', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return deleteNamespace(contextId, name)
}))

ipcMain.handle('k7s:cordon-node', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return cordonNode(contextId, name)
}))

ipcMain.handle('k7s:uncordon-node', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return uncordonNode(contextId, name)
}))

ipcMain.handle('k7s:drain-node', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return drainNode(contextId, name)
}))

ipcMain.handle('k7s:delete-node', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return deleteNode(contextId, name)
}))

ipcMain.handle('k7s:delete-customresourcedefinition', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return deleteCustomResourceDefinition(contextId, name)
}))

ipcMain.handle('k7s:delete-customresource-instance', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  crdName: string,
  namespace: string,
  name: string
) => {
  return deleteCustomResourceInstance(contextId, crdName, namespace, name)
}))

// Scale handlers
ipcMain.handle('k7s:scale-deployment', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string, replicas: number) => {
  return scaleDeployment(contextId, namespace, name, replicas)
}))

ipcMain.handle('k7s:scale-statefulset', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string, replicas: number) => {
  return scaleStatefulSet(contextId, namespace, name, replicas)
}))

ipcMain.handle('k7s:scale-replicaset', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string, replicas: number) => {
  return scaleReplicaSet(contextId, namespace, name, replicas)
}))

ipcMain.handle('k7s:delete-resource', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: KubernetesResourceKind,
  namespace: string,
  name: string
) => {
  return deleteResource(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:scale-workload', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: ScaleableWorkloadKind,
  namespace: string,
  name: string,
  replicas: number
) => {
  return scaleWorkload(contextId, kind, namespace, name, replicas)
}))

ipcMain.handle('k7s:restart-workload', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
) => {
  return restartWorkload(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:set-workload-image', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: WorkloadImageKind,
  namespace: string,
  name: string,
  containerName: string,
  image: string,
) => {
  return setWorkloadImage(contextId, kind, namespace, name, containerName, image)
}))

ipcMain.handle('k7s:install-or-upgrade-helm-release', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  request: HelmReleaseUpgradeRequest,
) => {
  return installOrUpgradeHelmRelease(contextId, request)
}))

ipcMain.handle('k7s:add-helm-repository', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  name: string,
  url: string,
) => {
  return addHelmRepository(contextId, name, url)
}))

ipcMain.handle('k7s:update-helm-repository', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  name?: string,
) => {
  return updateHelmRepository(contextId, name)
}))

ipcMain.handle('k7s:remove-helm-repository', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  name: string,
) => {
  return removeHelmRepository(contextId, name)
}))

ipcMain.handle('k7s:rollback-workload', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
) => {
  return rollbackWorkload(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:rollback-helm-release', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
  revision?: number,
) => {
  return rollbackHelmRelease(contextId, namespace, name, revision)
}))

ipcMain.handle('k7s:rollout-history', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
) => {
  return rolloutHistory(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:helm-release-history', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseHistory(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-status', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseStatus(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-resources', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseResources(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-manifest', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseManifest(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-metadata', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseMetadata(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-values', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseValues(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-notes', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseNotes(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-hooks', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseHooks(contextId, namespace, name)
}))

ipcMain.handle('k7s:helm-release-all', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return helmReleaseAll(contextId, namespace, name)
}))

ipcMain.handle('k7s:test-helm-release', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string,
) => {
  return testHelmRelease(contextId, namespace, name)
}))

ipcMain.handle('k7s:rollout-status', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: RolloutWorkloadKind,
  namespace: string,
  name: string
) => {
  return rolloutStatus(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:uninstall-helm-release', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  namespace: string,
  name: string
) => {
  return uninstallHelmRelease(contextId, namespace, name)
}))

ipcMain.handle('k7s:pause-workload', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: PausableWorkloadKind,
  namespace: string,
  name: string
) => {
  return pauseWorkload(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:resume-workload', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: PausableWorkloadKind,
  namespace: string,
  name: string
) => {
  return resumeWorkload(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:update-job-suspension', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: JobSuspensionKind,
  namespace: string,
  name: string,
  suspend: boolean
) => {
  return updateJobSuspension(contextId, kind, namespace, name, suspend)
}))

ipcMain.handle('k7s:subscribe-watch', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  await subscribeToContextWatch(ELECTRON_WATCH_OWNER, contextId, emitPushEvent)
  return { success: true }
}))

ipcMain.handle('k7s:unsubscribe-watch', wrapHandler(async () => {
  await unsubscribeFromContextWatch(ELECTRON_WATCH_OWNER)
  return { success: true }
}))

// Terminal state
let terminalPty: pty.IPty | null = null
let terminalLock: Promise<void> = Promise.resolve()

// Track temp kubeconfig files for cleanup
const tempKubeconfigFiles: string[] = []

// Cleanup handler for temp files
const cleanupTempKubeconfig = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Register global cleanup for abnormal exits
process.on('exit', () => {
  tempKubeconfigFiles.forEach(cleanupTempKubeconfig)
})
process.on('SIGTERM', () => {
  tempKubeconfigFiles.forEach(cleanupTempKubeconfig)
  process.exit(0)
})
process.on('SIGINT', () => {
  tempKubeconfigFiles.forEach(cleanupTempKubeconfig)
  process.exit(0)
})

ipcMain.handle('terminal:create', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  let resolveLock!: () => void
  const prevLock = terminalLock
  terminalLock = new Promise<void>(resolve => { resolveLock = resolve })
  await prevLock

  try {
    if (terminalPty) {
      terminalPty.kill()
      terminalPty = null
    }

    const entry = getEntry(contextId)
    entry.kubeConfig.setCurrentContext(entry.contextName)

    // Use crypto.randomUUID() for secure temp file naming
    const tempKubeconfig = path.join(os.tmpdir(), `k7s-${crypto.randomUUID()}.yaml`)
    const kubeconfigContent = entry.kubeConfig.exportConfig()
    await fsPromises.writeFile(tempKubeconfig, kubeconfigContent, { mode: 0o600 })

    // Track for cleanup
    tempKubeconfigFiles.push(tempKubeconfig)

    const shellEnv = process.env.SHELL || ''
    const shell = process.platform === 'win32'
      ? 'powershell.exe'
      : (/^[a-zA-Z0-9/_-]+$/.test(shellEnv) ? shellEnv : '/bin/sh')
    const cwd = os.homedir()

    terminalPty = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: {
        ...process.env,
        KUBECONFIG: tempKubeconfig
      } as Record<string, string>
    })

    terminalPty.onData((data) => {
      mainWindow?.webContents.send('terminal:data', data)
    })

    terminalPty.onExit(({ exitCode }) => {
      mainWindow?.webContents.send('terminal:exit', exitCode)
      terminalPty = null
      // Clean up temp file
      cleanupTempKubeconfig(tempKubeconfig)
      const index = tempKubeconfigFiles.indexOf(tempKubeconfig)
      if (index > -1) {
        tempKubeconfigFiles.splice(index, 1)
      }
    })

    return { shell, cwd }
  } finally {
    resolveLock()
  }
}, 10000))

ipcMain.handle('terminal:write', async (_event, data: string) => {
  await terminalLock
  if (terminalPty) {
    terminalPty.write(data)
  }
})

ipcMain.handle('terminal:resize', async (_event, cols: number, rows: number) => {
  await terminalLock
  if (terminalPty) {
    terminalPty.resize(cols, rows)
  }
})

ipcMain.handle('terminal:destroy', async () => {
  let resolveLock!: () => void
  const prevLock = terminalLock
  terminalLock = new Promise<void>(resolve => { resolveLock = resolve })
  await prevLock

  try {
    if (terminalPty) {
      terminalPty.kill()
      terminalPty = null
    }
  } finally {
    resolveLock()
  }
})

ipcMain.handle('k7s:get-pod-logs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number, previous?: boolean, timestamps?: boolean) => {
  return getPodLogs(contextId, namespace, podName, containerName, tailLines, previous, timestamps)
}))

ipcMain.handle('k7s:start-pod-log-stream', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  request: PodLogStreamRequest
) => {
  return startPodLogStream(contextId, request, emitPushEvent)
}))

ipcMain.handle('k7s:stop-pod-log-stream', wrapHandler(async (_event: IpcMainInvokeEvent, streamId: string) => {
  await stopPodLogStream(streamId)
  return { success: true }
}))

ipcMain.handle('k7s:start-pod-exec', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  request: PodExecData
) => {
  return startPodExec(contextId, request, emitPushEvent)
}))

ipcMain.handle('k7s:stop-pod-exec', wrapHandler(async (_event: IpcMainInvokeEvent, sessionId: string) => {
  await stopPodExec(sessionId)
  return { success: true }
}))

ipcMain.handle('k7s:start-port-forward', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  request: PortForwardRequest
) => {
  return startPortForward(contextId, request, emitPushEvent)
}, 15000))

ipcMain.handle('k7s:list-port-forwards', wrapHandler(async (): Promise<PortForwardSessionInfo[]> => {
  return listPortForwards()
}))

ipcMain.handle('k7s:stop-port-forward', wrapHandler(async (_event: IpcMainInvokeEvent, sessionId: string) => {
  await stopPortForward(sessionId)
  return { success: true }
}))

// Cluster health
ipcMain.handle('k7s:get-cluster-health', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return getClusterHealth(contextId)
}))

// List new resource types
ipcMain.handle('k7s:list-services', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listServices(contextId, namespace)
}))

ipcMain.handle('k7s:list-configmaps', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listConfigMaps(contextId, namespace)
}))

ipcMain.handle('k7s:list-secrets', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listSecrets(contextId, namespace)
}))

ipcMain.handle('k7s:list-endpoints', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listEndpoints(contextId, namespace)
}))

ipcMain.handle('k7s:list-ingresses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listIngresses(contextId, namespace)
}))

ipcMain.handle('k7s:list-ingressclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listIngressClasses(contextId)
}))

ipcMain.handle('k7s:list-helmreleases', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listHelmReleases(contextId, namespace)
}))

ipcMain.handle('k7s:list-helmcharts', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listHelmCharts(contextId)
}))

ipcMain.handle('k7s:list-helmrepositories', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listHelmRepositories(contextId)
}))

ipcMain.handle('k7s:list-networkpolicies', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listNetworkPolicies(contextId, namespace)
}))

ipcMain.handle('k7s:list-ipaddresses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listIPAddresses(contextId)
}))

ipcMain.handle('k7s:list-servicecidrs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listServiceCIDRs(contextId)
}))

ipcMain.handle('k7s:list-endpointslices', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listEndpointSlices(contextId, namespace)
}))

ipcMain.handle('k7s:list-apiservices', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listAPIServices(contextId)
}))

ipcMain.handle('k7s:list-mutatingwebhookconfigurations', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listMutatingWebhookConfigurations(contextId)
}))

ipcMain.handle('k7s:list-validatingwebhookconfigurations', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listValidatingWebhookConfigurations(contextId)
}))

ipcMain.handle('k7s:list-mutatingadmissionpolicies', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listMutatingAdmissionPolicies(contextId)
}))

ipcMain.handle('k7s:list-mutatingadmissionpolicybindings', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listMutatingAdmissionPolicyBindings(contextId)
}))

ipcMain.handle('k7s:list-validatingadmissionpolicies', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listValidatingAdmissionPolicies(contextId)
}))

ipcMain.handle('k7s:list-validatingadmissionpolicybindings', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listValidatingAdmissionPolicyBindings(contextId)
}))

ipcMain.handle('k7s:list-flowschemas', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listFlowSchemas(contextId)
}))

ipcMain.handle('k7s:list-prioritylevelconfigurations', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listPriorityLevelConfigurations(contextId)
}))

ipcMain.handle('k7s:list-certificatesigningrequests', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listCertificateSigningRequests(contextId)
}))

ipcMain.handle('k7s:update-certificate-signing-request-approval', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  name: string,
  decision: CertificateSigningRequestDecision,
) => {
  return updateCertificateSigningRequestApproval(contextId, name, decision)
}))

ipcMain.handle('k7s:list-clustertrustbundles', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listClusterTrustBundles(contextId)
}))

ipcMain.handle('k7s:list-podcertificaterequests', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPodCertificateRequests(contextId, namespace)
}))

ipcMain.handle('k7s:list-storageversions', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listStorageVersions(contextId)
}))

ipcMain.handle('k7s:list-storageversionmigrations', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listStorageVersionMigrations(contextId)
}))

ipcMain.handle('k7s:list-poddisruptionbudgets', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPodDisruptionBudgets(contextId, namespace)
}))

ipcMain.handle('k7s:list-resourcequotas', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listResourceQuotas(contextId, namespace)
}))

ipcMain.handle('k7s:list-limitranges', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listLimitRanges(contextId, namespace)
}))

ipcMain.handle('k7s:list-leases', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listLeases(contextId, namespace)
}))

ipcMain.handle('k7s:list-leasecandidates', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listLeaseCandidates(contextId, namespace)
}))

ipcMain.handle('k7s:list-priorityclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listPriorityClasses(contextId)
}))

ipcMain.handle('k7s:list-runtimeclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listRuntimeClasses(contextId)
}))

ipcMain.handle('k7s:list-persistentvolumes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listPersistentVolumes(contextId)
}))

ipcMain.handle('k7s:list-persistentvolumeclaims', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPersistentVolumeClaims(contextId, namespace)
}))

ipcMain.handle('k7s:list-storageclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listStorageClasses(contextId)
}))

ipcMain.handle('k7s:list-volumeattributesclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listVolumeAttributesClasses(contextId)
}))

ipcMain.handle('k7s:list-csidrivers', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listCSIDrivers(contextId)
}))

ipcMain.handle('k7s:list-csinodes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listCSINodes(contextId)
}))

ipcMain.handle('k7s:list-volumeattachments', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listVolumeAttachments(contextId)
}))

ipcMain.handle('k7s:list-csistoragecapacities', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listCSIStorageCapacities(contextId, namespace)
}))

ipcMain.handle('k7s:list-volumesnapshotclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listVolumeSnapshotClasses(contextId)
}))

ipcMain.handle('k7s:list-volumesnapshots', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listVolumeSnapshots(contextId, namespace)
}))

ipcMain.handle('k7s:list-volumesnapshotcontents', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listVolumeSnapshotContents(contextId)
}))

ipcMain.handle('k7s:list-gatewayclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listGatewayClasses(contextId)
}))

ipcMain.handle('k7s:list-gateways', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listGateways(contextId, namespace)
}))

ipcMain.handle('k7s:list-httproutes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listHTTPRoutes(contextId, namespace)
}))

ipcMain.handle('k7s:list-grpcroutes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listGRPCRoutes(contextId, namespace)
}))

ipcMain.handle('k7s:list-tlsroutes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listTLSRoutes(contextId, namespace)
}))

ipcMain.handle('k7s:list-tcproutes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listTCPRoutes(contextId, namespace)
}))

ipcMain.handle('k7s:list-udproutes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listUDPRoutes(contextId, namespace)
}))

ipcMain.handle('k7s:list-referencegrants', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listReferenceGrants(contextId, namespace)
}))

ipcMain.handle('k7s:list-deviceclasses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listDeviceClasses(contextId)
}))

ipcMain.handle('k7s:list-resourceclaims', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listResourceClaims(contextId, namespace)
}))

ipcMain.handle('k7s:list-resourceclaimtemplates', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listResourceClaimTemplates(contextId, namespace)
}))

ipcMain.handle('k7s:list-resourceslices', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listResourceSlices(contextId)
}))

ipcMain.handle('k7s:list-devicetaintrules', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listDeviceTaintRules(contextId)
}))

ipcMain.handle('k7s:list-serviceaccounts', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listServiceAccounts(contextId, namespace)
}))

ipcMain.handle('k7s:list-roles', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listRoles(contextId, namespace)
}))

ipcMain.handle('k7s:list-rolebindings', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listRoleBindings(contextId, namespace)
}))

ipcMain.handle('k7s:list-clusterroles', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listClusterRoles(contextId)
}))

ipcMain.handle('k7s:list-clusterrolebindings', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listClusterRoleBindings(contextId)
}))

ipcMain.handle('k7s:list-customresourcedefinitions', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listCustomResourceDefinitions(contextId)
}))

ipcMain.handle('k7s:list-customresource-instances', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  crdName: string,
  namespace?: string
) => {
  return listCustomResourceInstances(contextId, crdName, namespace)
}))

ipcMain.handle('k7s:list-horizontalpodautoscalers', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listHPAs(contextId, namespace)
}))

ipcMain.handle('k7s:list-events', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listEvents(contextId, namespace)
}))

// Create operations
ipcMain.handle('k7s:create-namespace', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return createNamespace(contextId, name)
}))

ipcMain.handle('k7s:create-deployment', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, data: unknown) => {
  return createDeployment(contextId, data as Parameters<typeof createDeployment>[1])
}))

ipcMain.handle('k7s:create-service', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, data: unknown) => {
  return createService(contextId, data as Parameters<typeof createService>[1])
}))

ipcMain.handle('k7s:create-configmap', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, data: unknown) => {
  return createConfigMap(contextId, data as Parameters<typeof createConfigMap>[1])
}))

ipcMain.handle('k7s:create-secret', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, data: unknown) => {
  return createSecret(contextId, data as Parameters<typeof createSecret>[1])
}))

ipcMain.handle('k7s:create-ingress', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, data: unknown) => {
  return createIngress(contextId, data as Parameters<typeof createIngress>[1])
}))

// Update operations
ipcMain.handle('k7s:update-deployment', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string, data: unknown) => {
  return updateDeployment(contextId, namespace, name, data as Parameters<typeof updateDeployment>[3])
}))

// YAML operations
ipcMain.handle('k7s:apply-yaml', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, yaml: string) => {
  return applyYaml(contextId, yaml)
}))

ipcMain.handle('k7s:diff-yaml', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, yaml: string) => {
  return diffYaml(contextId, yaml)
}))

ipcMain.handle('k7s:get-resource-yaml', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, kind: string, namespace: string, name: string) => {
  return getResourceYaml(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:describe-resource', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, kind: string, namespace: string, name: string) => {
  return describeResource(contextId, kind, namespace, name)
}))

ipcMain.handle('k7s:mutate-resource-metadata', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  kind: string,
  namespace: string,
  name: string,
  field: 'labels' | 'annotations',
  key: string,
  value: string,
  remove: boolean,
) => {
  return mutateResourceMetadata(contextId, kind, namespace, name, field, key, value, remove)
}))

ipcMain.handle('k7s:get-customresource-instance-yaml', wrapHandler(async (
  _event: IpcMainInvokeEvent,
  contextId: string,
  crdName: string,
  namespace: string,
  name: string
) => {
  return getCustomResourceInstanceYaml(contextId, crdName, namespace, name)
}))
/* node:coverage enable */
