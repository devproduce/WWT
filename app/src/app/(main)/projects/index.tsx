import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { RingChart } from '@/components/charts'
import { AppText } from '@/components/ui/AppText'
import { Badge, statusTone } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { api } from '@/services/api'
import { colors } from '@/theme/tokens'
import type { Project } from '@/types'
import { formatDay, utilization } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'

const STATUS_EDGE: Record<string, string> = {
  ACTIVE: colors.brand,
  PLANNED: colors.sky600,
  ON_HOLD: colors.amber500,
  COMPLETED: '#059669',
  ARCHIVED: '#A8A29E',
}

export default function ProjectsScreen() {
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<Project[]>('/projects')).data,
  })
  const items = projects.data ?? []

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        subtitle="Boards, progress, and the people steering them."
      />
      {projects.isPending ? (
        <AppText variant="caption" style={{ textAlign: 'center', paddingVertical: 40 }}>
          Loading projects…
        </AppText>
      ) : items.length === 0 ? (
        <EmptyState title="No projects yet" description="An admin can create the first board for this organization." />
      ) : (
        items.map((project) => (
          <Card key={project.id} interactive onPress={() => router.push(`/projects/${project.id}`)} style={{ overflow: 'hidden' }}>
            <View style={[styles.edge, { backgroundColor: STATUS_EDGE[project.status] ?? colors.brand }]} />
            <View style={{ paddingLeft: 10 }}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <AppText variant="cardTitle">{project.name}</AppText>
                  <AppText variant="caption">PM {project.managerName}</AppText>
                </View>
                <Badge tone={statusTone(project.status)}>{project.status}</Badge>
              </View>
              {project.description ? (
                <AppText variant="caption" numberOfLines={2} style={{ marginTop: 12 }}>
                  {project.description}
                </AppText>
              ) : null}
              <View style={styles.progress}>
                <RingChart value={project.doneTasks} max={project.totalTasks || 1} size={68} stroke={8} />
                <View style={{ flex: 1 }}>
                  <AppText>
                    {project.doneTasks}/{project.totalTasks} complete
                  </AppText>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        { width: `${utilization(project.doneTasks, project.totalTasks || 1)}%` },
                      ]}
                    />
                  </View>
                  {project.targetDate ? (
                    <AppText variant="caption" style={{ marginTop: 8 }}>
                      Target {formatDay(project.targetDate)}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(18,49,46,0.08)', marginTop: 8 },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#0D9488' },
})
