import { AppText } from '@/components/ui/AppText'
import { colors, fonts, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  )
}

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(19, 78, 74, 0.4)"
      {...props}
      style={[styles.control, style]}
    />
  )
}

export function TextArea({ style, ...props }: TextInputProps) {
  return <Input multiline textAlignVertical="top" {...props} style={[styles.area, style]} />
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  control: {
    width: '100%',
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: 'rgba(18, 49, 46, 0.1)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  area: { minHeight: 96 },
})
