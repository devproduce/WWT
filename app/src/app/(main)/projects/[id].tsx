import { BlockedReasonModal } from '@/components/BlockedReasonModal'
import { OptionSheet } from '@/components/OptionSheet'
import { PageHeader } from '@/components/PageHeader'
import { QuotaMeter } from '@/components/QuotaMeter'
import { StatusStack } from '@/components/StatusStack'
import { Avatar, RingChart } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Field, Input, TextArea } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/features/auth/AuthContext'
import { api, apiError } from '@/services/api'
import { colors, radii } from '@/theme/tokens'
import type { Project, ProjectReport, TaskItem, TaskPriority, TaskStatus } from '@/types'
import { TASK_COLUMNS } from '@/types'
import { formatDay, isTaskOverdue } from '@/lib/utils'
import { toast } from '@/components/Toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

const COLUMN_TONE: Record<TaskStatus, { bg: string; border: string; dot: string }> = {
  TODO: { bg: 'rgba(245,245,244,0.8)', border: '#E7E5E4', dot: '#A8A29E' },
  IN_PROGRESS: { bg: 'rgba(255,251,235,0.9)', border: 'rgba(253,230,138,0.8)', dot: '#D97706' },
  REVIEW: { bg: 'rgba(245,243,255,0.9)', border: 'rgba(221,214,254,0.8)', dot: '#7C3AED' },
  BLOCKED: { bg: 'rgba(255,241,242,0.9)', border: 'rgba(254,205,211,0.8)', dot: '#E11D48' },
  DONE: { bg: 'rgba(240,253,250,0.9)', border: 'rgba(153,246,228,0.8)', dot: '#0D9488' },
}

const COLUMN_PREVIEW = 5

export default function ProjectBoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [blockTask, setBlockTask] = useState<TaskItem | null>(null)
  const [moveTask, setMoveTask] = useState<TaskItem | null>(null)

  const project = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
  })
  const canManage = user?.role === 'ADMIN' || user?.id === project.data?.managerId
  const report = useQuery({
    queryKey: ['report', id],
    enabled: Boolean(id) && canManage,
    queryFn: async () => (await api.get<ProjectReport>(`/projects/${id}/report`)).data,
  })
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
      setMoveTask(null)
    },
    onError: (err) => toast.error(apiError(err, 'That move is not allowed')),
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

  const moveTo = (task: TaskItem, status: TaskStatus) => {
    if (status === 'BLOCKED') {
      setMoveTask(null)
      setBlockTask(task)
      return
    }
    transition.mutate({ taskId: task.id, status })
  }

  if (!project.data) {
    return (
      <View style={styles.center}>
        <AppText variant="caption">Loading project…</AppText>
      </View>
    )
  }
  const items = tasks.data ?? []

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader
        eyebrow="Board"
        title={project.data.name}
        subtitle={`PM ${project.data.managerName} · ${project.data.doneTasks}/${project.data.totalTasks} done`}
        actions={canManage ? <Button onPress={() => setCreateOpen(true)}>New task</Button> : undefined}
      />
      {report.data ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <RingChart value={report.data.completionPercent} max={100} size={88} stroke={10} />
            <View style={{ flex: 1 }}>
              <CardTitle>Delivery</CardTitle>
              <AppText variant="caption" style={{ marginTop: 4 }}>
                {report.data.overdue} overdue · {report.data.review} in review
              </AppText>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <StatusStack
              counts={{
                todo: report.data.todo,
                inProgress: report.data.inProgress,
                review: report.data.review,
                blocked: report.data.blocked,
                done: report.data.done,
              }}
            />
          </View>
          {report.data.tasksByMember.length > 0 ? (
            <View style={{ marginTop: 20, gap: 12 }}>
              <CardTitle>By member</CardTitle>
              {report.data.tasksByMember.map((row) => (
                <QuotaMeter key={row.name} label={row.name} used={row.completed} max={Math.max(row.assigned, 1)} />
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
        {TASK_COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={items.filter((task) => task.status === col.id)}
            onMove={(task) => setMoveTask(task)}
          />
        ))}
      </ScrollView>
      {createOpen ? (
        <CreateTaskForm
          people={assignablePeople(project.data, user?.role === 'ADMIN')}
          pending={createTask.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(payload) => createTask.mutate(payload)}
        />
      ) : null}
      <OptionSheet
        visible={Boolean(moveTask)}
        title="Move task"
        options={(moveTask?.allowedTransitions ?? []).map((status) => ({
          id: status,
          label: TASK_COLUMNS.find((col) => col.id === status)?.label ?? status,
        }))}
        onClose={() => setMoveTask(null)}
        onSelect={(status) => moveTask && moveTo(moveTask, status as TaskStatus)}
      />
      <BlockedReasonModal
        visible={Boolean(blockTask)}
        people={(project.data.members ?? []).filter((member) => member.id !== blockTask?.assigneeId)}
        pending={transition.isPending}
        onCancel={() => setBlockTask(null)}
        onConfirm={(payload) =>
          blockTask && transition.mutate({ taskId: blockTask.id, status: 'BLOCKED', ...payload })
        }
      />
    </ScrollView>
  )
}

function Column({
  id,
  label,
  tasks,
  onMove,
}: {
  id: TaskStatus
  label: string
  tasks: TaskItem[]
  onMove: (task: TaskItem) => void
}) {
  const [viewAll, setViewAll] = useState(false)
  const tone = COLUMN_TONE[id]
  const preview = tasks.slice(0, COLUMN_PREVIEW)
  return (
    <View style={[styles.column, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.colHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.dot, { backgroundColor: tone.dot }]} />
          <AppText variant="cardTitle">{label}</AppText>
        </View>
        <View style={styles.count}>
          <AppText variant="label" style={{ letterSpacing: 0 }}>
            {tasks.length}
          </AppText>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {preview.map((task) => (
          <BoardTaskCard key={task.id} task={task} onMove={() => onMove(task)} />
        ))}
        {tasks.length > COLUMN_PREVIEW ? (
          <Pressable style={styles.more} onPress={() => setViewAll(true)}>
            <AppText style={{ color: colors.teal800 }}>View all · {tasks.length}</AppText>
          </Pressable>
        ) : null}
      </View>
      <Modal visible={viewAll} onClose={() => setViewAll(false)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <AppText variant="cardTitle" style={{ fontSize: 18 }}>
              {label}
            </AppText>
            <AppText variant="caption">{tasks.length} tasks</AppText>
          </View>
          <Button variant="secondary" onPress={() => setViewAll(false)}>
            Close
          </Button>
        </View>
        <View style={{ gap: 8 }}>
          {tasks.map((task) => (
            <BoardTaskCard key={task.id} task={task} onMove={() => onMove(task)} />
          ))}
        </View>
      </Modal>
    </View>
  )
}

function BoardTaskCard({ task, onMove }: { task: TaskItem; onMove: () => void }) {
  const overdue = isTaskOverdue(task)
  const edge =
    task.priority === 'URGENT'
      ? colors.rose600
      : task.priority === 'HIGH'
        ? colors.amber500
        : task.priority === 'MEDIUM'
          ? colors.brand
          : '#D6D3D1'
  const canMove = (task.allowedTransitions ?? []).length > 0
  return (
    <View style={styles.card}>
      <View style={[styles.priority, { backgroundColor: edge }]} />
      <Pressable onPress={() => router.push(`/tasks/${task.id}`)}>
        <AppText variant="cardTitle" style={{ fontSize: 14 }}>
          {task.title}
        </AppText>
      </Pressable>
      <View style={styles.cardMeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          {task.assigneeName ? (
            <>
              <Avatar name={task.assigneeName} size="sm" />
              <AppText variant="caption" numberOfLines={1}>
                {task.assigneeName}
              </AppText>
            </>
          ) : (
            <AppText variant="caption">Unassigned</AppText>
          )}
        </View>
        <View style={[styles.due, overdue && styles.dueOverdue]}>
          <AppText variant="label" style={{ color: overdue ? '#9F1239' : colors.teal800, fontSize: 10 }}>
            {formatDay(task.deadline)}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
        {task.status === 'BLOCKED' && task.blockedReason ? (
          <Badge tone="red">
            {task.blockedWaitingOnName ? `Waiting on ${task.blockedWaitingOnName}` : task.blockedReason}
          </Badge>
        ) : null}
      </View>
      {canMove ? (
        <Button variant="secondary" onPress={onMove} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          Move
        </Button>
      ) : null}
    </View>
  )
}

function CreateTaskForm({
  people,
  pending,
  onClose,
  onSubmit,
}: {
  people: { id: string; name: string }[]
  pending: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM' as TaskPriority,
    deadline: '',
  })
  return (
    <Modal visible onClose={onClose}>
      <AppText variant="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>
        New task
      </AppText>
      <View style={{ gap: 12 }}>
        <Field label="Title">
          <Input value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
        </Field>
        <Field label="Description">
          <TextArea value={form.description} onChangeText={(description) => setForm({ ...form, description })} />
        </Field>
        <Field label="Assignee">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              style={[styles.chip, form.assigneeId === '' && styles.chipOn]}
              onPress={() => setForm({ ...form, assigneeId: '' })}
            >
              <AppText variant="caption">Unassigned</AppText>
            </Pressable>
            {people.map((person) => (
              <Pressable
                key={person.id}
                style={[styles.chip, form.assigneeId === person.id && styles.chipOn]}
                onPress={() => setForm({ ...form, assigneeId: person.id })}
              >
                <AppText variant="caption">{person.name}</AppText>
              </Pressable>
            ))}
          </View>
          {people.length === 0 ? (
            <AppText variant="caption" style={{ marginTop: 6 }}>
              No assignable members yet. An Admin must add members to this project first.
            </AppText>
          ) : null}
        </Field>
        <Field label="Priority">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((priority) => (
              <Pressable
                key={priority}
                style={[styles.chip, form.priority === priority && styles.chipOn]}
                onPress={() => setForm({ ...form, priority })}
              >
                <AppText variant="caption">{priority}</AppText>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Deadline">
          <Input
            placeholder="YYYY-MM-DD"
            value={form.deadline}
            onChangeText={(deadline) => setForm({ ...form, deadline })}
          />
        </Field>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !form.title.trim()}
            pending={pending}
            onPress={() =>
              onSubmit({
                title: form.title,
                description: form.description,
                assigneeId: form.assigneeId || null,
                priority: form.priority,
                deadline: form.deadline || null,
              })
            }
          >
            Create
          </Button>
        </View>
      </View>
    </Modal>
  )
}

function assignablePeople(project: Project, isAdmin: boolean) {
  const members = project.members ?? []
  if (isAdmin) return members
  return members.filter((member) => member.id !== project.managerId)
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  board: { gap: 12, paddingRight: 8 },
  column: {
    width: 280,
    minHeight: 288,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  colHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  count: { borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 8, paddingVertical: 2 },
  more: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(18,49,46,0.1)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.06)',
  },
  priority: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, paddingLeft: 8 },
  due: { borderRadius: radii.pill, backgroundColor: colors.teal50, paddingHorizontal: 8, paddingVertical: 2 },
  dueOverdue: { backgroundColor: '#FFE4E6' },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(18,49,46,0.1)',
  },
  chipOn: { backgroundColor: colors.teal50, borderColor: colors.teal300 },
})
