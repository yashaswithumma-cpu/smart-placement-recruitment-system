import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, InfoBanner, Loading } from '../../components/Feedback'
import { Badge, Chip, Panel } from '../../components/Ui'
import { STUDENT_NAV } from '../navigation'

export default function StudentLearning() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('')
  const [track, setTrack] = useState(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await studentApi.learningSuggestions()
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

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows],
  )

  const visible = useMemo(
    () => (category ? rows.filter((r) => r.category === category) : [...rows]),
    [rows, category],
  )

  const grouped = useMemo(() => {
    const map = new Map()
    visible.forEach((item) => {
      if (!map.has(item.skill)) map.set(item.skill, [])
      map.get(item.skill).push(item)
    })
    return [...map.entries()].sort((a, b) => {
      const pa = Math.min(...a[1].map((i) => i.priority ?? 99))
      const pb = Math.min(...b[1].map((i) => i.priority ?? 99))
      return pa - pb
    })
  }, [visible])

  const toggle = (skill) => {
    setTrack((prev) => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  return (
    <DashboardLayout nav={STUDENT_NAV}>
      <PageHead
        title="Learning plan"
        subtitle="Curated resources for the skills you are missing, chosen by a static server-side map."
        actions={
          <>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Link to="/skill-gap" className="btn btn--secondary">Skill gap</Link>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {loading && <Loading label="Building your learning plan..." />}

      {!loading && rows.length === 0 && (
        <EmptyState
          icon="📚"
          title="Nothing to learn right now"
          message="Learning suggestions appear once you have applied to a job with skills you have not listed yet."
          action={<Link to="/jobs" className="btn btn--primary">Browse open jobs</Link>}
        />
      )}

      {!loading && grouped.length > 0 && (
        <>
          {track.size > 0 && (
            <Panel
              title={`Your shortlist (${track.size})`}
              subtitle="Skills you marked as in progress. Progress is kept in this browser session only."
              actions={
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setTrack(new Set())}
                >
                  Clear
                </button>
              }
            >
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {[...track].map((skill) => (
                  <Chip key={skill} tone="green" onRemove={() => toggle(skill)}>{skill}</Chip>
                ))}
              </div>
            </Panel>
          )}

          <div className="learning-grid">
            {grouped.map(([skill, items]) => {
              const best = items.reduce((a, b) => ((a.priority ?? 99) <= (b.priority ?? 99) ? a : b))
              const inTrack = track.has(skill)
              return (
                <article className="learning-card" key={skill}>
                  <div className="learning-card__head">
                    <h3>{skill}</h3>
                    <Badge tone={best.priority <= 1 ? 'red' : best.priority === 2 ? 'amber' : 'slate'}>
                      {best.priority === 1 ? 'High priority' : best.priority === 2 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>

                  <p className="small">{best.whyItMatters}</p>

                  <ul className="list-plain">
                    {items.map((item) => (
                      <li key={`${item.skill}-${item.resourceName}`}>
                        <span className="muted small">{item.category}</span>{' '}
                        {item.resourceUrl ? (
                          <a href={item.resourceUrl} target="_blank" rel="noreferrer">
                            {item.resourceName}
                          </a>
                        ) : (
                          <b>{item.resourceName}</b>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="form-actions">
                    <button
                      type="button"
                      className={`btn btn--sm ${inTrack ? 'btn--secondary' : 'btn--primary'}`}
                      onClick={() => toggle(skill)}
                    >
                      {inTrack ? 'In progress' : 'Add to plan'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <InfoBanner>
            Resources are a fixed curated list in the backend config. Nothing is fetched from an external
            service at runtime.
          </InfoBanner>
        </>
      )}
    </DashboardLayout>
  )
}
