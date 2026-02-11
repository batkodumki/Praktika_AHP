import React from 'react'
import './GradationControls.css'

const MIN_GRADATIONS = 2
const MAX_GRADATIONS = 8

export default function GradationControls({ gradations, onChange }) {
  const handleIncrement = () => {
    if (gradations < MAX_GRADATIONS) {
      onChange(gradations + 1)
    }
  }

  const handleDecrement = () => {
    if (gradations > MIN_GRADATIONS) {
      onChange(gradations - 1)
    }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleIncrement()
    } else {
      handleDecrement()
    }
  }

  return (
    <div className="gradation-controls">
      <label className="gradation-label">Кількість градацій:</label>
      <div className="gradation-spinner" onWheel={handleWheel}>
        <button
          className="gradation-btn"
          onClick={handleDecrement}
          disabled={gradations <= MIN_GRADATIONS}
          aria-label="Зменшити градації"
        >
          −
        </button>
        <div className="gradation-value">{gradations}</div>
        <button
          className="gradation-btn"
          onClick={handleIncrement}
          disabled={gradations >= MAX_GRADATIONS}
          aria-label="Збільшити градації"
        >
          +
        </button>
      </div>
      <div className="gradation-hint">
        Використовуйте коліщатко миші або кнопки +/- (Діапазон: {MIN_GRADATIONS}-{MAX_GRADATIONS})
      </div>
    </div>
  )
}
