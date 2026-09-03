import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  className = '',
  interactive = false,
  children,
}: {
  className?: string
  interactive?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('app-card rounded-[28px] p-6', interactive && 'app-card-lift app-shine', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-base font-semibold tracking-tight text-ink', className)}>{children}</h2>
}
