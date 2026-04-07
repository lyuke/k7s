import fs from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const SCRIPT_EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs']
const EMPTY_MODULE_SOURCE = 'export default {}\n'
const MOCK_MODULES = new Map([
  ['electron', `
    const exposed = globalThis.__k7sExposed ?? (globalThis.__k7sExposed = {})
    const state = globalThis.__electronMock ?? (globalThis.__electronMock = {
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
    })
    export const app = {
      commandLine: {
        appendSwitch(...args) {
          state.appendSwitchCalls.push(args)
        },
      },
      dock: { hide() {} },
      getPath(name) {
        return state.getPathImpl ? state.getPathImpl(name) : '/tmp/k7s-electron'
      },
      getVersion() { return '0.0.0-test' },
      isPackaged: false,
      on(event, handler) {
        state.appEvents.push({ type: 'on', event, handler })
      },
      once(event, handler) {
        state.appEvents.push({ type: 'once', event, handler })
      },
      quit() {
        state.quitCalled = true
      },
      requestSingleInstanceLock() { return true },
      setPath(name, value) {
        state.setPathCalls.push([name, value])
      },
      whenReady() {
        return Promise.resolve()
      },
    }
    export class BrowserWindow {
      static getAllWindows() {
        return state.browserWindowInstances
      }
      constructor(options = {}) {
        this.options = options
        this.webContents = {
          on() {},
          once() {},
          openDevTools() {},
          send(...args) {
            state.webContentsSendCalls.push(args)
          },
          setWindowOpenHandler() { return { action: 'deny' } },
        }
        state.browserWindowInstances.push(this)
      }
      destroy() {}
      focus() {}
      isMinimized() { return false }
      loadFile(...args) {
        state.loadFileCalls = state.loadFileCalls ?? []
        state.loadFileCalls.push(args)
      }
      loadURL(...args) {
        state.loadUrlCalls = state.loadUrlCalls ?? []
        state.loadUrlCalls.push(args)
      }
      on() {}
      once() {}
      restore() {}
      show() {}
    }
    export const dialog = {
      showMessageBox: async (...args) => {
        state.dialogCalls.push({ method: 'showMessageBox', args })
        return { response: 0 }
      },
      showOpenDialog: async (...args) => {
        state.dialogCalls.push({ method: 'showOpenDialog', args })
        return { canceled: true, filePaths: [] }
      },
    }
    export const ipcMain = {
      handle(channel, handler) {
        state.ipcMainHandleCalls.push({ channel, handler })
      },
      on(channel, handler) {
        state.ipcMainOnCalls = state.ipcMainOnCalls ?? []
        state.ipcMainOnCalls.push({ channel, handler })
      },
      removeHandler(channel) {
        state.removeHandlerCalls = state.removeHandlerCalls ?? []
        state.removeHandlerCalls.push(channel)
      },
    }
    export const ipcRenderer = {
      async invoke(...args) {
        state.invokeCalls.push(args)
        if (state.invokeImpl) {
          return state.invokeImpl(...args)
        }
        return undefined
      },
      on(channel, handler) {
        const handlers = state.ipcRendererListeners.get(channel) ?? []
        handlers.push(handler)
        state.ipcRendererListeners.set(channel, handlers)
      },
      removeAllListeners(channel) {
        state.removeAllListenersCalls.push(channel)
        state.ipcRendererListeners.delete(channel)
      },
      send(...args) {
        state.sendCalls.push(args)
      },
    }
    export const contextBridge = {
      exposeInMainWorld(name, value) {
        state.contextBridgeCalls.push([name, value])
        exposed[name] = value
      },
    }
    export const shell = { openExternal() {} }
  `],
  ['node-pty', `
    const state = globalThis.__nodePtyMock ?? (globalThis.__nodePtyMock = {
      spawnCalls: [],
    })
    export function spawn(...args) {
      state.spawnCalls.push(args)
      return {
        kill() {},
        onData() {},
        onExit() {},
        resize() {},
        write() {},
      }
    }
  `],
  ['react-dom/client', `
    const state = globalThis.__reactDomClientMock ?? (globalThis.__reactDomClientMock = {
      createRootCalls: [],
      roots: [],
    })
    export function createRoot(container) {
      const root = {
        renderCalls: [],
        render(node) {
          root.renderCalls.push(node)
        },
      }
      state.createRootCalls.push(container)
      state.roots.push(root)
      return root
    }
  `],
  ['@xterm/xterm', `
    const state = globalThis.__xtermMock ?? (globalThis.__xtermMock = {
      terminals: [],
    })
    export class Terminal {
      constructor(options = {}) {
        this.options = options
        this.dataHandlers = []
        state.terminals.push(this)
      }
      dispose() {}
      focus() {}
      loadAddon(addon) {
        this.addon = addon
      }
      onData(handler) {
        this.dataHandlers.push(handler)
      }
      open(container) {
        this.container = container
      }
      write(data) {
        this.lastWrite = data
      }
    }
  `],
  ['@xterm/addon-fit', `
    const state = globalThis.__fitAddonMock ?? (globalThis.__fitAddonMock = {
      addons: [],
    })
    export class FitAddon {
      constructor() {
        state.addons.push(this)
      }
      fit() {}
      proposeDimensions() {
        return { cols: 80, rows: 24 }
      }
    }
  `],
])

const stripQueryAndHash = (value) => value.split('?')[0].split('#')[0]

const hasExtension = (specifier) => /\.[^/]+$/.test(stripQueryAndHash(specifier))

const isResolvableFileSpecifier = (specifier) =>
  specifier.startsWith('./') ||
  specifier.startsWith('../') ||
  specifier.startsWith('/') ||
  specifier.startsWith('file:')

const isFileUrl = (url) => stripQueryAndHash(url).startsWith('file:')

const shouldTranspile = (url) => {
  const cleanUrl = stripQueryAndHash(url)
  return cleanUrl.endsWith('.ts') || cleanUrl.endsWith('.tsx')
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (MOCK_MODULES.has(specifier)) {
      return {
        format: 'module',
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(MOCK_MODULES.get(specifier))}`,
      }
    }

    if (specifier.endsWith('.css')) {
      return nextResolve(specifier, context)
    }

    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (!isResolvableFileSpecifier(specifier) || hasExtension(specifier)) {
        throw error
      }

      for (const extension of SCRIPT_EXTENSIONS) {
        try {
          return nextResolve(`${specifier}${extension}`, context)
        } catch {
          // Try the next candidate.
        }
      }

      for (const extension of SCRIPT_EXTENSIONS) {
        try {
          return nextResolve(`${specifier}/index${extension}`, context)
        } catch {
          // Try the next candidate.
        }
      }

      throw error
    }
  },

  load(url, context, nextLoad) {
    const cleanUrl = stripQueryAndHash(url)

    if (cleanUrl.endsWith('.css')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: EMPTY_MODULE_SOURCE,
      }
    }

    if (!isFileUrl(url) || !shouldTranspile(url)) {
      return nextLoad(url, context)
    }

    if (cleanUrl.endsWith('.d.ts')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: 'export {}\n',
      }
    }

    const filename = fileURLToPath(cleanUrl)
    const source = fs.readFileSync(filename, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
      fileName: filename,
      reportDiagnostics: false,
    })

    return {
      format: 'module',
      shortCircuit: true,
      source: transpiled.outputText,
    }
  },
})
