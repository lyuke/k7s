#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const mode = process.argv[2]
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const args = mode === 'preview' ? ['electron-vite', 'preview'] : ['electron-vite', 'dev']

const child = spawn(command, args, { cwd: root, stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
