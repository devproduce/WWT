import { AppText } from '@/components/ui/AppText'
import { StyleSheet, View } from 'react-native'

export default function ProjectsPlaceholder() {
  return (
    <View style={styles.center}>
      <AppText variant="caption">Loading projects…</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
})
