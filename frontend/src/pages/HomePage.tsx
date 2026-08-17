import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge, statusTone } from '@/components/ui/badge'
import { Stat } from '@/components/Stat'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/services/api'
import { utilization } from '@/lib/utils'
import type { Dashboard } from '@/types'
import { SuperAdminOrganizations } from '@/pages/OrganizationsPage'
import { MemberWork } from '@/pages/MemberWork'

export function HomePage() {
  const { user } = useAuth()
  const dash = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<Dashboard>('/dashboard')).data,
  })

  if (dash.isLoading) return <p>Loading dashboard…</p>
  if (!dash.data) return null
  if (dash.data.organizationDisabled) {
    return (
      <Card>
        <CardTitle>Organization disabled</CardTitle>
        <p className="mt-2 text-sm text-slate-600">
          {String(dash.data.metrics.organizationName ?? 'Your organization')} is disabled. Existing data is preserved.
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
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Platform overview</h1>
        <p className="text-sm text-slate-500">Aggregate customer usage only. Internal work is never shown here.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Organizations" value={m.totalOrganizations} />
        <Stat label="Active" value={m.activeOrganizations} />
        <Stat label="Disabled" value={m.disabledOrganizations} />
        <Stat label="Active members" value={m.aggregateMembers} />
      </div>
      <SuperAdminOrganizations embedded />
    </div>
  )
}

function AdminHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{String(m.organizationName)}</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Members" value={`${m.memberCount} / ${m.memberLimit}`} hint={`${utilization(Number(m.memberCount), Number(m.memberLimit))}%`} />
        <Stat label="Projects" value={`${m.projectCount} / ${m.projectLimit}`} hint={`${utilization(Number(m.projectCount), Number(m.projectLimit))}%`} />
        <Stat label="Overdue tasks" value={m.overdueTasks} />
        <Stat label="Due this week" value={m.upcomingDeadlines} />
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle>Projects</CardTitle>
          <Link className="text-sm text-teal-700" to="/app/projects">
            Manage
          </Link>
        </div>
        <div className="space-y-2">
          {data.items.map((item) => (
            <Link
              key={String(item.id)}
              to={`/app/projects/${item.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
            >
              <div>
                <div className="font-medium">{String(item.name)}</div>
                <div className="text-xs text-slate-500">
                  {String(item.doneTasks)}/{String(item.totalTasks)} done
                </div>
              </div>
              <Badge tone={statusTone(String(item.status))}>{String(item.status)}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

function MemberHome({ data }: { data: Dashboard }) {
  const m = data.metrics
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My work</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Assigned" value={m.assignedTasks} />
        <Stat label="Overdue" value={m.overdue} />
        <Stat label="Due soon" value={m.dueSoon} />
        <Stat label="Awaiting review" value={m.awaitingReview} />
      </div>
      {Number(m.managedProjects) > 0 && (
        <Card>
          <CardTitle>Project manager snapshot</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{String(m.pmProjectName)}</p>
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-sm">
            <Mini label="To do" value={m.pmTodo} />
            <Mini label="Doing" value={m.pmInProgress} />
            <Mini label="Review" value={m.pmReview} />
            <Mini label="Blocked" value={m.pmBlocked} />
            <Mini label="Done" value={m.pmDone} />
          </div>
          <Link className="mt-3 inline-block text-sm text-teal-700" to={`/app/projects/${String(m.pmProjectId)}`}>
            Open Kanban board
          </Link>
        </Card>
      )}
      <MemberWork />
    </div>
  )
}

function Mini({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-lg font-semibold">{String(value ?? 0)}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
