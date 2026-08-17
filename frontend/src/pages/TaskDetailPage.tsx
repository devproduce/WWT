import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api, apiError } from '@/services/api'
import { bytes, formatDate, formatDay } from '@/lib/utils'
import type { ActivityItem, AttachmentItem, CommentItem, TaskItem, TaskStatus } from '@/types'
import { toast } from 'sonner'

export function TaskDetailPage() {
  const { id } = useParams()
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

  if (!task.data) return <p>Loading task…</p>
  const item = task.data
  const submitComment = (event: FormEvent) => {
    event.preventDefault()
    if (comment.trim()) addComment.mutate()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link className="text-sm text-teal-700" to={`/app/projects/${item.projectId}`}>
                Back to board
              </Link>
              <h1 className="mt-1 text-2xl font-semibold">{item.title}</h1>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.description || 'No description'}</p>
            </div>
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
            <span>Assignee: {item.assigneeName ?? 'Unassigned'}</span>
            <span>Priority: {item.priority}</span>
            <span>Due: {formatDay(item.deadline)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.allowedTransitions.map((status) => (
              <Button key={status} variant="secondary" onClick={() => move.mutate(status)}>
                Move to {status.replace('_', ' ')}
              </Button>
            ))}
            {item.status === 'REVIEW' && (
              <>
                <Button onClick={() => api.post(`/tasks/${id}/approve`).then(refresh)}>Approve</Button>
                <Button variant="secondary" onClick={() => api.post(`/tasks/${id}/return`, { comment: 'Please revise' }).then(refresh)}>
                  Return
                </Button>
              </>
            )}
            {item.status === 'IN_PROGRESS' && (
              <Button onClick={() => api.post(`/tasks/${id}/submit-review`).then(refresh)}>Submit for review</Button>
            )}
          </div>
        </Card>
        <Card>
          <CardTitle>Comments</CardTitle>
          <div className="mt-3 space-y-3">
            {(comments.data ?? []).map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="font-medium">
                  {c.authorName} <span className="font-normal text-slate-400">{formatDate(c.createdAt)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap">{c.content}</div>
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
            className="mt-3 text-sm"
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
                className="block text-left text-teal-700"
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
          <div className="mt-3 space-y-2 text-sm">
            {(activity.data ?? []).map((event) => (
              <div key={event.id}>
                <div>{event.message}</div>
                <div className="text-xs text-slate-400">{formatDate(event.createdAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
