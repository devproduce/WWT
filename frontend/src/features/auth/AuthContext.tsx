import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, apiError, clearTokens, setTokens } from '@/services/api'
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
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('wwt_access')
    if (!token) {
      setLoading(false)
      return
    }
    void refreshMe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
        setTokens(data)
        setUser(data.user)
      },
      setupPassword: async (token, password) => {
        const { data } = await api.post<AuthResponse>('/auth/setup-password', { token, password })
        setTokens(data)
        setUser(data.user)
      },
      logout: async () => {
        try {
          await api.post('/auth/logout', { refreshToken: localStorage.getItem('wwt_refresh') })
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
