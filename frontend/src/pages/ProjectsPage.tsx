import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import type { Member, Project } from '@/types'
import { toast } from 'sonner'

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {user?.role === 'ADMIN' && <Button onClick={() => setOpen(true)}>Create project</Button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(projects.data ?? []).map((project) => (
          <Link key={project.id} to={`/app/projects/${project.id}`}>
            <Card className="h-full hover:border-teal-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-sm text-slate-500">PM: {project.managerName}</div>
                </div>
                <Badge tone={statusTone(project.status)}>{project.status}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>
              <div className="mt-3 text-xs text-slate-500">
                {project.doneTasks}/{project.totalTasks} tasks complete
              </div>
            </Card>
          </Link>
        ))}
      </div>
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
  const [form, setForm] = useState({
    name: '',
    description: '',
    managerId: people[0]?.id ?? '',
    memberIds: [] as string[],
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
      <form className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" onSubmit={submit}>
        <h2 className="text-lg font-semibold">Create project</h2>
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Project Manager">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
        <Field label="Members">
          <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2">
            {people.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.memberIds.includes(m.id) || m.id === form.managerId}
                  onChange={(e) => {
                    const next = new Set(form.memberIds)
                    if (e.target.checked) next.add(m.id)
                    else next.delete(m.id)
                    setForm({ ...form, memberIds: [...next] })
                  }}
                />
                {m.firstName} {m.lastName}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Target date">
          <Input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>Create</Button>
        </div>
      </form>
    </div>
  )
}
