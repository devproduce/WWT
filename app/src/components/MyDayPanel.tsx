import { EmptyState } from '@/components/EmptyState'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/field'
import { api, apiError } from '@/services/api'
import { colors, radii } from '@/theme/tokens'
import type { MyDayItem, MyDayResponse, TaskItem } from '@/types'
import { WHY_LABEL } from '@/types'
import { formatDay, isTaskDueSoon, localIsoDate } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { EyeOff, Pin, PinOff } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'

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
    onError: (err) => Alert.alert('Could not pin', apiError(err)),
  })
  const saveHidden = useMutation({
    mutationFn: (taskIds: string[]) => api.put<MyDayResponse>('/me/day/hidden', { date, taskIds }),
    onSuccess: (res) => queryClient.setQueryData(['my-day', date], res.data),
    onError: (err) => Alert.alert('Could not hide', apiError(err)),
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
    onError: (err) => Alert.alert('Could not update task', apiError(err)),
  })

  const data = day.data
  const lists = useMemo(() => filterDay(data, filter, query), [data, filter, query])
  const listedIds = new Set([...lists.focus, ...lists.waiting].map((item) => item.task.id))
  const extraMatches =
    query.trim().length > 0
      ? (mine.data ?? []).filter((task) => !listedIds.has(task.id) && task.status !== 'DONE')
      : []

  if (day.isPending) {
    return (
      <Card>
        <CardTitle>My Day</CardTitle>
        <AppText variant="caption" style={{ marginTop: 12 }}>
          Choosing what matters today…
        </AppText>
      </Card>
    )
  }
  if (day.isError || !data) {
    return (
      <Card>
        <CardTitle>My Day</CardTitle>
        <AppText style={{ marginTop: 12, color: colors.rose600 }}>
          {apiError(day.error, 'Could not load your day.')}
        </AppText>
      </Card>
    )
  }

  const pinIds = data.pinnedTaskIds ?? []
  const hiddenIds = data.hiddenTaskIds ?? []

  return (
    <Card>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <CardTitle>My Day</CardTitle>
          <AppText variant="caption" style={{ marginTop: 4 }}>
            A private plan for today. The board still shows the same work.
          </AppText>
        </View>
        <Input placeholder="Search my work" value={query} onChangeText={setQuery} style={{ minWidth: 160 }} />
      </View>
      <View style={{ marginTop: 16, gap: 8 }}>
        {lists.focus.length === 0 && lists.waiting.length === 0 && extraMatches.length === 0 ? (
          <EmptyState title="Clear day" description="Nothing in focus. Overdue and in-progress work will land here automatically." />
        ) : null}
        {lists.focus.map((item) => (
          <MyDayRowCard
            key={item.task.id}
            item={item}
            onPin={() => savePins.mutate(item.pinned ? pinIds.filter((id) => id !== item.task.id) : [...pinIds, item.task.id])}
            onHide={() => saveHidden.mutate([...hiddenIds, item.task.id])}
            onAction={() => action.mutate({ task: item.task, kind: item.primaryAction })}
          />
        ))}
      </View>
      {lists.waiting.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <AppText variant="label">Waiting</AppText>
          <View style={{ marginTop: 8, gap: 8 }}>
            {lists.waiting.map((item) => (
              <MyDayRowCard key={item.task.id} item={item} waiting />
            ))}
          </View>
        </View>
      ) : null}
      {extraMatches.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <AppText variant="label">More matches</AppText>
          <View style={{ marginTop: 8, gap: 8 }}>
            {extraMatches.map((task) => (
              <Pressable key={task.id} style={styles.row} onPress={() => router.push(`/tasks/${task.id}`)}>
                <AppText variant="cardTitle">{task.title}</AppText>
                <AppText variant="caption">Due {formatDay(task.deadline)}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.meta}>
        {data.overflowCount > 0 ? <AppText variant="caption">{data.overflowCount} more assigned</AppText> : null}
        {data.hiddenCount > 0 ? <AppText variant="caption">{data.hiddenCount} hidden until tomorrow</AppText> : null}
        {pinIds.length > 0 ? <AppText variant="caption">{pinIds.length} pinned</AppText> : null}
      </View>
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
  const bar =
    task.status === 'IN_PROGRESS'
      ? colors.amber500
      : item.overdue
        ? colors.rose600
        : task.priority === 'HIGH' || task.priority === 'URGENT'
          ? colors.amber500
          : colors.brand
  return (
    <View style={styles.row}>
      <View style={[styles.bar, { backgroundColor: bar }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Pressable onPress={() => router.push(`/tasks/${task.id}`)}>
          <AppText variant="cardTitle" numberOfLines={2}>
            {task.title}
          </AppText>
        </Pressable>
        <AppText variant="caption" style={{ marginTop: 2 }}>
          {item.projectName} · Due {formatDay(task.deadline)}
          {task.status === 'BLOCKED' && task.blockedWaitingOnName ? ` · Waiting on ${task.blockedWaitingOnName}` : ''}
          {task.status === 'BLOCKED' && !task.blockedWaitingOnName && task.blockedReason ? ` · ${task.blockedReason}` : ''}
        </AppText>
        <View style={styles.chips}>
          {task.status === 'IN_PROGRESS' ? <Badge tone="amber">Going on now</Badge> : null}
          <Badge tone={item.overdue && item.why !== 'IN_PROGRESS' ? 'red' : statusTone(String(item.why))}>
            {WHY_LABEL[item.why] ?? item.why}
          </Badge>
        </View>
        {waiting ? (
          <Button variant="secondary" onPress={() => router.push(`/tasks/${task.id}`)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            Open
          </Button>
        ) : (
          <View style={styles.actions}>
            {onAction && item.primaryAction === 'START' ? <Button onPress={onAction}>Start</Button> : null}
            {onAction && item.primaryAction === 'SUBMIT_REVIEW' ? <Button onPress={onAction}>Submit</Button> : null}
            <Pressable style={styles.icon} onPress={onPin} accessibilityLabel={item.pinned ? 'Unpin' : 'Pin'}>
              {item.pinned ? <PinOff size={16} color={colors.teal800} /> : <Pin size={16} color={colors.teal800} />}
            </Pressable>
            <Pressable style={styles.icon} onPress={onHide} accessibilityLabel="Hide until tomorrow">
              <EyeOff size={16} color={colors.teal800} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

function filterDay(data: MyDayResponse | undefined, filter: FocusFilter, query: string) {
  const q = query.trim().toLowerCase()
  const matchesQuery = (item: MyDayItem) => {
    const title = item.task?.title ?? ''
    const project = item.projectName ?? ''
    return !q || title.toLowerCase().includes(q) || project.toLowerCase().includes(q)
  }
  const matchesFilter = (item: MyDayItem) => {
    const task = item.task
    if (filter === 'OVERDUE') return item.overdue
    if (filter === 'SOON') return isTaskDueSoon(task)
    if (filter === 'REVIEW') return task.status === 'REVIEW'
    if (filter === 'PRIORITY') return task.priority === 'HIGH' || task.priority === 'URGENT'
    return true
  }
  return {
    focus: (data?.focus ?? []).filter((item) => item?.task?.id).filter(matchesFilter).filter(matchesQuery),
    waiting: (data?.waiting ?? []).filter((item) => item?.task?.id).filter(matchesFilter).filter(matchesQuery),
  }
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bar: { width: 6, height: 40, borderRadius: radii.pill },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  icon: { padding: 8, borderRadius: radii.pill },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
})
