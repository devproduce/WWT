import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'

export function BlockedReasonModal({
  people,
  pending,
  onCancel,
  onConfirm,
}: {
  people: { id: string; name: string }[]
  pending?: boolean
  onCancel: () => void
  onConfirm: (payload: { blockedReason: string; blockedWaitingOnUserId: string | null }) => void
}) {
  const [reason, setReason] = useState('')
  const [waitingOn, setWaitingOn] = useState('')
  const ready = reason.trim().length >= 8
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (ready) onConfirm({ blockedReason: reason.trim(), blockedWaitingOnUserId: waitingOn || null })
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-ink">Why is this blocked?</h2>
        <p className="text-sm text-muted">
          The Project Manager is notified with your name, this task, and the reason.
        </p>
        <Field label="Reason">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Waiting on legal review of the vendor contract"
            rows={3}
            autoFocus
          />
        </Field>
        <div className="font-mono text-[11px] text-teal-800/50">{reason.trim().length}/8 characters</div>
        <Field label="Waiting on (optional)">
          <select className="app-select" value={waitingOn} onChange={(event) => setWaitingOn(event.target.value)}>
            <option value="">Nobody specific</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!ready || pending}>Mark blocked</Button>
        </div>
      </form>
    </Modal>
  )
}
