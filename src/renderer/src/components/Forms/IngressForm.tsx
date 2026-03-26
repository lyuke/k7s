import React, { useState } from 'react'
import { IngressFormData } from '../../../../shared/types'

interface IngressFormProps {
  namespace: string
  onSubmit: (data: IngressFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<IngressFormData>
}

export const IngressForm: React.FC<IngressFormProps> = ({
  namespace,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [ingressClass, setIngressClass] = useState(initialData?.ingressClass ?? '')
  const [host, setHost] = useState(initialData?.host ?? '')
  const [serviceName, setServiceName] = useState(initialData?.serviceName ?? '')
  const [servicePort, setServicePort] = useState(initialData?.servicePort ?? 80)
  const [tls, setTls] = useState(initialData?.tls ?? false)
  const [tlsSecret, setTlsSecret] = useState(initialData?.tlsSecret ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      namespace,
      ingressClass: ingressClass || undefined,
      host,
      serviceName,
      servicePort,
      tls,
      tlsSecret: tls ? tlsSecret : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="resource-form">
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="ingress-name"
        />
      </div>

      <div className="form-group">
        <label>Ingress Class (optional)</label>
        <input
          type="text"
          value={ingressClass}
          onChange={(e) => setIngressClass(e.target.value)}
          placeholder="nginx"
        />
      </div>

      <div className="form-group">
        <label>Host</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          required
          placeholder="example.com"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Service Name</label>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            placeholder="backend-service"
          />
        </div>

        <div className="form-group">
          <label>Service Port</label>
          <input
            type="number"
            value={servicePort}
            onChange={(e) => setServicePort(parseInt(e.target.value) || 80)}
            min={1}
            max={65535}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={tls}
            onChange={(e) => setTls(e.target.checked)}
          />
          Enable TLS
        </label>
      </div>

      {tls && (
        <div className="form-group">
          <label>TLS Secret Name</label>
          <input
            type="text"
            value={tlsSecret}
            onChange={(e) => setTlsSecret(e.target.value)}
            placeholder="tls-secret"
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !name || !host || !serviceName}>
          {isLoading ? 'Creating...' : 'Create Ingress'}
        </button>
      </div>
    </form>
  )
}