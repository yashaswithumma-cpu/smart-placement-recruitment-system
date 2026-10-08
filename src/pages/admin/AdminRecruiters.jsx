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
import { Badge, KeyValue, Panel } from '../../components/Ui'
import { formatDateTime } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

export default function AdminRecruiters() {
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
      setRows(await adminApi.recruiters(status || undefined))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (row) =>
        row.companyName?.toLowerCase().includes(term) ||
        row.email?.toLowerCase().includes(term) ||
        row.contactPerson?.toLowerCase().includes(term),
    )
  }, [rows, search])

  const counts = useMemo(
    () => ({
      PENDING: rows.filter((r) => r.approvalStatus === 'PENDING').length,
      APPROVED: rows.filter((r) => r.approvalStatus === 'APPROVED').length,
      REJECTED: rows.filter((r) => r.approvalStatus === 'REJECTED').length,
    }),
    [rows],
  )

  const setStatus = (next) => {
    if (next) setParams({ status: next })
    else setParams({})
  }

  const approve = async (row) => {
    setError(null)
    setMessage('')
    try {
      await adminApi.approveRecruiter(row.id)
      setMessage(`${row.companyName} approved.`)
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
      await adminApi.rejectRecruiter(rejecting.id, reason.trim() || 'Not specified')
      setMessage(`${rejecting.companyName} rejected.`)
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
        title="Recruiters"
        subtitle="Approve or reject company accounts. Approved recruiters can post jobs."
        actions={<Link to="/admin/reports" className="btn btn--secondary">Export CSV</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <Panel
        title="Company accounts"
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
              placeholder="Search company or email"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search recruiters"
            />
          </>
        }
      >
        {status === 'PENDING' && counts.PENDING > 0 && (
          <WarningBanner>
            {counts.PENDING} account(s) are waiting for a decision. Recruiters cannot post jobs until
            approved.
          </WarningBanner>
        )}

        {loading && <Loading label="Loading recruiters..." />}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="🏢"
            title="No recruiters found"
            message={status ? `No ${status.toLowerCase()} accounts.` : 'No companies registered yet.'}
          />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Industry</th>
                  <th>Jobs</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.companyName}</strong>
                      <div className="small muted">{row.email}</div>
                    </td>
                    <td>
                      {row.contactPerson || '-'}
                      {row.phone && <div className="small muted">{row.phone}</div>}
                    </td>
                    <td>{row.industry || '-'}</td>
                    <td>{row.jobsPosted}</td>
                    <td><Badge>{row.approvalStatus}</Badge></td>
                    <td>{formatDateTime(row.createdAt)}</td>
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
                        {row.approvalStatus === 'APPROVED' && (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                              setRejecting(row)
                              setReason('')
                            }}
                          >
                            Revoke
                          </button>
                        )}
                        {row.approvalStatus === 'REJECTED' && (
                          <span className="small muted">{row.rejectionReason}</span>
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
          title={`${rejecting.approvalStatus === 'APPROVED' ? 'Revoke' : 'Reject'} ${rejecting.companyName}`}
          onClose={() => !busy && setRejecting(null)}
          footer={
            <>
              <button
                type="submit"
                form="reject-form"
                className="btn btn--danger"
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Confirm'}
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
          <form id="reject-form" onSubmit={reject}>
            <div className="stack">
              <p>
                The recruiter is notified with this reason. Existing job posts stop being visible to
                students once the account is not approved.
              </p>
              <div className="field">
                <label htmlFor="reject-reason">Reason</label>
                <textarea
                  id="reject-reason"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain the decision"
                  required
                />
              </div>
              <div className="kv-grid">
                <KeyValue label="Email" value={rejecting.email} />
                <KeyValue label="Jobs posted" value={rejecting.jobsPosted} />
                <KeyValue label="Applications" value={rejecting.applicationsReceived} />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
