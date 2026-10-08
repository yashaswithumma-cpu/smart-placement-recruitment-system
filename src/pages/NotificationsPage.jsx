import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import DashboardLayout, { PageHead } from '../components/DashboardLayout'
import {
  EmptyState,
  ErrorBanner,
  Loading,
  SuccessBanner,
} from '../components/Feedback'
import { Badge, Panel } from '../components/Ui'
import { formatDateTime } from '../utils/format'

/** The notification bell page is identical for all three roles. */
export default function NotificationsPage({ nav }) {
  const auth = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/notifications', {
        params: unreadOnly ? { unreadOnly: true } : undefined,
      })
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  useEffect(() => {
    load()
  }, [load])

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items])

  const markRead = async (id) => {
    setError(null)
    try {
      const updated = await api.put(`/notifications/${id}/read`)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)))
    } catch (err) {
      setError(err)
    }
  }

  const markUnread = async (id) => {
    setError(null)
    try {
      const updated = await api.put(`/notifications/${id}/read`, null, { params: { read: false } })
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)))
    } catch (err) {
      setError(err)
    }
  }

  const markAll = async () => {
    setError(null)
    try {
      const res = await api.post('/notifications/mark-all-read')
      setMessage(res?.message || 'All notifications marked as read')
      await load()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <DashboardLayout nav={nav}>
      <PageHead
        title="Notifications"
        subtitle={
          unread > 0
            ? `${unread} unread notification${unread === 1 ? '' : 's'}.`
            : 'You are all caught up.'
        }
        actions={
          <>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={markAll}
              disabled={unread === 0}
            >
              Mark all read
            </button>
          </>
        }
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      {loading && <Loading label="Loading notifications..." />}

      {!loading && items.length === 0 && (
        <EmptyState
          icon="🔔"
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          message={
            unreadOnly
              ? 'Switch off the unread filter to see older notifications.'
              : 'Application updates, interview schedules and placement results will appear here.'
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="stack">
          {items.map((item) => (
            <article
              key={item.id}
              className={`notification${item.read ? '' : ' notification--unread'}`}
            >
              <div className="notification__body">
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <strong>{item.title}</strong>
                  {item.read ? <Badge tone="slate">Read</Badge> : <Badge tone="blue">New</Badge>}
                </div>
                <p>{item.message}</p>
                <span className="small muted">{formatDateTime(item.createdAt)}</span>
              </div>
              <div className="notification__actions">
                {item.read ? (
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => markUnread(item.id)}
                  >
                    Mark unread
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => markRead(item.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {auth.isStudent && (
        <p className="small muted">
          Tip: application status changes and interview schedules also appear on your{' '}
          <Link to="/applications">applications</Link> and <Link to="/interviews">interviews</Link> pages.
        </p>
      )}
    </DashboardLayout>
  )
}
