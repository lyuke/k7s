#!/usr/bin/env node
import { AppsV1Api, CoreV1Api, KubeConfig } from '@kubernetes/client-node'

const HELP_TEXT = `k7s CLI mode (k9s-like lightweight view)\n\nUsage:\n  k7s cli [options]\n\nOptions:\n  -c, --context <name>        kube context to use (defaults to current-context)\n  -n, --namespace <name>      namespace for namespaced resources (default: all)\n  -r, --resource <type>       one of: pods, deployments, services, nodes, namespaces\n  -w, --watch                 refresh continuously\n      --refresh <seconds>     watch refresh interval in seconds (default: 3)\n      --help                  show help\n\nExamples:\n  k7s cli\n  k7s cli -r pods -n kube-system\n  k7s cli -r deployments -n default --watch\n  k7s cli --context minikube -r nodes\n`

const parseArgs = (argv) => {
  const options = {
    context: undefined,
    namespace: undefined,
    resource: 'pods',
    watch: false,
    refreshSeconds: 3,
    help: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
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

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!['pods', 'deployments', 'services', 'nodes', 'namespaces'].includes(options.resource)) {
    throw new Error(`Unsupported resource: ${options.resource}`)
  }

  if (!Number.isFinite(options.refreshSeconds) || options.refreshSeconds <= 0) {
    throw new Error('refresh interval must be a positive number')
  }

  return options
}

const ageFrom = (dateString) => {
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

const renderTable = (headers, rows) => {
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

const setupKubeConfig = (context) => {
  const kubeConfig = new KubeConfig()
  kubeConfig.loadFromDefault()

  if (context) {
    kubeConfig.setCurrentContext(context)
  }

  return kubeConfig
}

const listRows = async (kubeConfig, options) => {
  const coreApi = kubeConfig.makeApiClient(CoreV1Api)
  const appsApi = kubeConfig.makeApiClient(AppsV1Api)
  const namespace = options.namespace

  if (options.resource === 'pods') {
    const response = namespace
      ? await coreApi.listNamespacedPod({ namespace })
      : await coreApi.listPodForAllNamespaces()
    const items = response.items ?? response.body?.items ?? []
    const rows = items.map((pod) => {
      const statuses = pod.status?.containerStatuses ?? []
      const restartCount = statuses.reduce((sum, status) => sum + (status.restartCount ?? 0), 0)
      const readyCount = statuses.filter((status) => status.ready).length
      const totalCount = statuses.length
      return [
        pod.metadata?.namespace ?? '-',
        pod.metadata?.name ?? '-',
        pod.status?.phase ?? '-',
        `${readyCount}/${totalCount}`,
        restartCount,
        ageFrom(pod.metadata?.creationTimestamp),
      ]
    })
    return {
      headers: ['NAMESPACE', 'NAME', 'STATUS', 'READY', 'RESTARTS', 'AGE'],
      rows,
    }
  }

  if (options.resource === 'deployments') {
    const response = namespace
      ? await appsApi.listNamespacedDeployment({ namespace })
      : await appsApi.listDeploymentForAllNamespaces()
    const items = response.items ?? response.body?.items ?? []
    const rows = items.map((deployment) => [
      deployment.metadata?.namespace ?? '-',
      deployment.metadata?.name ?? '-',
      `${deployment.status?.readyReplicas ?? 0}/${deployment.status?.replicas ?? 0}`,
      deployment.status?.availableReplicas ?? 0,
      ageFrom(deployment.metadata?.creationTimestamp),
    ])
    return {
      headers: ['NAMESPACE', 'NAME', 'READY', 'AVAILABLE', 'AGE'],
      rows,
    }
  }

  if (options.resource === 'services') {
    const response = namespace
      ? await coreApi.listNamespacedService({ namespace })
      : await coreApi.listServiceForAllNamespaces()
    const items = response.items ?? response.body?.items ?? []
    const rows = items.map((service) => {
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
    return {
      headers: ['NAMESPACE', 'NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'AGE'],
      rows,
    }
  }

  if (options.resource === 'nodes') {
    const response = await coreApi.listNode()
    const items = response.items ?? response.body?.items ?? []
    const rows = items.map((node) => {
      const readyCondition = (node.status?.conditions ?? []).find((condition) => condition.type === 'Ready')
      const status = readyCondition?.status === 'True' ? 'Ready' : 'NotReady'
      const version = node.status?.nodeInfo?.kubeletVersion ?? '-'
      return [
        node.metadata?.name ?? '-',
        status,
        version,
        ageFrom(node.metadata?.creationTimestamp),
      ]
    })
    return {
      headers: ['NAME', 'STATUS', 'VERSION', 'AGE'],
      rows,
    }
  }

  const response = await coreApi.listNamespace()
  const items = response.items ?? response.body?.items ?? []
  const rows = items.map((item) => [
    item.metadata?.name ?? '-',
    item.status?.phase ?? '-',
    ageFrom(item.metadata?.creationTimestamp),
  ])
  return {
    headers: ['NAME', 'STATUS', 'AGE'],
    rows,
  }
}

const printFrame = async (kubeConfig, options) => {
  const currentContext = kubeConfig.getCurrentContext()
  const { headers, rows } = await listRows(kubeConfig, options)
  const namespace = options.namespace ?? 'all namespaces'
  const headline = `[k7s cli] context=${currentContext} resource=${options.resource} namespace=${namespace}`

  if (options.watch) {
    process.stdout.write('\x1Bc')
  }

  process.stdout.write(`${headline}\n`)
  process.stdout.write(`${renderTable(headers, rows)}\n`)
  process.stdout.write(`\nTotal: ${rows.length}\n`)
}

const run = async () => {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(HELP_TEXT)
    return
  }

  const kubeConfig = setupKubeConfig(options.context)

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

run().catch((error) => {
  process.stderr.write(`k7s cli error: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
