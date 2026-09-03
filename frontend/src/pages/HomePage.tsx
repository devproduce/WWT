import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Inbox,
  Users,
  Zap,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import { StatusStack } from '@/components/StatusStack'
import { QuotaMeter } from '@/components/QuotaMeter'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { RingChart, StatusDonut, Avatar } from '@/components/charts'
import { STATUS_SEGMENTS } from '@/components/StatusStack'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/services/api'
import { cn, formatDate, formatDay, isTaskDueSoon, isTaskOverdue, num, str, utilization, deadlineClockRunning } from '@/lib/utils'
import type { Dashboard } from '@/types'
import { MyDayPanel } from '@/components/MyDayPanel'

export function HomePage() {
  const { user } = useAuth()
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<Dashboard>('/dashboard')).data,
  })

  if (dash.isLoading) {
    return <p className="py-16 text-center text-sm text-muted">Loading dashboard…</p>
  }
  if (!dash.data) return null
  if (dash.data.organizationDisabled) {
    return (
      <Card>
        <CardTitle>Organization disabled</CardTitle>
        <p className="mt-2 text-sm text-teal-900/60">
          {str(dash.data.metrics.organizationName, 'Your organization')} is disabled. Existing data is preserved.
          Contact the platform owner if you need access restored.
        </p>
      </Card>
    )
  }
  if (user?.role === 'SUPER_ADMIN') return <SuperAdminHome data={dash.data} />
  if (user?.role === 'ADMIN') return <AdminHome data={dash.data} />
  return <MemberHome data={dash.data} />
}

function SuperAdminHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL')
  const orgs = data.items.filter((item) => filter === 'ALL' || str(item.status) === filter)
  const active = num(m.activeOrganizations)
  const disabled = num(m.disabledOrganizations)
  const total = Math.max(num(m.totalOrganizations), 1)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Fleet overview"
        subtitle="Aggregate customer usage only. Internal work is never shown here."
        actions={
          <Link to="/app/organizations">
            <Button>Manage customers</Button>
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="flex items-center gap-6">
          <RingChart
            value={active}
            max={total}
            size={120}
            stroke={12}
            tone="teal"
            label={
              <div>
                <div className="text-xl font-semibold">{active}</div>
                <div className="text-[10px] tracking-wide text-teal-800/50 uppercase">Active</div>
              </div>
            }
          />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Tenant health</div>
            <p className="mt-1 font-serif text-xl italic text-ink">Customers live on the platform</p>
            <div className="mt-4 space-y-2">
              <QuotaMeter label="Active" used={active} max={total} />
              <QuotaMeter label="Disabled" used={disabled} max={total} />
            </div>
          </div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Organizations"
            value={num(m.totalOrganizations)}
            icon={<Building2 className="h-5 w-5" />}
            tone="teal"
            active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
          />
          <MetricCard
            label="Active"
            value={active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="teal"
            active={filter === 'ACTIVE'}
            onClick={() => setFilter('ACTIVE')}
          />
          <MetricCard
            label="Disabled"
            value={disabled}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="coral"
            active={filter === 'DISABLED'}
            onClick={() => setFilter('DISABLED')}
          />
          <MetricCard
            label="Active members"
            value={num(m.aggregateMembers)}
            hint={`${num(m.aggregateProjects)} live projects`}
            icon={<Users className="h-5 w-5" />}
            tone="sky"
            to="/app/organizations"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <CardTitle>Customer fleet</CardTitle>
        <FilterChips
          value={filter}
          onChange={(next) => setFilter(next as typeof filter)}
          options={[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DISABLED', label: 'Disabled' },
          ]}
        />
      </div>
      {orgs.length === 0 ? (
        <EmptyState title="No customers in this view" description="Create an organization to start the fleet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orgs.map((org) => (
            <Link key={str(org.id)} to={`/app/organizations/${str(org.id)}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{str(org.name)}</div>
                    <div className="text-xs text-muted">{str(org.planName)}</div>
                  </div>
                  <Badge tone={statusTone(str(org.status))}>{str(org.status)}</Badge>
                </div>
                <div className="mt-5 space-y-3">
                  <QuotaMeter label="Members" used={num(org.memberCount)} max={num(org.memberLimit)} />
                  <QuotaMeter label="Projects" used={num(org.projectCount)} max={num(org.projectLimit)} />
                  <QuotaMeter
                    label="Storage"
                    used={num(org.storageUsedBytes)}
                    max={num(org.storageLimitBytes)}
                    format="bytes"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [focus, setFocus] = useState<'all' | 'overdue' | 'upcoming'>('all')
  const deadlineStripRef = useRef<HTMLDivElement>(null)
  const projects = data.items.filter((item) => statusFilter === 'ALL' || str(item.status) === statusFilter)
  const deadlines = Array.isArray(m.deadlineTasks) ? (m.deadlineTasks as Record<string, unknown>[]) : []
  const activity = Array.isArray(m.recentActivity) ? (m.recentActivity as Record<string, unknown>[]) : []
  const reviewsByManager = Array.isArray(m.reviewsByManager)
    ? (m.reviewsByManager as Record<string, unknown>[])
    : []
  const visibleDeadlines = deadlines.filter((item) => focus === 'all' || str(item.kind) === (focus === 'overdue' ? 'overdue' : 'upcoming'))
  const mix = deliveryMix(m, data.items)
  const focusDeadlines = (next: 'overdue' | 'upcoming') => {
    setFocus(focus === next ? 'all' : next)
    window.setTimeout(() => {
      deadlineStripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title={str(m.organizationName)}
        subtitle="Delivery health, quotas, and what each Project Manager still has in review."
        actions={
          <Link to="/app/projects">
            <Button>Open projects</Button>
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Members"
          value={`${num(m.memberCount)} / ${num(m.memberLimit)}`}
          hint={`${utilization(num(m.memberCount), num(m.memberLimit))}% of plan`}
          icon={<Users className="h-5 w-5" />}
          tone="teal"
          ring={{ value: num(m.memberCount), max: num(m.memberLimit) }}
          to="/app/members"
        />
        <MetricCard
          label="Projects"
          value={`${num(m.projectCount)} / ${num(m.projectLimit)}`}
          hint={`${num(m.activeProjects)} active · ${num(m.completedProjects)} done`}
          icon={<FolderKanban className="h-5 w-5" />}
          tone="sky"
          ring={{ value: num(m.projectCount), max: num(m.projectLimit) }}
          to="/app/projects"
        />
        <MetricCard
          label="Overdue"
          value={num(m.overdueTasks)}
          hint="Needs attention now"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="coral"
          active={focus === 'overdue'}
          onClick={() => focusDeadlines('overdue')}
        />
        <MetricCard
          label="Due this week"
          value={num(m.upcomingDeadlines)}
          hint="Next seven days"
          icon={<CalendarClock className="h-5 w-5" />}
          tone="amber"
          active={focus === 'upcoming'}
          onClick={() => focusDeadlines('upcoming')}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardTitle>Delivery mix</CardTitle>
          <p className="mt-1 text-sm text-muted">How work is flowing across the organization.</p>
          <div className="mt-5">
            <StatusStack counts={mix} />
          </div>
        </Card>
        <div ref={deadlineStripRef}>
          <Card>
            <CardTitle>Deadline strip</CardTitle>
            <div className="mt-4 space-y-2">
              {visibleDeadlines.length === 0 && (
                <p className="text-sm text-muted">No matching deadlines. The calendar is clear.</p>
              )}
              {visibleDeadlines.slice(0, 6).map((item) => (
                <Link
                  key={str(item.id)}
                  to={`/app/tasks/${str(item.id)}`}
                  className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{str(item.title)}</div>
                    <div className="text-xs text-muted">{formatDay(str(item.deadline))}</div>
                  </div>
                  <Badge tone={str(item.kind) === 'overdue' ? 'red' : 'amber'}>{str(item.kind)}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Awaiting review</CardTitle>
            <p className="mt-1 text-sm text-muted">
              How much work is waiting on each Project Manager. You can see it — they sign it off.
            </p>
          </div>
          <Link to="/app/review">
            <Button variant="secondary">
              <Inbox className="h-4 w-4" />
              Open reviews
            </Button>
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {reviewsByManager.length === 0 && (
            <p className="text-sm text-muted">Nothing is waiting in review.</p>
          )}
          {reviewsByManager.map((row) => (
            <div
              key={str(row.managerId, str(row.managerName))}
              className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 dark:bg-white/5"
            >
              <span className="text-sm font-medium text-ink">{str(row.managerName, 'Project Manager')}</span>
              <Badge tone="purple">{`${num(row.reviewCount)} in review`}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <CardTitle>Project portfolio</CardTitle>
        <FilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'ON_HOLD', label: 'On hold' },
            { id: 'COMPLETED', label: 'Completed' },
          ]}
        />
      </div>
      {projects.length === 0 ? (
        <EmptyState title="No projects in this filter" description="Create a project or switch the status chips." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const done = num(project.doneTasks)
            const total = num(project.totalTasks)
            return (
              <Link key={str(project.id)} to={`/app/projects/${str(project.id)}`}>
                <Card interactive className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{str(project.name)}</div>
                      <div className="text-xs text-muted">
                        {str(project.managerName) ? `PM ${str(project.managerName)} · ` : ''}
                        {done}/{total} complete
                        {num(project.review) > 0 ? ` · ${num(project.review)} in review` : ''}
                      </div>
                    </div>
                    <Badge tone={statusTone(str(project.status))}>{str(project.status)}</Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <RingChart value={done} max={total || 1} size={72} stroke={8} />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal-900/8">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: `${utilization(done, total || 1)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
      <Card>
        <CardTitle>Recent activity</CardTitle>
        <div className="mt-4 space-y-3">
          {activity.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
          {activity.slice(0, 8).map((event) => {
            const href = activityHref(event)
            const row = (
              <div className="flex gap-3">
                <Avatar name={str(event.actorName, 'WWT')} size="sm" />
                <div>
                  <div className="text-sm text-ink">{str(event.message)}</div>
                  <div className="text-xs text-teal-900/45">{formatDate(str(event.createdAt))}</div>
                </div>
              </div>
            )
            return href ? (
              <Link key={str(event.id)} to={href} className="block rounded-2xl hover:bg-white/60">
                {row}
              </Link>
            ) : (
              <div key={str(event.id)}>{row}</div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function MemberHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  const tasks = data.items as Record<string, unknown>[]
  const donutSegments = STATUS_SEGMENTS.map((segment) => ({
    color: segment.color,
    value: num(m[segment.key]),
  }))
  const assigned = num(m.assignedTasks) || 1

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="My work"
        subtitle="A visual pass over what is assigned to you — and what needs a move."
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="flex flex-col items-center justify-center">
          <div className="relative">
            <StatusDonut segments={donutSegments} />
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-2xl font-semibold text-ink">{num(m.assignedTasks)}</div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-teal-800/55 uppercase">Assigned</div>
              </div>
            </div>
          </div>
          <div className="mt-4 w-full">
            <StatusStack
              counts={{
                todo: num(m.todo),
                inProgress: num(m.inProgress),
                review: num(m.review),
                blocked: num(m.blocked),
                done: num(m.done),
              }}
            />
          </div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Overdue"
            value={num(m.overdue)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="coral"
            to={kanbanBoardHref(tasks, 'OVERDUE')}
            ring={{ value: num(m.overdue), max: assigned }}
          />
          <MetricCard
            label="Due soon"
            value={num(m.dueSoon)}
            icon={<CalendarClock className="h-5 w-5" />}
            tone="amber"
            to={kanbanBoardHref(tasks, 'SOON')}
            ring={{ value: num(m.dueSoon), max: assigned }}
          />
          <MetricCard
            label="Awaiting review"
            value={num(m.awaitingReview)}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="violet"
            to={kanbanBoardHref(tasks, 'REVIEW')}
            ring={{ value: num(m.awaitingReview), max: assigned }}
          />
          <MetricCard
            label="High priority"
            value={num(m.highPriority)}
            icon={<Zap className="h-5 w-5" />}
            tone="sky"
            to={kanbanBoardHref(tasks, 'PRIORITY')}
            ring={{ value: num(m.highPriority), max: assigned }}
          />
        </div>
      </div>
      {num(m.managedProjects) > 0 && (
        <Card className="border-teal-700/15 bg-gradient-to-br from-teal-50/90 to-white/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Project manager</div>
              <CardTitle className="mt-1">{str(m.pmProjectName)}</CardTitle>
              <p className="mt-1 text-sm text-muted">Pipeline across the board you own.</p>
              {num(m.pmReview) > 0 && (
                <Link
                  to="/app/review"
                  className="mt-2 inline-block text-sm font-medium text-violet-800 hover:text-violet-950"
                >
                  {num(m.pmReview)} waiting on your review
                </Link>
              )}
            </div>
            <Link to={`/app/projects/${str(m.pmProjectId)}`}>
              <Button variant="secondary">Open Kanban</Button>
            </Link>
          </div>
          <div className="mt-5">
            <StatusStack
              counts={{
                todo: num(m.pmTodo),
                inProgress: num(m.pmInProgress),
                review: num(m.pmReview),
                blocked: num(m.pmBlocked),
                done: num(m.pmDone),
              }}
            />
          </div>
        </Card>
      )}
      <Card>
        <CardTitle>Due timeline</CardTitle>
        <DueRail tasks={tasks} />
      </Card>
      <MyDayPanel />
      {Array.isArray(m.recentActivity) && (m.recentActivity as Record<string, unknown>[]).length > 0 && (
        <Card>
          <CardTitle>Recent activity</CardTitle>
          <div className="mt-4 space-y-3">
            {(m.recentActivity as Record<string, unknown>[]).slice(0, 6).map((event) => {
              const href = activityHref(event)
              const row = (
                <div className="flex gap-3">
                  <Avatar name={str(event.actorName, 'WWT')} size="sm" />
                  <div>
                    <div className="text-sm text-ink">{str(event.message)}</div>
                    <div className="text-xs text-teal-900/45">{formatDate(str(event.createdAt))}</div>
                  </div>
                </div>
              )
              return href ? (
                <Link key={str(event.id)} to={href} className="block rounded-2xl hover:bg-white/60">
                  {row}
                </Link>
              ) : (
                <div key={str(event.id)}>{row}</div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function kanbanBoardHref(tasks: Record<string, unknown>[], focus: 'OVERDUE' | 'SOON' | 'REVIEW' | 'PRIORITY') {
  const matching = tasks.filter((task) => matchesWorkFocus(task, focus))
  if (matching.length === 0) return '/app/projects'

  const counts = new Map<string, number>()
  for (const task of matching) {
    const projectId = str(task.projectId)
    if (!projectId) continue
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
  }
  if (counts.size === 0) return '/app/projects'

  let projectId = ''
  let bestCount = 0
  for (const [id, count] of counts) {
    if (count > bestCount) {
      projectId = id
      bestCount = count
    }
  }
  return `/app/projects/${projectId}?focus=${focus}`
}

function matchesWorkFocus(task: Record<string, unknown>, focus: 'OVERDUE' | 'SOON' | 'REVIEW' | 'PRIORITY') {
  const snapshot = { deadline: str(task.deadline), status: str(task.status), priority: str(task.priority) }
  if (focus === 'OVERDUE') return isTaskOverdue(snapshot)
  if (focus === 'SOON') return isTaskDueSoon(snapshot)
  if (focus === 'REVIEW') return snapshot.status === 'REVIEW'
  return snapshot.priority === 'HIGH' || snapshot.priority === 'URGENT'
}

function activityHref(event: Record<string, unknown>) {
  const taskId = str(event.taskId)
  if (taskId) return `/app/tasks/${taskId}`
  const projectId = str(event.projectId)
  if (projectId) return `/app/projects/${projectId}`
  return null
}

function DueRail({ tasks }: { tasks: Record<string, unknown>[] }) {
  const dated = tasks
    .filter((task) => task.deadline && deadlineClockRunning(str(task.status)))
    .sort((a, b) => str(a.deadline).localeCompare(str(b.deadline)))
    .slice(0, 8)
  if (dated.length === 0) {
    return <p className="mt-3 text-sm text-muted">Nothing dated yet — enjoy the quiet rail.</p>
  }
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
      {dated.map((task) => (
        <Link
          key={str(task.id)}
          to={`/app/tasks/${str(task.id)}`}
          className="app-card-lift min-w-44 rounded-2xl border border-teal-900/8 bg-white/80 p-3 dark:border-teal-200/10 dark:bg-white/5"
        >
          <div className="font-mono text-[10px] tracking-[0.16em] text-teal-700/60 uppercase">
            {formatDay(str(task.deadline))}
          </div>
          <div className="mt-2 line-clamp-2 text-sm font-medium text-ink">{str(task.title)}</div>
          <div className="mt-2">
            <Badge tone={statusTone(str(task.status))}>{str(task.status)}</Badge>
          </div>
        </Link>
      ))}
    </div>
  )
}

function deliveryMix(metrics: Record<string, unknown>, items: Record<string, unknown>[]) {
  const fromMetrics = {
    todo: num(metrics.todo),
    inProgress: num(metrics.inProgress),
    review: num(metrics.review),
    blocked: num(metrics.blocked),
    done: num(metrics.done),
  }
  if (fromMetrics.todo + fromMetrics.inProgress + fromMetrics.review + fromMetrics.blocked + fromMetrics.done > 0) {
    return fromMetrics
  }
  const mix = { todo: 0, inProgress: 0, review: 0, blocked: 0, done: 0 }
  for (const item of items) {
    const done = num(item.doneTasks ?? item.done)
    const todo = num(item.todo)
    const inProgress = num(item.inProgress)
    const review = num(item.review)
    const blocked = num(item.blocked)
    const detailed = todo + inProgress + review + blocked + done
    mix.todo += detailed > done ? todo : Math.max(0, num(item.totalTasks) - done)
    mix.inProgress += inProgress
    mix.review += review
    mix.blocked += blocked
    mix.done += done
  }
  return mix
}

function FilterChips({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (next: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase app-ease',
            value === option.id ? 'bg-teal-800 text-white' : 'bg-white/70 text-teal-800 hover:bg-white dark:bg-white/5 dark:text-teal-200 dark:hover:bg-white/10',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
