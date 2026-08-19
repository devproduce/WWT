import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/config'
import type { AuthResponse } from '@/types'

let accessToken: string | null = null

const SKIP_REFRESH = ['/auth/login', '/auth/setup-password', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh', '/auth/logout']

export function getAccessToken() {
  return accessToken
}

export function setTokens(auth: Pick<AuthResponse, 'accessToken'>) {
  accessToken = auth.accessToken
}

export function clearTokens() {
  accessToken = null
}

function shouldSkipRefresh(url: string | undefined) {
  if (!url) return false
  return SKIP_REFRESH.some((path) => url.includes(path))
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken() {
  try {
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true },
    )
    setTokens(data)
    return data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

export async function restoreSession() {
  try {
    localStorage.removeItem('wwt_access')
    localStorage.removeItem('wwt_refresh')
  } catch {
    // ignore private-mode storage errors
  }
  return refreshAccessToken()
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry && !shouldSkipRefresh(original.url)) {
      original._retry = true
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null
        })
        const token = await refreshing
        if (token) {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }
      } catch {
        clearTokens()
      }
    }
    return Promise.reject(error)
  },
)

export function apiError(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}
