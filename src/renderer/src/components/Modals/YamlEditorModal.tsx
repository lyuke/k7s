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
  const [isDiffing, setIsDiffing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diffOutput, setDiffOutput] = useState('')

  const canLoadExistingResource = mode !== 'create' && Boolean(name)
  const isReadOnly = mode === 'view'
  const customResourcePrefix = 'CustomResource:'
  const customResourceCrdName = kind.startsWith(customResourcePrefix)
    ? kind.slice(customResourcePrefix.length)
    : ''
  const displayKind = customResourceCrdName ? 'CustomResource' : kind

  const handleLoadYaml = useCallback(async () => {
    if (!name) return
    setIsLoading(true)
    setError(null)
    try {
      const result = customResourceCrdName
        ? await k8sApi.getCustomResourceInstanceYaml(contextId, customResourceCrdName, namespace, name)
        : await k8sApi.getResourceYaml(contextId, kind, namespace, name)
      setYaml(result)
      setDiffOutput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load YAML')
    } finally {
      setIsLoading(false)
    }
  }, [contextId, customResourceCrdName, kind, namespace, name])

  useEffect(() => {
    if (!isOpen) return

    setError(null)
    setDiffOutput('')
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
    setDiffOutput('')
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

  const handleDiff = async () => {
    if (!yaml.trim()) return

    setIsDiffing(true)
    setError(null)
    setDiffOutput('')
    try {
      const result = await k8sApi.diffYaml(contextId, yaml)
      setDiffOutput(result || 'No changes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to diff YAML')
    } finally {
      setIsDiffing(false)
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
            <button onClick={handleLoadYaml} disabled={isLoading || isDiffing}>
              Load Current
            </button>
          )}
          <span className="resource-info">
            {displayKind} / {namespace || '-'} / {name || 'new'}
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}
        {diffOutput && (
          <pre className="yaml-diff-output">{diffOutput}</pre>
        )}

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
          <button onClick={onClose} disabled={isLoading || isDiffing}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <>
              <button
                onClick={handleDiff}
                disabled={isLoading || isDiffing || !yaml.trim()}
                className="diff-btn"
              >
                {isDiffing ? 'Diffing...' : 'Diff'}
              </button>
              <button
                onClick={handleApply}
                disabled={isLoading || isDiffing || !yaml.trim()}
                className="apply-btn"
              >
                {isLoading ? 'Applying...' : 'Apply'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
