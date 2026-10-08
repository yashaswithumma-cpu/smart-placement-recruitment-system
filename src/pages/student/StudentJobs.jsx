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
  WarningBanner,
} from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel } from '../../components/Ui'
import { formatDate, formatPackage, formatPercent } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

const EMPTY_FILTERS = { search: '', branch: '', packageMin: '', sort: 'match' }

export default function StudentJobs() {
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detail, setDetail] = useState(null)
  const [applyFor, setApplyFor] = useState(null)
  const [coverNote, setCoverNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setJobs(await studentApi.jobs(true))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const branches = useMemo(
    () => [...new Set(jobs.map((job) => job.eligibleBranch).filter(Boolean))].sort(),
    [jobs],
  )

  const visible = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    const minPackage = Number(filters.packageMin || 0)

    const filtered = jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.jobRole?.toLowerCase().includes(search) ||
        job.companyName?.toLowerCase().includes(search) ||
        (job.requiredSkills || '').toLowerCase().includes(search)
      const matchesBranch = !filters.branch || job.eligibleBranch === filters.branch
      const matchesPackage = !minPackage || Number(job.packageLpa || 0) >= minPackage
      return matchesSearch && matchesBranch && matchesPackage
    })

    const sorted = [...filtered]
    if (filters.sort === 'package') {
      sorted.sort((a, b) => Number(b.packageLpa || 0) - Number(a.packageLpa || 0))
    } else if (filters.sort === 'deadline') {
      sorted.sort((a, b) => String(a.lastDate || '').localeCompare(String(b.lastDate || '')))
    } else {
      sorted.sort((a, b) => Number(b.matchPercentage || 0) - Number(a.matchPercentage || 0))
    }
    return sorted
  }, [jobs, filters])

  const eligibleCount = visible.filter((job) => job.eligible).length

  const apply = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await studentApi.apply({ driveId: applyFor.id, coverNote: coverNote.trim() || null })
      setMessage(`Applied to ${applyFor.jobRole} at ${applyFor.companyName}.`)
      setApplyFor(null)
      setCoverNote('')
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="Browse jobs"
        subtitle="Eligibility and skill match are calculated on the backend for every open job."
        actions={<Link to="/recommendations" className="btn btn--secondary">Recommended for me</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      {message && <div className="alert alert--success">{message}</div>}

      <Panel title="Filters">
        <div className="form-grid form-grid--filters">
          <div className="field">
            <label htmlFor="f-search">Search</label>
            <input
              id="f-search"
              value={filters.search}
              placeholder="Role, company or skill"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="f-branch">Eligible branch</label>
            <select
              id="f-branch"
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
            <label htmlFor="f-package">Min package (LPA)</label>
            <input
              id="f-package"
              type="number"
              step="0.5"
              min="0"
              value={filters.packageMin}
              onChange={(e) => setFilters({ ...filters, packageMin: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="f-sort">Sort by</label>
            <select
              id="f-sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="match">Skill match</option>
              <option value="package">Package</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
        </div>
        <p className="small muted">
          {visible.length} open job(s) &middot; {eligibleCount} matching your eligibility criteria
        </p>
      </Panel>

      {loading && <Loading label="Loading open jobs..." />}

      {!loading && visible.length === 0 && (
        <EmptyState
          icon="💼"
          title="No jobs match these filters"
          message="Try clearing the filters or check back once recruiters post new drives."
          action={
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear filters
            </button>
          }
        />
      )}

      <div className="job-grid">
        {visible.map((job) => (
          <article className="job-card" key={job.id}>
            <div className="job-card__head">
              <div>
                <h3>{job.jobRole}</h3>
                <p className="muted small">{job.companyName}</p>
              </div>
              <span className="job-card__package">{formatPackage(job.packageLpa)}</span>
            </div>

            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge tone={job.eligible ? 'green' : 'red'}>
                {job.eligible ? 'Eligible' : 'Not eligible'}
              </Badge>
              {job.jobType && <Badge tone="slate">{job.jobType}</Badge>}
              {job.location && <Badge tone="slate">{job.location}</Badge>}
              {job.openings ? <Badge tone="blue">{job.openings} openings</Badge> : null}
            </div>

            <div className="job-card__match">
              <span className="small muted">Skill match</span>
              <MatchBar value={job.matchPercentage} />
            </div>

            <div className="job-card__skills">
              {(job.matchedSkills || []).slice(0, 5).map((skill) => (
                <Chip key={skill} tone="green">{skill}</Chip>
              ))}
              {(job.missingSkills || []).slice(0, 4).map((skill) => (
                <Chip key={skill} tone="amber">+{skill}</Chip>
              ))}
            </div>

            <dl className="job-card__meta">
              <div><dt>Min CGPA</dt><dd>{job.minimumCgpa ?? '-'}</dd></div>
              <div><dt>Branch</dt><dd>{job.eligibleBranch || 'All'}</dd></div>
              <div><dt>Deadline</dt><dd>{formatDate(job.lastDate)}</dd></div>
            </dl>

            {!job.eligible && job.eligibilityReasons?.length > 0 && (
              <div className="job-card__reasons">
                {job.eligibilityReasons.map((reason) => (
                  <WarningBanner key={reason}>{reason}</WarningBanner>
                ))}
              </div>
            )}

            <div className="job-card__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setDetail(job)}
              >
                Details
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={!job.eligible}
                onClick={() => setApplyFor(job)}
              >
                {job.eligible ? 'Apply now' : 'Not eligible'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {detail && (
        <Modal title={`${detail.jobRole} — ${detail.companyName}`} onClose={() => setDetail(null)}>
          <div className="stack">
            {detail.description && <p>{detail.description}</p>}

            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge tone={detail.eligible ? 'green' : 'red'}>
                {detail.eligible ? 'Eligible' : 'Not eligible'}
              </Badge>
              <Badge tone="slate">{formatPackage(detail.packageLpa)}</Badge>
              {detail.location && <Badge tone="slate">{detail.location}</Badge>}
              {detail.jobType && <Badge tone="slate">{detail.jobType}</Badge>}
            </div>

            <div>
              <h3>Required skills</h3>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {(detail.requiredSkillsList || []).map((skill) => (
                  <Chip
                    key={skill}
                    tone={(detail.matchedSkills || []).includes(skill) ? 'green' : 'amber'}
                  >
                    {skill}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <h3>Your match</h3>
              <MatchBar value={detail.matchPercentage} />
              <p className="small muted">
                {formatPercent(detail.matchPercentage)} of the required skills are on your profile.
              </p>
            </div>

            {detail.eligibilityReasons?.length > 0 && (
              <div>
                <h3>Eligibility</h3>
                {detail.eligibilityReasons.map((reason) => (
                  <InfoBanner key={reason}>{reason}</InfoBanner>
                ))}
              </div>
            )}

            <dl className="job-card__meta">
              <div><dt>Min CGPA</dt><dd>{detail.minimumCgpa ?? '-'}</dd></div>
              <div><dt>Eligible branch</dt><dd>{detail.eligibleBranch || 'All'}</dd></div>
              <div><dt>Openings</dt><dd>{detail.openings ?? '-'}</dd></div>
              <div><dt>Deadline</dt><dd>{formatDate(detail.lastDate)}</dd></div>
            </dl>
          </div>
        </Modal>
      )}

      {applyFor && (
        <Modal
          title={`Apply — ${applyFor.jobRole}`}
          onClose={() => !busy && setApplyFor(null)}
          footer={
            <>
              <button type="submit" form="apply-form" className="btn btn--primary" disabled={busy}>
                {busy ? 'Submitting...' : 'Submit application'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setApplyFor(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <form id="apply-form" onSubmit={apply}>
            <div className="stack">
              <p className="muted small">
                {applyFor.companyName} &middot; {formatPackage(applyFor.packageLpa)} &middot; deadline{' '}
                {formatDate(applyFor.lastDate)}
              </p>
              <div className="field">
                <label htmlFor="cover-note">Cover note (optional)</label>
                <textarea
                  id="cover-note"
                  value={coverNote}
                  maxLength={500}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Optional note for the recruiter"
                />
              </div>
              <InfoBanner>
                Your profile skills, CGPA and branch are attached automatically so the recruiter can
                review your fit.
              </InfoBanner>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
