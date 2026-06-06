'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'leo' | 'trail' | 'citation'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3.5 text-base',
        variant === 'primary' && 'bg-brand text-base hover:bg-brand-light active:scale-[0.98]',
        variant === 'secondary' && 'bg-elevated border border-border text-primary hover:bg-border active:scale-[0.98]',
        variant === 'ghost' && 'text-secondary hover:text-primary hover:bg-elevated',
        variant === 'danger' && 'bg-citation-bg border border-citation-border text-citation-light hover:bg-citation/20',
        variant === 'leo' && 'bg-leo-bg border border-leo-border text-leo-light hover:bg-leo/20',
        variant === 'trail' && 'bg-trail-bg border border-trail-border text-trail-light hover:bg-trail/20',
        variant === 'citation' && 'bg-citation-bg border border-citation-border text-citation-light hover:bg-citation/20',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  )
})

Button.displayName = 'Button'
export { Button }
