import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  teal: 'bg-teal-100/90 text-teal-900',
  slate: 'bg-stone-100 text-stone-700',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-rose-100 text-rose-800',
  green: 'bg-emerald-100 text-emerald-900',
  blue: 'bg-sky-100 text-sky-900',
  purple: 'bg-violet-100 text-violet-900',
}

export function Badge({ children, tone = 'slate' }: { children: string; tone?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase',
        styles[tone] ?? styles.slate,
      )}
    >
      {children}
    </span>
  )
}

export function statusTone(status: string) {
  if (status === 'DONE' || status === 'ACTIVE' || status === 'COMPLETED') return 'green' as const
  if (status === 'REVIEW' || status === 'PLANNED') return 'blue' as const
  if (status === 'BLOCKED' || status === 'DISABLED' || status === 'URGENT') return 'red' as const
  if (status === 'IN_PROGRESS' || status === 'HIGH' || status === 'ON_HOLD') return 'amber' as const
  if (status === 'TODO' || status === 'PENDING_SETUP' || status === 'LOW') return 'slate' as const
  if (status === 'MEDIUM') return 'teal' as const
  return 'slate' as const
}
