import { useEffect } from 'react'

export function Loading({ label = 'Loading...' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBanner({ error, onDismiss }) {
  if (!error) return null
  const message = typeof error === 'string' ? error : error.message
  return (
    <div className="alert alert--error" role="alert">
      <span aria-hidden="true">&#9888;</span>
      <div style={{ flex: 1 }}>
        <strong>Something went wrong.</strong>
        <div>{message}</div>
        {error?.fieldErrors && Object.keys(error.fieldErrors).length > 0 && (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {Object.entries(error.fieldErrors).map(([field, msg]) => (
              <li key={field}>
                <strong>{field}</strong>: {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="chip__remove" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  )
}

export function SuccessBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="alert alert--success" role="status">
      <span aria-hidden="true">&#10003;</span>
      <div style={{ flex: 1 }}>{message}</div>
      {onDismiss && (
        <button type="button" className="chip__remove" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  )
}

export function InfoBanner({ children }) {
  if (!children) return null
  return (
    <div className="alert alert--info">
      <span aria-hidden="true">&#9432;</span>
      <div>{children}</div>
    </div>
  )
}

export function WarningBanner({ children }) {
  if (!children) return null
  return (
    <div className="alert alert--warning">
      <span aria-hidden="true">&#9888;</span>
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`modal${wide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        {children}
        {footer && <div className="form-actions">{footer}</div>}
      </div>
    </div>
  )
}

export default Loading
