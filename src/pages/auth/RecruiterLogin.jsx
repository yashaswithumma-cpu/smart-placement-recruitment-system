import LoginPage from './LoginPage'
import { authApi } from '../../api/endpoints'

export default function RecruiterLogin() {
  return (
    <LoginPage
      role="RECRUITER"
      endpoint={authApi.loginRecruiter}
      title="Recruiter login"
      lead="Manage your company profile, jobs, applicants and interviews."
      homeRoute="/recruiter/dashboard"
      demo={{ email: 'recruiter@tcs.example', password: 'Recruiter@123' }}
    />
  )
}
