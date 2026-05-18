import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { importFresh } from '../helpers/module.js'
import { resetWindowState } from '../helpers/mocks.js'

const SHARED_METHOD_CASES = [
  ['listContexts', []],
  ['useKubeContext', ['ctx-2']],
  ['setKubeContextNamespace', ['ctx-1', 'team-a']],
  ['listNamespaces', ['ctx-1']],
  ['listComponentStatuses', ['ctx-1']],
  ['listAPIGroups', ['ctx-1']],
  ['listAPIResources', ['ctx-1']],
  ['listServerVersions', ['ctx-1']],
  ['listOpenIDConfigurations', ['ctx-1']],
  ['listAPIServerHealth', ['ctx-1']],
  ['listSelfSubjectReviews', ['ctx-1']],
  ['listSelfSubjectAccessReviews', ['ctx-1', ['default']]],
  ['checkCanI', ['ctx-1', { verb: 'get', resource: 'pods', namespace: 'default' }]],
  ['listSelfSubjectRulesReviews', ['ctx-1', ['default']]],
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
  ['listReplicationControllers', ['ctx-1', 'default']],
  ['getReplicationControllerDetail', ['ctx-1', 'default', 'rc-1']],
  ['listControllerRevisions', ['ctx-1', 'default']],
  ['listPodTemplates', ['ctx-1', 'default']],
  ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1']],
  ['listJobs', ['ctx-1', 'default']],
  ['getJobDetail', ['ctx-1', 'default', 'job-1']],
  ['listCronJobs', ['ctx-1', 'default']],
  ['getCronJobDetail', ['ctx-1', 'default', 'cron-1']],
  ['listHelmReleases', ['ctx-1', 'default']],
  ['listHelmCharts', ['ctx-1']],
  ['listHelmRepositories', ['ctx-1']],
  ['listServices', ['ctx-1', 'default']],
  ['listConfigMaps', ['ctx-1', 'default']],
  ['listSecrets', ['ctx-1', 'default']],
  ['listEndpoints', ['ctx-1', 'default']],
  ['listLeases', ['ctx-1', 'default']],
  ['listIngresses', ['ctx-1', 'default']],
  ['listIngressClasses', ['ctx-1']],
  ['listNetworkPolicies', ['ctx-1', 'default']],
  ['listIPAddresses', ['ctx-1']],
  ['listServiceCIDRs', ['ctx-1']],
  ['listEndpointSlices', ['ctx-1', 'default']],
  ['listAPIServices', ['ctx-1']],
  ['listMutatingWebhookConfigurations', ['ctx-1']],
  ['listValidatingWebhookConfigurations', ['ctx-1']],
  ['listMutatingAdmissionPolicies', ['ctx-1']],
  ['listMutatingAdmissionPolicyBindings', ['ctx-1']],
  ['listValidatingAdmissionPolicies', ['ctx-1']],
  ['listValidatingAdmissionPolicyBindings', ['ctx-1']],
  ['listFlowSchemas', ['ctx-1']],
  ['listPriorityLevelConfigurations', ['ctx-1']],
  ['listCertificateSigningRequests', ['ctx-1']],
  ['updateCertificateSigningRequestApproval', ['ctx-1', 'node-client', 'approve']],
  ['listClusterTrustBundles', ['ctx-1']],
  ['listPodCertificateRequests', ['ctx-1', 'default']],
  ['listStorageVersions', ['ctx-1']],
  ['listStorageVersionMigrations', ['ctx-1']],
  ['listPodDisruptionBudgets', ['ctx-1', 'default']],
  ['listResourceQuotas', ['ctx-1', 'default']],
  ['listLimitRanges', ['ctx-1', 'default']],
  ['listPriorityClasses', ['ctx-1']],
  ['listRuntimeClasses', ['ctx-1']],
  ['listLeaseCandidates', ['ctx-1', 'default']],
  ['listPersistentVolumes', ['ctx-1']],
  ['listPersistentVolumeClaims', ['ctx-1', 'default']],
  ['listStorageClasses', ['ctx-1']],
  ['listVolumeAttributesClasses', ['ctx-1']],
  ['listCSIDrivers', ['ctx-1']],
  ['listCSINodes', ['ctx-1']],
  ['listVolumeAttachments', ['ctx-1']],
  ['listCSIStorageCapacities', ['ctx-1', 'default']],
  ['listVolumeSnapshotClasses', ['ctx-1']],
  ['listVolumeSnapshots', ['ctx-1', 'default']],
  ['listVolumeSnapshotContents', ['ctx-1']],
  ['listGatewayClasses', ['ctx-1']],
  ['listGateways', ['ctx-1', 'default']],
  ['listHTTPRoutes', ['ctx-1', 'default']],
  ['listGRPCRoutes', ['ctx-1', 'default']],
  ['listTLSRoutes', ['ctx-1', 'default']],
  ['listTCPRoutes', ['ctx-1', 'default']],
  ['listUDPRoutes', ['ctx-1', 'default']],
  ['listReferenceGrants', ['ctx-1', 'default']],
  ['listDeviceClasses', ['ctx-1']],
  ['listResourceClaims', ['ctx-1', 'default']],
  ['listResourceClaimTemplates', ['ctx-1', 'default']],
  ['listResourceSlices', ['ctx-1']],
  ['listDeviceTaintRules', ['ctx-1']],
  ['listServiceAccounts', ['ctx-1', 'default']],
  ['listRoles', ['ctx-1', 'default']],
  ['listRoleBindings', ['ctx-1', 'default']],
  ['listClusterRoles', ['ctx-1']],
  ['listClusterRoleBindings', ['ctx-1']],
  ['listCustomResourceDefinitions', ['ctx-1']],
  ['listCustomResourceInstances', ['ctx-1', 'widgets.example.com', 'default']],
  ['listHPAs', ['ctx-1', 'default']],
  ['listEvents', ['ctx-1', 'default']],
  ['addKubeconfigFile', []],
  ['getContextPrefs', []],
  ['updateContextName', ['ctx-1', 'renamed']],
  ['updateContextGrouping', [[{ id: 'g1', items: ['ctx-1'] }], ['ctx-2']]],
  ['updateAppTheme', ['forest']],
  ['deletePod', ['ctx-1', 'default', 'pod-1']],
  ['evictPod', ['ctx-1', 'default', 'pod-1']],
  ['deleteDeployment', ['ctx-1', 'default', 'deploy-1']],
  ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1']],
  ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1']],
  ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1']],
  ['deleteJob', ['ctx-1', 'default', 'job-1']],
  ['deleteCronJob', ['ctx-1', 'default', 'cron-1']],
  ['triggerCronJob', ['ctx-1', 'default', 'cron-1']],
  ['deleteNamespace', ['ctx-1', 'default']],
  ['cordonNode', ['ctx-1', 'node-1']],
  ['uncordonNode', ['ctx-1', 'node-1']],
  ['drainNode', ['ctx-1', 'node-1']],
  ['deleteNode', ['ctx-1', 'node-1']],
  ['deleteCustomResourceDefinition', ['ctx-1', 'widgets.example.com']],
  ['deleteCustomResourceInstance', ['ctx-1', 'widgets.example.com', 'default', 'widget-1']],
  ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3]],
  ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2]],
  ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4]],
  ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100, true, true]],
  ['getClusterHealth', ['ctx-1']],
  ['createNamespace', ['ctx-1', 'default']],
  ['createDeployment', ['ctx-1', { image: 'nginx' }]],
  ['createService', ['ctx-1', { port: 80 }]],
  ['createConfigMap', ['ctx-1', { data: [] }]],
  ['createSecret', ['ctx-1', { data: [] }]],
  ['createIngress', ['ctx-1', { host: 'example.com' }]],
  ['updateDeployment', ['ctx-1', 'default', 'deploy-1', { replicas: 2 }]],
  ['deleteResource', ['ctx-1', 'Pod', 'default', 'pod-1']],
  ['forceDeletePod', ['ctx-1', 'default', 'pod-1']],
  ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 6]],
  ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['setWorkloadImage', ['ctx-1', 'Deployment', 'default', 'deploy-1', 'app', 'nginx:1.28']],
  ['installOrUpgradeHelmRelease', ['ctx-1', { name: 'web', namespace: 'default', chart: 'bitnami/nginx', install: true }]],
  ['addHelmRepository', ['ctx-1', 'bitnami', 'https://charts.bitnami.com/bitnami']],
  ['updateHelmRepository', ['ctx-1', 'bitnami']],
  ['removeHelmRepository', ['ctx-1', 'bitnami']],
  ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['rollbackHelmRelease', ['ctx-1', 'default', 'web', 2]],
  ['rolloutHistory', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['helmReleaseHistory', ['ctx-1', 'default', 'web']],
  ['helmReleaseStatus', ['ctx-1', 'default', 'web']],
  ['helmReleaseResources', ['ctx-1', 'default', 'web']],
  ['helmReleaseManifest', ['ctx-1', 'default', 'web']],
  ['helmReleaseMetadata', ['ctx-1', 'default', 'web']],
  ['helmReleaseValues', ['ctx-1', 'default', 'web']],
  ['helmReleaseNotes', ['ctx-1', 'default', 'web']],
  ['helmReleaseHooks', ['ctx-1', 'default', 'web']],
  ['helmReleaseAll', ['ctx-1', 'default', 'web']],
  ['testHelmRelease', ['ctx-1', 'default', 'web']],
  ['rolloutStatus', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['uninstallHelmRelease', ['ctx-1', 'default', 'web']],
  ['pauseWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['resumeWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1']],
  ['updateJobSuspension', ['ctx-1', 'Job', 'default', 'job-1', true]],
  ['applyYaml', ['ctx-1', 'kind: Pod']],
  ['diffYaml', ['ctx-1', 'kind: Pod']],
  ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1']],
  ['describeResource', ['ctx-1', 'Pod', 'default', 'pod-1']],
  ['mutateResourceMetadata', ['ctx-1', 'Pod', 'default', 'pod-1', 'labels', 'team', 'platform', false]],
  ['getCustomResourceInstanceYaml', ['ctx-1', 'widgets.example.com', 'default', 'widget-1']],
  ['stopPodLogStream', ['stream-1']],
  ['stopPodExec', ['session-1']],
  ['listPortForwards', []],
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

  it('uses the Electron terminal bridge when available', async () => {
    const terminalCalls = []
    const terminalEvents = {}

    globalThis.window.k7s = {}
    globalThis.window.k8sTerm = {
      create: async (...args) => {
        terminalCalls.push({ method: 'create', args })
        return { shell: '/bin/zsh', cwd: '/Users/test' }
      },
      write: (...args) => {
        terminalCalls.push({ method: 'write', args })
      },
      resize: (...args) => {
        terminalCalls.push({ method: 'resize', args })
      },
      destroy: (...args) => {
        terminalCalls.push({ method: 'destroy', args })
      },
      onData: (callback) => {
        terminalEvents.data = callback
      },
      onExit: (callback) => {
        terminalEvents.exit = callback
      },
    }

    const provider = await importFresh('./src/renderer/src/api/provider.ts')
    const dataEvents = []
    const exitEvents = []

    provider.terminalApi.onData((data) => dataEvents.push(data))
    provider.terminalApi.onExit((exitCode) => exitEvents.push(exitCode))

    assert.deepEqual(await provider.terminalApi.create('ctx-1'), { shell: '/bin/zsh', cwd: '/Users/test' })
    provider.terminalApi.write('kubectl get pods\r')
    provider.terminalApi.resize(120, 40)
    provider.terminalApi.destroy()
    terminalEvents.data('stdout')
    terminalEvents.exit(0)

    assert.deepEqual(terminalCalls, [
      { method: 'create', args: ['ctx-1'] },
      { method: 'write', args: ['kubectl get pods\r'] },
      { method: 'resize', args: [120, 40] },
      { method: 'destroy', args: [] },
    ])
    assert.deepEqual(dataEvents, ['stdout'])
    assert.deepEqual(exitEvents, [0])
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

  it('reads a browser-selected kubeconfig file before importing in web mode', async () => {
    globalThis.window.showOpenFilePicker = async () => [{
      getFile: async () => ({
        name: 'web-kubeconfig.yaml',
        text: async () => 'apiVersion: v1\nkind: Config\n',
      }),
    }]

    const provider = await importFresh('./src/renderer/src/api/provider.ts')
    const wsCalls = []
    provider.wsClient.addKubeconfigFile = async (...args) => {
      wsCalls.push(args)
      return { contexts: [], addedIds: [] }
    }

    assert.deepEqual(await provider.k8sApi.addKubeconfigFile(), { contexts: [], addedIds: [] })
    assert.deepEqual(wsCalls, [['web-kubeconfig.yaml', 'apiVersion: v1\nkind: Config\n']])
  })

  it('uses websocket runtime methods for web-mode pod streaming operations', async () => {
    const provider = await importFresh('./src/renderer/src/api/provider.ts')
    const wsCalls = []

    provider.wsClient.startPodLogStream = async (...args) => {
      wsCalls.push({ method: 'startPodLogStream', args })
      return { streamId: 'stream-1' }
    }
    provider.wsClient.stopPodLogStream = async (...args) => {
      wsCalls.push({ method: 'stopPodLogStream', args })
      return { success: true }
    }
    provider.wsClient.startPodExec = async (...args) => {
      wsCalls.push({ method: 'startPodExec', args })
      return { sessionId: 'exec-1' }
    }
    provider.wsClient.stopPodExec = async (...args) => {
      wsCalls.push({ method: 'stopPodExec', args })
      return { success: true }
    }
    provider.wsClient.listPortForwards = async (...args) => {
      wsCalls.push({ method: 'listPortForwards', args })
      return [{ sessionId: 'pf-1' }]
    }
    provider.wsClient.startPortForward = async (...args) => {
      wsCalls.push({ method: 'startPortForward', args })
      return { sessionId: 'pf-1', localPort: 18080 }
    }
    provider.wsClient.stopPortForward = async (...args) => {
      wsCalls.push({ method: 'stopPortForward', args })
      return { success: true }
    }

    assert.deepEqual(
      await provider.k8sApi.startPodLogStream('ctx-1', { namespace: 'default', podName: 'pod-1' }),
      { streamId: 'stream-1' },
    )
    assert.deepEqual(await provider.k8sApi.stopPodLogStream('stream-1'), { success: true })
    assert.deepEqual(
      await provider.k8sApi.startPodExec('ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }),
      { sessionId: 'exec-1' },
    )
    assert.deepEqual(await provider.k8sApi.stopPodExec('session-1'), { success: true })
    assert.deepEqual(
      await provider.k8sApi.startPortForward('ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }),
      { sessionId: 'pf-1', localPort: 18080 },
    )
    assert.deepEqual(await provider.k8sApi.listPortForwards(), [{ sessionId: 'pf-1' }])
    assert.deepEqual(await provider.k8sApi.stopPortForward('pf-1'), { success: true })
    assert.deepEqual(wsCalls, [
      { method: 'startPodLogStream', args: ['ctx-1', { namespace: 'default', podName: 'pod-1' }] },
      { method: 'stopPodLogStream', args: ['stream-1'] },
      { method: 'startPodExec', args: ['ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }] },
      { method: 'stopPodExec', args: ['session-1'] },
      { method: 'startPortForward', args: ['ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 8080 }] },
      { method: 'listPortForwards', args: [] },
      { method: 'stopPortForward', args: ['pf-1'] },
    ])
  })

  it('uses websocket terminal methods and events in web mode', async () => {
    const provider = await importFresh('./src/renderer/src/api/provider.ts')
    const wsCalls = []
    let terminalDataHandler
    let terminalExitHandler

    provider.wsClient.createTerminal = async (...args) => {
      wsCalls.push({ method: 'createTerminal', args })
      return { shell: '/bin/sh', cwd: '/tmp' }
    }
    provider.wsClient.writeTerminal = async (...args) => {
      wsCalls.push({ method: 'writeTerminal', args })
      return { success: true }
    }
    provider.wsClient.resizeTerminal = async (...args) => {
      wsCalls.push({ method: 'resizeTerminal', args })
      return { success: true }
    }
    provider.wsClient.destroyTerminal = async (...args) => {
      wsCalls.push({ method: 'destroyTerminal', args })
      return { success: true }
    }
    provider.wsClient.onEvent = (eventName, handler) => {
      wsCalls.push({ method: 'onEvent', args: [eventName] })
      if (eventName === 'terminal:data') terminalDataHandler = handler
      if (eventName === 'terminal:exit') terminalExitHandler = handler
      return () => {}
    }

    const dataEvents = []
    const exitEvents = []
    provider.terminalApi.onData((data) => dataEvents.push(data))
    provider.terminalApi.onExit((exitCode) => exitEvents.push(exitCode))

    assert.deepEqual(await provider.terminalApi.create('ctx-1'), { shell: '/bin/sh', cwd: '/tmp' })
    provider.terminalApi.write('date\r')
    provider.terminalApi.resize(100, 30)
    provider.terminalApi.destroy()
    terminalDataHandler('hello')
    terminalExitHandler(137)

    assert.deepEqual(wsCalls, [
      { method: 'onEvent', args: ['terminal:data'] },
      { method: 'onEvent', args: ['terminal:exit'] },
      { method: 'createTerminal', args: ['ctx-1'] },
      { method: 'writeTerminal', args: ['date\r'] },
      { method: 'resizeTerminal', args: [100, 30] },
      { method: 'destroyTerminal', args: [] },
    ])
    assert.deepEqual(dataEvents, ['hello'])
    assert.deepEqual(exitEvents, [137])
  })
})
