import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { k8sApi } from '../../src/renderer/src/api/provider.ts'
import { useClusterStore } from '../../src/renderer/src/store/clusterStore.ts'

const originalApi = { ...k8sApi }
const initialClusterState = Object.fromEntries(
  Object.entries(useClusterStore.getState()).filter(([key, value]) => key !== 'selectedContext' && typeof value !== 'function'),
)

const ctx1 = { id: 'ctx-1', name: 'dev', cluster: 'cluster-a', user: 'user-a', source: 'file-a', current: true, namespace: 'default' }
const ctx2 = { id: 'ctx-2', name: 'prod', cluster: 'cluster-b', user: 'user-b', source: 'file-b', current: false, namespace: '' }

const assignClusterApiDefaults = () => {
  Object.assign(k8sApi, {
    listComponentStatuses: async () => [{ name: 'scheduler' }],
    listAPIGroups: async () => [{ name: 'core' }],
    listAPIResources: async () => [{ name: 'pods' }],
    listServerVersions: async () => [{ name: 'v1.34.1' }],
    listOpenIDConfigurations: async () => [{ name: 'https://kubernetes.default.svc' }],
    listAPIServerHealth: async () => [{ name: 'readyz' }],
    listSelfSubjectReviews: async () => [{ username: 'alice@example.com' }],
    listSelfSubjectAccessReviews: async () => [{ name: 'default/list pods' }],
    listSelfSubjectRulesReviews: async () => [{ name: 'default/resource-1' }],
    listNodes: async () => [{ name: 'node-1' }],
    listPods: async () => [{ name: 'pod-1' }],
    listDeployments: async () => [{ name: 'deploy-1' }],
    listDaemonSets: async () => [{ name: 'ds-1' }],
    listStatefulSets: async () => [{ name: 'sts-1' }],
    listReplicaSets: async () => [{ name: 'rs-1' }],
    listReplicationControllers: async () => [{ name: 'rc-1' }],
    listControllerRevisions: async () => [{ name: 'crv-1' }],
    listPodTemplates: async () => [{ name: 'pt-1' }],
    listJobs: async () => [{ name: 'job-1' }],
    listCronJobs: async () => [{ name: 'cron-1' }],
    listHelmReleases: async () => [{ name: 'helm-1' }],
    listHelmCharts: async () => [{ name: 'bitnami/nginx', version: '18.2.5' }],
    listHelmRepositories: async () => [{ name: 'bitnami', url: 'https://charts.bitnami.com/bitnami' }],
    getClusterHealth: async () => ({ status: 'healthy', totalNodes: 1, readyNodes: 1, totalPods: 1, runningPods: 1, pendingPods: 0, failedPods: 0, lastUpdated: 'now' }),
    listServices: async () => [{ name: 'svc-1' }],
    listConfigMaps: async () => [{ name: 'cm-1' }],
    listSecrets: async () => [{ name: 'secret-1' }],
    listEndpoints: async () => [{ name: 'endpoint-1' }],
    listIngresses: async () => [{ name: 'ing-1' }],
    listIngressClasses: async () => [{ name: 'ingressclass-1' }],
    listNetworkPolicies: async () => [{ name: 'netpol-1' }],
    listIPAddresses: async () => [{ name: 'ipaddress-1' }],
    listServiceCIDRs: async () => [{ name: 'servicecidr-1' }],
    listEndpointSlices: async () => [{ name: 'slice-1' }],
    listAPIServices: async () => [{ name: 'apiservice-1' }],
    listMutatingWebhookConfigurations: async () => [{ name: 'mwc-1' }],
    listValidatingWebhookConfigurations: async () => [{ name: 'vwc-1' }],
    listMutatingAdmissionPolicies: async () => [{ name: 'map-1' }],
    listMutatingAdmissionPolicyBindings: async () => [{ name: 'mapb-1' }],
    listValidatingAdmissionPolicies: async () => [{ name: 'vap-1' }],
    listValidatingAdmissionPolicyBindings: async () => [{ name: 'vapb-1' }],
    listFlowSchemas: async () => [{ name: 'fs-1' }],
    listPriorityLevelConfigurations: async () => [{ name: 'plc-1' }],
    listCertificateSigningRequests: async () => [{ name: 'csr-1' }],
    listClusterTrustBundles: async () => [{ name: 'ctb-1' }],
    listPodCertificateRequests: async () => [{ name: 'pcr-1' }],
    listStorageVersions: async () => [{ name: 'sv-1' }],
    listStorageVersionMigrations: async () => [{ name: 'svm-1' }],
    listPodDisruptionBudgets: async () => [{ name: 'pdb-1' }],
    listResourceQuotas: async () => [{ name: 'quota-1' }],
    listLimitRanges: async () => [{ name: 'limit-1' }],
    listPriorityClasses: async () => [{ name: 'priority-1' }],
    listRuntimeClasses: async () => [{ name: 'runtime-1' }],
    listPersistentVolumes: async () => [{ name: 'pv-1' }],
    listPersistentVolumeClaims: async () => [{ name: 'pvc-1' }],
    listStorageClasses: async () => [{ name: 'sc-1' }],
    listVolumeAttributesClasses: async () => [{ name: 'vac-1' }],
    listCSIDrivers: async () => [{ name: 'csidriver-1' }],
    listCSINodes: async () => [{ name: 'csinode-1' }],
    listVolumeAttachments: async () => [{ name: 'volumeattachment-1' }],
    listCSIStorageCapacities: async () => [{ name: 'capacity-1' }],
    listVolumeSnapshotClasses: async () => [{ name: 'snapshotclass-1' }],
    listVolumeSnapshots: async () => [{ name: 'snapshot-1' }],
    listVolumeSnapshotContents: async () => [{ name: 'snapshotcontent-1' }],
    listGatewayClasses: async () => [{ name: 'gatewayclass-1' }],
    listGateways: async () => [{ name: 'gateway-1' }],
    listHTTPRoutes: async () => [{ name: 'httproute-1' }],
    listGRPCRoutes: async () => [{ name: 'grpcroute-1' }],
    listTLSRoutes: async () => [{ name: 'tlsroute-1' }],
    listTCPRoutes: async () => [{ name: 'tcproute-1' }],
    listUDPRoutes: async () => [{ name: 'udproute-1' }],
    listReferenceGrants: async () => [{ name: 'referencegrant-1' }],
    listDeviceClasses: async () => [{ name: 'deviceclass-1' }],
    listDeviceTaintRules: async () => [{ name: 'devicetaintrule-1' }],
    listResourceClaims: async () => [{ name: 'resourceclaim-1' }],
    listResourceClaimTemplates: async () => [{ name: 'resourceclaimtemplate-1' }],
    listResourceSlices: async () => [{ name: 'resourceslice-1' }],
    listServiceAccounts: async () => [{ name: 'sa-1' }],
    listRoles: async () => [{ name: 'role-1' }],
    listRoleBindings: async () => [{ name: 'rb-1' }],
    listClusterRoles: async () => [{ name: 'cr-1' }],
    listClusterRoleBindings: async () => [{ name: 'crb-1' }],
    listCustomResourceDefinitions: async () => [{ name: 'widgets.example.com' }],
    listHPAs: async () => [{ name: 'hpa-1' }],
    listLeases: async () => [{ name: 'lease-1' }],
    listLeaseCandidates: async () => [{ name: 'leasecandidate-1' }],
    listEvents: async () => [{ name: 'event-1' }],
  })
}

beforeEach(() => {
  useClusterStore.setState(initialClusterState)
})

afterEach(() => {
  Object.assign(k8sApi, originalApi)
})

describe('useClusterStore', () => {
  it('loads contexts, keeps valid selections, resets missing selections, and handles empty results', async () => {
    Object.assign(k8sApi, {
      listContexts: async () => [ctx1, ctx2],
    })

    await useClusterStore.getState().loadContexts()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-1')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['default'])

    useClusterStore.setState({ selectedId: 'ctx-2' })
    await useClusterStore.getState().loadContexts()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-2')

    Object.assign(k8sApi, {
      listContexts: async () => [ctx1],
    })
    await useClusterStore.getState().loadContexts()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-1')

    Object.assign(k8sApi, {
      listContexts: async () => [],
    })
    await useClusterStore.getState().loadContexts()
    assert.equal(useClusterStore.getState().selectedId, '')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, [])
  })

  it('uses kubeconfig current context and default namespace when selecting contexts', async () => {
    const currentContext = { ...ctx2, current: true, namespace: 'prod' }
    Object.assign(k8sApi, {
      listContexts: async () => [{ ...ctx1, current: false }, currentContext],
    })

    await useClusterStore.getState().loadContexts()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-2')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['prod'])

    useClusterStore.getState().selectContext('ctx-1')
    assert.equal(useClusterStore.getState().selectedId, 'ctx-1')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['default'])
  })

  it('persists the selected kubeconfig context through the store', async () => {
    const updatedCtx1 = { ...ctx1, current: false }
    const updatedCtx2 = { ...ctx2, current: true, namespace: 'prod' }
    const calls = []
    Object.assign(k8sApi, {
      useKubeContext: async (contextId) => {
        calls.push(contextId)
        return [updatedCtx1, updatedCtx2]
      },
    })

    await useClusterStore.getState().useKubeContext('ctx-2')

    assert.deepEqual(calls, ['ctx-2'])
    assert.deepEqual(useClusterStore.getState().contexts, [updatedCtx1, updatedCtx2])
    assert.equal(useClusterStore.getState().selectedId, 'ctx-2')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['prod'])
  })

  it('persists the selected kubeconfig namespace through the store', async () => {
    const updatedCtx1 = { ...ctx1, namespace: 'team-a' }
    const calls = []
    useClusterStore.setState({ contexts: [ctx1, ctx2], selectedId: 'ctx-1', selectedNamespaces: ['default'] })
    Object.assign(k8sApi, {
      setKubeContextNamespace: async (contextId, namespace) => {
        calls.push({ contextId, namespace })
        return [updatedCtx1, ctx2]
      },
    })

    await useClusterStore.getState().setKubeContextNamespace('ctx-1', 'team-a')

    assert.deepEqual(calls, [{ contextId: 'ctx-1', namespace: 'team-a' }])
    assert.deepEqual(useClusterStore.getState().contexts, [updatedCtx1, ctx2])
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['team-a'])
  })

  it('keeps namespace filters unchanged when updating another kubeconfig context', async () => {
    const updatedCtx2 = { ...ctx2, namespace: 'prod' }
    useClusterStore.setState({ contexts: [ctx1, ctx2], selectedId: 'ctx-1', selectedNamespaces: ['default'] })
    Object.assign(k8sApi, {
      setKubeContextNamespace: async () => [ctx1, updatedCtx2],
    })

    await useClusterStore.getState().setKubeContextNamespace('ctx-2', 'prod')

    assert.deepEqual(useClusterStore.getState().contexts, [ctx1, updatedCtx2])
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['default'])
  })

  it('stores a user-facing error when loading contexts fails', async () => {
    Object.assign(k8sApi, {
      listContexts: async () => {
        throw new Error('list failed')
      },
    })

    await useClusterStore.getState().loadContexts()

    assert.equal(useClusterStore.getState().error, 'list failed')
  })

  it('updates simple selection state through direct actions', async () => {
    useClusterStore.getState().selectContext('ctx-9')
    useClusterStore.getState().toggleNamespace('default')
    useClusterStore.getState().toggleNamespace('kube-system')
    useClusterStore.getState().toggleNamespace('default')
    useClusterStore.getState().setSelectedNamespaces(['prod'])
    useClusterStore.getState().setIsRefreshing(true)

    assert.equal(useClusterStore.getState().selectedId, 'ctx-9')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['prod'])
    assert.equal(useClusterStore.getState().isRefreshing, true)
  })

  it('loads namespaces and keeps only still-valid namespace filters', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1', selectedNamespaces: ['default', 'stale'] })
    Object.assign(k8sApi, {
      listNamespaces: async () => [
        { name: 'default' },
        { name: 'kube-system' },
      ],
    })

    await useClusterStore.getState().loadNamespaces()

    assert.deepEqual(useClusterStore.getState().namespaces, [{ name: 'default' }, { name: 'kube-system' }])
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['default'])
  })

  it('falls back to an empty namespace list when namespace loading fails', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1', namespaces: [{ name: 'old' }] })
    Object.assign(k8sApi, {
      listNamespaces: async () => {
        throw new Error('namespace failed')
      },
    })

    await useClusterStore.getState().loadNamespaces()

    assert.deepEqual(useClusterStore.getState().namespaces, [])
  })

  it('loads core resources successfully for manual refreshes', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1' })
    assignClusterApiDefaults()

    await useClusterStore.getState().loadResources()

    const state = useClusterStore.getState()
    assert.equal(state.status, 'ready')
    assert.deepEqual(state.nodes, [{ name: 'node-1' }])
    assert.deepEqual(state.pods, [{ name: 'pod-1' }])
    assert.deepEqual(state.deployments, [{ name: 'deploy-1' }])
    assert.deepEqual(state.replicationControllers, [{ name: 'rc-1' }])
    assert.deepEqual(state.cronJobs, [{ name: 'cron-1' }])
    assert.ok(state.lastRefreshTime instanceof Date)
    assert.equal(state.isRefreshing, false)
  })

  it('tracks auto-refresh state and records resource loading failures', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1' })
    Object.assign(k8sApi, {
      listNodes: async () => {
        throw new Error('resource failed')
      },
      listPods: async () => [],
      listDeployments: async () => [],
      listDaemonSets: async () => [],
      listStatefulSets: async () => [],
      listReplicaSets: async () => [],
      listReplicationControllers: async () => [],
      listJobs: async () => [],
      listCronJobs: async () => [],
    })

    await useClusterStore.getState().loadResources(true)

    assert.equal(useClusterStore.getState().status, 'error')
    assert.equal(useClusterStore.getState().error, 'resource failed')
    assert.equal(useClusterStore.getState().isRefreshing, false)
  })

  it('loads cluster health and resets it to null on failure', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1' })

    Object.assign(k8sApi, {
      getClusterHealth: async () => ({ status: 'healthy', totalNodes: 2 }),
    })
    await useClusterStore.getState().loadClusterHealth()
    assert.deepEqual(useClusterStore.getState().clusterHealth, { status: 'healthy', totalNodes: 2 })

    Object.assign(k8sApi, {
      getClusterHealth: async () => {
        throw new Error('health failed')
      },
    })
    await useClusterStore.getState().loadClusterHealth()
    assert.equal(useClusterStore.getState().clusterHealth, null)
  })

  it('loads additional resource types and ignores failures silently', async () => {
    useClusterStore.setState({ selectedId: 'ctx-1' })
    assignClusterApiDefaults()

    await useClusterStore.getState().loadNewResources()

    assert.deepEqual(useClusterStore.getState().services, [{ name: 'svc-1' }])
    assert.deepEqual(useClusterStore.getState().componentStatuses, [{ name: 'scheduler' }])
    assert.deepEqual(useClusterStore.getState().apiGroups, [{ name: 'core' }])
    assert.deepEqual(useClusterStore.getState().apiResources, [{ name: 'pods' }])
    assert.deepEqual(useClusterStore.getState().serverVersions, [{ name: 'v1.34.1' }])
    assert.deepEqual(useClusterStore.getState().openIDConfigurations, [{ name: 'https://kubernetes.default.svc' }])
    assert.deepEqual(useClusterStore.getState().apiServerHealth, [{ name: 'readyz' }])
    assert.deepEqual(useClusterStore.getState().selfSubjectReviews, [{ username: 'alice@example.com' }])
    assert.deepEqual(useClusterStore.getState().selfSubjectAccessReviews, [{ name: 'default/list pods' }])
    assert.deepEqual(useClusterStore.getState().selfSubjectRulesReviews, [{ name: 'default/resource-1' }])
    assert.deepEqual(useClusterStore.getState().helmReleases, [{ name: 'helm-1' }])
    assert.deepEqual(useClusterStore.getState().helmCharts, [{ name: 'bitnami/nginx', version: '18.2.5' }])
    assert.deepEqual(useClusterStore.getState().helmRepositories, [{ name: 'bitnami', url: 'https://charts.bitnami.com/bitnami' }])
    assert.deepEqual(useClusterStore.getState().endpoints, [{ name: 'endpoint-1' }])
    assert.deepEqual(useClusterStore.getState().ingressClasses, [{ name: 'ingressclass-1' }])
    assert.deepEqual(useClusterStore.getState().networkPolicies, [{ name: 'netpol-1' }])
    assert.deepEqual(useClusterStore.getState().ipAddresses, [{ name: 'ipaddress-1' }])
    assert.deepEqual(useClusterStore.getState().serviceCIDRs, [{ name: 'servicecidr-1' }])
    assert.deepEqual(useClusterStore.getState().endpointSlices, [{ name: 'slice-1' }])
    assert.deepEqual(useClusterStore.getState().apiServices, [{ name: 'apiservice-1' }])
    assert.deepEqual(useClusterStore.getState().mutatingWebhookConfigurations, [{ name: 'mwc-1' }])
    assert.deepEqual(useClusterStore.getState().validatingWebhookConfigurations, [{ name: 'vwc-1' }])
    assert.deepEqual(useClusterStore.getState().mutatingAdmissionPolicies, [{ name: 'map-1' }])
    assert.deepEqual(useClusterStore.getState().mutatingAdmissionPolicyBindings, [{ name: 'mapb-1' }])
    assert.deepEqual(useClusterStore.getState().validatingAdmissionPolicies, [{ name: 'vap-1' }])
    assert.deepEqual(useClusterStore.getState().validatingAdmissionPolicyBindings, [{ name: 'vapb-1' }])
    assert.deepEqual(useClusterStore.getState().flowSchemas, [{ name: 'fs-1' }])
    assert.deepEqual(useClusterStore.getState().priorityLevelConfigurations, [{ name: 'plc-1' }])
    assert.deepEqual(useClusterStore.getState().certificateSigningRequests, [{ name: 'csr-1' }])
    assert.deepEqual(useClusterStore.getState().clusterTrustBundles, [{ name: 'ctb-1' }])
    assert.deepEqual(useClusterStore.getState().podCertificateRequests, [{ name: 'pcr-1' }])
    assert.deepEqual(useClusterStore.getState().storageVersions, [{ name: 'sv-1' }])
    assert.deepEqual(useClusterStore.getState().storageVersionMigrations, [{ name: 'svm-1' }])
    assert.deepEqual(useClusterStore.getState().podDisruptionBudgets, [{ name: 'pdb-1' }])
    assert.deepEqual(useClusterStore.getState().resourceQuotas, [{ name: 'quota-1' }])
    assert.deepEqual(useClusterStore.getState().limitRanges, [{ name: 'limit-1' }])
    assert.deepEqual(useClusterStore.getState().priorityClasses, [{ name: 'priority-1' }])
    assert.deepEqual(useClusterStore.getState().runtimeClasses, [{ name: 'runtime-1' }])
    assert.deepEqual(useClusterStore.getState().volumeAttributesClasses, [{ name: 'vac-1' }])
    assert.deepEqual(useClusterStore.getState().csiDrivers, [{ name: 'csidriver-1' }])
    assert.deepEqual(useClusterStore.getState().csiNodes, [{ name: 'csinode-1' }])
    assert.deepEqual(useClusterStore.getState().volumeAttachments, [{ name: 'volumeattachment-1' }])
    assert.deepEqual(useClusterStore.getState().csiStorageCapacities, [{ name: 'capacity-1' }])
    assert.deepEqual(useClusterStore.getState().volumeSnapshotClasses, [{ name: 'snapshotclass-1' }])
    assert.deepEqual(useClusterStore.getState().volumeSnapshots, [{ name: 'snapshot-1' }])
    assert.deepEqual(useClusterStore.getState().volumeSnapshotContents, [{ name: 'snapshotcontent-1' }])
    assert.deepEqual(useClusterStore.getState().gatewayClasses, [{ name: 'gatewayclass-1' }])
    assert.deepEqual(useClusterStore.getState().gateways, [{ name: 'gateway-1' }])
    assert.deepEqual(useClusterStore.getState().httpRoutes, [{ name: 'httproute-1' }])
    assert.deepEqual(useClusterStore.getState().grpcRoutes, [{ name: 'grpcroute-1' }])
    assert.deepEqual(useClusterStore.getState().tlsRoutes, [{ name: 'tlsroute-1' }])
    assert.deepEqual(useClusterStore.getState().tcpRoutes, [{ name: 'tcproute-1' }])
    assert.deepEqual(useClusterStore.getState().udpRoutes, [{ name: 'udproute-1' }])
    assert.deepEqual(useClusterStore.getState().referenceGrants, [{ name: 'referencegrant-1' }])
    assert.deepEqual(useClusterStore.getState().deviceClasses, [{ name: 'deviceclass-1' }])
    assert.deepEqual(useClusterStore.getState().deviceTaintRules, [{ name: 'devicetaintrule-1' }])
    assert.deepEqual(useClusterStore.getState().resourceClaims, [{ name: 'resourceclaim-1' }])
    assert.deepEqual(useClusterStore.getState().resourceClaimTemplates, [{ name: 'resourceclaimtemplate-1' }])
    assert.deepEqual(useClusterStore.getState().resourceSlices, [{ name: 'resourceslice-1' }])
    assert.deepEqual(useClusterStore.getState().customResourceDefinitions, [{ name: 'widgets.example.com' }])
    assert.deepEqual(useClusterStore.getState().leases, [{ name: 'lease-1' }])
    assert.deepEqual(useClusterStore.getState().leaseCandidates, [{ name: 'leasecandidate-1' }])
    assert.deepEqual(useClusterStore.getState().events, [{ name: 'event-1' }])
    assert.deepEqual(useClusterStore.getState().controllerRevisions, [{ name: 'crv-1' }])
    assert.deepEqual(useClusterStore.getState().podTemplates, [{ name: 'pt-1' }])

    Object.assign(k8sApi, {
      listServices: async () => {
        throw new Error('new resources failed')
      },
    })

    await assert.doesNotReject(useClusterStore.getState().loadNewResources())
  })

  it('refreshes all dependent resources only when a context is selected', async () => {
    const calls = []

    useClusterStore.setState({
      selectedId: '',
      loadNamespaces: async () => calls.push('namespaces'),
      loadResources: async (flag) => calls.push(`resources:${flag}`),
      loadClusterHealth: async () => calls.push('health'),
      loadNewResources: async () => calls.push('new'),
    })

    await useClusterStore.getState().refreshAll(true)
    assert.deepEqual(calls, [])

    useClusterStore.setState({ selectedId: 'ctx-1' })
    await useClusterStore.getState().refreshAll(true)
    assert.deepEqual(calls, ['namespaces', 'resources:true', 'health', 'new'])
  })

  it('adds kubeconfig contexts and chooses the correct post-add selection', async () => {
    Object.assign(k8sApi, {
      addKubeconfigFile: async () => ({
        contexts: [ctx1, ctx2],
        addedIds: ['ctx-2'],
      }),
    })
    await useClusterStore.getState().handleAdd()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-2')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, [])
    assert.deepEqual(useClusterStore.getState().contexts, [ctx1, ctx2])

    Object.assign(k8sApi, {
      addKubeconfigFile: async () => ({
        contexts: [ctx1],
        addedIds: [],
      }),
    })
    useClusterStore.setState({ selectedId: '' })
    await useClusterStore.getState().handleAdd()
    assert.equal(useClusterStore.getState().selectedId, 'ctx-1')
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['default'])
  })

  it('stores a readable add error when kubeconfig import fails', async () => {
    Object.assign(k8sApi, {
      addKubeconfigFile: async () => {
        throw new Error('add failed')
      },
    })

    await useClusterStore.getState().handleAdd()

    assert.equal(useClusterStore.getState().error, 'add failed')
  })

  it('manually refreshes only when there is a selected context', async () => {
    const calls = []

    useClusterStore.setState({
      selectedId: '',
      refreshAll: async (flag) => calls.push(flag),
    })
    useClusterStore.getState().handleManualRefresh()
    assert.deepEqual(calls, [])

    useClusterStore.setState({ selectedId: 'ctx-1' })
    useClusterStore.getState().handleManualRefresh()
    assert.deepEqual(calls, [true])
  })
})
