import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const ROLE_HOME = {
  STUDENT: '/dashboard',
  RECRUITER: '/recruiter/dashboard',
  ADMIN: '/admin/dashboard',
}

/**
 * Route guard. Sends anonymous visitors to the login screen of the role they
 * were trying to reach, and authenticated users of the wrong role back to their
 * own home screen.
 */
export default function ProtectedRoute({ role, children }) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.isAuthenticated) {
    const loginPath = role === 'ADMIN' ? '/admin/login'
      : role === 'RECRUITER' ? '/recruiter/login'
        : '/login'
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (role && auth.role !== role) {
    return <Navigate to={ROLE_HOME[auth.role] || '/login'} replace />
  }

  return children
}

/** Keeps a signed in user away from the login / register screens. */
export function GuestRoute({ children }) {
  const auth = useAuth()
  if (auth.isAuthenticated) {
    return <Navigate to={ROLE_HOME[auth.role] || '/login'} replace />
  }
  return children
}
