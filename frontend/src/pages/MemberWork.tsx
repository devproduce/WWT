import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { api } from '@/services/api'
import { cn, formatDay } from '@/lib/utils'
import type { TaskItem, TaskPriority, TaskStatus } from '@/types'

type WorkItem = {
  id: string
  title: string
  status?: TaskStatus | string
  priority?: TaskPriority | string
  deadline?: string | null
  projectId?: string
}

export function MemberWork({ tasks }: { tasks?: WorkItem[] }) {
  const mine = useQuery({
    queryKey: ['my-tasks'],
    enabled: !tasks,
    queryFn: async () => (await api.get<TaskItem[]>('/tasks/mine')).data,
  })
  const items = tasks ?? mine.data ?? []
  return (
    <Card>
      <CardTitle>Assigned tasks</CardTitle>
      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <EmptyState title="Nothing assigned" description="When work lands on your plate, it will show up here." />
        )}
        {items.map((task) => (
          <Link
            key={task.id ?? task.title}
            to={task.id ? `/app/tasks/${task.id}` : '/app'}
            className="app-ease flex items-center gap-3 rounded-2xl border border-teal-900/8 bg-white/70 px-3 py-3 hover:border-teal-700/20 hover:bg-white dark:border-teal-200/10 dark:bg-teal-700/40 dark:hover:border-teal-300/25 dark:hover:bg-teal-600/45"
          >
            <span
              className={cn(
                'h-10 w-1.5 rounded-full',
                task.priority === 'URGENT' && 'bg-rose-500',
                task.priority === 'HIGH' && 'bg-amber-500',
                task.priority === 'MEDIUM' && 'bg-teal-500',
                (!task.priority || task.priority === 'LOW') && 'bg-stone-300',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-ink">{task.title}</div>
              <div className="text-xs text-muted">Due {formatDay(task.deadline)}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {task.priority && <Badge tone={statusTone(String(task.priority))}>{String(task.priority)}</Badge>}
              {task.status && <Badge tone={statusTone(String(task.status))}>{String(task.status)}</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
