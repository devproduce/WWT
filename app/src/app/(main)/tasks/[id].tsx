import { BlockedReasonModal } from '@/components/BlockedReasonModal'
import { CommentBody, CommentComposer } from '@/components/CommentComposer'
import { PageHeader } from '@/components/PageHeader'
import { ReturnNoteModal } from '@/components/ReturnNoteModal'
import { Avatar } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { bytes, formatDate, formatDay, isTaskOverdue } from '@/lib/utils'
import { API_BASE_URL, api, apiError, getAccessToken } from '@/services/api'
import { colors, radii } from '@/theme/tokens'
import type { ActivityItem, AttachmentItem, CommentItem, Project, TaskItem, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { toast } from '@/components/Toast'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [returnOpen, setReturnOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

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
    },
    onError: (err) => toast.error(apiError(err)),
  })
  const returnTask = useMutation({
    mutationFn: async (note: string) => api.post(`/tasks/${id}/return`, { comment: note }),
    onSuccess: () => {
      setReturnOpen(false)
      refresh()
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
    mutationFn: async () => {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
      if (picked.canceled || !picked.assets?.[0]) return
      const file = picked.assets[0]
      const body = new FormData()
      body.append('file', {
        uri: file.uri,
        name: file.name ?? 'upload',
        type: file.mimeType ?? 'application/octet-stream',
      } as unknown as Blob)
      return api.post(`/tasks/${id}/attachments`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      if (res) refresh()
    },
    onError: (err) => toast.error(apiError(err, 'Check plan entitlements and storage quota')),
  })

  const download = async (file: AttachmentItem) => {
    try {
      const dest = `${FileSystem.cacheDirectory ?? ''}${file.originalName}`
      const token = getAccessToken()
      const result = await FileSystem.downloadAsync(`${API_BASE_URL}/api/attachments/${file.id}/download`, dest, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri)
      } else {
        toast.success(file.originalName)
      }
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  if (!task.data) {
    return (
      <View style={styles.center}>
        <AppText variant="caption">Loading task…</AppText>
      </View>
    )
  }

  const item = task.data
  const currentIndex = TASK_COLUMNS.findIndex((col) => col.id === item.status)
  const waitingOnPeople = (project.data?.members ?? []).filter((member) => member.id !== item.assigneeId)

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <PageHeader
        eyebrow="Task"
        title={item.title}
        subtitle={item.description || 'No description yet.'}
        actions={
          <Button variant="secondary" onPress={() => router.push(`/projects/${item.projectId}`)}>
            Back to board
          </Button>
        }
      />
      {item.status === 'IN_PROGRESS' && item.lastReturnNote ? (
        <Card style={{ backgroundColor: 'rgba(255,251,235,0.9)', borderColor: '#FDE68A' }}>
          <CardTitle>Changes requested</CardTitle>
          <AppText style={{ marginTop: 8, color: '#78350F' }}>{item.lastReturnNote}</AppText>
        </Card>
      ) : null}
      {item.status === 'BLOCKED' && item.blockedReason ? (
        <Card style={{ backgroundColor: 'rgba(255,241,242,0.9)', borderColor: '#FECDD3' }}>
          <CardTitle>Blocked</CardTitle>
          <AppText style={{ marginTop: 8, color: '#881337' }}>{item.blockedReason}</AppText>
          {item.blockedWaitingOnName ? (
            <AppText variant="caption" style={{ marginTop: 4, color: '#9F1239' }}>
              Waiting on {item.blockedWaitingOnName}
            </AppText>
          ) : null}
        </Card>
      ) : null}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <CardTitle>Status</CardTitle>
          <Badge tone={statusTone(item.status)}>{item.status}</Badge>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {TASK_COLUMNS.map((col, index) => (
            <View
              key={col.id}
              style={[styles.step, index <= currentIndex ? styles.stepOn : styles.stepOff]}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          {TASK_COLUMNS.map((col) => (
            <AppText
              key={col.id}
              variant="label"
              style={{ fontSize: 9, letterSpacing: 0.4, color: col.id === item.status ? colors.teal800 : 'rgba(17,94,89,0.45)' }}
            >
              {col.label}
            </AppText>
          ))}
        </View>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <AppText variant="caption">Assignee: {item.assigneeName ?? 'Unassigned'}</AppText>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.amber50 }]}>
            <AppText variant="caption">Priority: {item.priority}</AppText>
          </View>
          <View style={[styles.pill, { backgroundColor: isTaskOverdue(item) ? colors.rose50 : '#F0F9FF' }]}>
            <AppText variant="caption" style={{ color: isTaskOverdue(item) ? '#9F1239' : colors.ink }}>
              Due: {formatDay(item.deadline)}
            </AppText>
          </View>
        </View>
        <View style={styles.actions}>
          {item.allowedTransitions
            .filter((status) => !(item.status === 'IN_PROGRESS' && status === 'REVIEW'))
            .filter((status) => !(item.status === 'REVIEW' && (status === 'DONE' || status === 'IN_PROGRESS')))
            .map((status) =>
              status === 'BLOCKED' ? (
                <Button key={status} variant="secondary" onPress={() => setBlockOpen(true)}>
                  Move to blocked
                </Button>
              ) : (
                <Button key={status} variant="secondary" onPress={() => move.mutate({ status })}>
                  Move to {status.replace('_', ' ')}
                </Button>
              ),
            )}
          {item.status === 'REVIEW' && item.canReview ? (
            <>
              <Button
                onPress={() =>
                  api
                    .post(`/tasks/${id}/approve`)
                    .then(refresh)
                    .catch((err) => toast.error(apiError(err)))
                }
              >
                Approve
              </Button>
              <Button variant="secondary" onPress={() => setReturnOpen(true)}>
                Return
              </Button>
            </>
          ) : null}
          {item.status === 'REVIEW' && !item.canReview ? (
            <AppText variant="caption" style={{ color: '#92400E' }}>
              Waiting for the Project Manager to approve or return this work.
            </AppText>
          ) : null}
          {item.status === 'IN_PROGRESS' && user?.id === item.assigneeId ? (
            <Button
              onPress={() =>
                api
                  .post(`/tasks/${id}/submit-review`)
                  .then(refresh)
                  .catch((err) => toast.error(apiError(err)))
              }
            >
              Submit for review
            </Button>
          ) : null}
        </View>
      </Card>
      <Card>
        <CardTitle>Comments</CardTitle>
        <View style={{ marginTop: 16, gap: 12 }}>
          {(comments.data ?? []).map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Avatar name={comment.authorName} size="sm" />
                <AppText variant="cardTitle" style={{ fontSize: 14 }}>
                  {comment.authorName}
                </AppText>
                <AppText variant="caption">{formatDate(comment.createdAt)}</AppText>
              </View>
              <CommentBody
                content={comment.content}
                mentionedIds={comment.mentionedUserIds ?? []}
                members={project.data?.members ?? []}
              />
            </View>
          ))}
        </View>
        <CommentComposer
          members={project.data?.members ?? []}
          currentUserId={user?.id}
          pending={addComment.isPending}
          onSubmit={(content, mentionedUserIds) => addComment.mutate({ content, mentionedUserIds })}
        />
      </Card>
      <Card>
        <CardTitle>Attachments</CardTitle>
        <Button variant="secondary" onPress={() => upload.mutate()} pending={upload.isPending} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
          Add file
        </Button>
        <View style={{ marginTop: 12, gap: 8 }}>
          {(attachments.data ?? []).map((file) => (
            <Pressable key={file.id} style={styles.file} onPress={() => void download(file)}>
              <AppText style={{ color: colors.teal800 }}>
                {file.originalName} ({bytes(file.sizeBytes)})
              </AppText>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <CardTitle>Activity</CardTitle>
        <View style={{ marginTop: 16, gap: 12 }}>
          {(activity.data ?? []).map((event) => (
            <View key={event.id} style={{ flexDirection: 'row', gap: 8 }}>
              <Avatar name={event.actorName} size="sm" />
              <View style={{ flex: 1 }}>
                <AppText>{event.message}</AppText>
                <AppText variant="caption">{formatDate(event.createdAt)}</AppText>
              </View>
            </View>
          ))}
        </View>
      </Card>
      <ReturnNoteModal
        visible={returnOpen}
        pending={returnTask.isPending}
        onCancel={() => setReturnOpen(false)}
        onConfirm={(note) => returnTask.mutate(note)}
      />
      <BlockedReasonModal
        visible={blockOpen}
        people={waitingOnPeople}
        pending={move.isPending}
        onCancel={() => setBlockOpen(false)}
        onConfirm={(payload) => move.mutate({ status: 'BLOCKED', ...payload })}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  step: { flex: 1, height: 10, borderRadius: radii.pill },
  stepOn: { backgroundColor: '#0D9488' },
  stepOff: { backgroundColor: 'rgba(18,49,46,0.1)' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  pill: { borderRadius: radii.pill, backgroundColor: colors.teal50, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  comment: { borderRadius: 16, backgroundColor: 'rgba(240,253,250,0.6)', padding: 12 },
  file: { borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 12, paddingVertical: 10 },
})
