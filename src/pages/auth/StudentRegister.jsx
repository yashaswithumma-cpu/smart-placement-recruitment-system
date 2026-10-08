import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { authApi } from '../../api/endpoints'
import { ErrorBanner, SuccessBanner } from '../../components/Feedback'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  branch: '',
  cgpa: '',
  graduationYear: '',
  rollNumber: '',
}

export default function StudentRegister() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const validate = () => {
    const next = {}
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!PASSWORD_RULE.test(form.password)) {
      next.password = 'At least 8 characters with a letter, a number and a special character'
    }
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.trim())) next.phone = 'Phone must be 10 digits'
    if (form.cgpa !== '') {
      const cgpa = Number(form.cgpa)
      if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) next.cgpa = 'CGPA must be between 0 and 10'
    }
    if (form.graduationYear !== '') {
      const year = Number(form.graduationYear)
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        next.graduationYear = 'Enter a valid graduation year'
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setInfo('')
    if (!validate()) return

    setBusy(true)
    try {
      await authApi.registerStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null,
        branch: form.branch.trim() || null,
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        graduationYear: form.graduationYear === '' ? null : Number(form.graduationYear),
        rollNumber: form.rollNumber.trim() || null,
      })
      const login = await authApi.loginStudent({ email: form.email.trim(), password: form.password })
      auth.signIn(login)
      navigate('/dashboard', { replace: true })
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
            <span>Student registration</span>
          </div>
        </div>

        <h1>Create your student account</h1>
        <p className="auth-card__lead">
          Academic details power the eligibility engine. You can add or edit them later from your profile.
        </p>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <SuccessBanner message={info} />

        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="reg-name">Full name *</label>
              <input id="reg-name" value={form.name} onChange={set('name')} required />
              {errors.name && <span className="field__error">{errors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-email">Email *</label>
              <input id="reg-email" type="email" value={form.email} onChange={set('email')} required />
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password *</label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
              />
              {errors.password && <span className="field__error">{errors.password}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-phone">Phone</label>
              <input id="reg-phone" value={form.phone} onChange={set('phone')} maxLength={10} />
              {errors.phone && <span className="field__error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-branch">Branch</label>
              <select id="reg-branch" value={form.branch} onChange={set('branch')}>
                <option value="">Select branch</option>
                {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'BCA', 'MCA', 'BBA', 'MBA', 'Other'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reg-cgpa">CGPA (out of 10)</label>
              <input
                id="reg-cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={form.cgpa}
                onChange={set('cgpa')}
              />
              {errors.cgpa && <span className="field__error">{errors.cgpa}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-year">Graduation year</label>
              <input
                id="reg-year"
                type="number"
                min="2000"
                max="2100"
                value={form.graduationYear}
                onChange={set('graduationYear')}
              />
              {errors.graduationYear && <span className="field__error">{errors.graduationYear}</span>}
            </div>
            <div className="field">
              <label htmlFor="reg-roll">Roll number</label>
              <input id="reg-roll" value={form.rollNumber} onChange={set('rollNumber')} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Creating account...' : 'Register'}
            </button>
            <Link to="/login" className="btn btn--secondary">I already have an account</Link>
          </div>
        </form>

        <p className="auth-links">
          <Link to="/recruiter/register">Register as a company</Link> &middot;{' '}
          <Link to="/admin/login">Admin login</Link>
        </p>
      </div>
    </div>
  )
}
