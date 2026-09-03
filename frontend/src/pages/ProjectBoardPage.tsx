import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/PageHeader'
import { QuotaMeter } from '@/components/QuotaMeter'
import { RingChart, Avatar } from '@/components/charts'
import { StatusStack } from '@/components/StatusStack'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { cn, formatDay, isTaskOverdue } from '@/lib/utils'
import type { Member, Project, ProjectReport, TaskItem, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { toast } from 'sonner'
import { CSS } from '@dnd-kit/utilities'
import { BlockedReasonModal } from '@/components/BlockedReasonModal'
import { TaskForm, assignablePeople } from '@/components/TaskForm'

const COLUMN_PREVIEW = 5

const COLUMN_TONE: Record<TaskStatus, string> = {
  TODO: 'bg-stone-100/80 border-stone-200',
  IN_PROGRESS: 'bg-amber-50/90 border-amber-200/80',
  REVIEW: 'bg-violet-50/90 border-violet-200/80',
  BLOCKED: 'bg-rose-50/90 border-rose-200/80',
  DONE: 'bg-teal-50/90 border-teal-200/80',
}

const COLUMN_DOT: Record<TaskStatus, string> = {
  TODO: 'bg-stone-400',
  IN_PROGRESS: 'bg-amber-500',
  REVIEW: 'bg-violet-500',
  BLOCKED: 'bg-rose-500',
  DONE: 'bg-teal-600',
}

export function ProjectBoardPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const project = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
  })
  const report = useQuery({
    queryKey: ['report', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<ProjectReport>(`/projects/${id}/report`)).data,
  })
  const orgMembers = useQuery({
    queryKey: ['members'],
    enabled: user?.role === 'ADMIN',
    queryFn: async () => (await api.get<Member[]>('/members')).data,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [blockTask, setBlockTask] = useState<TaskItem | null>(null)
  const canManage = user?.role === 'ADMIN' || user?.id === project.data?.managerId
  const isAdmin = user?.role === 'ADMIN'

  const tasks = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => (await api.get<TaskItem[]>(`/projects/${id}/tasks`)).data,
  })

  const transition = useMutation({
    mutationFn: async (payload: {
      taskId: string
      status: TaskStatus
      blockedReason?: string
      blockedWaitingOnUserId?: string | null
    }) => api.post(`/tasks/${payload.taskId}/transition`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setBlockTask(null)
    },
    onError: (err) => toast.error(apiError(err, 'That move is not allowed')),
  })
  const updateMembers = useMutation({
    mutationFn: async (memberIds: string[]) => api.patch(`/projects/${id}/members`, { memberIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setMembersOpen(false)
      toast.success('Project members updated')
    },
    onError: (err) => toast.error(apiError(err)),
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
    if (!(task.allowedTransitions ?? []).includes(over)) {
      toast.error('That move is not allowed')
      return
    }
    if (over === 'BLOCKED') {
      setBlockTask(task)
      return
    }
    transition.mutate({ taskId, status: over })
  }

  if (!project.data) return <p className="py-16 text-center text-sm text-muted">Loading project…</p>
  const items = tasks.data ?? []
  const canViewFullProgress = project.data.canViewFullProgress
  const progressSubtitle = canViewFullProgress
    ? `PM ${project.data.managerName} · ${project.data.doneTasks}/${project.data.totalTasks} done`
    : `Your tasks · ${project.data.doneTasks}/${project.data.totalTasks} done`

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Board"
        title={project.data.name}
        subtitle={progressSubtitle}
        actions={
          <>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setMembersOpen(true)}>
                Manage members
              </Button>
            )}
            {canManage && <Button onClick={() => setCreateOpen(true)}>New task</Button>}
          </>
        }
      />
      {report.data && (
        <div className={cn('grid gap-4', canViewFullProgress && 'lg:grid-cols-[1.1fr_0.9fr]')}>
          <Card className="flex items-center gap-5">
            <RingChart value={report.data.completionPercent} max={100} size={108} stroke={11} />
            <div className="min-w-0 flex-1">
              <CardTitle>{canViewFullProgress ? 'Delivery' : 'My progress'}</CardTitle>
              <p className="mt-1 text-sm text-muted">
                {report.data.overdue} overdue · {report.data.review} in review
              </p>
              <div className="mt-4">
                <StatusStack
                  counts={{
                    todo: report.data.todo,
                    inProgress: report.data.inProgress,
                    review: report.data.review,
                    blocked: report.data.blocked,
                    done: report.data.done,
                  }}
                />
              </div>
            </div>
          </Card>
          {canViewFullProgress && (
            <Card>
              <CardTitle>By member</CardTitle>
              <p className="mt-1 text-sm text-muted">Completed (review or done) out of each member's assigned tasks.</p>
              <div className="mt-4 space-y-3">
                {report.data.tasksByMember.map((row) => (
                  <QuotaMeter
                    key={row.name}
                    label={row.name}
                    used={row.completed}
                    max={Math.max(row.assigned, 1)}
                  />
                ))}
                {report.data.tasksByMember.length === 0 && (
                  <p className="text-sm text-muted">No assigned work yet.</p>
                )}
              </div>
            </Card>
          )}
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
        <TaskForm
          mode="create"
          people={assignablePeople(project.data)}
          pending={createTask.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(payload) => createTask.mutate(payload)}
        />
      )}
      {membersOpen && project.data && isAdmin && (
        <ManageMembersForm
          project={project.data}
          orgMembers={(orgMembers.data ?? []).filter((m) => m.status !== 'DISABLED')}
          pending={updateMembers.isPending}
          onClose={() => setMembersOpen(false)}
          onSubmit={(memberIds) => updateMembers.mutate(memberIds)}
        />
      )}
      {blockTask && (
        <BlockedReasonModal
          people={(project.data.members ?? []).filter((member) => member.id !== blockTask.assigneeId)}
          pending={transition.isPending}
          onCancel={() => setBlockTask(null)}
          onConfirm={(payload) =>
            transition.mutate({ taskId: blockTask.id, status: 'BLOCKED', ...payload })
          }
        />
      )}
    </div>
  )
}

function Column({ id, label, tasks }: { id: TaskStatus; label: string; tasks: TaskItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [expanded, setExpanded] = useState(false)
  const hasMore = tasks.length > COLUMN_PREVIEW
  const visible = expanded || !hasMore ? tasks : tasks.slice(0, COLUMN_PREVIEW)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-72 rounded-[28px] border p-3',
        COLUMN_TONE[id],
        isOver && 'ring-2 ring-teal-500/40',
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1 text-sm font-medium text-ink">
        <span className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', COLUMN_DOT[id])} />
          {label}
        </span>
        <span className="rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] dark:bg-white/10">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {visible.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {hasMore && (
          <button
            type="button"
            className="w-full rounded-2xl border border-teal-900/10 bg-white/70 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-white dark:border-teal-200/15 dark:bg-teal-700/40 dark:text-teal-200 dark:hover:bg-teal-600/45"
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? 'Show less' : `View all · ${tasks.length}`}
          </button>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, draggable = true }: { task: TaskItem; draggable?: boolean }) {
  const navigate = useNavigate()
  const skipClick = useRef(false)
  const canDrag = draggable && (task.allowedTransitions ?? []).length > 0
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  })

  useEffect(() => {
    if (isDragging) skipClick.current = true
  }, [isDragging])

  const openTask = () => {
    if (skipClick.current) {
      skipClick.current = false
      return
    }
    navigate(`/app/tasks/${task.id}`)
  }

  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1 }
  const overdue = isTaskOverdue(task)
  const priorityEdge =
    task.priority === 'URGENT'
      ? 'bg-rose-500'
      : task.priority === 'HIGH'
        ? 'bg-amber-500'
        : task.priority === 'MEDIUM'
          ? 'bg-teal-500'
          : 'bg-stone-300'
  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      style={canDrag ? style : undefined}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      role="button"
      tabIndex={0}
      onClick={openTask}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openTask()
        }
      }}
      className={cn(
        'app-card app-card-lift relative overflow-hidden rounded-2xl p-3.5 shadow-[0_10px_24px_rgb(15_61_56_/_0.06)]',
        canDrag ? 'cursor-grab' : 'cursor-pointer',
      )}
    >
      <span className={cn('pointer-events-none absolute inset-y-0 left-0 w-1', priorityEdge)} />
      <div className="pointer-events-none pl-2 font-medium leading-snug text-ink">{task.title}</div>
      <div className="pointer-events-none mt-3 flex items-center justify-between gap-2 pl-2">
        <div className="flex min-w-0 items-center gap-2">
          {task.assigneeName ? (
            <>
              <Avatar name={task.assigneeName} size="sm" />
              <span className="truncate text-xs text-teal-900/60">{task.assigneeName}</span>
            </>
          ) : (
            <span className="text-xs text-teal-900/40">Unassigned</span>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide',
            overdue ? 'bg-rose-100 text-rose-800' : 'bg-teal-50 text-teal-800/70',
          )}
        >
          {formatDay(task.deadline)}
        </span>
      </div>
      <div className="pointer-events-none mt-2 flex flex-wrap gap-1 pl-2">
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        {task.status === 'BLOCKED' && task.blockedReason && (
          <span className="truncate rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-800">
            {task.blockedWaitingOnName ? `Waiting on ${task.blockedWaitingOnName}` : task.blockedReason}
          </span>
        )}
      </div>
    </div>
  )
}

function ManageMembersForm({
  project,
  orgMembers,
  pending,
  onClose,
  onSubmit,
}: {
  project: Project
  orgMembers: Member[]
  pending: boolean
  onClose: () => void
  onSubmit: (memberIds: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(project.memberIds)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(selected)
  }
  return (
    <Modal>
      <form className="space-y-3" onSubmit={submit}>
        <h2 className="text-lg font-semibold text-ink">Project members</h2>
        <p className="text-sm text-muted">Only people on this list can be assigned tasks. The Project Manager stays on the project.</p>
        <div className="max-h-56 space-y-1 overflow-auto rounded-2xl border border-teal-900/10 bg-white/70 p-2 dark:border-teal-200/15 dark:bg-teal-700/40">
          {orgMembers.map((member) => (
            <label key={member.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-teal-50">
              <input
                type="checkbox"
                checked={selected.includes(member.id) || member.id === project.managerId}
                disabled={member.id === project.managerId}
                onChange={(e) => {
                  const next = new Set(selected)
                  if (e.target.checked) next.add(member.id)
                  else next.delete(member.id)
                  setSelected([...next])
                }}
              />
              {member.firstName} {member.lastName}
              {member.id === project.managerId ? ' (Project Manager)' : ''}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}
