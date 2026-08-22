import { initials } from '@/lib/utils'
import { TONE, type Tone } from '@/theme/tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

export function RingChart({
  value,
  max = 100,
  size = 88,
  stroke = 9,
  tone = 'teal',
  label,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  tone?: Tone
  label?: ReactNode
}) {
  const pct = max ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  const colors = TONE[tone]
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.track} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.center}>
          {label ?? <Text style={styles.pct}>{pct}%</Text>}
        </View>
      </View>
    </View>
  )
}

export function StatusDonut({
  segments,
  size = 148,
  stroke = 16,
}: {
  segments: { value: number; color: string }[]
  size?: number
  stroke?: number
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4eeea" strokeWidth={stroke} />
      {segments.map((segment, index) => {
        const len = (segment.value / total) * c
        const circle = (
          <Circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={segment.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        )
        offset += len
        return circle
      })}
    </Svg>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 48 : size === 'sm' ? 32 : 40
  const type = size === 'lg' ? 14 : size === 'sm' ? 10 : 12
  return (
    <LinearGradient colors={['#0D9488', '#10B981']} style={[styles.avatar, { width: box, height: box, borderRadius: box / 2 }]}>
      <Text style={[styles.initials, { fontSize: type }]}>{initials(name) || '?'}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pct: { fontSize: 14, fontWeight: '600', color: '#042F2E' },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(15,118,110)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  initials: { color: '#fff', fontWeight: '600' },
})
