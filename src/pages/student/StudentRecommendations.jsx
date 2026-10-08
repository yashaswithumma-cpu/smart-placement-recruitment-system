import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading } from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel } from '../../components/Ui'
import { formatDate, formatPackage, formatPercent } from '../../utils/format'
import { STUDENT_NAV } from '../navigation'

export default function StudentRecommendations() {
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await studentApi.recommendedJobs(limit)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  const top = rows[0]

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="Recommended jobs"
        subtitle="Ranked by a deterministic score: 70% skill match plus 30% interest alignment."
        actions={
          <>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              aria-label="Number of recommendations"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>Top {n}</option>
              ))}
            </select>
            <button type="button" className="btn btn--secondary" onClick={load}>Refresh</button>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Ranking jobs for you..." />}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon="✨"
          title="No recommendations yet"
          message="Recommendations need your branch, CGPA, graduation year, skills and interests."
          action={<Link to="/profile" className="btn btn--primary">Complete my profile</Link>}
        />
      )}

      {top && (
        <div className="hero hero--accent">
          <div>
            <h2>Best match: {top.jobRole} at {top.companyName}</h2>
            <p>{top.recommendationReason}</p>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <Badge tone="green">Score {formatPercent(top.score)}</Badge>
              <Badge tone="blue">Skill {formatPercent(top.skillScore)}</Badge>
              <Badge tone="violet">Interest {formatPercent(top.interestMatchPercentage)}</Badge>
              <Badge tone="slate">{formatPackage(top.job?.packageLpa)}</Badge>
            </div>
          </div>
          <div className="hero__badge">
            <b>{formatPercent(top.matchPercentage)}</b>
            <span>Skill match</span>
          </div>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="stack">
          {rows.map((row, index) => (
            <Panel
              key={row.driveId ?? row.job?.id ?? index}
              title={
                <span className="row" style={{ gap: 8 }}>
                  <span className="rank">{index + 1}</span>
                  {row.jobRole} — {row.companyName}
                </span>
              }
              subtitle={row.recommendationReason}
              actions={<Badge tone="green">Score {formatPercent(row.score)}</Badge>}
            >
              <div className="stack">
                <div className="rec-scores">
                  <div>
                    <span className="small muted">Skill score (70% weight)</span>
                    <MatchBar value={row.skillScore} />
                  </div>
                  <div>
                    <span className="small muted">Interest score (30% weight)</span>
                    <MatchBar value={row.interestMatchPercentage} />
                  </div>
                </div>

                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {(row.matchedSkills || []).map((skill) => (
                    <Chip key={skill} tone="green">{skill}</Chip>
                  ))}
                </div>

                {(row.missingSkills || []).length > 0 && (
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className="small muted">Missing</span>
                    {row.missingSkills.map((skill) => (
                      <Chip key={skill} tone="amber">{skill}</Chip>
                    ))}
                  </div>
                )}

                {(row.matchedInterests || []).length > 0 && (
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className="small muted">Interests matched</span>
                    {row.matchedInterests.map((interest) => (
                      <Chip key={interest} tone="violet">{interest}</Chip>
                    ))}
                  </div>
                )}

                <div className="row job-card__meta">
                  <div><dt>Package</dt><dd>{formatPackage(row.job?.packageLpa)}</dd></div>
                  <div><dt>Location</dt><dd>{row.job?.location || '-'}</dd></div>
                  <div><dt>Deadline</dt><dd>{formatDate(row.job?.lastDate)}</dd></div>
                </div>

                <div className="form-actions">
                  <Link to="/jobs" className="btn btn--primary btn--sm">View and apply</Link>
                  <Link to="/learning" className="btn btn--secondary btn--sm">Close the skill gap</Link>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <InfoBanner>
          Scores come from plain Java rules on the server, not an external model, so the same profile
          always produces the same ranking.
        </InfoBanner>
      )}
    </DashboardLayout>
  )
}
