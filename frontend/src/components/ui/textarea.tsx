import { cn } from '@/lib/utils'
import { controlClass } from '@/components/ui/input'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(controlClass, 'min-h-24', className)} {...props} />
  },
)
