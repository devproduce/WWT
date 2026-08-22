import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { ToastHost } from '@/components/Toast'
import { AuthProvider } from '@/features/auth/AuthContext'
import { useWwtFonts } from '@/theme/fonts'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useWwtFonts()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  )

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <ToastHost />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
