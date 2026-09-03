import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  teal: 'bg-teal-100/90 text-teal-900 dark:bg-teal-500/15 dark:text-teal-200',
  slate: 'bg-stone-100 text-stone-700 dark:bg-stone-500/15 dark:text-stone-200',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  red: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
  green: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200',
  blue: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
  purple: 'bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-200',
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: keyof typeof styles }) {
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
  if (status === 'REVIEW' || status === 'PLANNED' || status === 'PINNED' || status === 'DUE_TODAY' || status === 'DUE_SOON') return 'blue' as const
  if (status === 'BLOCKED' || status === 'DISABLED' || status === 'URGENT' || status === 'OVERDUE' || status === 'RETURNED') return 'red' as const
  if (status === 'IN_PROGRESS' || status === 'HIGH' || status === 'ON_HOLD') return 'amber' as const
  if (status === 'TODO' || status === 'PENDING_SETUP' || status === 'LOW') return 'slate' as const
  if (status === 'MEDIUM') return 'teal' as const
  return 'slate' as const
}
