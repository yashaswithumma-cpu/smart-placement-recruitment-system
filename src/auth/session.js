/**
 * JWT session persistence.
 * The token itself lives in localStorage so a refresh keeps the user signed in;
 * the non sensitive profile snapshot is stored alongside it for fast rendering.
 */
import { getToken, setToken } from '../api/client'

const SESSION_KEY = 'sps.session'

const EMPTY = Object.freeze({ token: '', role: '', userId: null, name: '', email: '' })

export function loadSession() {
  const token = getToken()
  if (!token) return { ...EMPTY }

  let stored = null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    stored = raw ? JSON.parse(raw) : null
  } catch {
    stored = null
  }
  if (!stored) return { ...EMPTY }

  return {
    token,
    role: stored.role || '',
    userId: stored.userId ?? null,
    name: stored.name || '',
    email: stored.email || '',
  }
}

/**
 * Persists an AuthResponse coming from any of the three login endpoints.
 * @param {{token: string, role: string, user: {id: number, name: string, email: string}}} auth
 * @returns {{token: string, role: string, userId: number|null, name: string, email: string}}
 */
export function saveSession(auth) {
  const user = auth?.user || {}
  const session = {
    token: auth?.token || '',
    role: auth?.role || '',
    userId: user.id ?? null,
    name: user.name || user.displayName || '',
    email: user.email || '',
  }
  setToken(session.token)
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      role: session.role,
      userId: session.userId,
      name: session.name,
      email: session.email,
    }))
  } catch {
    /* ignore */
  }
  return session
}

export function clearSession() {
  setToken('')
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

/** Reads the JWT payload without verifying it, used only to spot an expired token. */
export function isTokenExpired(token) {
  try {
    const segment = String(token).split('.')[1]
    if (!segment) return false
    // JWT segments are base64url: translate to standard base64 and pad.
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    if (!payload?.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}
