import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { initials } from '../utils/format'
import { api } from '../api/client'

const ROLE_LABEL = {
  STUDENT: 'Student',
  RECRUITER: 'Recruiter',
  ADMIN: 'Placement Officer',
}

const LOGIN_PATH = {
  STUDENT: '/login',
  RECRUITER: '/recruiter/login',
  ADMIN: '/admin/login',
}

/**
 * Sidebar + content shell shared by every authenticated screen. `nav` is passed
 * by the page group so each role only ever sees its own menu.
 */
export default function DashboardLayout({ nav, children }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    api
      .get('/notifications/unread-count')
      .then((data) => {
        if (!cancelled) setUnread(Number(data?.unread || 0))
      })
      .catch(() => {
        /* the badge is cosmetic, never block the page for it */
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const logout = () => {
    const target = LOGIN_PATH[auth.role] || '/login'
    auth.signOut()
    navigate(target, { replace: true })
  }

  return (
    <div className="shell">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        &#9776;
      </button>

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">SP</div>
          <div>
            <div className="sidebar__title">SmartPlacement</div>
            <div className="sidebar__subtitle">{ROLE_LABEL[auth.role] || 'Portal'}</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {(nav || []).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.badgeKey === 'notifications' && unread > 0 && (
                <span className="sidebar__badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <strong>{auth.name || auth.email}</strong>
            <span>{ROLE_LABEL[auth.role] || auth.role}</span>
          </div>
          <button type="button" className="btn btn--danger btn--block btn--sm" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}

/** Page title block used at the top of every authenticated page. */
export function PageHead({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  )
}

/** Avatar bubble reused on dashboards. */
export function Avatar({ name, size = 50 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#dbeafe',
        color: '#1d4ed8',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        fontSize: size / 2.6,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  )
}
