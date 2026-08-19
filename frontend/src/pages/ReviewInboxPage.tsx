import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Inbox } from 'lucide-react'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ReturnNoteModal } from '@/components/ReturnNoteModal'
import { Avatar } from '@/components/charts'
import { api, apiError } from '@/services/api'
import { formatDate } from '@/lib/utils'
import type { ReviewQueueItem } from '@/types'

export function ReviewInboxPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [returnItem, setReturnItem] = useState<ReviewQueueItem | null>(null)
  const queue = useQuery({
    queryKey: ['review-queue', query],
    queryFn: async () => (await api.get<ReviewQueueItem[]>('/tasks/review-queue', { params: { q: query || undefined } })).data,
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['my-day'] })
  }
  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/tasks/${id}/approve`),
    onSuccess: () => {
      refresh()
      toast.success('Approved')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const returnTask = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => api.post(`/tasks/${id}/return`, { comment }),
    onSuccess: () => {
      setReturnItem(null)
      refresh()
      toast.success('Returned for revision')
    },
    onError: (err) => toast.error(apiError(err)),
  })

  const items = queue.data ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Review"
        title="Review inbox"
        subtitle="Oldest waiting work first. Approve or send it back with a real note."
        actions={
          <Input className="w-56" placeholder="Search title, project, person" value={query} onChange={(event) => setQuery(event.target.value)} />
        }
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState title="Inbox zero" description="Nothing is waiting for your review." />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.task.id} className="flex flex-wrap items-center gap-3">
              <Inbox className="h-4 w-4 text-violet-600" />
              <div className="min-w-0 flex-1">
                <Link to={`/app/tasks/${item.task.id}`} className="font-medium text-teal-950 hover:text-teal-700">
                  {item.task.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-teal-900/50">
                  <span>{item.projectName}</span>
                  {item.task.assigneeName && (
                    <span className="inline-flex items-center gap-1">
                      <Avatar name={item.task.assigneeName} size="sm" />
                      {item.task.assigneeName}
                    </span>
                  )}
                  <span>Waiting since {formatDate(item.waitingSince)}</span>
                </div>
              </div>
              <Badge tone={statusTone(item.task.priority)}>{item.task.priority}</Badge>
              <Button variant="secondary" onClick={() => setReturnItem(item)}>
                Return
              </Button>
              <Button onClick={() => approve.mutate(item.task.id)}>Approve</Button>
            </Card>
          ))}
        </div>
      )}
      {returnItem && (
        <ReturnNoteModal
          pending={returnTask.isPending}
          onCancel={() => setReturnItem(null)}
          onConfirm={(comment) => returnTask.mutate({ id: returnItem.task.id, comment })}
        />
      )}
    </div>
  )
}
