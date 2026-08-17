import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { formatDay } from '@/lib/utils'
import type { Project, ProjectReport, TaskItem, TaskPriority, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { toast } from 'sonner'
import { CSS } from '@dnd-kit/utilities'

export function ProjectBoardPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const project = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
  })
  const tasks = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => (await api.get<TaskItem[]>(`/projects/${id}/tasks`)).data,
  })
  const report = useQuery({
    queryKey: ['report', id],
    enabled: Boolean(id) && (user?.role === 'ADMIN' || user?.id === project.data?.managerId),
    queryFn: async () => (await api.get<ProjectReport>(`/projects/${id}/report`)).data,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const canManage = user?.role === 'ADMIN' || user?.id === project.data?.managerId

  const transition = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.post(`/tasks/${taskId}/transition`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(apiError(err, 'That move is not allowed')),
  })
  const createTask = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api.post(`/projects/${id}/tasks`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      setCreateOpen(false)
      toast.success('Task created')
    },
    onError: (err) => toast.error(apiError(err)),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const onDragEnd = (event: DragEndEvent) => {
    const over = event.over?.id as TaskStatus | undefined
    const taskId = String(event.active.id)
    const task = (tasks.data ?? []).find((item) => item.id === taskId)
    if (!over || !task || over === task.status) return
    transition.mutate({ taskId, status: over })
  }

  if (!project.data) return <p>Loading project…</p>
  const items = tasks.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.data.name}</h1>
          <p className="text-sm text-slate-500">
            PM {project.data.managerName} · {project.data.doneTasks}/{project.data.totalTasks} done
          </p>
        </div>
        {canManage && <Button onClick={() => setCreateOpen(true)}>New task</Button>}
      </div>
      {report.data && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <div className="text-sm text-slate-500">Completion</div>
            <div className="text-2xl font-semibold">{report.data.completionPercent}%</div>
          </Card>
          <Card>
            <div className="text-sm text-slate-500">Overdue</div>
            <div className="text-2xl font-semibold">{report.data.overdue}</div>
          </Card>
          <Card>
            <div className="text-sm text-slate-500">In review</div>
            <div className="text-2xl font-semibold">{report.data.review}</div>
          </Card>
          <Card>
            <CardTitle>By member</CardTitle>
            <div className="mt-2 space-y-1 text-sm">
              {Object.entries(report.data.tasksByMember).map(([name, count]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-3 lg:grid-cols-5">
          {TASK_COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} label={col.label} tasks={items.filter((t) => t.status === col.id)} />
          ))}
        </div>
      </DndContext>
      {createOpen && project.data && (
        <CreateTaskForm
          people={project.data.members ?? []}
          pending={createTask.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(payload) => createTask.mutate(payload)}
        />
      )}
    </div>
  )
}

function Column({ id, label, tasks }: { id: TaskStatus; label: string; tasks: TaskItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`min-h-72 rounded-xl border bg-slate-50 p-2 ${isOver ? 'border-teal-400' : 'border-slate-200'}`}>
      <div className="mb-2 flex items-center justify-between px-1 text-sm font-medium">
        {label}
        <span className="text-slate-400">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: TaskItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1 }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <Link to={`/app/tasks/${task.id}`} className="font-medium hover:text-teal-700">
        {task.title}
      </Link>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        {task.assigneeName && <Badge>{task.assigneeName}</Badge>}
      </div>
      <div className="mt-1 text-xs text-slate-400">{formatDay(task.deadline)}</div>
    </div>
  )
}

function CreateTaskForm({
  people,
  pending,
  onClose,
  onSubmit,
}: {
  people: { id: string; name: string }[]
  pending: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: people[0]?.id ?? '',
    priority: 'MEDIUM' as TaskPriority,
    deadline: '',
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
      <form className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6" onSubmit={submit}>
        <h2 className="text-lg font-semibold">New task</h2>
        <Field label="Title">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Assignee">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
        </Field>
        <Field label="Priority">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
          <Button disabled={pending}>Create</Button>
        </div>
      </form>
    </div>
  )
}
