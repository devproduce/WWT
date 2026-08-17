import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Avatar } from '@/components/charts'
import { api, apiError } from '@/services/api'
import type { Member } from '@/types'
import { toast } from 'sonner'

export function MembersPage() {
  const queryClient = useQueryClient()
  const members = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<Member[]>('/members')).data,
  })
  const [open, setOpen] = useState(false)
  const [invite, setInvite] = useState<string | null>(null)
  const create = useMutation({
    mutationFn: async (payload: { firstName: string; lastName: string; email: string }) =>
      (await api.post<Member>('/members', payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      if (data.inviteToken) setInvite(`${window.location.origin}/setup-password?token=${data.inviteToken}`)
      toast.success('Member invited')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const reset = useMutation({
    mutationFn: async (id: string) => (await api.post<Member>(`/members/${id}/reset-password`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      if (data.inviteToken) {
        setInvite(`${window.location.origin}/setup-password?token=${data.inviteToken}`)
      }
      toast.success('Password reset invite created')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const action = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => api.patch(`/members/${id}/${path}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
    onError: (err) => toast.error(apiError(err)),
  })
  const items = members.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="Members"
        subtitle="Who can log in, take work, and run delivery."
        actions={<Button onClick={() => setOpen(true)}>Add member</Button>}
      />
      {invite && (
        <Card className="border-teal-200 bg-teal-50/80 text-sm">
          Invite link: <span className="break-all">{invite}</span>
        </Card>
      )}
      {items.length === 0 ? (
        <EmptyState title="No members yet" description="Invite the first person into this organization." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((member) => (
            <Card key={member.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <Avatar name={`${member.firstName} ${member.lastName}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-teal-950">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="truncate text-sm text-teal-900/50">{member.email}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge tone={member.role === 'ADMIN' ? 'teal' : 'slate'}>{member.role}</Badge>
                    <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                  </div>
                </div>
              </div>
              {member.role !== 'ADMIN' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => reset.mutate(member.id)}>
                    Reset password
                  </Button>
                  {member.status === 'ACTIVE' && (
                    <Button variant="secondary" onClick={() => action.mutate({ id: member.id, path: 'disable' })}>
                      Disable
                    </Button>
                  )}
                  {member.status === 'DISABLED' && (
                    <Button variant="secondary" onClick={() => action.mutate({ id: member.id, path: 'enable' })}>
                      Enable
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {open && <AddMemberForm pending={create.isPending} onClose={() => setOpen(false)} onSubmit={(p) => create.mutate(p)} />}
    </div>
  )
}

function AddMemberForm({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean
  onClose: () => void
  onSubmit: (payload: { firstName: string; lastName: string; email: string }) => void
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(form)
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-teal-950">Add member</h2>
        <Field label="First name">
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        </Field>
        <Field label="Last name">
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>Invite</Button>
        </div>
      </form>
    </Modal>
  )
}
