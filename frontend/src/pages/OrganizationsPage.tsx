import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { QuotaMeter } from '@/components/QuotaMeter'
import { MetricCard } from '@/components/MetricCard'
import { api, apiError } from '@/services/api'
import type { FeatureEntitlements, OrganizationSummary, Plan } from '@/types'
import { toast } from 'sonner'
import { Building2, FolderKanban, HardDrive } from 'lucide-react'

const FEATURE_OPTIONS: { key: keyof FeatureEntitlements; label: string }[] = [
  { key: 'kanban', label: 'Kanban' },
  { key: 'comments', label: 'Comments' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'fileAttachments', label: 'File Attachments' },
  { key: 'advancedReporting', label: 'Advanced Reporting' },
]

function entitlementsFromPlan(plan?: Plan): FeatureEntitlements {
  return {
    kanban: plan?.entitlements.kanban ?? true,
    comments: plan?.entitlements.comments ?? true,
    notifications: plan?.entitlements.notifications ?? true,
    fileAttachments: plan?.entitlements.fileAttachments ?? false,
    advancedReporting: plan?.entitlements.advancedReporting ?? false,
  }
}

function FeatureToggles({
  value,
  onChange,
}: {
  value: FeatureEntitlements
  onChange: (next: FeatureEntitlements) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {FEATURE_OPTIONS.map((feature) => (
        <label
          key={feature.key}
          className="flex items-center gap-2 rounded-2xl border border-teal-900/8 bg-white/70 px-3 py-2 text-sm"
        >
          <input
            type="checkbox"
            checked={value[feature.key]}
            onChange={(e) => onChange({ ...value, [feature.key]: e.target.checked })}
          />
          {feature.label}
        </label>
      ))}
    </div>
  )
}

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
  const items = orgs.data ?? []

  return (
    <div className="space-y-5">
      {!embedded && (
        <PageHeader
          eyebrow="Platform"
          title="Organizations"
          subtitle="Customers, plans, and the quotas that keep the fleet honest."
          actions={<Button onClick={() => setOpen(true)}>Create organization</Button>}
        />
      )}
      {embedded && (
        <div className="flex items-center justify-between">
          <CardTitle>Customers</CardTitle>
          <Button onClick={() => setOpen(true)}>Create organization</Button>
        </div>
      )}
      {invite && (
        <Card className="border-teal-200 bg-teal-50/80">
          <div className="text-sm font-medium">Admin invite link (development)</div>
          <div className="mt-1 break-all text-sm">{invite}</div>
        </Card>
      )}
      {items.length === 0 ? (
        <EmptyState title="No organizations" description="Create the first customer tenant on the platform." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((org) => (
            <Link key={org.id} to={`/app/organizations/${org.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-teal-950">{org.name}</div>
                    <div className="text-xs text-teal-900/50">
                      {org.planName} · {org.adminEmail}
                    </div>
                  </div>
                  <Badge tone={statusTone(org.status)}>{org.status}</Badge>
                </div>
                <div className="mt-5 space-y-3">
                  <QuotaMeter label="Members" used={org.memberCount} max={org.quotas.maxMembers} />
                  <QuotaMeter label="Projects" used={org.projectCount} max={org.quotas.maxProjects} />
                  <QuotaMeter label="Storage" used={org.storageUsedBytes} max={org.quotas.maxStorageBytes} format="bytes" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
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
    entitlements: entitlementsFromPlan(plans[0]),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-teal-950">Create organization</h2>
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
            className="app-select"
            value={form.planId}
            onChange={(e) => {
              const planId = e.target.value
              const plan = plans.find((item) => item.id === planId)
              setForm({ ...form, planId, entitlements: entitlementsFromPlan(plan) })
            }}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.quotas.maxMembers} members · {plan.quotas.maxProjects} projects
              </option>
            ))}
          </select>
        </Field>
        <Field label="Enabled features">
          <p className="mb-2 text-xs text-teal-900/50">Prefills from the selected plan. Override any feature for this organization.</p>
          <FeatureToggles value={form.entitlements} onChange={(entitlements) => setForm({ ...form, entitlements })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>{pending ? 'Creating…' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
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
  const saveEntitlements = useMutation({
    mutationFn: async (payload: FeatureEntitlements) =>
      (await api.put<OrganizationSummary>(`/organizations/${id}/entitlements`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', id] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Features updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const [entitlements, setEntitlements] = useState<FeatureEntitlements | null>(null)

  useEffect(() => {
    if (org.data) {
      setEntitlements(org.data.entitlements ?? entitlementsFromPlan())
    }
  }, [org.data])

  if (!org.data) return <p className="py-16 text-center text-sm text-teal-900/50">Loading…</p>
  const item = org.data
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer"
        title={item.name}
        subtitle={`${item.planName} · Admin ${item.adminName}`}
        actions={
          <>
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
          </>
        }
      />
      <div className="flex items-center gap-2">
        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
        <span className="text-sm text-teal-900/50">{item.adminEmail}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Members"
          value={`${item.memberCount} / ${item.quotas.maxMembers}`}
          icon={<Building2 className="h-5 w-5" />}
          tone="teal"
          ring={{ value: item.memberCount, max: item.quotas.maxMembers }}
        />
        <MetricCard
          label="Projects"
          value={`${item.projectCount} / ${item.quotas.maxProjects}`}
          icon={<FolderKanban className="h-5 w-5" />}
          tone="sky"
          ring={{ value: item.projectCount, max: item.quotas.maxProjects }}
        />
        <MetricCard
          label="Storage"
          value={`${Math.round((item.storageUsedBytes / Math.max(item.quotas.maxStorageBytes, 1)) * 100)}%`}
          icon={<HardDrive className="h-5 w-5" />}
          tone="amber"
          ring={{ value: item.storageUsedBytes, max: item.quotas.maxStorageBytes }}
        />
      </div>
      <Card className="space-y-4">
        <CardTitle>Quota meters</CardTitle>
        <QuotaMeter label="Members" used={item.memberCount} max={item.quotas.maxMembers} />
        <QuotaMeter label="Projects" used={item.projectCount} max={item.quotas.maxProjects} />
        <QuotaMeter label="Storage" used={item.storageUsedBytes} max={item.quotas.maxStorageBytes} format="bytes" />
      </Card>
      {entitlements && (
        <Card className="space-y-3">
          <CardTitle>Enabled features</CardTitle>
          <p className="text-sm text-teal-900/50">
            These flags override the plan defaults for this organization. File Attachments must be on for task uploads.
          </p>
          <FeatureToggles value={entitlements} onChange={setEntitlements} />
          <div>
            <Button disabled={saveEntitlements.isPending} onClick={() => saveEntitlements.mutate(entitlements)}>
              {saveEntitlements.isPending ? 'Saving…' : 'Save features'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
