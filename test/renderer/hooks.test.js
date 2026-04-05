import assert from 'node:assert/strict'
import React from 'react'
import { beforeEach, describe, it } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { useClusterStore, usePreferencesStore, useTerminalStore, useUIStore } from '../../src/renderer/src/store/index.ts'
import { useClusterPreferences, useKubernetes, useTerminal, useUIState } from '../../src/renderer/src/hooks/index.ts'

const initialClusterState = Object.fromEntries(
  Object.entries(useClusterStore.getState()).filter(([key, value]) => key !== 'selectedContext' && typeof value !== 'function'),
)

const readHook = (useValue) => {
  let captured

  const Probe = () => {
    captured = useValue()
    return React.createElement('div', null, 'probe')
  }

  renderToStaticMarkup(React.createElement(Probe))
  return captured
}

beforeEach(() => {
  useClusterStore.setState(initialClusterState)
  usePreferencesStore.setState(usePreferencesStore.getInitialState(), true)
  useUIStore.setState(useUIStore.getInitialState(), true)
  useTerminalStore.setState(useTerminalStore.getInitialState(), true)
})

describe('renderer hooks', () => {
  it('re-exports the expected hooks and stores from barrel files', () => {
    assert.equal(typeof useKubernetes, 'function')
    assert.equal(typeof useClusterPreferences, 'function')
    assert.equal(typeof useUIState, 'function')
    assert.equal(typeof useTerminal, 'function')
    assert.equal(typeof useClusterStore.getState, 'function')
    assert.equal(typeof usePreferencesStore.getState, 'function')
    assert.equal(typeof useUIStore.getState, 'function')
    assert.equal(typeof useTerminalStore.getState, 'function')
  })

  it('maps cluster store state and actions through useKubernetes', () => {
    const hook = readHook(() => useKubernetes())
    hook.setSelectedId('ctx-2')
    hook.toggleNamespace('default')
    hook.setSelectedNamespaces(['kube-system'])

    assert.deepEqual(hook.contexts, [])
    assert.equal(hook.selectedId, '')
    assert.equal(hook.selectedContext, undefined)
    assert.deepEqual(hook.nodes, [])
    assert.deepEqual(useClusterStore.getState().selectedNamespaces, ['kube-system'])
    assert.equal(useClusterStore.getState().selectedId, 'ctx-2')
  })

  it('maps preferences state and actions through useClusterPreferences', () => {
    const hook = readHook(() => useClusterPreferences(
      null,
      () => {},
      'ctx-1',
      () => {},
      'renamed',
      () => {},
      true,
      () => {},
      'Ops',
      () => {},
      { id: 'ctx-1', fromGroupId: 'g1' },
      () => {},
    ))

    hook.setEditingName('next-name')
    hook.setNewGroupName('Platform')
    hook.setDragging(null)

    assert.equal(hook.contextPrefs, null)
    assert.equal(hook.editingContextId, 'ctx-1')
    assert.equal(hook.editingName, 'renamed')
    assert.equal(hook.isAddingGroup, true)
    assert.equal(hook.newGroupName, 'Ops')
    assert.equal(hook.getDisplayName({ id: 'ctx-1', name: 'dev' }), 'dev')
    assert.equal(usePreferencesStore.getState().editingName, 'next-name')
    assert.equal(usePreferencesStore.getState().newGroupName, 'Platform')
    assert.equal(usePreferencesStore.getState().dragging, null)
  })

  it('maps UI store state and actions through useUIState', () => {
    const namespaces = [
      { name: 'default', status: 'Active' },
      { name: 'kube-system', status: 'Active' },
    ]
    const hook = readHook(() => useUIState(namespaces, 'default', () => {}))
    hook.setSearchText('sys')
    hook.setSelectedResourceType('services')

    assert.equal(hook.searchText, '')
    assert.equal(hook.sortField, '')
    assert.equal(hook.selectedNode, null)
    assert.deepEqual(hook.filteredNamespaces, namespaces)
    assert.equal(useUIStore.getState().searchText, 'sys')
    assert.equal(useUIStore.getState().selectedResourceType, 'services')
  })

  it('maps terminal store state and actions through useTerminal', () => {
    const hook = readHook(() => useTerminal('ctx-1'))
    hook.toggleTerminal()
    useTerminalStore.getState().setTerminalContainerRef({ current: { id: 'terminal-root' } })

    assert.equal(hook.showTerminal, false)
    assert.deepEqual(hook.terminalContainerRef, { current: null })
    assert.equal(useTerminalStore.getState().showTerminal, true)
    assert.deepEqual(useTerminalStore.getState().terminalContainerRef, { current: { id: 'terminal-root' } })
  })
})
