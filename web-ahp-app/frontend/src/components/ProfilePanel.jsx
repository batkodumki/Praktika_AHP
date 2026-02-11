import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { authAPI } from '../utils/api'
import './ProfilePanel.css'

export default function ProfilePanel({ isOpen, onClose }) {
  const { user, logout, updateUser } = useAuth()
  const { language, changeLanguage, t } = useLanguage()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    avatar_url: user?.avatar_url || '',
  })
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  const handleLogout = () => {
    logout()
    onClose()
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveMessage('')

    try {
      const updateData = {
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      }

      // Include avatar_url if it exists
      if (profileData.avatar_url !== undefined) {
        updateData.avatar_url = profileData.avatar_url
      }

      const response = await authAPI.updateUser(updateData)

      // Update context with new user data
      if (updateUser) {
        updateUser(response.data)
      }

      setSaveMessage(t('profileUpdated'))
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      setSaveMessage(t('profileUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage('Будь ласка, виберіть файл зображення')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage('Розмір зображення має бути менше 2МБ')
      return
    }

    setUploadingPhoto(true)
    setSaveMessage('')

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target.result

        // Update profile data
        const updatedProfileData = {
          ...profileData,
          avatar_url: base64String,
        }
        setProfileData(updatedProfileData)

        // Auto-save the avatar
        try {
          const response = await authAPI.updateUser({
            avatar_url: base64String,
          })

          // Update context with new user data
          if (updateUser) {
            updateUser(response.data)
          }

          setSaveMessage(t('profileUpdated') || 'Фото профілю оновлено')
          setTimeout(() => setSaveMessage(''), 3000)
        } catch (error) {
          console.error('Failed to upload photo:', error)
          setSaveMessage(t('profileUpdateError') || 'Помилка завантаження фото')
        } finally {
          setUploadingPhoto(false)
        }
      }
      reader.onerror = () => {
        setSaveMessage('Помилка читання файлу')
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing file:', error)
      setSaveMessage('Помилка обробки файлу')
      setUploadingPhoto(false)
    }
  }

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleOpenPasswordModal = (e) => {
    e.stopPropagation()
    setShowPasswordModal(true)
  }

  const handleChangePassword = async () => {
    setChangingPassword(true)
    setPasswordMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match')
      setChangingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters')
      setChangingPassword(false)
      return
    }

    try {
      await authAPI.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })

      setPasswordMessage('Password changed successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordMessage('')
      }, 2000)
    } catch (error) {
      console.error('Failed to change password:', error)
      setPasswordMessage(error.response?.data?.error || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        avatar_url: user.avatar_url || '',
      })
    }
  }, [user])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="profile-panel-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className={`profile-panel ${isOpen ? 'open' : ''}`}>
        <div className="profile-panel-header">
          <h2 className="profile-panel-title">{t('userProfile')}</h2>
          <button
            onClick={onClose}
            className="profile-panel-close"
            aria-label="Close panel"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="profile-panel-content">
          {/* Profile Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {profileData.avatar_url ? (
                <img src={profileData.avatar_url} alt="Profile" className="avatar-image" />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="profile-info">
              <h3 className="profile-username">{user?.username}</h3>
              <p className="profile-email">{user?.email || t('email')}</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              className="btn-change-avatar"
              onClick={handleChangePhotoClick}
              disabled={uploadingPhoto}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              {uploadingPhoto ? 'Завантаження...' : t('changePhoto')}
            </button>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {t('profile')}
            </button>
            <button
              className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.196-15.804l-4.242 4.242m-2.828 2.828l-4.242 4.242m15.556-1.768l-6-3.464m-3.464-2l-6-3.464M1 12h6m6 0h6"/>
              </svg>
              {t('settings')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <h3 className="section-title">{t('profile')}</h3>

                {saveMessage && (
                  <div className={`alert ${saveMessage.includes('успішно') ? 'alert-success' : 'alert-error'}`}>
                    {saveMessage}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('username')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    disabled
                  />
                  <p className="form-hint">{t('usernameCannotChange')}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('email')}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('firstName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('lastName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn btn-primary btn-full"
                >
                  {saving ? t('saving') : t('saveChanges')}
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="profile-section">
                <h3 className="section-title">{t('accountSettings')}</h3>

                <div className="settings-list">
                  <div className="settings-item">
                    <div className="settings-item-content">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <div>
                        <h4>{t('changePassword')}</h4>
                        <p>{t('updateLoginPassword')}</p>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={handleOpenPasswordModal}>{t('change')}</button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-content">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <div>
                        <h4>{t('interfaceLanguage')}</h4>
                        <p>{language === 'ua' ? 'Українська' : 'English'}</p>
                      </div>
                    </div>
                    <div className="language-switcher">
                      <button
                        className={`btn-lang ${language === 'ua' ? 'active' : ''}`}
                        onClick={() => changeLanguage('ua')}
                      >
                        UA
                      </button>
                      <button
                        className={`btn-lang ${language === 'en' ? 'active' : ''}`}
                        onClick={() => changeLanguage('en')}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>

                <div className="danger-zone">
                  <h4>{t('dangerZone')}</h4>
                  <p>{t('dangerZoneWarning')}</p>
                  <button className="btn btn-danger btn-full">
                    {t('deleteAccount')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Footer */}
        <div className="profile-panel-footer">
          <button onClick={handleLogout} className="btn-logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)} />
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('changePassword')}</h3>
              <button onClick={() => setShowPasswordModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {passwordMessage && (
                <div className={`alert ${passwordMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
                  {passwordMessage}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPasswordModal(false)} className="btn btn-outline">
                {t('cancel')}
              </button>
              <button onClick={handleChangePassword} disabled={changingPassword} className="btn btn-primary">
                {changingPassword ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
