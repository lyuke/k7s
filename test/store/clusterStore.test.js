import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { k8sApi } from '../../src/renderer/src/api/provider.ts'
import { useClusterStore } from '../../src/renderer/src/store/clusterStore.ts'

const originalApi = { ...k8sApi }
const initialClusterState = Object.fromEntries(
  Object.entries(useClusterStore.getState()).filter(([key, value]) => key !== 'selectedContext' && typeof value !== 'function'),
)

const ctx1 = { id: 'ctx-1', name: 'dev', cluster: 'cluster-a', user: 'user-a', source: 'file-a' }
const ctx2 = { id: 'ctx-2', name: 'prod', cluster: 'cluster-b', user: 'user-b', source: 'file-b' }

const assignClusterApiDefaults = () => {
  Object.assign(k8sApi, {
    listNodes: async () => [{ name: 'node-1' }],
    listPods: async () => [{ name: 'pod-1' }],
    listDeployments: async () => [{ name: 'deploy-1' }],
    listDaemonSets: async () => [{ name: 'ds-1' }],
    listStatefulSets: async () => [{ name: 'sts-1' }],
    listReplicaSets: async () => [{ name: 'rs-1' }],
    listJobs: async () => [{ name: 'job-1' }],
    listCronJobs: async () => [{ name: 'cron-1' }],
    getClusterHealth: async () => ({ status: 'healthy', totalNodes: 1, readyNodes: 1, totalPods: 1, runningPods: 1, pendingPods: 0, failedPods: 0, lastUpdated: 'now' }),
    listServices: async () => [{ name: 'svc-1' }],
    listConfigMaps: async () => [{ name: 'cm-1' }],
    listSecrets: async () => [{ name: 'secret-1' }],
    listIngresses: async () => [{ name: 'ing-1' }],
    listPersistentVolumes: async () => [{ name: 'pv-1' }],
    listPersistentVolumeClaims: async () => [{ name: 'pvc-1' }],
    listStorageClasses: async () => [{ name: 'sc-1' }],
    listServiceAccounts: async () => [{ name: 'sa-1' }],
    listRoles: async () => [{ name: 'role-1' }],
    listRoleBindings: async () => [{ name: 'rb-1' }],
    listClusterRoles: async () => [{ name: 'cr-1' }],
    listClusterRoleBindings: async () => [{ name: 'crb-1' }],
    listHPAs: async () => [{ name: 'hpa-1' }],
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
    assert.deepEqual(useClusterStore.getState().events, [{ name: 'event-1' }])

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
