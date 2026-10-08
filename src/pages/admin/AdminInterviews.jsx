import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, Loading, Modal } from '../../components/Feedback'
import { Badge, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatTime } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

const STATUSES = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']

export default function AdminInterviews() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminApi.interviews())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s, 0]))
    rows.forEach((row) => {
      if (row.status in map) map[row.status] += 1
    })
    return map
  }, [rows])

  const visible = useMemo(
    () => (status ? rows.filter((row) => row.status === status) : rows),
    [rows, status],
  )

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Interviews"
        subtitle="Institution wide view of every scheduled and completed round."
        actions={<Link to="/admin/analytics" className="btn btn--secondary">Analytics</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="stat-grid stat-grid--compact">
        {STATUSES.map((s) => (
          <StatCard key={s} label={s.replace(/_/g, ' ')} value={counts[s]} />
        ))}
      </div>

      <Panel
        title="All interviews"
        actions={
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        }
      >
        {loading && <Loading label="Loading interviews..." />}

        {!loading && visible.length === 0 && (
          <EmptyState icon="🗓" title="No interviews match" />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {formatDate(row.scheduledDate)}
                      <div className="small muted">{formatTime(row.scheduledTime)}</div>
                    </td>
                    <td>
                      <strong>{row.studentName}</strong>
                      <div className="small muted">{row.branch || '-'}</div>
                    </td>
                    <td>{row.jobRole}</td>
                    <td>{row.companyName}</td>
                    <td>{row.mode || '-'}</td>
                    <td><Badge>{row.status}</Badge></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => setDetail(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {detail && (
        <Modal title={`${detail.jobRole} — ${detail.studentName}`} onClose={() => setDetail(null)}>
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.status}</Badge>
              <Badge tone="slate">{detail.mode}</Badge>
              {detail.round && <Badge tone="slate">Round {detail.round}</Badge>}
              {detail.applicationStatus && <Badge tone="blue">{detail.applicationStatus}</Badge>}
            </div>

            <dl className="job-card__meta">
              <div><dt>Date</dt><dd>{formatDate(detail.scheduledDate)}</dd></div>
              <div><dt>Time</dt><dd>{formatTime(detail.scheduledTime)}</dd></div>
              <div><dt>Location</dt><dd>{detail.location || 'Online'}</dd></div>
              <div><dt>Company</dt><dd>{detail.companyName}</dd></div>
            </dl>

            <div>
              <h3>Candidate</h3>
              <p>
                {detail.studentName} &middot; {detail.studentEmail} &middot; CGPA {detail.cgpa ?? '-'}
              </p>
            </div>

            {detail.notes && (
              <div>
                <h3>Recruiter notes</h3>
                <p>{detail.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
