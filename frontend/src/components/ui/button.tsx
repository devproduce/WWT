import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium app-ease disabled:opacity-50',
        variant === 'primary' &&
          'bg-teal-800 text-white shadow-[0_12px_28px_rgb(15_118_110_/_0.22)] hover:-translate-y-0.5 hover:bg-teal-700',
        variant === 'secondary' &&
          'border border-teal-900/10 bg-white/80 text-teal-950 hover:-translate-y-0.5 hover:border-teal-700/25 hover:bg-white',
        variant === 'ghost' && 'text-teal-800 hover:bg-teal-900/6',
        variant === 'danger' && 'bg-rose-600 text-white hover:-translate-y-0.5 hover:bg-rose-500',
        className,
      )}
      {...props}
    />
  )
}
