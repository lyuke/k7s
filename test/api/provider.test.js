import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { importFresh } from '../helpers/module.js'
import { resetWindowState } from '../helpers/mocks.js'

const SHARED_METHOD_CASES = [
  ['listContexts', []],
  ['listNamespaces', ['ctx-1']],
  ['listNodes', ['ctx-1']],
  ['getNodeDetail', ['ctx-1', 'node-1']],
  ['getNodeMetrics', ['ctx-1', 'node-1']],
  ['listPods', ['ctx-1', 'default']],
  ['getPodDetail', ['ctx-1', 'default', 'pod-1']],
  ['listDeployments', ['ctx-1', 'default']],
  ['getDeploymentDetail', ['ctx-1', 'default', 'deploy-1']],
  ['listDaemonSets', ['ctx-1', 'default']],
  ['getDaemonSetDetail', ['ctx-1', 'default', 'ds-1']],
  ['listStatefulSets', ['ctx-1', 'default']],
  ['getStatefulSetDetail', ['ctx-1', 'default', 'sts-1']],
  ['listReplicaSets', ['ctx-1', 'default']],
  ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1']],
  ['listJobs', ['ctx-1', 'default']],
  ['getJobDetail', ['ctx-1', 'default', 'job-1']],
  ['listCronJobs', ['ctx-1', 'default']],
  ['getCronJobDetail', ['ctx-1', 'default', 'cron-1']],
  ['listServices', ['ctx-1', 'default']],
  ['listConfigMaps', ['ctx-1', 'default']],
  ['listSecrets', ['ctx-1', 'default']],
  ['listIngresses', ['ctx-1', 'default']],
  ['listPersistentVolumes', ['ctx-1']],
  ['listPersistentVolumeClaims', ['ctx-1', 'default']],
  ['listStorageClasses', ['ctx-1']],
  ['listServiceAccounts', ['ctx-1', 'default']],
  ['listRoles', ['ctx-1', 'default']],
  ['listRoleBindings', ['ctx-1', 'default']],
  ['listClusterRoles', ['ctx-1']],
  ['listClusterRoleBindings', ['ctx-1']],
  ['listHPAs', ['ctx-1', 'default']],
  ['listEvents', ['ctx-1', 'default']],
  ['addKubeconfigFile', []],
  ['getContextPrefs', []],
  ['updateContextName', ['ctx-1', 'renamed']],
  ['updateContextGrouping', [[{ id: 'g1', items: ['ctx-1'] }], ['ctx-2']]],
  ['deletePod', ['ctx-1', 'default', 'pod-1']],
  ['deleteDeployment', ['ctx-1', 'default', 'deploy-1']],
  ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1']],
  ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1']],
  ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1']],
  ['deleteJob', ['ctx-1', 'default', 'job-1']],
  ['deleteCronJob', ['ctx-1', 'default', 'cron-1']],
  ['deleteNamespace', ['ctx-1', 'default']],
  ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3]],
  ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2]],
  ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4]],
  ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100]],
  ['getClusterHealth', ['ctx-1']],
  ['createNamespace', ['ctx-1', 'default']],
  ['createDeployment', ['ctx-1', { image: 'nginx' }]],
  ['createService', ['ctx-1', { port: 80 }]],
  ['createConfigMap', ['ctx-1', { data: [] }]],
  ['createSecret', ['ctx-1', { data: [] }]],
  ['createIngress', ['ctx-1', { host: 'example.com' }]],
  ['updateDeployment', ['ctx-1', 'default', 'deploy-1', { replicas: 2 }]],
  ['deleteResource', ['ctx-1', 'Pod', 'default', 'pod-1']],
  ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 6]],
  ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['applyYaml', ['ctx-1', 'kind: Pod']],
  ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1']],
  ['stopPodLogStream', ['stream-1']],
  ['stopPodExec', ['session-1']],
  ['stopPortForward', ['pf-1']],
  ['subscribeWatch', ['ctx-1']],
  ['unsubscribeWatch', []],
]

beforeEach(() => {
  resetWindowState()
})

describe('provider', () => {
  it('routes every supported method to the Electron bridge when available', async () => {
    const electronCalls = []
    const electronApi = {}

    for (const [method] of SHARED_METHOD_CASES) {
      electronApi[method] = async (...args) => {
        electronCalls.push({ method, args })
        return { source: 'electron', method, args }
      }
    }

    let bridgeHandler = null
    electronApi.startPodLogStream = async (...args) => {
      electronCalls.push({ method: 'startPodLogStream', args })
      return { streamId: 'stream-1', args }
    }
    electronApi.startPodExec = async (...args) => {
      electronCalls.push({ method: 'startPodExec', args })
      return { sessionId: 'session-1', args }
    }
    electronApi.startPortForward = async (...args) => {
      electronCalls.push({ method: 'startPortForward', args })
      return { sessionId: 'pf-1', localPort: 8080, args }
    }
    electronApi.onPushEvent = (handler) => {
      bridgeHandler = handler
    }

    globalThis.window.k7s = electronApi
    const provider = await importFresh('./src/renderer/src/api/provider.ts')

    assert.equal(provider.isWebMode, false)

    for (const [method, args] of SHARED_METHOD_CASES) {
      const result = await provider.k8sApi[method](...args)
      assert.deepEqual(result, { source: 'electron', method, args })
    }

    assert.deepEqual(
      await provider.k8sApi.startPodLogStream('ctx-1', { namespace: 'default', podName: 'pod-1' }),
      { streamId: 'stream-1', args: ['ctx-1', { namespace: 'default', podName: 'pod-1' }] },
    )
    assert.deepEqual(
      await provider.k8sApi.startPodExec('ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }),
      { sessionId: 'session-1', args: ['ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }] },
    )
    assert.deepEqual(
      await provider.k8sApi.startPortForward('ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }),
      { sessionId: 'pf-1', localPort: 8080, args: ['ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }] },
    )

    const events = []
    const unsubscribeFirst = provider.k8sApi.onPushEvent((event) => {
      events.push(['first', event])
    })
    provider.k8sApi.onPushEvent((event) => {
      events.push(['second', event])
    })

    assert.ok(bridgeHandler)
    bridgeHandler({ type: 'watch', resource: 'pods' })
    unsubscribeFirst()
    bridgeHandler({ type: 'watch', resource: 'deployments' })

    assert.deepEqual(events, [
      ['first', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'deployments' }],
    ])
  })

  it('routes shared methods to the websocket client in web mode', async () => {
    const provider = await importFresh('./src/renderer/src/api/provider.ts')
    const wsCalls = []

    for (const [method] of SHARED_METHOD_CASES) {
      provider.wsClient[method] = async (...args) => {
        wsCalls.push({ method, args })
        return { source: 'web', method, args }
      }
    }

    provider.wsClient.onEvent = (eventName, handler) => {
      wsCalls.push({ method: 'onEvent', args: [eventName] })
      provider.wsClient.__eventHandler = handler
      return () => {}
    }

    assert.equal(provider.isWebMode, true)

    for (const [method, args] of SHARED_METHOD_CASES) {
      const result = await provider.k8sApi[method](...args)
      if (method.startsWith('stopPod')) {
        assert.deepEqual(result, { success: true })
        continue
      }
      if (method === 'stopPortForward') {
        assert.deepEqual(result, { success: true })
        continue
      }
      assert.deepEqual(result, { source: 'web', method, args })
    }

    const events = []
    const unsubscribeFirst = provider.k8sApi.onPushEvent((event) => {
      events.push(['first', event])
    })
    provider.k8sApi.onPushEvent((event) => {
      events.push(['second', event])
    })

    provider.wsClient.__eventHandler({ type: 'watch', resource: 'pods' })
    unsubscribeFirst()
    provider.wsClient.__eventHandler({ type: 'watch', resource: 'services' })

    assert.deepEqual(events, [
      ['first', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'services' }],
    ])
    assert.equal(wsCalls.filter((call) => call.method === 'onEvent').length, 1)
  })

  it('rejects desktop-only capabilities in web mode with stable fallbacks for stop calls', async () => {
    const provider = await importFresh('./src/renderer/src/api/provider.ts')

    await assert.rejects(
      provider.k8sApi.startPodLogStream('ctx-1', { namespace: 'default', podName: 'pod-1' }),
      /实时日志流仅在桌面模式可用/,
    )
    await assert.rejects(
      provider.k8sApi.startPodExec('ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }),
      /Pod Exec 仅在桌面模式可用/,
    )
    await assert.rejects(
      provider.k8sApi.startPortForward('ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }),
      /端口转发仅在桌面模式可用/,
    )

    assert.deepEqual(await provider.k8sApi.stopPodLogStream('stream-1'), { success: true })
    assert.deepEqual(await provider.k8sApi.stopPodExec('session-1'), { success: true })
    assert.deepEqual(await provider.k8sApi.stopPortForward('pf-1'), { success: true })
  })
})
