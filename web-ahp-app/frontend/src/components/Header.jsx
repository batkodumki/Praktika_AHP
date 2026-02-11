import React, { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import ProfilePanel from './ProfilePanel'
import './Header.css'

function Header({ title, subtitle, showBackButton = true }) {
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const handleBack = useCallback(() => {
    // Smart back navigation based on current location
    if (location.pathname.includes('/compare') ||
        location.pathname.includes('/settings') ||
        location.pathname.includes('/aggregated')) {
      // If we're in a project sub-page, go back to project detail
      const projectId = location.pathname.split('/')[2]
      navigate(`/project/${projectId}`)
    } else if (location.pathname.includes('/project/')) {
      // If we're on project detail, go to dashboard
      navigate('/dashboard')
    } else {
      // Default: use browser back
      navigate(-1)
    }
  }, [location.pathname, navigate])

  // Don't show header on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  return (
    <>
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              {showBackButton && location.pathname !== '/dashboard' && (
                <button
                  onClick={handleBack}
                  className="btn-back"
                  aria-label="Go back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  <span>{t('back')}</span>
                </button>
              )}
              {title && (
                <div className="header-title-section">
                  <h1 className="header-title">{title}</h1>
                  {subtitle && <p className="header-subtitle">{subtitle}</p>}
                </div>
              )}
            </div>

            <div className="header-right">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-nav"
                aria-label="Go to dashboard"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>{t('projects')}</span>
              </button>

              <button
                onClick={() => navigate('/friends')}
                className="btn-nav"
                aria-label="Go to friends"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Друзі</span>
              </button>

              <button
                onClick={() => setShowProfilePanel(true)}
                className="btn-profile"
                aria-label="Open profile menu"
              >
                <div className="profile-avatar">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="avatar-image" />
                  ) : (
                    user?.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="profile-name">{user?.username}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ProfilePanel
        isOpen={showProfilePanel}
        onClose={() => setShowProfilePanel(false)}
      />
    </>
  )
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(Header)
