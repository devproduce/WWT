import { bytes, cn, utilization } from '@/lib/utils'

export function QuotaMeter({
  label,
  used,
  max,
  format = 'count',
}: {
  label: string
  used: number
  max: number
  format?: 'count' | 'bytes'
}) {
  const pct = utilization(used, max)
  const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-teal-600'
  const display = format === 'bytes' ? `${bytes(used)} / ${bytes(max)}` : `${used} / ${max}`
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-teal-800/55 uppercase dark:text-teal-200/50">
        <span>{label}</span>
        <span>
          {display} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-teal-900/8 dark:bg-teal-200/10">
        <div className={cn('h-full rounded-full app-ease', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
