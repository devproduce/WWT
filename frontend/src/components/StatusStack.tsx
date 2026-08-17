import { cn } from '@/lib/utils'

export const STATUS_SEGMENTS = [
  { key: 'todo', label: 'To do', color: '#94a3b8' },
  { key: 'inProgress', label: 'Doing', color: '#d97706' },
  { key: 'review', label: 'Review', color: '#7c3aed' },
  { key: 'blocked', label: 'Blocked', color: '#e11d48' },
  { key: 'done', label: 'Done', color: '#0f766e' },
] as const

export function StatusStack({
  counts,
  className,
}: {
  counts: { todo?: number; inProgress?: number; review?: number; blocked?: number; done?: number }
  className?: string
}) {
  const values = STATUS_SEGMENTS.map((segment) => ({
    ...segment,
    value: Number(counts[segment.key as keyof typeof counts] ?? 0),
  }))
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex h-3 overflow-hidden rounded-full bg-teal-900/8">
        {total === 0 ? (
          <div className="w-full bg-teal-900/8" />
        ) : (
          values
            .filter((item) => item.value > 0)
            .map((item) => (
              <div
                key={item.key}
                className="h-full app-ease first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
                title={`${item.label}: ${item.value}`}
              />
            ))
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {values.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs text-teal-900/70">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            <span>
              {item.label} <span className="font-semibold text-teal-950">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
