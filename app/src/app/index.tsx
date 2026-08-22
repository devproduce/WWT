import { useAuth } from '@/features/auth/AuthContext'
import { colors } from '@/theme/tokens'
import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function IndexScreen() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal800} />
      </View>
    )
  }
  if (user) return <Redirect href="/(main)" />
  return <Redirect href="/login" />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
})
