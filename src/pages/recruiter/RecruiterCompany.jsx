import { useCallback, useEffect, useState } from 'react'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading, SuccessBanner, WarningBanner } from '../../components/Feedback'
import { Badge, KeyValue, Panel } from '../../components/Ui'
import { formatDateTime } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

const EMPTY = {
  companyName: '',
  contactPerson: '',
  phone: '',
  website: '',
  industry: '',
  location: '',
  description: '',
}

export default function RecruiterCompany() {
  const [form, setForm] = useState(EMPTY)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recruiterApi.me()
      setProfile(data)
      setForm({
        companyName: data.companyName || '',
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        website: data.website || '',
        industry: data.industry || '',
        location: data.location || '',
        description: data.description || '',
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
      const updated = await recruiterApi.updateMe({
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim() || null,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      })
      setProfile(updated)
      setMessage('Company profile updated.')
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title="Company profile"
        subtitle="This information is shown to students on your job posts."
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      {loading && <Loading label="Loading your company..." />}

      {profile && (
        <div className="split">
          <Panel title="Company details">
            <form onSubmit={save} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="c-name">Company name</label>
                  <input id="c-name" value={form.companyName} onChange={set('companyName')} required />
                </div>
                <div className="field">
                  <label htmlFor="c-contact">Contact person</label>
                  <input id="c-contact" value={form.contactPerson} onChange={set('contactPerson')} />
                </div>
                <div className="field">
                  <label htmlFor="c-phone">Phone</label>
                  <input
                    id="c-phone"
                    value={form.phone}
                    onChange={set('phone')}
                    maxLength={10}
                    placeholder="10 digits"
                  />
                </div>
                <div className="field">
                  <label htmlFor="c-industry">Industry</label>
                  <input id="c-industry" value={form.industry} onChange={set('industry')} />
                </div>
                <div className="field">
                  <label htmlFor="c-location">Location</label>
                  <input id="c-location" value={form.location} onChange={set('location')} />
                </div>
                <div className="field">
                  <label htmlFor="c-website">Website</label>
                  <input
                    id="c-website"
                    value={form.website}
                    onChange={set('website')}
                    placeholder="https://"
                  />
                </div>
                <div className="field field--full">
                  <label htmlFor="c-description">About the company</label>
                  <textarea
                    id="c-description"
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Role, culture, tech stack, internship conversion"
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
            <Panel title="Account status">
              <div className="stack">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <Badge tone={profile.approved ? 'green' : 'amber'}>
                    {profile.approvalStatus || (profile.approved ? 'APPROVED' : 'PENDING')}
                  </Badge>
                </div>
                {!profile.approved && (
                  <WarningBanner>
                    Your account needs placement officer approval before students can see your jobs.
                  </WarningBanner>
                )}
                <div className="kv-grid">
                  <KeyValue label="Email" value={profile.email} />
                  <KeyValue label="Jobs posted" value={profile.jobsPosted} />
                  <KeyValue label="Applications received" value={profile.applicationsReceived} />
                  <KeyValue label="Registered" value={formatDateTime(profile.createdAt)} />
                  {profile.approvedAt && (
                    <KeyValue label="Approved" value={formatDateTime(profile.approvedAt)} />
                  )}
                </div>
                {profile.rejectionReason && (
                  <InfoBanner>Previous rejection reason: {profile.rejectionReason}</InfoBanner>
                )}
              </div>
            </Panel>

            <InfoBanner>
              Email is your login id. Contact the placement office if you need it changed.
            </InfoBanner>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
