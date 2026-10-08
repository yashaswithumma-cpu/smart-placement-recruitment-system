import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { ErrorBanner, InfoBanner, SuccessBanner } from '../../components/Feedback'
import { Panel } from '../../components/Ui'
import { RECRUITER_NAV } from '../navigation'

const REPORTS = [
  {
    key: 'jobs',
    title: 'My job posts',
    description: 'Every drive you own with its approval status, openings and deadline.',
    run: () => recruiterApi.reports.jobs(),
  },
  {
    key: 'applications',
    title: 'Applications',
    description: 'All applicants across your jobs with match percentage and current status.',
    run: () => recruiterApi.reports.applications(),
  },
  {
    key: 'candidates',
    title: 'Candidates',
    description: 'One row per unique candidate with skills, latest match and resume availability.',
    run: () => recruiterApi.reports.candidates(),
  },
  {
    key: 'placements',
    title: 'Placements',
    description: 'Placement records tied to your jobs, with package and placement date.',
    run: () => recruiterApi.reports.placements(),
  },
]

export default function RecruiterReports() {
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
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title="Reports"
        subtitle="CSV exports limited to your own jobs, applicants and placements."
        actions={<Link to="/recruiter/dashboard" className="btn btn--secondary">Dashboard</Link>}
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
          Each file is generated on the server with RFC 4180 escaping. A recruiter export never
          contains another company's data.
        </InfoBanner>
      </Panel>
    </DashboardLayout>
  )
}
