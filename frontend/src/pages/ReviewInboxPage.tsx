import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Clock3, Inbox } from 'lucide-react'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ReturnNoteModal } from '@/components/ReturnNoteModal'
import { MetricCard } from '@/components/MetricCard'
import { Avatar } from '@/components/charts'
import { api, apiError } from '@/services/api'
import { cn, formatDay, formatWait, waitHours } from '@/lib/utils'
import type { ReviewQueueItem } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'

export function ReviewInboxPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [returnItem, setReturnItem] = useState<ReviewQueueItem | null>(null)
  const queue = useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => (await api.get<ReviewQueueItem[]>('/reviews')).data,
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

  const items = useMemo(
    () => (Array.isArray(queue.data) ? queue.data.filter((item) => item?.task?.id) : []),
    [queue.data],
  )
  const canAct = (user?.managedProjectIds?.length ?? 0) > 0 || items.some((item) => item.task.canReview)
  const byManager = useMemo(() => {
    const groups = new Map<string, { name: string; items: ReviewQueueItem[] }>()
    for (const item of items) {
      const key = item.managerId ?? 'unknown'
      const existing = groups.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        groups.set(key, { name: item.managerName || 'Unassigned manager', items: [item] })
      }
    }
    return [...groups.values()]
  }, [items])
  const next = items.find((item) => item.task.canReview) ?? items[0]
  const rest = next ? items.filter((item) => item.task.id !== next.task.id) : []
  const stale = items.filter((item) => waitHours(item.waitingSince) >= 24).length
  const urgent = items.filter((item) => item.task.priority === 'HIGH' || item.task.priority === 'URGENT').length
  const busy = approve.isPending || returnTask.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title={canAct ? 'Waiting on you' : 'Work in review'}
        subtitle={
          items.length === 0
            ? canAct
              ? 'When work is submitted, it lands here for a yes or a note.'
              : 'When members submit work, it waits here on each Project Manager.'
            : canAct
              ? 'Oldest first. Approve it, or send it back with what should change.'
              : 'Read-only. Only the Project Manager can approve or return this work.'
        }
      />

      {queue.isError ? (
        <Card>
          <EmptyState title="Could not load the inbox" description={apiError(queue.error, 'The review queue is unavailable.')} />
        </Card>
      ) : queue.isPending ? (
        <p className="py-16 text-center text-sm text-teal-900/50">Loading reviews…</p>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title="Inbox zero"
            description={
              canAct
                ? 'Nothing is waiting for a review. When a member submits work, it will show up here first.'
                : 'No work is sitting with a Project Manager right now.'
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Waiting" value={items.length} hint="Submitted and not yet signed off" icon={<Inbox className="h-5 w-5" />} tone="violet" />
            <MetricCard
              label="Stale"
              value={stale}
              hint="Waiting more than a day"
              icon={<Clock3 className="h-5 w-5" />}
              tone={stale > 0 ? 'coral' : 'teal'}
            />
            <MetricCard
              label="High priority"
              value={urgent}
              hint="Urgent or high in this queue"
              icon={<AlertTriangle className="h-5 w-5" />}
              tone={urgent > 0 ? 'amber' : 'stone'}
            />
          </div>

          {next && canAct && (
            <section className="space-y-3">
              <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Next to review</div>
              <ReviewHero
                item={next}
                busy={busy}
                onApprove={() => approve.mutate(next.task.id)}
                onReturn={() => setReturnItem(next)}
              />
            </section>
          )}

          {canAct && rest.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Also waiting</div>
                <div className="text-xs text-teal-900/45">{rest.length} more</div>
              </div>
              <div className="space-y-2">
                {rest.map((item) => (
                  <ReviewRow
                    key={item.task.id}
                    item={item}
                    busy={busy}
                    onApprove={() => approve.mutate(item.task.id)}
                    onReturn={() => setReturnItem(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {!canAct && (
            <section className="space-y-6">
              {byManager.map((group) => (
                <div key={group.name} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">
                      Waiting on {group.name}
                    </div>
                    <div className="text-xs text-teal-900/45">{group.items.length}</div>
                  </div>
                  {group.items.map((item) => (
                    <ReviewRow key={item.task.id} item={item} busy={false} />
                  ))}
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {returnItem && (
        <ReturnNoteModal
          pending={returnTask.isPending}
          taskTitle={returnItem.task.title}
          onCancel={() => setReturnItem(null)}
          onConfirm={(comment) => returnTask.mutate({ id: returnItem.task.id, comment })}
        />
      )}
    </div>
  )
}

function ReviewHero({
  item,
  busy,
  onApprove,
  onReturn,
}: {
  item: ReviewQueueItem
  busy: boolean
  onApprove: () => void
  onReturn: () => void
}) {
  const stale = waitHours(item.waitingSince) >= 24
  const description = item.task.description?.trim()
  return (
    <Card className="relative overflow-hidden border border-violet-200/70 bg-gradient-to-br from-violet-50/90 to-white/80">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-violet-500" />
      <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="purple">Review</Badge>
            <Badge tone={statusTone(item.task.priority)}>{item.task.priority}</Badge>
            <WaitChip since={item.waitingSince} />
          </div>
          <Link to={`/app/tasks/${item.task.id}`} className="mt-3 block text-2xl font-semibold tracking-tight text-teal-950 hover:text-teal-700">
            {item.task.title}
          </Link>
          {description && <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-teal-900/60">{description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-teal-900/60">
            {item.task.assigneeName && (
              <span className="inline-flex items-center gap-2">
                <Avatar name={item.task.assigneeName} size="sm" />
                {item.task.assigneeName}
              </span>
            )}
            <span className="text-teal-900/30">·</span>
            <span>{item.projectName}</span>
            <span className="text-teal-900/30">·</span>
            <span>Due {formatDay(item.task.deadline)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {item.task.canReview ? (
            <>
              <Button onClick={onApprove} disabled={busy}>
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button variant="secondary" onClick={onReturn} disabled={busy}>
                Return
              </Button>
            </>
          ) : (
            <p className="max-w-48 text-right text-xs text-teal-800/70">
              Waiting on {item.managerName ?? 'the Project Manager'}
            </p>
          )}
          <Link to={`/app/tasks/${item.task.id}`} className="text-center text-xs text-teal-800/70 hover:text-teal-950">
            Open task
          </Link>
        </div>
      </div>
      {stale && (
        <p className="mt-4 pl-3 text-sm text-rose-800">This has been sitting in review. A decision now unblocks the member.</p>
      )}
    </Card>
  )
}

function ReviewRow({
  item,
  busy,
  onApprove,
  onReturn,
}: {
  item: ReviewQueueItem
  busy: boolean
  onApprove?: () => void
  onReturn?: () => void
}) {
  return (
    <Card className="flex flex-wrap items-center gap-3 py-4">
      <Avatar name={item.task.assigneeName ?? item.projectName} size="sm" />
      <div className="min-w-0 flex-1">
        <Link to={`/app/tasks/${item.task.id}`} className="font-medium text-teal-950 hover:text-teal-700">
          {item.task.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-teal-900/50">
          <span>{item.projectName}</span>
          {item.managerName && <span>PM {item.managerName}</span>}
          {item.task.assigneeName && <span>{item.task.assigneeName}</span>}
          <span>Due {formatDay(item.task.deadline)}</span>
        </div>
      </div>
      <WaitChip since={item.waitingSince} />
      <Badge tone={statusTone(item.task.priority)}>{item.task.priority}</Badge>
      {item.task.canReview && onApprove && onReturn && (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReturn} disabled={busy}>
            Return
          </Button>
          <Button onClick={onApprove} disabled={busy}>
            Approve
          </Button>
        </div>
      )}
    </Card>
  )
}

function WaitChip({ since }: { since: string | null }) {
  const hours = waitHours(since)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide uppercase',
        hours >= 24 ? 'bg-rose-100 text-rose-800' : hours >= 8 ? 'bg-amber-100 text-amber-900' : 'bg-violet-100 text-violet-900',
      )}
    >
      <Clock3 className="h-3 w-3" />
      {formatWait(since)}
    </span>
  )
}
