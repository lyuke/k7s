import type { 
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
} from '../../shared/types'

export {}

declare global {
  interface Window {
    k7s: {
      listContexts: () => Promise<ContextRecord[]>
      listNamespaces: (contextId: string) => Promise<NamespaceInfo[]>
      listNodes: (contextId: string) => Promise<NodeInfo[]>
      getNodeDetail: (contextId: string, nodeName: string) => Promise<NodeInfo>
      listPods: (contextId: string, namespace?: string) => Promise<PodInfo[]>
      getPodDetail: (contextId: string, namespace: string, podName: string) => Promise<PodInfo>
      listDeployments: (contextId: string, namespace?: string) => Promise<DeploymentInfo[]>
      getDeploymentDetail: (contextId: string, namespace: string, name: string) => Promise<DeploymentInfo>
      listDaemonSets: (contextId: string, namespace?: string) => Promise<DaemonSetInfo[]>
      getDaemonSetDetail: (contextId: string, namespace: string, name: string) => Promise<DaemonSetInfo>
      listStatefulSets: (contextId: string, namespace?: string) => Promise<StatefulSetInfo[]>
      getStatefulSetDetail: (contextId: string, namespace: string, name: string) => Promise<StatefulSetInfo>
      listReplicaSets: (contextId: string, namespace?: string) => Promise<ReplicaSetInfo[]>
      getReplicaSetDetail: (contextId: string, namespace: string, name: string) => Promise<ReplicaSetInfo>
      listJobs: (contextId: string, namespace?: string) => Promise<JobInfo[]>
      getJobDetail: (contextId: string, namespace: string, name: string) => Promise<JobInfo>
      listCronJobs: (contextId: string, namespace?: string) => Promise<CronJobInfo[]>
      getCronJobDetail: (contextId: string, namespace: string, name: string) => Promise<CronJobInfo>
      addKubeconfigFile: () => Promise<AddContextsResult>
      getContextPrefs: () => Promise<ContextPrefs>
      updateContextName: (contextId: string, name: string) => Promise<ContextPrefs>
      updateContextGrouping: (groups: ContextGroup[], ungrouped: string[]) => Promise<ContextPrefs>
    }
  }
}
