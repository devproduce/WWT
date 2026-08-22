import { Avatar, StatusDonut } from '@/components/charts'
import { MetricCard } from '@/components/MetricCard'
import { MyDayPanel } from '@/components/MyDayPanel'
import { PageHeader } from '@/components/PageHeader'
import { StatusStack } from '@/components/StatusStack'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/services/api'
import { colors, fonts, STATUS_SEGMENTS } from '@/theme/tokens'
import type { Dashboard } from '@/types'
import { deadlineClockRunning, formatDate, formatDay, num, str } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { AlertTriangle, CalendarClock, CheckCircle2, Zap } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

export default function HomeScreen() {
  const { user } = useAuth()
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<Dashboard>('/dashboard')).data,
  })

  if (dash.isLoading) {
    return (
      <View style={styles.center}>
        <AppText variant="caption">Loading dashboard…</AppText>
      </View>
    )
  }
  if (!dash.data) return null
  if (dash.data.organizationDisabled) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Card>
          <CardTitle>Organization disabled</CardTitle>
          <AppText variant="caption" style={{ marginTop: 8 }}>
            {str(dash.data.metrics.organizationName, 'Your organization')} is disabled. Existing data is preserved.
            Contact the platform owner if you need access restored.
          </AppText>
        </Card>
      </ScrollView>
    )
  }
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <PageHeader
          eyebrow="Workspace"
          title={user.role === 'SUPER_ADMIN' ? 'Platform console' : 'Organization admin'}
          subtitle="Use the website for admin tools."
        />
        <Card>
          <CardTitle>Admin tools live on the website</CardTitle>
          <AppText variant="caption" style={{ marginTop: 8 }}>
            This companion app is built for members and project managers. Open weworktogether.me for organizations,
            members, and platform controls.
          </AppText>
        </Card>
      </ScrollView>
    )
  }
  return <MemberHome data={dash.data} />
}

function MemberHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'SOON' | 'REVIEW' | 'PRIORITY'>('ALL')
  const tasks = data.items as Record<string, unknown>[]
  const donutSegments = STATUS_SEGMENTS.map((segment) => ({
    color: segment.color,
    value: num(m[segment.key]),
  }))
  const assigned = num(m.assignedTasks) || 1

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader
        eyebrow="Workspace"
        title="My work"
        subtitle="A visual pass over what is assigned to you — and what needs a move."
      />
      <Card style={{ alignItems: 'center' }}>
        <View style={styles.donut}>
          <StatusDonut segments={donutSegments} />
          <View style={styles.donutLabel} pointerEvents="none">
            <AppText variant="metric">{num(m.assignedTasks)}</AppText>
            <AppText variant="label">Assigned</AppText>
          </View>
        </View>
        <View style={{ width: '100%', marginTop: 16 }}>
          <StatusStack
            counts={{
              todo: num(m.todo),
              inProgress: num(m.inProgress),
              review: num(m.review),
              blocked: num(m.blocked),
              done: num(m.done),
            }}
          />
        </View>
      </Card>
      <View style={styles.metrics}>
        <MetricCard
          label="Overdue"
          value={num(m.overdue)}
          icon={<AlertTriangle size={20} color={colors.white} />}
          tone="coral"
          active={filter === 'OVERDUE'}
          onPress={() => setFilter(filter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          ring={{ value: num(m.overdue), max: assigned }}
        />
        <MetricCard
          label="Due soon"
          value={num(m.dueSoon)}
          icon={<CalendarClock size={20} color={colors.white} />}
          tone="amber"
          active={filter === 'SOON'}
          onPress={() => setFilter(filter === 'SOON' ? 'ALL' : 'SOON')}
          ring={{ value: num(m.dueSoon), max: assigned }}
        />
        <MetricCard
          label="Awaiting review"
          value={num(m.awaitingReview)}
          icon={<CheckCircle2 size={20} color={colors.white} />}
          tone="violet"
          active={filter === 'REVIEW'}
          onPress={() => setFilter(filter === 'REVIEW' ? 'ALL' : 'REVIEW')}
          ring={{ value: num(m.awaitingReview), max: assigned }}
        />
        <MetricCard
          label="High priority"
          value={num(m.highPriority)}
          icon={<Zap size={20} color={colors.white} />}
          tone="sky"
          active={filter === 'PRIORITY'}
          onPress={() => setFilter(filter === 'PRIORITY' ? 'ALL' : 'PRIORITY')}
          ring={{ value: num(m.highPriority), max: assigned }}
        />
      </View>
      {num(m.managedProjects) > 0 ? (
        <Card>
          <AppText variant="eyebrow">Project manager</AppText>
          <CardTitle>{str(m.pmProjectName)}</CardTitle>
          <AppText variant="caption" style={{ marginTop: 4 }}>
            Pipeline across the board you own.
          </AppText>
          {num(m.pmReview) > 0 ? (
            <Pressable onPress={() => router.push('/review')} style={{ marginTop: 8 }}>
              <AppText style={{ color: '#5B21B6', fontFamily: fonts.sansMedium }}>
                {num(m.pmReview)} waiting on your review
              </AppText>
            </Pressable>
          ) : null}
          <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <Button variant="secondary" onPress={() => router.push(`/projects/${str(m.pmProjectId)}`)}>
              Open Kanban
            </Button>
          </View>
          <View style={{ marginTop: 20 }}>
            <StatusStack
              counts={{
                todo: num(m.pmTodo),
                inProgress: num(m.pmInProgress),
                review: num(m.pmReview),
                blocked: num(m.pmBlocked),
                done: num(m.pmDone),
              }}
            />
          </View>
        </Card>
      ) : null}
      <Card>
        <CardTitle>Due timeline</CardTitle>
        <DueRail tasks={tasks} />
      </Card>
      <MyDayPanel filter={filter} />
      {Array.isArray(m.recentActivity) && (m.recentActivity as Record<string, unknown>[]).length > 0 ? (
        <Card>
          <CardTitle>Recent activity</CardTitle>
          <View style={{ marginTop: 16, gap: 12 }}>
            {(m.recentActivity as Record<string, unknown>[]).slice(0, 6).map((event) => (
              <Pressable
                key={str(event.id)}
                style={styles.activity}
                onPress={() => {
                  const taskId = str(event.taskId)
                  const projectId = str(event.projectId)
                  if (taskId) router.push(`/tasks/${taskId}`)
                  else if (projectId) router.push(`/projects/${projectId}`)
                }}
              >
                <Avatar name={str(event.actorName, 'WWT')} size="sm" />
                <View style={{ flex: 1 }}>
                  <AppText>{str(event.message)}</AppText>
                  <AppText variant="caption">{formatDate(str(event.createdAt))}</AppText>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}
    </ScrollView>
  )
}

function DueRail({ tasks }: { tasks: Record<string, unknown>[] }) {
  const dated = tasks
    .filter((task) => task.deadline && deadlineClockRunning(str(task.status)))
    .sort((a, b) => str(a.deadline).localeCompare(str(b.deadline)))
    .slice(0, 8)
  if (dated.length === 0) {
    return (
      <AppText variant="caption" style={{ marginTop: 12 }}>
        Nothing dated yet — enjoy the quiet rail.
      </AppText>
    )
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {dated.map((task) => (
        <Pressable key={str(task.id)} style={styles.railCard} onPress={() => router.push(`/tasks/${str(task.id)}`)}>
          <AppText variant="label">{formatDay(str(task.deadline))}</AppText>
          <AppText variant="cardTitle" numberOfLines={2} style={{ marginTop: 8, fontSize: 14 }}>
            {str(task.title)}
          </AppText>
          <View style={{ marginTop: 8 }}>
            <Badge tone={statusTone(str(task.status))}>{str(task.status)}</Badge>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  donut: { width: 148, height: 148 },
  donutLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  metrics: { gap: 12 },
  activity: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rail: { gap: 12, paddingTop: 16, paddingRight: 8 },
  railCard: {
    width: 176,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,61,56,0.08)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 12,
  },
})
