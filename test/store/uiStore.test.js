import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { k8sApi } from '../../src/renderer/src/api/provider.ts'
import { useUIStore } from '../../src/renderer/src/store/uiStore.ts'

const originalApi = { ...k8sApi }
const originalConsoleError = console.error

const pod = { name: 'pod-1', namespace: 'default' }
const node = { name: 'node-1' }

const detailCases = [
  {
    label: 'deployment',
    apiMethod: 'getDeploymentDetail',
    clickMethod: 'handleDeploymentClick',
    closeMethod: 'handleCloseDeploymentDetail',
    selectedKey: 'selectedDeployment',
    loadingKey: 'deploymentDetailLoading',
    args: ['default', 'deploy-1', 'ctx-1'],
    detail: { name: 'deploy-1', namespace: 'default' },
  },
  {
    label: 'daemonset',
    apiMethod: 'getDaemonSetDetail',
    clickMethod: 'handleDaemonSetClick',
    closeMethod: 'handleCloseDaemonSetDetail',
    selectedKey: 'selectedDaemonSet',
    loadingKey: 'daemonSetDetailLoading',
    args: ['default', 'ds-1', 'ctx-1'],
    detail: { name: 'ds-1', namespace: 'default' },
  },
  {
    label: 'statefulset',
    apiMethod: 'getStatefulSetDetail',
    clickMethod: 'handleStatefulSetClick',
    closeMethod: 'handleCloseStatefulSetDetail',
    selectedKey: 'selectedStatefulSet',
    loadingKey: 'statefulSetDetailLoading',
    args: ['default', 'sts-1', 'ctx-1'],
    detail: { name: 'sts-1', namespace: 'default' },
  },
  {
    label: 'replicaset',
    apiMethod: 'getReplicaSetDetail',
    clickMethod: 'handleReplicaSetClick',
    closeMethod: 'handleCloseReplicaSetDetail',
    selectedKey: 'selectedReplicaSet',
    loadingKey: 'replicaSetDetailLoading',
    args: ['default', 'rs-1', 'ctx-1'],
    detail: { name: 'rs-1', namespace: 'default' },
  },
  {
    label: 'job',
    apiMethod: 'getJobDetail',
    clickMethod: 'handleJobClick',
    closeMethod: 'handleCloseJobDetail',
    selectedKey: 'selectedJob',
    loadingKey: 'jobDetailLoading',
    args: ['default', 'job-1', 'ctx-1'],
    detail: { name: 'job-1', namespace: 'default' },
  },
  {
    label: 'cronjob',
    apiMethod: 'getCronJobDetail',
    clickMethod: 'handleCronJobClick',
    closeMethod: 'handleCloseCronJobDetail',
    selectedKey: 'selectedCronJob',
    loadingKey: 'cronJobDetailLoading',
    args: ['default', 'cron-1', 'ctx-1'],
    detail: { name: 'cron-1', namespace: 'default' },
  },
]

beforeEach(() => {
  useUIStore.setState(useUIStore.getInitialState(), true)
})

afterEach(() => {
  Object.assign(k8sApi, originalApi)
  console.error = originalConsoleError
})

describe('useUIStore', () => {
  it('updates simple UI state through setters', async () => {
    useUIStore.getState().setSearchText('pod')
    useUIStore.getState().setSortField('name')
    useUIStore.getState().setSortDirection('desc')
    useUIStore.getState().setRefreshInterval(60)
    useUIStore.getState().setSelectedResourceType('services')
    useUIStore.getState().setNsSearchText('prod')
    useUIStore.getState().setSelectedNode(node)
    useUIStore.getState().setNodeDetailLoading(true)
    useUIStore.getState().setNodeMetrics({ cpu: '1', memory: '1Gi' })
    useUIStore.getState().setNodeMetricsLoading(true)
    useUIStore.getState().setSelectedPod(pod)
    useUIStore.getState().setPodDetailLoading(true)
    useUIStore.getState().setPodDetailError('oops')
    useUIStore.getState().setSelectedPodForLogs(pod)
    useUIStore.getState().setSelectedDeployment({ name: 'deploy-1' })
    useUIStore.getState().setDeploymentDetailLoading(true)
    useUIStore.getState().setSelectedDaemonSet({ name: 'ds-1' })
    useUIStore.getState().setDaemonSetDetailLoading(true)
    useUIStore.getState().setSelectedStatefulSet({ name: 'sts-1' })
    useUIStore.getState().setStatefulSetDetailLoading(true)
    useUIStore.getState().setSelectedReplicaSet({ name: 'rs-1' })
    useUIStore.getState().setReplicaSetDetailLoading(true)
    useUIStore.getState().setSelectedJob({ name: 'job-1' })
    useUIStore.getState().setJobDetailLoading(true)
    useUIStore.getState().setSelectedCronJob({ name: 'cron-1' })
    useUIStore.getState().setCronJobDetailLoading(true)
    useUIStore.getState().setIsCreateModalOpen(true)
    useUIStore.getState().setIsYamlEditorOpen(true, 'edit', { kind: 'Pod', namespace: 'default', name: 'pod-1' })

    const state = useUIStore.getState()
    assert.equal(state.searchText, 'pod')
    assert.equal(state.sortField, 'name')
    assert.equal(state.sortDirection, 'desc')
    assert.equal(state.refreshInterval, 60)
    assert.equal(state.selectedResourceType, 'services')
    assert.equal(state.nsSearchText, 'prod')
    assert.equal(state.selectedPodForLogs, pod)
    assert.equal(state.isCreateModalOpen, true)
    assert.deepEqual(state.yamlEditorResource, { kind: 'Pod', namespace: 'default', name: 'pod-1' })
  })

  it('sorts and filters data with the current sort settings', async () => {
    useUIStore.getState().handleSort('name')
    const asc = useUIStore.getState().sortData([{ name: 'b' }, { name: 'a' }])
    assert.deepEqual(asc.map((item) => item.name), ['a', 'b'])

    useUIStore.getState().handleSort('name')
    const desc = useUIStore.getState().sortData([{ name: 'a' }, { name: 'b' }])
    assert.deepEqual(desc.map((item) => item.name), ['b', 'a'])

    useUIStore.getState().setSortField('restarts')
    useUIStore.getState().setSortDirection('asc')
    const numeric = useUIStore.getState().sortData([{ restarts: 3 }, { restarts: 1 }])
    assert.deepEqual(numeric.map((item) => item.restarts), [1, 3])

    assert.deepEqual(useUIStore.getState().filterData([{ name: 'x' }]), [{ name: 'x' }])

    useUIStore.getState().setSearchText('api')
    const filtered = useUIStore.getState().filterData([
      { name: 'api-pod', namespace: 'default' },
      { name: 'worker', namespace: 'jobs' },
    ])
    assert.deepEqual(filtered, [{ name: 'api-pod', namespace: 'default' }])
  })

  it('loads and closes node details, including the failure path', async () => {
    console.error = () => {}

    Object.assign(k8sApi, {
      getNodeDetail: async () => ({ name: 'node-1', status: 'Ready' }),
      getNodeMetrics: async () => ({ cpu: '500m', memory: '1Gi' }),
    })
    await useUIStore.getState().handleNodeClick('node-1', 'ctx-1')
    assert.deepEqual(useUIStore.getState().selectedNode, { name: 'node-1', status: 'Ready' })
    assert.deepEqual(useUIStore.getState().nodeMetrics, { cpu: '500m', memory: '1Gi' })

    useUIStore.getState().handleCloseNodeDetail()
    assert.equal(useUIStore.getState().selectedNode, null)
    assert.equal(useUIStore.getState().nodeMetrics, null)

    await assert.doesNotReject(useUIStore.getState().handleNodeClick('node-1', ''))

    Object.assign(k8sApi, {
      getNodeDetail: async () => {
        throw new Error('node failed')
      },
      getNodeMetrics: async () => null,
    })
    await assert.doesNotReject(useUIStore.getState().handleNodeClick('node-1', 'ctx-1'))
    assert.equal(useUIStore.getState().nodeDetailLoading, false)
    assert.equal(useUIStore.getState().nodeMetricsLoading, false)
  })

  it('loads pod details, preserves fallback data on failure, and manages log modal state', async () => {
    console.error = () => {}

    Object.assign(k8sApi, {
      getPodDetail: async () => ({ ...pod, status: 'Running' }),
    })
    await useUIStore.getState().handlePodClick(pod, 'ctx-1')
    assert.deepEqual(useUIStore.getState().selectedPod, { ...pod, status: 'Running' })
    assert.equal(useUIStore.getState().podDetailError, null)

    useUIStore.getState().handleOpenPodLogs(pod)
    assert.equal(useUIStore.getState().selectedPodForLogs, pod)
    useUIStore.getState().handleClosePodLogs()
    assert.equal(useUIStore.getState().selectedPodForLogs, null)

    await assert.doesNotReject(useUIStore.getState().handlePodClick(pod, ''))

    Object.assign(k8sApi, {
      getPodDetail: async () => {
        throw new Error('pod failed')
      },
    })
    await useUIStore.getState().handlePodClick(pod, 'ctx-1')
    assert.equal(useUIStore.getState().selectedPod, pod)
    assert.equal(useUIStore.getState().podDetailError, 'pod failed')

    useUIStore.getState().handleClosePodDetail()
    assert.equal(useUIStore.getState().selectedPod, null)
    assert.equal(useUIStore.getState().podDetailError, null)
  })

  it('loads and closes workload details for every supported resource modal', async () => {
    for (const testCase of detailCases) {
      Object.assign(k8sApi, {
        [testCase.apiMethod]: async () => testCase.detail,
      })
      await useUIStore.getState()[testCase.clickMethod](...testCase.args)
      assert.deepEqual(useUIStore.getState()[testCase.selectedKey], testCase.detail, `selected ${testCase.label}`)
      assert.equal(useUIStore.getState()[testCase.loadingKey], false, `${testCase.label} loading`)

      useUIStore.getState()[testCase.closeMethod]()
      assert.equal(useUIStore.getState()[testCase.selectedKey], null, `closed ${testCase.label}`)
    }
  })

  it('handles workload detail fetch failures without leaving loading state behind', async () => {
    console.error = () => {}

    for (const testCase of detailCases) {
      Object.assign(k8sApi, {
        [testCase.apiMethod]: async () => {
          throw new Error(`${testCase.label} failed`)
        },
      })
      await assert.doesNotReject(useUIStore.getState()[testCase.clickMethod](...testCase.args))
      assert.equal(useUIStore.getState()[testCase.loadingKey], false, `${testCase.label} loading cleared`)
      assert.equal(useUIStore.getState()[testCase.selectedKey], null, `${testCase.label} remains empty`)

      await assert.doesNotReject(useUIStore.getState()[testCase.clickMethod](testCase.args[0], testCase.args[1], ''))
    }
  })
})
