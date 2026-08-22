import { AppText } from '@/components/ui/AppText'
import { cardShadow, colors, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'

export function Card({
  children,
  interactive,
  onPress,
  style,
}: {
  children: ReactNode
  interactive?: boolean
  onPress?: () => void
  style?: ViewStyle
}) {
  const body = (
    <View style={[styles.card, interactive && styles.interactive, style]}>{children}</View>
  )
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { transform: [{ translateY: -4 }] }}>
        {body}
      </Pressable>
    )
  }
  return body
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <AppText variant="cardTitle">{children}</AppText>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    borderRadius: radii.card,
    padding: 24,
    overflow: 'hidden',
    ...cardShadow,
  },
  interactive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
})
