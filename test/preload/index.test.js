import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

const K8S_METHOD_CASES = [
  ['listContexts', [], ['k7s:list-contexts']],
  ['useKubeContext', ['ctx-2'], ['k7s:use-kube-context', 'ctx-2']],
  ['setKubeContextNamespace', ['ctx-1', 'team-a'], ['k7s:set-kube-context-namespace', 'ctx-1', 'team-a']],
  ['listNamespaces', ['ctx-1'], ['k7s:list-namespaces', 'ctx-1']],
  ['listComponentStatuses', ['ctx-1'], ['k7s:list-componentstatuses', 'ctx-1']],
  ['listAPIGroups', ['ctx-1'], ['k7s:list-apigroups', 'ctx-1']],
  ['listAPIResources', ['ctx-1'], ['k7s:list-apiresources', 'ctx-1']],
  ['listServerVersions', ['ctx-1'], ['k7s:list-serverversions', 'ctx-1']],
  ['listOpenIDConfigurations', ['ctx-1'], ['k7s:list-openidconfigs', 'ctx-1']],
  ['listAPIServerHealth', ['ctx-1'], ['k7s:list-apiserverhealth', 'ctx-1']],
  ['listSelfSubjectReviews', ['ctx-1'], ['k7s:list-selfsubjectreviews', 'ctx-1']],
  ['listSelfSubjectAccessReviews', ['ctx-1', ['default']], ['k7s:list-selfsubjectaccessreviews', 'ctx-1', ['default']]],
  ['checkCanI', ['ctx-1', { verb: 'get', resource: 'pods', namespace: 'default' }], ['k7s:check-can-i', 'ctx-1', { verb: 'get', resource: 'pods', namespace: 'default' }]],
  ['listSelfSubjectRulesReviews', ['ctx-1', ['default']], ['k7s:list-selfsubjectrulesreviews', 'ctx-1', ['default']]],
  ['listNodes', ['ctx-1'], ['k7s:list-nodes', 'ctx-1']],
  ['getNodeDetail', ['ctx-1', 'node-1'], ['k7s:get-node-detail', 'ctx-1', 'node-1']],
  ['getNodeMetrics', ['ctx-1', 'node-1'], ['k7s:get-node-metrics', 'ctx-1', 'node-1']],
  ['listPods', ['ctx-1', 'default'], ['k7s:list-pods', 'ctx-1', 'default']],
  ['getPodDetail', ['ctx-1', 'default', 'pod-1'], ['k7s:get-pod-detail', 'ctx-1', 'default', 'pod-1']],
  ['listDeployments', ['ctx-1', 'default'], ['k7s:list-deployments', 'ctx-1', 'default']],
  ['getDeploymentDetail', ['ctx-1', 'default', 'deploy-1'], ['k7s:get-deployment-detail', 'ctx-1', 'default', 'deploy-1']],
  ['listDaemonSets', ['ctx-1', 'default'], ['k7s:list-daemonsets', 'ctx-1', 'default']],
  ['getDaemonSetDetail', ['ctx-1', 'default', 'ds-1'], ['k7s:get-daemonset-detail', 'ctx-1', 'default', 'ds-1']],
  ['listStatefulSets', ['ctx-1', 'default'], ['k7s:list-statefulsets', 'ctx-1', 'default']],
  ['getStatefulSetDetail', ['ctx-1', 'default', 'sts-1'], ['k7s:get-statefulset-detail', 'ctx-1', 'default', 'sts-1']],
  ['listReplicaSets', ['ctx-1', 'default'], ['k7s:list-replicasets', 'ctx-1', 'default']],
  ['listReplicationControllers', ['ctx-1', 'default'], ['k7s:list-replicationcontrollers', 'ctx-1', 'default']],
  ['getReplicationControllerDetail', ['ctx-1', 'default', 'rc-1'], ['k7s:get-replicationcontroller-detail', 'ctx-1', 'default', 'rc-1']],
  ['listControllerRevisions', ['ctx-1', 'default'], ['k7s:list-controllerrevisions', 'ctx-1', 'default']],
  ['listPodTemplates', ['ctx-1', 'default'], ['k7s:list-podtemplates', 'ctx-1', 'default']],
  ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1'], ['k7s:get-replicaset-detail', 'ctx-1', 'default', 'rs-1']],
  ['listJobs', ['ctx-1', 'default'], ['k7s:list-jobs', 'ctx-1', 'default']],
  ['getJobDetail', ['ctx-1', 'default', 'job-1'], ['k7s:get-job-detail', 'ctx-1', 'default', 'job-1']],
  ['listCronJobs', ['ctx-1', 'default'], ['k7s:list-cronjobs', 'ctx-1', 'default']],
  ['getCronJobDetail', ['ctx-1', 'default', 'cron-1'], ['k7s:get-cronjob-detail', 'ctx-1', 'default', 'cron-1']],
  ['listHelmReleases', ['ctx-1', 'default'], ['k7s:list-helmreleases', 'ctx-1', 'default']],
  ['listHelmCharts', ['ctx-1'], ['k7s:list-helmcharts', 'ctx-1']],
  ['listHelmRepositories', ['ctx-1'], ['k7s:list-helmrepositories', 'ctx-1']],
  ['addKubeconfigFile', [], ['k7s:add-kubeconfig']],
  ['getContextPrefs', [], ['k7s:get-context-prefs']],
  ['updateContextName', ['ctx-1', 'renamed'], ['k7s:update-context-name', 'ctx-1', 'renamed']],
  ['updateContextGrouping', [[{ id: 'g1' }], ['ctx-2']], ['k7s:update-context-grouping', { groups: [{ id: 'g1' }], ungrouped: ['ctx-2'] }]],
  ['updateAppTheme', ['forest'], ['k7s:update-app-theme', 'forest']],
  ['deletePod', ['ctx-1', 'default', 'pod-1'], ['k7s:delete-pod', 'ctx-1', 'default', 'pod-1']],
  ['evictPod', ['ctx-1', 'default', 'pod-1'], ['k7s:evict-pod', 'ctx-1', 'default', 'pod-1']],
  ['deleteDeployment', ['ctx-1', 'default', 'deploy-1'], ['k7s:delete-deployment', 'ctx-1', 'default', 'deploy-1']],
  ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1'], ['k7s:delete-daemonset', 'ctx-1', 'default', 'ds-1']],
  ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1'], ['k7s:delete-statefulset', 'ctx-1', 'default', 'sts-1']],
  ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1'], ['k7s:delete-replicaset', 'ctx-1', 'default', 'rs-1']],
  ['deleteJob', ['ctx-1', 'default', 'job-1'], ['k7s:delete-job', 'ctx-1', 'default', 'job-1']],
  ['deleteCronJob', ['ctx-1', 'default', 'cron-1'], ['k7s:delete-cronjob', 'ctx-1', 'default', 'cron-1']],
  ['triggerCronJob', ['ctx-1', 'default', 'cron-1'], ['k7s:trigger-cronjob', 'ctx-1', 'default', 'cron-1']],
  ['deleteNamespace', ['ctx-1', 'default'], ['k7s:delete-namespace', 'ctx-1', 'default']],
  ['cordonNode', ['ctx-1', 'node-1'], ['k7s:cordon-node', 'ctx-1', 'node-1']],
  ['uncordonNode', ['ctx-1', 'node-1'], ['k7s:uncordon-node', 'ctx-1', 'node-1']],
  ['drainNode', ['ctx-1', 'node-1'], ['k7s:drain-node', 'ctx-1', 'node-1']],
  ['deleteNode', ['ctx-1', 'node-1'], ['k7s:delete-node', 'ctx-1', 'node-1']],
  ['deleteCustomResourceDefinition', ['ctx-1', 'widgets.example.com'], ['k7s:delete-customresourcedefinition', 'ctx-1', 'widgets.example.com']],
  ['deleteCustomResourceInstance', ['ctx-1', 'widgets.example.com', 'default', 'widget-1'], ['k7s:delete-customresource-instance', 'ctx-1', 'widgets.example.com', 'default', 'widget-1']],
  ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3], ['k7s:scale-deployment', 'ctx-1', 'default', 'deploy-1', 3]],
  ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2], ['k7s:scale-statefulset', 'ctx-1', 'default', 'sts-1', 2]],
  ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4], ['k7s:scale-replicaset', 'ctx-1', 'default', 'rs-1', 4]],
  ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100, true, true], ['k7s:get-pod-logs', 'ctx-1', 'default', 'pod-1', 'container-1', 100, true, true]],
  ['startPodLogStream', ['ctx-1', { namespace: 'default', podName: 'pod-1' }], ['k7s:start-pod-log-stream', 'ctx-1', { namespace: 'default', podName: 'pod-1' }]],
  ['stopPodLogStream', ['stream-1'], ['k7s:stop-pod-log-stream', 'stream-1']],
  ['startPodExec', ['ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }], ['k7s:start-pod-exec', 'ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }]],
  ['stopPodExec', ['session-1'], ['k7s:stop-pod-exec', 'session-1']],
  ['startPortForward', ['ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }], ['k7s:start-port-forward', 'ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }]],
  ['startPortForward', ['ctx-1', { namespace: 'default', targetKind: 'Service', targetName: 'web', serviceName: 'web', targetPort: 80, localPort: 18080 }], ['k7s:start-port-forward', 'ctx-1', { namespace: 'default', targetKind: 'Service', targetName: 'web', serviceName: 'web', targetPort: 80, localPort: 18080 }]],
  ['listPortForwards', [], ['k7s:list-port-forwards']],
  ['stopPortForward', ['pf-1'], ['k7s:stop-port-forward', 'pf-1']],
  ['getClusterHealth', ['ctx-1'], ['k7s:get-cluster-health', 'ctx-1']],
  ['listServices', ['ctx-1', 'default'], ['k7s:list-services', 'ctx-1', 'default']],
  ['listConfigMaps', ['ctx-1', 'default'], ['k7s:list-configmaps', 'ctx-1', 'default']],
  ['listSecrets', ['ctx-1', 'default'], ['k7s:list-secrets', 'ctx-1', 'default']],
  ['listEndpoints', ['ctx-1', 'default'], ['k7s:list-endpoints', 'ctx-1', 'default']],
  ['listLeases', ['ctx-1', 'default'], ['k7s:list-leases', 'ctx-1', 'default']],
  ['listLeaseCandidates', ['ctx-1', 'default'], ['k7s:list-leasecandidates', 'ctx-1', 'default']],
  ['listIngresses', ['ctx-1', 'default'], ['k7s:list-ingresses', 'ctx-1', 'default']],
  ['listIngressClasses', ['ctx-1'], ['k7s:list-ingressclasses', 'ctx-1']],
  ['listNetworkPolicies', ['ctx-1', 'default'], ['k7s:list-networkpolicies', 'ctx-1', 'default']],
  ['listIPAddresses', ['ctx-1'], ['k7s:list-ipaddresses', 'ctx-1']],
  ['listServiceCIDRs', ['ctx-1'], ['k7s:list-servicecidrs', 'ctx-1']],
  ['listEndpointSlices', ['ctx-1', 'default'], ['k7s:list-endpointslices', 'ctx-1', 'default']],
  ['listAPIServices', ['ctx-1'], ['k7s:list-apiservices', 'ctx-1']],
  ['listMutatingWebhookConfigurations', ['ctx-1'], ['k7s:list-mutatingwebhookconfigurations', 'ctx-1']],
  ['listValidatingWebhookConfigurations', ['ctx-1'], ['k7s:list-validatingwebhookconfigurations', 'ctx-1']],
  ['listMutatingAdmissionPolicies', ['ctx-1'], ['k7s:list-mutatingadmissionpolicies', 'ctx-1']],
  ['listMutatingAdmissionPolicyBindings', ['ctx-1'], ['k7s:list-mutatingadmissionpolicybindings', 'ctx-1']],
  ['listValidatingAdmissionPolicies', ['ctx-1'], ['k7s:list-validatingadmissionpolicies', 'ctx-1']],
  ['listValidatingAdmissionPolicyBindings', ['ctx-1'], ['k7s:list-validatingadmissionpolicybindings', 'ctx-1']],
  ['listFlowSchemas', ['ctx-1'], ['k7s:list-flowschemas', 'ctx-1']],
  ['listPriorityLevelConfigurations', ['ctx-1'], ['k7s:list-prioritylevelconfigurations', 'ctx-1']],
  ['listCertificateSigningRequests', ['ctx-1'], ['k7s:list-certificatesigningrequests', 'ctx-1']],
  ['updateCertificateSigningRequestApproval', ['ctx-1', 'node-client', 'approve'], ['k7s:update-certificate-signing-request-approval', 'ctx-1', 'node-client', 'approve']],
  ['listClusterTrustBundles', ['ctx-1'], ['k7s:list-clustertrustbundles', 'ctx-1']],
  ['listPodCertificateRequests', ['ctx-1', 'default'], ['k7s:list-podcertificaterequests', 'ctx-1', 'default']],
  ['listStorageVersions', ['ctx-1'], ['k7s:list-storageversions', 'ctx-1']],
  ['listStorageVersionMigrations', ['ctx-1'], ['k7s:list-storageversionmigrations', 'ctx-1']],
  ['listPodDisruptionBudgets', ['ctx-1', 'default'], ['k7s:list-poddisruptionbudgets', 'ctx-1', 'default']],
  ['listResourceQuotas', ['ctx-1', 'default'], ['k7s:list-resourcequotas', 'ctx-1', 'default']],
  ['listLimitRanges', ['ctx-1', 'default'], ['k7s:list-limitranges', 'ctx-1', 'default']],
  ['listPriorityClasses', ['ctx-1'], ['k7s:list-priorityclasses', 'ctx-1']],
  ['listRuntimeClasses', ['ctx-1'], ['k7s:list-runtimeclasses', 'ctx-1']],
  ['listPersistentVolumes', ['ctx-1'], ['k7s:list-persistentvolumes', 'ctx-1']],
  ['listPersistentVolumeClaims', ['ctx-1', 'default'], ['k7s:list-persistentvolumeclaims', 'ctx-1', 'default']],
  ['listStorageClasses', ['ctx-1'], ['k7s:list-storageclasses', 'ctx-1']],
  ['listVolumeAttributesClasses', ['ctx-1'], ['k7s:list-volumeattributesclasses', 'ctx-1']],
  ['listCSIDrivers', ['ctx-1'], ['k7s:list-csidrivers', 'ctx-1']],
  ['listCSINodes', ['ctx-1'], ['k7s:list-csinodes', 'ctx-1']],
  ['listVolumeAttachments', ['ctx-1'], ['k7s:list-volumeattachments', 'ctx-1']],
  ['listCSIStorageCapacities', ['ctx-1', 'default'], ['k7s:list-csistoragecapacities', 'ctx-1', 'default']],
  ['listVolumeSnapshotClasses', ['ctx-1'], ['k7s:list-volumesnapshotclasses', 'ctx-1']],
  ['listVolumeSnapshots', ['ctx-1', 'default'], ['k7s:list-volumesnapshots', 'ctx-1', 'default']],
  ['listVolumeSnapshotContents', ['ctx-1'], ['k7s:list-volumesnapshotcontents', 'ctx-1']],
  ['listGatewayClasses', ['ctx-1'], ['k7s:list-gatewayclasses', 'ctx-1']],
  ['listGateways', ['ctx-1', 'default'], ['k7s:list-gateways', 'ctx-1', 'default']],
  ['listHTTPRoutes', ['ctx-1', 'default'], ['k7s:list-httproutes', 'ctx-1', 'default']],
  ['listGRPCRoutes', ['ctx-1', 'default'], ['k7s:list-grpcroutes', 'ctx-1', 'default']],
  ['listTLSRoutes', ['ctx-1', 'default'], ['k7s:list-tlsroutes', 'ctx-1', 'default']],
  ['listTCPRoutes', ['ctx-1', 'default'], ['k7s:list-tcproutes', 'ctx-1', 'default']],
  ['listUDPRoutes', ['ctx-1', 'default'], ['k7s:list-udproutes', 'ctx-1', 'default']],
  ['listReferenceGrants', ['ctx-1', 'default'], ['k7s:list-referencegrants', 'ctx-1', 'default']],
  ['listDeviceClasses', ['ctx-1'], ['k7s:list-deviceclasses', 'ctx-1']],
  ['listResourceClaims', ['ctx-1', 'default'], ['k7s:list-resourceclaims', 'ctx-1', 'default']],
  ['listResourceClaimTemplates', ['ctx-1', 'default'], ['k7s:list-resourceclaimtemplates', 'ctx-1', 'default']],
  ['listResourceSlices', ['ctx-1'], ['k7s:list-resourceslices', 'ctx-1']],
  ['listDeviceTaintRules', ['ctx-1'], ['k7s:list-devicetaintrules', 'ctx-1']],
  ['listServiceAccounts', ['ctx-1', 'default'], ['k7s:list-serviceaccounts', 'ctx-1', 'default']],
  ['listRoles', ['ctx-1', 'default'], ['k7s:list-roles', 'ctx-1', 'default']],
  ['listRoleBindings', ['ctx-1', 'default'], ['k7s:list-rolebindings', 'ctx-1', 'default']],
  ['listClusterRoles', ['ctx-1'], ['k7s:list-clusterroles', 'ctx-1']],
  ['listClusterRoleBindings', ['ctx-1'], ['k7s:list-clusterrolebindings', 'ctx-1']],
  ['listCustomResourceDefinitions', ['ctx-1'], ['k7s:list-customresourcedefinitions', 'ctx-1']],
  ['listCustomResourceInstances', ['ctx-1', 'widgets.example.com', 'default'], ['k7s:list-customresource-instances', 'ctx-1', 'widgets.example.com', 'default']],
  ['listHPAs', ['ctx-1', 'default'], ['k7s:list-horizontalpodautoscalers', 'ctx-1', 'default']],
  ['listEvents', ['ctx-1', 'default'], ['k7s:list-events', 'ctx-1', 'default']],
  ['createNamespace', ['ctx-1', 'default'], ['k7s:create-namespace', 'ctx-1', 'default']],
  ['createDeployment', ['ctx-1', { image: 'nginx' }], ['k7s:create-deployment', 'ctx-1', { image: 'nginx' }]],
  ['createService', ['ctx-1', { port: 80 }], ['k7s:create-service', 'ctx-1', { port: 80 }]],
  ['createConfigMap', ['ctx-1', { data: [] }], ['k7s:create-configmap', 'ctx-1', { data: [] }]],
  ['createSecret', ['ctx-1', { data: [] }], ['k7s:create-secret', 'ctx-1', { data: [] }]],
  ['createIngress', ['ctx-1', { host: 'example.com' }], ['k7s:create-ingress', 'ctx-1', { host: 'example.com' }]],
  ['updateDeployment', ['ctx-1', 'default', 'deploy-1', { replicas: 2 }], ['k7s:update-deployment', 'ctx-1', 'default', 'deploy-1', { replicas: 2 }]],
  ['deleteResource', ['ctx-1', 'Pod', 'default', 'pod-1'], ['k7s:delete-resource', 'ctx-1', 'Pod', 'default', 'pod-1']],
  ['forceDeletePod', ['ctx-1', 'default', 'pod-1'], ['k7s:force-delete-pod', 'ctx-1', 'default', 'pod-1']],
  ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 2], ['k7s:scale-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1', 2]],
  ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:restart-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['setWorkloadImage', ['ctx-1', 'Deployment', 'default', 'deploy-1', 'app', 'nginx:1.28'], ['k7s:set-workload-image', 'ctx-1', 'Deployment', 'default', 'deploy-1', 'app', 'nginx:1.28']],
  ['installOrUpgradeHelmRelease', ['ctx-1', { name: 'web', namespace: 'default', chart: 'bitnami/nginx', install: true }], ['k7s:install-or-upgrade-helm-release', 'ctx-1', { name: 'web', namespace: 'default', chart: 'bitnami/nginx', install: true }]],
  ['addHelmRepository', ['ctx-1', 'bitnami', 'https://charts.bitnami.com/bitnami'], ['k7s:add-helm-repository', 'ctx-1', 'bitnami', 'https://charts.bitnami.com/bitnami']],
  ['updateHelmRepository', ['ctx-1', 'bitnami'], ['k7s:update-helm-repository', 'ctx-1', 'bitnami']],
  ['removeHelmRepository', ['ctx-1', 'bitnami'], ['k7s:remove-helm-repository', 'ctx-1', 'bitnami']],
  ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:rollback-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['rollbackHelmRelease', ['ctx-1', 'default', 'web', 2], ['k7s:rollback-helm-release', 'ctx-1', 'default', 'web', 2]],
  ['rolloutHistory', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:rollout-history', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['helmReleaseHistory', ['ctx-1', 'default', 'web'], ['k7s:helm-release-history', 'ctx-1', 'default', 'web']],
  ['helmReleaseStatus', ['ctx-1', 'default', 'web'], ['k7s:helm-release-status', 'ctx-1', 'default', 'web']],
  ['helmReleaseResources', ['ctx-1', 'default', 'web'], ['k7s:helm-release-resources', 'ctx-1', 'default', 'web']],
  ['helmReleaseManifest', ['ctx-1', 'default', 'web'], ['k7s:helm-release-manifest', 'ctx-1', 'default', 'web']],
  ['helmReleaseMetadata', ['ctx-1', 'default', 'web'], ['k7s:helm-release-metadata', 'ctx-1', 'default', 'web']],
  ['helmReleaseValues', ['ctx-1', 'default', 'web'], ['k7s:helm-release-values', 'ctx-1', 'default', 'web']],
  ['helmReleaseNotes', ['ctx-1', 'default', 'web'], ['k7s:helm-release-notes', 'ctx-1', 'default', 'web']],
  ['helmReleaseHooks', ['ctx-1', 'default', 'web'], ['k7s:helm-release-hooks', 'ctx-1', 'default', 'web']],
  ['helmReleaseAll', ['ctx-1', 'default', 'web'], ['k7s:helm-release-all', 'ctx-1', 'default', 'web']],
  ['testHelmRelease', ['ctx-1', 'default', 'web'], ['k7s:test-helm-release', 'ctx-1', 'default', 'web']],
  ['rolloutStatus', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:rollout-status', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['uninstallHelmRelease', ['ctx-1', 'default', 'web'], ['k7s:uninstall-helm-release', 'ctx-1', 'default', 'web']],
  ['pauseWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:pause-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['resumeWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:resume-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['updateJobSuspension', ['ctx-1', 'Job', 'default', 'job-1', true], ['k7s:update-job-suspension', 'ctx-1', 'Job', 'default', 'job-1', true]],
  ['applyYaml', ['ctx-1', 'kind: Pod'], ['k7s:apply-yaml', 'ctx-1', 'kind: Pod']],
  ['diffYaml', ['ctx-1', 'kind: Pod'], ['k7s:diff-yaml', 'ctx-1', 'kind: Pod']],
  ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1'], ['k7s:get-resource-yaml', 'ctx-1', 'Pod', 'default', 'pod-1']],
  ['describeResource', ['ctx-1', 'Pod', 'default', 'pod-1'], ['k7s:describe-resource', 'ctx-1', 'Pod', 'default', 'pod-1']],
  ['mutateResourceMetadata', ['ctx-1', 'Pod', 'default', 'pod-1', 'labels', 'team', 'platform', false], ['k7s:mutate-resource-metadata', 'ctx-1', 'Pod', 'default', 'pod-1', 'labels', 'team', 'platform', false]],
  ['getCustomResourceInstanceYaml', ['ctx-1', 'widgets.example.com', 'default', 'widget-1'], ['k7s:get-customresource-instance-yaml', 'ctx-1', 'widgets.example.com', 'default', 'widget-1']],
  ['subscribeWatch', ['ctx-1'], ['k7s:subscribe-watch', 'ctx-1']],
  ['unsubscribeWatch', [], ['k7s:unsubscribe-watch']],
]

beforeEach(() => {
  resetElectronMock()
})

describe('preload bridge', () => {
  it('exposes the expected APIs on window', async () => {
    await importFresh('./src/preload/index.ts')

    assert.ok(globalThis.__k7sExposed.k7s)
    assert.ok(globalThis.__k7sExposed.k8sTerm)
    assert.deepEqual(globalThis.__electronMock.contextBridgeCalls.map(([name]) => name), ['k7s', 'k8sTerm'])
  })

  it('maps every k7s API to the expected IPC channel and arguments', async () => {
    globalThis.__electronMock.invokeImpl = async (...args) => ({ ok: true, args })
    await importFresh('./src/preload/index.ts')
    const api = globalThis.__k7sExposed.k7s

    for (const [method, args, expectedInvokeArgs] of K8S_METHOD_CASES) {
      const result = await api[method](...args)
      assert.deepEqual(result, { ok: true, args: expectedInvokeArgs })
      assert.deepEqual(globalThis.__electronMock.invokeCalls.at(-1), expectedInvokeArgs)
    }
  })

  it('registers and dispatches push and terminal event listeners through ipcRenderer', async () => {
    await importFresh('./src/preload/index.ts')

    const api = globalThis.__k7sExposed.k7s
    const terminalApi = globalThis.__k7sExposed.k8sTerm
    const received = []

    api.onPushEvent((event) => {
      received.push(['push', event])
    })
    terminalApi.onData((data) => {
      received.push(['data', data])
    })
    terminalApi.onExit((code) => {
      received.push(['exit', code])
    })

    assert.deepEqual(globalThis.__electronMock.removeAllListenersCalls, [
      'k7s:push-event',
      'terminal:data',
      'terminal:exit',
    ])

    globalThis.__electronMock.ipcRendererListeners.get('k7s:push-event')[0](null, { type: 'watch', resource: 'pods' })
    globalThis.__electronMock.ipcRendererListeners.get('terminal:data')[0](null, 'stdout')
    globalThis.__electronMock.ipcRendererListeners.get('terminal:exit')[0](null, 137)

    assert.deepEqual(received, [
      ['push', { type: 'watch', resource: 'pods' }],
      ['data', 'stdout'],
      ['exit', 137],
    ])
  })

  it('maps terminal helpers to their IPC channels', async () => {
    globalThis.__electronMock.invokeImpl = async (...args) => ({ ok: true, args })
    await importFresh('./src/preload/index.ts')
    const terminalApi = globalThis.__k7sExposed.k8sTerm

    assert.deepEqual(await terminalApi.create('ctx-1'), { ok: true, args: ['terminal:create', 'ctx-1'] })

    terminalApi.write('ls -la')
    terminalApi.resize(120, 40)
    terminalApi.destroy()

    assert.deepEqual(globalThis.__electronMock.invokeCalls, [
      ['terminal:create', 'ctx-1'],
      ['terminal:write', 'ls -la'],
      ['terminal:resize', 120, 40],
      ['terminal:destroy'],
    ])
  })
})
