import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

const K8S_METHOD_CASES = [
  ['listContexts', [], ['k7s:list-contexts']],
  ['listNamespaces', ['ctx-1'], ['k7s:list-namespaces', 'ctx-1']],
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
  ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1'], ['k7s:get-replicaset-detail', 'ctx-1', 'default', 'rs-1']],
  ['listJobs', ['ctx-1', 'default'], ['k7s:list-jobs', 'ctx-1', 'default']],
  ['getJobDetail', ['ctx-1', 'default', 'job-1'], ['k7s:get-job-detail', 'ctx-1', 'default', 'job-1']],
  ['listCronJobs', ['ctx-1', 'default'], ['k7s:list-cronjobs', 'ctx-1', 'default']],
  ['getCronJobDetail', ['ctx-1', 'default', 'cron-1'], ['k7s:get-cronjob-detail', 'ctx-1', 'default', 'cron-1']],
  ['addKubeconfigFile', [], ['k7s:add-kubeconfig']],
  ['getContextPrefs', [], ['k7s:get-context-prefs']],
  ['updateContextName', ['ctx-1', 'renamed'], ['k7s:update-context-name', 'ctx-1', 'renamed']],
  ['updateContextGrouping', [[{ id: 'g1' }], ['ctx-2']], ['k7s:update-context-grouping', { groups: [{ id: 'g1' }], ungrouped: ['ctx-2'] }]],
  ['deletePod', ['ctx-1', 'default', 'pod-1'], ['k7s:delete-pod', 'ctx-1', 'default', 'pod-1']],
  ['deleteDeployment', ['ctx-1', 'default', 'deploy-1'], ['k7s:delete-deployment', 'ctx-1', 'default', 'deploy-1']],
  ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1'], ['k7s:delete-daemonset', 'ctx-1', 'default', 'ds-1']],
  ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1'], ['k7s:delete-statefulset', 'ctx-1', 'default', 'sts-1']],
  ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1'], ['k7s:delete-replicaset', 'ctx-1', 'default', 'rs-1']],
  ['deleteJob', ['ctx-1', 'default', 'job-1'], ['k7s:delete-job', 'ctx-1', 'default', 'job-1']],
  ['deleteCronJob', ['ctx-1', 'default', 'cron-1'], ['k7s:delete-cronjob', 'ctx-1', 'default', 'cron-1']],
  ['deleteNamespace', ['ctx-1', 'default'], ['k7s:delete-namespace', 'ctx-1', 'default']],
  ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3], ['k7s:scale-deployment', 'ctx-1', 'default', 'deploy-1', 3]],
  ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2], ['k7s:scale-statefulset', 'ctx-1', 'default', 'sts-1', 2]],
  ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4], ['k7s:scale-replicaset', 'ctx-1', 'default', 'rs-1', 4]],
  ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100], ['k7s:get-pod-logs', 'ctx-1', 'default', 'pod-1', 'container-1', 100]],
  ['startPodLogStream', ['ctx-1', { namespace: 'default', podName: 'pod-1' }], ['k7s:start-pod-log-stream', 'ctx-1', { namespace: 'default', podName: 'pod-1' }]],
  ['stopPodLogStream', ['stream-1'], ['k7s:stop-pod-log-stream', 'stream-1']],
  ['startPodExec', ['ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }], ['k7s:start-pod-exec', 'ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }]],
  ['stopPodExec', ['session-1'], ['k7s:stop-pod-exec', 'session-1']],
  ['startPortForward', ['ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }], ['k7s:start-port-forward', 'ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }]],
  ['stopPortForward', ['pf-1'], ['k7s:stop-port-forward', 'pf-1']],
  ['getClusterHealth', ['ctx-1'], ['k7s:get-cluster-health', 'ctx-1']],
  ['listServices', ['ctx-1', 'default'], ['k7s:list-services', 'ctx-1', 'default']],
  ['listConfigMaps', ['ctx-1', 'default'], ['k7s:list-configmaps', 'ctx-1', 'default']],
  ['listSecrets', ['ctx-1', 'default'], ['k7s:list-secrets', 'ctx-1', 'default']],
  ['listIngresses', ['ctx-1', 'default'], ['k7s:list-ingresses', 'ctx-1', 'default']],
  ['listPersistentVolumes', ['ctx-1'], ['k7s:list-persistentvolumes', 'ctx-1']],
  ['listPersistentVolumeClaims', ['ctx-1', 'default'], ['k7s:list-persistentvolumeclaims', 'ctx-1', 'default']],
  ['listStorageClasses', ['ctx-1'], ['k7s:list-storageclasses', 'ctx-1']],
  ['listServiceAccounts', ['ctx-1', 'default'], ['k7s:list-serviceaccounts', 'ctx-1', 'default']],
  ['listRoles', ['ctx-1', 'default'], ['k7s:list-roles', 'ctx-1', 'default']],
  ['listRoleBindings', ['ctx-1', 'default'], ['k7s:list-rolebindings', 'ctx-1', 'default']],
  ['listClusterRoles', ['ctx-1'], ['k7s:list-clusterroles', 'ctx-1']],
  ['listClusterRoleBindings', ['ctx-1'], ['k7s:list-clusterrolebindings', 'ctx-1']],
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
  ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 2], ['k7s:scale-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1', 2]],
  ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:restart-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], ['k7s:rollback-workload', 'ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['applyYaml', ['ctx-1', 'kind: Pod'], ['k7s:apply-yaml', 'ctx-1', 'kind: Pod']],
  ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1'], ['k7s:get-resource-yaml', 'ctx-1', 'Pod', 'default', 'pod-1']],
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
