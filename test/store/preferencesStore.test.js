import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { k8sApi } from '../../src/renderer/src/api/provider.ts'
import { usePreferencesStore } from '../../src/renderer/src/store/preferencesStore.ts'

const originalApi = { ...k8sApi }
const originalRandom = Math.random

const initialPrefs = {
  customNames: { 'ctx-1': 'custom-dev' },
  groups: [{ id: 'group-1', name: 'Team A', items: ['ctx-1'] }],
  ungrouped: ['ctx-2', 'ctx-3'],
}

beforeEach(() => {
  usePreferencesStore.setState(usePreferencesStore.getInitialState(), true)
})

afterEach(() => {
  Object.assign(k8sApi, originalApi)
  Math.random = originalRandom
})

describe('usePreferencesStore', () => {
  it('reads and updates display names from context preferences', async () => {
    const context = { id: 'ctx-1', name: 'dev' }

    assert.equal(usePreferencesStore.getState().getDisplayName(context), 'dev')

    usePreferencesStore.getState().setContextPrefs(initialPrefs)
    assert.equal(usePreferencesStore.getState().getDisplayName(context), 'custom-dev')
  })

  it('updates simple editor and drag state through setters', async () => {
    usePreferencesStore.getState().setEditingContextId('ctx-1')
    usePreferencesStore.getState().setEditingName('renamed')
    usePreferencesStore.getState().setIsAddingGroup(true)
    usePreferencesStore.getState().setNewGroupName('Ops')
    usePreferencesStore.getState().setDragging({ id: 'ctx-2', fromGroupId: '__ungrouped__' })

    const state = usePreferencesStore.getState()
    assert.equal(state.editingContextId, 'ctx-1')
    assert.equal(state.editingName, 'renamed')
    assert.equal(state.isAddingGroup, true)
    assert.equal(state.newGroupName, 'Ops')
    assert.deepEqual(state.dragging, { id: 'ctx-2', fromGroupId: '__ungrouped__' })
  })

  it('loads and updates context preferences from the API', async () => {
    Object.assign(k8sApi, {
      getContextPrefs: async () => initialPrefs,
      updateContextName: async (_id, name) => ({
        ...initialPrefs,
        customNames: { ...initialPrefs.customNames, 'ctx-1': name },
      }),
    })

    await usePreferencesStore.getState().loadContextPrefs()
    assert.deepEqual(usePreferencesStore.getState().contextPrefs, initialPrefs)

    await usePreferencesStore.getState().updateContextName('ctx-1', 'renamed')
    assert.equal(usePreferencesStore.getState().contextPrefs.customNames['ctx-1'], 'renamed')
  })

  it('submits renames, trims whitespace, and ignores empty edit sessions', async () => {
    let updateArgs = null

    Object.assign(k8sApi, {
      updateContextName: async (id, name) => {
        updateArgs = [id, name]
        return {
          ...initialPrefs,
          customNames: { ...initialPrefs.customNames, [id]: name },
        }
      },
    })

    await assert.doesNotReject(usePreferencesStore.getState().submitRename())
    assert.equal(updateArgs, null)

    usePreferencesStore.setState({ editingContextId: 'ctx-1', editingName: '  stable-name  ' })
    await usePreferencesStore.getState().submitRename()

    assert.deepEqual(updateArgs, ['ctx-1', 'stable-name'])
    assert.equal(usePreferencesStore.getState().editingContextId, null)
    assert.equal(usePreferencesStore.getState().contextPrefs.customNames['ctx-1'], 'stable-name')
  })

  it('handles rename keyboard shortcuts', async () => {
    let submitCalls = 0

    usePreferencesStore.setState({
      editingContextId: 'ctx-1',
      submitRename: async () => {
        submitCalls += 1
      },
    })

    usePreferencesStore.getState().handleRenameKey({ key: 'Enter' })
    assert.equal(submitCalls, 1)

    usePreferencesStore.getState().handleRenameKey({ key: 'Escape' })
    assert.equal(usePreferencesStore.getState().editingContextId, null)
  })

  it('starts and cancels rename and group creation flows', async () => {
    usePreferencesStore.getState().beginRename('ctx-9', 'old')
    assert.equal(usePreferencesStore.getState().editingContextId, 'ctx-9')
    assert.equal(usePreferencesStore.getState().editingName, 'old')

    usePreferencesStore.getState().handleAddGroup()
    assert.equal(usePreferencesStore.getState().isAddingGroup, true)
    assert.equal(usePreferencesStore.getState().newGroupName, '')

    usePreferencesStore.getState().setNewGroupName('Ignored')
    usePreferencesStore.getState().handleCancelAddGroup()
    assert.equal(usePreferencesStore.getState().isAddingGroup, false)
    assert.equal(usePreferencesStore.getState().newGroupName, '')
  })

  it('creates a new group when the name is valid and skips API work for blank names', async () => {
    let groupingCalls = []

    Object.assign(k8sApi, {
      updateContextGrouping: async (groups, ungrouped) => {
        groupingCalls.push({ groups, ungrouped })
        return {
          ...initialPrefs,
          groups,
          ungrouped,
        }
      },
    })

    usePreferencesStore.setState({
      contextPrefs: initialPrefs,
      isAddingGroup: true,
      newGroupName: '   ',
    })
    await usePreferencesStore.getState().handleConfirmAddGroup()
    assert.equal(groupingCalls.length, 0)
    assert.equal(usePreferencesStore.getState().isAddingGroup, false)

    Math.random = () => 0.123456789
    usePreferencesStore.setState({
      contextPrefs: initialPrefs,
      isAddingGroup: true,
      newGroupName: '  Ops  ',
    })
    await usePreferencesStore.getState().handleConfirmAddGroup()

    assert.equal(groupingCalls.length, 1)
    assert.equal(groupingCalls[0].groups.at(-1).name, 'Ops')
    assert.deepEqual(groupingCalls[0].ungrouped, ['ctx-2', 'ctx-3'])
    assert.equal(usePreferencesStore.getState().isAddingGroup, false)
    assert.equal(usePreferencesStore.getState().newGroupName, '')
  })

  it('persists explicit grouping changes through the API', async () => {
    const updatedPrefs = {
      ...initialPrefs,
      groups: [{ id: 'group-2', name: 'Moved', items: ['ctx-2'] }],
      ungrouped: ['ctx-1'],
    }

    Object.assign(k8sApi, {
      updateContextGrouping: async () => updatedPrefs,
    })

    await usePreferencesStore.getState().persistGrouping(updatedPrefs.groups, updatedPrefs.ungrouped)

    assert.deepEqual(usePreferencesStore.getState().contextPrefs, updatedPrefs)
  })

  it('allows drag over and starts dragging with move semantics', async () => {
    const event = {
      preventDefaultCalled: false,
      preventDefault() {
        this.preventDefaultCalled = true
      },
      dataTransfer: {
        effectAllowed: '',
      },
    }

    usePreferencesStore.getState().allowDragOver(event)
    assert.equal(event.preventDefaultCalled, true)

    usePreferencesStore.getState().startDrag('ctx-2', '__ungrouped__')(event)
    assert.deepEqual(usePreferencesStore.getState().dragging, { id: 'ctx-2', fromGroupId: '__ungrouped__' })
    assert.equal(event.dataTransfer.effectAllowed, 'move')
  })

  it('drops items before another item and clears dragging state afterwards', async () => {
    let persisted = null
    usePreferencesStore.setState({
      contextPrefs: initialPrefs,
      dragging: { id: 'ctx-2', fromGroupId: '__ungrouped__' },
      persistGrouping: async (groups, ungrouped) => {
        persisted = { groups, ungrouped }
      },
    })

    const event = {
      preventDefault() {},
    }

    await usePreferencesStore.getState().dropOnItem('ctx-1', 'group-1')(event)

    assert.deepEqual(persisted, {
      groups: [{ id: 'group-1', name: 'Team A', items: ['ctx-2', 'ctx-1'] }],
      ungrouped: ['ctx-3'],
    })
    assert.equal(usePreferencesStore.getState().dragging, null)
  })

  it('ignores no-op item drops and appends to target groups when dropping on a group', async () => {
    let itemPersistCalls = 0
    let groupPersist = null

    usePreferencesStore.setState({
      contextPrefs: initialPrefs,
      dragging: { id: 'ctx-1', fromGroupId: 'group-1' },
      persistGrouping: async () => {
        itemPersistCalls += 1
      },
    })

    await usePreferencesStore.getState().dropOnItem('ctx-1', 'group-1')({ preventDefault() {} })
    assert.equal(itemPersistCalls, 0)

    usePreferencesStore.setState({
      contextPrefs: initialPrefs,
      dragging: { id: 'ctx-3', fromGroupId: '__ungrouped__' },
      persistGrouping: async (groups, ungrouped) => {
        groupPersist = { groups, ungrouped }
      },
    })

    await usePreferencesStore.getState().dropOnGroup('group-1')({ preventDefault() {} })

    assert.deepEqual(groupPersist, {
      groups: [{ id: 'group-1', name: 'Team A', items: ['ctx-1', 'ctx-3'] }],
      ungrouped: ['ctx-2'],
    })
    assert.equal(usePreferencesStore.getState().dragging, null)
  })
})
