import LoginPage from './LoginPage'
import { authApi } from '../../api/endpoints'

export default function StudentLogin() {
  return (
    <LoginPage
      role="STUDENT"
      endpoint={authApi.loginStudent}
      title="Student login"
      lead="Track applications, interviews and personalised job recommendations."
      homeRoute="/dashboard"
    />
  )
}
