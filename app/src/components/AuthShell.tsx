import { AppText } from '@/components/ui/AppText'
import { WwtMark } from '@/components/WwtMark'
import { colors, fonts, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <View style={styles.canvas}>
      <View style={[styles.orb, styles.orbTeal]} />
      <View style={[styles.orb, styles.orbAmber]} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.brand}>
                <WwtMark />
                <AppText style={styles.wordmark}>WWT</AppText>
              </View>
              <AppText variant="title" style={styles.title}>
                {title}
              </AppText>
              <AppText variant="subtitle" style={styles.subtitle}>
                {subtitle}
              </AppText>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  safe: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.35,
  },
  orbTeal: { top: -80, right: -40, backgroundColor: '#5eead4' },
  orbAmber: { bottom: -40, left: 80, backgroundColor: '#fde68a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radii.card,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    gap: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  wordmark: {
    fontFamily: fonts.sansSemibold,
    fontSize: 18,
    letterSpacing: 4,
    color: colors.teal950,
  },
  title: { fontSize: 24 },
  subtitle: { marginBottom: 16 },
})
