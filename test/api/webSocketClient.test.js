import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { WebSocketClient } from '../../src/renderer/src/api/webSocketClient.ts'

class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  static instances = []

  constructor(url) {
    this.url = url
    this.readyState = FakeWebSocket.CONNECTING
    this.sent = []
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
    FakeWebSocket.instances.push(this)
  }

  send(message) {
    this.sent.push(message)
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.()
  }

  emitOpen() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  emitMessage(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) })
  }

  emitClose() {
    this.readyState = FakeWebSocket.CLOSED
    this.onclose?.()
  }

  emitError(error = new Error('socket error')) {
    this.onerror?.(error)
  }
}

const originalWindow = globalThis.window
const originalWebSocket = globalThis.WebSocket
const originalSetTimeout = globalThis.setTimeout

describe('WebSocketClient', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    globalThis.window = {
      location: {
        protocol: 'http:',
        host: 'localhost:3000',
      },
    }
    globalThis.WebSocket = FakeWebSocket
  })

  afterEach(() => {
    globalThis.window = originalWindow
    globalThis.WebSocket = originalWebSocket
    globalThis.setTimeout = originalSetTimeout
  })

  it('builds the websocket URL from the current window location', () => {
    const httpClient = new WebSocketClient()
    assert.equal(httpClient.wsUrl, 'ws://localhost:3000/ws')

    globalThis.window.location.protocol = 'https:'
    globalThis.window.location.host = 'example.com'

    const httpsClient = new WebSocketClient()
    assert.equal(httpsClient.wsUrl, 'wss://example.com/ws')
  })

  it('connects successfully and resets reconnect attempts on open', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]

    client.reconnectAttempts = 3
    socket.emitOpen()

    await connectPromise
    assert.equal(client.reconnectAttempts, 0)
    assert.equal(client.ws, socket)
  })

  it('rejects the initial connection when the socket errors before opening', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]

    socket.emitError(new Error('boom'))

    await assert.rejects(connectPromise, /boom/)
  })

  it('rejects requests when the socket never opens', async () => {
    globalThis.setTimeout = (callback) => {
      callback()
      return 1
    }

    const client = new WebSocketClient()

    await assert.rejects(client.listContexts(), /WebSocket connection timeout/)
    assert.equal(client.pendingRequests.size, 0)
  })

  it('sends requests and resolves them when the server replies with a result', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    const responsePromise = client.listContexts()
    const request = JSON.parse(socket.sent[0])

    assert.equal(request.method, 'k7s:list-contexts')

    socket.emitMessage({
      id: request.id,
      result: [{ id: 'ctx-1' }],
    })

    await assert.doesNotReject(responsePromise)
    assert.deepEqual(await responsePromise, [{ id: 'ctx-1' }])
  })

  it('rejects requests when the server replies with an error', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    const responsePromise = client.listNodes('ctx-1')
    const request = JSON.parse(socket.sent[0])

    socket.emitMessage({
      id: request.id,
      error: 'permission denied',
    })

    await assert.rejects(responsePromise, /permission denied/)
  })

  it('dispatches push events to registered handlers and unsubscribes cleanly', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    const received = []
    const unsubscribe = client.onEvent('k7s:push-event', (event) => {
      received.push(['first', event])
    })
    client.onEvent('k7s:push-event', (event) => {
      received.push(['second', event])
    })

    socket.emitMessage({
      id: 'evt-1',
      event: 'k7s:push-event',
      data: { type: 'watch', resource: 'pods' },
    })

    unsubscribe()

    socket.emitMessage({
      id: 'evt-2',
      event: 'k7s:push-event',
      data: { type: 'watch', resource: 'deployments' },
    })

    assert.deepEqual(received, [
      ['first', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'pods' }],
      ['second', { type: 'watch', resource: 'deployments' }],
    ])
  })

  it('times out pending requests that never receive a reply', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    globalThis.setTimeout = (callback) => {
      callback()
      return 1
    }

    await assert.rejects(client.listContexts(), /Request timeout/)
    assert.equal(client.pendingRequests.size, 0)
  })

  it('disconnects the socket and clears pending requests', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    void client.listContexts().catch(() => {})
    assert.equal(client.pendingRequests.size, 1)

    client.disconnect()

    assert.equal(socket.readyState, FakeWebSocket.CLOSED)
    assert.equal(client.pendingRequests.size, 0)
    assert.equal(client.ws, null)
  })

  it('attempts to reconnect with exponential backoff when the connection closes', async () => {
    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

    const recordedDelays = []
    globalThis.setTimeout = (callback, delay) => {
      recordedDelays.push(delay)
      callback()
      return 1
    }

    let reconnectCalled = 0
    client.connect = async () => {
      reconnectCalled += 1
    }

    socket.emitClose()

    assert.equal(client.reconnectAttempts, 1)
    assert.equal(reconnectCalled, 1)
    assert.deepEqual(recordedDelays, [1000])
  })

  it('maps every API helper to the expected websocket method and payload', async () => {
    const client = new WebSocketClient()
    const calls = []

    client.send = async (method, data) => {
      calls.push({ method, data })
      return { ok: true, method }
    }

    const cases = [
      ['listContexts', [], 'k7s:list-contexts', undefined],
      ['useKubeContext', ['ctx-2'], 'k7s:use-kube-context', { contextId: 'ctx-2' }],
      ['setKubeContextNamespace', ['ctx-1', 'team-a'], 'k7s:set-kube-context-namespace', { contextId: 'ctx-1', namespace: 'team-a' }],
      ['getContextPrefs', [], 'k7s:get-context-prefs', undefined],
      ['updateContextName', ['ctx-1', 'renamed'], 'k7s:update-context-name', { contextId: 'ctx-1', name: 'renamed' }],
      ['updateContextGrouping', [[{ id: 'g1' }], ['ctx-1']], 'k7s:update-context-grouping', { groups: [{ id: 'g1' }], ungrouped: ['ctx-1'] }],
      ['updateAppTheme', ['forest'], 'k7s:update-app-theme', { theme: 'forest' }],
      ['listNamespaces', ['ctx-1'], 'k7s:list-namespaces', { contextId: 'ctx-1' }],
      ['listAPIGroups', ['ctx-1'], 'k7s:list-apigroups', { contextId: 'ctx-1' }],
      ['listAPIResources', ['ctx-1'], 'k7s:list-apiresources', { contextId: 'ctx-1' }],
      ['listServerVersions', ['ctx-1'], 'k7s:list-serverversions', { contextId: 'ctx-1' }],
      ['listOpenIDConfigurations', ['ctx-1'], 'k7s:list-openidconfigs', { contextId: 'ctx-1' }],
      ['listAPIServerHealth', ['ctx-1'], 'k7s:list-apiserverhealth', { contextId: 'ctx-1' }],
      ['listSelfSubjectReviews', ['ctx-1'], 'k7s:list-selfsubjectreviews', { contextId: 'ctx-1' }],
      ['listSelfSubjectAccessReviews', ['ctx-1', ['default']], 'k7s:list-selfsubjectaccessreviews', { contextId: 'ctx-1', namespaces: ['default'] }],
      ['checkCanI', ['ctx-1', { verb: 'get', resource: 'pods', namespace: 'default' }], 'k7s:check-can-i', { contextId: 'ctx-1', request: { verb: 'get', resource: 'pods', namespace: 'default' } }],
      ['listSelfSubjectRulesReviews', ['ctx-1', ['default']], 'k7s:list-selfsubjectrulesreviews', { contextId: 'ctx-1', namespaces: ['default'] }],
      ['listNodes', ['ctx-1'], 'k7s:list-nodes', { contextId: 'ctx-1' }],
      ['getNodeDetail', ['ctx-1', 'node-1'], 'k7s:get-node-detail', { contextId: 'ctx-1', nodeName: 'node-1' }],
      ['listPods', ['ctx-1', 'default'], 'k7s:list-pods', { contextId: 'ctx-1', namespace: 'default' }],
      ['getPodDetail', ['ctx-1', 'default', 'pod-1'], 'k7s:get-pod-detail', { contextId: 'ctx-1', namespace: 'default', podName: 'pod-1' }],
      ['listDeployments', ['ctx-1', 'default'], 'k7s:list-deployments', { contextId: 'ctx-1', namespace: 'default' }],
      ['getDeploymentDetail', ['ctx-1', 'default', 'deploy-1'], 'k7s:get-deployment-detail', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1' }],
      ['listDaemonSets', ['ctx-1', 'default'], 'k7s:list-daemonsets', { contextId: 'ctx-1', namespace: 'default' }],
      ['getDaemonSetDetail', ['ctx-1', 'default', 'ds-1'], 'k7s:get-daemonset-detail', { contextId: 'ctx-1', namespace: 'default', name: 'ds-1' }],
      ['listStatefulSets', ['ctx-1', 'default'], 'k7s:list-statefulsets', { contextId: 'ctx-1', namespace: 'default' }],
      ['getStatefulSetDetail', ['ctx-1', 'default', 'sts-1'], 'k7s:get-statefulset-detail', { contextId: 'ctx-1', namespace: 'default', name: 'sts-1' }],
      ['listReplicaSets', ['ctx-1', 'default'], 'k7s:list-replicasets', { contextId: 'ctx-1', namespace: 'default' }],
      ['listReplicationControllers', ['ctx-1', 'default'], 'k7s:list-replicationcontrollers', { contextId: 'ctx-1', namespace: 'default' }],
      ['getReplicationControllerDetail', ['ctx-1', 'default', 'rc-1'], 'k7s:get-replicationcontroller-detail', { contextId: 'ctx-1', namespace: 'default', name: 'rc-1' }],
      ['listControllerRevisions', ['ctx-1', 'default'], 'k7s:list-controllerrevisions', { contextId: 'ctx-1', namespace: 'default' }],
      ['listPodTemplates', ['ctx-1', 'default'], 'k7s:list-podtemplates', { contextId: 'ctx-1', namespace: 'default' }],
      ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1'], 'k7s:get-replicaset-detail', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1' }],
      ['listJobs', ['ctx-1', 'default'], 'k7s:list-jobs', { contextId: 'ctx-1', namespace: 'default' }],
      ['getJobDetail', ['ctx-1', 'default', 'job-1'], 'k7s:get-job-detail', { contextId: 'ctx-1', namespace: 'default', name: 'job-1' }],
      ['listCronJobs', ['ctx-1', 'default'], 'k7s:list-cronjobs', { contextId: 'ctx-1', namespace: 'default' }],
      ['getCronJobDetail', ['ctx-1', 'default', 'cron-1'], 'k7s:get-cronjob-detail', { contextId: 'ctx-1', namespace: 'default', name: 'cron-1' }],
      ['listHelmReleases', ['ctx-1', 'default'], 'k7s:list-helmreleases', { contextId: 'ctx-1', namespace: 'default' }],
      ['listHelmCharts', ['ctx-1'], 'k7s:list-helmcharts', { contextId: 'ctx-1' }],
      ['listHelmRepositories', ['ctx-1'], 'k7s:list-helmrepositories', { contextId: 'ctx-1' }],
      ['listServices', ['ctx-1', 'default'], 'k7s:list-services', { contextId: 'ctx-1', namespace: 'default' }],
      ['listConfigMaps', ['ctx-1', 'default'], 'k7s:list-configmaps', { contextId: 'ctx-1', namespace: 'default' }],
      ['listSecrets', ['ctx-1', 'default'], 'k7s:list-secrets', { contextId: 'ctx-1', namespace: 'default' }],
      ['listEndpoints', ['ctx-1', 'default'], 'k7s:list-endpoints', { contextId: 'ctx-1', namespace: 'default' }],
      ['listLeases', ['ctx-1', 'default'], 'k7s:list-leases', { contextId: 'ctx-1', namespace: 'default' }],
      ['listLeaseCandidates', ['ctx-1', 'default'], 'k7s:list-leasecandidates', { contextId: 'ctx-1', namespace: 'default' }],
      ['listIngresses', ['ctx-1', 'default'], 'k7s:list-ingresses', { contextId: 'ctx-1', namespace: 'default' }],
      ['listIngressClasses', ['ctx-1'], 'k7s:list-ingressclasses', { contextId: 'ctx-1' }],
      ['listNetworkPolicies', ['ctx-1', 'default'], 'k7s:list-networkpolicies', { contextId: 'ctx-1', namespace: 'default' }],
      ['listIPAddresses', ['ctx-1'], 'k7s:list-ipaddresses', { contextId: 'ctx-1' }],
      ['listServiceCIDRs', ['ctx-1'], 'k7s:list-servicecidrs', { contextId: 'ctx-1' }],
      ['listEndpointSlices', ['ctx-1', 'default'], 'k7s:list-endpointslices', { contextId: 'ctx-1', namespace: 'default' }],
      ['listAPIServices', ['ctx-1'], 'k7s:list-apiservices', { contextId: 'ctx-1' }],
      ['listMutatingWebhookConfigurations', ['ctx-1'], 'k7s:list-mutatingwebhookconfigurations', { contextId: 'ctx-1' }],
      ['listValidatingWebhookConfigurations', ['ctx-1'], 'k7s:list-validatingwebhookconfigurations', { contextId: 'ctx-1' }],
      ['listMutatingAdmissionPolicies', ['ctx-1'], 'k7s:list-mutatingadmissionpolicies', { contextId: 'ctx-1' }],
      ['listMutatingAdmissionPolicyBindings', ['ctx-1'], 'k7s:list-mutatingadmissionpolicybindings', { contextId: 'ctx-1' }],
      ['listValidatingAdmissionPolicies', ['ctx-1'], 'k7s:list-validatingadmissionpolicies', { contextId: 'ctx-1' }],
      ['listValidatingAdmissionPolicyBindings', ['ctx-1'], 'k7s:list-validatingadmissionpolicybindings', { contextId: 'ctx-1' }],
      ['listFlowSchemas', ['ctx-1'], 'k7s:list-flowschemas', { contextId: 'ctx-1' }],
      ['listPriorityLevelConfigurations', ['ctx-1'], 'k7s:list-prioritylevelconfigurations', { contextId: 'ctx-1' }],
      ['listCertificateSigningRequests', ['ctx-1'], 'k7s:list-certificatesigningrequests', { contextId: 'ctx-1' }],
      ['updateCertificateSigningRequestApproval', ['ctx-1', 'node-client', 'approve'], 'k7s:update-certificate-signing-request-approval', { contextId: 'ctx-1', name: 'node-client', decision: 'approve' }],
      ['listClusterTrustBundles', ['ctx-1'], 'k7s:list-clustertrustbundles', { contextId: 'ctx-1' }],
      ['listStorageVersions', ['ctx-1'], 'k7s:list-storageversions', { contextId: 'ctx-1' }],
      ['listStorageVersionMigrations', ['ctx-1'], 'k7s:list-storageversionmigrations', { contextId: 'ctx-1' }],
      ['listPodDisruptionBudgets', ['ctx-1', 'default'], 'k7s:list-poddisruptionbudgets', { contextId: 'ctx-1', namespace: 'default' }],
      ['listResourceQuotas', ['ctx-1', 'default'], 'k7s:list-resourcequotas', { contextId: 'ctx-1', namespace: 'default' }],
      ['listLimitRanges', ['ctx-1', 'default'], 'k7s:list-limitranges', { contextId: 'ctx-1', namespace: 'default' }],
      ['listPriorityClasses', ['ctx-1'], 'k7s:list-priorityclasses', { contextId: 'ctx-1' }],
      ['listRuntimeClasses', ['ctx-1'], 'k7s:list-runtimeclasses', { contextId: 'ctx-1' }],
      ['listVolumeAttributesClasses', ['ctx-1'], 'k7s:list-volumeattributesclasses', { contextId: 'ctx-1' }],
      ['deletePod', ['ctx-1', 'default', 'pod-1'], 'k7s:delete-pod', { contextId: 'ctx-1', namespace: 'default', name: 'pod-1' }],
      ['evictPod', ['ctx-1', 'default', 'pod-1'], 'k7s:evict-pod', { contextId: 'ctx-1', namespace: 'default', name: 'pod-1' }],
      ['deleteDeployment', ['ctx-1', 'default', 'deploy-1'], 'k7s:delete-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1' }],
      ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1'], 'k7s:delete-daemonset', { contextId: 'ctx-1', namespace: 'default', name: 'ds-1' }],
      ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1'], 'k7s:delete-statefulset', { contextId: 'ctx-1', namespace: 'default', name: 'sts-1' }],
      ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1'], 'k7s:delete-replicaset', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1' }],
      ['deleteJob', ['ctx-1', 'default', 'job-1'], 'k7s:delete-job', { contextId: 'ctx-1', namespace: 'default', name: 'job-1' }],
      ['deleteCronJob', ['ctx-1', 'default', 'cron-1'], 'k7s:delete-cronjob', { contextId: 'ctx-1', namespace: 'default', name: 'cron-1' }],
      ['triggerCronJob', ['ctx-1', 'default', 'cron-1'], 'k7s:trigger-cronjob', { contextId: 'ctx-1', namespace: 'default', name: 'cron-1' }],
      ['deleteNamespace', ['ctx-1', 'default'], 'k7s:delete-namespace', { contextId: 'ctx-1', name: 'default' }],
      ['cordonNode', ['ctx-1', 'node-1'], 'k7s:cordon-node', { contextId: 'ctx-1', name: 'node-1' }],
      ['uncordonNode', ['ctx-1', 'node-1'], 'k7s:uncordon-node', { contextId: 'ctx-1', name: 'node-1' }],
      ['drainNode', ['ctx-1', 'node-1'], 'k7s:drain-node', { contextId: 'ctx-1', name: 'node-1' }],
      ['deleteNode', ['ctx-1', 'node-1'], 'k7s:delete-node', { contextId: 'ctx-1', name: 'node-1' }],
      ['deleteCustomResourceDefinition', ['ctx-1', 'widgets.example.com'], 'k7s:delete-customresourcedefinition', { contextId: 'ctx-1', name: 'widgets.example.com' }],
      ['deleteCustomResourceInstance', ['ctx-1', 'widgets.example.com', 'default', 'widget-1'], 'k7s:delete-customresource-instance', { contextId: 'ctx-1', crdName: 'widgets.example.com', namespace: 'default', name: 'widget-1' }],
      ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3], 'k7s:scale-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1', replicas: 3 }],
      ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2], 'k7s:scale-statefulset', { contextId: 'ctx-1', namespace: 'default', name: 'sts-1', replicas: 2 }],
      ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4], 'k7s:scale-replicaset', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1', replicas: 4 }],
      ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100, true, true], 'k7s:get-pod-logs', { contextId: 'ctx-1', namespace: 'default', podName: 'pod-1', containerName: 'container-1', tailLines: 100, previous: true, timestamps: true }],
      ['startPodLogStream', ['ctx-1', { namespace: 'default', podName: 'pod-1', tailLines: 100 }], 'k7s:start-pod-log-stream', { contextId: 'ctx-1', request: { namespace: 'default', podName: 'pod-1', tailLines: 100 } }],
      ['stopPodLogStream', ['stream-1'], 'k7s:stop-pod-log-stream', { streamId: 'stream-1' }],
      ['startPodExec', ['ctx-1', { namespace: 'default', podName: 'pod-1', command: 'env' }], 'k7s:start-pod-exec', { contextId: 'ctx-1', request: { namespace: 'default', podName: 'pod-1', command: 'env' } }],
      ['stopPodExec', ['exec-1'], 'k7s:stop-pod-exec', { sessionId: 'exec-1' }],
      ['startPortForward', ['ctx-1', { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 18080 }], 'k7s:start-port-forward', { contextId: 'ctx-1', request: { namespace: 'default', podName: 'pod-1', targetPort: 8080, localPort: 18080 } }],
      ['startPortForward', ['ctx-1', { namespace: 'default', targetKind: 'Service', targetName: 'web', serviceName: 'web', targetPort: 80, localPort: 18080 }], 'k7s:start-port-forward', { contextId: 'ctx-1', request: { namespace: 'default', targetKind: 'Service', targetName: 'web', serviceName: 'web', targetPort: 80, localPort: 18080 } }],
      ['listPortForwards', [], 'k7s:list-port-forwards', undefined],
      ['stopPortForward', ['pf-1'], 'k7s:stop-port-forward', { sessionId: 'pf-1' }],
      ['getClusterHealth', ['ctx-1'], 'k7s:get-cluster-health', { contextId: 'ctx-1' }],
      ['createNamespace', ['ctx-1', 'default'], 'k7s:create-namespace', { contextId: 'ctx-1', name: 'default' }],
      ['createDeployment', ['ctx-1', { image: 'nginx' }], 'k7s:create-deployment', { contextId: 'ctx-1', formData: { image: 'nginx' } }],
      ['createService', ['ctx-1', { port: 80 }], 'k7s:create-service', { contextId: 'ctx-1', formData: { port: 80 } }],
      ['createConfigMap', ['ctx-1', { key: 'value' }], 'k7s:create-configmap', { contextId: 'ctx-1', formData: { key: 'value' } }],
      ['createSecret', ['ctx-1', { key: 'value' }], 'k7s:create-secret', { contextId: 'ctx-1', formData: { key: 'value' } }],
      ['createIngress', ['ctx-1', { host: 'example.com' }], 'k7s:create-ingress', { contextId: 'ctx-1', formData: { host: 'example.com' } }],
      ['updateDeployment', ['ctx-1', 'default', 'deploy-1', { replicas: 2 }], 'k7s:update-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1', formData: { replicas: 2 } }],
      ['deleteResource', ['ctx-1', 'Pod', 'default', 'pod-1'], 'k7s:delete-resource', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1' }],
      ['forceDeletePod', ['ctx-1', 'default', 'pod-1'], 'k7s:force-delete-pod', { contextId: 'ctx-1', namespace: 'default', name: 'pod-1' }],
      ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 6], 'k7s:scale-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1', replicas: 6 }],
      ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:restart-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['setWorkloadImage', ['ctx-1', 'Deployment', 'default', 'deploy-1', 'app', 'nginx:1.28'], 'k7s:set-workload-image', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1', containerName: 'app', image: 'nginx:1.28' }],
      ['installOrUpgradeHelmRelease', ['ctx-1', { name: 'web', namespace: 'default', chart: 'bitnami/nginx', install: true }], 'k7s:install-or-upgrade-helm-release', { contextId: 'ctx-1', request: { name: 'web', namespace: 'default', chart: 'bitnami/nginx', install: true } }],
      ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:rollback-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['rollbackHelmRelease', ['ctx-1', 'default', 'web', 2], 'k7s:rollback-helm-release', { contextId: 'ctx-1', namespace: 'default', name: 'web', revision: 2 }],
      ['rolloutHistory', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:rollout-history', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['helmReleaseHistory', ['ctx-1', 'default', 'web'], 'k7s:helm-release-history', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseStatus', ['ctx-1', 'default', 'web'], 'k7s:helm-release-status', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseResources', ['ctx-1', 'default', 'web'], 'k7s:helm-release-resources', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseManifest', ['ctx-1', 'default', 'web'], 'k7s:helm-release-manifest', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseMetadata', ['ctx-1', 'default', 'web'], 'k7s:helm-release-metadata', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseValues', ['ctx-1', 'default', 'web'], 'k7s:helm-release-values', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseNotes', ['ctx-1', 'default', 'web'], 'k7s:helm-release-notes', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseHooks', ['ctx-1', 'default', 'web'], 'k7s:helm-release-hooks', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['helmReleaseAll', ['ctx-1', 'default', 'web'], 'k7s:helm-release-all', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['testHelmRelease', ['ctx-1', 'default', 'web'], 'k7s:test-helm-release', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['rolloutStatus', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:rollout-status', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['uninstallHelmRelease', ['ctx-1', 'default', 'web'], 'k7s:uninstall-helm-release', { contextId: 'ctx-1', namespace: 'default', name: 'web' }],
      ['pauseWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:pause-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['resumeWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:resume-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['updateJobSuspension', ['ctx-1', 'Job', 'default', 'job-1', true], 'k7s:update-job-suspension', { contextId: 'ctx-1', kind: 'Job', namespace: 'default', name: 'job-1', suspend: true }],
      ['applyYaml', ['ctx-1', 'kind: Pod'], 'k7s:apply-yaml', { contextId: 'ctx-1', yaml: 'kind: Pod' }],
      ['diffYaml', ['ctx-1', 'kind: Pod'], 'k7s:diff-yaml', { contextId: 'ctx-1', yaml: 'kind: Pod' }],
      ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1'], 'k7s:get-resource-yaml', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1' }],
      ['describeResource', ['ctx-1', 'Pod', 'default', 'pod-1'], 'k7s:describe-resource', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1' }],
      ['mutateResourceMetadata', ['ctx-1', 'Pod', 'default', 'pod-1', 'labels', 'team', 'platform', false], 'k7s:mutate-resource-metadata', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1', field: 'labels', key: 'team', value: 'platform', remove: false }],
      ['addKubeconfigFile', [], 'k7s:add-kubeconfig', undefined],
      ['addKubeconfigFile', ['web.yaml', 'apiVersion: v1\nkind: Config\n'], 'k7s:add-kubeconfig', { sourceName: 'web.yaml', content: 'apiVersion: v1\nkind: Config\n' }],
      ['listComponentStatuses', ['ctx-1'], 'k7s:list-componentstatuses', { contextId: 'ctx-1' }],
      ['listAPIGroups', ['ctx-1'], 'k7s:list-apigroups', { contextId: 'ctx-1' }],
      ['listAPIResources', ['ctx-1'], 'k7s:list-apiresources', { contextId: 'ctx-1' }],
      ['listServerVersions', ['ctx-1'], 'k7s:list-serverversions', { contextId: 'ctx-1' }],
      ['listOpenIDConfigurations', ['ctx-1'], 'k7s:list-openidconfigs', { contextId: 'ctx-1' }],
      ['listAPIServerHealth', ['ctx-1'], 'k7s:list-apiserverhealth', { contextId: 'ctx-1' }],
      ['listSelfSubjectReviews', ['ctx-1'], 'k7s:list-selfsubjectreviews', { contextId: 'ctx-1' }],
      ['listSelfSubjectAccessReviews', ['ctx-1', ['default']], 'k7s:list-selfsubjectaccessreviews', { contextId: 'ctx-1', namespaces: ['default'] }],
      ['checkCanI', ['ctx-1', { verb: 'get', resource: 'pods', namespace: 'default' }], 'k7s:check-can-i', { contextId: 'ctx-1', request: { verb: 'get', resource: 'pods', namespace: 'default' } }],
      ['listSelfSubjectRulesReviews', ['ctx-1', ['default']], 'k7s:list-selfsubjectrulesreviews', { contextId: 'ctx-1', namespaces: ['default'] }],
      ['listPodCertificateRequests', ['ctx-1', 'default'], 'k7s:list-podcertificaterequests', { contextId: 'ctx-1', namespace: 'default' }],
      ['listPersistentVolumes', ['ctx-1'], 'k7s:list-persistentvolumes', { contextId: 'ctx-1' }],
      ['listPersistentVolumeClaims', ['ctx-1', 'default'], 'k7s:list-persistentvolumeclaims', { contextId: 'ctx-1', namespace: 'default' }],
      ['listStorageClasses', ['ctx-1'], 'k7s:list-storageclasses', { contextId: 'ctx-1' }],
      ['listCSIDrivers', ['ctx-1'], 'k7s:list-csidrivers', { contextId: 'ctx-1' }],
      ['listCSINodes', ['ctx-1'], 'k7s:list-csinodes', { contextId: 'ctx-1' }],
      ['listVolumeAttachments', ['ctx-1'], 'k7s:list-volumeattachments', { contextId: 'ctx-1' }],
      ['listCSIStorageCapacities', ['ctx-1', 'default'], 'k7s:list-csistoragecapacities', { contextId: 'ctx-1', namespace: 'default' }],
      ['listVolumeSnapshotClasses', ['ctx-1'], 'k7s:list-volumesnapshotclasses', { contextId: 'ctx-1' }],
      ['listVolumeSnapshots', ['ctx-1', 'default'], 'k7s:list-volumesnapshots', { contextId: 'ctx-1', namespace: 'default' }],
      ['listVolumeSnapshotContents', ['ctx-1'], 'k7s:list-volumesnapshotcontents', { contextId: 'ctx-1' }],
      ['listGatewayClasses', ['ctx-1'], 'k7s:list-gatewayclasses', { contextId: 'ctx-1' }],
      ['listGateways', ['ctx-1', 'default'], 'k7s:list-gateways', { contextId: 'ctx-1', namespace: 'default' }],
      ['listHTTPRoutes', ['ctx-1', 'default'], 'k7s:list-httproutes', { contextId: 'ctx-1', namespace: 'default' }],
      ['listGRPCRoutes', ['ctx-1', 'default'], 'k7s:list-grpcroutes', { contextId: 'ctx-1', namespace: 'default' }],
      ['listTLSRoutes', ['ctx-1', 'default'], 'k7s:list-tlsroutes', { contextId: 'ctx-1', namespace: 'default' }],
      ['listTCPRoutes', ['ctx-1', 'default'], 'k7s:list-tcproutes', { contextId: 'ctx-1', namespace: 'default' }],
      ['listUDPRoutes', ['ctx-1', 'default'], 'k7s:list-udproutes', { contextId: 'ctx-1', namespace: 'default' }],
      ['listReferenceGrants', ['ctx-1', 'default'], 'k7s:list-referencegrants', { contextId: 'ctx-1', namespace: 'default' }],
      ['listDeviceClasses', ['ctx-1'], 'k7s:list-deviceclasses', { contextId: 'ctx-1' }],
      ['listResourceClaims', ['ctx-1', 'default'], 'k7s:list-resourceclaims', { contextId: 'ctx-1', namespace: 'default' }],
      ['listResourceClaimTemplates', ['ctx-1', 'default'], 'k7s:list-resourceclaimtemplates', { contextId: 'ctx-1', namespace: 'default' }],
      ['listResourceSlices', ['ctx-1'], 'k7s:list-resourceslices', { contextId: 'ctx-1' }],
      ['listDeviceTaintRules', ['ctx-1'], 'k7s:list-devicetaintrules', { contextId: 'ctx-1' }],
      ['listServiceAccounts', ['ctx-1', 'default'], 'k7s:list-serviceaccounts', { contextId: 'ctx-1', namespace: 'default' }],
      ['listRoles', ['ctx-1', 'default'], 'k7s:list-roles', { contextId: 'ctx-1', namespace: 'default' }],
      ['listRoleBindings', ['ctx-1', 'default'], 'k7s:list-rolebindings', { contextId: 'ctx-1', namespace: 'default' }],
      ['listClusterRoles', ['ctx-1'], 'k7s:list-clusterroles', { contextId: 'ctx-1' }],
      ['listClusterRoleBindings', ['ctx-1'], 'k7s:list-clusterrolebindings', { contextId: 'ctx-1' }],
      ['listCustomResourceDefinitions', ['ctx-1'], 'k7s:list-customresourcedefinitions', { contextId: 'ctx-1' }],
      ['listCustomResourceInstances', ['ctx-1', 'widgets.example.com', 'default'], 'k7s:list-customresource-instances', { contextId: 'ctx-1', crdName: 'widgets.example.com', namespace: 'default' }],
      ['listHPAs', ['ctx-1', 'default'], 'k7s:list-horizontalpodautoscalers', { contextId: 'ctx-1', namespace: 'default' }],
      ['listEvents', ['ctx-1', 'default'], 'k7s:list-events', { contextId: 'ctx-1', namespace: 'default' }],
      ['addHelmRepository', ['ctx-1', 'bitnami', 'https://charts.bitnami.com/bitnami'], 'k7s:add-helm-repository', { contextId: 'ctx-1', name: 'bitnami', url: 'https://charts.bitnami.com/bitnami' }],
      ['updateHelmRepository', ['ctx-1', 'bitnami'], 'k7s:update-helm-repository', { contextId: 'ctx-1', name: 'bitnami' }],
      ['removeHelmRepository', ['ctx-1', 'bitnami'], 'k7s:remove-helm-repository', { contextId: 'ctx-1', name: 'bitnami' }],
      ['getCustomResourceInstanceYaml', ['ctx-1', 'widgets.example.com', 'default', 'widget-1'], 'k7s:get-customresource-instance-yaml', { contextId: 'ctx-1', crdName: 'widgets.example.com', namespace: 'default', name: 'widget-1' }],
      ['subscribeWatch', ['ctx-1'], 'k7s:subscribe-watch', { contextId: 'ctx-1' }],
      ['unsubscribeWatch', [], 'k7s:unsubscribe-watch', undefined],
      ['createTerminal', ['ctx-1'], 'terminal:create', { contextId: 'ctx-1' }],
      ['writeTerminal', ['kubectl get pods\r'], 'terminal:write', { value: 'kubectl get pods\r' }],
      ['resizeTerminal', [120, 40], 'terminal:resize', { cols: 120, rows: 40 }],
      ['destroyTerminal', [], 'terminal:destroy', undefined],
    ]

    for (const [clientMethod, args, expectedMethod, expectedData] of cases) {
      const result = await client[clientMethod](...args)
      assert.deepEqual(result, { ok: true, method: expectedMethod })
      assert.deepEqual(calls.at(-1), { method: expectedMethod, data: expectedData })
    }
  })
})
