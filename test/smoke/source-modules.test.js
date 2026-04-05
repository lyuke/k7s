import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { importFresh } from '../helpers/module.js'
import { resetElectronMock } from '../helpers/mocks.js'

beforeEach(() => {
  resetElectronMock()
})

describe('source module smoke tests', () => {
  it('imports the main-process modules with mocked Electron dependencies', async () => {
    await assert.doesNotReject(importFresh('./src/main/kube.ts'))
    await assert.doesNotReject(importFresh('./src/main/runtime.ts'))
    await assert.doesNotReject(importFresh('./src/main/webServer.ts'))
    await assert.doesNotReject(importFresh('./src/main/index.ts'))

    assert.ok(globalThis.__electronMock.ipcMainHandleCalls.length > 0)
    assert.ok(globalThis.__electronMock.browserWindowInstances.length > 0)
  })
})
