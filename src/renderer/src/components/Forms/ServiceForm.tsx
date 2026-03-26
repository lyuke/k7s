import React, { useState } from 'react'
import { ServiceFormData } from '../../../../shared/types'
import { KeyValueEditor } from './common/KeyValueEditor'

interface ServiceFormProps {
  namespace: string
  onSubmit: (data: ServiceFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<ServiceFormData>
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  namespace,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [type, setType] = useState<'ClusterIP' | 'NodePort' | 'LoadBalancer'>(
    initialData?.type ?? 'ClusterIP'
  )
  const [selector, setSelector] = useState<Array<{ key: string; value: string }>>(
    initialData?.selector ?? [{ key: 'app', value: '' }]
  )
  const [port, setPort] = useState(initialData?.port ?? 80)
  const [targetPort, setTargetPort] = useState(initialData?.targetPort ?? 8080)
  const [protocol, setProtocol] = useState(initialData?.protocol ?? 'TCP')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      namespace,
      type,
      selector,
      port,
      targetPort,
      protocol
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
          placeholder="service-name"
        />
      </div>

      <div className="form-group">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="ClusterIP">ClusterIP</option>
          <option value="NodePort">NodePort</option>
          <option value="LoadBalancer">LoadBalancer</option>
        </select>
      </div>

      <div className="form-group">
        <label>Selector (Pod labels to route traffic)</label>
        <KeyValueEditor
          pairs={selector}
          onChange={setSelector}
          keyPlaceholder="Label key"
          valuePlaceholder="Label value"
          addButtonText="Add Selector"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Port</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 80)}
            min={1}
            max={65535}
            required
          />
        </div>

        <div className="form-group">
          <label>Target Port</label>
          <input
            type="number"
            value={targetPort}
            onChange={(e) => setTargetPort(parseInt(e.target.value) || 8080)}
            min={1}
            max={65535}
            required
          />
        </div>

        <div className="form-group">
          <label>Protocol</label>
          <select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Creating...' : 'Create Service'}
        </button>
      </div>
    </form>
  )
}