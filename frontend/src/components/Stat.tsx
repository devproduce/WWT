import { QuotaMeter } from '@/components/QuotaMeter'

export function Stat({ label, value, hint }: { label: string; value: unknown; hint?: string }) {
  return (
    <div className="app-card rounded-[28px] p-5">
      <div className="font-mono text-[10px] tracking-[0.22em] text-teal-800/60 uppercase">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-teal-950">{String(value ?? 0)}</div>
      {hint && <div className="mt-0.5 text-xs text-teal-900/50">{hint}</div>}
    </div>
  )
}

export function UsageBar({ used, max, suffix }: { used: number; max: number; suffix?: string }) {
  return <QuotaMeter label={suffix ?? 'Usage'} used={used} max={max} />
}

export function StorageBar({ used, max }: { used: number; max: number }) {
  return <QuotaMeter label="Storage" used={used} max={max} format="bytes" />
}
