import LoginPage from './LoginPage'
import { authApi } from '../../api/endpoints'

export default function AdminLogin() {
  return (
    <LoginPage
      role="ADMIN"
      endpoint={authApi.loginAdmin}
      title="Admin / Placement Officer login"
      lead="Approve companies and jobs, monitor applications and view analytics."
      homeRoute="/admin/dashboard"
      demo={{ email: 'admin@smartplacement.com', password: 'Admin@123' }}
    />
  )
}
