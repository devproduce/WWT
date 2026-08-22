import { STATUS_SEGMENTS } from '@/theme/tokens'
import { StyleSheet, Text, View } from 'react-native'

export function StatusStack({
  counts,
}: {
  counts: { todo?: number; inProgress?: number; review?: number; blocked?: number; done?: number }
}) {
  const values = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    value: Number(counts[segment.key as keyof typeof counts] ?? 0),
  }))
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {total === 0 ? (
          <View style={[styles.seg, { flex: 1, backgroundColor: 'rgba(18,49,46,0.08)' }]} />
        ) : (
          values
            .filter((item) => item.value > 0)
            .map((item) => (
              <View
                key={item.key}
                style={[styles.seg, { flex: item.value, backgroundColor: item.color }]}
              />
            ))
        )}
      </View>
      <View style={styles.legend}>
        {values.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label} <Text style={styles.legendCount}>{item.value}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  bar: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(18,49,46,0.08)',
    flexDirection: 'row',
  },
  seg: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: 'rgba(19,78,74,0.7)' },
  legendCount: { fontWeight: '600', color: '#042F2E' },
})
