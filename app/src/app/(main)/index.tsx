import { AppText } from '@/components/ui/AppText'
import { colors } from '@/theme/tokens'
import { StyleSheet, View } from 'react-native'

export default function MainHomePlaceholder() {
  return (
    <View style={styles.center}>
      <AppText variant="title">My work</AppText>
      <AppText variant="subtitle">Loading workspace…</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, padding: 24 },
})
