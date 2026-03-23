import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['bufferutil', 'utf-8-validate', 'node-pty']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['bufferutil', 'utf-8-validate'],
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()]
  }
})
