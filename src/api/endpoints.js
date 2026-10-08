/**
 * Every backend endpoint used by the UI, grouped by area.
 * Endpoint naming matches the Spring Boot controllers exactly.
 */
import { api, downloadCsv } from './client'

/* ------------------------------------------------------------------ auth */

export const authApi = {
  registerStudent: (payload) => api.post('/students/register', payload),
  loginStudent: (payload) => api.post('/students/login', payload),
  registerRecruiter: (payload) => api.post('/recruiters/register', payload),
  loginRecruiter: (payload) => api.post('/recruiters/login', payload),
  loginAdmin: (payload) => api.post('/admin/login', payload),
  health: () => api.get('/health'),
}

/* --------------------------------------------------------------- student */

export const studentApi = {
  me: () => api.get('/students/me'),
  updateMe: (payload) => api.put('/students/me', payload),
  dashboard: () => api.get('/students/dashboard'),
  jobs: (withEligibility = true) =>
    api.get('/students/jobs', { params: { withEligibility } }),
  recommendedJobs: (limit) =>
    api.get('/students/jobs/recommended', { params: limit ? { limit } : undefined }),
  eligibility: (driveId) => api.get(`/students/jobs/${driveId}/eligibility`),
  skillMatch: (driveId) => api.get(`/students/jobs/${driveId}/skill-match`),
  skillGap: (driveId) => api.get(`/students/jobs/${driveId}/skill-gap`),
  skillGapForApplications: () => api.get('/students/skill-gap'),
  learningSuggestions: () => api.get('/students/learning-suggestions'),
  apply: (payload) => api.post('/applications', payload),
  applications: () => api.get('/applications/student'),
  interviews: () => api.get('/interviews/student'),
  interviewsForApplication: (applicationId) => api.get(`/interviews/application/${applicationId}`),
  profileStatus: () => api.get('/students/profile-status'),
  placements: () => api.get('/students/placements'),
  notifications: (unreadOnly = false) =>
    api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/students/resume', form)
  },
  viewResume: () => '/students/resume/view',
  downloadResume: () => '/students/resume/download',
}

/* -------------------------------------------------------------- recruiter */

export const recruiterApi = {
  me: () => api.get('/recruiters/me'),
  updateMe: (payload) => api.put('/recruiters/me', payload),
  dashboard: () => api.get('/recruiters/dashboard'),
  candidates: () => api.get('/recruiters/candidates'),
  candidatesForDrive: (driveId) => api.get(`/recruiters/drives/${driveId}/candidates`),
  applicationsForDrive: (driveId) => api.get(`/recruiters/drives/${driveId}/applications`),
  applications: () => api.get('/applications/recruiter'),
  interviews: () => api.get('/interviews/recruiter'),
  placements: () => api.get('/placements'),
  notifications: (unreadOnly = false) =>
    api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
  createDrive: (payload) => api.post('/drives', payload),
  myDrives: () => api.get('/drives/my'),
  updateDrive: (driveId, payload) => api.put(`/drives/${driveId}`, payload),
  deleteDrive: (driveId) => api.delete(`/drives/${driveId}`),
  updateApplicationStatus: (applicationId, status, remarks) =>
    api.put(`/applications/${applicationId}/status`, { status, remarks }),
  scheduleInterview: (payload) => api.post('/interviews', payload),
  updateInterviewStatus: (interviewId, status, notes) =>
    api.put(`/interviews/${interviewId}/status`, { status, notes }),
  rescheduleInterview: (interviewId, payload) => api.put(`/interviews/${interviewId}/reschedule`, payload),
  cancelInterview: (interviewId) => api.delete(`/interviews/${interviewId}`),
  downloadCandidateResume: (studentId) => `/recruiters/students/${studentId}/resume/download`,
  reports: {
    jobs: () => downloadCsv('/reports/recruiter/jobs.csv', 'my-jobs.csv'),
    applications: () => downloadCsv('/reports/recruiter/applications.csv', 'my-applications.csv'),
    candidates: () => downloadCsv('/reports/recruiter/candidates.csv', 'my-candidates.csv'),
    placements: () => downloadCsv('/reports/recruiter/placements.csv', 'my-placements.csv'),
  },
}

/* ------------------------------------------------------------------ admin */

export const adminApi = {
  me: () => api.get('/admin/me'),
  dashboard: () => api.get('/admin/dashboard'),
  analytics: () => api.get('/admin/analytics'),
  students: () => api.get('/admin/students'),
  updateStudent: (id, payload) => api.put(`/admin/students/${id}`, payload),
  setStudentActive: (id, active) => api.put(`/admin/students/${id}/active`, null, { params: { active } }),
  studentApplications: (id) => api.get(`/admin/students/${id}/applications`),
  recruiters: (status) =>
    api.get('/admin/recruiters', { params: status ? { status } : undefined }),
  approveRecruiter: (id, reason) => api.put(`/admin/recruiters/${id}/approve`, reason ? { reason } : undefined),
  rejectRecruiter: (id, reason) => api.put(`/admin/recruiters/${id}/reject`, { reason }),
  drives: () => api.get('/admin/drives'),
  approveDrive: (id) => api.put(`/admin/drives/${id}/approve`),
  rejectDrive: (id, reason) => api.put(`/admin/drives/${id}/reject`, reason ? { reason } : undefined),
  applications: () => api.get('/admin/applications'),
  interviews: () => api.get('/admin/interviews'),
  placements: () => api.get('/admin/placements'),
  notifications: (unreadOnly = false) =>
    api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
}

/* ------------------------------------------------------------------ jobs */

export const driveApi = {
  openApproved: () => api.get('/drives'),
  byId: (driveId) => api.get(`/drives/${driveId}`),
}

/* --------------------------------------------------------------- reports */

export const reportApi = {
  studentsCsv: () => downloadCsv('/reports/students.csv', 'students.csv'),
  recruitersCsv: () => downloadCsv('/reports/recruiters.csv', 'recruiters.csv'),
  jobsCsv: () => downloadCsv('/reports/jobs.csv', 'jobs.csv'),
  applicationsCsv: () => downloadCsv('/reports/applications.csv', 'applications.csv'),
  placementsCsv: () => downloadCsv('/reports/placements.csv', 'placements.csv'),
}
