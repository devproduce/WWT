import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, Pin, PinOff } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/EmptyState'
import { api, apiError } from '@/services/api'
import { cn, formatDay, localIsoDate } from '@/lib/utils'
import type { MyDayItem, MyDayResponse, TaskItem } from '@/types'
import { WHY_LABEL } from '@/types'

type FocusFilter = 'ALL' | 'OVERDUE' | 'SOON' | 'REVIEW' | 'PRIORITY'

export function MyDayPanel({ filter = 'ALL' }: { filter?: FocusFilter }) {
  const date = localIsoDate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const day = useQuery({
    queryKey: ['my-day', date],
    queryFn: async () => (await api.get<MyDayResponse>('/me/day', { params: { date } })).data,
  })
  const mine = useQuery({
    queryKey: ['my-tasks', query],
    enabled: query.trim().length > 0,
    queryFn: async () => (await api.get<TaskItem[]>('/tasks/mine', { params: { q: query.trim() } })).data,
  })

  const savePins = useMutation({
    mutationFn: (taskIds: string[]) => api.put<MyDayResponse>('/me/day/pins', { date, taskIds }),
    onSuccess: (res) => queryClient.setQueryData(['my-day', date], res.data),
    onError: (err) => toast.error(apiError(err)),
  })
  const saveHidden = useMutation({
    mutationFn: (taskIds: string[]) => api.put<MyDayResponse>('/me/day/hidden', { date, taskIds }),
    onSuccess: (res) => queryClient.setQueryData(['my-day', date], res.data),
    onError: (err) => toast.error(apiError(err)),
  })
  const action = useMutation({
    mutationFn: async ({ task, kind }: { task: TaskItem; kind: string }) => {
      if (kind === 'START') return api.post(`/tasks/${task.id}/transition`, { status: 'IN_PROGRESS' })
      if (kind === 'SUBMIT_REVIEW') return api.post(`/tasks/${task.id}/submit-review`)
      return Promise.resolve()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-day'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(apiError(err)),
  })

  const data = day.data
  const lists = useMemo(() => filterDay(data, filter, query), [data, filter, query])
  const listedIds = new Set([...lists.focus, ...lists.waiting].map((item) => item.task.id))
  const extraMatches =
    query.trim().length > 0
      ? (mine.data ?? []).filter((task) => !listedIds.has(task.id) && task.status !== 'DONE')
      : []

  if (day.isLoading || !data) {
    return (
      <Card>
        <CardTitle>My Day</CardTitle>
        <p className="mt-3 text-sm text-teal-900/50">Choosing what matters today…</p>
      </Card>
    )
  }

  const pinIds = data.pinnedTaskIds ?? []
  const hiddenIds = data.hiddenTaskIds ?? []

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>My Day</CardTitle>
          <p className="mt-1 text-sm text-teal-900/50">A private plan for today. The board still shows the same work.</p>
        </div>
        <Input className="max-w-xs" placeholder="Search my work" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="mt-4 space-y-2">
        {lists.focus.length === 0 && lists.waiting.length === 0 && extraMatches.length === 0 && (
          <EmptyState title="Clear day" description="Nothing in focus. Overdue and in-progress work will land here automatically." />
        )}
        {lists.focus.map((item) => (
          <MyDayRowCard
            key={item.task.id}
            item={item}
            onPin={() => savePins.mutate(item.pinned ? pinIds.filter((id) => id !== item.task.id) : [...pinIds, item.task.id])}
            onHide={() => saveHidden.mutate([...hiddenIds, item.task.id])}
            onAction={() => action.mutate({ task: item.task, kind: item.primaryAction })}
          />
        ))}
      </div>
      {lists.waiting.length > 0 && (
        <div className="mt-6">
          <div className="font-mono text-[11px] tracking-[0.22em] text-teal-700/70 uppercase">Waiting</div>
          <div className="mt-2 space-y-2">
            {lists.waiting.map((item) => (
              <MyDayRowCard key={item.task.id} item={item} waiting />
            ))}
          </div>
        </div>
      )}
      {extraMatches.length > 0 && (
        <div className="mt-6">
          <div className="font-mono text-[11px] tracking-[0.22em] text-teal-700/70 uppercase">More matches</div>
          <div className="mt-2 space-y-2">
            {extraMatches.map((task) => (
              <Link
                key={task.id}
                to={`/app/tasks/${task.id}`}
                className="app-ease block rounded-2xl border border-teal-900/8 bg-white/70 px-3 py-3 hover:border-teal-700/20"
              >
                <div className="font-medium text-teal-950">{task.title}</div>
                <div className="text-xs text-teal-900/50">Due {formatDay(task.deadline)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-teal-900/45">
        {data.overflowCount > 0 && <span>{data.overflowCount} more assigned</span>}
        {data.hiddenCount > 0 && <span>{data.hiddenCount} hidden until tomorrow</span>}
        {pinIds.length > 0 && <span>{pinIds.length} pinned</span>}
      </div>
    </Card>
  )
}

function MyDayRowCard({
  item,
  waiting,
  onPin,
  onHide,
  onAction,
}: {
  item: MyDayItem
  waiting?: boolean
  onPin?: () => void
  onHide?: () => void
  onAction?: () => void
}) {
  const task = item.task
  return (
    <div className="app-ease flex items-center gap-3 rounded-2xl border border-teal-900/8 bg-white/70 px-3 py-3">
      <span
        className={cn(
          'h-10 w-1.5 rounded-full',
          task.status === 'IN_PROGRESS' ? 'bg-amber-500' : item.overdue ? 'bg-rose-500' : task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-amber-500' : 'bg-teal-500',
        )}
      />
      <div className="min-w-0 flex-1">
        <Link to={`/app/tasks/${task.id}`} className="block truncate font-medium text-teal-950 hover:text-teal-700">
          {task.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-teal-900/50">
          <span>{item.projectName}</span>
          <span>·</span>
          <span>Due {formatDay(task.deadline)}</span>
          {task.status === 'BLOCKED' && task.blockedWaitingOnName && <span className="text-rose-700">Waiting on {task.blockedWaitingOnName}</span>}
          {task.status === 'BLOCKED' && !task.blockedWaitingOnName && task.blockedReason && (
            <span className="text-rose-700">{task.blockedReason}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {task.status === 'IN_PROGRESS' && <Badge tone="amber">Going on now</Badge>}
        <Badge tone={item.overdue && item.why !== 'IN_PROGRESS' ? 'red' : statusTone(String(item.why))}>
          {WHY_LABEL[item.why] ?? item.why}
        </Badge>
        {waiting ? (
          <Link to={`/app/tasks/${task.id}`}>
            <Button variant="secondary">Open</Button>
          </Link>
        ) : (
          <>
            {onAction && item.primaryAction === 'START' && <Button onClick={onAction}>Start</Button>}
            {onAction && item.primaryAction === 'SUBMIT_REVIEW' && <Button onClick={onAction}>Submit</Button>}
            <button type="button" className="rounded-full p-2 text-teal-800/60 hover:bg-teal-50" onClick={onPin} aria-label={item.pinned ? 'Unpin' : 'Pin'}>
              {item.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
            <button type="button" className="rounded-full p-2 text-teal-800/60 hover:bg-teal-50" onClick={onHide} aria-label="Hide until tomorrow">
              <EyeOff className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function filterDay(data: MyDayResponse | undefined, filter: FocusFilter, query: string) {
  const q = query.trim().toLowerCase()
  const matchesQuery = (item: MyDayItem) =>
    !q || item.task.title.toLowerCase().includes(q) || item.projectName.toLowerCase().includes(q)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const matchesFilter = (item: MyDayItem) => {
    const task = item.task
    const deadline = task.deadline ? new Date(task.deadline) : null
    if (filter === 'OVERDUE') return item.overdue
    if (filter === 'SOON') {
      if (!deadline) return false
      const soon = new Date(today)
      soon.setDate(soon.getDate() + 3)
      return deadline >= today && deadline <= soon && task.status !== 'DONE'
    }
    if (filter === 'REVIEW') return task.status === 'REVIEW'
    if (filter === 'PRIORITY') return task.priority === 'HIGH' || task.priority === 'URGENT'
    return true
  }
  return {
    focus: (data?.focus ?? []).filter(matchesFilter).filter(matchesQuery),
    waiting: (data?.waiting ?? []).filter(matchesFilter).filter(matchesQuery),
  }
}
