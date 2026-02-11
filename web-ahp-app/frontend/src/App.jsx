import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import ComparisonWorkflow from './components/ComparisonWorkflow'
import ProjectSettings from './components/ProjectSettings'
import AggregatedResults from './components/AggregatedResults'
import Friends from './components/Friends'
import './App.css'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" /> : children
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/project/:id" element={
                <PrivateRoute>
                  <ProjectDetail />
                </PrivateRoute>
              } />
              <Route path="/project/:id/compare" element={
                <PrivateRoute>
                  <ComparisonWorkflow />
                </PrivateRoute>
              } />
              <Route path="/project/:id/settings" element={
                <PrivateRoute>
                  <ProjectSettings />
                </PrivateRoute>
              } />
              <Route path="/project/:id/aggregated" element={
                <PrivateRoute>
                  <AggregatedResults />
                </PrivateRoute>
              } />
              <Route path="/friends" element={
                <PrivateRoute>
                  <Friends />
                </PrivateRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  )
}

export default App
