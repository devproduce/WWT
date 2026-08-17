import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api, apiError } from '@/services/api'
import { bytes, cn, formatDate, formatDay } from '@/lib/utils'
import type { ActivityItem, AttachmentItem, CommentItem, TaskItem, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { Avatar } from '@/components/charts'
import { PageHeader } from '@/components/PageHeader'

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
  const [comment, setComment] = useState('')
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] })
    queryClient.invalidateQueries({ queryKey: ['comments', id] })
    queryClient.invalidateQueries({ queryKey: ['task-activity', id] })
    queryClient.invalidateQueries({ queryKey: ['attachments', id] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
  const move = useMutation({
    mutationFn: async (status: TaskStatus) => api.post(`/tasks/${id}/transition`, { status }),
    onSuccess: () => {
      refresh()
      toast.success('Status updated')
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const addComment = useMutation({
    mutationFn: async () => api.post(`/tasks/${id}/comments`, { content: comment }),
    onSuccess: () => {
      setComment('')
      refresh()
    },
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
  const submitComment = (event: FormEvent) => {
    event.preventDefault()
    if (comment.trim()) addComment.mutate()
  }
  const currentIndex = TASK_COLUMNS.findIndex((col) => col.id === item.status)

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
              <span className="rounded-full bg-sky-50 px-3 py-1">Due: {formatDay(item.deadline)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.allowedTransitions
                .filter((status) => !(item.status === 'IN_PROGRESS' && status === 'REVIEW'))
                .filter((status) => !(item.status === 'REVIEW' && (status === 'DONE' || status === 'IN_PROGRESS')))
                .map((status) => (
                  <Button key={status} variant="secondary" onClick={() => move.mutate(status)}>
                    Move to {status.replace('_', ' ')}
                  </Button>
                ))}
              {item.status === 'REVIEW' && item.canReview && (
                <>
                  <Button onClick={() => api.post(`/tasks/${id}/approve`).then(refresh)}>Approve</Button>
                  <Button variant="secondary" onClick={() => api.post(`/tasks/${id}/return`, { comment: 'Please revise' }).then(refresh)}>
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
                  <div className="mt-2 whitespace-pre-wrap text-teal-900/80">{c.content}</div>
                </div>
              ))}
            </div>
            <form className="mt-3 space-y-2" onSubmit={submitComment}>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment" />
              <Button disabled={addComment.isPending}>Comment</Button>
            </form>
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
    </div>
  )
}
