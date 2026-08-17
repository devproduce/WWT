import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, apiError } from '@/services/api'
import { useAuth } from '@/features/auth/AuthContext'
import { WwtMark, WwtWordmark } from '@/components/WwtMark'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works?' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#contact', label: 'Contact' },
]

export function LandingPage() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const workspace = user ? '/app' : '/login'
  const workspaceLabel = user ? 'Open workspace' : 'Log in'

  return (
    <div className="landing-noise relative min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-teal-400/30">
      <header className="sticky top-0 z-50 px-3 pt-4 sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-black/45 px-3 py-2 shadow-[0_10px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-4">
          <a href="#top" className="landing-ease group flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 hover:opacity-90">
            <WwtMark className="landing-ease group-hover:shadow-[0_0_28px_rgba(45,212,191,0.45)]" />
            <span className="pr-1 text-[13px] font-semibold tracking-[0.24em]">WWT</span>
          </a>
          <nav className="hidden items-center gap-8 text-[13px] md:flex">
            {NAV.map((item) => (
              <a key={item.href} className="landing-nav-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-1 md:flex">
            <Link to={workspace} className="landing-ease rounded-full px-4 py-2 text-[13px] text-white/70 hover:bg-white/8 hover:text-white">
              {workspaceLabel}
            </Link>
            <a href="#contact" className="landing-btn rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black hover:bg-teal-300">
              Contact us
            </a>
          </div>
          <button type="button" className="rounded-full p-2 md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="mx-auto mt-2 max-w-6xl space-y-3 rounded-3xl border border-white/10 bg-black/80 px-5 py-4 text-sm text-white/70 backdrop-blur-xl md:hidden">
            {NAV.map((item) => (
              <a key={item.href} className="block py-1 hover:text-white" href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link to={workspace} className="block py-1 text-white" onClick={() => setMenuOpen(false)}>
              {workspaceLabel}
            </Link>
          </div>
        )}
      </header>

      <main id="top">
        <Hero workspace={workspace} workspaceLabel={workspaceLabel} />
        <Scenarios />
        <Features />
        <HowItWorks />
        <Why />
        <Privacy />
        <Contact />
      </main>

      <footer className="border-t border-white/10 px-5 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <WwtWordmark />
              <p className="mt-3 max-w-sm text-sm text-white/45">
                WWT is the privacy-first workspace for organizations that need roles, reviews, and a tenant of their own.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-white/50">
              <a href="#features" className="landing-ease hover:text-white">Features</a>
              <a href="#how" className="landing-ease hover:text-white">How it works?</a>
              <a href="#contact" className="landing-ease hover:text-white">Contact us</a>
              <Link to="/login" className="landing-ease hover:text-white">Log in</Link>
            </div>
          </div>
          <div className="font-display text-[22vw] leading-[0.75] font-semibold tracking-[-0.06em] text-white/[0.07] select-none sm:text-[14vw]">
            WWT
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] tracking-wide text-white/30 uppercase">
            <span>© {new Date().getFullYear()} WWT · WeWorkTogether</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Eyebrow({ children }: { children: string }) {
  return <p className="font-mono text-[11px] tracking-[0.32em] text-teal-300/80 uppercase">{children}</p>
}

function Hero({ workspace, workspaceLabel }: { workspace: string; workspaceLabel: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="landing-grid pointer-events-none absolute inset-0" />
      <div className="landing-orb pointer-events-none absolute top-[-8rem] left-1/4 h-[28rem] w-[28rem] rounded-full bg-teal-500/18 blur-[90px]" />
      <div className="landing-orb pointer-events-none absolute right-[-6rem] bottom-0 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-[90px] [animation-delay:-5s]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24 lg:pb-28">
        <div className="landing-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] tracking-widest text-teal-200 uppercase">
            <span className="landing-pulse h-1.5 w-1.5 rounded-full bg-teal-400" />
            WWT live
          </span>
          <h1 className="mt-7 text-[3.2rem] leading-[0.9] font-semibold tracking-tight sm:text-7xl lg:text-[5.5rem]">
            Never chase
            <br />
            <span className="font-serif font-normal italic text-teal-200">work</span> again.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
            WWT gives every person a role, every project a board, and every organization a private tenant — no overlap, no
            guessing, no noise.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="landing-btn inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black hover:bg-teal-300"
            >
              Want your organisation also?
              <ArrowUpRight className="landing-arrow h-4 w-4" />
            </a>
            <Link
              to={workspace}
              className="landing-ease inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm text-white/80 hover:border-white/40 hover:bg-white/5 hover:text-white"
            >
              {workspaceLabel}
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
              <div key={col.c} className="landing-ease rounded-2xl bg-white/4 p-2.5 ring-1 ring-white/6 hover:bg-white/8 hover:ring-teal-300/30">
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

const SCENARIOS = [
  {
    id: 'squads',
    label: 'Product squads',
    kind: 'Squad',
    place: 'Bengaluru, India',
    task: 'Atlas release',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'agencies',
    label: 'Agencies',
    kind: 'Studio',
    place: 'Mumbai, India',
    task: 'Client rebrand',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'ops',
    label: 'Operations',
    kind: 'Ops',
    place: 'Hyderabad, India',
    task: 'Vendor onboarding',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1800&q=80',
  },
  {
    id: 'orgs',
    label: 'Multi-department',
    kind: 'Org',
    place: 'Pune, India',
    task: 'Quarterly rollout',
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=80',
  },
]

function Scenarios() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [clock, setClock] = useState('14:02')
  const active = SCENARIOS[index]

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SCENARIOS.length), 4500)
    return () => clearInterval(id)
  }, [paused])

  return (
    <section className="px-5 py-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Scenarios</Eyebrow>
        <div className="mt-6 grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
              ANYWHERE TEAMS
              <br />
              ARE ALIGNED.
            </h2>
            <ul className="mt-10 space-y-1">
              {SCENARIOS.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => setIndex(i)}
                    className={cn(
                      'landing-ease group flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left text-xl sm:text-2xl',
                      i === index ? 'text-white' : 'text-white/30 hover:text-white/70',
                    )}
                  >
                    <span
                      className={cn(
                        'landing-ease h-px w-8',
                        i === index ? 'w-12 bg-teal-400' : 'bg-white/20 group-hover:w-10 group-hover:bg-white/50',
                      )}
                    />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] sm:aspect-[16/11] lg:aspect-[5/4]">
            {SCENARIOS.map((item, i) => (
              <img
                key={item.id}
                src={item.image}
                alt={item.label}
                className={cn(
                  'landing-kenburns absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                  i === index ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/20" />
            <div className="absolute top-5 left-5 rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-white/80 backdrop-blur-md">
              WWT · LIVE
            </div>
            <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-sm tracking-[0.2em] text-white/70 uppercase">{active.kind}</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{active.task}</div>
                <div className="mt-2 text-sm text-white/70">{active.place}</div>
              </div>
              <div className="font-mono text-sm text-teal-200">{clock}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Product</Eyebrow>
        <h2 className="mt-4 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
          Built for privacy.
          <br />
          Designed for scale.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-white/50">
          WWT removed the clutter. No mixed tenants, no mystery permissions — work organized by role, reviewed in the open,
          and capped by the plan you bought.
        </p>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <article className="landing-card landing-shine rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Privacy focused</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              SuperAdmins manage the customer. They never inspect tasks, comments, or employee activity inside an organization.
            </p>
            <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/5 p-5 text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-red-300/70">CROSS-ORG ACCESS</div>
              <div className="landing-denied mt-3 text-3xl font-semibold tracking-tight text-red-300">DENIED</div>
            </div>
          </article>
          <article className="landing-card landing-shine rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Role-aware, always</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              SuperAdmin, Admin, Project Manager, Member. Each person only receives the authority the work requires.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2">
              {['SUPERADMIN', 'ADMIN', 'PM', 'MEMBER'].map((role, i) => (
                <div
                  key={role}
                  className={cn(
                    'landing-ease rounded-2xl px-3 py-4 font-mono text-[11px] tracking-widest hover:scale-[1.03]',
                    i === 2 ? 'bg-teal-400 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {role}
                </div>
              ))}
            </div>
          </article>
          <article className="landing-card landing-shine rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Quota-true plans</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Members, projects, and storage are enforced. Growth is visible before it becomes a surprise.
            </p>
            <div className="mt-8 space-y-4">
              {[
                ['Members', '72 / 100', 'w-[72%]'],
                ['Projects', '11 / 20', 'w-[55%]'],
                ['Storage', '41 GB', 'w-[41%]'],
              ].map(([k, v, w]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between font-mono text-[10px] text-white/40">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10">
                    <div className={cn('h-full rounded-full bg-teal-400', w)} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Kanban workflow', 'To do → Doing → Review → Blocked → Done. Invalid jumps are rejected.'],
            ['Reviews & comments', 'Work is signed off on the task, with conversation attached to the work.'],
            ['Files & activity', 'Attachments count against storage. Every important move leaves a trail.'],
            ['Live dashboards', 'Overdue, due soon, awaiting review — the numbers that keep delivery honest.'],
          ].map(([t, d]) => (
            <article key={t} className="landing-card landing-shine rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Workflow</Eyebrow>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">HOW IT WORKS.</h2>
        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="landing-card overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1016] p-6">
            <div className="flex flex-wrap justify-between gap-3 font-mono text-[11px] text-white/40">
              <span>WWT · SESSION 8X-291A</span>
              <span>124 TASKS · 18 PROJECTS</span>
            </div>
            <div className="mt-6 rounded-2xl border border-white/8 p-4">
              <div className="font-mono text-[10px] tracking-[0.25em] text-teal-300">ROLE ENGINE</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['SuperAdmin', 'Admin', 'Project Manager', 'Member'].map((role, i) => (
                  <span key={role} className="landing-ease inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm hover:bg-teal-400 hover:text-black">
                    <span className="font-mono text-[10px] opacity-50">0{i + 1}</span>
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['AL', 'Priya Shah', 'Admin · 42 members'],
                ['AR', 'Arun Mehta', 'PM · Atlas board'],
                ['DV', 'Dev Patel', 'Member · 6 assigned'],
                ['MY', 'Maya Rao', 'Review · 3 waiting'],
              ].map(([ini, name, meta]) => (
                <div key={name} className="landing-ease flex items-center gap-3 rounded-2xl bg-white/4 p-3 hover:bg-white/8">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-400/15 font-mono text-xs text-teal-200">{ini}</div>
                  <div>
                    <div className="text-sm">{name}</div>
                    <div className="text-xs text-white/40">{meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ol className="space-y-2">
            {[
              ['01', 'Contact us', 'Tell us the organization, team size, and how you work. There is no public signup.'],
              ['02', 'We create the tenant', 'A SuperAdmin stands up the org, plan, quotas, and your Admin account.'],
              ['03', 'The team ships', 'Admins invite people, PMs run the board, members move work, reviews close the loop.'],
            ].map(([n, t, d]) => (
              <li key={n} className="landing-ease group grid grid-cols-[auto_1fr] gap-5 rounded-3xl p-4 hover:bg-white/5">
                <div className="landing-ease font-mono text-sm text-white/30 group-hover:text-teal-300">{n}</div>
                <div>
                  <h3 className="text-2xl font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{d}</p>
                </div>
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
    'No wondering who owns what',
    'No mixing another company’s work with yours',
    'Everyone receives only the work they should see',
    'Never skip review. Never lose the trail.',
    'If a task is yours, it is in front of you — privately, inside your tenant.',
  ]
  return (
    <section className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">Why WWT?</h2>
        <ol className="group/why mt-8">
          {items.map((item, i) => (
            <li
              key={item}
              className="landing-ease group/item grid cursor-default grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-white/8 py-7 sm:grid-cols-[6rem_1fr_auto] sm:py-9 group-hover/why:opacity-25 hover:!opacity-100"
            >
              <span className="landing-ease font-mono text-sm text-white/25 group-hover/item:text-teal-300">0{i + 1}</span>
              <span className="text-xl leading-tight font-medium tracking-tight sm:text-4xl">{item}</span>
              <ArrowUpRight className="landing-ease h-6 w-6 text-teal-300 opacity-0 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100" />
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
    <section id="privacy" className="overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Eyebrow>Privacy first</Eyebrow>
        <h2 className="mt-4 text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
          BUILT FOR PRIVACY,
          <br />
          NOT SURVEILLANCE.
        </h2>
        <p className="mt-6 font-mono text-sm text-white/40">
          // WWT SuperAdmins never see your tasks.
          <br />
          // Organization data is isolated and kept that way.
        </p>
      </div>
      <div className="mt-12 space-y-0">
        {rows.map(([text, cls]) => (
          <div key={text} className="landing-marquee-row landing-ease overflow-hidden border-y border-white/5 py-4 hover:bg-white/[0.03]">
            <div className={cls}>
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className="mx-8 text-lg text-white/30 sm:text-3xl">
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

  const field =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none ring-teal-400/20 placeholder:text-white/25 transition focus:border-teal-300/40 focus:ring-4'

  return (
    <section id="contact" className="px-5 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <Eyebrow>Now available</Eyebrow>
          <h2 className="mt-4 text-4xl leading-[0.92] font-semibold tracking-tight sm:text-6xl">
            WANT WWT
            <br />
            FOR YOUR
            <br />
            <span className="font-serif font-normal italic text-teal-200">organisation?</span>
          </h2>
          <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-white/45">
            {'>'} Contact us. We create the tenant.
            <br />
            {'>'} Your Admin gets the keys. Your work stays yours.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {['Dedicated WWT organization', 'Plan and quotas configured for you', 'Internal work invisible to the platform owner'].map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 text-teal-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="landing-card rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          {sent ? (
            <div className="py-16 text-center">
              <div className="font-mono text-xs tracking-widest text-teal-300">WWT · INQUIRY_RECEIVED</div>
              <h3 className="mt-4 text-3xl font-semibold">We’ll take it from here.</h3>
              <p className="mt-3 text-sm text-white/50">
                A platform owner will follow up about bringing {organizationName || 'your organization'} onto WWT.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="font-mono text-[11px] tracking-[0.28em] text-white/35 uppercase">Contact us</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-white/45">
                  Your name
                  <input className={`mt-1 ${field}`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
                </label>
                <label className="block text-xs text-white/45">
                  Work email
                  <input className={`mt-1 ${field}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-white/45">
                  Organization
                  <input className={`mt-1 ${field}`} value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required maxLength={120} />
                </label>
                <label className="block text-xs text-white/45">
                  Team size
                  <select className={`mt-1 ${field}`} value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                    <option className="bg-[#111]">1-10</option>
                    <option className="bg-[#111]">11-50</option>
                    <option className="bg-[#111]">51-200</option>
                    <option className="bg-[#111]">201-500</option>
                    <option className="bg-[#111]">500+</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs text-white/45">
                How can we help?
                <textarea
                  className={`mt-1 min-h-28 ${field}`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="What does the team need to ship?"
                />
              </label>
              <button type="submit" disabled={pending} className="landing-btn inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-medium text-black hover:bg-teal-300 disabled:opacity-50">
                {pending ? 'Sending…' : 'Contact us'}
                <ArrowUpRight className="landing-arrow h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
