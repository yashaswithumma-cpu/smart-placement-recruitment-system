import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading, WarningBanner } from '../../components/Feedback'
import { BarChart, Panel, StatCard } from '../../components/Ui'
import { formatPercent } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminApi.dashboard())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pendingRecruiters = data?.pendingRecruiters || 0
  const pendingJobs = data?.pendingJobs || 0

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Placement dashboard"
        subtitle="Institution wide placement activity, approvals and outcomes."
        actions={
          <>
            <Link to="/admin/recruiters" className="btn btn--primary">Review recruiters</Link>
            <Link to="/admin/reports" className="btn btn--secondary">Reports</Link>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Loading placement analytics..." />}

      {data && (
        <>
          {(pendingRecruiters > 0 || pendingJobs > 0) && (
            <WarningBanner>
              {pendingRecruiters > 0 && (
                <>
                  <Link to="/admin/recruiters?status=PENDING">
                    {pendingRecruiters} recruiter account{pendingRecruiters === 1 ? '' : 's'}
                  </Link>{' '}
                  awaiting approval.{' '}
                </>
              )}
              {pendingJobs > 0 && (
                <>
                  <Link to="/admin/jobs?status=PENDING">
                    {pendingJobs} job post{pendingJobs === 1 ? '' : 's'}
                  </Link>{' '}
                  awaiting review.
                </>
              )}
            </WarningBanner>
          )}

          <div className="stat-grid">
            <StatCard label="Students" value={data.totalStudents} hint={`${data.activeStudents} active`} />
            <StatCard
              label="Recruiters"
              value={data.totalRecruiters}
              hint={`${data.approvedRecruiters} approved`}
            />
            <StatCard label="Jobs" value={data.totalJobs} hint={`${data.approvedJobs} approved`} />
            <StatCard label="Applications" value={data.totalApplications} hint="All time" />
            <StatCard label="Interviews" value={data.interviews} hint="Rounds conducted" />
            <StatCard label="Placements" value={data.placements} hint={`${formatPercent(data.placementRate)} rate`} />
          </div>

          <div className="split">
            <Panel title="Applications by status" subtitle="Where the pipeline currently sits">
              <BarChart data={data.applicationsByStatus} emptyLabel="No applications yet" />
            </Panel>

            <Panel title="Applications by branch" subtitle="Demand across departments">
              <BarChart data={data.applicationsByBranch} emptyLabel="No applications yet" />
            </Panel>
          </div>

          <div className="split">
            <Panel title="Placements by company" subtitle="Top hiring partners">
              <BarChart data={data.placementsByCompany} emptyLabel="No placements recorded yet" />
            </Panel>

            <div className="stack">
              <Panel title="Placement quality">
                <div className="stat-grid stat-grid--compact">
                  <StatCard label="Avg package" value={`${Number(data.averagePackage || 0).toFixed(2)} LPA`} />
                  <StatCard label="Avg match" value={formatPercent(data.averageMatchPercentage)} />
                  <StatCard label="Shortlisted" value={data.shortlisted} />
                  <StatCard label="Selected" value={data.selected} />
                  <StatCard label="Rejected" value={data.rejected} />
                  <StatCard label="Openings" value={data.totalOpenings} />
                </div>
              </Panel>

              <InfoBanner>
                All figures come from the deterministic aggregation queries in the backend, so they match
                the CSV exports exactly.
              </InfoBanner>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
