/** Formats a date-time string from the backend (ISO local date-time) for display. */
export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export function formatTime(value) {
  if (!value) return '-'
  const time = String(value)
  return time.length >= 5 ? time.slice(0, 5) : time
}

/** Renders a LPA package value, hiding it when the recruiter left it blank. */
export function formatPackage(value) {
  if (value === null || value === undefined || value === '') return 'Not disclosed'
  return `${Number(value)} LPA`
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '0%'
  const rounded = Math.round(Number(value) * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`
}

/** Turns "INTERVIEW_SCHEDULED" into "Interview Scheduled". */
export function humanize(value) {
  if (!value) return '-'
  const text = String(value).replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function initials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Normalises a comma separated field into a clean array for chip rendering. */
export function toList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value)
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Local datetime string in the shape <input type="datetime-local"> expects. */
export function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
