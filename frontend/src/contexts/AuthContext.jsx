import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login/', { email, password })
    const { access, refresh, role, email: userEmail, full_name, user_id, must_change_password } = response.data

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)

    const userData = { id: user_id, email: userEmail, role, full_name, must_change_password }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    if (must_change_password) {
      toast('Please change your password to continue.', { icon: '🔐' })
    }

    if (role === 'consultant') {
      navigate('/consultant/dashboard')
    } else if (role === 'super_admin') {
      navigate('/super-admin/dashboard')
    } else if (role === 'accounts_division') {
      navigate('/accounts/dashboard')
    } else {
      navigate('/client/dashboard')
    }

    return userData
  }, [navigate])

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        await api.post('/auth/logout/', { refresh })
      }
    } catch {
      // ignore
    } finally {
      localStorage.clear()
      setUser(null)
      navigate('/login')
    }
  }, [navigate])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
