import { cn } from '@/lib/utils'
import { controlClass } from '@/components/ui/input'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, 'min-h-24', className)} {...props} />
}
