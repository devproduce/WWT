import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { api, apiError } from '@/services/api'
import { bytes, cn, formatDate, formatDay, isTaskOverdue } from '@/lib/utils'
import type { ActivityItem, AttachmentItem, CommentItem, Project, TaskItem, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { Avatar } from '@/components/charts'
import { PageHeader } from '@/components/PageHeader'
import { ReturnNoteModal } from '@/components/ReturnNoteModal'
import { BlockedReasonModal } from '@/components/BlockedReasonModal'
import { CommentBody, CommentComposer } from '@/components/CommentComposer'

export function TaskDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const task = useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get<TaskItem>(`/tasks/${id}`)).data,
  })
  const comments = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => (await api.get<CommentItem[]>(`/tasks/${id}/comments`)).data,
  })
  const activity = useQuery({
    queryKey: ['task-activity', id],
    queryFn: async () => (await api.get<ActivityItem[]>(`/tasks/${id}/activity`)).data,
  })
  const attachments = useQuery({
    queryKey: ['attachments', id],
    queryFn: async () => (await api.get<AttachmentItem[]>(`/tasks/${id}/attachments`)).data,
  })
  const project = useQuery({
    queryKey: ['project', task.data?.projectId],
    enabled: Boolean(task.data?.projectId),
    queryFn: async () => (await api.get<Project>(`/projects/${task.data?.projectId}`)).data,
  })
  const [returnOpen, setReturnOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] })
    queryClient.invalidateQueries({ queryKey: ['comments', id] })
    queryClient.invalidateQueries({ queryKey: ['task-activity', id] })
    queryClient.invalidateQueries({ queryKey: ['attachments', id] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['my-day'] })
    queryClient.invalidateQueries({ queryKey: ['review-queue'] })
  }
  const move = useMutation({
    mutationFn: async (payload: { status: TaskStatus; blockedReason?: string; blockedWaitingOnUserId?: string | null }) =>
      api.post(`/tasks/${id}/transition`, payload),
    onSuccess: () => {
      refresh()
      setBlockOpen(false)
      toast.success('Status updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const returnTask = useMutation({
    mutationFn: async (note: string) => api.post(`/tasks/${id}/return`, { comment: note }),
    onSuccess: () => {
      setReturnOpen(false)
      refresh()
      toast.success('Returned for revision')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const addComment = useMutation({
    mutationFn: async ({ content, mentionedUserIds }: { content: string; mentionedUserIds: string[] }) =>
      api.post(`/tasks/${id}/comments`, { content, mentionedUserIds }),
    onSuccess: refresh,
    onError: (err) => toast.error(apiError(err)),
  })
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('file', file)
      return api.post(`/tasks/${id}/attachments`, body)
    },
    onSuccess: refresh,
    onError: (err) => toast.error(apiError(err, 'Upload failed — check plan entitlements and storage quota')),
  })

  if (!task.data) return <p className="py-16 text-center text-sm text-teal-900/50">Loading task…</p>
  const item = task.data
  const currentIndex = TASK_COLUMNS.findIndex((col) => col.id === item.status)
  const waitingOnPeople = (project.data?.members ?? []).filter((member) => member.id !== item.assigneeId)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Task"
        title={item.title}
        subtitle={item.description || 'No description yet.'}
        actions={
          <Link to={`/app/projects/${item.projectId}`}>
            <Button variant="secondary">Back to board</Button>
          </Link>
        }
      />
      {item.status === 'IN_PROGRESS' && item.lastReturnNote && (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardTitle>Changes requested</CardTitle>
          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{item.lastReturnNote}</p>
        </Card>
      )}
      {item.status === 'BLOCKED' && item.blockedReason && (
        <Card className="border-rose-200 bg-rose-50/80">
          <CardTitle>Blocked</CardTitle>
          <p className="mt-2 text-sm text-rose-950">{item.blockedReason}</p>
          {item.blockedWaitingOnName && (
            <p className="mt-1 text-sm text-rose-800/70">Waiting on {item.blockedWaitingOnName}</p>
          )}
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <CardTitle>Status</CardTitle>
              <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            </div>
            <div className="flex items-center gap-1">
              {TASK_COLUMNS.map((col, index) => (
                <div key={col.id} className="flex min-w-0 flex-1 items-center">
                  <div
                    className={cn(
                      'h-2.5 w-full rounded-full',
                      index <= currentIndex ? 'bg-teal-600' : 'bg-teal-900/10',
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wide text-teal-800/50 uppercase">
              {TASK_COLUMNS.map((col) => (
                <span key={col.id} className={cn(col.id === item.status && 'text-teal-800')}>
                  {col.label}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-teal-50 px-3 py-1">Assignee: {item.assigneeName ?? 'Unassigned'}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1">Priority: {item.priority}</span>
              <span className={cn('rounded-full px-3 py-1', isTaskOverdue(item) ? 'bg-rose-50 text-rose-800' : 'bg-sky-50')}>
                Due: {formatDay(item.deadline)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.allowedTransitions
                .filter((status) => !(item.status === 'IN_PROGRESS' && status === 'REVIEW'))
                .filter((status) => !(item.status === 'REVIEW' && (status === 'DONE' || status === 'IN_PROGRESS')))
                .map((status) =>
                  status === 'BLOCKED' ? (
                    <Button key={status} variant="secondary" onClick={() => setBlockOpen(true)}>
                      Move to blocked
                    </Button>
                  ) : (
                    <Button key={status} variant="secondary" onClick={() => move.mutate({ status })}>
                      Move to {status.replace('_', ' ')}
                    </Button>
                  ),
                )}
              {item.status === 'REVIEW' && item.canReview && (
                <>
                  <Button onClick={() => api.post(`/tasks/${id}/approve`).then(refresh)}>Approve</Button>
                  <Button variant="secondary" onClick={() => setReturnOpen(true)}>
                    Return
                  </Button>
                </>
              )}
              {item.status === 'REVIEW' && !item.canReview && (
                <p className="text-sm text-amber-800">Waiting for the Project Manager to approve or return this work.</p>
              )}
              {item.status === 'IN_PROGRESS' && user?.id === item.assigneeId && (
                <Button onClick={() => api.post(`/tasks/${id}/submit-review`).then(refresh)}>Submit for review</Button>
              )}
            </div>
          </Card>
          <Card>
            <CardTitle>Comments</CardTitle>
            <div className="mt-4 space-y-3">
              {(comments.data ?? []).map((c) => (
                <div key={c.id} className="rounded-2xl bg-teal-50/60 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-teal-950">
                    <Avatar name={c.authorName} size="sm" />
                    {c.authorName} <span className="font-normal text-teal-900/40">{formatDate(c.createdAt)}</span>
                  </div>
                  <CommentBody
                    content={c.content}
                    mentionedIds={c.mentionedUserIds ?? []}
                    members={project.data?.members ?? []}
                  />
                </div>
              ))}
            </div>
            <CommentComposer
              members={project.data?.members ?? []}
              currentUserId={user?.id}
              pending={addComment.isPending}
              onSubmit={(content, mentionedUserIds) => addComment.mutate({ content, mentionedUserIds })}
            />
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardTitle>Attachments</CardTitle>
            <input
              className="mt-3 w-full text-sm"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload.mutate(file)
              }}
            />
            <div className="mt-3 space-y-2 text-sm">
              {(attachments.data ?? []).map((file) => (
                <button
                  key={file.id}
                  type="button"
                  className="block w-full rounded-2xl bg-white/70 px-3 py-2 text-left text-teal-800 hover:bg-white"
                  onClick={async () => {
                    const res = await api.get(`/attachments/${file.id}/download`, { responseType: 'blob' })
                    const url = URL.createObjectURL(res.data)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = file.originalName
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  {file.originalName} ({bytes(file.sizeBytes)})
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle>Activity</CardTitle>
            <div className="mt-4 space-y-3 text-sm">
              {(activity.data ?? []).map((event) => (
                <div key={event.id} className="flex gap-2">
                  <Avatar name={event.actorName} size="sm" />
                  <div>
                    <div className="text-teal-950">{event.message}</div>
                    <div className="text-xs text-teal-900/40">{formatDate(event.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {returnOpen && (
        <ReturnNoteModal
          pending={returnTask.isPending}
          onCancel={() => setReturnOpen(false)}
          onConfirm={(note) => returnTask.mutate(note)}
        />
      )}
      {blockOpen && (
        <BlockedReasonModal
          people={waitingOnPeople}
          pending={move.isPending}
          onCancel={() => setBlockOpen(false)}
          onConfirm={(payload) => move.mutate({ status: 'BLOCKED', ...payload })}
        />
      )}
    </div>
  )
}
