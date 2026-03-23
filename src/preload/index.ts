import { contextBridge, ipcRenderer } from 'electron'
import {
  AddContextsResult,
  ContextRecord,
  CronJobInfo,
  DaemonSetInfo,
  DeploymentInfo,
  JobInfo,
  NamespaceInfo,
  NodeInfo,
  PodInfo,
  ReplicaSetInfo,
  StatefulSetInfo,
  ContextPrefs,
  ContextGroup
} from '../shared/types'

contextBridge.exposeInMainWorld('k7s', {
  listContexts: (): Promise<ContextRecord[]> => ipcRenderer.invoke('k7s:list-contexts'),
  listNamespaces: (contextId: string): Promise<NamespaceInfo[]> =>
    ipcRenderer.invoke('k7s:list-namespaces', contextId),
  listNodes: (contextId: string): Promise<NodeInfo[]> =>
    ipcRenderer.invoke('k7s:list-nodes', contextId),
  getNodeDetail: (contextId: string, nodeName: string): Promise<NodeInfo> =>
    ipcRenderer.invoke('k7s:get-node-detail', contextId, nodeName),
  listPods: (contextId: string, namespace?: string): Promise<PodInfo[]> =>
    ipcRenderer.invoke('k7s:list-pods', contextId, namespace),
  getPodDetail: (contextId: string, namespace: string, podName: string): Promise<PodInfo> =>
    ipcRenderer.invoke('k7s:get-pod-detail', contextId, namespace, podName),
  listDeployments: (contextId: string, namespace?: string): Promise<DeploymentInfo[]> =>
    ipcRenderer.invoke('k7s:list-deployments', contextId, namespace),
  getDeploymentDetail: (contextId: string, namespace: string, name: string): Promise<DeploymentInfo> =>
    ipcRenderer.invoke('k7s:get-deployment-detail', contextId, namespace, name),
  listDaemonSets: (contextId: string, namespace?: string): Promise<DaemonSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-daemonsets', contextId, namespace),
  getDaemonSetDetail: (contextId: string, namespace: string, name: string): Promise<DaemonSetInfo> =>
    ipcRenderer.invoke('k7s:get-daemonset-detail', contextId, namespace, name),
  listStatefulSets: (contextId: string, namespace?: string): Promise<StatefulSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-statefulsets', contextId, namespace),
  getStatefulSetDetail: (contextId: string, namespace: string, name: string): Promise<StatefulSetInfo> =>
    ipcRenderer.invoke('k7s:get-statefulset-detail', contextId, namespace, name),
  listReplicaSets: (contextId: string, namespace?: string): Promise<ReplicaSetInfo[]> =>
    ipcRenderer.invoke('k7s:list-replicasets', contextId, namespace),
  getReplicaSetDetail: (contextId: string, namespace: string, name: string): Promise<ReplicaSetInfo> =>
    ipcRenderer.invoke('k7s:get-replicaset-detail', contextId, namespace, name),
  listJobs: (contextId: string, namespace?: string): Promise<JobInfo[]> =>
    ipcRenderer.invoke('k7s:list-jobs', contextId, namespace),
  getJobDetail: (contextId: string, namespace: string, name: string): Promise<JobInfo> =>
    ipcRenderer.invoke('k7s:get-job-detail', contextId, namespace, name),
  listCronJobs: (contextId: string, namespace?: string): Promise<CronJobInfo[]> =>
    ipcRenderer.invoke('k7s:list-cronjobs', contextId, namespace),
  getCronJobDetail: (contextId: string, namespace: string, name: string): Promise<CronJobInfo> =>
    ipcRenderer.invoke('k7s:get-cronjob-detail', contextId, namespace, name),
  addKubeconfigFile: (): Promise<AddContextsResult> =>
    ipcRenderer.invoke('k7s:add-kubeconfig')
  ,
  getContextPrefs: (): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:get-context-prefs'),
  updateContextName: (contextId: string, name: string): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:update-context-name', contextId, name),
  updateContextGrouping: (groups: ContextGroup[], ungrouped: string[]): Promise<ContextPrefs> =>
    ipcRenderer.invoke('k7s:update-context-grouping', { groups, ungrouped })
})

contextBridge.exposeInMainWorld('k8sTerm', {
  create: (contextId: string): Promise<{ shell: string; cwd: string }> =>
    ipcRenderer.invoke('terminal:create', contextId),
  write: (data: string): void => {
    ipcRenderer.invoke('terminal:write', data)
  },
  resize: (cols: number, rows: number): void => {
    ipcRenderer.invoke('terminal:resize', cols, rows)
  },
  destroy: (): void => {
    ipcRenderer.invoke('terminal:destroy')
  },
  onData: (callback: (data: string) => void): void => {
    ipcRenderer.send('terminal:onData', callback)
  },
  onExit: (callback: (exitCode: number) => void): void => {
    ipcRenderer.send('terminal:onExit', callback)
  }
})
