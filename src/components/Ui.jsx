import { formatPercent } from '../utils/format'

const TONE_BY_STATUS = {
  APPLIED: 'blue',
  SHORTLISTED: 'amber',
  INTERVIEW_SCHEDULED: 'violet',
  SELECTED: 'green',
  REJECTED: 'red',
  APPROVED: 'green',
  PENDING: 'amber',
  PLACED: 'green',
  OFFERED: 'blue',
  RESIGNED: 'slate',
  SCHEDULED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
  RESCHEDULED: 'amber',
  ONLINE: 'blue',
  OFFLINE: 'violet',
  PHONE: 'slate',
  ACTIVE: 'green',
  INACTIVE: 'slate',
  NOT_PLACED: 'slate',
  APPLIED_STATUS: 'blue',
}

const LABEL_BY_STATUS = {
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  NOT_PLACED: 'Not placed',
  IN_INTERVIEW: 'In interview',
}

export function toneFor(status) {
  return TONE_BY_STATUS[String(status || '').toUpperCase()] || 'slate'
}

export function labelFor(status) {
  const key = String(status || '').toUpperCase()
  if (LABEL_BY_STATUS[key]) return LABEL_BY_STATUS[key]
  const text = String(status || '-').replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function Badge({ children, tone }) {
  const value = children
  const resolvedTone = tone || toneFor(typeof value === 'string' ? value : 'slate')
  return <span className={`badge badge--${resolvedTone}`}>{labelFor(value)}</span>
}

export function SeverityBadge({ severity }) {
  const map = {
    MINIMAL: 'green',
    MODERATE: 'blue',
    SIGNIFICANT: 'amber',
    CRITICAL: 'red',
  }
  return <span className={`badge badge--${map[severity] || 'slate'}`}>{labelFor(severity)}</span>
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  )
}

export function MatchBar({ value, showLabel = true }) {
  const pct = Number(value || 0)
  return (
    <div className="row" style={{ gap: 9, flexWrap: 'nowrap' }}>
      <div className="match-bar" style={{ flex: 1 }}>
        <div className="match-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      {showLabel && <b className="small" style={{ minWidth: 46 }}>{formatPercent(pct)}</b>}
    </div>
  )
}

export function Chip({ children, tone = 'neutral', onRemove }) {
  if (!onRemove) return <span className={`chip chip--${tone}`}>{children}</span>
  return (
    <span className={`chip chip--${tone} chip--removable`}>
      {children}
      <button type="button" className="chip__remove" onClick={onRemove} aria-label="Remove">
        &times;
      </button>
    </span>
  )
}

export function Panel({ title, subtitle, actions, children }) {
  return (
    <section className="panel">
      {(title || actions) && (
        <div className="panel__head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function KeyValue({ label, value }) {
  return (
    <div className="kv">
      <div className="kv__label">{label}</div>
      <div className="kv__value">{value ?? '-'}</div>
    </div>
  )
}

export function BarChart({ data, emptyLabel = 'No data yet' }) {
  const entries = Object.entries(data || {}).filter(([, value]) => Number(value) >= 0)
  if (!entries.length) return <p className="muted small">{emptyLabel}</p>
  const max = Math.max(...entries.map(([, value]) => Number(value) || 0), 1)
  return (
    <div className="bar-chart">
      {entries.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span>{labelFor(label)}</span>
          <div className="bar-row__track">
            <div
              className="bar-row__fill"
              style={{ width: `${((Number(value) || 0) / max) * 100}%` }}
            />
          </div>
          <span className="bar-row__value">{value}</span>
        </div>
      ))}
    </div>
  )
}
