import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const collectFiles = (directory, matcher) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectFiles(fullPath, matcher)
    }
    return matcher(fullPath) ? [fullPath] : []
  })
}

const testFiles = collectFiles(path.join(rootDir, 'test'), (filePath) => filePath.endsWith('.test.js'))
  .sort()
  .map((filePath) => path.relative(rootDir, filePath))

const result = spawnSync(process.execPath, [
  '--import', './test/register-hooks.js',
  '--import', './test/setup.js',
  '--test',
  ...testFiles,
  '--test-concurrency=1',
], {
  cwd: rootDir,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
