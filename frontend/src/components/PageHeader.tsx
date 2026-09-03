import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="font-mono text-[11px] tracking-[0.32em] text-teal-700/80 uppercase dark:text-teal-300/80">{eyebrow}</div>
        )}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-xl font-serif text-lg italic text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
