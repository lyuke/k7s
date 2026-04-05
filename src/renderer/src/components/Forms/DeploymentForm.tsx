import React, { useState } from 'react'
import type { DeploymentFormData } from '../../../../shared/types'
import { KeyValueEditor } from './common/KeyValueEditor'

interface DeploymentFormProps {
  namespace: string
  onSubmit: (data: DeploymentFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<DeploymentFormData>
}

export const DeploymentForm: React.FC<DeploymentFormProps> = ({
  namespace,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [replicas, setReplicas] = useState(initialData?.replicas ?? 1)
  const [image, setImage] = useState(initialData?.image ?? '')
  const [port, setPort] = useState(initialData?.port ?? 80)
  const [targetPort, setTargetPort] = useState(initialData?.targetPort ?? 8080)
  const [protocol, setProtocol] = useState(initialData?.protocol ?? 'TCP')
  const [labels, setLabels] = useState<Array<{ key: string; value: string }>>(
    initialData?.labels ?? [{ key: 'app', value: '' }]
  )
  const [env, setEnv] = useState<Array<{ key: string; value: string }>>(
    initialData?.env ?? []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      namespace,
      replicas,
      image,
      port,
      targetPort,
      protocol,
      labels,
      env
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
          placeholder="deployment-name"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Replicas</label>
          <input
            type="number"
            value={replicas}
            onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
            min={0}
            required
          />
        </div>

        <div className="form-group">
          <label>Image</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            required
            placeholder="nginx:latest"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Service Port</label>
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

      <div className="form-group">
        <label>Labels</label>
        <KeyValueEditor
          pairs={labels}
          onChange={setLabels}
          keyPlaceholder="Label key"
          valuePlaceholder="Label value"
          addButtonText="Add Label"
        />
      </div>

      <div className="form-group">
        <label>Environment Variables</label>
        <KeyValueEditor
          pairs={env}
          onChange={setEnv}
          keyPlaceholder="ENV key"
          valuePlaceholder="ENV value"
          addButtonText="Add ENV"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !name || !image}>
          {isLoading ? 'Creating...' : 'Create Deployment'}
        </button>
      </div>
    </form>
  )
}
