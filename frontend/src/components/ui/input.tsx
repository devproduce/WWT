import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export const controlClass =
  'w-full rounded-xl border border-teal-900/10 bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500/40 focus:ring-4 focus:ring-teal-700/12'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />
}
