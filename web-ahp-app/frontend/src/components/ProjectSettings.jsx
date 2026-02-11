import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import Header from './Header'
import './ProjectSettings.css'

export default function ProjectSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [project, setProject] = useState(null)
  const [isCollaborative, setIsCollaborative] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      const response = await projectAPI.get(id)
      setProject(response.data)
      setIsCollaborative(response.data.is_collaborative)

      if (response.data.is_collaborative) {
        loadCollaborators()
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load project:', error)
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

  const handleToggleCollaboration = async () => {
    try {
      await projectAPI.enableCollaboration(id, !isCollaborative)
      setIsCollaborative(!isCollaborative)
      setMessage(
        !isCollaborative
          ? 'Колективне прийняття рішення увімкнено'
          : 'Колективне прийняття рішення вимкнено'
      )

      if (!isCollaborative) {
        loadCollaborators()
      }
    } catch (error) {
      console.error('Failed to toggle collaboration:', error)
      setMessage('Помилка при зміні налаштувань')
    }
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()

    if (!inviteUsername.trim()) {
      setMessage('Введіть ім\'я користувача або email')
      return
    }

    try {
      // Determine if input is email or username
      const isEmail = inviteUsername.includes('@')
      const requestData = isEmail
        ? { emails: [inviteUsername], role: 'contributor' }
        : { usernames: [inviteUsername], role: 'contributor' }

      const response = await projectAPI.inviteCollaborators(id, requestData)

      if (response.data.invited.length > 0) {
        setMessage(`Запрошення надіслано користувачу ${inviteUsername}`)
        setInviteUsername('')
        loadCollaborators()
      } else if (response.data.errors.length > 0) {
        setMessage(`Помилка: ${response.data.errors[0]}`)
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
      setMessage(error.response?.data?.error || 'Не вдалося надіслати запрошення')
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'invited': 'Запрошено',
      'active': 'В процесі',
      'completed': 'Завершено'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="container">
        <div className="text-center mt-4">Завантаження...</div>
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

  // Check if current user is the project owner
  const isOwner = currentUser && project.user &&
    (currentUser.id === project.user.id ||
     currentUser.username === project.user.username)

  return (
    <div className="project-settings">
      <Header
        title="Налаштування проєкту"
        subtitle={project.title}
        showBackButton={true}
      />

      <div className="container">
        <div className="card">

          {project.user && (
            <p className="project-owner-info">
              Власник проєкту: <strong>{project.user.username}</strong>
            </p>
          )}

          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          {/* Show message if user is not the owner */}
          {!isOwner && currentUser && project.user && (
            <div className="alert alert-warning">
              Тільки власник проєкту може змінювати налаштування та запрошувати експертів.
            </div>
          )}

          {/* Collaboration Toggle - Only visible to project owner */}
          {isOwner && (
            <div className="settings-section">
              <h3>Режим роботи</h3>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isCollaborative}
                  onChange={handleToggleCollaboration}
                  className="toggle-checkbox"
                />
                <span className="toggle-text">
                  Колективне прийняття рішення (декілька експертів)
                </span>
              </label>
              <p className="help-text">
                {isCollaborative
                  ? 'Проєкт відкритий для співпраці. Декілька експертів можуть надавати оцінки незалежно.'
                  : 'Проєкт працює в режимі одного користувача. Увімкніть цю опцію, щоб запрошувати експертів.'}
              </p>
            </div>
          )}

          {/* Collaborators Section */}
          {isCollaborative && (
            <div className="settings-section">
              <h3>Експерти</h3>

              {collaborators.length > 0 ? (
                <div className="collaborators-list">
                  <table className="collaborators-table">
                    <thead>
                      <tr>
                        <th>Користувач</th>
                        <th>Роль</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborators.map((collab) => (
                        <tr key={collab.user_id}>
                          <td>{collab.username}</td>
                          <td>{collab.role === 'owner' ? 'Власник' : 'Експерт'}</td>
                          <td>{getStatusLabel(collab.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-collaborators">Експертів ще не запрошено</p>
              )}

              {/* Invite Form - Only visible to project owner */}
              {isOwner && (
                <form onSubmit={handleInviteUser} className="invite-form">
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Ім'я користувача або email для запрошення"
                    className="form-input"
                  />
                  <button type="submit" className="btn btn-primary">
                    + Запросити експерта
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Instructions */}
          {isCollaborative && (
            <div className="settings-section">
              <h3>Як це працює</h3>
              <ol className="instructions-list">
                <li>Запросіть експертів для участі в проєкті</li>
                <li>Кожен експерт виконує парні порівняння незалежно</li>
                <li>Після завершення порівнянь, система автоматично об'єднає оцінки</li>
                <li>Кінцевий результат буде розраховано за методом AIJ (геометричне середнє)</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
