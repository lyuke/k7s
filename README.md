# k7s

A Kubernetes desktop GUI application for macOS, built with Electron + React + TypeScript.

## Features

- Browse and manage Kubernetes clusters
- View nodes, component statuses, API groups, API resources, server versions, OpenID discovery metadata, API server health checks, self subject reviews, self subject access reviews, self subject rules reviews, pods, workloads, replication controllers, controller revisions, pod templates, Helm charts, releases, and repositories, PDBs, resource quotas, limit ranges, priority classes, runtime classes, flow schemas, priority level configurations, services, endpoints, leases, lease candidates, endpoint slices, ingress classes, Gateway API resources, API services, admission webhooks, mutating and validating admission policies, certificate signing requests, cluster trust bundles, pod certificate requests, storage versions, storage version migrations, config, network policies, IP address management resources, storage classes, volume attribute classes, CSI drivers, CSI nodes, volume attachments, CSI storage capacities, volume snapshots, dynamic resource allocation resources, RBAC, CRDs, custom resource instances, HPA, and events, with YAML edit/delete operations where supported
- Support for multiple kubeconfig files
- Current-context and default-namespace awareness plus persistent switching from kubeconfig across desktop, web, and CLI views
- Context grouping and custom naming
- Built-in terminal with direct kubectl access in both desktop and local Web UI modes
- Node, Pod, and container CPU and memory usage columns when metrics-server is available
- Top Nodes, Top Pods, and Top Containers monitoring views for quick CPU-heavy resource inspection
- Node maintenance actions from shared node tables and details: enter debug shell, cordon/uncordon, drain, edit YAML, and delete
- ComponentStatus detail drill-downs for legacy control-plane component health
- APIGroup discovery view for Kubernetes core and grouped API versions plus server address hints
- APIResource discovery view for Kubernetes group/version, scope, verbs, short names, and subresource metadata
- ServerVersion view for Kubernetes git version, platform, build, and compatibility metadata
- OpenIDConfiguration discovery view for Kubernetes service account issuer metadata and JWKS key summaries
- APIServerHealth view for readyz, livez, and healthz endpoint summaries
- SelfSubjectReview identity view for the current authenticated Kubernetes user
- SelfSubjectAccessReview can-i checks for common Lens/K9s operations across cluster, namespace, and health endpoints
- SelfSubjectRulesReview permission views for current-user namespace access checks
- Service detail drill-down with selectors, backing Endpoints, and matching Pods in the shared UI
- Endpoints detail drill-downs with ready/not-ready addresses, ports, Services, EndpointSlices, Ingresses, Pods, and Events
- Namespace resource view with related Pods, quotas, limit ranges, and events
- Coordination Lease detail drill-downs with holder, timing, related LeaseCandidates, Pods or Nodes, and Events
- Workload detail drill-downs with related Jobs, ReplicaSets, ControllerRevisions, Pods, and Events
- Workload policy detail drill-downs for PDB health, ResourceQuota usage, and LimitRange defaults
- Scheduling detail drill-downs for PriorityClass and RuntimeClass with related Pods and Nodes
- ConfigMap and Secret detail views with ConfigMap previews and safe Secret key metadata
- Storage detail drill-downs linking PVs, PVCs, StorageClasses, Pods, and Events, with PV, PVC, and StorageClass edit/delete operations
- CSI storage detail drill-downs linking drivers, volume attribute classes, nodes, attachments, capacities, PVs, PVCs, and Events
- Volume snapshot detail drill-downs linking VolumeSnapshotClasses, VolumeSnapshots, VolumeSnapshotContents, PVCs, PVs, CSI drivers, and Events
- YAML apply support for VolumeSnapshotClass, VolumeSnapshot, and VolumeSnapshotContent CRD resources without requiring CRD discovery access
- Dynamic resource allocation drill-downs linking DeviceClasses, DeviceTaintRules, ResourceClaims, ResourceClaimTemplates, ResourceSlices, allocated devices, and Events
- YAML apply support for stable `resource.k8s.io/v1` DRA resources: DeviceClass, ResourceClaim, ResourceClaimTemplate, and ResourceSlice
- RBAC detail drill-downs for rules, subjects, role refs, and related bindings, with YAML edit/delete operations
- ServiceAccount detail drill-downs with safe Secret metadata, related Pods, and RBAC bindings
- Ingress detail drill-downs with rules, TLS, backend Services, Endpoints, Pods, and Events
- IngressClass detail drill-downs linking controller parameters, Ingresses, Services, Pods, and Events
- Gateway API detail drill-downs linking GatewayClasses, Gateways, HTTPRoutes, GRPCRoutes, TLSRoutes, TCPRoutes, UDPRoutes, ReferenceGrants, backend Services, and Events
- YAML apply support for Gateway API classes, gateways, routes, and reference grants without requiring CRD discovery access
- NetworkPolicy detail drill-downs with ingress/egress peers, ports, selected Pods, and Events
- IP address management detail drill-downs for IPAddresses, ServiceCIDRs, parent Services, CIDR conditions, and Events
- EndpointSlice detail drill-downs with endpoint readiness, target Pods, related Services, and Events
- APIService detail drill-downs with conditions, backend Services, Endpoints, EndpointSlices, Pods, and Events
- Admission webhook detail drill-downs with webhook clients, selectors, rules, backend Services, endpoints, Pods, and Events
- Mutating admission policy detail drill-downs with safe mutation metadata, variables, match conditions, params, and bindings
- Validating admission policy detail drill-downs with validation metadata, match rules, status warnings, params, and bindings
- Flow control detail drill-downs for FlowSchema subjects/rules and PriorityLevel queue conditions
- CertificateSigningRequest detail drill-downs with approval conditions and safe payload metadata
- ClusterTrustBundle and PodCertificateRequest detail drill-downs with signer metadata, safe certificate state summaries, related resources, and events
- StorageVersion and StorageVersionMigration drill-downs for API server encoding versions, migration status, conditions, and Events
- HPA detail drill-downs with metric targets, scaling conditions, target workloads, Pods, Events, and edit/delete operations
- Event detail drill-downs with involved objects, related objects, source metadata, timestamps, and related Pods
- CLI mode (`k7s cli`) for terminal-based cluster inspection with k9s/kubectl-style resource aliases
- Shared web and desktop UI through the embedded local web server, including searchable and downloadable current and previous Pod logs with optional timestamps, Exec, terminal-backed Pod Shell/Attach, normal, eviction, and force Pod deletion, Helm Chart browsing, Helm Repository management, Helm Release install/upgrade/status/resources/manifest/metadata/values/notes/hooks/all/test/history/rollback/uninstall, YAML diff previews, ad-hoc Can-I permission checks, Describe, metadata label/annotation updates, and Pod/Service Port Forwarding sessions over IPC/WebSocket runtime channels
- Dark theme UI inspired by VS Code

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- macOS (Electron app for macOS)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start the shared Web UI with the desktop client
npm run dev:web

# Start the Web UI without opening the desktop window
npm run dev:web:headless
```

### Building

```bash
# Build for production
npm run build

# Build macOS app
npm run dist:mac

# Build for Apple Silicon
npm run dist:mac:arm64

# Build for Intel Macs
npm run dist:mac:x64
```

## Usage

### Desktop GUI

1. **Launch the app** - Select or add a Kubernetes context from the sidebar
2. **Browse resources** - Choose a resource type (Pods, Deployments, etc.) from the left panel
3. **View details** - Click on any resource to see detailed information
4. **Operate workloads** - Scale, restart, update container images, rollback, pause, resume, and inspect rollout history/status for supported workloads from the shared resource tables
5. **Persist context preferences** - Use the header actions to write the selected context as `current-context` or update its default namespace in kubeconfig
6. **Custom resources** - Open the CRD resource view and use "Instances" to list, inspect, edit, and delete custom resource objects
7. **Terminal** - Click the "Terminal" button in the header to open an integrated terminal with kubectl access

### CLI Mode (k9s-like lightweight view)

```bash
# default: list pods in all namespaces
k7s cli

# open an interactive k9s-style resource prompt
k7s cli tui

# inside interactive mode, switch views/context, filter, sort, and inspect rows with :po, :svc default, :crx widgets.example.com default, :ctx minikube, ns all, /web, /! Completed, sort name, sort -age, describe default/web, yaml default/web, exec default/web app -- printenv HOSTNAME, logs default/web app, shell default/web app /bin/sh, attach default/web app, pf default/web 8080 18080, r, ?, and :q

# list kubeconfig contexts
k7s cli -r ctx

# list containers expanded from pods
k7s cli -r co -n default

# list detailed container states and IDs from pod status
k7s cli -r cstate -n default

# list container resource requests and limits from pod specs
k7s cli -r crs -n default

# summarize images expanded from pods
k7s cli -r img -n default

# summarize container probes expanded from pods
k7s cli -r prb -n default

# list container ports expanded from pods
k7s cli -r prt -n default

# list pod volumes and their container usage without secret values
k7s cli -r vol -n default

# list container volume mounts expanded from pods
k7s cli -r mnt -n default

# list container environment variables and sources without values
k7s cli -r env -n default

# list pod status conditions
k7s cli -r cond -n default

# list pod readiness gates
k7s cli -r gate -n default

# list pod network and DNS settings
k7s cli -r pnet -n default

# list pod scheduling placement and ownership details
k7s cli -r place -n default

# list pod and container security contexts
k7s cli -r sctx -n default

# list pod labels
k7s cli -r label -n default

# list pod annotations with sensitive values redacted
k7s cli -r anno -n default

# list deployments in a namespace
k7s cli -r deploy -n kube-system

# live-refresh node view every 2 seconds
k7s cli -r nodes --watch --refresh 2

# sort any table by column name or 1-based column number
k7s cli -r po --sort name
k7s cli -r po --sort age --desc

# specify context
k7s cli --context minikube -r services

# persistently switch the current kubeconfig context or namespace
k7s cli use-context --name minikube --confirm
k7s cli use-namespace -n default --confirm

# list and operate CustomResource instances selected by CRD
k7s cli -r crx --crd widgets.example.com -n default
k7s cli yaml -r crx --crd widgets.example.com -n default --name widget-1
k7s cli edit -r crx --crd widgets.example.com -n default --name widget-1
k7s cli describe -r crx --crd widgets.example.com -n default --name widget-1
k7s cli label -r crx --crd widgets.example.com -n default --name widget-1 --key team --value platform --confirm
k7s cli delete -r crx --crd widgets.example.com -n default --name widget-1 --confirm
k7s cli install -r helm -n default --name web --chart bitnami/nginx --confirm
k7s cli upgrade -r helm -n default --name web --chart bitnami/nginx --install --confirm
k7s cli delete -r helm -n default --name web --confirm
k7s cli yaml -r helm -n default --name web
k7s cli resources -r helm -n default --name web
k7s cli metadata -r helm -n default --name web
k7s cli values -r helm -n default --name web
k7s cli notes -r helm -n default --name web
k7s cli hooks -r helm -n default --name web
k7s cli all -r helm -n default --name web
k7s cli test -r helm -n default --name web --confirm
k7s cli describe -r helm -n default --name web
k7s cli -r helmchart
k7s cli -r helmrepo
k7s cli repo-add -r helmrepo --name bitnami --repo-url https://charts.bitnami.com/bitnami --confirm
k7s cli repo-update -r helmrepo --confirm
k7s cli delete -r helmrepo --name bitnami --confirm

# apply manifests with server-side apply
k7s cli apply -f ./deployment.yaml --confirm
k7s cli apply -f - --confirm

# preview manifest changes with kubectl diff
k7s cli diff -f ./deployment.yaml --server-side

# delete requires an explicit name and confirmation flag
k7s cli delete -r po -n default --name web-1 --confirm
k7s cli evict -r po -n default --name web-1 --confirm
k7s cli kill -r po -n default --name stuck-pod --confirm
k7s cli --delete -r ns --name old-env --confirm

# scale supported workloads with an explicit replica count and confirmation flag
k7s cli scale -r deploy -n default --name web --replicas 3 --confirm

# restart supported rollout workloads with explicit confirmation
k7s cli restart -r deploy -n default --name web --confirm
k7s cli set-image -r deploy -n default --name web --container app --image nginx:1.28 --confirm
k7s cli rollback -r deploy -n default --name web --confirm
k7s cli rollback -r sts -n default --name db --revision 3 --confirm
k7s cli install -r helm -n default --name web --chart bitnami/nginx --confirm
k7s cli upgrade -r helm -n default --name web --chart bitnami/nginx --version 18.2.5 --set image.tag=1.28 --install --confirm
k7s cli rollback -r helm -n default --name web --revision 2 --confirm
k7s cli history -r deploy -n default --name web
k7s cli history -r helm -n default --name web
k7s cli status -r helm -n default --name web
k7s cli status -r helm -n default --name web --revision 2
k7s cli -r helmchart
k7s cli -r helmrepo
k7s cli repo-add -r helmrepo --name bitnami --repo-url https://charts.bitnami.com/bitnami --confirm
k7s cli repo-update -r helmrepo --confirm
k7s cli repo-update -r helmrepo --name bitnami --confirm
k7s cli delete -r helmrepo --name bitnami --confirm
k7s cli status -r deploy -n default --name web --timeout 30s
k7s cli pause -r deploy -n default --name web --confirm
k7s cli resume -r deploy -n default --name web --confirm

# cordon or uncordon nodes with explicit confirmation
k7s cli cordon -r node --name worker-1 --confirm
k7s cli uncordon -r node --name worker-1 --confirm
k7s cli drain -r node --name worker-1 --confirm
k7s cli debug-node -r node --name worker-1

# print a resource manifest, rendered Helm release manifest, Helm release resources, Helm release metadata, Helm release values, Helm notes, Helm hooks, or Helm all output
k7s cli yaml -r deploy -n default --name web
k7s cli yaml -r helm -n default --name web
k7s cli resources -r helm -n default --name web
k7s cli metadata -r helm -n default --name web
k7s cli values -r helm -n default --name web
k7s cli notes -r helm -n default --name web
k7s cli hooks -r helm -n default --name web
k7s cli all -r helm -n default --name web

# run Helm release chart tests with explicit confirmation
k7s cli test -r helm -n default --name web --confirm

# edit a resource with kubectl edit
k7s cli edit -r deploy -n default --name web

# update labels or annotations with explicit confirmation
k7s cli label -r deploy -n default --name web --key team --value platform --overwrite --confirm
k7s cli annotate -r deploy -n default --name web --key note --remove --confirm

# describe a resource with spec, status, conditions, and related events
k7s cli describe -r deploy -n default --name web

# print pod logs
k7s cli logs -n default --name web --container app --tail 200
k7s cli logs -n default --name web --container app --previous
k7s cli logs -n default --name web --container app --timestamps
k7s cli logs -n default --name web --container app --follow

# execute a non-interactive command inside a pod
k7s cli exec -n default --name web --container app --command "printenv HOSTNAME"

# open an interactive shell inside a pod
k7s cli shell -n default --name web --container app --command /bin/bash

# attach to a running pod container
k7s cli attach -n default --name web --container app

# forward a local port to a pod or service
k7s cli port-forward -n default --name web --target-port 8080 --local-port 18080
k7s cli port-forward -r svc -n default --name web --target-port 80 --local-port 18080

# check current user permissions
k7s cli can-i --verb get -r po -n default --resource-name web --subresource log
k7s cli can-i --verb get --non-resource-url /readyz

# inspect storage, RBAC, HPA, and events with common aliases
k7s cli -r tn
k7s cli -r tp
k7s cli -r tc
k7s cli -r cs
k7s cli -r apig
k7s cli -r apires
k7s cli -r ver
k7s cli -r oidc
k7s cli -r health
k7s cli -r ssr
k7s cli -r ssar -n default
k7s cli -r ssrr -n default
k7s cli -r pvc
k7s cli -r crd
k7s cli -r helm
k7s cli -r rc
k7s cli -r crv
k7s cli -r pt
k7s cli -r pdb
k7s cli -r rq
k7s cli -r lr
k7s cli -r pc
k7s cli -r rtc
k7s cli -r ep
k7s cli -r le
k7s cli -r eps
k7s cli -r csid
k7s cli -r csin
k7s cli -r va
k7s cli -r vac
k7s cli -r csc
k7s cli -r vsc
k7s cli -r vs
k7s cli -r vscnt
k7s cli -r apisvc
k7s cli -r mwc
k7s cli -r vwc
k7s cli -r map
k7s cli -r mapb
k7s cli -r vap
k7s cli -r vapb
k7s cli -r fs
k7s cli -r plc
k7s cli -r csr
k7s cli -r ctb
k7s cli -r pcr
k7s cli -r sv
k7s cli -r svm
k7s cli -r ic
k7s cli -r gwc
k7s cli -r gw
k7s cli -r htr
k7s cli -r grpcr
k7s cli -r tlsr
k7s cli -r tcpr
k7s cli -r udpr
k7s cli -r rg
k7s cli -r dc
k7s cli -r dtr
k7s cli -r crx --crd widgets.example.com -n default
k7s cli -r drc
k7s cli -r drct
k7s cli -r rslice
k7s cli -r netpol
k7s cli -r ip
k7s cli -r scidr
k7s cli -r lc
k7s cli -r crb
k7s cli -r hpa
k7s cli -r ev -n kube-system
```

Supported CLI resources include contexts, topnodes, toppods, topcontainers, containers, containerstates, containerresources, images, probes, ports, volumes, volumemounts, envvars, podconditions, podreadinessgates, podnetwork, podplacement, securitycontexts, podlabels, podannotations, componentstatuses, apigroups, apiresources, serverversions, openidconfigs, apiserverhealth, selfsubjectreviews, selfsubjectaccessreviews, selfsubjectrulesreviews, pods, deployments, daemonsets, statefulsets, replicasets, replicationcontrollers, controllerrevisions, podtemplates, jobs, cronjobs, helmcharts, helmreleases, helmrepositories, poddisruptionbudgets, resourcequotas, limitranges, priorityclasses, runtimeclasses, flowschemas, prioritylevelconfigurations, services, nodes, namespaces, configmaps, secrets, endpoints, leases, leasecandidates, ingresses, ingressclasses, gatewayclasses, gateways, httproutes, grpcroutes, tlsroutes, tcproutes, udproutes, referencegrants, networkpolicies, ipaddresses, servicecidrs, endpointslices, apiservices, mutatingwebhookconfigurations, validatingwebhookconfigurations, mutatingadmissionpolicies, mutatingadmissionpolicybindings, validatingadmissionpolicies, validatingadmissionpolicybindings, certificatesigningrequests, clustertrustbundles, podcertificaterequests, storageversions, storageversionmigrations, persistentvolumes, persistentvolumeclaims, storageclasses, volumeattributesclasses, csidrivers, csinodes, volumeattachments, csistoragecapacities, volumesnapshotclasses, volumesnapshots, volumesnapshotcontents, deviceclasses, devicetaintrules, resourceclaims, resourceclaimtemplates, resourceslices, serviceaccounts, roles, rolebindings, clusterroles, clusterrolebindings, customresources, customresourcedefinitions, horizontalpodautoscalers, and events.

### Web Mode

```bash
# serve the same React UI used by Electron on 127.0.0.1:3000
k7s web

# choose host and port
k7s web --host 127.0.0.1 --port 4000

# run the embedded web server without a desktop window
k7s web --no-window
```

Web mode is local-only by default and uses the same API provider surface as the desktop client, so the browser and Electron client stay visually and functionally aligned. It can import kubeconfig files from the browser into app-managed storage, persist the selected kubeconfig `current-context` and default namespace through the same header actions, and manage Pod or Service port-forward sessions through the shared runtime.

## Architecture

```
k7s/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry, IPC handlers
│   │   └── kube.ts     # Kubernetes API wrapper
│   ├── preload/        # Context bridge
│   │   └── index.ts    # API exposure
│   ├── renderer/       # React frontend
│   │   └── src/
│   │       ├── App.tsx  # Main React component
│   │       └── App.css  # Styles
│   └── shared/         # Shared types
│       └── types.ts    # TypeScript interfaces
└── out/               # Build output
```

## Technology Stack

- **Electron** - Desktop application framework
- **electron-vite** - Build tool
- **React** - UI framework
- **TypeScript** - Type safety
- **@kubernetes/client-node** - Kubernetes API client
- **xterm.js** - Terminal emulator
- **node-pty** - PTY for terminal

## License

MIT License - see [LICENSE](LICENSE) for details.
