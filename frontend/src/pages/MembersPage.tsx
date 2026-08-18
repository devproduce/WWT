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

type MemberForm = { firstName: string; lastName: string; email: string }

function inviteLink(token: string) {
  return `${window.location.origin}/setup-password?token=${token}`
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const members = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<Member[]>('/members')).data,
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [invite, setInvite] = useState<string | null>(null)

  const refreshMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: async (payload: MemberForm) => (await api.post<Member>('/members', payload)).data,
    onSuccess: (data) => {
      refreshMembers()
      setOpen(false)
      if (data.inviteToken) setInvite(inviteLink(data.inviteToken))
      toast.success('Member invited')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: MemberForm }) =>
      (await api.patch<Member>(`/members/${id}`, payload)).data,
    onSuccess: (data) => {
      refreshMembers()
      setEditing(null)
      if (data.inviteToken) setInvite(inviteLink(data.inviteToken))
      toast.success(data.inviteToken ? 'Details saved. A new invite was sent.' : 'Member updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const reset = useMutation({
    mutationFn: async (id: string) => (await api.post<Member>(`/members/${id}/reset-password`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      if (data.inviteToken) setInvite(inviteLink(data.inviteToken))
      toast.success('Password reset invite created')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const resend = useMutation({
    mutationFn: async (id: string) => (await api.post<Member>(`/members/${id}/resend-invite`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      if (data.inviteToken) setInvite(inviteLink(data.inviteToken))
      toast.success('Invite resent')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const cancelInvite = useMutation({
    mutationFn: async (id: string) => api.post(`/members/${id}/cancel-invite`),
    onSuccess: () => {
      refreshMembers()
      setInvite(null)
      toast.success('Invite cancelled. The old link no longer works.')
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
                  <Button variant="ghost" onClick={() => setEditing(member)}>
                    Edit
                  </Button>
                  {member.status === 'PENDING_SETUP' ? (
                    <>
                      <Button
                        variant="secondary"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate(member.id)}
                      >
                        Resend invite
                      </Button>
                      <Button
                        variant="danger"
                        disabled={cancelInvite.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Cancel the invite for ${member.firstName} ${member.lastName}? Their setup link will stop working.`,
                            )
                          ) {
                            cancelInvite.mutate(member.id)
                          }
                        }}
                      >
                        Cancel invite
                      </Button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {open && (
        <MemberFormModal
          title="Add member"
          submitLabel="Invite"
          pending={create.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(payload) => create.mutate(payload)}
        />
      )}
      {editing && (
        <MemberFormModal
          title="Edit member"
          submitLabel="Save"
          pending={update.isPending}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(payload) => update.mutate({ id: editing.id, payload })}
        />
      )}
    </div>
  )
}

function MemberFormModal({
  title,
  submitLabel,
  pending,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  pending: boolean
  initial?: Pick<Member, 'firstName' | 'lastName' | 'email'>
  onClose: () => void
  onSubmit: (payload: MemberForm) => void
}) {
  const [form, setForm] = useState<MemberForm>({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(form)
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-teal-950">{title}</h2>
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
          <Button disabled={pending}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  )
}
