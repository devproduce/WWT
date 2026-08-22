import { AppText } from '@/components/ui/AppText'
import { StyleSheet, View } from 'react-native'

export default function TaskPlaceholder() {
  return (
    <View style={styles.center}>
      <AppText variant="caption">Loading task…</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
})
