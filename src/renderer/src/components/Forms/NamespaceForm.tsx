import React, { useState } from 'react'
import type { NamespaceFormData } from '../../../../shared/types'

interface NamespaceFormProps {
  onSubmit: (data: NamespaceFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<NamespaceFormData>
}

export const NamespaceForm: React.FC<NamespaceFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name })
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
          placeholder="namespace-name"
          pattern="[a-z0-9]([-a-z0-9]*[a-z0-9])?"
          title="Lowercase alphanumeric characters or '-', and must start and end with an alphanumeric character"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Creating...' : 'Create Namespace'}
        </button>
      </div>
    </form>
  )
}
