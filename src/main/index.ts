import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
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
  deleteCronJob,
  deleteDaemonSet,
  deleteDeployment,
  deleteJob,
  deleteNamespace,
  deletePod,
  deleteReplicaSet,
  deleteStatefulSet,
  getClusterHealth,
  getContextPrefs,
  getCronJobDetail,
  getDaemonSetDetail,
  getDeploymentDetail,
  getResourceYaml,
  updateContextGrouping,
  updateContextName,
  getEntry,
  getJobDetail,
  getNodeDetail,
  getPodDetail,
  getPodLogs,
  getReplicaSetDetail,
  getStatefulSetDetail,
  listClusterRoleBindings,
  listClusterRoles,
  listConfigMaps,
  listContexts,
  listCronJobs,
  listDaemonSets,
  listDeployments,
  listEvents,
  listHPAs,
  listIngresses,
  listJobs,
  listNamespaces,
  listNodes,
  listPersistentVolumeClaims,
  listPersistentVolumes,
  listPods,
  listReplicaSets,
  listRoleBindings,
  listRoles,
  listSecrets,
  listServiceAccounts,
  listServices,
  listStatefulSets,
  listStorageClasses,
  scaleDeployment,
  scaleReplicaSet,
  scaleStatefulSet,
  updateDeployment
} from './kube'

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

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'k7s',
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
}

app.whenReady().then(() => {
  // Start web server for remote access (runs alongside Electron)
  // Web server is only enabled when K7S_ENABLE_WEB=true is set
  const webPort = parseInt(process.env.K7S_WEB_PORT || '3000', 10)
  const enableWeb = process.env.K7S_ENABLE_WEB === 'true'
  if (enableWeb) {
    startWebServer(webPort)
    console.log(`k7s web server enabled on port ${webPort}`)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// IPC error handling helper with timeout
const DEFAULT_TIMEOUT = 30000 // 30 seconds

const wrapHandler = <T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  timeout = DEFAULT_TIMEOUT
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    })
    try {
      const result = await Promise.race([handler(...args), timeoutPromise])
      return result as Awaited<ReturnType<T>>
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`IPC Error: ${message}`)
    }
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('k7s:list-contexts', wrapHandler(async () => {
  return listContexts()
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

ipcMain.handle('k7s:list-namespaces', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNamespaces(contextId)
}))

ipcMain.handle('k7s:list-nodes', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNodes(contextId)
}))

ipcMain.handle('k7s:get-node-detail', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, nodeName: string) => {
  return getNodeDetail(contextId, nodeName)
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

ipcMain.handle('k7s:delete-namespace', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return deleteNamespace(contextId, name)
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

// Terminal state
let terminalPty: pty.IStandalone | null = null
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

ipcMain.handle('terminal:create', wrapHandler(async (_event, contextId: string) => {
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

ipcMain.handle('k7s:get-pod-logs', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, podName: string, containerName?: string, tailLines?: number) => {
  return getPodLogs(contextId, namespace, podName, containerName, tailLines)
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

ipcMain.handle('k7s:list-ingresses', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listIngresses(contextId, namespace)
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

ipcMain.handle('k7s:get-resource-yaml', wrapHandler(async (_event: IpcMainInvokeEvent, contextId: string, kind: string, namespace: string, name: string) => {
  return getResourceYaml(contextId, kind, namespace, name)
}))
