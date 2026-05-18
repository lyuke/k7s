import { create } from 'zustand'
import { useCallback, useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { terminalApi } from '../api/provider'

type PendingTerminalCommand = {
  id: number
  command: string
}

interface TerminalState {
  // State
  showTerminal: boolean
  terminalContainerRef: React.RefObject<HTMLDivElement | null>
  terminalAvailable: boolean
  pendingCommand: PendingTerminalCommand | null

  // Actions
  setShowTerminal: (show: boolean) => void
  toggleTerminal: () => void
  setTerminalContainerRef: (ref: React.RefObject<HTMLDivElement | null>) => void
  openTerminalWithCommand: (command: string) => void
  clearPendingCommand: (id: number) => void
}

// Separate hook for terminal initialization logic
/* node:coverage disable */
export const useTerminalInit = (showTerminal: boolean, selectedId: string, containerRef: React.RefObject<HTMLDivElement | null>) => {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const terminalReadyRef = useRef(false)
  const lastCommandIdRef = useRef<number | null>(null)
  const pendingCommand = useTerminalStore((s) => s.pendingCommand)
  const clearPendingCommand = useTerminalStore((s) => s.clearPendingCommand)
  const pendingCommandRef = useRef<PendingTerminalCommand | null>(null)
  const k8sTerm = terminalApi

  useEffect(() => {
    pendingCommandRef.current = pendingCommand
  }, [pendingCommand])

  const writePendingCommand = useCallback((pending: PendingTerminalCommand | null) => {
    if (!pending || !showTerminal || !k8sTerm || !terminalRef.current || !terminalReadyRef.current) {
      return
    }
    if (lastCommandIdRef.current === pending.id) return

    terminalRef.current.focus()
    k8sTerm.write(`${pending.command}\r`)
    lastCommandIdRef.current = pending.id
    clearPendingCommand(pending.id)
  }, [clearPendingCommand, k8sTerm, showTerminal])

  useEffect(() => {
    if (!showTerminal) {
      terminalReadyRef.current = false
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      k8sTerm?.destroy()
      return
    }

    if (!containerRef.current || terminalRef.current) return
    if (!selectedId) return

    if (!k8sTerm) {
      console.log('Terminal is not available')
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
    term.focus()

    terminalRef.current = term

    k8sTerm.create(selectedId).then(() => {
      term.onData((data) => {
        k8sTerm.write(data)
      })

      k8sTerm.onData((data) => {
        term.write(data)
      })

      k8sTerm.onExit((exitCode) => {
        term.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
      })

      terminalReadyRef.current = true
      writePendingCommand(pendingCommandRef.current)
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
      terminalReadyRef.current = false
      if (terminalRef.current) {
        terminalRef.current.dispose()
        terminalRef.current = null
      }
      k8sTerm.destroy()
      fitAddonRef.current = null
    }
  }, [showTerminal, selectedId, containerRef, k8sTerm, writePendingCommand])

  useEffect(() => {
    writePendingCommand(pendingCommand)
  }, [pendingCommand, writePendingCommand])
}
/* node:coverage enable */

export const useTerminalStore = create<TerminalState>((set, get) => ({
  // Initial state
  showTerminal: false,
  terminalContainerRef: { current: null } as React.RefObject<HTMLDivElement | null>,
  terminalAvailable: !!terminalApi,
  pendingCommand: null,

  // Actions
  setShowTerminal: (show) => set({ showTerminal: show }),
  toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
  setTerminalContainerRef: (ref) => set({ terminalContainerRef: ref }),
  openTerminalWithCommand: (command) => set((state) => ({
    showTerminal: true,
    pendingCommand: {
      id: (state.pendingCommand?.id ?? 0) + 1,
      command,
    },
  })),
  clearPendingCommand: (id) => set((state) => (
    state.pendingCommand?.id === id ? { pendingCommand: null } : {}
  )),
}))
