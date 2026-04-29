import React, { useCallback, useEffect, useState } from 'react'
import { k8sApi } from '../../api/provider'

interface YamlEditorModalProps {
  isOpen: boolean
  onClose: () => void
  contextId: string
  kind: string
  namespace: string
  name: string
  initialYaml?: string
  onSuccess: () => void
  mode: 'view' | 'edit' | 'create'
}

export const YamlEditorModal: React.FC<YamlEditorModalProps> = ({
  isOpen,
  onClose,
  contextId,
  kind,
  namespace,
  name,
  initialYaml = '',
  onSuccess,
  mode
}) => {
  const [yaml, setYaml] = useState(initialYaml)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canLoadExistingResource = mode !== 'create' && Boolean(name)
  const isReadOnly = mode === 'view'

  const handleLoadYaml = useCallback(async () => {
    if (!name) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.getResourceYaml(contextId, kind, namespace, name)
      setYaml(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load YAML')
    } finally {
      setIsLoading(false)
    }
  }, [contextId, kind, namespace, name])

  useEffect(() => {
    if (!isOpen) return

    setError(null)
    if (mode === 'create') {
      setYaml(initialYaml)
      return
    }

    setYaml('')
    if (canLoadExistingResource) {
      void handleLoadYaml()
    }
  }, [isOpen, mode, initialYaml, canLoadExistingResource, handleLoadYaml])

  if (!isOpen) return null

  const handleApply = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.applyYaml(contextId, yaml)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to apply YAML')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply YAML')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content yaml-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'view' && 'View YAML'}
            {mode === 'edit' && 'Edit YAML'}
            {mode === 'create' && 'Create from YAML'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="yaml-editor-toolbar">
          {canLoadExistingResource && (
            <button onClick={handleLoadYaml} disabled={isLoading}>
              Load Current
            </button>
          )}
          <span className="resource-info">
            {kind} / {namespace} / {name || 'new'}
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <textarea
          className="yaml-editor"
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          readOnly={isReadOnly}
          placeholder="apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace"
          spellCheck={false}
        />

        <div className="yaml-editor-footer">
          <button onClick={onClose} disabled={isLoading}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button
              onClick={handleApply}
              disabled={isLoading || !yaml.trim()}
              className="apply-btn"
            >
              {isLoading ? 'Applying...' : 'Apply'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
