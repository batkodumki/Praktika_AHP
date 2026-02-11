import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { friendsAPI, messagesAPI, invitationAPI } from '../utils/api'
import Header from './Header'
import './Friends.css'

export default function Friends() {
  const { t } = useLanguage()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'requests', 'chat', 'invitations'
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [projectInvitations, setProjectInvitations] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [newFriendUsername, setNewFriendUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [addingFriend, setAddingFriend] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [friendsRes, requestsRes, invitationsRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getRequests(),
        invitationAPI.getPending(),
      ])
      setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : [])
      setFriendRequests(Array.isArray(requestsRes.data) ? requestsRes.data : [])
      setProjectInvitations(Array.isArray(invitationsRes.data) ? invitationsRes.data : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to load data:', err)
      setFriends([])
      setFriendRequests([])
      setProjectInvitations([])
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (friendId) => {
    try {
      const response = await messagesAPI.getMessages(friendId)
      setMessages(response.data)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }, [])

  const handleSelectFriend = useCallback((friendship) => {
    setSelectedFriend(friendship)
    setActiveTab('chat')
    // Determine which user is the "other person" (not current user)
    const otherUserId = friendship.user.id === currentUser?.id ? friendship.friend.id : friendship.user.id
    loadMessages(otherUserId)
  }, [loadMessages, currentUser])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedFriend || !currentUser) return

    setSendingMessage(true)
    try {
      // Determine which user is the recipient (not current user)
      const recipientId = selectedFriend.user.id === currentUser.id ? selectedFriend.friend.id : selectedFriend.user.id
      await messagesAPI.sendMessage(recipientId, newMessage)
      setNewMessage('')
      await loadMessages(recipientId)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Помилка відправлення повідомлення')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAddFriend = async (e) => {
    e.preventDefault()
    if (!newFriendUsername.trim()) return

    setAddingFriend(true)
    setError('')
    setSuccess('')
    try {
      await friendsAPI.sendRequest(newFriendUsername)
      setNewFriendUsername('')
      setSuccess('Запит на дружбу надіслано')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка відправлення запиту')
      setTimeout(() => setError(''), 3000)
    } finally {
      setAddingFriend(false)
    }
  }

  const handleAcceptFriend = async (friendshipId) => {
    try {
      await friendsAPI.acceptRequest(friendshipId)
      await loadData()
      setSuccess('Запит на дружбу прийнято')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Помилка прийняття запиту')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeclineFriend = async (friendshipId) => {
    try {
      await friendsAPI.declineRequest(friendshipId)
      await loadData()
    } catch (err) {
      setError('Помилка відхилення запиту')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await invitationAPI.accept(invitationId)
      await loadData()
      setSuccess('Запрошення прийнято')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Помилка прийняття запрошення')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await invitationAPI.decline(invitationId)
      await loadData()
    } catch (err) {
      setError('Помилка відхилення запрошення')
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Друзі та повідомлення" showBackButton={true} />
        <div className="container">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Друзі та повідомлення" showBackButton={true} />
      <div className="container">
        <div className="friends-page">
          {/* Tabs */}
          <div className="friends-tabs">
            <button
              className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Друзі ({friends.length})
            </button>
            <button
              className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Запити ({friendRequests.length})
            </button>
            <button
              className={`friends-tab ${activeTab === 'invitations' ? 'active' : ''}`}
              onClick={() => setActiveTab('invitations')}
            >
              Запрошення ({projectInvitations.length})
            </button>
            {selectedFriend && (
              <button
                className={`friends-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Чат
              </button>
            )}
          </div>

          {/* Messages */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Tab Content */}
          <div className="friends-content">
            {activeTab === 'friends' && (
              <div>
                <div className="add-friend-section">
                  <h3>Додати друга</h3>
                  <form onSubmit={handleAddFriend} className="add-friend-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Введіть ім'я користувача"
                      value={newFriendUsername}
                      onChange={(e) => setNewFriendUsername(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={addingFriend}>
                      {addingFriend ? 'Надсилання...' : 'Надіслати запит'}
                    </button>
                  </form>
                </div>

                <div className="friends-list">
                  <h3>Мої друзі</h3>
                  {friends.length === 0 ? (
                    <p className="empty-state">У вас поки немає друзів</p>
                  ) : (
                    friends.map((friendship) => {
                      // Determine which user is the "other person" (not current user)
                      const friend = friendship.user.id === currentUser?.id ? friendship.friend : friendship.user
                      return (
                        <div key={friendship.id} className="friend-item">
                          <div className="friend-avatar">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt={friend.username} />
                            ) : (
                              friend.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="friend-info">
                            <div className="friend-name">{friend.username}</div>
                            <div className="friend-email">{friend.email}</div>
                          </div>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleSelectFriend(friendship)}
                          >
                            Написати
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="friend-requests-list">
                <h3>Запити на дружбу</h3>
                {friendRequests.length === 0 ? (
                  <p className="empty-state">Немає нових запитів</p>
                ) : (
                  friendRequests.map((request) => (
                    <div key={request.id} className="friend-request-item">
                      <div className="friend-avatar">
                        {request.user.avatar_url ? (
                          <img src={request.user.avatar_url} alt={request.user.username} />
                        ) : (
                          request.user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{request.user.username}</div>
                        <div className="friend-email">{request.user.email}</div>
                      </div>
                      <div className="friend-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptFriend(request.id)}
                        >
                          Прийняти
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeclineFriend(request.id)}
                        >
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="invitations-list">
                <h3>Запрошення до проєктів</h3>
                {projectInvitations.length === 0 ? (
                  <p className="empty-state">Немає нових запрошень</p>
                ) : (
                  projectInvitations.map((invitation) => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <div className="invitation-title">{invitation.project.title}</div>
                        <div className="invitation-owner">
                          від {invitation.project.user.username}
                        </div>
                      </div>
                      <div className="invitation-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptInvitation(invitation.id)}
                        >
                          Прийняти
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeclineInvitation(invitation.id)}
                        >
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'chat' && selectedFriend && currentUser && (
              <div className="chat-container">
                <div className="chat-header">
                  <h3>
                    Чат з {selectedFriend.user.id === currentUser.id ? selectedFriend.friend.username : selectedFriend.user.username}
                  </h3>
                </div>
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <p className="empty-state">Поки немає повідомлень</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message ${msg.sender.id === currentUser.id ? 'message-sent' : 'message-received'}`}
                      >
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Введіть повідомлення..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sendingMessage}>
                    {sendingMessage ? 'Відправка...' : 'Надіслати'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
