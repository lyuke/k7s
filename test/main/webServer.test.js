import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { WebSocket } from 'ws'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

let tempDir
let originalKubeconfig

const writeKubeconfig = () => {
  const kubeconfigPath = path.join(tempDir, 'kubeconfig.yaml')
  fs.writeFileSync(kubeconfigPath, [
    'apiVersion: v1',
    'kind: Config',
    'clusters:',
    '- name: default-cluster',
    '  cluster:',
    '    server: http://127.0.0.1:65535',
    'contexts:',
    '- name: default-context',
    '  context:',
    '    cluster: default-cluster',
    '    user: default-user',
    'current-context: default-context',
    'users:',
    '- name: default-user',
    '  user: {}',
    '',
  ].join('\n'))
  return kubeconfigPath
}

const kubeconfigContent = (contextName) => [
  'apiVersion: v1',
  'kind: Config',
  'clusters:',
  '- name: uploaded-cluster',
  '  cluster:',
  '    server: http://127.0.0.1:65534',
  'contexts:',
  `- name: ${contextName}`,
  '  context:',
  '    cluster: uploaded-cluster',
  '    user: uploaded-user',
  '    namespace: web',
  `current-context: ${contextName}`,
  'users:',
  '- name: uploaded-user',
  '  user: {}',
  '',
].join('\n')

const waitForListening = async (server) => {
  if (server.listening) return
  await new Promise((resolve) => server.once('listening', resolve))
}

const closeServer = async ({ server, wss }) => {
  wss.close()
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

const serverUrl = (server) => {
  const address = server.address()
  assert.equal(typeof address, 'object')
  assert.ok(address)
  return `http://${address.address}:${address.port}`
}

beforeEach(() => {
  resetElectronMock()
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k7s-web-server-test-'))
  globalThis.__electronMock.getPathImpl = () => tempDir
  originalKubeconfig = process.env.KUBECONFIG
  process.env.KUBECONFIG = writeKubeconfig()
})

afterEach(() => {
  if (originalKubeconfig === undefined) {
    delete process.env.KUBECONFIG
  } else {
    process.env.KUBECONFIG = originalKubeconfig
  }
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('web server kubeconfig import', () => {
  it('imports browser-uploaded kubeconfig content through the HTTP API', async () => {
    const { startWebServer } = await importFresh('./src/main/webServer.ts')
    const started = startWebServer(0, { host: '127.0.0.1' })

    try {
      await waitForListening(started.server)
      const response = await fetch(`${serverUrl(started.server)}/api/k7s/add-kubeconfig`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceName: '../../Team Config.yaml',
          content: kubeconfigContent('uploaded-http-context'),
        }),
      })

      assert.equal(response.status, 200)
      const result = await response.json()
      assert.deepEqual(result.addedIds, ['web-Team_Config_yaml::uploaded-http-context'])
      assert.ok(fs.existsSync(path.join(tempDir, 'kubeconfigs', 'web-Team_Config.yaml')))
    } finally {
      await closeServer(started)
    }
  })

  it('imports browser-uploaded kubeconfig content through the WebSocket API', async () => {
    const { startWebServer } = await importFresh('./src/main/webServer.ts')
    const started = startWebServer(0, { host: '127.0.0.1' })

    try {
      await waitForListening(started.server)
      const baseUrl = serverUrl(started.server)
      const health = await fetch(`${baseUrl}/api/health`)
      const cookie = health.headers.get('set-cookie')
      assert.ok(cookie)

      const ws = new WebSocket(baseUrl.replace('http:', 'ws:') + '/ws', {
        headers: { cookie },
      })
      await new Promise((resolve, reject) => {
        ws.once('open', resolve)
        ws.once('error', reject)
      })

      const message = new Promise((resolve, reject) => {
        ws.once('message', (payload) => resolve(JSON.parse(String(payload))))
        ws.once('error', reject)
      })
      ws.send(JSON.stringify({
        id: 'upload-1',
        method: 'k7s:add-kubeconfig',
        data: {
          sourceName: 'ws.yaml',
          content: kubeconfigContent('uploaded-ws-context'),
        },
      }))

      const result = await message
      assert.equal(result.id, 'upload-1')
      assert.deepEqual(result.result.addedIds, ['web-ws_yaml::uploaded-ws-context'])
      assert.ok(fs.existsSync(path.join(tempDir, 'kubeconfigs', 'web-ws.yaml')))
      ws.close()
    } finally {
      await closeServer(started)
    }
  })
})
