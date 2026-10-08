import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading, Modal } from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel, StatCard } from '../../components/Ui'
import { formatDateTime, formatPackage } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

const STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED']

export default function AdminApplications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminApi.applications())
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

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = !status || row.status === status
      const matchesSearch =
        !term ||
        row.studentName?.toLowerCase().includes(term) ||
        row.companyName?.toLowerCase().includes(term) ||
        row.jobRole?.toLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [rows, status, search])

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Applications"
        subtitle="Read only oversight of every application across all companies."
        actions={<Link to="/admin/analytics" className="btn btn--secondary">Analytics</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total" value={rows.length} />
        {STATUSES.map((s) => (
          <StatCard key={s} label={s.replace(/_/g, ' ')} value={counts[s]} />
        ))}
      </div>

      <Panel
        title="All applications"
        actions={
          <>
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
            <input
              value={search}
              placeholder="Search student, company or role"
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search applications"
            />
          </>
        }
      >
        {loading && <Loading label="Loading applications..." />}

        {!loading && visible.length === 0 && (
          <EmptyState icon="📄" title="No applications match" />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Package</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.studentName}</strong>
                      <div className="small muted">{row.branch || '-'} &middot; CGPA {row.cgpa ?? '-'}</div>
                    </td>
                    <td>{row.jobRole}</td>
                    <td>{row.companyName}</td>
                    <td>{formatPackage(row.packageLpa)}</td>
                    <td style={{ minWidth: 130 }}><MatchBar value={row.matchPercentage} /></td>
                    <td><Badge>{row.status}</Badge></td>
                    <td>{formatDateTime(row.appliedAt)}</td>
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
          title={`${detail.studentName} — ${detail.jobRole}`}
          onClose={() => setDetail(null)}
        >
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.status}</Badge>
              <Badge tone="slate">{detail.companyName}</Badge>
              <Badge tone="slate">{formatPackage(detail.packageLpa)}</Badge>
            </div>

            <div>
              <h3>Match</h3>
              <MatchBar value={detail.matchPercentage} />
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {(detail.matchedSkillsList || []).map((skill) => (
                  <Chip key={skill} tone="green">{skill}</Chip>
                ))}
                {(detail.missingSkillsList || []).map((skill) => (
                  <Chip key={skill} tone="amber">{skill}</Chip>
                ))}
              </div>
            </div>

            <div className="kv-grid">
              <div className="kv">
                <div className="kv__label">Student email</div>
                <div className="kv__value">{detail.studentEmail}</div>
              </div>
              <div className="kv">
                <div className="kv__label">Graduation year</div>
                <div className="kv__value">{detail.graduationYear || '-'}</div>
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
                <h3>Candidate cover note</h3>
                <p>{detail.coverNote}</p>
              </div>
            )}

            <InfoBanner>
              Placement officers monitor outcomes. Status changes are made by the owning recruiter so the
              audit trail stays with the company.
            </InfoBanner>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
