import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '@/types'

const ACCESS = 'wwt_access'
const REFRESH = 'wwt_refresh'

export function getAccessToken() {
  return localStorage.getItem(ACCESS)
}

export function setTokens(auth: AuthResponse) {
  localStorage.setItem(ACCESS, auth.accessToken)
  localStorage.setItem(REFRESH, auth.refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

export const api = axios.create({
  baseURL: '/api',
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
  const refreshToken = localStorage.getItem(REFRESH)
  if (!refreshToken) return null
  const { data } = await axios.post<AuthResponse>('/api/auth/refresh', { refreshToken })
  setTokens(data)
  return data.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
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
