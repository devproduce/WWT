import { AppText } from '@/components/ui/AppText'
import { radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <View style={styles.box}>
      <View style={styles.orb} />
      <AppText variant="cardTitle">{title}</AppText>
      <AppText variant="caption" style={styles.desc}>
        {description}
      </AppText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(18, 49, 46, 0.12)',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    backgroundColor: '#99F6E4',
  },
  desc: { marginTop: 4, maxWidth: 320, textAlign: 'center' },
  action: { marginTop: 16 },
})
