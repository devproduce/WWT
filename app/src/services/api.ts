import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'
import type { AuthResponse } from '@/types'

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.weworktogether.me').replace(/\/$/, '')
const REFRESH_KEY = 'wwt_refresh'
const SKIP_REFRESH = [
  '/auth/login',
  '/auth/setup-password',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/auth/logout',
]

let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export async function setTokens(auth: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) {
  accessToken = auth.accessToken
  if (auth.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, auth.refreshToken)
  }
}

export async function clearTokens() {
  accessToken = null
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}

function shouldSkipRefresh(url: string | undefined) {
  if (!url) return false
  return SKIP_REFRESH.some((path) => url.includes(path))
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
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
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
    if (!refreshToken) {
      await clearTokens()
      return null
    }
    const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
    await setTokens(data)
    return data.accessToken
  } catch {
    await clearTokens()
    return null
  }
}

export async function restoreSession() {
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
        await clearTokens()
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
