export const resetElectronMock = () => {
  if (!globalThis.__k7sExposed) {
    globalThis.__k7sExposed = {}
  }
  for (const key of Object.keys(globalThis.__k7sExposed)) {
    delete globalThis.__k7sExposed[key]
  }
  globalThis.__electronMock.appEvents = []
  globalThis.__electronMock.appendSwitchCalls = []
  globalThis.__electronMock.browserWindowInstances = []
  globalThis.__electronMock.contextBridgeCalls = []
  globalThis.__electronMock.dialogCalls = []
  globalThis.__electronMock.invokeCalls = []
  globalThis.__electronMock.invokeImpl = undefined
  globalThis.__electronMock.ipcMainHandleCalls = []
  globalThis.__electronMock.ipcMainOnCalls = []
  globalThis.__electronMock.ipcRendererListeners = new Map()
  globalThis.__electronMock.removeAllListenersCalls = []
  globalThis.__electronMock.sendCalls = []
  globalThis.__electronMock.setPathCalls = []
  globalThis.__electronMock.webContentsSendCalls = []
  globalThis.__electronMock.loadFileCalls = []
  globalThis.__electronMock.loadUrlCalls = []
  globalThis.__electronMock.quitCalled = false
}

export const resetReactDomClientMock = () => {
  globalThis.__reactDomClientMock.createRootCalls = []
  globalThis.__reactDomClientMock.roots = []
}

export const resetWindowState = () => {
  globalThis.window = {
    ...globalThis.window,
    addEventListener() {},
    clearInterval: globalThis.clearInterval.bind(globalThis),
    location: {
      protocol: 'http:',
      host: 'localhost:3000',
    },
    removeEventListener() {},
    setInterval: globalThis.setInterval.bind(globalThis),
  }
  delete globalThis.window.k7s
  delete globalThis.window.k8sTerm
}

export const resetDocumentState = () => {
  globalThis.__documentElements = {}
  globalThis.document = {
    getElementById(id) {
      return globalThis.__documentElements?.[id] ?? null
    },
  }
}
