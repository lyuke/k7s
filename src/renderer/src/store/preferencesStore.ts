import { create } from 'zustand'
import type { ContextRecord, ContextGroup, ContextPrefs } from '../../../shared/types'
import { k8sApi } from '../api/provider'

interface PreferencesState {
  // State
  contextPrefs: ContextPrefs | null
  editingContextId: string | null
  editingName: string
  isAddingGroup: boolean
  newGroupName: string
  dragging: { id: string; fromGroupId: string } | null

  // Actions
  setContextPrefs: (prefs: ContextPrefs | null) => void
  setEditingContextId: (id: string | null) => void
  setEditingName: (name: string) => void
  setIsAddingGroup: (adding: boolean) => void
  setNewGroupName: (name: string) => void
  setDragging: (drag: { id: string; fromGroupId: string } | null) => void

  // Computed
  getDisplayName: (ctx: ContextRecord) => string

  // Async actions
  loadContextPrefs: () => Promise<void>
  updateContextName: (id: string, name: string) => Promise<void>
  submitRename: () => Promise<void>
  handleRenameKey: (e: React.KeyboardEvent<HTMLInputElement>) => void
  beginRename: (id: string, current: string) => void
  handleAddGroup: () => void
  handleConfirmAddGroup: () => Promise<void>
  handleCancelAddGroup: () => void
  persistGrouping: (groups: ContextGroup[], ungrouped: string[]) => Promise<void>

  // Drag and drop
  allowDragOver: (e: React.DragEvent) => void
  startDrag: (contextId: string, fromGroupId: string) => (e: React.DragEvent) => void
  dropOnItem: (targetId: string, targetGroupId: string) => (e: React.DragEvent) => Promise<void>
  dropOnGroup: (targetGroupId: string) => (e: React.DragEvent) => Promise<void>
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  // Initial state
  contextPrefs: null,
  editingContextId: null,
  editingName: '',
  isAddingGroup: false,
  newGroupName: '',
  dragging: null,

  // Setters
  setContextPrefs: (prefs) => set({ contextPrefs: prefs }),
  setEditingContextId: (id) => set({ editingContextId: id }),
  setEditingName: (name) => set({ editingName: name }),
  setIsAddingGroup: (adding) => set({ isAddingGroup: adding }),
  setNewGroupName: (name) => set({ newGroupName: name }),
  setDragging: (drag) => set({ dragging: drag }),

  // Computed
  getDisplayName: (ctx) => {
    const { contextPrefs } = get()
    if (!contextPrefs) return ctx.name
    return contextPrefs.customNames[ctx.id] ?? ctx.name
  },

  // Async actions
  loadContextPrefs: async () => {
    const prefs = await k8sApi.getContextPrefs()
    set({ contextPrefs: prefs })
  },

  updateContextName: async (id, name) => {
    const updated = await k8sApi.updateContextName(id, name)
    set({ contextPrefs: updated })
  },

  submitRename: async () => {
    const { editingContextId, editingName } = get()
    if (!editingContextId) return
    const name = editingName.trim()
    const updated = await k8sApi.updateContextName(editingContextId, name)
    set({ contextPrefs: updated, editingContextId: null })
  },

  handleRenameKey: (e) => {
    const { submitRename, setEditingContextId } = get()
    if (e.key === 'Enter') {
      submitRename()
    } else if (e.key === 'Escape') {
      setEditingContextId(null)
    }
  },

  beginRename: (id, current) => {
    set({ editingContextId: id, editingName: current })
  },

  handleAddGroup: () => {
    set({ isAddingGroup: true, newGroupName: '' })
  },

  handleConfirmAddGroup: async () => {
    const { newGroupName, contextPrefs } = get()
    const name = newGroupName.trim()
    if (!name) {
      set({ isAddingGroup: false })
      return
    }
    const id = 'g_' + Math.random().toString(36).slice(2)
    const groups = [...(contextPrefs?.groups ?? []), { id, name, items: [] }]
    const ungrouped = contextPrefs?.ungrouped ?? []
    const updated = await k8sApi.updateContextGrouping(groups, ungrouped)
    set({ contextPrefs: updated, isAddingGroup: false, newGroupName: '' })
  },

  handleCancelAddGroup: () => {
    set({ isAddingGroup: false, newGroupName: '' })
  },

  persistGrouping: async (groups, ungrouped) => {
    const updated = await k8sApi.updateContextGrouping(groups, ungrouped)
    set({ contextPrefs: updated })
  },

  // Drag and drop
  allowDragOver: (e) => {
    e.preventDefault()
  },

  startDrag: (contextId, fromGroupId) => (e) => {
    set({ dragging: { id: contextId, fromGroupId } })
    e.dataTransfer.effectAllowed = 'move'
  },

  dropOnItem: (targetId, targetGroupId) => async (e) => {
    e.preventDefault()
    const { dragging, contextPrefs, persistGrouping } = get()
    if (!dragging || !contextPrefs) return
    const { id, fromGroupId } = dragging
    if (id === targetId && fromGroupId === targetGroupId) return

    let groups = contextPrefs.groups
    let ungrouped = [...contextPrefs.ungrouped]

    const removeFrom = (gid: string) => {
      if (gid === '__ungrouped__') {
        ungrouped = ungrouped.filter(x => x !== id)
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: g.items.filter(x => x !== id) } : g)
      }
    }

    const insertInto = (gid: string, beforeId?: string) => {
      if (gid === '__ungrouped__') {
        const items = ungrouped.filter(x => x !== id)
        const idx = items.indexOf(beforeId ?? '')
        if (idx >= 0) items.splice(idx, 0, id)
        else items.push(id)
        ungrouped = items
      } else {
        groups = groups.map(g => {
          if (g.id !== gid) return g
          const items = g.items.filter(x => x !== id)
          const idx = items.indexOf(beforeId ?? '')
          if (idx >= 0) items.splice(idx, 0, id)
          else items.push(id)
          return { ...g, items }
        })
      }
    }

    removeFrom(fromGroupId)
    insertInto(targetGroupId, targetId)
    await persistGrouping(groups, ungrouped)
    set({ dragging: null })
  },

  dropOnGroup: (targetGroupId) => async (e) => {
    e.preventDefault()
    const { dragging, contextPrefs, persistGrouping } = get()
    if (!dragging || !contextPrefs) return
    const { id, fromGroupId } = dragging

    let groups = contextPrefs.groups
    let ungrouped = [...contextPrefs.ungrouped]

    const removeFrom = (gid: string) => {
      if (gid === '__ungrouped__') {
        ungrouped = ungrouped.filter(x => x !== id)
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: g.items.filter(x => x !== id) } : g)
      }
    }

    const appendTo = (gid: string) => {
      if (gid === '__ungrouped__') {
        const items = ungrouped.filter(x => x !== id)
        items.push(id)
        ungrouped = items
      } else {
        groups = groups.map(g => g.id === gid ? { ...g, items: [...g.items.filter(x => x !== id), id] } : g)
      }
    }

    removeFrom(fromGroupId)
    appendTo(targetGroupId)
    await persistGrouping(groups, ungrouped)
    set({ dragging: null })
  },
}))
