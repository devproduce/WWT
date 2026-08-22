import { useAuth } from '@/features/auth/AuthContext'
import { colors } from '@/theme/tokens'
import { Redirect, Slot } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function MainLayout() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal800} />
      </View>
    )
  }
  if (!user) return <Redirect href="/login" />
  return <Slot />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
})
