import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { projectAPI } from '../utils/api'
import Header from './Header'
import './AggregatedResults.css'

export default function AggregatedResults() {
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [aggregatedData, setAggregatedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aggregating, setAggregating] = useState(false)
  const [selectedView, setSelectedView] = useState('geometric') // 'geometric' or 'expert-0', 'expert-1', etc.

  const loadProject = useCallback(async () => {
    try {
      const response = await projectAPI.get(id)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project:', err)
    }
  }, [id])

  const loadAggregatedResults = useCallback(async () => {
    try {
      const response = await projectAPI.getAggregatedResults(id)
      setAggregatedData(response.data)
      setLoading(false)
    } catch (err) {
      if (err.response?.status === 404) {
        // No aggregated results yet
        setError('Зведені результати ще не розраховано')
      } else {
        setError('Помилка завантаження результатів')
      }
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProject()
    loadAggregatedResults()
  }, [id])

  const handleAggregate = useCallback(async () => {
    setAggregating(true)
    setError(null)

    try {
      await projectAPI.aggregate(id, 'AIJ')
      await loadAggregatedResults()
      setAggregating(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка при розрахунку зведених результатів')
      setAggregating(false)
    }
  }, [id, loadAggregatedResults])

  // Calculate rankings from weights (memoized for performance)
  // MUST be called unconditionally before any early returns
  const rankings = useMemo(() => {
    if (!aggregatedData?.weights) return []
    return aggregatedData.weights
      .map((weight, index) => ({ index, weight }))
      .sort((a, b) => b.weight - a.weight)
      .map((item, rank) => ({ ...item, rank: rank + 1 }))
      .sort((a, b) => a.index - b.index)
  }, [aggregatedData])

  // Early returns AFTER all hooks have been called
  if (loading) {
    return (
      <div className="aggregated-results">
        <Header title="Зведені результати" showBackButton={true} />
        <div className="container">
          <div className="card text-center">
            <p>Завантаження...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !aggregatedData) {
    return (
      <div className="aggregated-results">
        <Header title="Зведені результати" showBackButton={true} />
        <div className="container">
          <div className="card">
            <h2>Зведені результати</h2>
            <div className="alert alert-warning">
              {error}
            </div>
            <button
              onClick={handleAggregate}
              disabled={aggregating}
              className="btn btn-primary"
            >
              {aggregating ? 'Розрахунок...' : 'Розрахувати зведені результати'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!aggregatedData) {
    return (
      <div className="aggregated-results">
        <Header title="Зведені результати" showBackButton={true} />
        <div className="container">
          <div className="card text-center">
            <p>Немає даних для відображення</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="aggregated-results">
      <Header
        title="Зведені результати"
        subtitle={`Об'єднані оцінки від ${aggregatedData.num_experts} експертів`}
        showBackButton={true}
      />

      <div className="container">
        <div className="results-actions">
          <button
            onClick={handleAggregate}
            disabled={aggregating}
            className="btn btn-primary"
          >
            {aggregating ? 'Оновлення...' : '↻ Оновити результати'}
          </button>
        </div>

        <div className="card">

        {/* LEVEL 1 & 2: Tabbed Matrix View */}
        <div className="matrix-tabs-section">
          <h2 className="section-title">Матриці парних порівнянь</h2>
          <p className="section-description">
            Перегляд індивідуальних матриць експертів (Рівень 1) та зведеної матриці геометричного середнього (Рівень 2)
          </p>

          {/* Tab Buttons */}
          <div className="matrix-tabs">
            {aggregatedData.individual_results && aggregatedData.individual_results.map((expert, idx) => (
              <button
                key={`expert-${idx}`}
                className={`tab-button ${selectedView === `expert-${idx}` ? 'active' : ''}`}
                onClick={() => setSelectedView(`expert-${idx}`)}
              >
                Експерт {idx + 1}: {expert.username}
              </button>
            ))}
            <button
              className={`tab-button tab-geometric ${selectedView === 'geometric' ? 'active' : ''}`}
              onClick={() => setSelectedView('geometric')}
            >
              Геометричне середнє (AIJ)
            </button>
          </div>

          {/* Display Selected Matrix */}
          <div className="matrix-display">
            {selectedView === 'geometric' ? (
              // Geometric Mean View (LEVEL 2)
              <div className="matrix-view">
                <h3 className="matrix-view-title">Зведена матриця (Геометричне середнє)</h3>
                <div className="method-info-inline">
                  <span className="method-formula-inline">
                    a<sub>ij</sub><sup>(група)</sup> = (∏<sub>k=1</sub><sup>n</sup> a<sub>ij</sub><sup>(k)</sup>)<sup>1/n</sup>
                  </span>
                  <span className="method-desc-inline">
                    AIJ метод: геометричне середнє від {aggregatedData.num_experts} експертів
                  </span>
                </div>

                {aggregatedData.aggregated_matrix && (
                  <div className="matrix-table-wrapper">
                    <table className="comparison-matrix geometric-matrix">
                      <thead>
                        <tr>
                          <th></th>
                          {project?.alternatives.map((alt, idx) => (
                            <th key={idx}>{alt}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.aggregated_matrix.map((row, i) => (
                          <tr key={i}>
                            <th>{project?.alternatives[i]}</th>
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

                {/* Geometric Mean Weights */}
                <div className="weights-container">
                  <h4>Ваги зі зведеної матриці</h4>
                  <div className="weights-grid">
                    {aggregatedData.weights.map((weight, idx) => (
                      <div key={idx} className="weight-item">
                        <span className="weight-alt">{project?.alternatives[idx]}</span>
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

                {/* Geometric Mean Consistency */}
                <div className="consistency-inline">
                  <span className="consistency-label">Узгодженість:</span>
                  <span className={`consistency-value ${aggregatedData.consistency_ratio <= 0.1 ? 'consistent' : 'inconsistent'}`}>
                    CR = {aggregatedData.consistency_ratio.toFixed(4)}
                  </span>
                  {aggregatedData.consistency_ratio <= 0.1 ? (
                    <span className="consistency-badge good">Прийнятно</span>
                  ) : (
                    <span className="consistency-badge warning">Потрібна перевірка</span>
                  )}
                </div>
              </div>
            ) : (
              // Individual Expert View (LEVEL 1)
              (() => {
                const expertIdx = parseInt(selectedView.split('-')[1])
                const expert = aggregatedData.individual_results?.[expertIdx]
                return expert ? (
                  <div className="matrix-view">
                    <h3 className="matrix-view-title">Матриця експерта: {expert.username}</h3>
                    <p className="expert-note">
                      Індивідуальні парні порівняння, виконані цим експертом
                    </p>

                    {/* Expert Matrix */}
                    <div className="matrix-table-wrapper">
                      <table className="comparison-matrix expert-matrix">
                        <thead>
                          <tr>
                            <th></th>
                            {project?.alternatives.map((alt, idx) => (
                              <th key={idx}>{alt}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {expert.matrix.map((row, i) => (
                            <tr key={i}>
                              <th>{project?.alternatives[i]}</th>
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

                    {/* Expert Weights */}
                    <div className="weights-container">
                      <h4>Ваги цього експерта</h4>
                      <div className="weights-grid">
                        {expert.weights.map((weight, idx) => (
                          <div key={idx} className="weight-item">
                            <span className="weight-alt">{project?.alternatives[idx]}</span>
                            <span className="weight-value">{weight.toFixed(4)}</span>
                            <div className="weight-bar">
                              <div
                                className="weight-bar-fill weight-bar-fill-expert"
                                style={{ width: `${weight * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expert Consistency */}
                    <div className="consistency-inline">
                      <span className="consistency-label">Узгодженість:</span>
                      <span className={`consistency-value ${expert.consistency_ratio <= 0.1 ? 'consistent' : 'inconsistent'}`}>
                        CR = {expert.consistency_ratio.toFixed(4)}
                      </span>
                      {expert.consistency_ratio <= 0.1 ? (
                        <span className="consistency-badge good">Прийнятно</span>
                      ) : (
                        <span className="consistency-badge warning">Потрібна перевірка</span>
                      )}
                    </div>
                  </div>
                ) : null
              })()
            )}
          </div>
        </div>

        {/* LEVEL 3: Final Aggregated Results */}
        <div className="final-results-section">
          <h2 className="section-title">Рівень 3: Підсумкові зведені результати</h2>
          <p className="section-description">
            Фінальні ваги альтернатив, розраховані з зведеної матриці методом власних векторів.
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
                {project?.alternatives.map((alt, index) => (
                  <tr key={index} className={rankings[index].rank === 1 ? 'best-alternative' : ''}>
                    <td>{alt}</td>
                    <td>{aggregatedData.weights[index].toFixed(4)}</td>
                    <td className="rank-cell">
                      {rankings[index].rank}
                      {rankings[index].rank === 1 && <span className="rank-badge">#1</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Consistency */}
          <div className="consistency-section">
            <h4>Узгодженість зведеної матриці</h4>
            <div className="consistency-metrics">
              <div className="metric">
                <span className="metric-label">λ_max:</span>
                <span className="metric-value">{aggregatedData.lambda_max?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Індекс узгодженості (CI):</span>
                <span className="metric-value">{aggregatedData.consistency_index?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Коефіцієнт узгодженості (CR):</span>
                <span className={`metric-value ${aggregatedData.consistency_ratio <= 0.1 ? 'consistent' : 'inconsistent'}`}>
                  {aggregatedData.consistency_ratio.toFixed(4)}
                </span>
              </div>
            </div>
            <div className={`consistency-status ${aggregatedData.consistency_ratio <= 0.1 ? 'status-good' : 'status-warning'}`}>
              {aggregatedData.consistency_ratio <= 0.1
                ? 'Узгодженість прийнятна (CR ≤ 0.1)'
                : 'Потрібна додаткова перевірка (CR > 0.1)'}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
