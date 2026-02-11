import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import ResultsView from './ResultsView'
import './ProjectDetail.css'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collaborationStatus, setCollaborationStatus] = useState(null)
  const [userProgress, setUserProgress] = useState(null)
  const [collaborators, setCollaborators] = useState([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  useEffect(() => {
    loadProject()
    loadCollaborationStatus()
    loadUserProgress()
  }, [id])

  // Reload collaboration status periodically in collaborative mode
  useEffect(() => {
    if (!project?.is_collaborative) return

    const interval = setInterval(() => {
      loadCollaborationStatus()
      loadCollaborators()
    }, 5000) // Reload every 5 seconds

    return () => clearInterval(interval)
  }, [project?.is_collaborative, id])

  const loadProject = async () => {
    try {
      const response = await projectAPI.get(id)
      setProject(response.data)

      // Load collaborators if collaborative
      if (response.data.is_collaborative) {
        loadCollaborators()
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCollaborators = async () => {
    try {
      const response = await projectAPI.getCollaborators(id)
      setCollaborators(response.data.collaborators || [])
    } catch (error) {
      console.error('Failed to load collaborators:', error)
    }
  }

  const loadCollaborationStatus = async () => {
    try {
      const response = await projectAPI.getCollaborationStatus(id)
      setCollaborationStatus(response.data)
    } catch (error) {
      console.error('Failed to load collaboration status:', error)
    }
  }

  const loadUserProgress = async () => {
    try {
      const response = await projectAPI.getMyProgress(id)
      setUserProgress(response.data)
    } catch (error) {
      console.error('Failed to load user progress:', error)
    }
  }

  const handleStartComparisons = () => {
    navigate(`/project/${id}/compare`)
  }

  const handleCalculateResults = async () => {
    try {
      const response = await projectAPI.calculateResults(id)

      // Check if response indicates waiting state
      if (response.data.status === 'waiting_for_others') {
        // Reload status to show updated counts
        loadCollaborationStatus()
        return
      }

      if (response.data.status === 'ready_for_aggregation') {
        // Navigate to aggregated results
        navigate(`/project/${id}/aggregated`)
        return
      }

      // Normal result calculation for single-user mode
      loadProject() // Reload to get results
    } catch (error) {
      console.error('Failed to calculate results:', error)
      alert(error.response?.data?.error || 'Не вдалося обчислити результати')
    }
  }

  const handleViewAggregatedResults = async () => {
    // Try to aggregate first, then navigate
    try {
      await projectAPI.aggregate(id, 'AIJ')
    } catch (error) {
      console.error('Aggregation may already exist:', error)
      // Continue to results page anyway
    }
    navigate(`/project/${id}/aggregated`)
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()

    if (!inviteUsername.trim()) {
      setInviteMessage('Введіть ім\'я користувача або email')
      return
    }

    try {
      const isEmail = inviteUsername.includes('@')
      const requestData = isEmail
        ? { emails: [inviteUsername], role: 'contributor' }
        : { usernames: [inviteUsername], role: 'contributor' }

      const response = await projectAPI.inviteCollaborators(id, requestData)

      if (response.data.invited.length > 0) {
        setInviteMessage(`Запрошення надіслано користувачу ${inviteUsername}`)
        setInviteUsername('')
        setShowInviteForm(false)
        loadCollaborators()
        setTimeout(() => setInviteMessage(''), 3000)
      } else if (response.data.errors.length > 0) {
        setInviteMessage(`Помилка: ${response.data.errors[0]}`)
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
      setInviteMessage(error.response?.data?.error || 'Не вдалося надіслати запрошення')
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center mt-4">Завантаження проєкту...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container">
        <div className="text-center mt-4">Проєкт не знайдено</div>
      </div>
    )
  }

  const n = project.alternatives.length
  const totalComparisons = n * (n - 1) / 2

  // Use user-specific progress for collaborative projects
  const completedComparisons = project.is_collaborative && userProgress
    ? userProgress.completed
    : Math.min(project.comparisons?.length || 0, totalComparisons)

  const progress = totalComparisons > 0 ? Math.min((completedComparisons / totalComparisons) * 100, 100) : 0
  const isUserComplete = completedComparisons >= totalComparisons

  // Check if current user is the project owner
  const isOwner = currentUser && project.user &&
    (currentUser.id === project.user.id || currentUser.username === project.user.username)

  return (
    <div className="project-detail">
      <Header
        title={project.title}
        subtitle={project.description}
        showBackButton={true}
      />

      {/* Settings button and collaborative badge */}
      <div className="project-detail-meta">
        <div className="container">
          <div className="meta-actions">
            <button onClick={() => navigate(`/project/${id}/settings`)} className="btn btn-outline">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.196-15.804l-4.242 4.242m-2.828 2.828l-4.242 4.242m15.556-1.768l-6-3.464m-3.464-2l-6-3.464M1 12h6m6 0h6"/>
              </svg>
              Налаштування
            </button>
            {project.is_collaborative && (
              <div className="collaborative-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Колективний проєкт
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Alternatives Section */}
        <div className="card alternatives-card">
          <h2 className="card-title">Альтернативи ({project.alternatives.length})</h2>
          <div className="alternatives-list">
            {project.alternatives.map((alt, index) => (
              <div key={index} className="alternative-item">
                <span className="alternative-number">{index + 1}</span>
                <span className="alternative-name">{alt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress and Actions Section */}
        <div className="card progress-card">
          <h2 className="card-title">
            {project.is_collaborative ? 'Ваш прогрес' : 'Прогрес'}
          </h2>

          <div className="progress-info">
            <div className="progress-text">
              {completedComparisons} / {totalComparisons} порівнянь завершено
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Collaboration Status */}
          {project.is_collaborative && collaborationStatus && (
            <div className="collaboration-status-info">
              {collaborationStatus.status === 'in_progress' && (
                <div className="progress-status-message">
                  <p>{collaborationStatus.message}</p>
                  <p className="status-detail">
                    Експертів завершили: {collaborationStatus.completed_experts} / {collaborationStatus.total_experts}
                  </p>
                </div>
              )}
              {collaborationStatus.status === 'waiting_for_others' && (
                <div className="waiting-status">
                  <p className="waiting-message">{collaborationStatus.message}</p>
                  <p className="waiting-detail">
                    Ви завершили свої порівняння. Очікуємо інших експертів...
                  </p>
                </div>
              )}
              {collaborationStatus.all_experts_done && (
                <div className="ready-status">
                  <p className="ready-message">{collaborationStatus.message}</p>
                  <p className="ready-detail">
                    Всі {collaborationStatus.total_experts} експертів завершили роботу. Результати готові!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {!isUserComplete && (
              <button
                onClick={handleStartComparisons}
                className="btn btn-primary btn-large"
              >
                {completedComparisons > 0 ? 'Продовжити порівняння' : 'Почати порівняння'}
              </button>
            )}

            {/* Single-user: Show calculate button when complete */}
            {!project.is_collaborative && isUserComplete && !project.result && (
              <button
                onClick={handleCalculateResults}
                className="btn btn-success btn-large"
              >
                Розрахувати результати
              </button>
            )}

            {/* Single-user: View results if already calculated */}
            {!project.is_collaborative && project.result && (
              <button
                onClick={handleCalculateResults}
                className="btn btn-secondary btn-large"
              >
                Переглянути результати
              </button>
            )}

            {/* Collaborative: Show aggregated results button when all done */}
            {project.is_collaborative && collaborationStatus?.all_experts_done && (
              <button
                onClick={handleViewAggregatedResults}
                className="btn btn-success btn-large"
              >
                Розрахувати зведені результати
              </button>
            )}
          </div>
        </div>

        {/* Collaborators Section - Only for collaborative projects */}
        {project.is_collaborative && (
          <div className="card collaborators-card">
            <h2 className="card-title">Експерти та співпраця</h2>

            {inviteMessage && (
              <div className={`alert ${inviteMessage.includes('надіслано') ? 'alert-success' : 'alert-error'}`}>
                {inviteMessage}
              </div>
            )}

            {/* Collaborators List */}
            {collaborators.length > 0 && (
              <div className="collaborators-list">
                <h3>Запрошені експерти:</h3>
                <div className="collaborators-grid">
                  {collaborators.map((collab) => (
                    <div key={collab.user_id} className="collaborator-item">
                      <span className="collaborator-name">{collab.username}</span>
                      <span className={`collaborator-status status-${collab.status}`}>
                        {collab.status === 'invited' && 'Запрошено'}
                        {collab.status === 'active' && 'В процесі'}
                        {collab.status === 'completed' && 'Завершено'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite Button - Only for owner */}
            {isOwner && (
              <div className="invite-section">
                {!showInviteForm ? (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="btn btn-primary btn-invite"
                  >
                    Запросити експерта
                  </button>
                ) : (
                  <form onSubmit={handleInviteUser} className="invite-form">
                    <input
                      type="text"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="Ім'я користувача або email"
                      className="invite-input"
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary">
                      Надіслати запрошення
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteForm(false)
                        setInviteUsername('')
                      }}
                      className="btn btn-outline"
                    >
                      Скасувати
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Single-user results display */}
        {!project.is_collaborative && project.result && (
          <ResultsView project={project} result={project.result} />
        )}
      </div>
    </div>
  )
}
