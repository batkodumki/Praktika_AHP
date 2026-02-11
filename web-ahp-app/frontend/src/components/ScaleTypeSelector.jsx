import React from 'react'
import './ScaleTypeSelector.css'

const SCALE_TYPES = [
  { id: 1, name: 'Цілочисельна', description: 'Стандартні цілі значення (1-9)' },
  { id: 2, name: 'Збалансована', description: 'Збалансована шкала' },
  { id: 3, name: 'Степенева', description: 'Степенева шкала' },
  { id: 4, name: 'Ma-Zheng', description: 'Шкала Ma-Zheng' },
  { id: 5, name: 'Donegan', description: 'Шкала Donegan' },
]

export default function ScaleTypeSelector({ scaleType, onChange }) {
  return (
    <div className="scale-type-selector">
      <label className="scale-type-label">Тип шкали:</label>
      <div className="scale-type-options">
        {SCALE_TYPES.map(type => (
          <label key={type.id} className="scale-type-option">
            <input
              type="radio"
              name="scaleType"
              value={type.id}
              checked={scaleType === type.id}
              onChange={(e) => onChange(parseInt(e.target.value))}
            />
            <span className="scale-type-name">{type.name}</span>
            <span className="scale-type-description">{type.description}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
