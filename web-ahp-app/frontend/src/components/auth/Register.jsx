import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      await register(formData)
      navigate('/dashboard')
    } catch (err) {
      setErrors(err.response?.data || { general: 'Не вдалося зареєструватися' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Попарне порівняння МАІ</h1>
          <h2 className="auth-subtitle">Створіть свій обліковий запис</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="alert alert-error">{errors.general}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ім'я</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Прізвище</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ім'я користувача *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
            />
            {errors.username && (
              <div className="form-error">{errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Електронна пошта *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <div className="form-error">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            {errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Підтвердження пароля *</label>
            <input
              type="password"
              name="password_confirm"
              className="form-input"
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />
            {errors.password_confirm && (
              <div className="form-error">{errors.password_confirm}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Створення облікового запису...' : 'Зареєструватися'}
          </button>
        </form>

        <div className="auth-footer">
          Вже є обліковий запис?{' '}
          <Link to="/login" className="auth-link">Увійти</Link>
        </div>
      </div>
    </div>
  )
}
