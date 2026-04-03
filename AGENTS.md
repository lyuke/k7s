# Repository Guidelines

## Project Structure & Module Organization

`k7s` is an Electron desktop app with three code paths under `src/`: `src/main/` for the Electron main process, IPC handlers, and Kubernetes access; `src/preload/` for the context bridge; and `src/renderer/` for the React UI. Shared contracts live in `src/shared/types.ts`. Packaging helpers are in `scripts/`, and the CLI entrypoint is `bin/k7s.js`.

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run dev`: start Electron in development mode with Vite hot reload.
- `K7S_ENABLE_WEB=true npm run dev`: run dev mode with the embedded web server enabled on port `3000` by default.
- `npm run build`: produce a production build in `out/`; use this as the baseline validation step before opening a PR.
- `npm run dist:mac`, `npm run dist:mac:arm64`, `npm run dist:mac:x64`: build macOS distributables.
- `npm run install:mac`: run the local macOS install helper.

## Coding Style & Naming Conventions

Use TypeScript with `strict` mode assumptions. Follow the existing style: 2-space indentation, single quotes, no semicolons, and trailing commas in multiline objects/imports. Use `PascalCase` for React components and modal/form files (`PodDetailModal.tsx`), `camelCase` for hooks and stores (`useKubernetes.ts`, `clusterStore.ts`), and keep shared type names explicit (`DeploymentInfo`, `CreateResult`). Prefer colocating UI logic under `src/renderer/src/components/`, `hooks/`, and `store/`.

## Testing Guidelines

There is no automated test runner configured in `package.json` today. Until one is added, validate changes with `npm run build` and a focused manual smoke test in `npm run dev`. For UI changes, verify the affected resource views, modal flows, and terminal behavior. For main-process or Kubernetes changes, test against a real kubeconfig/context when possible.

## Commit & Pull Request Guidelines

Recent history uses short, imperative, feature-focused subjects such as `Add Kubernetes dashboard UI...` and `Fix security vulnerabilities...`. Keep commits in that style and scope them to one logical change. PRs should include a clear summary, manual verification steps, linked issues when relevant, and screenshots or short recordings for renderer changes. Call out macOS-only behavior, web-mode changes, and any Kubernetes permissions or config assumptions explicitly.

## Security & Configuration Tips

Do not commit kubeconfig files, secrets, or cluster-specific data. Prefer environment variables such as `K7S_ENABLE_WEB` and `K7S_WEB_PORT` over hardcoded local settings, and keep any persisted user data compatible with the app-managed `k7s.config.json` flow.
