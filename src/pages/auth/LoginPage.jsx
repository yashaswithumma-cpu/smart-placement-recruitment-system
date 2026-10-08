import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ErrorBanner } from '../../components/Feedback'

/**
 * Shared login screen. `endpoint` is the role specific login call so the three
 * portals stay visually identical without duplicating form logic.
 */
export default function LoginPage({ role, endpoint, title, lead, demo, homeRoute }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: demo?.email || '', password: demo?.password || '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const auth$ = await endpoint(form)
      auth.signIn(auth$)
      const from = location.state?.from
      navigate(from || homeRoute, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__logo">SP</div>
          <div>
            <strong>SmartPlacement</strong>
            <span>{role}</span>
          </div>
        </div>

        <h1>{title}</h1>
        <p className="auth-card__lead">{lead}</p>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <form onSubmit={submit} noValidate>
          <div className="form-grid form-grid--single">
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Your password"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Signing in...' : 'Login'}
            </button>
          </div>
        </form>

        {demo && (
          <div className="auth-demo">
            <b>Demo account</b>
            Email <code>{demo.email}</code>
            <br />
            Password <code>{demo.password}</code>
          </div>
        )}

        {role !== 'ADMIN' && (
          <p className="auth-links">
            Don&apos;t have an account?{' '}
            {role === 'STUDENT' ? (
              <Link to="/register">Create Account</Link>
            ) : (
              <Link to="/recruiter/register">Register as Recruiter</Link>
            )}
          </p>
        )}

        <p className="auth-links">
          {role !== 'STUDENT' && <Link to="/login">Student login</Link>}
          {role === 'STUDENT' && <Link to="/recruiter/login">Recruiter login</Link>}
          {role !== 'ADMIN' && <> &middot; <Link to="/admin/login">Admin login</Link></>}
        </p>
      </div>
    </div>
  )
}
