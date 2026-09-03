import { useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Paperclip,
  Users,
} from 'lucide-react'
import { Badge, statusTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/MetricCard'
import { QuotaMeter } from '@/components/QuotaMeter'
import { StatusStack } from '@/components/StatusStack'
import { Avatar, RingChart } from '@/components/charts'
import { cn } from '@/lib/utils'

export type PreviewView = 'dashboard' | 'board' | 'task' | 'team'

const TASKS = [
  { title: 'Write launch copy', status: 'TODO', priority: 'HIGH', assignee: 'Priya Shah', due: '18 Aug' },
  { title: 'Set up analytics', status: 'TODO', priority: 'MEDIUM', assignee: 'Dev Patel', due: '21 Aug' },
  { title: 'Pricing page', status: 'IN_PROGRESS', priority: 'URGENT', assignee: 'Arun Mehta', due: '17 Aug' },
  { title: 'Tax path check', status: 'IN_PROGRESS', priority: 'HIGH', assignee: 'Maya Rao', due: '18 Aug' },
  { title: 'QA checkout', status: 'REVIEW', priority: 'MEDIUM', assignee: 'Dev Patel', due: '19 Aug' },
  { title: 'Vendor contract', status: 'BLOCKED', priority: 'HIGH', assignee: 'Maya Rao', due: '16 Aug' },
  { title: 'Brand tokens', status: 'DONE', priority: 'LOW', assignee: 'Priya Shah', due: '12 Aug' },
  { title: 'Kickoff notes', status: 'DONE', priority: 'LOW', assignee: 'Arun Mehta', due: '10 Aug' },
]

const COLUMNS = [
  { id: 'TODO', label: 'To do', tone: 'bg-stone-100 border-stone-200', dot: 'bg-stone-400' },
  { id: 'IN_PROGRESS', label: 'Doing', tone: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  { id: 'REVIEW', label: 'Under review', tone: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  { id: 'BLOCKED', label: 'Blocked', tone: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  { id: 'DONE', label: 'Done', tone: 'bg-teal-50 border-teal-200', dot: 'bg-teal-600' },
]

const MEMBERS = [
  { name: 'Priya Shah', email: 'priya@northwind.example', role: 'ADMIN', status: 'ACTIVE' },
  { name: 'Arun Mehta', email: 'arun@northwind.example', role: 'MEMBER', status: 'ACTIVE' },
  { name: 'Dev Patel', email: 'dev@northwind.example', role: 'MEMBER', status: 'ACTIVE' },
  { name: 'Maya Rao', email: 'maya@northwind.example', role: 'MEMBER', status: 'ACTIVE' },
  { name: 'Leah Kim', email: 'leah@northwind.example', role: 'MEMBER', status: 'ACTIVE' },
  { name: 'Omar Ali', email: 'omar@northwind.example', role: 'MEMBER', status: 'PENDING_SETUP' },
]

const STEPS = ['To do', 'Doing', 'Under review', 'Blocked', 'Done']

function priorityEdge(priority: string) {
  if (priority === 'URGENT') return 'bg-rose-500'
  if (priority === 'HIGH') return 'bg-amber-500'
  if (priority === 'MEDIUM') return 'bg-teal-500'
  return 'bg-stone-300'
}

function DashboardView() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase">Organization</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Northwind Labs</h3>
          <p className="font-serif italic text-muted">Delivery health, quotas, and the work that needs a decision.</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {['All', 'Active', 'On hold'].map((chip, i) => (
            <span
              key={chip}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-[10px] tracking-wide uppercase',
                i === 0
                  ? 'bg-teal-800 text-white shadow-[0_8px_18px_rgb(15_118_110_/_0.28)]'
                  : 'landing-inset text-teal-800',
              )}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Members"
          value="42 / 100"
          hint="42% of plan"
          icon={<Users className="h-4 w-4" />}
          tone="teal"
          ring={{ value: 42, max: 100 }}
        />
        <MetricCard
          label="Projects"
          value="11 / 20"
          hint="8 active · 3 done"
          icon={<FolderKanban className="h-4 w-4" />}
          tone="sky"
          ring={{ value: 11, max: 20 }}
        />
        <MetricCard label="Overdue" value="3" hint="Needs attention now" icon={<AlertTriangle className="h-4 w-4" />} tone="coral" />
        <MetricCard
          label="Due this week"
          value="8"
          hint="Next seven days"
          icon={<CalendarClock className="h-4 w-4" />}
          tone="amber"
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <CardTitle>Delivery mix</CardTitle>
          <p className="mt-1 text-sm text-muted">How work is flowing across the organization.</p>
          <div className="mt-4">
            <StatusStack counts={{ todo: 6, inProgress: 4, review: 5, blocked: 2, done: 18 }} />
          </div>
        </Card>
        <Card className="p-5">
          <CardTitle>Deadline strip</CardTitle>
          <div className="mt-3 space-y-2">
            {[
              ['Vendor contract', '16 Aug', 'overdue'],
              ['Pricing page', '17 Aug', 'upcoming'],
              ['Write launch copy', '18 Aug', 'upcoming'],
              ['QA checkout', '19 Aug', 'upcoming'],
            ].map(([title, due, kind]) => (
              <div key={title} className="landing-inset flex items-center justify-between rounded-2xl px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{title}</div>
                  <div className="text-xs text-muted">{due}</div>
                </div>
                <Badge tone={kind === 'overdue' ? 'red' : 'amber'}>{kind}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { name: 'Atlas release', done: 18, total: 24, status: 'ACTIVE' },
          { name: 'Client rebrand', done: 9, total: 12, status: 'ACTIVE' },
          { name: 'Vendor onboarding', done: 4, total: 10, status: 'ON_HOLD' },
        ].map((project) => (
          <Card key={project.name} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-ink">{project.name}</div>
                <div className="text-xs text-muted">
                  {project.done}/{project.total} complete
                </div>
              </div>
              <Badge tone={statusTone(project.status)}>{project.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <RingChart value={project.done} max={project.total} size={56} stroke={6} />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-teal-900/8">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${Math.round((project.done / project.total) * 100)}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function BoardView() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase">Project</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Atlas release</h3>
          <p className="font-serif italic text-muted">To do → Doing → Review → Blocked → Done.</p>
        </div>
        <Button type="button" className="pointer-events-none">
          New task
        </Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <Card className="flex items-center gap-4 p-4">
          <RingChart
            value={18}
            max={24}
            size={88}
            stroke={9}
            label={
              <div className="text-center">
                <div className="text-lg font-semibold">75%</div>
                <div className="text-[9px] tracking-wide text-teal-800/50 uppercase">Done</div>
              </div>
            }
          />
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-teal-700/70 uppercase">Completion</div>
            <p className="mt-1 font-serif italic text-ink">18 of 24 tasks closed</p>
          </div>
        </Card>
        <Card className="p-4">
          <CardTitle>Board mix</CardTitle>
          <div className="mt-3">
            <StatusStack counts={{ todo: 2, inProgress: 2, review: 1, blocked: 1, done: 2 }} />
          </div>
        </Card>
        <Card className="space-y-3 p-4">
          <CardTitle>By member</CardTitle>
          <QuotaMeter label="Priya Shah" used={6} max={8} />
          <QuotaMeter label="Arun Mehta" used={5} max={8} />
          <QuotaMeter label="Dev Patel" used={4} max={8} />
        </Card>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = TASKS.filter((task) => task.status === col.id)
          return (
            <div
              key={col.id}
              className={cn(
                'min-h-56 rounded-[22px] border p-2.5 shadow-[0_12px_28px_rgb(15_61_56_/_0.08),0_1px_0_rgb(255_255_255_/_0.8)_inset]',
                col.tone,
              )}
            >
              <div className="mb-2 flex items-center justify-between px-1 text-[12px] font-medium text-ink">
                <span className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                  {col.label}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 font-mono text-[10px] dark:bg-white/10">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <div key={task.title} className="app-card relative overflow-hidden rounded-2xl p-3">
                    <span className={cn('absolute inset-y-0 left-0 w-1', priorityEdge(task.priority))} />
                    <div className="pl-2 text-[12px] font-medium leading-snug text-ink">{task.title}</div>
                    <div className="mt-2 flex items-center justify-between gap-1 pl-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Avatar name={task.assignee} size="sm" />
                        <span className="truncate text-[10px] text-muted">{task.assignee.split(' ')[0]}</span>
                      </div>
                      <span className="rounded-full bg-teal-50 px-1.5 py-0.5 font-mono text-[9px] text-teal-800/70">{task.due}</span>
                    </div>
                    <div className="mt-1.5 pl-2">
                      <Badge tone={statusTone(task.priority)}>{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskView() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase">Task</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">QA checkout</h3>
          <p className="font-serif italic text-muted">Verify tax, shipping, and guest checkout before launch.</p>
        </div>
        <Button type="button" variant="secondary" className="pointer-events-none">
          Back to board
        </Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>Status</CardTitle>
              <Badge tone="blue">REVIEW</Badge>
            </div>
            <div className="flex items-center gap-1">
              {STEPS.map((step, index) => (
                <div key={step} className={cn('h-2.5 flex-1 rounded-full', index <= 2 ? 'bg-teal-600' : 'bg-teal-900/10')} />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wide text-teal-800/50 uppercase">
              {STEPS.map((step) => (
                <span key={step} className={cn(step === 'Under review' && 'text-teal-800')}>
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-teal-50 px-3 py-1">Assignee: Dev Patel</span>
              <span className="rounded-full bg-amber-50 px-3 py-1">Priority: MEDIUM</span>
              <span className="rounded-full bg-sky-50 px-3 py-1">Due: 19 Aug</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" className="pointer-events-none">
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button type="button" variant="secondary" className="pointer-events-none">
                Return
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle>Comments</CardTitle>
            <div className="mt-4 space-y-3">
              {[
                ['Dev Patel', 'Today · 11:20', 'Checkout is ready for review. Two edge cases noted on guest tax.'],
                ['Priya Shah', 'Today · 11:42', 'Please confirm the shipping estimate still matches the new rates.'],
                ['Arun Mehta', 'Just now', 'Looks good — approving after the tax path check.'],
              ].map(([name, when, text]) => (
                <div key={name} className="landing-inset rounded-2xl p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-ink">
                    <Avatar name={name} size="sm" />
                    {name} <span className="font-normal text-teal-900/40">{when}</span>
                  </div>
                  <div className="mt-2 text-teal-900/80">{text}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-3">
          <Card className="p-5">
            <CardTitle>Attachments</CardTitle>
            <div className="mt-3 space-y-2 text-sm">
              {[
                ['qa-notes.pdf', '240 KB'],
                ['checkout-flow.png', '1.1 MB'],
                ['tax-matrix.xlsx', '86 KB'],
              ].map(([file, size]) => (
                <div key={file} className="landing-inset flex items-center justify-between rounded-2xl px-3 py-2 text-teal-800">
                  <span className="flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5" />
                    {file}
                  </span>
                  <span className="font-mono text-[10px] text-teal-800/50">{size}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle>Activity</CardTitle>
            <div className="mt-3 space-y-3">
              {[
                ['Dev Patel', 'Submitted for review', 'Today · 11:20'],
                ['Priya Shah', 'Commented on tax path', 'Today · 11:42'],
                ['Arun Mehta', 'Opened for review', 'Just now'],
              ].map(([name, message, when]) => (
                <div key={message} className="flex gap-2">
                  <Avatar name={name} size="sm" />
                  <div>
                    <div className="text-sm text-ink">{message}</div>
                    <div className="text-[11px] text-teal-900/45">{when}</div>
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

function TeamView() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase">People</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Members</h3>
          <p className="font-serif italic text-muted">Who can log in, take work, and run delivery.</p>
        </div>
        <Button type="button" className="pointer-events-none">
          Add member
        </Button>
      </div>
      <Card className="border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-900">
        Invite link ready for Omar Ali — send the setup-password URL before the seat expires.
      </Card>
      <div className="flex flex-wrap gap-2">
        {['All · 6', 'Admins · 1', 'Members · 5', 'Pending · 1'].map((chip, i) => (
          <span
            key={chip}
            className={cn(
              'rounded-full px-3 py-1 font-mono text-[10px] tracking-wide uppercase',
              i === 0
                  ? 'bg-teal-800 text-white shadow-[0_8px_18px_rgb(15_118_110_/_0.28)]'
                  : 'landing-inset text-teal-800',
            )}
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MEMBERS.map((member) => (
          <Card key={member.email} className="flex flex-col p-4">
            <div className="flex items-start gap-3">
              <Avatar name={member.name} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">{member.name}</div>
                <div className="truncate text-xs text-muted">{member.email}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone={member.role === 'ADMIN' ? 'teal' : 'slate'}>{member.role}</Badge>
                  <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                  {member.name === 'Arun Mehta' && <Badge tone="purple">PM</Badge>}
                </div>
              </div>
            </div>
            {member.role !== 'ADMIN' && (
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="ghost" className="pointer-events-none px-3 py-1.5 text-xs">
                  Reset password
                </Button>
                {member.status === 'ACTIVE' && (
                  <Button type="button" variant="secondary" className="pointer-events-none px-3 py-1.5 text-xs">
                    Disable
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ProductTour() {
  const [view, setView] = useState<PreviewView>('dashboard')
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board' as const, label: 'Board', icon: FolderKanban },
    { id: 'task' as const, label: 'Task', icon: ClipboardList },
    { id: 'team' as const, label: 'Team', icon: Users },
  ]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = view === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                'app-nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm',
                active
                  ? 'bg-teal-300 text-teal-950 shadow-[0_12px_28px_rgb(45_212_191_/_0.32)]'
                  : 'landing-inset text-teal-800 hover:bg-white dark:hover:bg-white/10',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="landing-stage pointer-events-none relative overflow-hidden rounded-[28px] p-4 sm:p-6">
        <div className="app-orb pointer-events-none absolute -top-16 right-10 h-40 w-40 rounded-full bg-teal-300/25 blur-3xl" />
        <div className="app-orb pointer-events-none absolute bottom-0 left-8 h-36 w-36 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative">
          {view === 'dashboard' && <DashboardView />}
          {view === 'board' && <BoardView />}
          {view === 'task' && <TaskView />}
          {view === 'team' && <TeamView />}
        </div>
      </div>
    </div>
  )
}
