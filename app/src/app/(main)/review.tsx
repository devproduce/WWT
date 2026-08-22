import { EmptyState } from '@/components/EmptyState'
import { MetricCard } from '@/components/MetricCard'
import { PageHeader } from '@/components/PageHeader'
import { ReturnNoteModal } from '@/components/ReturnNoteModal'
import { Avatar } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { formatDay, formatWait, waitHours } from '@/lib/utils'
import { api, apiError } from '@/services/api'
import { colors, radii } from '@/theme/tokens'
import type { ReviewQueueItem } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { AlertTriangle, Clock3, Inbox } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'

export default function ReviewInboxScreen() {
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
    mutationFn: (taskId: string) => api.post(`/tasks/${taskId}/approve`),
    onSuccess: refresh,
    onError: (err) => Alert.alert('Could not approve', apiError(err)),
  })
  const returnTask = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => api.post(`/tasks/${id}/return`, { comment }),
    onSuccess: () => {
      setReturnItem(null)
      refresh()
    },
    onError: (err) => Alert.alert('Could not return', apiError(err)),
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
      if (existing) existing.items.push(item)
      else groups.set(key, { name: item.managerName || 'Unassigned manager', items: [item] })
    }
    return [...groups.values()]
  }, [items])
  const next = items.find((item) => item.task.canReview) ?? items[0]
  const rest = next ? items.filter((item) => item.task.id !== next.task.id) : []
  const stale = items.filter((item) => waitHours(item.waitingSince) >= 24).length
  const urgent = items.filter((item) => item.task.priority === 'HIGH' || item.task.priority === 'URGENT').length
  const busy = approve.isPending || returnTask.isPending

  return (
    <ScrollView contentContainerStyle={styles.page}>
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
        <EmptyState title="Could not load the inbox" description={apiError(queue.error, 'The review queue is unavailable.')} />
      ) : queue.isPending ? (
        <AppText variant="caption" style={{ textAlign: 'center', paddingVertical: 40 }}>
          Loading reviews…
        </AppText>
      ) : items.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          description={
            canAct
              ? 'Nothing is waiting for a review. When a member submits work, it will show up here first.'
              : 'No work is sitting with a Project Manager right now.'
          }
        />
      ) : (
        <>
          <MetricCard
            label="Waiting"
            value={items.length}
            hint="Submitted and not yet signed off"
            icon={<Inbox size={20} color={colors.white} />}
            tone="violet"
          />
          <MetricCard
            label="Stale"
            value={stale}
            hint="Waiting more than a day"
            icon={<Clock3 size={20} color={colors.white} />}
            tone={stale > 0 ? 'coral' : 'teal'}
          />
          <MetricCard
            label="High priority"
            value={urgent}
            hint="Urgent or high in this queue"
            icon={<AlertTriangle size={20} color={colors.white} />}
            tone={urgent > 0 ? 'amber' : 'stone'}
          />
          {next && canAct ? (
            <View style={{ gap: 12 }}>
              <AppText variant="eyebrow">Next to review</AppText>
              <ReviewHero
                item={next}
                busy={busy}
                onApprove={() => approve.mutate(next.task.id)}
                onReturn={() => setReturnItem(next)}
              />
            </View>
          ) : null}
          {canAct && rest.length > 0 ? (
            <View style={{ gap: 8 }}>
              <AppText variant="eyebrow">Also waiting · {rest.length} more</AppText>
              {rest.map((item) => (
                <ReviewRow
                  key={item.task.id}
                  item={item}
                  busy={busy}
                  onApprove={() => approve.mutate(item.task.id)}
                  onReturn={() => setReturnItem(item)}
                />
              ))}
            </View>
          ) : null}
          {!canAct
            ? byManager.map((group) => (
                <View key={group.name} style={{ gap: 8 }}>
                  <AppText variant="eyebrow">Waiting on {group.name}</AppText>
                  {group.items.map((item) => (
                    <ReviewRow key={item.task.id} item={item} busy={false} />
                  ))}
                </View>
              ))
            : null}
        </>
      )}
      <ReturnNoteModal
        visible={Boolean(returnItem)}
        pending={returnTask.isPending}
        taskTitle={returnItem?.task.title}
        onCancel={() => setReturnItem(null)}
        onConfirm={(comment) => returnItem && returnTask.mutate({ id: returnItem.task.id, comment })}
      />
    </ScrollView>
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
  return (
    <Card style={{ backgroundColor: 'rgba(245,243,255,0.9)', borderColor: 'rgba(196,181,253,0.7)' }}>
      <View style={styles.heroEdge} />
      <View style={{ paddingLeft: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Badge tone="purple">Review</Badge>
          <Badge tone={statusTone(item.task.priority)}>{item.task.priority}</Badge>
          <WaitChip since={item.waitingSince} />
        </View>
        <Pressable onPress={() => router.push(`/tasks/${item.task.id}`)}>
          <AppText variant="title" style={{ fontSize: 24 }}>
            {item.task.title}
          </AppText>
        </Pressable>
        {item.task.description?.trim() ? (
          <AppText variant="caption" numberOfLines={2}>
            {item.task.description}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {item.task.assigneeName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar name={item.task.assigneeName} size="sm" />
              <AppText variant="caption">{item.task.assigneeName}</AppText>
            </View>
          ) : null}
          <AppText variant="caption">{item.projectName}</AppText>
          <AppText variant="caption">Due {formatDay(item.task.deadline)}</AppText>
        </View>
        {item.task.canReview ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Button onPress={onApprove} disabled={busy}>
              Approve
            </Button>
            <Button variant="secondary" onPress={onReturn} disabled={busy}>
              Return
            </Button>
          </View>
        ) : (
          <AppText variant="caption">Waiting on {item.managerName ?? 'the Project Manager'}</AppText>
        )}
        {stale ? (
          <AppText style={{ color: '#9F1239', marginTop: 8 }}>
            This has been sitting in review. A decision now unblocks the member.
          </AppText>
        ) : null}
      </View>
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
    <Card>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Avatar name={item.task.assigneeName ?? item.projectName} size="sm" />
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => router.push(`/tasks/${item.task.id}`)}>
            <AppText variant="cardTitle">{item.task.title}</AppText>
          </Pressable>
          <AppText variant="caption" style={{ marginTop: 4 }}>
            {item.projectName}
            {item.managerName ? ` · PM ${item.managerName}` : ''}
            {item.task.assigneeName ? ` · ${item.task.assigneeName}` : ''} · Due {formatDay(item.task.deadline)}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <WaitChip since={item.waitingSince} />
            <Badge tone={statusTone(item.task.priority)}>{item.task.priority}</Badge>
          </View>
          {item.task.canReview && onApprove && onReturn ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button variant="secondary" onPress={onReturn} disabled={busy}>
                Return
              </Button>
              <Button onPress={onApprove} disabled={busy}>
                Approve
              </Button>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  )
}

function WaitChip({ since }: { since: string | null }) {
  const hours = waitHours(since)
  const bg = hours >= 24 ? '#FFE4E6' : hours >= 8 ? '#FEF3C7' : '#EDE9FE'
  const color = hours >= 24 ? '#9F1239' : hours >= 8 ? '#78350F' : '#5B21B6'
  return (
    <View style={[styles.wait, { backgroundColor: bg }]}>
      <Clock3 size={12} color={color} />
      <AppText variant="label" style={{ color, fontSize: 10 }}>
        {formatWait(since)}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  heroEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: colors.violet500, borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  wait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
})
