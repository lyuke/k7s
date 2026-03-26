// Thin wrapper around terminalStore for backward compatibility
import { useTerminalStore } from '../store'

export const useTerminal = (selectedId: string) => {
  const showTerminal = useTerminalStore((s) => s.showTerminal)
  const terminalContainerRef = useTerminalStore((s) => s.terminalContainerRef)
  const toggleTerminal = useTerminalStore((s) => s.toggleTerminal)

  return {
    showTerminal,
    terminalContainerRef,
    setShowTerminal: useTerminalStore((s) => s.setShowTerminal),
    toggleTerminal,
  }
}
