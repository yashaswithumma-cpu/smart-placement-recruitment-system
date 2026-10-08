/**
 * Comma separated tag editor used for student skills / interests.
 * Keeps the same "a, b, c" storage format the backend expects.
 */
import { useState } from 'react'
import { Chip } from './Ui'
import { toList } from '../utils/format'

export default function TagInput({ label, value, onChange, placeholder, hint, error }) {
  const [draft, setDraft] = useState('')
  const tags = toList(value)

  const commit = () => {
    const additions = draft
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (!additions.length) return
    const merged = [...tags]
    additions.forEach((item) => {
      if (!merged.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        merged.push(item)
      }
    })
    onChange(merged.join(', '))
    setDraft('')
  }

  const removeAt = (index) => {
    const next = tags.filter((_, position) => position !== index)
    onChange(next.join(', '))
  }

  return (
    <div className="field">
      <label htmlFor={`tag-${label}`}>{label}</label>
      <input
        id={`tag-${label}`}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
      />
      {hint && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
      {tags.length > 0 && (
        <div className="chips" style={{ marginTop: 8 }}>
          {tags.map((tag, index) => (
            <Chip key={`${tag}-${index}`} tone="blue" onRemove={() => removeAt(index)}>
              {tag}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
