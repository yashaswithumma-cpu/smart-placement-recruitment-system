import { useCallback, useEffect, useState } from 'react'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import {
  EmptyState,
  ErrorBanner,
  InfoBanner,
  Loading,
  Modal,
  SuccessBanner,
  WarningBanner,
} from '../../components/Feedback'
import { Badge, Chip, Panel } from '../../components/Ui'
import TagInput from '../../components/TagInput'
import { formatDate, formatPackage, toList } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

const JOB_TYPES = ['FULL_TIME', 'INTERNSHIP', 'PART_TIME']

const emptyForm = () => ({
  jobRole: '',
  description: '',
  requiredSkills: '',
  minimumCgpa: '',
  eligibleBranch: '',
  packageLpa: '',
  location: '',
  jobType: 'FULL_TIME',
  lastDate: '',
  openings: '',
  active: true,
})

/** The backend rejects past deadlines, so default to a week out. */
function defaultDeadline() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export default function RecruiterJobs() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recruiterApi.myDrives()
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm({ ...emptyForm(), lastDate: defaultDeadline() })
    setEditing('new')
  }

  const openEdit = (job) => {
    setForm({
      jobRole: job.jobRole || '',
      description: job.description || '',
      requiredSkills: job.requiredSkills || '',
      minimumCgpa: job.minimumCgpa ?? '',
      eligibleBranch: job.eligibleBranch || '',
      packageLpa: job.packageLpa ?? '',
      location: job.location || '',
      jobType: job.jobType || 'FULL_TIME',
      lastDate: job.lastDate || '',
      openings: job.openings ?? '',
      active: job.active ?? true,
    })
    setEditing(job.id)
  }

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const payload = () => ({
    jobRole: form.jobRole.trim(),
    description: form.description.trim() || null,
    requiredSkills: form.requiredSkills.trim(),
    minimumCgpa: form.minimumCgpa === '' ? null : Number(form.minimumCgpa),
    eligibleBranch: form.eligibleBranch.trim() || null,
    packageLpa: form.packageLpa === '' ? null : Number(form.packageLpa),
    location: form.location.trim() || null,
    jobType: form.jobType,
    lastDate: form.lastDate,
    openings: form.openings === '' ? null : Number(form.openings),
    active: Boolean(form.active),
  })

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (editing === 'new') {
        await recruiterApi.createDrive(payload())
        setMessage('Job submitted for placement officer approval.')
      } else {
        await recruiterApi.updateDrive(editing, payload())
        setMessage('Job updated.')
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await recruiterApi.deleteDrive(confirmDelete.id)
      setMessage(`Removed ${confirmDelete.jobRole}.`)
      setConfirmDelete(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title="My jobs"
        subtitle="Every job post you own, with its placement officer approval state."
        actions={
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            Post a job
          </button>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      {loading && <Loading label="Loading your jobs..." />}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon="💼"
          title="No job posts yet"
          message="Post your first role. It becomes visible to students after placement officer approval."
          action={
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              Post a job
            </button>
          }
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Role</th>
                <th>Company</th>
                <th>Location</th>
                <th>Package</th>
                <th>Min CGPA</th>
                <th>Branch</th>
                <th>Openings</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.jobRole}</strong>
                    <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {toList(job.requiredSkills).slice(0, 3).map((skill) => (
                        <Chip key={skill} tone="slate">{skill}</Chip>
                      ))}
                    </div>
                  </td>
                  <td>{job.companyName || '-'}</td>
                  <td>{job.location || '-'}</td>
                  <td>{formatPackage(job.packageLpa)}</td>
                  <td>{job.minimumCgpa ?? '-'}</td>
                  <td>{job.eligibleBranch || 'All'}</td>
                  <td>{job.openings ?? '-'}</td>
                  <td>{formatDate(job.lastDate)}</td>
                  <td><Badge>{job.approvalStatus}</Badge></td>
                  <td><Badge tone={job.active ? 'green' : 'slate'}>{job.active ? 'Active' : 'Closed'}</Badge></td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => openEdit(job)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => setConfirmDelete(job)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.some((job) => job.approvalStatus === 'PENDING') && (
        <InfoBanner>
          Pending jobs are not visible to students. The placement office reviews each post before it opens.
        </InfoBanner>
      )}
      {rows.some((job) => job.rejectionReason) && (
        <WarningBanner>
          {rows.find((job) => job.rejectionReason).jobRole} was rejected:{' '}
          {rows.find((job) => job.rejectionReason).rejectionReason}
        </WarningBanner>
      )}

      {editing !== null && (
        <Modal
          title={editing === 'new' ? 'Post a new job' : 'Edit job'}
          onClose={() => !busy && setEditing(null)}
          wide
          footer={
            <>
              <button type="submit" form="job-form" className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving...' : editing === 'new' ? 'Submit for approval' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <form id="job-form" onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="j-role">Job role *</label>
                <input
                  id="j-role"
                  value={form.jobRole}
                  onChange={set('jobRole')}
                  placeholder="Backend Developer"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="j-type">Job type</label>
                <select id="j-type" value={form.jobType} onChange={set('jobType')}>
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="field field--full">
                <TagInput
                  label="Required skills *"
                  value={form.requiredSkills}
                  onChange={(value) => setForm((prev) => ({ ...prev, requiredSkills: value }))}
                  placeholder="Type a skill and press Enter"
                  hint="These drive the eligibility and skill match engines."
                />
              </div>
              <div className="field">
                <label htmlFor="j-cgpa">Minimum CGPA</label>
                <input
                  id="j-cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.minimumCgpa}
                  onChange={set('minimumCgpa')}
                />
              </div>
              <div className="field">
                <label htmlFor="j-branch">Eligible branch</label>
                <select
                  id="j-branch"
                  value={form.eligibleBranch}
                  onChange={set('eligibleBranch')}
                >
                  <option value="">All branches</option>
                  {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'BCA', 'MCA', 'BBA', 'MBA'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="j-package">Package (LPA)</label>
                <input
                  id="j-package"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.packageLpa}
                  onChange={set('packageLpa')}
                />
              </div>
              <div className="field">
                <label htmlFor="j-location">Location</label>
                <input id="j-location" value={form.location} onChange={set('location')} />
              </div>
              <div className="field">
                <label htmlFor="j-openings">Openings</label>
                <input
                  id="j-openings"
                  type="number"
                  min="1"
                  value={form.openings}
                  onChange={set('openings')}
                />
              </div>
              <div className="field">
                <label htmlFor="j-deadline">Last date to apply *</label>
                <input
                  id="j-deadline"
                  type="date"
                  min={defaultDeadline()}
                  value={form.lastDate}
                  onChange={set('lastDate')}
                  required
                />
                <span className="field__hint">Cannot be in the past.</span>
              </div>
              <div className="field field--full">
                <label htmlFor="j-description">Job description</label>
                <textarea
                  id="j-description"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Responsibilities, eligibility, interview process"
                />
              </div>
              <div className="field field--full">
                <label className="check-inline">
                  <input type="checkbox" checked={form.active} onChange={set('active')} />
                  Accept applications
                </label>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Delete job"
          onClose={() => !busy && setConfirmDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--danger"
                onClick={remove}
                disabled={busy}
              >
                {busy ? 'Deleting...' : 'Delete permanently'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <p>
            Delete <strong>{confirmDelete.jobRole}</strong>? Applications for this job are kept, but the
            post disappears from the portal.
          </p>
        </Modal>
      )}
    </DashboardLayout>
  )
}
