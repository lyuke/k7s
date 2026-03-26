import React, { useState } from 'react'

interface KeyValue {
  key: string
  value: string
}

interface KeyValueEditorProps {
  pairs: KeyValue[]
  onChange: (pairs: KeyValue[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  addButtonText?: string
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addButtonText = 'Add'
}) => {
  const handleKeyChange = (index: number, key: string) => {
    const newPairs = [...pairs]
    newPairs[index] = { ...newPairs[index], key }
    onChange(newPairs)
  }

  const handleValueChange = (index: number, value: string) => {
    const newPairs = [...pairs]
    newPairs[index] = { ...newPairs[index], value }
    onChange(newPairs)
  }

  const handleAdd = () => {
    onChange([...pairs, { key: '', value: '' }])
  }

  const handleRemove = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index)
    onChange(newPairs)
  }

  return (
    <div className="key-value-editor">
      {pairs.map((pair, index) => (
        <div key={index} className="key-value-row">
          <input
            type="text"
            value={pair.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
            placeholder={keyPlaceholder}
            className="key-input"
          />
          <input
            type="text"
            value={pair.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder={valuePlaceholder}
            className="value-input"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="remove-btn"
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} className="add-btn">
        {addButtonText}
      </button>
    </div>
  )
}