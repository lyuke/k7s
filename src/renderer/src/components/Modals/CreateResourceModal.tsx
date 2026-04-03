import React, { useEffect, useMemo, useState } from 'react'
import { k8sApi } from '../../api/provider'
import {
  DeploymentForm,
  ServiceForm,
  ConfigMapForm,
  SecretForm,
  NamespaceForm,
  IngressForm
} from '../Forms'
import {
  DeploymentFormData,
  ServiceFormData,
  ConfigMapFormData,
  SecretFormData,
  NamespaceFormData,
  IngressFormData
} from '../../../shared/types'

type ResourceKind = 'Deployment' | 'Service' | 'ConfigMap' | 'Secret' | 'Namespace' | 'Ingress'

interface CreateResourceModalProps {
  isOpen: boolean
  onClose: () => void
  contextId: string
  selectedNamespaces: string[]
  availableNamespaces: string[]
  onSuccess: () => void
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  contextId,
  selectedNamespaces,
  availableNamespaces,
  onSuccess
}) => {
  const [resourceKind, setResourceKind] = useState<ResourceKind | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const namespaceOptions = useMemo(() => {
    if (availableNamespaces.length > 0) return availableNamespaces
    return ['default']
  }, [availableNamespaces])
  const [targetNamespace, setTargetNamespace] = useState(() => {
    if (selectedNamespaces.length === 1) return selectedNamespaces[0]
    if (namespaceOptions.includes('default')) return 'default'
    return namespaceOptions[0] ?? ''
  })

  useEffect(() => {
    if (!isOpen) return
    setResourceKind('')
    setError(null)
    if (selectedNamespaces.length === 1) {
      setTargetNamespace(selectedNamespaces[0])
      return
    }
    if (namespaceOptions.includes('default')) {
      setTargetNamespace('default')
      return
    }
    setTargetNamespace(namespaceOptions[0] ?? '')
  }, [isOpen, namespaceOptions, selectedNamespaces])

  const isNamespacedResource = resourceKind !== '' && resourceKind !== 'Namespace'

  if (!isOpen) return null

  const handleNamespaceSubmit = async (data: NamespaceFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createNamespace(contextId, data.name)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create namespace')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create namespace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeploymentSubmit = async (data: DeploymentFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createDeployment(contextId, data)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create deployment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deployment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceSubmit = async (data: ServiceFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createService(contextId, data)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create service')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigMapSubmit = async (data: ConfigMapFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createConfigMap(contextId, data)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create configmap')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configmap')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecretSubmit = async (data: SecretFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createSecret(contextId, data)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create secret')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create secret')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIngressSubmit = async (data: IngressFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await k8sApi.createIngress(contextId, data)
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.message || 'Failed to create ingress')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ingress')
    } finally {
      setIsLoading(false)
    }
  }

  const renderForm = () => {
    switch (resourceKind) {
      case 'Namespace':
        return (
          <NamespaceForm
            onSubmit={handleNamespaceSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      case 'Deployment':
        return (
          <DeploymentForm
            namespace={targetNamespace}
            onSubmit={handleDeploymentSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      case 'Service':
        return (
          <ServiceForm
            namespace={targetNamespace}
            onSubmit={handleServiceSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      case 'ConfigMap':
        return (
          <ConfigMapForm
            namespace={targetNamespace}
            onSubmit={handleConfigMapSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      case 'Secret':
        return (
          <SecretForm
            namespace={targetNamespace}
            onSubmit={handleSecretSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      case 'Ingress':
        return (
          <IngressForm
            namespace={targetNamespace}
            onSubmit={handleIngressSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Resource</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {!resourceKind ? (
          <div className="resource-type-selector">
            <h3>Select Resource Type</h3>
            <div className="resource-type-grid">
              <button onClick={() => setResourceKind('Namespace')}>Namespace</button>
              <button onClick={() => setResourceKind('Deployment')}>Deployment</button>
              <button onClick={() => setResourceKind('Service')}>Service</button>
              <button onClick={() => setResourceKind('ConfigMap')}>ConfigMap</button>
              <button onClick={() => setResourceKind('Secret')}>Secret</button>
              <button onClick={() => setResourceKind('Ingress')}>Ingress</button>
            </div>
          </div>
        ) : (
          <>
            <div className="resource-kind-header">
              <button className="back-btn" onClick={() => setResourceKind('')}>
                &larr; Back
              </button>
              <span>Creating: {resourceKind}</span>
            </div>
            {error && <div className="error-message">{error}</div>}
            {isNamespacedResource && (
              <div className="form-group">
                <label>Namespace</label>
                <select
                  value={targetNamespace}
                  onChange={(e) => setTargetNamespace(e.target.value)}
                  disabled={isLoading}
                >
                  {namespaceOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {renderForm()}
          </>
        )}
      </div>
    </div>
  )
}
