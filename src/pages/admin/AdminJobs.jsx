import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import {
  EmptyState,
  ErrorBanner,
  Loading,
  Modal,
  SuccessBanner,
  WarningBanner,
} from '../../components/Feedback'
import { Badge, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatPackage, toList } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

export default function AdminJobs() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const status = params.get('status') || ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminApi.drives())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(
    () => ({
      PENDING: rows.filter((r) => r.approvalStatus === 'PENDING').length,
      APPROVED: rows.filter((r) => r.approvalStatus === 'APPROVED').length,
      REJECTED: rows.filter((r) => r.approvalStatus === 'REJECTED').length,
    }),
    [rows],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = !status || row.approvalStatus === status
      const matchesSearch =
        !term ||
        row.jobRole?.toLowerCase().includes(term) ||
        row.companyName?.toLowerCase().includes(term) ||
        (row.requiredSkills || '').toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [rows, status, search])

  const setStatus = (next) => {
    if (next) setParams({ status: next })
    else setParams({})
  }

  const approve = async (row) => {
    setError(null)
    setMessage('')
    try {
      await adminApi.approveDrive(row.id)
      setMessage(`${row.jobRole} at ${row.companyName} approved and is now visible to students.`)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  const reject = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminApi.rejectDrive(rejecting.id, reason.trim() || 'Not specified')
      setMessage(`${rejecting.jobRole} rejected.`)
      setRejecting(null)
      setReason('')
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Job posts"
        subtitle="Review every job post. Only approved, active posts appear in student job lists."
        actions={<Link to="/admin/reports" className="btn btn--secondary">Export CSV</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Pending" value={counts.PENDING} />
        <StatCard label="Approved" value={counts.APPROVED} />
        <StatCard label="Rejected" value={counts.REJECTED} />
      </div>

      <Panel
        title="All job posts"
        actions={
          <>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by approval status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              value={search}
              placeholder="Search role, company or skill"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search jobs"
            />
          </>
        }
      >
        {status === 'PENDING' && counts.PENDING > 0 && (
          <WarningBanner>
            {counts.PENDING} post(s) are waiting for review. Students cannot see them until approved.
          </WarningBanner>
        )}

        {loading && <Loading label="Loading job posts..." />}

        {!loading && visible.length === 0 && (
          <EmptyState icon="💼" title="No job posts match" />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Package</th>
                  <th>Min CGPA</th>
                  <th>Openings</th>
                  <th>Applications</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.jobRole}</strong>
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {toList(row.requiredSkills).slice(0, 3).map((skill) => (
                          <span className="chip chip--slate" key={skill}>{skill}</span>
                        ))}
                      </div>
                    </td>
                    <td>{row.companyName}</td>
                    <td>{formatPackage(row.packageLpa)}</td>
                    <td>{row.minimumCgpa ?? '-'}</td>
                    <td>{row.openings ?? '-'}</td>
                    <td>{row.applicationCount ?? 0}</td>
                    <td>{formatDate(row.lastDate)}</td>
                    <td>
                      <Badge>{row.approvalStatus}</Badge>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        {row.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => approve(row)}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => {
                                setRejecting(row)
                                setReason('')
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {row.approvalStatus === 'REJECTED' && (
                          <span className="small muted">{row.rejectionReason}</span>
                        )}
                        {row.approvalStatus === 'APPROVED' && (
                          <Link to="/admin/applications" className="btn btn--secondary btn--sm">
                            Applicants
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {rejecting && (
        <Modal
          title={`Reject ${rejecting.jobRole}`}
          onClose={() => !busy && setRejecting(null)}
          footer={
            <>
              <button type="submit" form="job-reject-form" className="btn btn--danger" disabled={busy}>
                {busy ? 'Saving...' : 'Confirm rejection'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setRejecting(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <form id="job-reject-form" onSubmit={reject}>
            <div className="stack">
              <p>
                {rejecting.companyName} will see this reason on their job post. They can edit and
                resubmit the post.
              </p>
              <div className="field">
                <label htmlFor="job-reject-reason">Reason</label>
                <textarea
                  id="job-reject-reason"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain what needs to change"
                  required
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
