import { create } from 'zustand'
import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { isWebMode } from '../api/provider'

interface TerminalState {
  // State
  showTerminal: boolean
  terminalContainerRef: React.RefObject<HTMLDivElement | null>
  terminalAvailable: boolean

  // Actions
  setShowTerminal: (show: boolean) => void
  toggleTerminal: () => void
  setTerminalContainerRef: (ref: React.RefObject<HTMLDivElement | null>) => void
}

// Separate hook for terminal initialization logic
export const useTerminalInit = (showTerminal: boolean, selectedId: string, containerRef: React.RefObject<HTMLDivElement | null>) => {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const k8sTerm = (window as unknown as { k8sTerm?: typeof import('../../preload/index').k8sTerm }).k8sTerm

  useEffect(() => {
    if (!showTerminal) {
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      k8sTerm?.destroy()
      return
    }

    if (!containerRef.current || terminalRef.current) return
    if (!selectedId) return

    // Check if terminal is available (Electron mode only)
    if (!k8sTerm) {
      console.log('Terminal is not available in web mode')
      return
    }

    const term = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)'
      },
      rows: 12,
      cols: 80,
      cursorBlink: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    fitAddonRef.current = fitAddon

    term.open(containerRef.current)
    fitAddon.fit()

    terminalRef.current = term

    k8sTerm.create(selectedId).then(({ shell, cwd }) => {
      term.write(`Connected to cluster (${shell})\r\n`)
      term.write(`${cwd}$ `)

      term.onData((data) => {
        k8sTerm.write(data)
      })

      k8sTerm.onData((data) => {
        term.write(data)
      })

      k8sTerm.onExit((exitCode) => {
        term.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
      })
    })

    const handleResize = () => {
      if (fitAddonRef.current && terminalRef.current) {
        fitAddonRef.current.fit()
        const dims = fitAddonRef.current.proposeDimensions()
        if (dims) {
          k8sTerm.resize(dims.cols, dims.rows)
        }
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      k8sTerm.destroy()
      fitAddonRef.current = null
    }
  }, [showTerminal, selectedId, containerRef, k8sTerm])
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  // Initial state
  showTerminal: false,
  terminalContainerRef: { current: null } as React.RefObject<HTMLDivElement | null>,
  terminalAvailable: !isWebMode,

  // Actions
  setShowTerminal: (show) => set({ showTerminal: show }),
  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
  setTerminalContainerRef: (ref) => set({ terminalContainerRef: ref }),
}))
