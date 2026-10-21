import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-soft)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
