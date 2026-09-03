import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid place-items-center rounded-[28px] border border-dashed border-teal-900/12 bg-white/40 px-6 py-14 text-center dark:border-teal-200/15 dark:bg-teal-700/40">
      <div className="mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-teal-200 to-emerald-100 shadow-inner dark:from-teal-700 dark:to-emerald-900" />
      <div className="text-lg font-semibold text-ink">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
