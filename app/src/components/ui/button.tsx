import { colors, fonts, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  children,
  variant = 'primary',
  disabled,
  pending,
  onPress,
  style,
}: {
  children: ReactNode
  variant?: Variant
  disabled?: boolean
  pending?: boolean
  onPress?: () => void
  style?: object
}) {
  const idle = disabled || pending
  return (
    <Pressable
      accessibilityRole="button"
      disabled={idle}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !idle && styles.pressed,
        idle && styles.idle,
        style,
      ]}
    >
      {pending ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.teal800 : colors.white} /> : null}
      <View style={styles.row}>
        {typeof children === 'string' ? (
          <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel, variant === 'ghost' && styles.ghostLabel]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: {
    backgroundColor: colors.teal800,
    shadowColor: 'rgb(15,118,110)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(18, 49, 46, 0.1)',
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.rose600 },
  pressed: { transform: [{ translateY: -2 }], opacity: 0.92 },
  idle: { opacity: 0.5 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.white },
  secondaryLabel: { color: colors.teal950 },
  ghostLabel: { color: colors.teal800 },
})
