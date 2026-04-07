import assert from 'node:assert/strict'
import React from 'react'
import { beforeEach, describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { importFresh } from '../helpers/module.js'
import { resetWindowState } from '../helpers/mocks.js'
import { EmptyState, SortIcon } from '../../src/renderer/src/components/Clusters/index.ts'
import {
  ConfigMapForm,
  DeploymentForm,
  IngressForm,
  KeyValueEditor,
  NamespaceForm,
  SecretForm,
  ServiceForm,
} from '../../src/renderer/src/components/Forms/index.ts'
import {
  CreateResourceModal,
  DeploymentDetailModal,
  GenericDetailModal,
  LogViewerModal,
  NodeDetailModal,
  PodDetailModal,
  PodExecModal,
  PortForwardModal,
  YamlEditorModal,
} from '../../src/renderer/src/components/Modals/index.ts'
import { useClusterStore, usePreferencesStore, useTerminalStore, useUIStore } from '../../src/renderer/src/store/index.ts'

const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props))

const pod = {
  name: 'pod-1',
  namespace: 'default',
  status: 'Running',
  nodeName: 'node-1',
  restarts: 1,
  age: '1h',
  podIP: '10.0.0.1',
  hostIP: '192.168.0.1',
  serviceAccount: 'default',
  priority: '0',
  qosClass: 'Burstable',
  containers: [
    { name: 'main', image: 'nginx:8080', restartCount: 1, ready: true, state: 'Running' },
    { name: 'sidecar', image: 'busybox:1.0', restartCount: 0, ready: false, state: 'Waiting' },
  ],
  labels: { app: 'demo' },
}

beforeEach(() => {
  resetWindowState()
  useClusterStore.setState(useClusterStore.getInitialState(), true)
  usePreferencesStore.setState(usePreferencesStore.getInitialState(), true)
  useUIStore.setState(useUIStore.getInitialState(), true)
  useTerminalStore.setState(useTerminalStore.getInitialState(), true)
})

describe('renderer components', () => {
  it('renders cluster and form components from barrel exports', () => {
    const emptyStateHtml = render(EmptyState, { onAdd() {} })
    const sortIconHtml = render(SortIcon, { direction: 'desc' })
    const keyValueHtml = render(KeyValueEditor, {
      pairs: [{ key: 'app', value: 'demo' }],
      onChange() {},
      addButtonText: 'Add Pair',
    })
    const namespaceFormHtml = render(NamespaceForm, {
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'team-a' },
    })
    const deploymentFormHtml = render(DeploymentForm, {
      namespace: 'default',
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'web', image: 'nginx', labels: [{ key: 'app', value: 'web' }] },
    })
    const serviceFormHtml = render(ServiceForm, {
      namespace: 'default',
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'svc', selector: [{ key: 'app', value: 'web' }] },
    })
    const configMapFormHtml = render(ConfigMapForm, {
      namespace: 'default',
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'cm', data: [{ key: 'ENV', value: 'prod' }] },
    })
    const secretFormHtml = render(SecretForm, {
      namespace: 'default',
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'secret', type: 'Opaque', data: [{ key: 'token', value: 'abc' }] },
    })
    const ingressFormHtml = render(IngressForm, {
      namespace: 'default',
      onSubmit() {},
      onCancel() {},
      initialData: { name: 'ing', host: 'example.com', serviceName: 'svc', tls: true, tlsSecret: 'tls' },
    })

    assert.match(emptyStateHtml, /暂无集群配置/)
    assert.match(sortIconHtml, /↓/)
    assert.match(keyValueHtml, /Add Pair/)
    assert.match(namespaceFormHtml, /Create Namespace/)
    assert.match(deploymentFormHtml, /Create Deployment/)
    assert.match(serviceFormHtml, /Create Service/)
    assert.match(configMapFormHtml, /Create ConfigMap/)
    assert.match(secretFormHtml, /Create Secret/)
    assert.match(ingressFormHtml, /Create Ingress/)
  })

  it('renders modal variants with representative data', () => {
    const genericHtml = render(GenericDetailModal, {
      resource: { name: 'deploy-1', namespace: 'default' },
      loading: false,
      onClose() {},
      title: 'Generic Detail',
      renderDetails(resource) {
        return React.createElement('div', null, `${resource.name}/${resource.namespace}`)
      },
    })
    const deploymentHtml = render(DeploymentDetailModal, {
      deploy: {
        name: 'deploy-1',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 2,
        availableReplicas: 2,
        updatedReplicas: 2,
        unavailableReplicas: 1,
        strategy: 'RollingUpdate',
        age: '1d',
        labels: { app: 'demo' },
        selector: { app: 'demo' },
      },
      loading: false,
      onClose() {},
    })
    const nodeHtml = render(NodeDetailModal, {
      node: {
        name: 'node-1',
        status: 'Ready',
        roles: 'worker',
        version: '1.29.0',
        age: '2d',
        unschedulable: false,
        addresses: [
          { type: 'InternalIP', address: '10.0.0.10' },
          { type: 'ExternalIP', address: '1.2.3.4' },
        ],
        podCIDR: '10.244.0.0/24',
        providerID: 'aws:///i-abcd',
        os: 'linux',
        architecture: 'arm64',
        kernelVersion: '6.1',
        containerRuntime: 'containerd',
        capacity: { cpu: '4', memory: '8589934592', pods: '110', ephemeralStorage: '100Gi' },
        taints: [{ key: 'dedicated', value: 'infra', effect: 'NoSchedule' }],
        conditions: [{ type: 'Ready', status: 'True', reason: 'KubeletReady' }],
        labels: { topology: 'zone-a' },
      },
      loading: false,
      metrics: { cpu: '500m', memory: '2147483648', timestamp: '2024-01-01T00:00:00.000Z' },
      metricsLoading: false,
      pods: [pod],
      events: [{ namespace: 'default', name: 'event-1', type: 'Warning', reason: 'Failed', message: 'boom', count: 2, object: 'Pod/pod-1', age: '1m' }],
      onClose() {},
    })
    const podDetailHtml = render(PodDetailModal, {
      pod,
      loading: false,
      error: 'container restarting',
      onViewLogs() {},
      onClose() {},
    })
    const logViewerHtml = render(LogViewerModal, {
      pod,
      contextId: 'ctx-1',
      onClose() {},
    })
    const createModalHtml = render(CreateResourceModal, {
      isOpen: true,
      onClose() {},
      contextId: 'ctx-1',
      selectedNamespaces: ['default'],
      availableNamespaces: ['default', 'kube-system'],
      onSuccess() {},
    })
    const yamlHtml = render(YamlEditorModal, {
      isOpen: true,
      onClose() {},
      contextId: 'ctx-1',
      kind: 'Pod',
      namespace: 'default',
      name: 'pod-1',
      initialYaml: 'kind: Pod',
      onSuccess() {},
      mode: 'edit',
    })
    const execHtml = render(PodExecModal, {
      pod,
      contextId: 'ctx-1',
      onClose() {},
    })
    const portForwardHtml = render(PortForwardModal, {
      pod,
      contextId: 'ctx-1',
      onClose() {},
    })

    assert.match(genericHtml, /Generic Detail/)
    assert.match(deploymentHtml, /Deployment 详情/)
    assert.match(nodeHtml, /节点详情/)
    assert.match(podDetailHtml, /查看日志/)
    assert.match(logViewerHtml, /Pod 日志 - pod-1/)
    assert.match(createModalHtml, /Select Resource Type/)
    assert.match(yamlHtml, /Edit YAML/)
    assert.match(execHtml, /Pod Exec - pod-1/)
    assert.match(portForwardHtml, /端口转发 - pod-1/)
  })

  it('renders App in both web and electron modes with stable empty-state output', async () => {
    const webApp = await importFresh('./src/renderer/src/App.tsx')
    const webHtml = render(webApp.default)

    resetWindowState()
    globalThis.window.k7s = {
      onPushEvent() {},
    }
    const electronApp = await importFresh('./src/renderer/src/App.tsx')
    const electronHtml = render(electronApp.default)

    assert.match(webHtml, /暂无集群配置/)
    assert.match(webHtml, /请选择集群/)
    assert.match(electronHtml, /暂无集群配置/)
    assert.match(electronHtml, /请选择集群/)
  })

  it('loads non-visual renderer entry modules without side effects', async () => {
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Layout/index.ts'))
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Resources/index.ts'))
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Terminal/index.ts'))
    await assert.doesNotReject(importFresh('./src/shared/types.ts'))
  })
})
