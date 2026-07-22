import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { CoreV1Api, KubeConfig, PatchStrategy } from '@kubernetes/client-node'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

const CONTEXT_ID = 'default::test-context'

let tempDir
let originalKubeconfig
let originalMakeApiClient
let apiClients

const writeKubeconfig = () => {
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
    'current-context: test-context',
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
  const result = options.middleware[0].pre({
    setHeaderParam(name, value) {
      if (name === 'Content-Type') {
        contentType = value
      }
    },
  })
  if (result && typeof result.toPromise === 'function') {
    await result.toPromise()
  } else {
    await result
  }
  return contentType
}

const setupApis = (clients) => {
  apiClients = clients
  KubeConfig.prototype.makeApiClient = function makeApiClient(apiClientType) {
    if (apiClientType === CoreV1Api) return apiClients.core
    return apiClients.default ?? {}
  }
}

beforeEach(() => {
  resetElectronMock()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k7s-runtime-test-'))
  globalThis.__electronMock.getPathImpl = () => tempDir
  originalKubeconfig = process.env.KUBECONFIG
  process.env.KUBECONFIG = writeKubeconfig()
  originalMakeApiClient = KubeConfig.prototype.makeApiClient
  apiClients = {}
})

afterEach(() => {
  KubeConfig.prototype.makeApiClient = originalMakeApiClient
  if (originalKubeconfig === undefined) {
    delete process.env.KUBECONFIG
  } else {
    process.env.KUBECONFIG = originalKubeconfig
  }
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('main runtime operations', () => {
  it('mutates Node labels through the Kubernetes API', async () => {
    const core = createMockApi({
      patchNode: async () => ({ metadata: { name: 'node-1' } }),
    })
    setupApis({ core })

    const runtime = await importFresh('./src/main/runtime.ts')
    const addResult = await runtime.mutateResourceMetadata(
      CONTEXT_ID,
      'Node',
      '',
      'node-1',
      'labels',
      'team',
      'platform',
      false,
    )
    const removeResult = await runtime.mutateResourceMetadata(
      CONTEXT_ID,
      'nodes',
      '',
      'node-1',
      'labels',
      'team',
      '',
      true,
    )

    assert.equal(addResult.success, true)
    assert.equal(removeResult.success, true)
    assert.deepEqual(core.__calls.patchNode[0][0], {
      name: 'node-1',
      body: {
        metadata: {
          labels: {
            team: 'platform',
          },
        },
      },
    })
    assert.deepEqual(core.__calls.patchNode[1][0], {
      name: 'node-1',
      body: {
        metadata: {
          labels: {
            team: null,
          },
        },
      },
    })
    assert.equal(await patchContentType(core.__calls.patchNode[0][1]), PatchStrategy.MergePatch)
  })
})
