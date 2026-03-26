# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

k7s is a Kubernetes desktop GUI application built with Electron + electron-vite + React + TypeScript. It provides a visual interface for browsing Kubernetes clusters, viewing nodes, pods, deployments, and other resources.

## Commands

```bash
npm run dev        # Start development mode with hot reload
npm run build      # Production build (outputs to out/)
npm run dist:mac   # Build macOS app bundle
npm run dist:mac:arm64  # Build for Apple Silicon
npm run dist:mac:x64    # Build for Intel Macs
```

## Architecture

### Three-Process Model (Electron)

- **Main Process** (`src/main/`): Electron main process handling window creation, IPC handlers, and Kubernetes API calls
- **Preload** (`src/preload/`): Context bridge that securely exposes APIs to renderer
- **Renderer** (`src/renderer/`): React frontend

### Key Files

| File | Purpose |
|------|---------|
| `src/main/index.ts` | Electron main entry, window creation, IPC handler registration |
| `src/main/kube.ts` | Kubernetes API wrapper using @kubernetes/client-node |
| `src/main/webServer.ts` | HTTP/WebSocket server for web mode access |
| `src/preload/index.ts` | contextBridge API exposure for renderer |
| `src/shared/types.ts` | TypeScript types shared across processes |
| `src/renderer/src/App.tsx` | Main React component |
| `src/renderer/src/api/provider.ts` | Unified API provider (Electron IPC + WebSocket) |
| `src/renderer/src/store/` | Zustand stores for state management |
| `electron.vite.config.ts` | electron-vite build configuration |

### API Communication

The renderer uses a unified API provider (`src/renderer/src/api/provider.ts`) that automatically detects the environment:

- **Electron Mode**: Uses IPC via `window.k7s` exposed through contextBridge
- **Web Mode**: Uses WebSocket connection to `/ws` endpoint

```typescript
import { k8sApi } from './api/provider'
// Works in both Electron and Web modes
k8sApi.listContexts()
k8sApi.listPods(contextId)
// ... etc
```

### Web Mode (Remote Access)

When running with `K7S_ENABLE_WEB=true`, the app starts an embedded HTTP server on port 3000 (configurable via `K7S_WEB_PORT`). This allows accessing the Kubernetes dashboard from a web browser:

```bash
K7S_ENABLE_WEB=true npm run dev  # Start with web server
# Access at http://localhost:3000
```

Note: Terminal functionality is only available in Electron mode (requires node-pty).

### Kubernetes Integration

Uses `@kubernetes/client-node` library. Kubeconfig contexts are cached and stored in `k7s.config.json` in the app's userData directory. The cache supports both the default kubeconfig and user-added kubeconfig files.

### Context/Grouping Preferences

Context names and grouping preferences are stored in the same `k7s.config.json` file under `prefs.customNames` and `prefs.groups`.
