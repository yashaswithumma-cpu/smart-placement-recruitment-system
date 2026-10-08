import { Link } from 'react-router-dom'

export const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/profile', label: 'My profile', icon: '👤' },
  { to: '/jobs', label: 'Browse jobs', icon: '💼' },
  { to: '/applications', label: 'Applications', icon: '📄' },
  { to: '/interviews', label: 'Interviews', icon: '🗓' },
  { to: '/recommendations', label: 'Recommendations', icon: '✨' },
  { to: '/skill-gap', label: 'Skill gap', icon: '📊' },
  { to: '/learning', label: 'Learning plan', icon: '📚' },
  { to: '/notifications', label: 'Notifications', icon: '🔔', badgeKey: 'notifications' },
]

export const RECRUITER_NAV = [
  { to: '/recruiter/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/recruiter/company', label: 'Company profile', icon: '🏢' },
  { to: '/recruiter/jobs', label: 'My jobs', icon: '💼' },
  { to: '/recruiter/candidates', label: 'Candidates', icon: '👥' },
  { to: '/recruiter/applications', label: 'Applications', icon: '📄' },
  { to: '/recruiter/interviews', label: 'Interviews', icon: '🗓' },
  { to: '/recruiter/reports', label: 'Reports', icon: '📈' },
  { to: '/recruiter/notifications', label: 'Notifications', icon: '🔔', badgeKey: 'notifications' },
]

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/students', label: 'Students', icon: '🎓' },
  { to: '/admin/recruiters', label: 'Recruiters', icon: '🏢' },
  { to: '/admin/jobs', label: 'Jobs', icon: '💼' },
  { to: '/admin/applications', label: 'Applications', icon: '📄' },
  { to: '/admin/interviews', label: 'Interviews', icon: '🗓' },
  { to: '/admin/placements', label: 'Placements', icon: '🏆' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📊' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
  { to: '/admin/notifications', label: 'Notifications', icon: '🔔', badgeKey: 'notifications' },
]

/** Landing page: send each visitor to the portal that matches their role. */
export default function RoleHomeRedirect() {
  return (
    <div className="landing">
      <div className="landing__inner">
        <div className="landing__logo">SP</div>
        <h1>SmartPlacement</h1>
        <p className="muted">Campus placement management for students, recruiters and placement officers.</p>

        <div className="landing__grid">
          <Link to="/login" className="landing__card">
            <h2>Student</h2>
            <p>Profile, jobs, applications, interviews and personalised recommendations.</p>
            <span className="btn btn--primary btn--sm">Student portal</span>
          </Link>
          <Link to="/recruiter/login" className="landing__card">
            <h2>Recruiter</h2>
            <p>Post jobs, review candidates, shortlist applicants and schedule interviews.</p>
            <span className="btn btn--secondary btn--sm">Recruiter portal</span>
          </Link>
          <Link to="/admin/login" className="landing__card">
            <h2>Placement Officer</h2>
            <p>Approve recruiters and jobs, monitor the pipeline and export reports.</p>
            <span className="btn btn--secondary btn--sm">Admin portal</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
