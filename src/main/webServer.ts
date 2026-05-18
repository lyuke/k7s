/* node:coverage disable */
import express from 'express'
import type { Request, Response } from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer, IncomingMessage } from 'http'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  addKubeconfigContent,
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
  listComponentStatuses,
  listPodCertificateRequests,
  listSelfSubjectRulesReviews,
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
  listFlowSchemas,
  listHelmReleases,
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
  listPodDisruptionBudgets,
  listPersistentVolumeClaims,
  listPersistentVolumes,
  listPods,
  listPodTemplates,
  listPriorityClasses,
  listPriorityLevelConfigurations,
  listReplicaSets,
  listReplicationControllers,
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
  listServerVersions,
  listServices,
  listStatefulSets,
  listStorageVersionMigrations,
  listStorageVersions,
  restartWorkload,
  listStorageClasses,
  listVolumeAttributesClasses,
  listValidatingAdmissionPolicies,
  listValidatingAdmissionPolicyBindings,
  listValidatingWebhookConfigurations,
  listClusterRoles,
  listClusterRoleBindings,
  listHPAs,
  listEvents,
  listVolumeAttachments,
  listGatewayClasses,
  listGateways,
  listGRPCRoutes,
  listHTTPRoutes,
  listReferenceGrants,
  listTCPRoutes,
  listTLSRoutes,
  listUDPRoutes,
  listVolumeSnapshotClasses,
  listVolumeSnapshotContents,
  listVolumeSnapshots,
  pauseWorkload,
  scaleDeployment,
  scaleReplicaSet,
  scaleWorkload,
  setKubeContextNamespace,
  setWorkloadImage,
  scaleStatefulSet,
  resumeWorkload,
  uncordonNode,
  useKubeContext,
  triggerCronJob,
  updateCertificateSigningRequestApproval,
  updateJobSuspension,
  updateDeployment,
} from './kube'
import {
  cleanupRuntimeOwner,
  addHelmRepository,
  createTerminalSession,
  describeResource,
  diffYaml,
  destroyTerminalSession,
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
  resizeTerminalSession,
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
  writeTerminalSession,
} from './runtime'
import type {
  AppThemeName,
  CanIReviewRequest,
  CertificateSigningRequestDecision,
  HelmReleaseUpgradeRequest,
  JobSuspensionKind,
  KubernetesResourceKind,
  PausableWorkloadKind,
  PodExecData,
  PodLogStreamRequest,
  PortForwardRequest,
  RolloutWorkloadKind,
  ScaleableWorkloadKind,
  WorkloadImageKind,
} from '../shared/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ConnectionMeta = {
  ownerId: string
  ws: WebSocket
}

type WebRuntimeSessions = {
  logStreams: Set<string>
  execSessions: Set<string>
  portForwards: Set<string>
}

type WsHandler = (data: unknown, respond: (result: unknown) => void, meta: ConnectionMeta) => Promise<void>

type StartWebServerOptions = {
  host?: string
  rendererDevServerUrl?: string
}

interface WsMessage {
  id: string
  method: string
  params?: unknown[]
  data?: unknown
}

interface WsResponse {
  id: string
  result?: unknown
  error?: string
  event?: string
  data?: unknown
}

const WEB_ADD_KUBECONFIG_ERROR = 'Web 模式请上传 kubeconfig 文件内容'

// Store active WebSocket connections
const clients = new Map<WebSocket, { ownerId: string }>()
const runtimeSessionsByOwner = new Map<string, WebRuntimeSessions>()

const getRuntimeSessions = (ownerId: string) => {
  let sessions = runtimeSessionsByOwner.get(ownerId)
  if (!sessions) {
    sessions = {
      logStreams: new Set(),
      execSessions: new Set(),
      portForwards: new Set(),
    }
    runtimeSessionsByOwner.set(ownerId, sessions)
  }
  return sessions
}

const cleanupWebRuntimeOwner = async (ownerId: string) => {
  const sessions = runtimeSessionsByOwner.get(ownerId)
  runtimeSessionsByOwner.delete(ownerId)

  await cleanupRuntimeOwner(ownerId)
  if (!sessions) return

  await Promise.allSettled([
    ...Array.from(sessions.logStreams, (streamId) => stopPodLogStream(streamId)),
    ...Array.from(sessions.execSessions, (sessionId) => stopPodExec(sessionId)),
    ...Array.from(sessions.portForwards, (sessionId) => stopPortForward(sessionId)),
  ])
}

const sendEvent = (ws: WebSocket, event: string, data: unknown) => {
  if (ws.readyState !== WebSocket.OPEN) return
  ws.send(JSON.stringify({ id: '', event, data }))
}

// Handlers map - mirrors IPC handlers but for WebSocket
const handlers: Record<string, WsHandler> = {
  'k7s:list-contexts': async (_data, respond) => respond(await listContexts()),
  'k7s:use-kube-context': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await useKubeContext(contextId))
  },
  'k7s:set-kube-context-namespace': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace: string }
    respond(await setKubeContextNamespace(contextId, namespace))
  },
  'k7s:add-kubeconfig': async (data, respond) => {
    const { sourceName, content } = (data ?? {}) as { sourceName?: string; content?: string }
    if (typeof content !== 'string') {
      throw new Error(WEB_ADD_KUBECONFIG_ERROR)
    }
    respond(await addKubeconfigContent(sourceName || 'kubeconfig.yaml', content))
  },
  'k7s:get-context-prefs': async (_data, respond) => respond(await getContextPrefs()),
  'k7s:update-context-name': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await updateContextName(contextId, name))
  },
  'k7s:update-context-grouping': async (data, respond) => {
    const { groups, ungrouped } = data as { groups: { id: string; name: string; items: string[] }[]; ungrouped: string[] }
    respond(await updateContextGrouping(groups, ungrouped))
  },
  'k7s:update-app-theme': async (data, respond) => {
    const { theme } = data as { theme: AppThemeName }
    respond(await updateAppTheme(theme))
  },
  'k7s:list-namespaces': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listNamespaces(contextId))
  },
  'k7s:list-componentstatuses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listComponentStatuses(contextId))
  },
  'k7s:list-apigroups': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listAPIGroups(contextId))
  },
  'k7s:list-apiresources': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listAPIResources(contextId))
  },
  'k7s:list-serverversions': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listServerVersions(contextId))
  },
  'k7s:list-openidconfigs': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listOpenIDConfigurations(contextId))
  },
  'k7s:list-apiserverhealth': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listAPIServerHealth(contextId))
  },
  'k7s:list-selfsubjectreviews': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listSelfSubjectReviews(contextId))
  },
  'k7s:list-selfsubjectaccessreviews': async (data, respond) => {
    const { contextId, namespaces } = data as { contextId: string; namespaces?: string | string[] }
    respond(await listSelfSubjectAccessReviews(contextId, namespaces))
  },
  'k7s:check-can-i': async (data, respond) => {
    const { contextId, request } = data as { contextId: string; request: CanIReviewRequest }
    respond(await checkCanI(contextId, request))
  },
  'k7s:list-selfsubjectrulesreviews': async (data, respond) => {
    const { contextId, namespaces } = data as { contextId: string; namespaces?: string | string[] }
    respond(await listSelfSubjectRulesReviews(contextId, namespaces))
  },
  'k7s:list-nodes': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listNodes(contextId))
  },
  'k7s:get-node-detail': async (data, respond) => {
    const { contextId, nodeName } = data as { contextId: string; nodeName: string }
    respond(await getNodeDetail(contextId, nodeName))
  },
  'k7s:get-node-metrics': async (data, respond) => {
    const { contextId, nodeName } = data as { contextId: string; nodeName: string }
    respond(await getNodeMetrics(contextId, nodeName))
  },
  'k7s:get-pod-detail': async (data, respond) => {
    const { contextId, namespace, podName } = data as { contextId: string; namespace: string; podName: string }
    respond(await getPodDetail(contextId, namespace, podName))
  },
  'k7s:get-deployment-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getDeploymentDetail(contextId, namespace, name))
  },
  'k7s:get-daemonset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getDaemonSetDetail(contextId, namespace, name))
  },
  'k7s:get-statefulset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getStatefulSetDetail(contextId, namespace, name))
  },
  'k7s:get-replicaset-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getReplicaSetDetail(contextId, namespace, name))
  },
  'k7s:get-replicationcontroller-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getReplicationControllerDetail(contextId, namespace, name))
  },
  'k7s:get-job-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getJobDetail(contextId, namespace, name))
  },
  'k7s:get-cronjob-detail': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await getCronJobDetail(contextId, namespace, name))
  },
  'k7s:list-pods': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPods(contextId, namespace))
  },
  'k7s:list-deployments': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listDeployments(contextId, namespace))
  },
  'k7s:list-daemonsets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listDaemonSets(contextId, namespace))
  },
  'k7s:list-statefulsets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listStatefulSets(contextId, namespace))
  },
  'k7s:list-replicasets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listReplicaSets(contextId, namespace))
  },
  'k7s:list-replicationcontrollers': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listReplicationControllers(contextId, namespace))
  },
  'k7s:list-controllerrevisions': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listControllerRevisions(contextId, namespace))
  },
  'k7s:list-podtemplates': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPodTemplates(contextId, namespace))
  },
  'k7s:list-jobs': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listJobs(contextId, namespace))
  },
  'k7s:list-cronjobs': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listCronJobs(contextId, namespace))
  },
  'k7s:list-services': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listServices(contextId, namespace))
  },
  'k7s:list-configmaps': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listConfigMaps(contextId, namespace))
  },
  'k7s:list-secrets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listSecrets(contextId, namespace))
  },
  'k7s:list-endpoints': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listEndpoints(contextId, namespace))
  },
  'k7s:list-ingresses': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listIngresses(contextId, namespace))
  },
  'k7s:list-ingressclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listIngressClasses(contextId))
  },
  'k7s:list-helmreleases': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listHelmReleases(contextId, namespace))
  },
  'k7s:list-helmcharts': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listHelmCharts(contextId))
  },
  'k7s:list-helmrepositories': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listHelmRepositories(contextId))
  },
  'k7s:list-networkpolicies': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listNetworkPolicies(contextId, namespace))
  },
  'k7s:list-ipaddresses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listIPAddresses(contextId))
  },
  'k7s:list-servicecidrs': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listServiceCIDRs(contextId))
  },
  'k7s:list-endpointslices': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listEndpointSlices(contextId, namespace))
  },
  'k7s:list-apiservices': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listAPIServices(contextId))
  },
  'k7s:list-mutatingwebhookconfigurations': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listMutatingWebhookConfigurations(contextId))
  },
  'k7s:list-validatingwebhookconfigurations': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listValidatingWebhookConfigurations(contextId))
  },
  'k7s:list-mutatingadmissionpolicies': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listMutatingAdmissionPolicies(contextId))
  },
  'k7s:list-mutatingadmissionpolicybindings': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listMutatingAdmissionPolicyBindings(contextId))
  },
  'k7s:list-validatingadmissionpolicies': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listValidatingAdmissionPolicies(contextId))
  },
  'k7s:list-validatingadmissionpolicybindings': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listValidatingAdmissionPolicyBindings(contextId))
  },
  'k7s:list-flowschemas': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listFlowSchemas(contextId))
  },
  'k7s:list-prioritylevelconfigurations': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listPriorityLevelConfigurations(contextId))
  },
  'k7s:list-certificatesigningrequests': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listCertificateSigningRequests(contextId))
  },
  'k7s:update-certificate-signing-request-approval': async (data, respond) => {
    const { contextId, name, decision } = data as {
      contextId: string
      name: string
      decision: CertificateSigningRequestDecision
    }
    respond(await updateCertificateSigningRequestApproval(contextId, name, decision))
  },
  'k7s:list-clustertrustbundles': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listClusterTrustBundles(contextId))
  },
  'k7s:list-podcertificaterequests': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPodCertificateRequests(contextId, namespace))
  },
  'k7s:list-storageversions': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listStorageVersions(contextId))
  },
  'k7s:list-storageversionmigrations': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listStorageVersionMigrations(contextId))
  },
  'k7s:list-poddisruptionbudgets': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPodDisruptionBudgets(contextId, namespace))
  },
  'k7s:list-resourcequotas': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listResourceQuotas(contextId, namespace))
  },
  'k7s:list-limitranges': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listLimitRanges(contextId, namespace))
  },
  'k7s:list-leases': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listLeases(contextId, namespace))
  },
  'k7s:list-leasecandidates': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listLeaseCandidates(contextId, namespace))
  },
  'k7s:list-priorityclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listPriorityClasses(contextId))
  },
  'k7s:list-runtimeclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listRuntimeClasses(contextId))
  },
  'k7s:list-persistentvolumes': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listPersistentVolumes(contextId))
  },
  'k7s:list-persistentvolumeclaims': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listPersistentVolumeClaims(contextId, namespace))
  },
  'k7s:list-storageclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listStorageClasses(contextId))
  },
  'k7s:list-volumeattributesclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listVolumeAttributesClasses(contextId))
  },
  'k7s:list-csidrivers': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listCSIDrivers(contextId))
  },
  'k7s:list-csinodes': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listCSINodes(contextId))
  },
  'k7s:list-volumeattachments': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listVolumeAttachments(contextId))
  },
  'k7s:list-csistoragecapacities': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listCSIStorageCapacities(contextId, namespace))
  },
  'k7s:list-volumesnapshotclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listVolumeSnapshotClasses(contextId))
  },
  'k7s:list-volumesnapshots': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listVolumeSnapshots(contextId, namespace))
  },
  'k7s:list-volumesnapshotcontents': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listVolumeSnapshotContents(contextId))
  },
  'k7s:list-gatewayclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listGatewayClasses(contextId))
  },
  'k7s:list-gateways': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listGateways(contextId, namespace))
  },
  'k7s:list-httproutes': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listHTTPRoutes(contextId, namespace))
  },
  'k7s:list-grpcroutes': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listGRPCRoutes(contextId, namespace))
  },
  'k7s:list-tlsroutes': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listTLSRoutes(contextId, namespace))
  },
  'k7s:list-tcproutes': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listTCPRoutes(contextId, namespace))
  },
  'k7s:list-udproutes': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listUDPRoutes(contextId, namespace))
  },
  'k7s:list-referencegrants': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listReferenceGrants(contextId, namespace))
  },
  'k7s:list-deviceclasses': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listDeviceClasses(contextId))
  },
  'k7s:list-resourceclaims': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listResourceClaims(contextId, namespace))
  },
  'k7s:list-resourceclaimtemplates': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listResourceClaimTemplates(contextId, namespace))
  },
  'k7s:list-resourceslices': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listResourceSlices(contextId))
  },
  'k7s:list-devicetaintrules': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listDeviceTaintRules(contextId))
  },
  'k7s:list-serviceaccounts': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listServiceAccounts(contextId, namespace))
  },
  'k7s:list-roles': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listRoles(contextId, namespace))
  },
  'k7s:list-rolebindings': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listRoleBindings(contextId, namespace))
  },
  'k7s:list-clusterroles': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listClusterRoles(contextId))
  },
  'k7s:list-clusterrolebindings': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listClusterRoleBindings(contextId))
  },
  'k7s:list-customresourcedefinitions': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await listCustomResourceDefinitions(contextId))
  },
  'k7s:list-customresource-instances': async (data, respond) => {
    const { contextId, crdName, namespace } = data as {
      contextId: string
      crdName: string
      namespace?: string
    }
    respond(await listCustomResourceInstances(contextId, crdName, namespace))
  },
  'k7s:list-horizontalpodautoscalers': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listHPAs(contextId, namespace))
  },
  'k7s:list-events': async (data, respond) => {
    const { contextId, namespace } = data as { contextId: string; namespace?: string }
    respond(await listEvents(contextId, namespace))
  },
  'k7s:delete-pod': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deletePod(contextId, namespace, name))
  },
  'k7s:evict-pod': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await evictPod(contextId, namespace, name))
  },
  'k7s:force-delete-pod': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await forceDeletePod(contextId, namespace, name))
  },
  'k7s:delete-deployment': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteDeployment(contextId, namespace, name))
  },
  'k7s:delete-daemonset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteDaemonSet(contextId, namespace, name))
  },
  'k7s:delete-statefulset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteStatefulSet(contextId, namespace, name))
  },
  'k7s:delete-replicaset': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteReplicaSet(contextId, namespace, name))
  },
  'k7s:delete-job': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteJob(contextId, namespace, name))
  },
  'k7s:delete-cronjob': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await deleteCronJob(contextId, namespace, name))
  },
  'k7s:trigger-cronjob': async (data, respond) => {
    const { contextId, namespace, name } = data as { contextId: string; namespace: string; name: string }
    respond(await triggerCronJob(contextId, namespace, name))
  },
  'k7s:delete-namespace': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await deleteNamespace(contextId, name))
  },
  'k7s:cordon-node': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await cordonNode(contextId, name))
  },
  'k7s:uncordon-node': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await uncordonNode(contextId, name))
  },
  'k7s:drain-node': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await drainNode(contextId, name))
  },
  'k7s:delete-node': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await deleteNode(contextId, name))
  },
  'k7s:delete-customresourcedefinition': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await deleteCustomResourceDefinition(contextId, name))
  },
  'k7s:delete-customresource-instance': async (data, respond) => {
    const { contextId, crdName, namespace, name } = data as {
      contextId: string
      crdName: string
      namespace: string
      name: string
    }
    respond(await deleteCustomResourceInstance(contextId, crdName, namespace, name))
  },
  'k7s:scale-deployment': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleDeployment(contextId, namespace, name, replicas))
  },
  'k7s:scale-statefulset': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleStatefulSet(contextId, namespace, name, replicas))
  },
  'k7s:scale-replicaset': async (data, respond) => {
    const { contextId, namespace, name, replicas } = data as { contextId: string; namespace: string; name: string; replicas: number }
    respond(await scaleReplicaSet(contextId, namespace, name, replicas))
  },
  'k7s:get-pod-logs': async (data, respond) => {
    const { contextId, namespace, podName, containerName, tailLines, previous, timestamps } = data as {
      contextId: string
      namespace: string
      podName: string
      containerName?: string
      tailLines?: number
      previous?: boolean
      timestamps?: boolean
    }
    respond(await getPodLogs(contextId, namespace, podName, containerName, tailLines, previous, timestamps))
  },
  'k7s:start-pod-log-stream': async (data, respond, meta) => {
    const { contextId, request } = data as { contextId: string; request: PodLogStreamRequest }
    const result = await startPodLogStream(contextId, request, (event) => {
      sendEvent(meta.ws, 'k7s:push-event', event)
    })
    getRuntimeSessions(meta.ownerId).logStreams.add(result.streamId)
    respond(result)
  },
  'k7s:stop-pod-log-stream': async (data, respond, meta) => {
    const { streamId } = data as { streamId: string }
    await stopPodLogStream(streamId)
    getRuntimeSessions(meta.ownerId).logStreams.delete(streamId)
    respond({ success: true })
  },
  'k7s:start-pod-exec': async (data, respond, meta) => {
    const { contextId, request } = data as { contextId: string; request: PodExecData }
    const result = await startPodExec(contextId, request, (event) => {
      sendEvent(meta.ws, 'k7s:push-event', event)
    })
    getRuntimeSessions(meta.ownerId).execSessions.add(result.sessionId)
    respond(result)
  },
  'k7s:stop-pod-exec': async (data, respond, meta) => {
    const { sessionId } = data as { sessionId: string }
    await stopPodExec(sessionId)
    getRuntimeSessions(meta.ownerId).execSessions.delete(sessionId)
    respond({ success: true })
  },
  'k7s:start-port-forward': async (data, respond, meta) => {
    const { contextId, request } = data as { contextId: string; request: PortForwardRequest }
    const result = await startPortForward(contextId, request, (event) => {
      sendEvent(meta.ws, 'k7s:push-event', event)
    })
    getRuntimeSessions(meta.ownerId).portForwards.add(result.sessionId)
    respond(result)
  },
  'k7s:list-port-forwards': async (_data, respond) => {
    respond(await listPortForwards())
  },
  'k7s:stop-port-forward': async (data, respond, meta) => {
    const { sessionId } = data as { sessionId: string }
    await stopPortForward(sessionId)
    getRuntimeSessions(meta.ownerId).portForwards.delete(sessionId)
    respond({ success: true })
  },
  'k7s:get-cluster-health': async (data, respond) => {
    const { contextId } = data as { contextId: string }
    respond(await getClusterHealth(contextId))
  },
  'k7s:create-namespace': async (data, respond) => {
    const { contextId, name } = data as { contextId: string; name: string }
    respond(await createNamespace(contextId, name))
  },
  'k7s:create-deployment': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createDeployment(contextId, formData as Parameters<typeof createDeployment>[1]))
  },
  'k7s:create-service': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createService(contextId, formData as Parameters<typeof createService>[1]))
  },
  'k7s:create-configmap': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createConfigMap(contextId, formData as Parameters<typeof createConfigMap>[1]))
  },
  'k7s:create-secret': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createSecret(contextId, formData as Parameters<typeof createSecret>[1]))
  },
  'k7s:create-ingress': async (data, respond) => {
    const { contextId, formData } = data as { contextId: string; formData: unknown }
    respond(await createIngress(contextId, formData as Parameters<typeof createIngress>[1]))
  },
  'k7s:update-deployment': async (data, respond) => {
    const { contextId, namespace, name, formData } = data as { contextId: string; namespace: string; name: string; formData: unknown }
    respond(await updateDeployment(contextId, namespace, name, formData as Parameters<typeof updateDeployment>[3]))
  },
  'k7s:delete-resource': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: KubernetesResourceKind; namespace: string; name: string }
    respond(await deleteResource(contextId, kind, namespace, name))
  },
  'k7s:scale-workload': async (data, respond) => {
    const { contextId, kind, namespace, name, replicas } = data as {
      contextId: string
      kind: ScaleableWorkloadKind
      namespace: string
      name: string
      replicas: number
    }
    respond(await scaleWorkload(contextId, kind, namespace, name, replicas))
  },
  'k7s:restart-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await restartWorkload(contextId, kind, namespace, name))
  },
  'k7s:set-workload-image': async (data, respond) => {
    const { contextId, kind, namespace, name, containerName, image } = data as {
      contextId: string
      kind: WorkloadImageKind
      namespace: string
      name: string
      containerName: string
      image: string
    }
    respond(await setWorkloadImage(contextId, kind, namespace, name, containerName, image))
  },
  'k7s:install-or-upgrade-helm-release': async (data, respond) => {
    const { contextId, request } = data as {
      contextId: string
      request: HelmReleaseUpgradeRequest
    }
    respond(await installOrUpgradeHelmRelease(contextId, request))
  },
  'k7s:add-helm-repository': async (data, respond) => {
    const { contextId, name, url } = data as {
      contextId: string
      name: string
      url: string
    }
    respond(await addHelmRepository(contextId, name, url))
  },
  'k7s:update-helm-repository': async (data, respond) => {
    const { contextId, name } = data as {
      contextId: string
      name?: string
    }
    respond(await updateHelmRepository(contextId, name))
  },
  'k7s:remove-helm-repository': async (data, respond) => {
    const { contextId, name } = data as {
      contextId: string
      name: string
    }
    respond(await removeHelmRepository(contextId, name))
  },
  'k7s:rollback-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await rollbackWorkload(contextId, kind, namespace, name))
  },
  'k7s:rollback-helm-release': async (data, respond) => {
    const { contextId, namespace, name, revision } = data as {
      contextId: string
      namespace: string
      name: string
      revision?: number
    }
    respond(await rollbackHelmRelease(contextId, namespace, name, revision))
  },
  'k7s:rollout-history': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await rolloutHistory(contextId, kind, namespace, name))
  },
  'k7s:helm-release-history': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseHistory(contextId, namespace, name))
  },
  'k7s:helm-release-status': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseStatus(contextId, namespace, name))
  },
  'k7s:helm-release-resources': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseResources(contextId, namespace, name))
  },
  'k7s:helm-release-manifest': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseManifest(contextId, namespace, name))
  },
  'k7s:helm-release-metadata': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseMetadata(contextId, namespace, name))
  },
  'k7s:helm-release-values': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseValues(contextId, namespace, name))
  },
  'k7s:helm-release-notes': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseNotes(contextId, namespace, name))
  },
  'k7s:helm-release-hooks': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseHooks(contextId, namespace, name))
  },
  'k7s:helm-release-all': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await helmReleaseAll(contextId, namespace, name))
  },
  'k7s:test-helm-release': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await testHelmRelease(contextId, namespace, name))
  },
  'k7s:rollout-status': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: RolloutWorkloadKind
      namespace: string
      name: string
    }
    respond(await rolloutStatus(contextId, kind, namespace, name))
  },
  'k7s:uninstall-helm-release': async (data, respond) => {
    const { contextId, namespace, name } = data as {
      contextId: string
      namespace: string
      name: string
    }
    respond(await uninstallHelmRelease(contextId, namespace, name))
  },
  'k7s:pause-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: PausableWorkloadKind
      namespace: string
      name: string
    }
    respond(await pauseWorkload(contextId, kind, namespace, name))
  },
  'k7s:resume-workload': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as {
      contextId: string
      kind: PausableWorkloadKind
      namespace: string
      name: string
    }
    respond(await resumeWorkload(contextId, kind, namespace, name))
  },
  'k7s:update-job-suspension': async (data, respond) => {
    const { contextId, kind, namespace, name, suspend } = data as {
      contextId: string
      kind: JobSuspensionKind
      namespace: string
      name: string
      suspend: boolean
    }
    respond(await updateJobSuspension(contextId, kind, namespace, name, suspend))
  },
  'k7s:apply-yaml': async (data, respond) => {
    const { contextId, yaml } = data as { contextId: string; yaml: string }
    respond(await applyYaml(contextId, yaml))
  },
  'k7s:diff-yaml': async (data, respond) => {
    const { contextId, yaml } = data as { contextId: string; yaml: string }
    respond(await diffYaml(contextId, yaml))
  },
  'k7s:get-resource-yaml': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: string; namespace: string; name: string }
    respond(await getResourceYaml(contextId, kind, namespace, name))
  },
  'k7s:describe-resource': async (data, respond) => {
    const { contextId, kind, namespace, name } = data as { contextId: string; kind: string; namespace: string; name: string }
    respond(await describeResource(contextId, kind, namespace, name))
  },
  'k7s:mutate-resource-metadata': async (data, respond) => {
    const { contextId, kind, namespace, name, field, key, value, remove } = data as {
      contextId: string
      kind: string
      namespace: string
      name: string
      field: 'labels' | 'annotations'
      key: string
      value: string
      remove: boolean
    }
    respond(await mutateResourceMetadata(contextId, kind, namespace, name, field, key, value, remove))
  },
  'k7s:get-customresource-instance-yaml': async (data, respond) => {
    const { contextId, crdName, namespace, name } = data as {
      contextId: string
      crdName: string
      namespace: string
      name: string
    }
    respond(await getCustomResourceInstanceYaml(contextId, crdName, namespace, name))
  },
  'k7s:subscribe-watch': async (data, respond, meta) => {
    const { contextId } = data as { contextId: string }
    await subscribeToContextWatch(meta.ownerId, contextId, (event) => {
      sendEvent(meta.ws, 'k7s:push-event', event)
    })
    respond({ success: true })
  },
  'k7s:unsubscribe-watch': async (_data, respond, meta) => {
    await unsubscribeFromContextWatch(meta.ownerId)
    respond({ success: true })
  },
  'terminal:create': async (data, respond, meta) => {
    const { contextId } = data as { contextId: string }
    respond(await createTerminalSession(meta.ownerId, contextId, {
      onData: (terminalData) => sendEvent(meta.ws, 'terminal:data', terminalData),
      onExit: (exitCode) => sendEvent(meta.ws, 'terminal:exit', exitCode),
    }))
  },
  'terminal:write': async (data, respond, meta) => {
    const { value } = data as { value: string }
    await writeTerminalSession(meta.ownerId, value)
    respond({ success: true })
  },
  'terminal:resize': async (data, respond, meta) => {
    const { cols, rows } = data as { cols: number; rows: number }
    await resizeTerminalSession(meta.ownerId, cols, rows)
    respond({ success: true })
  },
  'terminal:destroy': async (_data, respond, meta) => {
    await destroyTerminalSession(meta.ownerId)
    respond({ success: true })
  }
}

const WEB_KUBECONFIG_UPLOAD_LIMIT = '5mb'
const WS_MAX_MESSAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const WS_RATE_LIMIT_WINDOW_MS = 1000
const WS_RATE_LIMIT_MAX = 30 // max 30 messages per second per connection
const LOCAL_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const isLocalRequest = (request: IncomingMessage | Request) => {
  const remoteAddress = (request as Request).ip ?? request.socket.remoteAddress
  return !!remoteAddress && LOCAL_ADDRESSES.has(remoteAddress)
}

const hasValidSessionCookie = (cookieHeader: string | undefined, token: string) => {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((cookie) => cookie.trim() === `k7s_session=${token}`)
}

const isAllowedOrigin = (origin: string | undefined, allowedOrigins: Set<string>) => (
  !origin || allowedOrigins.has(origin)
)

function setupWebSocket(wss: WebSocketServer, allowedOrigins: Set<string>) {
  wss.on('connection', (ws: WebSocket, req) => {
    if (!isAllowedOrigin(req.headers.origin, allowedOrigins)) {
      ws.close(1008, 'Origin not allowed')
      return
    }

    const ownerId = randomUUID()
    clients.set(ws, { ownerId })

    let messageCount = 0
    let windowStart = Date.now()

    ws.on('message', async (message: Buffer) => {
      let messageId = 'error'

      // Message size guard
      if (message.length > WS_MAX_MESSAGE_BYTES) {
        ws.send(JSON.stringify({ id: 'error', error: 'Message too large' }))
        ws.close()
        return
      }

      // Rate limit guard
      const now = Date.now()
      if (now - windowStart > WS_RATE_LIMIT_WINDOW_MS) {
        messageCount = 0
        windowStart = now
      }
      messageCount++
      if (messageCount > WS_RATE_LIMIT_MAX) {
        ws.send(JSON.stringify({ id: 'error', error: 'Rate limit exceeded' }))
        ws.close()
        return
      }

      try {
        const msg: WsMessage = JSON.parse(message.toString())
        messageId = msg.id
        const handler = handlers[msg.method]

        if (!handler) {
          const response: WsResponse = { id: msg.id, error: `Unknown method: ${msg.method}` }
          ws.send(JSON.stringify(response))
          return
        }

        const respond = (result: unknown) => {
          const response: WsResponse = { id: msg.id, result }
          ws.send(JSON.stringify(response))
        }

        await handler(msg.data ?? msg.params, respond, { ownerId, ws })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        ws.send(JSON.stringify({ id: messageId, error: errorMsg }))
      }
    })

    ws.on('close', () => {
      void cleanupWebRuntimeOwner(ownerId)
      clients.delete(ws)
    })

    ws.on('error', () => {
      void cleanupWebRuntimeOwner(ownerId)
      clients.delete(ws)
    })
  })
}

const proxyRendererDevServer = (rendererDevServerUrl: string) => {
  return async (req: Request, res: Response) => {
    try {
      const targetUrl = new URL(req.originalUrl, rendererDevServerUrl)
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          accept: req.headers.accept || '*/*',
          'user-agent': req.headers['user-agent'] || 'k7s-web-proxy',
        },
      })
      const body = Buffer.from(await response.arrayBuffer())

      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key)) {
          res.setHeader(key, value)
        }
      })
      res.status(response.status).send(body)
    } catch (error) {
      res.status(502).send(`Renderer dev server unavailable: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export function startWebServer(
  port: number = 3000,
  options: StartWebServerOptions = {}
): { server: ReturnType<typeof createServer>; wss: WebSocketServer } {
  const app = express()
  const host = options.host || process.env.K7S_WEB_HOST || '127.0.0.1'
  const sessionToken = randomUUID().replace(/-/g, '')

  // CORS: only allow same-origin and localhost (web mode is local-only)
  const allowedOrigins = new Set([
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    `http://[::1]:${port}`,
  ])
  if (options.rendererDevServerUrl) {
    allowedOrigins.add(new URL(options.rendererDevServerUrl).origin)
  }

  app.use((req, res, next) => {
    if (!isLocalRequest(req)) {
      res.status(403).json({ error: 'Local access only' })
      return
    }

    res.header('Set-Cookie', `k7s_session=${sessionToken}; HttpOnly; SameSite=Strict; Path=/`)
    const origin = req.headers.origin
    if (origin && isAllowedOrigin(origin, allowedOrigins)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', mode: 'web' })
  })

  // API endpoint for adding kubeconfig (web upload)
  app.post('/api/k7s/add-kubeconfig', express.json({ limit: WEB_KUBECONFIG_UPLOAD_LIMIT }), async (req: Request, res: Response) => {
    try {
      const { sourceName, content } = req.body as { sourceName?: string; content?: string }
      if (typeof content !== 'string') {
        res.status(400).json({ error: WEB_ADD_KUBECONFIG_ERROR })
        return
      }
      res.json(await addKubeconfigContent(sourceName || 'kubeconfig.yaml', content))
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) })
    }
  })

  // Serve static files from renderer build, or proxy Vite's renderer dev server in dev mode.
  const rendererDistPath = path.join(__dirname, '../renderer')
  const rendererIndexPath = path.join(rendererDistPath, 'index.html')
  if (options.rendererDevServerUrl) {
    app.use(proxyRendererDevServer(options.rendererDevServerUrl))
  } else {
    app.use(express.static(rendererDistPath))

    // SPA fallback - serve index.html for all non-API routes
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(rendererIndexPath)
    })
  }

  const server = createServer(app)
  const wss = new WebSocketServer({ noServer: true })

  setupWebSocket(wss, allowedOrigins)

  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      socket.destroy()
      return
    }

    if (!isLocalRequest(request)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    if (!hasValidSessionCookie(request.headers.cookie, sessionToken)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    const origin = request.headers.origin
    if (origin && !isAllowedOrigin(origin, allowedOrigins)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  })

  server.listen(port, host, () => {
    console.log(`k7s web server running at http://${host}:${port}`)
    console.log(`WebSocket server running at ws://${host}:${port}/ws`)
  })

  return { server, wss }
}

export function broadcastToClients(message: unknown) {
  const data = JSON.stringify(message)
  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}
/* node:coverage enable */
