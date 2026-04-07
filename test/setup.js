import 'react'

class TestWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url = 'ws://localhost:3000/ws') {
    this.url = url
    this.readyState = TestWebSocket.OPEN
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this.onerror = null
  }

  send() {}

  close() {
    this.readyState = TestWebSocket.CLOSED
  }
}

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  writable: true,
  value: {
    addEventListener() {},
    clearInterval: globalThis.clearInterval.bind(globalThis),
    removeEventListener() {},
    setInterval: globalThis.setInterval.bind(globalThis),
    location: {
      protocol: 'http:',
      host: 'localhost:3000',
    },
  },
})

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  writable: true,
  value: {
    getElementById(id) {
      return globalThis.__documentElements?.[id] ?? null
    },
  },
})

Object.defineProperty(globalThis, 'WebSocket', {
  configurable: true,
  writable: true,
  value: TestWebSocket,
})

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  writable: true,
  value: {
    clipboard: {
      writeText: async () => {},
    },
  },
})

globalThis.__documentElements = {}
globalThis.__electronMock = {
  appEvents: [],
  appendSwitchCalls: [],
  browserWindowInstances: [],
  contextBridgeCalls: [],
  dialogCalls: [],
  invokeCalls: [],
  ipcMainHandleCalls: [],
  ipcRendererListeners: new Map(),
  removeAllListenersCalls: [],
  sendCalls: [],
  setPathCalls: [],
  webContentsSendCalls: [],
}
globalThis.__nodePtyMock = { spawnCalls: [] }
globalThis.__reactDomClientMock = { createRootCalls: [], roots: [] }
globalThis.__xtermMock = { terminals: [] }
globalThis.__fitAddonMock = { addons: [] }
