# k7s

A Kubernetes desktop GUI application for macOS, built with Electron + React + TypeScript.

## Features

- Browse and manage Kubernetes clusters
- View nodes, pods, deployments, daemonsets, statefulsets, replicasets, jobs, and cronjobs
- Support for multiple kubeconfig files
- Context grouping and custom naming
- Built-in terminal with direct kubectl access
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

1. **Launch the app** - Select or add a Kubernetes context from the sidebar
2. **Browse resources** - Choose a resource type (Pods, Deployments, etc.) from the left panel
3. **View details** - Click on any resource to see detailed information
4. **Terminal** - Click the "Terminal" button in the header to open an integrated terminal with kubectl access

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
