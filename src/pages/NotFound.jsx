import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const HOME = {
  STUDENT: '/dashboard',
  RECRUITER: '/recruiter/dashboard',
  ADMIN: '/admin/dashboard',
}

export default function NotFound() {
  const auth = useAuth()
  const location = useLocation()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__logo">SP</div>
          <div>
            <strong>SmartPlacement</strong>
            <span>Page not found</span>
          </div>
        </div>

        <h1>404</h1>
        <p className="auth-card__lead">
          No screen exists at <code>{location.pathname}</code>.
        </p>

        <div className="form-actions">
          {auth.isAuthenticated ? (
            <Link to={HOME[auth.role] || '/'} className="btn btn--primary">
              Back to my dashboard
            </Link>
          ) : (
            <>
              <Link to="/" className="btn btn--primary">Go to the home page</Link>
              <Link to="/login" className="btn btn--secondary">Student login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
