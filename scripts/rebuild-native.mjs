#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const required = process.argv.includes('--required')

const electronRebuild = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-rebuild.cmd' : 'electron-rebuild'
)

const nodePty = path.join(root, 'node_modules', 'node-pty')

if (!fs.existsSync(nodePty)) {
  if (required) {
    console.error('node-pty is not installed')
    process.exit(1)
  }
  process.exit(0)
}

if (!fs.existsSync(electronRebuild)) {
  if (required) {
    console.error('electron-rebuild is not installed')
    process.exit(1)
  }
  console.log('Skipping native rebuild: electron-rebuild is not installed')
  process.exit(0)
}

const child = spawn(electronRebuild, ['-f', '-w', 'node-pty'], {
  cwd: root,
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  if (required) {
    console.error(error.message)
    process.exit(1)
  }
  console.log(`Skipping native rebuild: ${error.message}`)
  process.exit(0)
})
