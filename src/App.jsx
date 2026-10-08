import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './auth/AuthProvider'
import ProtectedRoute, { GuestRoute } from './auth/ProtectedRoute'

import RoleHome, { ADMIN_NAV, RECRUITER_NAV, STUDENT_NAV } from './pages/navigation'
import NotificationsPage from './pages/NotificationsPage'

import StudentLogin from './pages/auth/StudentLogin'
import StudentRegister from './pages/auth/StudentRegister'
import RecruiterLogin from './pages/auth/RecruiterLogin'
import RecruiterRegister from './pages/auth/RecruiterRegister'
import AdminLogin from './pages/auth/AdminLogin'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import StudentJobs from './pages/student/StudentJobs'
import StudentApplications from './pages/student/StudentApplications'
import StudentInterviews from './pages/student/StudentInterviews'
import StudentRecommendations from './pages/student/StudentRecommendations'
import StudentSkillGap from './pages/student/StudentSkillGap'
import StudentLearning from './pages/student/StudentLearning'

import RecruiterDashboard from './pages/recruiter/RecruiterDashboard'
import RecruiterCompany from './pages/recruiter/RecruiterCompany'
import RecruiterJobs from './pages/recruiter/RecruiterJobs'
import RecruiterCandidates from './pages/recruiter/RecruiterCandidates'
import RecruiterApplications from './pages/recruiter/RecruiterApplications'
import RecruiterInterviews from './pages/recruiter/RecruiterInterviews'
import RecruiterReports from './pages/recruiter/RecruiterReports'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminRecruiters from './pages/admin/AdminRecruiters'
import AdminJobs from './pages/admin/AdminJobs'
import AdminApplications from './pages/admin/AdminApplications'
import AdminInterviews from './pages/admin/AdminInterviews'
import AdminPlacements from './pages/admin/AdminPlacements'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminReports from './pages/admin/AdminReports'

import NotFound from './pages/NotFound'

const ROLE_HOME = {
  STUDENT: '/dashboard',
  RECRUITER: '/recruiter/dashboard',
  ADMIN: '/admin/dashboard',
}

/** Signed in users land straight on their own portal. */
function Landing() {
  const auth = useAuth()
  if (auth.isAuthenticated) {
    return <Navigate to={ROLE_HOME[auth.role] || '/login'} replace />
  }
  return <RoleHome />
}

const guard = (role, element) => (
  <ProtectedRoute role={role}>{element}</ProtectedRoute>
)

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ---------------- public ---------------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><StudentLogin /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><StudentRegister /></GuestRoute>} />
        <Route path="/recruiter/login" element={<GuestRoute><RecruiterLogin /></GuestRoute>} />
        <Route path="/recruiter/register" element={<GuestRoute><RecruiterRegister /></GuestRoute>} />
        <Route path="/admin/login" element={<GuestRoute><AdminLogin /></GuestRoute>} />

        {/* ---------------- student ---------------- */}
        <Route path="/dashboard" element={guard('STUDENT', <StudentDashboard />)} />
        <Route path="/profile" element={guard('STUDENT', <StudentProfile />)} />
        <Route path="/jobs" element={guard('STUDENT', <StudentJobs />)} />
        <Route path="/applications" element={guard('STUDENT', <StudentApplications />)} />
        <Route path="/interviews" element={guard('STUDENT', <StudentInterviews />)} />
        <Route path="/recommendations" element={guard('STUDENT', <StudentRecommendations />)} />
        <Route path="/skill-gap" element={guard('STUDENT', <StudentSkillGap />)} />
        <Route path="/learning" element={guard('STUDENT', <StudentLearning />)} />
        <Route
          path="/notifications"
          element={guard('STUDENT', <NotificationsPage nav={STUDENT_NAV} />)}
        />

        {/* ---------------- recruiter ---------------- */}
        <Route path="/recruiter/dashboard" element={guard('RECRUITER', <RecruiterDashboard />)} />
        <Route path="/recruiter/company" element={guard('RECRUITER', <RecruiterCompany />)} />
        <Route path="/recruiter/jobs" element={guard('RECRUITER', <RecruiterJobs />)} />
        <Route path="/recruiter/candidates" element={guard('RECRUITER', <RecruiterCandidates />)} />
        <Route path="/recruiter/applications" element={guard('RECRUITER', <RecruiterApplications />)} />
        <Route path="/recruiter/interviews" element={guard('RECRUITER', <RecruiterInterviews />)} />
        <Route path="/recruiter/reports" element={guard('RECRUITER', <RecruiterReports />)} />
        <Route
          path="/recruiter/notifications"
          element={guard('RECRUITER', <NotificationsPage nav={RECRUITER_NAV} />)}
        />

        {/* ---------------- admin ---------------- */}
        <Route path="/admin/dashboard" element={guard('ADMIN', <AdminDashboard />)} />
        <Route path="/admin/students" element={guard('ADMIN', <AdminStudents />)} />
        <Route path="/admin/recruiters" element={guard('ADMIN', <AdminRecruiters />)} />
        <Route path="/admin/jobs" element={guard('ADMIN', <AdminJobs />)} />
        <Route path="/admin/applications" element={guard('ADMIN', <AdminApplications />)} />
        <Route path="/admin/interviews" element={guard('ADMIN', <AdminInterviews />)} />
        <Route path="/admin/placements" element={guard('ADMIN', <AdminPlacements />)} />
        <Route path="/admin/analytics" element={guard('ADMIN', <AdminAnalytics />)} />
        <Route path="/admin/reports" element={guard('ADMIN', <AdminReports />)} />
        <Route
          path="/admin/notifications"
          element={guard('ADMIN', <NotificationsPage nav={ADMIN_NAV} />)}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
