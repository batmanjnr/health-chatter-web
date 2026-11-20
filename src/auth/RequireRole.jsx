import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { homeFor } from '../config/roles.js'

/* Guards a role's area. Wrong role → their own home; not signed in → login. */
export default function RequireRole({ role, children }) {
  const { user, pending, loading } = useAuth()
  const location = useLocation()

  if (loading) return null // restoring the session — don't bounce to login on refresh
  if (pending) return <Navigate to="/verify" replace />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.status === 'PENDING_VERIFICATION') return <Navigate to="/pending-verification" replace />
  if (user.role !== role) return <Navigate to="/unauthorized" replace state={{ home: homeFor(user.role) }} />
  return children
}
