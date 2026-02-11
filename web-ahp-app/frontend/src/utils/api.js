import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data
          localStorage.setItem('access_token', access)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getCurrentUser: () => api.get('/auth/user/'),
  updateUser: (data) => api.patch('/auth/user/update/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

// Invitation endpoints
export const invitationAPI = {
  getPending: () => api.get('/invitations/'),
  accept: (id) => api.post(`/invitations/${id}/accept/`),
  decline: (id) => api.post(`/invitations/${id}/decline/`),
}

// Friends endpoints
export const friendsAPI = {
  getFriends: () => api.get('/friends/'),
  getRequests: () => api.get('/friends/requests/'),
  sendRequest: (username) => api.post('/friends/send/', { username }),
  acceptRequest: (id) => api.post(`/friends/${id}/accept/`),
  declineRequest: (id) => api.post(`/friends/${id}/decline/`),
}

// Messages endpoints
export const messagesAPI = {
  getMessages: (userId) => api.get(`/messages/${userId}/`),
  sendMessage: (userId, content) => api.post(`/messages/${userId}/send/`, { content }),
  getUnreadCount: () => api.get('/messages/unread/'),
}

// Project endpoints
export const projectAPI = {
  list: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  addComparison: (id, data) => api.post(`/projects/${id}/add_comparison/`, data),
  deleteComparison: (id, data) => api.delete(`/projects/${id}/delete_comparison/`, { data }),
  calculateResults: (id) => api.post(`/projects/${id}/calculate_results/`),

  // Collaboration endpoints
  enableCollaboration: (id, enabled) => api.post(`/projects/${id}/enable_collaboration/`, { enabled }),
  inviteCollaborators: (id, data) => api.post(`/projects/${id}/invite_collaborators/`, data),
  getCollaborators: (id) => api.get(`/projects/${id}/collaborators/`),
  getCollaborationStatus: (id) => api.get(`/projects/${id}/collaboration_status/`),
  getMyProgress: (id) => api.get(`/projects/${id}/my_progress/`),
  markCompleted: (id) => api.post(`/projects/${id}/mark_completed/`),
  aggregate: (id, method) => api.post(`/projects/${id}/aggregate/`, { method }),
  getAggregatedResults: (id) => api.get(`/projects/${id}/aggregated_results/`),
}

export default api
