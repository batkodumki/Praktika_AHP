import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { invitationAPI } from '../utils/api'
import './PendingInvitations.css'

export default function PendingInvitations() {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      const response = await invitationAPI.getPending()
      setInvitations(response.data.invitations || [])
    } catch (error) {
      console.error('Failed to load invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId, projectId) => {
    try {
      await invitationAPI.accept(invitationId)

      // Remove from list
      setInvitations(invitations.filter(inv => inv.id !== invitationId))

      // Navigate to project
      navigate(`/project/${projectId}`)
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      alert('Не вдалося прийняти запрошення')
    }
  }

  const handleDecline = async (invitationId) => {
    try {
      await invitationAPI.decline(invitationId)

      // Remove from list
      setInvitations(invitations.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Failed to decline invitation:', error)
      alert('Не вдалося відхилити запрошення')
    }
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  if (invitations.length === 0) {
    return null // Don't show component if no invitations
  }

  return (
    <div className="pending-invitations">
      <div className="invitations-header">
        <h2>Запрошення до проєктів</h2>
        <span className="invitations-count">{invitations.length}</span>
      </div>

      <div className="invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-card">
            <div className="invitation-content">
              <div className="invitation-details">
                <h3 className="invitation-title">{invitation.project_title}</h3>
                {invitation.project_description && (
                  <p className="invitation-description">{invitation.project_description}</p>
                )}
                <div className="invitation-meta">
                  <span className="invitation-owner">від {invitation.owner_username}</span>
                  <span className="invitation-role">Роль: {invitation.role === 'contributor' ? 'Експерт' : invitation.role}</span>
                </div>
              </div>
            </div>
            <div className="invitation-actions">
              <button
                onClick={() => handleAccept(invitation.id, invitation.project_id)}
                className="btn btn-primary btn-sm"
              >
                Прийняти
              </button>
              <button
                onClick={() => handleDecline(invitation.id)}
                className="btn btn-outline btn-sm"
              >
                Відхилити
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
