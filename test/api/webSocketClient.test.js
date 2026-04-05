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

  it('rejects requests when the socket is not connected', async () => {
    const client = new WebSocketClient()

    await assert.rejects(client.listContexts(), /WebSocket not connected/)
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
    globalThis.setTimeout = (callback) => {
      callback()
      return 1
    }

    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

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
    const recordedDelays = []
    globalThis.setTimeout = (callback, delay) => {
      recordedDelays.push(delay)
      callback()
      return 1
    }

    const client = new WebSocketClient()
    const connectPromise = client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.emitOpen()
    await connectPromise

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
      ['getContextPrefs', [], 'k7s:get-context-prefs', undefined],
      ['updateContextName', ['ctx-1', 'renamed'], 'k7s:update-context-name', { contextId: 'ctx-1', name: 'renamed' }],
      ['updateContextGrouping', [[{ id: 'g1' }], ['ctx-1']], 'k7s:update-context-grouping', { groups: [{ id: 'g1' }], ungrouped: ['ctx-1'] }],
      ['listNamespaces', ['ctx-1'], 'k7s:list-namespaces', { contextId: 'ctx-1' }],
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
      ['getReplicaSetDetail', ['ctx-1', 'default', 'rs-1'], 'k7s:get-replicaset-detail', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1' }],
      ['listJobs', ['ctx-1', 'default'], 'k7s:list-jobs', { contextId: 'ctx-1', namespace: 'default' }],
      ['getJobDetail', ['ctx-1', 'default', 'job-1'], 'k7s:get-job-detail', { contextId: 'ctx-1', namespace: 'default', name: 'job-1' }],
      ['listCronJobs', ['ctx-1', 'default'], 'k7s:list-cronjobs', { contextId: 'ctx-1', namespace: 'default' }],
      ['getCronJobDetail', ['ctx-1', 'default', 'cron-1'], 'k7s:get-cronjob-detail', { contextId: 'ctx-1', namespace: 'default', name: 'cron-1' }],
      ['listServices', ['ctx-1', 'default'], 'k7s:list-services', { contextId: 'ctx-1', namespace: 'default' }],
      ['listConfigMaps', ['ctx-1', 'default'], 'k7s:list-configmaps', { contextId: 'ctx-1', namespace: 'default' }],
      ['listSecrets', ['ctx-1', 'default'], 'k7s:list-secrets', { contextId: 'ctx-1', namespace: 'default' }],
      ['listIngresses', ['ctx-1', 'default'], 'k7s:list-ingresses', { contextId: 'ctx-1', namespace: 'default' }],
      ['deletePod', ['ctx-1', 'default', 'pod-1'], 'k7s:delete-pod', { contextId: 'ctx-1', namespace: 'default', name: 'pod-1' }],
      ['deleteDeployment', ['ctx-1', 'default', 'deploy-1'], 'k7s:delete-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1' }],
      ['deleteDaemonSet', ['ctx-1', 'default', 'ds-1'], 'k7s:delete-daemonset', { contextId: 'ctx-1', namespace: 'default', name: 'ds-1' }],
      ['deleteStatefulSet', ['ctx-1', 'default', 'sts-1'], 'k7s:delete-statefulset', { contextId: 'ctx-1', namespace: 'default', name: 'sts-1' }],
      ['deleteReplicaSet', ['ctx-1', 'default', 'rs-1'], 'k7s:delete-replicaset', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1' }],
      ['deleteJob', ['ctx-1', 'default', 'job-1'], 'k7s:delete-job', { contextId: 'ctx-1', namespace: 'default', name: 'job-1' }],
      ['deleteCronJob', ['ctx-1', 'default', 'cron-1'], 'k7s:delete-cronjob', { contextId: 'ctx-1', namespace: 'default', name: 'cron-1' }],
      ['deleteNamespace', ['ctx-1', 'default'], 'k7s:delete-namespace', { contextId: 'ctx-1', name: 'default' }],
      ['scaleDeployment', ['ctx-1', 'default', 'deploy-1', 3], 'k7s:scale-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1', replicas: 3 }],
      ['scaleStatefulSet', ['ctx-1', 'default', 'sts-1', 2], 'k7s:scale-statefulset', { contextId: 'ctx-1', namespace: 'default', name: 'sts-1', replicas: 2 }],
      ['scaleReplicaSet', ['ctx-1', 'default', 'rs-1', 4], 'k7s:scale-replicaset', { contextId: 'ctx-1', namespace: 'default', name: 'rs-1', replicas: 4 }],
      ['getPodLogs', ['ctx-1', 'default', 'pod-1', 'container-1', 100], 'k7s:get-pod-logs', { contextId: 'ctx-1', namespace: 'default', podName: 'pod-1', containerName: 'container-1', tailLines: 100 }],
      ['getClusterHealth', ['ctx-1'], 'k7s:get-cluster-health', { contextId: 'ctx-1' }],
      ['createNamespace', ['ctx-1', 'default'], 'k7s:create-namespace', { contextId: 'ctx-1', name: 'default' }],
      ['createDeployment', ['ctx-1', { image: 'nginx' }], 'k7s:create-deployment', { contextId: 'ctx-1', formData: { image: 'nginx' } }],
      ['createService', ['ctx-1', { port: 80 }], 'k7s:create-service', { contextId: 'ctx-1', formData: { port: 80 } }],
      ['createConfigMap', ['ctx-1', { key: 'value' }], 'k7s:create-configmap', { contextId: 'ctx-1', formData: { key: 'value' } }],
      ['createSecret', ['ctx-1', { key: 'value' }], 'k7s:create-secret', { contextId: 'ctx-1', formData: { key: 'value' } }],
      ['createIngress', ['ctx-1', { host: 'example.com' }], 'k7s:create-ingress', { contextId: 'ctx-1', formData: { host: 'example.com' } }],
      ['updateDeployment', ['ctx-1', 'default', 'deploy-1', { replicas: 2 }], 'k7s:update-deployment', { contextId: 'ctx-1', namespace: 'default', name: 'deploy-1', formData: { replicas: 2 } }],
      ['deleteResource', ['ctx-1', 'Pod', 'default', 'pod-1'], 'k7s:delete-resource', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1' }],
      ['scaleWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1', 6], 'k7s:scale-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1', replicas: 6 }],
      ['restartWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:restart-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['rollbackWorkload', ['ctx-1', 'Deployment', 'default', 'deploy-1'], 'k7s:rollback-workload', { contextId: 'ctx-1', kind: 'Deployment', namespace: 'default', name: 'deploy-1' }],
      ['applyYaml', ['ctx-1', 'kind: Pod'], 'k7s:apply-yaml', { contextId: 'ctx-1', yaml: 'kind: Pod' }],
      ['getResourceYaml', ['ctx-1', 'Pod', 'default', 'pod-1'], 'k7s:get-resource-yaml', { contextId: 'ctx-1', kind: 'Pod', namespace: 'default', name: 'pod-1' }],
      ['addKubeconfigFile', [], 'k7s:add-kubeconfig', undefined],
      ['listPersistentVolumes', ['ctx-1'], 'k7s:list-persistentvolumes', { contextId: 'ctx-1' }],
      ['listPersistentVolumeClaims', ['ctx-1', 'default'], 'k7s:list-persistentvolumeclaims', { contextId: 'ctx-1', namespace: 'default' }],
      ['listStorageClasses', ['ctx-1'], 'k7s:list-storageclasses', { contextId: 'ctx-1' }],
      ['listServiceAccounts', ['ctx-1', 'default'], 'k7s:list-serviceaccounts', { contextId: 'ctx-1', namespace: 'default' }],
      ['listRoles', ['ctx-1', 'default'], 'k7s:list-roles', { contextId: 'ctx-1', namespace: 'default' }],
      ['listRoleBindings', ['ctx-1', 'default'], 'k7s:list-rolebindings', { contextId: 'ctx-1', namespace: 'default' }],
      ['listClusterRoles', ['ctx-1'], 'k7s:list-clusterroles', { contextId: 'ctx-1' }],
      ['listClusterRoleBindings', ['ctx-1'], 'k7s:list-clusterrolebindings', { contextId: 'ctx-1' }],
      ['listHPAs', ['ctx-1', 'default'], 'k7s:list-horizontalpodautoscalers', { contextId: 'ctx-1', namespace: 'default' }],
      ['listEvents', ['ctx-1', 'default'], 'k7s:list-events', { contextId: 'ctx-1', namespace: 'default' }],
      ['subscribeWatch', ['ctx-1'], 'k7s:subscribe-watch', { contextId: 'ctx-1' }],
      ['unsubscribeWatch', [], 'k7s:unsubscribe-watch', undefined],
    ]

    for (const [clientMethod, args, expectedMethod, expectedData] of cases) {
      const result = await client[clientMethod](...args)
      assert.deepEqual(result, { ok: true, method: expectedMethod })
      assert.deepEqual(calls.at(-1), { method: expectedMethod, data: expectedData })
    }
  })
})
