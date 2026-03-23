import { app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import * as pty from 'node-pty'
import {
  addKubeconfigPath,
  getContextPrefs,
  getCronJobDetail,
  getDaemonSetDetail,
  getDeploymentDetail,
  updateContextGrouping,
  updateContextName,
  getEntry,
  getJobDetail,
  getNodeDetail,
  getPodDetail,
  getReplicaSetDetail,
  getStatefulSetDetail,
  listContexts,
  listCronJobs,
  listDaemonSets,
  listDeployments,
  listJobs,
  listNamespaces,
  listNodes,
  listPods,
  listReplicaSets,
  listStatefulSets
} from './kube'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.commandLine.appendSwitch('no-sandbox')
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

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('k7s:list-contexts', async () => {
  return listContexts()
})

ipcMain.handle('k7s:get-context-prefs', async () => {
  return getContextPrefs()
})

ipcMain.handle('k7s:update-context-name', async (_event: IpcMainInvokeEvent, contextId: string, name: string) => {
  return updateContextName(contextId, name)
})

ipcMain.handle('k7s:update-context-grouping', async (_event: IpcMainInvokeEvent, payload: { groups: { id: string; name: string; items: string[] }[]; ungrouped: string[] }) => {
  return updateContextGrouping(payload.groups, payload.ungrouped)
})

ipcMain.handle('k7s:list-namespaces', async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNamespaces(contextId)
})

ipcMain.handle('k7s:list-nodes', async (_event: IpcMainInvokeEvent, contextId: string) => {
  return listNodes(contextId)
})

ipcMain.handle('k7s:get-node-detail', async (_event: IpcMainInvokeEvent, contextId: string, nodeName: string) => {
  return getNodeDetail(contextId, nodeName)
})

ipcMain.handle('k7s:get-pod-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, podName: string) => {
  return getPodDetail(contextId, namespace, podName)
})

ipcMain.handle('k7s:get-deployment-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getDeploymentDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:get-daemonset-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getDaemonSetDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:get-statefulset-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getStatefulSetDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:get-replicaset-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getReplicaSetDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:get-job-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getJobDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:get-cronjob-detail', async (_event: IpcMainInvokeEvent, contextId: string, namespace: string, name: string) => {
  return getCronJobDetail(contextId, namespace, name)
})

ipcMain.handle('k7s:list-pods', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listPods(contextId, namespace)
})

ipcMain.handle('k7s:list-deployments', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listDeployments(contextId, namespace)
})

ipcMain.handle('k7s:list-daemonsets', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listDaemonSets(contextId, namespace)
})

ipcMain.handle('k7s:list-statefulsets', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listStatefulSets(contextId, namespace)
})

ipcMain.handle('k7s:list-replicasets', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listReplicaSets(contextId, namespace)
})

ipcMain.handle('k7s:list-jobs', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listJobs(contextId, namespace)
})

ipcMain.handle('k7s:list-cronjobs', async (_event: IpcMainInvokeEvent, contextId: string, namespace?: string) => {
  return listCronJobs(contextId, namespace)
})

ipcMain.handle('k7s:add-kubeconfig', async () => {
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
})

// Terminal state
let terminalPty: pty.IStandalone | null = null
let terminalDataCallbacks: ((data: string) => void)[] = []
let terminalExitCallbacks: ((exitCode: number) => void)[] = []

ipcMain.handle('terminal:create', async (_event, contextId: string) => {
  if (terminalPty) {
    terminalPty.kill()
    terminalPty = null
  }

  const entry = getEntry(contextId)
  entry.kubeConfig.setCurrentContext(entry.contextName)

  // Export kubeconfig to temp file
  const tempKubeconfig = path.join(os.tmpdir(), `k7s-${Date.now()}.yaml`)
  const kubeconfigContent = entry.kubeConfig.exportConfig()
  await fs.writeFile(tempKubeconfig, kubeconfigContent, 'utf-8')

  const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'zsh')
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
    terminalDataCallbacks.forEach(cb => cb(data))
  })

  terminalPty.onExit(({ exitCode }) => {
    terminalExitCallbacks.forEach(cb => cb(exitCode))
    terminalDataCallbacks = []
    terminalExitCallbacks = []
    terminalPty = null
    // Clean up temp file
    fs.unlink(tempKubeconfig, () => {})
  })

  return { shell, cwd }
})

ipcMain.handle('terminal:write', async (_event, data: string) => {
  if (terminalPty) {
    terminalPty.write(data)
  }
})

ipcMain.handle('terminal:resize', async (_event, cols: number, rows: number) => {
  if (terminalPty) {
    terminalPty.resize(cols, rows)
  }
})

ipcMain.handle('terminal:destroy', async () => {
  if (terminalPty) {
    terminalPty.kill()
    terminalPty = null
  }
  terminalDataCallbacks = []
  terminalExitCallbacks = []
})

ipcMain.on('terminal:onData', (_event, callback: (data: string) => void) => {
  terminalDataCallbacks.push(callback)
})

ipcMain.on('terminal:onExit', (_event, callback: (exitCode: number) => void) => {
  terminalExitCallbacks.push(callback)
})
