import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading, Modal, SuccessBanner } from '../../components/Feedback'
import { Badge, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatTime } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

const STATUSES = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']

export default function RecruiterInterviews() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)
  const [newStatus, setNewStatus] = useState('COMPLETED')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await recruiterApi.interviews())
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

  const openDetail = (row) => {
    setDetail(row)
    setNewStatus(row.status === 'SCHEDULED' ? 'COMPLETED' : row.status)
    setNotes(row.notes || '')
  }

  const saveStatus = async () => {
    setBusy(true)
    setError(null)
    try {
      await recruiterApi.updateInterviewStatus(detail.id, newStatus, notes.trim() || null)
      setMessage(`Interview for ${detail.studentName} marked ${newStatus}.`)
      setDetail(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    setBusy(true)
    setError(null)
    try {
      await recruiterApi.cancelInterview(detail.id)
      setMessage(`Interview for ${detail.studentName} cancelled.`)
      setDetail(null)
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
        title="Interviews"
        subtitle="Rounds you scheduled, with results and candidate details."
        actions={<Link to="/recruiter/applications" className="btn btn--secondary">Applications</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <div className="stat-grid stat-grid--compact">
        {STATUSES.map((s) => (
          <StatCard key={s} label={s.replace(/_/g, ' ')} value={counts[s]} />
        ))}
      </div>

      <Panel
        title="All interviews"
        actions={
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        }
      >
        {loading && <Loading label="Loading interviews..." />}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="🗓"
            title="No interviews yet"
            message="Shortlist an applicant first, then schedule their interview round."
            action={<Link to="/recruiter/applications" className="btn btn--primary">Go to applications</Link>}
          />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.scheduledDate)}</td>
                    <td>{formatTime(row.scheduledTime)}</td>
                    <td>
                      <strong>{row.studentName}</strong>
                      <div className="small muted">{row.branch || '-'}</div>
                    </td>
                    <td>{row.jobRole}</td>
                    <td>{row.mode || '-'}</td>
                    <td><Badge>{row.status}</Badge></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => openDetail(row)}
                      >
                        Manage
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
        <Modal
          title={`${detail.jobRole} — ${detail.studentName}`}
          onClose={() => !busy && setDetail(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={saveStatus}
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Save status'}
              </button>
              {['SCHEDULED', 'RESCHEDULED'].includes(detail.status) && (
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={cancel}
                  disabled={busy}
                >
                  Cancel interview
                </button>
              )}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setDetail(null)}
                disabled={busy}
              >
                Close
              </button>
            </>
          }
        >
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
            </dl>

            <div>
              <h3>Candidate</h3>
              <p>
                {detail.studentName} &middot; {detail.studentEmail} &middot; CGPA {detail.cgpa ?? '-'}
              </p>
            </div>

            {detail.meetingLink && (
              <div>
                <h3>Meeting link</h3>
                <a href={detail.meetingLink} target="_blank" rel="noreferrer">{detail.meetingLink}</a>
              </div>
            )}

            <div className="field">
              <label htmlFor="int-status">Status</label>
              <select
                id="int-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="int-notes">Notes / result</label>
              <textarea
                id="int-notes"
                value={notes}
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Round outcome shared with the student"
              />
            </div>

            <InfoBanner>
              Marking an interview as completed does not change the application status. Update the
              application separately after the final round.
            </InfoBanner>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
