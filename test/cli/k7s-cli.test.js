import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
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
  CertificatesV1Api,
  CertificatesV1beta1Api,
  CoordinationV1Api,
  CoordinationV1beta1Api,
  CoreApi,
  CoreV1Api,
  CustomObjectsApi,
  DiscoveryV1Api,
  EventsV1Api,
  FlowcontrolApiserverV1Api,
  Health,
  InternalApiserverV1alpha1Api,
  NetworkingV1Api,
  NodeV1Api,
  OpenidApi,
  PatchStrategy,
  PolicyV1Api,
  RbacAuthorizationV1Api,
  ResourceV1alpha3Api,
  SchedulingV1Api,
  StorageV1Api,
  StoragemigrationV1alpha1Api,
  VersionApi,
  WellKnownApi,
} from '@kubernetes/client-node'
import { importFresh } from '../helpers/module.js'

let originalHealthReadyz
let originalHealthLivez
let originalHealthHealthz

const emptyList = async () => ({ items: [] })

const createMockApi = (methods) => Object.fromEntries(
  methods.map((method) => [method, emptyList]),
)

const createMockKubeConfig = (overrides = {}) => {
  const apis = {
    admission: createMockApi([
      'listMutatingWebhookConfiguration',
      'listValidatingWebhookConfiguration',
      'listValidatingAdmissionPolicy',
      'listValidatingAdmissionPolicyBinding',
    ]),
    admissionBeta: createMockApi([
      'listMutatingAdmissionPolicy',
      'listMutatingAdmissionPolicyBinding',
    ]),
    apiregistration: createMockApi([
      'listAPIService',
    ]),
    apis: {
      getAPIVersions: async () => ({ groups: [] }),
    },
    version: {
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
      }),
    },
    wellKnown: {
      getServiceAccountIssuerOpenIDConfiguration: async () => JSON.stringify({
        issuer: 'https://kubernetes.default.svc',
        jwks_uri: 'https://kubernetes.default.svc/openid/v1/jwks',
        response_types_supported: ['id_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        claims_supported: ['sub', 'iss'],
      }),
    },
    openid: {
      getServiceAccountIssuerOpenIDKeyset: async () => JSON.stringify({
        keys: [],
      }),
    },
    authentication: {
      createSelfSubjectReview: async () => ({
        status: {
          userInfo: {
            username: 'test-user',
            groups: ['system:authenticated'],
          },
        },
      }),
    },
    authorization: {
      createSelfSubjectAccessReview: async () => ({
        status: {
          allowed: true,
          denied: false,
        },
      }),
      createSelfSubjectRulesReview: async () => ({
        status: {
          incomplete: false,
          resourceRules: [],
          nonResourceRules: [],
        },
      }),
    },
    apiextensions: {
      ...createMockApi([
        'listCustomResourceDefinition',
      ]),
      readCustomResourceDefinition: async ({ name }) => ({
        metadata: { name },
        spec: {
          group: 'example.com',
          names: {
            kind: 'Widget',
            plural: 'widgets',
          },
          scope: 'Namespaced',
          versions: [{ name: 'v1', served: true, storage: true }],
        },
      }),
    },
    core: createMockApi([
      'listPodForAllNamespaces',
      'listNamespacedPod',
      'listServiceForAllNamespaces',
      'listNamespacedService',
      'listNode',
      'listNamespace',
      'listConfigMapForAllNamespaces',
      'listNamespacedConfigMap',
      'listSecretForAllNamespaces',
      'listNamespacedSecret',
      'listEndpointsForAllNamespaces',
      'listNamespacedEndpoints',
      'listReplicationControllerForAllNamespaces',
      'listNamespacedReplicationController',
      'listPodTemplateForAllNamespaces',
      'listNamespacedPodTemplate',
      'listResourceQuotaForAllNamespaces',
      'listNamespacedResourceQuota',
      'listLimitRangeForAllNamespaces',
      'listNamespacedLimitRange',
      'listPersistentVolume',
      'listPersistentVolumeClaimForAllNamespaces',
      'listNamespacedPersistentVolumeClaim',
      'listServiceAccountForAllNamespaces',
      'listNamespacedServiceAccount',
      'listEventForAllNamespaces',
      'listNamespacedEvent',
      'listComponentStatus',
      'getAPIResources',
    ]),
    coreDiscovery: {
      getAPIVersions: async () => ({
        versions: ['v1'],
        serverAddressByClientCIDRs: [],
      }),
    },
    customObjects: createMockApi([
      'listClusterCustomObject',
      'listNamespacedCustomObject',
      'listCustomObjectForAllNamespaces',
      'getClusterCustomObject',
      'getNamespacedCustomObject',
      'deleteClusterCustomObject',
      'deleteNamespacedCustomObject',
      'getAPIResources',
    ]),
    apps: createMockApi([
      'listDeploymentForAllNamespaces',
      'listNamespacedDeployment',
      'listDaemonSetForAllNamespaces',
      'listNamespacedDaemonSet',
      'listStatefulSetForAllNamespaces',
      'listNamespacedStatefulSet',
      'listReplicaSetForAllNamespaces',
      'listNamespacedReplicaSet',
      'listControllerRevisionForAllNamespaces',
      'listNamespacedControllerRevision',
    ]),
    batch: createMockApi([
      'listJobForAllNamespaces',
      'listNamespacedJob',
      'listCronJobForAllNamespaces',
      'listNamespacedCronJob',
    ]),
    certificates: createMockApi([
      'listCertificateSigningRequest',
    ]),
    certificatesAlpha: createMockApi([
      'listPodCertificateRequestForAllNamespaces',
      'listNamespacedPodCertificateRequest',
    ]),
    certificatesBeta: createMockApi([
      'listClusterTrustBundle',
    ]),
    coordination: createMockApi([
      'listLeaseForAllNamespaces',
      'listNamespacedLease',
    ]),
    coordinationBeta: createMockApi([
      'listLeaseCandidateForAllNamespaces',
      'listNamespacedLeaseCandidate',
    ]),
    networking: createMockApi([
      'listIngressForAllNamespaces',
      'listNamespacedIngress',
      'listIngressClass',
      'listNetworkPolicyForAllNamespaces',
      'listNamespacedNetworkPolicy',
      'listIPAddress',
      'listServiceCIDR',
    ]),
    node: createMockApi([
      'listRuntimeClass',
    ]),
    discovery: createMockApi([
      'listEndpointSliceForAllNamespaces',
      'listNamespacedEndpointSlice',
    ]),
    events: createMockApi([
      'listEventForAllNamespaces',
      'listNamespacedEvent',
    ]),
    flowcontrol: createMockApi([
      'listFlowSchema',
      'listPriorityLevelConfiguration',
    ]),
    internalApiserver: createMockApi([
      'listStorageVersion',
    ]),
    storagemigration: createMockApi([
      'listStorageVersionMigration',
    ]),
    resourceAlpha: createMockApi([
      'listDeviceTaintRule',
    ]),
    policy: createMockApi([
      'listPodDisruptionBudgetForAllNamespaces',
      'listNamespacedPodDisruptionBudget',
    ]),
    scheduling: createMockApi([
      'listPriorityClass',
    ]),
    storage: createMockApi([
      'listStorageClass',
      'listVolumeAttributesClass',
      'listCSIDriver',
      'listCSINode',
      'listVolumeAttachment',
      'listCSIStorageCapacityForAllNamespaces',
      'listNamespacedCSIStorageCapacity',
    ]),
    rbac: createMockApi([
      'listRoleForAllNamespaces',
      'listNamespacedRole',
      'listRoleBindingForAllNamespaces',
      'listNamespacedRoleBinding',
      'listClusterRole',
      'listClusterRoleBinding',
    ]),
    autoscaling: createMockApi([
      'listHorizontalPodAutoscalerForAllNamespaces',
      'listNamespacedHorizontalPodAutoscaler',
    ]),
  }
  Object.assign(apis.admission, overrides.admission)
  Object.assign(apis.admissionBeta, overrides.admissionBeta)
  Object.assign(apis.apiregistration, overrides.apiregistration)
  Object.assign(apis.apis, overrides.apis)
  Object.assign(apis.version, overrides.version)
  Object.assign(apis.wellKnown, overrides.wellKnown)
  Object.assign(apis.openid, overrides.openid)
  Object.assign(apis.authentication, overrides.authentication)
  Object.assign(apis.authorization, overrides.authorization)
  Object.assign(apis.apiextensions, overrides.apiextensions)
  Object.assign(apis.core, overrides.core)
  Object.assign(apis.coreDiscovery, overrides.coreDiscovery)
  Object.assign(apis.customObjects, overrides.customObjects)
  Object.assign(apis.apps, overrides.apps)
  Object.assign(apis.batch, overrides.batch)
  Object.assign(apis.certificates, overrides.certificates)
  Object.assign(apis.certificatesAlpha, overrides.certificatesAlpha)
  Object.assign(apis.certificatesBeta, overrides.certificatesBeta)
  Object.assign(apis.coordination, overrides.coordination)
  Object.assign(apis.coordinationBeta, overrides.coordinationBeta)
  Object.assign(apis.networking, overrides.networking)
  Object.assign(apis.node, overrides.node)
  Object.assign(apis.discovery, overrides.discovery)
  Object.assign(apis.events, overrides.events)
  Object.assign(apis.flowcontrol, overrides.flowcontrol)
  Object.assign(apis.internalApiserver, overrides.internalApiserver)
  Object.assign(apis.storagemigration, overrides.storagemigration)
  Object.assign(apis.resourceAlpha, overrides.resourceAlpha)
  Object.assign(apis.policy, overrides.policy)
  Object.assign(apis.scheduling, overrides.scheduling)
  Object.assign(apis.storage, overrides.storage)
  Object.assign(apis.rbac, overrides.rbac)
  Object.assign(apis.autoscaling, overrides.autoscaling)

  let currentContext = overrides.currentContext ?? 'test-context'
  const kubeConfig = {
    helmCharts: overrides.helmCharts ?? [],
    helmRepositories: overrides.helmRepositories ?? [],
    getCurrentContext: () => currentContext,
    getContexts: () => overrides.contexts ?? [{
      name: currentContext,
      cluster: 'test-cluster',
      user: 'test-user',
      namespace: 'default',
    }],
    getClusters: () => overrides.clusters ?? [{
      name: 'test-cluster',
      server: 'https://127.0.0.1:6443',
    }],
    getUsers: () => overrides.users ?? [{
      name: 'test-user',
    }],
    setCurrentContext: (name) => {
      currentContext = name
      overrides.setCurrentContextCalls?.push(name)
    },
    makeApiClient(apiType) {
      if (apiType === AdmissionregistrationV1Api) return apis.admission
      if (apiType === AdmissionregistrationV1beta1Api) return apis.admissionBeta
      if (apiType === ApisApi) return apis.apis
      if (apiType === ApiregistrationV1Api) return apis.apiregistration
      if (apiType === VersionApi) return apis.version
      if (apiType === WellKnownApi) return apis.wellKnown
      if (apiType === AuthenticationV1Api) return apis.authentication
      if (apiType === AuthorizationV1Api) return apis.authorization
      if (apiType === CoreApi) return apis.coreDiscovery
      if (apiType === CoreV1Api) return apis.core
      if (apiType === CustomObjectsApi) return apis.customObjects
      if (apiType === ApiextensionsV1Api) return apis.apiextensions
      if (apiType === AppsV1Api) return apis.apps
      if (apiType === BatchV1Api) return apis.batch
      if (apiType === CertificatesV1Api) return apis.certificates
      if (apiType === CertificatesV1alpha1Api) return apis.certificatesAlpha
      if (apiType === CertificatesV1beta1Api) return apis.certificatesBeta
      if (apiType === CoordinationV1Api) return apis.coordination
      if (apiType === CoordinationV1beta1Api) return apis.coordinationBeta
      if (apiType === NetworkingV1Api) return apis.networking
      if (apiType === NodeV1Api) return apis.node
      if (apiType === OpenidApi) return apis.openid
      if (apiType === DiscoveryV1Api) return apis.discovery
      if (apiType === EventsV1Api) return apis.events
      if (apiType === FlowcontrolApiserverV1Api) return apis.flowcontrol
      if (apiType === InternalApiserverV1alpha1Api) return apis.internalApiserver
      if (apiType === PolicyV1Api) return apis.policy
      if (apiType === SchedulingV1Api) return apis.scheduling
      if (apiType === StorageV1Api) return apis.storage
      if (apiType === StoragemigrationV1alpha1Api) return apis.storagemigration
      if (apiType === ResourceV1alpha3Api) return apis.resourceAlpha
      if (apiType === RbacAuthorizationV1Api) return apis.rbac
      if (apiType === AutoscalingV2Api) return apis.autoscaling
      throw new Error(`Unexpected API type: ${apiType?.name ?? 'unknown'}`)
    },
  }
  if (overrides.exec) {
    kubeConfig.makeExecClient = () => overrides.exec
  }
  if (overrides.object) {
    kubeConfig.makeObjectClient = () => overrides.object
  }
  return kubeConfig
}

beforeEach(() => {
  originalHealthReadyz = Health.prototype.readyz
  originalHealthLivez = Health.prototype.livez
  originalHealthHealthz = Health.prototype.healthz
  Health.prototype.readyz = async () => true
  Health.prototype.livez = async () => true
  Health.prototype.healthz = async () => true
})

afterEach(() => {
  Health.prototype.readyz = originalHealthReadyz
  Health.prototype.livez = originalHealthLivez
  Health.prototype.healthz = originalHealthHealthz
})

describe('k7s CLI helpers', () => {
  it('parses k9s-style resource aliases and validates options', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')

    assert.deepEqual(cli.parseArgs(['-r', 'po', '-n', 'kube-system', '--watch', '--refresh', '2']), {
      action: 'list',
      context: undefined,
      namespace: 'kube-system',
      resource: 'pods',
      watch: true,
      refreshSeconds: 2,
      name: undefined,
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['tui']).action, 'interactive')
    assert.equal(cli.parseArgs(['interactive', '-r', 'svc', '-n', 'default']).resource, 'services')
    assert.equal(cli.parseArgs(['--interactive', '-r', 'po']).action, 'interactive')
    assert.throws(() => cli.parseArgs(['tui', '--watch']), /interactive does not support --watch/)
    assert.deepEqual(cli.parseArgs(['apply', '-f', './manifest.yaml', '--confirm', '--dry-run', '--field-manager', 'ci', '--force-conflicts']), {
      action: 'apply',
      context: undefined,
      namespace: undefined,
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: undefined,
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      file: './manifest.yaml',
      fieldManager: 'ci',
      forceConflicts: true,
      dryRun: true,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--apply', '--file', '-', '--confirm']).action, 'apply')
    assert.equal(cli.parseArgs(['apply', '--filename', 'manifest.yaml', '--confirm']).file, 'manifest.yaml')
    assert.throws(() => cli.parseArgs(['apply', '--confirm']), /--file/)
    assert.throws(() => cli.parseArgs(['apply', '-f', 'manifest.yaml']), /--confirm/)
    assert.throws(() => cli.parseArgs(['apply', '-f', 'manifest.yaml', '--confirm', '--field-manager', '']), /--field-manager/)
    assert.throws(() => cli.parseArgs(['apply', '-f', 'manifest.yaml', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['diff', '-f', './manifest.yaml', '-n', 'default', '--server-side', '--field-manager', 'ci', '--force-conflicts']), {
      action: 'diff',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: undefined,
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      file: './manifest.yaml',
      serverSide: true,
      fieldManager: 'ci',
      forceConflicts: true,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--diff', '--file', '-']).action, 'diff')
    assert.throws(() => cli.parseArgs(['diff']), /--file/)
    assert.throws(() => cli.parseArgs(['diff', '-f', 'manifest.yaml', '--field-manager', '']), /--field-manager/)
    assert.throws(() => cli.parseArgs(['diff', '-f', 'manifest.yaml', '--dry-run']), /dry-run/)
    assert.throws(() => cli.parseArgs(['diff', '-f', 'manifest.yaml', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm']), {
      action: 'delete',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--delete', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']).action, 'delete')
    assert.deepEqual(cli.parseArgs(['delete', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm']), {
      action: 'delete',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.throws(() => cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--name', 'web']), /--confirm/)
    assert.throws(() => cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--name', 'web', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['evict', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm']), {
      action: 'evict',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--evict', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm']).action, 'evict')
    assert.throws(() => cli.parseArgs(['evict', '-r', 'po', '-n', 'default', '--name', 'web-1']), /--confirm/)
    assert.throws(() => cli.parseArgs(['evict', '-r', 'po', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['evict', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['kill', '-r', 'po', '-n', 'default', '--name', 'stuck-pod', '--confirm']), {
      action: 'force-delete',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'stuck-pod',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--force-delete', '-r', 'po', '-n', 'default', '--name', 'stuck-pod', '--confirm']).action, 'force-delete')
    assert.throws(() => cli.parseArgs(['kill', '-r', 'po', '-n', 'default', '--name', 'stuck-pod']), /--confirm/)
    assert.throws(() => cli.parseArgs(['kill', '-r', 'po', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['kill', '-r', 'po', '-n', 'default', '--name', 'stuck-pod', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--replicas', '3', '--confirm']), {
      action: 'scale',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: 3,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--scale', '-r', 'sts', '-n', 'default', '--name', 'db', '--replicas', '2', '--confirm']).action, 'scale')
    assert.throws(() => cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--replicas', '3', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']), /--replicas/)
    assert.throws(() => cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--replicas', '-1', '--confirm']), /--replicas/)
    assert.throws(() => cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--replicas', '2']), /--confirm/)
    assert.throws(() => cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--replicas', '2', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['restart', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']), {
      action: 'restart',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--restart', '-r', 'sts', '-n', 'default', '--name', 'db', '--confirm']).action, 'restart')
    assert.throws(() => cli.parseArgs(['restart', '-r', 'deploy', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['restart', '-r', 'deploy', '-n', 'default', '--name', 'web']), /--confirm/)
    assert.throws(() => cli.parseArgs(['restart', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28', '--confirm']), {
      action: 'set-image',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      image: 'nginx:1.28',
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--set-image', '-r', 'ds', '-n', 'kube-system', '--name', 'agent', '--container', 'agent', '--image', 'agent:v2', '--confirm']).action, 'set-image')
    assert.throws(() => cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--container', 'app', '--image', 'nginx:1.28', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--image', 'nginx:1.28', '--confirm']), /--container/)
    assert.throws(() => cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--container', 'app', '--confirm']), /--image/)
    assert.throws(() => cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28']), /--confirm/)
    assert.throws(() => cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28', '--confirm', '--watch']), /watch/)
    const helmInstallOptions = cli.parseArgs([
      'install',
      '-r',
      'helm',
      '-n',
      'default',
      '--name',
      'web',
      '--chart',
      'bitnami/nginx',
      '--version',
      '18.2.5',
      '--values-file',
      './values.yaml',
      '--set',
      'image.tag=1.28',
      '--set',
      'service.type=ClusterIP',
      '--create-namespace',
      '--wait',
      '--timeout',
      '5m',
      '--confirm',
    ])
    assert.equal(helmInstallOptions.action, 'install')
    assert.equal(helmInstallOptions.resource, 'helmreleases')
    assert.equal(helmInstallOptions.chart, 'bitnami/nginx')
    assert.equal(helmInstallOptions.version, '18.2.5')
    assert.equal(helmInstallOptions.valuesFile, './values.yaml')
    assert.deepEqual(helmInstallOptions.setValues, ['image.tag=1.28', 'service.type=ClusterIP'])
    assert.equal(helmInstallOptions.createNamespace, true)
    assert.equal(helmInstallOptions.wait, true)
    assert.equal(helmInstallOptions.timeout, '5m')
    assert.equal(cli.parseArgs(['upgrade', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx', '--install', '--confirm']).install, true)
    assert.throws(() => cli.parseArgs(['install', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm']), /--chart/)
    assert.throws(() => cli.parseArgs(['install', '-r', 'deploy', '-n', 'default', '--name', 'web', '--chart', 'bitnami\/nginx', '--confirm']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['install', '-r', 'helm', '--name', 'web', '--chart', 'bitnami/nginx', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['install', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx']), /--confirm/)
    assert.throws(() => cli.parseArgs(['install', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx', '--set', '', '--confirm']), /--set/)
    assert.throws(() => cli.parseArgs(['install', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx', '--install', '--confirm']), /does not support --install/)
    assert.throws(() => cli.parseArgs(['upgrade', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx', '--revision', '2', '--confirm']), /--revision/)
    assert.throws(() => cli.parseArgs(['upgrade', '-r', 'helm', '-n', 'default', '--name', 'web', '--chart', 'bitnami/nginx', '--confirm', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['-r', 'helm', '--chart', 'bitnami/nginx']), /does not support --chart/)
    assert.equal(cli.parseArgs(['-r', 'helmchart']).resource, 'helmcharts')
    assert.equal(cli.parseArgs(['-r', 'hc']).resource, 'helmcharts')
    const helmRepoAddOptions = cli.parseArgs(['repo-add', '-r', 'helmrepo', '--name', 'bitnami', '--repo-url', 'https://charts.bitnami.com/bitnami', '--confirm'])
    assert.equal(helmRepoAddOptions.action, 'repo-add')
    assert.equal(helmRepoAddOptions.resource, 'helmrepositories')
    assert.equal(helmRepoAddOptions.name, 'bitnami')
    assert.equal(helmRepoAddOptions.repoUrl, 'https://charts.bitnami.com/bitnami')
    assert.equal(cli.parseArgs(['repo-update', '-r', 'helmrepo', '--confirm']).action, 'repo-update')
    assert.equal(cli.parseArgs(['helm-repo-update', '-r', 'hr', '--name', 'bitnami', '--confirm']).resource, 'helmrepositories')
    assert.throws(() => cli.parseArgs(['repo-add', '-r', 'helmrepo', '--repo-url', 'https://charts.bitnami.com/bitnami', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['repo-add', '-r', 'helmrepo', '--name', 'bitnami', '--confirm']), /--repo-url/)
    assert.throws(() => cli.parseArgs(['repo-add', '-r', 'helm', '--name', 'bitnami', '--repo-url', 'https:\/\/charts.bitnami.com\/bitnami', '--confirm']), /Helm repositories/)
    assert.throws(() => cli.parseArgs(['repo-add', '-r', 'helmrepo', '-n', 'default', '--name', 'bitnami', '--repo-url', 'https://charts.bitnami.com/bitnami', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['repo-add', '-r', 'helmrepo', '--name', 'bitnami', '--repo-url', 'https://charts.bitnami.com/bitnami']), /--confirm/)
    assert.throws(() => cli.parseArgs(['repo-update', '-r', 'helmrepo', '--repo-url', 'https://charts.bitnami.com/bitnami', '--confirm']), /--repo-url/)
    assert.throws(() => cli.parseArgs(['repo-update', '-r', 'helmrepo', '--confirm', '--timeout', '30s']), /--timeout/)
    assert.throws(() => cli.parseArgs(['repo-update', '-r', 'helmrepo', '--confirm', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['-r', 'helmrepo', '--repo-url', 'https://charts.bitnami.com/bitnami']), /does not support --repo-url/)
    assert.deepEqual(cli.parseArgs(['rollback', '-r', 'sts', '-n', 'default', '--name', 'db', '--revision', '3', '--confirm']), {
      action: 'rollback',
      context: undefined,
      namespace: 'default',
      resource: 'statefulsets',
      watch: false,
      refreshSeconds: 3,
      name: 'db',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      revision: 3,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--rollback', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']).action, 'rollback')
    assert.equal(cli.parseArgs(['undo', '-r', 'ds', '-n', 'kube-system', '--name', 'agent', '--to-revision', '2', '--confirm']).revision, 2)
    assert.equal(cli.parseArgs(['rollback', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '2', '--confirm']).resource, 'helmreleases')
    assert.throws(() => cli.parseArgs(['rollback', '-r', 'deploy', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['rollback', '-r', 'deploy', '-n', 'default', '--name', 'web']), /--confirm/)
    assert.throws(() => cli.parseArgs(['rollback', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '0', '--confirm']), /--revision/)
    assert.throws(() => cli.parseArgs(['rollback', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['history', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '2']), {
      action: 'history',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      revision: 2,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--history', '-r', 'ds', '-n', 'kube-system', '--name', 'agent']).action, 'history')
    assert.equal(cli.parseArgs(['history', '-r', 'helm', '-n', 'default', '--name', 'web']).resource, 'helmreleases')
    assert.throws(() => cli.parseArgs(['history', '-r', 'deploy', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['history', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '0']), /--revision/)
    assert.throws(() => cli.parseArgs(['history', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '2']), /not supported/)
    assert.throws(() => cli.parseArgs(['history', '-r', 'deploy', '-n', 'default', '--name', 'web', '--timeout', '30s']), /--timeout/)
    assert.throws(() => cli.parseArgs(['history', '-r', 'deploy', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['status', '-r', 'deploy', '-n', 'default', '--name', 'web', '--timeout', '30s']), {
      action: 'rollout-status',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      timeout: '30s',
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['rollout-status', '-r', 'sts', '-n', 'default', '--name', 'db']).action, 'rollout-status')
    assert.deepEqual(cli.parseArgs(['status', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '2']), {
      action: 'rollout-status',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      revision: 2,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--rollout-status', '-r', 'deploy', '-n', 'default', '--name', 'web']).action, 'rollout-status')
    assert.equal(cli.parseArgs(['--status', '-r', 'helm', '-n', 'default', '--name', 'web']).resource, 'helmreleases')
    assert.throws(() => cli.parseArgs(['status', '-r', 'deploy', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '2']), /--revision/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'deploy', '-n', 'default', '--name', 'web', '--timeout', '']), /--timeout/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'deploy', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '0']), /--revision/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'helm', '-n', 'default', '--name', 'web', '--timeout', '30s']), /--timeout/)
    assert.throws(() => cli.parseArgs(['status', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['pause', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']), {
      action: 'pause',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--pause', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']).action, 'pause')
    assert.equal(cli.parseArgs(['resume', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']).action, 'resume')
    assert.equal(cli.parseArgs(['--resume', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']).action, 'resume')
    assert.throws(() => cli.parseArgs(['pause', '-r', 'deploy', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['pause', '-r', 'deploy', '-n', 'default', '--name', 'web']), /--confirm/)
    assert.throws(() => cli.parseArgs(['pause', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '2', '--confirm']), /--revision/)
    assert.throws(() => cli.parseArgs(['resume', '-r', 'deploy', '-n', 'default', '--name', 'web', '--timeout', '30s', '--confirm']), /--timeout/)
    assert.throws(() => cli.parseArgs(['resume', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm', '--watch']), /watch/)
    assert.equal(cli.parseArgs(['suspend', '-r', 'cj', '-n', 'default', '--name', 'backup', '--confirm']).action, 'suspend')
    assert.equal(cli.parseArgs(['--suspend', '-r', 'job', '-n', 'default', '--name', 'backup-1', '--confirm']).resource, 'jobs')
    assert.equal(cli.parseArgs(['resume', '-r', 'job', '-n', 'default', '--name', 'backup-1', '--confirm']).resource, 'jobs')
    assert.equal(cli.parseArgs(['trigger', '-r', 'cj', '-n', 'default', '--name', 'backup', '--confirm']).action, 'trigger')
    assert.equal(cli.parseArgs(['run', '-r', 'cronjob', '-n', 'default', '--name', 'backup', '--confirm']).action, 'trigger')
    assert.throws(() => cli.parseArgs(['suspend', '-r', 'cj', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['suspend', '-r', 'cj', '-n', 'default', '--name', 'backup']), /--confirm/)
    assert.throws(() => cli.parseArgs(['suspend', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']), /jobs and cronjobs/)
    assert.throws(() => cli.parseArgs(['resume', '-r', 'job', '--name', 'backup-1', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['suspend', '-r', 'job', '-n', 'default', '--name', 'backup-1', '--confirm', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['trigger', '-r', 'cj', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['trigger', '-r', 'cj', '-n', 'default', '--name', 'backup']), /--confirm/)
    assert.throws(() => cli.parseArgs(['trigger', '-r', 'job', '-n', 'default', '--name', 'backup-1', '--confirm']), /cronjobs/)
    assert.throws(() => cli.parseArgs(['trigger', '-r', 'cj', '--name', 'backup', '--confirm']), /--namespace/)
    assert.equal(cli.parseArgs(['approve', '-r', 'csr', '--name', 'node-client', '--confirm']).action, 'approve')
    assert.equal(cli.parseArgs(['--approve', '-r', 'csr', '--name', 'node-client', '--confirm']).action, 'approve')
    assert.equal(cli.parseArgs(['deny', '-r', 'csr', '--name', 'node-client', '--confirm']).action, 'deny')
    assert.equal(cli.parseArgs(['--deny', '-r', 'csr', '--name', 'node-client', '--confirm']).action, 'deny')
    assert.throws(() => cli.parseArgs(['approve', '-r', 'csr', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['approve', '-r', 'csr', '--name', 'node-client']), /--confirm/)
    assert.throws(() => cli.parseArgs(['approve', '-r', 'po', '--name', 'web', '--confirm']), /certificatesigningrequests/)
    assert.throws(() => cli.parseArgs(['deny', '-r', 'csr', '-n', 'default', '--name', 'node-client', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['deny', '-r', 'csr', '--name', 'node-client', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['cordon', '-r', 'node', '--name', 'worker-1', '--confirm']), {
      action: 'cordon',
      context: undefined,
      namespace: undefined,
      resource: 'nodes',
      watch: false,
      refreshSeconds: 3,
      name: 'worker-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--cordon', '-r', 'node', '--name', 'worker-1', '--confirm']).action, 'cordon')
    assert.deepEqual(cli.parseArgs(['uncordon', '-r', 'node', '--name', 'worker-1', '--confirm']), {
      action: 'uncordon',
      context: undefined,
      namespace: undefined,
      resource: 'nodes',
      watch: false,
      refreshSeconds: 3,
      name: 'worker-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--uncordon', '-r', 'node', '--name', 'worker-1', '--confirm']).action, 'uncordon')
    assert.throws(() => cli.parseArgs(['cordon', '-r', 'node', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['cordon', '-r', 'node', '--name', 'worker-1']), /--confirm/)
    assert.throws(() => cli.parseArgs(['uncordon', '-r', 'node', '--name', 'worker-1', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['drain', '-r', 'node', '--name', 'worker-1', '--confirm']), {
      action: 'drain',
      context: undefined,
      namespace: undefined,
      resource: 'nodes',
      watch: false,
      refreshSeconds: 3,
      name: 'worker-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--drain', '-r', 'node', '--name', 'worker-1', '--confirm']).action, 'drain')
    assert.throws(() => cli.parseArgs(['drain', '-r', 'node', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['drain', '-r', 'node', '--name', 'worker-1']), /--confirm/)
    assert.throws(() => cli.parseArgs(['drain', '-r', 'node', '--name', 'worker-1', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['debug-node', '-r', 'node', '--name', 'worker-1']), {
      action: 'debug-node',
      context: undefined,
      namespace: undefined,
      resource: 'nodes',
      watch: false,
      refreshSeconds: 3,
      name: 'worker-1',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['node-shell', '-r', 'node', '--name', 'worker-1']).action, 'debug-node')
    assert.equal(cli.parseArgs(['--debug-node', '-r', 'node', '--name', 'worker-1']).action, 'debug-node')
    assert.equal(cli.parseArgs(['debug-node', '-r', 'node', '--name', 'worker-1', '--image', 'ubuntu:24.04']).image, 'ubuntu:24.04')
    assert.throws(() => cli.parseArgs(['debug-node', '-r', 'node']), /--name/)
    assert.throws(() => cli.parseArgs(['debug-node', '-r', 'node', '--name', 'worker-1', '--command', 'sh']), /--command/)
    assert.throws(() => cli.parseArgs(['debug-node', '-r', 'node', '--name', 'worker-1', '--image', '']), /--image/)
    assert.throws(() => cli.parseArgs(['debug-node', '-r', 'node', '--name', 'worker-1', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['yaml', '-r', 'deploy', '-n', 'default', '--name', 'web']), {
      action: 'yaml',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--yaml', '-r', 'ns', '--name', 'default']).action, 'yaml')
    assert.throws(() => cli.parseArgs(['yaml', '-r', 'deploy', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['yaml', '-r', 'deploy', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['values', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'values',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--values', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'values')
    assert.throws(() => cli.parseArgs(['values', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['values', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['values', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['values', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['resources', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'resources',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--resources', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'resources')
    assert.equal(cli.parseArgs(['helm-resources', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'resources')
    assert.throws(() => cli.parseArgs(['resources', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['resources', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['resources', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['resources', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['metadata', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'metadata',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--metadata', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'metadata')
    assert.equal(cli.parseArgs(['meta', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'metadata')
    assert.throws(() => cli.parseArgs(['metadata', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['metadata', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['metadata', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['metadata', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['notes', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'notes',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--notes', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'notes')
    assert.throws(() => cli.parseArgs(['notes', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['notes', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['notes', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['notes', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['hooks', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'hooks',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--hooks', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'hooks')
    assert.throws(() => cli.parseArgs(['hooks', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['hooks', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['hooks', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['hooks', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['all', '-r', 'helm', '-n', 'default', '--name', 'web']), {
      action: 'helm-all',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--helm-all', '-r', 'helm', '-n', 'default', '--name', 'web']).action, 'helm-all')
    assert.throws(() => cli.parseArgs(['all', '-r', 'helm', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['all', '-r', 'deploy', '-n', 'default', '--name', 'web']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['all', '-r', 'helm', '--name', 'web']), /--namespace/)
    assert.throws(() => cli.parseArgs(['all', '-r', 'helm', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['test', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm']), {
      action: 'test',
      context: undefined,
      namespace: 'default',
      resource: 'helmreleases',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--test', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm']).action, 'test')
    assert.throws(() => cli.parseArgs(['test', '-r', 'helm', '-n', 'default', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['test', '-r', 'helm', '-n', 'default', '--name', 'web']), /--confirm/)
    assert.throws(() => cli.parseArgs(['test', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm']), /Helm releases/)
    assert.throws(() => cli.parseArgs(['test', '-r', 'helm', '--name', 'web', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['test', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['edit', '-r', 'deploy', '-n', 'default', '--name', 'web']), {
      action: 'edit',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--edit', '-r', 'ns', '--name', 'default']).action, 'edit')
    assert.throws(() => cli.parseArgs(['edit', '-r', 'deploy', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['edit', '-r', 'deploy', '-n', 'default', '--name', 'web', '--command', 'date']), /--command/)
    assert.throws(() => cli.parseArgs(['edit', '-r', 'deploy', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['describe', '-r', 'deploy', '-n', 'default', '--name', 'web']), {
      action: 'describe',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--describe', '-r', 'ns', '--name', 'default']).action, 'describe')
    assert.throws(() => cli.parseArgs(['describe', '-r', 'deploy', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['describe', '-r', 'deploy', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '200']), {
      action: 'logs',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 200,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--logs', '-n', 'default', '--name', 'web']).action, 'logs')
    assert.deepEqual(cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '50', '--follow']), {
      action: 'logs',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 50,
      replicas: undefined,
      command: undefined,
      follow: true,
      confirm: false,
      help: false,
    })
    assert.deepEqual(cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '50', '--previous']), {
      action: 'logs',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 50,
      replicas: undefined,
      command: undefined,
      previous: true,
      confirm: false,
      help: false,
    })
    assert.deepEqual(cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '50', '--timestamps']), {
      action: 'logs',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 50,
      replicas: undefined,
      command: undefined,
      timestamps: true,
      confirm: false,
      help: false,
    })
    assert.throws(() => cli.parseArgs(['logs', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--tail', '-1']), /tail/)
    assert.throws(() => cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--previous', '--follow']), /previous/)
    assert.deepEqual(cli.parseArgs(['exec', '-n', 'default', '--name', 'web', '--container', 'app', '--command', 'printenv HOSTNAME']), {
      action: 'exec',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 100,
      replicas: undefined,
      command: 'printenv HOSTNAME',
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--exec', '-n', 'default', '--name', 'web', '--', 'cat', '/etc/hostname']).command, 'cat /etc/hostname')
    assert.throws(() => cli.parseArgs(['exec', '-n', 'default', '--command', 'date']), /--name/)
    assert.throws(() => cli.parseArgs(['exec', '-n', 'default', '--name', 'web']), /--command/)
    assert.throws(() => cli.parseArgs(['exec', '-n', 'default', '--name', 'web', '--command', 'date', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['shell', '-n', 'default', '--name', 'web', '--container', 'app', '--command', '/bin/bash']), {
      action: 'shell',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 100,
      replicas: undefined,
      command: '/bin/bash',
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['sh', '-n', 'default', '--name', 'web']).action, 'shell')
    assert.equal(cli.parseArgs(['--shell', '-n', 'default', '--name', 'web']).action, 'shell')
    assert.deepEqual(cli.parseArgs(['shell', '-n', 'default', '--name', 'web', '--', '/bin/bash', '-l']).commandArgs, ['/bin/bash', '-l'])
    assert.throws(() => cli.parseArgs(['shell', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['shell', '-n', 'default', '--name', 'web', '--command', '']), /--command/)
    assert.throws(() => cli.parseArgs(['shell', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['attach', '-n', 'default', '--name', 'web', '--container', 'app']), {
      action: 'attach',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: 'app',
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--attach', '-n', 'default', '--name', 'web']).action, 'attach')
    assert.throws(() => cli.parseArgs(['attach', '-n', 'default']), /--name/)
    assert.throws(() => cli.parseArgs(['attach', '-n', 'default', '--name', 'web', '--command', 'date']), /--command/)
    assert.throws(() => cli.parseArgs(['attach', '-n', 'default', '--name', 'web', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web', '--target-port', '8080', '--local-port', '18080']), {
      action: 'port-forward',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      targetPort: 8080,
      localPort: 18080,
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['pf', '-n', 'default', '--name', 'web', '--port', '8080']).action, 'port-forward')
    assert.equal(cli.parseArgs(['--port-forward', '-n', 'default', '--name', 'web', '--target-port', '8080']).targetPort, 8080)
    assert.throws(() => cli.parseArgs(['port-forward', '-n', 'default', '--target-port', '8080']), /--name/)
    assert.throws(() => cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web']), /--target-port/)
    assert.throws(() => cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web', '--target-port', '0']), /--target-port/)
    assert.throws(() => cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web', '--target-port', '8080', '--local-port', '70000']), /--local-port/)
    assert.throws(() => cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web', '--target-port', '8080', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['can-i', '--verb', 'get', '-r', 'po', '-n', 'default', '--resource-name', 'web', '--subresource', 'log']), {
      action: 'can-i',
      context: undefined,
      namespace: 'default',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: undefined,
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      verb: 'get',
      subresource: 'log',
      resourceName: 'web',
      confirm: false,
      help: false,
    })
    assert.equal(cli.parseArgs(['--can-i', '--verb', 'get', '--non-resource-url', '/readyz']).action, 'can-i')
    assert.equal(cli.parseArgs(['auth-can-i', '--verb', 'list', '-r', 'pods']).action, 'can-i')
    assert.throws(() => cli.parseArgs(['can-i', '-r', 'po']), /--verb/)
    assert.throws(() => cli.parseArgs(['can-i', '--verb', 'get', '--non-resource-url', 'readyz']), /--non-resource-url/)
    assert.throws(() => cli.parseArgs(['can-i', '--verb', 'get', '--non-resource-url', '/readyz', '--resource-name', 'web']), /non-resource/)
    assert.throws(() => cli.parseArgs(['can-i', '--verb', 'get', '-r', 'po', '--watch']), /watch/)
    assert.deepEqual(cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'team', '--value', 'platform', '--overwrite', '--confirm']), {
      action: 'label',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      metadataKey: 'team',
      metadataValue: 'platform',
      overwrite: true,
      confirm: true,
      help: false,
    })
    assert.deepEqual(cli.parseArgs(['annotate', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'note', '--remove', '--confirm']), {
      action: 'annotate',
      context: undefined,
      namespace: 'default',
      resource: 'deployments',
      watch: false,
      refreshSeconds: 3,
      name: 'web',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      metadataKey: 'note',
      remove: true,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['--label', '-r', 'ns', '--name', 'default', '--key', 'env', '--value', 'prod', '--confirm']).action, 'label')
    assert.equal(cli.parseArgs(['annotation', '-r', 'ns', '--name', 'default', '--key', 'note', '--value', 'ready', '--confirm']).action, 'annotate')
    assert.throws(() => cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--key', 'team', '--value', 'platform', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--name', 'web', '--value', 'platform', '--confirm']), /--key/)
    assert.throws(() => cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'team', '--confirm']), /--value/)
    assert.throws(() => cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'team', '--value', 'platform']), /--confirm/)
    assert.throws(() => cli.parseArgs(['annotate', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'note', '--value', 'ready', '--remove', '--confirm']), /--remove/)
    assert.throws(() => cli.parseArgs(['label', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'team', '--value', 'platform', '--watch', '--confirm']), /watch/)
    assert.deepEqual(cli.parseArgs(['use-context', '--name', 'minikube', '--confirm']), {
      action: 'use-context',
      context: undefined,
      namespace: undefined,
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: 'minikube',
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.deepEqual(cli.parseArgs(['use-namespace', '-n', 'kube-system', '--confirm']), {
      action: 'use-namespace',
      context: undefined,
      namespace: 'kube-system',
      resource: 'pods',
      watch: false,
      refreshSeconds: 3,
      name: undefined,
      container: undefined,
      tailLines: 100,
      replicas: undefined,
      command: undefined,
      confirm: true,
      help: false,
    })
    assert.equal(cli.parseArgs(['ctx-use', '--name', 'minikube', '--confirm']).action, 'use-context')
    assert.equal(cli.parseArgs(['use-ctx', '--name', 'minikube', '--confirm']).action, 'use-context')
    assert.equal(cli.parseArgs(['--use-namespace', '-n', 'default', '--confirm']).action, 'use-namespace')
    assert.equal(cli.parseArgs(['use-ns', '-n', 'default', '--confirm']).action, 'use-namespace')
    assert.throws(() => cli.parseArgs(['use-context', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['use-context', '--name', 'minikube']), /--confirm/)
    assert.throws(() => cli.parseArgs(['use-context', '--name', 'minikube', '--context', 'prod', '--confirm']), /--context/)
    assert.throws(() => cli.parseArgs(['use-context', '--name', 'minikube', '-n', 'default', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['use-context', '--name', 'minikube', '--confirm', '--watch']), /watch/)
    assert.throws(() => cli.parseArgs(['use-namespace', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['use-namespace', '-n', 'all', '--confirm']), /--namespace/)
    assert.throws(() => cli.parseArgs(['use-namespace', '-n', 'default']), /--confirm/)
    assert.throws(() => cli.parseArgs(['use-namespace', '-n', 'default', '--context', 'prod', '--confirm']), /--context/)
    assert.throws(() => cli.parseArgs(['use-namespace', '-n', 'default', '--name', 'web', '--confirm']), /--name/)
    assert.throws(() => cli.parseArgs(['use-namespace', '-n', 'default', '--confirm', '--watch']), /watch/)
    assert.equal(cli.parseArgs(['-r', 'ctx']).resource, 'contexts')
    assert.equal(cli.parseArgs(['-r', 'kubecontext']).resource, 'contexts')
    assert.equal(cli.parseArgs(['-r', 'co']).resource, 'containers')
    assert.equal(cli.parseArgs(['-r', 'cont']).resource, 'containers')
    assert.equal(cli.parseArgs(['-r', 'container']).resource, 'containers')
    assert.equal(cli.parseArgs(['-r', 'cstate']).resource, 'containerstates')
    assert.equal(cli.parseArgs(['-r', 'containerstate']).resource, 'containerstates')
    assert.equal(cli.parseArgs(['-r', 'containerstates']).resource, 'containerstates')
    assert.equal(cli.parseArgs(['-r', 'crs']).resource, 'containerresources')
    assert.equal(cli.parseArgs(['-r', 'cresources']).resource, 'containerresources')
    assert.equal(cli.parseArgs(['-r', 'requests']).resource, 'containerresources')
    assert.equal(cli.parseArgs(['-r', 'img']).resource, 'images')
    assert.equal(cli.parseArgs(['-r', 'imgs']).resource, 'images')
    assert.equal(cli.parseArgs(['-r', 'image']).resource, 'images')
    assert.equal(cli.parseArgs(['-r', 'prb']).resource, 'probes')
    assert.equal(cli.parseArgs(['-r', 'probe']).resource, 'probes')
    assert.equal(cli.parseArgs(['-r', 'prt']).resource, 'ports')
    assert.equal(cli.parseArgs(['-r', 'cport']).resource, 'ports')
    assert.equal(cli.parseArgs(['-r', 'port']).resource, 'ports')
    assert.equal(cli.parseArgs(['-r', 'vol']).resource, 'volumes')
    assert.equal(cli.parseArgs(['-r', 'vols']).resource, 'volumes')
    assert.equal(cli.parseArgs(['-r', 'volume']).resource, 'volumes')
    assert.equal(cli.parseArgs(['-r', 'mnt']).resource, 'volumemounts')
    assert.equal(cli.parseArgs(['-r', 'mount']).resource, 'volumemounts')
    assert.equal(cli.parseArgs(['-r', 'vm']).resource, 'volumemounts')
    assert.equal(cli.parseArgs(['-r', 'env']).resource, 'envvars')
    assert.equal(cli.parseArgs(['-r', 'envs']).resource, 'envvars')
    assert.equal(cli.parseArgs(['-r', 'envvar']).resource, 'envvars')
    assert.equal(cli.parseArgs(['-r', 'cond']).resource, 'podconditions')
    assert.equal(cli.parseArgs(['-r', 'conds']).resource, 'podconditions')
    assert.equal(cli.parseArgs(['-r', 'condition']).resource, 'podconditions')
    assert.equal(cli.parseArgs(['-r', 'gate']).resource, 'podreadinessgates')
    assert.equal(cli.parseArgs(['-r', 'readygate']).resource, 'podreadinessgates')
    assert.equal(cli.parseArgs(['-r', 'podreadinessgates']).resource, 'podreadinessgates')
    assert.equal(cli.parseArgs(['-r', 'pnet']).resource, 'podnetwork')
    assert.equal(cli.parseArgs(['-r', 'dns']).resource, 'podnetwork')
    assert.equal(cli.parseArgs(['-r', 'poddns']).resource, 'podnetwork')
    assert.equal(cli.parseArgs(['-r', 'place']).resource, 'podplacement')
    assert.equal(cli.parseArgs(['-r', 'placement']).resource, 'podplacement')
    assert.equal(cli.parseArgs(['-r', 'where']).resource, 'podplacement')
    assert.equal(cli.parseArgs(['-r', 'sctx']).resource, 'securitycontexts')
    assert.equal(cli.parseArgs(['-r', 'secctx']).resource, 'securitycontexts')
    assert.equal(cli.parseArgs(['-r', 'securitycontext']).resource, 'securitycontexts')
    assert.equal(cli.parseArgs(['-r', 'label']).resource, 'podlabels')
    assert.equal(cli.parseArgs(['-r', 'labels']).resource, 'podlabels')
    assert.equal(cli.parseArgs(['-r', 'podlabels']).resource, 'podlabels')
    assert.equal(cli.parseArgs(['-r', 'anno']).resource, 'podannotations')
    assert.equal(cli.parseArgs(['-r', 'annotations']).resource, 'podannotations')
    assert.equal(cli.parseArgs(['-r', 'podannotations']).resource, 'podannotations')
    assert.equal(cli.parseArgs(['-r', 'tn']).resource, 'topnodes')
    assert.equal(cli.parseArgs(['-r', 'tp']).resource, 'toppods')
    assert.equal(cli.parseArgs(['-r', 'tc']).resource, 'topcontainers')
    assert.equal(cli.parseArgs(['-r', 'cs']).resource, 'componentstatuses')
    assert.equal(cli.parseArgs(['-r', 'apig']).resource, 'apigroups')
    assert.equal(cli.parseArgs(['-r', 'ag']).resource, 'apigroups')
    assert.equal(cli.parseArgs(['-r', 'apires']).resource, 'apiresources')
    assert.equal(cli.parseArgs(['-r', 'ar']).resource, 'apiresources')
    assert.equal(cli.parseArgs(['-r', 'ver']).resource, 'serverversions')
    assert.equal(cli.parseArgs(['-r', 'kver']).resource, 'serverversions')
    assert.equal(cli.parseArgs(['-r', 'oidc']).resource, 'openidconfigs')
    assert.equal(cli.parseArgs(['-r', 'openid']).resource, 'openidconfigs')
    assert.equal(cli.parseArgs(['-r', 'health']).resource, 'apiserverhealth')
    assert.equal(cli.parseArgs(['-r', 'readyz']).resource, 'apiserverhealth')
    assert.equal(cli.parseArgs(['-r', 'ssr']).resource, 'selfsubjectreviews')
    assert.equal(cli.parseArgs(['-r', 'whoami']).resource, 'selfsubjectreviews')
    assert.equal(cli.parseArgs(['-r', 'ssar']).resource, 'selfsubjectaccessreviews')
    assert.equal(cli.parseArgs(['-r', 'can-i']).resource, 'selfsubjectaccessreviews')
    assert.equal(cli.parseArgs(['-r', 'ssrr']).resource, 'selfsubjectrulesreviews')
    assert.equal(cli.parseArgs(['-r', 'crb']).resource, 'clusterrolebindings')
    assert.equal(cli.parseArgs(['-r', 'crd']).resource, 'customresourcedefinitions')
    assert.equal(cli.parseArgs(['-r', 'hpa']).resource, 'horizontalpodautoscalers')
    assert.equal(cli.parseArgs(['-r', 'helm']).resource, 'helmreleases')
    assert.equal(cli.parseArgs(['-r', 'netpol']).resource, 'networkpolicies')
    assert.equal(cli.parseArgs(['-r', 'ep']).resource, 'endpoints')
    assert.equal(cli.parseArgs(['-r', 'le']).resource, 'leases')
    assert.equal(cli.parseArgs(['-r', 'lc']).resource, 'leasecandidates')
    assert.equal(cli.parseArgs(['-r', 'eps']).resource, 'endpointslices')
    assert.equal(cli.parseArgs(['-r', 'apisvc']).resource, 'apiservices')
    assert.equal(cli.parseArgs(['-r', 'mwc']).resource, 'mutatingwebhookconfigurations')
    assert.equal(cli.parseArgs(['-r', 'vwc']).resource, 'validatingwebhookconfigurations')
    assert.equal(cli.parseArgs(['-r', 'map']).resource, 'mutatingadmissionpolicies')
    assert.equal(cli.parseArgs(['-r', 'mapb']).resource, 'mutatingadmissionpolicybindings')
    assert.equal(cli.parseArgs(['-r', 'vap']).resource, 'validatingadmissionpolicies')
    assert.equal(cli.parseArgs(['-r', 'vapb']).resource, 'validatingadmissionpolicybindings')
    assert.equal(cli.parseArgs(['-r', 'fs']).resource, 'flowschemas')
    assert.equal(cli.parseArgs(['-r', 'plc']).resource, 'prioritylevelconfigurations')
    assert.equal(cli.parseArgs(['-r', 'csr']).resource, 'certificatesigningrequests')
    assert.equal(cli.parseArgs(['-r', 'ctb']).resource, 'clustertrustbundles')
    assert.equal(cli.parseArgs(['-r', 'pcr']).resource, 'podcertificaterequests')
    assert.equal(cli.parseArgs(['-r', 'sv']).resource, 'storageversions')
    assert.equal(cli.parseArgs(['-r', 'svm']).resource, 'storageversionmigrations')
    assert.equal(cli.parseArgs(['-r', 'rc']).resource, 'replicationcontrollers')
    assert.equal(cli.parseArgs(['-r', 'crv']).resource, 'controllerrevisions')
    assert.equal(cli.parseArgs(['-r', 'pt']).resource, 'podtemplates')
    assert.equal(cli.parseArgs(['-r', 'ic']).resource, 'ingressclasses')
    assert.equal(cli.parseArgs(['-r', 'pdb']).resource, 'poddisruptionbudgets')
    assert.equal(cli.parseArgs(['-r', 'rq']).resource, 'resourcequotas')
    assert.equal(cli.parseArgs(['-r', 'lr']).resource, 'limitranges')
    assert.equal(cli.parseArgs(['-r', 'pc']).resource, 'priorityclasses')
    assert.equal(cli.parseArgs(['-r', 'rtc']).resource, 'runtimeclasses')
    assert.equal(cli.parseArgs(['-r', 'csid']).resource, 'csidrivers')
    assert.equal(cli.parseArgs(['-r', 'vac']).resource, 'volumeattributesclasses')
    assert.equal(cli.parseArgs(['-r', 'csin']).resource, 'csinodes')
    assert.equal(cli.parseArgs(['-r', 'va']).resource, 'volumeattachments')
    assert.equal(cli.parseArgs(['-r', 'csc']).resource, 'csistoragecapacities')
    assert.equal(cli.parseArgs(['-r', 'vsc']).resource, 'volumesnapshotclasses')
    assert.equal(cli.parseArgs(['-r', 'vs']).resource, 'volumesnapshots')
    assert.equal(cli.parseArgs(['-r', 'vscnt']).resource, 'volumesnapshotcontents')
    assert.equal(cli.parseArgs(['-r', 'gwc']).resource, 'gatewayclasses')
    assert.equal(cli.parseArgs(['-r', 'gw']).resource, 'gateways')
    assert.equal(cli.parseArgs(['-r', 'htr']).resource, 'httproutes')
    assert.equal(cli.parseArgs(['-r', 'grpcr']).resource, 'grpcroutes')
    assert.equal(cli.parseArgs(['-r', 'tlsr']).resource, 'tlsroutes')
    assert.equal(cli.parseArgs(['-r', 'tcpr']).resource, 'tcproutes')
    assert.equal(cli.parseArgs(['-r', 'udpr']).resource, 'udproutes')
    assert.equal(cli.parseArgs(['-r', 'rg']).resource, 'referencegrants')
    assert.equal(cli.parseArgs(['-r', 'ip']).resource, 'ipaddresses')
    assert.equal(cli.parseArgs(['-r', 'scidr']).resource, 'servicecidrs')
    assert.equal(cli.parseArgs(['-r', 'dc']).resource, 'deviceclasses')
    assert.equal(cli.parseArgs(['-r', 'dtr']).resource, 'devicetaintrules')
    assert.equal(cli.parseArgs(['-r', 'drc']).resource, 'resourceclaims')
    assert.equal(cli.parseArgs(['-r', 'drct']).resource, 'resourceclaimtemplates')
    assert.equal(cli.parseArgs(['-r', 'rslice']).resource, 'resourceslices')
    assert.equal(cli.parseArgs(['-r', 'crx', '--crd', 'widgets.example.com']).resource, 'customresources')
    assert.equal(cli.parseArgs(['-r', 'customresources', '--crd-name', 'widgets.example.com']).crdName, 'widgets.example.com')
    assert.deepEqual(
      cli.parseArgs(['-r', 'po', '--sort', '-age']),
      {
        action: 'list',
        context: undefined,
        namespace: undefined,
        resource: 'pods',
        watch: false,
        refreshSeconds: 3,
        name: undefined,
        container: undefined,
        tailLines: 100,
        replicas: undefined,
        command: undefined,
        confirm: false,
        help: false,
        sortColumn: 'age',
        sortDirection: 'desc',
      },
    )
    assert.equal(cli.parseArgs(['-r', 'po', '--sort', 'name', '--desc']).sortDirection, 'desc')
    assert.throws(() => cli.parseArgs(['-r', 'po', '--sort', '']), /--sort/)
    assert.throws(() => cli.parseArgs(['-r', 'po', '--desc']), /--sort/)
    assert.throws(() => cli.parseArgs(['-r', 'customresources']), /--crd/)
    assert.throws(() => cli.parseArgs(['edit', '-r', 'crx', '--name', 'widget-1']), /--crd/)
    assert.throws(() => cli.parseArgs(['label', '-r', 'crx', '--name', 'widget-1', '--key', 'team', '--value', 'platform', '--confirm']), /--crd/)
    assert.throws(() => cli.parseArgs(['-r', 'widgets']), /Unsupported resource/)
  })

  it('resolves and runs the interactive resource prompt', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const baseOptions = cli.parseArgs(['tui', '-r', 'po'])

    const serviceCommand = cli.resolveInteractiveCommand(baseOptions, ':svc default')
    assert.equal(serviceCommand.type, 'render')
    assert.equal(serviceCommand.options.resource, 'services')
    assert.equal(serviceCommand.options.namespace, 'default')

    const customResourcesCommand = cli.resolveInteractiveCommand(baseOptions, ':crx widgets.example.com default')
    assert.equal(customResourcesCommand.type, 'render')
    assert.equal(customResourcesCommand.options.resource, 'customresources')
    assert.equal(customResourcesCommand.options.crdName, 'widgets.example.com')
    assert.equal(customResourcesCommand.options.namespace, 'default')

    const namespaceCommand = cli.resolveInteractiveCommand(baseOptions, 'ns all')
    assert.equal(namespaceCommand.type, 'render')
    assert.equal(namespaceCommand.options.namespace, 'all')
    assert.equal(cli.resolveInteractiveCommand(baseOptions, ':q').type, 'exit')
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /Interactive commands/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, 'aliases').message, /po=pods/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /\/filter/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /:ctx <name>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /:crx <crd>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /sort <column>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /describe <name>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /yaml <name>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /exec <pod>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /logs \[--previous\] \[--timestamps\] <pod>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /shell <pod>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /attach <pod>/)
    assert.match(cli.resolveInteractiveCommand(baseOptions, '?').message, /pf \[pod\|svc\]/)

    const listContextsCommand = cli.resolveInteractiveCommand(baseOptions, ':ctx')
    const switchContextCommand = cli.resolveInteractiveCommand(baseOptions, ':ctx prod')
    assert.equal(listContextsCommand.type, 'render')
    assert.equal(listContextsCommand.options.resource, 'contexts')
    assert.equal(switchContextCommand.type, 'context')
    assert.equal(switchContextCommand.context, 'prod')
    assert.equal(switchContextCommand.options.context, 'prod')

    const filterCommand = cli.resolveInteractiveCommand(baseOptions, '/web')
    const inverseFilterCommand = cli.resolveInteractiveCommand(baseOptions, '/! web')
    assert.equal(filterCommand.options.filterText, 'web')
    assert.equal(filterCommand.options.inverseFilter, false)
    assert.equal(inverseFilterCommand.options.filterText, 'web')
    assert.equal(inverseFilterCommand.options.inverseFilter, true)
    assert.deepEqual(
      cli.filterInteractiveTable({ headers: ['NAME'], rows: [['web'], ['api']] }, filterCommand.options).rows,
      [['web']],
    )
    assert.deepEqual(
      cli.filterInteractiveTable({ headers: ['NAME'], rows: [['web'], ['api']] }, inverseFilterCommand.options).rows,
      [['api']],
    )
    assert.equal(cli.resolveInteractiveCommand(filterCommand.options, '/').options.filterText, undefined)

    const sortCommand = cli.resolveInteractiveCommand(baseOptions, 'sort -age')
    assert.equal(sortCommand.type, 'render')
    assert.equal(sortCommand.options.sortColumn, 'age')
    assert.equal(sortCommand.options.sortDirection, 'desc')
    assert.equal(cli.resolveInteractiveCommand(sortCommand.options, 'sort clear').options.sortColumn, undefined)
    assert.match(cli.resolveInteractiveCommand(baseOptions, 'sort').message, /sort requires column/)

    const describeCommand = cli.resolveInteractiveCommand(baseOptions, 'describe default/web-1')
    assert.equal(describeCommand.type, 'document')
    assert.equal(describeCommand.action, 'describe')
    assert.equal(describeCommand.options.name, 'web-1')
    assert.equal(describeCommand.options.namespace, 'default')

    const yamlCommand = cli.resolveInteractiveCommand(baseOptions, 'yaml web-1 default')
    assert.equal(yamlCommand.type, 'document')
    assert.equal(yamlCommand.action, 'yaml')
    assert.equal(yamlCommand.options.name, 'web-1')
    assert.equal(yamlCommand.options.namespace, 'default')
    assert.match(cli.resolveInteractiveCommand(baseOptions, 'describe').message, /describe requires name/)

    const logsCommand = cli.resolveInteractiveCommand(baseOptions, 'logs default/web-1 app')
    assert.equal(logsCommand.type, 'logs')
    assert.equal(logsCommand.options.resource, 'pods')
    assert.equal(logsCommand.options.name, 'web-1')
    assert.equal(logsCommand.options.namespace, 'default')
    assert.equal(logsCommand.options.container, 'app')
    const previousLogsCommand = cli.resolveInteractiveCommand(baseOptions, 'logs --previous --timestamps default/web-1 app')
    assert.equal(previousLogsCommand.type, 'logs')
    assert.equal(previousLogsCommand.options.previous, true)
    assert.equal(previousLogsCommand.options.timestamps, true)
    assert.equal(previousLogsCommand.options.name, 'web-1')
    assert.equal(previousLogsCommand.options.container, 'app')
    assert.equal(cli.resolveInteractiveCommand(baseOptions, 'l').message, 'logs requires pod name\n')

    const execCommand = cli.resolveInteractiveCommand(baseOptions, 'exec default/web-1 app -- printenv HOSTNAME')
    assert.equal(execCommand.type, 'exec')
    assert.equal(execCommand.options.resource, 'pods')
    assert.equal(execCommand.options.name, 'web-1')
    assert.equal(execCommand.options.namespace, 'default')
    assert.equal(execCommand.options.container, 'app')
    assert.equal(execCommand.options.command, 'printenv HOSTNAME')
    assert.equal(cli.resolveInteractiveCommand(baseOptions, 'x default/web-1 app').message, 'exec requires -- before command\n')

    const shellCommand = cli.resolveInteractiveCommand(baseOptions, 'shell default/web-1 app /bin/bash -l')
    assert.equal(shellCommand.type, 'shell')
    assert.equal(shellCommand.options.resource, 'pods')
    assert.equal(shellCommand.options.name, 'web-1')
    assert.equal(shellCommand.options.namespace, 'default')
    assert.equal(shellCommand.options.container, 'app')
    assert.deepEqual(shellCommand.options.commandArgs, ['/bin/bash', '-l'])
    assert.equal(cli.resolveInteractiveCommand(baseOptions, 'sh').message, 'shell requires pod name\n')

    const attachCommand = cli.resolveInteractiveCommand(baseOptions, 'attach default/web-1 app')
    assert.equal(attachCommand.type, 'attach')
    assert.equal(attachCommand.options.resource, 'pods')
    assert.equal(attachCommand.options.name, 'web-1')
    assert.equal(attachCommand.options.namespace, 'default')
    assert.equal(attachCommand.options.container, 'app')
    assert.equal(cli.resolveInteractiveCommand(baseOptions, 'att').message, 'attach requires pod name\n')

    const portForwardCommand = cli.resolveInteractiveCommand(baseOptions, 'pf default/web-1 8080 18080')
    assert.equal(portForwardCommand.type, 'port-forward')
    assert.equal(portForwardCommand.options.resource, 'pods')
    assert.equal(portForwardCommand.options.name, 'web-1')
    assert.equal(portForwardCommand.options.namespace, 'default')
    assert.equal(portForwardCommand.options.targetPort, 8080)
    assert.equal(portForwardCommand.options.localPort, 18080)

    const servicePortForwardCommand = cli.resolveInteractiveCommand({ ...baseOptions, resource: 'services', namespace: 'default' }, 'pf svc web 80')
    assert.equal(servicePortForwardCommand.type, 'port-forward')
    assert.equal(servicePortForwardCommand.options.resource, 'services')
    assert.equal(servicePortForwardCommand.options.name, 'web')
    assert.equal(servicePortForwardCommand.options.namespace, 'default')
    assert.equal(servicePortForwardCommand.options.targetPort, 80)
    assert.equal(servicePortForwardCommand.options.localPort, undefined)
    assert.match(cli.resolveInteractiveCommand(baseOptions, 'pf web 8080').message, /requires namespace/)

    assert.deepEqual(
      cli.sortTableRows(
        {
          headers: ['NAME', 'CPU', 'MEMORY', 'AGE'],
          rows: [
            ['api', '50m', '32Mi', '3m'],
            ['web', '150m', '128Mi', '1h'],
            ['job', '-', '-', '10s'],
          ],
        },
        { sortColumn: 'cpu', sortDirection: 'desc' },
      ).rows.map((row) => row[0]),
      ['web', 'api', 'job'],
    )
    assert.deepEqual(
      cli.sortTableRows(
        {
          headers: ['NAME', 'CPU', 'MEMORY', 'AGE'],
          rows: [
            ['api', '50m', '32Mi', '3m'],
            ['web', '150m', '128Mi', '1h'],
            ['job', '-', '-', '10s'],
          ],
        },
        { sortColumn: 'age', sortDirection: 'asc' },
      ).rows.map((row) => row[0]),
      ['job', 'api', 'web'],
    )

    const setCurrentContextCalls = []
    const kubeConfig = createMockKubeConfig({
      setCurrentContextCalls,
      contexts: [
        { name: 'test-context', cluster: 'test-cluster', user: 'test-user', namespace: 'default' },
        { name: 'prod', cluster: 'prod-cluster', user: 'prod-user', namespace: 'ops' },
      ],
      clusters: [
        { name: 'test-cluster', server: 'https://127.0.0.1:6443' },
        { name: 'prod-cluster', server: 'https://10.0.0.1:6443' },
      ],
      core: {
        listPodForAllNamespaces: async () => ({
          items: [{
            metadata: { namespace: 'default', name: 'web-1', creationTimestamp: new Date().toISOString() },
            spec: { containers: [{ name: 'app' }] },
            status: { phase: 'Running', containerStatuses: [{ ready: true, restartCount: 0 }] },
          }, {
            metadata: { namespace: 'default', name: 'api-1', creationTimestamp: new Date().toISOString() },
            spec: { containers: [{ name: 'app' }] },
            status: { phase: 'Running', containerStatuses: [{ ready: true, restartCount: 0 }] },
          }],
        }),
        listNamespacedService: async ({ namespace }) => ({
          items: [{
            metadata: { namespace, name: 'web', creationTimestamp: new Date().toISOString() },
            spec: {
              type: 'ClusterIP',
              clusterIP: '10.96.0.10',
              ports: [{ port: 80, protocol: 'TCP' }],
            },
          }],
        }),
        readNamespacedPod: async ({ namespace, name }) => ({
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: {
            namespace,
            name,
            uid: 'pod-uid-1',
            creationTimestamp: new Date().toISOString(),
            labels: { app: 'web' },
          },
          spec: { containers: [{ name: 'app', image: 'nginx' }] },
          status: { phase: 'Running' },
        }),
        listNamespacedEvent: async () => ({ items: [] }),
        readNamespacedPodLog: async ({ namespace, name, container }) => (
          `logs ${namespace}/${name}/${container}\n`
        ),
      },
      exec: {
        exec: async (namespace, podName, containerName, command, stdout, stderr, stdin, tty, statusCallback) => {
          stdout.write(`exec ${namespace}/${podName}/${containerName} ${command.join(' ')}\n`)
          statusCallback({ status: 'Success' })
          return {}
        },
      },
    })
    const commands = [':ctx prod', ':svc default', '?', ':po', 'describe default/web-1', 'yaml default/web-1', 'exec default/web-1 app -- printenv HOSTNAME', 'logs default/web-1 app', 'shell default/web-1 app /bin/bash -l', 'attach default/web-1 app', 'pf default/web-1 8080 18080', 'q']
    const prompts = []
    let closed = false
    let paused = false
    let resumed = false
    const output = []
    const spawnCalls = []
    const spawnImpl = (command, args, spawnOptions) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      spawnCalls.push({ command, args, options: spawnOptions })
      setImmediate(() => child.emit('close', 0))
      return child
    }

    await cli.runInteractiveCli(kubeConfig, baseOptions, {
      clear: false,
      output: { write: (value) => output.push(String(value)) },
      error: { write: (value) => output.push(String(value)) },
      spawnImpl,
      createInterfaceImpl: () => ({
        question: async (prompt) => {
          prompts.push(prompt)
          return commands.shift() ?? 'q'
        },
        pause: () => {
          paused = true
        },
        resume: () => {
          resumed = true
        },
        close: () => {
          closed = true
        },
      }),
    })

    const rendered = output.join('')
    assert.equal(closed, true)
    assert.match(prompts[0], /k7s:pods:all>/)
    assert.match(prompts[1], /k7s:pods:all>/)
    assert.match(prompts[2], /k7s:services:default>/)
    assert.deepEqual(setCurrentContextCalls, ['prod'])
    assert.match(rendered, /context=prod/)
    assert.match(rendered, /web-1/)
    assert.match(rendered, /api-1/)
    assert.match(rendered, /web/)
    assert.match(rendered, /Interactive commands/)
    assert.match(rendered, /Name: web-1/)
    assert.match(rendered, /kind: Pod/)
    assert.match(rendered, /exec default\/web-1\/app \/bin\/sh -lc printenv HOSTNAME/)
    assert.match(rendered, /logs default\/web-1\/app/)
    assert.equal(paused, true)
    assert.equal(resumed, true)
    assert.deepEqual(spawnCalls, [{
      command: 'kubectl',
      args: [
        '--context',
        'prod',
        'exec',
        '-it',
        'pod/web-1',
        '-n',
        'default',
        '-c',
        'app',
        '--',
        '/bin/bash',
        '-l',
      ],
      options: { stdio: 'inherit' },
    }, {
      command: 'kubectl',
      args: [
        '--context',
        'prod',
        'attach',
        '-it',
        'pod/web-1',
        '-n',
        'default',
        '-c',
        'app',
      ],
      options: { stdio: 'inherit' },
    }, {
      command: 'kubectl',
      args: [
        '--context',
        'prod',
        'port-forward',
        'pod/web-1',
        '18080:8080',
        '-n',
        'default',
        '--address',
        '127.0.0.1',
      ],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.match(rendered, /port-forward running: 127\.0\.0\.1:18080 -> default\/pod\/web-1:8080/)
  })

  it('can render every supported CLI resource type', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()

    for (const resource of cli.RESOURCE_TYPES) {
      const table = await cli.listRows(kubeConfig, {
        resource,
        namespace: undefined,
        ...(resource === 'customresources' ? { crdName: 'widgets.example.com' } : {}),
      })
      assert.ok(Array.isArray(table.headers), resource)
      assert.ok(Array.isArray(table.rows), resource)
    }
  })

  it('applies YAML manifests with server-side apply without echoing secret values', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      object: {
        patch: async (manifest, pretty, dryRun, fieldManager, force, patchStrategy) => {
          calls.push({ manifest, pretty, dryRun, fieldManager, force, patchStrategy })
          return manifest
        },
      },
    })
    const yaml = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  namespace: default',
      '  name: web',
      'spec:',
      '  replicas: 2',
      '---',
      'apiVersion: v1',
      'kind: Secret',
      'metadata:',
      '  namespace: default',
      '  name: web-secret',
      'stringData:',
      '  password: super-secret',
    ].join('\n')

    const options = cli.parseArgs(['apply', '-f', './manifest.yaml', '--confirm', '--dry-run', '--field-manager', 'ci', '--force-conflicts'])
    const table = await cli.loadApplyRows(kubeConfig, options, async (file) => {
      assert.equal(file, './manifest.yaml')
      return yaml
    })
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.equal(calls.length, 2)
    assert.deepEqual(calls.map((call) => [
      call.manifest.kind,
      call.manifest.metadata.name,
      call.dryRun,
      call.fieldManager,
      call.force,
      call.patchStrategy,
    ]), [
      ['Deployment', 'web', 'All', 'ci', true, 'application/apply-patch+yaml'],
      ['Secret', 'web-secret', 'All', 'ci', true, 'application/apply-patch+yaml'],
    ])
    assert.deepEqual(table.headers, ['ACTION', 'KIND', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [
      ['apply', 'Deployment', 'default', 'web', 'OK', 'dry-run validated'],
      ['apply', 'Secret', 'default', 'web-secret', 'OK', 'dry-run validated'],
    ])
    assert.match(output, /resource=manifests/)
    assert.doesNotMatch(output, /super-secret/)
  })

  it('reports apply failures per manifest and rejects empty YAML input', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      object: {
        patch: async (manifest) => {
          if (manifest.kind === 'ConfigMap') {
            throw new Error('conflict on data')
          }
          return manifest
        },
      },
    })
    const options = cli.parseArgs(['apply', '-f', '-', '--confirm'])

    const table = await cli.loadApplyRows(kubeConfig, options, async () => [
      'apiVersion: v1',
      'kind: ConfigMap',
      'metadata:',
      '  namespace: default',
      '  name: app-config',
      '---',
      'kind: Service',
      'metadata:',
      '  name: web',
    ].join('\n'))

    assert.deepEqual(table.rows.map((row) => row.slice(0, 6)), [
      ['apply', 'ConfigMap', 'default', 'app-config', 'FAIL', 'conflict on data'],
      ['apply', 'Service', '-', 'web', 'FAIL', 'manifest requires apiVersion'],
    ])
    await assert.rejects(() => cli.loadApplyRows(kubeConfig, options, async () => '\n---\n'), /no YAML documents/)
  })

  it('runs kubectl diff for manifest files and forwards output', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.stdin = { end: () => calls.push({ stdin: 'end' }) }
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('diff --git a/deploy b/deploy\n'))
        child.stderr.emit('data', 'server-side diff\n')
        child.emit('close', 1)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['diff', '--context', 'minikube', '-f', './deployment.yaml', '-n', 'default', '--server-side', '--field-manager', 'ci', '--force-conflicts'])
    const exitCode = await cli.runKubectlDiff(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 1)
    assert.deepEqual(calls, [
      {
        command: 'kubectl',
        args: [
          '--context',
          'minikube',
          'diff',
          '-f',
          './deployment.yaml',
          '-n',
          'default',
          '--server-side',
          '--field-manager',
          'ci',
          '--force-conflicts',
        ],
        options: {
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      },
      { stdin: 'end' },
    ])
    assert.equal(stdout.join(''), 'diff running: ./deployment.yaml\ndiff --git a/deploy b/deploy\n')
    assert.equal(stderr.join(''), 'server-side diff\n')
  })

  it('pipes stdin into kubectl diff when file is dash', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    child.stdin = { id: 'child-stdin' }
    const inputStream = {
      pipe: (target) => {
        calls.push({ pipeTarget: target })
      },
    }
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['diff', '-f', '-'])
    const exitCode = await cli.runKubectlDiff(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    }, inputStream)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [
      {
        command: 'kubectl',
        args: ['--context', 'test-context', 'diff', '-f', '-'],
        options: {
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      },
      { pipeTarget: child.stdin },
    ])
  })

  it('renders kubeconfig contexts without exposing user credentials', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      currentContext: 'prod',
      contexts: [
        {
          name: 'prod',
          cluster: 'prod-cluster',
          user: 'prod-user',
          namespace: 'prod-ns',
        },
        {
          name: 'dev',
          cluster: 'dev-cluster',
          user: 'dev-user',
        },
      ],
      clusters: [
        {
          name: 'prod-cluster',
          server: 'https://prod.example',
        },
        {
          name: 'dev-cluster',
          server: 'https://dev.example',
        },
      ],
      users: [
        {
          name: 'prod-user',
          token: 'secret-token',
          clientCertificateData: 'secret-cert',
        },
      ],
    })
    const options = cli.parseArgs(['-r', 'ctx'])

    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['CURRENT', 'NAME', 'CLUSTER', 'USER', 'NAMESPACE', 'SERVER'])
    assert.deepEqual(table.rows, [
      ['*', 'prod', 'prod-cluster', 'prod-user', 'prod-ns', 'https://prod.example'],
      ['', 'dev', 'dev-cluster', 'dev-user', '-', 'https://dev.example'],
    ])
    assert.doesNotMatch(output, /secret-token/)
    assert.doesNotMatch(output, /secret-cert/)
  })

  it('deletes a namespaced resource only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        deleteNamespacedPod: async (request) => {
          calls.push(request)
          return {}
        },
      },
    })

    const options = cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(calls, [{
      name: 'web-1',
      namespace: 'default',
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
      },
    }])
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['delete', 'pods', 'default', 'web-1', 'OK', 'delete requested']])
    assert.match(output, /action=delete resource=pods namespace=default/)
  })

  it('uninstalls Helm releases through helm when deleting helm resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('release "web" uninstalled\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['delete', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm'])
    const table = await cli.uninstallHelmReleaseRows(kubeConfig, options, spawnImpl)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: [
        '--kube-context',
        'minikube',
        'uninstall',
        'web',
        '-n',
        'default',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['uninstall', 'helmreleases', 'default', 'web', 'OK', 'release "web" uninstalled']])
    assert.match(output, /action=delete resource=helmreleases namespace=default/)

    const noNamespace = cli.parseArgs(['delete', '-r', 'helm', '--name', 'web', '--confirm'])
    const unsupported = cli.parseArgs(['delete', '-r', 'po', '-n', 'default', '--name', 'web', '--confirm'])
    await assert.rejects(() => cli.uninstallHelmReleaseRows(kubeConfig, noNamespace, spawnImpl), /delete requires --namespace/)
    await assert.rejects(() => cli.uninstallHelmReleaseRows(kubeConfig, unsupported, spawnImpl), /not supported/)
  })

  it('force deletes pods with zero grace period only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        deleteNamespacedPod: async (request) => {
          calls.push(request)
          return {}
        },
      },
    })

    const options = cli.parseArgs(['kill', '-r', 'po', '-n', 'default', '--name', 'stuck-pod', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(calls, [{
      name: 'stuck-pod',
      namespace: 'default',
      gracePeriodSeconds: 0,
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
        gracePeriodSeconds: 0,
      },
    }])
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['force-delete', 'pods', 'default', 'stuck-pod', 'OK', 'force delete requested']])
    assert.match(output, /action=force-delete resource=pods namespace=default/)
  })

  it('evicts pods with the policy eviction subresource only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        createNamespacedPodEviction: async (request) => {
          calls.push(request)
          return {}
        },
      },
    })

    const options = cli.parseArgs(['evict', '-r', 'po', '-n', 'default', '--name', 'web-1', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(calls, [{
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
    }])
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['evict', 'pods', 'default', 'web-1', 'OK', 'evict requested']])
    assert.match(output, /action=evict resource=pods namespace=default/)
  })

  it('requires namespace and pod resources for evict', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['evict', '-r', 'po', '--name', 'web-1', '--confirm'])
    const unsupported = cli.parseArgs(['evict', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, noNamespace), /--namespace/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupported), /evict is not supported/)
  })

  it('requires namespace and pod resources for force delete', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['kill', '-r', 'po', '--name', 'stuck-pod', '--confirm'])
    const unsupported = cli.parseArgs(['kill', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, noNamespace), /--namespace/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupported), /force-delete is not supported/)
  })

  it('requires namespace for namespaced deletes', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const options = cli.parseArgs(['delete', '-r', 'po', '--name', 'web-1', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, options), /--namespace/)
  })

  it('deletes cluster-scoped resources without namespace', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        deleteNamespace: async (request) => {
          calls.push(request)
          return {}
        },
      },
    })

    const options = cli.parseArgs(['delete', '-r', 'ns', '--name', 'old-env', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)

    assert.deepEqual(calls, [{
      name: 'old-env',
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
      },
    }])
    assert.deepEqual(table.rows, [['delete', 'namespaces', '-', 'old-env', 'OK', 'delete requested']])
  })

  it('deletes static custom resources through the custom objects API', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      customObjects: {
        deleteNamespacedCustomObject: async (request) => {
          calls.push(request)
          return {}
        },
      },
    })

    const options = cli.parseArgs(['delete', '-r', 'htr', '-n', 'default', '--name', 'web-route', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)

    assert.deepEqual(calls, [{
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'httproutes',
      name: 'web-route',
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
      },
    }])
    assert.deepEqual(table.rows, [['delete', 'httproutes', 'default', 'web-route', 'OK', 'delete requested']])
  })

  it('scales supported workloads only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      apps: {
        patchNamespacedDeploymentScale: async (request, options) => {
          calls.push([request, options])
          return { spec: { replicas: request.body.spec.replicas } }
        },
      },
    })

    const options = cli.parseArgs(['scale', '-r', 'deploy', '-n', 'default', '--name', 'web', '--replicas', '4', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)
    const request = calls[0][0]
    const patchOptions = calls[0][1]
    const context = {
      headers: {},
      setHeaderParam(name, value) {
        this.headers[name] = value
      },
    }

    await patchOptions.middleware[0].pre(context)

    assert.deepEqual(request, {
      name: 'web',
      namespace: 'default',
      body: {
        spec: {
          replicas: 4,
        },
      },
    })
    assert.equal(context.headers['Content-Type'], 'application/merge-patch+json')
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'REQUESTED', 'REPLICAS', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['scale', 'deployments', 'default', 'web', 4, 4, 'OK', 'scale requested']])
    assert.match(output, /action=scale resource=deployments namespace=default/)
  })

  it('requires namespace and supported resources for scale', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['scale', '-r', 'deploy', '--name', 'web', '--replicas', '2', '--confirm'])
    const unsupported = cli.parseArgs(['scale', '-r', 'po', '-n', 'default', '--name', 'web', '--replicas', '2', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, noNamespace), /scale requires --namespace/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupported), /scale is not supported/)
  })

  it('restarts supported workloads only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      apps: {
        patchNamespacedDeployment: async (request, options) => {
          calls.push([request, options])
          return {}
        },
      },
    })

    const options = cli.parseArgs(['restart', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)
    const request = calls[0][0]
    const patchOptions = calls[0][1]
    const restartedAt = request.body.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt']
    const context = {
      headers: {},
      setHeaderParam(name, value) {
        this.headers[name] = value
      },
    }

    await patchOptions.middleware[0].pre(context)

    assert.equal(request.name, 'web')
    assert.equal(request.namespace, 'default')
    assert.ok(!Number.isNaN(new Date(restartedAt).getTime()))
    assert.deepEqual(Object.keys(request.body.spec.template.metadata.annotations), ['kubectl.kubernetes.io/restartedAt'])
    assert.equal(context.headers['Content-Type'], 'application/strategic-merge-patch+json')
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'RESTARTED-AT', 'MESSAGE'])
    assert.deepEqual(table.rows, [['restart', 'deployments', 'default', 'web', 'OK', restartedAt, 'restart requested']])
    assert.match(output, /action=restart resource=deployments namespace=default/)
  })

  it('requires namespace and supported resources for restart', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['restart', '-r', 'deploy', '--name', 'web', '--confirm'])
    const unsupported = cli.parseArgs(['restart', '-r', 'rs', '-n', 'default', '--name', 'web', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, noNamespace), /restart requires --namespace/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupported), /restart is not supported/)
  })

  it('updates workload container images only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      apps: {
        patchNamespacedDeployment: async (request, options) => {
          calls.push([request, options])
          return {}
        },
      },
    })

    const options = cli.parseArgs(['set-image', '-r', 'deploy', '-n', 'default', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28', '--confirm'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)
    const request = calls[0][0]
    const patchOptions = calls[0][1]
    const context = {
      headers: {},
      setHeaderParam(name, value) {
        this.headers[name] = value
      },
    }

    await patchOptions.middleware[0].pre(context)

    assert.deepEqual(request, {
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
    assert.equal(context.headers['Content-Type'], 'application/strategic-merge-patch+json')
    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'CONTAINER', 'IMAGE', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows, [['set-image', 'deployments', 'default', 'web', 'app', 'nginx:1.28', 'OK', 'image update requested']])
    assert.match(output, /action=set-image resource=deployments namespace=default/)
  })

  it('requires namespace and supported resources for set-image', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['set-image', '-r', 'deploy', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28', '--confirm'])
    const unsupported = cli.parseArgs(['set-image', '-r', 'rs', '-n', 'default', '--name', 'web', '--container', 'app', '--image', 'nginx:1.28', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, noNamespace), /set-image requires --namespace/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupported), /set-image is not supported/)
  })

  it('runs rollout rollback through kubectl and forwards process output', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('deployment.apps/web rolled back\n'))
        child.stderr.emit('data', 'revision 3 selected\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['rollback', '--context', 'minikube', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '3', '--confirm'])
    const exitCode = await cli.runRolloutRollback(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'rollout',
        'undo',
        'deployment/web',
        '-n',
        'default',
        '--to-revision',
        '3',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'rollback running: deployments/web\ndeployment.apps/web rolled back\n')
    assert.equal(stderr.join(''), 'revision 3 selected\n')
  })

  it('returns non-zero rollback exits and requires namespace and supported workloads', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 4)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['rollback', '-r', 'sts', '-n', 'default', '--name', 'db', '--confirm'])
    const noNamespace = cli.parseArgs(['rollback', '-r', 'deploy', '--name', 'web', '--confirm'])
    const unsupported = cli.parseArgs(['rollback', '-r', 'po', '-n', 'default', '--name', 'web', '--confirm'])
    const exitCode = await cli.runRolloutRollback(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 4)
    assert.deepEqual(calls[0].args, [
      '--context',
      'test-context',
      'rollout',
      'undo',
      'statefulset/db',
      '-n',
      'default',
    ])
    await assert.rejects(() => cli.runRolloutRollback(kubeConfig, noNamespace, spawnImpl), /rollback requires --namespace/)
    await assert.rejects(() => cli.runRolloutRollback(kubeConfig, unsupported, spawnImpl), /rollback is not supported/)
  })

  it('runs Helm release rollback and history through helm', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const spawnImpl = (command, args, options) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      calls.push({ command, args, options })
      setImmediate(() => {
        if (args.includes('history')) {
          child.stdout.emit('data', Buffer.from('REVISION UPDATED STATUS CHART\n'))
        } else {
          child.stdout.emit('data', Buffer.from('Rollback was a success\n'))
        }
        child.stderr.emit('data', '')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const rollbackOptions = cli.parseArgs(['rollback', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '2', '--confirm'])
    const rollbackExitCode = await cli.runHelmReleaseRollback(kubeConfig, rollbackOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })
    const historyOptions = cli.parseArgs(['history', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const historyExitCode = await cli.runHelmReleaseHistory(kubeConfig, historyOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(rollbackExitCode, 0)
    assert.equal(historyExitCode, 0)
    assert.deepEqual(calls.map((call) => ({ command: call.command, args: call.args, options: call.options })), [
      {
        command: 'helm',
        args: ['--kube-context', 'minikube', 'rollback', 'web', '2', '-n', 'default'],
        options: { stdio: ['ignore', 'pipe', 'pipe'] },
      },
      {
        command: 'helm',
        args: ['--kube-context', 'minikube', 'history', 'web', '-n', 'default'],
        options: { stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ])
    assert.equal(stdout.join(''), [
      'helm rollback: helmreleases/web\n',
      'Rollback was a success\n',
      'helm history: helmreleases/web\n',
      'REVISION UPDATED STATUS CHART\n',
    ].join(''))
    assert.equal(stderr.join(''), '')

    const noNamespace = cli.parseArgs(['rollback', '-r', 'helm', '--name', 'web', '--confirm'])
    const unsupported = cli.parseArgs(['rollback', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])
    await assert.rejects(() => cli.runHelmReleaseRollback(kubeConfig, noNamespace, spawnImpl), /rollback requires --namespace/)
    await assert.rejects(() => cli.runHelmReleaseRollback(kubeConfig, unsupported, spawnImpl), /helm rollback is not supported/)
  })

  it('runs Helm release install and upgrade through helm', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const spawnImpl = (command, args, options) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('Release web deployed\n'))
        child.stderr.emit('data', '')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const installOptions = cli.parseArgs([
      'install',
      '--context',
      'minikube',
      '-r',
      'helm',
      '-n',
      'default',
      '--name',
      'web',
      '--chart',
      'bitnami/nginx',
      '--version',
      '18.2.5',
      '--values-file',
      './values.yaml',
      '--set',
      'image.tag=1.28',
      '--create-namespace',
      '--wait',
      '--timeout',
      '5m',
      '--confirm',
    ])
    const upgradeOptions = cli.parseArgs([
      'upgrade',
      '--context',
      'minikube',
      '-r',
      'helm',
      '-n',
      'default',
      '--name',
      'web',
      '--chart',
      'bitnami/nginx',
      '--set',
      'service.type=ClusterIP',
      '--install',
      '--confirm',
    ])

    const installExitCode = await cli.runHelmReleaseInstallOrUpgrade(kubeConfig, installOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })
    const upgradeExitCode = await cli.runHelmReleaseInstallOrUpgrade(kubeConfig, upgradeOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(installExitCode, 0)
    assert.equal(upgradeExitCode, 0)
    assert.deepEqual(calls.map((call) => ({ command: call.command, args: call.args, options: call.options })), [
      {
        command: 'helm',
        args: [
          '--kube-context',
          'minikube',
          'install',
          'web',
          'bitnami/nginx',
          '-n',
          'default',
          '--version',
          '18.2.5',
          '--values',
          './values.yaml',
          '--set',
          'image.tag=1.28',
          '--create-namespace',
          '--wait',
          '--timeout',
          '5m',
        ],
        options: { stdio: ['ignore', 'pipe', 'pipe'] },
      },
      {
        command: 'helm',
        args: [
          '--kube-context',
          'minikube',
          'upgrade',
          '--install',
          'web',
          'bitnami/nginx',
          '-n',
          'default',
          '--set',
          'service.type=ClusterIP',
        ],
        options: { stdio: ['ignore', 'pipe', 'pipe'] },
      },
    ])
    assert.equal(stdout.join(''), [
      'helm install: helmreleases/web\n',
      'Release web deployed\n',
      'helm upgrade: helmreleases/web\n',
      'Release web deployed\n',
    ].join(''))
    assert.equal(stderr.join(''), '')

    const unsupported = { ...installOptions, resource: 'deployments' }
    await assert.rejects(() => cli.runHelmReleaseInstallOrUpgrade(kubeConfig, unsupported, spawnImpl), /helm install is not supported/)
  })

  it('runs Helm release test through helm with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const spawnImpl = (command, args, options) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('Pod web-test succeeded\n'))
        child.stderr.emit('data', '')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()
    const options = cli.parseArgs(['test', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm'])

    const exitCode = await cli.runHelmReleaseTest(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'test', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(stdout.join(''), 'helm test: helmreleases/web\nPod web-test succeeded\n')
    assert.equal(stderr.join(''), '')

    const noNamespace = cli.parseArgs(['test', '-r', 'helm', '-n', 'default', '--name', 'web', '--confirm'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.runHelmReleaseTest(kubeConfig, noNamespace, spawnImpl), /test requires --namespace/)
    await assert.rejects(() => cli.runHelmReleaseTest(kubeConfig, unsupported, spawnImpl), /helm test is not supported/)
  })

  it('loads Helm release status through helm for describe', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('NAME: web\nSTATUS: deployed\nREVISION: 3\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['describe', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const status = await cli.loadHelmStatusDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'status', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(status, 'NAME: web\nSTATUS: deployed\nREVISION: 3\n')

    const noNamespace = cli.parseArgs(['describe', '-r', 'helm', '--name', 'web'])
    const unsupported = cli.parseArgs(['describe', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    await assert.rejects(() => cli.loadHelmStatusDocument(kubeConfig, noNamespace, spawnImpl), /describe requires --namespace/)
    await assert.rejects(() => cli.loadHelmStatusDocument(kubeConfig, unsupported, spawnImpl), /helm status is not supported/)
  })

  it('loads Helm release status through the status action with optional revision', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const spawnImpl = (command, args, options) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('NAME: web\nREVISION: 2\nSTATUS: superseded\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['status', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web', '--revision', '2'])
    const status = await cli.loadHelmStatusDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'status', 'web', '-n', 'default', '--revision', '2'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(status, 'NAME: web\nREVISION: 2\nSTATUS: superseded\n')

    const noNamespace = cli.parseArgs(['status', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmStatusDocument(kubeConfig, noNamespace, spawnImpl), /status requires --namespace/)
    await assert.rejects(() => cli.loadHelmStatusDocument(kubeConfig, unsupported, spawnImpl), /helm status is not supported/)
  })

  it('loads Helm release resources through helm status with show-resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('NAME: web\nRESOURCES:\n==> v1/Service\nNAME TYPE\nweb ClusterIP\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['resources', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const resources = await cli.loadHelmResourcesDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'status', 'web', '-n', 'default', '--show-resources'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(resources, 'NAME: web\nRESOURCES:\n==> v1/Service\nNAME TYPE\nweb ClusterIP\n')

    const noNamespace = cli.parseArgs(['resources', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmResourcesDocument(kubeConfig, noNamespace, spawnImpl), /resources requires --namespace/)
    await assert.rejects(() => cli.loadHelmResourcesDocument(kubeConfig, unsupported, spawnImpl), /helm resources is not supported/)
  })

  it('loads Helm release manifest through helm for yaml', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['yaml', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const manifest = await cli.loadHelmManifestDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'manifest', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(manifest, 'apiVersion: v1\nkind: Service\nmetadata:\n  name: web\n')

    const noNamespace = cli.parseArgs(['yaml', '-r', 'helm', '--name', 'web'])
    const unsupported = cli.parseArgs(['yaml', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    await assert.rejects(() => cli.loadHelmManifestDocument(kubeConfig, noNamespace, spawnImpl), /yaml requires --namespace/)
    await assert.rejects(() => cli.loadHelmManifestDocument(kubeConfig, unsupported, spawnImpl), /helm manifest is not supported/)
  })

  it('loads Helm release values through helm for values', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('replicaCount: 2\nimage:\n  tag: 1.2.3\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['values', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const values = await cli.loadHelmValuesDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'values', 'web', '-n', 'default', '--all'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(values, 'replicaCount: 2\nimage:\n  tag: 1.2.3\n')

    const noNamespace = cli.parseArgs(['values', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmValuesDocument(kubeConfig, noNamespace, spawnImpl), /values requires --namespace/)
    await assert.rejects(() => cli.loadHelmValuesDocument(kubeConfig, unsupported, spawnImpl), /helm values is not supported/)
  })

  it('loads Helm release metadata through helm for metadata', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('NAME: web\nCHART: web-1.2.3\nREVISION: 3\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['metadata', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const metadata = await cli.loadHelmMetadataDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'metadata', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(metadata, 'NAME: web\nCHART: web-1.2.3\nREVISION: 3\n')

    const noNamespace = cli.parseArgs(['metadata', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmMetadataDocument(kubeConfig, noNamespace, spawnImpl), /metadata requires --namespace/)
    await assert.rejects(() => cli.loadHelmMetadataDocument(kubeConfig, unsupported, spawnImpl), /helm metadata is not supported/)
  })

  it('loads Helm release notes through helm for notes', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('Visit http://web.example.test to access this release.\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['notes', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const notes = await cli.loadHelmNotesDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'notes', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(notes, 'Visit http://web.example.test to access this release.\n')

    const noNamespace = cli.parseArgs(['notes', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmNotesDocument(kubeConfig, noNamespace, spawnImpl), /notes requires --namespace/)
    await assert.rejects(() => cli.loadHelmNotesDocument(kubeConfig, unsupported, spawnImpl), /helm notes is not supported/)
  })

  it('loads Helm release hooks through helm for hooks', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('---\n# Source: web/templates/job-hook.yaml\nkind: Job\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['hooks', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const hooks = await cli.loadHelmHooksDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'hooks', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(hooks, '---\n# Source: web/templates/job-hook.yaml\nkind: Job\n')

    const noNamespace = cli.parseArgs(['hooks', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmHooksDocument(kubeConfig, noNamespace, spawnImpl), /hooks requires --namespace/)
    await assert.rejects(() => cli.loadHelmHooksDocument(kubeConfig, unsupported, spawnImpl), /helm hooks is not supported/)
  })

  it('loads Helm release all output through helm get all', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('NAME: web\n---\nkind: Service\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['all', '--context', 'minikube', '-r', 'helm', '-n', 'default', '--name', 'web'])
    const allOutput = await cli.loadHelmAllDocument(kubeConfig, options, spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['--kube-context', 'minikube', 'get', 'all', 'web', '-n', 'default'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.equal(allOutput, 'NAME: web\n---\nkind: Service\n')

    const noNamespace = cli.parseArgs(['all', '-r', 'helm', '-n', 'default', '--name', 'web'])
    noNamespace.namespace = undefined
    const unsupported = { ...options, resource: 'deployments' }
    await assert.rejects(() => cli.loadHelmAllDocument(kubeConfig, noNamespace, spawnImpl), /all requires --namespace/)
    await assert.rejects(() => cli.loadHelmAllDocument(kubeConfig, unsupported, spawnImpl), /helm all is not supported/)
  })

  it('runs rollout history through kubectl with optional revision details', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', 'REVISION  CHANGE-CAUSE\n3         deploy image\n')
        child.stderr.emit('data', Buffer.from('history details\n'))
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['history', '--context', 'minikube', '-r', 'deploy', '-n', 'default', '--name', 'web', '--revision', '3'])
    const exitCode = await cli.runRolloutHistory(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'rollout',
        'history',
        'deployment/web',
        '-n',
        'default',
        '--revision',
        '3',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'rollout history: deployments/web\nREVISION  CHANGE-CAUSE\n3         deploy image\n')
    assert.equal(stderr.join(''), 'history details\n')
  })

  it('runs rollout status through kubectl and validates workload scope', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('waiting for daemon set rollout to finish\n'))
        child.stderr.emit('data', 'timed out waiting\n')
        child.emit('close', 2)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['status', '-r', 'ds', '-n', 'kube-system', '--name', 'agent', '--timeout', '0s'])
    const noNamespace = cli.parseArgs(['status', '-r', 'deploy', '--name', 'web'])
    const unsupported = cli.parseArgs(['status', '-r', 'po', '-n', 'default', '--name', 'web'])
    const exitCode = await cli.runRolloutStatus(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 2)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'test-context',
        'rollout',
        'status',
        'daemonset/agent',
        '-n',
        'kube-system',
        '--timeout',
        '0s',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'rollout status: daemonsets/agent\nwaiting for daemon set rollout to finish\n')
    assert.equal(stderr.join(''), 'timed out waiting\n')
    await assert.rejects(() => cli.runRolloutStatus(kubeConfig, noNamespace, spawnImpl), /rollout-status requires --namespace/)
    await assert.rejects(() => cli.runRolloutStatus(kubeConfig, unsupported, spawnImpl), /rollout-status is not supported/)
  })

  it('requires namespace and supported workloads for rollout history', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['history', '-r', 'deploy', '--name', 'web'])
    const unsupported = cli.parseArgs(['history', '-r', 'po', '-n', 'default', '--name', 'web'])

    await assert.rejects(() => cli.runRolloutHistory(kubeConfig, noNamespace), /history requires --namespace/)
    await assert.rejects(() => cli.runRolloutHistory(kubeConfig, unsupported), /history is not supported/)
  })

  it('runs rollout pause and resume through kubectl for deployments only', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      setImmediate(() => {
        const action = args[args.indexOf('rollout') + 1]
        child.stdout.emit('data', `${action}d deployment.apps/web\n`)
        child.stderr.emit('data', Buffer.from(`${action} warning\n`))
        child.emit('close', calls.length === 1 ? 0 : 3)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const pauseOptions = cli.parseArgs(['pause', '--context', 'minikube', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])
    const resumeOptions = cli.parseArgs(['resume', '-r', 'deploy', '-n', 'default', '--name', 'web', '--confirm'])
    const noNamespace = cli.parseArgs(['pause', '-r', 'deploy', '--name', 'web', '--confirm'])
    const unsupported = cli.parseArgs(['pause', '-r', 'sts', '-n', 'default', '--name', 'db', '--confirm'])

    const pauseExit = await cli.runRolloutPauseResume(kubeConfig, pauseOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })
    const resumeExit = await cli.runRolloutPauseResume(kubeConfig, resumeOptions, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(pauseExit, 0)
    assert.equal(resumeExit, 3)
    assert.deepEqual(calls, [
      {
        command: 'kubectl',
        args: [
          '--context',
          'minikube',
          'rollout',
          'pause',
          'deployment/web',
          '-n',
          'default',
        ],
        options: {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      },
      {
        command: 'kubectl',
        args: [
          '--context',
          'test-context',
          'rollout',
          'resume',
          'deployment/web',
          '-n',
          'default',
        ],
        options: {
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      },
    ])
    assert.equal(stdout.join(''), 'pause running: deployments/web\npaused deployment.apps/web\nresume running: deployments/web\nresumed deployment.apps/web\n')
    assert.equal(stderr.join(''), 'pause warning\nresume warning\n')
    await assert.rejects(() => cli.runRolloutPauseResume(kubeConfig, noNamespace, spawnImpl), /pause requires --namespace/)
    await assert.rejects(() => cli.runRolloutPauseResume(kubeConfig, unsupported, spawnImpl), /pause is not supported/)
  })

  it('suspends and resumes jobs and cronjobs with strategic merge patch', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      batch: {
        patchNamespacedJob: async (...args) => {
          calls.push(['job', args])
          return {}
        },
        patchNamespacedCronJob: async (...args) => {
          calls.push(['cronjob', args])
          return {}
        },
      },
    })

    const suspendTable = await cli.loadTable(kubeConfig, cli.parseArgs(['suspend', '-r', 'job', '-n', 'default', '--name', 'backup-1', '--confirm']))
    const resumeTable = await cli.loadTable(kubeConfig, cli.parseArgs(['resume', '-r', 'cj', '-n', 'default', '--name', 'backup', '--confirm']))
    const headerValues = []
    await calls[0][1][1].middleware[0].pre({
      setHeaderParam: (name, value) => headerValues.push([name, value]),
    })

    assert.deepEqual(suspendTable.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'SUSPEND', 'STATUS', 'MESSAGE'])
    assert.deepEqual(suspendTable.rows[0].slice(0, 6), ['suspend', 'jobs', 'default', 'backup-1', 'true', 'OK'])
    assert.deepEqual(resumeTable.rows[0].slice(0, 6), ['resume', 'cronjobs', 'default', 'backup', 'false', 'OK'])
    assert.equal(calls[0][0], 'job')
    assert.deepEqual(calls[0][1][0].body, { spec: { suspend: true } })
    assert.equal(calls[1][0], 'cronjob')
    assert.deepEqual(calls[1][1][0].body, { spec: { suspend: false } })
    assert.deepEqual(headerValues, [['Content-Type', PatchStrategy.StrategicMergePatch]])
  })

  it('triggers cronjobs by creating jobs from their templates', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const cronJob = {
      metadata: {
        name: 'backup',
        namespace: 'default',
      },
      spec: {
        jobTemplate: {
          metadata: {
            labels: { app: 'backup' },
          },
          spec: {
            template: {
              spec: {
                restartPolicy: 'Never',
                containers: [{ name: 'backup', image: 'busybox' }],
              },
            },
          },
        },
      },
    }
    const kubeConfig = createMockKubeConfig({
      batch: {
        readNamespacedCronJob: async (...args) => {
          calls.push(['read', args])
          return cronJob
        },
        createNamespacedJob: async (...args) => {
          calls.push(['create', args])
          return {
            ...args[0].body,
            metadata: {
              ...args[0].body.metadata,
              name: 'backup-manual-abcde',
            },
          }
        },
      },
    })

    const table = await cli.loadTable(kubeConfig, cli.parseArgs(['trigger', '-r', 'cj', '-n', 'default', '--name', 'backup', '--confirm']))

    assert.deepEqual(table.headers, ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'JOB', 'STATUS', 'MESSAGE'])
    assert.deepEqual(table.rows[0], ['trigger', 'cronjobs', 'default', 'backup', 'backup-manual-abcde', 'OK', 'job created'])
    assert.deepEqual(calls[0], ['read', [{ namespace: 'default', name: 'backup' }]])
    assert.deepEqual(calls[1], ['create', [{
      namespace: 'default',
      body: {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          generateName: 'backup-manual-',
          namespace: 'default',
          labels: { app: 'backup' },
          annotations: undefined,
        },
        spec: cronJob.spec.jobTemplate.spec,
      },
    }]])
  })

  it('cordons and uncordons nodes only with explicit confirmation', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        patchNode: async (request, options) => {
          calls.push([request, options])
          return {}
        },
      },
    })

    const cordonOptions = cli.parseArgs(['cordon', '-r', 'node', '--name', 'worker-1', '--confirm'])
    const cordonTable = await cli.loadTable(kubeConfig, cordonOptions)
    const cordonOutput = cli.formatFrame(kubeConfig, cordonOptions, cordonTable)
    const uncordonOptions = cli.parseArgs(['uncordon', '-r', 'node', '--name', 'worker-1', '--confirm'])
    const uncordonTable = await cli.loadTable(kubeConfig, uncordonOptions)
    const context = {
      headers: {},
      setHeaderParam(name, value) {
        this.headers[name] = value
      },
    }

    await calls[0][1].middleware[0].pre(context)

    assert.deepEqual(calls[0][0], {
      name: 'worker-1',
      body: {
        spec: {
          unschedulable: true,
        },
      },
    })
    assert.deepEqual(calls[1][0], {
      name: 'worker-1',
      body: {
        spec: {
          unschedulable: false,
        },
      },
    })
    assert.equal(context.headers['Content-Type'], 'application/merge-patch+json')
    assert.deepEqual(cordonTable.headers, ['ACTION', 'RESOURCE', 'NAME', 'SCHEDULING', 'STATUS', 'MESSAGE'])
    assert.deepEqual(cordonTable.rows, [['cordon', 'nodes', 'worker-1', 'SchedulingDisabled', 'OK', 'node cordoned']])
    assert.deepEqual(uncordonTable.rows, [['uncordon', 'nodes', 'worker-1', 'SchedulingEnabled', 'OK', 'node uncordoned']])
    assert.match(cordonOutput, /action=cordon resource=nodes namespace=all/)
  })

  it('requires supported node resources for cordon and uncordon', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const unsupportedCordon = cli.parseArgs(['cordon', '-r', 'po', '--name', 'web', '--confirm'])
    const unsupportedUncordon = cli.parseArgs(['uncordon', '-r', 'deploy', '--name', 'web', '--confirm'])

    await assert.rejects(() => cli.loadTable(kubeConfig, unsupportedCordon), /cordon is not supported/)
    await assert.rejects(() => cli.loadTable(kubeConfig, unsupportedUncordon), /uncordon is not supported/)
  })

  it('runs node drain through kubectl and forwards process output', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('node/worker-1 cordoned\n'))
        child.stderr.emit('data', 'evicting pod/default/web\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['drain', '--context', 'minikube', '-r', 'node', '--name', 'worker-1', '--confirm'])
    const exitCode = await cli.runNodeDrain(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'drain',
        'worker-1',
        '--ignore-daemonsets',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'drain running: node/worker-1\nnode/worker-1 cordoned\n')
    assert.equal(stderr.join(''), 'evicting pod/default/web\n')
  })

  it('returns non-zero drain exits and requires node resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 2)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['drain', '-r', 'node', '--name', 'worker-1', '--confirm'])
    const unsupported = cli.parseArgs(['drain', '-r', 'po', '--name', 'web', '--confirm'])
    const exitCode = await cli.runNodeDrain(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 2)
    assert.deepEqual(calls[0].args, [
      '--context',
      'test-context',
      'drain',
      'worker-1',
      '--ignore-daemonsets',
    ])
    await assert.rejects(() => cli.runNodeDrain(kubeConfig, unsupported, spawnImpl), /drain is not supported/)
  })

  it('opens a node debug shell through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['debug-node', '--context', 'minikube', '-r', 'node', '--name', 'worker-1', '--image', 'ubuntu:24.04'])
    const exitCode = await cli.runNodeDebugShell(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'debug',
        'node/worker-1',
        '-it',
        '--image=ubuntu:24.04',
        '--',
        'chroot',
        '/host',
        'sh',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('defaults node debug shells to busybox and requires node resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 2)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['node-shell', '-r', 'node', '--name', 'worker-1'])
    const unsupported = cli.parseArgs(['debug-node', '-r', 'po', '--name', 'web'])
    const exitCode = await cli.runNodeDebugShell(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 2)
    assert.deepEqual(calls[0].args, [
      '--context',
      'test-context',
      'debug',
      'node/worker-1',
      '-it',
      '--image=busybox',
      '--',
      'chroot',
      '/host',
      'sh',
    ])
    await assert.rejects(() => cli.runNodeDebugShell(kubeConfig, unsupported, spawnImpl), /debug-node is not supported/)
  })

  it('prints namespaced built-in resources as YAML', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      apps: {
        readNamespacedDeployment: async (request) => {
          calls.push(request)
          return {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              namespace: request.namespace,
              name: request.name,
            },
            spec: {
              replicas: 2,
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['yaml', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const yaml = await cli.loadYamlDocument(kubeConfig, options)

    assert.deepEqual(calls, [{ namespace: 'default', name: 'web' }])
    assert.match(yaml, /^apiVersion: apps\/v1/m)
    assert.match(yaml, /^kind: Deployment/m)
    assert.match(yaml, /name: web/)
    assert.match(yaml, /replicas: 2/)
  })

  it('prints cluster-scoped resources as YAML without namespace', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        readNamespace: async (request) => {
          calls.push(request)
          return {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: { name: request.name },
          }
        },
      },
    })

    const options = cli.parseArgs(['yaml', '-r', 'ns', '--name', 'default'])
    const yaml = await cli.loadYamlDocument(kubeConfig, options)

    assert.deepEqual(calls, [{ name: 'default' }])
    assert.match(yaml, /^kind: Namespace/m)
    assert.match(yaml, /name: default/)
  })

  it('prints static custom resources as YAML and requires namespace when needed', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      customObjects: {
        getNamespacedCustomObject: async (request) => {
          calls.push(request)
          return {
            apiVersion: `${request.group}/${request.version}`,
            kind: 'HTTPRoute',
            metadata: {
              namespace: request.namespace,
              name: request.name,
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['yaml', '-r', 'htr', '-n', 'default', '--name', 'web-route'])
    const yaml = await cli.loadYamlDocument(kubeConfig, options)
    const noNamespace = cli.parseArgs(['yaml', '-r', 'htr', '--name', 'web-route'])

    assert.deepEqual(calls, [{
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'httproutes',
      name: 'web-route',
    }])
    assert.match(yaml, /^kind: HTTPRoute/m)
    assert.match(yaml, /name: web-route/)
    await assert.rejects(() => cli.loadYamlDocument(kubeConfig, noNamespace), /yaml requires --namespace/)
  })

  it('describes namespaced built-in resources with conditions and related events', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      apps: {
        readNamespacedDeployment: async (request) => {
          calls.push(['read', request])
          return {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              namespace: request.namespace,
              name: request.name,
              uid: 'deploy-uid',
              resourceVersion: '42',
              creationTimestamp: '2026-05-13T00:00:00Z',
              labels: {
                app: 'web',
              },
              annotations: {
                team: 'platform',
              },
              ownerReferences: [{
                kind: 'ReplicaSet',
                name: 'web-7d9',
                controller: true,
              }],
            },
            spec: {
              replicas: 2,
            },
            status: {
              availableReplicas: 1,
              conditions: [{
                type: 'Available',
                status: 'True',
                reason: 'MinimumReplicasAvailable',
                message: 'Deployment has minimum availability.',
              }],
            },
          }
        },
      },
      events: {
        listNamespacedEvent: async (request) => {
          calls.push(['events', request])
          return {
            items: [{
              metadata: {
                namespace: request.namespace,
                name: 'web.1',
                creationTimestamp: '2026-05-13T00:01:00Z',
              },
              regarding: {
                kind: 'Deployment',
                namespace: request.namespace,
                name: 'web',
                uid: 'deploy-uid',
              },
              reportingController: 'deployment-controller',
              reason: 'ScalingReplicaSet',
              note: 'Scaled up replica set web-7d9.',
              type: 'Normal',
            }, {
              metadata: {
                namespace: request.namespace,
                name: 'api.1',
              },
              regarding: {
                kind: 'Deployment',
                namespace: request.namespace,
                name: 'api',
              },
              reason: 'Unrelated',
              note: 'This event belongs to another object.',
            }],
          }
        },
      },
    })

    const options = cli.parseArgs(['describe', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const description = await cli.loadDescribeDocument(kubeConfig, options)

    assert.deepEqual(calls[0], ['read', { namespace: 'default', name: 'web' }])
    assert.deepEqual(calls[1], ['events', { namespace: 'default' }])
    assert.match(description, /^Name: web/m)
    assert.match(description, /^Namespace: default/m)
    assert.match(description, /^Kind: Deployment/m)
    assert.match(description, /Labels:\n  app: web/)
    assert.match(description, /Annotations:\n  team: platform/)
    assert.match(description, /Spec:\n  replicas: 2/)
    assert.match(description, /Status:\n  availableReplicas: 1/)
    assert.match(description, /Available/)
    assert.match(description, /ScalingReplicaSet/)
    assert.match(description, /deployment-controller/)
    assert.doesNotMatch(description, /another object/)
  })

  it('describes cluster-scoped resources without namespace', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        readNamespace: async (request) => {
          calls.push(request)
          return {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
              name: request.name,
              uid: 'namespace-uid',
            },
            status: {
              phase: 'Active',
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['describe', '-r', 'ns', '--name', 'default'])
    const description = await cli.loadDescribeDocument(kubeConfig, options)

    assert.deepEqual(calls, [{ name: 'default' }])
    assert.match(description, /^Name: default/m)
    assert.match(description, /^Namespace: -/m)
    assert.match(description, /^Kind: Namespace/m)
    assert.match(description, /Status:\n  phase: Active/)
  })

  it('describes static custom resources and requires namespace when needed', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      customObjects: {
        getNamespacedCustomObject: async (request) => {
          calls.push(request)
          return {
            apiVersion: `${request.group}/${request.version}`,
            kind: 'HTTPRoute',
            metadata: {
              namespace: request.namespace,
              name: request.name,
            },
            spec: {
              hostnames: ['example.com'],
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['describe', '-r', 'htr', '-n', 'default', '--name', 'web-route'])
    const description = await cli.loadDescribeDocument(kubeConfig, options)
    const noNamespace = cli.parseArgs(['describe', '-r', 'htr', '--name', 'web-route'])

    assert.deepEqual(calls[0], {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      namespace: 'default',
      plural: 'httproutes',
      name: 'web-route',
    })
    assert.match(description, /^Kind: HTTPRoute/m)
    assert.match(description, /hostnames:/)
    assert.match(description, /example.com/)
    await assert.rejects(() => cli.loadDescribeDocument(kubeConfig, noNamespace), /describe requires --namespace/)
  })

  it('lists, reads, describes, and deletes CustomResource instances selected by CRD', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const widget = {
      apiVersion: 'example.com/v1',
      kind: 'Widget',
      metadata: {
        namespace: 'default',
        name: 'widget-1',
        uid: 'widget-uid',
        creationTimestamp: new Date().toISOString(),
      },
      spec: {
        size: 'small',
      },
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
      },
    }
    const kubeConfig = createMockKubeConfig({
      apiextensions: {
        readCustomResourceDefinition: async (request) => {
          calls.push(['crd', request])
          return {
            metadata: { name: request.name },
            spec: {
              group: 'example.com',
              names: {
                kind: 'Widget',
                plural: 'widgets',
              },
              scope: 'Namespaced',
              versions: [
                { name: 'v1beta1', served: false, storage: false },
                { name: 'v1', served: true, storage: true },
              ],
            },
          }
        },
      },
      customObjects: {
        listNamespacedCustomObject: async (request) => {
          calls.push(['list', request])
          return { items: [widget] }
        },
        getNamespacedCustomObject: async (request) => {
          calls.push(['get', request])
          return widget
        },
        deleteNamespacedCustomObject: async (request) => {
          calls.push(['delete', request])
          return {}
        },
      },
    })

    const table = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default']))
    const yaml = await cli.loadYamlDocument(kubeConfig, cli.parseArgs(['yaml', '-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default', '--name', 'widget-1']))
    const description = await cli.loadDescribeDocument(kubeConfig, cli.parseArgs(['describe', '-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default', '--name', 'widget-1']))
    const deleteTable = await cli.deleteResourceRows(kubeConfig, cli.parseArgs(['delete', '-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default', '--name', 'widget-1', '--confirm']))
    const noNamespace = cli.parseArgs(['yaml', '-r', 'crx', '--crd', 'widgets.example.com', '--name', 'widget-1'])

    assert.deepEqual(table.headers, ['NAMESPACE', 'NAME', 'KIND', 'APIVERSION', 'STATUS', 'AGE'])
    assert.deepEqual(table.rows[0].slice(0, 5), ['default', 'widget-1', 'Widget', 'example.com/v1', 'Ready'])
    assert.match(yaml, /^kind: Widget/m)
    assert.match(yaml, /name: widget-1/)
    assert.match(description, /^Resource: customresources/m)
    assert.match(description, /size: small/)
    assert.deepEqual(deleteTable.rows, [['delete', 'customresources', 'default', 'widget-1', 'OK', 'delete requested']])
    assert.deepEqual(calls[0], ['crd', { name: 'widgets.example.com' }])
    assert.deepEqual(calls[1], ['list', {
      group: 'example.com',
      version: 'v1',
      namespace: 'default',
      plural: 'widgets',
    }])
    assert.deepEqual(calls.find(([type]) => type === 'delete'), ['delete', {
      group: 'example.com',
      version: 'v1',
      namespace: 'default',
      plural: 'widgets',
      name: 'widget-1',
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
      },
    }])
    await assert.rejects(() => cli.loadYamlDocument(kubeConfig, noNamespace), /yaml requires --namespace/)
  })

  it('handles cluster-scoped CustomResource instances selected by CRD', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const clusterWidget = {
      apiVersion: 'example.com/v1',
      kind: 'ClusterWidget',
      metadata: {
        name: 'global-widget',
        creationTimestamp: new Date().toISOString(),
      },
      status: {
        phase: 'Active',
      },
    }
    const kubeConfig = createMockKubeConfig({
      apiextensions: {
        readCustomResourceDefinition: async (request) => {
          calls.push(['crd', request])
          return {
            metadata: { name: request.name },
            spec: {
              group: 'example.com',
              names: {
                kind: 'ClusterWidget',
                plural: 'clusterwidgets',
              },
              scope: 'Cluster',
              versions: [{ name: 'v1', served: true, storage: true }],
            },
          }
        },
      },
      customObjects: {
        listClusterCustomObject: async (request) => {
          calls.push(['list', request])
          return { items: [clusterWidget] }
        },
        getClusterCustomObject: async (request) => {
          calls.push(['get', request])
          return clusterWidget
        },
        deleteClusterCustomObject: async (request) => {
          calls.push(['delete', request])
          return {}
        },
      },
    })

    const table = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'crx', '--crd', 'clusterwidgets.example.com']))
    const yaml = await cli.loadYamlDocument(kubeConfig, cli.parseArgs(['yaml', '-r', 'crx', '--crd', 'clusterwidgets.example.com', '--name', 'global-widget']))
    const deleteTable = await cli.deleteResourceRows(kubeConfig, cli.parseArgs(['delete', '-r', 'crx', '--crd', 'clusterwidgets.example.com', '--name', 'global-widget', '--confirm']))

    assert.deepEqual(table.rows[0].slice(0, 5), ['-', 'global-widget', 'ClusterWidget', 'example.com/v1', 'Active'])
    assert.match(yaml, /^kind: ClusterWidget/m)
    assert.deepEqual(deleteTable.rows, [['delete', 'customresources', '-', 'global-widget', 'OK', 'delete requested']])
    assert.deepEqual(calls.find(([type]) => type === 'delete'), ['delete', {
      group: 'example.com',
      version: 'v1',
      plural: 'clusterwidgets',
      name: 'global-widget',
      body: {
        apiVersion: 'v1',
        kind: 'DeleteOptions',
      },
    }])
  })

  it('prints pod logs with optional container, tail lines, previous instance selection, and timestamps', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      core: {
        readNamespacedPodLog: async (request) => {
          calls.push(request)
          return 'line one\nline two'
        },
      },
    })

    const options = cli.parseArgs(['logs', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '200', '--previous', '--timestamps'])
    const logs = await cli.loadPodLogs(kubeConfig, options)

    assert.deepEqual(calls, [{
      name: 'web',
      namespace: 'default',
      container: 'app',
      tailLines: 200,
      previous: true,
      timestamps: true,
    }])
    assert.equal(logs, 'line one\nline two\n')
  })

  it('streams pod logs through kubectl when follow is enabled', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('line one\n'))
        child.stderr.emit('data', 'waiting for pod\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['logs', '--context', 'minikube', '-n', 'default', '--name', 'web', '--container', 'app', '--tail', '50', '--timestamps', '--follow'])
    const exitCode = await cli.runPodLogsFollow(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'logs',
        'pod/web',
        '-n',
        'default',
        '--tail',
        '50',
        '-c',
        'app',
        '--timestamps',
        '--follow',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'logs following: default/web\nline one\n')
    assert.equal(stderr.join(''), 'waiting for pod\n')
  })

  it('requires namespace and pod resources for logs', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['logs', '--name', 'web'])
    const unsupported = cli.parseArgs(['logs', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const previousFollow = { ...cli.parseArgs(['logs', '-n', 'default', '--name', 'web']), previous: true }
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }

    await assert.rejects(() => cli.loadPodLogs(kubeConfig, noNamespace), /logs requires --namespace/)
    await assert.rejects(() => cli.loadPodLogs(kubeConfig, unsupported), /logs is not supported/)
    await assert.rejects(() => cli.runPodLogsFollow(kubeConfig, noNamespace, spawnImpl), /logs requires --namespace/)
    await assert.rejects(() => cli.runPodLogsFollow(kubeConfig, unsupported, spawnImpl), /logs is not supported/)
    await assert.rejects(() => cli.runPodLogsFollow(kubeConfig, previousFollow, spawnImpl), /previous/)
  })

  it('executes a non-interactive pod command and captures stdout and stderr', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      exec: {
        exec: async (namespace, podName, containerName, command, stdout, stderr, stdin, tty, statusCallback) => {
          calls.push({ namespace, podName, containerName, command, stdin, tty })
          stdout.write('hello from pod\n')
          stderr.write('warning\n')
          statusCallback({ status: 'Success' })
          return {}
        },
      },
    })

    const options = cli.parseArgs(['exec', '-n', 'default', '--name', 'web', '--container', 'app', '--command', 'echo hello'])
    const result = await cli.loadPodExecResult(kubeConfig, options)

    assert.deepEqual(calls, [{
      namespace: 'default',
      podName: 'web',
      containerName: 'app',
      command: ['/bin/sh', '-lc', 'echo hello'],
      stdin: null,
      tty: false,
    }])
    assert.equal(result.stdout, 'hello from pod\n')
    assert.equal(result.stderr, 'warning\n')
    assert.equal(result.exitCode, 0)
  })

  it('returns the pod exec exit code from Kubernetes status details', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      exec: {
        exec: async (_namespace, _podName, _containerName, _command, stdout, stderr, _stdin, _tty, statusCallback) => {
          stdout.write('partial output\n')
          stderr.write('failed\n')
          statusCallback({
            status: 'Failure',
            details: {
              causes: [{
                reason: 'ExitCode',
                message: '7',
              }],
            },
          })
          return {}
        },
      },
    })

    const options = cli.parseArgs(['exec', '-n', 'default', '--name', 'web', '--command', 'false'])
    const result = await cli.loadPodExecResult(kubeConfig, options)

    assert.equal(result.stdout, 'partial output\n')
    assert.equal(result.stderr, 'failed\n')
    assert.equal(result.exitCode, 7)
  })

  it('requires namespace and pod resources for exec', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['exec', '--name', 'web', '--command', 'date'])
    const unsupported = cli.parseArgs(['exec', '-r', 'deploy', '-n', 'default', '--name', 'web', '--command', 'date'])

    await assert.rejects(() => cli.loadPodExecResult(kubeConfig, noNamespace), /exec requires --namespace/)
    await assert.rejects(() => cli.loadPodExecResult(kubeConfig, unsupported), /exec is not supported/)
  })

  it('runs an interactive pod shell through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['shell', '--context', 'minikube', '-n', 'default', '--name', 'web', '--container', 'app', '--command', '/bin/bash'])
    const exitCode = await cli.runPodShell(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'exec',
        '-it',
        'pod/web',
        '-n',
        'default',
        '-c',
        'app',
        '--',
        '/bin/bash',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('defaults pod shell to /bin/sh and supports command args after --', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const defaultOptions = cli.parseArgs(['shell', '-n', 'default', '--name', 'web'])
    const argOptions = cli.parseArgs(['shell', '-n', 'default', '--name', 'web', '--', '/bin/bash', '-l'])
    await cli.runPodShell(kubeConfig, defaultOptions, spawnImpl)
    await cli.runPodShell(kubeConfig, argOptions, spawnImpl)

    assert.deepEqual(calls[0].args.slice(-2), ['--', '/bin/sh'])
    assert.deepEqual(calls[1].args.slice(-3), ['--', '/bin/bash', '-l'])
  })

  it('requires namespace and pod resources for shell', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['shell', '--name', 'web'])
    const unsupported = cli.parseArgs(['shell', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }

    await assert.rejects(() => cli.runPodShell(kubeConfig, noNamespace, spawnImpl), /shell requires --namespace/)
    await assert.rejects(() => cli.runPodShell(kubeConfig, unsupported, spawnImpl), /shell is not supported/)
  })

  it('attaches to a running pod container through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['attach', '--context', 'minikube', '-n', 'default', '--name', 'web', '--container', 'app'])
    const exitCode = await cli.runPodAttach(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'attach',
        '-it',
        'pod/web',
        '-n',
        'default',
        '-c',
        'app',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('requires namespace and pod resources for attach', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['attach', '--name', 'web'])
    const unsupported = cli.parseArgs(['attach', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }

    await assert.rejects(() => cli.runPodAttach(kubeConfig, noNamespace, spawnImpl), /attach requires --namespace/)
    await assert.rejects(() => cli.runPodAttach(kubeConfig, unsupported, spawnImpl), /attach is not supported/)
  })

  it('edits namespaced resources through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['edit', '--context', 'minikube', '-r', 'deploy', '-n', 'default', '--name', 'web'])
    const exitCode = await cli.runResourceEdit(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'edit',
        'deployments/web',
        '-n',
        'default',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('edits cluster-scoped resources through kubectl without namespace', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['edit', '--context', 'minikube', '-r', 'ns', '--name', 'default'])
    const exitCode = await cli.runResourceEdit(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'edit',
        'namespaces/default',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('edits CustomResource instances through kubectl using the CRD resource name', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['edit', '--context', 'minikube', '-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default', '--name', 'widget-1'])
    const exitCode = await cli.runResourceEdit(kubeConfig, options, spawnImpl)

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'edit',
        'widgets.example.com/widget-1',
        '-n',
        'default',
      ],
      options: {
        stdio: 'inherit',
      },
    }])
  })

  it('requires namespace and real resources for edit', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['edit', '-r', 'deploy', '--name', 'web'])
    const unsupported = cli.parseArgs(['edit', '-r', 'co', '-n', 'default', '--name', 'web/app'])
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }

    await assert.rejects(() => cli.runResourceEdit(kubeConfig, noNamespace, spawnImpl), /edit requires --namespace/)
    await assert.rejects(() => cli.runResourceEdit(kubeConfig, unsupported, spawnImpl), /edit is not supported/)
  })

  it('runs resource label updates through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('deployment.apps/web labeled\n'))
        child.stderr.emit('data', 'warning\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['label', '--context', 'minikube', '-r', 'deploy', '-n', 'default', '--name', 'web', '--key', 'team', '--value', 'platform', '--overwrite', '--confirm'])
    const exitCode = await cli.runMetadataMutation(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'label',
        'deployments/web',
        'team=platform',
        '-n',
        'default',
        '--overwrite',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'label running: deployments/web\ndeployment.apps/web labeled\n')
    assert.equal(stderr.join(''), 'warning\n')
  })

  it('runs resource annotation removals through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['annotate', '--context', 'minikube', '-r', 'ns', '--name', 'default', '--key', 'note', '--remove', '--confirm'])
    const exitCode = await cli.runMetadataMutation(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'annotate',
        'namespaces/default',
        'note-',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
  })

  it('runs CustomResource label updates through kubectl using the CRD resource name', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['label', '--context', 'minikube', '-r', 'crx', '--crd', 'widgets.example.com', '-n', 'default', '--name', 'widget-1', '--key', 'team', '--value', 'platform', '--overwrite', '--confirm'])
    const exitCode = await cli.runMetadataMutation(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'label',
        'widgets.example.com/widget-1',
        'team=platform',
        '-n',
        'default',
        '--overwrite',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
  })

  it('requires namespace and real resources for metadata mutations', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const noNamespace = cli.parseArgs(['label', '-r', 'deploy', '--name', 'web', '--key', 'team', '--value', 'platform', '--confirm'])
    const unsupported = cli.parseArgs(['annotate', '-r', 'co', '-n', 'default', '--name', 'web/app', '--key', 'note', '--value', 'ready', '--confirm'])
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }

    await assert.rejects(() => cli.runMetadataMutation(kubeConfig, noNamespace, spawnImpl), /label requires --namespace/)
    await assert.rejects(() => cli.runMetadataMutation(kubeConfig, unsupported, spawnImpl), /annotate is not supported/)
  })

  it('sets the current kubeconfig context through kubectl config', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('Switched to context "minikube".\n'))
        child.stderr.emit('data', 'notice\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['use-context', '--name', 'minikube', '--confirm'])
    const exitCode = await cli.runConfigUseContext(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        'config',
        'use-context',
        'minikube',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'use-context running: minikube\nSwitched to context "minikube".\n')
    assert.equal(stderr.join(''), 'notice\n')
  })

  it('sets the current context namespace through kubectl config', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['use-namespace', '-n', 'default', '--confirm'])
    const exitCode = await cli.runConfigUseNamespace(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        'config',
        'set-context',
        '--current',
        '--namespace',
        'default',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
  })

  it('runs pod port-forward through kubectl and forwards process output', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const stdout = []
    const stderr = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('Forwarding from 127.0.0.1:18080 -> 8080\n'))
        child.stderr.emit('data', 'handling connection\n')
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['port-forward', '--context', 'minikube', '-n', 'default', '--name', 'web', '--target-port', '8080', '--local-port', '18080'])
    const exitCode = await cli.runPodPortForward(kubeConfig, options, spawnImpl, {
      stdout: { write: (chunk) => stdout.push(String(chunk)) },
      stderr: { write: (chunk) => stderr.push(String(chunk)) },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'port-forward',
        'pod/web',
        '18080:8080',
        '-n',
        'default',
        '--address',
        '127.0.0.1',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
    assert.equal(stdout.join(''), 'port-forward running: 127.0.0.1:18080 -> default/pod/web:8080\nForwarding from 127.0.0.1:18080 -> 8080\n')
    assert.equal(stderr.join(''), 'handling connection\n')
  })

  it('runs service port-forward through kubectl', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 0)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['port-forward', '--context', 'minikube', '-r', 'svc', '-n', 'default', '--name', 'web', '--target-port', '80', '--local-port', '18080'])
    const exitCode = await cli.runPodPortForward(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 0)
    assert.deepEqual(calls, [{
      command: 'kubectl',
      args: [
        '--context',
        'minikube',
        'port-forward',
        'service/web',
        '18080:80',
        '-n',
        'default',
        '--address',
        '127.0.0.1',
      ],
      options: {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    }])
  })

  it('defaults local port to target port and returns non-zero port-forward exits', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const child = new EventEmitter()
    child.stdout = new EventEmitter()
    child.stderr = new EventEmitter()
    const spawnImpl = (command, args, options) => {
      calls.push({ command, args, options })
      setImmediate(() => {
        child.emit('close', 3)
      })
      return child
    }
    const kubeConfig = createMockKubeConfig()

    const options = cli.parseArgs(['port-forward', '-n', 'default', '--name', 'web', '--target-port', '8080'])
    const exitCode = await cli.runPodPortForward(kubeConfig, options, spawnImpl, {
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
    })

    assert.equal(exitCode, 3)
    assert.deepEqual(calls[0].args, [
      '--context',
      'test-context',
      'port-forward',
      'pod/web',
      '8080:8080',
      '-n',
      'default',
      '--address',
      '127.0.0.1',
    ])
  })

  it('requires namespace and supported resources for port-forward', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    const spawnImpl = () => {
      throw new Error('spawn should not be called')
    }
    const noNamespace = cli.parseArgs(['port-forward', '--name', 'web', '--target-port', '8080'])
    const unsupported = cli.parseArgs(['port-forward', '-r', 'node', '-n', 'default', '--name', 'worker-1', '--target-port', '8080'])

    await assert.rejects(() => cli.runPodPortForward(kubeConfig, noNamespace, spawnImpl), /port-forward requires --namespace/)
    await assert.rejects(() => cli.runPodPortForward(kubeConfig, unsupported, spawnImpl), /port-forward is not supported/)
  })

  it('renders pod CPU and memory usage when metrics are available', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listPodForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            status: {
              phase: 'Running',
              containerStatuses: [
                { ready: true, restartCount: 1 },
                { ready: true, restartCount: 2 },
              ],
            },
          }],
        }),
      },
      customObjects: {
        listClusterCustomObject: async () => ({
          items: [{
            metadata: { namespace: 'default', name: 'web-1' },
            containers: [
              { usage: { cpu: '100m', memory: '32Mi' } },
              { usage: { cpu: '25m', memory: '32Mi' } },
            ],
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'pods'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'NAME', 'STATUS', 'READY', 'RESTARTS', 'CPU', 'MEMORY', 'AGE'])
    assert.match(output, /web-1/)
    assert.match(output, /125m/)
    assert.match(output, /64Mi/)
  })

  it('renders containers expanded from pod specs and statuses', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              initContainers: [{ name: 'migrate', image: 'busybox:1.36' }],
              containers: [
                { name: 'app', image: 'nginx:1.27', env: [{ name: 'PASSWORD', value: 'secret-value' }] },
                { name: 'sidecar', image: 'registry.example/sidecar:2.0' },
              ],
              ephemeralContainers: [{ name: 'debugger', image: 'busybox:1.36' }],
            },
            status: {
              initContainerStatuses: [{
                name: 'migrate',
                ready: true,
                restartCount: 0,
                state: { terminated: { reason: 'Completed', exitCode: 0 } },
              }],
              containerStatuses: [
                {
                  name: 'app',
                  ready: true,
                  restartCount: 1,
                  state: { running: { startedAt: new Date().toISOString() } },
                },
                {
                  name: 'sidecar',
                  ready: false,
                  restartCount: 3,
                  state: { waiting: { reason: 'CrashLoopBackOff' } },
                },
              ],
              ephemeralContainerStatuses: [{
                name: 'debugger',
                restartCount: 0,
                state: { waiting: { reason: 'ContainerCreating' } },
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'co', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'NAME', 'IMAGE', 'READY', 'RESTARTS', 'STATE', 'AGE'])
    assert.equal(table.rows.length, 4)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 5)), [
      ['default', 'web-1', 'container', 'app', 'nginx:1.27'],
      ['default', 'web-1', 'container', 'sidecar', 'registry.example/sidecar:2.0'],
      ['default', 'web-1', 'init', 'migrate', 'busybox:1.36'],
      ['default', 'web-1', 'ephemeral', 'debugger', 'busybox:1.36'],
    ])
    assert.match(output, /Running/)
    assert.match(output, /Waiting:CrashLoopBackOff/)
    assert.match(output, /Terminated:Completed/)
    assert.match(output, /Waiting:ContainerCreating/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders detailed container states from pod status without termination messages', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
            status: {
              initContainerStatuses: [{
                name: 'migrate',
                ready: true,
                started: false,
                restartCount: 0,
                imageID: 'docker-pullable://busybox@sha256:init',
                containerID: 'containerd://init-container-id',
                state: {
                  terminated: {
                    reason: 'Completed',
                    exitCode: 0,
                    startedAt: new Date().toISOString(),
                    finishedAt: new Date().toISOString(),
                    message: 'secret-value',
                  },
                },
              }],
              containerStatuses: [{
                name: 'app',
                ready: false,
                started: true,
                restartCount: 2,
                imageID: 'docker-pullable://nginx@sha256:app',
                containerID: 'containerd://app-container-id',
                state: {
                  waiting: {
                    reason: 'CrashLoopBackOff',
                    message: 'secret-value',
                  },
                },
                lastState: {
                  terminated: {
                    reason: 'Error',
                    exitCode: 1,
                    startedAt: new Date().toISOString(),
                    finishedAt: new Date().toISOString(),
                    message: 'secret-value',
                  },
                },
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'cstate', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'READY', 'STARTED', 'RESTARTS', 'STATE', 'REASON', 'EXIT', 'SIGNAL', 'STATE-STARTED', 'STATE-FINISHED', 'LAST-STATE', 'LAST-REASON', 'LAST-EXIT', 'LAST-FINISHED', 'IMAGE-ID', 'CONTAINER-ID', 'POD-AGE'])
    assert.deepEqual(table.rows.map((row) => row.slice(0, 11)), [
      ['default', 'web-1', 'container', 'app', 'false', 'true', 2, 'Waiting', 'CrashLoopBackOff', '-', '-'],
      ['default', 'web-1', 'init', 'migrate', 'true', 'false', 0, 'Terminated', 'Completed', 0, '-'],
    ])
    assert.deepEqual(table.rows[0].slice(13, 16), ['Terminated', 'Error', 1])
    assert.equal(table.rows[0][17], 'docker-pullable://nginx@sha256:app')
    assert.match(output, /containerd:\/\/app-container-id/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders container resource requests and limits from pod specs', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              initContainers: [{
                name: 'migrate',
                image: 'busybox:1.36',
                resources: {
                  requests: { cpu: '25m', memory: '64Mi' },
                  limits: { cpu: '50m', memory: '128Mi' },
                },
              }],
              containers: [
                {
                  name: 'app',
                  image: 'nginx:1.27',
                  env: [{ name: 'PASSWORD', value: 'secret-value' }],
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '128Mi',
                      'ephemeral-storage': '1Gi',
                      'nvidia.com/gpu': '1',
                    },
                    limits: {
                      cpu: '500m',
                      memory: '256Mi',
                      'ephemeral-storage': '2Gi',
                      'nvidia.com/gpu': '1',
                    },
                  },
                },
                {
                  name: 'sidecar',
                  image: 'registry.example/sidecar:2.0',
                },
              ],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                resources: {
                  limits: { 'hugepages-2Mi': '64Mi' },
                },
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'crs', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'IMAGE', 'CPU-REQ', 'CPU-LIMIT', 'MEM-REQ', 'MEM-LIMIT', 'EPH-REQ', 'EPH-LIMIT', 'EXTRA', 'AGE'])
    assert.equal(table.rows.length, 4)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 12)), [
      ['default', 'web-1', 'container', 'app', 'nginx:1.27', '100m', '500m', '128Mi', '256Mi', '1Gi', '2Gi', 'request:nvidia.com/gpu=1,limit:nvidia.com/gpu=1'],
      ['default', 'web-1', 'container', 'sidecar', 'registry.example/sidecar:2.0', '-', '-', '-', '-', '-', '-', '-'],
      ['default', 'web-1', 'init', 'migrate', 'busybox:1.36', '25m', '50m', '64Mi', '128Mi', '-', '-', '-'],
      ['default', 'web-1', 'ephemeral', 'debugger', 'busybox:1.36', '-', '-', '-', '-', '-', '-', 'limit:hugepages-2Mi=64Mi'],
    ])
    assert.match(output, /nvidia\.com\/gpu/)
    assert.match(output, /hugepages-2Mi/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders image summaries expanded from pod containers', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [
            {
              metadata: {
                namespace,
                name: 'web-1',
              },
              spec: {
                initContainers: [{ name: 'migrate', image: 'busybox:1.36' }],
                containers: [
                  { name: 'app', image: 'nginx:1.27', env: [{ name: 'PASSWORD', value: 'secret-value' }] },
                  { name: 'sidecar', image: 'registry.example/sidecar:2.0' },
                ],
              },
              status: {
                initContainerStatuses: [{
                  name: 'migrate',
                  ready: true,
                  restartCount: 0,
                  state: { terminated: { reason: 'Completed', exitCode: 0 } },
                }],
                containerStatuses: [
                  {
                    name: 'app',
                    ready: true,
                    restartCount: 1,
                    state: { running: {} },
                  },
                  {
                    name: 'sidecar',
                    ready: false,
                    restartCount: 4,
                    state: { waiting: { reason: 'ImagePullBackOff' } },
                  },
                ],
              },
            },
            {
              metadata: {
                namespace,
                name: 'web-2',
              },
              spec: {
                containers: [
                  { name: 'app', image: 'nginx:1.27' },
                  { name: 'debugger', image: 'busybox:1.36' },
                ],
              },
              status: {
                containerStatuses: [
                  {
                    name: 'app',
                    ready: false,
                    restartCount: 2,
                    state: { waiting: { reason: 'CrashLoopBackOff' } },
                  },
                  {
                    name: 'debugger',
                    ready: true,
                    restartCount: 0,
                    state: { running: {} },
                  },
                ],
              },
            },
          ],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'img', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'IMAGE', 'PODS', 'CONTAINERS', 'READY', 'RESTARTS', 'STATES'])
    assert.deepEqual(table.rows, [
      ['default', 'busybox:1.36', 2, 2, '2/2', 0, 'Terminated:Completed,Running'],
      ['default', 'nginx:1.27', 2, 2, '1/2', 3, 'Running,Waiting:CrashLoopBackOff'],
      ['default', 'registry.example/sidecar:2.0', 1, 1, '0/1', 4, 'Waiting:ImagePullBackOff'],
    ])
    assert.match(output, /ImagePullBackOff/)
    assert.match(output, /CrashLoopBackOff/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders probe summaries expanded from pod containers', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              initContainers: [{
                name: 'migrate',
                image: 'busybox:1.36',
                startupProbe: {
                  exec: { command: ['sh', '-c', 'test -f /tmp/done'] },
                  initialDelaySeconds: 2,
                  periodSeconds: 3,
                  timeoutSeconds: 4,
                  failureThreshold: 5,
                },
              }],
              containers: [
                {
                  name: 'app',
                  image: 'nginx:1.27',
                  livenessProbe: {
                    httpGet: { path: '/healthz', port: 8080, scheme: 'HTTP' },
                    initialDelaySeconds: 10,
                    periodSeconds: 5,
                    timeoutSeconds: 2,
                    failureThreshold: 4,
                  },
                  readinessProbe: {
                    tcpSocket: { port: 'http' },
                    periodSeconds: 6,
                  },
                },
                {
                  name: 'grpc',
                  image: 'registry.example/grpc:1.0',
                  readinessProbe: {
                    grpc: { port: 9090, service: 'ready' },
                  },
                },
                {
                  name: 'worker',
                  image: 'busybox:1.36',
                },
              ],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'prb', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'IMAGE', 'LIVENESS', 'READINESS', 'STARTUP', 'AGE'])
    assert.equal(table.rows.length, 4)
    assert.match(output, /HTTP \/healthz:8080 d=10s p=5s t=2s f=4/)
    assert.match(output, /TCP :http d=0s p=6s t=1s f=3/)
    assert.match(output, /gRPC :9090\/ready d=0s p=10s t=1s f=3/)
    assert.match(output, /exec sh -c test -f \/tmp\/done d=2s p=3s t=4s f=5/)
    assert.match(output, /worker/)
    assert.match(output, / - /)
  })

  it('renders container ports expanded from pod specs', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              initContainers: [{
                name: 'bootstrap',
                image: 'busybox:1.36',
                ports: [{ containerPort: 9000 }],
              }],
              containers: [
                {
                  name: 'app',
                  image: 'nginx:1.27',
                  ports: [
                    { name: 'http', containerPort: 8080, protocol: 'TCP', hostPort: 18080, hostIP: '127.0.0.1' },
                    { name: 'metrics', containerPort: 9090, protocol: 'UDP' },
                  ],
                },
                {
                  name: 'worker',
                  image: 'busybox:1.36',
                  env: [{ name: 'PASSWORD', value: 'secret-value' }],
                },
              ],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                ports: [{ name: 'debug', containerPort: 4000, protocol: 'TCP' }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'prt', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'NAME', 'PROTOCOL', 'PORT', 'HOST-PORT', 'HOST-IP', 'IMAGE', 'AGE'])
    assert.equal(table.rows.length, 4)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 10)), [
      ['default', 'web-1', 'container', 'app', 'http', 'TCP', 8080, 18080, '127.0.0.1', 'nginx:1.27'],
      ['default', 'web-1', 'container', 'app', 'metrics', 'UDP', 9090, '-', '-', 'nginx:1.27'],
      ['default', 'web-1', 'init', 'bootstrap', '-', 'TCP', 9000, '-', '-', 'busybox:1.36'],
      ['default', 'web-1', 'ephemeral', 'debugger', 'debug', 'TCP', 4000, '-', '-', 'busybox:1.36'],
    ])
    assert.match(output, /18080/)
    assert.match(output, /metrics/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod volumes without exposing secret values or CSI attributes', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              volumes: [
                { name: 'config', configMap: { name: 'web-config', optional: true, items: [{ key: 'app.conf', path: 'app.conf' }] } },
                { name: 'token', secret: { secretName: 'web-token', items: [{ key: 'token', path: 'token' }] } },
                { name: 'data', persistentVolumeClaim: { claimName: 'web-data', readOnly: true } },
                { name: 'cache', emptyDir: { medium: 'Memory', sizeLimit: '1Gi' } },
                { name: 'projected', projected: { sources: [{ serviceAccountToken: { path: 'token' } }, { configMap: { name: 'extra' } }, { secret: { name: 'projected-secret' } }] } },
                { name: 'host', hostPath: { path: '/var/log/web', type: 'Directory' } },
                { name: 'plugin', csi: { driver: 'example.csi', readOnly: true, fsType: 'ext4', volumeAttributes: { password: 'csi-secret' } } },
              ],
              initContainers: [{
                name: 'bootstrap',
                image: 'busybox:1.36',
                volumeMounts: [{ name: 'cache', mountPath: '/cache' }],
              }],
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
                volumeMounts: [
                  { name: 'config', mountPath: '/etc/web' },
                  { name: 'token', mountPath: '/var/run/token' },
                  { name: 'projected', mountPath: '/projected' },
                ],
                volumeDevices: [{ name: 'data', devicePath: '/dev/xvda' }],
              }],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                volumeMounts: [{ name: 'host', mountPath: '/host-logs' }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'vol', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'VOLUME', 'TYPE', 'SOURCE', 'OPTIONAL', 'DETAILS', 'USED-BY', 'AGE'])
    assert.equal(table.rows.length, 7)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 8)), [
      ['default', 'web-1', 'config', 'configMap', 'web-config', 'true', 'items=1', 'container/app:/etc/web'],
      ['default', 'web-1', 'token', 'secret', 'web-token', 'false', 'items=1', 'container/app:/var/run/token'],
      ['default', 'web-1', 'data', 'persistentVolumeClaim', 'web-data', '-', 'readOnly=true', 'container/app:/dev/xvda'],
      ['default', 'web-1', 'cache', 'emptyDir', 'Memory', '-', 'sizeLimit=1Gi', 'init/bootstrap:/cache'],
      ['default', 'web-1', 'projected', 'projected', '3 sources', '-', 'serviceAccountToken,configMap:extra,secret:projected-secret', 'container/app:/projected'],
      ['default', 'web-1', 'host', 'hostPath', '/var/log/web', '-', 'Directory', 'ephemeral/debugger:/host-logs'],
      ['default', 'web-1', 'plugin', 'csi', 'example.csi', '-', 'readOnly=true fsType=ext4', '-'],
    ])
    assert.match(output, /web-token/)
    assert.match(output, /projected-secret/)
    assert.doesNotMatch(output, /secret-value/)
    assert.doesNotMatch(output, /csi-secret/)
  })

  it('renders volume mounts expanded from pod specs without exposing secret values', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              volumes: [
                { name: 'config', configMap: { name: 'web-config' } },
                { name: 'token', secret: { secretName: 'web-token' } },
                { name: 'data', persistentVolumeClaim: { claimName: 'web-data' } },
                { name: 'cache', emptyDir: { medium: 'Memory' } },
                { name: 'host', hostPath: { path: '/var/log/web' } },
                { name: 'projected', projected: { sources: [{ serviceAccountToken: { path: 'token' } }, { configMap: { name: 'extra' } }] } },
              ],
              initContainers: [{
                name: 'bootstrap',
                image: 'busybox:1.36',
                volumeMounts: [{ name: 'cache', mountPath: '/cache' }],
              }],
              containers: [
                {
                  name: 'app',
                  image: 'nginx:1.27',
                  env: [{ name: 'PASSWORD', value: 'secret-value' }],
                  volumeMounts: [
                    { name: 'config', mountPath: '/etc/web', readOnly: true },
                    { name: 'token', mountPath: '/var/run/token', readOnly: true, subPath: 'token' },
                    { name: 'data', mountPath: '/data' },
                    { name: 'projected', mountPath: '/projected', subPathExpr: '$(POD_NAME)' },
                  ],
                },
              ],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                volumeMounts: [{ name: 'host', mountPath: '/host-logs', readOnly: true }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'mnt', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'VOLUME', 'MOUNT-PATH', 'READ-ONLY', 'SUB-PATH', 'VOLUME-TYPE', 'SOURCE', 'AGE'])
    assert.equal(table.rows.length, 6)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 10)), [
      ['default', 'web-1', 'container', 'app', 'config', '/etc/web', 'true', '-', 'configMap', 'web-config'],
      ['default', 'web-1', 'container', 'app', 'token', '/var/run/token', 'true', 'token', 'secret', 'web-token'],
      ['default', 'web-1', 'container', 'app', 'data', '/data', 'false', '-', 'persistentVolumeClaim', 'web-data'],
      ['default', 'web-1', 'container', 'app', 'projected', '/projected', 'false', '$(POD_NAME)', 'projected', '2 sources'],
      ['default', 'web-1', 'init', 'bootstrap', 'cache', '/cache', 'false', '-', 'emptyDir', 'Memory'],
      ['default', 'web-1', 'ephemeral', 'debugger', 'host', '/host-logs', 'true', '-', 'hostPath', '/var/log/web'],
    ])
    assert.match(output, /web-token/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders env vars expanded from pod specs without exposing literal values', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              initContainers: [{
                name: 'bootstrap',
                image: 'busybox:1.36',
                env: [{ name: 'INIT_MODE', value: 'also-secret' }],
              }],
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [
                  { name: 'PLAIN', value: 'secret-value' },
                  { name: 'POD_NAME', valueFrom: { fieldRef: { fieldPath: 'metadata.name' } } },
                  { name: 'LIMIT_CPU', valueFrom: { resourceFieldRef: { resource: 'limits.cpu', containerName: 'app' } } },
                  { name: 'CONFIG_VALUE', valueFrom: { configMapKeyRef: { name: 'web-config', key: 'setting', optional: true } } },
                  { name: 'SECRET_VALUE', valueFrom: { secretKeyRef: { name: 'web-secret', key: 'password' } } },
                ],
                envFrom: [
                  { prefix: 'APP_', configMapRef: { name: 'app-config', optional: true } },
                  { secretRef: { name: 'app-secret' } },
                ],
              }],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                env: [{ name: 'DEBUG_TOKEN', value: 'debug-secret' }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'env', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'NAME', 'SOURCE-TYPE', 'SOURCE', 'KEY/PREFIX', 'OPTIONAL', 'AGE'])
    assert.equal(table.rows.length, 9)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 9)), [
      ['default', 'web-1', 'container', 'app', 'PLAIN', 'literal', '<set>', '-', '-'],
      ['default', 'web-1', 'container', 'app', 'POD_NAME', 'fieldRef', 'metadata.name', '-', '-'],
      ['default', 'web-1', 'container', 'app', 'LIMIT_CPU', 'resourceFieldRef', 'limits.cpu', 'app', '-'],
      ['default', 'web-1', 'container', 'app', 'CONFIG_VALUE', 'configMapKeyRef', 'web-config', 'setting', 'true'],
      ['default', 'web-1', 'container', 'app', 'SECRET_VALUE', 'secretKeyRef', 'web-secret', 'password', 'false'],
      ['default', 'web-1', 'container', 'app', 'APP_*', 'envFrom:configMapRef', 'app-config', 'APP_', 'true'],
      ['default', 'web-1', 'container', 'app', '*', 'envFrom:secretRef', 'app-secret', '-', 'false'],
      ['default', 'web-1', 'init', 'bootstrap', 'INIT_MODE', 'literal', '<set>', '-', '-'],
      ['default', 'web-1', 'ephemeral', 'debugger', 'DEBUG_TOKEN', 'literal', '<set>', '-', '-'],
    ])
    assert.match(output, /web-secret/)
    assert.match(output, /app-secret/)
    assert.doesNotMatch(output, /secret-value/)
    assert.doesNotMatch(output, /also-secret/)
    assert.doesNotMatch(output, /debug-secret/)
  })

  it('renders pod conditions expanded from pod status', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
            status: {
              conditions: [
                {
                  type: 'PodScheduled',
                  status: 'True',
                  reason: 'SchedulerAssigned',
                  message: 'Successfully assigned default/web-1 to node-1',
                  lastTransitionTime: new Date().toISOString(),
                },
                {
                  type: 'Ready',
                  status: 'False',
                  reason: 'ContainersNotReady',
                  message: 'containers with unready status: [app]',
                  lastTransitionTime: new Date().toISOString(),
                },
              ],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'cond', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'STATUS', 'REASON', 'MESSAGE', 'LAST-TRANSITION', 'POD-AGE'])
    assert.equal(table.rows.length, 2)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 6)), [
      ['default', 'web-1', 'PodScheduled', 'True', 'SchedulerAssigned', 'Successfully assigned default/web-1 to node-1'],
      ['default', 'web-1', 'Ready', 'False', 'ContainersNotReady', 'containers with unready status: [app]'],
    ])
    assert.match(output, /ContainersNotReady/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod readiness gates from pod spec and matching conditions', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              readinessGates: [
                { conditionType: 'acme.io/cache-ready' },
                { conditionType: 'apps.example.com/ready' },
              ],
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
            status: {
              conditions: [
                {
                  type: 'apps.example.com/ready',
                  status: 'True',
                  reason: 'Warm',
                  message: 'cache warm',
                  lastTransitionTime: new Date().toISOString(),
                },
                {
                  type: 'Ready',
                  status: 'False',
                  reason: 'ContainersNotReady',
                  message: 'containers with unready status: [app]',
                },
              ],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'gate', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'CONDITION', 'STATUS', 'REASON', 'MESSAGE', 'LAST-TRANSITION', 'POD-AGE'])
    assert.deepEqual(table.rows.map((row) => row.slice(0, 6)), [
      ['default', 'web-1', 'acme.io/cache-ready', 'False', 'NotReported', '-'],
      ['default', 'web-1', 'apps.example.com/ready', 'True', 'Warm', 'cache warm'],
    ])
    assert.match(output, /acme\.io\/cache-ready/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod network and DNS settings', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              hostname: 'web-1',
              subdomain: 'web',
              setHostnameAsFQDN: true,
              dnsPolicy: 'None',
              dnsConfig: {
                nameservers: ['10.0.0.10', '10.0.0.11'],
                searches: ['svc.cluster.local', 'cluster.local'],
                options: [
                  { name: 'ndots', value: '5' },
                  { name: 'single-request-reopen' },
                ],
              },
              hostAliases: [
                { ip: '127.0.0.1', hostnames: ['local.test', 'web.local'] },
                { ip: '10.0.0.5', hostnames: ['api.local'] },
              ],
              hostNetwork: true,
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
            status: {
              podIPs: [
                { ip: '10.244.0.10' },
                { ip: 'fd00::1' },
              ],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'pnet', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'HOSTNAME', 'SUBDOMAIN', 'FQDN', 'DNS-POLICY', 'NAMESERVERS', 'SEARCHES', 'DNS-OPTIONS', 'HOST-ALIASES', 'HOST-NET', 'POD-IPS', 'AGE'])
    assert.deepEqual(table.rows.map((row) => row.slice(0, 12)), [
      [
        'default',
        'web-1',
        'web-1',
        'web',
        'true',
        'None',
        '10.0.0.10,10.0.0.11',
        'svc.cluster.local,cluster.local',
        'ndots=5,single-request-reopen',
        '127.0.0.1:local.test,127.0.0.1:web.local,10.0.0.5:api.local',
        'true',
        '10.244.0.10,fd00::1',
      ],
    ])
    assert.match(output, /single-request-reopen/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod placement and scheduling details', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
              ownerReferences: [{ kind: 'ReplicaSet', name: 'web-64c9', controller: true }],
            },
            spec: {
              nodeName: 'node-1',
              serviceAccountName: 'web',
              priorityClassName: 'high',
              priority: 1000,
              schedulerName: 'default-scheduler',
              restartPolicy: 'Always',
              hostNetwork: true,
              nodeSelector: { role: 'frontend', zone: 'a' },
              tolerations: [
                { key: 'dedicated', operator: 'Equal', value: 'web', effect: 'NoSchedule' },
                { key: 'maintenance', operator: 'Exists', effect: 'NoExecute', tolerationSeconds: 60 },
              ],
              affinity: {
                nodeAffinity: {
                  requiredDuringSchedulingIgnoredDuringExecution: {
                    nodeSelectorTerms: [{ matchExpressions: [{ key: 'disk', operator: 'In', values: ['ssd'] }] }],
                  },
                  preferredDuringSchedulingIgnoredDuringExecution: [{ weight: 1, preference: { matchExpressions: [] } }],
                },
                podAntiAffinity: {
                  preferredDuringSchedulingIgnoredDuringExecution: [{ weight: 10, podAffinityTerm: { topologyKey: 'kubernetes.io/hostname' } }],
                },
              },
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
            status: {
              podIP: '10.0.0.10',
              hostIP: '192.168.1.10',
              qosClass: 'Burstable',
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'place', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'NODE', 'POD-IP', 'HOST-IP', 'QOS', 'SA', 'PRIORITY', 'SCHEDULER', 'RESTART', 'HOST-NET', 'OWNER', 'NODE-SELECTOR', 'TOLERATIONS', 'AFFINITY', 'AGE'])
    assert.equal(table.rows.length, 1)
    assert.deepEqual(table.rows[0].slice(0, 15), [
      'default',
      'web-1',
      'node-1',
      '10.0.0.10',
      '192.168.1.10',
      'Burstable',
      'web',
      'high:1000',
      'default-scheduler',
      'Always',
      'true',
      'ReplicaSet/web-64c9',
      'role=frontend,zone=a',
      'dedicated=web:NoSchedule,maintenance:NoExecute:60s',
      'node:required,node:preferred=1,anti:preferred=1',
    ])
    assert.match(output, /node-1/)
    assert.match(output, /ReplicaSet\/web-64c9/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod and container security contexts', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
              annotations: {
                'container.apparmor.security.beta.kubernetes.io/sidecar': 'runtime/default',
              },
            },
            spec: {
              securityContext: {
                runAsUser: 1000,
                runAsGroup: 3000,
                runAsNonRoot: true,
                fsGroup: 2000,
                seccompProfile: { type: 'RuntimeDefault' },
              },
              initContainers: [{
                name: 'bootstrap',
                image: 'busybox:1.36',
                securityContext: {
                  runAsUser: 0,
                  privileged: true,
                },
              }],
              containers: [
                {
                  name: 'app',
                  image: 'nginx:1.27',
                  env: [{ name: 'PASSWORD', value: 'secret-value' }],
                  securityContext: {
                    allowPrivilegeEscalation: false,
                    readOnlyRootFilesystem: true,
                    runAsUser: 1001,
                    runAsGroup: 3001,
                    runAsNonRoot: true,
                    capabilities: { add: ['NET_BIND_SERVICE'], drop: ['ALL'] },
                    seccompProfile: { type: 'Localhost', localhostProfile: 'profiles/web.json' },
                    appArmorProfile: { type: 'RuntimeDefault' },
                    seLinuxOptions: { type: 'container_t', level: 's0:c123,c456' },
                  },
                },
                {
                  name: 'sidecar',
                  image: 'registry.example/sidecar:2.0',
                  securityContext: {},
                },
              ],
              ephemeralContainers: [{
                name: 'debugger',
                image: 'busybox:1.36',
                securityContext: {
                  allowPrivilegeEscalation: true,
                  capabilities: { add: ['SYS_PTRACE'] },
                },
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'sctx', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'POD-RUN-AS', 'POD-NONROOT', 'POD-FSGROUP', 'POD-SECCOMP', 'PRIVILEGED', 'ALLOW-PRIV-ESC', 'RO-ROOT-FS', 'RUN-AS', 'NONROOT', 'CAPS', 'SECCOMP', 'APPARMOR', 'SELINUX', 'AGE'])
    assert.equal(table.rows.length, 4)
    assert.deepEqual(table.rows.map((row) => row.slice(0, 17)), [
      ['default', 'web-1', 'container', 'app', '1000:3000', 'true', 2000, 'RuntimeDefault', '-', 'false', 'true', '1001:3001', 'true', 'add=NET_BIND_SERVICE drop=ALL', 'Localhost:profiles/web.json', 'RuntimeDefault', 'type=container_t,level=s0:c123,c456'],
      ['default', 'web-1', 'container', 'sidecar', '1000:3000', 'true', 2000, 'RuntimeDefault', '-', '-', '-', '-', '-', '-', '-', 'runtime/default', '-'],
      ['default', 'web-1', 'init', 'bootstrap', '1000:3000', 'true', 2000, 'RuntimeDefault', 'true', '-', '-', '0:-', '-', '-', '-', '-', '-'],
      ['default', 'web-1', 'ephemeral', 'debugger', '1000:3000', 'true', 2000, 'RuntimeDefault', '-', 'true', '-', '-', '-', 'add=SYS_PTRACE', '-', '-', '-'],
    ])
    assert.match(output, /NET_BIND_SERVICE/)
    assert.match(output, /Localhost:profiles\/web\.json/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod labels sorted by key', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
              labels: {
                tier: 'frontend',
                app: 'web',
                'app.kubernetes.io/version': '1.27.0',
              },
            },
            spec: {
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'label', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'KEY', 'VALUE', 'AGE'])
    assert.deepEqual(table.rows.map((row) => row.slice(0, 4)), [
      ['default', 'web-1', 'app', 'web'],
      ['default', 'web-1', 'app.kubernetes.io/version', '1.27.0'],
      ['default', 'web-1', 'tier', 'frontend'],
    ])
    assert.match(output, /app\.kubernetes\.io\/version/)
    assert.doesNotMatch(output, /secret-value/)
  })

  it('renders pod annotations with sensitive values redacted', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNamespacedPod: async ({ namespace }) => ({
          items: [{
            metadata: {
              namespace,
              name: 'web-1',
              creationTimestamp: new Date().toISOString(),
              annotations: {
                notes: 'line one\nline two',
                'checksum/config': 'abc123',
                'kubectl.kubernetes.io/last-applied-configuration': '{"data":{"password":"secret-value"}}',
                'vault.hashicorp.com/agent-inject-token': 'super-secret-token',
              },
            },
            spec: {
              containers: [{
                name: 'app',
                image: 'nginx:1.27',
                env: [{ name: 'PASSWORD', value: 'secret-value' }],
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'anno', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'POD', 'KEY', 'VALUE', 'AGE'])
    assert.deepEqual(table.rows.map((row) => row.slice(0, 4)), [
      ['default', 'web-1', 'checksum/config', 'abc123'],
      ['default', 'web-1', 'kubectl.kubernetes.io/last-applied-configuration', '<redacted>'],
      ['default', 'web-1', 'notes', 'line one line two'],
      ['default', 'web-1', 'vault.hashicorp.com/agent-inject-token', '<redacted>'],
    ])
    assert.match(output, /checksum\/config/)
    assert.doesNotMatch(output, /secret-value/)
    assert.doesNotMatch(output, /super-secret-token/)
  })

  it('renders node CPU and memory usage when metrics are available', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listNode: async () => ({
          items: [{
            metadata: {
              name: 'node-1',
              labels: { 'node-role.kubernetes.io/control-plane': '' },
              creationTimestamp: new Date().toISOString(),
            },
            spec: { unschedulable: false },
            status: {
              conditions: [{ type: 'Ready', status: 'True' }],
              nodeInfo: { kubeletVersion: 'v1.30.0' },
            },
          }],
        }),
      },
      customObjects: {
        listClusterCustomObject: async () => ({
          items: [{
            metadata: { name: 'node-1' },
            usage: { cpu: '1250m', memory: '2048Mi' },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'nodes'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'STATUS', 'SCHEDULING', 'ROLES', 'VERSION', 'CPU', 'MEMORY', 'AGE'])
    assert.match(output, /node-1/)
    assert.match(output, /1250m/)
    assert.match(output, /2Gi/)
  })

  it('renders component statuses', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listComponentStatus: async () => ({
          items: [{
            metadata: {
              name: 'scheduler',
              creationTimestamp: new Date().toISOString(),
            },
            conditions: [{
              type: 'Healthy',
              status: 'True',
              message: 'ok',
            }],
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'cs'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'STATUS', 'MESSAGE', 'ERROR', 'AGE'])
    assert.match(output, /resource=componentstatuses/)
    assert.match(output, /\[cs\]/)
    assert.match(output, /scheduler/)
    assert.match(output, /Healthy/)
  })

  it('renders API groups', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      coreDiscovery: {
        getAPIVersions: async () => ({
          apiVersion: 'v1',
          kind: 'APIVersions',
          versions: ['v1'],
          serverAddressByClientCIDRs: [{
            clientCIDR: '0.0.0.0/0',
            serverAddress: 'https://cluster',
          }],
        }),
      },
      apis: {
        getAPIVersions: async () => ({
          groups: [{
            name: 'apps',
            kind: 'APIGroup',
            preferredVersion: { groupVersion: 'apps/v1', version: 'v1' },
            versions: [
              { groupVersion: 'apps/v1', version: 'v1' },
              { groupVersion: 'apps/v1beta1', version: 'v1beta1' },
            ],
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'apig'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'PREFERRED', 'VERSIONS', 'VERSION-COUNT', 'KIND', 'SERVER-ADDRESS-COUNT', 'SERVER-ADDRESSES'])
    assert.match(output, /resource=apigroups/)
    assert.match(output, /\[apig\]/)
    assert.match(output, /core/)
    assert.match(output, /apps/)
    assert.match(output, /apps\/v1beta1/)
    assert.match(output, /0\.0\.0\.0\/0->https:\/\/cluster/)
  })

  it('renders API resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        getAPIResources: async () => ({
          groupVersion: 'v1',
          resources: [{
            name: 'pods',
            kind: 'Pod',
            namespaced: true,
            verbs: ['get', 'list'],
            shortNames: ['po'],
            singularName: 'pod',
          }],
        }),
      },
      apis: {
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
      },
      customObjects: {
        getAPIResources: async ({ group, version }) => {
          if (version === 'v1beta1') throw new Error('discovery failed')
          return {
            groupVersion: `${group}/${version}`,
            resources: [{
              name: 'deployments',
              kind: 'Deployment',
              namespaced: true,
              verbs: ['get', 'list', 'watch'],
              shortNames: ['deploy'],
              singularName: 'deployment',
            }],
          }
        },
      },
    })

    const options = cli.parseArgs(['-r', 'apires'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'KIND', 'APIGROUP', 'VERSION', 'SCOPE', 'VERBS', 'SHORTNAMES', 'PREFERRED', 'SUBRESOURCE'])
    assert.match(output, /resource=apiresources/)
    assert.match(output, /\[apires\]/)
    assert.match(output, /pods/)
    assert.match(output, /deployments/)
    assert.doesNotMatch(output, /v1beta1/)
  })

  it('renders Kubernetes server versions', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      version: {
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
      },
    })

    const options = cli.parseArgs(['-r', 'ver'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['GIT-VERSION', 'MAJOR', 'MINOR', 'PLATFORM', 'BUILD-DATE', 'GIT-COMMIT', 'TREE-STATE', 'GO-VERSION', 'COMPILER', 'EMULATION', 'MIN-COMPATIBILITY'])
    assert.match(output, /resource=serverversions/)
    assert.match(output, /\[ver\]/)
    assert.match(output, /v1\.34\.1/)
    assert.match(output, /linux\/amd64/)
    assert.match(output, /abcdef1234567890/)
    assert.match(output, /1\.33/)
    assert.match(output, /1\.32/)
  })

  it('renders OpenID discovery configuration without key material', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      wellKnown: {
        getServiceAccountIssuerOpenIDConfiguration: async () => JSON.stringify({
          issuer: 'https://kubernetes.default.svc',
          jwks_uri: 'https://kubernetes.default.svc/openid/v1/jwks',
          response_types_supported: ['id_token'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256', 'ES256'],
          claims_supported: ['sub', 'iss'],
        }),
      },
      openid: {
        getServiceAccountIssuerOpenIDKeyset: async () => JSON.stringify({
          keys: [{
            kid: 'key-1',
            kty: 'RSA',
            use: 'sig',
            n: 'public-modulus-not-listed',
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'oidc'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['ISSUER', 'JWKS-URI', 'SIGNING-ALGS', 'SUBJECT-TYPES', 'KEYS', 'KEY-IDS', 'KEY-TYPES', 'KEY-USES', 'CLAIMS'])
    assert.match(output, /resource=openidconfigs/)
    assert.match(output, /\[oidc\]/)
    assert.match(output, /https:\/\/kubernetes\.default\.svc/)
    assert.match(output, /RS256,ES256/)
    assert.match(output, /key-1/)
    assert.doesNotMatch(output, /public-modulus-not-listed/)
  })

  it('renders API server health checks', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig()
    Health.prototype.readyz = async () => true
    Health.prototype.livez = async () => false
    Health.prototype.healthz = async () => {
      throw new Error('healthz unavailable')
    }

    const options = cli.parseArgs(['-r', 'health'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'PATH', 'STATUS', 'HEALTHY', 'MESSAGE'])
    assert.match(output, /resource=apiserverhealth/)
    assert.match(output, /\[health\]/)
    assert.match(output, /readyz/)
    assert.match(output, /Healthy/)
    assert.match(output, /livez/)
    assert.match(output, /Unhealthy/)
    assert.match(output, /healthz unavailable/)
  })

  it('renders self subject reviews', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      authentication: {
        createSelfSubjectReview: async ({ body }) => ({
          status: {
            userInfo: {
              username: 'alice@example.com',
              uid: 'uid-1',
              groups: ['devs', 'system:authenticated'],
              extra: {
                scopes: ['read', 'write'],
              },
            },
          },
          apiVersion: body.apiVersion,
          kind: body.kind,
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'ssr'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['USERNAME', 'UID', 'GROUPS', 'GROUP-COUNT', 'EXTRA-KEYS', 'EXTRA'])
    assert.match(output, /resource=selfsubjectreviews/)
    assert.match(output, /\[ssr\]/)
    assert.match(output, /alice@example.com/)
    assert.match(output, /system:authenticated/)
    assert.match(output, /scopes/)
  })

  it('renders self subject access reviews', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      authorization: {
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
          }
        },
      },
    })

    const options = cli.parseArgs(['-r', 'ssar', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'SCOPE', 'VERB', 'API-GROUP', 'RESOURCE', 'SUBRESOURCE', 'PATH', 'STATUS', 'REASON', 'ERROR'])
    assert.match(output, /resource=selfsubjectaccessreviews/)
    assert.match(output, /\[ssar\]/)
    assert.match(output, /pods/)
    assert.match(output, /secrets/)
    assert.match(output, /Denied/)
    assert.match(output, /readyz/)
  })

  it('checks a specific resource permission with can-i', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      authorization: {
        createSelfSubjectAccessReview: async ({ body }) => {
          calls.push(body)
          return {
            status: {
              allowed: true,
              denied: false,
              reason: 'rbac policy',
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['can-i', '--verb', 'GET', '-r', 'po', '-n', 'default', '--resource-name', 'web', '--subresource', 'log'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)
    const attrs = calls[0].spec.resourceAttributes

    assert.equal(calls[0].apiVersion, 'authorization.k8s.io/v1')
    assert.equal(calls[0].kind, 'SelfSubjectAccessReview')
    assert.equal(attrs.namespace, 'default')
    assert.equal(attrs.verb, 'get')
    assert.equal(attrs.group, undefined)
    assert.equal(attrs.resource, 'pods')
    assert.equal(attrs.subresource, 'log')
    assert.equal(attrs.name, 'web')
    assert.deepEqual(table.headers, ['NAMESPACE', 'SCOPE', 'VERB', 'API-GROUP', 'RESOURCE', 'SUBRESOURCE', 'NAME', 'PATH', 'STATUS', 'REASON', 'ERROR'])
    assert.equal(table.rows[0][8], 'Allowed')
    assert.match(output, /action=can-i/)
    assert.match(output, /resource=pods/)
  })

  it('checks a non-resource URL permission with can-i', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      authorization: {
        createSelfSubjectAccessReview: async ({ body }) => {
          calls.push(body)
          return {
            status: {
              allowed: false,
              denied: true,
              reason: 'health endpoint is restricted',
            },
          }
        },
      },
    })

    const options = cli.parseArgs(['can-i', '--verb', 'get', '--non-resource-url', '/readyz'])
    const table = await cli.loadTable(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(calls[0].spec.nonResourceAttributes, {
      path: '/readyz',
      verb: 'get',
    })
    assert.equal(table.rows[0][1], 'NonResource')
    assert.equal(table.rows[0][7], '/readyz')
    assert.equal(table.rows[0][8], 'Denied')
    assert.match(output, /resource=non-resource/)
    assert.match(output, /health endpoint is restricted/)
  })

  it('renders self subject rules reviews', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      authorization: {
        createSelfSubjectRulesReview: async ({ body }) => ({
          status: {
            incomplete: false,
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
      },
    })

    const options = cli.parseArgs(['-r', 'ssrr', '-n', 'default'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'TYPE', 'VERBS', 'API-GROUPS', 'RESOURCES', 'RESOURCE-NAMES', 'NON-RESOURCE-URLS', 'STATUS', 'ERROR'])
    assert.match(output, /resource=selfsubjectrulesreviews/)
    assert.match(output, /\[ssrr\]/)
    assert.match(output, /Resource/)
    assert.match(output, /pods/)
    assert.match(output, /NonResource/)
    assert.match(output, /healthz/)
  })

  it('renders top pods, top containers, and top nodes sorted by CPU usage', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listPodForAllNamespaces: async () => ({
          items: [
            {
              metadata: { namespace: 'default', name: 'api-1', creationTimestamp: new Date().toISOString() },
              status: { phase: 'Running', containerStatuses: [{ ready: true, restartCount: 0 }] },
            },
            {
              metadata: { namespace: 'default', name: 'web-1', creationTimestamp: new Date().toISOString() },
              status: { phase: 'Running', containerStatuses: [{ ready: true, restartCount: 0 }] },
            },
          ],
        }),
        listNode: async () => ({
          items: [
            {
              metadata: { name: 'node-small', creationTimestamp: new Date().toISOString() },
              status: { conditions: [{ type: 'Ready', status: 'True' }], nodeInfo: { kubeletVersion: 'v1.30.0' } },
            },
            {
              metadata: { name: 'node-large', creationTimestamp: new Date().toISOString() },
              status: { conditions: [{ type: 'Ready', status: 'True' }], nodeInfo: { kubeletVersion: 'v1.30.0' } },
            },
          ],
        }),
      },
      customObjects: {
        listClusterCustomObject: async ({ plural }) => ({
          items: plural === 'pods'
            ? [
              {
                metadata: { namespace: 'default', name: 'api-1' },
                containers: [{ name: 'api', usage: { cpu: '50m', memory: '16Mi' } }],
              },
              {
                metadata: { namespace: 'default', name: 'web-1' },
                containers: [
                  { name: 'web', usage: { cpu: '200m', memory: '32Mi' } },
                  { name: 'sidecar', usage: { cpu: '25m', memory: '16Mi' } },
                ],
              },
            ]
            : [
              { metadata: { name: 'node-small' }, usage: { cpu: '300m', memory: '1024Mi' } },
              { metadata: { name: 'node-large' }, usage: { cpu: '1500m', memory: '2048Mi' } },
            ],
        }),
      },
    })

    const topPods = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'tp']))
    const topContainers = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'tc']))
    const topNodes = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'tn']))

    assert.equal(topPods.rows[0][1], 'web-1')
    assert.equal(topPods.rows[1][1], 'api-1')
    assert.deepEqual(topContainers.headers, ['NAMESPACE', 'POD', 'CONTAINER', 'CPU', 'MEMORY'])
    assert.deepEqual(topContainers.rows.map((row) => row.slice(1, 4)), [
      ['web-1', 'web', '200m'],
      ['api-1', 'api', '50m'],
      ['web-1', 'sidecar', '25m'],
    ])
    assert.equal(topNodes.rows[0][0], 'node-large')
    assert.equal(topNodes.rows[1][0], 'node-small')
  })

  it('formats frames and keeps secret values out of CLI output', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listSecretForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'app-token',
              creationTimestamp: new Date().toISOString(),
            },
            type: 'Opaque',
            data: {
              password: 'cGFzcw==',
              token: 'c2VjcmV0',
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'secret'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=secrets/)
    assert.match(output, /\[secrets\]/)
    assert.match(output, /app-token/)
    assert.match(output, /\s2\s/)
    assert.doesNotMatch(output, /cGFzcw==/)
    assert.doesNotMatch(output, /c2VjcmV0/)
  })

  it('renders Helm releases without exposing stored release payloads', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      core: {
        listSecretForAllNamespaces: async () => ({
          items: [{
            type: 'helm.sh/release.v1',
            metadata: {
              namespace: 'default',
              name: 'sh.helm.release.v1.web.v3',
              creationTimestamp: new Date().toISOString(),
              labels: {
                owner: 'helm',
                name: 'web',
                version: '3',
                status: 'deployed',
                chart: 'web-1.0.0',
              },
            },
            data: { release: 'encoded-helm-values' },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'helm'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=helmreleases/)
    assert.match(output, /\[helm\]/)
    assert.match(output, /web-1\.0\.0/)
    assert.doesNotMatch(output, /encoded-helm-values/)
  })

  it('renders and mutates Helm repositories through local helm repo commands', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      helmRepositories: [{
        name: 'bitnami',
        url: 'https://charts.bitnami.com/bitnami',
      }],
    })
    const listFromConfigOptions = cli.parseArgs(['-r', 'helmrepo'])
    const listFromConfig = await cli.listRows(kubeConfig, listFromConfigOptions)
    const listFromConfigOutput = cli.formatFrame(kubeConfig, listFromConfigOptions, listFromConfig)

    assert.deepEqual(listFromConfig.headers, ['NAME', 'URL'])
    assert.deepEqual(listFromConfig.rows, [['bitnami', 'https://charts.bitnami.com/bitnami']])
    assert.match(listFromConfigOutput, /resource=helmrepositories/)
    assert.match(listFromConfigOutput, /\[helmrepo\]/)

    const createHelmSpawn = (responses) => {
      const calls = []
      const spawnImpl = (command, args, options) => {
        const child = new EventEmitter()
        child.stdout = new EventEmitter()
        child.stderr = new EventEmitter()
        const response = responses.shift() ?? {}
        calls.push({ command, args, options })
        setImmediate(() => {
          if (response.stdout !== undefined) child.stdout.emit('data', Buffer.from(response.stdout))
          if (response.stderr !== undefined) child.stderr.emit('data', Buffer.from(response.stderr))
          child.emit('close', response.code ?? 0)
        })
        return child
      }
      return { calls, spawnImpl }
    }

    const listSpawn = createHelmSpawn([{
      stdout: '[{"name":"bitnami","url":"https://charts.bitnami.com/bitnami"}]\n',
    }])
    const listTable = await cli.loadHelmRepositoryRows(cli.parseArgs(['-r', 'helmrepo']), listSpawn.spawnImpl)

    assert.deepEqual(listSpawn.calls, [{
      command: 'helm',
      args: ['repo', 'list', '-o', 'json'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.deepEqual(listTable.rows, [['bitnami', 'https://charts.bitnami.com/bitnami']])

    const emptyListSpawn = createHelmSpawn([{
      stderr: 'Error: no repositories to show\n',
      code: 1,
    }])
    const emptyListTable = await cli.loadHelmRepositoryRows(cli.parseArgs(['-r', 'helmrepo']), emptyListSpawn.spawnImpl)
    assert.deepEqual(emptyListTable.rows, [])

    const mutationSpawn = createHelmSpawn([
      { stdout: '"bitnami" has been added to your repositories\n' },
      { stdout: 'Hang tight while we grab the latest from your chart repositories...\n' },
      { stdout: 'Hang tight while we grab the latest from bitnami chart repository...\n' },
      { stdout: '"bitnami" has been removed from your repositories\n' },
    ])
    const addTable = await cli.addHelmRepositoryRows(
      cli.parseArgs(['repo-add', '-r', 'helmrepo', '--name', 'bitnami', '--repo-url', 'https://charts.bitnami.com/bitnami', '--confirm']),
      mutationSpawn.spawnImpl,
    )
    const updateAllTable = await cli.updateHelmRepositoryRows(
      cli.parseArgs(['repo-update', '-r', 'helmrepo', '--confirm']),
      mutationSpawn.spawnImpl,
    )
    const updateOneTable = await cli.updateHelmRepositoryRows(
      cli.parseArgs(['repo-update', '-r', 'helmrepo', '--name', 'bitnami', '--confirm']),
      mutationSpawn.spawnImpl,
    )
    const removeTable = await cli.removeHelmRepositoryRows(
      cli.parseArgs(['delete', '-r', 'helmrepo', '--name', 'bitnami', '--confirm']),
      mutationSpawn.spawnImpl,
    )

    assert.deepEqual(mutationSpawn.calls.map((call) => call.args), [
      ['repo', 'add', 'bitnami', 'https://charts.bitnami.com/bitnami'],
      ['repo', 'update'],
      ['repo', 'update', 'bitnami'],
      ['repo', 'remove', 'bitnami'],
    ])
    assert.deepEqual(addTable.rows[0], ['repo-add', 'bitnami', 'https://charts.bitnami.com/bitnami', 'OK', '"bitnami" has been added to your repositories'])
    assert.deepEqual(updateAllTable.rows[0], ['repo-update', 'all', '-', 'OK', 'Hang tight while we grab the latest from your chart repositories...'])
    assert.deepEqual(updateOneTable.rows[0], ['repo-update', 'bitnami', '-', 'OK', 'Hang tight while we grab the latest from bitnami chart repository...'])
    assert.deepEqual(removeTable.rows[0], ['repo-remove', 'bitnami', '-', 'OK', '"bitnami" has been removed from your repositories'])
  })

  it('renders Helm charts from local helm search results', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      helmCharts: [{
        name: 'bitnami/nginx',
        repository: 'bitnami',
        chart: 'nginx',
        version: '18.2.5',
        appVersion: '1.28.0',
        description: 'NGINX Open Source web server',
      }],
    })
    const listFromConfigOptions = cli.parseArgs(['-r', 'helmchart'])
    const listFromConfig = await cli.listRows(kubeConfig, listFromConfigOptions)
    const listFromConfigOutput = cli.formatFrame(kubeConfig, listFromConfigOptions, listFromConfig)

    assert.deepEqual(listFromConfig.headers, ['NAME', 'REPOSITORY', 'CHART', 'VERSION', 'APP', 'DESCRIPTION'])
    assert.deepEqual(listFromConfig.rows, [[
      'bitnami/nginx',
      'bitnami',
      'nginx',
      '18.2.5',
      '1.28.0',
      'NGINX Open Source web server',
    ]])
    assert.match(listFromConfigOutput, /resource=helmcharts/)
    assert.match(listFromConfigOutput, /\[helmchart\]/)

    const calls = []
    const spawnImpl = (command, args, options) => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      calls.push({ command, args, options })
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from('[{"name":"bitnami/nginx","version":"18.2.5","app_version":"1.28.0","description":"NGINX Open Source web server"}]\n'))
        child.emit('close', 0)
      })
      return child
    }
    const searchTable = await cli.loadHelmChartRows(cli.parseArgs(['-r', 'helmchart']), spawnImpl)

    assert.deepEqual(calls, [{
      command: 'helm',
      args: ['search', 'repo', '-o', 'json'],
      options: { stdio: ['ignore', 'pipe', 'pipe'] },
    }])
    assert.deepEqual(searchTable.rows, [[
      'bitnami/nginx',
      'bitnami',
      'nginx',
      '18.2.5',
      '1.28.0',
      'NGINX Open Source web server',
    ]])
  })

  it('renders events from events.k8s.io/v1', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      events: {
        listEventForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'web-1.abc123',
              creationTimestamp: new Date().toISOString(),
            },
            type: 'Warning',
            reason: 'BackOff',
            note: 'Back-off restarting failed container',
            regarding: { kind: 'Pod', name: 'web-1' },
            series: { count: 4, lastObservedTime: new Date().toISOString() },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'events'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=events/)
    assert.match(output, /\[events\]/)
    assert.match(output, /BackOff/)
    assert.match(output, /Pod\/web-1/)
    assert.match(output, /\s4\s/)
  })

  it('renders lease candidates', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      coordinationBeta: {
        listLeaseCandidateForAllNamespaces: async () => ({
          items: [{
            metadata: {
              name: 'controller-1',
              namespace: 'kube-system',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              leaseName: 'kube-controller-manager',
              binaryVersion: '1.34.0',
              emulationVersion: '1.33.0',
              strategy: 'OldestEmulationVersion',
              pingTime: new Date('2024-01-01T00:00:05.000Z'),
              renewTime: new Date('2024-01-01T00:00:10.000Z'),
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'lc'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=leasecandidates/)
    assert.match(output, /\[lc\]/)
    assert.match(output, /controller-1/)
    assert.match(output, /kube-controller-manager/)
    assert.match(output, /OldestEmulationVersion/)
  })

  it('renders storage versions and storage version migrations', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      internalApiserver: {
        listStorageVersion: async () => ({
          items: [{
            metadata: {
              name: 'deployments.apps',
              creationTimestamp: new Date().toISOString(),
            },
            status: {
              commonEncodingVersion: 'apps/v1',
              storageVersions: [{ apiServerID: 'api-1' }],
              conditions: [{ type: 'AllEncodingVersionsEqual', status: 'True' }],
            },
          }],
        }),
      },
      storagemigration: {
        listStorageVersionMigration: async () => ({
          items: [{
            metadata: {
              name: 'migrate-deployments',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              resource: { group: 'apps', version: 'v1', resource: 'deployments' },
            },
            status: {
              resourceVersion: '12345',
              conditions: [{ type: 'Succeeded', status: 'True' }],
            },
          }],
        }),
      },
    })

    const storageVersions = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'sv']))
    const migrations = await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'svm']))
    const storageVersionOutput = cli.formatFrame(kubeConfig, cli.parseArgs(['-r', 'sv']), storageVersions)
    const migrationOutput = cli.formatFrame(kubeConfig, cli.parseArgs(['-r', 'svm']), migrations)

    assert.deepEqual(storageVersions.headers, ['NAME', 'COMMON-ENCODING', 'API-SERVERS', 'CONDITION', 'AGE'])
    assert.match(storageVersionOutput, /deployments\.apps/)
    assert.match(storageVersionOutput, /AllEncodingVersionsEqual=True/)
    assert.deepEqual(migrations.headers, ['NAME', 'RESOURCE', 'GROUP', 'VERSION', 'RESOURCE-VERSION', 'CONDITION', 'CONTINUE', 'AGE'])
    assert.match(migrationOutput, /migrate-deployments/)
    assert.match(migrationOutput, /apps\/v1\/deployments/)
    assert.match(migrationOutput, /Succeeded=True/)
  })

  it('renders device taint rules', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      resourceAlpha: {
        listDeviceTaintRule: async () => ({
          items: [{
            metadata: {
              name: 'gpu-maintenance',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              deviceSelector: {
                driver: 'gpu.example.com',
                pool: 'node-1',
                deviceClassName: 'gpu.example.com',
                device: 'gpu0',
                selectors: [{ cel: { expression: 'true' } }],
              },
              taint: {
                key: 'example.com/maintenance',
                value: 'scheduled',
                effect: 'NoSchedule',
                timeAdded: '2026-05-13T08:30:00Z',
              },
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'dtr'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAME', 'DRIVER', 'POOL', 'DEVICECLASS', 'DEVICE', 'CEL', 'TAINT-KEY', 'VALUE', 'EFFECT', 'TIME-ADDED', 'AGE'])
    assert.match(output, /resource=devicetaintrules/)
    assert.match(output, /\[dtr\]/)
    assert.match(output, /gpu-maintenance/)
    assert.match(output, /example\.com\/maintenance/)
    assert.match(output, /NoSchedule/)
  })

  it('renders certificate signing requests without exposing request payloads', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      certificates: {
        listCertificateSigningRequest: async () => ({
          items: [{
            metadata: {
              name: 'node-client',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              signerName: 'kubernetes.io/kube-apiserver-client-kubelet',
              username: 'system:node:node-1',
              usages: ['client auth'],
              expirationSeconds: 3600,
              request: 'encoded-csr-payload',
            },
            status: {
              conditions: [{ type: 'Approved', status: 'True', reason: 'AutoApproved' }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'csr'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=certificatesigningrequests/)
    assert.match(output, /\[csr\]/)
    assert.match(output, /node-client/)
    assert.match(output, /Approved/)
    assert.doesNotMatch(output, /encoded-csr-payload/)
  })

  it('approves and denies certificate signing requests through the approval subresource', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const calls = []
    const kubeConfig = createMockKubeConfig({
      certificates: {
        patchCertificateSigningRequestApproval: async (...args) => {
          calls.push(args)
          return {}
        },
      },
    })

    const approveTable = await cli.loadTable(kubeConfig, cli.parseArgs(['approve', '-r', 'csr', '--name', 'node-client', '--confirm']))
    const denyTable = await cli.loadTable(kubeConfig, cli.parseArgs(['deny', '-r', 'csr', '--name', 'node-client', '--confirm']))
    const headerValues = []
    await calls[0][1].middleware[0].pre({
      setHeaderParam: (name, value) => headerValues.push([name, value]),
    })

    assert.deepEqual(approveTable.headers, ['ACTION', 'RESOURCE', 'NAME', 'CONDITION', 'STATUS', 'MESSAGE'])
    assert.deepEqual(approveTable.rows[0].slice(0, 5), ['approve', 'certificatesigningrequests', 'node-client', 'Approved', 'OK'])
    assert.deepEqual(denyTable.rows[0].slice(0, 5), ['deny', 'certificatesigningrequests', 'node-client', 'Denied', 'OK'])
    assert.equal(calls[0][0].name, 'node-client')
    assert.equal(calls[0][0].body.status.conditions[0].type, 'Approved')
    assert.equal(calls[1][0].body.status.conditions[0].type, 'Denied')
    assert.deepEqual(headerValues, [['Content-Type', PatchStrategy.StrategicMergePatch]])
  })

  it('renders pod certificate requests without exposing key material', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      certificatesAlpha: {
        listPodCertificateRequestForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'web-cert',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              signerName: 'example.com/pod-serving',
              podName: 'web-1',
              nodeName: 'node-1',
              serviceAccountName: 'web',
              pkixPublicKey: 'encoded-public-key',
              proofOfPossession: 'encoded-proof',
            },
            status: {
              certificateChain: 'encoded-certificate-chain',
              notAfter: '2026-05-13T12:00:00Z',
              conditions: [{ type: 'Issued', status: 'True', reason: 'Completed' }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'pcr'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.deepEqual(table.headers, ['NAMESPACE', 'NAME', 'SIGNER', 'POD', 'NODE', 'SERVICEACCOUNT', 'CONDITION', 'CERT', 'NOT-AFTER', 'AGE'])
    assert.match(output, /resource=podcertificaterequests/)
    assert.match(output, /\[pcr\]/)
    assert.match(output, /web-cert/)
    assert.match(output, /Issued/)
    assert.match(output, /true/)
    assert.doesNotMatch(output, /encoded-public-key/)
    assert.doesNotMatch(output, /encoded-proof/)
    assert.doesNotMatch(output, /encoded-certificate-chain/)
  })

  it('renders controller revisions and pod templates without expanding revision data', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      apps: {
        listControllerRevisionForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'web-7d9c6d',
              creationTimestamp: new Date().toISOString(),
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
          }],
        }),
      },
      core: {
        listPodTemplateForAllNamespaces: async () => ({
          items: [{
            metadata: {
              namespace: 'default',
              name: 'pod-template-web',
              creationTimestamp: new Date().toISOString(),
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
          }],
        }),
      },
    })

    const revisionOptions = cli.parseArgs(['-r', 'crv'])
    const revisionOutput = cli.formatFrame(kubeConfig, revisionOptions, await cli.listRows(kubeConfig, revisionOptions))
    const templateOptions = cli.parseArgs(['-r', 'pt'])
    const templateOutput = cli.formatFrame(kubeConfig, templateOptions, await cli.listRows(kubeConfig, templateOptions))

    assert.match(revisionOutput, /resource=controllerrevisions/)
    assert.match(revisionOutput, /web-7d9c6d/)
    assert.match(revisionOutput, /StatefulSet\/web/)
    assert.match(revisionOutput, /apps\/v1\/StatefulSet/)
    assert.doesNotMatch(revisionOutput, /secret-image-detail/)
    assert.match(templateOutput, /resource=podtemplates/)
    assert.match(templateOutput, /pod-template-web/)
    assert.match(templateOutput, /nginx:1\.27/)
    assert.match(templateOutput, /role=frontend/)
  })

  it('renders validating admission policies without exposing CEL expressions', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      admission: {
        listValidatingAdmissionPolicy: async () => ({
          items: [{
            metadata: {
              name: 'require-team-label',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              failurePolicy: 'Fail',
              paramKind: { apiVersion: 'rules.example.com/v1', kind: 'LabelPolicy' },
              matchConstraints: {
                resourceRules: [{
                  operations: ['CREATE'],
                  apiGroups: ['apps'],
                  apiVersions: ['v1'],
                  resources: ['deployments'],
                }],
              },
              validations: [{ expression: 'has(object.metadata.labels.team)' }],
              auditAnnotations: [{ key: 'team', valueExpression: 'object.metadata.labels.team' }],
            },
            status: {
              conditions: [{ type: 'Ready', status: 'True' }],
              typeChecking: {
                expressionWarnings: [{ fieldRef: 'spec.validations[0].expression', warning: 'warn' }],
              },
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'vap'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=validatingadmissionpolicies/)
    assert.match(output, /\[vap\]/)
    assert.match(output, /require-team-label/)
    assert.match(output, /Ready/)
    assert.doesNotMatch(output, /has\(object\.metadata\.labels\.team\)/)
  })

  it('renders mutating admission policies without exposing CEL expressions', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      admissionBeta: {
        listMutatingAdmissionPolicy: async () => ({
          items: [{
            metadata: {
              name: 'inject-team-label',
              creationTimestamp: new Date().toISOString(),
            },
            spec: {
              failurePolicy: 'Ignore',
              reinvocationPolicy: 'IfNeeded',
              paramKind: { apiVersion: 'rules.example.com/v1', kind: 'MutationPolicy' },
              matchConstraints: {
                resourceRules: [{
                  operations: ['CREATE'],
                  apiGroups: ['apps'],
                  apiVersions: ['v1'],
                  resources: ['deployments'],
                }],
              },
              matchConditions: [{ name: 'has-team', expression: 'has(object.metadata.labels.team)' }],
              variables: [{ name: 'team', expression: 'object.metadata.labels.team' }],
              mutations: [{
                patchType: 'ApplyConfiguration',
                applyConfiguration: {
                  expression: 'Object{metadata: Object.metadata{labels: {"team": variables.team}}}',
                },
              }],
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'map'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=mutatingadmissionpolicies/)
    assert.match(output, /\[map\]/)
    assert.match(output, /inject-team-label/)
    assert.match(output, /IfNeeded/)
    assert.doesNotMatch(output, /Object\{metadata/)
    assert.doesNotMatch(output, /has\(object\.metadata\.labels\.team\)/)
  })

  it('renders mutating admission policy bindings', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      admissionBeta: {
        listMutatingAdmissionPolicyBinding: async () => ({
          items: [{
            metadata: {
              name: 'inject-team-label-prod',
              creationTimestamp: new Date().toISOString(),
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
                }],
              },
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'mapb'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=mutatingadmissionpolicybindings/)
    assert.match(output, /\[mapb\]/)
    assert.match(output, /inject-team-label-prod/)
    assert.match(output, /inject-team-label/)
    assert.match(output, /platform\/team-mutations/)
  })

  it('renders validating admission policy bindings', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      admission: {
        listValidatingAdmissionPolicyBinding: async () => ({
          items: [{
            metadata: {
              name: 'require-team-label-prod',
              creationTimestamp: new Date().toISOString(),
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
                }],
              },
            },
          }],
        }),
      },
    })

    const options = cli.parseArgs(['-r', 'vapb'])
    const table = await cli.listRows(kubeConfig, options)
    const output = cli.formatFrame(kubeConfig, options, table)

    assert.match(output, /resource=validatingadmissionpolicybindings/)
    assert.match(output, /\[vapb\]/)
    assert.match(output, /require-team-label-prod/)
    assert.match(output, /require-team-label/)
    assert.match(output, /platform\/team-labels/)
  })

  it('renders flow control resources', async () => {
    const cli = await importFresh('./bin/k7s-cli.js')
    const kubeConfig = createMockKubeConfig({
      flowcontrol: {
        listFlowSchema: async () => ({
          items: [{
            metadata: {
              name: 'service-accounts',
              creationTimestamp: new Date().toISOString(),
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
                }],
              }],
            },
            status: {
              conditions: [{ type: 'Dangling', status: 'False' }],
            },
          }],
        }),
        listPriorityLevelConfiguration: async () => ({
          items: [{
            metadata: {
              name: 'workload-low',
              creationTimestamp: new Date().toISOString(),
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
              conditions: [{ type: 'ConcurrencyShared', status: 'True' }],
            },
          }],
        }),
      },
    })

    const flowSchemaOutput = cli.formatFrame(kubeConfig, cli.parseArgs(['-r', 'fs']), await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'fs'])))
    const priorityOutput = cli.formatFrame(kubeConfig, cli.parseArgs(['-r', 'plc']), await cli.listRows(kubeConfig, cli.parseArgs(['-r', 'plc'])))

    assert.match(flowSchemaOutput, /resource=flowschemas/)
    assert.match(flowSchemaOutput, /service-accounts/)
    assert.match(flowSchemaOutput, /workload-low/)
    assert.match(priorityOutput, /resource=prioritylevelconfigurations/)
    assert.match(priorityOutput, /workload-low/)
    assert.match(priorityOutput, /Queue/)
  })
})
