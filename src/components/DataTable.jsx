/**
 * Table with a built in search box and optional column filter.
 * Keeps every admin / recruiter listing consistent.
 */
import { useMemo, useState } from 'react'
import { EmptyState } from './Feedback'

function matches(row, needle, keys) {
  if (!needle) return true
  const value = needle.toLowerCase()
  return keys.some((key) => {
    const cell = row[key]
    if (cell === null || cell === undefined) return false
    if (Array.isArray(cell)) return cell.join(' ').toLowerCase().includes(value)
    return String(cell).toLowerCase().includes(value)
  })
}

export default function DataTable({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search...',
  emptyTitle = 'Nothing to show yet',
  emptyMessage,
  toolbar,
  filters,
}) {
  const [needle, setNeedle] = useState('')
  const [filterValue, setFilterValue] = useState('')

  const keys = searchKeys || columns.map((column) => column.key)
  const filtered = useMemo(() => {
    let list = rows || []
    if (filterValue && filters) {
      list = list.filter((row) => filters(row) === filterValue)
    }
    return list.filter((row) => matches(row, needle, keys))
  }, [rows, needle, filterValue, filters, keys.join('|')])

  const showToolbar = Boolean(toolbar) || keys.length > 0 || Boolean(filters)

  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <>
      {showToolbar && (
        <div className="toolbar">
          <input
            type="search"
            value={needle}
            onChange={(event) => setNeedle(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          {filters && (
            <select
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              aria-label="Filter list"
            >
              <option value="">All</option>
              {[...new Set((rows || []).map(filters))].filter(Boolean).map((value) => (
                <option key={value} value={value}>
                  {String(value).replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          )}
          {toolbar}
          <span className="toolbar__spacer" />
          <span className="muted small">
            {filtered.length} of {rows.length}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          message="No records match the current search or filter. Try a different term."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id ?? row.key ?? index}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.numeric ? 'numeric' : undefined}>
                      {column.render ? column.render(row, index) : formatCell(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
