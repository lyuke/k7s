import React, { useState } from 'react'
import { ConfigMapFormData } from '../../../../shared/types'
import { KeyValueEditor } from './common/KeyValueEditor'

interface ConfigMapFormProps {
  namespace: string
  onSubmit: (data: ConfigMapFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<ConfigMapFormData>
}

export const ConfigMapForm: React.FC<ConfigMapFormProps> = ({
  namespace,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [data, setData] = useState<Array<{ key: string; value: string }>>(
    initialData?.data ?? [{ key: '', value: '' }]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      namespace,
      data
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
          placeholder="configmap-name"
        />
      </div>

      <div className="form-group">
        <label>Data (Key-Value pairs)</label>
        <KeyValueEditor
          pairs={data}
          onChange={setData}
          keyPlaceholder="Data key"
          valuePlaceholder="Data value"
          addButtonText="Add Data"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Creating...' : 'Create ConfigMap'}
        </button>
      </div>
    </form>
  )
}