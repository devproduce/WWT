import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useWwtFonts } from '@/theme/fonts'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useWwtFonts()

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  )
}

