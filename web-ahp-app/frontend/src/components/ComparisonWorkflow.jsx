import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import BalanceScale from './BalanceScale'
import ScaleTypeSelector from './ScaleTypeSelector'
import GradationControls from './GradationControls'
import { integerByScale, unifyGradation, getGradualScale, calculateButtonWidths } from '../utils/scales'
import './ComparisonWorkflow.css'

const SCALE_LABELS = {
  2: 'Слабка',
  3: 'Середня',
  4: 'Вище середньої',
  5: 'Сильна',
  6: 'Дуже сильна',
  7: 'Дуже-дуже сильна',
  8: 'Надзвичайно сильна',
  9: 'Абсолютна',
}

export default function ComparisonWorkflow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [project, setProject] = useState(null)
  const [pairs, setPairs] = useState([])
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Comparison state
  const [direction, setDirection] = useState(null) // 'more' or 'less'
  const [scaleStr, setScaleStr] = useState('259') // Current scale gradations
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [reliability, setReliability] = useState(0)
  const [currentValue, setCurrentValue] = useState(1)

  // Scale configuration state
  const [scaleType, setScaleType] = useState(1) // Default to Integer
  const [gradations, setGradations] = useState(3) // Default to 3 gradations
  const [refinementLevel, setRefinementLevel] = useState(0) // Track progressive refinement level

  // Derive currentPair from pairs array - must be defined before useEffect
  const currentPair = pairs.length > 0 && currentPairIndex >= 0 && currentPairIndex < pairs.length
    ? pairs[currentPairIndex]
    : null

  useEffect(() => {
    loadProject()
  }, [id])

  useEffect(() => {
    if (currentPair && project) {
      loadCurrentComparison()
    }
  }, [currentPairIndex, pairs])

  // Update scale dynamically when gradations change
  useEffect(() => {
    if (direction !== null) {
      const newScale = getGradualScale(gradations)
      setScaleStr(newScale)
      setSelectedGrade(null)
      setReliability(gradations)
      setRefinementLevel(1)
    }
  }, [gradations, direction])

  const loadProject = async () => {
    try {
      const response = await projectAPI.get(id)
      setProject(response.data)
      generatePairs(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load project:', error)
      setLoading(false)
    }
  }

  const generatePairs = (proj) => {
    const n = proj.alternatives.length
    const allPairs = []

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        allPairs.push({ indexA: i, indexB: j })
      }
    }

    setPairs(allPairs)

    // Find first incomplete pair - MUST filter by user in collaborative mode
    const comparisons = proj.comparisons || []

    // In collaborative mode, only consider current user's comparisons
    // Comparisons have user field that can be either ID or object with id
    const userComparisons = proj.is_collaborative && currentUser
      ? comparisons.filter(c => {
          const compUserId = typeof c.user === 'object' ? c.user?.id : c.user
          return compUserId === currentUser.id
        })
      : comparisons

    const comparisonSet = new Set(
      userComparisons.map(c => `${c.index_a}-${c.index_b}`)
    )

    const firstIncomplete = allPairs.findIndex(
      p => !comparisonSet.has(`${p.indexA}-${p.indexB}`)
    )

    setCurrentPairIndex(firstIncomplete >= 0 ? firstIncomplete : 0)
  }

  const loadCurrentComparison = () => {
    if (!project || !currentPair) return

    // CRITICAL: In collaborative mode, only load CURRENT USER's comparison
    // This ensures each expert has independent direction selection
    const existing = project.comparisons?.find(c => {
      const matchesPair = c.index_a === currentPair.indexA && c.index_b === currentPair.indexB

      if (!project.is_collaborative || !currentUser) {
        return matchesPair
      }

      // In collaborative mode, also match user
      const compUserId = typeof c.user === 'object' ? c.user?.id : c.user
      return matchesPair && compUserId === currentUser.id
    })

    if (existing) {
      setDirection(existing.direction)
      setScaleStr(existing.scale_str)
      setReliability(existing.reliability)
      setCurrentValue(existing.value)
      setScaleType(existing.scale_type || project.scale_type || 1)
      setGradations(existing.gradations || 3)
      setRefinementLevel(existing.refinement_level || 0)
      setSelectedGrade(null)
    } else {
      resetComparison()
    }
  }

  const resetComparison = () => {
    setDirection(null)
    setScaleStr('259')
    setSelectedGrade(null)
    setReliability(0)
    setCurrentValue(1)
    setScaleType(project?.scale_type || 1)
    setGradations(3)
    setRefinementLevel(0)
  }

  const handleDirectionClick = (dir) => {
    setDirection(dir)
    setScaleType(project?.scale_type || 1) // Initialize with project's scale type
    // Scale will be initialized by useEffect
  }

  const handleGradeClick = (grade) => {
    setSelectedGrade(grade)

    // Calculate unified value
    const gradeIndex = scaleStr.split('').map(Number).indexOf(grade)
    const numGradations = scaleStr.length
    const unified = unifyGradation(gradeIndex + 1, numGradations)

    // Transform by scale type (use the selected scaleType)
    const transformed = integerByScale(unified, scaleType)

    setCurrentValue(transformed)
    setReliability(numGradations)

    // Progressive refinement logic - only for 3-gradation initial scale
    if (gradations === 3 && scaleStr === '259') {
      // First level - expand based on choice
      if (grade === 2) {
        setScaleStr('23459')
        setRefinementLevel(2)
      } else if (grade === 5) {
        setScaleStr('25679')
        setRefinementLevel(2)
      } else if (grade === 9) {
        setScaleStr('2589')
        setRefinementLevel(2)
      }
      setSelectedGrade(null)
    }
  }

  const handleSaveComparison = async () => {
    if (!direction || selectedGrade === null) {
      alert('Будь ласка, завершіть порівняння')
      return
    }

    try {
      let finalValue = currentValue

      // Apply direction
      if (direction === 'less') {
        finalValue = 1.0 / finalValue
      }

      await projectAPI.addComparison(id, {
        index_a: currentPair.indexA,
        index_b: currentPair.indexB,
        value: finalValue,
        direction: direction,
        reliability: reliability,
        scale_str: scaleStr,
        scale_type: scaleType,
        gradations: gradations,
        refinement_level: refinementLevel,
      })

      // Move to next pair
      if (currentPairIndex < pairs.length - 1) {
        setCurrentPairIndex(currentPairIndex + 1)
        resetComparison()
      } else {
        // All comparisons complete
        // CRITICAL: Mark user as completed in collaborative mode
        if (project.is_collaborative) {
          try {
            await projectAPI.markCompleted(id)
          } catch (error) {
            console.error('Failed to mark completed:', error)
            // Continue anyway - user can still see their work
          }
        }
        navigate(`/project/${id}`)
      }
    } catch (error) {
      console.error('Failed to save comparison:', error)
      alert('Не вдалося зберегти порівняння')
    }
  }

  const handlePreviousPair = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex(currentPairIndex - 1)
    }
  }

  const handleNextPair = () => {
    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center mt-4">Завантаження...</div>
      </div>
    )
  }

  if (!project || pairs.length === 0 || !currentPair) {
    return (
      <div className="container">
        <div className="text-center mt-4">Порівняння не потрібні</div>
      </div>
    )
  }

  const altA = project.alternatives[currentPair.indexA]
  const altB = project.alternatives[currentPair.indexB]

  return (
    <div className="comparison-workflow">
      <Header
        title={project.title}
        subtitle={`Порівняння ${currentPairIndex + 1} з ${pairs.length}`}
        showBackButton={true}
      />

      <div className="container">
        <div className="card">
          <h2 className="card-title text-center">Що важливіше?</h2>

          <div className="comparison-alternatives">
            <div className="comparison-alternative">
              <div className="alternative-label">Альтернатива А</div>
              <div className="alternative-value">{altA}</div>
            </div>

            <div className="comparison-vs">проти</div>

            <div className="comparison-alternative">
              <div className="alternative-label">Альтернатива Б</div>
              <div className="alternative-value">{altB}</div>
            </div>
          </div>

          {/* Direction Selection */}
          {direction === null && (
            <div className="direction-selection">
              <p className="direction-prompt">Оберіть, яка альтернатива БІЛЬШ важлива:</p>
              <div className="direction-buttons">
                <button
                  onClick={() => handleDirectionClick('more')}
                  className="btn btn-primary btn-lg"
                >
                  {altA} важливіше
                </button>
                <button
                  onClick={() => handleDirectionClick('less')}
                  className="btn btn-primary btn-lg"
                >
                  {altB} важливіше
                </button>
              </div>
            </div>
          )}

          {/* Scale Configuration and Selection */}
          {direction !== null && (
            <div className="scale-selection">
              <div className="scale-header">
                <p className="scale-prompt">
                  Наскільки більш важлива{' '}
                  <strong>{direction === 'more' ? altA : altB}</strong>?
                </p>
                <button
                  onClick={resetComparison}
                  className="btn btn-outline btn-sm"
                >
                  Скинути
                </button>
              </div>

              {/* Scale Configuration */}
              <div className="scale-configuration">
                <ScaleTypeSelector
                  scaleType={scaleType}
                  onChange={setScaleType}
                />

                <GradationControls
                  gradations={gradations}
                  onChange={setGradations}
                />
              </div>

              <div className="scale-grades">
                {(() => {
                  const buttonWidths = calculateButtonWidths(scaleStr, scaleType)
                  return scaleStr.split('').map((gradeChar, index) => {
                    const grade = parseInt(gradeChar)
                    const widthPercent = buttonWidths[index]
                    return (
                      <button
                        key={grade}
                        onClick={() => handleGradeClick(grade)}
                        className={`scale-grade ${selectedGrade === grade ? 'selected' : ''}`}
                        style={{
                          flex: `0 0 ${widthPercent}%`,
                          maxWidth: `${widthPercent}%`
                        }}
                      >
                        {SCALE_LABELS[grade]}
                      </button>
                    )
                  })
                })()}
              </div>

              {/* Balance Scale Visualization */}
              {currentValue > 1 && (
                <div className="balance-scale-container">
                  <BalanceScale value={currentValue} />
                </div>
              )}

              {/* Save Button */}
              {selectedGrade !== null && (
                <div className="comparison-actions">
                  <button onClick={handleSaveComparison} className="btn btn-secondary btn-lg">
                    Зберегти і продовжити
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="comparison-navigation">
            <button
              onClick={handlePreviousPair}
              disabled={currentPairIndex === 0}
              className="btn btn-outline"
            >
              ← Попереднє
            </button>
            <button
              onClick={handleNextPair}
              disabled={currentPairIndex === pairs.length - 1}
              className="btn btn-outline"
            >
              Наступне →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
