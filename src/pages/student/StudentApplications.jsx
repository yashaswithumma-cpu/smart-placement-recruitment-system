import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import {
  EmptyState,
  ErrorBanner,
  InfoBanner,
  Loading,
  Modal,
} from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel, StatCard } from '../../components/Ui'
import { formatDateTime, formatPackage } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

const STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED']

const TIMELINE = {
  APPLIED: 'Application submitted',
  SHORTLISTED: 'Shortlisted by recruiter',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  SELECTED: 'Selected',
  REJECTED: 'Not selected',
}

export default function StudentApplications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await studentApi.applications())
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
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="My applications"
        subtitle="Every job you applied to, with recruiter decisions and match detail."
        actions={<Link to="/jobs" className="btn btn--primary">Browse jobs</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Shortlisted" value={counts.SHORTLISTED} />
        <StatCard label="Interviews" value={counts.INTERVIEW_SCHEDULED} />
        <StatCard label="Selected" value={counts.SELECTED} />
        <StatCard label="Rejected" value={counts.REJECTED} />
      </div>

      <Panel
        title="Application list"
        actions={
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        }
      >
        {loading && <Loading label="Loading applications..." />}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="📄"
            title={rows.length === 0 ? 'No applications yet' : 'Nothing matches this filter'}
            message={
              rows.length === 0
                ? 'Apply to a job from the browse page to start tracking it here.'
                : 'Try a different status filter.'
            }
            action={
              rows.length === 0 ? (
                <Link to="/jobs" className="btn btn--primary">Browse open jobs</Link>
              ) : (
                <button type="button" className="btn btn--secondary" onClick={() => setStatus('')}>
                  Clear filter
                </button>
              )
            }
          />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Match</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>{row.jobRole}</td>
                    <td>{row.companyName}</td>
                    <td style={{ minWidth: 140 }}><MatchBar value={row.matchPercentage} /></td>
                    <td>{formatDateTime(row.appliedAt)}</td>
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
        <Modal
          title={`${detail.jobRole} — ${detail.companyName}`}
          onClose={() => setDetail(null)}
          footer={
            <>
              <Link to="/interviews" className="btn btn--secondary">Interviews</Link>
              <Link to="/skill-gap" className="btn btn--primary">Improve my match</Link>
            </>
          }
        >
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.status}</Badge>
              <Badge tone="slate">{formatPackage(detail.packageLpa)}</Badge>
              {detail.location && <Badge tone="slate">{detail.location}</Badge>}
            </div>

            <div>
              <h3>Progress</h3>
              <p>{TIMELINE[detail.status] || detail.status}</p>
            </div>

            <div>
              <h3>Skill match</h3>
              <MatchBar value={detail.matchPercentage} />
              <div className="stack" style={{ marginTop: 10 }}>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <strong className="small">Matched</strong>
                  {(detail.matchedSkillsList || []).map((skill) => (
                    <Chip key={skill} tone="green">{skill}</Chip>
                  ))}
                  {(detail.matchedSkillsList || []).length === 0 && (
                    <span className="small muted">None yet</span>
                  )}
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <strong className="small">Missing</strong>
                  {(detail.missingSkillsList || []).map((skill) => (
                    <Chip key={skill} tone="amber">{skill}</Chip>
                  ))}
                  {(detail.missingSkillsList || []).length === 0 && (
                    <span className="small muted">Nothing missing</span>
                  )}
                </div>
              </div>
            </div>

            {detail.recruiterRemarks && (
              <div>
                <h3>Recruiter remarks</h3>
                <p>{detail.recruiterRemarks}</p>
              </div>
            )}

            {detail.coverNote && (
              <div>
                <h3>Your cover note</h3>
                <p>{detail.coverNote}</p>
              </div>
            )}

            <InfoBanner>
              Status updates also arrive as notifications, so you will not miss a recruiter decision.
            </InfoBanner>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
