import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading, WarningBanner } from '../../components/Feedback'
import { Badge, BarChart, Panel, StatCard } from '../../components/Ui'
import { formatPercent } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

export default function RecruiterDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await recruiterApi.dashboard())
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
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title={data?.companyName ? `${data.companyName} dashboard` : 'Recruiter dashboard'}
        subtitle="Your hiring pipeline at a glance."
        actions={<Link to="/recruiter/jobs" className="btn btn--primary">Post a job</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Loading your pipeline..." />}

      {data && !data.approved && (
        <WarningBanner>
          Your company account is awaiting placement officer approval. You can prepare job posts, but
          students will not see them until they are approved.
        </WarningBanner>
      )}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Jobs posted" value={data.jobsPosted} hint={`${data.approvedJobs} approved`} />
            <StatCard label="Pending approval" value={data.pendingJobs} hint="Awaiting review" />
            <StatCard label="Applications" value={data.applicationsReceived} hint="All drives" />
            <StatCard label="Shortlisted" value={data.shortlisted} hint="Moved to next stage" />
            <StatCard label="Interviews" value={data.interviews} hint="Rounds scheduled" />
            <StatCard label="Placements" value={data.placements} hint="Offers accepted" />
          </div>

          <div className="split">
            <Panel title="Application pipeline" subtitle="Counts by stage">
              <BarChart
                data={Object.fromEntries((data.pipeline || []).map((s) => [s.stage, s.count]))}
                emptyLabel="No applications received yet"
              />
            </Panel>

            <div className="stack">
              <Panel title="Selection summary">
                <div className="stat-grid stat-grid--compact">
                  <StatCard label="Selected" value={data.selected} />
                  <StatCard label="Rejected" value={data.rejected} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <span className="small muted">Average candidate match</span>
                  <p style={{ fontSize: 26, fontWeight: 700 }}>
                    {formatPercent(data.averageMatchPercentage)}
                  </p>
                </div>
              </Panel>

              <Panel title="Next actions">
                <div className="stack">
                  <Link to="/recruiter/jobs" className="btn btn--secondary btn--block">
                    Review my job posts
                  </Link>
                  <Link to="/recruiter/candidates" className="btn btn--secondary btn--block">
                    Browse candidates
                  </Link>
                  <Link to="/recruiter/applications" className="btn btn--secondary btn--block">
                    Shortlist applicants
                  </Link>
                </div>
              </Panel>

              {data.approved && (
                <InfoBanner>
                  Your account is approved, so students can see and apply to your job posts.
                </InfoBanner>
              )}
              {!data.approved && (
                <Panel title="Approval status">
                  <Badge tone="amber">Pending</Badge>
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
