import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import { formatDay } from '@/lib/utils'
import type { TaskItem } from '@/types'

export function MemberWork({ tasks }: { tasks?: TaskItem[] }) {
  const mine = useQuery({
    queryKey: ['my-tasks'],
    enabled: !tasks,
    queryFn: async () => (await api.get<TaskItem[]>('/tasks/mine')).data,
  })
  const items = tasks ?? mine.data ?? []
  return (
    <Card>
      <CardTitle>Assigned tasks</CardTitle>
      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-500">No tasks assigned yet.</p>}
        {items.map((task) => (
          <Link
            key={task.id ?? String(task.title)}
            to={task.id ? `/app/tasks/${task.id}` : '/app'}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
          >
            <div>
              <div className="font-medium">{task.title}</div>
              <div className="text-xs text-slate-500">Due {formatDay(task.deadline)}</div>
            </div>
            <div className="flex gap-1">
              {task.priority && <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>}
              {task.status && <Badge tone={statusTone(task.status)}>{task.status}</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
