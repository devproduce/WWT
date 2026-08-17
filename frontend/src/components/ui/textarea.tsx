import { cn } from '@/lib/utils'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-700/20 focus:ring-4',
        className,
      )}
      {...props}
    />
  )
}
