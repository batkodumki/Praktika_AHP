import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const response = await authAPI.getCurrentUser()
        setUser(response.data)
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    setLoading(false)
  }

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password })
    const { user, tokens } = response.data

    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)

    setUser(user)
    return user
  }

  const register = async (data) => {
    const response = await authAPI.register(data)
    const { user, tokens } = response.data

    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)

    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
