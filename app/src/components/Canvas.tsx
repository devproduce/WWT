import { colors } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

export function Canvas({ children }: { children: ReactNode }) {
  return (
    <View style={styles.canvas}>
      <View style={[styles.orb, styles.teal]} />
      <View style={[styles.orb, styles.amber]} />
      <View style={[styles.orb, styles.sky]} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: colors.canvas, padding: 12 },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.35 },
  teal: { top: -80, left: 20, width: 260, height: 260, backgroundColor: '#5eead4' },
  amber: { top: 180, right: -60, width: 280, height: 280, backgroundColor: '#fde68a' },
  sky: { bottom: 40, left: 80, width: 220, height: 220, backgroundColor: '#7dd3fc' },
})
