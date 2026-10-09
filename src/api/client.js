
/**
 * Single configured Axios instance.
 * Uses the deployed Render backend by default.
 * VITE_API_BASE_URL can override this URL in .env.
 */

import axios from 'axios'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://smart-placement-recruitment-system.onrender.com/api'
).replace(/\/+$/, '')

const TOKEN_KEY = 'sps.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // Storage unavailable; continue without persisting the token.
  }
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

/**
 * Standardized API error.
 */
export class ApiError extends Error {
  constructor(message, status, path, fieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.path = path
    this.fieldErrors = fieldErrors || null
  }
}

function messageFromResponse(error) {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data && typeof data === 'object') {
    if (data.message) return data.message
    if (data.error) return data.error

    if (Array.isArray(data) && data.length && data[0]?.message) {
      return data[0].message
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.'
  }

  if (!error?.response) {
    return (
      `Cannot reach the backend at ${API_BASE_URL}. ` +
      'Check your internet connection, backend availability, and CORS settings.'
    )
  }

  return `Request failed with status ${error.response.status}.`
}

/**
 * Executes an API request and returns the response body.
 */
async function request(config) {
  try {
    const response = await http.request(config)
    return response.data
  } catch (error) {
    throw new ApiError(
      messageFromResponse(error),
      error?.response?.status ?? 0,
      error?.config?.url,
      error?.response?.data?.fieldErrors,
    )
  }
}

export const api = {
  get: (url, config) =>
    request({ ...config, method: 'GET', url }),

  post: (url, data, config) =>
    request({ ...config, method: 'POST', url, data }),

  put: (url, data, config) =>
    request({ ...config, method: 'PUT', url, data }),

  patch: (url, data, config) =>
    request({ ...config, method: 'PATCH', url, data }),

  delete: (url, config) =>
    request({ ...config, method: 'DELETE', url }),
}

/**
 * Downloads a CSV report as a file.
 */
export async function downloadCsv(url, fileName) {
  try {
    const response = await http.get(url, {
      responseType: 'blob',
    })

    const blobUrl = window.URL.createObjectURL(
      new Blob([response.data], { type: 'text/csv' }),
    )

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    throw new ApiError(
      messageFromResponse(error),
      error?.response?.status ?? 0,
      error?.config?.url,
    )
  }
}

/**
 * Opens an authenticated file, such as a resume, in a new tab.
 */
export async function openAuthenticatedFile(url) {
  try {
    const response = await http.get(url, {
      responseType: 'blob',
    })

    const blobUrl = window.URL.createObjectURL(response.data)
    window.open(blobUrl, '_blank', 'noopener,noreferrer')

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 60000)
  } catch (error) {
    throw new ApiError(
      messageFromResponse(error),
      error?.response?.status ?? 0,
      error?.config?.url,
    )
  }
}

export default api