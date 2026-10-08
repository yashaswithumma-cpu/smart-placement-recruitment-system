import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import { openAuthenticatedFile } from '../../api/client'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading, SuccessBanner, WarningBanner } from '../../components/Feedback'
import { KeyValue, Panel } from '../../components/Ui'
import TagInput from '../../components/TagInput'
import { formatDateTime } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

const MAX_RESUME_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await studentApi.me()
      setProfile(data)
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        branch: data.branch || '',
        cgpa: data.cgpa ?? '',
        graduationYear: data.graduationYear ?? '',
        rollNumber: data.rollNumber || '',
        linkedInUrl: data.linkedInUrl || '',
        skills: data.skillsCsv || '',
        interests: data.interestsCsv || '',
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage('')
    try {
      const updated = await studentApi.updateMe({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        branch: form.branch.trim() || null,
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        graduationYear: form.graduationYear === '' ? null : Number(form.graduationYear),
        rollNumber: form.rollNumber.trim() || null,
        linkedInUrl: form.linkedInUrl.trim() || null,
        skills: form.skills.trim(),
        interests: form.interests.trim(),
      })
      setProfile(updated)
      setMessage('Profile saved. Recommendations are recalculated immediately.')
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const uploadResume = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    setMessage('')

    const extension = String(file.name).split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError(new Error('Only PDF, DOC and DOCX resumes are allowed.'))
      event.target.value = ''
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError(new Error('File size exceeds the 5MB limit.'))
      event.target.value = ''
      return
    }

    setUploading(true)
    try {
      const updated = await studentApi.uploadResume(file)
      setProfile(updated)
      setMessage('Resume uploaded successfully.')
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="My profile"
        subtitle="These details drive eligibility, skill matching and recommendations."
        actions={<Link to="/recommendations" className="btn btn--secondary">View recommendations</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      {loading && <Loading label="Loading your profile..." />}

      {profile && form && (
        <div className="split">
          <Panel title="Personal & academic details">
            <form onSubmit={save} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="p-name">Full name</label>
                  <input id="p-name" value={form.name} onChange={set('name')} required />
                </div>
                <div className="field">
                  <label htmlFor="p-email">Email</label>
                  <input id="p-email" value={profile.email} disabled />
                  <span className="field__hint">Email is your login id and cannot be changed here.</span>
                </div>
                <div className="field">
                  <label htmlFor="p-phone">Phone</label>
                  <input id="p-phone" value={form.phone} onChange={set('phone')} maxLength={10} />
                </div>
                <div className="field">
                  <label htmlFor="p-roll">Roll number</label>
                  <input id="p-roll" value={form.rollNumber} onChange={set('rollNumber')} />
                </div>
                <div className="field">
                  <label htmlFor="p-branch">Branch</label>
                  <select id="p-branch" value={form.branch} onChange={set('branch')}>
                    <option value="">Select branch</option>
                    {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'BCA', 'MCA', 'BBA', 'MBA', 'Other'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="p-cgpa">CGPA (out of 10)</label>
                  <input
                    id="p-cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={form.cgpa}
                    onChange={set('cgpa')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="p-year">Graduation year</label>
                  <input
                    id="p-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={form.graduationYear}
                    onChange={set('graduationYear')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="p-linkedin">LinkedIn URL</label>
                  <input
                    id="p-linkedin"
                    value={form.linkedInUrl}
                    onChange={set('linkedInUrl')}
                    placeholder="https://www.linkedin.com/in/..."
                  />
                </div>
                <div className="field field--full">
                  <TagInput
                    label="Skills"
                    value={form.skills}
                    onChange={(value) => setForm({ ...form, skills: value })}
                    placeholder="Type a skill and press Enter (e.g. Java)"
                    hint="Used for skill matching against job requirements."
                  />
                </div>
                <div className="field field--full">
                  <TagInput
                    label="Interests"
                    value={form.interests}
                    onChange={(value) => setForm({ ...form, interests: value })}
                    placeholder="Type an interest and press Enter (e.g. Backend)"
                    hint="30% of the recommendation score comes from interest alignment."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
                <button type="button" className="btn btn--secondary" onClick={load} disabled={saving}>
                  Reset
                </button>
              </div>
            </form>
          </Panel>

          <div className="stack">
            <Panel title="Resume">
              {profile.resumeUploaded ? (
                <>
                  <div className="kv-grid">
                    <KeyValue label="File" value={profile.resumeFileName} />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => openAuthenticatedFile(studentApi.viewResume())}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => openAuthenticatedFile(studentApi.downloadResume())}
                    >
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <WarningBanner>No resume uploaded yet. Recruiters filter on resume availability.</WarningBanner>
              )}

              <hr className="divider" />

              <div className="field">
                <label htmlFor="resume-file">Upload a new resume</label>
                <input
                  id="resume-file"
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={uploadResume}
                  disabled={uploading}
                />
                <span className="field__hint">PDF, DOC or DOCX. Maximum 5MB.</span>
              </div>
              {uploading && <p className="small muted">Uploading...</p>}
            </Panel>

            <Panel title="Account summary">
              <div className="kv-grid">
                <KeyValue label="Student id" value={profile.id} />
                <KeyValue label="Status" value={profile.active ? 'Active' : 'Deactivated'} />
                <KeyValue
                  label="Profile"
                  value={profile.profileCompleted ? 'Complete' : 'Incomplete'}
                />
                <KeyValue label="Applications" value={profile.applicationCount} />
                <KeyValue label="Placement" value={profile.placementStatus || 'NOT_PLACED'} />
                <KeyValue label="Registered" value={formatDateTime(profile.createdAt)} />
              </div>
            </Panel>

            {!profile.profileCompleted && (
              <InfoBanner>
                The eligibility engine needs branch, CGPA, graduation year, skills and interests
                before it can match you to jobs.
              </InfoBanner>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
