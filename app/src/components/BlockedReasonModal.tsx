import { Button } from '@/components/ui/button'
import { Field, TextArea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { AppText } from '@/components/ui/AppText'
import { colors, radii } from '@/theme/tokens'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

export function BlockedReasonModal({
  visible,
  people,
  pending,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  people: { id: string; name: string }[]
  pending?: boolean
  onCancel: () => void
  onConfirm: (payload: { blockedReason: string; blockedWaitingOnUserId: string | null }) => void
}) {
  const [reason, setReason] = useState('')
  const [waitingOn, setWaitingOn] = useState('')
  const ready = reason.trim().length >= 8

  return (
    <Modal visible={visible} onClose={onCancel}>
      <AppText variant="cardTitle" style={{ fontSize: 18 }}>
        Why is this blocked?
      </AppText>
      <AppText variant="caption" style={{ marginTop: 8, marginBottom: 16 }}>
        The Project Manager is notified with your name, this task, and the reason.
      </AppText>
      <Field label="Reason">
        <TextArea
          value={reason}
          onChangeText={setReason}
          placeholder="Waiting on legal review of the vendor contract"
        />
      </Field>
      <AppText variant="caption" style={{ marginTop: 6 }}>
        {reason.trim().length}/8 characters
      </AppText>
      <View style={{ marginTop: 12 }}>
        <Field label="Waiting on (optional)">
          <View style={styles.people}>
            <Pressable
              style={[styles.chip, waitingOn === '' && styles.chipOn]}
              onPress={() => setWaitingOn('')}
            >
              <AppText variant="caption">Nobody specific</AppText>
            </Pressable>
            {people.map((person) => (
              <Pressable
                key={person.id}
                style={[styles.chip, waitingOn === person.id && styles.chipOn]}
                onPress={() => setWaitingOn(person.id)}
              >
                <AppText variant="caption">{person.name}</AppText>
              </Pressable>
            ))}
          </View>
        </Field>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!ready || pending}
          pending={pending}
          onPress={() => {
            if (ready) onConfirm({ blockedReason: reason.trim(), blockedWaitingOnUserId: waitingOn || null })
          }}
        >
          Mark blocked
        </Button>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(18,49,46,0.1)',
  },
  chipOn: { backgroundColor: colors.teal50, borderColor: colors.teal300 },
})
