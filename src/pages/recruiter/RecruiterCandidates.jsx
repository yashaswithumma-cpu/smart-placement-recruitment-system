import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { openAuthenticatedFile } from '../../api/client'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading, Modal } from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel } from '../../components/Ui'
import { formatDateTime, toList } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

const EMPTY = { search: '', branch: '', minMatch: '', status: '', resumeOnly: false }

export default function RecruiterCandidates() {
  const [rows, setRows] = useState([])
  const [drives, setDrives] = useState([])
  const [filters, setFilters] = useState(EMPTY)
  const [driveId, setDriveId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [all, myDrives] = await Promise.all([
        recruiterApi.candidates(),
        recruiterApi.myDrives(),
      ])
      setRows(Array.isArray(all) ? all : [])
      setDrives(Array.isArray(myDrives) ? myDrives : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const useDriveFilter = async (id) => {
    setDriveId(id)
    if (!id) {
      await load()
      return
    }
    setLoading(true)
    setError(null)
    try {
      setRows(await recruiterApi.candidatesForDrive(id))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const branches = useMemo(
    () => [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort(),
    [rows],
  )

  const visible = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const minMatch = Number(filters.minMatch || 0)
    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.studentName?.toLowerCase().includes(search) ||
        row.studentEmail?.toLowerCase().includes(search) ||
        (row.skills || '').toLowerCase().includes(search)
      const matchesBranch = !filters.branch || row.branch === filters.branch
      const matchesMatch = !minMatch || Number(row.matchPercentage || 0) >= minMatch
      const matchesStatus = !filters.status || row.applicationStatus === filters.status
      const matchesResume = !filters.resumeOnly || row.resumeUploaded
      return matchesSearch && matchesBranch && matchesMatch && matchesStatus && matchesResume
    })
  }, [rows, filters])

  const statuses = useMemo(
    () => [...new Set(rows.map((r) => r.applicationStatus).filter(Boolean))].sort(),
    [rows],
  )

  return (
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title="Candidates"
        subtitle="Students who applied to your jobs, with their skill match and resume."
        actions={<Link to="/recruiter/applications" className="btn btn--secondary">Shortlist applicants</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <Panel title="Filters">
        <div className="form-grid form-grid--filters">
          <div className="field">
            <label htmlFor="c-search">Search</label>
            <input
              id="c-search"
              value={filters.search}
              placeholder="Name, email or skill"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="c-drive">Job</label>
            <select id="c-drive" value={driveId} onChange={(e) => useDriveFilter(e.target.value)}>
              <option value="">All my jobs</option>
              {drives.map((job) => (
                <option key={job.id} value={job.id}>{job.jobRole}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-branch">Branch</label>
            <select
              id="c-branch"
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="c-match">Min match %</label>
            <input
              id="c-match"
              type="number"
              min="0"
              max="100"
              value={filters.minMatch}
              onChange={(e) => setFilters({ ...filters, minMatch: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="c-status">Application status</label>
            <select
              id="c-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="check-inline">
              <input
                type="checkbox"
                checked={filters.resumeOnly}
                onChange={(e) => setFilters({ ...filters, resumeOnly: e.target.checked })}
              />
              Resume uploaded only
            </label>
          </div>
        </div>
        <p className="small muted">{visible.length} candidate(s)</p>
      </Panel>

      {loading && <Loading label="Loading candidates..." />}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon="👥"
          title="No candidates match these filters"
          message="Candidates appear here once students apply to one of your approved jobs."
          action={
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setFilters(EMPTY)
                useDriveFilter('')
              }}
            >
              Clear filters
            </button>
          }
        />
      )}

      {!loading && visible.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Match</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={`${row.applicationId}-${row.studentId}`}>
                  <td>
                    <strong>{row.studentName}</strong>
                    <div className="small muted">{row.studentEmail}</div>
                  </td>
                  <td>{row.branch || '-'}</td>
                  <td>{row.cgpa ?? '-'}</td>
                  <td style={{ minWidth: 140 }}><MatchBar value={row.matchPercentage} /></td>
                  <td><Badge>{row.applicationStatus}</Badge></td>
                  <td>
                    {row.resumeUploaded ? (
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() =>
                          openAuthenticatedFile(recruiterApi.downloadCandidateResume(row.studentId))
                        }
                      >
                        Download
                      </button>
                    ) : (
                      <span className="small muted">Not uploaded</span>
                    )}
                  </td>
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

      {detail && (
        <Modal title={detail.studentName} onClose={() => setDetail(null)}>
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{detail.applicationStatus}</Badge>
              <Badge tone="slate">Application #{detail.applicationId}</Badge>
            </div>

            <MatchBar value={detail.matchPercentage} />

            <div>
              <h3>Academic</h3>
              <p>
                {detail.branch || 'Branch not set'} &middot; CGPA {detail.cgpa ?? '-'} &middot;
                graduation {detail.graduationYear || '-'}
              </p>
            </div>

            <div>
              <h3>Skills</h3>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {toList(detail.skills).map((skill) => (
                  <Chip
                    key={skill}
                    tone={(detail.matchedSkills || []).includes(skill) ? 'green' : 'slate'}
                  >
                    {skill}
                  </Chip>
                ))}
                {toList(detail.skills).length === 0 && (
                  <span className="small muted">No skills on the student profile.</span>
                )}
              </div>
            </div>

            {(detail.missingSkills || []).length > 0 && (
              <div>
                <h3>Missing for this role</h3>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {detail.missingSkills.map((skill) => (
                    <Chip key={skill} tone="amber">{skill}</Chip>
                  ))}
                </div>
              </div>
            )}

            <InfoBanner>
              Move this candidate forward from the applications page to update status or schedule an
              interview.
            </InfoBanner>

            {detail.resumeUploaded && (
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() =>
                    openAuthenticatedFile(recruiterApi.downloadCandidateResume(detail.studentId))
                  }
                >
                  Download resume
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
