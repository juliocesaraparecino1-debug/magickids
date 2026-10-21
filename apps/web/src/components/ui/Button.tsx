import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'text-white bg-[image:var(--brand-gradient)] shadow-md hover:opacity-95 active:scale-[0.98]',
  secondary:
    'bg-[var(--highlight)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--highlight)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl px-4 font-medium transition-all duration-200',
          'min-h-[var(--touch-min)] text-base',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-from)]',
          'disabled:opacity-50 disabled:pointer-events-none',
          fullWidth && 'w-full',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
