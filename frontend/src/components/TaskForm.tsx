import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import type { Project, TaskPriority } from '@/types'

export type TaskFormValues = {
  title: string
  description: string
  assigneeId: string
  priority: TaskPriority
  deadline: string
}

type TaskFormProps = {
  mode: 'create' | 'edit'
  initialValues?: Partial<TaskFormValues>
  people: { id: string; name: string }[]
  pending: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}

const defaultValues: TaskFormValues = {
  title: '',
  description: '',
  assigneeId: '',
  priority: 'MEDIUM',
  deadline: '',
}

export function TaskForm({ mode, initialValues, people, pending, onClose, onSubmit }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormValues>({
    ...defaultValues,
    ...initialValues,
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId || null,
      priority: form.priority,
      deadline: form.deadline || null,
    })
  }

  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-teal-950">{mode === 'create' ? 'New task' : 'Edit task'}</h2>
        <Field label="Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Assignee">
          <select
            className="app-select"
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {people.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {people.length === 0 && (
            <p className="mt-1 text-xs text-teal-900/50">
              No assignable members yet. An Admin must add members to this project first.
            </p>
          )}
        </Field>
        <Field label="Priority">
          <select
            className="app-select"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
          >
            <option>LOW</option>
            <option>MEDIUM</option>
            <option>HIGH</option>
            <option>URGENT</option>
          </select>
        </Field>
        <Field label="Deadline">
          <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>{mode === 'create' ? 'Create' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function assignablePeople(project: Project) {
  return project.members ?? []
}
