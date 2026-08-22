import { bytes, utilization } from '@/lib/utils'
import { StyleSheet, Text, View } from 'react-native'

export function QuotaMeter({
  label,
  used,
  max,
  format = 'count',
}: {
  label: string
  used: number
  max: number
  format?: 'count' | 'bytes'
}) {
  const pct = utilization(used, max)
  const tone = pct >= 90 ? '#e11d48' : pct >= 70 ? '#d97706' : '#0d9488'
  const display = format === 'bytes' ? `${bytes(used)} / ${bytes(max)}` : `${used} / ${max}`
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.label}>
          {display} · {pct}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(17, 94, 89, 0.55)',
    fontFamily: 'IBMPlexMono_400Regular',
  },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(18,49,46,0.08)' },
  fill: { height: '100%', borderRadius: 999 },
})
