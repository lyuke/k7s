import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  AdmissionregistrationV1Api,
  AdmissionregistrationV1beta1Api,
  ApisApi,
  ApiregistrationV1Api,
  ApiextensionsV1Api,
  AppsV1Api,
  AuthenticationV1Api,
  AuthorizationV1Api,
  AutoscalingV2Api,
  BatchV1Api,
  CertificatesV1alpha1Api,
  CoordinationV1Api,
  CertificatesV1Api,
  CertificatesV1beta1Api,
  CoreV1Api,
  CoreApi,
  CustomObjectsApi,
  DiscoveryV1Api,
  EventsV1Api,
  FlowcontrolApiserverV1Api,
  Health,
  InternalApiserverV1alpha1Api,
  KubeConfig,
  CoordinationV1beta1Api,
  NetworkingV1Api,
  NodeV1Api,
  OpenidApi,
  PatchStrategy,
  PolicyV1Api,
  RbacAuthorizationV1Api,
  ResourceV1Api,
  ResourceV1alpha3Api,
  SchedulingV1Api,
  StorageV1Api,
  StoragemigrationV1alpha1Api,
  VersionApi,
  WellKnownApi,
} from '@kubernetes/client-node'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

const CONTEXT_ID = 'default::test-context'

let tempDir
let originalKubeconfig
let originalMakeApiClient
let originalHealthReadyz
let originalHealthLivez
let originalHealthHealthz
let apiClients

const writeKubeconfig = (currentContext = 'test-context') => {
  const kubeconfigPath = path.join(tempDir, 'kubeconfig.yaml')
  fs.writeFileSync(kubeconfigPath, [
    'apiVersion: v1',
    'kind: Config',
    'clusters:',
    '- name: test-cluster',
    '  cluster:',
    '    server: http://127.0.0.1:65535',
    'contexts:',
    '- name: test-context',
    '  context:',
    '    cluster: test-cluster',
    '    user: test-user',
    '    namespace: default',
    '- name: prod-context',
    '  context:',
    '    cluster: test-cluster',
    '    user: test-user',
    '    namespace: prod',
    `current-context: ${currentContext}`,
    'users:',
    '- name: test-user',
    '  user: {}',
    '',
  ].join('\n'))
  return kubeconfigPath
}

const createMockApi = (methods) => {
  const calls = {}
  const api = {}
  for (const [method, implementation] of Object.entries(methods)) {
    calls[method] = []
    api[method] = async (...args) => {
      calls[method].push(args)
      return implementation(...args)
    }
  }
  api.__calls = calls
  return api
}

const patchContentType = async (options) => {
  let contentType = ''
  await options.middleware[0].pre({
    setHeaderParam(name, value) {
      if (name === 'Content-Type') {
        contentType = value
      }
    },
  })
  return contentType
}

const setupApis = (clients) => {
  apiClients = clients
  KubeConfig.prototype.makeApiClient = function makeApiClient(apiClientType) {
    if (apiClientType === AdmissionregistrationV1Api) return apiClients.admission
    if (apiClientType === AdmissionregistrationV1beta1Api) return apiClients.admissionBeta
    if (apiClientType === ApisApi) return apiClients.apis
    if (apiClientType === ApiregistrationV1Api) return apiClients.apiregistration
    if (apiClientType === AuthenticationV1Api) return apiClients.authentication
    if (apiClientType === AuthorizationV1Api) return apiClients.authorization
    if (apiClientType === ApiextensionsV1Api) return apiClients.apiextensions
    if (apiClientType === CertificatesV1Api) return apiClients.certificates
    if (apiClientType === CertificatesV1alpha1Api) return apiClients.certificatesAlpha
    if (apiClientType === CertificatesV1beta1Api) return apiClients.certificatesBeta
    if (apiClientType === CoordinationV1Api) return apiClients.coordination
    if (apiClientType === CoordinationV1beta1Api) return apiClients.coordinationBeta
    if (apiClientType === CoreApi) return apiClients.coreDiscovery
    if (apiClientType === CoreV1Api) return apiClients.core
    if (apiClientType === AppsV1Api) return apiClients.apps
    if (apiClientType === AutoscalingV2Api) return apiClients.autoscaling
    if (apiClientType === BatchV1Api) return apiClients.batch
    if (apiClientType === CustomObjectsApi) return apiClients.customObjects
    if (apiClientType === DiscoveryV1Api) return apiClients.discovery
    if (apiClientType === EventsV1Api) return apiClients.events
    if (apiClientType === FlowcontrolApiserverV1Api) return apiClients.flowcontrol
    if (apiClientType === InternalApiserverV1alpha1Api) return apiClients.internalApiserver
    if (apiClientType === NetworkingV1Api) return apiClients.networking
    if (apiClientType === NodeV1Api) return apiClients.node
    if (apiClientType === OpenidApi) return apiClients.openid
    if (apiClientType === PolicyV1Api) return apiClients.policy
    if (apiClientType === RbacAuthorizationV1Api) return apiClients.rbac
    if (apiClientType === ResourceV1Api) return apiClients.resource
    if (apiClientType === ResourceV1alpha3Api) return apiClients.resourceAlpha
    if (apiClientType === SchedulingV1Api) return apiClients.scheduling
    if (apiClientType === StorageV1Api) return apiClients.storage
    if (apiClientType === StoragemigrationV1alpha1Api) return apiClients.storagemigration
    if (apiClientType === VersionApi) return apiClients.version
    if (apiClientType === WellKnownApi) return apiClients.wellKnown
    return apiClients.default ?? {}
  }
}

beforeEach(() => {
  resetElectronMock()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k7s-kube-test-'))
  globalThis.__electronMock.getPathImpl = () => tempDir
  originalKubeconfig = process.env.KUBECONFIG
  process.env.KUBECONFIG = writeKubeconfig()
  originalMakeApiClient = KubeConfig.prototype.makeApiClient
  originalHealthReadyz = Health.prototype.readyz
  originalHealthLivez = Health.prototype.livez
  originalHealthHealthz = Health.prototype.healthz
  apiClients = {}
})

afterEach(() => {
  KubeConfig.prototype.makeApiClient = originalMakeApiClient
  Health.prototype.readyz = originalHealthReadyz
  Health.prototype.livez = originalHealthLivez
  Health.prototype.healthz = originalHealthHealthz
  if (originalKubeconfig === undefined) {
    delete process.env.KUBECONFIG
  } else {
    process.env.KUBECONFIG = originalKubeconfig
  }
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('main kube operations', () => {
  it('lists kubeconfig contexts with current marker and default namespace', async () => {
    const kube = await importFresh('./src/main/kube.ts')
    const contexts = await kube.listContexts()

    assert.deepEqual(contexts, [{
      id: CONTEXT_ID,
      name: 'test-context',
      cluster: 'test-cluster',
      user: 'test-user',
      source: 'default',
      current: true,
      namespace: 'default',
    }, {
      id: 'default::prod-context',
      name: 'prod-context',
      cluster: 'test-cluster',
      user: 'test-user',
      source: 'default',
      current: false,
      namespace: 'prod',
    }])

    writeKubeconfig('prod-context')
    const updated = await kube.listContexts()
    assert.equal(updated.find((context) => context.id === CONTEXT_ID)?.current, false)
    assert.equal(updated.find((context) => context.id === 'default::prod-context')?.current, true)
  })

  it('imports kubeconfig content from web uploads into app-managed storage', async () => {
    const kube = await importFresh('./src/main/kube.ts')
    const uploadedContent = [
      'apiVersion: v1',
      'kind: Config',
      'clusters:',
      '- name: uploaded-cluster',
      '  cluster:',
      '    server: http://127.0.0.1:65534',
      'contexts:',
      '- name: uploaded-context',
      '  context:',
      '    cluster: uploaded-cluster',
      '    user: uploaded-user',
      '    namespace: web',
      'current-context: uploaded-context',
      'users:',
      '- name: uploaded-user',
      '  user: {}',
      '',
    ].join('\n')

    const result = await kube.addKubeconfigContent('uploaded.yaml', uploadedContent)
    const context = result.contexts.find((item) => item.id === 'web-uploaded_yaml::uploaded-context')

    assert.deepEqual(result.addedIds, ['web-uploaded_yaml::uploaded-context'])
    assert.deepEqual(context, {
      id: 'web-uploaded_yaml::uploaded-context',
      name: 'uploaded-context',
      cluster: 'uploaded-cluster',
      user: 'uploaded-user',
      source: 'web-uploaded.yaml',
      current: true,
      namespace: 'web',
    })
    assert.ok(fs.existsSync(path.join(tempDir, 'kubeconfigs', 'web-uploaded.yaml')))

    await assert.rejects(
      kube.addKubeconfigContent('empty.yaml', '   '),
      /kubeconfig 内容不能为空/,
    )
  })

  it('persists the selected kubeconfig current context', async () => {
    const kube = await importFresh('./src/main/kube.ts')

    const contexts = await kube.useKubeContext('default::prod-context')

    assert.equal(contexts.find((context) => context.id === CONTEXT_ID)?.current, false)
    assert.equal(contexts.find((context) => context.id === 'default::prod-context')?.current, true)
    assert.equal(JSON.parse(fs.readFileSync(process.env.KUBECONFIG, 'utf-8'))['current-context'], 'prod-context')

    const reloaded = await kube.listContexts()
    assert.equal(reloaded.find((context) => context.id === 'default::prod-context')?.current, true)
  })

  it('persists the default namespace for a kubeconfig context', async () => {
    const kube = await importFresh('./src/main/kube.ts')

    const contexts = await kube.setKubeContextNamespace(CONTEXT_ID, 'team-a')

    assert.equal(contexts.find((context) => context.id === CONTEXT_ID)?.namespace, 'team-a')
    const saved = JSON.parse(fs.readFileSync(process.env.KUBECONFIG, 'utf-8'))
    const savedContext = saved.contexts.find((context) => context.name === 'test-context')
    assert.equal(savedContext.context.namespace, 'team-a')

    const reloaded = await kube.listContexts()
    assert.equal(reloaded.find((context) => context.id === CONTEXT_ID)?.namespace, 'team-a')
  })

  it('rejects empty kubeconfig default namespaces', async () => {
    const kube = await importFresh('./src/main/kube.ts')

    await assert.rejects(
      kube.setKubeContextNamespace(CONTEXT_ID, '   '),
      /命名空间不能为空/,
    )
  })

  it('uses explicit patch strategies for node, scale, restart, and deployment updates', async () => {
    const core = createMockApi({
      patchNode: async () => ({ success: true }),
    })
    const apps = createMockApi({
      patchNamespacedDeploymentScale: async () => ({ spec: { replicas: 3 } }),
      patchNamespacedDeployment: async () => ({ metadata: { name: 'web' } }),
      readNamespacedDeployment: async () => ({
        metadata: { name: 'web' },
        spec: {
          replicas: 1,
          template: { spec: { containers: [{ name: 'web', image: 'old' }] } },
        },
      }),
    })
    setupApis({ core, apps })

    const kube = await importFresh('./src/main/kube.ts')
    await kube.cordonNode(CONTEXT_ID, 'node-1')
    await kube.scaleDeployment(CONTEXT_ID, 'default', 'web', 3)
    await kube.restartWorkload(CONTEXT_ID, 'Deployment', 'default', 'web')
    await kube.pauseWorkload(CONTEXT_ID, 'Deployment', 'default', 'web')
    await kube.resumeWorkload(CONTEXT_ID, 'Deployment', 'default', 'web')
    await kube.updateDeployment(CONTEXT_ID, 'default', 'web', { image: 'nginx:latest' })

    assert.deepEqual(core.__calls.patchNode[0][0], {
      name: 'node-1',
      body: { spec: { unschedulable: true } },
    })
    assert.equal(await patchContentType(core.__calls.patchNode[0][1]), PatchStrategy.MergePatch)
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeploymentScale[0][1]), PatchStrategy.MergePatch)
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[1][1]), PatchStrategy.StrategicMergePatch)
    assert.deepEqual(apps.__calls.patchNamespacedDeployment[1][0].body, { spec: { paused: true } })
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[2][1]), PatchStrategy.StrategicMergePatch)
    assert.deepEqual(apps.__calls.patchNamespacedDeployment[2][0].body, { spec: { paused: false } })
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[3][1]), PatchStrategy.StrategicMergePatch)
  })

  it('updates workload container images with strategic merge patch', async () => {
    const apps = createMockApi({
      patchNamespacedDeployment: async () => ({}),
      patchNamespacedDaemonSet: async () => ({}),
      patchNamespacedStatefulSet: async () => ({}),
    })
    setupApis({ apps })

    const kube = await importFresh('./src/main/kube.ts')
    const deploymentResult = await kube.setWorkloadImage(CONTEXT_ID, 'Deployment', 'default', 'web', 'app', 'nginx:1.28')
    const daemonSetResult = await kube.setWorkloadImage(CONTEXT_ID, 'DaemonSet', 'kube-system', 'agent', 'agent', 'agent:v2')
    const statefulSetResult = await kube.setWorkloadImage(CONTEXT_ID, 'StatefulSet', 'default', 'db', 'db', 'postgres:16')

    assert.equal(deploymentResult.success, true)
    assert.equal(daemonSetResult.success, true)
    assert.equal(statefulSetResult.success, true)
    assert.deepEqual(apps.__calls.patchNamespacedDeployment[0][0], {
      name: 'web',
      namespace: 'default',
      body: {
        spec: {
          template: {
            spec: {
              containers: [{
                name: 'app',
                image: 'nginx:1.28',
              }],
            },
          },
        },
      },
    })
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(apps.__calls.patchNamespacedDaemonSet[0][0].body.spec.template.spec.containers[0].image, 'agent:v2')
    assert.equal(apps.__calls.patchNamespacedStatefulSet[0][0].body.spec.template.spec.containers[0].image, 'postgres:16')
  })

  it('force deletes pods with zero grace period', async () => {
    const core = createMockApi({
      deleteNamespacedPod: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const result = await kube.forceDeletePod(CONTEXT_ID, 'default', 'stuck-pod')

    assert.equal(result.success, true)
    assert.deepEqual(core.__calls.deleteNamespacedPod[0][0], {
      name: 'stuck-pod',
      namespace: 'default',
      gracePeriodSeconds: 0,
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
        gracePeriodSeconds: 0,
      },
    })
  })

  it('evicts pods through the policy eviction subresource', async () => {
    const core = createMockApi({
      createNamespacedPodEviction: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const result = await kube.evictPod(CONTEXT_ID, 'default', 'web-1')

    assert.equal(result.success, true)
    assert.deepEqual(core.__calls.createNamespacedPodEviction[0][0], {
      name: 'web-1',
      namespace: 'default',
      body: {
        apiVersion: 'policy/v1',
        kind: 'Eviction',
        metadata: {
          name: 'web-1',
          namespace: 'default',
        },
      },
    })
  })

  it('does not expose secret values and creates secrets with stringData', async () => {
    const core = createMockApi({
      listSecretForAllNamespaces: async () => ({
        items: [{
          metadata: { name: 'secret-1', namespace: 'default', labels: { app: 'demo' } },
          type: 'Opaque',
          data: { token: 'c2VjcmV0', password: 'cGFzcw==' },
        }],
      }),
      createNamespacedSecret: async () => ({ metadata: { name: 'secret-2' } }),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const secrets = await kube.listSecrets(CONTEXT_ID)
    const result = await kube.createSecret(CONTEXT_ID, {
      name: 'secret-2',
      namespace: 'default',
      type: 'Opaque',
      data: [{ key: 'token', value: 'plain-secret' }],
    })

    assert.deepEqual(secrets, [{
      name: 'secret-1',
      namespace: 'default',
      type: 'Opaque',
      age: '',
      labels: { app: 'demo' },
      dataKeys: ['password', 'token'],
      dataSizes: { password: 4, token: 6 },
    }])
    assert.equal(result.success, true)
    assert.deepEqual(core.__calls.createNamespacedSecret[0][0].body.stringData, { token: 'plain-secret' })
    assert.equal(core.__calls.createNamespacedSecret[0][0].body.data, undefined)
  })

  it('includes namespace labels and finalizers for namespace drill-downs', async () => {
    const core = createMockApi({
      listNamespace: async () => ({
        items: [{
          metadata: { name: 'team-a', labels: { owner: 'platform' } },
          spec: { finalizers: ['kubernetes'] },
          status: { phase: 'Active' },
        }],
      }),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const namespaces = await kube.listNamespaces(CONTEXT_ID)

    assert.deepEqual(namespaces, [{
      name: 'team-a',
      status: 'Active',
      age: '',
      labels: { owner: 'platform' },
      finalizers: ['kubernetes'],
    }])
  })

  it('lists and reads component statuses', async () => {
    const component = {
      apiVersion: 'v1',
      kind: 'ComponentStatus',
      metadata: {
        name: 'scheduler',
        labels: { component: 'control-plane' },
      },
      conditions: [{
        type: 'Healthy',
        status: 'True',
        message: 'ok',
        error: '',
      }],
    }
    const core = createMockApi({
      listComponentStatus: async () => ({ items: [component] }),
      readComponentStatus: async () => component,
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listComponentStatuses(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'ComponentStatus', '', 'scheduler')

    assert.deepEqual(list, [{
      name: 'scheduler',
      status: 'Healthy',
      message: 'ok',
      error: '-',
      age: '',
      labels: { component: 'control-plane' },
      conditionDetails: [{
        type: 'Healthy',
        status: 'True',
        message: 'ok',
        error: '-',
      }],
    }])
    assert.match(yaml, /"kind": "ComponentStatus"/)
    assert.deepEqual(core.__calls.readComponentStatus[0][0], { name: 'scheduler' })
  })

  it('lists API resources from discovery and skips failed group versions', async () => {
    const core = createMockApi({
      getAPIResources: async () => ({
        groupVersion: 'v1',
        resources: [{
          name: 'pods',
          kind: 'Pod',
          namespaced: true,
          verbs: ['get', 'list', 'watch'],
          shortNames: ['po'],
          singularName: 'pod',
          categories: ['all'],
          storageVersionHash: 'hash-core',
        }],
      }),
    })
    const apis = createMockApi({
      getAPIVersions: async () => ({
        groups: [{
          name: 'apps',
          preferredVersion: { groupVersion: 'apps/v1', version: 'v1' },
          versions: [
            { groupVersion: 'apps/v1', version: 'v1' },
            { groupVersion: 'apps/v1beta1', version: 'v1beta1' },
          ],
        }],
      }),
    })
    const customObjects = createMockApi({
      getAPIResources: async ({ group, version }) => {
        if (version === 'v1beta1') {
          throw new Error('aggregated API unavailable')
        }
        return {
          groupVersion: `${group}/${version}`,
          resources: [{
            name: 'deployments',
            kind: 'Deployment',
            namespaced: true,
            verbs: ['get', 'list'],
            shortNames: ['deploy'],
            singularName: 'deployment',
            categories: ['all'],
            storageVersionHash: 'hash-apps',
          }],
        }
      },
    })
    setupApis({ core, apis, customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const resources = await kube.listAPIResources(CONTEXT_ID)
    const pods = resources.find((resource) => resource.name === 'pods')
    const deployments = resources.find((resource) => resource.name === 'deployments')

    assert.equal(resources.some((resource) => resource.version === 'v1beta1'), false)
    assert.deepEqual(pods, {
      name: 'pods',
      kind: 'Pod',
      apiGroup: 'core',
      version: 'v1',
      groupVersion: 'v1',
      namespaced: true,
      scope: 'Namespaced',
      verbs: 'get, list, watch',
      shortNames: 'po',
      categories: 'all',
      singularName: 'pod',
      storageVersionHash: 'hash-core',
      preferred: true,
      subresource: false,
    })
    assert.deepEqual(deployments, {
      name: 'deployments',
      kind: 'Deployment',
      apiGroup: 'apps',
      version: 'v1',
      groupVersion: 'apps/v1',
      namespaced: true,
      scope: 'Namespaced',
      verbs: 'get, list',
      shortNames: 'deploy',
      categories: 'all',
      singularName: 'deployment',
      storageVersionHash: 'hash-apps',
      preferred: true,
      subresource: false,
    })
    assert.deepEqual(customObjects.__calls.getAPIResources.map((call) => call[0]), [
      { group: 'apps', version: 'v1' },
      { group: 'apps', version: 'v1beta1' },
    ])
  })

  it('lists API groups from discovery', async () => {
    const coreDiscovery = createMockApi({
      getAPIVersions: async () => ({
        apiVersion: 'v1',
        kind: 'APIVersions',
        versions: ['v1'],
        serverAddressByClientCIDRs: [{
          clientCIDR: '0.0.0.0/0',
          serverAddress: 'https://cluster',
        }],
      }),
    })
    const apis = createMockApi({
      getAPIVersions: async () => ({
        groups: [
          {
            name: 'batch',
            apiVersion: 'v1',
            kind: 'APIGroup',
            preferredVersion: { groupVersion: 'batch/v1', version: 'v1' },
            versions: [{ groupVersion: 'batch/v1', version: 'v1' }],
          },
          {
            name: 'apps',
            apiVersion: 'v1',
            kind: 'APIGroup',
            preferredVersion: { groupVersion: 'apps/v1', version: 'v1' },
            versions: [
              { groupVersion: 'apps/v1', version: 'v1' },
              { groupVersion: 'apps/v1beta1', version: 'v1beta1' },
            ],
          },
        ],
      }),
    })
    setupApis({ coreDiscovery, apis })

    const kube = await importFresh('./src/main/kube.ts')
    const groups = await kube.listAPIGroups(CONTEXT_ID)

    assert.deepEqual(groups, [
      {
        name: 'core',
        preferredVersion: 'v1',
        versions: 'v1',
        versionCount: 1,
        apiVersion: 'v1',
        kind: 'APIVersions',
        serverAddressCount: 1,
        serverAddresses: '0.0.0.0/0->https://cluster',
      },
      {
        name: 'apps',
        preferredVersion: 'apps/v1',
        versions: 'apps/v1, apps/v1beta1',
        versionCount: 2,
        apiVersion: 'v1',
        kind: 'APIGroup',
        serverAddressCount: 0,
        serverAddresses: '-',
      },
      {
        name: 'batch',
        preferredVersion: 'batch/v1',
        versions: 'batch/v1',
        versionCount: 1,
        apiVersion: 'v1',
        kind: 'APIGroup',
        serverAddressCount: 0,
        serverAddresses: '-',
      },
    ])
  })

  it('keeps core API group when grouped discovery fails', async () => {
    const coreDiscovery = createMockApi({
      getAPIVersions: async () => ({
        versions: ['v1'],
      }),
    })
    const apis = createMockApi({
      getAPIVersions: async () => {
        throw new Error('grouped discovery unavailable')
      },
    })
    setupApis({ coreDiscovery, apis })

    const kube = await importFresh('./src/main/kube.ts')
    const groups = await kube.listAPIGroups(CONTEXT_ID)

    assert.deepEqual(groups.map((group) => group.name), ['core'])
    assert.equal(groups[0].preferredVersion, 'v1')
  })

  it('lists Kubernetes server version info', async () => {
    const version = createMockApi({
      getCode: async () => ({
        gitVersion: 'v1.34.1',
        major: '1',
        minor: '34',
        platform: 'linux/amd64',
        buildDate: '2026-01-02T03:04:05Z',
        gitCommit: 'abcdef1234567890',
        gitTreeState: 'clean',
        goVersion: 'go1.24.0',
        compiler: 'gc',
        emulationMajor: '1',
        emulationMinor: '33',
        minCompatibilityMajor: '1',
        minCompatibilityMinor: '32',
      }),
    })
    setupApis({ version })

    const kube = await importFresh('./src/main/kube.ts')
    const versions = await kube.listServerVersions(CONTEXT_ID)

    assert.deepEqual(versions, [{
      name: 'v1.34.1',
      gitVersion: 'v1.34.1',
      major: '1',
      minor: '34',
      platform: 'linux/amd64',
      buildDate: '2026-01-02T03:04:05Z',
      gitCommit: 'abcdef1234567890',
      gitTreeState: 'clean',
      goVersion: 'go1.24.0',
      compiler: 'gc',
      emulationVersion: '1.33',
      minCompatibilityVersion: '1.32',
    }])
    assert.equal(version.__calls.getCode.length, 1)
  })

  it('lists OpenID discovery configuration without exposing key material', async () => {
    const wellKnown = createMockApi({
      getServiceAccountIssuerOpenIDConfiguration: async () => JSON.stringify({
        issuer: 'https://kubernetes.default.svc',
        jwks_uri: 'https://kubernetes.default.svc/openid/v1/jwks',
        response_types_supported: ['id_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256', 'ES256'],
        claims_supported: ['sub', 'iss'],
      }),
    })
    const openid = createMockApi({
      getServiceAccountIssuerOpenIDKeyset: async () => JSON.stringify({
        keys: [
          {
            kid: 'key-1',
            kty: 'RSA',
            use: 'sig',
            n: 'public-modulus-not-listed',
          },
          {
            kid: 'key-2',
            kty: 'EC',
            use: 'sig',
            x: 'public-x-not-listed',
          },
        ],
      }),
    })
    setupApis({ wellKnown, openid })

    const kube = await importFresh('./src/main/kube.ts')
    const configs = await kube.listOpenIDConfigurations(CONTEXT_ID)

    assert.deepEqual(configs, [{
      name: 'https://kubernetes.default.svc',
      issuer: 'https://kubernetes.default.svc',
      jwksUri: 'https://kubernetes.default.svc/openid/v1/jwks',
      responseTypesSupported: 'id_token',
      subjectTypesSupported: 'public',
      signingAlgorithms: 'RS256, ES256',
      keyCount: 2,
      keyIds: 'key-1, key-2',
      keyTypes: 'RSA, EC',
      keyUses: 'sig',
      scopesSupported: '-',
      claimsSupported: 'sub, iss',
      rawConfigurationKeys: 'claims_supported, id_token_signing_alg_values_supported, issuer, jwks_uri, response_types_supported, subject_types_supported',
    }])
    assert.equal(JSON.stringify(configs).includes('public-modulus-not-listed'), false)
  })

  it('lists API server health checks', async () => {
    Health.prototype.readyz = async () => true
    Health.prototype.livez = async () => false
    Health.prototype.healthz = async () => {
      throw new Error('healthz unavailable')
    }

    const kube = await importFresh('./src/main/kube.ts')
    const checks = await kube.listAPIServerHealth(CONTEXT_ID)

    assert.deepEqual(checks, [
      {
        name: 'readyz',
        path: '/readyz',
        status: 'Healthy',
        healthy: true,
        message: 'ok',
      },
      {
        name: 'livez',
        path: '/livez',
        status: 'Unhealthy',
        healthy: false,
        message: 'check returned false',
      },
      {
        name: 'healthz',
        path: '/healthz',
        status: 'Error',
        healthy: false,
        message: 'healthz unavailable',
      },
    ])
  })

  it('lists self subject review user info', async () => {
    const authentication = createMockApi({
      createSelfSubjectReview: async ({ body }) => ({
        status: {
          userInfo: {
            username: 'alice@example.com',
            uid: 'uid-1',
            groups: ['devs', 'system:authenticated'],
            extra: {
              scopes: ['read', 'write'],
              tenant: ['platform'],
            },
          },
        },
        apiVersion: body.apiVersion,
        kind: body.kind,
      }),
    })
    setupApis({ authentication })

    const kube = await importFresh('./src/main/kube.ts')
    const reviews = await kube.listSelfSubjectReviews(CONTEXT_ID)

    assert.deepEqual(reviews, [{
      name: 'alice@example.com',
      username: 'alice@example.com',
      uid: 'uid-1',
      groups: 'devs, system:authenticated',
      groupCount: 2,
      extraKeys: 'scopes, tenant',
      extra: 'scopes=read, write; tenant=platform',
    }])
    assert.deepEqual(authentication.__calls.createSelfSubjectReview[0][0].body, {
      apiVersion: 'authentication.k8s.io/v1',
      kind: 'SelfSubjectReview',
    })
  })

  it('lists self subject access review checks for requested namespaces', async () => {
    const authorization = createMockApi({
      createSelfSubjectAccessReview: async ({ body }) => {
        const resource = body.spec?.resourceAttributes?.resource
        const denied = resource === 'secrets'
        return {
          status: {
            allowed: !denied,
            denied,
            reason: body.spec?.nonResourceAttributes ? 'non-resource check' : 'rbac policy',
            evaluationError: denied ? 'secret reads are restricted' : '',
          },
          spec: body.spec,
        }
      },
    })
    setupApis({ authorization })

    const kube = await importFresh('./src/main/kube.ts')
    const reviews = await kube.listSelfSubjectAccessReviews(CONTEXT_ID, ['default'])

    assert.equal(reviews.length, 19)
    assert.deepEqual(reviews.find((review) => review.name === 'list nodes'), {
      name: 'list nodes',
      namespace: '-',
      scope: 'Cluster',
      verb: 'list',
      apiGroup: 'core',
      resource: 'nodes',
      subresource: '-',
      resourceName: '-',
      path: '-',
      allowed: true,
      denied: false,
      status: 'Allowed',
      reason: 'rbac policy',
      evaluationError: '-',
    })
    assert.deepEqual(reviews.find((review) => review.name === 'get /readyz'), {
      name: 'get /readyz',
      namespace: '-',
      scope: 'NonResource',
      verb: 'get',
      apiGroup: '-',
      resource: '-',
      subresource: '-',
      resourceName: '-',
      path: '/readyz',
      allowed: true,
      denied: false,
      status: 'Allowed',
      reason: 'non-resource check',
      evaluationError: '-',
    })
    assert.deepEqual(reviews.find((review) => review.name === 'default/get secrets'), {
      name: 'default/get secrets',
      namespace: 'default',
      scope: 'Namespaced',
      verb: 'get',
      apiGroup: 'core',
      resource: 'secrets',
      subresource: '-',
      resourceName: '-',
      path: '-',
      allowed: false,
      denied: true,
      status: 'Denied',
      reason: 'rbac policy',
      evaluationError: 'secret reads are restricted',
    })
    assert.equal(
      authorization.__calls.createSelfSubjectAccessReview[0][0].body.spec.resourceAttributes.resource,
      'nodes',
    )
    assert.deepEqual(
      authorization.__calls.createSelfSubjectAccessReview[6][0].body.spec.nonResourceAttributes,
      { path: '/readyz', verb: 'get' },
    )
  })

  it('runs ad-hoc self subject access review checks', async () => {
    const calls = []
    const authorization = createMockApi({
      createSelfSubjectAccessReview: async ({ body }) => {
        calls.push(body)
        return {
          status: {
            allowed: !body.spec?.nonResourceAttributes,
            denied: Boolean(body.spec?.nonResourceAttributes),
            reason: 'checked',
          },
          spec: body.spec,
        }
      },
    })
    setupApis({ authorization })

    const kube = await importFresh('./src/main/kube.ts')
    const resourceReview = await kube.checkCanI(CONTEXT_ID, {
      verb: 'GET',
      namespace: 'default',
      apiGroup: 'apps',
      resource: 'deployments',
      subresource: 'scale',
      resourceName: 'web',
    })
    const nonResourceReview = await kube.checkCanI(CONTEXT_ID, {
      verb: 'get',
      nonResourceUrl: '/readyz',
    })

    assert.equal(resourceReview.name, 'default/get apps/deployments/scale web')
    assert.equal(resourceReview.status, 'Allowed')
    assert.equal(nonResourceReview.name, 'get /readyz')
    assert.equal(nonResourceReview.status, 'Denied')
    assert.deepEqual(calls[0].spec.resourceAttributes, {
      namespace: 'default',
      verb: 'get',
      group: 'apps',
      resource: 'deployments',
      subresource: 'scale',
      name: 'web',
    })
    assert.deepEqual(calls[1].spec.nonResourceAttributes, {
      path: '/readyz',
      verb: 'get',
    })
    await assert.rejects(() => kube.checkCanI(CONTEXT_ID, { verb: '', resource: 'pods' }), /verb/)
    await assert.rejects(() => kube.checkCanI(CONTEXT_ID, { verb: 'get', nonResourceUrl: 'readyz' }), /\/ 开头/)
  })

  it('lists self subject rules reviews for requested namespaces', async () => {
    const authorization = createMockApi({
      createSelfSubjectRulesReview: async ({ body }) => ({
        status: {
          incomplete: true,
          evaluationError: 'authorizer warning',
          resourceRules: [{
            verbs: ['get', 'list'],
            apiGroups: [''],
            resources: ['pods'],
            resourceNames: ['web'],
          }],
          nonResourceRules: [{
            verbs: ['get'],
            nonResourceURLs: ['/healthz'],
          }],
        },
        spec: body.spec,
      }),
    })
    setupApis({ authorization })

    const kube = await importFresh('./src/main/kube.ts')
    const rules = await kube.listSelfSubjectRulesReviews(CONTEXT_ID, ['default'])

    assert.deepEqual(rules, [
      {
        name: 'default/resource-1',
        namespace: 'default',
        type: 'Resource',
        verbs: 'get, list',
        apiGroups: 'core',
        resources: 'pods',
        resourceNames: 'web',
        nonResourceURLs: '-',
        incomplete: true,
        evaluationError: 'authorizer warning',
      },
      {
        name: 'default/nonresource-1',
        namespace: 'default',
        type: 'NonResource',
        verbs: 'get',
        apiGroups: '-',
        resources: '-',
        resourceNames: '-',
        nonResourceURLs: '/healthz',
        incomplete: true,
        evaluationError: 'authorizer warning',
      },
    ])
    assert.deepEqual(authorization.__calls.createSelfSubjectRulesReview[0][0].body.spec, { namespace: 'default' })
  })

  it('includes storage relationship metadata for PV, PVC, and StorageClass drill-downs', async () => {
    const persistentVolume = {
      apiVersion: 'v1',
      kind: 'PersistentVolume',
      metadata: { name: 'pv-1', labels: { tier: 'fast' } },
      spec: {
        capacity: { storage: '10Gi' },
        accessModes: ['ReadWriteOnce'],
        persistentVolumeReclaimPolicy: 'Retain',
        storageClassName: 'fast',
        claimRef: { namespace: 'default', name: 'data' },
        volumeMode: 'Filesystem',
        csi: { driver: 'ebs.csi.aws.com', volumeHandle: 'vol-1' },
      },
      status: { phase: 'Bound', reason: 'Available', message: 'ready' },
    }
    const core = createMockApi({
      listPersistentVolume: async () => ({
        items: [persistentVolume],
      }),
      readPersistentVolume: async () => persistentVolume,
      patchPersistentVolume: async () => persistentVolume,
      deletePersistentVolume: async () => ({}),
      listPersistentVolumeClaimForAllNamespaces: async () => ({
        items: [{
          metadata: { name: 'data', namespace: 'default', labels: { app: 'web' } },
          spec: {
            volumeName: 'pv-1',
            volumeMode: 'Filesystem',
            storageClassName: 'fast',
            accessModes: ['ReadWriteOnce'],
            resources: { requests: { storage: '10Gi' } },
          },
          status: { phase: 'Bound', capacity: { storage: '10Gi' } },
        }],
      }),
    })
    const storageClassResource = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: {
        name: 'fast',
        labels: { tier: 'fast' },
        annotations: { 'storageclass.kubernetes.io/is-default-class': 'true' },
      },
      provisioner: 'ebs.csi.aws.com',
      reclaimPolicy: 'Delete',
      volumeBindingMode: 'WaitForFirstConsumer',
      allowVolumeExpansion: true,
      parameters: { type: 'gp3' },
      mountOptions: ['discard'],
    }
    const storage = createMockApi({
      listStorageClass: async () => ({
        items: [storageClassResource],
      }),
      readStorageClass: async () => storageClassResource,
      patchStorageClass: async () => storageClassResource,
      deleteStorageClass: async () => ({}),
    })
    setupApis({ core, storage })

    const kube = await importFresh('./src/main/kube.ts')
    const pvs = await kube.listPersistentVolumes(CONTEXT_ID)
    const pvcs = await kube.listPersistentVolumeClaims(CONTEXT_ID)
    const storageClasses = await kube.listStorageClasses(CONTEXT_ID)
    const pvYaml = await kube.getResourceYaml(CONTEXT_ID, 'PersistentVolume', '', 'pv-1')
    const pvApply = await kube.applyYaml(CONTEXT_ID, pvYaml)
    const pvDeleted = await kube.deleteResource(CONTEXT_ID, 'PersistentVolume', '', 'pv-1')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'StorageClass', '', 'fast')
    const apply = await kube.applyYaml(CONTEXT_ID, yaml)
    const deleted = await kube.deleteResource(CONTEXT_ID, 'StorageClass', '', 'fast')

    assert.deepEqual(pvs, [{
      name: 'pv-1',
      capacity: '10Gi',
      accessModes: 'ReadWriteOnce',
      reclaimPolicy: 'Retain',
      status: 'Bound',
      storageClass: 'fast',
      age: '',
      labels: { tier: 'fast' },
      claim: 'default/data',
      volumeMode: 'Filesystem',
      source: 'CSI ebs.csi.aws.com',
      reason: 'Available',
      message: 'ready',
    }])
    assert.deepEqual(pvcs, [{
      name: 'data',
      namespace: 'default',
      status: 'Bound',
      capacity: '10Gi',
      accessModes: 'ReadWriteOnce',
      storageClass: 'fast',
      age: '',
      labels: { app: 'web' },
      volumeName: 'pv-1',
      volumeMode: 'Filesystem',
      requestedCapacity: '10Gi',
    }])
    assert.deepEqual(storageClasses, [{
      name: 'fast',
      provisioner: 'ebs.csi.aws.com',
      reclaimPolicy: 'Delete',
      volumeBindingMode: 'WaitForFirstConsumer',
      age: '',
      labels: { tier: 'fast' },
      defaultClass: true,
      allowVolumeExpansion: true,
      parameters: 'type=gp3',
      mountOptions: 'discard',
    }])
    assert.match(pvYaml, /"kind": "PersistentVolume"/)
    assert.equal(pvApply.success, true)
    assert.equal(pvDeleted.success, true)
    assert.equal(core.__calls.deletePersistentVolume[0][0].name, 'pv-1')
    assert.match(yaml, /"kind": "StorageClass"/)
    assert.equal(apply.success, true)
    assert.equal(deleted.success, true)
    assert.equal(storage.__calls.deleteStorageClass[0][0].name, 'fast')
  })

  it('includes RBAC rules, subjects, and role refs for RBAC drill-downs', async () => {
    const rbac = createMockApi({
      listNamespacedRole: async () => ({
        items: [{
          metadata: { name: 'pod-reader', namespace: 'default', labels: { app: 'demo' } },
          rules: [{
            verbs: ['get', 'list'],
            apiGroups: [''],
            resources: ['pods'],
            resourceNames: ['web'],
          }],
        }],
      }),
      listRoleBindingForAllNamespaces: async () => ({
        items: [{
          metadata: { name: 'read-pods', namespace: 'default', labels: { app: 'demo' } },
          roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'pod-reader' },
          subjects: [{ kind: 'ServiceAccount', name: 'viewer', namespace: 'default' }],
        }],
      }),
      listClusterRole: async () => ({
        items: [{
          metadata: { name: 'node-reader', labels: { scope: 'cluster' } },
          aggregationRule: { clusterRoleSelectors: [{ matchLabels: { aggregate: 'true' } }] },
          rules: [{
            verbs: ['get'],
            apiGroups: [''],
            resources: ['nodes'],
          }],
        }],
      }),
      listClusterRoleBinding: async () => ({
        items: [{
          metadata: { name: 'read-nodes', labels: { scope: 'cluster' } },
          roleRef: { apiGroup: 'rbac.authorization.k8s.io', kind: 'ClusterRole', name: 'node-reader' },
          subjects: [{ kind: 'Group', name: 'ops', apiGroup: 'rbac.authorization.k8s.io' }],
        }],
      }),
      deleteNamespacedRole: async () => ({}),
      deleteNamespacedRoleBinding: async () => ({}),
      deleteClusterRole: async () => ({}),
      deleteClusterRoleBinding: async () => ({}),
    })
    setupApis({ rbac })

    const kube = await importFresh('./src/main/kube.ts')
    const roles = await kube.listRoles(CONTEXT_ID, 'default')
    const roleBindings = await kube.listRoleBindings(CONTEXT_ID)
    const clusterRoles = await kube.listClusterRoles(CONTEXT_ID)
    const clusterRoleBindings = await kube.listClusterRoleBindings(CONTEXT_ID)
    const deletedRole = await kube.deleteResource(CONTEXT_ID, 'Role', 'default', 'pod-reader')
    const deletedRoleBinding = await kube.deleteResource(CONTEXT_ID, 'RoleBinding', 'default', 'read-pods')
    const deletedClusterRole = await kube.deleteResource(CONTEXT_ID, 'ClusterRole', '', 'node-reader')
    const deletedClusterRoleBinding = await kube.deleteResource(CONTEXT_ID, 'ClusterRoleBinding', '', 'read-nodes')

    assert.deepEqual(roles, [{
      name: 'pod-reader',
      namespace: 'default',
      rules: 1,
      age: '',
      labels: { app: 'demo' },
      ruleDetails: [{
        verbs: 'get, list',
        apiGroups: 'core',
        resources: 'pods',
        resourceNames: 'web',
        nonResourceURLs: '-',
      }],
    }])
    assert.deepEqual(roleBindings, [{
      name: 'read-pods',
      namespace: 'default',
      roleRef: 'Role/pod-reader',
      subjects: 1,
      age: '',
      labels: { app: 'demo' },
      roleRefKind: 'Role',
      roleRefName: 'pod-reader',
      roleRefApiGroup: 'rbac.authorization.k8s.io',
      subjectDetails: [{
        kind: 'ServiceAccount',
        name: 'viewer',
        namespace: 'default',
        apiGroup: undefined,
      }],
    }])
    assert.deepEqual(clusterRoles, [{
      name: 'node-reader',
      rules: 1,
      age: '',
      labels: { scope: 'cluster' },
      ruleDetails: [{
        verbs: 'get',
        apiGroups: 'core',
        resources: 'nodes',
        resourceNames: '-',
        nonResourceURLs: '-',
      }],
      aggregationRule: 'aggregate=true',
    }])
    assert.deepEqual(clusterRoleBindings, [{
      name: 'read-nodes',
      roleRef: 'ClusterRole/node-reader',
      subjects: 1,
      age: '',
      labels: { scope: 'cluster' },
      roleRefKind: 'ClusterRole',
      roleRefName: 'node-reader',
      roleRefApiGroup: 'rbac.authorization.k8s.io',
      subjectDetails: [{
        kind: 'Group',
        name: 'ops',
        namespace: undefined,
        apiGroup: 'rbac.authorization.k8s.io',
      }],
    }])
    assert.equal(deletedRole.success, true)
    assert.equal(deletedRoleBinding.success, true)
    assert.equal(deletedClusterRole.success, true)
    assert.equal(deletedClusterRoleBinding.success, true)
    assert.equal(rbac.__calls.deleteNamespacedRole[0][0].name, 'pod-reader')
    assert.equal(rbac.__calls.deleteNamespacedRoleBinding[0][0].name, 'read-pods')
    assert.equal(rbac.__calls.deleteClusterRole[0][0].name, 'node-reader')
    assert.equal(rbac.__calls.deleteClusterRoleBinding[0][0].name, 'read-nodes')
  })

  it('includes service account metadata for identity drill-downs', async () => {
    const serviceAccount = {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: 'viewer',
        namespace: 'default',
        labels: { app: 'demo' },
      },
      secrets: [{ name: 'viewer-token' }],
      imagePullSecrets: [{ name: 'registry-creds' }],
      automountServiceAccountToken: false,
    }
    const core = createMockApi({
      listNamespacedServiceAccount: async () => ({ items: [serviceAccount] }),
      readNamespacedServiceAccount: async () => serviceAccount,
      patchNamespacedServiceAccount: async () => serviceAccount,
      createNamespacedServiceAccount: async () => serviceAccount,
      deleteNamespacedServiceAccount: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listServiceAccounts(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'ServiceAccount', 'default', 'viewer')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: ServiceAccount',
      'metadata:',
      '  name: viewer',
      '  namespace: default',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'ServiceAccount', 'default', 'viewer')

    assert.deepEqual(list, [{
      name: 'viewer',
      namespace: 'default',
      secrets: 1,
      age: '',
      labels: { app: 'demo' },
      secretNames: ['viewer-token'],
      imagePullSecretNames: ['registry-creds'],
      automountServiceAccountToken: false,
    }])
    assert.match(yaml, /"kind": "ServiceAccount"/)
    assert.equal(apply.success, true)
    assert.equal(deleted.success, true)
    assert.equal(await patchContentType(core.__calls.patchNamespacedServiceAccount[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(core.__calls.deleteNamespacedServiceAccount[0][0].name, 'viewer')
  })

  it('adds pod CPU and memory usage from metrics-server when listing pods', async () => {
    const pod = {
      metadata: { name: 'web-1', namespace: 'default' },
      spec: {
        nodeName: 'node-1',
        serviceAccountName: 'viewer',
        priorityClassName: 'platform-critical',
        runtimeClassName: 'kata',
        volumes: [{ name: 'data', persistentVolumeClaim: { claimName: 'data-pvc' } }],
        containers: [
          { name: 'web', image: 'nginx:1.27', ports: [{ containerPort: 8080 }] },
          { name: 'sidecar', image: 'busybox:1.36' },
        ],
      },
      status: {
        phase: 'Running',
        podIP: '10.0.0.10',
        hostIP: '192.168.0.10',
        qosClass: 'Burstable',
        containerStatuses: [
          { name: 'web', image: 'nginx:1.27', restartCount: 1, ready: true, state: { running: {} } },
          { name: 'sidecar', image: 'busybox:1.36', restartCount: 2, ready: false, state: { waiting: { reason: 'CrashLoopBackOff' } } },
        ],
      },
    }
    const core = createMockApi({
      listNamespacedPod: async () => ({ items: [pod] }),
      readNamespacedPod: async () => pod,
    })
    const customObjects = createMockApi({
      listNamespacedCustomObject: async () => ({
        items: [{
          metadata: { name: 'web-1', namespace: 'default' },
          containers: [
            { name: 'web', usage: { cpu: '100m', memory: '32Mi' } },
            { name: 'sidecar', usage: { cpu: '25m', memory: '32Mi' } },
          ],
        }],
      }),
    })
    setupApis({ core, customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const pods = await kube.listPods(CONTEXT_ID, 'default')
    const detail = await kube.getPodDetail(CONTEXT_ID, 'default', 'web-1')

    assert.deepEqual(pods, [{
      name: 'web-1',
      namespace: 'default',
      status: 'Running',
      nodeName: 'node-1',
      restarts: 3,
      cpu: '125m',
      memory: '64Mi',
      age: '',
      serviceAccount: 'viewer',
      priority: 'platform-critical',
      runtimeClass: 'kata',
      pvcClaims: ['data-pvc'],
    }])
    assert.equal(detail.cpu, '125m')
    assert.equal(detail.memory, '64Mi')
    assert.deepEqual(detail.pvcClaims, ['data-pvc'])
    assert.equal(detail.runtimeClass, 'kata')
    assert.deepEqual(detail.containers, [
      {
        name: 'web',
        image: 'nginx:1.27',
        restartCount: 1,
        ready: true,
        state: 'Running',
        cpu: '100m',
        memory: '32Mi',
        ports: [8080],
      },
      {
        name: 'sidecar',
        image: 'busybox:1.36',
        restartCount: 2,
        ready: false,
        state: 'Waiting: CrashLoopBackOff',
        cpu: '25m',
        memory: '32Mi',
        ports: [],
      },
    ])
    assert.deepEqual(customObjects.__calls.listNamespacedCustomObject[0][0], {
      group: 'metrics.k8s.io',
      version: 'v1beta1',
      namespace: 'default',
      plural: 'pods',
    })
    assert.equal(customObjects.__calls.listNamespacedCustomObject.length, 2)
  })

  it('reads previous pod logs when requested', async () => {
    const core = createMockApi({
      readNamespacedPodLog: async () => 'previous line',
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const logs = await kube.getPodLogs(CONTEXT_ID, 'default', 'web-1', 'app', 50, true, true)

    assert.equal(logs, 'previous line')
    assert.deepEqual(core.__calls.readNamespacedPodLog[0][0], {
      name: 'web-1',
      namespace: 'default',
      container: 'app',
      tailLines: 50,
      previous: true,
      timestamps: true,
    })
  })

  it('adds node CPU and memory usage from metrics-server when listing nodes', async () => {
    const node = {
      metadata: {
        name: 'node-1',
        labels: { 'node-role.kubernetes.io/control-plane': '' },
      },
      spec: { unschedulable: false },
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
        nodeInfo: { kubeletVersion: 'v1.30.0' },
        addresses: [],
      },
    }
    const core = createMockApi({
      listNode: async () => ({ items: [node] }),
    })
    const customObjects = createMockApi({
      listClusterCustomObject: async () => ({
        items: [{
          metadata: { name: 'node-1' },
          usage: { cpu: '1250m', memory: '2048Mi' },
        }],
      }),
    })
    setupApis({ core, customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const nodes = await kube.listNodes(CONTEXT_ID)

    assert.deepEqual(nodes, [{
      name: 'node-1',
      status: 'Ready',
      version: 'v1.30.0',
      roles: 'control-plane',
      cpuUsage: '1250m',
      memoryUsage: '2Gi',
      age: '',
      addresses: [],
      os: undefined,
      architecture: undefined,
      kernelVersion: undefined,
      containerRuntime: undefined,
      capacity: undefined,
      labels: { 'node-role.kubernetes.io/control-plane': '' },
      taints: [],
      conditions: [{ type: 'Ready', status: 'True', reason: undefined, message: undefined, lastTransitionTime: undefined }],
      podCIDR: undefined,
      providerID: undefined,
      unschedulable: false,
    }])
    assert.deepEqual(customObjects.__calls.listClusterCustomObject[0][0], {
      group: 'metrics.k8s.io',
      version: 'v1beta1',
      plural: 'nodes',
    })
  })

  it('includes ReplicaSet owner and selector metadata for workload drill-downs', async () => {
    const replicaSet = {
      metadata: {
        name: 'web-7d9c6d',
        namespace: 'default',
        labels: { app: 'web', 'pod-template-hash': '7d9c6d' },
        ownerReferences: [{ kind: 'Deployment', name: 'web', controller: true }],
      },
      spec: {
        replicas: 3,
        selector: { matchLabels: { app: 'web' } },
      },
      status: {
        readyReplicas: 2,
        fullyLabeledReplicas: 3,
        availableReplicas: 2,
      },
    }
    const apps = createMockApi({
      listNamespacedReplicaSet: async () => ({ items: [replicaSet] }),
    })
    setupApis({ apps })

    const kube = await importFresh('./src/main/kube.ts')
    const replicaSets = await kube.listReplicaSets(CONTEXT_ID, 'default')

    assert.deepEqual(replicaSets, [{
      name: 'web-7d9c6d',
      namespace: 'default',
      replicas: 3,
      readyReplicas: 2,
      age: '',
      labels: { app: 'web', 'pod-template-hash': '7d9c6d' },
      selector: { app: 'web' },
      owner: 'Deployment/web',
      fullyLabeledReplicas: 3,
      availableReplicas: 2,
    }])
  })

  it('includes Job owner, selector, and pod labels for workload drill-downs', async () => {
    const job = {
      metadata: {
        name: 'backup-28793400',
        namespace: 'default',
        labels: { job: 'backup' },
        ownerReferences: [{ kind: 'CronJob', name: 'backup', controller: true }],
      },
      spec: {
        completions: 1,
        suspend: false,
        selector: { matchLabels: { 'job-name': 'backup-28793400' } },
      },
      status: {
        succeeded: 1,
      },
    }
    const pod = {
      metadata: {
        name: 'backup-28793400-pod',
        namespace: 'default',
        labels: { 'job-name': 'backup-28793400' },
      },
      status: { phase: 'Succeeded' },
    }
    const batch = createMockApi({
      listNamespacedJob: async () => ({ items: [job] }),
    })
    const core = createMockApi({
      listNamespacedPod: async () => ({ items: [pod] }),
    })
    const customObjects = createMockApi({
      listNamespacedCustomObject: async () => ({ items: [] }),
    })
    setupApis({ batch, core, customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const jobs = await kube.listJobs(CONTEXT_ID, 'default')
    const pods = await kube.listPods(CONTEXT_ID, 'default')

    assert.deepEqual(jobs, [{
      name: 'backup-28793400',
      namespace: 'default',
      completions: 1,
      succeeded: 1,
      active: 0,
      failed: 0,
      suspend: false,
      age: '',
      labels: { job: 'backup' },
      selector: { 'job-name': 'backup-28793400' },
      owner: 'CronJob/backup',
    }])
    assert.deepEqual(pods, [{
      name: 'backup-28793400-pod',
      namespace: 'default',
      status: 'Succeeded',
      nodeName: '',
      restarts: 0,
      cpu: '-',
      memory: '-',
      age: '',
      labels: { 'job-name': 'backup-28793400' },
    }])
  })

  it('updates Job and CronJob suspension with strategic merge patch', async () => {
    const batch = createMockApi({
      patchNamespacedJob: async () => ({}),
      patchNamespacedCronJob: async () => ({}),
    })
    setupApis({ batch })

    const kube = await importFresh('./src/main/kube.ts')
    const suspendedJob = await kube.updateJobSuspension(CONTEXT_ID, 'Job', 'default', 'backup-1', true)
    const resumedCronJob = await kube.updateJobSuspension(CONTEXT_ID, 'CronJob', 'default', 'backup', false)

    assert.equal(suspendedJob.success, true)
    assert.equal(resumedCronJob.success, true)
    assert.deepEqual(batch.__calls.patchNamespacedJob[0][0], {
      name: 'backup-1',
      namespace: 'default',
      body: { spec: { suspend: true } },
    })
    assert.deepEqual(batch.__calls.patchNamespacedCronJob[0][0], {
      name: 'backup',
      namespace: 'default',
      body: { spec: { suspend: false } },
    })
    assert.equal(await patchContentType(batch.__calls.patchNamespacedJob[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(batch.__calls.patchNamespacedCronJob[0][1]), PatchStrategy.StrategicMergePatch)
  })

  it('triggers a CronJob by creating a Job from the jobTemplate', async () => {
    const cronJob = {
      metadata: {
        name: 'backup',
        namespace: 'default',
      },
      spec: {
        jobTemplate: {
          metadata: {
            labels: { app: 'backup' },
            annotations: { 'k7s.io/source': 'manual' },
          },
          spec: {
            template: {
              spec: {
                restartPolicy: 'Never',
                containers: [{ name: 'backup', image: 'busybox', command: ['date'] }],
              },
            },
          },
        },
      },
    }
    const batch = createMockApi({
      readNamespacedCronJob: async () => cronJob,
      createNamespacedJob: async ({ body }) => ({
        ...body,
        metadata: {
          ...body.metadata,
          name: 'backup-manual-abcde',
        },
      }),
    })
    setupApis({ batch })

    const kube = await importFresh('./src/main/kube.ts')
    const result = await kube.triggerCronJob(CONTEXT_ID, 'default', 'backup')

    assert.equal(result.success, true)
    assert.equal(result.name, 'backup-manual-abcde')
    assert.equal(result.namespace, 'default')
    assert.deepEqual(batch.__calls.readNamespacedCronJob[0][0], {
      namespace: 'default',
      name: 'backup',
    })
    assert.deepEqual(batch.__calls.createNamespacedJob[0][0], {
      namespace: 'default',
      body: {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          generateName: 'backup-manual-',
          namespace: 'default',
          labels: { app: 'backup' },
          annotations: { 'k7s.io/source': 'manual' },
        },
        spec: cronJob.spec.jobTemplate.spec,
      },
    })
  })

  it('drains only controller-managed pods without local storage', async () => {
    const pods = [
      {
        metadata: {
          name: 'safe',
          namespace: 'default',
          ownerReferences: [{ kind: 'ReplicaSet', controller: true }],
        },
        spec: {},
      },
      {
        metadata: {
          name: 'daemon',
          namespace: 'default',
          ownerReferences: [{ kind: 'DaemonSet', controller: true }],
        },
        spec: {},
      },
      {
        metadata: { name: 'bare', namespace: 'default' },
        spec: {},
      },
      {
        metadata: {
          name: 'local',
          namespace: 'default',
          ownerReferences: [{ kind: 'ReplicaSet', controller: true }],
        },
        spec: { volumes: [{ name: 'scratch', emptyDir: {} }] },
      },
      {
        metadata: {
          name: 'mirror',
          namespace: 'kube-system',
          annotations: { 'kubernetes.io/config.mirror': 'abc' },
        },
        spec: {},
      },
    ]
    const core = createMockApi({
      patchNode: async () => ({}),
      listPodForAllNamespaces: async () => ({ items: pods }),
      createNamespacedPodEviction: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const result = await kube.drainNode(CONTEXT_ID, 'node-1')

    assert.equal(result.success, true)
    assert.match(result.message, /已驱逐 1 个 Pod/)
    assert.match(result.message, /跳过 4 个 Pod/)
    assert.deepEqual(core.__calls.createNamespacedPodEviction.map(([arg]) => `${arg.namespace}/${arg.name}`), [
      'default/safe',
    ])
  })

  it('applies supported YAML with strategic merge patch and rejects unknown resource kinds', async () => {
    const apps = createMockApi({
      patchNamespacedDeployment: async () => ({ metadata: { name: 'web' } }),
      createNamespacedDeployment: async () => ({ metadata: { name: 'web' } }),
    })
    const apiextensions = createMockApi({
      listCustomResourceDefinition: async () => ({ items: [] }),
    })
    setupApis({ apps, apiextensions })

    const kube = await importFresh('./src/main/kube.ts')
    const ok = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: web',
      '  namespace: default',
      'spec: {}',
      '',
    ].join('\n'))
    const unsupported = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: example.com/v1',
      'kind: Widget',
      'metadata:',
      '  name: demo',
      '',
    ].join('\n'))

    assert.equal(ok.success, true)
    assert.equal(await patchContentType(apps.__calls.patchNamespacedDeployment[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(unsupported.success, false)
    assert.match(unsupported.message, /暂不支持 Apply example.com\/v1\/Widget/)
  })

  it('lists latest Helm releases from metadata without exposing release payloads', async () => {
    const core = createMockApi({
      listSecretForAllNamespaces: async () => ({
        items: [
          {
            type: 'helm.sh/release.v1',
            metadata: {
              name: 'sh.helm.release.v1.web.v1',
              namespace: 'default',
              creationTimestamp: new Date('2024-01-01T00:00:00.000Z'),
              labels: {
                owner: 'helm',
                name: 'web',
                version: '1',
                status: 'superseded',
                modifiedAt: '1704067200',
              },
            },
            data: { release: 'encoded-sensitive-release-v1' },
          },
          {
            type: 'helm.sh/release.v1',
            metadata: {
              name: 'sh.helm.release.v1.web.v2',
              namespace: 'default',
              creationTimestamp: new Date('2024-01-02T00:00:00.000Z'),
              labels: {
                owner: 'helm',
                name: 'web',
                version: '2',
                status: 'deployed',
                chart: 'web-1.2.3',
                appVersion: '1.2.3',
                modifiedAt: '1704153600',
              },
            },
            data: { release: 'encoded-sensitive-release-v2' },
          },
        ],
      }),
      listConfigMapForAllNamespaces: async () => ({
        items: [{
          metadata: {
            name: 'sh.helm.release.v1.worker.v1',
            namespace: 'jobs',
            creationTimestamp: new Date('2024-01-03T00:00:00.000Z'),
            labels: {
              owner: 'helm',
              name: 'worker',
              version: '1',
              status: 'failed',
            },
          },
          data: { release: 'plain-sensitive-release' },
        }],
      }),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const releases = await kube.listHelmReleases(CONTEXT_ID)

    assert.deepEqual(releases.map(({ age, ...release }) => release), [
      {
        name: 'web',
        namespace: 'default',
        revision: 2,
        status: 'deployed',
        chart: 'web-1.2.3',
        appVersion: '1.2.3',
        updated: '2024-01-02 00:00:00',
        storage: 'Secret',
        labels: {
          owner: 'helm',
          name: 'web',
          version: '2',
          status: 'deployed',
          chart: 'web-1.2.3',
          appVersion: '1.2.3',
          modifiedAt: '1704153600',
        },
      },
      {
        name: 'worker',
        namespace: 'jobs',
        revision: 1,
        status: 'failed',
        chart: '-',
        appVersion: '-',
        updated: '2024-01-03 00:00:00',
        storage: 'ConfigMap',
        labels: {
          owner: 'helm',
          name: 'worker',
          version: '1',
          status: 'failed',
        },
      },
    ])
    assert.doesNotMatch(JSON.stringify(releases), /sensitive-release/)
  })

  it('lists, applies, reads, and deletes network policies', async () => {
    const policy = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: 'allow-web',
        namespace: 'default',
        labels: { app: 'demo' },
      },
      spec: {
        podSelector: { matchLabels: { app: 'web' } },
        policyTypes: ['Ingress', 'Egress'],
        ingress: [{
          from: [{
            namespaceSelector: { matchLabels: { team: 'platform' } },
            podSelector: { matchLabels: { role: 'api' } },
          }],
          ports: [{ protocol: 'TCP', port: 443 }],
        }],
        egress: [{
          to: [{
            ipBlock: {
              cidr: '10.0.0.0/24',
              except: ['10.0.0.10/32'],
            },
          }],
          ports: [{ protocol: 'UDP', port: 53 }],
        }],
      },
    }
    const networking = createMockApi({
      listNamespacedNetworkPolicy: async () => ({ items: [policy] }),
      readNamespacedNetworkPolicy: async () => policy,
      patchNamespacedNetworkPolicy: async () => policy,
      createNamespacedNetworkPolicy: async () => policy,
      deleteNamespacedNetworkPolicy: async () => ({}),
    })
    setupApis({ networking })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listNetworkPolicies(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'NetworkPolicy', 'default', 'allow-web')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: networking.k8s.io/v1',
      'kind: NetworkPolicy',
      'metadata:',
      '  name: allow-web',
      '  namespace: default',
      'spec:',
      '  podSelector:',
      '    matchLabels:',
      '      app: web',
      '  policyTypes:',
      '  - Ingress',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'NetworkPolicy', 'default', 'allow-web')

    assert.deepEqual(list, [{
      name: 'allow-web',
      namespace: 'default',
      podSelector: 'app=web',
      selector: { app: 'web' },
      policyTypes: 'Ingress, Egress',
      ingressRules: 1,
      egressRules: 1,
      age: '',
      labels: { app: 'demo' },
      ruleDetails: [{
        direction: 'Ingress',
        peers: 'NamespaceSelector: team=platform; PodSelector: role=api',
        ports: 'TCP/443',
      }, {
        direction: 'Egress',
        peers: 'IPBlock: 10.0.0.0/24 except 10.0.0.10/32',
        ports: 'UDP/53',
      }],
    }])
    assert.match(yaml, /"kind": "NetworkPolicy"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(networking.__calls.patchNamespacedNetworkPolicy[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(networking.__calls.deleteNamespacedNetworkPolicy[0][0], {
      namespace: 'default',
      name: 'allow-web',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes IP address management resources', async () => {
    const ipAddress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'IPAddress',
      metadata: {
        name: '10.0.0.10',
        labels: { managed: 'true' },
      },
      spec: {
        parentRef: {
          group: '',
          resource: 'services',
          namespace: 'default',
          name: 'web',
        },
      },
    }
    const serviceCIDR = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'ServiceCIDR',
      metadata: {
        name: 'kubernetes',
        labels: { scope: 'cluster' },
      },
      spec: {
        cidrs: ['10.0.0.0/24', 'fd00::/108'],
      },
      status: {
        conditions: [{
          type: 'Ready',
          status: 'True',
          reason: 'Ready',
          message: 'allocated',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        }],
      },
    }
    const networking = createMockApi({
      listIPAddress: async () => ({ items: [ipAddress] }),
      listServiceCIDR: async () => ({ items: [serviceCIDR] }),
      readIPAddress: async () => ipAddress,
      readServiceCIDR: async () => serviceCIDR,
      patchIPAddress: async () => ipAddress,
      patchServiceCIDR: async () => serviceCIDR,
      createIPAddress: async () => ipAddress,
      createServiceCIDR: async () => serviceCIDR,
      deleteIPAddress: async () => ({}),
      deleteServiceCIDR: async () => ({}),
    })
    setupApis({ networking })

    const kube = await importFresh('./src/main/kube.ts')
    const ipAddresses = await kube.listIPAddresses(CONTEXT_ID)
    const serviceCIDRs = await kube.listServiceCIDRs(CONTEXT_ID)
    const ipYaml = await kube.getResourceYaml(CONTEXT_ID, 'IPAddress', '', '10.0.0.10')
    const serviceCIDRYaml = await kube.getResourceYaml(CONTEXT_ID, 'ServiceCIDR', '', 'kubernetes')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: networking.k8s.io/v1',
      'kind: IPAddress',
      'metadata:',
      '  name: 10.0.0.10',
      'spec:',
      '  parentRef:',
      '    resource: services',
      '    namespace: default',
      '    name: web',
      '---',
      'apiVersion: networking.k8s.io/v1',
      'kind: ServiceCIDR',
      'metadata:',
      '  name: kubernetes',
      'spec:',
      '  cidrs:',
      '  - 10.0.0.0/24',
      '',
    ].join('\n'))
    const deletedIP = await kube.deleteResource(CONTEXT_ID, 'IPAddress', '', '10.0.0.10')
    const deletedCIDR = await kube.deleteResource(CONTEXT_ID, 'ServiceCIDR', '', 'kubernetes')

    assert.deepEqual(ipAddresses, [{
      name: '10.0.0.10',
      parentRef: 'services/default/web',
      parentGroup: '-',
      parentResource: 'services',
      parentNamespace: 'default',
      parentName: 'web',
      age: '',
      labels: { managed: 'true' },
    }])
    assert.deepEqual(serviceCIDRs, [{
      name: 'kubernetes',
      cidrs: '10.0.0.0/24, fd00::/108',
      cidrCount: 2,
      ready: 'True',
      conditions: [{
        type: 'Ready',
        status: 'True',
        reason: 'Ready',
        message: 'allocated',
        lastTransitionTime: '2026-01-01 00:00:00',
      }],
      age: '',
      labels: { scope: 'cluster' },
    }])
    assert.match(ipYaml, /"kind": "IPAddress"/)
    assert.match(serviceCIDRYaml, /"kind": "ServiceCIDR"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(networking.__calls.patchIPAddress[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(networking.__calls.patchServiceCIDR[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deletedIP.success, true)
    assert.equal(deletedCIDR.success, true)
    assert.deepEqual(networking.__calls.deleteIPAddress[0][0], {
      name: '10.0.0.10',
      body: {},
    })
    assert.deepEqual(networking.__calls.deleteServiceCIDR[0][0], {
      name: 'kubernetes',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes ingress classes', async () => {
    const ingressClass = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'IngressClass',
      metadata: {
        name: 'nginx',
        annotations: {
          'ingressclass.kubernetes.io/is-default-class': 'true',
        },
        labels: { app: 'ingress-nginx' },
      },
      spec: {
        controller: 'k8s.io/ingress-nginx',
        parameters: {
          apiGroup: 'k8s.nginx.org',
          kind: 'NginxIngressConfig',
          namespace: 'ingress-nginx',
          name: 'nginx-config',
        },
      },
    }
    const networking = createMockApi({
      listIngressClass: async () => ({ items: [ingressClass] }),
      readIngressClass: async () => ingressClass,
      patchIngressClass: async () => ingressClass,
      createIngressClass: async () => ingressClass,
      deleteIngressClass: async () => ({}),
    })
    setupApis({ networking })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listIngressClasses(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'IngressClass', '', 'nginx')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: networking.k8s.io/v1',
      'kind: IngressClass',
      'metadata:',
      '  name: nginx',
      'spec:',
      '  controller: k8s.io/ingress-nginx',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'IngressClass', '', 'nginx')

    assert.deepEqual(list, [{
      name: 'nginx',
      controller: 'k8s.io/ingress-nginx',
      parameters: 'k8s.nginx.org/NginxIngressConfig/ingress-nginx/nginx-config',
      default: true,
      age: '',
      labels: { app: 'ingress-nginx' },
      parameterApiGroup: 'k8s.nginx.org',
      parameterKind: 'NginxIngressConfig',
      parameterNamespace: 'ingress-nginx',
      parameterName: 'nginx-config',
      parameterScope: undefined,
    }])
    assert.match(yaml, /"kind": "IngressClass"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(networking.__calls.patchIngressClass[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(networking.__calls.deleteIngressClass[0][0], {
      name: 'nginx',
      body: {},
    })
  })

  it('lists ingress metadata with rules, tls, and default backend details', async () => {
    const ingress = {
      metadata: {
        name: 'web',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        ingressClassName: 'nginx',
        defaultBackend: {
          service: {
            name: 'fallback',
            port: { number: 80 },
          },
        },
        rules: [{
          host: 'app.example.com',
          http: {
            paths: [{
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: 'web-svc',
                  port: { number: 8080 },
                },
              },
            }],
          },
        }],
        tls: [{
          hosts: ['app.example.com'],
          secretName: 'web-tls',
        }],
      },
      status: {
        loadBalancer: {
          ingress: [{ hostname: 'lb.example.com' }],
        },
      },
    }
    const networking = createMockApi({
      listIngressForAllNamespaces: async () => ({ items: [ingress] }),
    })
    setupApis({ networking })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listIngresses(CONTEXT_ID)

    assert.deepEqual(list, [{
      name: 'web',
      namespace: 'default',
      ingressClass: 'nginx',
      hosts: 'app.example.com',
      address: 'lb.example.com',
      ports: '80, 443',
      age: '',
      labels: { app: 'web' },
      rules: [{
        host: 'app.example.com',
        path: '/',
        pathType: 'Prefix',
        serviceName: 'web-svc',
        servicePort: '8080',
      }],
      tls: [{
        hosts: 'app.example.com',
        secretName: 'web-tls',
      }],
      defaultBackend: 'fallback:80',
      defaultBackendServiceName: 'fallback',
      defaultBackendServicePort: '80',
    }])
    assert.equal(networking.__calls.listIngressForAllNamespaces.length, 1)
  })

  it('lists, scales, applies, reads, and deletes replication controllers', async () => {
    const controller = {
      apiVersion: 'v1',
      kind: 'ReplicationController',
      metadata: {
        name: 'legacy-web',
        namespace: 'default',
        labels: { app: 'legacy-web' },
      },
      spec: {
        replicas: 2,
        selector: { app: 'legacy-web' },
        template: {
          metadata: { labels: { app: 'legacy-web' } },
          spec: { containers: [{ name: 'web', image: 'nginx' }] },
        },
      },
      status: {
        replicas: 2,
        readyReplicas: 1,
        availableReplicas: 1,
        fullyLabeledReplicas: 2,
      },
    }
    const core = createMockApi({
      listNamespacedReplicationController: async () => ({ items: [controller] }),
      readNamespacedReplicationController: async () => controller,
      patchNamespacedReplicationController: async () => controller,
      createNamespacedReplicationController: async () => controller,
      patchNamespacedReplicationControllerScale: async (_args) => ({ spec: { replicas: _args.body.spec.replicas } }),
      deleteNamespacedReplicationController: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listReplicationControllers(CONTEXT_ID, 'default')
    const detail = await kube.getReplicationControllerDetail(CONTEXT_ID, 'default', 'legacy-web')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'ReplicationController', 'default', 'legacy-web')
    const scaled = await kube.scaleWorkload(CONTEXT_ID, 'ReplicationController', 'default', 'legacy-web', 3)
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: ReplicationController',
      'metadata:',
      '  name: legacy-web',
      '  namespace: default',
      'spec:',
      '  replicas: 2',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'ReplicationController', 'default', 'legacy-web')

    assert.deepEqual(list, [{
      name: 'legacy-web',
      namespace: 'default',
      replicas: 2,
      readyReplicas: 1,
      availableReplicas: 1,
      age: '',
      labels: { app: 'legacy-web' },
      selector: { app: 'legacy-web' },
      fullyLabeledReplicas: 2,
    }])
    assert.deepEqual(detail, list[0])
    assert.match(yaml, /"kind": "ReplicationController"/)
    assert.deepEqual(scaled, { success: true, replicas: 3 })
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(core.__calls.patchNamespacedReplicationControllerScale[0][1]), PatchStrategy.MergePatch)
    assert.equal(await patchContentType(core.__calls.patchNamespacedReplicationController[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(core.__calls.deleteNamespacedReplicationController[0][0], {
      name: 'legacy-web',
      namespace: 'default',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes controller revisions and pod templates without exposing revision data in lists', async () => {
    const revision = {
      apiVersion: 'apps/v1',
      kind: 'ControllerRevision',
      metadata: {
        name: 'web-7d9c6d',
        namespace: 'default',
        labels: { app: 'web' },
        ownerReferences: [{ kind: 'StatefulSet', name: 'web', controller: true }],
      },
      revision: 3,
      data: {
        apiVersion: 'apps/v1',
        kind: 'StatefulSet',
        spec: {
          template: {
            spec: {
              containers: [{ image: 'secret-image-detail' }],
            },
          },
        },
      },
    }
    const podTemplate = {
      apiVersion: 'v1',
      kind: 'PodTemplate',
      metadata: {
        name: 'pod-template-web',
        namespace: 'default',
        labels: { app: 'web' },
      },
      template: {
        metadata: { labels: { app: 'web' } },
        spec: {
          containers: [{ name: 'web', image: 'nginx:1.27' }],
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          nodeSelector: { role: 'frontend' },
        },
      },
    }
    const apps = createMockApi({
      listNamespacedControllerRevision: async () => ({ items: [revision] }),
      readNamespacedControllerRevision: async () => revision,
      patchNamespacedControllerRevision: async () => revision,
      createNamespacedControllerRevision: async () => revision,
      deleteNamespacedControllerRevision: async () => ({}),
    })
    const core = createMockApi({
      listNamespacedPodTemplate: async () => ({ items: [podTemplate] }),
      readNamespacedPodTemplate: async () => podTemplate,
      patchNamespacedPodTemplate: async () => podTemplate,
      createNamespacedPodTemplate: async () => podTemplate,
      deleteNamespacedPodTemplate: async () => ({}),
    })
    setupApis({ apps, core })

    const kube = await importFresh('./src/main/kube.ts')
    const revisions = await kube.listControllerRevisions(CONTEXT_ID, 'default')
    const podTemplates = await kube.listPodTemplates(CONTEXT_ID, 'default')
    const revisionYaml = await kube.getResourceYaml(CONTEXT_ID, 'ControllerRevision', 'default', 'web-7d9c6d')
    const templateYaml = await kube.getResourceYaml(CONTEXT_ID, 'PodTemplate', 'default', 'pod-template-web')
    const revisionApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: apps/v1',
      'kind: ControllerRevision',
      'metadata:',
      '  name: web-7d9c6d',
      '  namespace: default',
      'revision: 3',
      'data:',
      '  apiVersion: apps/v1',
      '  kind: StatefulSet',
      '',
    ].join('\n'))
    const templateApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: PodTemplate',
      'metadata:',
      '  name: pod-template-web',
      '  namespace: default',
      'template:',
      '  spec:',
      '    containers:',
      '    - name: web',
      '      image: nginx:1.27',
      '',
    ].join('\n'))
    const revisionDeleted = await kube.deleteResource(CONTEXT_ID, 'ControllerRevision', 'default', 'web-7d9c6d')
    const templateDeleted = await kube.deleteResource(CONTEXT_ID, 'PodTemplate', 'default', 'pod-template-web')

    assert.deepEqual(revisions, [{
      name: 'web-7d9c6d',
      namespace: 'default',
      revision: 3,
      owner: 'StatefulSet/web',
      dataKind: 'apps/v1/StatefulSet',
      age: '',
      labels: { app: 'web' },
    }])
    assert.deepEqual(podTemplates, [{
      name: 'pod-template-web',
      namespace: 'default',
      containers: 1,
      images: 'nginx:1.27',
      restartPolicy: 'Always',
      serviceAccount: 'default',
      templateLabels: 'app=web',
      nodeSelector: 'role=frontend',
      age: '',
      labels: { app: 'web' },
    }])
    assert.doesNotMatch(JSON.stringify(revisions), /secret-image-detail/)
    assert.match(revisionYaml, /secret-image-detail/)
    assert.match(templateYaml, /"kind": "PodTemplate"/)
    assert.equal(revisionApply.success, true)
    assert.equal(templateApply.success, true)
    assert.equal(await patchContentType(apps.__calls.patchNamespacedControllerRevision[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(core.__calls.patchNamespacedPodTemplate[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(revisionDeleted.success, true)
    assert.equal(templateDeleted.success, true)
    assert.deepEqual(apps.__calls.deleteNamespacedControllerRevision[0][0], {
      namespace: 'default',
      name: 'web-7d9c6d',
      body: {},
    })
    assert.deepEqual(core.__calls.deleteNamespacedPodTemplate[0][0], {
      namespace: 'default',
      name: 'pod-template-web',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes pod disruption budgets', async () => {
    const pdb = {
      apiVersion: 'policy/v1',
      kind: 'PodDisruptionBudget',
      metadata: {
        name: 'web-pdb',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        minAvailable: '50%',
        selector: { matchLabels: { app: 'web' } },
        unhealthyPodEvictionPolicy: 'IfHealthyBudget',
      },
      status: {
        observedGeneration: 3,
        disruptionsAllowed: 1,
        currentHealthy: 3,
        desiredHealthy: 2,
        expectedPods: 4,
        disruptedPods: {
          'web-1': '2026-05-12T12:00:00Z',
        },
        conditions: [{
          type: 'DisruptionAllowed',
          status: 'True',
          reason: 'SufficientPods',
          message: 'enough pods are healthy',
          lastTransitionTime: new Date('2026-05-12T12:00:00Z'),
        }],
      },
    }
    const policy = createMockApi({
      listNamespacedPodDisruptionBudget: async () => ({ items: [pdb] }),
      readNamespacedPodDisruptionBudget: async () => pdb,
      patchNamespacedPodDisruptionBudget: async () => pdb,
      createNamespacedPodDisruptionBudget: async () => pdb,
      deleteNamespacedPodDisruptionBudget: async () => ({}),
    })
    setupApis({ policy })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listPodDisruptionBudgets(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'PodDisruptionBudget', 'default', 'web-pdb')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: policy/v1',
      'kind: PodDisruptionBudget',
      'metadata:',
      '  name: web-pdb',
      '  namespace: default',
      'spec:',
      '  minAvailable: 50%',
      '  selector:',
      '    matchLabels:',
      '      app: web',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'PodDisruptionBudget', 'default', 'web-pdb')

    assert.deepEqual(list, [{
      name: 'web-pdb',
      namespace: 'default',
      minAvailable: '50%',
      maxUnavailable: '-',
      allowedDisruptions: 1,
      currentHealthy: 3,
      desiredHealthy: 2,
      expectedPods: 4,
      age: '',
      labels: { app: 'web' },
      selector: { app: 'web' },
      unhealthyPodEvictionPolicy: 'IfHealthyBudget',
      observedGeneration: 3,
      disruptedPods: 'web-1=2026-05-12T12:00:00Z',
      conditionDetails: [{
        type: 'DisruptionAllowed',
        status: 'True',
        reason: 'SufficientPods',
        message: 'enough pods are healthy',
        lastTransitionTime: '2026-05-12 12:00:00',
      }],
    }])
    assert.match(yaml, /"kind": "PodDisruptionBudget"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(policy.__calls.patchNamespacedPodDisruptionBudget[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(policy.__calls.deleteNamespacedPodDisruptionBudget[0][0], {
      namespace: 'default',
      name: 'web-pdb',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes horizontal pod autoscalers', async () => {
    const hpa = {
      apiVersion: 'autoscaling/v2',
      kind: 'HorizontalPodAutoscaler',
      metadata: {
        name: 'web-hpa',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'web',
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: 70,
              },
            },
          },
          {
            type: 'Pods',
            pods: {
              metric: { name: 'http_requests_per_second' },
              target: {
                type: 'AverageValue',
                averageValue: '100',
              },
            },
          },
        ],
      },
      status: {
        currentReplicas: 3,
        desiredReplicas: 5,
        currentMetrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              current: {
                averageUtilization: 72,
                averageValue: '210m',
              },
            },
          },
          {
            type: 'Pods',
            pods: {
              metric: { name: 'http_requests_per_second' },
              current: {
                averageValue: '85',
              },
            },
          },
        ],
        conditions: [{
          type: 'AbleToScale',
          status: 'True',
          reason: 'ReadyForNewScale',
          message: 'recommended size matches current size',
          lastTransitionTime: new Date('2026-05-12T13:00:00Z'),
        }],
      },
    }
    const autoscaling = createMockApi({
      listNamespacedHorizontalPodAutoscaler: async () => ({ items: [hpa] }),
      readNamespacedHorizontalPodAutoscaler: async () => hpa,
      patchNamespacedHorizontalPodAutoscaler: async () => hpa,
      createNamespacedHorizontalPodAutoscaler: async () => hpa,
      deleteNamespacedHorizontalPodAutoscaler: async () => ({}),
    })
    setupApis({ autoscaling })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listHPAs(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'HorizontalPodAutoscaler', 'default', 'web-hpa')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: autoscaling/v2',
      'kind: HorizontalPodAutoscaler',
      'metadata:',
      '  name: web-hpa',
      '  namespace: default',
      'spec:',
      '  scaleTargetRef:',
      '    apiVersion: apps/v1',
      '    kind: Deployment',
      '    name: web',
      '  minReplicas: 2',
      '  maxReplicas: 10',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'HorizontalPodAutoscaler', 'default', 'web-hpa')

    assert.deepEqual(list, [{
      name: 'web-hpa',
      namespace: 'default',
      reference: 'Deployment/web',
      minPods: 2,
      maxPods: 10,
      currentReplicas: 3,
      desiredReplicas: 5,
      age: '',
      labels: { app: 'web' },
      targetApiVersion: 'apps/v1',
      targetKind: 'Deployment',
      targetName: 'web',
      metricDetails: [
        {
          type: 'Resource',
          name: 'cpu',
          target: 'Utilization 70%',
          current: '72% avg=210m',
        },
        {
          type: 'Pods',
          name: 'http_requests_per_second',
          target: 'AverageValue avg=100',
          current: 'avg=85',
        },
      ],
      conditionDetails: [{
        type: 'AbleToScale',
        status: 'True',
        reason: 'ReadyForNewScale',
        message: 'recommended size matches current size',
        lastTransitionTime: '2026-05-12 13:00:00',
      }],
    }])
    assert.match(yaml, /"kind": "HorizontalPodAutoscaler"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(autoscaling.__calls.patchNamespacedHorizontalPodAutoscaler[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(autoscaling.__calls.deleteNamespacedHorizontalPodAutoscaler[0][0], {
      namespace: 'default',
      name: 'web-hpa',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes resource quotas', async () => {
    const quota = {
      apiVersion: 'v1',
      kind: 'ResourceQuota',
      metadata: {
        name: 'compute',
        namespace: 'default',
        labels: { team: 'platform' },
      },
      spec: {
        hard: {
          pods: '10',
          'requests.cpu': '4',
        },
        scopes: ['BestEffort'],
        scopeSelector: {
          matchExpressions: [{
            scopeName: 'PriorityClass',
            operator: 'In',
            values: ['high'],
          }],
        },
      },
      status: {
        hard: {
          pods: '10',
          'requests.cpu': '4',
        },
        used: {
          pods: '3',
          'requests.cpu': '1500m',
        },
      },
    }
    const core = createMockApi({
      listNamespacedResourceQuota: async () => ({ items: [quota] }),
      readNamespacedResourceQuota: async () => quota,
      patchNamespacedResourceQuota: async () => quota,
      createNamespacedResourceQuota: async () => quota,
      deleteNamespacedResourceQuota: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listResourceQuotas(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'ResourceQuota', 'default', 'compute')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: ResourceQuota',
      'metadata:',
      '  name: compute',
      '  namespace: default',
      'spec:',
      '  hard:',
      '    pods: \"10\"',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'ResourceQuota', 'default', 'compute')

    assert.deepEqual(list, [{
      name: 'compute',
      namespace: 'default',
      hard: 'pods=10, requests.cpu=4',
      used: 'pods=3, requests.cpu=1500m',
      scopes: 'BestEffort',
      age: '',
      labels: { team: 'platform' },
      quotaDetails: [
        { resource: 'pods', hard: '10', used: '3' },
        { resource: 'requests.cpu', hard: '4', used: '1500m' },
      ],
      scopeSelector: 'PriorityClass In (high)',
      scopeSelectorDetails: [{
        scopeName: 'PriorityClass',
        operator: 'In',
        values: 'high',
      }],
    }])
    assert.match(yaml, /"kind": "ResourceQuota"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(core.__calls.patchNamespacedResourceQuota[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(core.__calls.deleteNamespacedResourceQuota[0][0], {
      namespace: 'default',
      name: 'compute',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes limit ranges', async () => {
    const limitRange = {
      apiVersion: 'v1',
      kind: 'LimitRange',
      metadata: {
        name: 'default-limits',
        namespace: 'default',
        labels: { team: 'platform' },
      },
      spec: {
        limits: [{
          type: 'Container',
          min: { cpu: '100m', memory: '128Mi' },
          max: { cpu: '2', memory: '2Gi' },
          default: { cpu: '500m', memory: '512Mi' },
          defaultRequest: { cpu: '200m', memory: '256Mi' },
          maxLimitRequestRatio: { cpu: '10' },
        }],
      },
    }
    const core = createMockApi({
      listNamespacedLimitRange: async () => ({ items: [limitRange] }),
      readNamespacedLimitRange: async () => limitRange,
      patchNamespacedLimitRange: async () => limitRange,
      createNamespacedLimitRange: async () => limitRange,
      deleteNamespacedLimitRange: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listLimitRanges(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'LimitRange', 'default', 'default-limits')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: LimitRange',
      'metadata:',
      '  name: default-limits',
      '  namespace: default',
      'spec:',
      '  limits:',
      '    - type: Container',
      '      default:',
      '        cpu: 500m',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'LimitRange', 'default', 'default-limits')

    assert.deepEqual(list, [{
      name: 'default-limits',
      namespace: 'default',
      types: 'Container',
      min: 'Container:cpu=100m, memory=128Mi',
      max: 'Container:cpu=2, memory=2Gi',
      default: 'Container:cpu=500m, memory=512Mi',
      defaultRequest: 'Container:cpu=200m, memory=256Mi',
      maxLimitRequestRatio: 'Container:cpu=10',
      age: '',
      labels: { team: 'platform' },
      limitDetails: [{
        type: 'Container',
        min: 'cpu=100m, memory=128Mi',
        max: 'cpu=2, memory=2Gi',
        default: 'cpu=500m, memory=512Mi',
        defaultRequest: 'cpu=200m, memory=256Mi',
        maxLimitRequestRatio: 'cpu=10',
      }],
    }])
    assert.match(yaml, /"kind": "LimitRange"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(core.__calls.patchNamespacedLimitRange[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(core.__calls.deleteNamespacedLimitRange[0][0], {
      namespace: 'default',
      name: 'default-limits',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes priority classes', async () => {
    const priorityClass = {
      apiVersion: 'scheduling.k8s.io/v1',
      kind: 'PriorityClass',
      metadata: {
        name: 'platform-critical',
        labels: { team: 'platform' },
      },
      value: 100000,
      globalDefault: false,
      preemptionPolicy: 'PreemptLowerPriority',
      description: 'Critical platform workloads',
    }
    const scheduling = createMockApi({
      listPriorityClass: async () => ({ items: [priorityClass] }),
      readPriorityClass: async () => priorityClass,
      patchPriorityClass: async () => priorityClass,
      createPriorityClass: async () => priorityClass,
      deletePriorityClass: async () => ({}),
    })
    setupApis({ scheduling })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listPriorityClasses(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'PriorityClass', '', 'platform-critical')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: scheduling.k8s.io/v1',
      'kind: PriorityClass',
      'metadata:',
      '  name: platform-critical',
      'value: 100000',
      'globalDefault: false',
      'preemptionPolicy: PreemptLowerPriority',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'PriorityClass', '', 'platform-critical')

    assert.deepEqual(list, [{
      name: 'platform-critical',
      value: 100000,
      globalDefault: false,
      preemptionPolicy: 'PreemptLowerPriority',
      description: 'Critical platform workloads',
      age: '',
      labels: { team: 'platform' },
    }])
    assert.match(yaml, /"kind": "PriorityClass"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(scheduling.__calls.patchPriorityClass[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(scheduling.__calls.deletePriorityClass[0][0], {
      name: 'platform-critical',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes runtime classes', async () => {
    const runtimeClass = {
      apiVersion: 'node.k8s.io/v1',
      kind: 'RuntimeClass',
      metadata: {
        name: 'kata',
        labels: { runtime: 'sandboxed' },
      },
      handler: 'kata-qemu',
      overhead: {
        podFixed: {
          cpu: '250m',
          memory: '128Mi',
        },
      },
      scheduling: {
        nodeSelector: {
          'runtime.kubernetes.io/kata': 'true',
        },
        tolerations: [{
          key: 'sandboxed',
          operator: 'Exists',
          effect: 'NoSchedule',
          tolerationSeconds: 60,
        }],
      },
    }
    const node = createMockApi({
      listRuntimeClass: async () => ({ items: [runtimeClass] }),
      readRuntimeClass: async () => runtimeClass,
      patchRuntimeClass: async () => runtimeClass,
      createRuntimeClass: async () => runtimeClass,
      deleteRuntimeClass: async () => ({}),
    })
    setupApis({ node })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listRuntimeClasses(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'RuntimeClass', '', 'kata')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: node.k8s.io/v1',
      'kind: RuntimeClass',
      'metadata:',
      '  name: kata',
      'handler: kata-qemu',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'RuntimeClass', '', 'kata')

    assert.deepEqual(list, [{
      name: 'kata',
      handler: 'kata-qemu',
      overhead: 'cpu=250m, memory=128Mi',
      nodeSelector: 'runtime.kubernetes.io/kata=true',
      tolerations: 1,
      age: '',
      labels: { runtime: 'sandboxed' },
      nodeSelectorLabels: { 'runtime.kubernetes.io/kata': 'true' },
      tolerationDetails: [{
        key: 'sandboxed',
        operator: 'Exists',
        value: '-',
        effect: 'NoSchedule',
        tolerationSeconds: '60',
      }],
    }])
    assert.match(yaml, /"kind": "RuntimeClass"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(node.__calls.patchRuntimeClass[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(node.__calls.deleteRuntimeClass[0][0], {
      name: 'kata',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes leases', async () => {
    const lease = {
      apiVersion: 'coordination.k8s.io/v1',
      kind: 'Lease',
      metadata: {
        name: 'kube-controller-manager',
        namespace: 'kube-system',
        labels: { component: 'controller-manager' },
      },
      spec: {
        holderIdentity: 'controller-1',
        leaseDurationSeconds: 15,
        acquireTime: new Date('2024-01-01T00:00:00.000Z'),
        renewTime: new Date('2024-01-01T00:00:10.000Z'),
        leaseTransitions: 2,
      },
    }
    const coordination = createMockApi({
      listNamespacedLease: async () => ({ items: [lease] }),
      readNamespacedLease: async () => lease,
      patchNamespacedLease: async () => lease,
      createNamespacedLease: async () => lease,
      deleteNamespacedLease: async () => ({}),
    })
    setupApis({ coordination })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listLeases(CONTEXT_ID, 'kube-system')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'Lease', 'kube-system', 'kube-controller-manager')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: coordination.k8s.io/v1',
      'kind: Lease',
      'metadata:',
      '  name: kube-controller-manager',
      '  namespace: kube-system',
      'spec:',
      '  holderIdentity: controller-1',
      '  leaseDurationSeconds: 15',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'Lease', 'kube-system', 'kube-controller-manager')

    assert.deepEqual(list, [{
      name: 'kube-controller-manager',
      namespace: 'kube-system',
      holder: 'controller-1',
      leaseDuration: 15,
      acquireTime: '2024-01-01 00:00:00',
      renewTime: '2024-01-01 00:00:10',
      transitions: 2,
      age: '',
      labels: { component: 'controller-manager' },
    }])
    assert.match(yaml, /"kind": "Lease"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(coordination.__calls.patchNamespacedLease[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(coordination.__calls.deleteNamespacedLease[0][0], {
      namespace: 'kube-system',
      name: 'kube-controller-manager',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes lease candidates', async () => {
    const candidate = {
      apiVersion: 'coordination.k8s.io/v1beta1',
      kind: 'LeaseCandidate',
      metadata: {
        name: 'controller-1',
        namespace: 'kube-system',
        labels: { component: 'controller-manager' },
      },
      spec: {
        leaseName: 'kube-controller-manager',
        binaryVersion: '1.34.0',
        emulationVersion: '1.33.0',
        strategy: 'OldestEmulationVersion',
        pingTime: new Date('2024-01-01T00:00:05.000Z'),
        renewTime: new Date('2024-01-01T00:00:10.000Z'),
      },
    }
    const coordinationBeta = createMockApi({
      listNamespacedLeaseCandidate: async () => ({ items: [candidate] }),
      readNamespacedLeaseCandidate: async () => candidate,
      patchNamespacedLeaseCandidate: async () => candidate,
      createNamespacedLeaseCandidate: async () => candidate,
      deleteNamespacedLeaseCandidate: async () => ({}),
    })
    setupApis({ coordinationBeta })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listLeaseCandidates(CONTEXT_ID, 'kube-system')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'LeaseCandidate', 'kube-system', 'controller-1')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: coordination.k8s.io/v1beta1',
      'kind: LeaseCandidate',
      'metadata:',
      '  name: controller-1',
      '  namespace: kube-system',
      'spec:',
      '  leaseName: kube-controller-manager',
      '  binaryVersion: 1.34.0',
      '  strategy: OldestEmulationVersion',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'LeaseCandidate', 'kube-system', 'controller-1')

    assert.deepEqual(list, [{
      name: 'controller-1',
      namespace: 'kube-system',
      leaseName: 'kube-controller-manager',
      binaryVersion: '1.34.0',
      emulationVersion: '1.33.0',
      strategy: 'OldestEmulationVersion',
      pingTime: '2024-01-01 00:00:05',
      renewTime: '2024-01-01 00:00:10',
      age: '',
      labels: { component: 'controller-manager' },
    }])
    assert.match(yaml, /"kind": "LeaseCandidate"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(coordinationBeta.__calls.patchNamespacedLeaseCandidate[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(coordinationBeta.__calls.deleteNamespacedLeaseCandidate[0][0], {
      namespace: 'kube-system',
      name: 'controller-1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes CSI drivers', async () => {
    const csiDriver = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'CSIDriver',
      metadata: {
        name: 'ebs.csi.aws.com',
        labels: { provider: 'aws' },
      },
      spec: {
        attachRequired: true,
        podInfoOnMount: false,
        storageCapacity: true,
        requiresRepublish: true,
        seLinuxMount: false,
        volumeLifecycleModes: ['Persistent', 'Ephemeral'],
        fsGroupPolicy: 'File',
      },
    }
    const storage = createMockApi({
      listCSIDriver: async () => ({ items: [csiDriver] }),
      readCSIDriver: async () => csiDriver,
      patchCSIDriver: async () => csiDriver,
      createCSIDriver: async () => csiDriver,
      deleteCSIDriver: async () => ({}),
    })
    setupApis({ storage })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCSIDrivers(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'CSIDriver', '', 'ebs.csi.aws.com')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: storage.k8s.io/v1',
      'kind: CSIDriver',
      'metadata:',
      '  name: ebs.csi.aws.com',
      'spec:',
      '  attachRequired: true',
      '  storageCapacity: true',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'CSIDriver', '', 'ebs.csi.aws.com')

    assert.deepEqual(list, [{
      name: 'ebs.csi.aws.com',
      attachRequired: true,
      podInfoOnMount: false,
      storageCapacity: true,
      requiresRepublish: true,
      seLinuxMount: false,
      volumeLifecycleModes: 'Persistent, Ephemeral',
      fsGroupPolicy: 'File',
      age: '',
      labels: { provider: 'aws' },
    }])
    assert.match(yaml, /"kind": "CSIDriver"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(storage.__calls.patchCSIDriver[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(storage.__calls.deleteCSIDriver[0][0], {
      name: 'ebs.csi.aws.com',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes CSI nodes', async () => {
    const csiNode = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'CSINode',
      metadata: {
        name: 'node-1',
        labels: { zone: 'a' },
      },
      spec: {
        drivers: [{
          name: 'ebs.csi.aws.com',
          nodeID: 'i-123456',
          topologyKeys: ['topology.kubernetes.io/zone'],
          allocatable: { count: 39 },
        }],
      },
    }
    const storage = createMockApi({
      listCSINode: async () => ({ items: [csiNode] }),
      readCSINode: async () => csiNode,
      patchCSINode: async () => csiNode,
      createCSINode: async () => csiNode,
      deleteCSINode: async () => ({}),
    })
    setupApis({ storage })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCSINodes(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'CSINode', '', 'node-1')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: storage.k8s.io/v1',
      'kind: CSINode',
      'metadata:',
      '  name: node-1',
      'spec:',
      '  drivers:',
      '    - name: ebs.csi.aws.com',
      '      nodeID: i-123456',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'CSINode', '', 'node-1')

    assert.deepEqual(list, [{
      name: 'node-1',
      drivers: 1,
      driverNames: 'ebs.csi.aws.com',
      nodeIds: 'i-123456',
      topologyKeys: 'topology.kubernetes.io/zone',
      allocatable: 'ebs.csi.aws.com=39',
      age: '',
      labels: { zone: 'a' },
      driverDetails: [{
        name: 'ebs.csi.aws.com',
        nodeId: 'i-123456',
        topologyKeys: 'topology.kubernetes.io/zone',
        allocatable: '39',
      }],
    }])
    assert.match(yaml, /"kind": "CSINode"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(storage.__calls.patchCSINode[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(storage.__calls.deleteCSINode[0][0], {
      name: 'node-1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes volume attributes classes', async () => {
    const attributesClass = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttributesClass',
      metadata: {
        name: 'fast-attrs',
        labels: { tier: 'fast' },
      },
      driverName: 'ebs.csi.aws.com',
      parameters: {
        type: 'gp3',
        iops: '12000',
      },
    }
    const storage = createMockApi({
      listVolumeAttributesClass: async () => ({ items: [attributesClass] }),
      readVolumeAttributesClass: async () => attributesClass,
      patchVolumeAttributesClass: async () => attributesClass,
      createVolumeAttributesClass: async () => attributesClass,
      deleteVolumeAttributesClass: async () => ({}),
    })
    setupApis({ storage })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listVolumeAttributesClasses(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'VolumeAttributesClass', '', 'fast-attrs')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: storage.k8s.io/v1',
      'kind: VolumeAttributesClass',
      'metadata:',
      '  name: fast-attrs',
      'driverName: ebs.csi.aws.com',
      'parameters:',
      '  type: gp3',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'VolumeAttributesClass', '', 'fast-attrs')

    assert.deepEqual(list, [{
      name: 'fast-attrs',
      driverName: 'ebs.csi.aws.com',
      parameters: 'iops=12000, type=gp3',
      parameterCount: 2,
      age: '',
      labels: { tier: 'fast' },
      parameterDetails: {
        type: 'gp3',
        iops: '12000',
      },
    }])
    assert.match(yaml, /"kind": "VolumeAttributesClass"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(storage.__calls.patchVolumeAttributesClass[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(storage.__calls.deleteVolumeAttributesClass[0][0], {
      name: 'fast-attrs',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes volume attachments', async () => {
    const volumeAttachment = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'VolumeAttachment',
      metadata: {
        name: 'csi-abc',
        labels: { volume: 'pv-data' },
      },
      spec: {
        attacher: 'ebs.csi.aws.com',
        nodeName: 'node-1',
        source: {
          persistentVolumeName: 'pv-data',
        },
      },
      status: {
        attached: true,
        attachError: { message: 'previous attach warning' },
      },
    }
    const storage = createMockApi({
      listVolumeAttachment: async () => ({ items: [volumeAttachment] }),
      readVolumeAttachment: async () => volumeAttachment,
      patchVolumeAttachment: async () => volumeAttachment,
      createVolumeAttachment: async () => volumeAttachment,
      deleteVolumeAttachment: async () => ({}),
    })
    setupApis({ storage })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listVolumeAttachments(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'VolumeAttachment', '', 'csi-abc')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: storage.k8s.io/v1',
      'kind: VolumeAttachment',
      'metadata:',
      '  name: csi-abc',
      'spec:',
      '  attacher: ebs.csi.aws.com',
      '  nodeName: node-1',
      '  source:',
      '    persistentVolumeName: pv-data',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'VolumeAttachment', '', 'csi-abc')

    assert.deepEqual(list, [{
      name: 'csi-abc',
      attacher: 'ebs.csi.aws.com',
      node: 'node-1',
      source: 'pv/pv-data',
      attached: true,
      attachError: 'previous attach warning',
      detachError: '-',
      age: '',
      labels: { volume: 'pv-data' },
      sourcePersistentVolume: 'pv-data',
      sourceInline: false,
    }])
    assert.match(yaml, /"kind": "VolumeAttachment"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(storage.__calls.patchVolumeAttachment[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(storage.__calls.deleteVolumeAttachment[0][0], {
      name: 'csi-abc',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes CSI storage capacities', async () => {
    const capacity = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'CSIStorageCapacity',
      metadata: {
        name: 'standard-a',
        namespace: 'kube-system',
        labels: { zone: 'a' },
      },
      storageClassName: 'standard',
      capacity: '100Gi',
      maximumVolumeSize: '10Gi',
      nodeTopology: {
        matchLabels: {
          'topology.kubernetes.io/zone': 'a',
        },
        matchExpressions: [{
          key: 'node.kubernetes.io/instance-type',
          operator: 'In',
          values: ['m6i.large', 'm6i.xlarge'],
        }],
      },
    }
    const storage = createMockApi({
      listNamespacedCSIStorageCapacity: async () => ({ items: [capacity] }),
      readNamespacedCSIStorageCapacity: async () => capacity,
      patchNamespacedCSIStorageCapacity: async () => capacity,
      createNamespacedCSIStorageCapacity: async () => capacity,
      deleteNamespacedCSIStorageCapacity: async () => ({}),
    })
    setupApis({ storage })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCSIStorageCapacities(CONTEXT_ID, 'kube-system')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'CSIStorageCapacity', 'kube-system', 'standard-a')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: storage.k8s.io/v1',
      'kind: CSIStorageCapacity',
      'metadata:',
      '  name: standard-a',
      '  namespace: kube-system',
      'storageClassName: standard',
      'capacity: 100Gi',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'CSIStorageCapacity', 'kube-system', 'standard-a')

    assert.deepEqual(list, [{
      name: 'standard-a',
      namespace: 'kube-system',
      storageClass: 'standard',
      capacity: '100Gi',
      maximumVolumeSize: '10Gi',
      topology: 'topology.kubernetes.io/zone=a, node.kubernetes.io/instance-type In (m6i.large,m6i.xlarge)',
      age: '',
      labels: { zone: 'a' },
      nodeTopologyLabels: { 'topology.kubernetes.io/zone': 'a' },
      nodeTopologyExpressions: [{
        key: 'node.kubernetes.io/instance-type',
        operator: 'In',
        values: 'm6i.large, m6i.xlarge',
      }],
    }])
    assert.match(yaml, /"kind": "CSIStorageCapacity"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(storage.__calls.patchNamespacedCSIStorageCapacity[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(storage.__calls.deleteNamespacedCSIStorageCapacity[0][0], {
      namespace: 'kube-system',
      name: 'standard-a',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes volume snapshot resources', async () => {
    const snapshotClass = {
      apiVersion: 'snapshot.storage.k8s.io/v1',
      kind: 'VolumeSnapshotClass',
      metadata: {
        name: 'csi-snapclass',
        labels: { driver: 'ebs' },
      },
      driver: 'ebs.csi.aws.com',
      deletionPolicy: 'Delete',
      parameters: {
        type: 'gp3',
      },
    }
    const snapshot = {
      apiVersion: 'snapshot.storage.k8s.io/v1',
      kind: 'VolumeSnapshot',
      metadata: {
        name: 'data-snap',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        volumeSnapshotClassName: 'csi-snapclass',
        source: {
          persistentVolumeClaimName: 'data',
        },
      },
      status: {
        boundVolumeSnapshotContentName: 'snapcontent-1',
        readyToUse: true,
        restoreSize: '10Gi',
      },
    }
    const content = {
      apiVersion: 'snapshot.storage.k8s.io/v1',
      kind: 'VolumeSnapshotContent',
      metadata: {
        name: 'snapcontent-1',
        labels: { app: 'web' },
      },
      spec: {
        deletionPolicy: 'Delete',
        driver: 'ebs.csi.aws.com',
        source: {
          snapshotHandle: 'snap-123',
        },
        volumeSnapshotClassName: 'csi-snapclass',
        volumeSnapshotRef: {
          name: 'data-snap',
          namespace: 'default',
        },
      },
      status: {
        readyToUse: true,
        restoreSize: '10Gi',
        snapshotHandle: 'snap-123',
      },
    }
    const customObjects = createMockApi({
      listClusterCustomObject: async ({ plural }) => ({
        items: plural === 'volumesnapshotclasses' ? [snapshotClass] : [content],
      }),
      listNamespacedCustomObject: async () => ({ items: [snapshot] }),
      getClusterCustomObject: async ({ plural }) => (
        plural === 'volumesnapshotclasses' ? snapshotClass : content
      ),
      getNamespacedCustomObject: async () => snapshot,
      patchClusterCustomObject: async ({ plural }) => (
        plural === 'volumesnapshotclasses' ? snapshotClass : content
      ),
      createClusterCustomObject: async ({ plural }) => (
        plural === 'volumesnapshotclasses' ? snapshotClass : content
      ),
      patchNamespacedCustomObject: async () => snapshot,
      createNamespacedCustomObject: async () => snapshot,
      deleteClusterCustomObject: async () => ({}),
      deleteNamespacedCustomObject: async () => ({}),
    })
    setupApis({ customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const classes = await kube.listVolumeSnapshotClasses(CONTEXT_ID)
    const snapshots = await kube.listVolumeSnapshots(CONTEXT_ID, 'default')
    const contents = await kube.listVolumeSnapshotContents(CONTEXT_ID)
    const classYaml = await kube.getResourceYaml(CONTEXT_ID, 'VolumeSnapshotClass', '', 'csi-snapclass')
    const snapshotYaml = await kube.getResourceYaml(CONTEXT_ID, 'VolumeSnapshot', 'default', 'data-snap')
    const contentYaml = await kube.getResourceYaml(CONTEXT_ID, 'VolumeSnapshotContent', '', 'snapcontent-1')
    const applied = await kube.applyYaml(CONTEXT_ID, [
      JSON.stringify(snapshotClass),
      JSON.stringify(snapshot),
      JSON.stringify(content),
    ].join('\n---\n'))
    const deletedClass = await kube.deleteResource(CONTEXT_ID, 'VolumeSnapshotClass', '', 'csi-snapclass')
    const deletedSnapshot = await kube.deleteResource(CONTEXT_ID, 'VolumeSnapshot', 'default', 'data-snap')
    const deletedContent = await kube.deleteResource(CONTEXT_ID, 'VolumeSnapshotContent', '', 'snapcontent-1')

    assert.deepEqual(classes, [{
      name: 'csi-snapclass',
      driver: 'ebs.csi.aws.com',
      deletionPolicy: 'Delete',
      parameters: 'type=gp3',
      age: '',
      labels: { driver: 'ebs' },
      parameterDetails: { type: 'gp3' },
    }])
    assert.deepEqual(snapshots, [{
      name: 'data-snap',
      namespace: 'default',
      snapshotClass: 'csi-snapclass',
      source: 'pvc/data',
      boundContent: 'snapcontent-1',
      readyToUse: true,
      restoreSize: '10Gi',
      error: '-',
      age: '',
      labels: { app: 'web' },
      sourcePVC: 'data',
      sourceContent: undefined,
    }])
    assert.deepEqual(contents, [{
      name: 'snapcontent-1',
      snapshotClass: 'csi-snapclass',
      driver: 'ebs.csi.aws.com',
      deletionPolicy: 'Delete',
      source: 'snapshot/snap-123',
      volumeSnapshot: 'default/data-snap',
      readyToUse: true,
      restoreSize: '10Gi',
      handle: 'snap-123',
      error: '-',
      age: '',
      labels: { app: 'web' },
      sourceVolumeHandle: undefined,
      sourceSnapshotHandle: 'snap-123',
      volumeSnapshotNamespace: 'default',
      volumeSnapshotName: 'data-snap',
    }])
    assert.match(classYaml, /"kind": "VolumeSnapshotClass"/)
    assert.match(snapshotYaml, /"kind": "VolumeSnapshot"/)
    assert.match(contentYaml, /"kind": "VolumeSnapshotContent"/)
    assert.equal(applied.success, true)
    assert.equal(deletedClass.success, true)
    assert.equal(deletedSnapshot.success, true)
    assert.equal(deletedContent.success, true)
    assert.equal(customObjects.__calls.patchClusterCustomObject[0][0].plural, 'volumesnapshotclasses')
    assert.equal(customObjects.__calls.patchNamespacedCustomObject[0][0].plural, 'volumesnapshots')
    assert.equal(customObjects.__calls.patchNamespacedCustomObject[0][0].namespace, 'default')
    assert.equal(customObjects.__calls.patchClusterCustomObject[1][0].plural, 'volumesnapshotcontents')
    assert.equal(await patchContentType(customObjects.__calls.patchClusterCustomObject[0][1]), PatchStrategy.MergePatch)
    assert.deepEqual(customObjects.__calls.deleteClusterCustomObject[0][0], {
      group: 'snapshot.storage.k8s.io',
      version: 'v1',
      plural: 'volumesnapshotclasses',
      name: 'csi-snapclass',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[0][0], {
      group: 'snapshot.storage.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'volumesnapshots',
      name: 'data-snap',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteClusterCustomObject[1][0], {
      group: 'snapshot.storage.k8s.io',
      version: 'v1',
      plural: 'volumesnapshotcontents',
      name: 'snapcontent-1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes gateway API resources', async () => {
    const gatewayClass = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'GatewayClass',
      metadata: {
        name: 'public',
        labels: { tier: 'edge' },
      },
      spec: {
        controllerName: 'example.com/gateway-controller',
        description: 'Public edge gateway class',
        parametersRef: {
          group: '',
          kind: 'ConfigMap',
          namespace: 'kube-system',
          name: 'public-gw-params',
        },
      },
      status: {
        conditions: [{ type: 'Accepted', status: 'True', reason: 'Accepted' }],
      },
    }
    const gateway = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'Gateway',
      metadata: {
        name: 'public-gw',
        namespace: 'default',
        labels: { app: 'edge' },
      },
      spec: {
        gatewayClassName: 'public',
        addresses: [{ type: 'IPAddress', value: '1.2.3.4' }],
        listeners: [{ name: 'http', protocol: 'HTTP', port: 80, hostname: 'app.example.com' }],
      },
      status: {
        addresses: [{ type: 'IPAddress', value: '1.2.3.4' }],
        conditions: [
          { type: 'Accepted', status: 'True', reason: 'Accepted' },
          { type: 'Programmed', status: 'True', reason: 'Programmed' },
        ],
        listeners: [{
          name: 'http',
          attachedRoutes: 2,
          conditions: [
            { type: 'Accepted', status: 'True', reason: 'Accepted' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const httpRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'HTTPRoute',
      metadata: {
        name: 'web',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        hostnames: ['app.example.com'],
        parentRefs: [{ name: 'public-gw' }],
        rules: [{ backendRefs: [{ name: 'web', port: 80, weight: 1 }] }],
      },
      status: {
        parents: [{
          parentRef: { name: 'public-gw' },
          controllerName: 'example.com/gateway-controller',
          conditions: [
            { type: 'Accepted', status: 'True', reason: 'Accepted' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const grpcRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'GRPCRoute',
      metadata: {
        name: 'grpc',
        namespace: 'default',
        labels: { app: 'grpc' },
      },
      spec: {
        hostnames: ['grpc.example.com'],
        parentRefs: [{ name: 'public-gw', sectionName: 'http' }],
        rules: [{ backendRefs: [{ name: 'grpc', port: 50051 }] }],
      },
      status: {
        parents: [{
          parentRef: { name: 'public-gw', sectionName: 'http' },
          controllerName: 'example.com/gateway-controller',
          conditions: [
            { type: 'Accepted', status: 'False', reason: 'NoMatchingListener' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const tlsRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'TLSRoute',
      metadata: {
        name: 'tls',
        namespace: 'default',
        labels: { app: 'tls' },
      },
      spec: {
        hostnames: ['tls.example.com'],
        parentRefs: [{ name: 'public-gw', sectionName: 'tls' }],
        rules: [{ backendRefs: [{ name: 'tls', port: 443 }] }],
      },
      status: {
        parents: [{
          parentRef: { name: 'public-gw', sectionName: 'tls' },
          controllerName: 'example.com/gateway-controller',
          conditions: [
            { type: 'Accepted', status: 'True', reason: 'Accepted' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const tcpRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1alpha2',
      kind: 'TCPRoute',
      metadata: {
        name: 'tcp',
        namespace: 'default',
        labels: { app: 'tcp' },
      },
      spec: {
        parentRefs: [{ name: 'public-gw', sectionName: 'tcp' }],
        rules: [{ backendRefs: [{ name: 'tcp', port: 9000 }] }],
      },
      status: {
        parents: [{
          parentRef: { name: 'public-gw', sectionName: 'tcp' },
          controllerName: 'example.com/gateway-controller',
          conditions: [
            { type: 'Accepted', status: 'True', reason: 'Accepted' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const udpRoute = {
      apiVersion: 'gateway.networking.k8s.io/v1alpha2',
      kind: 'UDPRoute',
      metadata: {
        name: 'udp',
        namespace: 'default',
        labels: { app: 'udp' },
      },
      spec: {
        parentRefs: [{ name: 'public-gw', sectionName: 'udp' }],
        rules: [{ backendRefs: [{ name: 'udp', port: 9001 }] }],
      },
      status: {
        parents: [{
          parentRef: { name: 'public-gw', sectionName: 'udp' },
          controllerName: 'example.com/gateway-controller',
          conditions: [
            { type: 'Accepted', status: 'False', reason: 'NoMatchingListener' },
            { type: 'ResolvedRefs', status: 'True', reason: 'ResolvedRefs' },
          ],
        }],
      },
    }
    const referenceGrant = {
      apiVersion: 'gateway.networking.k8s.io/v1',
      kind: 'ReferenceGrant',
      metadata: {
        name: 'allow-web',
        namespace: 'default',
        labels: { app: 'web' },
      },
      spec: {
        from: [{ group: 'gateway.networking.k8s.io', kind: 'HTTPRoute', namespace: 'client' }],
        to: [{ group: '', kind: 'Service', name: 'web' }],
      },
    }
    const customObjects = createMockApi({
      listClusterCustomObject: async ({ plural }) => ({
        items: plural === 'gatewayclasses' ? [gatewayClass] : [],
      }),
      listNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'gateways') return { items: [gateway] }
        if (plural === 'httproutes') return { items: [httpRoute] }
        if (plural === 'grpcroutes') return { items: [grpcRoute] }
        if (plural === 'tlsroutes') return { items: [tlsRoute] }
        if (plural === 'tcproutes') return { items: [tcpRoute] }
        if (plural === 'udproutes') return { items: [udpRoute] }
        return { items: [referenceGrant] }
      },
      getClusterCustomObject: async () => gatewayClass,
      getNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'gateways') return gateway
        if (plural === 'httproutes') return httpRoute
        if (plural === 'grpcroutes') return grpcRoute
        if (plural === 'tlsroutes') return tlsRoute
        if (plural === 'tcproutes') return tcpRoute
        if (plural === 'udproutes') return udpRoute
        return referenceGrant
      },
      patchClusterCustomObject: async () => gatewayClass,
      createClusterCustomObject: async () => gatewayClass,
      patchNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'gateways') return gateway
        if (plural === 'httproutes') return httpRoute
        if (plural === 'grpcroutes') return grpcRoute
        if (plural === 'tlsroutes') return tlsRoute
        if (plural === 'tcproutes') return tcpRoute
        if (plural === 'udproutes') return udpRoute
        return referenceGrant
      },
      createNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'gateways') return gateway
        if (plural === 'httproutes') return httpRoute
        if (plural === 'grpcroutes') return grpcRoute
        if (plural === 'tlsroutes') return tlsRoute
        if (plural === 'tcproutes') return tcpRoute
        if (plural === 'udproutes') return udpRoute
        return referenceGrant
      },
      deleteClusterCustomObject: async () => ({}),
      deleteNamespacedCustomObject: async () => ({}),
    })
    setupApis({ customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const classes = await kube.listGatewayClasses(CONTEXT_ID)
    const gateways = await kube.listGateways(CONTEXT_ID, 'default')
    const httpRoutes = await kube.listHTTPRoutes(CONTEXT_ID, 'default')
    const grpcRoutes = await kube.listGRPCRoutes(CONTEXT_ID, 'default')
    const tlsRoutes = await kube.listTLSRoutes(CONTEXT_ID, 'default')
    const tcpRoutes = await kube.listTCPRoutes(CONTEXT_ID, 'default')
    const udpRoutes = await kube.listUDPRoutes(CONTEXT_ID, 'default')
    const referenceGrants = await kube.listReferenceGrants(CONTEXT_ID, 'default')
    const classYaml = await kube.getResourceYaml(CONTEXT_ID, 'GatewayClass', '', 'public')
    const gatewayYaml = await kube.getResourceYaml(CONTEXT_ID, 'Gateway', 'default', 'public-gw')
    const httpRouteYaml = await kube.getResourceYaml(CONTEXT_ID, 'HTTPRoute', 'default', 'web')
    const grpcRouteYaml = await kube.getResourceYaml(CONTEXT_ID, 'GRPCRoute', 'default', 'grpc')
    const tlsRouteYaml = await kube.getResourceYaml(CONTEXT_ID, 'TLSRoute', 'default', 'tls')
    const tcpRouteYaml = await kube.getResourceYaml(CONTEXT_ID, 'TCPRoute', 'default', 'tcp')
    const udpRouteYaml = await kube.getResourceYaml(CONTEXT_ID, 'UDPRoute', 'default', 'udp')
    const referenceGrantYaml = await kube.getResourceYaml(CONTEXT_ID, 'ReferenceGrant', 'default', 'allow-web')
    const applied = await kube.applyYaml(CONTEXT_ID, [
      JSON.stringify(gatewayClass),
      JSON.stringify(gateway),
      JSON.stringify(httpRoute),
      JSON.stringify(grpcRoute),
      JSON.stringify(tlsRoute),
      JSON.stringify(tcpRoute),
      JSON.stringify(udpRoute),
      JSON.stringify(referenceGrant),
    ].join('\n---\n'))
    const deletedClass = await kube.deleteResource(CONTEXT_ID, 'GatewayClass', '', 'public')
    const deletedGateway = await kube.deleteResource(CONTEXT_ID, 'Gateway', 'default', 'public-gw')
    const deletedHTTPRoute = await kube.deleteResource(CONTEXT_ID, 'HTTPRoute', 'default', 'web')
    const deletedGRPCRoute = await kube.deleteResource(CONTEXT_ID, 'GRPCRoute', 'default', 'grpc')
    const deletedTLSRoute = await kube.deleteResource(CONTEXT_ID, 'TLSRoute', 'default', 'tls')
    const deletedTCPRoute = await kube.deleteResource(CONTEXT_ID, 'TCPRoute', 'default', 'tcp')
    const deletedUDPRoute = await kube.deleteResource(CONTEXT_ID, 'UDPRoute', 'default', 'udp')
    const deletedReferenceGrant = await kube.deleteResource(CONTEXT_ID, 'ReferenceGrant', 'default', 'allow-web')

    assert.deepEqual(classes, [{
      name: 'public',
      controllerName: 'example.com/gateway-controller',
      accepted: 'True',
      description: 'Public edge gateway class',
      parametersRef: 'ConfigMap/kube-system/public-gw-params',
      age: '',
      labels: { tier: 'edge' },
      conditions: [{
        type: 'Accepted',
        status: 'True',
        reason: 'Accepted',
        message: '-',
        lastTransitionTime: '-',
      }],
    }])
    assert.deepEqual(gateways, [{
      name: 'public-gw',
      namespace: 'default',
      gatewayClass: 'public',
      addresses: 'IPAddress/1.2.3.4',
      listeners: 'http:80/HTTP',
      attachedRoutes: 2,
      accepted: 'True',
      programmed: 'True',
      age: '',
      labels: { app: 'edge' },
      listenerDetails: [{
        name: 'http',
        protocol: 'HTTP',
        port: '80',
        hostname: 'app.example.com',
        attachedRoutes: 2,
        accepted: 'True',
        resolvedRefs: 'True',
        programmed: '-',
      }],
      conditions: [
        {
          type: 'Accepted',
          status: 'True',
          reason: 'Accepted',
          message: '-',
          lastTransitionTime: '-',
        },
        {
          type: 'Programmed',
          status: 'True',
          reason: 'Programmed',
          message: '-',
          lastTransitionTime: '-',
        },
      ],
    }])
    assert.deepEqual(httpRoutes, [{
      name: 'web',
      namespace: 'default',
      hostnames: 'app.example.com',
      parentRefs: 'Gateway/public-gw',
      rules: 1,
      backendRefs: 'Service/web:80 weight=1',
      accepted: 'True',
      resolvedRefs: 'True',
      age: '',
      labels: { app: 'web' },
      parentDetails: [{
        parentRef: 'Gateway/public-gw',
        controllerName: 'example.com/gateway-controller',
        accepted: 'True',
        resolvedRefs: 'True',
        programmed: '-',
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: '-',
            lastTransitionTime: '-',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: '-',
            lastTransitionTime: '-',
          },
        ],
      }],
    }])
    assert.deepEqual(grpcRoutes, [{
      name: 'grpc',
      namespace: 'default',
      hostnames: 'grpc.example.com',
      parentRefs: 'Gateway/public-gw#http',
      rules: 1,
      backendRefs: 'Service/grpc:50051',
      accepted: 'NoMatchingListener',
      resolvedRefs: 'True',
      age: '',
      labels: { app: 'grpc' },
      parentDetails: [{
        parentRef: 'Gateway/public-gw#http',
        controllerName: 'example.com/gateway-controller',
        accepted: 'NoMatchingListener',
        resolvedRefs: 'True',
        programmed: '-',
        conditions: [
          {
            type: 'Accepted',
            status: 'False',
            reason: 'NoMatchingListener',
            message: '-',
            lastTransitionTime: '-',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: '-',
            lastTransitionTime: '-',
          },
        ],
      }],
    }])
    assert.deepEqual(tlsRoutes, [{
      name: 'tls',
      namespace: 'default',
      hostnames: 'tls.example.com',
      parentRefs: 'Gateway/public-gw#tls',
      rules: 1,
      backendRefs: 'Service/tls:443',
      accepted: 'True',
      resolvedRefs: 'True',
      age: '',
      labels: { app: 'tls' },
      parentDetails: [{
        parentRef: 'Gateway/public-gw#tls',
        controllerName: 'example.com/gateway-controller',
        accepted: 'True',
        resolvedRefs: 'True',
        programmed: '-',
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: '-',
            lastTransitionTime: '-',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: '-',
            lastTransitionTime: '-',
          },
        ],
      }],
    }])
    assert.deepEqual(tcpRoutes, [{
      name: 'tcp',
      namespace: 'default',
      parentRefs: 'Gateway/public-gw#tcp',
      rules: 1,
      backendRefs: 'Service/tcp:9000',
      accepted: 'True',
      resolvedRefs: 'True',
      age: '',
      labels: { app: 'tcp' },
      parentDetails: [{
        parentRef: 'Gateway/public-gw#tcp',
        controllerName: 'example.com/gateway-controller',
        accepted: 'True',
        resolvedRefs: 'True',
        programmed: '-',
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: '-',
            lastTransitionTime: '-',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: '-',
            lastTransitionTime: '-',
          },
        ],
      }],
    }])
    assert.deepEqual(udpRoutes, [{
      name: 'udp',
      namespace: 'default',
      parentRefs: 'Gateway/public-gw#udp',
      rules: 1,
      backendRefs: 'Service/udp:9001',
      accepted: 'NoMatchingListener',
      resolvedRefs: 'True',
      age: '',
      labels: { app: 'udp' },
      parentDetails: [{
        parentRef: 'Gateway/public-gw#udp',
        controllerName: 'example.com/gateway-controller',
        accepted: 'NoMatchingListener',
        resolvedRefs: 'True',
        programmed: '-',
        conditions: [
          {
            type: 'Accepted',
            status: 'False',
            reason: 'NoMatchingListener',
            message: '-',
            lastTransitionTime: '-',
          },
          {
            type: 'ResolvedRefs',
            status: 'True',
            reason: 'ResolvedRefs',
            message: '-',
            lastTransitionTime: '-',
          },
        ],
      }],
    }])
    assert.deepEqual(referenceGrants, [{
      name: 'allow-web',
      namespace: 'default',
      from: 'gateway.networking.k8s.io/HTTPRoute:client/*',
      to: '/Service:web',
      age: '',
      labels: { app: 'web' },
      fromDetails: [{ group: 'gateway.networking.k8s.io', kind: 'HTTPRoute', namespace: 'client', name: undefined }],
      toDetails: [{ group: '', kind: 'Service', namespace: undefined, name: 'web' }],
    }])
    assert.match(classYaml, /"kind": "GatewayClass"/)
    assert.match(gatewayYaml, /"kind": "Gateway"/)
    assert.match(httpRouteYaml, /"kind": "HTTPRoute"/)
    assert.match(grpcRouteYaml, /"kind": "GRPCRoute"/)
    assert.match(tlsRouteYaml, /"kind": "TLSRoute"/)
    assert.match(tcpRouteYaml, /"kind": "TCPRoute"/)
    assert.match(udpRouteYaml, /"kind": "UDPRoute"/)
    assert.match(referenceGrantYaml, /"kind": "ReferenceGrant"/)
    assert.equal(applied.success, true)
    assert.equal(deletedClass.success, true)
    assert.equal(deletedGateway.success, true)
    assert.equal(deletedHTTPRoute.success, true)
    assert.equal(deletedGRPCRoute.success, true)
    assert.equal(deletedTLSRoute.success, true)
    assert.equal(deletedTCPRoute.success, true)
    assert.equal(deletedUDPRoute.success, true)
    assert.equal(deletedReferenceGrant.success, true)
    assert.equal(customObjects.__calls.patchClusterCustomObject[0][0].plural, 'gatewayclasses')
    assert.deepEqual(
      customObjects.__calls.patchNamespacedCustomObject.map((call) => `${call[0].version}/${call[0].plural}`),
      [
        'v1/gateways',
        'v1/httproutes',
        'v1/grpcroutes',
        'v1/tlsroutes',
        'v1alpha2/tcproutes',
        'v1alpha2/udproutes',
        'v1/referencegrants',
      ],
    )
    assert.equal(await patchContentType(customObjects.__calls.patchNamespacedCustomObject[0][1]), PatchStrategy.MergePatch)
    assert.deepEqual(customObjects.__calls.deleteClusterCustomObject[0][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      plural: 'gatewayclasses',
      name: 'public',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[0][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'gateways',
      name: 'public-gw',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[1][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'httproutes',
      name: 'web',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[2][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'grpcroutes',
      name: 'grpc',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[3][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'tlsroutes',
      name: 'tls',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[4][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1alpha2',
      namespace: 'default',
      plural: 'tcproutes',
      name: 'tcp',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[5][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1alpha2',
      namespace: 'default',
      plural: 'udproutes',
      name: 'udp',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[6][0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'referencegrants',
      name: 'allow-web',
      body: {},
    })
  })

  it('lists, reads, and deletes dynamic resource allocation resources', async () => {
    const deviceClass = {
      apiVersion: 'resource.k8s.io/v1',
      kind: 'DeviceClass',
      metadata: {
        name: 'gpu.example.com',
        labels: { tier: 'gpu' },
      },
      spec: {
        extendedResourceName: 'example.com/gpu',
        selectors: [{}],
        config: [{}],
      },
    }
    const resourceClaim = {
      apiVersion: 'resource.k8s.io/v1',
      kind: 'ResourceClaim',
      metadata: {
        name: 'gpu-claim',
        namespace: 'default',
        labels: { app: 'ai' },
      },
      spec: {
        devices: {
          requests: [{
            name: 'gpu',
            exactly: {
              deviceClassName: 'gpu.example.com',
              allocationMode: 'ExactCount',
              count: 1,
            },
          }],
        },
      },
      status: {
        allocation: {
          devices: {
            results: [{
              request: 'gpu',
              driver: 'gpu.example.com',
              pool: 'node-1',
              device: 'gpu0',
            }],
          },
        },
        reservedFor: [{ resource: 'pods', name: 'trainer' }],
      },
    }
    const resourceClaimTemplate = {
      apiVersion: 'resource.k8s.io/v1',
      kind: 'ResourceClaimTemplate',
      metadata: {
        name: 'gpu-template',
        namespace: 'default',
        labels: { app: 'ai' },
      },
      spec: {
        spec: {
          devices: {
            requests: [{
              name: 'gpu',
              exactly: {
                deviceClassName: 'gpu.example.com',
                count: 1,
              },
            }],
          },
        },
      },
    }
    const resourceSlice = {
      apiVersion: 'resource.k8s.io/v1',
      kind: 'ResourceSlice',
      metadata: {
        name: 'gpu-slice-node-1',
        labels: { node: 'node-1' },
      },
      spec: {
        driver: 'gpu.example.com',
        pool: { name: 'node-1', generation: 1, resourceSliceCount: 1 },
        nodeName: 'node-1',
        devices: [{ name: 'gpu0' }, { name: 'gpu1' }],
      },
    }
    const customObjects = createMockApi({
      listClusterCustomObject: async ({ plural }) => {
        if (plural === 'deviceclasses') return { items: [deviceClass] }
        if (plural === 'resourceslices') return { items: [resourceSlice] }
        return { items: [] }
      },
      listNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'resourceclaims') return { items: [resourceClaim] }
        return { items: [resourceClaimTemplate] }
      },
      getClusterCustomObject: async ({ plural }) => {
        if (plural === 'deviceclasses') return deviceClass
        return resourceSlice
      },
      getNamespacedCustomObject: async ({ plural }) => {
        if (plural === 'resourceclaims') return resourceClaim
        return resourceClaimTemplate
      },
      deleteClusterCustomObject: async () => ({}),
      deleteNamespacedCustomObject: async () => ({}),
    })
    const resource = createMockApi({
      patchDeviceClass: async ({ body }) => body,
      createDeviceClass: async ({ body }) => body,
      patchNamespacedResourceClaim: async ({ body }) => body,
      createNamespacedResourceClaim: async ({ body }) => body,
      patchNamespacedResourceClaimTemplate: async ({ body }) => body,
      createNamespacedResourceClaimTemplate: async ({ body }) => body,
      patchResourceSlice: async ({ body }) => body,
      createResourceSlice: async ({ body }) => body,
    })
    setupApis({ customObjects, resource })

    const kube = await importFresh('./src/main/kube.ts')
    const deviceClasses = await kube.listDeviceClasses(CONTEXT_ID)
    const resourceClaims = await kube.listResourceClaims(CONTEXT_ID, 'default')
    const resourceClaimTemplates = await kube.listResourceClaimTemplates(CONTEXT_ID, 'default')
    const resourceSlices = await kube.listResourceSlices(CONTEXT_ID)
    const applied = await kube.applyYaml(CONTEXT_ID, [
      JSON.stringify(deviceClass),
      JSON.stringify(resourceClaim),
      JSON.stringify(resourceClaimTemplate),
      JSON.stringify(resourceSlice),
    ].join('\n---\n'))
    const deviceClassYaml = await kube.getResourceYaml(CONTEXT_ID, 'DeviceClass', '', 'gpu.example.com')
    const resourceClaimYaml = await kube.getResourceYaml(CONTEXT_ID, 'ResourceClaim', 'default', 'gpu-claim')
    const resourceClaimTemplateYaml = await kube.getResourceYaml(CONTEXT_ID, 'ResourceClaimTemplate', 'default', 'gpu-template')
    const resourceSliceYaml = await kube.getResourceYaml(CONTEXT_ID, 'ResourceSlice', '', 'gpu-slice-node-1')
    const deletedDeviceClass = await kube.deleteResource(CONTEXT_ID, 'DeviceClass', '', 'gpu.example.com')
    const deletedResourceClaim = await kube.deleteResource(CONTEXT_ID, 'ResourceClaim', 'default', 'gpu-claim')
    const deletedResourceClaimTemplate = await kube.deleteResource(CONTEXT_ID, 'ResourceClaimTemplate', 'default', 'gpu-template')
    const deletedResourceSlice = await kube.deleteResource(CONTEXT_ID, 'ResourceSlice', '', 'gpu-slice-node-1')

    assert.deepEqual(deviceClasses, [{
      name: 'gpu.example.com',
      selectors: 1,
      config: 1,
      extendedResourceName: 'example.com/gpu',
      age: '',
      labels: { tier: 'gpu' },
    }])
    assert.deepEqual(resourceClaims, [{
      name: 'gpu-claim',
      namespace: 'default',
      requests: 1,
      deviceClasses: 'gpu.example.com',
      allocated: true,
      allocatedDevices: 1,
      reservedFor: 1,
      age: '',
      labels: { app: 'ai' },
      requestDetails: ['gpu: gpu.example.com ExactCount x1'],
      allocationDetails: ['gpu: gpu.example.com/node-1/gpu0'],
    }])
    assert.deepEqual(resourceClaimTemplates, [{
      name: 'gpu-template',
      namespace: 'default',
      requests: 1,
      deviceClasses: 'gpu.example.com',
      age: '',
      labels: { app: 'ai' },
      requestDetails: ['gpu: gpu.example.com ExactCount x1'],
    }])
    assert.deepEqual(resourceSlices, [{
      name: 'gpu-slice-node-1',
      driver: 'gpu.example.com',
      pool: 'node-1',
      node: 'node-1',
      devices: 2,
      allNodes: false,
      age: '',
      labels: { node: 'node-1' },
      deviceNames: ['gpu0', 'gpu1'],
    }])
    assert.match(deviceClassYaml, /"kind": "DeviceClass"/)
    assert.match(resourceClaimYaml, /"kind": "ResourceClaim"/)
    assert.match(resourceClaimTemplateYaml, /"kind": "ResourceClaimTemplate"/)
    assert.match(resourceSliceYaml, /"kind": "ResourceSlice"/)
    assert.equal(applied.success, true)
    assert.equal(deletedDeviceClass.success, true)
    assert.equal(deletedResourceClaim.success, true)
    assert.equal(deletedResourceClaimTemplate.success, true)
    assert.equal(deletedResourceSlice.success, true)
    assert.deepEqual(resource.__calls.patchDeviceClass[0][0].name, 'gpu.example.com')
    assert.equal(await patchContentType(resource.__calls.patchDeviceClass[0][1]), PatchStrategy.StrategicMergePatch)
    assert.deepEqual(resource.__calls.patchNamespacedResourceClaim[0][0].namespace, 'default')
    assert.deepEqual(resource.__calls.patchNamespacedResourceClaimTemplate[0][0].namespace, 'default')
    assert.deepEqual(resource.__calls.patchResourceSlice[0][0].name, 'gpu-slice-node-1')
    assert.deepEqual(customObjects.__calls.deleteClusterCustomObject[0][0], {
      group: 'resource.k8s.io',
      version: 'v1',
      plural: 'deviceclasses',
      name: 'gpu.example.com',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[0][0], {
      group: 'resource.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'resourceclaims',
      name: 'gpu-claim',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[1][0], {
      group: 'resource.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'resourceclaimtemplates',
      name: 'gpu-template',
      body: {},
    })
    assert.deepEqual(customObjects.__calls.deleteClusterCustomObject[1][0], {
      group: 'resource.k8s.io',
      version: 'v1',
      plural: 'resourceslices',
      name: 'gpu-slice-node-1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes device taint rules', async () => {
    const deviceTaintRule = {
      apiVersion: 'resource.k8s.io/v1alpha3',
      kind: 'DeviceTaintRule',
      metadata: {
        name: 'gpu-maintenance',
        labels: { tier: 'gpu' },
      },
      spec: {
        deviceSelector: {
          driver: 'gpu.example.com',
          pool: 'node-1',
          deviceClassName: 'gpu.example.com',
          device: 'gpu0',
          selectors: [{
            cel: {
              expression: 'device.attributes["example.com"].healthy == false',
            },
          }],
        },
        taint: {
          key: 'example.com/maintenance',
          value: 'scheduled',
          effect: 'NoSchedule',
          timeAdded: '2026-05-13T08:30:00Z',
        },
      },
    }
    const resourceAlpha = createMockApi({
      listDeviceTaintRule: async () => ({ items: [deviceTaintRule] }),
      readDeviceTaintRule: async () => deviceTaintRule,
      patchDeviceTaintRule: async () => deviceTaintRule,
      createDeviceTaintRule: async () => deviceTaintRule,
      deleteDeviceTaintRule: async () => ({}),
    })
    setupApis({ resourceAlpha })

    const kube = await importFresh('./src/main/kube.ts')
    const rules = await kube.listDeviceTaintRules(CONTEXT_ID)
    const ruleYaml = await kube.getResourceYaml(CONTEXT_ID, 'DeviceTaintRule', '', 'gpu-maintenance')
    const applied = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: resource.k8s.io/v1alpha3',
      'kind: DeviceTaintRule',
      'metadata:',
      '  name: gpu-maintenance',
      'spec:',
      '  deviceSelector:',
      '    driver: gpu.example.com',
      '    pool: node-1',
      '    deviceClassName: gpu.example.com',
      '    device: gpu0',
      '    selectors:',
      '    - cel:',
      '        expression: device.attributes["example.com"].healthy == false',
      '  taint:',
      '    key: example.com/maintenance',
      '    value: scheduled',
      '    effect: NoSchedule',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'DeviceTaintRule', '', 'gpu-maintenance')

    assert.deepEqual(rules, [{
      name: 'gpu-maintenance',
      driver: 'gpu.example.com',
      pool: 'node-1',
      deviceClassName: 'gpu.example.com',
      device: 'gpu0',
      celSelectors: 1,
      taintKey: 'example.com/maintenance',
      taintValue: 'scheduled',
      taintEffect: 'NoSchedule',
      timeAdded: '2026-05-13 08:30:00',
      age: '',
      labels: { tier: 'gpu' },
    }])
    assert.match(ruleYaml, /"kind": "DeviceTaintRule"/)
    assert.equal(applied.success, true)
    assert.equal(deleted.success, true)
    assert.deepEqual(resourceAlpha.__calls.patchDeviceTaintRule[0][0].name, 'gpu-maintenance')
    assert.equal(await patchContentType(resourceAlpha.__calls.patchDeviceTaintRule[0][1]), PatchStrategy.StrategicMergePatch)
    assert.deepEqual(resourceAlpha.__calls.deleteDeviceTaintRule[0][0], {
      name: 'gpu-maintenance',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes endpoints', async () => {
    const endpoints = {
      apiVersion: 'v1',
      kind: 'Endpoints',
      metadata: {
        name: 'web',
        namespace: 'default',
        labels: { app: 'web' },
      },
      subsets: [{
        addresses: [
          { ip: '10.0.0.1', hostname: 'web-1', nodeName: 'node-1', targetRef: { kind: 'Pod', name: 'web-1' } },
          { ip: '10.0.0.2', hostname: 'web-2', nodeName: 'node-2', targetRef: { kind: 'Pod', name: 'web-2' } },
        ],
        notReadyAddresses: [
          { ip: '10.0.0.3', hostname: 'web-3', nodeName: 'node-3', targetRef: { kind: 'Pod', name: 'web-3' } },
        ],
        ports: [{ name: 'http', port: 8080, protocol: 'TCP', appProtocol: 'kubernetes.io/h2c' }],
      }],
    }
    const core = createMockApi({
      listNamespacedEndpoints: async () => ({ items: [endpoints] }),
      readNamespacedEndpoints: async () => endpoints,
      patchNamespacedEndpoints: async () => endpoints,
      createNamespacedEndpoints: async () => endpoints,
      deleteNamespacedEndpoints: async () => ({}),
    })
    setupApis({ core })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listEndpoints(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'Endpoints', 'default', 'web')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: v1',
      'kind: Endpoints',
      'metadata:',
      '  name: web',
      '  namespace: default',
      'subsets:',
      '  - addresses:',
      '      - ip: 10.0.0.1',
      '    ports:',
      '      - name: http',
      '        port: 8080',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'Endpoints', 'default', 'web')

    assert.deepEqual(list, [{
      name: 'web',
      namespace: 'default',
      ready: 2,
      notReady: 1,
      addresses: '10.0.0.1, 10.0.0.2, 10.0.0.3',
      ports: 'http:8080/tcp',
      age: '',
      labels: { app: 'web' },
      addressDetails: [
        {
          ip: '10.0.0.1',
          ready: true,
          hostname: 'web-1',
          nodeName: 'node-1',
          targetKind: 'Pod',
          targetName: 'web-1',
        },
        {
          ip: '10.0.0.2',
          ready: true,
          hostname: 'web-2',
          nodeName: 'node-2',
          targetKind: 'Pod',
          targetName: 'web-2',
        },
        {
          ip: '10.0.0.3',
          ready: false,
          hostname: 'web-3',
          nodeName: 'node-3',
          targetKind: 'Pod',
          targetName: 'web-3',
        },
      ],
      portDetails: [{
        name: 'http',
        port: '8080',
        protocol: 'TCP',
        appProtocol: 'kubernetes.io/h2c',
      }],
    }])
    assert.match(yaml, /"kind": "Endpoints"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(core.__calls.patchNamespacedEndpoints[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(core.__calls.deleteNamespacedEndpoints[0][0], {
      namespace: 'default',
      name: 'web',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes endpoint slices', async () => {
    const endpointSlice = {
      apiVersion: 'discovery.k8s.io/v1',
      kind: 'EndpointSlice',
      addressType: 'IPv4',
      metadata: {
        name: 'web-abc',
        namespace: 'default',
        labels: {
          'kubernetes.io/service-name': 'web',
        },
      },
      endpoints: [
        {
          addresses: ['10.0.0.1'],
          conditions: { ready: true, serving: true },
          hostname: 'web-1',
          nodeName: 'node-a',
          zone: 'us-east-1a',
          targetRef: { kind: 'Pod', name: 'web-1' },
        },
        {
          addresses: ['10.0.0.2'],
          conditions: { ready: false, serving: true, terminating: true },
          nodeName: 'node-b',
          zone: 'us-east-1b',
          targetRef: { kind: 'Pod', name: 'web-2' },
        },
      ],
      ports: [{ name: 'http', port: 8080, protocol: 'TCP', appProtocol: 'kubernetes.io/h2c' }],
    }
    const discovery = createMockApi({
      listNamespacedEndpointSlice: async () => ({ items: [endpointSlice] }),
      readNamespacedEndpointSlice: async () => endpointSlice,
      patchNamespacedEndpointSlice: async () => endpointSlice,
      createNamespacedEndpointSlice: async () => endpointSlice,
      deleteNamespacedEndpointSlice: async () => ({}),
    })
    setupApis({ discovery })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listEndpointSlices(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'EndpointSlice', 'default', 'web-abc')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: discovery.k8s.io/v1',
      'kind: EndpointSlice',
      'metadata:',
      '  name: web-abc',
      '  namespace: default',
      'addressType: IPv4',
      'endpoints:',
      '  - addresses:',
      '      - 10.0.0.1',
      'ports:',
      '  - name: http',
      '    port: 8080',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'EndpointSlice', 'default', 'web-abc')

    assert.deepEqual(list, [{
      name: 'web-abc',
      namespace: 'default',
      addressType: 'IPv4',
      service: 'web',
      endpoints: 2,
      ready: 1,
      notReady: 1,
      addresses: '10.0.0.1, 10.0.0.2',
      ports: 'http:8080/tcp',
      age: '',
      labels: { 'kubernetes.io/service-name': 'web' },
      endpointDetails: [{
        addresses: '10.0.0.1',
        ready: true,
        serving: true,
        terminating: false,
        hostname: 'web-1',
        nodeName: 'node-a',
        zone: 'us-east-1a',
        targetKind: 'Pod',
        targetName: 'web-1',
      }, {
        addresses: '10.0.0.2',
        ready: false,
        serving: true,
        terminating: true,
        hostname: '-',
        nodeName: 'node-b',
        zone: 'us-east-1b',
        targetKind: 'Pod',
        targetName: 'web-2',
      }],
      portDetails: [{
        name: 'http',
        port: '8080',
        protocol: 'TCP',
        appProtocol: 'kubernetes.io/h2c',
      }],
    }])
    assert.match(yaml, /"kind": "EndpointSlice"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(discovery.__calls.patchNamespacedEndpointSlice[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(discovery.__calls.deleteNamespacedEndpointSlice[0][0], {
      namespace: 'default',
      name: 'web-abc',
      body: {},
    })
  })

  it('lists, reads, and deletes events with source and object metadata', async () => {
    const event = {
      apiVersion: 'events.k8s.io/v1',
      kind: 'Event',
      metadata: {
        name: 'web-1.abc123',
        namespace: 'default',
        labels: { app: 'web' },
      },
      regarding: {
        apiVersion: 'v1',
        kind: 'Pod',
        namespace: 'default',
        name: 'web-1',
        uid: 'pod-uid-1',
        fieldPath: 'spec.containers{web}',
      },
      related: {
        apiVersion: 'apps/v1',
        kind: 'ReplicaSet',
        namespace: 'default',
        name: 'web-abc',
        fieldPath: 'spec.template',
      },
      reason: 'BackOff',
      note: 'Back-off restarting failed container',
      type: 'Warning',
      deprecatedCount: 3,
      deprecatedFirstTimestamp: new Date('2024-01-01T00:00:00Z'),
      deprecatedLastTimestamp: new Date('2024-01-01T00:04:00Z'),
      eventTime: new Date('2024-01-01T00:04:30Z'),
      series: {
        count: 5,
        lastObservedTime: new Date('2024-01-01T00:05:00Z'),
      },
      deprecatedSource: {
        component: 'kubelet',
        host: 'node-1',
      },
      action: 'BackOff',
      reportingController: 'kubernetes.io/kubelet',
      reportingInstance: 'node-1',
    }
    const events = createMockApi({
      listNamespacedEvent: async () => ({ items: [event] }),
      readNamespacedEvent: async () => event,
      patchNamespacedEvent: async () => event,
      createNamespacedEvent: async () => event,
      deleteNamespacedEvent: async () => ({}),
    })
    setupApis({ events })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listEvents(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'Event', 'default', 'web-1.abc123')
    const applied = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: events.k8s.io/v1',
      'kind: Event',
      'metadata:',
      '  name: web-1.abc123',
      '  namespace: default',
      'reason: BackOff',
      'note: Back-off restarting failed container',
      'type: Warning',
      'eventTime: "2024-01-01T00:04:30Z"',
      'reportingController: kubernetes.io/kubelet',
      'reportingInstance: node-1',
      'regarding:',
      '  apiVersion: v1',
      '  kind: Pod',
      '  namespace: default',
      '  name: web-1',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'Event', 'default', 'web-1.abc123')
    const [{ age, ...listedEvent }] = list

    assert.match(age, /^\d+d$/)
    assert.deepEqual(listedEvent, {
      name: 'web-1.abc123',
      namespace: 'default',
      reason: 'BackOff',
      message: 'Back-off restarting failed container',
      type: 'Warning',
      object: 'Pod/web-1',
      count: 5,
      labels: { app: 'web' },
      objectApiVersion: 'v1',
      objectKind: 'Pod',
      objectName: 'web-1',
      objectNamespace: 'default',
      objectUid: 'pod-uid-1',
      objectFieldPath: 'spec.containers{web}',
      relatedObject: 'ReplicaSet/web-abc',
      relatedObjectKind: 'ReplicaSet',
      relatedObjectName: 'web-abc',
      relatedObjectNamespace: 'default',
      relatedObjectApiVersion: 'apps/v1',
      relatedObjectFieldPath: 'spec.template',
      sourceComponent: 'kubelet',
      sourceHost: 'node-1',
      action: 'BackOff',
      reportingComponent: 'kubernetes.io/kubelet',
      reportingInstance: 'node-1',
      firstTimestamp: '2024-01-01 00:00:00',
      lastTimestamp: '2024-01-01 00:05:00',
      eventTime: '2024-01-01 00:04:30',
    })
    assert.match(yaml, /"kind": "Event"/)
    assert.equal(applied.success, true)
    assert.equal(await patchContentType(events.__calls.patchNamespacedEvent[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(events.__calls.deleteNamespacedEvent[0][0], {
      namespace: 'default',
      name: 'web-1.abc123',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes API services', async () => {
    const apiService = {
      apiVersion: 'apiregistration.k8s.io/v1',
      kind: 'APIService',
      metadata: {
        name: 'v1alpha1.metrics.k8s.io',
        labels: { app: 'metrics-server' },
      },
      spec: {
        group: 'metrics.k8s.io',
        version: 'v1alpha1',
        service: {
          namespace: 'kube-system',
          name: 'metrics-server',
          port: 443,
        },
        caBundle: 'LS0t',
        groupPriorityMinimum: 100,
        versionPriority: 10,
        insecureSkipTLSVerify: true,
      },
      status: {
        conditions: [{
          type: 'Available',
          status: 'True',
          reason: 'Passed',
          message: 'all checks passed',
          lastTransitionTime: new Date('2024-01-01T00:00:00Z'),
        }],
      },
    }
    const apiregistration = createMockApi({
      listAPIService: async () => ({ items: [apiService] }),
      readAPIService: async () => apiService,
      patchAPIService: async () => apiService,
      createAPIService: async () => apiService,
      deleteAPIService: async () => ({}),
    })
    setupApis({ apiregistration })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listAPIServices(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'APIService', '', 'v1alpha1.metrics.k8s.io')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: apiregistration.k8s.io/v1',
      'kind: APIService',
      'metadata:',
      '  name: v1alpha1.metrics.k8s.io',
      'spec:',
      '  group: metrics.k8s.io',
      '  version: v1alpha1',
      '  service:',
      '    namespace: kube-system',
      '    name: metrics-server',
      '    port: 443',
      '  groupPriorityMinimum: 100',
      '  versionPriority: 10',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'APIService', '', 'v1alpha1.metrics.k8s.io')

    assert.deepEqual(list, [{
      name: 'v1alpha1.metrics.k8s.io',
      group: 'metrics.k8s.io',
      version: 'v1alpha1',
      service: 'kube-system/metrics-server:443',
      serviceNamespace: 'kube-system',
      serviceName: 'metrics-server',
      servicePort: 443,
      available: 'True',
      reason: 'Passed',
      groupPriority: 100,
      versionPriority: 10,
      insecureSkipTLSVerify: true,
      caBundleConfigured: true,
      age: '',
      labels: { app: 'metrics-server' },
      conditionDetails: [{
        type: 'Available',
        status: 'True',
        reason: 'Passed',
        message: 'all checks passed',
        lastTransitionTime: '2024-01-01 00:00:00',
      }],
    }])
    assert.match(yaml, /"kind": "APIService"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(apiregistration.__calls.patchAPIService[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(apiregistration.__calls.deleteAPIService[0][0], {
      name: 'v1alpha1.metrics.k8s.io',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes admission webhook configurations', async () => {
    const mutating = {
      apiVersion: 'admissionregistration.k8s.io/v1',
      kind: 'MutatingWebhookConfiguration',
      metadata: {
        name: 'mutate.example.com',
        labels: { app: 'admission' },
      },
      webhooks: [{
        name: 'mutate.example.com',
        admissionReviewVersions: ['v1'],
        sideEffects: 'None',
        failurePolicy: 'Fail',
        matchPolicy: 'Equivalent',
        reinvocationPolicy: 'IfNeeded',
        timeoutSeconds: 15,
        namespaceSelector: { matchLabels: { admission: 'enabled' } },
        objectSelector: { matchLabels: { app: 'web' } },
        matchConditions: [{ name: 'skip-leases', expression: 'request.resource.resource != "leases"' }],
        clientConfig: {
          caBundle: 'LS0t',
          service: {
            namespace: 'admission',
            name: 'mutator',
            path: '/mutate',
            port: 443,
          },
        },
        rules: [{
          operations: ['CREATE', 'UPDATE'],
          apiGroups: ['apps'],
          apiVersions: ['v1'],
          resources: ['deployments'],
          scope: 'Namespaced',
        }],
      }],
    }
    const validating = {
      apiVersion: 'admissionregistration.k8s.io/v1',
      kind: 'ValidatingWebhookConfiguration',
      metadata: {
        name: 'validate.example.com',
      },
      webhooks: [{
        name: 'validate.example.com',
        admissionReviewVersions: ['v1'],
        sideEffects: 'None',
        failurePolicy: 'Ignore',
        matchPolicy: 'Exact',
        timeoutSeconds: 5,
        clientConfig: {
          url: 'https://admission.example.com/validate',
        },
        rules: [{
          operations: ['DELETE'],
          apiGroups: [''],
          apiVersions: ['v1'],
          resources: ['pods'],
        }],
      }],
    }
    const admission = createMockApi({
      listMutatingWebhookConfiguration: async () => ({ items: [mutating] }),
      readMutatingWebhookConfiguration: async () => mutating,
      patchMutatingWebhookConfiguration: async () => mutating,
      createMutatingWebhookConfiguration: async () => mutating,
      deleteMutatingWebhookConfiguration: async () => ({}),
      listValidatingWebhookConfiguration: async () => ({ items: [validating] }),
      readValidatingWebhookConfiguration: async () => validating,
      patchValidatingWebhookConfiguration: async () => validating,
      createValidatingWebhookConfiguration: async () => validating,
      deleteValidatingWebhookConfiguration: async () => ({}),
    })
    setupApis({ admission })

    const kube = await importFresh('./src/main/kube.ts')
    const mutatingList = await kube.listMutatingWebhookConfigurations(CONTEXT_ID)
    const validatingList = await kube.listValidatingWebhookConfigurations(CONTEXT_ID)
    const mutatingYaml = await kube.getResourceYaml(CONTEXT_ID, 'MutatingWebhookConfiguration', '', 'mutate.example.com')
    const validatingYaml = await kube.getResourceYaml(CONTEXT_ID, 'ValidatingWebhookConfiguration', '', 'validate.example.com')
    const mutatingApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1',
      'kind: MutatingWebhookConfiguration',
      'metadata:',
      '  name: mutate.example.com',
      'webhooks: []',
      '',
    ].join('\n'))
    const validatingApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1',
      'kind: ValidatingWebhookConfiguration',
      'metadata:',
      '  name: validate.example.com',
      'webhooks: []',
      '',
    ].join('\n'))
    const mutatingDeleted = await kube.deleteResource(CONTEXT_ID, 'MutatingWebhookConfiguration', '', 'mutate.example.com')
    const validatingDeleted = await kube.deleteResource(CONTEXT_ID, 'ValidatingWebhookConfiguration', '', 'validate.example.com')

    assert.deepEqual(mutatingList, [{
      name: 'mutate.example.com',
      webhooks: 1,
      failurePolicies: 'Fail',
      sideEffects: 'None',
      admissionReviewVersions: 'v1',
      clients: 'svc:admission/mutator:443/mutate',
      rules: 'CREATE,UPDATE deployments',
      age: '',
      labels: { app: 'admission' },
      webhookDetails: [{
        name: 'mutate.example.com',
        client: 'svc:admission/mutator:443/mutate',
        serviceNamespace: 'admission',
        serviceName: 'mutator',
        servicePort: 443,
        servicePath: '/mutate',
        failurePolicy: 'Fail',
        sideEffects: 'None',
        admissionReviewVersions: 'v1',
        matchPolicy: 'Equivalent',
        reinvocationPolicy: 'IfNeeded',
        timeoutSeconds: '15',
        namespaceSelector: 'admission=enabled',
        objectSelector: 'app=web',
        rules: 1,
        matchConditions: 1,
        caBundleConfigured: true,
      }],
      ruleDetails: [{
        webhookName: 'mutate.example.com',
        operations: 'CREATE, UPDATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments',
        scope: 'Namespaced',
      }],
    }])
    assert.deepEqual(validatingList, [{
      name: 'validate.example.com',
      webhooks: 1,
      failurePolicies: 'Ignore',
      sideEffects: 'None',
      admissionReviewVersions: 'v1',
      clients: 'https://admission.example.com/validate',
      rules: 'DELETE pods',
      age: '',
      labels: undefined,
      webhookDetails: [{
        name: 'validate.example.com',
        client: 'https://admission.example.com/validate',
        serviceNamespace: undefined,
        serviceName: undefined,
        servicePort: undefined,
        servicePath: undefined,
        failurePolicy: 'Ignore',
        sideEffects: 'None',
        admissionReviewVersions: 'v1',
        matchPolicy: 'Exact',
        reinvocationPolicy: '-',
        timeoutSeconds: '5',
        namespaceSelector: 'all',
        objectSelector: 'all',
        rules: 1,
        matchConditions: 0,
        caBundleConfigured: false,
      }],
      ruleDetails: [{
        webhookName: 'validate.example.com',
        operations: 'DELETE',
        apiGroups: 'core',
        apiVersions: 'v1',
        resources: 'pods',
        scope: '*',
      }],
    }])
    assert.match(mutatingYaml, /"kind": "MutatingWebhookConfiguration"/)
    assert.match(validatingYaml, /"kind": "ValidatingWebhookConfiguration"/)
    assert.equal(mutatingApply.success, true)
    assert.equal(validatingApply.success, true)
    assert.equal(await patchContentType(admission.__calls.patchMutatingWebhookConfiguration[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(admission.__calls.patchValidatingWebhookConfiguration[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(mutatingDeleted.success, true)
    assert.equal(validatingDeleted.success, true)
    assert.deepEqual(admission.__calls.deleteMutatingWebhookConfiguration[0][0], {
      name: 'mutate.example.com',
      body: {},
    })
    assert.deepEqual(admission.__calls.deleteValidatingWebhookConfiguration[0][0], {
      name: 'validate.example.com',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes validating admission policies and bindings without exposing CEL expressions in lists', async () => {
    const policy = {
      apiVersion: 'admissionregistration.k8s.io/v1',
      kind: 'ValidatingAdmissionPolicy',
      metadata: {
        name: 'require-team-label',
        labels: { app: 'admission' },
      },
      spec: {
        failurePolicy: 'Fail',
        paramKind: {
          apiVersion: 'rules.example.com/v1',
          kind: 'LabelPolicy',
        },
        matchConstraints: {
          resourceRules: [{
            operations: ['CREATE', 'UPDATE'],
            apiGroups: ['apps'],
            apiVersions: ['v1'],
            resources: ['deployments'],
            resourceNames: ['web'],
            scope: 'Namespaced',
          }],
          excludeResourceRules: [{
            operations: ['UPDATE'],
            apiGroups: ['apps'],
            apiVersions: ['v1'],
            resources: ['deployments/status'],
          }],
        },
        validations: [{
          expression: 'has(object.metadata.labels.team)',
          message: 'team label is required',
          reason: 'Invalid',
        }],
        auditAnnotations: [{ key: 'team', valueExpression: 'object.metadata.labels.team' }],
      },
      status: {
        conditions: [{
          type: 'Ready',
          status: 'True',
          reason: 'Ready',
          message: 'policy is ready',
          lastTransitionTime: new Date('2024-01-01T00:00:00Z'),
        }],
        typeChecking: {
          expressionWarnings: [{ fieldRef: 'spec.validations[0].expression', warning: 'warn' }],
        },
      },
    }
    const binding = {
      apiVersion: 'admissionregistration.k8s.io/v1',
      kind: 'ValidatingAdmissionPolicyBinding',
      metadata: {
        name: 'require-team-label-prod',
      },
      spec: {
        policyName: 'require-team-label',
        validationActions: ['Deny', 'Audit'],
        paramRef: {
          name: 'team-labels',
          namespace: 'platform',
          parameterNotFoundAction: 'Deny',
        },
        matchResources: {
          resourceRules: [{
            operations: ['CREATE'],
            apiGroups: ['apps'],
            apiVersions: ['v1'],
            resources: ['deployments'],
            resourceNames: ['web'],
            scope: 'Namespaced',
          }],
        },
      },
    }
    const admission = createMockApi({
      listValidatingAdmissionPolicy: async () => ({ items: [policy] }),
      readValidatingAdmissionPolicy: async () => policy,
      patchValidatingAdmissionPolicy: async () => policy,
      createValidatingAdmissionPolicy: async () => policy,
      deleteValidatingAdmissionPolicy: async () => ({}),
      listValidatingAdmissionPolicyBinding: async () => ({ items: [binding] }),
      readValidatingAdmissionPolicyBinding: async () => binding,
      patchValidatingAdmissionPolicyBinding: async () => binding,
      createValidatingAdmissionPolicyBinding: async () => binding,
      deleteValidatingAdmissionPolicyBinding: async () => ({}),
    })
    setupApis({ admission })

    const kube = await importFresh('./src/main/kube.ts')
    const policies = await kube.listValidatingAdmissionPolicies(CONTEXT_ID)
    const bindings = await kube.listValidatingAdmissionPolicyBindings(CONTEXT_ID)
    const policyYaml = await kube.getResourceYaml(CONTEXT_ID, 'ValidatingAdmissionPolicy', '', 'require-team-label')
    const bindingYaml = await kube.getResourceYaml(CONTEXT_ID, 'ValidatingAdmissionPolicyBinding', '', 'require-team-label-prod')
    const policyApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1',
      'kind: ValidatingAdmissionPolicy',
      'metadata:',
      '  name: require-team-label',
      'spec:',
      '  failurePolicy: Fail',
      '  validations:',
      '    - expression: has(object.metadata.labels.team)',
      '',
    ].join('\n'))
    const bindingApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1',
      'kind: ValidatingAdmissionPolicyBinding',
      'metadata:',
      '  name: require-team-label-prod',
      'spec:',
      '  policyName: require-team-label',
      '  validationActions:',
      '    - Deny',
      '',
    ].join('\n'))
    const policyDeleted = await kube.deleteResource(CONTEXT_ID, 'ValidatingAdmissionPolicy', '', 'require-team-label')
    const bindingDeleted = await kube.deleteResource(CONTEXT_ID, 'ValidatingAdmissionPolicyBinding', '', 'require-team-label-prod')

    assert.deepEqual(policies, [{
      name: 'require-team-label',
      failurePolicy: 'Fail',
      validations: 1,
      auditAnnotations: 1,
      matchConstraints: 'CREATE,UPDATE deployments; exclude UPDATE deployments/status',
      paramKind: 'rules.example.com/v1/LabelPolicy',
      condition: 'Ready',
      warnings: 1,
      age: '',
      labels: { app: 'admission' },
      validationDetails: [{
        index: 1,
        expressionConfigured: true,
        message: 'team label is required',
        reason: 'Invalid',
        messageExpressionConfigured: false,
      }],
      auditAnnotationDetails: [{
        key: 'team',
        valueExpressionConfigured: true,
      }],
      matchRuleDetails: [{
        direction: 'Include',
        operations: 'CREATE, UPDATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments',
        resourceNames: 'web',
        scope: 'Namespaced',
      }, {
        direction: 'Exclude',
        operations: 'UPDATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments/status',
        resourceNames: '-',
        scope: '*',
      }],
      conditionDetails: [{
        type: 'Ready',
        status: 'True',
        reason: 'Ready',
        message: 'policy is ready',
        lastTransitionTime: '2024-01-01 00:00:00',
      }],
      warningDetails: [{
        fieldRef: 'spec.validations[0].expression',
        warning: 'warn',
      }],
    }])
    assert.deepEqual(bindings, [{
      name: 'require-team-label-prod',
      policyName: 'require-team-label',
      validationActions: 'Deny, Audit',
      paramRef: 'platform/team-labels (Deny)',
      matchResources: 'CREATE deployments',
      age: '',
      labels: undefined,
      paramRefDetails: {
        name: 'team-labels',
        namespace: 'platform',
        selector: 'all',
        parameterNotFoundAction: 'Deny',
      },
      matchRuleDetails: [{
        direction: 'Include',
        operations: 'CREATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments',
        resourceNames: 'web',
        scope: 'Namespaced',
      }],
    }])
    assert.doesNotMatch(JSON.stringify(policies), /has\(object\.metadata\.labels\.team\)/)
    assert.doesNotMatch(JSON.stringify(bindings), /has\(object\.metadata\.labels\.team\)/)
    assert.match(policyYaml, /"kind": "ValidatingAdmissionPolicy"/)
    assert.match(policyYaml, /has\(object\.metadata\.labels\.team\)/)
    assert.match(bindingYaml, /"kind": "ValidatingAdmissionPolicyBinding"/)
    assert.equal(policyApply.success, true)
    assert.equal(bindingApply.success, true)
    assert.equal(await patchContentType(admission.__calls.patchValidatingAdmissionPolicy[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(admission.__calls.patchValidatingAdmissionPolicyBinding[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(policyDeleted.success, true)
    assert.equal(bindingDeleted.success, true)
    assert.deepEqual(admission.__calls.deleteValidatingAdmissionPolicy[0][0], {
      name: 'require-team-label',
      body: {},
    })
    assert.deepEqual(admission.__calls.deleteValidatingAdmissionPolicyBinding[0][0], {
      name: 'require-team-label-prod',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes mutating admission policies and bindings without exposing CEL expressions in lists', async () => {
    const policy = {
      apiVersion: 'admissionregistration.k8s.io/v1beta1',
      kind: 'MutatingAdmissionPolicy',
      metadata: {
        name: 'inject-team-label',
        labels: { app: 'admission' },
      },
      spec: {
        failurePolicy: 'Ignore',
        reinvocationPolicy: 'IfNeeded',
        paramKind: {
          apiVersion: 'rules.example.com/v1',
          kind: 'MutationPolicy',
        },
        matchConstraints: {
          resourceRules: [{
            operations: ['CREATE'],
            apiGroups: ['apps'],
            apiVersions: ['v1'],
            resources: ['deployments'],
            resourceNames: ['web'],
            scope: 'Namespaced',
          }],
        },
        matchConditions: [{
          name: 'has-team',
          expression: 'has(object.metadata.labels.team)',
        }],
        variables: [{
          name: 'team',
          expression: 'object.metadata.labels.team',
        }],
        mutations: [{
          patchType: 'ApplyConfiguration',
          applyConfiguration: {
            expression: 'Object{metadata: Object.metadata{labels: {"team": variables.team}}}',
          },
        }, {
          patchType: 'JSONPatch',
          jsonPatch: {
            expression: '[JSONPatch{op: "add", path: "/metadata/labels/injected", value: "true"}]',
          },
        }],
      },
    }
    const binding = {
      apiVersion: 'admissionregistration.k8s.io/v1beta1',
      kind: 'MutatingAdmissionPolicyBinding',
      metadata: {
        name: 'inject-team-label-prod',
      },
      spec: {
        policyName: 'inject-team-label',
        paramRef: {
          name: 'team-mutations',
          namespace: 'platform',
          parameterNotFoundAction: 'Allow',
        },
        matchResources: {
          resourceRules: [{
            operations: ['CREATE'],
            apiGroups: ['apps'],
            apiVersions: ['v1'],
            resources: ['deployments'],
            resourceNames: ['web'],
            scope: 'Namespaced',
          }],
        },
      },
    }
    const admissionBeta = createMockApi({
      listMutatingAdmissionPolicy: async () => ({ items: [policy] }),
      readMutatingAdmissionPolicy: async () => policy,
      patchMutatingAdmissionPolicy: async () => policy,
      createMutatingAdmissionPolicy: async () => policy,
      deleteMutatingAdmissionPolicy: async () => ({}),
      listMutatingAdmissionPolicyBinding: async () => ({ items: [binding] }),
      readMutatingAdmissionPolicyBinding: async () => binding,
      patchMutatingAdmissionPolicyBinding: async () => binding,
      createMutatingAdmissionPolicyBinding: async () => binding,
      deleteMutatingAdmissionPolicyBinding: async () => ({}),
    })
    setupApis({ admissionBeta })

    const kube = await importFresh('./src/main/kube.ts')
    const policies = await kube.listMutatingAdmissionPolicies(CONTEXT_ID)
    const bindings = await kube.listMutatingAdmissionPolicyBindings(CONTEXT_ID)
    const policyYaml = await kube.getResourceYaml(CONTEXT_ID, 'MutatingAdmissionPolicy', '', 'inject-team-label')
    const bindingYaml = await kube.getResourceYaml(CONTEXT_ID, 'MutatingAdmissionPolicyBinding', '', 'inject-team-label-prod')
    const policyApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1beta1',
      'kind: MutatingAdmissionPolicy',
      'metadata:',
      '  name: inject-team-label',
      'spec:',
      '  failurePolicy: Ignore',
      '  reinvocationPolicy: IfNeeded',
      '  mutations:',
      '    - patchType: ApplyConfiguration',
      '      applyConfiguration:',
      '        expression: Object{}',
      '',
    ].join('\n'))
    const bindingApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: admissionregistration.k8s.io/v1beta1',
      'kind: MutatingAdmissionPolicyBinding',
      'metadata:',
      '  name: inject-team-label-prod',
      'spec:',
      '  policyName: inject-team-label',
      '',
    ].join('\n'))
    const policyDeleted = await kube.deleteResource(CONTEXT_ID, 'MutatingAdmissionPolicy', '', 'inject-team-label')
    const bindingDeleted = await kube.deleteResource(CONTEXT_ID, 'MutatingAdmissionPolicyBinding', '', 'inject-team-label-prod')

    assert.deepEqual(policies, [{
      name: 'inject-team-label',
      failurePolicy: 'Ignore',
      reinvocationPolicy: 'IfNeeded',
      mutations: 2,
      variables: 1,
      matchConditions: 1,
      matchConstraints: 'CREATE deployments',
      paramKind: 'rules.example.com/v1/MutationPolicy',
      age: '',
      labels: { app: 'admission' },
      mutationDetails: [{
        index: 1,
        patchType: 'ApplyConfiguration',
        applyConfigurationConfigured: true,
        jsonPatchConfigured: false,
      }, {
        index: 2,
        patchType: 'JSONPatch',
        applyConfigurationConfigured: false,
        jsonPatchConfigured: true,
      }],
      variableDetails: [{
        name: 'team',
        expressionConfigured: true,
      }],
      matchConditionDetails: [{
        name: 'has-team',
        expressionConfigured: true,
      }],
      matchRuleDetails: [{
        direction: 'Include',
        operations: 'CREATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments',
        resourceNames: 'web',
        scope: 'Namespaced',
      }],
    }])
    assert.deepEqual(bindings, [{
      name: 'inject-team-label-prod',
      policyName: 'inject-team-label',
      paramRef: 'platform/team-mutations (Allow)',
      matchResources: 'CREATE deployments',
      age: '',
      labels: undefined,
      paramRefDetails: {
        name: 'team-mutations',
        namespace: 'platform',
        selector: 'all',
        parameterNotFoundAction: 'Allow',
      },
      matchRuleDetails: [{
        direction: 'Include',
        operations: 'CREATE',
        apiGroups: 'apps',
        apiVersions: 'v1',
        resources: 'deployments',
        resourceNames: 'web',
        scope: 'Namespaced',
      }],
    }])
    assert.doesNotMatch(JSON.stringify(policies), /Object\{metadata/)
    assert.doesNotMatch(JSON.stringify(bindings), /Object\{metadata/)
    assert.match(policyYaml, /"kind": "MutatingAdmissionPolicy"/)
    assert.match(policyYaml, /Object\{metadata/)
    assert.match(bindingYaml, /"kind": "MutatingAdmissionPolicyBinding"/)
    assert.equal(policyApply.success, true)
    assert.equal(bindingApply.success, true)
    assert.equal(await patchContentType(admissionBeta.__calls.patchMutatingAdmissionPolicy[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(admissionBeta.__calls.patchMutatingAdmissionPolicyBinding[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(policyDeleted.success, true)
    assert.equal(bindingDeleted.success, true)
    assert.deepEqual(admissionBeta.__calls.deleteMutatingAdmissionPolicy[0][0], {
      name: 'inject-team-label',
      body: {},
    })
    assert.deepEqual(admissionBeta.__calls.deleteMutatingAdmissionPolicyBinding[0][0], {
      name: 'inject-team-label-prod',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes flow control resources', async () => {
    const flowSchema = {
      apiVersion: 'flowcontrol.apiserver.k8s.io/v1',
      kind: 'FlowSchema',
      metadata: {
        name: 'service-accounts',
        labels: { app: 'flowcontrol' },
      },
      spec: {
        priorityLevelConfiguration: { name: 'workload-low' },
        matchingPrecedence: 900,
        distinguisherMethod: { type: 'ByNamespace' },
        rules: [{
          subjects: [{ kind: 'Group', group: { name: 'system:serviceaccounts' } }],
          resourceRules: [{
            verbs: ['get', 'list'],
            apiGroups: ['*'],
            resources: ['pods'],
            namespaces: ['*'],
          }],
          nonResourceRules: [{
            verbs: ['get'],
            nonResourceURLs: ['/healthz'],
          }],
        }],
      },
      status: {
        conditions: [{
          type: 'Dangling',
          status: 'False',
          reason: 'Found',
          message: 'referenced priority level exists',
          lastTransitionTime: new Date('2026-05-12T08:00:00Z'),
        }],
      },
    }
    const priorityLevel = {
      apiVersion: 'flowcontrol.apiserver.k8s.io/v1',
      kind: 'PriorityLevelConfiguration',
      metadata: {
        name: 'workload-low',
      },
      spec: {
        type: 'Limited',
        limited: {
          nominalConcurrencyShares: 20,
          lendablePercent: 10,
          borrowingLimitPercent: 50,
          limitResponse: {
            type: 'Queue',
            queuing: {
              queues: 32,
              handSize: 6,
              queueLengthLimit: 50,
            },
          },
        },
      },
      status: {
        conditions: [{
          type: 'ConcurrencyShared',
          status: 'True',
          reason: 'AsExpected',
          message: 'queues are configured',
          lastTransitionTime: new Date('2026-05-12T08:05:00Z'),
        }],
      },
    }
    const flowcontrol = createMockApi({
      listFlowSchema: async () => ({ items: [flowSchema] }),
      readFlowSchema: async () => flowSchema,
      patchFlowSchema: async () => flowSchema,
      createFlowSchema: async () => flowSchema,
      deleteFlowSchema: async () => ({}),
      listPriorityLevelConfiguration: async () => ({ items: [priorityLevel] }),
      readPriorityLevelConfiguration: async () => priorityLevel,
      patchPriorityLevelConfiguration: async () => priorityLevel,
      createPriorityLevelConfiguration: async () => priorityLevel,
      deletePriorityLevelConfiguration: async () => ({}),
    })
    setupApis({ flowcontrol })

    const kube = await importFresh('./src/main/kube.ts')
    const flowSchemas = await kube.listFlowSchemas(CONTEXT_ID)
    const priorityLevels = await kube.listPriorityLevelConfigurations(CONTEXT_ID)
    const flowYaml = await kube.getResourceYaml(CONTEXT_ID, 'FlowSchema', '', 'service-accounts')
    const priorityYaml = await kube.getResourceYaml(CONTEXT_ID, 'PriorityLevelConfiguration', '', 'workload-low')
    const flowApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: flowcontrol.apiserver.k8s.io/v1',
      'kind: FlowSchema',
      'metadata:',
      '  name: service-accounts',
      'spec:',
      '  priorityLevelConfiguration:',
      '    name: workload-low',
      '  matchingPrecedence: 900',
      '  rules: []',
      '',
    ].join('\n'))
    const priorityApply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: flowcontrol.apiserver.k8s.io/v1',
      'kind: PriorityLevelConfiguration',
      'metadata:',
      '  name: workload-low',
      'spec:',
      '  type: Limited',
      '',
    ].join('\n'))
    const flowDeleted = await kube.deleteResource(CONTEXT_ID, 'FlowSchema', '', 'service-accounts')
    const priorityDeleted = await kube.deleteResource(CONTEXT_ID, 'PriorityLevelConfiguration', '', 'workload-low')

    assert.deepEqual(flowSchemas, [{
      name: 'service-accounts',
      priorityLevel: 'workload-low',
      matchingPrecedence: 900,
      distinguisherMethod: 'ByNamespace',
      subjects: 'group:system:serviceaccounts',
      rules: 'get,list pods; nonResource get /healthz',
      condition: 'Ready',
      age: '',
      labels: { app: 'flowcontrol' },
      subjectDetails: [{
        ruleIndex: 1,
        kind: 'Group',
        name: 'system:serviceaccounts',
        namespace: '-',
      }],
      resourceRuleDetails: [{
        ruleIndex: 1,
        subjects: 'group:system:serviceaccounts',
        verbs: 'get, list',
        apiGroups: '*',
        resources: 'pods',
        namespaces: '*',
        clusterScope: false,
      }],
      nonResourceRuleDetails: [{
        ruleIndex: 1,
        subjects: 'group:system:serviceaccounts',
        verbs: 'get',
        nonResourceURLs: '/healthz',
      }],
      conditionDetails: [{
        type: 'Dangling',
        status: 'False',
        reason: 'Found',
        message: 'referenced priority level exists',
        lastTransitionTime: '2026-05-12 08:00:00',
      }],
    }])
    assert.deepEqual(priorityLevels, [{
      name: 'workload-low',
      type: 'Limited',
      nominalConcurrencyShares: '20',
      lendablePercent: '10',
      borrowingLimitPercent: '50',
      limitResponse: 'Queue',
      queues: '32',
      handSize: '6',
      queueLengthLimit: '50',
      condition: 'ConcurrencyShared',
      age: '',
      labels: undefined,
      conditionDetails: [{
        type: 'ConcurrencyShared',
        status: 'True',
        reason: 'AsExpected',
        message: 'queues are configured',
        lastTransitionTime: '2026-05-12 08:05:00',
      }],
    }])
    assert.match(flowYaml, /"kind": "FlowSchema"/)
    assert.match(priorityYaml, /"kind": "PriorityLevelConfiguration"/)
    assert.equal(flowApply.success, true)
    assert.equal(priorityApply.success, true)
    assert.equal(await patchContentType(flowcontrol.__calls.patchFlowSchema[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(flowcontrol.__calls.patchPriorityLevelConfiguration[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(flowDeleted.success, true)
    assert.equal(priorityDeleted.success, true)
    assert.deepEqual(flowcontrol.__calls.deleteFlowSchema[0][0], {
      name: 'service-accounts',
      body: {},
    })
    assert.deepEqual(flowcontrol.__calls.deletePriorityLevelConfiguration[0][0], {
      name: 'workload-low',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes certificate signing requests without exposing request payloads', async () => {
    const csr = {
      apiVersion: 'certificates.k8s.io/v1',
      kind: 'CertificateSigningRequest',
      metadata: {
        name: 'node-client',
        labels: { node: 'node-1' },
      },
      spec: {
        signerName: 'kubernetes.io/kube-apiserver-client-kubelet',
        username: 'system:node:node-1',
        groups: ['system:nodes', 'system:authenticated'],
        usages: ['client auth'],
        expirationSeconds: 3600,
        request: 'redacted-request',
      },
      status: {
        certificate: 'redacted-certificate',
        conditions: [{
          type: 'Approved',
          status: 'True',
          reason: 'AutoApproved',
          message: 'approved by kube-controller-manager',
          lastUpdateTime: new Date('2026-05-12T09:00:00Z'),
          lastTransitionTime: new Date('2026-05-12T09:00:01Z'),
        }],
      },
    }
    const certificates = createMockApi({
      listCertificateSigningRequest: async () => ({ items: [csr] }),
      readCertificateSigningRequest: async () => csr,
      patchCertificateSigningRequest: async () => csr,
      patchCertificateSigningRequestApproval: async ({ body }) => ({ ...csr, status: body.status }),
      createCertificateSigningRequest: async () => csr,
      deleteCertificateSigningRequest: async () => ({}),
    })
    setupApis({ certificates })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCertificateSigningRequests(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'CertificateSigningRequest', '', 'node-client')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: certificates.k8s.io/v1',
      'kind: CertificateSigningRequest',
      'metadata:',
      '  name: node-client',
      'spec:',
      '  signerName: kubernetes.io/kube-apiserver-client-kubelet',
      '  request: redacted-request',
      '',
    ].join('\n'))
    const approved = await kube.updateCertificateSigningRequestApproval(CONTEXT_ID, 'node-client', 'approve')
    const denied = await kube.updateCertificateSigningRequestApproval(CONTEXT_ID, 'node-client', 'deny')
    const deleted = await kube.deleteResource(CONTEXT_ID, 'CertificateSigningRequest', '', 'node-client')

    assert.deepEqual(list, [{
      name: 'node-client',
      signerName: 'kubernetes.io/kube-apiserver-client-kubelet',
      requestor: 'system:node:node-1',
      groups: 'system:nodes, system:authenticated',
      condition: 'Approved',
      reason: 'AutoApproved',
      usages: 'client auth',
      expirationSeconds: 3600,
      requestConfigured: true,
      certificateConfigured: true,
      age: '',
      labels: { node: 'node-1' },
      conditionDetails: [{
        type: 'Approved',
        status: 'True',
        reason: 'AutoApproved',
        message: 'approved by kube-controller-manager',
        lastUpdateTime: '2026-05-12 09:00:00',
        lastTransitionTime: '2026-05-12 09:00:01',
      }],
    }])
    assert.doesNotMatch(JSON.stringify(list), /redacted-request/)
    assert.doesNotMatch(JSON.stringify(list), /redacted-certificate/)
    assert.match(yaml, /"kind": "CertificateSigningRequest"/)
    assert.match(yaml, /redacted-request/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(certificates.__calls.patchCertificateSigningRequest[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(approved.success, true)
    assert.equal(denied.success, true)
    assert.equal(
      await patchContentType(certificates.__calls.patchCertificateSigningRequestApproval[0][1]),
      PatchStrategy.StrategicMergePatch,
    )
    assert.equal(
      await patchContentType(certificates.__calls.patchCertificateSigningRequestApproval[1][1]),
      PatchStrategy.StrategicMergePatch,
    )
    assert.deepEqual(certificates.__calls.patchCertificateSigningRequestApproval[0][0].body.status.conditions[0].type, 'Approved')
    assert.deepEqual(certificates.__calls.patchCertificateSigningRequestApproval[1][0].body.status.conditions[0].type, 'Denied')
    assert.equal(deleted.success, true)
    assert.deepEqual(certificates.__calls.deleteCertificateSigningRequest[0][0], {
      name: 'node-client',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes cluster trust bundles without dumping PEM in lists', async () => {
    const trustBundle = [
      '-----BEGIN CERTIFICATE-----',
      'MIIBfakecertificate',
      '-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----',
      'MIIBsecondfakecertificate',
      '-----END CERTIFICATE-----',
    ].join('\n')
    const bundle = {
      apiVersion: 'certificates.k8s.io/v1beta1',
      kind: 'ClusterTrustBundle',
      metadata: {
        name: 'example.com:root:v1',
        labels: { signer: 'example' },
      },
      spec: {
        signerName: 'example.com/root',
        trustBundle,
      },
    }
    const certificatesBeta = createMockApi({
      listClusterTrustBundle: async () => ({ items: [bundle] }),
      readClusterTrustBundle: async () => bundle,
      patchClusterTrustBundle: async () => bundle,
      createClusterTrustBundle: async () => bundle,
      deleteClusterTrustBundle: async () => ({}),
    })
    setupApis({ certificatesBeta })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listClusterTrustBundles(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'ClusterTrustBundle', '', 'example.com:root:v1')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: certificates.k8s.io/v1beta1',
      'kind: ClusterTrustBundle',
      'metadata:',
      '  name: example.com:root:v1',
      'spec:',
      '  signerName: example.com/root',
      '  trustBundle: |',
      '    -----BEGIN CERTIFICATE-----',
      '    MIIBfakecertificate',
      '    -----END CERTIFICATE-----',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'ClusterTrustBundle', '', 'example.com:root:v1')

    assert.deepEqual(list, [{
      name: 'example.com:root:v1',
      signerName: 'example.com/root',
      certificateCount: 2,
      trustBundleBytes: Buffer.byteLength(trustBundle),
      trustBundleConfigured: true,
      age: '',
      labels: { signer: 'example' },
    }])
    assert.doesNotMatch(JSON.stringify(list), /MIIBfakecertificate/)
    assert.match(yaml, /"kind": "ClusterTrustBundle"/)
    assert.match(yaml, /MIIBfakecertificate/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(certificatesBeta.__calls.patchClusterTrustBundle[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(certificatesBeta.__calls.deleteClusterTrustBundle[0][0], {
      name: 'example.com:root:v1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes pod certificate requests without exposing key material', async () => {
    const request = {
      apiVersion: 'certificates.k8s.io/v1alpha1',
      kind: 'PodCertificateRequest',
      metadata: {
        namespace: 'default',
        name: 'web-cert',
        labels: { app: 'web' },
      },
      spec: {
        signerName: 'example.com/pod-serving',
        podName: 'web-1',
        podUID: 'pod-uid-1',
        nodeName: 'node-1',
        nodeUID: 'node-uid-1',
        serviceAccountName: 'web',
        serviceAccountUID: 'sa-uid-1',
        maxExpirationSeconds: 3600,
        pkixPublicKey: 'redacted-public-key',
        proofOfPossession: 'redacted-proof',
      },
      status: {
        certificateChain: 'redacted-certificate-chain',
        notBefore: new Date('2026-05-12T09:00:00Z'),
        notAfter: new Date('2026-05-12T10:00:00Z'),
        beginRefreshAt: new Date('2026-05-12T09:45:00Z'),
        conditions: [{
          type: 'Issued',
          status: 'True',
          reason: 'Completed',
          message: 'certificate issued',
          lastTransitionTime: new Date('2026-05-12T09:00:01Z'),
        }],
      },
    }
    const certificatesAlpha = createMockApi({
      listNamespacedPodCertificateRequest: async () => ({ items: [request] }),
      listPodCertificateRequestForAllNamespaces: async () => ({ items: [request] }),
      readNamespacedPodCertificateRequest: async () => request,
      patchNamespacedPodCertificateRequest: async () => request,
      createNamespacedPodCertificateRequest: async () => request,
      deleteNamespacedPodCertificateRequest: async () => ({}),
    })
    setupApis({ certificatesAlpha })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listPodCertificateRequests(CONTEXT_ID, 'default')
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'PodCertificateRequest', 'default', 'web-cert')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: certificates.k8s.io/v1alpha1',
      'kind: PodCertificateRequest',
      'metadata:',
      '  namespace: default',
      '  name: web-cert',
      'spec:',
      '  signerName: example.com/pod-serving',
      '  podName: web-1',
      '  nodeName: node-1',
      '  serviceAccountName: web',
      '  pkixPublicKey: redacted-public-key',
      '  proofOfPossession: redacted-proof',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'PodCertificateRequest', 'default', 'web-cert')

    assert.deepEqual(list, [{
      name: 'web-cert',
      namespace: 'default',
      signerName: 'example.com/pod-serving',
      podName: 'web-1',
      nodeName: 'node-1',
      serviceAccountName: 'web',
      maxExpirationSeconds: 3600,
      condition: 'Issued',
      certificateChainConfigured: true,
      notBefore: '2026-05-12 09:00:00',
      notAfter: '2026-05-12 10:00:00',
      beginRefreshAt: '2026-05-12 09:45:00',
      age: '',
      labels: { app: 'web' },
      podUID: 'pod-uid-1',
      nodeUID: 'node-uid-1',
      serviceAccountUID: 'sa-uid-1',
      conditionDetails: [{
        type: 'Issued',
        status: 'True',
        reason: 'Completed',
        message: 'certificate issued',
        lastTransitionTime: '2026-05-12 09:00:01',
      }],
    }])
    assert.doesNotMatch(JSON.stringify(list), /redacted-public-key/)
    assert.doesNotMatch(JSON.stringify(list), /redacted-proof/)
    assert.doesNotMatch(JSON.stringify(list), /redacted-certificate-chain/)
    assert.match(yaml, /"kind": "PodCertificateRequest"/)
    assert.match(yaml, /redacted-public-key/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(certificatesAlpha.__calls.patchNamespacedPodCertificateRequest[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.equal(certificatesAlpha.__calls.patchNamespacedPodCertificateRequest[0][0].namespace, 'default')
    assert.equal(certificatesAlpha.__calls.patchNamespacedPodCertificateRequest[0][0].name, 'web-cert')
    assert.equal(certificatesAlpha.__calls.patchNamespacedPodCertificateRequest[0][0].body.spec.pkixPublicKey, 'redacted-public-key')
    assert.deepEqual(certificatesAlpha.__calls.deleteNamespacedPodCertificateRequest[0][0], {
      namespace: 'default',
      name: 'web-cert',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes storage version resources', async () => {
    const storageVersion = {
      apiVersion: 'internal.apiserver.k8s.io/v1alpha1',
      kind: 'StorageVersion',
      metadata: {
        name: 'deployments.apps',
        labels: { resource: 'deployments' },
      },
      spec: {},
      status: {
        commonEncodingVersion: 'apps/v1',
        storageVersions: [{
          apiServerID: 'api-1',
          encodingVersion: 'apps/v1',
          decodableVersions: ['apps/v1'],
          servedVersions: ['apps/v1'],
        }],
        conditions: [{
          type: 'AllEncodingVersionsEqual',
          status: 'True',
          reason: 'AllEqual',
          message: 'all API servers agree',
          lastTransitionTime: '2026-01-01T00:00:00Z',
        }],
      },
    }
    const migration = {
      apiVersion: 'storagemigration.k8s.io/v1alpha1',
      kind: 'StorageVersionMigration',
      metadata: {
        name: 'migrate-deployments',
        labels: { resource: 'deployments' },
      },
      spec: {
        resource: {
          group: 'apps',
          version: 'v1',
          resource: 'deployments',
        },
        continueToken: 'chunk-2',
      },
      status: {
        resourceVersion: '12345',
        conditions: [{
          type: 'Succeeded',
          status: 'True',
          reason: 'Completed',
          message: 'migration complete',
          lastUpdateTime: '2026-01-01T00:01:00Z',
        }],
      },
    }
    const internalApiserver = createMockApi({
      listStorageVersion: async () => ({ items: [storageVersion] }),
      readStorageVersion: async () => storageVersion,
      patchStorageVersion: async () => storageVersion,
      createStorageVersion: async () => storageVersion,
      deleteStorageVersion: async () => ({}),
    })
    const storagemigration = createMockApi({
      listStorageVersionMigration: async () => ({ items: [migration] }),
      readStorageVersionMigration: async () => migration,
      patchStorageVersionMigration: async () => migration,
      createStorageVersionMigration: async () => migration,
      deleteStorageVersionMigration: async () => ({}),
    })
    setupApis({ internalApiserver, storagemigration })

    const kube = await importFresh('./src/main/kube.ts')
    const storageVersions = await kube.listStorageVersions(CONTEXT_ID)
    const migrations = await kube.listStorageVersionMigrations(CONTEXT_ID)
    const storageVersionYaml = await kube.getResourceYaml(CONTEXT_ID, 'StorageVersion', '', 'deployments.apps')
    const migrationYaml = await kube.getResourceYaml(CONTEXT_ID, 'StorageVersionMigration', '', 'migrate-deployments')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: internal.apiserver.k8s.io/v1alpha1',
      'kind: StorageVersion',
      'metadata:',
      '  name: deployments.apps',
      'spec: {}',
      '---',
      'apiVersion: storagemigration.k8s.io/v1alpha1',
      'kind: StorageVersionMigration',
      'metadata:',
      '  name: migrate-deployments',
      'spec:',
      '  resource:',
      '    group: apps',
      '    version: v1',
      '    resource: deployments',
      '',
    ].join('\n'))
    const storageVersionDeleted = await kube.deleteResource(CONTEXT_ID, 'StorageVersion', '', 'deployments.apps')
    const migrationDeleted = await kube.deleteResource(CONTEXT_ID, 'StorageVersionMigration', '', 'migrate-deployments')

    assert.deepEqual(storageVersions, [{
      name: 'deployments.apps',
      commonEncodingVersion: 'apps/v1',
      storageVersions: 1,
      condition: 'AllEncodingVersionsEqual=True',
      age: '',
      labels: { resource: 'deployments' },
      serverDetails: [{
        apiServerID: 'api-1',
        encodingVersion: 'apps/v1',
        decodableVersions: 'apps/v1',
        servedVersions: 'apps/v1',
      }],
      conditionDetails: [{
        type: 'AllEncodingVersionsEqual',
        status: 'True',
        reason: 'AllEqual',
        message: 'all API servers agree',
        lastTransitionTime: '2026-01-01 00:00:00',
      }],
    }])
    assert.deepEqual(migrations, [{
      name: 'migrate-deployments',
      resource: 'apps/v1/deployments',
      resourceName: 'deployments',
      group: 'apps',
      version: 'v1',
      continueToken: 'chunk-2',
      resourceVersion: '12345',
      condition: 'Succeeded=True',
      age: '',
      labels: { resource: 'deployments' },
      conditionDetails: [{
        type: 'Succeeded',
        status: 'True',
        reason: 'Completed',
        message: 'migration complete',
        lastUpdateTime: '2026-01-01 00:01:00',
      }],
    }])
    assert.match(storageVersionYaml, /"kind": "StorageVersion"/)
    assert.match(migrationYaml, /"kind": "StorageVersionMigration"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(internalApiserver.__calls.patchStorageVersion[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(await patchContentType(storagemigration.__calls.patchStorageVersionMigration[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(storageVersionDeleted.success, true)
    assert.equal(migrationDeleted.success, true)
    assert.deepEqual(internalApiserver.__calls.deleteStorageVersion[0][0], {
      name: 'deployments.apps',
      body: {},
    })
    assert.deepEqual(storagemigration.__calls.deleteStorageVersionMigration[0][0], {
      name: 'migrate-deployments',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes custom resource instances from their CRD', async () => {
    const crd = {
      metadata: { name: 'widgets.example.com' },
      spec: {
        group: 'example.com',
        scope: 'Namespaced',
        names: { kind: 'Widget', plural: 'widgets' },
        versions: [
          { name: 'v1beta1', served: false, storage: false },
          { name: 'v1', served: true, storage: true },
        ],
      },
    }
    const widget = {
      apiVersion: 'example.com/v1',
      kind: 'Widget',
      metadata: {
        name: 'widget-1',
        namespace: 'default',
        creationTimestamp: '2024-01-01T00:00:00.000Z',
        labels: { app: 'demo' },
      },
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    }
    const apiextensions = createMockApi({
      listCustomResourceDefinition: async () => ({ items: [crd] }),
      readCustomResourceDefinition: async () => crd,
    })
    const customObjects = createMockApi({
      listNamespacedCustomObject: async () => ({ items: [widget] }),
      getNamespacedCustomObject: async () => widget,
      deleteNamespacedCustomObject: async () => ({}),
      patchNamespacedCustomObject: async () => widget,
      createNamespacedCustomObject: async () => widget,
    })
    setupApis({ apiextensions, customObjects })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCustomResourceInstances(CONTEXT_ID, 'widgets.example.com', 'default')
    const yaml = await kube.getCustomResourceInstanceYaml(CONTEXT_ID, 'widgets.example.com', 'default', 'widget-1')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: example.com/v1',
      'kind: Widget',
      'metadata:',
      '  name: widget-1',
      '  namespace: default',
      'spec:',
      '  size: small',
      '',
    ].join('\n'))
    const deleted = await kube.deleteCustomResourceInstance(CONTEXT_ID, 'widgets.example.com', 'default', 'widget-1')

    assert.deepEqual(list.map(({ age, ...resource }) => resource), [{
      crdName: 'widgets.example.com',
      apiVersion: 'example.com/v1',
      kind: 'Widget',
      plural: 'widgets',
      scope: 'Namespaced',
      name: 'widget-1',
      namespace: 'default',
      status: 'Ready',
      labels: { app: 'demo' },
    }])
    assert.match(list[0].age, /^\d+d$/)
    assert.match(yaml, /"kind": "Widget"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(customObjects.__calls.patchNamespacedCustomObject[0][1]), PatchStrategy.MergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(customObjects.__calls.listNamespacedCustomObject[0][0], {
      group: 'example.com',
      version: 'v1',
      namespace: 'default',
      plural: 'widgets',
    })
    assert.deepEqual(customObjects.__calls.deleteNamespacedCustomObject[0][0], {
      group: 'example.com',
      version: 'v1',
      namespace: 'default',
      plural: 'widgets',
      name: 'widget-1',
      body: {},
    })
  })

  it('lists, applies, reads, and deletes custom resource definitions', async () => {
    const crd = {
      metadata: { name: 'widgets.example.com', labels: { app: 'demo' } },
      spec: {
        group: 'example.com',
        scope: 'Namespaced',
        names: { kind: 'Widget', plural: 'widgets' },
        versions: [{ name: 'v1' }],
      },
      status: {
        conditions: [{ type: 'Established', status: 'True' }],
      },
    }
    const apiextensions = createMockApi({
      listCustomResourceDefinition: async () => ({ items: [crd] }),
      readCustomResourceDefinition: async () => crd,
      patchCustomResourceDefinition: async () => crd,
      createCustomResourceDefinition: async () => crd,
      deleteCustomResourceDefinition: async () => ({}),
    })
    setupApis({ apiextensions })

    const kube = await importFresh('./src/main/kube.ts')
    const list = await kube.listCustomResourceDefinitions(CONTEXT_ID)
    const yaml = await kube.getResourceYaml(CONTEXT_ID, 'CustomResourceDefinition', '', 'widgets.example.com')
    const apply = await kube.applyYaml(CONTEXT_ID, [
      'apiVersion: apiextensions.k8s.io/v1',
      'kind: CustomResourceDefinition',
      'metadata:',
      '  name: widgets.example.com',
      'spec:',
      '  group: example.com',
      '  names:',
      '    kind: Widget',
      '    plural: widgets',
      '  scope: Namespaced',
      '  versions:',
      '  - name: v1',
      '    served: true',
      '    storage: true',
      '',
    ].join('\n'))
    const deleted = await kube.deleteResource(CONTEXT_ID, 'CustomResourceDefinition', '', 'widgets.example.com')

    assert.deepEqual(list, [{
      name: 'widgets.example.com',
      group: 'example.com',
      scope: 'Namespaced',
      kind: 'Widget',
      plural: 'widgets',
      versions: 'v1',
      established: true,
      age: '',
      labels: { app: 'demo' },
    }])
    assert.match(yaml, /"kind": "Widget"/)
    assert.equal(apply.success, true)
    assert.equal(await patchContentType(apiextensions.__calls.patchCustomResourceDefinition[0][1]), PatchStrategy.StrategicMergePatch)
    assert.equal(deleted.success, true)
    assert.deepEqual(apiextensions.__calls.deleteCustomResourceDefinition[0][0], {
      name: 'widgets.example.com',
      body: {},
    })
  })
})
