import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { RingChart } from '@/components/charts'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { formatDay, utilization } from '@/lib/utils'
import type { Member, Project } from '@/types'
import { toast } from 'sonner'

const STATUS_EDGE: Record<string, string> = {
  ACTIVE: 'from-teal-500',
  PLANNED: 'from-sky-500',
  ON_HOLD: 'from-amber-500',
  COMPLETED: 'from-emerald-500',
  ARCHIVED: 'from-stone-400',
}

export function ProjectsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<Project[]>('/projects')).data,
  })
  const members = useQuery({
    queryKey: ['members'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => (await api.get<Member[]>('/members')).data,
  })
  const [open, setOpen] = useState(false)
  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post<Project>('/projects', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      toast.success('Project created')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const items = projects.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        subtitle="Boards, progress, and the people steering them."
        actions={user?.role === 'ADMIN' ? <Button onClick={() => setOpen(true)}>Create project</Button> : undefined}
      />
      {items.length === 0 ? (
        <EmptyState title="No projects yet" description="An admin can create the first board for this organization." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((project) => (
            <Link key={project.id} to={`/app/projects/${project.id}`}>
              <Card interactive className="relative h-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${STATUS_EDGE[project.status] ?? 'from-teal-500'} to-transparent`}
                />
                <div className="flex items-start justify-between gap-3 pl-2">
                  <div>
                    <div className="font-semibold text-ink">{project.name}</div>
                    <div className="text-sm text-muted">PM {project.managerName}</div>
                  </div>
                  <Badge tone={statusTone(project.status)}>{project.status}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 pl-2 text-sm text-muted">{project.description}</p>
                <div className="mt-4 flex items-center gap-4 pl-2">
                  <RingChart value={project.doneTasks} max={project.totalTasks || 1} size={68} stroke={8} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">
                      {project.doneTasks}/{project.totalTasks}{' '}
                      {project.canViewFullProgress ? 'complete' : 'your tasks done'}
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-900/8">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: `${utilization(project.doneTasks, project.totalTasks || 1)}%` }}
                      />
                    </div>
                    {project.targetDate && (
                      <div className="mt-2 text-xs text-teal-900/45">Target {formatDay(project.targetDate)}</div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {open && (
        <CreateProjectForm
          members={members.data ?? []}
          pending={create.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(payload) => create.mutate(payload)}
        />
      )}
    </div>
  )
}

function CreateProjectForm({
  members,
  pending,
  onClose,
  onSubmit,
}: {
  members: Member[]
  pending: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const people = members.filter((m) => m.status !== 'DISABLED')
  const membersOnly = people.filter((m) => m.role !== 'ADMIN')
  const [form, setForm] = useState({
    name: '',
    description: '',
    managerId: membersOnly[0]?.id ?? people[0]?.id ?? '',
    memberIds: people.map((m) => m.id),
    targetDate: '',
  })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({
      name: form.name,
      description: form.description,
      managerId: form.managerId,
      memberIds: form.memberIds,
      targetDate: form.targetDate || null,
    })
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-ink">Create project</h2>
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Project Manager">
          <select
            className="app-select"
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
          >
            {people.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.role})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project members (who can receive tasks)">
          <p className="mb-1 text-xs text-muted">
            The Project Manager is always included. Check everyone who should be on this project.
          </p>
          <div className="max-h-40 space-y-1 overflow-auto rounded-2xl border border-teal-900/10 bg-white/70 p-2 dark:border-teal-200/15 dark:bg-teal-700/40">
            {people.map((m) => (
              <label key={m.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-teal-50">
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(m.id) || m.id === form.managerId}
                  disabled={m.id === form.managerId}
                  onChange={(e) => {
                    const next = new Set(form.memberIds)
                    if (e.target.checked) next.add(m.id)
                    else next.delete(m.id)
                    setForm({ ...form, memberIds: [...next] })
                  }}
                />
                {m.firstName} {m.lastName}
                {m.id === form.managerId ? ' (Project Manager)' : ''}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Target date">
          <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}
