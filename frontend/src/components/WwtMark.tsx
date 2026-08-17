import { cn } from '@/lib/utils'

export function WwtMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-11 w-11 text-[11px]' : size === 'sm' ? 'h-7 w-7 text-[8px]' : 'h-8 w-8 text-[9px]'
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-lg bg-white font-bold tracking-[-0.08em] text-black shadow-[0_0_24px_rgba(45,212,191,0.18)]',
        box,
        className,
      )}
    >
      WWT
    </span>
  )
}

export function WwtWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <WwtMark />
      <span className="text-[15px] font-semibold tracking-[0.22em]">WWT</span>
    </span>
  )
}
