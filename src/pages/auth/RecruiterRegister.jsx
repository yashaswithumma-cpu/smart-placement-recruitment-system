import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { authApi } from '../../api/endpoints'
import { ErrorBanner, WarningBanner } from '../../components/Feedback'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const EMPTY = {
  companyName: '',
  email: '',
  password: '',
  contactPerson: '',
  phone: '',
  website: '',
  industry: '',
  location: '',
  description: '',
}

export default function RecruiterRegister() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const validate = () => {
    const next = {}
    if (form.companyName.trim().length < 2) next.companyName = 'Company name is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!PASSWORD_RULE.test(form.password)) {
      next.password = 'At least 8 characters with a letter, a number and a special character'
    }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.trim())) next.phone = 'Phone must be 10 digits'
    if (form.website && !/^https?:\/\/.+/i.test(form.website.trim())) {
      next.website = 'Website must start with http:// or https://'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    if (!validate()) return

    setBusy(true)
    try {
      await authApi.registerRecruiter({
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        password: form.password,
        contactPerson: form.contactPerson.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      })
      await authApi.loginRecruiter({ email: form.email.trim(), password: form.password })
      .then((response) => {
        auth.signIn(response)
        navigate('/recruiter/dashboard', { replace: true })
      })
      .catch(() => {
        navigate('/recruiter/login', { replace: true, state: { registered: true } })
      })
    } catch (err) {
      if (err?.fieldErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(err.fieldErrors).map(([field, message]) => [
              field.charAt(0).toLowerCase() + field.slice(1),
              message,
            ]),
          ),
        )
      }
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <div className="auth-brand__logo">SP</div>
          <div>
            <strong>SmartPlacement</strong>
            <span>Company registration</span>
          </div>
        </div>

        <h1>Register your company</h1>
        <p className="auth-card__lead">
          Create a recruiter account to post campus jobs and manage applicants.
        </p>

        <WarningBanner>
          New recruiter accounts need placement officer approval before they can post jobs.
        </WarningBanner>
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rec-company">Company name *</label>
              <input id="rec-company" value={form.companyName} onChange={set('companyName')} required />
              {errors.companyName && <span className="field__error">{errors.companyName}</span>}
            </div>
            <div className="field">
              <label htmlFor="rec-contact">Contact person</label>
              <input id="rec-contact" value={form.contactPerson} onChange={set('contactPerson')} />
            </div>
            <div className="field">
              <label htmlFor="rec-email">Email *</label>
              <input id="rec-email" type="email" value={form.email} onChange={set('email')} required />
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="rec-password">Password *</label>
              <input
                id="rec-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
              />
              {errors.password && <span className="field__error">{errors.password}</span>}
            </div>
            <div className="field">
              <label htmlFor="rec-phone">Phone</label>
              <input id="rec-phone" value={form.phone} onChange={set('phone')} maxLength={10} />
              {errors.phone && <span className="field__error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="rec-industry">Industry</label>
              <input id="rec-industry" value={form.industry} onChange={set('industry')} />
            </div>
            <div className="field">
              <label htmlFor="rec-location">Location</label>
              <input id="rec-location" value={form.location} onChange={set('location')} />
            </div>
            <div className="field">
              <label htmlFor="rec-website">Website</label>
              <input
                id="rec-website"
                value={form.website}
                onChange={set('website')}
                placeholder="https://"
              />
              {errors.website && <span className="field__error">{errors.website}</span>}
            </div>
            <div className="field field--full">
              <label htmlFor="rec-description">Company description</label>
              <textarea
                id="rec-description"
                value={form.description}
                onChange={set('description')}
                placeholder="Tell students what your company does and what they can expect."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Submitting...' : 'Register company'}
            </button>
            <Link to="/recruiter/login" className="btn btn--secondary">I already have an account</Link>
          </div>
        </form>

        <p className="auth-links">
          <Link to="/register">Student registration</Link> &middot;{' '}
          <Link to="/admin/login">Admin login</Link>
        </p>
      </div>
    </div>
  )
}
