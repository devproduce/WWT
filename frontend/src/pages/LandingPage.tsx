import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Menu, MessageSquare, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, apiError } from '@/services/api'
import { useAuth } from '@/features/auth/AuthContext'
import { WwtMark, WwtWordmark } from '@/components/WwtMark'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MetricCard } from '@/components/MetricCard'
import { QuotaMeter } from '@/components/QuotaMeter'
import { RingChart, Avatar } from '@/components/charts'
import { ProductTour } from '@/components/landing/WorkspacePreview'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '#how', label: 'How it works?' },
  { href: '#features', label: 'Features' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#contact', label: 'Contact' },
]

export function LandingPage() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const workspace = user ? '/app' : '/login'
  const workspaceLabel = user ? 'Open workspace' : 'Log in'

  return (
    <div className="landing-page app-canvas relative min-h-screen overflow-x-hidden text-teal-950 selection:bg-teal-200/60">
      <div className="app-orb pointer-events-none absolute -top-24 left-10 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="app-orb pointer-events-none absolute top-1/4 -right-16 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" style={{ animationDelay: '4s' }} />
      <div className="app-orb pointer-events-none absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" style={{ animationDelay: '8s' }} />

      <header className="sticky top-0 z-50 px-3 pt-4 sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-teal-900/15 bg-white/90 px-3 py-2 shadow-[0_12px_40px_rgb(15_61_56_/_0.14),0_1px_0_rgb(255_255_255_/_0.9)_inset] backdrop-blur-xl sm:px-4">
          <a href="#top" className="landing-ease group flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 hover:opacity-90">
            <WwtMark />
            <span className="pr-1 text-[13px] font-semibold tracking-[0.24em] text-teal-950">WWT</span>
          </a>
          <nav className="hidden items-center gap-8 text-[13px] md:flex">
            {NAV.map((item) => (
              <a key={item.href} className="landing-nav-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link to={workspace}>
              <Button variant="secondary" type="button">
                {workspaceLabel}
              </Button>
            </Link>
            <a href="#contact">
              <Button type="button">Contact us</Button>
            </a>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-teal-800 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="app-card mx-auto mt-2 max-w-6xl space-y-3 rounded-[24px] px-5 py-4 text-sm text-teal-900/70 md:hidden">
            {NAV.map((item) => (
              <a key={item.href} className="block py-1 hover:text-teal-950" href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link to={workspace} className="block py-1 font-medium text-teal-950" onClick={() => setMenuOpen(false)}>
              {workspaceLabel}
            </Link>
            <a href="#contact" className="block py-1 font-medium text-teal-800" onClick={() => setMenuOpen(false)}>
              Contact us
            </a>
          </div>
        )}
      </header>

      <main id="top" className="relative z-10">
        <Hero workspace={workspace} workspaceLabel={workspaceLabel} />
        <Tour />
        <HowItWorks />
        <Features />
        <Why />
        <Privacy />
        <Contact />
      </main>

      <LandingFooter />
    </div>
  )
}

function LandingFooter() {
  const { user } = useAuth()
  const workspace = user ? '/app' : '/login'
  const workspaceLabel = user ? 'Open workspace' : 'Log in'
  const markRef = useRef<HTMLAnchorElement>(null)
  const [spot, setSpot] = useState({ x: 50, y: 40, on: false })

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const box = markRef.current?.getBoundingClientRect()
    if (!box) return
    setSpot({
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
      on: true,
    })
  }

  return (
    <footer className="relative z-10 px-3 pb-4 pt-8 sm:px-5">
      <div className="landing-stage relative mx-auto max-w-6xl overflow-hidden rounded-[32px] px-5 pt-8 pb-4 sm:px-8 sm:pt-10">
        <div className="app-orb pointer-events-none absolute -top-16 right-10 h-48 w-48 rounded-full bg-teal-300/25 blur-3xl" />
        <div className="app-orb pointer-events-none absolute bottom-0 left-8 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <WwtWordmark className="text-teal-950" />
            <p className="mt-3 text-sm leading-relaxed text-teal-900/55">
              WWT is the privacy-first workspace for organizations that need clear ownership, reviews, and a place of their own.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#contact">
                <Button type="button">
                  Contact us
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to={workspace}>
                <Button variant="secondary" type="button">
                  {workspaceLabel}
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12">
            <div>
              <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Product</div>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-teal-800/75">
                <a className="landing-nav-link w-fit" href="#how">
                  How it works
                </a>
                <a className="landing-nav-link w-fit" href="#features">
                  Features
                </a>
                <a className="landing-nav-link w-fit" href="#privacy">
                  Privacy
                </a>
              </div>
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Workspace</div>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-teal-800/75">
                <a className="landing-nav-link w-fit" href="#contact">
                  Contact us
                </a>
                <Link className="landing-nav-link w-fit" to={workspace}>
                  {workspaceLabel}
                </Link>
                <a className="landing-nav-link w-fit" href="#top">
                  Back to top
                </a>
              </div>
            </div>
          </div>
        </div>

        <a
          ref={markRef}
          href="#top"
          aria-label="Back to top"
          className="landing-footer-word group relative mt-10 block overflow-hidden"
          onMouseMove={onMove}
          onMouseEnter={() => setSpot((s) => ({ ...s, on: true }))}
          onMouseLeave={() => setSpot((s) => ({ ...s, on: false }))}
        >
          <span
            className="landing-footer-spot pointer-events-none absolute h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/45 blur-3xl"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              opacity: spot.on ? 1 : 0,
            }}
          />
          <span className="relative flex font-display text-[28vw] leading-[0.78] font-semibold tracking-[-0.07em] sm:text-[16vw] lg:text-[14vw]">
            {['W', 'W', 'T'].map((letter, index) => (
              <span key={`${letter}-${index}`} className="landing-footer-letter" style={{ transitionDelay: `${index * 40}ms` }}>
                {letter}
              </span>
            ))}
          </span>
          <span className="landing-footer-hint pointer-events-none absolute right-0 bottom-3 font-mono text-[10px] tracking-[0.28em] text-teal-800/0 uppercase group-hover:text-teal-800/50">
            Back to top
          </span>
        </a>

        <div className="relative mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-teal-900/10 pt-4 font-mono text-[11px] tracking-wide text-teal-800/45 uppercase">
          <span>© {new Date().getFullYear()} WWT · WeWorkTogether</span>
          <span className="landing-inset inline-flex items-center gap-2 rounded-full px-3 py-1">
            <span className="landing-pulse h-1.5 w-1.5 rounded-full bg-teal-500" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  )
}

function Eyebrow({ children }: { children: string }) {
  return <p className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase">{children}</p>
}

function Hero({ workspace, workspaceLabel }: { workspace: string; workspaceLabel: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-24">
        <div className="landing-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-900/12 bg-white/90 px-3 py-1 font-mono text-[11px] tracking-widest text-teal-800 uppercase shadow-[0_8px_20px_rgb(15_61_56_/_0.08)]">
            <span className="landing-pulse h-1.5 w-1.5 rounded-full bg-teal-500" />
            WWT live
          </span>
          <h1 className="mt-7 text-[3.2rem] leading-[0.9] font-semibold tracking-tight text-teal-950 sm:text-7xl lg:text-[5.25rem]">
            Never chase
            <br />
            <span className="font-serif font-normal italic text-teal-700">work</span> again.
          </h1>
          <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-teal-900/55">
            Your Admin runs the company. Your project manager runs the board. Your people see only the work they should —
            in a workspace that stays yours.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#contact">
              <Button type="button" className="px-6 py-3.5">
                Want your organisation also?
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </a>
            <Link to={workspace}>
              <Button variant="secondary" type="button" className="px-6 py-3.5">
                {workspaceLabel}
              </Button>
            </Link>
          </div>
        </div>
        <HeroStage />
      </div>
    </section>
  )
}

function HeroStage() {
  return (
    <div className="group relative mx-auto w-full max-w-md lg:max-w-none" style={{ perspective: '1400px' }}>
      <div className="landing-float landing-ease relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1016] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] group-hover:border-teal-300/30 group-hover:shadow-[0_40px_120px_-20px_rgba(45,212,191,0.18)]">
        <div className="landing-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-teal-300/20 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 font-mono text-[10px] tracking-widest text-white/40">
          <span>WWT · ORG_ID 7K-418</span>
          <span className="inline-flex items-center gap-2 text-teal-300">
            <span className="landing-pulse h-1.5 w-1.5 rounded-full bg-teal-400" />
            SYNCING
          </span>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-white/45">
              <span>Northwind Labs · Atlas release</span>
              <span>84%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="landing-progress h-full rounded-full bg-teal-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { c: 'To do', t: 'Write launch copy', p: 'HIGH' },
              { c: 'Doing', t: 'Pricing page', p: 'URGENT' },
              { c: 'Review', t: 'QA checkout', p: 'MED' },
              { c: 'Done', t: 'Brand tokens', p: 'LOW' },
            ].map((col) => (
              <div
                key={col.c}
                className="landing-ease rounded-2xl bg-white/4 p-2.5 ring-1 ring-white/6 hover:bg-white/8 hover:ring-teal-300/30"
              >
                <div className="font-mono text-[9px] tracking-widest text-white/35 uppercase">{col.c}</div>
                <div className="mt-2 rounded-xl bg-[#151b24] p-2">
                  <div className="text-[11px] leading-snug text-white/90">{col.t}</div>
                  <div className="mt-1.5 text-[9px] text-teal-300">{col.p}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Tour() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Workspace</Eyebrow>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl">See the product.</h2>
        <p className="mt-3 max-w-xl font-serif text-lg italic text-teal-900/55">
          Northwind’s dashboard, Atlas board, reviews, and members — the same workspace your organization will use.
        </p>
        <div className="mt-10">
          <ProductTour />
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>What your people get</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight text-teal-950 sm:text-5xl">
          The right work
          <br />
          in front of the right person.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-teal-900/55">
          On Atlas, Priya runs the company, Arun runs the board, and Dev and Maya ship assigned work — nothing more,
          nothing less.
        </p>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <Card interactive className="app-shine">
            <div className="font-mono text-[10px] tracking-[0.22em] text-teal-700/80 uppercase">Admin · Priya Shah</div>
            <CardTitle className="mt-2 text-xl">Runs the organization</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Priya invites the team, opens projects, and sees Northwind end to end. Members, projects, and storage stay
              visible before they become a surprise.
            </p>
            <div className="mt-6 landing-inset space-y-3 rounded-2xl p-4">
              <QuotaMeter label="Members" used={72} max={100} />
              <QuotaMeter label="Projects" used={11} max={20} />
              <QuotaMeter label="Storage" used={41 * 1024 * 1024 * 1024} max={100 * 1024 * 1024 * 1024} format="bytes" />
            </div>
          </Card>
          <Card interactive className="app-shine">
            <div className="font-mono text-[10px] tracking-[0.22em] text-teal-700/80 uppercase">Project Manager · Arun Mehta</div>
            <CardTitle className="mt-2 text-xl">Owns the Atlas board</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Arun assigns work and signs off review. Members move To do through Review. Done is a decision, not a
              guess.
            </p>
            <div className="mt-6 rounded-[22px] border border-amber-200 bg-amber-50 p-2 shadow-[0_10px_24px_rgb(15_61_56_/_0.08)]">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-teal-950">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Doing · Atlas
              </div>
              <div className="app-card relative overflow-hidden rounded-2xl p-2.5">
                <span className="absolute inset-y-0 left-0 w-1 bg-rose-500" />
                <div className="pl-2 text-[11px] font-medium text-teal-950">Pricing page</div>
                <div className="mt-2 pl-2">
                  <Badge tone="red">URGENT</Badge>
                </div>
              </div>
            </div>
          </Card>
          <Card interactive className="app-shine">
            <div className="font-mono text-[10px] tracking-[0.22em] text-teal-700/80 uppercase">Member · Dev Patel</div>
            <CardTitle className="mt-2 text-xl">Ships assigned work</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Dev sees his Atlas tasks, comments, and files — not the rest of Northwind. He can submit for review. He
              cannot mark Done.
            </p>
            <div className="mt-6 space-y-2">
              {[
                ['QA checkout', 'Review'],
                ['Set up analytics', 'To do'],
              ].map(([task, col]) => (
                <div key={task} className="landing-inset flex items-center justify-between rounded-2xl px-3 py-2.5">
                  <span className="text-xs font-medium text-teal-950">{task}</span>
                  <Badge>{col}</Badge>
                </div>
              ))}
              <div className="px-1 pt-1">
                <Badge tone="red">Done locked</Badge>
              </div>
            </div>
          </Card>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card interactive className="app-shine">
            <CardTitle>Kanban workflow</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Atlas moves To do → Doing → Review → Blocked → Done. Invalid jumps are rejected.
            </p>
            <div className="mt-4 rounded-[22px] border border-amber-200 bg-amber-50 p-2 shadow-[0_10px_24px_rgb(15_61_56_/_0.08)]">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-teal-950">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Doing
              </div>
              <div className="app-card relative overflow-hidden rounded-2xl p-2.5">
                <span className="absolute inset-y-0 left-0 w-1 bg-rose-500" />
                <div className="pl-2 text-[11px] font-medium text-teal-950">Pricing page</div>
                <div className="mt-2 pl-2">
                  <Badge tone="red">URGENT</Badge>
                </div>
              </div>
            </div>
          </Card>
          <Card interactive className="app-shine">
            <CardTitle>Reviews & comments</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Maya submits QA checkout. Arun signs it off on the task — the conversation stays with the work.
            </p>
            <div className="mt-4 landing-inset rounded-2xl p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-teal-950">
                <Avatar name="Arun Mehta" size="sm" />
                Arun Mehta
              </div>
              <p className="mt-1.5 text-xs text-teal-900/70">Looks good — approving after the tax path check.</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-teal-800">
                <MessageSquare className="h-3 w-3" />
                Review thread
              </div>
            </div>
          </Card>
          <Card interactive className="app-shine">
            <CardTitle>Files & activity</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Checkout screenshots live on the Atlas task. Attachments count against storage. Every move leaves a trail.
            </p>
            <div className="mt-4 space-y-2">
              {['qa-notes.pdf · 240 KB', 'checkout-flow.png · 1.1 MB'].map((file) => (
                <div key={file} className="landing-inset flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-teal-800">
                  <Paperclip className="h-3.5 w-3.5" />
                  {file}
                </div>
              ))}
            </div>
          </Card>
          <Card interactive className="app-shine">
            <CardTitle>Live dashboards</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/55">
              Priya sees overdue, due soon, and awaiting review — the numbers that keep Atlas honest.
            </p>
            <div className="mt-4">
              <MetricCard label="Overdue" value="3" hint="Needs attention now" tone="coral" />
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

const HOW_ROLES = [
  {
    id: 'admin' as const,
    label: 'Admin',
    person: 'Priya Shah',
    blurb: 'Runs Northwind. Invites people, opens projects, watches every board.',
    features: [
      'Invite, disable, and reset members',
      'Create projects and name a Project Manager',
      'See every board without doing the work',
      'See how much work is waiting on each Project Manager',
      'Watch members, projects, and storage against the plan',
    ],
    people: [
      { name: 'Priya Shah', meta: 'Admin · invites the team' },
    ],
  },
  {
    id: 'pm' as const,
    label: 'Project Manager',
    person: 'Arun Mehta',
    blurb: 'Owns the Atlas board. Assigns work and signs off Done.',
    features: [
      'See the Atlas board and member progress',
      'Assign work to members on the project',
      'Review submissions and send work back',
      'Mark Done — members cannot',
    ],
    people: [{ name: 'Arun Mehta', meta: 'PM · owns the Atlas board' }],
  },
  {
    id: 'member' as const,
    label: 'Member',
    person: 'Dev Patel',
    blurb: 'Ships assigned Atlas work. Submits for review. Cannot mark Done.',
    features: [
      'See only assigned tasks',
      'Move work To do → Doing → Review',
      'Comment and attach files on their tasks',
      'Submit for review — cannot mark Done',
    ],
    people: [
      { name: 'Dev Patel', meta: 'Member · 6 assigned' },
      { name: 'Maya Rao', meta: 'Member · submits for review' },
    ],
  },
]

const HOW_STEPS = [
  ['01', 'Contact us', 'Tell us the organization, team size, and how you work. There is no public signup.'],
  [
    '02',
    'We open your workspace',
    'We create Northwind’s organization, pick a plan, and send Priya — the Admin — her invite. She gets the keys.',
  ],
  [
    '03',
    'Admin builds the team',
    'Priya invites people, opens the Atlas project, and names Arun as Project Manager.',
  ],
  [
    '04',
    'The team ships',
    'Arun assigns work. Dev and Maya move their cards and submit for review. Arun signs off Done — it is never assumed.',
  ],
]

function HowItWorks() {
  const [roleId, setRoleId] = useState<(typeof HOW_ROLES)[number]['id']>('admin')
  const role = HOW_ROLES.find((item) => item.id === roleId) ?? HOW_ROLES[0]

  return (
    <section id="how" className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>From first call to first Done</Eyebrow>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl">How it works.</h2>
        <p className="mt-3 max-w-xl font-serif text-lg italic text-teal-900/55">
          Northwind Labs needed Atlas out the door. Here is the same path your organization follows.
        </p>
        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-2">
          <Card className="flex h-full flex-col">
            <div className="flex flex-wrap justify-between gap-3 font-mono text-[11px] text-teal-800/50">
              <span>Northwind Labs · Atlas</span>
              <span>124 TASKS · 18 PROJECTS</span>
            </div>
            <div className="mt-5 landing-inset rounded-2xl p-4">
              <div className="font-mono text-[10px] tracking-[0.25em] text-teal-700/80 uppercase">Who runs Atlas</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {HOW_ROLES.map((item, i) => {
                  const active = item.id === roleId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRoleId(item.id)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
                        active
                          ? 'bg-teal-300 text-teal-950 shadow-[0_10px_24px_rgb(45_212_191_/_0.28)]'
                          : 'landing-inset text-teal-900/70 hover:bg-white hover:text-teal-950',
                      )}
                    >
                      <span className="font-mono text-[10px] opacity-50">0{i + 1}</span>
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-5 flex-1 rounded-2xl landing-inset p-4">
              <div className="flex items-center gap-3">
                <Avatar name={role.person} />
                <div>
                  <div className="text-sm font-medium text-teal-950">{role.person}</div>
                  <div className="text-xs text-teal-900/45">{role.label}</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-teal-900/55">{role.blurb}</p>
              <ul className="mt-4 space-y-2">
                {role.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-teal-900/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {HOW_ROLES.flatMap((item) => item.people.map((person) => ({ ...person, roleId: item.id }))).map(
                (person) => {
                  const active = person.roleId === roleId
                  return (
                    <button
                      key={person.name}
                      type="button"
                      onClick={() => setRoleId(person.roleId)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl p-3 text-left transition',
                        active
                          ? 'bg-teal-300/70 text-teal-950 shadow-[0_10px_24px_rgb(45_212_191_/_0.18)]'
                          : 'landing-inset text-teal-900/70 hover:bg-white hover:text-teal-950',
                      )}
                    >
                      <Avatar name={person.name} />
                      <div>
                        <div className="text-sm font-medium text-teal-950">{person.name}</div>
                        <div className={cn('text-xs', active ? 'text-teal-900/60' : 'text-teal-900/45')}>
                          {person.meta}
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </Card>
          <ol className="flex h-full flex-col gap-3">
            {HOW_STEPS.map(([n, t, d]) => (
              <li key={n} className="flex min-h-0 flex-1">
                <Card className="grid h-full w-full grid-cols-[auto_1fr] items-center gap-5">
                  <div className="font-mono text-sm text-teal-700/60">{n}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-teal-950">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-teal-900/55">{d}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Why() {
  const items = [
    'Priya always knows who owns Atlas',
    'Northwind’s work never sits next to another company’s',
    'Dev sees his tasks — not the whole company',
    'Arun signs off review. The trail stays on the task.',
    'If a task is yours, it is in front of you — inside your organization.',
  ]
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl font-semibold tracking-tight text-teal-950 sm:text-5xl">Why WWT?</h2>
        <ol className="group/why landing-stage mt-8 overflow-hidden rounded-[28px] px-4 sm:px-6">
          {items.map((item, i) => (
            <li
              key={item}
              className="landing-ease group/item grid cursor-default grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-teal-900/10 py-7 last:border-b-0 sm:grid-cols-[6rem_1fr_auto] sm:py-9 group-hover/why:opacity-40 hover:!opacity-100"
            >
              <span className="landing-ease font-mono text-sm text-teal-800/30 group-hover/item:text-teal-700">0{i + 1}</span>
              <span className="text-xl leading-tight font-medium tracking-tight text-teal-950 sm:text-3xl">{item}</span>
              <ArrowUpRight className="landing-ease h-6 w-6 text-teal-700 opacity-0 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Privacy() {
  const rows = [
    ['Tenants never share data', 'landing-marquee'],
    ['Internal work stays private', 'landing-marquee landing-marquee-slow'],
    ['Roles limit what you can see', 'landing-marquee'],
    ['WWT keeps growth honest', 'landing-marquee landing-marquee-slow'],
  ]
  return (
    <section id="privacy" className="overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Eyebrow>Privacy first</Eyebrow>
        <h2 className="mt-4 text-4xl leading-[0.95] font-semibold tracking-tight text-teal-950 sm:text-5xl">
          Built for privacy,
          <br />
          not surveillance.
        </h2>
        <p className="mt-6 font-mono text-sm text-teal-800/50">
          // Your tasks stay inside your organization.
          <br />
          // Another company’s board cannot see yours.
        </p>
        <div className="mt-8 flex max-w-sm items-center gap-4 landing-inset rounded-2xl p-4">
          <RingChart value={0} max={1} size={72} stroke={8} tone="coral" />
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-rose-800/70 uppercase">Cross-org access</div>
            <div className="landing-denied mt-1 text-2xl font-semibold tracking-tight text-rose-700">DENIED</div>
            <Badge tone="red">Tasks hidden</Badge>
          </div>
        </div>
      </div>
      <div className="landing-stage mt-12 overflow-hidden">
        {rows.map(([text, cls]) => (
          <div key={text} className="landing-marquee-row landing-ease overflow-hidden border-y border-teal-900/8 py-4 first:border-t-0 last:border-b-0 hover:bg-white">
            <div className={cls}>
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className="mx-8 text-lg text-teal-900/30 sm:text-3xl">
                  {text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [teamSize, setTeamSize] = useState('11-50')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    try {
      await api.post('/public/contact', { name, email, organizationName, teamSize, message })
      setSent(true)
      toast.success('Thanks — we will get back to you shortly.')
    } catch (err) {
      toast.error(apiError(err, 'Could not send your message. Please try again.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section id="contact" className="px-5 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <Eyebrow>Now available</Eyebrow>
          <h2 className="mt-4 text-4xl leading-[0.92] font-semibold tracking-tight text-teal-950 sm:text-5xl">
            Want WWT
            <br />
            for your
            <br />
            <span className="font-serif font-normal italic text-teal-700">organisation?</span>
          </h2>
          <p className="mt-6 max-w-md font-serif text-lg italic leading-relaxed text-teal-900/55">
            Contact us. We open your workspace. Your Admin gets the keys. Your work stays yours.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-teal-900/70">
            {['Dedicated WWT organization', 'Plan and quotas configured for you', 'Internal work stays inside your organization'].map(
              (item) => (
                <li key={item} className="landing-inset flex gap-2 rounded-2xl px-3 py-2.5">
                  <Check className="mt-0.5 h-4 w-4 text-teal-700" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <Card className="p-6 sm:p-8">
          {sent ? (
            <div className="py-16 text-center">
              <div className="font-mono text-xs tracking-widest text-teal-700/70">WWT · INQUIRY RECEIVED</div>
              <h3 className="mt-4 text-3xl font-semibold text-teal-950">We’ll take it from here.</h3>
              <p className="mt-3 text-sm text-teal-900/55">
                A platform owner will follow up about bringing {organizationName || 'your organization'} onto WWT.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="font-mono text-[11px] tracking-[0.28em] text-teal-700/70 uppercase">Contact us</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
                </Field>
                <Field label="Work email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organization">
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required maxLength={120} />
                </Field>
                <Field label="Team size">
                  <select className="app-select" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>51-200</option>
                    <option>201-500</option>
                    <option>500+</option>
                  </select>
                </Field>
              </div>
              <Field label="How can we help?">
                <Textarea
                  className="min-h-28"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="What does the team need to ship?"
                />
              </Field>
              <Button type="submit" className="w-full py-3.5" disabled={pending}>
                {pending ? 'Sending…' : 'Contact us'}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </Card>
      </div>
    </section>
  )
}
