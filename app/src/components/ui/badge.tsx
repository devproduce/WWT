import { fonts, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

const tones = {
  teal: { bg: 'rgba(204, 251, 241, 0.9)', text: '#134E4A' },
  slate: { bg: '#F5F5F4', text: '#44403C' },
  amber: { bg: '#FEF3C7', text: '#78350F' },
  red: { bg: '#FFE4E6', text: '#9F1239' },
  green: { bg: '#D1FAE5', text: '#065F46' },
  blue: { bg: '#E0F2FE', text: '#0C4A6E' },
  purple: { bg: '#EDE9FE', text: '#5B21B6' },
} as const

export type BadgeTone = keyof typeof tones

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }) {
  const colors = tones[tone] ?? tones.slate
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{children}</Text>
    </View>
  )
}

export function statusTone(status: string): BadgeTone {
  if (status === 'DONE' || status === 'ACTIVE' || status === 'COMPLETED') return 'green'
  if (status === 'REVIEW' || status === 'PLANNED' || status === 'PINNED' || status === 'DUE_TODAY' || status === 'DUE_SOON')
    return 'blue'
  if (status === 'BLOCKED' || status === 'DISABLED' || status === 'URGENT' || status === 'OVERDUE' || status === 'RETURNED')
    return 'red'
  if (status === 'IN_PROGRESS' || status === 'HIGH' || status === 'ON_HOLD') return 'amber'
  if (status === 'TODO' || status === 'PENDING_SETUP' || status === 'LOW') return 'slate'
  if (status === 'MEDIUM') return 'teal'
  return 'slate'
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
