import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { StorageBar, UsageBar } from '@/components/Stat'
import { api, apiError } from '@/services/api'
import type { OrganizationSummary, Plan } from '@/types'
import { toast } from 'sonner'

export function SuperAdminOrganizations({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient()
  const orgs = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => (await api.get<OrganizationSummary[]>('/organizations')).data,
  })
  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get<Plan[]>('/plans')).data,
  })
  const [open, setOpen] = useState(false)
  const [invite, setInvite] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      (await api.post<OrganizationSummary>('/organizations', payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      if (data.inviteToken) {
        setInvite(`${window.location.origin}/setup-password?token=${data.inviteToken}`)
      }
      toast.success('Organization created')
    },
    onError: (err) => toast.error(apiError(err)),
  })

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <Button onClick={() => setOpen(true)}>Create organization</Button>
        </div>
      )}
      {embedded && (
        <div className="flex items-center justify-between">
          <CardTitle>Customers</CardTitle>
          <Button onClick={() => setOpen(true)}>Create organization</Button>
        </div>
      )}
      {invite && (
        <Card className="border-teal-200 bg-teal-50">
          <div className="text-sm font-medium">Admin invite link (development)</div>
          <div className="mt-1 break-all text-sm">{invite}</div>
        </Card>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2">Organization</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Members</th>
                <th className="pb-2">Projects</th>
                <th className="pb-2">Storage</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {(orgs.data ?? []).map((org) => (
                <tr key={org.id} className="border-t border-slate-100">
                  <td className="py-3">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-slate-500">{org.adminEmail}</div>
                  </td>
                  <td>{org.planName}</td>
                  <td>
                    <Badge tone={statusTone(org.status)}>{org.status}</Badge>
                  </td>
                  <td className="w-40">
                    <UsageBar used={org.memberCount} max={org.quotas.maxMembers} />
                  </td>
                  <td className="w-40">
                    <UsageBar used={org.projectCount} max={org.quotas.maxProjects} />
                  </td>
                  <td className="w-40">
                    <StorageBar used={org.storageUsedBytes} max={org.quotas.maxStorageBytes} />
                  </td>
                  <td>
                    <Link className="text-teal-700" to={`/app/organizations/${org.id}`}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {open && (
        <CreateOrgForm
          plans={plans.data ?? []}
          onClose={() => setOpen(false)}
          onSubmit={(payload) => create.mutate(payload)}
          pending={create.isPending}
        />
      )}
    </div>
  )
}

function CreateOrgForm({
  plans,
  onClose,
  onSubmit,
  pending,
}: {
  plans: Plan[]
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
  pending: boolean
}) {
  const [form, setForm] = useState({
    name: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    planId: plans[0]?.id ?? '',
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
      <form className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" onSubmit={submit}>
        <h2 className="text-lg font-semibold">Create organization</h2>
        <Field label="Organization name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Admin first name">
            <Input value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} required />
          </Field>
          <Field label="Admin last name">
            <Input value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} required />
          </Field>
        </div>
        <Field label="Admin email">
          <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
        </Field>
        <Field label="Plan">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.planId}
            onChange={(e) => setForm({ ...form, planId: e.target.value })}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.quotas.maxMembers} members · {plan.quotas.maxProjects} projects
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>{pending ? 'Creating…' : 'Create'}</Button>
        </div>
      </form>
    </div>
  )
}

export function OrganizationDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const org = useQuery({
    queryKey: ['organization', id],
    queryFn: async () => (await api.get<OrganizationSummary>(`/organizations/${id}`)).data,
  })
  const act = useMutation({
    mutationFn: async (path: string) => (await api.patch<OrganizationSummary>(path)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const reset = useMutation({
    mutationFn: async () => (await api.post<OrganizationSummary>(`/organizations/${id}/reset-admin`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      if (data.inviteToken) {
        toast.success(`Admin reset. Invite: ${window.location.origin}/setup-password?token=${data.inviteToken}`)
      }
    },
  })

  if (!org.data) return <p>Loading…</p>
  const item = org.data
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{item.name}</h1>
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(item.status)}>{item.status}</Badge>
          <span className="text-sm text-slate-500">
            {item.planName} · Admin {item.adminName} ({item.adminEmail})
          </span>
        </div>
        <UsageBar used={item.memberCount} max={item.quotas.maxMembers} suffix="members" />
        <UsageBar used={item.projectCount} max={item.quotas.maxProjects} suffix="projects" />
        <StorageBar used={item.storageUsedBytes} max={item.quotas.maxStorageBytes} />
        <div className="flex gap-2 pt-2">
          {item.status === 'ACTIVE' ? (
            <Button variant="danger" onClick={() => act.mutate(`/organizations/${id}/disable`)}>
              Disable
            </Button>
          ) : (
            <Button onClick={() => act.mutate(`/organizations/${id}/enable`)}>Enable</Button>
          )}
          <Button variant="secondary" onClick={() => reset.mutate()}>
            Reset Admin
          </Button>
        </div>
      </Card>
    </div>
  )
}
