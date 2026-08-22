import { AppText } from '@/components/ui/AppText'
import { colors, radii } from '@/theme/tokens'
import { Pressable, StyleSheet, View } from 'react-native'
import { Modal } from '@/components/ui/modal'

export function OptionSheet({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean
  title: string
  options: { id: string; label: string }[]
  onClose: () => void
  onSelect: (id: string) => void
}) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <AppText variant="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>
        {title}
      </AppText>
      <View style={{ gap: 4 }}>
        {options.map((option) => (
          <Pressable
            key={option.id}
            style={styles.row}
            onPress={() => {
              onSelect(option.id)
              onClose()
            }}
          >
            <AppText>{option.label}</AppText>
          </Pressable>
        ))}
        <Pressable style={[styles.row, styles.cancel]} onPress={onClose}>
          <AppText style={{ color: colors.teal800 }}>Cancel</AppText>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radii.nested,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(240,253,250,0.8)',
  },
  cancel: { backgroundColor: 'rgba(255,255,255,0.6)', marginTop: 8, alignItems: 'center' },
})
