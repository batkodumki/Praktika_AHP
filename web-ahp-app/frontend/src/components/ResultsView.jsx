import React from 'react'
import './AggregatedResults.css'

export default function ResultsView({ project, result }) {
  if (!result) return null

  // Calculate rankings from weights
  const rankings = result.weights
    .map((weight, index) => ({ index, weight }))
    .sort((a, b) => b.weight - a.weight)
    .map((item, rank) => ({ ...item, rank: rank + 1 }))
    .sort((a, b) => a.index - b.index)

  return (
    <div className="aggregated-results">
      <div className="card">
        <div className="results-header">
          <div>
            <h2>Результати</h2>
            <p className="results-subtitle">
              Результати парного порівняння альтернатив
            </p>
          </div>
        </div>

        {/* Matrix View Section */}
        <div className="matrix-tabs-section">
          <h2 className="section-title">Матриця парних порівнянь</h2>
          <p className="section-description">
            Заповнена матриця попарних порівнянь альтернатив
          </p>

          <div className="matrix-display">
            <div className="matrix-view">
              <h3 className="matrix-view-title">Матриця порівнянь</h3>

              {result.matrix && (
                <div className="matrix-table-wrapper">
                  <table className="comparison-matrix geometric-matrix">
                    <thead>
                      <tr>
                        <th></th>
                        {project.alternatives.map((alt, idx) => (
                          <th key={idx}>{alt}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.matrix.map((row, i) => (
                        <tr key={i}>
                          <th>{project.alternatives[i]}</th>
                          {row.map((value, j) => (
                            <td key={j} className={i === j ? 'diagonal' : ''}>
                              {value.toFixed(3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Weights Visualization */}
              <div className="weights-container">
                <h4>Ваги альтернатив</h4>
                <div className="weights-grid">
                  {result.weights.map((weight, idx) => (
                    <div key={idx} className="weight-item">
                      <span className="weight-alt">{project.alternatives[idx]}</span>
                      <span className="weight-value">{weight.toFixed(4)}</span>
                      <div className="weight-bar">
                        <div
                          className="weight-bar-fill weight-bar-fill-geometric"
                          style={{ width: `${weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consistency Metrics */}
              <div className="consistency-inline">
                <span className="consistency-label">Узгодженість:</span>
                <span className={`consistency-value ${result.consistency_ratio <= 0.1 ? 'consistent' : 'inconsistent'}`}>
                  CR = {result.consistency_ratio.toFixed(4)}
                </span>
                {result.consistency_ratio <= 0.1 ? (
                  <span className="consistency-badge good">✓ Прийнятно</span>
                ) : (
                  <span className="consistency-badge warning">⚠ Потрібна перевірка</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Final Results Section */}
        <div className="final-results-section">
          <h2 className="section-title">Підсумкові результати</h2>
          <p className="section-description">
            Фінальні ваги альтернатив, розраховані методом власних векторів.
          </p>

          {/* Results Table */}
          <div className="results-table-container">
            <h4>Підсумкові ваги і рейтинг</h4>
            <table className="results-table">
              <thead>
                <tr>
                  <th>Альтернатива</th>
                  <th>Вага</th>
                  <th>Ранг</th>
                </tr>
              </thead>
              <tbody>
                {project.alternatives.map((alt, index) => (
                  <tr key={index} className={rankings[index].rank === 1 ? 'best-alternative' : ''}>
                    <td>{alt}</td>
                    <td>{result.weights[index].toFixed(4)}</td>
                    <td className="rank-cell">
                      {rankings[index].rank}
                      {rankings[index].rank === 1 && <span className="rank-badge">🏆</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Consistency Section */}
          <div className="consistency-section">
            <h4>Узгодженість матриці</h4>
            <div className="consistency-metrics">
              <div className="metric">
                <span className="metric-label">λ_max:</span>
                <span className="metric-value">{result.lambda_max?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Індекс узгодженості (CI):</span>
                <span className="metric-value">{result.consistency_index?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Коефіцієнт узгодженості (CR):</span>
                <span className={`metric-value ${result.consistency_ratio <= 0.1 ? 'consistent' : 'inconsistent'}`}>
                  {result.consistency_ratio.toFixed(4)}
                </span>
              </div>
            </div>
            <div className={`consistency-status ${result.consistency_ratio <= 0.1 ? 'status-good' : 'status-warning'}`}>
              {result.consistency_ratio <= 0.1
                ? '✓ Узгодженість прийнятна (CR ≤ 0.1)'
                : '⚠ Потрібна додаткова перевірка (CR > 0.1)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
