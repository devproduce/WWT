import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { RingChart, TONE, type Tone } from '@/components/charts'

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'teal',
  ring,
  active,
  onClick,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: Tone
  ring?: { value: number; max: number }
  active?: boolean
  onClick?: () => void
}) {
  const colors = TONE[tone]
  const interactive = Boolean(onClick)
  const className = cn(
    'app-card app-shine flex w-full items-center gap-4 rounded-[28px] p-5 text-left',
    interactive && 'app-card-lift cursor-pointer',
    active && 'ring-2 ring-teal-600/40',
    colors.bg,
  )
  const body = (
    <>
      {icon && <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', colors.icon)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] tracking-[0.22em] text-teal-800/60 uppercase">{label}</div>
        <div className={cn('mt-1 text-2xl font-semibold tracking-tight', colors.text)}>{value}</div>
        {hint && <div className="mt-0.5 text-xs text-teal-900/50">{hint}</div>}
      </div>
      {ring && <RingChart value={ring.value} max={ring.max} size={64} stroke={7} tone={tone} />}
    </>
  )
  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}
