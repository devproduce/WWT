import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { AppText } from '@/components/ui/AppText'
import { useState } from 'react'
import { View } from 'react-native'

export function ReturnNoteModal({
  visible,
  pending,
  taskTitle,
  onCancel,
  onConfirm,
}: {
  visible: boolean
  pending?: boolean
  taskTitle?: string
  onCancel: () => void
  onConfirm: (comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const ready = comment.trim().length >= 8
  return (
    <Modal visible={visible} onClose={onCancel}>
      <AppText variant="cardTitle" style={{ fontSize: 18 }}>
        What should change?
      </AppText>
      {taskTitle ? (
        <AppText style={{ marginTop: 6, color: '#115E59' }}>{taskTitle}</AppText>
      ) : null}
      <AppText variant="caption" style={{ marginTop: 8, marginBottom: 12 }}>
        The member needs a real note so they know what to fix — not a generic bounce.
      </AppText>
      <TextArea value={comment} onChangeText={setComment} placeholder="Describe what is missing or wrong" />
      <AppText variant="caption" style={{ marginTop: 6 }}>
        {comment.trim().length}/8 characters
      </AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button disabled={!ready || pending} pending={pending} onPress={() => ready && onConfirm(comment.trim())}>
          Return for revision
        </Button>
      </View>
    </Modal>
  )
}
