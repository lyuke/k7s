#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const [mode, ...restArgs] = process.argv.slice(2)
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const HELP_TEXT = `k7s launcher

Usage:
  k7s [dev]
  k7s preview
  k7s web [--host <host>] [--port <port>] [--no-window]
  k7s cli [options]

Modes:
  dev       start the Electron desktop client in development mode
  preview   start the production preview client
  web       start the shared React UI through the embedded local web server
  cli       start the k9s-like terminal resource view
`

const spawnChild = (args, env = process.env) => {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
  })
  child.on('exit', (code) => process.exit(code ?? 0))
}

const parseWebArgs = (args) => {
  const env = {
    ...process.env,
    K7S_ENABLE_WEB: 'true',
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--host') {
      env.K7S_WEB_HOST = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--port') {
      env.K7S_WEB_PORT = args[i + 1]
      i += 1
      continue
    }
    if (arg === '--no-window') {
      env.K7S_NO_WINDOW = 'true'
      continue
    }
    throw new Error(`Unknown web argument: ${arg}`)
  }

  return env
}

if (mode === '--help' || mode === '-h') {
  process.stdout.write(HELP_TEXT)
  process.exit(0)
}

if (mode === 'cli') {
  const child = spawn(process.execPath, [path.join(__dirname, 'k7s-cli.js'), ...restArgs], {
    cwd: root,
    stdio: 'inherit',
  })
  child.on('exit', (code) => process.exit(code ?? 0))
} else if (mode === 'web') {
  try {
    spawnChild(['electron-vite', 'dev'], parseWebArgs(restArgs))
  } catch (error) {
    process.stderr.write(`k7s web error: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
} else if (mode === undefined || mode === 'dev') {
  spawnChild(['electron-vite', 'dev'])
} else if (mode === 'preview') {
  spawnChild(['electron-vite', 'preview'])
} else {
  process.stderr.write(`Unknown k7s mode: ${mode}\n\n${HELP_TEXT}`)
  process.exit(1)
}
