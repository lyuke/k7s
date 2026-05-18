#!/usr/bin/env node
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
  dumpYaml,
  EventsV1Api,
  Exec,
  FlowcontrolApiserverV1Api,
  Health,
  InternalApiserverV1alpha1Api,
  KubernetesObjectApi,
  KubeConfig,
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
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createInterface as createReadlineInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import { loadAll as yamlLoadAll } from 'js-yaml'

export const RESOURCE_TYPES = [
  'contexts',
  'topnodes',
  'toppods',
  'topcontainers',
  'containers',
  'containerstates',
  'containerresources',
  'images',
  'probes',
  'ports',
  'volumes',
  'volumemounts',
  'envvars',
  'podconditions',
  'podreadinessgates',
  'podnetwork',
  'podplacement',
  'securitycontexts',
  'podlabels',
  'podannotations',
  'componentstatuses',
  'apigroups',
  'apiresources',
  'serverversions',
  'openidconfigs',
  'apiserverhealth',
  'selfsubjectreviews',
  'selfsubjectaccessreviews',
  'selfsubjectrulesreviews',
  'pods',
  'deployments',
  'daemonsets',
  'statefulsets',
  'replicasets',
  'replicationcontrollers',
  'controllerrevisions',
  'podtemplates',
  'jobs',
  'cronjobs',
  'helmcharts',
  'helmreleases',
  'helmrepositories',
  'poddisruptionbudgets',
  'resourcequotas',
  'limitranges',
  'priorityclasses',
  'runtimeclasses',
  'services',
  'nodes',
  'namespaces',
  'configmaps',
  'secrets',
  'endpoints',
  'leases',
  'leasecandidates',
  'ingresses',
  'ingressclasses',
  'gatewayclasses',
  'gateways',
  'httproutes',
  'grpcroutes',
  'tlsroutes',
  'tcproutes',
  'udproutes',
  'referencegrants',
  'networkpolicies',
  'ipaddresses',
  'servicecidrs',
  'endpointslices',
  'apiservices',
  'mutatingwebhookconfigurations',
  'validatingwebhookconfigurations',
  'mutatingadmissionpolicies',
  'mutatingadmissionpolicybindings',
  'validatingadmissionpolicies',
  'validatingadmissionpolicybindings',
  'flowschemas',
  'prioritylevelconfigurations',
  'certificatesigningrequests',
  'clustertrustbundles',
  'podcertificaterequests',
  'storageversions',
  'storageversionmigrations',
  'persistentvolumes',
  'persistentvolumeclaims',
  'storageclasses',
  'volumeattributesclasses',
  'csidrivers',
  'csinodes',
  'volumeattachments',
  'csistoragecapacities',
  'volumesnapshotclasses',
  'volumesnapshots',
  'volumesnapshotcontents',
  'deviceclasses',
  'devicetaintrules',
  'resourceclaims',
  'resourceclaimtemplates',
  'resourceslices',
  'serviceaccounts',
  'roles',
  'rolebindings',
  'clusterroles',
  'clusterrolebindings',
  'customresources',
  'customresourcedefinitions',
  'horizontalpodautoscalers',
  'events',
]

const RESOURCE_ALIASES = {
  ctx: 'contexts',
  context: 'contexts',
  contexts: 'contexts',
  kubecontext: 'contexts',
  kubecontexts: 'contexts',
  topnodes: 'topnodes',
  topnode: 'topnodes',
  tnode: 'topnodes',
  tn: 'topnodes',
  toppods: 'toppods',
  toppod: 'toppods',
  tpo: 'toppods',
  tp: 'toppods',
  topcontainers: 'topcontainers',
  topcontainer: 'topcontainers',
  tc: 'topcontainers',
  co: 'containers',
  cont: 'containers',
  container: 'containers',
  containers: 'containers',
  containerstate: 'containerstates',
  containerstates: 'containerstates',
  cstate: 'containerstates',
  cstates: 'containerstates',
  crs: 'containerresources',
  cresource: 'containerresources',
  cresources: 'containerresources',
  containerresource: 'containerresources',
  containerresources: 'containerresources',
  request: 'containerresources',
  requests: 'containerresources',
  req: 'containerresources',
  reqs: 'containerresources',
  img: 'images',
  imgs: 'images',
  image: 'images',
  images: 'images',
  probe: 'probes',
  probes: 'probes',
  prb: 'probes',
  cport: 'ports',
  cports: 'ports',
  port: 'ports',
  ports: 'ports',
  prt: 'ports',
  vol: 'volumes',
  vols: 'volumes',
  volume: 'volumes',
  volumes: 'volumes',
  mnt: 'volumemounts',
  mount: 'volumemounts',
  mounts: 'volumemounts',
  vm: 'volumemounts',
  vms: 'volumemounts',
  volumemount: 'volumemounts',
  volumemounts: 'volumemounts',
  env: 'envvars',
  envs: 'envvars',
  envvar: 'envvars',
  envvars: 'envvars',
  environment: 'envvars',
  cond: 'podconditions',
  conds: 'podconditions',
  condition: 'podconditions',
  conditions: 'podconditions',
  podcondition: 'podconditions',
  podconditions: 'podconditions',
  gate: 'podreadinessgates',
  gates: 'podreadinessgates',
  readinessgate: 'podreadinessgates',
  readinessgates: 'podreadinessgates',
  readygate: 'podreadinessgates',
  readygates: 'podreadinessgates',
  rgate: 'podreadinessgates',
  rgates: 'podreadinessgates',
  podreadinessgate: 'podreadinessgates',
  podreadinessgates: 'podreadinessgates',
  dns: 'podnetwork',
  hostalias: 'podnetwork',
  hostaliases: 'podnetwork',
  pnet: 'podnetwork',
  poddns: 'podnetwork',
  podnet: 'podnetwork',
  podnetwork: 'podnetwork',
  podnetworks: 'podnetwork',
  place: 'podplacement',
  placement: 'podplacement',
  placements: 'podplacement',
  podplacement: 'podplacement',
  podplacements: 'podplacement',
  where: 'podplacement',
  sctx: 'securitycontexts',
  secctx: 'securitycontexts',
  security: 'securitycontexts',
  securitycontext: 'securitycontexts',
  securitycontexts: 'securitycontexts',
  label: 'podlabels',
  labels: 'podlabels',
  plabel: 'podlabels',
  plabels: 'podlabels',
  podlabel: 'podlabels',
  podlabels: 'podlabels',
  anno: 'podannotations',
  annos: 'podannotations',
  annotation: 'podannotations',
  annotations: 'podannotations',
  panno: 'podannotations',
  pannos: 'podannotations',
  podannotation: 'podannotations',
  podannotations: 'podannotations',
  cs: 'componentstatuses',
  componentstatus: 'componentstatuses',
  componentstatuses: 'componentstatuses',
  ag: 'apigroups',
  apig: 'apigroups',
  apigroup: 'apigroups',
  apigroups: 'apigroups',
  ar: 'apiresources',
  apires: 'apiresources',
  apiresource: 'apiresources',
  apiresources: 'apiresources',
  kver: 'serverversions',
  serverversion: 'serverversions',
  serverversions: 'serverversions',
  ver: 'serverversions',
  version: 'serverversions',
  oidc: 'openidconfigs',
  openid: 'openidconfigs',
  openidconfig: 'openidconfigs',
  openidconfigs: 'openidconfigs',
  apiserverhealth: 'apiserverhealth',
  health: 'apiserverhealth',
  healthz: 'apiserverhealth',
  livez: 'apiserverhealth',
  readyz: 'apiserverhealth',
  ssr: 'selfsubjectreviews',
  selfsubjectreview: 'selfsubjectreviews',
  selfsubjectreviews: 'selfsubjectreviews',
  whoami: 'selfsubjectreviews',
  ssar: 'selfsubjectaccessreviews',
  cani: 'selfsubjectaccessreviews',
  'can-i': 'selfsubjectaccessreviews',
  selfsubjectaccessreview: 'selfsubjectaccessreviews',
  selfsubjectaccessreviews: 'selfsubjectaccessreviews',
  ssrr: 'selfsubjectrulesreviews',
  selfsubjectrulesreview: 'selfsubjectrulesreviews',
  selfsubjectrulesreviews: 'selfsubjectrulesreviews',
  accessrules: 'selfsubjectrulesreviews',
  access: 'selfsubjectrulesreviews',
  po: 'pods',
  pod: 'pods',
  pods: 'pods',
  deploy: 'deployments',
  deploys: 'deployments',
  deployment: 'deployments',
  deployments: 'deployments',
  ds: 'daemonsets',
  daemonset: 'daemonsets',
  daemonsets: 'daemonsets',
  sts: 'statefulsets',
  statefulset: 'statefulsets',
  statefulsets: 'statefulsets',
  rs: 'replicasets',
  replicaset: 'replicasets',
  replicasets: 'replicasets',
  rc: 'replicationcontrollers',
  replicationcontroller: 'replicationcontrollers',
  replicationcontrollers: 'replicationcontrollers',
  crv: 'controllerrevisions',
  controllerrevision: 'controllerrevisions',
  controllerrevisions: 'controllerrevisions',
  pt: 'podtemplates',
  podtemplate: 'podtemplates',
  podtemplates: 'podtemplates',
  job: 'jobs',
  jobs: 'jobs',
  cj: 'cronjobs',
  cronjob: 'cronjobs',
  cronjobs: 'cronjobs',
  helm: 'helmreleases',
  helms: 'helmreleases',
  release: 'helmreleases',
  releases: 'helmreleases',
  helmrelease: 'helmreleases',
  helmreleases: 'helmreleases',
  hc: 'helmcharts',
  chart: 'helmcharts',
  charts: 'helmcharts',
  helmchart: 'helmcharts',
  helmcharts: 'helmcharts',
  hr: 'helmrepositories',
  helmrepo: 'helmrepositories',
  helmrepos: 'helmrepositories',
  helmrepository: 'helmrepositories',
  helmrepositories: 'helmrepositories',
  pdb: 'poddisruptionbudgets',
  poddisruptionbudget: 'poddisruptionbudgets',
  poddisruptionbudgets: 'poddisruptionbudgets',
  quota: 'resourcequotas',
  quotas: 'resourcequotas',
  rq: 'resourcequotas',
  resourcequota: 'resourcequotas',
  resourcequotas: 'resourcequotas',
  limit: 'limitranges',
  limits: 'limitranges',
  lr: 'limitranges',
  limitrange: 'limitranges',
  limitranges: 'limitranges',
  pc: 'priorityclasses',
  priorityclass: 'priorityclasses',
  priorityclasses: 'priorityclasses',
  rtc: 'runtimeclasses',
  runtimeclass: 'runtimeclasses',
  runtimeclasses: 'runtimeclasses',
  svc: 'services',
  service: 'services',
  services: 'services',
  no: 'nodes',
  node: 'nodes',
  nodes: 'nodes',
  ns: 'namespaces',
  namespace: 'namespaces',
  namespaces: 'namespaces',
  cm: 'configmaps',
  configmap: 'configmaps',
  configmaps: 'configmaps',
  secret: 'secrets',
  secrets: 'secrets',
  ep: 'endpoints',
  endpoint: 'endpoints',
  endpoints: 'endpoints',
  le: 'leases',
  lease: 'leases',
  leases: 'leases',
  lc: 'leasecandidates',
  leasecandidate: 'leasecandidates',
  leasecandidates: 'leasecandidates',
  ing: 'ingresses',
  ingress: 'ingresses',
  ingresses: 'ingresses',
  ic: 'ingressclasses',
  ingressclass: 'ingressclasses',
  ingressclasses: 'ingressclasses',
  gclass: 'gatewayclasses',
  gwc: 'gatewayclasses',
  gatewayclass: 'gatewayclasses',
  gatewayclasses: 'gatewayclasses',
  gw: 'gateways',
  gateway: 'gateways',
  gateways: 'gateways',
  httproute: 'httproutes',
  httproutes: 'httproutes',
  htr: 'httproutes',
  grpcr: 'grpcroutes',
  grpcroute: 'grpcroutes',
  grpcroutes: 'grpcroutes',
  tlsr: 'tlsroutes',
  tlsroute: 'tlsroutes',
  tlsroutes: 'tlsroutes',
  tcpr: 'tcproutes',
  tcproute: 'tcproutes',
  tcproutes: 'tcproutes',
  udpr: 'udproutes',
  udproute: 'udproutes',
  udproutes: 'udproutes',
  rg: 'referencegrants',
  refgrant: 'referencegrants',
  referencegrant: 'referencegrants',
  referencegrants: 'referencegrants',
  netpol: 'networkpolicies',
  networkpolicy: 'networkpolicies',
  networkpolicies: 'networkpolicies',
  ip: 'ipaddresses',
  ipaddress: 'ipaddresses',
  ipaddresses: 'ipaddresses',
  scidr: 'servicecidrs',
  servicecidr: 'servicecidrs',
  servicecidrs: 'servicecidrs',
  eps: 'endpointslices',
  endpointslice: 'endpointslices',
  endpointslices: 'endpointslices',
  as: 'apiservices',
  apisvc: 'apiservices',
  apiservice: 'apiservices',
  apiservices: 'apiservices',
  mwc: 'mutatingwebhookconfigurations',
  mutatingwebhook: 'mutatingwebhookconfigurations',
  mutatingwebhooks: 'mutatingwebhookconfigurations',
  mutatingwebhookconfiguration: 'mutatingwebhookconfigurations',
  mutatingwebhookconfigurations: 'mutatingwebhookconfigurations',
  vwc: 'validatingwebhookconfigurations',
  validatingwebhook: 'validatingwebhookconfigurations',
  validatingwebhooks: 'validatingwebhookconfigurations',
  validatingwebhookconfiguration: 'validatingwebhookconfigurations',
  validatingwebhookconfigurations: 'validatingwebhookconfigurations',
  map: 'mutatingadmissionpolicies',
  mutatingadmissionpolicy: 'mutatingadmissionpolicies',
  mutatingadmissionpolicies: 'mutatingadmissionpolicies',
  mapb: 'mutatingadmissionpolicybindings',
  mutatingadmissionpolicybinding: 'mutatingadmissionpolicybindings',
  mutatingadmissionpolicybindings: 'mutatingadmissionpolicybindings',
  vap: 'validatingadmissionpolicies',
  validatingadmissionpolicy: 'validatingadmissionpolicies',
  validatingadmissionpolicies: 'validatingadmissionpolicies',
  vapb: 'validatingadmissionpolicybindings',
  validatingadmissionpolicybinding: 'validatingadmissionpolicybindings',
  validatingadmissionpolicybindings: 'validatingadmissionpolicybindings',
  fs: 'flowschemas',
  flowschema: 'flowschemas',
  flowschemas: 'flowschemas',
  plc: 'prioritylevelconfigurations',
  prioritylevelconfiguration: 'prioritylevelconfigurations',
  prioritylevelconfigurations: 'prioritylevelconfigurations',
  csr: 'certificatesigningrequests',
  certificatesigningrequest: 'certificatesigningrequests',
  certificatesigningrequests: 'certificatesigningrequests',
  ctb: 'clustertrustbundles',
  clustertrustbundle: 'clustertrustbundles',
  clustertrustbundles: 'clustertrustbundles',
  pcr: 'podcertificaterequests',
  podcertificaterequest: 'podcertificaterequests',
  podcertificaterequests: 'podcertificaterequests',
  sv: 'storageversions',
  storageversion: 'storageversions',
  storageversions: 'storageversions',
  svm: 'storageversionmigrations',
  storageversionmigration: 'storageversionmigrations',
  storageversionmigrations: 'storageversionmigrations',
  pv: 'persistentvolumes',
  pvs: 'persistentvolumes',
  persistentvolume: 'persistentvolumes',
  persistentvolumes: 'persistentvolumes',
  pvc: 'persistentvolumeclaims',
  pvcs: 'persistentvolumeclaims',
  persistentvolumeclaim: 'persistentvolumeclaims',
  persistentvolumeclaims: 'persistentvolumeclaims',
  sc: 'storageclasses',
  storageclass: 'storageclasses',
  storageclasses: 'storageclasses',
  vac: 'volumeattributesclasses',
  volumeattributesclass: 'volumeattributesclasses',
  volumeattributesclasses: 'volumeattributesclasses',
  csid: 'csidrivers',
  csidriver: 'csidrivers',
  csidrivers: 'csidrivers',
  csin: 'csinodes',
  csinode: 'csinodes',
  csinodes: 'csinodes',
  va: 'volumeattachments',
  volumeattachment: 'volumeattachments',
  volumeattachments: 'volumeattachments',
  csc: 'csistoragecapacities',
  csistoragecapacity: 'csistoragecapacities',
  csistoragecapacities: 'csistoragecapacities',
  vsc: 'volumesnapshotclasses',
  volumesnapshotclass: 'volumesnapshotclasses',
  volumesnapshotclasses: 'volumesnapshotclasses',
  vs: 'volumesnapshots',
  volumesnapshot: 'volumesnapshots',
  volumesnapshots: 'volumesnapshots',
  vscnt: 'volumesnapshotcontents',
  volumesnapshotcontent: 'volumesnapshotcontents',
  volumesnapshotcontents: 'volumesnapshotcontents',
  dc: 'deviceclasses',
  deviceclass: 'deviceclasses',
  deviceclasses: 'deviceclasses',
  dtr: 'devicetaintrules',
  devicetaintrule: 'devicetaintrules',
  devicetaintrules: 'devicetaintrules',
  drc: 'resourceclaims',
  resourceclaim: 'resourceclaims',
  resourceclaims: 'resourceclaims',
  drct: 'resourceclaimtemplates',
  resourceclaimtemplate: 'resourceclaimtemplates',
  resourceclaimtemplates: 'resourceclaimtemplates',
  rslice: 'resourceslices',
  resourceslice: 'resourceslices',
  resourceslices: 'resourceslices',
  sa: 'serviceaccounts',
  serviceaccount: 'serviceaccounts',
  serviceaccounts: 'serviceaccounts',
  role: 'roles',
  roles: 'roles',
  rb: 'rolebindings',
  rolebinding: 'rolebindings',
  rolebindings: 'rolebindings',
  cr: 'clusterroles',
  clusterrole: 'clusterroles',
  clusterroles: 'clusterroles',
  crb: 'clusterrolebindings',
  clusterrolebinding: 'clusterrolebindings',
  clusterrolebindings: 'clusterrolebindings',
  crx: 'customresources',
  crxs: 'customresources',
  customresource: 'customresources',
  customresources: 'customresources',
  crd: 'customresourcedefinitions',
  crds: 'customresourcedefinitions',
  customresourcedefinition: 'customresourcedefinitions',
  customresourcedefinitions: 'customresourcedefinitions',
  hpa: 'horizontalpodautoscalers',
  hpas: 'horizontalpodautoscalers',
  horizontalpodautoscaler: 'horizontalpodautoscalers',
  horizontalpodautoscalers: 'horizontalpodautoscalers',
  ev: 'events',
  event: 'events',
  events: 'events',
}

const isBatchSuspensionResource = (resource) => resource === 'jobs' || resource === 'cronjobs'

const HELP_TEXT = `k7s CLI mode (k9s-like lightweight view)

Usage:
  k7s cli [tui|interactive|apply|diff|delete|evict|kill|scale|restart|set-image|install|upgrade|repo-add|repo-update|rollback|test|history|status|pause|suspend|resume|trigger|approve|deny|cordon|uncordon|drain|debug-node|yaml|resources|metadata|values|notes|hooks|all|edit|describe|logs|exec|shell|attach|port-forward|can-i|label|annotate|use-context|use-namespace] [options]

Options:
  -c, --context <name>        kube context to use (defaults to current-context)
  -n, --namespace <name>      namespace for namespaced resources, or target namespace for use-namespace (default: all)
  -r, --resource <type>       resource type or alias, for example ctx, tn, tp, tc, co, crs, img, prb, prt, vol, mnt, env, cond, place, sctx, label, anno, cs, apig, apires, ver, oidc, health, ssr, ssar, ssrr, po, deploy, rc, crv, pt, helmchart, helm, helmrepo, pdb, rq, lr, pc, rtc, svc, no, cm, secret, ep, le, lc, eps, apisvc, mwc, vwc, map, mapb, vap, vapb, fs, plc, csr, ctb, pcr, sv, svm, ing, ic, netpol, pv, pvc, csid, csin, va, csc, dc, dtr, crx, crd, hpa
  -w, --watch                 refresh continuously
      --refresh <seconds>     watch refresh interval in seconds (default: 3)
      --apply                 server-side apply YAML manifests from a file or stdin
      --diff                  run kubectl diff for YAML manifests from a file or stdin
      --delete                delete one resource instead of listing
      --evict                 evict one Pod through the policy/v1 Eviction subresource
      --force-delete          force delete one Pod with grace-period 0
      --scale                 scale one workload instead of listing
      --restart               restart one workload instead of listing
      --set-image             update one workload container image
      --upgrade               upgrade one Helm release from a chart
      --repo-add              add one Helm chart repository
      --repo-update           update Helm chart repository indexes
      --rollback              undo the last rollout for one workload
      --test                  run helm test for one Helm release
      --history               print rollout history for one workload
      --status                print Helm release status or wait for rollout status for one workload
      --rollout-status        wait for rollout status for one workload
      --pause                 pause one deployment rollout
      --suspend               suspend one Job or CronJob
      --resume                resume one paused deployment rollout
      --trigger               create one Job from a CronJob jobTemplate
      --approve               approve one CertificateSigningRequest
      --deny                  deny one CertificateSigningRequest
      --cordon                mark one node as unschedulable
      --uncordon              mark one node as schedulable
      --drain                 drain one node with kubectl drain --ignore-daemonsets
      --debug-node            open an interactive debug shell on one node
      --yaml                  print one resource as YAML, or rendered manifest for Helm releases
      --resources             print helm status with release resources for one Helm release
      --metadata              print metadata for one Helm release
      --values                print all values for one Helm release
      --notes                 print notes for one Helm release
      --hooks                 print hooks for one Helm release
      --helm-all              print helm get all output for one Helm release
      --edit                  edit one resource with kubectl edit
      --describe              print one resource summary with spec, status, conditions, and related events
      --logs                  print pod logs
      --follow                stream pod logs with kubectl logs --follow
      --previous              print logs from the previous terminated container instance
      --timestamps            add RFC3339 timestamps to pod log lines
      --exec                  execute a command in a pod
      --shell                 open an interactive shell in a pod
      --attach                attach to a running pod container
      --port-forward          forward a local port to a pod or service port
      --can-i                 check the current user's Kubernetes permission
      --label                 set or remove one resource label
      --annotate              set or remove one resource annotation
      --use-context           set the current kubeconfig context with kubectl config use-context
      --use-namespace         set the current context namespace with kubectl config set-context
      --interactive           open a k9s-style command prompt for resource navigation
      --name <name>           resource name for delete, evict, kill, scale, restart, set-image, rollback, test, history, status, pause, suspend, resume, trigger, approve, deny, cordon, uncordon, drain, yaml, resources, metadata, values, notes, hooks, all, edit, describe, logs, exec, shell, attach, port-forward, label, annotate, or context name for use-context
      --sort <column>         sort a resource table by column name or 1-based column number; prefix with - for descending
      --asc, --desc           sort direction when --sort is set
      --crd <name>            CustomResourceDefinition name for customresources/crx instance operations
      --container <name>      pod container name for logs, exec, shell, attach, or workload set-image
      --command <command>     shell command for exec, or shell binary for shell (default: /bin/sh)
      --image <image>         container image for set-image, or debug image for debug-node (default: busybox)
      --chart <ref>           Helm chart reference or local chart path for install or upgrade
      --version <version>     Helm chart version for install or upgrade
      --values-file <path>    Helm values file path for install or upgrade
      --set <key=value>       Helm set value for install or upgrade; can be repeated
      --repo-url <url>        Helm repository URL for repo-add
      --install               add helm upgrade --install when using upgrade
      --create-namespace      add helm --create-namespace for install or upgrade
      --wait                  add helm --wait for install or upgrade
      --key <key>             label or annotation key
      --value <value>         label or annotation value
      --overwrite             overwrite an existing label or annotation
      --remove                remove the label or annotation key
      --verb <verb>           Kubernetes verb for can-i, for example get, list, create, update, delete
      --api-group <group>     API group for can-i resource checks, for example apps
      --subresource <name>    subresource for can-i resource checks, for example log or scale
      --resource-name <name>  resource instance name for can-i checks
      --non-resource-url <p>  non-resource URL path for can-i checks, for example /readyz
      --revision <number>     target revision for rollback or history details
      --timeout <duration>    rollout status timeout, for example 30s or 5m
      --target-port <port>    target pod or service port for port-forward
      --local-port <port>     local port for port-forward (defaults to target port)
      -f, --file <path>       YAML manifest path for apply or diff, or - for stdin
      --server-side           use server-side diff
      --field-manager <name>  field manager for server-side apply (default: k7s-cli)
      --force-conflicts       force server-side apply conflicts
      --dry-run               validate apply with Kubernetes dryRun=All
      --tail <lines>          pod log tail line count (default: 100)
      --replicas <count>      desired replica count for scale
      --confirm               required confirmation for apply, delete, evict, kill, scale, restart, set-image, install, upgrade, repo-add, repo-update, rollback, test, pause, suspend, resume, trigger, approve, deny, cordon, uncordon, drain, label, annotate, use-context, or use-namespace
      --help                  show help

Resources:
  ${RESOURCE_TYPES.join(', ')}

Examples:
  k7s cli
  k7s cli tui
  k7s cli -r po -n kube-system
  k7s cli -r ctx
  k7s cli -r co -n default
  k7s cli -r cstate -n default
  k7s cli -r crs -n default
  k7s cli -r img -n default
  k7s cli -r prb -n default
  k7s cli -r prt -n default
  k7s cli -r vol -n default
  k7s cli -r mnt -n default
  k7s cli -r env -n default
  k7s cli -r cond -n default
  k7s cli -r gate -n default
  k7s cli -r pnet -n default
  k7s cli -r place -n default
  k7s cli -r sctx -n default
  k7s cli -r label -n default
  k7s cli -r anno -n default
  k7s cli -r deploy -n default --watch
  k7s cli --context minikube -r nodes
  k7s cli apply -f ./deployment.yaml --confirm
  k7s cli diff -f ./deployment.yaml --server-side
  k7s cli delete -r po -n default --name web-1 --confirm
  k7s cli evict -r po -n default --name web-1 --confirm
  k7s cli kill -r po -n default --name stuck-pod --confirm
  k7s cli --delete -r ns --name old-env --confirm
  k7s cli scale -r deploy -n default --name web --replicas 3 --confirm
  k7s cli restart -r deploy -n default --name web --confirm
  k7s cli set-image -r deploy -n default --name web --container app --image nginx:1.28 --confirm
  k7s cli rollback -r deploy -n default --name web --confirm
  k7s cli rollback -r sts -n default --name db --revision 3 --confirm
  k7s cli install -r helm -n default --name web --chart bitnami/nginx --confirm
  k7s cli upgrade -r helm -n default --name web --chart bitnami/nginx --version 18.2.5 --set image.tag=1.28 --install --confirm
  k7s cli -r helmchart
  k7s cli -r helmrepo
  k7s cli repo-add -r helmrepo --name bitnami --repo-url https://charts.bitnami.com/bitnami --confirm
  k7s cli repo-update -r helmrepo --confirm
  k7s cli delete -r helmrepo --name bitnami --confirm
  k7s cli rollback -r helm -n default --name web --revision 2 --confirm
  k7s cli status -r helm -n default --name web
  k7s cli status -r helm -n default --name web --revision 2
  k7s cli test -r helm -n default --name web --confirm
  k7s cli history -r deploy -n default --name web
  k7s cli history -r helm -n default --name web
  k7s cli status -r deploy -n default --name web --timeout 30s
  k7s cli pause -r deploy -n default --name web --confirm
  k7s cli suspend -r cj -n default --name backup --confirm
  k7s cli resume -r job -n default --name backup-28793400 --confirm
  k7s cli trigger -r cj -n default --name backup --confirm
  k7s cli resume -r deploy -n default --name web --confirm
  k7s cli approve -r csr --name node-client --confirm
  k7s cli deny -r csr --name node-client --confirm
  k7s cli cordon -r node --name worker-1 --confirm
  k7s cli uncordon -r node --name worker-1 --confirm
  k7s cli drain -r node --name worker-1 --confirm
  k7s cli debug-node -r node --name worker-1
  k7s cli yaml -r deploy -n default --name web
  k7s cli edit -r deploy -n default --name web
  k7s cli label -r deploy -n default --name web --key team --value platform --overwrite --confirm
  k7s cli annotate -r deploy -n default --name web --key note --remove --confirm
  k7s cli use-context --name minikube --confirm
  k7s cli use-namespace -n default --confirm
  k7s cli -r crx --crd widgets.example.com -n default
  k7s cli yaml -r crx --crd widgets.example.com -n default --name widget-1
  k7s cli edit -r crx --crd widgets.example.com -n default --name widget-1
  k7s cli describe -r crx --crd widgets.example.com -n default --name widget-1
  k7s cli label -r crx --crd widgets.example.com -n default --name widget-1 --key team --value platform --confirm
  k7s cli delete -r crx --crd widgets.example.com -n default --name widget-1 --confirm
  k7s cli delete -r helm -n default --name web --confirm
  k7s cli yaml -r helm -n default --name web
  k7s cli resources -r helm -n default --name web
  k7s cli metadata -r helm -n default --name web
  k7s cli values -r helm -n default --name web
  k7s cli notes -r helm -n default --name web
  k7s cli hooks -r helm -n default --name web
  k7s cli all -r helm -n default --name web
  k7s cli describe -r helm -n default --name web
  k7s cli describe -r deploy -n default --name web
  k7s cli logs -n default --name web --container app --tail 200
  k7s cli logs -n default --name web --container app --previous
  k7s cli logs -n default --name web --container app --timestamps
  k7s cli logs -n default --name web --container app --follow
  k7s cli exec -n default --name web --container app --command "printenv HOSTNAME"
  k7s cli shell -n default --name web --container app --command /bin/bash
  k7s cli attach -n default --name web --container app
  k7s cli port-forward -n default --name web --target-port 8080 --local-port 18080
  k7s cli port-forward -r svc -n default --name web --target-port 80 --local-port 18080
  k7s cli can-i --verb get -r po -n default --resource-name web --subresource log
  k7s cli can-i --verb get --non-resource-url /readyz
`

export const INTERACTIVE_HELP_TEXT = `Interactive commands:
  :po, :svc, :deploy        switch resource view using aliases
  :po kube-system           switch resource view and namespace together
  :crx <crd> [namespace]    list CustomResource instances for a CRD
  :ctx                      list kubeconfig contexts
  :ctx <name>               switch context for this interactive session
  ns <name|all>             switch namespace scope
  /filter                   filter rows with a case-insensitive regex
  /! filter                 inverse filter rows
  /-f filter                fuzzy-style row filter
  /, clear-filter           clear the current filter
  sort <column>             sort by a visible column name or 1-based column number
  sort -<column>            sort descending
  sort clear                clear table sorting
  describe <name> [ns]      print a resource describe view from the current table
  yaml <name> [ns]          print resource YAML from the current table
  exec <pod> [ns] [container] -- <command...>
                            execute a non-interactive command in a pod
  logs [--previous] [--timestamps] <pod> [ns] [container]
                            print pod logs without leaving interactive mode
  shell <pod> [ns] [container] [command...]
                            open an interactive shell in a pod
  attach <pod> [ns] [container]
                            attach to a running pod container
  pf [pod|svc] <name|ns/name> <target-port> [local-port]
                            forward a local port to a pod or service
  r, refresh                reload the current view
  aliases                   show available resource aliases
  ?, help                   show this help
  q, quit, :q               exit
`

export const normalizeResourceType = (resource) => {
  const key = String(resource ?? '').toLowerCase()
  return RESOURCE_ALIASES[key]
}

const isPort = (value) => Number.isInteger(value) && value >= 1 && value <= 65535

export const parseSortInput = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) {
    throw new Error('--sort requires a column')
  }

  const parts = raw.split(/\s+/)
  let sortColumn = parts[0]
  let sortDirection = parts[1]?.toLowerCase()

  if (parts.length > 2) {
    throw new Error('--sort accepts one column and optional asc or desc direction')
  }
  if (sortColumn.startsWith('-')) {
    sortColumn = sortColumn.slice(1)
    sortDirection = sortDirection ?? 'desc'
  } else if (sortColumn.startsWith('+')) {
    sortColumn = sortColumn.slice(1)
    sortDirection = sortDirection ?? 'asc'
  }
  if (!sortColumn.trim()) {
    throw new Error('--sort requires a column')
  }
  if (sortDirection === undefined) {
    sortDirection = 'asc'
  }
  if (sortDirection === 'descending') {
    sortDirection = 'desc'
  }
  if (sortDirection === 'ascending') {
    sortDirection = 'asc'
  }
  if (sortDirection !== 'asc' && sortDirection !== 'desc') {
    throw new Error('--sort direction must be asc or desc')
  }

  return { sortColumn, sortDirection }
}

export const parseArgs = (argv) => {
  const options = {
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
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === 'tui' || arg === 'interactive' || arg === '--interactive') {
      options.action = 'interactive'
      continue
    }
    if (arg === 'apply' || arg === '--apply') {
      options.action = 'apply'
      continue
    }
    if (arg === 'diff' || arg === '--diff') {
      options.action = 'diff'
      continue
    }
    if (arg === 'delete' || arg === '--delete') {
      options.action = 'delete'
      continue
    }
    if (arg === 'evict' || arg === 'pod-evict' || arg === '--evict' || arg === '--pod-evict') {
      options.action = 'evict'
      continue
    }
    if (arg === 'kill' || arg === 'force-delete' || arg === 'forcedelete' || arg === '--kill' || arg === '--force-delete') {
      options.action = 'force-delete'
      continue
    }
    if (arg === 'scale' || arg === '--scale') {
      options.action = 'scale'
      continue
    }
    if (arg === 'restart' || arg === '--restart') {
      options.action = 'restart'
      continue
    }
    if (arg === 'set-image' || arg === 'setimage' || arg === '--set-image') {
      options.action = 'set-image'
      continue
    }
    if (arg === 'install' || arg === 'helm-install') {
      options.action = 'install'
      continue
    }
    if (arg === 'upgrade' || arg === 'helm-upgrade' || arg === '--upgrade') {
      options.action = 'upgrade'
      continue
    }
    if (arg === 'repo-add' || arg === 'helm-repo-add' || arg === '--repo-add') {
      options.action = 'repo-add'
      continue
    }
    if (arg === 'repo-update' || arg === 'helm-repo-update' || arg === '--repo-update') {
      options.action = 'repo-update'
      continue
    }
    if (arg === 'rollback' || arg === 'undo' || arg === '--rollback') {
      options.action = 'rollback'
      continue
    }
    if (arg === 'test' || arg === '--test') {
      options.action = 'test'
      continue
    }
    if (arg === 'history' || arg === '--history') {
      options.action = 'history'
      continue
    }
    if (arg === 'status' || arg === 'rollout-status' || arg === '--status' || arg === '--rollout-status') {
      options.action = 'rollout-status'
      continue
    }
    if (arg === 'pause' || arg === '--pause') {
      options.action = 'pause'
      continue
    }
    if (arg === 'suspend' || arg === '--suspend') {
      options.action = 'suspend'
      continue
    }
    if (arg === 'resume' || arg === '--resume') {
      options.action = 'resume'
      continue
    }
    if (arg === 'trigger' || arg === 'run' || arg === '--trigger') {
      options.action = 'trigger'
      continue
    }
    if (arg === 'approve' || arg === '--approve') {
      options.action = 'approve'
      continue
    }
    if (arg === 'deny' || arg === '--deny') {
      options.action = 'deny'
      continue
    }
    if (arg === 'cordon' || arg === '--cordon') {
      options.action = 'cordon'
      continue
    }
    if (arg === 'uncordon' || arg === '--uncordon') {
      options.action = 'uncordon'
      continue
    }
    if (arg === 'drain' || arg === '--drain') {
      options.action = 'drain'
      continue
    }
    if (arg === 'debug-node' || arg === 'node-debug' || arg === 'node-shell' || arg === '--debug-node' || arg === '--node-shell') {
      options.action = 'debug-node'
      continue
    }
    if (arg === 'yaml' || arg === '--yaml') {
      options.action = 'yaml'
      continue
    }
    if (arg === 'values' || arg === '--values') {
      options.action = 'values'
      continue
    }
    if (arg === 'resources' || arg === 'helm-resources' || arg === '--resources' || arg === '--helm-resources') {
      options.action = 'resources'
      continue
    }
    if (arg === 'metadata' || arg === 'meta' || arg === '--metadata') {
      options.action = 'metadata'
      continue
    }
    if (arg === 'notes' || arg === '--notes') {
      options.action = 'notes'
      continue
    }
    if (arg === 'hooks' || arg === '--hooks') {
      options.action = 'hooks'
      continue
    }
    if (arg === 'all' || arg === 'helm-all' || arg === 'helmall' || arg === '--helm-all') {
      options.action = 'helm-all'
      continue
    }
    if (arg === 'edit' || arg === '--edit') {
      options.action = 'edit'
      continue
    }
    if (arg === 'describe' || arg === '--describe') {
      options.action = 'describe'
      continue
    }
    if (arg === 'logs' || arg === '--logs') {
      options.action = 'logs'
      continue
    }
    if (arg === 'exec' || arg === '--exec') {
      options.action = 'exec'
      continue
    }
    if (arg === 'shell' || arg === 'sh' || arg === '--shell') {
      options.action = 'shell'
      continue
    }
    if (arg === 'attach' || arg === '--attach') {
      options.action = 'attach'
      continue
    }
    if (arg === 'port-forward' || arg === 'pf' || arg === '--port-forward') {
      options.action = 'port-forward'
      continue
    }
    if (arg === 'can-i' || arg === 'cani' || arg === 'auth-can-i' || arg === '--can-i') {
      options.action = 'can-i'
      continue
    }
    if (arg === 'label' || arg === '--label') {
      options.action = 'label'
      continue
    }
    if (arg === 'annotate' || arg === 'annotation' || arg === '--annotate') {
      options.action = 'annotate'
      continue
    }
    if (arg === 'use-context' || arg === 'use-ctx' || arg === 'ctx-use' || arg === '--use-context') {
      options.action = 'use-context'
      continue
    }
    if (arg === 'use-namespace' || arg === 'use-ns' || arg === 'ns-use' || arg === '--use-namespace') {
      options.action = 'use-namespace'
      continue
    }
    if (arg === '--help') {
      options.help = true
      continue
    }
    if (arg === '-w' || arg === '--watch') {
      options.watch = true
      continue
    }
    if (arg === '-c' || arg === '--context') {
      options.context = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '-n' || arg === '--namespace') {
      options.namespace = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '-r' || arg === '--resource') {
      options.resource = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--refresh') {
      options.refreshSeconds = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '--name') {
      options.name = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--sort' || arg === '--sort-by') {
      const parsedSort = parseSortInput(argv[i + 1])
      options.sortColumn = parsedSort.sortColumn
      options.sortDirection = parsedSort.sortDirection
      i += 1
      continue
    }
    if (arg === '--asc') {
      options.sortDirection = 'asc'
      continue
    }
    if (arg === '--desc') {
      options.sortDirection = 'desc'
      continue
    }
    if (arg === '--crd' || arg === '--crd-name') {
      options.crdName = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--container') {
      options.container = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--tail') {
      options.tailLines = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '--replicas') {
      options.replicas = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '--command' || arg === '--cmd') {
      options.command = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--image') {
      options.image = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--chart') {
      options.chart = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--version' || arg === '--chart-version') {
      options.version = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--values-file' || arg === '--values-path') {
      options.valuesFile = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--repo-url') {
      options.repoUrl = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--set') {
      options.setValues = [...(options.setValues ?? []), argv[i + 1]]
      i += 1
      continue
    }
    if (arg === '--install') {
      options.install = true
      continue
    }
    if (arg === '--create-namespace') {
      options.createNamespace = true
      continue
    }
    if (arg === '--wait') {
      options.wait = true
      continue
    }
    if (arg === '--key') {
      options.metadataKey = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--value') {
      options.metadataValue = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--overwrite') {
      options.overwrite = true
      continue
    }
    if (arg === '--remove') {
      options.remove = true
      continue
    }
    if (arg === '--verb') {
      options.verb = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--api-group' || arg === '--group') {
      options.apiGroup = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--subresource') {
      options.subresource = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--resource-name') {
      options.resourceName = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--non-resource-url' || arg === '--url') {
      options.nonResourceUrl = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--revision' || arg === '--to-revision') {
      options.revision = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '--timeout') {
      options.timeout = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--target-port' || arg === '--port') {
      options.targetPort = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '--local-port') {
      options.localPort = Number(argv[i + 1])
      i += 1
      continue
    }
    if (arg === '-f' || arg === '--file' || arg === '--filename') {
      options.file = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--field-manager') {
      options.fieldManager = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--force-conflicts') {
      options.forceConflicts = true
      continue
    }
    if (arg === '--server-side') {
      options.serverSide = true
      continue
    }
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (arg === '--follow') {
      options.follow = true
      continue
    }
    if (arg === '--previous' || arg === '-p') {
      options.previous = true
      continue
    }
    if (arg === '--timestamps') {
      options.timestamps = true
      continue
    }
    if (arg === '--confirm') {
      options.confirm = true
      continue
    }
    if (arg === '--') {
      options.command = argv.slice(i + 1).join(' ')
      options.commandArgs = argv.slice(i + 1)
      break
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  const normalizedResource = normalizeResourceType(options.resource)
  if (!normalizedResource) {
    throw new Error(`Unsupported resource: ${options.resource}`)
  }
  options.resource = normalizedResource

  if (!Number.isFinite(options.refreshSeconds) || options.refreshSeconds <= 0) {
    throw new Error('refresh interval must be a positive number')
  }
  if (!Number.isInteger(options.tailLines) || options.tailLines < 0) {
    throw new Error('tail must be a non-negative integer')
  }

  if (options.help) {
    return options
  }
  if (options.sortDirection !== undefined && options.sortDirection !== 'asc' && options.sortDirection !== 'desc') {
    throw new Error('--sort direction must be asc or desc')
  }
  if (options.sortDirection !== undefined && options.sortColumn === undefined) {
    throw new Error('--asc or --desc requires --sort')
  }

  if (options.action === 'interactive' && options.watch) {
    throw new Error('interactive does not support --watch')
  }

  const isHelmChartAction = options.action === 'install' || options.action === 'upgrade'
  const isHelmRepositoryAction = options.action === 'repo-add' || options.action === 'repo-update'
  if (!isHelmChartAction) {
    if (options.chart !== undefined) {
      throw new Error(`${options.action} does not support --chart`)
    }
    if (options.version !== undefined) {
      throw new Error(`${options.action} does not support --version`)
    }
    if (options.valuesFile !== undefined) {
      throw new Error(`${options.action} does not support --values-file`)
    }
    if ((options.setValues ?? []).length > 0) {
      throw new Error(`${options.action} does not support --set`)
    }
    if (options.install) {
      throw new Error(`${options.action} does not support --install`)
    }
    if (options.createNamespace) {
      throw new Error(`${options.action} does not support --create-namespace`)
    }
    if (options.wait) {
      throw new Error(`${options.action} does not support --wait`)
    }
  }
  if (!isHelmRepositoryAction && options.repoUrl !== undefined) {
    throw new Error(`${options.action} does not support --repo-url`)
  }

  if (options.action === 'apply') {
    if (!options.file) {
      throw new Error('apply requires --file')
    }
    if (!options.confirm) {
      throw new Error('apply requires --confirm')
    }
    if (options.fieldManager !== undefined && !String(options.fieldManager).trim()) {
      throw new Error('apply requires --field-manager')
    }
    if (options.watch) {
      throw new Error('apply does not support --watch')
    }
  }

  if (options.action === 'diff') {
    if (!options.file) {
      throw new Error('diff requires --file')
    }
    if (options.fieldManager !== undefined && !String(options.fieldManager).trim()) {
      throw new Error('diff requires --field-manager')
    }
    if (options.dryRun) {
      throw new Error('diff does not support --dry-run')
    }
    if (options.watch) {
      throw new Error('diff does not support --watch')
    }
  }

  if (options.action === 'delete') {
    if (!options.name) {
      throw new Error('delete requires --name')
    }
    if (!options.confirm) {
      throw new Error('delete requires --confirm')
    }
    if (options.watch) {
      throw new Error('delete does not support --watch')
    }
  }

  if (options.action === 'evict') {
    if (!options.name) {
      throw new Error('evict requires --name')
    }
    if (!options.confirm) {
      throw new Error('evict requires --confirm')
    }
    if (options.watch) {
      throw new Error('evict does not support --watch')
    }
  }

  if (options.action === 'force-delete') {
    if (!options.name) {
      throw new Error('force-delete requires --name')
    }
    if (!options.confirm) {
      throw new Error('force-delete requires --confirm')
    }
    if (options.watch) {
      throw new Error('force-delete does not support --watch')
    }
  }

  if (options.action === 'scale') {
    if (!options.name) {
      throw new Error('scale requires --name')
    }
    if (!Number.isInteger(options.replicas) || options.replicas < 0) {
      throw new Error('scale requires --replicas as a non-negative integer')
    }
    if (!options.confirm) {
      throw new Error('scale requires --confirm')
    }
    if (options.watch) {
      throw new Error('scale does not support --watch')
    }
  }

  if (options.action === 'restart') {
    if (!options.name) {
      throw new Error('restart requires --name')
    }
    if (!options.confirm) {
      throw new Error('restart requires --confirm')
    }
    if (options.watch) {
      throw new Error('restart does not support --watch')
    }
  }

  if (options.action === 'set-image') {
    if (!options.name) {
      throw new Error('set-image requires --name')
    }
    if (!options.container || !String(options.container).trim()) {
      throw new Error('set-image requires --container')
    }
    if (!options.image || !String(options.image).trim()) {
      throw new Error('set-image requires --image')
    }
    if (!options.confirm) {
      throw new Error('set-image requires --confirm')
    }
    if (options.watch) {
      throw new Error('set-image does not support --watch')
    }
  }

  if (isHelmChartAction) {
    if (options.resource !== 'helmreleases') {
      throw new Error(`${options.action} is only supported for Helm releases`)
    }
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!namespaceArg(options)) {
      throw new Error(`${options.action} requires --namespace for helmreleases`)
    }
    if (!options.chart || !String(options.chart).trim()) {
      throw new Error(`${options.action} requires --chart`)
    }
    if (options.version !== undefined && !String(options.version).trim()) {
      throw new Error(`${options.action} requires --version`)
    }
    if (options.valuesFile !== undefined && !String(options.valuesFile).trim()) {
      throw new Error(`${options.action} requires --values-file`)
    }
    if ((options.setValues ?? []).some((value) => !String(value ?? '').trim())) {
      throw new Error(`${options.action} requires --set values`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.revision !== undefined) {
      throw new Error(`${options.action} does not support --revision`)
    }
    if (options.timeout !== undefined && !String(options.timeout).trim()) {
      throw new Error(`${options.action} requires --timeout`)
    }
    if (options.action === 'install' && options.install) {
      throw new Error('install does not support --install')
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (isHelmRepositoryAction) {
    if (options.resource !== 'helmrepositories') {
      throw new Error(`${options.action} is only supported for Helm repositories`)
    }
    if (namespaceArg(options)) {
      throw new Error(`${options.action} does not support --namespace`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.action === 'repo-add') {
      if (!options.name || !String(options.name).trim()) {
        throw new Error('repo-add requires --name')
      }
      if (!options.repoUrl || !String(options.repoUrl).trim()) {
        throw new Error('repo-add requires --repo-url')
      }
    }
    if (options.action === 'repo-update' && options.repoUrl !== undefined) {
      throw new Error('repo-update does not support --repo-url')
    }
    if (options.revision !== undefined) {
      throw new Error(`${options.action} does not support --revision`)
    }
    if (options.timeout !== undefined) {
      throw new Error(`${options.action} does not support --timeout`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'rollback') {
    if (!options.name) {
      throw new Error('rollback requires --name')
    }
    if (!options.confirm) {
      throw new Error('rollback requires --confirm')
    }
    if (options.revision !== undefined && (!Number.isInteger(options.revision) || options.revision < 1)) {
      throw new Error('rollback requires --revision as a positive integer')
    }
    if (options.watch) {
      throw new Error('rollback does not support --watch')
    }
  }

  if (options.action === 'test') {
    if (!options.name) {
      throw new Error('test requires --name')
    }
    if (!options.confirm) {
      throw new Error('test requires --confirm')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('test is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('test requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('test does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('test does not support --timeout')
    }
    if (options.watch) {
      throw new Error('test does not support --watch')
    }
  }

  if (options.action === 'history') {
    if (!options.name) {
      throw new Error('history requires --name')
    }
    if (options.revision !== undefined && (!Number.isInteger(options.revision) || options.revision < 1)) {
      throw new Error('history requires --revision as a positive integer')
    }
    if (options.resource === 'helmreleases' && options.revision !== undefined) {
      throw new Error('history --revision is not supported for Helm releases')
    }
    if (options.timeout !== undefined) {
      throw new Error('history does not support --timeout')
    }
    if (options.watch) {
      throw new Error('history does not support --watch')
    }
  }

  if (options.action === 'rollout-status') {
    if (!options.name) {
      throw new Error('rollout-status requires --name')
    }
    if (options.resource === 'helmreleases') {
      if (!namespaceArg(options)) {
        throw new Error('status requires --namespace for helmreleases')
      }
      if (options.revision !== undefined && (!Number.isInteger(options.revision) || options.revision < 1)) {
        throw new Error('status requires --revision as a positive integer')
      }
      if (options.timeout !== undefined) {
        throw new Error('status does not support --timeout for helmreleases')
      }
      if (options.watch) {
        throw new Error('status does not support --watch for helmreleases')
      }
    } else if (options.revision !== undefined) {
      throw new Error('rollout-status does not support --revision')
    }
    if (options.timeout !== undefined && !String(options.timeout).trim()) {
      throw new Error('rollout-status requires --timeout')
    }
    if (options.resource !== 'helmreleases' && options.watch) {
      throw new Error('rollout-status does not support --watch')
    }
  }

  if (options.action === 'pause' || options.action === 'resume') {
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.revision !== undefined) {
      throw new Error(`${options.action} does not support --revision`)
    }
    if (options.timeout !== undefined) {
      throw new Error(`${options.action} does not support --timeout`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'suspend' || (options.action === 'resume' && isBatchSuspensionResource(options.resource))) {
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (!isBatchSuspensionResource(options.resource)) {
      throw new Error(`${options.action} is only supported for jobs and cronjobs`)
    }
    if (!namespaceArg(options)) {
      throw new Error(`${options.action} requires --namespace for ${options.resource}`)
    }
    if (options.revision !== undefined) {
      throw new Error(`${options.action} does not support --revision`)
    }
    if (options.timeout !== undefined) {
      throw new Error(`${options.action} does not support --timeout`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'trigger') {
    if (!options.name) {
      throw new Error('trigger requires --name')
    }
    if (!options.confirm) {
      throw new Error('trigger requires --confirm')
    }
    if (options.resource !== 'cronjobs') {
      throw new Error('trigger is only supported for cronjobs')
    }
    if (!namespaceArg(options)) {
      throw new Error('trigger requires --namespace for cronjobs')
    }
    if (options.watch) {
      throw new Error('trigger does not support --watch')
    }
  }

  if (options.action === 'approve' || options.action === 'deny') {
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.resource !== 'certificatesigningrequests') {
      throw new Error(`${options.action} is only supported for certificatesigningrequests`)
    }
    if (namespaceArg(options)) {
      throw new Error(`${options.action} does not support --namespace`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'cordon' || options.action === 'uncordon') {
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'drain') {
    if (!options.name) {
      throw new Error('drain requires --name')
    }
    if (!options.confirm) {
      throw new Error('drain requires --confirm')
    }
    if (options.watch) {
      throw new Error('drain does not support --watch')
    }
  }

  if (options.action === 'debug-node') {
    if (!options.name) {
      throw new Error('debug-node requires --name')
    }
    if (options.command !== undefined) {
      throw new Error('debug-node does not support --command')
    }
    if (options.image !== undefined && !String(options.image).trim()) {
      throw new Error('debug-node requires --image')
    }
    if (options.watch) {
      throw new Error('debug-node does not support --watch')
    }
  }

  if (options.action === 'yaml') {
    if (!options.name) {
      throw new Error('yaml requires --name')
    }
    if (options.watch) {
      throw new Error('yaml does not support --watch')
    }
  }

  if (options.action === 'values') {
    if (!options.name) {
      throw new Error('values requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('values is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('values requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('values does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('values does not support --timeout')
    }
    if (options.watch) {
      throw new Error('values does not support --watch')
    }
  }

  if (options.action === 'resources') {
    if (!options.name) {
      throw new Error('resources requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('resources is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('resources requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('resources does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('resources does not support --timeout')
    }
    if (options.watch) {
      throw new Error('resources does not support --watch')
    }
  }

  if (options.action === 'metadata') {
    if (!options.name) {
      throw new Error('metadata requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('metadata is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('metadata requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('metadata does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('metadata does not support --timeout')
    }
    if (options.watch) {
      throw new Error('metadata does not support --watch')
    }
  }

  if (options.action === 'notes') {
    if (!options.name) {
      throw new Error('notes requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('notes is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('notes requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('notes does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('notes does not support --timeout')
    }
    if (options.watch) {
      throw new Error('notes does not support --watch')
    }
  }

  if (options.action === 'hooks') {
    if (!options.name) {
      throw new Error('hooks requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('hooks is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('hooks requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('hooks does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('hooks does not support --timeout')
    }
    if (options.watch) {
      throw new Error('hooks does not support --watch')
    }
  }

  if (options.action === 'helm-all') {
    if (!options.name) {
      throw new Error('all requires --name')
    }
    if (options.resource !== 'helmreleases') {
      throw new Error('all is only supported for Helm releases')
    }
    if (!namespaceArg(options)) {
      throw new Error('all requires --namespace for helmreleases')
    }
    if (options.revision !== undefined) {
      throw new Error('all does not support --revision')
    }
    if (options.timeout !== undefined) {
      throw new Error('all does not support --timeout')
    }
    if (options.watch) {
      throw new Error('all does not support --watch')
    }
  }

  if (options.action === 'edit') {
    if (!options.name) {
      throw new Error('edit requires --name')
    }
    if (options.command !== undefined) {
      throw new Error('edit does not support --command')
    }
    if (options.watch) {
      throw new Error('edit does not support --watch')
    }
  }

  if (options.action === 'describe') {
    if (!options.name) {
      throw new Error('describe requires --name')
    }
    if (options.watch) {
      throw new Error('describe does not support --watch')
    }
  }

  if (options.action === 'logs') {
    if (!options.name) {
      throw new Error('logs requires --name')
    }
    if (options.previous && options.follow) {
      throw new Error('logs --previous does not support --follow')
    }
    if (options.watch) {
      throw new Error('logs does not support --watch')
    }
  }

  if (options.action === 'exec') {
    if (!options.name) {
      throw new Error('exec requires --name')
    }
    if (!options.command) {
      throw new Error('exec requires --command')
    }
    if (options.watch) {
      throw new Error('exec does not support --watch')
    }
  }

  if (options.action === 'shell') {
    if (!options.name) {
      throw new Error('shell requires --name')
    }
    if (options.command !== undefined && !String(options.command).trim()) {
      throw new Error('shell requires --command')
    }
    if (options.watch) {
      throw new Error('shell does not support --watch')
    }
  }

  if (options.action === 'attach') {
    if (!options.name) {
      throw new Error('attach requires --name')
    }
    if (options.command !== undefined) {
      throw new Error('attach does not support --command')
    }
    if (options.watch) {
      throw new Error('attach does not support --watch')
    }
  }

  if (options.action === 'port-forward') {
    if (!options.name) {
      throw new Error('port-forward requires --name')
    }
    if (!isPort(options.targetPort)) {
      throw new Error('port-forward requires --target-port between 1 and 65535')
    }
    if (options.localPort !== undefined && !isPort(options.localPort)) {
      throw new Error('port-forward requires --local-port between 1 and 65535')
    }
    if (options.watch) {
      throw new Error('port-forward does not support --watch')
    }
  }

  if (options.action === 'can-i') {
    if (!options.verb || !String(options.verb).trim()) {
      throw new Error('can-i requires --verb')
    }
    if (options.nonResourceUrl !== undefined && !String(options.nonResourceUrl).startsWith('/')) {
      throw new Error('can-i requires --non-resource-url to start with /')
    }
    if (options.nonResourceUrl !== undefined && (options.resourceName !== undefined || options.subresource !== undefined || options.name !== undefined)) {
      throw new Error('can-i non-resource checks do not support resource names or subresources')
    }
    if (options.watch) {
      throw new Error('can-i does not support --watch')
    }
  }

  if (options.action === 'label' || options.action === 'annotate') {
    if (!options.name) {
      throw new Error(`${options.action} requires --name`)
    }
    if (!options.metadataKey || !String(options.metadataKey).trim()) {
      throw new Error(`${options.action} requires --key`)
    }
    if (!options.remove && options.metadataValue === undefined) {
      throw new Error(`${options.action} requires --value unless --remove is set`)
    }
    if (options.remove && options.metadataValue !== undefined) {
      throw new Error(`${options.action} --remove does not support --value`)
    }
    if (!options.confirm) {
      throw new Error(`${options.action} requires --confirm`)
    }
    if (options.watch) {
      throw new Error(`${options.action} does not support --watch`)
    }
  }

  if (options.action === 'use-context') {
    if (!options.name || !String(options.name).trim()) {
      throw new Error('use-context requires --name')
    }
    if (options.context !== undefined) {
      throw new Error('use-context does not support --context')
    }
    if (options.namespace !== undefined) {
      throw new Error('use-context does not support --namespace')
    }
    if (!options.confirm) {
      throw new Error('use-context requires --confirm')
    }
    if (options.watch) {
      throw new Error('use-context does not support --watch')
    }
  }

  if (options.action === 'use-namespace') {
    if (!namespaceArg(options)) {
      throw new Error('use-namespace requires --namespace')
    }
    if (options.context !== undefined) {
      throw new Error('use-namespace does not support --context')
    }
    if (options.name !== undefined) {
      throw new Error('use-namespace does not support --name')
    }
    if (!options.confirm) {
      throw new Error('use-namespace requires --confirm')
    }
    if (options.watch) {
      throw new Error('use-namespace does not support --watch')
    }
  }

  if (
    options.resource === 'customresources'
    && ['list', 'interactive', 'delete', 'yaml', 'edit', 'describe', 'label', 'annotate'].includes(options.action)
    && !String(options.crdName ?? '').trim()
  ) {
    throw new Error(`${options.action} requires --crd for customresources`)
  }

  return options
}

export const ageFrom = (dateString) => {
  if (!dateString) return '-'
  const created = new Date(dateString)
  if (Number.isNaN(created.getTime())) return '-'

  const diffMs = Date.now() - created.getTime()
  if (diffMs < 1000) return '0s'
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d`
  if (diffHours > 0) return `${diffHours}h`
  if (diffMinutes > 0) return `${diffMinutes}m`
  return `${diffSeconds}s`
}

const itemsFrom = (response) => response?.items ?? response?.body?.items ?? []

const formatRef = (ref) => (ref?.kind && ref?.name ? `${ref.kind}/${ref.name}` : '-')

const eventRow = (event) => {
  const objectRef = event.regarding ?? event.involvedObject
  const message = event.note ?? event.message
  const count = event.series?.count ?? event.deprecatedCount ?? event.count ?? 1
  const lastObserved = event.series?.lastObservedTime
    ?? event.deprecatedLastTimestamp
    ?? event.lastTimestamp
    ?? event.eventTime
    ?? event.metadata?.creationTimestamp
  return [
    event.metadata?.namespace ?? '-',
    event.type ?? 'Normal',
    event.reason ?? '-',
    formatRef(objectRef),
    truncate(message, 72) || '-',
    count,
    ageFrom(lastObserved),
  ]
}

const parseHelmStorageName = (storageName) => {
  const match = storageName?.match(/^sh\.helm\.release\.v1\.(.+)\.v(\d+)$/)
  if (!match) return null
  return {
    name: match[1],
    revision: Number.parseInt(match[2], 10),
  }
}

const parseHelmTimestamp = (value) => {
  if (!value) return undefined
  const numeric = Number(value)
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 1000000000000 ? numeric : numeric * 1000)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const helmReleaseFromStorage = (storage, resource) => {
  const labels = resource.metadata?.labels ?? {}
  const parsedName = parseHelmStorageName(resource.metadata?.name)
  const releaseName = labels.name ?? parsedName?.name ?? ''
  const labelRevision = Number.parseInt(labels.version ?? '', 10)
  const revision = Number.isFinite(labelRevision) ? labelRevision : parsedName?.revision ?? 0
  const isHelmStorage = labels.owner === 'helm'
    || (storage === 'Secret' && resource.type === 'helm.sh/release.v1')

  if (!isHelmStorage || !releaseName) return null

  const updatedDate = parseHelmTimestamp(labels.modifiedAt ?? labels.createdAt)
    ?? (resource.metadata?.creationTimestamp ? new Date(resource.metadata.creationTimestamp) : undefined)
  return {
    name: releaseName,
    namespace: resource.metadata?.namespace ?? '-',
    revision,
    status: labels.status ?? '-',
    chart: labels.chart ?? labels['helm.sh/chart'] ?? '-',
    appVersion: labels.appVersion ?? labels['app.kubernetes.io/version'] ?? '-',
    updated: updatedDate ? updatedDate.toISOString().replace('T', ' ').slice(0, 19) : '-',
    age: ageFrom(resource.metadata?.creationTimestamp),
    storage,
    updatedTime: updatedDate?.getTime() ?? 0,
  }
}

const formatLabelSelector = (selector) => {
  const labels = Object.entries(selector?.matchLabels ?? {})
    .map(([key, value]) => `${key}=${value}`)
  const expressions = (selector?.matchExpressions ?? [])
    .map((expression) => {
      if (!expression.key || !expression.operator) return ''
      const values = expression.values?.join(',') ?? ''
      return values ? `${expression.key} ${expression.operator} (${values})` : `${expression.key} ${expression.operator}`
    })
    .filter(Boolean)
  return [...labels, ...expressions].join(',') || 'all'
}

const formatResourceMap = (values) => {
  const entries = Object.entries(values ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
  return entries.join(',') || '-'
}

const formatLimitRangeMap = (limits, field) => {
  const entries = (limits ?? []).flatMap((limit) => {
    const values = formatResourceMap(limit?.[field])
    if (values === '-') return []
    return `${limit.type ?? 'Resource'}:${values}`
  })
  return entries.join(';') || '-'
}

const formatEndpointPorts = (ports) => (
  (ports ?? [])
    .map((port) => {
      const protocol = port.protocol?.toLowerCase() ?? 'tcp'
      return port.name ? `${port.name}:${port.port ?? '-'}/${protocol}` : `${port.port ?? '-'}/${protocol}`
    })
    .join(',') || '-'
)

const uniqueValues = (values) => [...new Set(values.filter(Boolean))]

const formatRuleValues = (values, fallback = '*') => (
  values?.filter(Boolean).length > 0 ? values.filter(Boolean).join(',') : fallback
)

const formatRuleApiGroups = (values) => formatRuleValues(values, 'core')

const parseCpuToNanocores = (value) => {
  if (!value) return 0
  const match = value.trim().match(/^([0-9.]+)(n|u|m|)?$/)
  if (!match) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0
  if (match[2] === 'n') return Math.round(amount)
  if (match[2] === 'u') return Math.round(amount * 1000)
  if (match[2] === 'm') return Math.round(amount * 1000000)
  return Math.round(amount * 1000000000)
}

const formatNanocores = (value) => {
  if (value <= 0) return '-'
  if (value < 1000000) return `${Math.round(value)}n`
  const millicores = value / 1000000
  return `${Number.isInteger(millicores) ? millicores : Number(millicores.toFixed(1))}m`
}

const parseMemoryToBytes = (value) => {
  if (!value) return 0
  const match = value.trim().match(/^([0-9.]+)(Ki|Mi|Gi|Ti|Pi|Ei|K|M|G|T|P|E|)?$/)
  if (!match) return 0
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return 0
  const binaryUnits = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
    Ei: 1024 ** 6,
  }
  const decimalUnits = {
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
    P: 1000 ** 5,
    E: 1000 ** 6,
  }
  const unit = match[2] ?? ''
  return Math.round(amount * (binaryUnits[unit] ?? decimalUnits[unit] ?? 1))
}

const formatBytes = (value) => {
  if (value <= 0) return '-'
  const units = [
    ['Gi', 1024 ** 3],
    ['Mi', 1024 ** 2],
    ['Ki', 1024],
  ]
  const unit = units.find(([, size]) => value >= size)
  if (!unit) return `${value}B`
  const amount = value / unit[1]
  return `${Number.isInteger(amount) ? amount : Number(amount.toFixed(1))}${unit[0]}`
}

const podMetricsKey = (namespace, name) => `${namespace ?? ''}/${name ?? ''}`

const listPodMetricUsage = async (api, namespace) => {
  try {
    const response = namespace
      ? await api.listNamespacedCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        namespace,
        plural: 'pods',
      })
      : await api.listClusterCustomObject({
        group: 'metrics.k8s.io',
        version: 'v1beta1',
        plural: 'pods',
      })
    const usage = new Map()
    for (const metric of itemsFrom(response)) {
      const name = metric.metadata?.name ?? ''
      const metricNamespace = metric.metadata?.namespace ?? namespace ?? ''
      if (!name || !metricNamespace) continue
      const containers = []
      const totals = (metric.containers ?? []).reduce((acc, container) => ({
        cpu: acc.cpu + parseCpuToNanocores(container.usage?.cpu),
        memory: acc.memory + parseMemoryToBytes(container.usage?.memory),
      }), { cpu: 0, memory: 0 })
      for (const container of metric.containers ?? []) {
        if (!container.name) continue
        containers.push({
          name: container.name,
          cpu: formatNanocores(parseCpuToNanocores(container.usage?.cpu)),
          memory: formatBytes(parseMemoryToBytes(container.usage?.memory)),
        })
      }
      usage.set(podMetricsKey(metricNamespace, name), {
        name,
        namespace: metricNamespace,
        cpu: formatNanocores(totals.cpu),
        memory: formatBytes(totals.memory),
        containers,
      })
    }
    return usage
  } catch {
    return new Map()
  }
}

const listNodeMetricUsage = async (api) => {
  try {
    const response = await api.listClusterCustomObject({
      group: 'metrics.k8s.io',
      version: 'v1beta1',
      plural: 'nodes',
    })
    const usage = new Map()
    for (const metric of itemsFrom(response)) {
      const name = metric.metadata?.name ?? ''
      if (!name) continue
      usage.set(name, {
        cpu: formatNanocores(parseCpuToNanocores(metric.usage?.cpu)),
        memory: formatBytes(parseMemoryToBytes(metric.usage?.memory)),
      })
    }
    return usage
  } catch {
    return new Map()
  }
}

const formatOwnerReferences = (owners) => {
  const controller = owners?.find((owner) => owner.controller)
  const owner = controller ?? owners?.[0]
  if (!owner?.kind && !owner?.name) return '-'
  return `${owner.kind ?? 'Owner'}/${owner.name ?? '-'}`
}

const formatObjectKind = (value) => {
  if (!value || typeof value !== 'object') return '-'
  if (!value.kind) return '-'
  return value.apiVersion ? `${value.apiVersion}/${value.kind}` : value.kind
}

const controllerRevisionRow = (revision) => [
  revision.metadata?.namespace ?? '-',
  revision.metadata?.name ?? '-',
  revision.revision ?? 0,
  truncate(formatOwnerReferences(revision.metadata?.ownerReferences), 36),
  truncate(formatObjectKind(revision.data), 36),
  ageFrom(revision.metadata?.creationTimestamp),
]

const podTemplateRow = (template) => {
  const containers = template.template?.spec?.containers ?? []
  return [
    template.metadata?.namespace ?? '-',
    template.metadata?.name ?? '-',
    containers.length,
    truncate(containers.map((container) => container.image).filter(Boolean).join(',') || '-', 56),
    template.template?.spec?.restartPolicy ?? '-',
    template.template?.spec?.serviceAccountName ?? '-',
    truncate(formatResourceMap(template.template?.metadata?.labels), 40),
    truncate(formatResourceMap(template.template?.spec?.nodeSelector), 40),
    ageFrom(template.metadata?.creationTimestamp),
  ]
}

const formatAdmissionClient = (webhook) => {
  const service = webhook.clientConfig?.service
  if (service?.name) {
    const namespace = service.namespace ? `${service.namespace}/` : ''
    const port = service.port ? `:${service.port}` : ''
    const path = service.path ?? ''
    return `svc:${namespace}${service.name}${port}${path}`
  }
  return webhook.clientConfig?.url ?? '-'
}

const formatAdmissionRules = (webhooks) => {
  const rules = webhooks.flatMap((webhook) => webhook.rules ?? [])
  const resources = uniqueValues(rules.flatMap((rule) => rule.resources ?? []))
  const operations = uniqueValues(rules.flatMap((rule) => rule.operations ?? []))
  if (resources.length === 0 && operations.length === 0) return '-'
  return `${operations.join(',') || '*'} ${resources.join(',') || '*'}`
}

const admissionWebhookRow = (config) => {
  const webhooks = config.webhooks ?? []
  return [
    config.metadata?.name ?? '-',
    webhooks.length,
    uniqueValues(webhooks.map((webhook) => webhook.failurePolicy ?? 'Fail')).join(',') || '-',
    uniqueValues(webhooks.map((webhook) => webhook.sideEffects ?? '-')).join(',') || '-',
    truncate(uniqueValues(webhooks.flatMap((webhook) => webhook.admissionReviewVersions ?? [])).join(',') || '-', 32),
    truncate(uniqueValues(webhooks.map(formatAdmissionClient)).join(',') || '-', 48),
    truncate(formatAdmissionRules(webhooks), 48),
    ageFrom(config.metadata?.creationTimestamp),
  ]
}

const formatAdmissionPolicyRules = (rules) => {
  const resources = uniqueValues((rules ?? []).flatMap((rule) => rule.resources ?? []))
  const operations = uniqueValues((rules ?? []).flatMap((rule) => rule.operations ?? []))
  if (resources.length === 0 && operations.length === 0) return '-'
  return `${operations.join(',') || '*'} ${resources.join(',') || '*'}`
}

const formatAdmissionMatchResources = (matchResources) => {
  const included = formatAdmissionPolicyRules(matchResources?.resourceRules)
  const excluded = formatAdmissionPolicyRules(matchResources?.excludeResourceRules)
  if (included === '-' && excluded === '-') return '-'
  return excluded === '-' ? included : `${included}; exclude ${excluded}`
}

const formatParamKind = (paramKind) => {
  if (!paramKind?.kind) return '-'
  return paramKind.apiVersion ? `${paramKind.apiVersion}/${paramKind.kind}` : paramKind.kind
}

const formatParamRef = (paramRef) => {
  if (!paramRef) return '-'
  const target = paramRef.name ? `${paramRef.namespace ? `${paramRef.namespace}/` : ''}${paramRef.name}` : 'selector'
  return paramRef.parameterNotFoundAction ? `${target} (${paramRef.parameterNotFoundAction})` : target
}

const admissionPolicyCondition = (policy) => {
  const ready = policy.status?.conditions?.find((condition) => condition.type === 'Ready')
  if (ready) return ready.status === 'True' ? 'Ready' : ready.reason ?? ready.status ?? 'NotReady'
  const active = policy.status?.conditions?.find((condition) => condition.status === 'True')
  return active?.type ?? '-'
}

const mutatingAdmissionPolicyRow = (policy) => [
  policy.metadata?.name ?? '-',
  policy.spec?.failurePolicy ?? 'Fail',
  policy.spec?.reinvocationPolicy ?? '-',
  policy.spec?.mutations?.length ?? 0,
  policy.spec?.variables?.length ?? 0,
  policy.spec?.matchConditions?.length ?? 0,
  truncate(formatAdmissionMatchResources(policy.spec?.matchConstraints), 48),
  truncate(formatParamKind(policy.spec?.paramKind), 36),
  ageFrom(policy.metadata?.creationTimestamp),
]

const mutatingAdmissionPolicyBindingRow = (binding) => [
  binding.metadata?.name ?? '-',
  binding.spec?.policyName ?? '-',
  truncate(formatParamRef(binding.spec?.paramRef), 36),
  truncate(formatAdmissionMatchResources(binding.spec?.matchResources), 48),
  ageFrom(binding.metadata?.creationTimestamp),
]

const validatingAdmissionPolicyRow = (policy) => [
  policy.metadata?.name ?? '-',
  policy.spec?.failurePolicy ?? 'Fail',
  policy.spec?.validations?.length ?? 0,
  policy.spec?.auditAnnotations?.length ?? 0,
  truncate(formatAdmissionMatchResources(policy.spec?.matchConstraints), 48),
  truncate(formatParamKind(policy.spec?.paramKind), 36),
  admissionPolicyCondition(policy),
  policy.status?.typeChecking?.expressionWarnings?.length ?? 0,
  ageFrom(policy.metadata?.creationTimestamp),
]

const validatingAdmissionPolicyBindingRow = (binding) => [
  binding.metadata?.name ?? '-',
  binding.spec?.policyName ?? '-',
  (binding.spec?.validationActions ?? []).join(',') || '-',
  truncate(formatParamRef(binding.spec?.paramRef), 36),
  truncate(formatAdmissionMatchResources(binding.spec?.matchResources), 48),
  ageFrom(binding.metadata?.creationTimestamp),
]

const formatFlowSubject = (subject) => {
  if (subject.kind === 'User') return `user:${subject.user?.name ?? '*'}`
  if (subject.kind === 'Group') return `group:${subject.group?.name ?? '*'}`
  if (subject.kind === 'ServiceAccount') {
    const namespace = subject.serviceAccount?.namespace ? `${subject.serviceAccount.namespace}/` : ''
    return `sa:${namespace}${subject.serviceAccount?.name ?? '*'}`
  }
  return subject.kind ?? '-'
}

const formatFlowSubjects = (rules) => {
  const subjects = uniqueValues((rules ?? []).flatMap((rule) => rule.subjects ?? []).map(formatFlowSubject))
  return subjects.join(',') || '-'
}

const formatFlowResourceRules = (rules) => {
  const resources = uniqueValues((rules ?? []).flatMap((rule) => rule.resources ?? []))
  const verbs = uniqueValues((rules ?? []).flatMap((rule) => rule.verbs ?? []))
  if (resources.length === 0 && verbs.length === 0) return '-'
  return `${verbs.join(',') || '*'} ${resources.join(',') || '*'}`
}

const formatFlowNonResourceRules = (rules) => {
  const urls = uniqueValues((rules ?? []).flatMap((rule) => rule.nonResourceURLs ?? []))
  const verbs = uniqueValues((rules ?? []).flatMap((rule) => rule.verbs ?? []))
  if (urls.length === 0 && verbs.length === 0) return '-'
  return `${verbs.join(',') || '*'} ${urls.join(',') || '*'}`
}

const formatFlowRules = (rules) => {
  const resourceRules = formatFlowResourceRules((rules ?? []).flatMap((rule) => rule.resourceRules ?? []))
  const nonResourceRules = formatFlowNonResourceRules((rules ?? []).flatMap((rule) => rule.nonResourceRules ?? []))
  if (resourceRules === '-' && nonResourceRules === '-') return '-'
  if (resourceRules === '-') return `nonResource ${nonResourceRules}`
  return nonResourceRules === '-' ? resourceRules : `${resourceRules}; nonResource ${nonResourceRules}`
}

const flowControlCondition = (conditions) => {
  const dangling = conditions?.find((condition) => condition.type === 'Dangling')
  if (dangling) return dangling.status === 'True' ? dangling.reason ?? 'Dangling' : 'Ready'
  const active = conditions?.find((condition) => condition.status === 'True')
  return active?.type ?? '-'
}

const optionalNumber = (value) => (typeof value === 'number' ? String(value) : '-')

const flowSchemaRow = (schema) => [
  schema.metadata?.name ?? '-',
  schema.spec?.priorityLevelConfiguration?.name ?? '-',
  schema.spec?.matchingPrecedence ?? 0,
  schema.spec?.distinguisherMethod?.type ?? '-',
  truncate(formatFlowSubjects(schema.spec?.rules), 40),
  truncate(formatFlowRules(schema.spec?.rules), 56),
  flowControlCondition(schema.status?.conditions),
  ageFrom(schema.metadata?.creationTimestamp),
]

const priorityLevelConfigurationRow = (config) => {
  const limited = config.spec?.limited
  const exempt = config.spec?.exempt
  const queuing = limited?.limitResponse?.queuing
  return [
    config.metadata?.name ?? '-',
    config.spec?.type ?? '-',
    optionalNumber(limited?.nominalConcurrencyShares ?? exempt?.nominalConcurrencyShares),
    optionalNumber(limited?.lendablePercent ?? exempt?.lendablePercent),
    optionalNumber(limited?.borrowingLimitPercent),
    limited?.limitResponse?.type ?? '-',
    optionalNumber(queuing?.queues),
    optionalNumber(queuing?.handSize),
    optionalNumber(queuing?.queueLengthLimit),
    flowControlCondition(config.status?.conditions),
    ageFrom(config.metadata?.creationTimestamp),
  ]
}

const certificateSigningRequestCondition = (csr) => {
  const active = (csr.status?.conditions ?? []).find((condition) => condition.status === 'True')
  return [
    active?.type ?? 'Pending',
    active?.reason ?? '-',
  ]
}

const certificateSigningRequestRow = (csr) => {
  const [condition, reason] = certificateSigningRequestCondition(csr)
  return [
    csr.metadata?.name ?? '-',
    csr.spec?.signerName ?? '-',
    csr.spec?.username ?? '-',
    condition,
    reason,
    truncate((csr.spec?.usages ?? []).join(',') || '-', 48),
    csr.spec?.expirationSeconds ?? 0,
    ageFrom(csr.metadata?.creationTimestamp),
  ]
}

const countPemCertificates = (value) => (
  value?.match(/-----BEGIN CERTIFICATE-----/g)?.length ?? 0
)

const clusterTrustBundleRow = (bundle) => {
  const trustBundle = bundle.spec?.trustBundle ?? ''
  return [
    bundle.metadata?.name ?? '-',
    bundle.spec?.signerName || '-',
    countPemCertificates(trustBundle),
    Buffer.byteLength(trustBundle),
    trustBundle.length > 0 ? 'true' : 'false',
    ageFrom(bundle.metadata?.creationTimestamp),
  ]
}

const podCertificateRequestCondition = (request) => {
  const active = (request.status?.conditions ?? []).find((condition) => condition.status === 'True')
  return active?.type ?? 'Pending'
}

const podCertificateRequestRow = (request) => [
  request.metadata?.namespace ?? '-',
  request.metadata?.name ?? '-',
  request.spec?.signerName ?? '-',
  request.spec?.podName ?? '-',
  request.spec?.nodeName ?? '-',
  request.spec?.serviceAccountName ?? '-',
  podCertificateRequestCondition(request),
  request.status?.certificateChain ? 'true' : 'false',
  formatLeaseTime(request.status?.notAfter),
  ageFrom(request.metadata?.creationTimestamp),
]

const conditionSummary = (conditions) => {
  const condition = conditions?.find((item) => item.status === 'True') ?? conditions?.[0]
  if (!condition) return '-'
  return `${condition.type ?? '-'}=${condition.status ?? '-'}`
}

const storageVersionRow = (version) => [
  version.metadata?.name ?? '-',
  version.status?.commonEncodingVersion ?? '-',
  version.status?.storageVersions?.length ?? 0,
  conditionSummary(version.status?.conditions),
  ageFrom(version.metadata?.creationTimestamp),
]

const storageVersionMigrationResource = (migration) => {
  const resource = migration.spec?.resource
  if (!resource?.resource) return '-'
  const group = resource.group ? `${resource.group}/` : ''
  const version = resource.version ? `${resource.version}/` : ''
  return `${group}${version}${resource.resource}`
}

const storageVersionMigrationRow = (migration) => [
  migration.metadata?.name ?? '-',
  storageVersionMigrationResource(migration),
  migration.spec?.resource?.group || '-',
  migration.spec?.resource?.version || '-',
  migration.status?.resourceVersion ?? '-',
  conditionSummary(migration.status?.conditions),
  migration.spec?.continueToken || '-',
  ageFrom(migration.metadata?.creationTimestamp),
]

const formatIngressClassParameters = (ingressClass) => {
  const parameters = ingressClass.spec?.parameters
  if (!parameters?.name) return '-'
  const apiGroup = parameters.apiGroup ? `${parameters.apiGroup}/` : ''
  const namespace = parameters.namespace ? `${parameters.namespace}/` : ''
  return `${apiGroup}${parameters.kind}/${namespace}${parameters.name}`
}

const ingressClassRow = (ingressClass) => [
  ingressClass.metadata?.name ?? '-',
  ingressClass.spec?.controller ?? '-',
  formatIngressClassParameters(ingressClass),
  ingressClass.metadata?.annotations?.['ingressclass.kubernetes.io/is-default-class'] === 'true' ? 'true' : 'false',
  ageFrom(ingressClass.metadata?.creationTimestamp),
]

const formatAPIServiceBackend = (apiService) => {
  const service = apiService.spec?.service
  if (!service?.name) return 'local'
  const namespace = service.namespace ? `${service.namespace}/` : ''
  const port = service.port ? `:${service.port}` : ''
  return `${namespace}${service.name}${port}`
}

const apiServiceRow = (apiService) => {
  const available = apiService.status?.conditions?.find((condition) => condition.type === 'Available')
  return [
    apiService.metadata?.name ?? '-',
    apiService.spec?.group ?? '-',
    apiService.spec?.version ?? '-',
    formatAPIServiceBackend(apiService),
    available?.status ?? 'Unknown',
    available?.reason ?? '-',
    apiService.spec?.groupPriorityMinimum ?? 0,
    apiService.spec?.versionPriority ?? 0,
    apiService.spec?.insecureSkipTLSVerify ? 'true' : 'false',
    ageFrom(apiService.metadata?.creationTimestamp),
  ]
}

const priorityClassRow = (priorityClass) => [
  priorityClass.metadata?.name ?? '-',
  priorityClass.value ?? 0,
  priorityClass.globalDefault ? 'true' : 'false',
  priorityClass.preemptionPolicy ?? '-',
  truncate(priorityClass.description ?? '-', 64),
  ageFrom(priorityClass.metadata?.creationTimestamp),
]

const runtimeClassRow = (runtimeClass) => [
  runtimeClass.metadata?.name ?? '-',
  runtimeClass.handler ?? '-',
  truncate(formatResourceMap(runtimeClass.overhead?.podFixed), 48),
  truncate(formatResourceMap(runtimeClass.scheduling?.nodeSelector), 48),
  runtimeClass.scheduling?.tolerations?.length ?? 0,
  ageFrom(runtimeClass.metadata?.creationTimestamp),
]

const replicationControllerRow = (controller) => [
  controller.metadata?.namespace ?? '-',
  controller.metadata?.name ?? '-',
  controller.spec?.replicas ?? 0,
  controller.status?.replicas ?? 0,
  controller.status?.readyReplicas ?? 0,
  controller.status?.availableReplicas ?? 0,
  ageFrom(controller.metadata?.creationTimestamp),
]

const componentStatusRow = (component) => {
  const healthy = component.conditions?.find((condition) => condition.type === 'Healthy')
    ?? component.conditions?.[0]
  const status = healthy?.status === 'True'
    ? 'Healthy'
    : healthy?.status === 'False'
      ? 'Unhealthy'
      : healthy?.status ?? 'Unknown'
  return [
    component.metadata?.name ?? '-',
    status,
    truncate(healthy?.message ?? '-', 56),
    truncate(healthy?.error ?? '-', 56),
    ageFrom(component.metadata?.creationTimestamp),
  ]
}

const selfSubjectRuleRows = (namespace, review) => {
  const incomplete = review.status?.incomplete ? 'Incomplete' : 'Complete'
  const evaluationError = review.status?.evaluationError || '-'
  const resourceRows = (review.status?.resourceRules ?? []).map((rule) => [
    namespace,
    'Resource',
    formatRuleValues(rule.verbs),
    formatRuleApiGroups(rule.apiGroups),
    formatRuleValues(rule.resources),
    formatRuleValues(rule.resourceNames, '-'),
    '-',
    incomplete,
    truncate(evaluationError, 40),
  ])
  const nonResourceRows = (review.status?.nonResourceRules ?? []).map((rule) => [
    namespace,
    'NonResource',
    formatRuleValues(rule.verbs),
    '-',
    '-',
    '-',
    formatRuleValues(rule.nonResourceURLs),
    incomplete,
    truncate(evaluationError, 40),
  ])
  return [...resourceRows, ...nonResourceRows]
}

const formatLeaseTime = (date) => (
  date ? new Date(date).toISOString().replace('T', ' ').slice(0, 19) : '-'
)

const leaseRow = (lease) => [
  lease.metadata?.namespace ?? '-',
  lease.metadata?.name ?? '-',
  lease.spec?.holderIdentity ?? '-',
  lease.spec?.leaseDurationSeconds ?? 0,
  formatLeaseTime(lease.spec?.acquireTime),
  formatLeaseTime(lease.spec?.renewTime),
  lease.spec?.leaseTransitions ?? 0,
  ageFrom(lease.metadata?.creationTimestamp),
]

const leaseCandidateRow = (candidate) => [
  candidate.metadata?.namespace ?? '-',
  candidate.metadata?.name ?? '-',
  candidate.spec?.leaseName ?? '-',
  candidate.spec?.binaryVersion ?? '-',
  candidate.spec?.emulationVersion ?? '-',
  candidate.spec?.strategy ?? '-',
  formatLeaseTime(candidate.spec?.pingTime),
  formatLeaseTime(candidate.spec?.renewTime),
  ageFrom(candidate.metadata?.creationTimestamp),
]

const csiDriverRow = (driver) => [
  driver.metadata?.name ?? '-',
  driver.spec?.attachRequired ?? true,
  driver.spec?.podInfoOnMount ?? false,
  driver.spec?.storageCapacity ?? false,
  driver.spec?.requiresRepublish ?? false,
  driver.spec?.seLinuxMount ?? false,
  driver.spec?.volumeLifecycleModes?.join(',') || 'Persistent',
  driver.spec?.fsGroupPolicy ?? 'ReadWriteOnceWithFSType',
  ageFrom(driver.metadata?.creationTimestamp),
]

const csiNodeRow = (node) => {
  const drivers = node.spec?.drivers ?? []
  return [
    node.metadata?.name ?? '-',
    drivers.length,
    truncate(drivers.map((driver) => driver.name).filter(Boolean).join(',') || '-', 48),
    truncate(drivers.map((driver) => driver.nodeID).filter(Boolean).join(',') || '-', 48),
    truncate(uniqueValues(drivers.flatMap((driver) => driver.topologyKeys ?? [])).join(',') || '-', 48),
    truncate(drivers
      .map((driver) => driver.allocatable?.count === undefined ? '' : `${driver.name}=${driver.allocatable.count}`)
      .filter(Boolean)
      .join(',') || '-', 48),
    ageFrom(node.metadata?.creationTimestamp),
  ]
}

const volumeAttachmentSource = (attachment) => {
  const source = attachment.spec?.source
  if (source?.persistentVolumeName) return `pv/${source.persistentVolumeName}`
  if (source?.inlineVolumeSpec) return 'inline'
  return '-'
}

const volumeAttachmentRow = (attachment) => [
  attachment.metadata?.name ?? '-',
  attachment.spec?.attacher ?? '-',
  attachment.spec?.nodeName ?? '-',
  volumeAttachmentSource(attachment),
  attachment.status?.attached ? 'true' : 'false',
  truncate(attachment.status?.attachError?.message ?? '-', 48),
  truncate(attachment.status?.detachError?.message ?? '-', 48),
  ageFrom(attachment.metadata?.creationTimestamp),
]

const csiStorageCapacityRow = (capacity) => [
  capacity.metadata?.namespace ?? '-',
  capacity.metadata?.name ?? '-',
  capacity.storageClassName ?? '-',
  capacity.capacity ?? '-',
  capacity.maximumVolumeSize ?? '-',
  truncate(formatLabelSelector(capacity.nodeTopology), 48),
  ageFrom(capacity.metadata?.creationTimestamp),
]

const formatObjectValues = (values) => (
  Object.entries(values ?? {})
    .map(([key, value]) => `${key}=${value}`)
    .join(',') || '-'
)

const volumeAttributesClassRow = (attributesClass) => [
  attributesClass.metadata?.name ?? '-',
  attributesClass.driverName ?? '-',
  truncate(formatObjectValues(attributesClass.parameters), 48),
  Object.keys(attributesClass.parameters ?? {}).length,
  ageFrom(attributesClass.metadata?.creationTimestamp),
]

const snapshotSource = (snapshot) => {
  const source = snapshot.spec?.source
  if (source?.persistentVolumeClaimName) return `pvc/${source.persistentVolumeClaimName}`
  if (source?.volumeSnapshotContentName) return `content/${source.volumeSnapshotContentName}`
  return '-'
}

const snapshotContentSource = (content) => {
  const source = content.spec?.source
  if (source?.snapshotHandle) return `snapshot/${source.snapshotHandle}`
  if (source?.volumeHandle) return `volume/${source.volumeHandle}`
  return '-'
}

const volumeSnapshotClassRow = (snapshotClass) => [
  snapshotClass.metadata?.name ?? '-',
  snapshotClass.driver ?? '-',
  snapshotClass.deletionPolicy ?? '-',
  truncate(formatObjectValues(snapshotClass.parameters), 48),
  ageFrom(snapshotClass.metadata?.creationTimestamp),
]

const volumeSnapshotRow = (snapshot) => [
  snapshot.metadata?.namespace ?? '-',
  snapshot.metadata?.name ?? '-',
  snapshot.spec?.volumeSnapshotClassName ?? '-',
  snapshotSource(snapshot),
  snapshot.status?.boundVolumeSnapshotContentName ?? '-',
  snapshot.status?.readyToUse ? 'true' : 'false',
  snapshot.status?.restoreSize ?? '-',
  truncate(snapshot.status?.error?.message ?? '-', 48),
  ageFrom(snapshot.metadata?.creationTimestamp),
]

const volumeSnapshotContentRow = (content) => [
  content.metadata?.name ?? '-',
  content.spec?.volumeSnapshotClassName ?? '-',
  content.spec?.driver ?? '-',
  content.spec?.deletionPolicy ?? '-',
  snapshotContentSource(content),
  content.spec?.volumeSnapshotRef?.name
    ? `${content.spec.volumeSnapshotRef.namespace ?? '-'}/${content.spec.volumeSnapshotRef.name}`
    : '-',
  content.status?.readyToUse ? 'true' : 'false',
  content.status?.restoreSize ?? '-',
  truncate(content.status?.snapshotHandle ?? content.spec?.source?.snapshotHandle ?? '-', 48),
  ageFrom(content.metadata?.creationTimestamp),
]

const resourceDeviceRequests = (spec) => (
  spec?.devices?.requests ?? []
)

const resourceDeviceClassNames = (requests) => {
  const names = new Set()
  for (const request of requests ?? []) {
    if (request.exactly?.deviceClassName) names.add(request.exactly.deviceClassName)
    for (const subRequest of request.firstAvailable ?? []) {
      if (subRequest.deviceClassName) names.add(subRequest.deviceClassName)
    }
  }
  return [...names].join(',') || '-'
}

const formatDeviceRequestSummary = (requests) => (
  requests
    ?.map((request) => {
      if (request.exactly) {
        return `${request.name ?? '-'}:${request.exactly.deviceClassName ?? '-'}x${request.exactly.count ?? 1}`
      }
      const choices = (request.firstAvailable ?? [])
        .map((item) => `${item.name ?? '-'}:${item.deviceClassName ?? '-'}x${item.count ?? 1}`)
        .join('|')
      return `${request.name ?? '-'}:${choices || '-'}`
    })
    .join(',') || '-'
)

const resourceClaimAllocatedDevices = (claim) => (
  claim.status?.allocation?.devices?.results?.length ?? 0
)

const deviceClassRow = (deviceClass) => [
  deviceClass.metadata?.name ?? '-',
  deviceClass.spec?.extendedResourceName ?? '-',
  deviceClass.spec?.selectors?.length ?? 0,
  deviceClass.spec?.config?.length ?? 0,
  ageFrom(deviceClass.metadata?.creationTimestamp),
]

const resourceClaimRow = (claim) => {
  const requests = resourceDeviceRequests(claim.spec)
  const allocatedDevices = resourceClaimAllocatedDevices(claim)
  return [
    claim.metadata?.namespace ?? '-',
    claim.metadata?.name ?? '-',
    truncate(resourceDeviceClassNames(requests), 48),
    requests.length,
    allocatedDevices > 0 ? 'true' : 'false',
    allocatedDevices,
    claim.status?.reservedFor?.length ?? 0,
    truncate(formatDeviceRequestSummary(requests), 56),
    ageFrom(claim.metadata?.creationTimestamp),
  ]
}

const resourceClaimTemplateRow = (template) => {
  const requests = resourceDeviceRequests(template.spec?.spec)
  return [
    template.metadata?.namespace ?? '-',
    template.metadata?.name ?? '-',
    truncate(resourceDeviceClassNames(requests), 48),
    requests.length,
    truncate(formatDeviceRequestSummary(requests), 56),
    ageFrom(template.metadata?.creationTimestamp),
  ]
}

const resourceSliceRow = (slice) => [
  slice.metadata?.name ?? '-',
  slice.spec?.driver ?? '-',
  slice.spec?.pool?.name ?? '-',
  slice.spec?.nodeName ?? (slice.spec?.allNodes ? 'all' : '-'),
  slice.spec?.devices?.length ?? 0,
  slice.spec?.allNodes ? 'true' : 'false',
  truncate(slice.spec?.devices?.map((device) => device.name).filter(Boolean).join(',') || '-', 56),
  ageFrom(slice.metadata?.creationTimestamp),
]

const deviceTaintRuleRow = (rule) => [
  rule.metadata?.name ?? '-',
  rule.spec?.deviceSelector?.driver ?? '-',
  rule.spec?.deviceSelector?.pool ?? '-',
  rule.spec?.deviceSelector?.deviceClassName ?? '-',
  rule.spec?.deviceSelector?.device ?? '-',
  rule.spec?.deviceSelector?.selectors?.length ?? 0,
  rule.spec?.taint?.key ?? '-',
  rule.spec?.taint?.value ?? '-',
  rule.spec?.taint?.effect ?? '-',
  formatLeaseTime(rule.spec?.taint?.timeAdded),
  ageFrom(rule.metadata?.creationTimestamp),
]

const gatewayCondition = (conditions, type) => {
  const condition = conditions?.find((item) => item.type === type)
  if (!condition) return '-'
  if (condition.status === 'True') return 'True'
  return condition.reason || condition.status || '-'
}

const formatGatewayRef = (ref, defaultKind = 'Gateway') => {
  if (!ref?.name) return '-'
  const kind = ref.kind ?? defaultKind
  const namespace = ref.namespace ? `${ref.namespace}/` : ''
  const section = ref.sectionName ? `#${ref.sectionName}` : ''
  const port = ref.port ? `:${ref.port}` : ''
  return `${kind}/${namespace}${ref.name}${section}${port}`
}

const gatewayAddresses = (gateway) => {
  const addresses = gateway.status?.addresses?.length ? gateway.status.addresses : gateway.spec?.addresses
  return addresses
    ?.map((address) => [address.type, address.value].filter(Boolean).join('/'))
    .filter(Boolean)
    .join(',') || '-'
}

const gatewayListeners = (gateway) => {
  const statusByName = new Map((gateway.status?.listeners ?? [])
    .filter((listener) => listener.name)
    .map((listener) => [listener.name, listener]))
  return (gateway.spec?.listeners ?? gateway.status?.listeners ?? []).map((listener) => {
    const status = listener.name ? statusByName.get(listener.name) : undefined
    const attachedRoutes = status?.attachedRoutes ?? listener.attachedRoutes ?? 0
    return `${listener.name ?? '-'}:${listener.port ?? '-'}/${listener.protocol ?? '-'} routes=${attachedRoutes}`
  }).join(',') || '-'
}

const gatewayAttachedRoutes = (gateway) => (
  (gateway.status?.listeners ?? []).reduce((total, listener) => total + (listener.attachedRoutes ?? 0), 0)
)

const gatewayClassRow = (gatewayClass) => [
  gatewayClass.metadata?.name ?? '-',
  gatewayClass.spec?.controllerName ?? '-',
  gatewayCondition(gatewayClass.status?.conditions, 'Accepted'),
  truncate(formatGatewayRef(gatewayClass.spec?.parametersRef, 'Parameters'), 48),
  ageFrom(gatewayClass.metadata?.creationTimestamp),
]

const gatewayRow = (gateway) => [
  gateway.metadata?.namespace ?? '-',
  gateway.metadata?.name ?? '-',
  gateway.spec?.gatewayClassName ?? '-',
  truncate(gatewayAddresses(gateway), 48),
  truncate(gatewayListeners(gateway), 64),
  gatewayAttachedRoutes(gateway),
  gatewayCondition(gateway.status?.conditions, 'Programmed'),
  ageFrom(gateway.metadata?.creationTimestamp),
]

const routeParentRefs = (route) => (
  route.spec?.parentRefs?.map((ref) => formatGatewayRef(ref)).join(',') || '-'
)

const routeBackendRefs = (route) => (
  route.spec?.rules
    ?.flatMap((rule) => rule.backendRefs ?? [])
    .map((ref) => formatGatewayRef({ ...ref, kind: ref.kind ?? 'Service' }, 'Service'))
    .join(',') || '-'
)

const routeCondition = (route, type) => {
  const values = route.status?.parents
    ?.map((parent) => gatewayCondition(parent.conditions, type))
    .filter((value) => value !== '-')
  if (!values?.length) return '-'
  return values.includes('True') ? 'True' : values.join(',')
}

const gatewayRouteRow = (route) => [
  route.metadata?.namespace ?? '-',
  route.metadata?.name ?? '-',
  truncate(route.spec?.hostnames?.join(',') || '-', 48),
  truncate(routeParentRefs(route), 48),
  route.spec?.rules?.length ?? 0,
  truncate(routeBackendRefs(route), 64),
  routeCondition(route, 'Accepted'),
  routeCondition(route, 'ResolvedRefs'),
  ageFrom(route.metadata?.creationTimestamp),
]

const gatewayL4RouteRow = (route) => [
  route.metadata?.namespace ?? '-',
  route.metadata?.name ?? '-',
  truncate(routeParentRefs(route), 48),
  route.spec?.rules?.length ?? 0,
  truncate(routeBackendRefs(route), 64),
  routeCondition(route, 'Accepted'),
  routeCondition(route, 'ResolvedRefs'),
  ageFrom(route.metadata?.creationTimestamp),
]

const referenceGrantRefs = (refs) => (
  refs
    ?.map((ref) => {
      const namespace = ref.namespace ? `${ref.namespace}/` : ''
      return `${ref.group ?? ''}/${ref.kind ?? '-'}:${namespace}${ref.name ?? '*'}`
    })
    .join(',') || '-'
)

const referenceGrantRow = (grant) => [
  grant.metadata?.namespace ?? '-',
  grant.metadata?.name ?? '-',
  truncate(referenceGrantRefs(grant.spec?.from), 64),
  truncate(referenceGrantRefs(grant.spec?.to), 64),
  ageFrom(grant.metadata?.creationTimestamp),
]

const formatParentReference = (parent) => {
  if (!parent) return '-'
  const group = parent.group ? `${parent.group}/` : ''
  const namespace = parent.namespace ? `${parent.namespace}/` : ''
  return `${group}${parent.resource ?? '-'}/${namespace}${parent.name ?? '-'}`
}

const ipAddressRow = (address) => [
  address.metadata?.name ?? '-',
  truncate(formatParentReference(address.spec?.parentRef), 56),
  address.spec?.parentRef?.group ?? '-',
  address.spec?.parentRef?.resource ?? '-',
  address.spec?.parentRef?.namespace ?? '-',
  address.spec?.parentRef?.name ?? '-',
  ageFrom(address.metadata?.creationTimestamp),
]

const serviceCIDRReady = (cidr) => (
  cidr.status?.conditions?.find((condition) => condition.type === 'Ready')?.status ?? '-'
)

const serviceCIDRRow = (cidr) => [
  cidr.metadata?.name ?? '-',
  truncate(cidr.spec?.cidrs?.join(',') || '-', 48),
  cidr.spec?.cidrs?.length ?? 0,
  serviceCIDRReady(cidr),
  cidr.status?.conditions?.length ?? 0,
  ageFrom(cidr.metadata?.creationTimestamp),
]

const splitDiscoveryGroupVersion = (groupVersion) => {
  const slashIndex = String(groupVersion ?? '').lastIndexOf('/')
  if (slashIndex < 0) {
    return { apiGroup: '', version: groupVersion || '-' }
  }
  return {
    apiGroup: groupVersion.slice(0, slashIndex),
    version: groupVersion.slice(slashIndex + 1) || '-',
  }
}

const apiResourceRowsFromList = (list, fallbackApiGroup, fallbackVersion, preferredGroupVersion) => {
  const groupVersion = list?.groupVersion || (fallbackApiGroup ? `${fallbackApiGroup}/${fallbackVersion}` : fallbackVersion)
  const parsed = splitDiscoveryGroupVersion(groupVersion)
  return (list?.resources ?? []).map((resource) => {
    const apiGroup = resource.group ?? parsed.apiGroup ?? fallbackApiGroup
    const version = resource.version ?? parsed.version ?? fallbackVersion
    const resolvedGroupVersion = apiGroup && version ? `${apiGroup}/${version}` : version
    return [
      resource.name ?? '-',
      resource.kind ?? '-',
      apiGroup || 'core',
      version || '-',
      resource.namespaced ? 'Namespaced' : 'Cluster',
      truncate(formatRuleValues(resource.verbs, '-'), 56),
      formatRuleValues(resource.shortNames, '-'),
      preferredGroupVersion === (resolvedGroupVersion || groupVersion) ? 'yes' : 'no',
      resource.name?.includes('/') ? 'yes' : 'no',
    ]
  })
}

const apiVersionsFrom = (response) => response?.body ?? response?.response ?? response ?? {}

const formatDiscoveryServerAddresses = (addresses) => (
  (addresses ?? []).map((address) => {
    const cidr = address.clientCIDR || '*'
    const server = address.serverAddress || '-'
    return `${cidr}->${server}`
  }).join(',') || '-'
)

const apiGroupRowsFromCoreVersions = (response) => {
  const versions = apiVersionsFrom(response)
  const apiVersions = (versions.versions ?? []).filter(Boolean)
  const preferredVersion = apiVersions.includes('v1') ? 'v1' : apiVersions[0] ?? '-'
  const serverAddresses = formatDiscoveryServerAddresses(versions.serverAddressByClientCIDRs)
  return [[
    'core',
    preferredVersion,
    truncate(apiVersions.join(',') || '-', 56),
    apiVersions.length,
    versions.kind || 'APIVersions',
    versions.serverAddressByClientCIDRs?.length ?? 0,
    truncate(serverAddresses, 72),
  ]]
}

const apiGroupRowsFromList = (response) => {
  const list = apiVersionsFrom(response)
  return (list.groups ?? []).map((group) => {
    const versions = (group.versions ?? []).map((version) => version.groupVersion).filter(Boolean)
    const serverAddresses = formatDiscoveryServerAddresses(group.serverAddressByClientCIDRs)
    return [
      group.name || '-',
      group.preferredVersion?.groupVersion || '-',
      truncate(versions.join(',') || '-', 56),
      versions.length,
      group.kind || 'APIGroup',
      group.serverAddressByClientCIDRs?.length ?? 0,
      truncate(serverAddresses, 72),
    ]
  })
}

const versionInfoFrom = (response) => response?.body ?? response?.response ?? response ?? {}

const formatVersionPair = (major, minor) => {
  if (!major && !minor) return '-'
  return `${major || '?'}.${minor || '?'}`
}

const serverVersionRow = (response) => {
  const version = versionInfoFrom(response)
  return [
    version.gitVersion || `${version.major || '?'}.${version.minor || '?'}`,
    version.major || '-',
    version.minor || '-',
    version.platform || '-',
    version.buildDate || '-',
    truncate(version.gitCommit || '-', 32),
    version.gitTreeState || '-',
    version.goVersion || '-',
    version.compiler || '-',
    formatVersionPair(version.emulationMajor, version.emulationMinor),
    formatVersionPair(version.minCompatibilityMajor, version.minCompatibilityMinor),
  ]
}

const jsonPayloadFrom = (response) => {
  const value = response?.body ?? response?.response ?? response ?? {}
  if (typeof value === 'string') {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

const stringArrayValue = (value) => (
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []
)

const openIDConfigurationRow = (configurationResponse, keysetResponse) => {
  const configuration = jsonPayloadFrom(configurationResponse)
  const keyset = keysetResponse ? jsonPayloadFrom(keysetResponse) : {}
  const keys = Array.isArray(keyset.keys)
    ? keyset.keys.filter((key) => key && typeof key === 'object' && !Array.isArray(key))
    : []
  const unique = (values) => [...new Set(values.filter(Boolean))]

  return [
    truncate(configuration.issuer || '-', 48),
    truncate(configuration.jwks_uri || '-', 56),
    truncate(formatRuleValues(stringArrayValue(configuration.id_token_signing_alg_values_supported), '-'), 32),
    truncate(formatRuleValues(stringArrayValue(configuration.subject_types_supported), '-'), 24),
    keys.length,
    truncate(formatRuleValues(keys.map((key) => String(key.kid ?? '')).filter(Boolean), '-'), 40),
    formatRuleValues(unique(keys.map((key) => String(key.kty ?? ''))), '-'),
    formatRuleValues(unique(keys.map((key) => String(key.use ?? ''))), '-'),
    truncate(formatRuleValues(stringArrayValue(configuration.claims_supported), '-'), 56),
  ]
}

const apiServerHealthRow = (name, path, result) => {
  if (result.status === 'fulfilled') {
    return [
      name,
      path,
      result.value ? 'Healthy' : 'Unhealthy',
      result.value ? 'yes' : 'no',
      result.value ? 'ok' : 'check returned false',
    ]
  }

  return [
    name,
    path,
    'Error',
    'no',
    truncate(result.reason instanceof Error ? result.reason.message : String(result.reason), 72),
  ]
}

const apiServerHealthRows = async (health) => {
  const healthz = health.healthz.bind(health)
  const checks = [
    { name: 'readyz', path: '/readyz', run: () => health.readyz({}) },
    { name: 'livez', path: '/livez', run: () => health.livez({}) },
    { name: 'healthz', path: '/healthz', run: () => healthz({}) },
  ]
  const results = await Promise.allSettled(checks.map((check) => check.run()))
  return checks.map((check, index) => apiServerHealthRow(check.name, check.path, results[index]))
}

const formatUserExtra = (extra) => {
  const entries = Object.entries(extra ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, values]) => `${key}=${formatRuleValues(values, '-')}`)
  return entries.join('; ') || '-'
}

const selfSubjectReviewRow = (review) => {
  const userInfo = review.status?.userInfo ?? {}
  const groups = userInfo.groups?.filter(Boolean) ?? []
  const extraKeys = Object.keys(userInfo.extra ?? {}).sort()

  return [
    userInfo.username ?? '-',
    userInfo.uid ?? '-',
    formatRuleValues(groups, '-'),
    groups.length,
    extraKeys.join(',') || '-',
    truncate(formatUserExtra(userInfo.extra), 72),
  ]
}

const ACCESS_REVIEW_CLUSTER_CHECKS = [
  { name: 'list nodes', scope: 'Cluster', verb: 'list', resource: 'nodes' },
  { name: 'list namespaces', scope: 'Cluster', verb: 'list', resource: 'namespaces' },
  { name: 'list persistentvolumes', scope: 'Cluster', verb: 'list', resource: 'persistentvolumes' },
  { name: 'list storageclasses', scope: 'Cluster', verb: 'list', group: 'storage.k8s.io', resource: 'storageclasses' },
  { name: 'list clusterroles', scope: 'Cluster', verb: 'list', group: 'rbac.authorization.k8s.io', resource: 'clusterroles' },
  { name: 'list crds', scope: 'Cluster', verb: 'list', group: 'apiextensions.k8s.io', resource: 'customresourcedefinitions' },
]

const ACCESS_REVIEW_NAMESPACED_CHECKS = [
  { name: 'list pods', verb: 'list', resource: 'pods' },
  { name: 'delete pods', verb: 'delete', resource: 'pods' },
  { name: 'get pod logs', verb: 'get', resource: 'pods', subresource: 'log' },
  { name: 'exec into pods', verb: 'create', resource: 'pods', subresource: 'exec' },
  { name: 'list deployments', verb: 'list', group: 'apps', resource: 'deployments' },
  { name: 'scale deployments', verb: 'update', group: 'apps', resource: 'deployments', subresource: 'scale' },
  { name: 'list services', verb: 'list', resource: 'services' },
  { name: 'get secrets', verb: 'get', resource: 'secrets' },
  { name: 'list configmaps', verb: 'list', resource: 'configmaps' },
  { name: 'list events', verb: 'list', group: 'events.k8s.io', resource: 'events' },
]

const ACCESS_REVIEW_NON_RESOURCE_CHECKS = [
  { name: 'get /readyz', scope: 'NonResource', verb: 'get', path: '/readyz' },
  { name: 'get /livez', scope: 'NonResource', verb: 'get', path: '/livez' },
  { name: 'get /healthz', scope: 'NonResource', verb: 'get', path: '/healthz' },
]

const accessReviewChecks = (namespaces) => [
  ...ACCESS_REVIEW_CLUSTER_CHECKS,
  ...ACCESS_REVIEW_NON_RESOURCE_CHECKS,
  ...namespaces.flatMap((namespace) => (
    ACCESS_REVIEW_NAMESPACED_CHECKS.map((check) => ({
      ...check,
      name: `${namespace}/${check.name}`,
      namespace,
      scope: 'Namespaced',
    }))
  )),
]

const accessReviewBody = (check) => {
  if (check.path) {
    return {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        nonResourceAttributes: {
          path: check.path,
          verb: check.verb,
        },
      },
    }
  }

  return {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    spec: {
      resourceAttributes: {
        namespace: check.namespace,
        verb: check.verb,
        group: check.group,
        resource: check.resource,
        subresource: check.subresource,
        name: check.resourceName,
      },
    },
  }
}

const accessReviewRow = (check, result) => {
  if (result.status === 'rejected') {
    return [
      check.namespace ?? '-',
      check.scope,
      check.verb,
      check.group || (check.path ? '-' : 'core'),
      check.resource ?? '-',
      check.subresource ?? '-',
      check.path ?? '-',
      'Error',
      '-',
      truncate(result.reason instanceof Error ? result.reason.message : String(result.reason), 72),
    ]
  }

  const status = result.value.status ?? {}
  const allowed = Boolean(status.allowed)
  const denied = Boolean(status.denied)
  return [
    check.namespace ?? '-',
    check.scope,
    check.verb,
    check.group || (check.path ? '-' : 'core'),
    check.resource ?? '-',
    check.subresource ?? '-',
    check.path ?? '-',
    denied ? 'Denied' : allowed ? 'Allowed' : 'NoOpinion',
    truncate(status.reason || '-', 48),
    truncate(status.evaluationError || '-', 48),
  ]
}

const accessReviewRows = async (authorizationApi, namespaces) => {
  const checks = accessReviewChecks(namespaces)
  const results = await Promise.allSettled(checks.map((check) => (
    authorizationApi.createSelfSubjectAccessReview({ body: accessReviewBody(check) })
  )))
  return checks.map((check, index) => accessReviewRow(check, results[index]))
}

const normalizedApiGroup = (group) => {
  if (group === undefined) return undefined
  const value = String(group).trim()
  if (!value || value === 'core') return undefined
  return value
}

const canICheckFromOptions = (options) => {
  const verb = String(options.verb ?? '').trim().toLowerCase()
  if (options.nonResourceUrl !== undefined) {
    return {
      scope: 'NonResource',
      verb,
      path: String(options.nonResourceUrl).trim(),
    }
  }

  const namespace = namespaceArg(options)
  return {
    namespace,
    scope: namespace ? 'Namespaced' : 'Cluster',
    verb,
    group: normalizedApiGroup(options.apiGroup),
    resource: options.resource,
    subresource: options.subresource ? String(options.subresource).trim() : undefined,
    resourceName: options.resourceName ?? options.name,
  }
}

const canIRow = (check, review) => {
  const status = review.status ?? {}
  const allowed = Boolean(status.allowed)
  const denied = Boolean(status.denied)
  return [
    check.namespace ?? '-',
    check.scope,
    check.verb,
    check.group || (check.path ? '-' : 'core'),
    check.resource ?? '-',
    check.subresource ?? '-',
    check.resourceName ?? '-',
    check.path ?? '-',
    denied ? 'Denied' : allowed ? 'Allowed' : 'NoOpinion',
    truncate(status.reason || '-', 72),
    truncate(status.evaluationError || '-', 72),
  ]
}

export const loadCanITable = async (kubeConfig, options) => {
  const authorizationApi = kubeConfig.makeApiClient(AuthorizationV1Api)
  const check = canICheckFromOptions(options)
  const review = await authorizationApi.createSelfSubjectAccessReview({
    body: accessReviewBody(check),
  })

  return tableResult(
    ['NAMESPACE', 'SCOPE', 'VERB', 'API-GROUP', 'RESOURCE', 'SUBRESOURCE', 'NAME', 'PATH', 'STATUS', 'REASON', 'ERROR'],
    [canIRow(check, review)],
  )
}

const namespaceArg = (options) => (
  options.namespace && options.namespace !== 'all' ? options.namespace : undefined
)

const truncate = (value, maxLength = 80) => {
  const text = String(value ?? '')
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

export const renderTable = (headers, rows) => {
  const widths = headers.map((header, idx) => {
    const maxRowWidth = rows.reduce((max, row) => Math.max(max, String(row[idx] ?? '').length), 0)
    return Math.max(header.length, maxRowWidth)
  })

  const formatRow = (columns) => columns
    .map((column, idx) => String(column ?? '').padEnd(widths[idx]))
    .join('  ')

  const divider = widths.map((width) => '-'.repeat(width)).join('  ')
  return [formatRow(headers), divider, ...rows.map(formatRow)].join('\n')
}

const kubeConfigContextsTable = (kubeConfig) => {
  const currentContext = kubeConfig.getCurrentContext?.()
  const contexts = typeof kubeConfig.getContexts === 'function' ? kubeConfig.getContexts() : []
  const clusters = new Map((typeof kubeConfig.getClusters === 'function' ? kubeConfig.getClusters() : [])
    .map((cluster) => [cluster.name, cluster]))

  return tableResult(
    ['CURRENT', 'NAME', 'CLUSTER', 'USER', 'NAMESPACE', 'SERVER'],
    contexts.map((context) => {
      const cluster = clusters.get(context.cluster)
      return [
        context.name === currentContext ? '*' : '',
        context.name ?? '-',
        context.cluster ?? '-',
        context.user ?? '-',
        context.namespace ?? '-',
        truncate(cluster?.server ?? '-', 72),
      ]
    }),
  )
}

const containerStatusState = (status) => {
  const state = status?.state ?? {}
  if (state.running) return 'Running'
  if (state.waiting) return `Waiting:${state.waiting.reason ?? '-'}`
  if (state.terminated) {
    const reason = state.terminated.reason ?? `ExitCode:${state.terminated.exitCode ?? '-'}`
    return `Terminated:${reason}`
  }
  return '-'
}

const podContainerRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const statusGroups = new Map([
    ['container', pod.status?.containerStatuses ?? []],
    ['init', pod.status?.initContainerStatuses ?? []],
    ['ephemeral', pod.status?.ephemeralContainerStatuses ?? []],
  ])
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => {
    const statusesByName = new Map(statusGroups.get(type).map((status) => [status.name, status]))
    return containers.map((container) => {
      const status = statusesByName.get(container.name)
      const ready = status?.ready
      return [
        podNamespace,
        podName,
        type,
        container.name ?? '-',
        truncate(container.image ?? status?.image ?? '-', 64),
        ready === undefined ? '-' : ready ? 'true' : 'false',
        status?.restartCount ?? 0,
        truncate(containerStatusState(status), 48),
        age,
      ]
    })
  })
}

const containerStateDetails = (state = {}) => {
  if (state.running) {
    return {
      state: 'Running',
      reason: '-',
      exitCode: '-',
      signal: '-',
      startedAt: ageFrom(state.running.startedAt),
      finishedAt: '-',
    }
  }

  if (state.waiting) {
    return {
      state: 'Waiting',
      reason: state.waiting.reason ?? '-',
      exitCode: '-',
      signal: '-',
      startedAt: '-',
      finishedAt: '-',
    }
  }

  if (state.terminated) {
    return {
      state: 'Terminated',
      reason: state.terminated.reason ?? '-',
      exitCode: state.terminated.exitCode ?? '-',
      signal: state.terminated.signal ?? '-',
      startedAt: ageFrom(state.terminated.startedAt),
      finishedAt: ageFrom(state.terminated.finishedAt),
    }
  }

  return {
    state: '-',
    reason: '-',
    exitCode: '-',
    signal: '-',
    startedAt: '-',
    finishedAt: '-',
  }
}

const podContainerStateRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const podAge = ageFrom(pod.metadata?.creationTimestamp)
  const statusGroups = [
    ['container', pod.status?.containerStatuses ?? []],
    ['init', pod.status?.initContainerStatuses ?? []],
    ['ephemeral', pod.status?.ephemeralContainerStatuses ?? []],
  ]

  return statusGroups.flatMap(([type, statuses]) => (
    statuses.map((status) => {
      const current = containerStateDetails(status.state)
      const last = containerStateDetails(status.lastState)
      return [
        podNamespace,
        podName,
        type,
        status.name ?? '-',
        status.ready === undefined ? '-' : status.ready ? 'true' : 'false',
        status.started === undefined ? '-' : status.started ? 'true' : 'false',
        status.restartCount ?? 0,
        current.state,
        truncate(current.reason, 48),
        current.exitCode,
        current.signal,
        current.startedAt,
        current.finishedAt,
        last.state,
        truncate(last.reason, 48),
        last.exitCode,
        last.finishedAt,
        truncate(status.imageID ?? '-', 72),
        truncate(status.containerID ?? '-', 72),
        podAge,
      ]
    })
  ))
}

const coreContainerResourceNames = new Set(['cpu', 'memory', 'ephemeral-storage'])

const resourceQuantity = (values, name) => values?.[name] ?? '-'

const extraResourceSummary = (resources) => {
  const requests = resources?.requests ?? {}
  const limits = resources?.limits ?? {}
  const names = new Set([
    ...Object.keys(requests),
    ...Object.keys(limits),
  ])
  const entries = Array.from(names)
    .filter((name) => !coreContainerResourceNames.has(name))
    .sort()
    .flatMap((name) => [
      requests[name] === undefined ? null : `request:${name}=${requests[name]}`,
      limits[name] === undefined ? null : `limit:${name}=${limits[name]}`,
    ])
    .filter(Boolean)

  return entries.length ? truncate(entries.join(','), 96) : '-'
}

const podContainerResourceRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.map((container) => {
      const resources = container.resources ?? {}
      const requests = resources.requests ?? {}
      const limits = resources.limits ?? {}
      return [
        podNamespace,
        podName,
        type,
        container.name ?? '-',
        truncate(container.image ?? '-', 56),
        resourceQuantity(requests, 'cpu'),
        resourceQuantity(limits, 'cpu'),
        resourceQuantity(requests, 'memory'),
        resourceQuantity(limits, 'memory'),
        resourceQuantity(requests, 'ephemeral-storage'),
        resourceQuantity(limits, 'ephemeral-storage'),
        extraResourceSummary(resources),
        age,
      ]
    })
  ))
}

const podImageRows = (pods, namespace) => {
  const byImage = new Map()

  for (const pod of pods) {
    const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
    const podName = pod.metadata?.name ?? '-'
    const statusGroups = new Map([
      ['container', pod.status?.containerStatuses ?? []],
      ['init', pod.status?.initContainerStatuses ?? []],
      ['ephemeral', pod.status?.ephemeralContainerStatuses ?? []],
    ])
    const specGroups = [
      ['container', pod.spec?.containers ?? []],
      ['init', pod.spec?.initContainers ?? []],
      ['ephemeral', pod.spec?.ephemeralContainers ?? []],
    ]

    for (const [type, containers] of specGroups) {
      const statusesByName = new Map(statusGroups.get(type).map((status) => [status.name, status]))
      for (const container of containers) {
        const status = statusesByName.get(container.name)
        const image = container.image ?? status?.image ?? '-'
        const key = `${podNamespace}\0${image}`
        const existing = byImage.get(key) ?? {
          namespace: podNamespace,
          image,
          pods: new Set(),
          containers: 0,
          ready: 0,
          restarts: 0,
          states: new Set(),
        }
        existing.pods.add(podName)
        existing.containers += 1
        existing.ready += status?.ready ? 1 : 0
        existing.restarts += status?.restartCount ?? 0
        existing.states.add(containerStatusState(status))
        byImage.set(key, existing)
      }
    }
  }

  return Array.from(byImage.values())
    .sort((left, right) => (
      left.namespace.localeCompare(right.namespace)
        || left.image.localeCompare(right.image)
    ))
    .map((entry) => {
      const states = Array.from(entry.states).filter((state) => state && state !== '-')
      return [
        entry.namespace,
        truncate(entry.image, 72),
        entry.pods.size,
        entry.containers,
        `${entry.ready}/${entry.containers}`,
        entry.restarts,
        truncate(states.length ? states.join(',') : '-', 64),
      ]
    })
}

const probePort = (value) => (
  typeof value === 'object' && value !== null ? value.strVal ?? value.intVal ?? '-' : value ?? '-'
)

const probeHandler = (probe) => {
  if (!probe) return '-'
  if (probe.httpGet) {
    const scheme = probe.httpGet.scheme ?? 'HTTP'
    const host = probe.httpGet.host ? `${probe.httpGet.host}` : ''
    return `${scheme} ${host}${probe.httpGet.path ?? '/'}:${probePort(probe.httpGet.port)}`
  }
  if (probe.tcpSocket) {
    return `TCP :${probePort(probe.tcpSocket.port)}`
  }
  if (probe.grpc) {
    const service = probe.grpc.service ? `/${probe.grpc.service}` : ''
    return `gRPC :${probe.grpc.port ?? '-'}${service}`
  }
  if (probe.exec) {
    return `exec ${truncate((probe.exec.command ?? []).join(' '), 56)}`
  }
  return 'custom'
}

const probeSummary = (probe) => {
  if (!probe) return '-'
  const timing = [
    `d=${probe.initialDelaySeconds ?? 0}s`,
    `p=${probe.periodSeconds ?? 10}s`,
    `t=${probe.timeoutSeconds ?? 1}s`,
    `f=${probe.failureThreshold ?? 3}`,
  ].join(' ')
  return truncate(`${probeHandler(probe)} ${timing}`, 88)
}

const podProbeRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.map((container) => [
      podNamespace,
      podName,
      type,
      container.name ?? '-',
      truncate(container.image ?? '-', 56),
      probeSummary(container.livenessProbe),
      probeSummary(container.readinessProbe),
      probeSummary(container.startupProbe),
      age,
    ])
  ))
}

const podPortRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.flatMap((container) => (
      (container.ports ?? []).map((port) => [
        podNamespace,
        podName,
        type,
        container.name ?? '-',
        port.name ?? '-',
        port.protocol ?? 'TCP',
        port.containerPort ?? '-',
        port.hostPort ?? '-',
        port.hostIP ?? '-',
        truncate(container.image ?? '-', 56),
        age,
      ])
    ))
  ))
}

const volumeSourceSummary = (volume) => {
  if (!volume) return ['-', '-']
  if (volume.configMap) return ['configMap', volume.configMap.name ?? '-']
  if (volume.secret) return ['secret', volume.secret.secretName ?? '-']
  if (volume.persistentVolumeClaim) return ['persistentVolumeClaim', volume.persistentVolumeClaim.claimName ?? '-']
  if (volume.projected) return ['projected', `${volume.projected.sources?.length ?? 0} sources`]
  if (volume.emptyDir) return ['emptyDir', volume.emptyDir.medium || 'node']
  if (volume.hostPath) return ['hostPath', volume.hostPath.path ?? '-']
  if (volume.downwardAPI) return ['downwardAPI', `${volume.downwardAPI.items?.length ?? 0} items`]
  if (volume.csi) return ['csi', volume.csi.driver ?? '-']
  if (volume.ephemeral) return ['ephemeral', volume.ephemeral.volumeClaimTemplate?.metadata?.name ?? '-']
  if (volume.nfs) return ['nfs', `${volume.nfs.server ?? '-'}:${volume.nfs.path ?? '-'}`]

  const entry = Object.entries(volume).find(([key, value]) => key !== 'name' && value)
  return entry ? [entry[0], '-'] : ['-', '-']
}

const podVolumeMountRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const volumesByName = new Map((pod.spec?.volumes ?? []).map((volume) => [volume.name, volume]))
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.flatMap((container) => (
      (container.volumeMounts ?? []).map((mount) => {
        const [volumeType, source] = volumeSourceSummary(volumesByName.get(mount.name))
        return [
          podNamespace,
          podName,
          type,
          container.name ?? '-',
          mount.name ?? '-',
          mount.mountPath ?? '-',
          mount.readOnly ? 'true' : 'false',
          mount.subPath ?? mount.subPathExpr ?? '-',
          volumeType,
          truncate(source, 64),
          age,
        ]
      })
    ))
  ))
}

const optionalFlag = (value) => value ? 'true' : 'false'

const projectedSourceSummary = (source) => {
  if (source.serviceAccountToken) return 'serviceAccountToken'
  if (source.configMap) return `configMap:${source.configMap.name ?? '-'}`
  if (source.secret) return `secret:${source.secret.name ?? '-'}`
  if (source.downwardAPI) return 'downwardAPI'
  if (source.clusterTrustBundle) return `clusterTrustBundle:${source.clusterTrustBundle.name ?? source.clusterTrustBundle.signerName ?? '-'}`

  const entry = Object.entries(source ?? {}).find(([, value]) => value)
  return entry ? entry[0] : '-'
}

const volumeDetail = (volume) => {
  if (!volume) return ['-', '-', '-', '-']
  if (volume.configMap) {
    return [
      'configMap',
      volume.configMap.name ?? '-',
      optionalFlag(volume.configMap.optional),
      `items=${volume.configMap.items?.length ?? 0}`,
    ]
  }
  if (volume.secret) {
    return [
      'secret',
      volume.secret.secretName ?? '-',
      optionalFlag(volume.secret.optional),
      `items=${volume.secret.items?.length ?? 0}`,
    ]
  }
  if (volume.persistentVolumeClaim) {
    return [
      'persistentVolumeClaim',
      volume.persistentVolumeClaim.claimName ?? '-',
      '-',
      `readOnly=${volume.persistentVolumeClaim.readOnly ? 'true' : 'false'}`,
    ]
  }
  if (volume.projected) {
    const sources = (volume.projected.sources ?? []).map(projectedSourceSummary)
    return [
      'projected',
      `${sources.length} sources`,
      '-',
      sources.length ? sources.join(',') : '-',
    ]
  }
  if (volume.emptyDir) {
    return [
      'emptyDir',
      volume.emptyDir.medium || 'node',
      '-',
      volume.emptyDir.sizeLimit ? `sizeLimit=${volume.emptyDir.sizeLimit}` : '-',
    ]
  }
  if (volume.hostPath) {
    return ['hostPath', volume.hostPath.path ?? '-', '-', volume.hostPath.type ?? '-']
  }
  if (volume.downwardAPI) {
    return ['downwardAPI', `${volume.downwardAPI.items?.length ?? 0} items`, '-', `items=${volume.downwardAPI.items?.length ?? 0}`]
  }
  if (volume.csi) {
    const details = [
      `readOnly=${volume.csi.readOnly ? 'true' : 'false'}`,
      volume.csi.fsType ? `fsType=${volume.csi.fsType}` : '',
    ].filter(Boolean).join(' ')
    return ['csi', volume.csi.driver ?? '-', '-', details || '-']
  }
  if (volume.ephemeral) {
    const template = volume.ephemeral.volumeClaimTemplate
    return [
      'ephemeral',
      template?.metadata?.name ?? '-',
      '-',
      template?.spec?.storageClassName ? `storageClass=${template.spec.storageClassName}` : '-',
    ]
  }
  if (volume.nfs) {
    return [
      'nfs',
      `${volume.nfs.server ?? '-'}:${volume.nfs.path ?? '-'}`,
      '-',
      `readOnly=${volume.nfs.readOnly ? 'true' : 'false'}`,
    ]
  }

  const entry = Object.entries(volume).find(([key, value]) => key !== 'name' && value)
  return entry ? [entry[0], '-', '-', '-'] : ['-', '-', '-', '-']
}

const volumeUsageSummary = (volumeName, specGroups) => {
  const uses = []
  for (const [type, containers] of specGroups) {
    for (const container of containers) {
      for (const mount of container.volumeMounts ?? []) {
        if (mount.name === volumeName) {
          uses.push(`${type}/${container.name ?? '-'}:${mount.mountPath ?? '-'}`)
        }
      }
      for (const device of container.volumeDevices ?? []) {
        if (device.name === volumeName) {
          uses.push(`${type}/${container.name ?? '-'}:${device.devicePath ?? '-'}`)
        }
      }
    }
  }
  return uses.length ? truncate(uses.join(','), 96) : '-'
}

const podVolumeRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return (pod.spec?.volumes ?? []).map((volume) => {
    const [type, source, optional, details] = volumeDetail(volume)
    return [
      podNamespace,
      podName,
      volume.name ?? '-',
      type,
      truncate(source, 64),
      optional,
      truncate(details, 96),
      volumeUsageSummary(volume.name, specGroups),
      age,
    ]
  })
}

const envValueSourceSummary = (envVar) => {
  const valueFrom = envVar?.valueFrom
  if (valueFrom?.configMapKeyRef) {
    const source = valueFrom.configMapKeyRef
    return ['configMapKeyRef', source.name ?? '-', source.key ?? '-', optionalFlag(source.optional)]
  }
  if (valueFrom?.secretKeyRef) {
    const source = valueFrom.secretKeyRef
    return ['secretKeyRef', source.name ?? '-', source.key ?? '-', optionalFlag(source.optional)]
  }
  if (valueFrom?.fieldRef) {
    return ['fieldRef', valueFrom.fieldRef.fieldPath ?? '-', '-', '-']
  }
  if (valueFrom?.resourceFieldRef) {
    const source = valueFrom.resourceFieldRef
    return ['resourceFieldRef', source.resource ?? '-', source.containerName ?? '-', '-']
  }
  if (valueFrom) return ['valueFrom', '-', '-', '-']

  const hasValue = Object.prototype.hasOwnProperty.call(envVar ?? {}, 'value')
  return ['literal', hasValue && envVar.value !== '' ? '<set>' : '<empty>', '-', '-']
}

const envFromSourceSummary = (source) => {
  if (source?.configMapRef) {
    return ['envFrom:configMapRef', source.configMapRef.name ?? '-', source.prefix ?? '-', optionalFlag(source.configMapRef.optional)]
  }
  if (source?.secretRef) {
    return ['envFrom:secretRef', source.secretRef.name ?? '-', source.prefix ?? '-', optionalFlag(source.secretRef.optional)]
  }
  return ['envFrom', '-', source?.prefix ?? '-', '-']
}

const podEnvRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.flatMap((container) => {
      const envRows = (container.env ?? []).map((envVar) => {
        const [sourceType, source, key, optional] = envValueSourceSummary(envVar)
        return [
          podNamespace,
          podName,
          type,
          container.name ?? '-',
          envVar.name ?? '-',
          sourceType,
          truncate(source, 64),
          truncate(key, 64),
          optional,
          age,
        ]
      })
      const envFromRows = (container.envFrom ?? []).map((source) => {
        const [sourceType, sourceName, prefix, optional] = envFromSourceSummary(source)
        return [
          podNamespace,
          podName,
          type,
          container.name ?? '-',
          source?.prefix ? `${source.prefix}*` : '*',
          sourceType,
          truncate(sourceName, 64),
          truncate(prefix, 64),
          optional,
          age,
        ]
      })
      return [...envRows, ...envFromRows]
    })
  ))
}

const podConditionRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const podAge = ageFrom(pod.metadata?.creationTimestamp)

  return (pod.status?.conditions ?? []).map((condition) => [
    podNamespace,
    podName,
    condition.type ?? '-',
    condition.status ?? '-',
    condition.reason ?? '-',
    truncate(condition.message ?? '-', 96),
    ageFrom(condition.lastTransitionTime ?? condition.lastProbeTime),
    podAge,
  ])
}

const podReadinessGateRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const podAge = ageFrom(pod.metadata?.creationTimestamp)
  const conditions = new Map(
    (pod.status?.conditions ?? [])
      .filter((condition) => condition.type)
      .map((condition) => [condition.type, condition]),
  )

  return (pod.spec?.readinessGates ?? []).map((gate) => {
    const conditionType = gate.conditionType ?? '-'
    const condition = conditions.get(conditionType)
    return [
      podNamespace,
      podName,
      conditionType,
      condition?.status ?? 'False',
      condition?.reason ?? (condition ? '-' : 'NotReported'),
      truncate(condition?.message ?? '-', 96),
      ageFrom(condition?.lastTransitionTime ?? condition?.lastProbeTime),
      podAge,
    ]
  })
}

const listSummary = (values, maxLength = 96) => {
  const entries = (values ?? [])
    .filter((value) => value !== undefined && value !== null && String(value) !== '')
    .map((value) => String(value))
  return entries.length ? truncate(entries.join(','), maxLength) : '-'
}

const dnsOptionSummary = (options) => (
  listSummary((options ?? []).map((option) => (
    option.value === undefined ? option.name : `${option.name ?? '-'}=${option.value}`
  )))
)

const hostAliasSummary = (hostAliases) => {
  const entries = (hostAliases ?? []).flatMap((alias) => (
    (alias.hostnames ?? []).map((hostname) => `${alias.ip ?? '-'}:${hostname}`)
  ))
  return listSummary(entries)
}

const podIpSummary = (status) => {
  const ips = status?.podIPs?.map((podIp) => podIp.ip) ?? []
  return listSummary(ips.length ? ips : [status?.podIP])
}

const podNetworkRows = (pod, namespace) => {
  const spec = pod.spec ?? {}
  return [[
    pod.metadata?.namespace ?? namespace ?? '-',
    pod.metadata?.name ?? '-',
    spec.hostname ?? '-',
    spec.subdomain ?? '-',
    spec.setHostnameAsFQDN === undefined ? '-' : spec.setHostnameAsFQDN ? 'true' : 'false',
    spec.dnsPolicy ?? '-',
    listSummary(spec.dnsConfig?.nameservers),
    listSummary(spec.dnsConfig?.searches),
    dnsOptionSummary(spec.dnsConfig?.options),
    hostAliasSummary(spec.hostAliases),
    spec.hostNetwork ? 'true' : 'false',
    podIpSummary(pod.status),
    ageFrom(pod.metadata?.creationTimestamp),
  ]]
}

const podPrioritySummary = (spec) => {
  if (spec?.priorityClassName) return `${spec.priorityClassName}:${spec.priority ?? '-'}`
  return spec?.priority ?? '-'
}

const tolerationSummary = (toleration) => {
  const key = toleration.key ?? '*'
  const operator = toleration.operator ?? (toleration.value === undefined ? 'Exists' : 'Equal')
  const value = operator === 'Exists' ? '' : `=${toleration.value ?? ''}`
  const effect = toleration.effect ? `:${toleration.effect}` : ''
  const seconds = toleration.tolerationSeconds === undefined ? '' : `:${toleration.tolerationSeconds}s`
  return `${key}${value}${effect}${seconds}`
}

const podTolerationsSummary = (tolerations) => {
  const values = (tolerations ?? []).map(tolerationSummary)
  return values.length ? truncate(values.join(','), 96) : '-'
}

const affinitySummary = (affinity) => {
  if (!affinity) return '-'
  const parts = []
  const node = affinity.nodeAffinity
  const pod = affinity.podAffinity
  const anti = affinity.podAntiAffinity

  if (node?.requiredDuringSchedulingIgnoredDuringExecution) parts.push('node:required')
  if (node?.preferredDuringSchedulingIgnoredDuringExecution?.length) {
    parts.push(`node:preferred=${node.preferredDuringSchedulingIgnoredDuringExecution.length}`)
  }
  if (pod?.requiredDuringSchedulingIgnoredDuringExecution?.length) {
    parts.push(`pod:required=${pod.requiredDuringSchedulingIgnoredDuringExecution.length}`)
  }
  if (pod?.preferredDuringSchedulingIgnoredDuringExecution?.length) {
    parts.push(`pod:preferred=${pod.preferredDuringSchedulingIgnoredDuringExecution.length}`)
  }
  if (anti?.requiredDuringSchedulingIgnoredDuringExecution?.length) {
    parts.push(`anti:required=${anti.requiredDuringSchedulingIgnoredDuringExecution.length}`)
  }
  if (anti?.preferredDuringSchedulingIgnoredDuringExecution?.length) {
    parts.push(`anti:preferred=${anti.preferredDuringSchedulingIgnoredDuringExecution.length}`)
  }

  return parts.length ? truncate(parts.join(','), 96) : '-'
}

const podPlacementRows = (pod, namespace) => {
  const spec = pod.spec ?? {}
  const status = pod.status ?? {}
  return [[
    pod.metadata?.namespace ?? namespace ?? '-',
    pod.metadata?.name ?? '-',
    spec.nodeName ?? '-',
    status.podIP ?? '-',
    status.hostIP ?? '-',
    status.qosClass ?? '-',
    spec.serviceAccountName ?? '-',
    podPrioritySummary(spec),
    spec.schedulerName ?? '-',
    spec.restartPolicy ?? '-',
    spec.hostNetwork ? 'true' : 'false',
    truncate(formatOwnerReferences(pod.metadata?.ownerReferences), 48),
    truncate(formatResourceMap(spec.nodeSelector), 64),
    podTolerationsSummary(spec.tolerations),
    affinitySummary(spec.affinity),
    ageFrom(pod.metadata?.creationTimestamp),
  ]]
}

const securityProfileSummary = (profile) => {
  if (!profile) return '-'
  if (profile.type === 'Localhost') return `Localhost:${profile.localhostProfile ?? '-'}`
  return profile.type ?? '-'
}

const runAsSummary = (context) => {
  const user = context?.runAsUser
  const group = context?.runAsGroup
  if (user === undefined && group === undefined) return '-'
  return `${user ?? '-'}:${group ?? '-'}`
}

const capabilitySummary = (capabilities) => {
  const add = capabilities?.add?.length ? `add=${capabilities.add.join(',')}` : ''
  const drop = capabilities?.drop?.length ? `drop=${capabilities.drop.join(',')}` : ''
  return [add, drop].filter(Boolean).join(' ') || '-'
}

const seLinuxSummary = (options) => {
  if (!options) return '-'
  const values = [
    options.user ? `user=${options.user}` : '',
    options.role ? `role=${options.role}` : '',
    options.type ? `type=${options.type}` : '',
    options.level ? `level=${options.level}` : '',
  ].filter(Boolean)
  return values.length ? truncate(values.join(','), 64) : '-'
}

const appArmorSummary = (context, pod, containerName) => {
  if (context?.appArmorProfile) return securityProfileSummary(context.appArmorProfile)
  const annotation = pod.metadata?.annotations?.[`container.apparmor.security.beta.kubernetes.io/${containerName}`]
  return annotation ?? '-'
}

const podSecurityContextRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  const podContext = pod.spec?.securityContext ?? {}
  const specGroups = [
    ['container', pod.spec?.containers ?? []],
    ['init', pod.spec?.initContainers ?? []],
    ['ephemeral', pod.spec?.ephemeralContainers ?? []],
  ]

  return specGroups.flatMap(([type, containers]) => (
    containers.map((container) => {
      const context = container.securityContext ?? {}
      return [
        podNamespace,
        podName,
        type,
        container.name ?? '-',
        runAsSummary(podContext),
        podContext.runAsNonRoot === undefined ? '-' : podContext.runAsNonRoot ? 'true' : 'false',
        podContext.fsGroup ?? '-',
        securityProfileSummary(podContext.seccompProfile),
        context.privileged === undefined ? '-' : context.privileged ? 'true' : 'false',
        context.allowPrivilegeEscalation === undefined ? '-' : context.allowPrivilegeEscalation ? 'true' : 'false',
        context.readOnlyRootFilesystem === undefined ? '-' : context.readOnlyRootFilesystem ? 'true' : 'false',
        runAsSummary(context),
        context.runAsNonRoot === undefined ? '-' : context.runAsNonRoot ? 'true' : 'false',
        capabilitySummary(context.capabilities),
        securityProfileSummary(context.seccompProfile),
        appArmorSummary(context, pod, container.name),
        seLinuxSummary(context.seLinuxOptions),
        age,
      ]
    })
  ))
}

const podLabelRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  return Object.entries(pod.metadata?.labels ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [
      podNamespace,
      podName,
      key,
      truncate(value, 96),
      age,
    ])
}

const sensitiveAnnotationPattern = /last-applied-configuration|token|secret|password|credential|authorization|private[-.]?key|client[-.]?key|client[-.]?certificate|tls[-.]?key|tls[-.]?crt|ca[-.]?crt/i

const annotationValueSummary = (key, value) => {
  if (sensitiveAnnotationPattern.test(key)) return '<redacted>'
  return truncate(String(value ?? '').replace(/\s+/g, ' '), 96)
}

const podAnnotationRows = (pod, namespace) => {
  const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
  const podName = pod.metadata?.name ?? '-'
  const age = ageFrom(pod.metadata?.creationTimestamp)
  return Object.entries(pod.metadata?.annotations ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [
      podNamespace,
      podName,
      key,
      annotationValueSummary(key, value),
      age,
    ])
}

const listNamespacedOrAll = async (namespace, namespaced, all) => (
  namespace ? namespaced(namespace) : all()
)

const sortRowsByCpu = (rows, cpuIndex) => (
  [...rows].sort((left, right) => parseCpuToNanocores(String(right[cpuIndex] ?? '')) - parseCpuToNanocores(String(left[cpuIndex] ?? '')))
)

const resourceBar = (resource) => {
  const visible = ['ctx', 'tn', 'tp', 'tc', 'co', 'cstate', 'crs', 'img', 'prb', 'prt', 'vol', 'mnt', 'env', 'cond', 'gate', 'pnet', 'place', 'sctx', 'label', 'anno', 'cs', 'apig', 'apires', 'ver', 'oidc', 'health', 'ssr', 'ssar', 'ssrr', 'pods', 'deployments', 'rc', 'crv', 'pt', 'helmchart', 'helm', 'helmrepo', 'pdb', 'rq', 'lr', 'pc', 'rtc', 'services', 'nodes', 'configmaps', 'secrets', 'ep', 'le', 'lc', 'eps', 'apisvc', 'mwc', 'vwc', 'map', 'mapb', 'vap', 'vapb', 'fs', 'plc', 'csr', 'ctb', 'pcr', 'sv', 'svm', 'ingresses', 'ic', 'gwc', 'gw', 'htr', 'grpcr', 'tlsr', 'tcpr', 'udpr', 'rg', 'netpol', 'pvcs', 'csid', 'csin', 'va', 'csc', 'dc', 'dtr', 'crx', 'crds', 'hpas', 'events']
  return visible.map((item) => {
    const resolved = normalizeResourceType(item) ?? item
    return resolved === resource ? `[${item}]` : item
  }).join(' ')
}

const tableResult = (headers, rows) => ({ headers, rows })

const deleteBody = (force = false) => ({
  apiVersion: 'v1',
  kind: 'DeleteOptions',
  ...(force ? { gracePeriodSeconds: 0 } : {}),
})

const deleteResult = (resource, namespace, name, message = 'delete requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'],
  [['delete', resource, namespace ?? '-', name, 'OK', message]],
)

const evictResult = (resource, namespace, name, message = 'evict requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'],
  [['evict', resource, namespace, name, 'OK', message]],
)

const helmUninstallResult = (namespace, name, message = 'helm release uninstalled') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'],
  [['uninstall', 'helmreleases', namespace, name, 'OK', message]],
)

const forceDeleteResult = (resource, namespace, name, message = 'force delete requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'],
  [['force-delete', resource, namespace, name, 'OK', message]],
)

const scaleResult = (resource, namespace, name, requested, observed, message = 'scale requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'REQUESTED', 'REPLICAS', 'STATUS', 'MESSAGE'],
  [['scale', resource, namespace, name, requested, observed, 'OK', message]],
)

const restartResult = (resource, namespace, name, restartedAt, message = 'restart requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'STATUS', 'RESTARTED-AT', 'MESSAGE'],
  [['restart', resource, namespace, name, 'OK', restartedAt, message]],
)

const workloadImageResult = (resource, namespace, name, containerName, image, message = 'image update requested') => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'CONTAINER', 'IMAGE', 'STATUS', 'MESSAGE'],
  [['set-image', resource, namespace, name, containerName, image, 'OK', message]],
)

const nodeSchedulingResult = (action, name, unschedulable) => tableResult(
  ['ACTION', 'RESOURCE', 'NAME', 'SCHEDULING', 'STATUS', 'MESSAGE'],
  [[
    action,
    'nodes',
    name,
    unschedulable ? 'SchedulingDisabled' : 'SchedulingEnabled',
    'OK',
    unschedulable ? 'node cordoned' : 'node uncordoned',
  ]],
)

const certificateSigningRequestApprovalResult = (action, name) => tableResult(
  ['ACTION', 'RESOURCE', 'NAME', 'CONDITION', 'STATUS', 'MESSAGE'],
  [[
    action,
    'certificatesigningrequests',
    name,
    action === 'approve' ? 'Approved' : 'Denied',
    'OK',
    `certificate signing request ${action === 'approve' ? 'approved' : 'denied'}`,
  ]],
)

const batchSuspensionResult = (action, resource, namespace, name, suspend) => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'SUSPEND', 'STATUS', 'MESSAGE'],
  [[
    action,
    resource,
    namespace,
    name,
    suspend ? 'true' : 'false',
    'OK',
    `${resource}/${name} ${suspend ? 'suspended' : 'resumed'}`,
  ]],
)

const cronJobTriggerResult = (namespace, cronJobName, jobName) => tableResult(
  ['ACTION', 'RESOURCE', 'NAMESPACE', 'NAME', 'JOB', 'STATUS', 'MESSAGE'],
  [[
    'trigger',
    'cronjobs',
    namespace,
    cronJobName,
    jobName ?? '-',
    'OK',
    'job created',
  ]],
)

const patchOptions = (strategy) => ({
  middleware: [{
    pre: async (context) => {
      context.setHeaderParam('Content-Type', strategy)
      return context
    },
    post: async (context) => context,
  }],
  middlewareMergeStrategy: 'append',
})

const mergePatchOptions = () => patchOptions(PatchStrategy.MergePatch)

const strategicMergePatchOptions = () => patchOptions(PatchStrategy.StrategicMergePatch)

const responseBody = (response) => response?.body ?? response?.response ?? response ?? {}

const yamlDocument = (response) => `${dumpYaml(responseBody(response), {
  noRefs: true,
}).trimEnd()}\n`

const readStreamText = async (stream) => new Promise((resolve, reject) => {
  const chunks = []
  stream.setEncoding?.('utf8')
  stream.on('data', (chunk) => {
    chunks.push(String(chunk))
  })
  stream.on('error', reject)
  stream.on('end', () => {
    resolve(chunks.join(''))
  })
})

const readApplyInput = async (file) => (
  file === '-' ? readStreamText(process.stdin) : readFile(file, 'utf8')
)

const manifestMetadata = (manifest) => (
  manifest && typeof manifest.metadata === 'object' && !Array.isArray(manifest.metadata)
    ? manifest.metadata
    : {}
)

const manifestName = (manifest) => {
  const metadata = manifestMetadata(manifest)
  return typeof metadata.name === 'string' && metadata.name ? metadata.name : 'unknown'
}

const manifestNamespace = (manifest) => {
  const metadata = manifestMetadata(manifest)
  return typeof metadata.namespace === 'string' && metadata.namespace ? metadata.namespace : undefined
}

const manifestKind = (manifest) => (
  typeof manifest?.kind === 'string' && manifest.kind ? manifest.kind : 'Unknown'
)

const manifestIdentity = (manifest) => ({
  kind: manifestKind(manifest),
  namespace: manifestNamespace(manifest),
  name: manifestName(manifest),
})

const validateApplyManifest = (manifest) => {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('manifest must be an object')
  }
  if (typeof manifest.apiVersion !== 'string' || !manifest.apiVersion) {
    throw new Error('manifest requires apiVersion')
  }
  if (typeof manifest.kind !== 'string' || !manifest.kind) {
    throw new Error('manifest requires kind')
  }
  if (manifestName(manifest) === 'unknown') {
    throw new Error('manifest requires metadata.name')
  }
}

const applyResult = (rows) => tableResult(
  ['ACTION', 'KIND', 'NAMESPACE', 'NAME', 'STATUS', 'MESSAGE'],
  rows,
)

const applyObjectClient = (kubeConfig) => (
  typeof kubeConfig.makeObjectClient === 'function'
    ? kubeConfig.makeObjectClient()
    : KubernetesObjectApi.makeApiClient(kubeConfig)
)

const applyDocumentsFromYaml = (yaml) => yamlLoadAll(yaml).filter((doc) => (
  Boolean(doc) && typeof doc === 'object' && !Array.isArray(doc)
))

const requireNamespace = (action, resource, namespace) => {
  if (!namespace) {
    throw new Error(`${action} requires --namespace for ${resource}`)
  }
  return namespace
}

const requireDeleteNamespace = (resource, namespace) => requireNamespace('delete', resource, namespace)

const deleteGeneratedResource = async ({
  api,
  method,
  resource,
  namespace,
  name,
}) => {
  if (typeof api?.[method] !== 'function') {
    throw new Error(`delete is not available for ${resource}`)
  }

  await api[method]({
    name,
    ...(namespace ? { namespace } : {}),
    body: deleteBody(),
  })
  return deleteResult(resource, namespace, name)
}

const requireCrdName = (options) => {
  const crdName = String(options.crdName ?? '').trim()
  if (!crdName) {
    throw new Error(`${options.action ?? 'list'} requires --crd for customresources`)
  }
  return crdName
}

const preferredCustomResourceVersion = (crd) => {
  const versions = crd.spec?.versions ?? []
  return versions.find((version) => version.served && version.storage)?.name
    ?? versions.find((version) => version.served)?.name
    ?? versions[0]?.name
    ?? ''
}

const customResourceDescriptorFromCrd = (crd, crdName) => {
  const scope = crd.spec?.scope
  const descriptor = {
    group: crd.spec?.group ?? '',
    version: preferredCustomResourceVersion(crd),
    plural: crd.spec?.names?.plural ?? '',
    kind: crd.spec?.names?.kind ?? '',
    namespaced: scope === 'Namespaced',
  }

  if (!descriptor.group || !descriptor.version || !descriptor.plural || !descriptor.kind || !['Namespaced', 'Cluster'].includes(scope)) {
    throw new Error(`Invalid CRD ${crdName}`)
  }

  return descriptor
}

const customResourceDescriptorForOptions = async (apiextensionsApi, options) => {
  const crdName = requireCrdName(options)
  const crd = responseBody(await apiextensionsApi.readCustomResourceDefinition({ name: crdName }))
  return {
    crdName,
    descriptor: customResourceDescriptorFromCrd(crd, crdName),
  }
}

const customResourceStatus = (resource) => {
  if (resource.metadata?.deletionTimestamp) return 'Terminating'
  const conditions = Array.isArray(resource.status?.conditions) ? resource.status.conditions : []
  const ready = conditions.find((condition) => condition.type === 'Ready')
  if (ready) {
    return ready.status === 'True'
      ? 'Ready'
      : ready.reason ?? ready.status ?? 'NotReady'
  }
  if (typeof resource.status?.phase === 'string') return resource.status.phase
  if (typeof resource.status?.state === 'string') return resource.status.state
  return resource.status ? 'Status' : '-'
}

const deleteCustomResource = async ({
  api,
  descriptor,
  resource,
  namespace,
  name,
}) => {
  if (descriptor.namespaced) {
    const targetNamespace = requireDeleteNamespace(resource, namespace)
    await api.deleteNamespacedCustomObject({
      group: descriptor.group,
      version: descriptor.version,
      namespace: targetNamespace,
      plural: descriptor.plural,
      name,
      body: deleteBody(),
    })
    return deleteResult(resource, targetNamespace, name)
  }

  await api.deleteClusterCustomObject({
    group: descriptor.group,
    version: descriptor.version,
    plural: descriptor.plural,
    name,
    body: deleteBody(),
  })
  return deleteResult(resource, undefined, name)
}

const NAMESPACED_DELETE_METHODS = {
  pods: ['core', 'deleteNamespacedPod'],
  deployments: ['apps', 'deleteNamespacedDeployment'],
  daemonsets: ['apps', 'deleteNamespacedDaemonSet'],
  statefulsets: ['apps', 'deleteNamespacedStatefulSet'],
  replicasets: ['apps', 'deleteNamespacedReplicaSet'],
  replicationcontrollers: ['core', 'deleteNamespacedReplicationController'],
  controllerrevisions: ['apps', 'deleteNamespacedControllerRevision'],
  podtemplates: ['core', 'deleteNamespacedPodTemplate'],
  jobs: ['batch', 'deleteNamespacedJob'],
  cronjobs: ['batch', 'deleteNamespacedCronJob'],
  poddisruptionbudgets: ['policy', 'deleteNamespacedPodDisruptionBudget'],
  resourcequotas: ['core', 'deleteNamespacedResourceQuota'],
  limitranges: ['core', 'deleteNamespacedLimitRange'],
  services: ['core', 'deleteNamespacedService'],
  configmaps: ['core', 'deleteNamespacedConfigMap'],
  secrets: ['core', 'deleteNamespacedSecret'],
  endpoints: ['core', 'deleteNamespacedEndpoints'],
  leases: ['coordination', 'deleteNamespacedLease'],
  leasecandidates: ['coordinationBeta', 'deleteNamespacedLeaseCandidate'],
  ingresses: ['networking', 'deleteNamespacedIngress'],
  networkpolicies: ['networking', 'deleteNamespacedNetworkPolicy'],
  endpointslices: ['discovery', 'deleteNamespacedEndpointSlice'],
  events: ['events', 'deleteNamespacedEvent'],
  persistentvolumeclaims: ['core', 'deleteNamespacedPersistentVolumeClaim'],
  csistoragecapacities: ['storage', 'deleteNamespacedCSIStorageCapacity'],
  serviceaccounts: ['core', 'deleteNamespacedServiceAccount'],
  roles: ['rbac', 'deleteNamespacedRole'],
  rolebindings: ['rbac', 'deleteNamespacedRoleBinding'],
  horizontalpodautoscalers: ['autoscaling', 'deleteNamespacedHorizontalPodAutoscaler'],
  podcertificaterequests: ['certificatesAlpha', 'deleteNamespacedPodCertificateRequest'],
}

const helmUninstallArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm uninstall is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('delete', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return {
    namespace,
    args: [
      ...contextArgs,
      'uninstall',
      options.name,
      '-n',
      namespace,
    ],
  }
}

export const uninstallHelmReleaseRows = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => {
  const { namespace, args } = helmUninstallArgs(kubeConfig, options)
  const child = spawnImpl('helm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdoutOutput = ''
  let stderrOutput = ''

  child.stdout?.on('data', (chunk) => {
    stdoutOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    stderrOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      const message = [stdoutOutput, stderrOutput].filter(Boolean).join('\n').trim()
      if (code === 0) {
        resolve(helmUninstallResult(namespace, options.name, message || 'helm release uninstalled'))
        return
      }
      reject(new Error(message || `helm uninstall exited with code ${code ?? -1}`))
    })
  })
}

const SCALE_METHODS = {
  deployments: ['apps', 'patchNamespacedDeploymentScale'],
  statefulsets: ['apps', 'patchNamespacedStatefulSetScale'],
  replicasets: ['apps', 'patchNamespacedReplicaSetScale'],
  replicationcontrollers: ['core', 'patchNamespacedReplicationControllerScale'],
}

const RESTART_METHODS = {
  deployments: ['apps', 'patchNamespacedDeployment'],
  daemonsets: ['apps', 'patchNamespacedDaemonSet'],
  statefulsets: ['apps', 'patchNamespacedStatefulSet'],
}

const WORKLOAD_IMAGE_METHODS = {
  deployments: ['apps', 'patchNamespacedDeployment'],
  daemonsets: ['apps', 'patchNamespacedDaemonSet'],
  statefulsets: ['apps', 'patchNamespacedStatefulSet'],
}

const ROLLOUT_RESOURCES = {
  deployments: 'deployment',
  daemonsets: 'daemonset',
  statefulsets: 'statefulset',
}

const PAUSABLE_ROLLOUT_RESOURCES = {
  deployments: 'deployment',
}

const NAMESPACED_YAML_METHODS = {
  pods: ['core', 'readNamespacedPod'],
  deployments: ['apps', 'readNamespacedDeployment'],
  daemonsets: ['apps', 'readNamespacedDaemonSet'],
  statefulsets: ['apps', 'readNamespacedStatefulSet'],
  replicasets: ['apps', 'readNamespacedReplicaSet'],
  replicationcontrollers: ['core', 'readNamespacedReplicationController'],
  controllerrevisions: ['apps', 'readNamespacedControllerRevision'],
  podtemplates: ['core', 'readNamespacedPodTemplate'],
  jobs: ['batch', 'readNamespacedJob'],
  cronjobs: ['batch', 'readNamespacedCronJob'],
  poddisruptionbudgets: ['policy', 'readNamespacedPodDisruptionBudget'],
  resourcequotas: ['core', 'readNamespacedResourceQuota'],
  limitranges: ['core', 'readNamespacedLimitRange'],
  services: ['core', 'readNamespacedService'],
  configmaps: ['core', 'readNamespacedConfigMap'],
  secrets: ['core', 'readNamespacedSecret'],
  endpoints: ['core', 'readNamespacedEndpoints'],
  leases: ['coordination', 'readNamespacedLease'],
  leasecandidates: ['coordinationBeta', 'readNamespacedLeaseCandidate'],
  ingresses: ['networking', 'readNamespacedIngress'],
  networkpolicies: ['networking', 'readNamespacedNetworkPolicy'],
  endpointslices: ['discovery', 'readNamespacedEndpointSlice'],
  persistentvolumeclaims: ['core', 'readNamespacedPersistentVolumeClaim'],
  csistoragecapacities: ['storage', 'readNamespacedCSIStorageCapacity'],
  serviceaccounts: ['core', 'readNamespacedServiceAccount'],
  roles: ['rbac', 'readNamespacedRole'],
  rolebindings: ['rbac', 'readNamespacedRoleBinding'],
  horizontalpodautoscalers: ['autoscaling', 'readNamespacedHorizontalPodAutoscaler'],
  podcertificaterequests: ['certificatesAlpha', 'readNamespacedPodCertificateRequest'],
}

const CLUSTER_YAML_METHODS = {
  componentstatuses: ['core', 'readComponentStatus'],
  namespaces: ['core', 'readNamespace'],
  nodes: ['core', 'readNode'],
  priorityclasses: ['scheduling', 'readPriorityClass'],
  runtimeclasses: ['node', 'readRuntimeClass'],
  ingressclasses: ['networking', 'readIngressClass'],
  ipaddresses: ['networking', 'readIPAddress'],
  servicecidrs: ['networking', 'readServiceCIDR'],
  apiservices: ['apiregistration', 'readAPIService'],
  mutatingwebhookconfigurations: ['admission', 'readMutatingWebhookConfiguration'],
  validatingwebhookconfigurations: ['admission', 'readValidatingWebhookConfiguration'],
  mutatingadmissionpolicies: ['admissionBeta', 'readMutatingAdmissionPolicy'],
  mutatingadmissionpolicybindings: ['admissionBeta', 'readMutatingAdmissionPolicyBinding'],
  validatingadmissionpolicies: ['admission', 'readValidatingAdmissionPolicy'],
  validatingadmissionpolicybindings: ['admission', 'readValidatingAdmissionPolicyBinding'],
  flowschemas: ['flowcontrol', 'readFlowSchema'],
  prioritylevelconfigurations: ['flowcontrol', 'readPriorityLevelConfiguration'],
  certificatesigningrequests: ['certificates', 'readCertificateSigningRequest'],
  clustertrustbundles: ['certificatesBeta', 'readClusterTrustBundle'],
  storageversions: ['internalApiserver', 'readStorageVersion'],
  storageversionmigrations: ['storagemigration', 'readStorageVersionMigration'],
  persistentvolumes: ['core', 'readPersistentVolume'],
  storageclasses: ['storage', 'readStorageClass'],
  volumeattributesclasses: ['storage', 'readVolumeAttributesClass'],
  csidrivers: ['storage', 'readCSIDriver'],
  csinodes: ['storage', 'readCSINode'],
  volumeattachments: ['storage', 'readVolumeAttachment'],
  devicetaintrules: ['resourceAlpha', 'readDeviceTaintRule'],
  clusterroles: ['rbac', 'readClusterRole'],
  clusterrolebindings: ['rbac', 'readClusterRoleBinding'],
  customresourcedefinitions: ['apiextensions', 'readCustomResourceDefinition'],
}

const CLUSTER_DELETE_METHODS = {
  namespaces: ['core', 'deleteNamespace'],
  nodes: ['core', 'deleteNode'],
  priorityclasses: ['scheduling', 'deletePriorityClass'],
  runtimeclasses: ['node', 'deleteRuntimeClass'],
  ingressclasses: ['networking', 'deleteIngressClass'],
  ipaddresses: ['networking', 'deleteIPAddress'],
  servicecidrs: ['networking', 'deleteServiceCIDR'],
  apiservices: ['apiregistration', 'deleteAPIService'],
  mutatingwebhookconfigurations: ['admission', 'deleteMutatingWebhookConfiguration'],
  validatingwebhookconfigurations: ['admission', 'deleteValidatingWebhookConfiguration'],
  mutatingadmissionpolicies: ['admissionBeta', 'deleteMutatingAdmissionPolicy'],
  mutatingadmissionpolicybindings: ['admissionBeta', 'deleteMutatingAdmissionPolicyBinding'],
  validatingadmissionpolicies: ['admission', 'deleteValidatingAdmissionPolicy'],
  validatingadmissionpolicybindings: ['admission', 'deleteValidatingAdmissionPolicyBinding'],
  flowschemas: ['flowcontrol', 'deleteFlowSchema'],
  prioritylevelconfigurations: ['flowcontrol', 'deletePriorityLevelConfiguration'],
  certificatesigningrequests: ['certificates', 'deleteCertificateSigningRequest'],
  clustertrustbundles: ['certificatesBeta', 'deleteClusterTrustBundle'],
  storageversions: ['internalApiserver', 'deleteStorageVersion'],
  storageversionmigrations: ['storagemigration', 'deleteStorageVersionMigration'],
  persistentvolumes: ['core', 'deletePersistentVolume'],
  storageclasses: ['storage', 'deleteStorageClass'],
  volumeattributesclasses: ['storage', 'deleteVolumeAttributesClass'],
  csidrivers: ['storage', 'deleteCSIDriver'],
  csinodes: ['storage', 'deleteCSINode'],
  volumeattachments: ['storage', 'deleteVolumeAttachment'],
  devicetaintrules: ['resourceAlpha', 'deleteDeviceTaintRule'],
  clusterroles: ['rbac', 'deleteClusterRole'],
  clusterrolebindings: ['rbac', 'deleteClusterRoleBinding'],
  customresourcedefinitions: ['apiextensions', 'deleteCustomResourceDefinition'],
}

const CUSTOM_DELETE_DESCRIPTORS = {
  volumesnapshotclasses: {
    group: 'snapshot.storage.k8s.io',
    version: 'v1',
    plural: 'volumesnapshotclasses',
    namespaced: false,
  },
  volumesnapshots: {
    group: 'snapshot.storage.k8s.io',
    version: 'v1',
    plural: 'volumesnapshots',
    namespaced: true,
  },
  volumesnapshotcontents: {
    group: 'snapshot.storage.k8s.io',
    version: 'v1',
    plural: 'volumesnapshotcontents',
    namespaced: false,
  },
  gatewayclasses: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'gatewayclasses',
    namespaced: false,
  },
  gateways: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'gateways',
    namespaced: true,
  },
  httproutes: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'httproutes',
    namespaced: true,
  },
  grpcroutes: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'grpcroutes',
    namespaced: true,
  },
  tlsroutes: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'tlsroutes',
    namespaced: true,
  },
  tcproutes: {
    group: 'gateway.networking.k8s.io',
    version: 'v1alpha2',
    plural: 'tcproutes',
    namespaced: true,
  },
  udproutes: {
    group: 'gateway.networking.k8s.io',
    version: 'v1alpha2',
    plural: 'udproutes',
    namespaced: true,
  },
  referencegrants: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    plural: 'referencegrants',
    namespaced: true,
  },
  deviceclasses: {
    group: 'resource.k8s.io',
    version: 'v1',
    plural: 'deviceclasses',
    namespaced: false,
  },
  resourceclaims: {
    group: 'resource.k8s.io',
    version: 'v1',
    plural: 'resourceclaims',
    namespaced: true,
  },
  resourceclaimtemplates: {
    group: 'resource.k8s.io',
    version: 'v1',
    plural: 'resourceclaimtemplates',
    namespaced: true,
  },
  resourceslices: {
    group: 'resource.k8s.io',
    version: 'v1',
    plural: 'resourceslices',
    namespaced: false,
  },
}

const readResourceClients = (kubeConfig) => ({
  admission: kubeConfig.makeApiClient(AdmissionregistrationV1Api),
  admissionBeta: kubeConfig.makeApiClient(AdmissionregistrationV1beta1Api),
  apiextensions: kubeConfig.makeApiClient(ApiextensionsV1Api),
  apiregistration: kubeConfig.makeApiClient(ApiregistrationV1Api),
  apps: kubeConfig.makeApiClient(AppsV1Api),
  autoscaling: kubeConfig.makeApiClient(AutoscalingV2Api),
  batch: kubeConfig.makeApiClient(BatchV1Api),
  certificates: kubeConfig.makeApiClient(CertificatesV1Api),
  certificatesAlpha: kubeConfig.makeApiClient(CertificatesV1alpha1Api),
  certificatesBeta: kubeConfig.makeApiClient(CertificatesV1beta1Api),
  coordination: kubeConfig.makeApiClient(CoordinationV1Api),
  coordinationBeta: kubeConfig.makeApiClient(CoordinationV1beta1Api),
  core: kubeConfig.makeApiClient(CoreV1Api),
  customObjects: kubeConfig.makeApiClient(CustomObjectsApi),
  discovery: kubeConfig.makeApiClient(DiscoveryV1Api),
  events: kubeConfig.makeApiClient(EventsV1Api),
  flowcontrol: kubeConfig.makeApiClient(FlowcontrolApiserverV1Api),
  internalApiserver: kubeConfig.makeApiClient(InternalApiserverV1alpha1Api),
  networking: kubeConfig.makeApiClient(NetworkingV1Api),
  node: kubeConfig.makeApiClient(NodeV1Api),
  policy: kubeConfig.makeApiClient(PolicyV1Api),
  rbac: kubeConfig.makeApiClient(RbacAuthorizationV1Api),
  resourceAlpha: kubeConfig.makeApiClient(ResourceV1alpha3Api),
  scheduling: kubeConfig.makeApiClient(SchedulingV1Api),
  storage: kubeConfig.makeApiClient(StorageV1Api),
  storagemigration: kubeConfig.makeApiClient(StoragemigrationV1alpha1Api),
})

const readGeneratedResource = async ({
  api,
  method,
  resource,
  namespace,
  name,
  action,
}) => {
  if (typeof api?.[method] !== 'function') {
    throw new Error(`${action} is not available for ${resource}`)
  }

  return responseBody(await api[method]({
    ...(namespace ? { namespace } : {}),
    name,
  }))
}

export const readResourceObject = async (kubeConfig, options, action = 'yaml') => {
  const clients = readResourceClients(kubeConfig)
  const namespace = namespaceArg(options)

  if (options.resource === 'events') {
    const targetNamespace = requireNamespace(action, options.resource, namespace)
    try {
      return responseBody(await clients.events.readNamespacedEvent({
        namespace: targetNamespace,
        name: options.name,
      }))
    } catch {
      return responseBody(await clients.core.readNamespacedEvent({
        namespace: targetNamespace,
        name: options.name,
      }))
    }
  }

  const namespacedMethod = NAMESPACED_YAML_METHODS[options.resource]
  if (namespacedMethod) {
    const targetNamespace = requireNamespace(action, options.resource, namespace)
    const [clientName, method] = namespacedMethod
    return readGeneratedResource({
      api: clients[clientName],
      method,
      resource: options.resource,
      namespace: targetNamespace,
      name: options.name,
      action,
    })
  }

  const clusterMethod = CLUSTER_YAML_METHODS[options.resource]
  if (clusterMethod) {
    const [clientName, method] = clusterMethod
    return readGeneratedResource({
      api: clients[clientName],
      method,
      resource: options.resource,
      namespace: undefined,
      name: options.name,
      action,
    })
  }

  if (options.resource === 'customresources') {
    const { descriptor } = await customResourceDescriptorForOptions(clients.apiextensions, options)
    if (descriptor.namespaced) {
      const targetNamespace = requireNamespace(action, options.resource, namespace)
      return responseBody(await clients.customObjects.getNamespacedCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        namespace: targetNamespace,
        plural: descriptor.plural,
        name: options.name,
      }))
    }

    return responseBody(await clients.customObjects.getClusterCustomObject({
      group: descriptor.group,
      version: descriptor.version,
      plural: descriptor.plural,
      name: options.name,
    }))
  }

  const customDescriptor = CUSTOM_DELETE_DESCRIPTORS[options.resource]
  if (customDescriptor) {
    if (customDescriptor.namespaced) {
      const targetNamespace = requireNamespace(action, options.resource, namespace)
      return responseBody(await clients.customObjects.getNamespacedCustomObject({
        group: customDescriptor.group,
        version: customDescriptor.version,
        namespace: targetNamespace,
        plural: customDescriptor.plural,
        name: options.name,
      }))
    }

    return responseBody(await clients.customObjects.getClusterCustomObject({
      group: customDescriptor.group,
      version: customDescriptor.version,
      plural: customDescriptor.plural,
      name: options.name,
    }))
  }

  throw new Error(`${action} is not supported for ${options.resource}`)
}

export const setupKubeConfig = (context) => {
  const kubeConfig = new KubeConfig()
  kubeConfig.loadFromDefault()

  if (context) {
    kubeConfig.setCurrentContext(context)
  }

  return kubeConfig
}

export const listRows = async (kubeConfig, options) => {
  if (options.resource === 'contexts') {
    return kubeConfigContextsTable(kubeConfig)
  }

  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  const coreDiscoveryApi = kubeConfig.makeApiClient(CoreApi)
  const versionApi = kubeConfig.makeApiClient(VersionApi)
  const wellKnownApi = kubeConfig.makeApiClient(WellKnownApi)
  const openidApi = kubeConfig.makeApiClient(OpenidApi)
  const healthApi = new Health(kubeConfig)
  const customObjectsApi = kubeConfig.makeApiClient(CustomObjectsApi)
  const apisApi = kubeConfig.makeApiClient(ApisApi)
  const apiextensionsApi = kubeConfig.makeApiClient(ApiextensionsV1Api)
  const admissionApi = kubeConfig.makeApiClient(AdmissionregistrationV1Api)
  const admissionBetaApi = kubeConfig.makeApiClient(AdmissionregistrationV1beta1Api)
  const apiregistrationApi = kubeConfig.makeApiClient(ApiregistrationV1Api)
  const authenticationApi = kubeConfig.makeApiClient(AuthenticationV1Api)
  const authorizationApi = kubeConfig.makeApiClient(AuthorizationV1Api)
  const appsApi = kubeConfig.makeApiClient(AppsV1Api)
  const batchApi = kubeConfig.makeApiClient(BatchV1Api)
  const certificatesApi = kubeConfig.makeApiClient(CertificatesV1Api)
  const certificatesAlphaApi = kubeConfig.makeApiClient(CertificatesV1alpha1Api)
  const certificatesBetaApi = kubeConfig.makeApiClient(CertificatesV1beta1Api)
  const coordinationApi = kubeConfig.makeApiClient(CoordinationV1Api)
  const coordinationBetaApi = kubeConfig.makeApiClient(CoordinationV1beta1Api)
  const networkingApi = kubeConfig.makeApiClient(NetworkingV1Api)
  const nodeApi = kubeConfig.makeApiClient(NodeV1Api)
  const discoveryApi = kubeConfig.makeApiClient(DiscoveryV1Api)
  const eventsApi = kubeConfig.makeApiClient(EventsV1Api)
  const flowcontrolApi = kubeConfig.makeApiClient(FlowcontrolApiserverV1Api)
  const storageApi = kubeConfig.makeApiClient(StorageV1Api)
  const internalApiserverApi = kubeConfig.makeApiClient(InternalApiserverV1alpha1Api)
  const storagemigrationApi = kubeConfig.makeApiClient(StoragemigrationV1alpha1Api)
  const resourceAlphaApi = kubeConfig.makeApiClient(ResourceV1alpha3Api)
  const rbacApi = kubeConfig.makeApiClient(RbacAuthorizationV1Api)
  const schedulingApi = kubeConfig.makeApiClient(SchedulingV1Api)
  const autoscalingApi = kubeConfig.makeApiClient(AutoscalingV2Api)
  const policyApi = kubeConfig.makeApiClient(PolicyV1Api)
  const namespace = namespaceArg(options)

  if (options.resource === 'containers') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'NAME', 'IMAGE', 'READY', 'RESTARTS', 'STATE', 'AGE'],
      itemsFrom(response).flatMap((pod) => podContainerRows(pod, namespace)),
    )
  }

  if (options.resource === 'containerstates') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'READY', 'STARTED', 'RESTARTS', 'STATE', 'REASON', 'EXIT', 'SIGNAL', 'STATE-STARTED', 'STATE-FINISHED', 'LAST-STATE', 'LAST-REASON', 'LAST-EXIT', 'LAST-FINISHED', 'IMAGE-ID', 'CONTAINER-ID', 'POD-AGE'],
      itemsFrom(response).flatMap((pod) => podContainerStateRows(pod, namespace)),
    )
  }

  if (options.resource === 'containerresources') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'IMAGE', 'CPU-REQ', 'CPU-LIMIT', 'MEM-REQ', 'MEM-LIMIT', 'EPH-REQ', 'EPH-LIMIT', 'EXTRA', 'AGE'],
      itemsFrom(response).flatMap((pod) => podContainerResourceRows(pod, namespace)),
    )
  }

  if (options.resource === 'images') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'IMAGE', 'PODS', 'CONTAINERS', 'READY', 'RESTARTS', 'STATES'],
      podImageRows(itemsFrom(response), namespace),
    )
  }

  if (options.resource === 'probes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'IMAGE', 'LIVENESS', 'READINESS', 'STARTUP', 'AGE'],
      itemsFrom(response).flatMap((pod) => podProbeRows(pod, namespace)),
    )
  }

  if (options.resource === 'ports') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'NAME', 'PROTOCOL', 'PORT', 'HOST-PORT', 'HOST-IP', 'IMAGE', 'AGE'],
      itemsFrom(response).flatMap((pod) => podPortRows(pod, namespace)),
    )
  }

  if (options.resource === 'volumes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'VOLUME', 'TYPE', 'SOURCE', 'OPTIONAL', 'DETAILS', 'USED-BY', 'AGE'],
      itemsFrom(response).flatMap((pod) => podVolumeRows(pod, namespace)),
    )
  }

  if (options.resource === 'volumemounts') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'VOLUME', 'MOUNT-PATH', 'READ-ONLY', 'SUB-PATH', 'VOLUME-TYPE', 'SOURCE', 'AGE'],
      itemsFrom(response).flatMap((pod) => podVolumeMountRows(pod, namespace)),
    )
  }

  if (options.resource === 'envvars') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'NAME', 'SOURCE-TYPE', 'SOURCE', 'KEY/PREFIX', 'OPTIONAL', 'AGE'],
      itemsFrom(response).flatMap((pod) => podEnvRows(pod, namespace)),
    )
  }

  if (options.resource === 'podconditions') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'STATUS', 'REASON', 'MESSAGE', 'LAST-TRANSITION', 'POD-AGE'],
      itemsFrom(response).flatMap((pod) => podConditionRows(pod, namespace)),
    )
  }

  if (options.resource === 'podreadinessgates') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'CONDITION', 'STATUS', 'REASON', 'MESSAGE', 'LAST-TRANSITION', 'POD-AGE'],
      itemsFrom(response).flatMap((pod) => podReadinessGateRows(pod, namespace)),
    )
  }

  if (options.resource === 'podnetwork') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'HOSTNAME', 'SUBDOMAIN', 'FQDN', 'DNS-POLICY', 'NAMESERVERS', 'SEARCHES', 'DNS-OPTIONS', 'HOST-ALIASES', 'HOST-NET', 'POD-IPS', 'AGE'],
      itemsFrom(response).flatMap((pod) => podNetworkRows(pod, namespace)),
    )
  }

  if (options.resource === 'podplacement') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'NODE', 'POD-IP', 'HOST-IP', 'QOS', 'SA', 'PRIORITY', 'SCHEDULER', 'RESTART', 'HOST-NET', 'OWNER', 'NODE-SELECTOR', 'TOLERATIONS', 'AFFINITY', 'AGE'],
      itemsFrom(response).flatMap((pod) => podPlacementRows(pod, namespace)),
    )
  }

  if (options.resource === 'securitycontexts') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'TYPE', 'CONTAINER', 'POD-RUN-AS', 'POD-NONROOT', 'POD-FSGROUP', 'POD-SECCOMP', 'PRIVILEGED', 'ALLOW-PRIV-ESC', 'RO-ROOT-FS', 'RUN-AS', 'NONROOT', 'CAPS', 'SECCOMP', 'APPARMOR', 'SELINUX', 'AGE'],
      itemsFrom(response).flatMap((pod) => podSecurityContextRows(pod, namespace)),
    )
  }

  if (options.resource === 'podlabels') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'KEY', 'VALUE', 'AGE'],
      itemsFrom(response).flatMap((pod) => podLabelRows(pod, namespace)),
    )
  }

  if (options.resource === 'podannotations') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'POD', 'KEY', 'VALUE', 'AGE'],
      itemsFrom(response).flatMap((pod) => podAnnotationRows(pod, namespace)),
    )
  }

  if (options.resource === 'topcontainers') {
    const metrics = await listPodMetricUsage(customObjectsApi, namespace)
    const rows = Array.from(metrics.values()).flatMap((pod) => (
      (pod.containers ?? []).map((container) => [
        pod.namespace ?? '-',
        pod.name ?? '-',
        container.name,
        container.cpu,
        container.memory,
      ])
    ))
    return tableResult(
      ['NAMESPACE', 'POD', 'CONTAINER', 'CPU', 'MEMORY'],
      sortRowsByCpu(rows, 3),
    )
  }

  if (options.resource === 'pods' || options.resource === 'toppods') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPod({ namespace: ns }),
      () => coreApi.listPodForAllNamespaces(),
    )
    const metrics = await listPodMetricUsage(customObjectsApi, namespace)
    const rows = itemsFrom(response).map((pod) => {
      const statuses = pod.status?.containerStatuses ?? []
      const restartCount = statuses.reduce((sum, status) => sum + (status.restartCount ?? 0), 0)
      const readyCount = statuses.filter((status) => status.ready).length
      const totalCount = statuses.length
      const podNamespace = pod.metadata?.namespace ?? namespace ?? '-'
      const usage = metrics.get(podMetricsKey(podNamespace, pod.metadata?.name))
      return [
        podNamespace,
        pod.metadata?.name ?? '-',
        pod.status?.phase ?? '-',
        `${readyCount}/${totalCount}`,
        restartCount,
        usage?.cpu ?? '-',
        usage?.memory ?? '-',
        ageFrom(pod.metadata?.creationTimestamp),
      ]
    })
    return tableResult(
      ['NAMESPACE', 'NAME', 'STATUS', 'READY', 'RESTARTS', 'CPU', 'MEMORY', 'AGE'],
      options.resource === 'toppods' ? sortRowsByCpu(rows, 5) : rows,
    )
  }

  if (options.resource === 'componentstatuses') {
    const response = await coreApi.listComponentStatus()
    return tableResult(
      ['NAME', 'STATUS', 'MESSAGE', 'ERROR', 'AGE'],
      itemsFrom(response).map(componentStatusRow),
    )
  }

  if (options.resource === 'apigroups') {
    const [coreResult, groupedResult] = await Promise.allSettled([
      coreDiscoveryApi.getAPIVersions(),
      apisApi.getAPIVersions(),
    ])
    const firstError = [coreResult, groupedResult]
      .find((result) => result.status === 'rejected')
    const rows = [
      ...(coreResult.status === 'fulfilled' ? apiGroupRowsFromCoreVersions(coreResult.value) : []),
      ...(groupedResult.status === 'fulfilled' ? apiGroupRowsFromList(groupedResult.value) : []),
    ].sort((left, right) => (
      left[0] === 'core' ? -1 : right[0] === 'core' ? 1 : String(left[0]).localeCompare(String(right[0]))
    ))

    if (rows.length === 0 && firstError) {
      throw firstError.reason
    }

    return tableResult(
      ['NAME', 'PREFERRED', 'VERSIONS', 'VERSION-COUNT', 'KIND', 'SERVER-ADDRESS-COUNT', 'SERVER-ADDRESSES'],
      rows,
    )
  }

  if (options.resource === 'apiresources') {
    const coreResources = await coreApi.getAPIResources()
    const groups = (await apisApi.getAPIVersions()).groups ?? []
    const requests = groups.flatMap((group) => (
      (group.versions ?? []).map((version) => ({
        apiGroup: group.name,
        version: version.version,
        groupVersion: version.groupVersion,
        preferredGroupVersion: group.preferredVersion?.groupVersion ?? version.groupVersion,
      }))
    ))
    const grouped = await Promise.allSettled(requests.map(async (request) => {
      const response = await customObjectsApi.getAPIResources({
        group: request.apiGroup,
        version: request.version,
      })
      return apiResourceRowsFromList(
        response,
        request.apiGroup,
        request.version,
        request.preferredGroupVersion,
      )
    }))
    const rows = [
      ...apiResourceRowsFromList(coreResources, '', 'v1', 'v1'),
      ...grouped.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
    ].sort((left, right) => (
      String(left[2]).localeCompare(String(right[2]))
        || String(left[3]).localeCompare(String(right[3]))
        || String(left[0]).localeCompare(String(right[0]))
    ))
    return tableResult(
      ['NAME', 'KIND', 'APIGROUP', 'VERSION', 'SCOPE', 'VERBS', 'SHORTNAMES', 'PREFERRED', 'SUBRESOURCE'],
      rows,
    )
  }

  if (options.resource === 'serverversions') {
    return tableResult(
      ['GIT-VERSION', 'MAJOR', 'MINOR', 'PLATFORM', 'BUILD-DATE', 'GIT-COMMIT', 'TREE-STATE', 'GO-VERSION', 'COMPILER', 'EMULATION', 'MIN-COMPATIBILITY'],
      [serverVersionRow(await versionApi.getCode())],
    )
  }

  if (options.resource === 'openidconfigs') {
    const configuration = await wellKnownApi.getServiceAccountIssuerOpenIDConfiguration()
    const keysetResult = await Promise.allSettled([
      openidApi.getServiceAccountIssuerOpenIDKeyset(),
    ])
    return tableResult(
      ['ISSUER', 'JWKS-URI', 'SIGNING-ALGS', 'SUBJECT-TYPES', 'KEYS', 'KEY-IDS', 'KEY-TYPES', 'KEY-USES', 'CLAIMS'],
      [openIDConfigurationRow(
        configuration,
        keysetResult[0].status === 'fulfilled' ? keysetResult[0].value : undefined,
      )],
    )
  }

  if (options.resource === 'apiserverhealth') {
    return tableResult(
      ['NAME', 'PATH', 'STATUS', 'HEALTHY', 'MESSAGE'],
      await apiServerHealthRows(healthApi),
    )
  }

  if (options.resource === 'selfsubjectreviews') {
    const review = await authenticationApi.createSelfSubjectReview({
      body: {
        apiVersion: 'authentication.k8s.io/v1',
        kind: 'SelfSubjectReview',
      },
    })
    return tableResult(
      ['USERNAME', 'UID', 'GROUPS', 'GROUP-COUNT', 'EXTRA-KEYS', 'EXTRA'],
      [selfSubjectReviewRow(review)],
    )
  }

  if (options.resource === 'selfsubjectaccessreviews') {
    const reviewNamespaces = namespace
      ? [namespace]
      : itemsFrom(await coreApi.listNamespace()).map((item) => item.metadata?.name).filter(Boolean)
    const namespaces = reviewNamespaces.length > 0 ? reviewNamespaces : ['default']
    return tableResult(
      ['NAMESPACE', 'SCOPE', 'VERB', 'API-GROUP', 'RESOURCE', 'SUBRESOURCE', 'PATH', 'STATUS', 'REASON', 'ERROR'],
      await accessReviewRows(authorizationApi, namespaces),
    )
  }

  if (options.resource === 'selfsubjectrulesreviews') {
    const reviewNamespaces = namespace
      ? [namespace]
      : itemsFrom(await coreApi.listNamespace()).map((item) => item.metadata?.name).filter(Boolean)
    const namespaces = reviewNamespaces.length > 0 ? reviewNamespaces : ['default']
    const reviews = await Promise.all(namespaces.map(async (reviewNamespace) => {
      const review = await authorizationApi.createSelfSubjectRulesReview({
        body: {
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectRulesReview',
          spec: { namespace: reviewNamespace },
        },
      })
      return selfSubjectRuleRows(reviewNamespace, review)
    }))
    return tableResult(
      ['NAMESPACE', 'TYPE', 'VERBS', 'API-GROUPS', 'RESOURCES', 'RESOURCE-NAMES', 'NON-RESOURCE-URLS', 'STATUS', 'ERROR'],
      reviews.flat(),
    )
  }

  if (options.resource === 'deployments') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => appsApi.listNamespacedDeployment({ namespace: ns }),
      () => appsApi.listDeploymentForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((deployment) => [
      deployment.metadata?.namespace ?? '-',
      deployment.metadata?.name ?? '-',
      `${deployment.status?.readyReplicas ?? 0}/${deployment.status?.replicas ?? 0}`,
      deployment.status?.availableReplicas ?? 0,
      ageFrom(deployment.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'READY', 'AVAILABLE', 'AGE'], rows)
  }

  if (options.resource === 'daemonsets') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => appsApi.listNamespacedDaemonSet({ namespace: ns }),
      () => appsApi.listDaemonSetForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((daemonSet) => [
      daemonSet.metadata?.namespace ?? '-',
      daemonSet.metadata?.name ?? '-',
      daemonSet.status?.desiredNumberScheduled ?? 0,
      daemonSet.status?.currentNumberScheduled ?? 0,
      daemonSet.status?.numberReady ?? 0,
      ageFrom(daemonSet.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'DESIRED', 'CURRENT', 'READY', 'AGE'], rows)
  }

  if (options.resource === 'statefulsets') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => appsApi.listNamespacedStatefulSet({ namespace: ns }),
      () => appsApi.listStatefulSetForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((statefulSet) => [
      statefulSet.metadata?.namespace ?? '-',
      statefulSet.metadata?.name ?? '-',
      `${statefulSet.status?.readyReplicas ?? 0}/${statefulSet.spec?.replicas ?? 0}`,
      statefulSet.status?.updatedReplicas ?? 0,
      ageFrom(statefulSet.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'READY', 'UPDATED', 'AGE'], rows)
  }

  if (options.resource === 'replicasets') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => appsApi.listNamespacedReplicaSet({ namespace: ns }),
      () => appsApi.listReplicaSetForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((replicaSet) => [
      replicaSet.metadata?.namespace ?? '-',
      replicaSet.metadata?.name ?? '-',
      replicaSet.spec?.replicas ?? 0,
      replicaSet.status?.replicas ?? 0,
      replicaSet.status?.readyReplicas ?? 0,
      ageFrom(replicaSet.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'DESIRED', 'CURRENT', 'READY', 'AGE'], rows)
  }

  if (options.resource === 'replicationcontrollers') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedReplicationController({ namespace: ns }),
      () => coreApi.listReplicationControllerForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'DESIRED', 'CURRENT', 'READY', 'AVAILABLE', 'AGE'],
      itemsFrom(response).map(replicationControllerRow),
    )
  }

  if (options.resource === 'controllerrevisions') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => appsApi.listNamespacedControllerRevision({ namespace: ns }),
      () => appsApi.listControllerRevisionForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'REVISION', 'OWNER', 'DATA', 'AGE'],
      itemsFrom(response).map(controllerRevisionRow),
    )
  }

  if (options.resource === 'podtemplates') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPodTemplate({ namespace: ns }),
      () => coreApi.listPodTemplateForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'CONTAINERS', 'IMAGES', 'RESTART', 'SERVICEACCOUNT', 'LABELS', 'NODE-SELECTOR', 'AGE'],
      itemsFrom(response).map(podTemplateRow),
    )
  }

  if (options.resource === 'jobs') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => batchApi.listNamespacedJob({ namespace: ns }),
      () => batchApi.listJobForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((job) => [
      job.metadata?.namespace ?? '-',
      job.metadata?.name ?? '-',
      `${job.status?.succeeded ?? 0}/${job.spec?.completions ?? 1}`,
      job.status?.active ?? 0,
      job.status?.failed ?? 0,
      job.spec?.suspend ? 'true' : 'false',
      ageFrom(job.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'COMPLETIONS', 'ACTIVE', 'FAILED', 'SUSPEND', 'AGE'], rows)
  }

  if (options.resource === 'cronjobs') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => batchApi.listNamespacedCronJob({ namespace: ns }),
      () => batchApi.listCronJobForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((cronJob) => [
      cronJob.metadata?.namespace ?? '-',
      cronJob.metadata?.name ?? '-',
      cronJob.spec?.schedule ?? '-',
      cronJob.spec?.suspend ? 'true' : 'false',
      cronJob.status?.active?.length ?? 0,
      ageFrom(cronJob.status?.lastScheduleTime),
      ageFrom(cronJob.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'SCHEDULE', 'SUSPEND', 'ACTIVE', 'LAST', 'AGE'], rows)
  }

  if (options.resource === 'helmreleases') {
    const results = await Promise.allSettled([
      listNamespacedOrAll(
        namespace,
        (ns) => coreApi.listNamespacedSecret({ namespace: ns }),
        () => coreApi.listSecretForAllNamespaces(),
      ),
      listNamespacedOrAll(
        namespace,
        (ns) => coreApi.listNamespacedConfigMap({ namespace: ns }),
        () => coreApi.listConfigMapForAllNamespaces(),
      ),
    ])
    const latest = new Map()
    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason)

    const addRelease = (release) => {
      if (!release) return
      const key = `${release.namespace}/${release.name}`
      const previous = latest.get(key)
      if (!previous || release.revision > previous.revision || (
        release.revision === previous.revision && release.updatedTime > previous.updatedTime
      )) {
        latest.set(key, release)
      }
    }

    if (results[0].status === 'fulfilled') {
      itemsFrom(results[0].value).forEach((secret) => addRelease(helmReleaseFromStorage('Secret', secret)))
    }
    if (results[1].status === 'fulfilled') {
      itemsFrom(results[1].value).forEach((configMap) => addRelease(helmReleaseFromStorage('ConfigMap', configMap)))
    }
    if (latest.size === 0 && errors.length > 0) {
      throw errors[0]
    }

    const rows = [...latest.values()]
      .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name))
      .map((release) => [
        release.namespace,
        release.name,
        release.revision,
        release.status,
        release.chart,
        release.appVersion,
        release.updated,
        release.storage,
        release.age,
      ])
    return tableResult(['NAMESPACE', 'NAME', 'REVISION', 'STATUS', 'CHART', 'APP', 'UPDATED', 'STORAGE', 'AGE'], rows)
  }

  if (options.resource === 'helmcharts') {
    if (Array.isArray(kubeConfig.helmCharts)) {
      return helmChartTable(kubeConfig.helmCharts)
    }
    return loadHelmChartRows(options)
  }

  if (options.resource === 'helmrepositories') {
    if (Array.isArray(kubeConfig.helmRepositories)) {
      return helmRepositoryTable(kubeConfig.helmRepositories)
    }
    return loadHelmRepositoryRows(options)
  }

  if (options.resource === 'poddisruptionbudgets') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => policyApi.listNamespacedPodDisruptionBudget({ namespace: ns }),
      () => policyApi.listPodDisruptionBudgetForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((pdb) => [
      pdb.metadata?.namespace ?? '-',
      pdb.metadata?.name ?? '-',
      pdb.spec?.minAvailable ?? '-',
      pdb.spec?.maxUnavailable ?? '-',
      pdb.status?.disruptionsAllowed ?? 0,
      pdb.status?.currentHealthy ?? 0,
      pdb.status?.desiredHealthy ?? 0,
      pdb.status?.expectedPods ?? 0,
      ageFrom(pdb.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'MIN', 'MAX', 'ALLOWED', 'HEALTHY', 'DESIRED', 'EXPECTED', 'AGE'], rows)
  }

  if (options.resource === 'resourcequotas') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedResourceQuota({ namespace: ns }),
      () => coreApi.listResourceQuotaForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((quota) => [
      quota.metadata?.namespace ?? '-',
      quota.metadata?.name ?? '-',
      truncate(formatResourceMap(quota.status?.hard ?? quota.spec?.hard), 64),
      truncate(formatResourceMap(quota.status?.used), 64),
      quota.spec?.scopes?.join(',') || '-',
      ageFrom(quota.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'HARD', 'USED', 'SCOPES', 'AGE'], rows)
  }

  if (options.resource === 'limitranges') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedLimitRange({ namespace: ns }),
      () => coreApi.listLimitRangeForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((limitRange) => {
      const limits = limitRange.spec?.limits ?? []
      return [
        limitRange.metadata?.namespace ?? '-',
        limitRange.metadata?.name ?? '-',
        limits.map((limit) => limit.type).filter(Boolean).join(',') || '-',
        truncate(formatLimitRangeMap(limits, 'min'), 48),
        truncate(formatLimitRangeMap(limits, 'max'), 48),
        truncate(formatLimitRangeMap(limits, 'default'), 48),
        truncate(formatLimitRangeMap(limits, 'defaultRequest'), 48),
        truncate(formatLimitRangeMap(limits, 'maxLimitRequestRatio'), 48),
        ageFrom(limitRange.metadata?.creationTimestamp),
      ]
    })
    return tableResult(['NAMESPACE', 'NAME', 'TYPES', 'MIN', 'MAX', 'DEFAULT', 'REQUEST', 'RATIO', 'AGE'], rows)
  }

  if (options.resource === 'priorityclasses') {
    const response = await schedulingApi.listPriorityClass()
    return tableResult(
      ['NAME', 'VALUE', 'GLOBAL', 'PREEMPTION', 'DESCRIPTION', 'AGE'],
      itemsFrom(response).map(priorityClassRow),
    )
  }

  if (options.resource === 'runtimeclasses') {
    const response = await nodeApi.listRuntimeClass()
    return tableResult(
      ['NAME', 'HANDLER', 'OVERHEAD', 'NODE-SELECTOR', 'TOLERATIONS', 'AGE'],
      itemsFrom(response).map(runtimeClassRow),
    )
  }

  if (options.resource === 'services') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedService({ namespace: ns }),
      () => coreApi.listServiceForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((service) => {
      const ports = (service.spec?.ports ?? []).map((port) => `${port.port}/${port.protocol?.toLowerCase() ?? 'tcp'}`).join(',')
      return [
        service.metadata?.namespace ?? '-',
        service.metadata?.name ?? '-',
        service.spec?.type ?? '-',
        service.spec?.clusterIP ?? '-',
        ports || '-',
        ageFrom(service.metadata?.creationTimestamp),
      ]
    })
    return tableResult(['NAMESPACE', 'NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'AGE'], rows)
  }

  if (options.resource === 'nodes' || options.resource === 'topnodes') {
    const response = await coreApi.listNode()
    const metrics = await listNodeMetricUsage(customObjectsApi)
    const rows = itemsFrom(response).map((node) => {
      const readyCondition = (node.status?.conditions ?? []).find((condition) => condition.type === 'Ready')
      const status = readyCondition?.status === 'True' ? 'Ready' : 'NotReady'
      const labels = node.metadata?.labels ?? {}
      const usage = metrics.get(node.metadata?.name)
      const roles = Object.keys(labels)
        .filter((key) => key.startsWith('node-role.kubernetes.io/'))
        .map((key) => key.replace('node-role.kubernetes.io/', '') || 'control-plane')
        .join(',')
      return [
        node.metadata?.name ?? '-',
        status,
        node.spec?.unschedulable ? 'disabled' : 'enabled',
        roles || '-',
        node.status?.nodeInfo?.kubeletVersion ?? '-',
        usage?.cpu ?? '-',
        usage?.memory ?? '-',
        ageFrom(node.metadata?.creationTimestamp),
      ]
    })
    return tableResult(
      ['NAME', 'STATUS', 'SCHEDULING', 'ROLES', 'VERSION', 'CPU', 'MEMORY', 'AGE'],
      options.resource === 'topnodes' ? sortRowsByCpu(rows, 5) : rows,
    )
  }

  if (options.resource === 'namespaces') {
    const response = await coreApi.listNamespace()
    const rows = itemsFrom(response).map((item) => [
      item.metadata?.name ?? '-',
      item.status?.phase ?? '-',
      ageFrom(item.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'STATUS', 'AGE'], rows)
  }

  if (options.resource === 'configmaps') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedConfigMap({ namespace: ns }),
      () => coreApi.listConfigMapForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((configMap) => [
      configMap.metadata?.namespace ?? '-',
      configMap.metadata?.name ?? '-',
      Object.keys(configMap.data ?? {}).length,
      ageFrom(configMap.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'DATA', 'AGE'], rows)
  }

  if (options.resource === 'secrets') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedSecret({ namespace: ns }),
      () => coreApi.listSecretForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((secret) => [
      secret.metadata?.namespace ?? '-',
      secret.metadata?.name ?? '-',
      secret.type ?? 'Opaque',
      Object.keys(secret.data ?? {}).length,
      ageFrom(secret.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'TYPE', 'DATA', 'AGE'], rows)
  }

  if (options.resource === 'endpoints') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedEndpoints({ namespace: ns }),
      () => coreApi.listEndpointsForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((endpoint) => {
      const subsets = endpoint.subsets ?? []
      const readyAddresses = subsets.flatMap((subset) => subset.addresses?.map((address) => address.ip) ?? [])
      const notReadyAddresses = subsets.flatMap((subset) => subset.notReadyAddresses?.map((address) => address.ip) ?? [])
      const ports = uniqueValues(subsets.map((subset) => formatEndpointPorts(subset.ports)).filter((value) => value !== '-'))
      return [
        endpoint.metadata?.namespace ?? '-',
        endpoint.metadata?.name ?? '-',
        readyAddresses.length,
        notReadyAddresses.length,
        truncate(uniqueValues([...readyAddresses, ...notReadyAddresses]).join(',') || '-', 64),
        truncate(ports.join(';') || '-', 48),
        ageFrom(endpoint.metadata?.creationTimestamp),
      ]
    })
    return tableResult(['NAMESPACE', 'NAME', 'READY', 'NOT-READY', 'ADDRESSES', 'PORTS', 'AGE'], rows)
  }

  if (options.resource === 'leases') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coordinationApi.listNamespacedLease({ namespace: ns }),
      () => coordinationApi.listLeaseForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'HOLDER', 'DURATION', 'ACQUIRE', 'RENEW', 'TRANSITIONS', 'AGE'],
      itemsFrom(response).map(leaseRow),
    )
  }

  if (options.resource === 'leasecandidates') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coordinationBetaApi.listNamespacedLeaseCandidate({ namespace: ns }),
      () => coordinationBetaApi.listLeaseCandidateForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'LEASE', 'BINARY', 'EMULATION', 'STRATEGY', 'PING', 'RENEW', 'AGE'],
      itemsFrom(response).map(leaseCandidateRow),
    )
  }

  if (options.resource === 'ingresses') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => networkingApi.listNamespacedIngress({ namespace: ns }),
      () => networkingApi.listIngressForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((ingress) => {
      const hosts = (ingress.spec?.rules ?? []).map((rule) => rule.host).filter(Boolean).join(',')
      const address = (ingress.status?.loadBalancer?.ingress ?? []).map((item) => item.ip || item.hostname).filter(Boolean).join(',')
      return [
        ingress.metadata?.namespace ?? '-',
        ingress.metadata?.name ?? '-',
        ingress.spec?.ingressClassName ?? '-',
        hosts || '*',
        address || '-',
        ageFrom(ingress.metadata?.creationTimestamp),
      ]
    })
    return tableResult(['NAMESPACE', 'NAME', 'CLASS', 'HOSTS', 'ADDRESS', 'AGE'], rows)
  }

  if (options.resource === 'ingressclasses') {
    const response = await networkingApi.listIngressClass()
    return tableResult(
      ['NAME', 'CONTROLLER', 'PARAMETERS', 'DEFAULT', 'AGE'],
      itemsFrom(response).map(ingressClassRow),
    )
  }

  if (options.resource === 'gatewayclasses') {
    const response = await customObjectsApi.listClusterCustomObject({
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      plural: 'gatewayclasses',
    })
    return tableResult(
      ['NAME', 'CONTROLLER', 'ACCEPTED', 'PARAMETERS', 'AGE'],
      itemsFrom(response).map(gatewayClassRow),
    )
  }

  if (options.resource === 'gateways') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'gateways',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        plural: 'gateways',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'CLASS', 'ADDRESS', 'LISTENERS', 'ROUTES', 'PROGRAMMED', 'AGE'],
      itemsFrom(response).map(gatewayRow),
    )
  }

  if (options.resource === 'httproutes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'httproutes',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        plural: 'httproutes',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'HOSTNAMES', 'PARENTS', 'RULES', 'BACKENDS', 'ACCEPTED', 'REFS', 'AGE'],
      itemsFrom(response).map(gatewayRouteRow),
    )
  }

  if (options.resource === 'grpcroutes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'grpcroutes',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        plural: 'grpcroutes',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'HOSTNAMES', 'PARENTS', 'RULES', 'BACKENDS', 'ACCEPTED', 'REFS', 'AGE'],
      itemsFrom(response).map(gatewayRouteRow),
    )
  }

  if (options.resource === 'tlsroutes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'tlsroutes',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        plural: 'tlsroutes',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'HOSTNAMES', 'PARENTS', 'RULES', 'BACKENDS', 'ACCEPTED', 'REFS', 'AGE'],
      itemsFrom(response).map(gatewayRouteRow),
    )
  }

  if (options.resource === 'tcproutes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1alpha2',
        namespace: ns,
        plural: 'tcproutes',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1alpha2',
        plural: 'tcproutes',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'PARENTS', 'RULES', 'BACKENDS', 'ACCEPTED', 'REFS', 'AGE'],
      itemsFrom(response).map(gatewayL4RouteRow),
    )
  }

  if (options.resource === 'udproutes') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1alpha2',
        namespace: ns,
        plural: 'udproutes',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1alpha2',
        plural: 'udproutes',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'PARENTS', 'RULES', 'BACKENDS', 'ACCEPTED', 'REFS', 'AGE'],
      itemsFrom(response).map(gatewayL4RouteRow),
    )
  }

  if (options.resource === 'referencegrants') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'referencegrants',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'gateway.networking.k8s.io',
        version: 'v1',
        plural: 'referencegrants',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'FROM', 'TO', 'AGE'],
      itemsFrom(response).map(referenceGrantRow),
    )
  }

  if (options.resource === 'networkpolicies') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => networkingApi.listNamespacedNetworkPolicy({ namespace: ns }),
      () => networkingApi.listNetworkPolicyForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((policy) => [
      policy.metadata?.namespace ?? '-',
      policy.metadata?.name ?? '-',
      formatLabelSelector(policy.spec?.podSelector),
      policy.spec?.policyTypes?.join(',') || '-',
      policy.spec?.ingress?.length ?? 0,
      policy.spec?.egress?.length ?? 0,
      ageFrom(policy.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'POD-SELECTOR', 'TYPES', 'INGRESS', 'EGRESS', 'AGE'], rows)
  }

  if (options.resource === 'ipaddresses') {
    const response = await networkingApi.listIPAddress()
    return tableResult(
      ['NAME', 'PARENT', 'GROUP', 'RESOURCE', 'NAMESPACE', 'PARENT-NAME', 'AGE'],
      itemsFrom(response).map(ipAddressRow),
    )
  }

  if (options.resource === 'servicecidrs') {
    const response = await networkingApi.listServiceCIDR()
    return tableResult(
      ['NAME', 'CIDRS', 'CIDR-COUNT', 'READY', 'CONDITIONS', 'AGE'],
      itemsFrom(response).map(serviceCIDRRow),
    )
  }

  if (options.resource === 'endpointslices') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => discoveryApi.listNamespacedEndpointSlice({ namespace: ns }),
      () => discoveryApi.listEndpointSliceForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((slice) => {
      const endpoints = slice.endpoints ?? []
      return [
        slice.metadata?.namespace ?? '-',
        slice.metadata?.name ?? '-',
        slice.metadata?.labels?.['kubernetes.io/service-name'] ?? '-',
        slice.addressType ?? '-',
        endpoints.length,
        endpoints.filter((endpoint) => endpoint.conditions?.ready !== false).length,
        endpoints.filter((endpoint) => endpoint.conditions?.ready === false).length,
        truncate(uniqueValues(endpoints.flatMap((endpoint) => endpoint.addresses ?? [])).join(',') || '-', 64),
        truncate(formatEndpointPorts(slice.ports), 48),
        ageFrom(slice.metadata?.creationTimestamp),
      ]
    })
    return tableResult(['NAMESPACE', 'NAME', 'SERVICE', 'TYPE', 'ENDPOINTS', 'READY', 'NOT-READY', 'ADDRESSES', 'PORTS', 'AGE'], rows)
  }

  if (options.resource === 'apiservices') {
    const response = await apiregistrationApi.listAPIService()
    return tableResult(
      ['NAME', 'GROUP', 'VERSION', 'SERVICE', 'AVAILABLE', 'REASON', 'GROUP-PRI', 'VERSION-PRI', 'SKIP-TLS', 'AGE'],
      itemsFrom(response).map(apiServiceRow),
    )
  }

  if (options.resource === 'mutatingwebhookconfigurations') {
    const response = await admissionApi.listMutatingWebhookConfiguration()
    return tableResult(
      ['NAME', 'WEBHOOKS', 'FAILURE', 'SIDE-EFFECTS', 'VERSIONS', 'CLIENTS', 'RULES', 'AGE'],
      itemsFrom(response).map(admissionWebhookRow),
    )
  }

  if (options.resource === 'validatingwebhookconfigurations') {
    const response = await admissionApi.listValidatingWebhookConfiguration()
    return tableResult(
      ['NAME', 'WEBHOOKS', 'FAILURE', 'SIDE-EFFECTS', 'VERSIONS', 'CLIENTS', 'RULES', 'AGE'],
      itemsFrom(response).map(admissionWebhookRow),
    )
  }

  if (options.resource === 'mutatingadmissionpolicies') {
    const response = await admissionBetaApi.listMutatingAdmissionPolicy()
    return tableResult(
      ['NAME', 'FAILURE', 'REINVOKE', 'MUTATIONS', 'VARIABLES', 'CONDITIONS', 'RULES', 'PARAM', 'AGE'],
      itemsFrom(response).map(mutatingAdmissionPolicyRow),
    )
  }

  if (options.resource === 'mutatingadmissionpolicybindings') {
    const response = await admissionBetaApi.listMutatingAdmissionPolicyBinding()
    return tableResult(
      ['NAME', 'POLICY', 'PARAM', 'RULES', 'AGE'],
      itemsFrom(response).map(mutatingAdmissionPolicyBindingRow),
    )
  }

  if (options.resource === 'validatingadmissionpolicies') {
    const response = await admissionApi.listValidatingAdmissionPolicy()
    return tableResult(
      ['NAME', 'FAILURE', 'VALIDATIONS', 'AUDIT', 'RULES', 'PARAM', 'CONDITION', 'WARNINGS', 'AGE'],
      itemsFrom(response).map(validatingAdmissionPolicyRow),
    )
  }

  if (options.resource === 'validatingadmissionpolicybindings') {
    const response = await admissionApi.listValidatingAdmissionPolicyBinding()
    return tableResult(
      ['NAME', 'POLICY', 'ACTIONS', 'PARAM', 'RULES', 'AGE'],
      itemsFrom(response).map(validatingAdmissionPolicyBindingRow),
    )
  }

  if (options.resource === 'flowschemas') {
    const response = await flowcontrolApi.listFlowSchema()
    return tableResult(
      ['NAME', 'PRIORITY', 'PRECEDENCE', 'DISTINGUISHER', 'SUBJECTS', 'RULES', 'CONDITION', 'AGE'],
      itemsFrom(response).map(flowSchemaRow),
    )
  }

  if (options.resource === 'prioritylevelconfigurations') {
    const response = await flowcontrolApi.listPriorityLevelConfiguration()
    return tableResult(
      ['NAME', 'TYPE', 'SHARES', 'LENDABLE', 'BORROWING', 'RESPONSE', 'QUEUES', 'HAND', 'QUEUE-LIMIT', 'CONDITION', 'AGE'],
      itemsFrom(response).map(priorityLevelConfigurationRow),
    )
  }

  if (options.resource === 'certificatesigningrequests') {
    const response = await certificatesApi.listCertificateSigningRequest()
    return tableResult(
      ['NAME', 'SIGNER', 'REQUESTOR', 'CONDITION', 'REASON', 'USAGES', 'EXPIRATION', 'AGE'],
      itemsFrom(response).map(certificateSigningRequestRow),
    )
  }

  if (options.resource === 'clustertrustbundles') {
    const response = await certificatesBetaApi.listClusterTrustBundle()
    return tableResult(
      ['NAME', 'SIGNER', 'CERTS', 'BYTES', 'CONFIGURED', 'AGE'],
      itemsFrom(response).map(clusterTrustBundleRow),
    )
  }

  if (options.resource === 'podcertificaterequests') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => certificatesAlphaApi.listNamespacedPodCertificateRequest({ namespace: ns }),
      () => certificatesAlphaApi.listPodCertificateRequestForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'SIGNER', 'POD', 'NODE', 'SERVICEACCOUNT', 'CONDITION', 'CERT', 'NOT-AFTER', 'AGE'],
      itemsFrom(response).map(podCertificateRequestRow),
    )
  }

  if (options.resource === 'storageversions') {
    const response = await internalApiserverApi.listStorageVersion()
    return tableResult(
      ['NAME', 'COMMON-ENCODING', 'API-SERVERS', 'CONDITION', 'AGE'],
      itemsFrom(response).map(storageVersionRow),
    )
  }

  if (options.resource === 'storageversionmigrations') {
    const response = await storagemigrationApi.listStorageVersionMigration()
    return tableResult(
      ['NAME', 'RESOURCE', 'GROUP', 'VERSION', 'RESOURCE-VERSION', 'CONDITION', 'CONTINUE', 'AGE'],
      itemsFrom(response).map(storageVersionMigrationRow),
    )
  }

  if (options.resource === 'persistentvolumes') {
    const response = await coreApi.listPersistentVolume()
    const rows = itemsFrom(response).map((volume) => [
      volume.metadata?.name ?? '-',
      volume.spec?.capacity?.storage ?? '-',
      (volume.spec?.accessModes ?? []).join(',') || '-',
      volume.spec?.persistentVolumeReclaimPolicy ?? '-',
      volume.status?.phase ?? '-',
      volume.spec?.storageClassName ?? '-',
      ageFrom(volume.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'CAPACITY', 'ACCESS', 'RECLAIM', 'STATUS', 'STORAGECLASS', 'AGE'], rows)
  }

  if (options.resource === 'persistentvolumeclaims') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedPersistentVolumeClaim({ namespace: ns }),
      () => coreApi.listPersistentVolumeClaimForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((claim) => [
      claim.metadata?.namespace ?? '-',
      claim.metadata?.name ?? '-',
      claim.status?.phase ?? '-',
      claim.spec?.volumeName ?? '-',
      claim.status?.capacity?.storage ?? claim.spec?.resources?.requests?.storage ?? '-',
      (claim.spec?.accessModes ?? []).join(',') || '-',
      claim.spec?.storageClassName ?? '-',
      ageFrom(claim.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'STATUS', 'VOLUME', 'CAPACITY', 'ACCESS', 'STORAGECLASS', 'AGE'], rows)
  }

  if (options.resource === 'storageclasses') {
    const response = await storageApi.listStorageClass()
    const rows = itemsFrom(response).map((storageClass) => [
      storageClass.metadata?.name ?? '-',
      storageClass.provisioner ?? '-',
      storageClass.reclaimPolicy ?? 'Delete',
      storageClass.volumeBindingMode ?? 'Immediate',
      ageFrom(storageClass.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'PROVISIONER', 'RECLAIM', 'BINDING', 'AGE'], rows)
  }

  if (options.resource === 'volumeattributesclasses') {
    const response = await storageApi.listVolumeAttributesClass()
    return tableResult(
      ['NAME', 'DRIVER', 'PARAMETERS', 'PARAM-COUNT', 'AGE'],
      itemsFrom(response).map(volumeAttributesClassRow),
    )
  }

  if (options.resource === 'csidrivers') {
    const response = await storageApi.listCSIDriver()
    return tableResult(
      ['NAME', 'ATTACH', 'POD-INFO', 'CAPACITY', 'REPUBLISH', 'SELINUX', 'LIFECYCLE', 'FSGROUP', 'AGE'],
      itemsFrom(response).map(csiDriverRow),
    )
  }

  if (options.resource === 'csinodes') {
    const response = await storageApi.listCSINode()
    return tableResult(
      ['NAME', 'DRIVERS', 'DRIVER-NAMES', 'NODE-IDS', 'TOPOLOGY', 'ALLOCATABLE', 'AGE'],
      itemsFrom(response).map(csiNodeRow),
    )
  }

  if (options.resource === 'volumeattachments') {
    const response = await storageApi.listVolumeAttachment()
    return tableResult(
      ['NAME', 'ATTACHER', 'NODE', 'SOURCE', 'ATTACHED', 'ATTACH-ERR', 'DETACH-ERR', 'AGE'],
      itemsFrom(response).map(volumeAttachmentRow),
    )
  }

  if (options.resource === 'csistoragecapacities') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => storageApi.listNamespacedCSIStorageCapacity({ namespace: ns }),
      () => storageApi.listCSIStorageCapacityForAllNamespaces(),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'STORAGECLASS', 'CAPACITY', 'MAX-VOLUME', 'TOPOLOGY', 'AGE'],
      itemsFrom(response).map(csiStorageCapacityRow),
    )
  }

  if (options.resource === 'volumesnapshotclasses') {
    const response = await customObjectsApi.listClusterCustomObject({
      group: 'snapshot.storage.k8s.io',
      version: 'v1',
      plural: 'volumesnapshotclasses',
    })
    return tableResult(
      ['NAME', 'DRIVER', 'DELETION', 'PARAMETERS', 'AGE'],
      itemsFrom(response).map(volumeSnapshotClassRow),
    )
  }

  if (options.resource === 'volumesnapshots') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'snapshot.storage.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'volumesnapshots',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'snapshot.storage.k8s.io',
        version: 'v1',
        plural: 'volumesnapshots',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'CLASS', 'SOURCE', 'CONTENT', 'READY', 'RESTORE-SIZE', 'ERROR', 'AGE'],
      itemsFrom(response).map(volumeSnapshotRow),
    )
  }

  if (options.resource === 'volumesnapshotcontents') {
    const response = await customObjectsApi.listClusterCustomObject({
      group: 'snapshot.storage.k8s.io',
      version: 'v1',
      plural: 'volumesnapshotcontents',
    })
    return tableResult(
      ['NAME', 'CLASS', 'DRIVER', 'DELETION', 'SOURCE', 'SNAPSHOT', 'READY', 'RESTORE-SIZE', 'HANDLE', 'AGE'],
      itemsFrom(response).map(volumeSnapshotContentRow),
    )
  }

  if (options.resource === 'deviceclasses') {
    const response = await customObjectsApi.listClusterCustomObject({
      group: 'resource.k8s.io',
      version: 'v1',
      plural: 'deviceclasses',
    })
    return tableResult(
      ['NAME', 'EXTENDED-RESOURCE', 'SELECTORS', 'CONFIG', 'AGE'],
      itemsFrom(response).map(deviceClassRow),
    )
  }

  if (options.resource === 'devicetaintrules') {
    const response = await resourceAlphaApi.listDeviceTaintRule()
    return tableResult(
      ['NAME', 'DRIVER', 'POOL', 'DEVICECLASS', 'DEVICE', 'CEL', 'TAINT-KEY', 'VALUE', 'EFFECT', 'TIME-ADDED', 'AGE'],
      itemsFrom(response).map(deviceTaintRuleRow),
    )
  }

  if (options.resource === 'resourceclaims') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'resource.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'resourceclaims',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'resource.k8s.io',
        version: 'v1',
        plural: 'resourceclaims',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'DEVICECLASSES', 'REQUESTS', 'ALLOCATED', 'DEVICES', 'RESERVED', 'REQUEST-DETAILS', 'AGE'],
      itemsFrom(response).map(resourceClaimRow),
    )
  }

  if (options.resource === 'resourceclaimtemplates') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => customObjectsApi.listNamespacedCustomObject({
        group: 'resource.k8s.io',
        version: 'v1',
        namespace: ns,
        plural: 'resourceclaimtemplates',
      }),
      () => customObjectsApi.listCustomObjectForAllNamespaces({
        group: 'resource.k8s.io',
        version: 'v1',
        plural: 'resourceclaimtemplates',
      }),
    )
    return tableResult(
      ['NAMESPACE', 'NAME', 'DEVICECLASSES', 'REQUESTS', 'REQUEST-DETAILS', 'AGE'],
      itemsFrom(response).map(resourceClaimTemplateRow),
    )
  }

  if (options.resource === 'resourceslices') {
    const response = await customObjectsApi.listClusterCustomObject({
      group: 'resource.k8s.io',
      version: 'v1',
      plural: 'resourceslices',
    })
    return tableResult(
      ['NAME', 'DRIVER', 'POOL', 'NODE', 'DEVICES', 'ALL-NODES', 'DEVICE-NAMES', 'AGE'],
      itemsFrom(response).map(resourceSliceRow),
    )
  }

  if (options.resource === 'serviceaccounts') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedServiceAccount({ namespace: ns }),
      () => coreApi.listServiceAccountForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((serviceAccount) => [
      serviceAccount.metadata?.namespace ?? '-',
      serviceAccount.metadata?.name ?? '-',
      serviceAccount.secrets?.length ?? 0,
      ageFrom(serviceAccount.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'SECRETS', 'AGE'], rows)
  }

  if (options.resource === 'roles') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => rbacApi.listNamespacedRole({ namespace: ns }),
      () => rbacApi.listRoleForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((role) => [
      role.metadata?.namespace ?? '-',
      role.metadata?.name ?? '-',
      role.rules?.length ?? 0,
      ageFrom(role.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'RULES', 'AGE'], rows)
  }

  if (options.resource === 'rolebindings') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => rbacApi.listNamespacedRoleBinding({ namespace: ns }),
      () => rbacApi.listRoleBindingForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((roleBinding) => [
      roleBinding.metadata?.namespace ?? '-',
      roleBinding.metadata?.name ?? '-',
      formatRef(roleBinding.roleRef),
      roleBinding.subjects?.length ?? 0,
      ageFrom(roleBinding.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'ROLE', 'SUBJECTS', 'AGE'], rows)
  }

  if (options.resource === 'clusterroles') {
    const response = await rbacApi.listClusterRole()
    const rows = itemsFrom(response).map((clusterRole) => [
      clusterRole.metadata?.name ?? '-',
      clusterRole.rules?.length ?? 0,
      ageFrom(clusterRole.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'RULES', 'AGE'], rows)
  }

  if (options.resource === 'clusterrolebindings') {
    const response = await rbacApi.listClusterRoleBinding()
    const rows = itemsFrom(response).map((clusterRoleBinding) => [
      clusterRoleBinding.metadata?.name ?? '-',
      formatRef(clusterRoleBinding.roleRef),
      clusterRoleBinding.subjects?.length ?? 0,
      ageFrom(clusterRoleBinding.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'ROLE', 'SUBJECTS', 'AGE'], rows)
  }

  if (options.resource === 'customresources') {
    const { descriptor } = await customResourceDescriptorForOptions(apiextensionsApi, options)
    const response = descriptor.namespaced
      ? await listNamespacedOrAll(
        namespace,
        (ns) => customObjectsApi.listNamespacedCustomObject({
          group: descriptor.group,
          version: descriptor.version,
          namespace: ns,
          plural: descriptor.plural,
        }),
        () => customObjectsApi.listCustomObjectForAllNamespaces({
          group: descriptor.group,
          version: descriptor.version,
          plural: descriptor.plural,
        }),
      )
      : await customObjectsApi.listClusterCustomObject({
        group: descriptor.group,
        version: descriptor.version,
        plural: descriptor.plural,
      })
    const rows = itemsFrom(response).map((resource) => [
      resource.metadata?.namespace ?? '-',
      resource.metadata?.name ?? '-',
      resource.kind ?? descriptor.kind,
      resource.apiVersion ?? `${descriptor.group}/${descriptor.version}`,
      customResourceStatus(resource),
      ageFrom(resource.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'KIND', 'APIVERSION', 'STATUS', 'AGE'], rows)
  }

  if (options.resource === 'customresourcedefinitions') {
    const response = await apiextensionsApi.listCustomResourceDefinition()
    const rows = itemsFrom(response).map((crd) => [
      crd.metadata?.name ?? '-',
      crd.spec?.group ?? '-',
      crd.spec?.names?.kind ?? '-',
      crd.spec?.scope ?? '-',
      (crd.spec?.versions ?? []).map((version) => version.name).join(',') || '-',
      (crd.status?.conditions ?? []).some((condition) => condition.type === 'Established' && condition.status === 'True')
        ? 'Established'
        : 'Pending',
      ageFrom(crd.metadata?.creationTimestamp),
    ])
    return tableResult(['NAME', 'GROUP', 'KIND', 'SCOPE', 'VERSIONS', 'STATUS', 'AGE'], rows)
  }

  if (options.resource === 'horizontalpodautoscalers') {
    const response = await listNamespacedOrAll(
      namespace,
      (ns) => autoscalingApi.listNamespacedHorizontalPodAutoscaler({ namespace: ns }),
      () => autoscalingApi.listHorizontalPodAutoscalerForAllNamespaces(),
    )
    const rows = itemsFrom(response).map((hpa) => [
      hpa.metadata?.namespace ?? '-',
      hpa.metadata?.name ?? '-',
      formatRef(hpa.spec?.scaleTargetRef),
      hpa.spec?.minReplicas ?? 1,
      hpa.spec?.maxReplicas ?? 0,
      hpa.status?.currentReplicas ?? 0,
      hpa.status?.desiredReplicas ?? 0,
      ageFrom(hpa.metadata?.creationTimestamp),
    ])
    return tableResult(['NAMESPACE', 'NAME', 'REFERENCE', 'MIN', 'MAX', 'CURRENT', 'DESIRED', 'AGE'], rows)
  }

  let response
  try {
    response = await listNamespacedOrAll(
      namespace,
      (ns) => eventsApi.listNamespacedEvent({ namespace: ns }),
      () => eventsApi.listEventForAllNamespaces(),
    )
  } catch {
    response = await listNamespacedOrAll(
      namespace,
      (ns) => coreApi.listNamespacedEvent({ namespace: ns }),
      () => coreApi.listEventForAllNamespaces(),
    )
  }
  const rows = itemsFrom(response).map(eventRow)
  return tableResult(['NAMESPACE', 'TYPE', 'REASON', 'OBJECT', 'MESSAGE', 'COUNT', 'AGE'], rows)
}

export const deleteResourceRows = async (kubeConfig, options) => {
  if (options.resource === 'helmreleases') {
    return uninstallHelmReleaseRows(kubeConfig, options)
  }
  if (options.resource === 'helmrepositories') {
    return removeHelmRepositoryRows(options)
  }

  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  const customObjectsApi = kubeConfig.makeApiClient(CustomObjectsApi)
  const clients = {
    admission: kubeConfig.makeApiClient(AdmissionregistrationV1Api),
    admissionBeta: kubeConfig.makeApiClient(AdmissionregistrationV1beta1Api),
    apiextensions: kubeConfig.makeApiClient(ApiextensionsV1Api),
    apiregistration: kubeConfig.makeApiClient(ApiregistrationV1Api),
    apps: kubeConfig.makeApiClient(AppsV1Api),
    autoscaling: kubeConfig.makeApiClient(AutoscalingV2Api),
    batch: kubeConfig.makeApiClient(BatchV1Api),
    certificates: kubeConfig.makeApiClient(CertificatesV1Api),
    certificatesAlpha: kubeConfig.makeApiClient(CertificatesV1alpha1Api),
    certificatesBeta: kubeConfig.makeApiClient(CertificatesV1beta1Api),
    coordination: kubeConfig.makeApiClient(CoordinationV1Api),
    coordinationBeta: kubeConfig.makeApiClient(CoordinationV1beta1Api),
    core: coreApi,
    discovery: kubeConfig.makeApiClient(DiscoveryV1Api),
    events: kubeConfig.makeApiClient(EventsV1Api),
    flowcontrol: kubeConfig.makeApiClient(FlowcontrolApiserverV1Api),
    internalApiserver: kubeConfig.makeApiClient(InternalApiserverV1alpha1Api),
    networking: kubeConfig.makeApiClient(NetworkingV1Api),
    node: kubeConfig.makeApiClient(NodeV1Api),
    policy: kubeConfig.makeApiClient(PolicyV1Api),
    rbac: kubeConfig.makeApiClient(RbacAuthorizationV1Api),
    resourceAlpha: kubeConfig.makeApiClient(ResourceV1alpha3Api),
    scheduling: kubeConfig.makeApiClient(SchedulingV1Api),
    storage: kubeConfig.makeApiClient(StorageV1Api),
    storagemigration: kubeConfig.makeApiClient(StoragemigrationV1alpha1Api),
  }
  const namespace = namespaceArg(options)
  const name = options.name

  if (options.resource === 'events') {
    const targetNamespace = requireDeleteNamespace(options.resource, namespace)
    try {
      await clients.events.deleteNamespacedEvent({
        namespace: targetNamespace,
        name,
        body: deleteBody(),
      })
    } catch {
      await coreApi.deleteNamespacedEvent({
        namespace: targetNamespace,
        name,
        body: deleteBody(),
      })
    }
    return deleteResult(options.resource, targetNamespace, name)
  }

  const namespacedMethod = NAMESPACED_DELETE_METHODS[options.resource]
  if (namespacedMethod) {
    const targetNamespace = requireDeleteNamespace(options.resource, namespace)
    const [clientName, method] = namespacedMethod
    return deleteGeneratedResource({
      api: clients[clientName],
      method,
      resource: options.resource,
      namespace: targetNamespace,
      name,
    })
  }

  const clusterMethod = CLUSTER_DELETE_METHODS[options.resource]
  if (clusterMethod) {
    const [clientName, method] = clusterMethod
    return deleteGeneratedResource({
      api: clients[clientName],
      method,
      resource: options.resource,
      namespace: undefined,
      name,
    })
  }

  if (options.resource === 'customresources') {
    const { descriptor } = await customResourceDescriptorForOptions(clients.apiextensions, options)
    return deleteCustomResource({
      api: customObjectsApi,
      descriptor,
      resource: options.resource,
      namespace,
      name,
    })
  }

  const customDescriptor = CUSTOM_DELETE_DESCRIPTORS[options.resource]
  if (customDescriptor) {
    return deleteCustomResource({
      api: customObjectsApi,
      descriptor: customDescriptor,
      resource: options.resource,
      namespace,
      name,
    })
  }

  throw new Error(`delete is not supported for ${options.resource}`)
}

export const evictPodRows = async (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`evict is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('evict', options.resource, namespaceArg(options))
  const name = options.name
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  const body = {
    apiVersion: 'policy/v1',
    kind: 'Eviction',
    metadata: { name, namespace },
  }

  await coreApi.createNamespacedPodEviction({ namespace, name, body })

  return evictResult(options.resource, namespace, name)
}

export const forceDeletePodRows = async (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`force-delete is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('force-delete', options.resource, namespaceArg(options))
  const name = options.name
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)

  await coreApi.deleteNamespacedPod({
    namespace,
    name,
    gracePeriodSeconds: 0,
    body: deleteBody(true),
  })

  return forceDeleteResult(options.resource, namespace, name)
}

export const scaleResourceRows = async (kubeConfig, options) => {
  const namespace = requireNamespace('scale', options.resource, namespaceArg(options))
  const scaleMethod = SCALE_METHODS[options.resource]
  if (!scaleMethod) {
    throw new Error(`scale is not supported for ${options.resource}`)
  }

  const clients = {
    apps: kubeConfig.makeApiClient(AppsV1Api),
    core: kubeConfig.makeApiClient(CoreV1Api),
  }
  const [clientName, method] = scaleMethod
  const api = clients[clientName]

  if (typeof api?.[method] !== 'function') {
    throw new Error(`scale is not available for ${options.resource}`)
  }

  const response = await api[method]({
    name: options.name,
    namespace,
    body: {
      spec: {
        replicas: options.replicas,
      },
    },
  }, mergePatchOptions())
  const scale = responseBody(response)
  const replicas = scale?.spec?.replicas ?? options.replicas
  return scaleResult(options.resource, namespace, options.name, options.replicas, replicas)
}

export const restartResourceRows = async (kubeConfig, options) => {
  const namespace = requireNamespace('restart', options.resource, namespaceArg(options))
  const restartMethod = RESTART_METHODS[options.resource]
  if (!restartMethod) {
    throw new Error(`restart is not supported for ${options.resource}`)
  }

  const clients = {
    apps: kubeConfig.makeApiClient(AppsV1Api),
  }
  const [clientName, method] = restartMethod
  const api = clients[clientName]

  if (typeof api?.[method] !== 'function') {
    throw new Error(`restart is not available for ${options.resource}`)
  }

  const restartedAt = new Date().toISOString()
  await api[method]({
    name: options.name,
    namespace,
    body: {
      spec: {
        template: {
          metadata: {
            annotations: {
              'kubectl.kubernetes.io/restartedAt': restartedAt,
            },
          },
        },
      },
    },
  }, strategicMergePatchOptions())
  return restartResult(options.resource, namespace, options.name, restartedAt)
}

export const setWorkloadImageRows = async (kubeConfig, options) => {
  const namespace = requireNamespace('set-image', options.resource, namespaceArg(options))
  const imageMethod = WORKLOAD_IMAGE_METHODS[options.resource]
  if (!imageMethod) {
    throw new Error(`set-image is not supported for ${options.resource}`)
  }

  const clients = {
    apps: kubeConfig.makeApiClient(AppsV1Api),
  }
  const [clientName, method] = imageMethod
  const api = clients[clientName]

  if (typeof api?.[method] !== 'function') {
    throw new Error(`set-image is not available for ${options.resource}`)
  }

  const containerName = String(options.container).trim()
  const image = String(options.image).trim()
  await api[method]({
    name: options.name,
    namespace,
    body: {
      spec: {
        template: {
          spec: {
            containers: [{
              name: containerName,
              image,
            }],
          },
        },
      },
    },
  }, strategicMergePatchOptions())
  return workloadImageResult(options.resource, namespace, options.name, containerName, image)
}

export const setNodeSchedulingRows = async (kubeConfig, options) => {
  if (options.resource !== 'nodes') {
    throw new Error(`${options.action} is not supported for ${options.resource}`)
  }

  const unschedulable = options.action === 'cordon'
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  if (typeof coreApi.patchNode !== 'function') {
    throw new Error(`${options.action} is not available for nodes`)
  }

  await coreApi.patchNode({
    name: options.name,
    body: {
      spec: {
        unschedulable,
      },
    },
  }, mergePatchOptions())
  return nodeSchedulingResult(options.action, options.name, unschedulable)
}

const certificateSigningRequestApprovalPatch = (name, action) => {
  const approved = action === 'approve'
  const timestamp = new Date().toISOString()
  return {
    apiVersion: 'certificates.k8s.io/v1',
    kind: 'CertificateSigningRequest',
    metadata: {
      name,
    },
    status: {
      conditions: [{
        type: approved ? 'Approved' : 'Denied',
        status: 'True',
        reason: approved ? 'K7sApproved' : 'K7sDenied',
        message: `CertificateSigningRequest ${name} ${approved ? 'approved' : 'denied'} by k7s`,
        lastUpdateTime: timestamp,
        lastTransitionTime: timestamp,
      }],
    },
  }
}

export const updateCertificateSigningRequestApprovalRows = async (kubeConfig, options) => {
  if (options.resource !== 'certificatesigningrequests') {
    throw new Error(`${options.action} is not supported for ${options.resource}`)
  }

  const certificatesApi = kubeConfig.makeApiClient(CertificatesV1Api)
  if (typeof certificatesApi.patchCertificateSigningRequestApproval !== 'function') {
    throw new Error(`${options.action} is not available for certificatesigningrequests`)
  }

  await certificatesApi.patchCertificateSigningRequestApproval({
    name: options.name,
    body: certificateSigningRequestApprovalPatch(options.name, options.action),
  }, strategicMergePatchOptions())
  return certificateSigningRequestApprovalResult(options.action, options.name)
}

export const updateBatchSuspensionRows = async (kubeConfig, options) => {
  if (!isBatchSuspensionResource(options.resource)) {
    throw new Error(`${options.action} is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace(options.action, options.resource, namespaceArg(options))
  const batchApi = kubeConfig.makeApiClient(BatchV1Api)
  const suspend = options.action === 'suspend'
  const body = {
    spec: {
      suspend,
    },
  }

  if (options.resource === 'jobs') {
    if (typeof batchApi.patchNamespacedJob !== 'function') {
      throw new Error(`${options.action} is not available for jobs`)
    }
    await batchApi.patchNamespacedJob({ name: options.name, namespace, body }, strategicMergePatchOptions())
  } else {
    if (typeof batchApi.patchNamespacedCronJob !== 'function') {
      throw new Error(`${options.action} is not available for cronjobs`)
    }
    await batchApi.patchNamespacedCronJob({ name: options.name, namespace, body }, strategicMergePatchOptions())
  }

  return batchSuspensionResult(options.action, options.resource, namespace, options.name, suspend)
}

const cronJobManualJobGenerateName = (name) => {
  const normalized = String(name || 'cronjob')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9]+$/, '')
  const base = (normalized || 'cronjob').slice(0, 47).replace(/[^a-z0-9]+$/, '') || 'cronjob'
  return `${base}-manual-`
}

const jobFromCronJobTemplate = (cronJob, namespace) => {
  const template = cronJob.spec?.jobTemplate
  if (!template?.spec) {
    throw new Error('CronJob is missing jobTemplate.spec')
  }

  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      generateName: cronJobManualJobGenerateName(cronJob.metadata?.name ?? 'cronjob'),
      namespace,
      labels: template.metadata?.labels,
      annotations: template.metadata?.annotations,
    },
    spec: template.spec,
  }
}

export const triggerCronJobRows = async (kubeConfig, options) => {
  if (options.resource !== 'cronjobs') {
    throw new Error('trigger is not supported for this resource')
  }

  const namespace = requireNamespace('trigger', options.resource, namespaceArg(options))
  const batchApi = kubeConfig.makeApiClient(BatchV1Api)
  if (typeof batchApi.readNamespacedCronJob !== 'function' || typeof batchApi.createNamespacedJob !== 'function') {
    throw new Error('trigger is not available for cronjobs')
  }

  const cronJob = responseBody(await batchApi.readNamespacedCronJob({ namespace, name: options.name }))
  const job = jobFromCronJobTemplate(cronJob, namespace)
  const created = responseBody(await batchApi.createNamespacedJob({ namespace, body: job }))
  return cronJobTriggerResult(namespace, options.name, created.metadata?.name ?? job.metadata.generateName)
}

export const loadApplyRows = async (kubeConfig, options, readText = readApplyInput) => {
  const yaml = await readText(options.file)
  const docs = applyDocumentsFromYaml(yaml)
  if (!docs.length) {
    throw new Error('apply found no YAML documents')
  }

  const objectApi = applyObjectClient(kubeConfig)
  const rows = []
  for (const doc of docs) {
    const identity = manifestIdentity(doc)
    try {
      validateApplyManifest(doc)
      await objectApi.patch(
        doc,
        undefined,
        options.dryRun ? 'All' : undefined,
        options.fieldManager ?? 'k7s-cli',
        options.forceConflicts ? true : undefined,
        PatchStrategy.ServerSideApply,
      )
      rows.push(['apply', identity.kind, identity.namespace ?? '-', identity.name, 'OK', options.dryRun ? 'dry-run validated' : 'applied'])
    } catch (error) {
      rows.push(['apply', identity.kind, identity.namespace ?? '-', identity.name, 'FAIL', truncate(error instanceof Error ? error.message : String(error), 96)])
    }
  }

  return applyResult(rows)
}

const runHelmDocumentCommand = async (
  args,
  failureLabel,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('helm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdoutOutput = ''
  let stderrOutput = ''

  child.stdout?.on('data', (chunk) => {
    stdoutOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    stderrOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve(`${stdoutOutput}${stdoutOutput.endsWith('\n') ? '' : '\n'}`)
        return
      }
      reject(new Error((stderrOutput || stdoutOutput || `helm ${failureLabel} exited with code ${code ?? -1}`).trim()))
    })
  })
}

const runHelmJsonCommand = async (
  args,
  failureLabel,
  emptyValue,
  emptyPattern,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('helm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdoutOutput = ''
  let stderrOutput = ''

  child.stdout?.on('data', (chunk) => {
    stdoutOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    stderrOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk)
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      const message = (stderrOutput || stdoutOutput || '').trim()
      if (code !== 0) {
        if (emptyPattern?.test(message)) {
          resolve(emptyValue)
          return
        }
        reject(new Error(message || `helm ${failureLabel} exited with code ${code ?? -1}`))
        return
      }
      try {
        resolve(JSON.parse(stdoutOutput || '[]'))
      } catch (error) {
        reject(new Error(`helm ${failureLabel} JSON parse failed: ${error instanceof Error ? error.message : String(error)}`))
      }
    })
  })
}

const helmRepositoryTable = (repositories) => tableResult(
  ['NAME', 'URL'],
  repositories
    .map((repository) => [
      String(repository.name ?? '').trim() || '-',
      String(repository.url ?? '').trim() || '-',
    ])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
)

const helmChartRow = (chart) => {
  const name = String(chart.name ?? '').trim()
  const separatorIndex = name.indexOf('/')
  const repository = String(chart.repository ?? '').trim()
    || (separatorIndex > 0 ? name.slice(0, separatorIndex) : '-')
  const chartName = String(chart.chart ?? '').trim()
    || (separatorIndex > 0 ? name.slice(separatorIndex + 1) : name)
    || '-'
  const version = String(chart.version ?? chart.chart_version ?? '').trim() || '-'
  const appVersion = String(chart.appVersion ?? chart.app_version ?? '').trim() || '-'
  const description = String(chart.description ?? '').trim() || '-'
  return [name || '-', repository, chartName, version, appVersion, description]
}

const helmChartTable = (charts) => tableResult(
  ['NAME', 'REPOSITORY', 'CHART', 'VERSION', 'APP', 'DESCRIPTION'],
  charts
    .map(helmChartRow)
    .filter((row) => row[0] !== '-')
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[3]).localeCompare(String(b[3]))),
)

export const loadHelmChartRows = async (options, spawnImpl = spawn) => {
  if (options.resource !== 'helmcharts') {
    throw new Error(`helm charts is not supported for ${options.resource}`)
  }
  const charts = await runHelmJsonCommand(
    ['search', 'repo', '-o', 'json'],
    'search repo',
    [],
    /no repositories|no results found/i,
    spawnImpl,
  )
  return helmChartTable(charts)
}

export const loadHelmRepositoryRows = async (options, spawnImpl = spawn) => {
  if (options.resource !== 'helmrepositories') {
    throw new Error(`helm repositories is not supported for ${options.resource}`)
  }
  const repositories = await runHelmJsonCommand(
    ['repo', 'list', '-o', 'json'],
    'repo list',
    [],
    /no repositories/i,
    spawnImpl,
  )
  return helmRepositoryTable(repositories)
}

const helmRepositoryMutationResult = (action, name, url, message) => tableResult(
  ['ACTION', 'NAME', 'URL', 'STATUS', 'MESSAGE'],
  [[action, name || '-', url || '-', 'OK', message.trim() || 'helm repository operation completed']],
)

export const addHelmRepositoryRows = async (options, spawnImpl = spawn) => {
  if (options.resource !== 'helmrepositories') {
    throw new Error(`repo-add is not supported for ${options.resource}`)
  }
  const name = String(options.name ?? '').trim()
  const url = String(options.repoUrl ?? '').trim()
  const output = await runHelmDocumentCommand(
    ['repo', 'add', name, url],
    'repo add',
    spawnImpl,
  )
  return helmRepositoryMutationResult('repo-add', name, url, output)
}

export const updateHelmRepositoryRows = async (options, spawnImpl = spawn) => {
  if (options.resource !== 'helmrepositories') {
    throw new Error(`repo-update is not supported for ${options.resource}`)
  }
  const name = String(options.name ?? '').trim()
  const output = await runHelmDocumentCommand(
    ['repo', 'update', ...(name ? [name] : [])],
    'repo update',
    spawnImpl,
  )
  return helmRepositoryMutationResult('repo-update', name || 'all', '-', output)
}

export const removeHelmRepositoryRows = async (options, spawnImpl = spawn) => {
  if (options.resource !== 'helmrepositories') {
    throw new Error(`repo remove is not supported for ${options.resource}`)
  }
  const name = String(options.name ?? '').trim()
  const output = await runHelmDocumentCommand(
    ['repo', 'remove', name],
    'repo remove',
    spawnImpl,
  )
  return helmRepositoryMutationResult('repo-remove', name, '-', output)
}

const helmManifestArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm manifest is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('yaml', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'manifest',
    options.name,
    '-n',
    namespace,
  ]
}

const helmResourcesArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm resources is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('resources', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'status',
    options.name,
    '-n',
    namespace,
    '--show-resources',
  ]
}

const helmValuesArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm values is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('values', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'values',
    options.name,
    '-n',
    namespace,
    '--all',
  ]
}

const helmMetadataArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm metadata is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('metadata', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'metadata',
    options.name,
    '-n',
    namespace,
  ]
}

const helmNotesArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm notes is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('notes', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'notes',
    options.name,
    '-n',
    namespace,
  ]
}

const helmHooksArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm hooks is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('hooks', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'hooks',
    options.name,
    '-n',
    namespace,
  ]
}

const helmAllArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm all is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('all', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'get',
    'all',
    options.name,
    '-n',
    namespace,
  ]
}

export const loadHelmManifestDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmManifestArgs(kubeConfig, options),
  'get manifest',
  spawnImpl,
)

export const loadHelmResourcesDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmResourcesArgs(kubeConfig, options),
  'status resources',
  spawnImpl,
)

export const loadHelmValuesDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmValuesArgs(kubeConfig, options),
  'get values',
  spawnImpl,
)

export const loadHelmMetadataDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmMetadataArgs(kubeConfig, options),
  'get metadata',
  spawnImpl,
)

export const loadHelmNotesDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmNotesArgs(kubeConfig, options),
  'get notes',
  spawnImpl,
)

export const loadHelmHooksDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmHooksArgs(kubeConfig, options),
  'get hooks',
  spawnImpl,
)

export const loadHelmAllDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmAllArgs(kubeConfig, options),
  'get all',
  spawnImpl,
)

export const loadYamlDocument = async (kubeConfig, options) => {
  if (options.resource === 'helmreleases') {
    return loadHelmManifestDocument(kubeConfig, options)
  }

  return yamlDocument(await readResourceObject(kubeConfig, options, 'yaml'))
}

const helmStatusArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm status is not supported for ${options.resource}`)
  }

  const actionName = options.action === 'rollout-status' ? 'status' : 'describe'
  const namespace = requireNamespace(actionName, options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'status',
    options.name,
    '-n',
    namespace,
    ...(options.revision !== undefined ? ['--revision', String(options.revision)] : []),
  ]
}

export const loadHelmStatusDocument = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => runHelmDocumentCommand(
  helmStatusArgs(kubeConfig, options),
  'status',
  spawnImpl,
)

const eventLastObservedAt = (event) => (
  event.series?.lastObservedTime
    ?? event.deprecatedLastTimestamp
    ?? event.lastTimestamp
    ?? event.eventTime
    ?? event.metadata?.creationTimestamp
)

const describeEventSource = (event) => (
  event.reportingController
    ?? event.reportingInstance
    ?? event.deprecatedSource?.component
    ?? event.source?.component
    ?? '-'
)

const eventMatchesObject = (event, object) => {
  const ref = event.regarding ?? event.involvedObject
  const metadata = object?.metadata ?? {}
  if (!ref || !metadata.name) return false
  if (metadata.uid && ref.uid && metadata.uid === ref.uid) return true

  const namespaceMatches = !metadata.namespace || !ref.namespace || metadata.namespace === ref.namespace
  const kindMatches = !object.kind || !ref.kind || object.kind === ref.kind
  return namespaceMatches && kindMatches && metadata.name === ref.name
}

const listRelatedEvents = async (kubeConfig, object) => {
  const namespace = object?.metadata?.namespace
  const eventsApi = kubeConfig.makeApiClient(EventsV1Api)
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  let response

  try {
    response = namespace
      ? await eventsApi.listNamespacedEvent({ namespace })
      : await eventsApi.listEventForAllNamespaces()
  } catch {
    try {
      response = namespace
        ? await coreApi.listNamespacedEvent({ namespace })
        : await coreApi.listEventForAllNamespaces()
    } catch {
      return []
    }
  }

  return itemsFrom(response)
    .filter((event) => eventMatchesObject(event, object))
    .sort((left, right) => {
      const leftTime = new Date(eventLastObservedAt(left) ?? 0).getTime()
      const rightTime = new Date(eventLastObservedAt(right) ?? 0).getTime()
      return leftTime - rightTime
    })
}

const indentLines = (text, spaces = 2) => {
  const prefix = ' '.repeat(spaces)
  return String(text).split('\n').map((line) => `${prefix}${line}`).join('\n')
}

const formatKeyValueSection = (values) => {
  const entries = Object.entries(values ?? {})
  if (!entries.length) return '  <none>'
  return entries.map(([key, value]) => `  ${key}: ${String(value)}`).join('\n')
}

const formatYamlSection = (value) => {
  if (value === undefined || value === null) return '  <none>'
  const yaml = dumpYaml(value, { noRefs: true }).trimEnd()
  return yaml ? indentLines(yaml) : '  <none>'
}

const formatConditionSection = (conditions) => {
  if (!Array.isArray(conditions) || conditions.length === 0) return '  <none>'
  const rows = conditions.map((condition) => [
    condition.type ?? '-',
    condition.status ?? '-',
    condition.reason ?? '-',
    ageFrom(condition.lastTransitionTime ?? condition.lastHeartbeatTime),
    truncate(condition.message ?? '-', 96),
  ])
  return indentLines(renderTable(['TYPE', 'STATUS', 'REASON', 'AGE', 'MESSAGE'], rows))
}

const describeEventRows = (events) => events.map((event) => [
  event.type ?? 'Normal',
  event.reason ?? '-',
  ageFrom(eventLastObservedAt(event)),
  describeEventSource(event),
  truncate(event.note ?? event.message ?? '-', 96),
])

const formatEventsSection = (events) => {
  if (!events.length) return '  <none>'
  return indentLines(renderTable(['TYPE', 'REASON', 'AGE', 'SOURCE', 'MESSAGE'], describeEventRows(events)))
}

const formatDescribeOwnerReferences = (ownerReferences) => {
  if (!Array.isArray(ownerReferences) || ownerReferences.length === 0) return '  <none>'
  const rows = ownerReferences.map((owner) => [
    owner.kind ?? '-',
    owner.name ?? '-',
    owner.controller ? 'true' : 'false',
  ])
  return indentLines(renderTable(['KIND', 'NAME', 'CONTROLLER'], rows))
}

const describeDocument = (resource, object, events) => {
  const metadata = object?.metadata ?? {}
  const header = [
    `Name: ${metadata.name ?? '-'}`,
    `Namespace: ${metadata.namespace ?? '-'}`,
    `Resource: ${resource}`,
    `Kind: ${object?.kind ?? '-'}`,
    `API Version: ${object?.apiVersion ?? '-'}`,
    `Created: ${metadata.creationTimestamp ?? '-'}`,
    `Age: ${ageFrom(metadata.creationTimestamp)}`,
    `UID: ${metadata.uid ?? '-'}`,
    `Resource Version: ${metadata.resourceVersion ?? '-'}`,
  ].join('\n')

  return `${[
    header,
    `Labels:\n${formatKeyValueSection(metadata.labels)}`,
    `Annotations:\n${formatKeyValueSection(metadata.annotations)}`,
    `Owner References:\n${formatDescribeOwnerReferences(metadata.ownerReferences)}`,
    `Spec:\n${formatYamlSection(object?.spec)}`,
    `Status:\n${formatYamlSection(object?.status)}`,
    `Conditions:\n${formatConditionSection(object?.status?.conditions)}`,
    `Events:\n${formatEventsSection(events)}`,
  ].join('\n\n')}\n`
}

export const loadDescribeDocument = async (kubeConfig, options) => {
  if (options.resource === 'helmreleases') {
    return loadHelmStatusDocument(kubeConfig, options)
  }

  const object = await readResourceObject(kubeConfig, options, 'describe')
  const events = await listRelatedEvents(kubeConfig, object)
  return describeDocument(options.resource, object, events)
}

export const loadPodLogs = async (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`logs is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('logs', options.resource, namespaceArg(options))
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  const response = await coreApi.readNamespacedPodLog({
    name: options.name,
    namespace,
    ...(options.container ? { container: options.container } : {}),
    tailLines: options.tailLines,
    ...(options.previous ? { previous: true } : {}),
    ...(options.timestamps ? { timestamps: true } : {}),
  })
  const logs = responseBody(response)
  return `${typeof logs === 'string' ? logs : String(logs ?? '')}${String(logs ?? '').endsWith('\n') ? '' : '\n'}`
}

const podLogsFollowArgs = (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`logs is not supported for ${options.resource}`)
  }
  if (options.previous) {
    throw new Error('logs --previous does not support --follow')
  }

  const namespace = requireNamespace('logs', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'logs',
    `pod/${options.name}`,
    '-n',
    namespace,
    '--tail',
    String(options.tailLines),
    ...(options.container ? ['-c', options.container] : []),
    ...(options.timestamps ? ['--timestamps'] : []),
    '--follow',
  ]
}

export const runPodLogsFollow = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  podLogsFollowArgs(kubeConfig, options),
  `logs following: ${namespaceArg(options)}/${options.name}\n`,
  spawnImpl,
  streams,
)

const statusExitCode = (status) => {
  if (!status) return 0
  if (status.status === 'Success') return 0

  const exitCause = status.details?.causes?.find((cause) => cause.reason === 'ExitCode')
  const parsed = Number.parseInt(exitCause?.message ?? '', 10)
  return Number.isInteger(parsed) ? parsed : 1
}

const podExecClient = (kubeConfig) => (
  typeof kubeConfig.makeExecClient === 'function' ? kubeConfig.makeExecClient() : new Exec(kubeConfig)
)

export const loadPodExecResult = async (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`exec is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('exec', options.resource, namespaceArg(options))
  const stdoutChunks = []
  const stderrChunks = []
  let status
  let socket
  let settled = false
  let settle
  let rejectExec

  const completion = new Promise((resolve, reject) => {
    settle = resolve
    rejectExec = reject
  })

  const finish = () => {
    if (settled) return
    settled = true
    settle({
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
      status,
      exitCode: statusExitCode(status),
    })
  }

  const stdout = new Writable({
    write(chunk, _encoding, callback) {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
      callback()
    },
  })
  const stderr = new Writable({
    write(chunk, _encoding, callback) {
      stderrChunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
      callback()
    },
  })

  socket = await podExecClient(kubeConfig).exec(
    namespace,
    options.name,
    options.container ?? '',
    ['/bin/sh', '-lc', options.command],
    stdout,
    stderr,
    null,
    false,
    (receivedStatus) => {
      status = receivedStatus
      finish()
    },
  )

  if (typeof socket?.on === 'function') {
    socket.on('close', finish)
    socket.on('error', (error) => {
      if (settled) return
      settled = true
      rejectExec(error instanceof Error ? error : new Error(String(error)))
    })
  } else {
    finish()
  }

  return completion
}

const podShellCommand = (options) => {
  if (Array.isArray(options.commandArgs) && options.commandArgs.length > 0) {
    return options.commandArgs
  }

  return [String(options.command ?? '/bin/sh').trim()]
}

const podShellArgs = (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`shell is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('shell', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'exec',
    '-it',
    `pod/${options.name}`,
    '-n',
    namespace,
    ...(options.container ? ['-c', options.container] : []),
    '--',
    ...podShellCommand(options),
  ]
}

export const runPodShell = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('kubectl', podShellArgs(kubeConfig, options), {
    stdio: 'inherit',
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const podAttachArgs = (kubeConfig, options) => {
  if (options.resource !== 'pods') {
    throw new Error(`attach is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('attach', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'attach',
    '-it',
    `pod/${options.name}`,
    '-n',
    namespace,
    ...(options.container ? ['-c', options.container] : []),
  ]
}

export const runPodAttach = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('kubectl', podAttachArgs(kubeConfig, options), {
    stdio: 'inherit',
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const editableResourceScope = (resource) => {
  if (resource === 'events') return 'namespaced'
  if (NAMESPACED_YAML_METHODS[resource]) return 'namespaced'
  if (CLUSTER_YAML_METHODS[resource]) return 'cluster'

  const customDescriptor = CUSTOM_DELETE_DESCRIPTORS[resource]
  if (customDescriptor) {
    return customDescriptor.namespaced ? 'namespaced' : 'cluster'
  }

  return undefined
}

const customResourceKubectlTarget = (options) => `${requireCrdName(options)}/${options.name}`

const resourceEditArgs = (kubeConfig, options) => {
  if (options.resource === 'customresources') {
    const namespace = namespaceArg(options)
    const context = options.context ?? kubeConfig.getCurrentContext()
    const contextArgs = context ? ['--context', context] : []
    return [
      ...contextArgs,
      'edit',
      customResourceKubectlTarget(options),
      ...(namespace ? ['-n', namespace] : []),
    ]
  }

  const scope = editableResourceScope(options.resource)
  if (!scope) {
    throw new Error(`edit is not supported for ${options.resource}`)
  }

  const namespace = scope === 'namespaced'
    ? requireNamespace('edit', options.resource, namespaceArg(options))
    : undefined
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'edit',
    `${options.resource}/${options.name}`,
    ...(namespace ? ['-n', namespace] : []),
  ]
}

export const runResourceEdit = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('kubectl', resourceEditArgs(kubeConfig, options), {
    stdio: 'inherit',
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const metadataMutationArgs = (kubeConfig, options) => {
  if (options.resource === 'customresources') {
    const namespace = namespaceArg(options)
    const context = options.context ?? kubeConfig.getCurrentContext()
    const contextArgs = context ? ['--context', context] : []
    const key = String(options.metadataKey).trim()
    const assignment = options.remove ? `${key}-` : `${key}=${String(options.metadataValue ?? '')}`
    return [
      ...contextArgs,
      options.action,
      customResourceKubectlTarget(options),
      assignment,
      ...(namespace ? ['-n', namespace] : []),
      ...(options.overwrite && !options.remove ? ['--overwrite'] : []),
    ]
  }

  const scope = editableResourceScope(options.resource)
  if (!scope) {
    throw new Error(`${options.action} is not supported for ${options.resource}`)
  }

  const namespace = scope === 'namespaced'
    ? requireNamespace(options.action, options.resource, namespaceArg(options))
    : undefined
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  const key = String(options.metadataKey).trim()
  const assignment = options.remove ? `${key}-` : `${key}=${String(options.metadataValue ?? '')}`
  return [
    ...contextArgs,
    options.action,
    `${options.resource}/${options.name}`,
    assignment,
    ...(namespace ? ['-n', namespace] : []),
    ...(options.overwrite && !options.remove ? ['--overwrite'] : []),
  ]
}

export const runMetadataMutation = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  metadataMutationArgs(kubeConfig, options),
  `${options.action} running: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

const configUseContextArgs = (options) => [
  'config',
  'use-context',
  String(options.name).trim(),
]

const configUseNamespaceArgs = (options) => [
  'config',
  'set-context',
  '--current',
  '--namespace',
  namespaceArg(options),
]

export const runConfigUseContext = async (
  _kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  configUseContextArgs(options),
  `use-context running: ${String(options.name).trim()}\n`,
  spawnImpl,
  streams,
)

export const runConfigUseNamespace = async (
  _kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  configUseNamespaceArgs(options),
  `use-namespace running: ${namespaceArg(options)}\n`,
  spawnImpl,
  streams,
)

const PORT_FORWARD_RESOURCES = {
  pods: 'pod',
  services: 'service',
}

const portForwardArgs = (kubeConfig, options) => {
  const targetResource = PORT_FORWARD_RESOURCES[options.resource]
  if (!targetResource) {
    throw new Error(`port-forward is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('port-forward', options.resource, namespaceArg(options))
  const targetPort = options.targetPort
  const localPort = options.localPort ?? targetPort
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  const args = [
    ...contextArgs,
    'port-forward',
    `${targetResource}/${options.name}`,
    `${localPort}:${targetPort}`,
    '-n',
    namespace,
    '--address',
    '127.0.0.1',
  ]

  return {
    args,
    localPort,
    namespace,
    targetResource,
    targetPort,
  }
}

export const runPodPortForward = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => {
  const { args, localPort, namespace, targetResource, targetPort } = portForwardArgs(kubeConfig, options)
  const child = spawnImpl('kubectl', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  streams.stdout.write(`port-forward running: 127.0.0.1:${localPort} -> ${namespace}/${targetResource}/${options.name}:${targetPort}\n`)
  child.stdout?.on('data', (chunk) => {
    streams.stdout.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })
  child.stderr?.on('data', (chunk) => {
    streams.stderr.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const drainArgs = (kubeConfig, options) => {
  if (options.resource !== 'nodes') {
    throw new Error(`drain is not supported for ${options.resource}`)
  }

  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'drain',
    options.name,
    '--ignore-daemonsets',
  ]
}

const diffArgs = (kubeConfig, options) => {
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  const namespace = namespaceArg(options)
  return [
    ...contextArgs,
    'diff',
    '-f',
    options.file,
    ...(namespace ? ['-n', namespace] : []),
    ...(options.serverSide ? ['--server-side'] : []),
    ...(options.fieldManager !== undefined ? ['--field-manager', options.fieldManager] : []),
    ...(options.forceConflicts ? ['--force-conflicts'] : []),
  ]
}

export const runKubectlDiff = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
  inputStream = process.stdin,
) => {
  const child = spawnImpl('kubectl', diffArgs(kubeConfig, options), {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  streams.stdout.write(`diff running: ${options.file}\n`)
  child.stdout?.on('data', (chunk) => {
    streams.stdout.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })
  child.stderr?.on('data', (chunk) => {
    streams.stderr.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })

  if (options.file === '-' && typeof inputStream?.pipe === 'function' && child.stdin) {
    inputStream.pipe(child.stdin)
  } else {
    child.stdin?.end?.()
  }

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

export const runNodeDrain = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => {
  const args = drainArgs(kubeConfig, options)
  const child = spawnImpl('kubectl', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  streams.stdout.write(`drain running: node/${options.name}\n`)
  child.stdout?.on('data', (chunk) => {
    streams.stdout.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })
  child.stderr?.on('data', (chunk) => {
    streams.stderr.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const nodeDebugArgs = (kubeConfig, options) => {
  if (options.resource !== 'nodes') {
    throw new Error(`debug-node is not supported for ${options.resource}`)
  }

  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  const image = String(options.image ?? 'busybox').trim()
  return [
    ...contextArgs,
    'debug',
    `node/${options.name}`,
    '-it',
    `--image=${image}`,
    '--',
    'chroot',
    '/host',
    'sh',
  ]
}

export const runNodeDebugShell = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
) => {
  const child = spawnImpl('kubectl', nodeDebugArgs(kubeConfig, options), {
    stdio: 'inherit',
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const rollbackArgs = (kubeConfig, options) => {
  const workloadResource = ROLLOUT_RESOURCES[options.resource]
  if (!workloadResource) {
    throw new Error(`rollback is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('rollback', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'rollout',
    'undo',
    `${workloadResource}/${options.name}`,
    '-n',
    namespace,
    ...(options.revision !== undefined ? ['--to-revision', String(options.revision)] : []),
  ]
}

const rolloutHistoryArgs = (kubeConfig, options) => {
  const workloadResource = ROLLOUT_RESOURCES[options.resource]
  if (!workloadResource) {
    throw new Error(`history is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('history', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'rollout',
    'history',
    `${workloadResource}/${options.name}`,
    '-n',
    namespace,
    ...(options.revision !== undefined ? ['--revision', String(options.revision)] : []),
  ]
}

const rolloutStatusArgs = (kubeConfig, options) => {
  const workloadResource = ROLLOUT_RESOURCES[options.resource]
  if (!workloadResource) {
    throw new Error(`rollout-status is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('rollout-status', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'rollout',
    'status',
    `${workloadResource}/${options.name}`,
    '-n',
    namespace,
    ...(options.timeout !== undefined ? ['--timeout', options.timeout] : []),
  ]
}

const rolloutPauseResumeArgs = (kubeConfig, options) => {
  const workloadResource = PAUSABLE_ROLLOUT_RESOURCES[options.resource]
  if (!workloadResource) {
    throw new Error(`${options.action} is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace(options.action, options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--context', context] : []
  return [
    ...contextArgs,
    'rollout',
    options.action,
    `${workloadResource}/${options.name}`,
    '-n',
    namespace,
  ]
}

const runKubectlStreamingCommand = async (args, startLine, spawnImpl, streams) => {
  const child = spawnImpl('kubectl', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  streams.stdout.write(startLine)
  child.stdout?.on('data', (chunk) => {
    streams.stdout.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })
  child.stderr?.on('data', (chunk) => {
    streams.stderr.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const runHelmStreamingCommand = async (args, startLine, spawnImpl, streams) => {
  const child = spawnImpl('helm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  streams.stdout.write(startLine)
  child.stdout?.on('data', (chunk) => {
    streams.stdout.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })
  child.stderr?.on('data', (chunk) => {
    streams.stderr.write(Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk))
  })

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
    child.on('close', (code) => {
      resolve(code ?? 0)
    })
  })
}

const helmRollbackArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm rollback is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('rollback', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'rollback',
    options.name,
    ...(options.revision !== undefined ? [String(options.revision)] : []),
    '-n',
    namespace,
  ]
}

const helmChartArgs = (options) => [
  ...(options.version !== undefined ? ['--version', String(options.version).trim()] : []),
  ...(options.valuesFile !== undefined ? ['--values', String(options.valuesFile).trim()] : []),
  ...(options.setValues ?? []).flatMap((value) => ['--set', String(value).trim()]),
  ...(options.createNamespace ? ['--create-namespace'] : []),
  ...(options.wait ? ['--wait'] : []),
  ...(options.timeout !== undefined ? ['--timeout', String(options.timeout).trim()] : []),
]

const helmInstallUpgradeArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm ${options.action} is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace(options.action, options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  const name = String(options.name).trim()
  const chart = String(options.chart).trim()

  if (options.action === 'install') {
    return [
      ...contextArgs,
      'install',
      name,
      chart,
      '-n',
      namespace,
      ...helmChartArgs(options),
    ]
  }

  return [
    ...contextArgs,
    'upgrade',
    ...(options.install ? ['--install'] : []),
    name,
    chart,
    '-n',
    namespace,
    ...helmChartArgs(options),
  ]
}

const helmHistoryArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm history is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('history', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'history',
    options.name,
    '-n',
    namespace,
  ]
}

const helmTestArgs = (kubeConfig, options) => {
  if (options.resource !== 'helmreleases') {
    throw new Error(`helm test is not supported for ${options.resource}`)
  }

  const namespace = requireNamespace('test', options.resource, namespaceArg(options))
  const context = options.context ?? kubeConfig.getCurrentContext()
  const contextArgs = context ? ['--kube-context', context] : []
  return [
    ...contextArgs,
    'test',
    options.name,
    '-n',
    namespace,
  ]
}

export const runHelmReleaseInstallOrUpgrade = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runHelmStreamingCommand(
  helmInstallUpgradeArgs(kubeConfig, options),
  `helm ${options.action}: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runHelmReleaseRollback = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runHelmStreamingCommand(
  helmRollbackArgs(kubeConfig, options),
  `helm rollback: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runHelmReleaseHistory = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runHelmStreamingCommand(
  helmHistoryArgs(kubeConfig, options),
  `helm history: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runHelmReleaseTest = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runHelmStreamingCommand(
  helmTestArgs(kubeConfig, options),
  `helm test: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runRolloutRollback = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  rollbackArgs(kubeConfig, options),
  `rollback running: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runRolloutHistory = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  rolloutHistoryArgs(kubeConfig, options),
  `rollout history: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runRolloutStatus = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  rolloutStatusArgs(kubeConfig, options),
  `rollout status: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const runRolloutPauseResume = async (
  kubeConfig,
  options,
  spawnImpl = spawn,
  streams = { stdout: process.stdout, stderr: process.stderr },
) => runKubectlStreamingCommand(
  rolloutPauseResumeArgs(kubeConfig, options),
  `${options.action} running: ${options.resource}/${options.name}\n`,
  spawnImpl,
  streams,
)

export const loadTable = async (kubeConfig, options) => {
  const table = options.action === 'apply'
    ? await loadApplyRows(kubeConfig, options)
    : options.action === 'delete'
      ? await deleteResourceRows(kubeConfig, options)
      : options.action === 'evict'
        ? await evictPodRows(kubeConfig, options)
        : options.action === 'force-delete'
          ? await forceDeletePodRows(kubeConfig, options)
          : options.action === 'scale'
            ? await scaleResourceRows(kubeConfig, options)
            : options.action === 'restart'
              ? await restartResourceRows(kubeConfig, options)
              : options.action === 'set-image'
                ? await setWorkloadImageRows(kubeConfig, options)
                : options.action === 'repo-add'
                  ? await addHelmRepositoryRows(options)
                  : options.action === 'repo-update'
                    ? await updateHelmRepositoryRows(options)
                    : options.action === 'cordon' || options.action === 'uncordon'
                      ? await setNodeSchedulingRows(kubeConfig, options)
                      : options.action === 'trigger'
                        ? await triggerCronJobRows(kubeConfig, options)
                        : options.action === 'suspend' || (options.action === 'resume' && isBatchSuspensionResource(options.resource))
                          ? await updateBatchSuspensionRows(kubeConfig, options)
                          : options.action === 'approve' || options.action === 'deny'
                            ? await updateCertificateSigningRequestApprovalRows(kubeConfig, options)
                            : options.action === 'can-i'
                              ? await loadCanITable(kubeConfig, options)
                              : await listRows(kubeConfig, options)

  return sortTableRows(table, options)
}

const tableHasFailures = (table) => table.rows.some((row) => row.includes('FAIL'))
const tableHasCanIDenials = (table) => table.rows.some((row) => row[8] !== 'Allowed')

export const formatFrame = (kubeConfig, options, table) => {
  const currentContext = kubeConfig.getCurrentContext()
  const namespace = namespaceArg(options) ?? 'all'
  const action = options.action && options.action !== 'list' ? ` action=${options.action}` : ''
  const resource = options.action === 'apply'
    ? 'manifests'
    : options.action === 'can-i' && options.nonResourceUrl
      ? 'non-resource'
      : options.resource
  const filterInfo = options.filterText
    ? ` filter=${options.inverseFilter ? '!' : ''}${options.filterText}`
    : ''
  const sortInfo = options.sortColumn
    ? ` sort=${options.sortDirection === 'desc' ? '-' : ''}${options.sortColumn}`
    : ''
  const headline = `[k7s cli] context=${currentContext}${action} resource=${resource} namespace=${namespace}${filterInfo}${sortInfo}`
  const commandLine = `resources: ${resourceBar(options.resource)}`
  const footer = options.interactive
    ? `Total: ${table.rows.length}  |  :q quit  |  r refresh  |  / filter  |  sort <column>  |  :po/:svc/ns <name> navigate  |  ? help`
    : `Total: ${table.rows.length}  |  Ctrl+C: quit  |  refresh: ${options.watch ? `${options.refreshSeconds}s` : 'manual'}`
  return `${headline}\n${commandLine}\n\n${renderTable(table.headers, table.rows)}\n\n${footer}\n`
}

const rowText = (row) => row.map((cell) => String(cell ?? '')).join(' ')

const normalizeColumnName = (value) => (
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
)

const parseAgeToSeconds = (value) => {
  const match = String(value ?? '').trim().match(/^([0-9.]+)(s|m|h|d)$/)
  if (!match) return Number.NaN
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return Number.NaN
  const multiplier = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  }[match[2]]
  return amount * multiplier
}

const parseSortableNumber = (header, value) => {
  const text = String(value ?? '').trim()
  const normalizedHeader = normalizeColumnName(header)
  if (!text || text === '-') return Number.NaN
  if (normalizedHeader.includes('cpu')) return parseCpuToNanocores(text)
  if (normalizedHeader.includes('memory')) return parseMemoryToBytes(text)
  if (normalizedHeader === 'age' || normalizedHeader.endsWith('age')) return parseAgeToSeconds(text)
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return Number.NaN
}

const resolveSortIndex = (headers, sortColumn) => {
  const text = String(sortColumn ?? '').trim()
  if (!text) return undefined
  if (/^\d+$/.test(text)) {
    const index = Number(text) - 1
    if (index >= 0 && index < headers.length) return index
    throw new Error(`unknown sort column: ${sortColumn}. Available columns: ${headers.join(', ')}`)
  }

  const normalized = normalizeColumnName(text)
  const matches = headers
    .map((header, index) => ({ header, index, normalized: normalizeColumnName(header) }))
    .filter((entry) => entry.normalized === normalized || entry.normalized.startsWith(normalized))

  if (matches.length === 1) return matches[0].index
  if (matches.length > 1) {
    throw new Error(`ambiguous sort column: ${sortColumn}. Matches: ${matches.map((entry) => entry.header).join(', ')}`)
  }
  throw new Error(`unknown sort column: ${sortColumn}. Available columns: ${headers.join(', ')}`)
}

export const sortTableRows = (table, options) => {
  if (!options.sortColumn) return table
  const sortIndex = resolveSortIndex(table.headers, options.sortColumn)
  if (sortIndex === undefined) return table
  const direction = options.sortDirection === 'desc' ? -1 : 1
  const header = table.headers[sortIndex]

  const rows = table.rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = left.row[sortIndex]
      const rightValue = right.row[sortIndex]
      const leftNumber = parseSortableNumber(header, leftValue)
      const rightNumber = parseSortableNumber(header, rightValue)
      const comparison = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
        ? leftNumber - rightNumber
        : String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
      return comparison === 0 ? left.index - right.index : comparison * direction
    })
    .map(({ row }) => row)

  return { ...table, rows }
}

const tableFilterMatcher = (filterText) => {
  const text = String(filterText ?? '').trim()
  if (!text) return () => true
  try {
    const regex = new RegExp(text, 'i')
    return (row) => regex.test(rowText(row))
  } catch {
    const lowered = text.toLowerCase()
    return (row) => rowText(row).toLowerCase().includes(lowered)
  }
}

export const filterInteractiveTable = (table, options) => {
  if (!options.filterText) return table
  const matches = tableFilterMatcher(options.filterText)
  return {
    ...table,
    rows: table.rows.filter((row) => (
      options.inverseFilter ? !matches(row) : matches(row)
    )),
  }
}

const prepareInteractiveTable = (table, options) => (
  sortTableRows(filterInteractiveTable(table, options), options)
)

const interactivePrompt = (options) => {
  const namespace = namespaceArg(options) ?? 'all'
  return `k7s:${options.resource}:${namespace}> `
}

const resourceAliasesText = () => {
  const aliases = Object.entries(RESOURCE_ALIASES)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([alias, resource]) => `${alias}=${resource}`)
  return `Aliases:\n${aliases.join('  ')}\n`
}

const interactiveResourceTarget = (args, command) => {
  if (!args[0]) {
    throw new Error(`${command} requires name`)
  }
  if (args.length > 2) {
    throw new Error(`${command} accepts name and optional namespace`)
  }

  const rawName = String(args[0])
  const slashIndex = rawName.indexOf('/')
  if (slashIndex > 0 && slashIndex < rawName.length - 1) {
    return {
      namespace: rawName.slice(0, slashIndex),
      name: rawName.slice(slashIndex + 1),
    }
  }

  return {
    namespace: args[1],
    name: rawName,
  }
}

const interactiveDocumentOptions = (options, action, args) => {
  const target = interactiveResourceTarget(args, action)
  return {
    ...options,
    action,
    watch: false,
    interactive: false,
    name: target.name,
    ...(target.namespace ? { namespace: target.namespace } : {}),
  }
}

const interactivePodLogsOptions = (options, args) => {
  const previous = args.includes('--previous') || args.includes('-p')
  const timestamps = args.includes('--timestamps') || args.includes('-t')
  const targetArgs = args.filter((arg) => arg !== '--previous' && arg !== '-p' && arg !== '--timestamps' && arg !== '-t')
  if (!targetArgs[0]) {
    throw new Error('logs requires pod name')
  }
  if (targetArgs.length > 3) {
    throw new Error('logs accepts --previous, --timestamps, pod name, optional namespace, and optional container')
  }

  const rawName = String(targetArgs[0])
  const slashIndex = rawName.indexOf('/')
  const target = slashIndex > 0 && slashIndex < rawName.length - 1
    ? {
      namespace: rawName.slice(0, slashIndex),
      name: rawName.slice(slashIndex + 1),
      container: targetArgs[1],
    }
    : {
      namespace: targetArgs[1],
      name: rawName,
      container: targetArgs[2],
    }

  return {
    ...options,
    action: 'logs',
    watch: false,
    interactive: false,
    resource: 'pods',
    name: target.name,
    ...(target.namespace ? { namespace: target.namespace } : {}),
    ...(target.container ? { container: target.container } : {}),
    ...(previous ? { previous: true } : {}),
    ...(timestamps ? { timestamps: true } : {}),
  }
}

const interactivePodExecOptions = (options, args) => {
  const separatorIndex = args.indexOf('--')
  if (separatorIndex < 0) {
    throw new Error('exec requires -- before command')
  }

  const targetArgs = args.slice(0, separatorIndex)
  const commandArgs = args.slice(separatorIndex + 1)
  if (!targetArgs[0]) {
    throw new Error('exec requires pod name')
  }
  if (targetArgs.length > 3) {
    throw new Error('exec accepts pod name, optional namespace, optional container, then -- command')
  }
  if (commandArgs.length === 0) {
    throw new Error('exec requires command')
  }

  const rawName = String(targetArgs[0])
  const slashIndex = rawName.indexOf('/')
  const target = slashIndex > 0 && slashIndex < rawName.length - 1
    ? {
      namespace: rawName.slice(0, slashIndex),
      name: rawName.slice(slashIndex + 1),
      container: targetArgs[1],
    }
    : {
      namespace: targetArgs[1],
      name: rawName,
      container: targetArgs[2],
    }

  return {
    ...options,
    action: 'exec',
    watch: false,
    interactive: false,
    resource: 'pods',
    name: target.name,
    command: commandArgs.join(' '),
    ...(target.namespace ? { namespace: target.namespace } : {}),
    ...(target.container ? { container: target.container } : {}),
  }
}

const interactivePodShellOptions = (options, args) => {
  if (!args[0]) {
    throw new Error('shell requires pod name')
  }

  const rawName = String(args[0])
  const slashIndex = rawName.indexOf('/')
  const target = slashIndex > 0 && slashIndex < rawName.length - 1
    ? {
      namespace: rawName.slice(0, slashIndex),
      name: rawName.slice(slashIndex + 1),
      container: args[1],
      commandArgs: args.slice(2),
    }
    : {
      namespace: args[1],
      name: rawName,
      container: args[2],
      commandArgs: args.slice(3),
    }

  return {
    ...options,
    action: 'shell',
    watch: false,
    interactive: false,
    resource: 'pods',
    name: target.name,
    ...(target.namespace ? { namespace: target.namespace } : {}),
    ...(target.container ? { container: target.container } : {}),
    ...(target.commandArgs.length > 0 ? { commandArgs: target.commandArgs } : {}),
  }
}

const interactivePodAttachOptions = (options, args) => {
  if (!args[0]) {
    throw new Error('attach requires pod name')
  }
  if (args.length > 3) {
    throw new Error('attach accepts pod name, optional namespace, and optional container')
  }

  const rawName = String(args[0])
  const slashIndex = rawName.indexOf('/')
  const target = slashIndex > 0 && slashIndex < rawName.length - 1
    ? {
      namespace: rawName.slice(0, slashIndex),
      name: rawName.slice(slashIndex + 1),
      container: args[1],
    }
    : {
      namespace: args[1],
      name: rawName,
      container: args[2],
    }

  return {
    ...options,
    action: 'attach',
    watch: false,
    interactive: false,
    resource: 'pods',
    name: target.name,
    ...(target.namespace ? { namespace: target.namespace } : {}),
    ...(target.container ? { container: target.container } : {}),
  }
}

const interactivePortForwardOptions = (options, args) => {
  if (!args[0]) {
    throw new Error('port-forward requires target')
  }

  const maybeResource = normalizeResourceType(args[0])
  const hasResource = maybeResource === 'pods' || maybeResource === 'services'
  const resource = hasResource
    ? maybeResource
    : PORT_FORWARD_RESOURCES[options.resource] ? options.resource : 'pods'
  const values = hasResource ? args.slice(1) : args
  if (values.length < 2 || values.length > 3) {
    throw new Error('port-forward requires target and target port')
  }

  const [rawTarget, rawTargetPort, rawLocalPort] = values
  const slashIndex = String(rawTarget).indexOf('/')
  const namespace = slashIndex > 0 && slashIndex < String(rawTarget).length - 1
    ? String(rawTarget).slice(0, slashIndex)
    : namespaceArg(options)
  const name = slashIndex > 0 && slashIndex < String(rawTarget).length - 1
    ? String(rawTarget).slice(slashIndex + 1)
    : String(rawTarget)
  const targetPort = Number(rawTargetPort)
  const localPort = rawLocalPort === undefined ? undefined : Number(rawLocalPort)

  if (!namespace) {
    throw new Error('port-forward requires namespace; use namespace/name or switch namespace')
  }
  if (!isPort(targetPort)) {
    throw new Error('port-forward requires target port')
  }
  if (localPort !== undefined && !isPort(localPort)) {
    throw new Error('port-forward requires local port')
  }

  return {
    ...options,
    action: 'port-forward',
    watch: false,
    interactive: false,
    resource,
    namespace,
    name,
    targetPort,
    ...(localPort !== undefined ? { localPort } : {}),
  }
}

export const resolveInteractiveCommand = (options, input) => {
  const value = String(input ?? '').trim()
  if (!value || value === 'r' || value === 'refresh' || value === 'reload') {
    return { type: 'render', options }
  }
  if (value === 'q' || value === 'quit' || value === 'exit' || value === ':q') {
    return { type: 'exit' }
  }
  if (value === '?' || value === 'help' || value === 'h') {
    return { type: 'message', message: INTERACTIVE_HELP_TEXT }
  }
  if (value === 'aliases' || value === ':aliases' || value === 'ctrl-a') {
    return { type: 'message', message: resourceAliasesText() }
  }
  if (value === '/' || value === 'clear-filter' || value === 'nofilter' || value === 'filter clear') {
    const { filterText: _filterText, inverseFilter: _inverseFilter, ...nextOptions } = options
    return { type: 'render', options: nextOptions }
  }
  if (value.startsWith('/!')) {
    const filterText = value.slice(2).trim()
    return filterText
      ? { type: 'render', options: { ...options, filterText, inverseFilter: true } }
      : { type: 'message', message: 'inverse filter requires text\n' }
  }
  if (value.startsWith('/-f')) {
    const filterText = value.slice(3).trim()
    return filterText
      ? { type: 'render', options: { ...options, filterText, inverseFilter: false } }
      : { type: 'message', message: 'filter requires text\n' }
  }
  if (value.startsWith('/')) {
    const filterText = value.slice(1).trim()
    return filterText
      ? { type: 'render', options: { ...options, filterText, inverseFilter: false } }
      : { type: 'render', options: { ...options, filterText: undefined, inverseFilter: undefined } }
  }

  const parts = value.split(/\s+/)
  const rawCommand = parts[0] ?? ''
  const command = rawCommand.startsWith(':') ? rawCommand.slice(1) : rawCommand
  const commandKey = command.toLowerCase()
  const args = parts.slice(1)

  if (commandKey === 'filter') {
    const filterText = args.join(' ').trim()
    return filterText
      ? { type: 'render', options: { ...options, filterText, inverseFilter: false } }
      : { type: 'message', message: 'filter requires text\n' }
  }

  if (commandKey === 'sort' || commandKey === 's') {
    const sortText = args.join(' ').trim()
    if (sortText === 'clear' || sortText === 'none' || sortText === 'reset') {
      const { sortColumn: _sortColumn, sortDirection: _sortDirection, ...nextOptions } = options
      return { type: 'render', options: nextOptions }
    }
    if (!sortText) {
      return { type: 'message', message: 'sort requires column\n' }
    }
    try {
      return { type: 'render', options: { ...options, ...parseSortInput(sortText) } }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'describe' || commandKey === 'desc' || commandKey === 'd') {
    try {
      return { type: 'document', action: 'describe', options: interactiveDocumentOptions(options, 'describe', args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'yaml' || commandKey === 'y') {
    try {
      return { type: 'document', action: 'yaml', options: interactiveDocumentOptions(options, 'yaml', args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'logs' || commandKey === 'log' || commandKey === 'l') {
    try {
      return { type: 'logs', options: interactivePodLogsOptions(options, args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'exec' || commandKey === 'x') {
    try {
      return { type: 'exec', options: interactivePodExecOptions(options, args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'shell' || commandKey === 'sh') {
    try {
      return { type: 'shell', options: interactivePodShellOptions(options, args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'attach' || commandKey === 'att' || commandKey === 'a') {
    try {
      return { type: 'attach', options: interactivePodAttachOptions(options, args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if (commandKey === 'pf' || commandKey === 'port-forward' || commandKey === 'portforward') {
    try {
      return { type: 'port-forward', options: interactivePortForwardOptions(options, args) }
    } catch (err) {
      return { type: 'message', message: `${err instanceof Error ? err.message : String(err)}\n` }
    }
  }

  if ((commandKey === 'ctx' || commandKey === 'context' || commandKey === 'contexts') && args[0]) {
    const context = args.join(' ').trim()
    return {
      type: 'context',
      context,
      options: {
        ...options,
        context,
      },
    }
  }

  if ((commandKey === 'ns' || commandKey === 'namespace') && args[0]) {
    const namespace = args[0] === 'all' ? 'all' : args[0]
    return { type: 'render', options: { ...options, namespace } }
  }

  const resourceArgs = (commandKey === 'resource' || commandKey === 'res') ? args.slice(1) : args
  const resourceToken = (commandKey === 'resource' || commandKey === 'res') ? args[0] : commandKey
  const resourceNamespace = resourceArgs[0]
  const normalizedResource = normalizeResourceType(resourceToken)
  if (normalizedResource) {
    const nextOptions = { ...options, resource: normalizedResource }
    if (normalizedResource === 'customresources') {
      if (resourceArgs[0]) {
        nextOptions.crdName = resourceArgs[0]
      }
      if (resourceArgs[1]) {
        nextOptions.namespace = resourceArgs[1] === 'all' ? 'all' : resourceArgs[1]
      }
    } else if (resourceNamespace) {
      nextOptions.namespace = resourceNamespace === 'all' ? 'all' : resourceNamespace
    }
    return { type: 'render', options: nextOptions }
  }

  return {
    type: 'message',
    message: `Unknown interactive command: ${value}\n${INTERACTIVE_HELP_TEXT}`,
  }
}

export const runInteractiveCli = async (
  kubeConfig,
  options,
  {
    input = process.stdin,
    output = process.stdout,
    error = process.stderr,
    createInterfaceImpl = createReadlineInterface,
    spawnImpl = spawn,
    clear = true,
  } = {},
) => {
  let currentKubeConfig = kubeConfig
  let currentOptions = {
    ...options,
    action: 'list',
    watch: false,
    interactive: true,
  }

  const render = async () => {
    const table = prepareInteractiveTable(await listRows(currentKubeConfig, currentOptions), currentOptions)
    if (clear) {
      output.write('\x1Bc')
    }
    output.write(formatFrame(currentKubeConfig, currentOptions, table))
  }

  const rl = createInterfaceImpl({ input, output })
  try {
    await render()
    while (true) {
      const command = await rl.question(interactivePrompt(currentOptions))
      const result = resolveInteractiveCommand(currentOptions, command)
      if (result.type === 'exit') {
        break
      }
      if (result.type === 'message') {
        output.write(result.message.endsWith('\n') ? result.message : `${result.message}\n`)
        continue
      }
      if (result.type === 'document') {
        try {
          const document = result.action === 'yaml'
            ? await loadYamlDocument(currentKubeConfig, result.options)
            : await loadDescribeDocument(currentKubeConfig, result.options)
          output.write(document.endsWith('\n') ? document : `${document}\n`)
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        }
        continue
      }
      if (result.type === 'logs') {
        try {
          output.write(await loadPodLogs(currentKubeConfig, result.options))
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        }
        continue
      }
      if (result.type === 'exec') {
        try {
          const execResult = await loadPodExecResult(currentKubeConfig, result.options)
          if (execResult.stdout) output.write(execResult.stdout)
          if (execResult.stderr) error.write(execResult.stderr)
          if (execResult.exitCode) {
            error.write(`exec exited with code ${execResult.exitCode}\n`)
          }
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        }
        continue
      }
      if (result.type === 'shell') {
        try {
          if (typeof rl.pause === 'function') rl.pause()
          const exitCode = await runPodShell(currentKubeConfig, result.options, spawnImpl)
          if (exitCode !== 0) {
            error.write(`shell exited with code ${exitCode}\n`)
          }
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        } finally {
          if (typeof rl.resume === 'function') rl.resume()
        }
        continue
      }
      if (result.type === 'attach') {
        try {
          if (typeof rl.pause === 'function') rl.pause()
          const exitCode = await runPodAttach(currentKubeConfig, result.options, spawnImpl)
          if (exitCode !== 0) {
            error.write(`attach exited with code ${exitCode}\n`)
          }
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        } finally {
          if (typeof rl.resume === 'function') rl.resume()
        }
        continue
      }
      if (result.type === 'port-forward') {
        try {
          if (typeof rl.pause === 'function') rl.pause()
          const exitCode = await runPodPortForward(currentKubeConfig, result.options, spawnImpl, {
            stdout: output,
            stderr: error,
          })
          if (exitCode !== 0) {
            error.write(`port-forward exited with code ${exitCode}\n`)
          }
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        } finally {
          if (typeof rl.resume === 'function') rl.resume()
        }
        continue
      }
      if (result.type === 'context') {
        currentOptions = result.options
        if (typeof currentKubeConfig.setCurrentContext === 'function') {
          currentKubeConfig.setCurrentContext(result.context)
        } else {
          currentKubeConfig = setupKubeConfig(result.context)
        }
        try {
          await render()
        } catch (err) {
          error.write(`${err instanceof Error ? err.message : String(err)}\n`)
        }
        continue
      }
      currentOptions = result.options
      try {
        await render()
      } catch (err) {
        error.write(`${err instanceof Error ? err.message : String(err)}\n`)
      }
    }
  } finally {
    rl.close()
  }
}

export const printFrame = async (kubeConfig, options) => {
  if (options.action === 'yaml') {
    process.stdout.write(await loadYamlDocument(kubeConfig, options))
    return
  }
  if (options.action === 'resources') {
    process.stdout.write(await loadHelmResourcesDocument(kubeConfig, options))
    return
  }
  if (options.action === 'values') {
    process.stdout.write(await loadHelmValuesDocument(kubeConfig, options))
    return
  }
  if (options.action === 'metadata') {
    process.stdout.write(await loadHelmMetadataDocument(kubeConfig, options))
    return
  }
  if (options.action === 'notes') {
    process.stdout.write(await loadHelmNotesDocument(kubeConfig, options))
    return
  }
  if (options.action === 'hooks') {
    process.stdout.write(await loadHelmHooksDocument(kubeConfig, options))
    return
  }
  if (options.action === 'helm-all') {
    process.stdout.write(await loadHelmAllDocument(kubeConfig, options))
    return
  }
  if (options.action === 'describe') {
    process.stdout.write(await loadDescribeDocument(kubeConfig, options))
    return
  }
  if (options.action === 'logs') {
    if (options.follow) {
      const exitCode = await runPodLogsFollow(kubeConfig, options)
      if (exitCode) {
        process.exitCode = exitCode
      }
      return
    }
    process.stdout.write(await loadPodLogs(kubeConfig, options))
    return
  }
  if (options.action === 'diff') {
    const exitCode = await runKubectlDiff(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'edit') {
    const exitCode = await runResourceEdit(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'label' || options.action === 'annotate') {
    const exitCode = await runMetadataMutation(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'use-context') {
    const exitCode = await runConfigUseContext(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'use-namespace') {
    const exitCode = await runConfigUseNamespace(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'exec') {
    const result = await loadPodExecResult(kubeConfig, options)
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.exitCode) {
      process.exitCode = result.exitCode
    }
    return
  }
  if (options.action === 'shell') {
    const exitCode = await runPodShell(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'attach') {
    const exitCode = await runPodAttach(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'port-forward') {
    const exitCode = await runPodPortForward(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'drain') {
    const exitCode = await runNodeDrain(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'debug-node') {
    const exitCode = await runNodeDebugShell(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'history') {
    if (options.resource === 'helmreleases') {
      const exitCode = await runHelmReleaseHistory(kubeConfig, options)
      if (exitCode) {
        process.exitCode = exitCode
      }
      return
    }
    const exitCode = await runRolloutHistory(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'test') {
    const exitCode = await runHelmReleaseTest(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'install' || options.action === 'upgrade') {
    const exitCode = await runHelmReleaseInstallOrUpgrade(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'rollout-status') {
    if (options.resource === 'helmreleases') {
      process.stdout.write(await loadHelmStatusDocument(kubeConfig, options))
      return
    }
    const exitCode = await runRolloutStatus(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'pause' || (options.action === 'resume' && !isBatchSuspensionResource(options.resource))) {
    const exitCode = await runRolloutPauseResume(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }
  if (options.action === 'rollback') {
    if (options.resource === 'helmreleases') {
      const exitCode = await runHelmReleaseRollback(kubeConfig, options)
      if (exitCode) {
        process.exitCode = exitCode
      }
      return
    }
    const exitCode = await runRolloutRollback(kubeConfig, options)
    if (exitCode) {
      process.exitCode = exitCode
    }
    return
  }

  const table = await loadTable(kubeConfig, options)
  if (options.action === 'apply' && tableHasFailures(table)) {
    process.exitCode = 1
  }
  if (options.action === 'can-i' && tableHasCanIDenials(table)) {
    process.exitCode = 1
  }

  if (options.watch) {
    process.stdout.write('\x1Bc')
  }

  process.stdout.write(formatFrame(kubeConfig, options, table))
}

export const run = async (argv = process.argv.slice(2)) => {
  const options = parseArgs(argv)
  if (options.help) {
    process.stdout.write(HELP_TEXT)
    return
  }

  const kubeConfig = setupKubeConfig(options.context)

  if (options.action === 'interactive') {
    await runInteractiveCli(kubeConfig, options)
    return
  }

  if (!options.watch) {
    await printFrame(kubeConfig, options)
    return
  }

  const intervalMs = Math.round(options.refreshSeconds * 1000)
  await printFrame(kubeConfig, options)
  const timer = setInterval(() => {
    void printFrame(kubeConfig, options).catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    })
  }, intervalMs)

  const cleanup = () => {
    clearInterval(timer)
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    process.stderr.write(`k7s cli error: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  })
}
