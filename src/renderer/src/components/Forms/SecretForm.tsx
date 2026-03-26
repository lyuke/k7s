import React, { useState } from 'react'
import { SecretFormData } from '../../../../shared/types'
import { KeyValueEditor } from './common/KeyValueEditor'

interface SecretFormProps {
  namespace: string
  onSubmit: (data: SecretFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<SecretFormData>
}

export const SecretForm: React.FC<SecretFormProps> = ({
  namespace,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')
  const [type, setType] = useState<SecretFormData['type']>(
    initialData?.type ?? 'Opaque'
  )
  const [data, setData] = useState<Array<{ key: string; value: string }>>(
    initialData?.data ?? [{ key: '', value: '' }]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      namespace,
      type,
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
          placeholder="secret-name"
        />
      </div>

      <div className="form-group">
        <label>Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SecretFormData['type'])}
        >
          <option value="Opaque">Opaque (Generic)</option>
          <option value="kubernetes.io/service-account-token">Service Account Token</option>
          <option value="kubernetes.io/dockercfg">Docker Config</option>
          <option value="kubernetes.io/dockerconfigjson">Docker Config JSON</option>
        </select>
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
          {isLoading ? 'Creating...' : 'Create Secret'}
        </button>
      </div>
    </form>
  )
}