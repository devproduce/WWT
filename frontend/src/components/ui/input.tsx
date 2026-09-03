import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

export const controlClass =
  'w-full rounded-xl border border-teal-900/10 bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal-500/40 focus:ring-4 focus:ring-teal-700/12 dark:border-teal-200/15 dark:bg-teal-700/40 dark:text-ink dark:placeholder:text-teal-200/40 dark:focus:border-teal-300/40 dark:focus:ring-teal-300/15'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />
}
