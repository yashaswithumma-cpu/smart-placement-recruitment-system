import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, Loading, Modal } from '../../components/Feedback'
import { Badge, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatTime } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

const UPCOMING = ['SCHEDULED', 'RESCHEDULED']
const PAST = ['COMPLETED', 'CANCELLED']

export default function StudentInterviews() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await studentApi.interviews())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { upcoming, past } = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const key = (i) => `${i.scheduledDate || ''}T${i.scheduledTime || ''}`
      return key(a).localeCompare(key(b))
    })
    return {
      upcoming: sorted.filter((i) => UPCOMING.includes(i.status)),
      past: sorted.filter((i) => PAST.includes(i.status)),
    }
  }, [rows])

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="My interviews"
        subtitle="Scheduled rounds, meeting links and outcomes shared by recruiters."
        actions={<Link to="/applications" className="btn btn--secondary">My applications</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Completed" value={past.filter((i) => i.status === 'COMPLETED').length} />
        <StatCard label="Cancelled" value={past.filter((i) => i.status === 'CANCELLED').length} />
      </div>

      {loading && <Loading label="Loading interviews..." />}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon="🗓"
          title="No interviews scheduled"
          message="Interviews appear here once a recruiter schedules a round for one of your applications."
          action={<Link to="/applications" className="btn btn--primary">View my applications</Link>}
        />
      )}

      {!loading && upcoming.length > 0 && (
        <Panel title="Upcoming interviews">
          <div className="stack">
            {upcoming.map((item) => (
              <article className="interview-card" key={item.id}>
                <div className="interview-card__when">
                  <b>{formatDate(item.scheduledDate)}</b>
                  <span>{formatTime(item.scheduledTime)}</span>
                </div>
                <div className="interview-card__body">
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <strong>{item.jobRole}</strong>
                    <Badge tone="blue">{item.status}</Badge>
                    {item.round && <Badge tone="slate">Round {item.round}</Badge>}
                    {item.mode && <Badge tone="violet">{item.mode}</Badge>}
                  </div>
                  <p className="muted small">{item.companyName}</p>
                  {item.location && <p className="small">{item.location}</p>}
                </div>
                <div className="interview-card__actions">
                  {item.meetingLink && (
                    <a
                      className="btn btn--primary btn--sm"
                      href={item.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => setDetail(item)}
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      {!loading && past.length > 0 && (
        <Panel title="Past interviews">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.scheduledDate)} {formatTime(item.scheduledTime)}</td>
                    <td>{item.jobRole}</td>
                    <td>{item.companyName}</td>
                    <td>{item.mode || '-'}</td>
                    <td><Badge>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {detail && (
        <Modal
          title={`${detail.jobRole} — ${detail.companyName}`}
          onClose={() => setDetail(null)}
          footer={
            detail.meetingLink ? (
              <a
                className="btn btn--primary"
                href={detail.meetingLink}
                target="_blank"
                rel="noreferrer"
              >
                Join meeting
              </a>
            ) : null
          }
        >
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.status}</Badge>
              <Badge tone="violet">{detail.mode}</Badge>
              {detail.round && <Badge tone="slate">Round {detail.round}</Badge>}
            </div>
            <dl className="job-card__meta">
              <div><dt>Date</dt><dd>{formatDate(detail.scheduledDate)}</dd></div>
              <div><dt>Time</dt><dd>{formatTime(detail.scheduledTime)}</dd></div>
              <div><dt>Location</dt><dd>{detail.location || 'Online'}</dd></div>
            </dl>
            {detail.meetingLink && (
              <div>
                <h3>Meeting link</h3>
                <p className="small">{detail.meetingLink}</p>
              </div>
            )}
            {detail.notes && (
              <div>
                <h3>Notes from recruiter</h3>
                <p>{detail.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
