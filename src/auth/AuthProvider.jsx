import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { clearSession, isTokenExpired, loadSession, saveSession } from './session'

const AuthContext = createContext(null)

function bootstrap() {
  const stored = loadSession()
  if (stored.token && isTokenExpired(stored.token)) {
    clearSession()
    return { ...stored, token: '' }
  }
  return stored
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(bootstrap)

  const signIn = useCallback((auth) => {
    const next = saveSession(auth)
    setSession(next)
    return next
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession({ token: '', role: '', userId: null, name: '', email: '' })
  }, [])

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.token),
      isStudent: session.role === 'STUDENT',
      isRecruiter: session.role === 'RECRUITER',
      isAdmin: session.role === 'ADMIN',
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
