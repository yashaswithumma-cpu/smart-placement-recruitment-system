import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading } from '../../components/Feedback'
import { Chip, MatchBar, Panel, SeverityBadge, StatCard } from '../../components/Ui'
import { formatPackage } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

export default function StudentSkillGap() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyDrive, setBusyDrive] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await studentApi.skillGapForApplications()
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadForDrive = async (driveId) => {
    setBusyDrive(driveId)
    setError(null)
    try {
      const result = await studentApi.skillGap(driveId)
      setRows((prev) => [
        result,
        ...prev.filter((row) => row.driveId !== result.driveId),
      ])
    } catch (err) {
      setError(err)
    } finally {
      setBusyDrive(null)
    }
  }

  const worst = rows.reduce((acc, row) => (row.gapCount > (acc?.gapCount ?? -1) ? row : acc), null)

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="Skill gap"
        subtitle="For every job you applied to: which required skills you already have and which are missing."
        actions={<Link to="/learning" className="btn btn--primary">Learning plan</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Calculating skill gaps..." />}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon="📊"
          title="No skill gap data yet"
          message="Apply to a job first, then this page compares your profile against each role's requirements."
          action={<Link to="/jobs" className="btn btn--primary">Browse open jobs</Link>}
        />
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="stat-grid stat-grid--compact">
            <StatCard label="Roles analysed" value={rows.length} />
            <StatCard
              label="Full skill match"
              value={rows.filter((row) => row.gapCount === 0).length}
            />
            <StatCard
              label="Largest gap"
              value={worst ? worst.gapCount : 0}
              hint={worst ? worst.jobRole : undefined}
            />
          </div>

          <div className="stack">
            {rows.map((row) => (
              <Panel
                key={row.driveId}
                title={`${row.jobRole} — ${row.companyName}`}
                subtitle={`${row.matchedSkills?.length ?? 0} of ${
                  row.requiredSkills?.length ?? 0
                } required skills matched`}
                actions={
                  <>
                    <SeverityBadge severity={row.gapSeverity} />
                    <MatchBar value={row.matchPercentage} />
                  </>
                }
              >
                <div className="stack">
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <strong className="small">Required</strong>
                    {(row.requiredSkills || []).map((skill) => (
                      <Chip
                        key={skill}
                        tone={(row.matchedSkills || []).includes(skill) ? 'green' : 'amber'}
                      >
                        {skill}
                      </Chip>
                    ))}
                  </div>

                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <strong className="small">Missing</strong>
                    {(row.missingSkills || []).length === 0 ? (
                      <span className="small muted">Nothing missing, you match every requirement.</span>
                    ) : (
                      row.missingSkills.map((skill) => <Chip key={skill} tone="red">{skill}</Chip>)
                    )}
                  </div>

                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <strong className="small">Your skills used</strong>
                    {(row.studentSkills || []).slice(0, 12).map((skill) => (
                      <Chip key={skill} tone="blue">{skill}</Chip>
                    ))}
                  </div>

                  {(row.learningSuggestions || []).length > 0 && (
                    <div>
                      <strong className="small">Suggested next steps</strong>
                      <ul className="list-plain">
                        {row.learningSuggestions.map((suggestion) => (
                          <li key={suggestion.skill}>
                            <b>{suggestion.skill}</b> — {suggestion.whyItMatters}
                            {suggestion.resourceUrl && (
                              <>
                                {' '}
                                <a href={suggestion.resourceUrl} target="_blank" rel="noreferrer">
                                  {suggestion.resourceName}
                                </a>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="form-actions">
                    <Link to="/learning" className="btn btn--secondary btn--sm">
                      Open learning plan
                    </Link>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => loadForDrive(row.driveId)}
                      disabled={busyDrive === row.driveId}
                    >
                      {busyDrive === row.driveId ? 'Recalculating...' : 'Recalculate'}
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <InfoBanner>
            Gap severity is derived from how many required skills are missing, so it stays consistent
            across sessions.
          </InfoBanner>
        </>
      )}
    </DashboardLayout>
  )
}
