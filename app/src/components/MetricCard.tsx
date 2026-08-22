import { RingChart } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { TONE, type Tone, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'teal',
  ring,
  active,
  onPress,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: Tone
  ring?: { value: number; max: number }
  active?: boolean
  onPress?: () => void
}) {
  const colors = TONE[tone]
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.bg },
        active && styles.active,
      ]}
    >
      {icon ? <View style={[styles.icon, { backgroundColor: colors.icon }]}>{icon}</View> : null}
      <View style={styles.copy}>
        <AppText variant="label">{label}</AppText>
        {typeof value === 'string' || typeof value === 'number' ? (
          <AppText variant="metric" style={{ color: colors.text }}>
            {value}
          </AppText>
        ) : (
          value
        )}
        {hint ? <AppText variant="caption">{hint}</AppText> : null}
      </View>
      {ring ? <RingChart value={ring.value} max={ring.max} size={64} stroke={7} tone={tone} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: radii.card,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
  },
  active: { borderWidth: 2, borderColor: 'rgba(13,148,136,0.4)' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
})
