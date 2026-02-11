import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { projectAPI } from '../utils/api'
import Header from './Header'
import './Dashboard.css'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    alternatives: ['', ''],
    scale_type: 1,
  })
  const [filterType, setFilterType] = useState('all') // 'all', 'solo', 'collaborative'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'incomplete', 'completed'

  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const response = await projectAPI.list()
      setProjects(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAddAlternative = useCallback(() => {
    setNewProject((prev) => ({
      ...prev,
      alternatives: [...prev.alternatives, ''],
    }))
  }, [])

  const handleRemoveAlternative = useCallback((index) => {
    setNewProject((prev) => {
      if (prev.alternatives.length > 2) {
        return {
          ...prev,
          alternatives: prev.alternatives.filter((_, i) => i !== index),
        }
      }
      return prev
    })
  }, [])

  const handleAlternativeChange = useCallback((index, value) => {
    setNewProject((prev) => {
      const updated = [...prev.alternatives]
      updated[index] = value
      return { ...prev, alternatives: updated }
    })
  }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()

    // Filter out empty alternatives
    const filteredAlternatives = newProject.alternatives
      .map(a => a.trim())
      .filter(a => a.length > 0)

    if (filteredAlternatives.length < 2) {
      alert('Будь ласка, введіть принаймні 2 альтернативи')
      return
    }

    // Check for duplicates
    const uniqueAlts = new Set(filteredAlternatives)
    if (uniqueAlts.size !== filteredAlternatives.length) {
      alert('Альтернативи повинні бути унікальними')
      return
    }

    try {
      const response = await projectAPI.create({
        ...newProject,
        alternatives: filteredAlternatives,
        status: 'comparison',
      })

      navigate(`/project/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Не вдалося створити проєкт')
    }
  }

  const handleDeleteProject = useCallback(async (id) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей проєкт?')) {
      try {
        await projectAPI.delete(id)
        loadProjects()
      } catch (error) {
        console.error('Failed to delete project:', error)
      }
    }
  }, [loadProjects])

  const getStatusBadge = useCallback((status) => {
    const badges = {
      input: { label: t('statusInput'), className: 'badge-info' },
      comparison: { label: t('statusInProgress'), className: 'badge-warning' },
      completed: { label: t('statusCompleted'), className: 'badge-success' },
    }
    const badge = badges[status] || badges.input
    return <span className={`badge ${badge.className}`}>{badge.label}</span>
  }, [t])

  // Filter projects based on selected filters (memoized for performance)
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Filter by type
      if (filterType === 'solo' && project.is_collaborative) return false
      if (filterType === 'collaborative' && !project.is_collaborative) return false

      // Filter by status
      if (filterStatus === 'completed' && project.status !== 'completed') return false
      if (filterStatus === 'incomplete' && project.status === 'completed') return false

      return true
    })
  }, [projects, filterType, filterStatus])

  return (
    <div className="dashboard">
      <Header
        title={t('myProjects')}
        subtitle={`${t('welcome')}, ${user?.username}!`}
        showBackButton={false}
      />

      <div className="container">
        <button
          onClick={() => setShowNewProject(!showNewProject)}
          className="btn btn-primary mb-4"
        >
          {showNewProject ? t('cancel') : `+ ${t('newProject')}`}
        </button>

        {showNewProject && (
          <div className="card mb-4">
            <h2 className="card-title">{t('createNewProject')}</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">{t('projectName')} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('description')}</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder={t('optionalDescription')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('scaleType')}</label>
                <select
                  className="form-input"
                  value={newProject.scale_type}
                  onChange={(e) => setNewProject({ ...newProject, scale_type: parseInt(e.target.value) })}
                >
                  <option value={1}>{t('integerScale')}</option>
                  <option value={2}>{t('balancedScale')}</option>
                  <option value={3}>{t('powerScale')}</option>
                  <option value={4}>{t('maZhengScale')}</option>
                  <option value={5}>{t('doneganScale')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('alternatives')} ({t('minimum2Alternatives')}) *</label>
                {newProject.alternatives.map((alt, index) => (
                  <div key={index} className="alternative-input-row">
                    <input
                      type="text"
                      className="form-input"
                      value={alt}
                      onChange={(e) => handleAlternativeChange(index, e.target.value)}
                      placeholder={`${t('alternative')} ${index + 1}`}
                    />
                    {newProject.alternatives.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAlternative(index)}
                        className="btn btn-danger btn-sm"
                      >
                        {t('remove')}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAlternative}
                  className="btn btn-outline btn-sm mt-2"
                >
                  + {t('addAlternative')}
                </button>
              </div>

              <button type="submit" className="btn btn-secondary">
                {t('createProject')}
              </button>
            </form>
          </div>
        )}

        {/* Project Filters */}
        {!loading && projects.length > 0 && (
          <div className="projects-filters">
            <div className="filter-group">
              <label className="filter-label">{t('projectType')}:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  {t('all')}
                </button>
                <button
                  className={`filter-btn ${filterType === 'solo' ? 'active' : ''}`}
                  onClick={() => setFilterType('solo')}
                >
                  {t('individual')}
                </button>
                <button
                  className={`filter-btn ${filterType === 'collaborative' ? 'active' : ''}`}
                  onClick={() => setFilterType('collaborative')}
                >
                  {t('collaborative')}
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">{t('status')}:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  {t('all')}
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'incomplete' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('incomplete')}
                >
                  {t('inProgress')}
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('completed')}
                >
                  {t('completed')}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-4">{t('loadingProjects')}</div>
        ) : filteredProjects.length === 0 && projects.length > 0 ? (
          <div className="empty-state">
            <h3>{t('noMatchingProjects')}</h3>
            <p>{t('tryDifferentFilters')}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>{t('noProjectsYet')}</h3>
            <p>{t('createFirstProject')}</p>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-card-header">
                  <h3 className="project-card-title">{project.title}</h3>
                  {getStatusBadge(project.status)}
                </div>

                {project.description && (
                  <p className="project-card-description">{project.description}</p>
                )}

                <div className="project-card-meta">
                  <div className="meta-item">
                    <strong>{t('alternatives')}:</strong> {project.alternatives.length}
                  </div>
                  <div className="meta-item">
                    <strong>{t('comparisons')}:</strong> {project.comparison_count} / {project.total_comparisons}
                  </div>
                  <div className="meta-item">
                    <strong>{t('updated')}:</strong> {new Date(project.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'uk-UA')}
                  </div>
                </div>

                <div className="project-card-actions">
                  <button
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="btn btn-primary btn-sm"
                  >
                    {t('open')}
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn btn-danger btn-sm"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
