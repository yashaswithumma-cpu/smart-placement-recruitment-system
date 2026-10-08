import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, Loading, Modal } from '../../components/Feedback'
import { Badge, BarChart, KeyValue, Panel, StatCard } from '../../components/Ui'
import { formatDate, formatPackage } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

const STATUSES = ['PLACED', 'OFFERED', 'RESIGNED']

export default function AdminPlacements() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminApi.placements())
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

  const byCompany = useMemo(() => {
    const map = {}
    rows
      .filter((row) => row.status === 'PLACED')
      .forEach((row) => {
        map[row.companyName] = (map[row.companyName] || 0) + 1
      })
    return map
  }, [rows])

  const avgPackage = useMemo(() => {
    const placed = rows.filter((row) => row.status === 'PLACED' && row.packageLpa != null)
    if (!placed.length) return 0
    return placed.reduce((sum, row) => sum + Number(row.packageLpa), 0) / placed.length
  }, [rows])

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Placements"
        subtitle="Final outcomes per student, created automatically when a recruiter selects an applicant."
        actions={<Link to="/admin/reports" className="btn btn--secondary">Export CSV</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total records" value={rows.length} />
        {STATUSES.map((s) => (
          <StatCard key={s} label={s} value={counts[s]} />
        ))}
        <StatCard label="Avg package" value={`${avgPackage.toFixed(2)} LPA`} hint="Placed only" />
      </div>

      <div className="split">
        <Panel
          title="Placement records"
          actions={
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          }
        >
          {loading && <Loading label="Loading placements..." />}

          {!loading && visible.length === 0 && (
            <EmptyState
              icon="🏆"
              title="No placements recorded"
              message="A placement record is created when a recruiter marks an application as selected."
            />
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
                    <th>Date</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.studentName}</strong>
                        <div className="small muted">
                          {row.branch || '-'} &middot; CGPA {row.cgpa ?? '-'}
                        </div>
                      </td>
                      <td>{row.jobRole}</td>
                      <td>{row.companyName}</td>
                      <td>{formatPackage(row.packageLpa)}</td>
                      <td>{formatDate(row.placementDate)}</td>
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

        <Panel title="Placements by company" subtitle="Hiring partners by placed student count">
          <BarChart data={byCompany} emptyLabel="No placements yet" />
        </Panel>
      </div>

      {detail && (
        <Modal title={detail.studentName} onClose={() => setDetail(null)}>
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.status}</Badge>
              <Badge tone="slate">{formatPackage(detail.packageLpa)}</Badge>
            </div>
            <div className="kv-grid">
              <KeyValue label="Role" value={detail.jobRole} />
              <KeyValue label="Company" value={detail.companyName} />
              <KeyValue label="Branch" value={detail.branch} />
              <KeyValue label="CGPA" value={detail.cgpa} />
              <KeyValue label="Graduation year" value={detail.graduationYear} />
              <KeyValue label="Placement date" value={formatDate(detail.placementDate)} />
              <KeyValue label="Application" value={`#${detail.applicationId}`} />
              <KeyValue label="Student email" value={detail.studentEmail} />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
