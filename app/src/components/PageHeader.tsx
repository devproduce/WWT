import { AppText } from '@/components/ui/AppText'
import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
        {typeof title === 'string' ? <AppText variant="title">{title}</AppText> : title}
        {typeof subtitle === 'string' ? (
          <AppText variant="subtitle" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : (
          subtitle
        )}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 },
  copy: { flex: 1, minWidth: 200, gap: 4 },
  subtitle: { marginTop: 4, maxWidth: 520 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
