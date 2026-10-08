import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, Loading } from '../../components/Feedback'
import { BarChart, Panel, StatCard } from '../../components/Ui'
import { formatPercent } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminApi.analytics())
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
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Analytics"
        subtitle="Aggregated placement metrics computed directly from the transactional data."
        actions={
          <>
            <button type="button" className="btn btn--secondary" onClick={load}>Refresh</button>
            <Link to="/admin/reports" className="btn btn--primary">Export CSV</Link>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Computing analytics..." />}

      {data && (
        <>
          <div className="stat-grid">
            <StatCard label="Students" value={data.totalStudents} hint={`${data.activeStudents} active`} />
            <StatCard label="Recruiters" value={data.totalRecruiters} hint={`${data.approvedRecruiters} approved`} />
            <StatCard label="Jobs" value={data.totalJobs} hint={`${data.approvedJobs} approved`} />
            <StatCard label="Applications" value={data.totalApplications} hint="All time" />
            <StatCard label="Interviews" value={data.interviews} hint="Rounds run" />
            <StatCard label="Placements" value={data.placements} hint={`${formatPercent(data.placementRate)} rate`} />
          </div>

          <div className="split">
            <Panel title="Pipeline outcome" subtitle="Counts by application status">
              <BarChart data={data.applicationsByStatus} emptyLabel="No applications yet" />
            </Panel>

            <Panel title="Branch demand" subtitle="Applications by branch">
              <BarChart data={data.applicationsByBranch} emptyLabel="No applications yet" />
            </Panel>
          </div>

          <div className="split">
            <Panel title="Top recruiters" subtitle="Placements by company">
              <BarChart data={data.placementsByCompany} emptyLabel="No placements yet" />
            </Panel>

            <Panel title="Quality metrics">
              <div className="stat-grid stat-grid--compact">
                <StatCard label="Placement rate" value={formatPercent(data.placementRate)} />
                <StatCard label="Avg package" value={`${Number(data.averagePackage || 0).toFixed(2)} LPA`} />
                <StatCard label="Avg match" value={formatPercent(data.averageMatchPercentage)} />
                <StatCard label="Shortlisted" value={data.shortlisted} />
                <StatCard label="Selected" value={data.selected} />
                <StatCard label="Rejected" value={data.rejected} />
                <StatCard label="Interviews scheduled" value={data.interviewScheduled} />
                <StatCard label="Pending recruiters" value={data.pendingRecruiters} />
                <StatCard label="Pending jobs" value={data.pendingJobs} />
                <StatCard label="Rejected jobs" value={data.rejectedJobs} />
                <StatCard label="Total openings" value={data.totalOpenings} />
              </div>
            </Panel>
          </div>

          <InfoBanner>
            Every metric here maps to the same aggregates used by the dashboard and the CSV exports, so
            the three views always agree.
          </InfoBanner>
        </>
      )}
    </DashboardLayout>
  )
}
