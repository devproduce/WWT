import { bytes, utilization } from '@/lib/utils'

export function Stat({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{String(value ?? 0)}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </div>
  )
}

export function UsageBar({ used, max, suffix }: { used: number; max: number; suffix?: string }) {
  const pct = utilization(used, max)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>
          {used} / {max} {suffix}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-teal-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function StorageBar({ used, max }: { used: number; max: number }) {
  const pct = utilization(used, max)
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>
          {bytes(used)} / {bytes(max)}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-teal-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
