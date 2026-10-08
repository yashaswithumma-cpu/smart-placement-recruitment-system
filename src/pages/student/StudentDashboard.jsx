import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import { useAuth } from '../../auth/AuthProvider'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading, WarningBanner } from '../../components/Feedback'
import { Badge, KeyValue, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatPackage, formatPercent } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

export default function StudentDashboard() {
  const auth = useAuth()
  const [data, setData] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboard, applications] = await Promise.all([
        studentApi.dashboard(),
        studentApi.applications(),
      ])
      setData(dashboard)
      setRecent(applications.slice(0, 5))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title={`Welcome back, ${auth.name || 'student'}`}
        subtitle="Your placement journey at a glance."
        actions={
          <>
            <Link to="/jobs" className="btn btn--primary">Browse jobs</Link>
            <Link to="/profile" className="btn btn--secondary">Update profile</Link>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Loading your dashboard..." />}

      {data && (
        <>
          {data.profileCompleted ? (
            <div className="hero">
              <div>
                <h2>Profile complete</h2>
                <p>
                  Your eligibility, skill match and recommendations are calculated from{' '}
                  {data.totalSkills} skill(s) and {data.totalInterests} interest(s).
                </p>
              </div>
              <div className="hero__badge">
                <b>{formatPercent(data.averageMatchPercentage)}</b>
                <span>Avg skill match</span>
              </div>
            </div>
          ) : (
            <WarningBanner>
              Your profile is incomplete. Add branch, CGPA, graduation year, skills and interests so the
              eligibility and recommendation engines work for you.{' '}
              <Link to="/profile">Complete profile</Link>
            </WarningBanner>
          )}

          {!data.resumeUploaded && (
            <InfoBanner>
              No resume uploaded yet. Recruiters can only see candidates who shared a resume.{' '}
              <Link to="/profile">Upload resume</Link>
            </InfoBanner>
          )}

          <div className="stat-grid">
            <StatCard label="Open jobs" value={data.availableJobs} hint="Approved & accepting" />
            <StatCard label="Recommended" value={data.recommendedJobs} hint="Matched to your profile" />
            <StatCard label="Applications" value={data.totalApplications} hint="Submitted so far" />
            <StatCard label="Shortlisted" value={data.shortlisted} hint="Moved forward" />
            <StatCard label="Interviews" value={data.interviews} hint="Scheduled rounds" />
            <StatCard label="Unread alerts" value={data.unreadNotifications} hint="Notifications waiting" />
          </div>

          <div className="split">
            <Panel
              title="Recent applications"
              subtitle="Your five most recent submissions"
              actions={<Link to="/applications" className="btn btn--secondary btn--sm">View all</Link>}
            >
              {recent.length === 0 ? (
                <p className="muted small">
                  You have not applied to any job yet.{' '}
                  <Link to="/jobs">Browse open jobs</Link> to get started.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Job</th>
                        <th>Company</th>
                        <th>Match</th>
                        <th>Applied</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((app) => (
                        <tr key={app.id}>
                          <td>{app.jobRole}</td>
                          <td>{app.companyName}</td>
                          <td className="numeric">{formatPercent(app.matchPercentage)}</td>
                          <td>{formatDate(app.appliedAt)}</td>
                          <td><Badge>{app.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <div className="stack">
              <Panel title="Academic snapshot">
                <div className="kv-grid">
                  <KeyValue label="Branch" value={data.branch || 'Not set'} />
                  <KeyValue label="CGPA" value={data.cgpa ?? 'Not set'} />
                  <KeyValue label="Graduation year" value={data.graduationYear || 'Not set'} />
                  <KeyValue label="Resume" value={data.resumeUploaded ? 'Uploaded' : 'Missing'} />
                </div>
              </Panel>

              <Panel title="Placement status">
                <div className="stack">
                  <div className="row">
                    <Badge>{data.placementStatus || 'NOT_PLACED'}</Badge>
                    {data.placedCompany && <span className="small muted">{data.placedCompany}</span>}
                  </div>
                  {data.placedPackage && (
                    <KeyValue label="Package" value={formatPackage(data.placedPackage)} />
                  )}
                  <KeyValue label="Selected" value={data.selected} />
                  <KeyValue label="Rejected" value={data.rejected} />
                </div>
              </Panel>

              <Panel title="Quick links">
                <div className="stack">
                  <Link to="/recommendations" className="btn btn--secondary btn--block">
                    See recommended jobs
                  </Link>
                  <Link to="/skill-gap" className="btn btn--secondary btn--block">
                    Analyse my skill gap
                  </Link>
                  <Link to="/learning" className="btn btn--secondary btn--block">
                    Learning suggestions
                  </Link>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
