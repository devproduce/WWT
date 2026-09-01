import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, apiError, clearTokens, restoreSession, setTokens } from '@/services/api'
import { syncWebPushRegistration, unregisterWebPush } from '@/services/pushNotifications'
import type { AuthResponse, Me } from '@/types'

interface AuthState {
  user: Me | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  setupPassword: (token: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = async () => {
    try {
      const { data } = await api.get<Me>('/auth/me')
      setUser(data)
      await syncWebPushRegistration()
    } catch {
      clearTokens()
      setUser(null)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const token = await restoreSession()
        if (!token) {
          setUser(null)
          return
        }
        await refreshMe()
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
        setTokens(data)
        setUser(data.user)
        await syncWebPushRegistration()
      },
      setupPassword: async (token, password) => {
        const { data } = await api.post<AuthResponse>('/auth/setup-password', { token, password })
        setTokens(data)
        setUser(data.user)
        await syncWebPushRegistration()
      },
      logout: async () => {
        try {
          await unregisterWebPush()
          await api.post('/auth/logout')
        } finally {
          clearTokens()
          setUser(null)
        }
      },
      refreshMe,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { apiError }
