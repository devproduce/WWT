import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-800',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-50 text-amber-800',
  red: 'bg-red-50 text-red-700',
  green: 'bg-emerald-50 text-emerald-800',
  blue: 'bg-sky-50 text-sky-800',
  purple: 'bg-violet-50 text-violet-800',
}

export function Badge({ children, tone = 'slate' }: { children: string; tone?: keyof typeof styles }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', styles[tone] ?? styles.slate)}>
      {children}
    </span>
  )
}

export function statusTone(status: string) {
  if (status === 'DONE' || status === 'ACTIVE' || status === 'COMPLETED') return 'green' as const
  if (status === 'REVIEW' || status === 'PLANNED') return 'blue' as const
  if (status === 'BLOCKED' || status === 'DISABLED' || status === 'URGENT') return 'red' as const
  if (status === 'IN_PROGRESS' || status === 'HIGH' || status === 'ON_HOLD') return 'amber' as const
  return 'slate' as const
}
