import assert from 'node:assert/strict'
import React from 'react'
import { beforeEach, describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { importFresh } from '../helpers/module.js'
import { resetWindowState } from '../helpers/mocks.js'
import { EmptyState, SortIcon } from '../../src/renderer/src/components/Clusters/index.ts'
import { VirtualizedResourceTable } from '../../src/renderer/src/components/Resources/index.ts'
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
  cpu: '25m',
  memory: '64Mi',
  age: '1h',
  podIP: '10.0.0.1',
  hostIP: '192.168.0.1',
  serviceAccount: 'default',
  priority: '0',
  qosClass: 'Burstable',
  containers: [
    { name: 'main', image: 'nginx:8080', restartCount: 1, ready: true, state: 'Running', cpu: '20m', memory: '48Mi', ports: [8080] },
    { name: 'sidecar', image: 'busybox:1.0', restartCount: 0, ready: false, state: 'Waiting', cpu: '5m', memory: '16Mi' },
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

  it('renders a bounded initial window for virtualized resource tables', () => {
    const rows = Array.from({ length: 100 }, (_, index) => ({ id: `row-${index}` }))
    const html = render(VirtualizedResourceTable, {
      rows,
      header: React.createElement('div', { className: 'table-head' }, 'Header'),
      emptyState: React.createElement('div', { className: 'table-empty' }, 'No rows'),
      getRowKey(row) {
        return row.id
      },
      renderRow(row) {
        return React.createElement('div', { className: 'table-row' }, row.id)
      },
    })

    assert.match(html, />row-0</)
    assert.match(html, />row-31</)
    assert.doesNotMatch(html, />row-32</)
    assert.doesNotMatch(html, />row-99</)
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
      pods: [pod],
      replicaSets: [{
        name: 'deploy-1-7d9c6d',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 2,
        availableReplicas: 2,
        owner: 'Deployment/deploy-1',
        age: '1d',
      }],
      events: [{ namespace: 'default', name: 'deploy-event-1', type: 'Warning', reason: 'ProgressDeadlineExceeded', message: 'deployment stalled', count: 1, object: 'Deployment/deploy-1', age: '2m' }],
      onViewPod() {},
      onViewPodLogs() {},
      onScale() {},
      onRestart() {},
      onSetImage() {},
      onRolloutStatus() {},
      onRolloutHistory() {},
      onPauseResume() {},
      onRollback() {},
      onDescribe() {},
      onEditMetadata() {},
      onEditYaml() {},
      onDelete() {},
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
      onEnterNode() {},
      onEnterPod() {},
      onToggleScheduling() {},
      onDrainNode() {},
      onDescribeNode() {},
      onEditMetadata() {},
      onEditYaml() {},
      onDeleteNode() {},
      onClose() {},
    })
    const podDetailHtml = render(PodDetailModal, {
      pod,
      loading: false,
      error: 'container restarting',
      onViewLogs() {},
      onEnterShell() {},
      onAttachPod() {},
      onExecPod() {},
      onPortForwardPod() {},
      onDescribePod() {},
      onEditMetadata() {},
      onEditYaml() {},
      onDeletePod() {},
      onEvictPod() {},
      onForceDeletePod() {},
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
    const customResourceYamlHtml = render(YamlEditorModal, {
      isOpen: true,
      onClose() {},
      contextId: 'ctx-1',
      kind: 'CustomResource:widgets.example.com',
      namespace: 'default',
      name: 'widget-1',
      initialYaml: 'kind: Widget',
      onSuccess() {},
      mode: 'edit',
    })
    const execHtml = render(PodExecModal, {
      pod,
      contextId: 'ctx-1',
      onClose() {},
    })
    const portForwardHtml = render(PortForwardModal, {
      target: {
        kind: 'Pod',
        name: pod.name,
        namespace: pod.namespace,
        ports: [8080],
      },
      contextId: 'ctx-1',
      onClose() {},
    })

    assert.match(genericHtml, /Generic Detail/)
    assert.match(deploymentHtml, /Deployment 详情/)
    assert.match(deploymentHtml, /Deployment 操作/)
    assert.match(deploymentHtml, /Scale/)
    assert.match(deploymentHtml, /Restart/)
    assert.match(deploymentHtml, /Image/)
    assert.match(deploymentHtml, /Status/)
    assert.match(deploymentHtml, /History/)
    assert.match(deploymentHtml, /Pause/)
    assert.match(deploymentHtml, /Rollback/)
    assert.match(deploymentHtml, /关联 Pods/)
    assert.match(deploymentHtml, /deploy-1-7d9c6d/)
    assert.match(deploymentHtml, /ProgressDeadlineExceeded/)
    assert.match(nodeHtml, /节点详情/)
    assert.match(nodeHtml, /进入节点/)
    assert.match(nodeHtml, /节点操作/)
    assert.match(nodeHtml, /Cordon/)
    assert.match(nodeHtml, /Drain/)
    assert.match(nodeHtml, /Describe/)
    assert.match(nodeHtml, /Meta/)
    assert.match(nodeHtml, /YAML/)
    assert.match(nodeHtml, /删除/)
    assert.match(podDetailHtml, /Pod 操作/)
    assert.match(podDetailHtml, /Shell/)
    assert.match(podDetailHtml, /Attach/)
    assert.match(podDetailHtml, /Exec/)
    assert.match(podDetailHtml, /Port/)
    assert.match(podDetailHtml, /Describe/)
    assert.match(podDetailHtml, /Meta/)
    assert.match(podDetailHtml, /YAML/)
    assert.match(podDetailHtml, /Delete/)
    assert.match(podDetailHtml, /Evict/)
    assert.match(podDetailHtml, /Force/)
    assert.match(podDetailHtml, /25m/)
    assert.match(podDetailHtml, /48Mi/)
    assert.match(logViewerHtml, /Pod 日志 - pod-1/)
    assert.match(logViewerHtml, /上一轮日志/)
    assert.match(logViewerHtml, /时间戳/)
    assert.match(logViewerHtml, /过滤日志/)
    assert.match(logViewerHtml, /下载/)
    assert.match(createModalHtml, /Select Resource Type/)
    assert.match(yamlHtml, /Edit YAML/)
    assert.match(yamlHtml, /Diff/)
    assert.match(customResourceYamlHtml, /CustomResource \/ default \/ widget-1/)
    assert.match(execHtml, /Pod Exec - pod-1/)
    assert.match(portForwardHtml, /端口转发 - Pod\/pod-1/)
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

  it('renders table maintenance actions in the shared App shell', async () => {
    const context = {
      id: 'ctx-1',
      name: 'dev',
      cluster: 'cluster-a',
      user: 'user-a',
      source: 'default',
      current: true,
      namespace: 'default',
    }
    const node = {
      name: 'node-1',
      status: 'Ready',
      roles: 'worker',
      version: '1.29.0',
      age: '2d',
      unschedulable: true,
    }
    const clusterInitial = useClusterStore.getInitialState()
    const uiInitial = useUIStore.getInitialState()
    const restoreClusterInitial = {
      contexts: clusterInitial.contexts,
      selectedId: clusterInitial.selectedId,
      nodes: clusterInitial.nodes,
      pods: clusterInitial.pods,
      namespaces: clusterInitial.namespaces,
      deployments: clusterInitial.deployments,
      daemonSets: clusterInitial.daemonSets,
      statefulSets: clusterInitial.statefulSets,
      replicaSets: clusterInitial.replicaSets,
      replicationControllers: clusterInitial.replicationControllers,
      services: clusterInitial.services,
      configMaps: clusterInitial.configMaps,
      storageClasses: clusterInitial.storageClasses,
      persistentVolumes: clusterInitial.persistentVolumes,
      persistentVolumeClaims: clusterInitial.persistentVolumeClaims,
      ingressClasses: clusterInitial.ingressClasses,
      gateways: clusterInitial.gateways,
      networkPolicies: clusterInitial.networkPolicies,
      ipAddresses: clusterInitial.ipAddresses,
      endpointSlices: clusterInitial.endpointSlices,
      apiServices: clusterInitial.apiServices,
      mutatingWebhookConfigurations: clusterInitial.mutatingWebhookConfigurations,
      flowSchemas: clusterInitial.flowSchemas,
      certificateSigningRequests: clusterInitial.certificateSigningRequests,
      jobs: clusterInitial.jobs,
      cronJobs: clusterInitial.cronJobs,
      helmCharts: clusterInitial.helmCharts,
      helmReleases: clusterInitial.helmReleases,
      helmRepositories: clusterInitial.helmRepositories,
      podDisruptionBudgets: clusterInitial.podDisruptionBudgets,
      resourceQuotas: clusterInitial.resourceQuotas,
      limitRanges: clusterInitial.limitRanges,
      volumeAttributesClasses: clusterInitial.volumeAttributesClasses,
      volumeSnapshots: clusterInitial.volumeSnapshots,
      resourceClaims: clusterInitial.resourceClaims,
      serviceAccounts: clusterInitial.serviceAccounts,
      roles: clusterInitial.roles,
      roleBindings: clusterInitial.roleBindings,
      clusterRoles: clusterInitial.clusterRoles,
      clusterRoleBindings: clusterInitial.clusterRoleBindings,
      customResourceDefinitions: clusterInitial.customResourceDefinitions,
      events: clusterInitial.events,
      hpas: clusterInitial.hpas,
      status: clusterInitial.status,
    }
    const restoreUIInitial = {
      selectedResourceType: uiInitial.selectedResourceType,
      selectedDaemonSet: uiInitial.selectedDaemonSet,
      selectedStatefulSet: uiInitial.selectedStatefulSet,
      selectedReplicaSet: uiInitial.selectedReplicaSet,
      selectedReplicationController: uiInitial.selectedReplicationController,
      selectedJob: uiInitial.selectedJob,
      selectedCronJob: uiInitial.selectedCronJob,
      selectedHPA: uiInitial.selectedHPA,
      selectedPodDisruptionBudget: uiInitial.selectedPodDisruptionBudget,
      selectedResourceQuota: uiInitial.selectedResourceQuota,
      selectedLimitRange: uiInitial.selectedLimitRange,
      selectedPersistentVolume: uiInitial.selectedPersistentVolume,
      selectedPersistentVolumeClaim: uiInitial.selectedPersistentVolumeClaim,
      selectedStorageClass: uiInitial.selectedStorageClass,
    }

    Object.assign(clusterInitial, {
      contexts: [context],
      selectedId: 'ctx-1',
      nodes: [node],
      status: 'ready',
    })
    Object.assign(uiInitial, {
      selectedResourceType: 'nodes',
    })
    useClusterStore.setState({
      contexts: [context],
      selectedId: 'ctx-1',
      nodes: [node],
      status: 'ready',
    })
    useUIStore.setState({ selectedResourceType: 'nodes' })

    try {
      const app = await importFresh('./src/renderer/src/App.tsx')
      const html = render(app.default)

      assert.match(html, /node-1/)
      assert.match(html, /Can-I/)
      assert.match(html, /Label Nodes/)
      assert.match(html, /选择 Node node-1/)
      assert.match(html, /Disabled/)
      assert.match(html, /设置/)
      assert.doesNotMatch(html, /Top Nodes/)
      assert.doesNotMatch(html, /Cordon/)
      assert.doesNotMatch(html, /Drain/)
      assert.doesNotMatch(html, /Describe/)
      assert.doesNotMatch(html, /Meta/)
      assert.doesNotMatch(html, /编辑 YAML/)
      assert.doesNotMatch(html, /Delete/)

      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        pods: [pod],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'pods',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        pods: [pod],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'pods' })

      const podApp = await importFresh('./src/renderer/src/App.tsx')
      const podHtml = render(podApp.default)

      assert.match(podHtml, /pod-1/)
      assert.match(podHtml, /Can-I/)
      assert.doesNotMatch(podHtml, /Attach 到 Pod 主进程/)
      assert.doesNotMatch(podHtml, /Describe/)
      assert.doesNotMatch(podHtml, /Meta/)
      assert.doesNotMatch(podHtml, /编辑 YAML/)
      assert.doesNotMatch(podHtml, /删除 Pod/)
      assert.doesNotMatch(podHtml, /Evict Pod/)
      assert.doesNotMatch(podHtml, /强制删除 Pod/)

      const deployment = {
        name: 'web',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 2,
        availableReplicas: 2,
        paused: false,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        deployments: [deployment],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'deployments',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        deployments: [deployment],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'deployments' })

      const deploymentApp = await importFresh('./src/renderer/src/App.tsx')
      const deploymentHtml = render(deploymentApp.default)

      assert.match(deploymentHtml, /web/)
      assert.match(deploymentHtml, /Image/)
      assert.match(deploymentHtml, /Status/)
      assert.match(deploymentHtml, /History/)
      assert.match(deploymentHtml, /Rollback/)
      assert.match(deploymentHtml, /Describe/)
      assert.match(deploymentHtml, /Meta/)

      const daemonSet = {
        name: 'agent',
        namespace: 'kube-system',
        desiredNumberScheduled: 3,
        currentNumberScheduled: 3,
        numberReady: 2,
        age: '2d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        daemonSets: [daemonSet],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'daemonsets',
        selectedDaemonSet: daemonSet,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        daemonSets: [daemonSet],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'daemonsets', selectedDaemonSet: daemonSet })

      const daemonSetApp = await importFresh('./src/renderer/src/App.tsx')
      const daemonSetHtml = render(daemonSetApp.default)

      assert.match(daemonSetHtml, /DaemonSet 操作/)
      assert.match(daemonSetHtml, /Restart/)
      assert.match(daemonSetHtml, /Image/)
      assert.match(daemonSetHtml, /Status/)
      assert.match(daemonSetHtml, /History/)
      assert.match(daemonSetHtml, /Rollback/)
      assert.match(daemonSetHtml, /Delete/)

      const statefulSet = {
        name: 'db',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 2,
        age: '3d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        statefulSets: [statefulSet],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'statefulsets',
        selectedStatefulSet: statefulSet,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        statefulSets: [statefulSet],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'statefulsets', selectedStatefulSet: statefulSet })

      const statefulSetApp = await importFresh('./src/renderer/src/App.tsx')
      const statefulSetHtml = render(statefulSetApp.default)

      assert.match(statefulSetHtml, /StatefulSet 操作/)
      assert.match(statefulSetHtml, /Scale/)
      assert.match(statefulSetHtml, /Restart/)
      assert.match(statefulSetHtml, /Image/)
      assert.match(statefulSetHtml, /Status/)
      assert.match(statefulSetHtml, /History/)
      assert.match(statefulSetHtml, /Rollback/)
      assert.match(statefulSetHtml, /Delete/)

      const replicaSet = {
        name: 'web-7d9c6d',
        namespace: 'default',
        replicas: 3,
        readyReplicas: 2,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        replicaSets: [replicaSet],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'replicasets',
        selectedReplicaSet: replicaSet,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        replicaSets: [replicaSet],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'replicasets', selectedReplicaSet: replicaSet })

      const replicaSetApp = await importFresh('./src/renderer/src/App.tsx')
      const replicaSetHtml = render(replicaSetApp.default)

      assert.match(replicaSetHtml, /ReplicaSet 操作/)
      assert.match(replicaSetHtml, /Scale/)
      assert.match(replicaSetHtml, /Describe/)
      assert.match(replicaSetHtml, /Meta/)
      assert.match(replicaSetHtml, /YAML/)
      assert.match(replicaSetHtml, /Delete/)

      const replicationController = {
        name: 'legacy-web',
        namespace: 'default',
        replicas: 2,
        readyReplicas: 1,
        availableReplicas: 1,
        age: '4d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        replicationControllers: [replicationController],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'replicationcontrollers',
        selectedReplicationController: replicationController,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        replicationControllers: [replicationController],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'replicationcontrollers',
        selectedReplicationController: replicationController,
      })

      const replicationControllerApp = await importFresh('./src/renderer/src/App.tsx')
      const replicationControllerHtml = render(replicationControllerApp.default)

      assert.match(replicationControllerHtml, /ReplicationController 操作/)
      assert.match(replicationControllerHtml, /Scale/)
      assert.match(replicationControllerHtml, /Describe/)
      assert.match(replicationControllerHtml, /Meta/)
      assert.match(replicationControllerHtml, /YAML/)
      assert.match(replicationControllerHtml, /Delete/)

      const job = {
        name: 'backup',
        namespace: 'default',
        completions: '0/1',
        succeeded: 0,
        failed: 1,
        active: 0,
        suspend: false,
        age: '15m',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        jobs: [job],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'jobs',
        selectedJob: job,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        jobs: [job],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'jobs', selectedJob: job })

      const jobApp = await importFresh('./src/renderer/src/App.tsx')
      const jobHtml = render(jobApp.default)

      assert.match(jobHtml, /Job 操作/)
      assert.match(jobHtml, /Suspend/)
      assert.match(jobHtml, /Describe/)
      assert.match(jobHtml, /Meta/)
      assert.match(jobHtml, /YAML/)
      assert.match(jobHtml, /Delete/)

      const cronJob = {
        name: 'backup',
        namespace: 'default',
        schedule: '*/5 * * * *',
        suspend: true,
        active: 0,
        lastSchedule: '1h',
        age: '2d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        cronJobs: [cronJob],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'cronjobs',
        selectedCronJob: cronJob,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        cronJobs: [cronJob],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'cronjobs', selectedCronJob: cronJob })

      const cronJobApp = await importFresh('./src/renderer/src/App.tsx')
      const cronJobHtml = render(cronJobApp.default)

      assert.match(cronJobHtml, /CronJob 操作/)
      assert.match(cronJobHtml, /Trigger/)
      assert.match(cronJobHtml, /Resume/)
      assert.match(cronJobHtml, /Describe/)
      assert.match(cronJobHtml, /Meta/)
      assert.match(cronJobHtml, /YAML/)
      assert.match(cronJobHtml, /Delete/)

      const storageClass = {
        name: 'fast',
        provisioner: 'ebs.csi.aws.com',
        reclaimPolicy: 'Delete',
        volumeBindingMode: 'WaitForFirstConsumer',
        defaultClass: true,
        allowVolumeExpansion: true,
        age: '3d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        storageClasses: [storageClass],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'storageclasses',
        selectedStorageClass: storageClass,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        storageClasses: [storageClass],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'storageclasses', selectedStorageClass: storageClass })

      const storageApp = await importFresh('./src/renderer/src/App.tsx')
      const storageHtml = render(storageApp.default)

      assert.match(storageHtml, /fast/)
      assert.match(storageHtml, /Describe/)
      assert.match(storageHtml, /Meta/)
      assert.match(storageHtml, /编辑 YAML/)
      assert.match(storageHtml, /删除 StorageClass/)
      assert.match(storageHtml, /StorageClass 操作/)
      assert.match(storageHtml, /YAML/)
      assert.match(storageHtml, /Delete/)

      const role = {
        name: 'pod-reader',
        namespace: 'default',
        rules: 1,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        roles: [role],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'roles',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        roles: [role],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'roles' })

      const roleApp = await importFresh('./src/renderer/src/App.tsx')
      const roleHtml = render(roleApp.default)

      assert.match(roleHtml, /pod-reader/)
      assert.match(roleHtml, /Describe/)
      assert.match(roleHtml, /Meta/)
      assert.match(roleHtml, /删除 Role/)

      const clusterRoleBinding = {
        name: 'read-nodes',
        roleRef: 'ClusterRole/node-reader',
        subjects: 1,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        clusterRoleBindings: [clusterRoleBinding],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'clusterrolebindings',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        clusterRoleBindings: [clusterRoleBinding],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'clusterrolebindings' })

      const clusterRoleBindingApp = await importFresh('./src/renderer/src/App.tsx')
      const clusterRoleBindingHtml = render(clusterRoleBindingApp.default)

      assert.match(clusterRoleBindingHtml, /read-nodes/)
      assert.match(clusterRoleBindingHtml, /Describe/)
      assert.match(clusterRoleBindingHtml, /Meta/)
      assert.match(clusterRoleBindingHtml, /编辑 YAML/)
      assert.match(clusterRoleBindingHtml, /删除 ClusterRoleBinding/)

      const persistentVolume = {
        name: 'pv-1',
        capacity: '10Gi',
        accessModes: 'ReadWriteOnce',
        reclaimPolicy: 'Retain',
        status: 'Bound',
        storageClass: 'fast',
        claim: 'default/data',
        source: 'CSI ebs.csi.aws.com',
        age: '4d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        persistentVolumes: [persistentVolume],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'persistentvolumes',
        selectedPersistentVolume: persistentVolume,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        persistentVolumes: [persistentVolume],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'persistentvolumes', selectedPersistentVolume: persistentVolume })

      const pvApp = await importFresh('./src/renderer/src/App.tsx')
      const pvHtml = render(pvApp.default)

      assert.match(pvHtml, /pv-1/)
      assert.match(pvHtml, /Describe/)
      assert.match(pvHtml, /Meta/)
      assert.match(pvHtml, /编辑 YAML/)
      assert.match(pvHtml, /删除 PV/)
      assert.match(pvHtml, /PV 操作/)
      assert.match(pvHtml, /YAML/)
      assert.match(pvHtml, /Delete/)

      const persistentVolumeClaim = {
        name: 'data',
        namespace: 'default',
        status: 'Bound',
        capacity: '10Gi',
        accessModes: 'ReadWriteOnce',
        storageClass: 'fast',
        volumeName: 'pv-1',
        age: '2d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        persistentVolumeClaims: [persistentVolumeClaim],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'persistentvolumeclaims',
        selectedPersistentVolumeClaim: persistentVolumeClaim,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        persistentVolumeClaims: [persistentVolumeClaim],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'persistentvolumeclaims',
        selectedPersistentVolumeClaim: persistentVolumeClaim,
      })

      const pvcApp = await importFresh('./src/renderer/src/App.tsx')
      const pvcHtml = render(pvcApp.default)

      assert.match(pvcHtml, /PVC 操作/)
      assert.match(pvcHtml, /Describe/)
      assert.match(pvcHtml, /Meta/)
      assert.match(pvcHtml, /YAML/)
      assert.match(pvcHtml, /Delete/)

      const helmChart = {
        name: 'bitnami/nginx',
        repository: 'bitnami',
        chart: 'nginx',
        version: '18.2.5',
        appVersion: '1.28.0',
        description: 'NGINX Open Source web server',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        helmCharts: [helmChart],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'helmcharts',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        helmCharts: [helmChart],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'helmcharts' })

      const helmChartApp = await importFresh('./src/renderer/src/App.tsx')
      const helmChartHtml = render(helmChartApp.default)

      assert.match(helmChartHtml, /bitnami\/nginx/)
      assert.match(helmChartHtml, /18\.2\.5/)
      assert.match(helmChartHtml, /NGINX Open Source web server/)
      assert.match(helmChartHtml, /Install/)
      assert.match(helmChartHtml, /安装 Helm Chart/)

      const helmRelease = {
        name: 'web',
        namespace: 'default',
        revision: 3,
        status: 'deployed',
        chart: 'web-1.2.3',
        appVersion: '1.2.3',
        updated: '2026-05-14 10:00:00',
        storage: 'Secret',
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        helmReleases: [helmRelease],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'helmreleases',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        helmReleases: [helmRelease],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'helmreleases' })

      const helmApp = await importFresh('./src/renderer/src/App.tsx')
      const helmHtml = render(helmApp.default)

      assert.match(helmHtml, /web-1\.2\.3/)
      assert.match(helmHtml, /Status/)
      assert.match(helmHtml, /Resources/)
      assert.match(helmHtml, /Manifest/)
      assert.match(helmHtml, /Metadata/)
      assert.match(helmHtml, /Values/)
      assert.match(helmHtml, /Notes/)
      assert.match(helmHtml, /Hooks/)
      assert.match(helmHtml, /All/)
      assert.match(helmHtml, /Test/)
      assert.match(helmHtml, /History/)
      assert.match(helmHtml, /Install \/ Upgrade/)
      assert.match(helmHtml, /Upgrade/)
      assert.match(helmHtml, /Rollback/)
      assert.match(helmHtml, /Uninstall/)
      assert.match(helmHtml, /查看 Helm Release 状态/)
      assert.match(helmHtml, /查看 Helm Release 资源/)
      assert.match(helmHtml, /查看 Helm Release Manifest/)
      assert.match(helmHtml, /查看 Helm Release Metadata/)
      assert.match(helmHtml, /查看 Helm Release Values/)
      assert.match(helmHtml, /查看 Helm Release Notes/)
      assert.match(helmHtml, /查看 Helm Release Hooks/)
      assert.match(helmHtml, /查看 Helm Release All 输出/)
      assert.match(helmHtml, /执行 Helm Release 测试/)
      assert.match(helmHtml, /安装或升级 Helm Release/)
      assert.match(helmHtml, /升级 Helm Release/)
      assert.match(helmHtml, /卸载 Helm Release/)

      const helmRepository = {
        name: 'bitnami',
        url: 'https://charts.bitnami.com/bitnami',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        helmRepositories: [helmRepository],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'helmrepositories',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        helmRepositories: [helmRepository],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'helmrepositories' })

      const helmRepositoryApp = await importFresh('./src/renderer/src/App.tsx')
      const helmRepositoryHtml = render(helmRepositoryApp.default)

      assert.match(helmRepositoryHtml, /bitnami/)
      assert.match(helmRepositoryHtml, /https:\/\/charts\.bitnami\.com\/bitnami/)
      assert.match(helmRepositoryHtml, /Add/)
      assert.match(helmRepositoryHtml, /Update All/)
      assert.match(helmRepositoryHtml, /Update/)
      assert.match(helmRepositoryHtml, /Remove/)
      assert.match(helmRepositoryHtml, /新增 Helm Repository/)
      assert.match(helmRepositoryHtml, /更新全部 Helm Repository/)
      assert.match(helmRepositoryHtml, /删除 Helm Repository/)

      const hpa = {
        name: 'web-hpa',
        namespace: 'default',
        reference: 'Deployment/web',
        minPods: 2,
        maxPods: 10,
        currentReplicas: 3,
        desiredReplicas: 5,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        hpas: [hpa],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'horizontalpodautoscalers',
        selectedHPA: hpa,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        hpas: [hpa],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'horizontalpodautoscalers',
        selectedHPA: hpa,
      })

      const hpaApp = await importFresh('./src/renderer/src/App.tsx')
      const hpaHtml = render(hpaApp.default)

      assert.match(hpaHtml, /web-hpa/)
      assert.match(hpaHtml, /Describe/)
      assert.match(hpaHtml, /Meta/)
      assert.match(hpaHtml, /删除 HPA/)
      assert.match(hpaHtml, /HPA 操作/)
      assert.match(hpaHtml, /YAML/)
      assert.match(hpaHtml, /Delete/)

      const podDisruptionBudget = {
        name: 'api-pdb',
        namespace: 'default',
        minAvailable: '1',
        maxUnavailable: '-',
        allowedDisruptions: 1,
        currentHealthy: 2,
        desiredHealthy: 1,
        expectedPods: 2,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        podDisruptionBudgets: [podDisruptionBudget],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'poddisruptionbudgets',
        selectedPodDisruptionBudget: podDisruptionBudget,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        podDisruptionBudgets: [podDisruptionBudget],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'poddisruptionbudgets',
        selectedPodDisruptionBudget: podDisruptionBudget,
      })

      const pdbApp = await importFresh('./src/renderer/src/App.tsx')
      const pdbHtml = render(pdbApp.default)

      assert.match(pdbHtml, /PDB 操作/)
      assert.match(pdbHtml, /Describe/)
      assert.match(pdbHtml, /Meta/)
      assert.match(pdbHtml, /YAML/)
      assert.match(pdbHtml, /Delete/)

      const resourceQuota = {
        name: 'compute',
        namespace: 'default',
        hard: 'pods=10',
        used: 'pods=2',
        scopes: '-',
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        resourceQuotas: [resourceQuota],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'resourcequotas',
        selectedResourceQuota: resourceQuota,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        resourceQuotas: [resourceQuota],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'resourcequotas',
        selectedResourceQuota: resourceQuota,
      })

      const resourceQuotaApp = await importFresh('./src/renderer/src/App.tsx')
      const resourceQuotaHtml = render(resourceQuotaApp.default)

      assert.match(resourceQuotaHtml, /ResourceQuota 操作/)
      assert.match(resourceQuotaHtml, /Describe/)
      assert.match(resourceQuotaHtml, /Meta/)
      assert.match(resourceQuotaHtml, /YAML/)
      assert.match(resourceQuotaHtml, /Delete/)

      const limitRange = {
        name: 'container-limits',
        namespace: 'default',
        types: 'Container',
        min: 'cpu=100m',
        max: 'cpu=2',
        default: 'cpu=500m',
        defaultRequest: 'cpu=250m',
        maxLimitRequestRatio: '-',
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        limitRanges: [limitRange],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'limitranges',
        selectedLimitRange: limitRange,
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        limitRanges: [limitRange],
        status: 'ready',
      })
      useUIStore.setState({
        selectedResourceType: 'limitranges',
        selectedLimitRange: limitRange,
      })

      const limitRangeApp = await importFresh('./src/renderer/src/App.tsx')
      const limitRangeHtml = render(limitRangeApp.default)

      assert.match(limitRangeHtml, /LimitRange 操作/)
      assert.match(limitRangeHtml, /Describe/)
      assert.match(limitRangeHtml, /Meta/)
      assert.match(limitRangeHtml, /YAML/)
      assert.match(limitRangeHtml, /Delete/)

      const crd = {
        name: 'widgets.example.com',
        group: 'example.com',
        kind: 'Widget',
        scope: 'Namespaced',
        versions: 'v1',
        established: true,
        age: '1d',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        customResourceDefinitions: [crd],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'customresourcedefinitions',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        customResourceDefinitions: [crd],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'customresourcedefinitions' })

      const crdApp = await importFresh('./src/renderer/src/App.tsx')
      const crdHtml = render(crdApp.default)

      assert.match(crdHtml, /widgets\.example\.com/)
      assert.match(crdHtml, /Describe/)
      assert.match(crdHtml, /Meta/)
      assert.match(crdHtml, /编辑 YAML/)
      assert.match(crdHtml, /删除 CRD/)

      const event = {
        namespace: 'default',
        name: 'pod-1.abc123',
        type: 'Warning',
        reason: 'BackOff',
        object: 'Pod/pod-1',
        message: 'Back-off restarting failed container',
        count: 3,
        age: '1m',
      }
      Object.assign(clusterInitial, {
        contexts: [context],
        selectedId: 'ctx-1',
        events: [event],
        status: 'ready',
      })
      Object.assign(uiInitial, {
        selectedResourceType: 'events',
      })
      useClusterStore.setState({
        contexts: [context],
        selectedId: 'ctx-1',
        events: [event],
        status: 'ready',
      })
      useUIStore.setState({ selectedResourceType: 'events' })

      const eventApp = await importFresh('./src/renderer/src/App.tsx')
      const eventHtml = render(eventApp.default)

      assert.match(eventHtml, /BackOff/)
      assert.match(eventHtml, /Describe/)
      assert.match(eventHtml, /Meta/)
      assert.match(eventHtml, /编辑 YAML/)
      assert.match(eventHtml, /删除 Event/)

      const renderResourceTable = async (selectedResourceType, storeSlice) => {
        const clusterState = {
          contexts: [context],
          selectedId: 'ctx-1',
          status: 'ready',
          ...storeSlice,
        }
        Object.assign(clusterInitial, clusterState)
        Object.assign(uiInitial, { selectedResourceType })
        useClusterStore.setState(clusterState)
        useUIStore.setState({ selectedResourceType })

        const resourceApp = await importFresh('./src/renderer/src/App.tsx')
        return render(resourceApp.default)
      }

      const describeMetadataCases = [
        {
          type: 'namespaces',
          store: { namespaces: [{ name: 'team-a', status: 'Active', age: '2d' }] },
          name: /team-a/,
          deleteTitle: /删除 Namespace/,
        },
        {
          type: 'services',
          store: {
            services: [{
              name: 'api',
              namespace: 'default',
              type: 'ClusterIP',
              clusterIP: '10.96.0.10',
              ports: '80/TCP',
              age: '1d',
            }],
          },
          name: /api/,
          deleteTitle: /删除 Service/,
        },
        {
          type: 'configmaps',
          store: {
            configMaps: [{
              name: 'app-config',
              namespace: 'default',
              data: { LOG_LEVEL: 'info' },
              binaryDataKeys: [],
              age: '1d',
            }],
          },
          name: /app-config/,
          deleteTitle: /删除 ConfigMap/,
        },
        {
          type: 'jobs',
          store: {
            jobs: [{
              name: 'backup',
              namespace: 'default',
              completions: '1/1',
              succeeded: 1,
              failed: 0,
              suspend: false,
              age: '1d',
            }],
          },
          name: /backup/,
          deleteTitle: /删除 Job/,
          extra: [/Suspend/],
        },
        {
          type: 'cronjobs',
          store: {
            cronJobs: [{
              name: 'backup',
              namespace: 'default',
              schedule: '*/5 * * * *',
              suspend: true,
              active: 0,
              lastSchedule: '1h',
              age: '2d',
            }],
          },
          name: /backup/,
          deleteTitle: /删除 CronJob/,
          extra: [/Trigger/, /Resume/],
        },
        {
          type: 'ingressclasses',
          store: {
            ingressClasses: [{
              name: 'nginx',
              controller: 'k8s.io/ingress-nginx',
              parameters: '-',
              default: true,
              age: '7d',
            }],
          },
          name: /nginx/,
          deleteTitle: /删除 IngressClass/,
        },
        {
          type: 'gateways',
          store: {
            gateways: [{
              name: 'edge',
              namespace: 'default',
              gatewayClass: 'istio',
              addresses: '1.2.3.4',
              listeners: 'http:80',
              attachedRoutes: 2,
              programmed: 'True',
              age: '1d',
            }],
          },
          name: /edge/,
          deleteTitle: /删除 Gateway/,
        },
        {
          type: 'networkpolicies',
          store: {
            networkPolicies: [{
              name: 'deny-all',
              namespace: 'default',
              podSelector: '{}',
              policyTypes: 'Ingress,Egress',
              ingressRules: 0,
              egressRules: 0,
              age: '1d',
            }],
          },
          name: /deny-all/,
          deleteTitle: /删除 NetworkPolicy/,
        },
        {
          type: 'ipaddresses',
          store: {
            ipAddresses: [{
              name: 'ip-10-0-0-10',
              parentRef: 'Service/default/api',
              parentGroup: '',
              parentResource: 'services',
              parentNamespace: 'default',
              age: '1d',
            }],
          },
          name: /ip-10-0-0-10/,
          deleteTitle: /删除 IPAddress/,
        },
        {
          type: 'endpointslices',
          store: {
            endpointSlices: [{
              name: 'api-abc',
              namespace: 'default',
              service: 'api',
              addressType: 'IPv4',
              endpoints: 2,
              ready: 2,
              notReady: 0,
              addresses: '10.0.0.10, 10.0.0.11',
              ports: 'http:80/TCP',
              age: '1d',
            }],
          },
          name: /api-abc/,
          deleteTitle: /删除 EndpointSlice/,
        },
        {
          type: 'apiservices',
          store: {
            apiServices: [{
              name: 'v1beta1.metrics.k8s.io',
              group: 'metrics.k8s.io',
              version: 'v1beta1',
              service: 'kube-system/metrics-server',
              available: 'True',
              reason: 'Passed',
              groupPriority: 100,
              versionPriority: 100,
              insecureSkipTLSVerify: false,
              age: '7d',
            }],
          },
          name: /v1beta1\.metrics\.k8s\.io/,
          deleteTitle: /删除 APIService/,
        },
        {
          type: 'mutatingwebhookconfigurations',
          store: {
            mutatingWebhookConfigurations: [{
              name: 'pod-mutator',
              webhooks: 1,
              failurePolicies: 'Fail',
              sideEffects: 'None',
              admissionReviewVersions: 'v1',
              clients: 'Service/default/pod-mutator',
              rules: 'pods',
              age: '1d',
            }],
          },
          name: /pod-mutator/,
          deleteTitle: /删除 MutatingWebhookConfiguration/,
        },
        {
          type: 'flowschemas',
          store: {
            flowSchemas: [{
              name: 'workload-low',
              priorityLevel: 'workload-low',
              matchingPrecedence: 1000,
              distinguisherMethod: 'ByUser',
              subjects: 'User/system:serviceaccount:default:builder',
              rules: 'pods',
              condition: 'Ready',
              age: '1d',
            }],
          },
          name: /workload-low/,
          deleteTitle: /删除 FlowSchema/,
        },
        {
          type: 'certificatesigningrequests',
          store: {
            certificateSigningRequests: [{
              name: 'node-csr',
              signerName: 'kubernetes.io/kube-apiserver-client-kubelet',
              requestor: 'system:node:node-1',
              condition: 'Pending',
              reason: '-',
              usages: 'client auth',
              expirationSeconds: 86400,
              age: '1d',
            }],
          },
          name: /node-csr/,
          deleteTitle: /删除 CertificateSigningRequest/,
          extra: [/Approve/, /Deny/],
        },
        {
          type: 'persistentvolumeclaims',
          store: {
            persistentVolumeClaims: [{
              name: 'data',
              namespace: 'default',
              status: 'Bound',
              capacity: '10Gi',
              accessModes: 'ReadWriteOnce',
              storageClass: 'fast',
              volumeName: 'pv-1',
              age: '2d',
            }],
          },
          name: /data/,
          deleteTitle: /删除 PVC/,
        },
        {
          type: 'resourcequotas',
          store: {
            resourceQuotas: [{
              name: 'compute',
              namespace: 'default',
              hard: 'pods=10',
              used: 'pods=2',
              scopes: '-',
              age: '1d',
            }],
          },
          name: /compute/,
          deleteTitle: /删除 ResourceQuota/,
        },
        {
          type: 'volumeattributesclasses',
          store: {
            volumeAttributesClasses: [{
              name: 'fast-attrs',
              driverName: 'ebs.csi.aws.com',
              parameters: 'iops=3000',
              parameterCount: 1,
              age: '1d',
            }],
          },
          name: /fast-attrs/,
          deleteTitle: /删除 VolumeAttributesClass/,
        },
        {
          type: 'volumesnapshots',
          store: {
            volumeSnapshots: [{
              name: 'data-snap',
              namespace: 'default',
              snapshotClass: 'csi-snap',
              source: 'PVC/data',
              boundContent: 'snapcontent-1',
              readyToUse: true,
              restoreSize: '10Gi',
              age: '1d',
            }],
          },
          name: /data-snap/,
          deleteTitle: /删除 VolumeSnapshot/,
        },
        {
          type: 'resourceclaims',
          store: {
            resourceClaims: [{
              name: 'gpu-claim',
              namespace: 'default',
              deviceClasses: 'gpu.example.com',
              requests: 1,
              allocated: true,
              allocatedDevices: 1,
              reservedFor: 'Pod/default/ml',
              age: '1d',
            }],
          },
          name: /gpu-claim/,
          deleteTitle: /删除 ResourceClaim/,
        },
        {
          type: 'serviceaccounts',
          store: {
            serviceAccounts: [{
              name: 'builder',
              namespace: 'default',
              secrets: 1,
              age: '1d',
            }],
          },
          name: /builder/,
          deleteTitle: /删除 ServiceAccount/,
        },
        {
          type: 'rolebindings',
          store: {
            roleBindings: [{
              name: 'read-pods',
              namespace: 'default',
              roleRef: 'Role/pod-reader',
              subjects: 1,
              age: '1d',
            }],
          },
          name: /read-pods/,
          deleteTitle: /删除 RoleBinding/,
        },
        {
          type: 'clusterroles',
          store: {
            clusterRoles: [{
              name: 'node-reader',
              rules: 2,
              age: '1d',
            }],
          },
          name: /node-reader/,
          deleteTitle: /删除 ClusterRole/,
        },
      ]

      for (const actionCase of describeMetadataCases) {
        const resourceHtml = await renderResourceTable(actionCase.type, actionCase.store)
        assert.match(resourceHtml, actionCase.name)
        assert.match(resourceHtml, /Describe/)
        assert.match(resourceHtml, /Meta/)
        assert.match(resourceHtml, /编辑 YAML/)
        assert.match(resourceHtml, actionCase.deleteTitle)
        for (const pattern of actionCase.extra ?? []) {
          assert.match(resourceHtml, pattern)
        }
      }
    } finally {
      Object.assign(clusterInitial, restoreClusterInitial)
      Object.assign(uiInitial, restoreUIInitial)
    }
  })

  it('loads non-visual renderer entry modules without side effects', async () => {
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Layout/index.ts'))
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Resources/index.ts'))
    await assert.doesNotReject(importFresh('./src/renderer/src/components/Terminal/index.ts'))
    await assert.doesNotReject(importFresh('./src/shared/types.ts'))
  })
})
