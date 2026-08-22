import { cardShadow, colors, radii } from '@/theme/tokens'
import { type ReactNode } from 'react'
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'

export function Modal({
  children,
  visible,
  onClose,
}: {
  children: ReactNode
  visible: boolean
  onClose: () => void
}) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.scrim} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(4, 47, 46, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 512,
    maxHeight: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radii.card,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    ...cardShadow,
    shadowOpacity: 0.28,
    shadowRadius: 80,
  },
})
