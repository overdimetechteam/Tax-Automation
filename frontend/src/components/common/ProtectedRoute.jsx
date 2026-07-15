import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function defaultRedirect(role) {
  if (role === 'consultant') return '/consultant/dashboard'
  if (role === 'super_admin') return '/super-admin/dashboard'
  if (role === 'accounts_division') return '/accounts/dashboard'
  return '/client/dashboard'
}

export default function ProtectedRoute({ role, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  const allowedRoles = roles || (role ? [role] : null)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRedirect(user.role)} replace />
  }

  return <Outlet />
}
