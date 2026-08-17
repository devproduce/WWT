import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export const TONE = {
  teal: { fill: '#0f766e', track: '#d5ebe6', bg: 'bg-teal-50/90', text: 'text-teal-900', icon: 'bg-teal-700 text-white' },
  coral: { fill: '#e11d48', track: '#fde4ea', bg: 'bg-rose-50/90', text: 'text-rose-900', icon: 'bg-rose-500 text-white' },
  amber: { fill: '#d97706', track: '#fdecc8', bg: 'bg-amber-50/90', text: 'text-amber-950', icon: 'bg-amber-500 text-white' },
  violet: { fill: '#7c3aed', track: '#ece4ff', bg: 'bg-violet-50/90', text: 'text-violet-950', icon: 'bg-violet-600 text-white' },
  sky: { fill: '#0284c7', track: '#d7eefb', bg: 'bg-sky-50/90', text: 'text-sky-950', icon: 'bg-sky-600 text-white' },
  stone: { fill: '#57534e', track: '#e7e5e4', bg: 'bg-stone-50/90', text: 'text-stone-800', icon: 'bg-stone-600 text-white' },
} as const

export type Tone = keyof typeof TONE

export function RingChart({
  value,
  max = 100,
  size = 88,
  stroke = 9,
  tone = 'teal',
  label,
}: {
  value: number
  max?: number
  size?: number
  stroke?: number
  tone?: Tone
  label?: ReactNode
}) {
  const pct = max ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  const colors = TONE[tone]
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {label ?? <span className="text-sm font-semibold tracking-tight">{pct}%</span>}
      </div>
    </div>
  )
}

export function StatusDonut({
  segments,
  size = 148,
  stroke = 16,
}: {
  segments: { value: number; color: string }[]
  size?: number
  stroke?: number
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4eeea" strokeWidth={stroke} />
      {segments.map((segment, index) => {
        const len = (segment.value / total) * c
        const circle = (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={segment.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        )
        offset += len
        return circle
      })}
    </svg>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12 w-12 text-sm' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 font-semibold text-white shadow-[0_8px_18px_rgb(15_118_110_/_0.25)]',
        box,
      )}
    >
      {initials || '?'}
    </span>
  )
}
