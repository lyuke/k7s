import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const importFresh = async (relativePath) => {
  const href = pathToFileURL(path.resolve(process.cwd(), relativePath)).href
  return import(`${href}?t=${Date.now()}-${Math.random()}`)
}
