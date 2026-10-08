import { useState } from 'react'
import { Link } from 'react-router-dom'
import { reportApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, SuccessBanner } from '../../components/Feedback'
import { Panel } from '../../components/Ui'
import { ADMIN_NAV } from '../navigation'

const REPORTS = [
  {
    key: 'students',
    title: 'Students',
    description: 'Every student with academic details, skills, resume flag and profile completeness.',
    run: () => reportApi.studentsCsv(),
  },
  {
    key: 'recruiters',
    title: 'Recruiters',
    description: 'All company accounts with contact details and approval status.',
    run: () => reportApi.recruitersCsv(),
  },
  {
    key: 'jobs',
    title: 'Job posts',
    description: 'Every drive with requirements, package, openings, deadline and approval state.',
    run: () => reportApi.jobsCsv(),
  },
  {
    key: 'applications',
    title: 'Applications',
    description: 'Full application table with match percentage, matched and missing skills.',
    run: () => reportApi.applicationsCsv(),
  },
  {
    key: 'placements',
    title: 'Placements',
    description: 'Final placement records with company, package, date and status.',
    run: () => reportApi.placementsCsv(),
  },
]

export default function AdminReports() {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  const download = async (report) => {
    setBusy(report.key)
    setError(null)
    setMessage('')
    try {
      await report.run()
      setMessage(`${report.title} CSV downloaded.`)
    } catch (err) {
      setError(err)
    } finally {
      setBusy('')
    }
  }

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Reports"
        subtitle="Full institution exports, restricted to the placement office role."
        actions={<Link to="/admin/analytics" className="btn btn--secondary">Analytics</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <div className="report-grid">
        {REPORTS.map((report) => (
          <article className="report-card" key={report.key}>
            <h3>{report.title}</h3>
            <p className="muted small">{report.description}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => download(report)}
              disabled={busy === report.key}
            >
              {busy === report.key ? 'Preparing...' : 'Download CSV'}
            </button>
          </article>
        ))}
      </div>

      <Panel title="About these exports">
        <InfoBanner>
          Files are generated server side with RFC 4180 escaping and downloaded through an authenticated
          request, so the JWT is never exposed in the browser URL.
        </InfoBanner>
      </Panel>
    </DashboardLayout>
  )
}
