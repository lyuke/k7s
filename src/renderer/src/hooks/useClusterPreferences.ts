// Thin wrapper around preferencesStore for backward compatibility
import { usePreferencesStore } from '../store'
import type { ContextPrefs } from '../../../shared/types'

export const useClusterPreferences = (
  _contextPrefs: ContextPrefs | null,
  _setContextPrefs: (prefs: ContextPrefs | null) => void,
  editingContextId: string | null,
  _setEditingContextId: (id: string | null) => void,
  editingName: string,
  _setEditingName: (name: string) => void,
  isAddingGroup: boolean,
  _setIsAddingGroup: (adding: boolean) => void,
  newGroupName: string,
  _setNewGroupName: (name: string) => void,
  _dragging: { id: string; fromGroupId: string } | null,
  _setDragging: (drag: { id: string; fromGroupId: string } | null) => void
) => {
  const contextPrefs = usePreferencesStore((s) => s.contextPrefs)
  const getDisplayName = usePreferencesStore((s) => s.getDisplayName)
  const loadContextPrefs = usePreferencesStore((s) => s.loadContextPrefs)
  const handleRenameKey = usePreferencesStore((s) => s.handleRenameKey)
  const beginRename = usePreferencesStore((s) => s.beginRename)
  const handleAddGroup = usePreferencesStore((s) => s.handleAddGroup)
  const handleConfirmAddGroup = usePreferencesStore((s) => s.handleConfirmAddGroup)
  const handleCancelAddGroup = usePreferencesStore((s) => s.handleCancelAddGroup)
  const allowDragOver = usePreferencesStore((s) => s.allowDragOver)
  const startDrag = usePreferencesStore((s) => s.startDrag)
  const dropOnItem = usePreferencesStore((s) => s.dropOnItem)
  const dropOnGroup = usePreferencesStore((s) => s.dropOnGroup)

  return {
    contextPrefs,
    editingContextId,
    editingName,
    isAddingGroup,
    newGroupName,
    dragging: _dragging,
    setContextPrefs: usePreferencesStore((s) => s.setContextPrefs),
    setEditingContextId: usePreferencesStore((s) => s.setEditingContextId),
    setEditingName: usePreferencesStore((s) => s.setEditingName),
    setIsAddingGroup: usePreferencesStore((s) => s.setIsAddingGroup),
    setNewGroupName: usePreferencesStore((s) => s.setNewGroupName),
    setDragging: usePreferencesStore((s) => s.setDragging),
    getDisplayName,
    loadContextPrefs,
    updateContextName: usePreferencesStore((s) => s.updateContextName),
    submitRename: usePreferencesStore((s) => s.submitRename),
    handleRenameKey,
    beginRename,
    handleAddGroup,
    handleConfirmAddGroup,
    handleCancelAddGroup,
    persistGrouping: usePreferencesStore((s) => s.persistGrouping),
    allowDragOver,
    startDrag,
    dropOnItem,
    dropOnGroup,
  }
}
