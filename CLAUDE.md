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
| `src/preload/index.ts` | contextBridge API exposure for renderer |
| `src/shared/types.ts` | TypeScript types shared across processes |
| `src/renderer/src/App.tsx` | Main React component (contains all UI logic) |
| `electron.vite.config.ts` | electron-vite build configuration |

### IPC Communication

Renderer communicates with main process via `window.k7s` API exposed through contextBridge. All Kubernetes operations are handled in the main process:

```typescript
window.k7s.listContexts()           // List kubeconfig contexts
window.k7s.listPods(contextId)      // List pods
window.k7s.listDeployments(contextId)
window.k7s.addKubeconfigFile()       // Open file dialog to add kubeconfig
// ... etc
```

### Kubernetes Integration

Uses `@kubernetes/client-node` library. Kubeconfig contexts are cached and stored in `k7s.config.json` in the app's userData directory. The cache supports both the default kubeconfig and user-added kubeconfig files.

### Context/Grouping Preferences

Context names and grouping preferences are stored in the same `k7s.config.json` file under `prefs.customNames` and `prefs.groups`.
