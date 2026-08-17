import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <Button onClick={() => setOpen(true)}>Add member</Button>
      </div>
      {invite && (
        <Card className="border-teal-200 bg-teal-50 text-sm">
          Invite link: <span className="break-all">{invite}</span>
        </Card>
      )}
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {(members.data ?? []).map((member) => (
              <tr key={member.id} className="border-t border-slate-100">
                <td className="py-3 font-medium">
                  {member.firstName} {member.lastName}
                </td>
                <td>{member.email}</td>
                <td>{member.role}</td>
                <td>
                  <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                </td>
                <td className="space-x-2 text-right">
                  {member.role !== 'ADMIN' && (
                    <Button variant="ghost" onClick={() => reset.mutate(member.id)}>
                      Reset password
                    </Button>
                  )}
                  {member.role !== 'ADMIN' && member.status === 'ACTIVE' && (
                    <Button variant="secondary" onClick={() => action.mutate({ id: member.id, path: 'disable' })}>
                      Disable
                    </Button>
                  )}
                  {member.role !== 'ADMIN' && member.status === 'DISABLED' && (
                    <Button variant="secondary" onClick={() => action.mutate({ id: member.id, path: 'enable' })}>
                      Enable
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
      <form className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6" onSubmit={submit}>
        <h2 className="text-lg font-semibold">Add member</h2>
        <Field label="First name">
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        </Field>
        <Field label="Last name">
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>Invite</Button>
        </div>
      </form>
    </div>
  )
}
