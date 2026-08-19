import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'

export function ReturnNoteModal({
  pending,
  onCancel,
  onConfirm,
}: {
  pending?: boolean
  onCancel: () => void
  onConfirm: (comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const ready = comment.trim().length >= 8
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (ready) onConfirm(comment.trim())
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-teal-950">What should change?</h2>
        <p className="text-sm text-teal-900/55">
          The member needs a real note so they know what to fix — not a generic bounce.
        </p>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Describe what is missing or wrong"
          rows={4}
          autoFocus
        />
        <div className="font-mono text-[11px] text-teal-800/50">{comment.trim().length}/8 characters</div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!ready || pending}>Return for revision</Button>
        </div>
      </form>
    </Modal>
  )
}
