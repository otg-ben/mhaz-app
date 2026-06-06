import { cn } from '@/lib/utils'
import type { AlertType } from '@/types'

interface BadgeProps {
  type: AlertType | 'mhaz' | 'resolved'
  label?: string
  className?: string
}

const TYPE_STYLES: Record<string, string> = {
  leo: 'bg-leo-bg border-leo-border text-leo',
  trail: 'bg-trail-bg border-trail-border text-trail',
  citation: 'bg-citation-bg border-citation-border text-citation',
  lost_found: 'bg-lostfound-bg border-lostfound-border text-lostfound',
  mhaz: 'bg-mhaz-bg border-mhaz-border text-mhaz',
  resolved: 'bg-brand-muted border-brand text-brand',
}

const TYPE_LABELS: Record<string, string> = {
  leo: 'LEO',
  trail: 'Trail Issue',
  citation: 'Citation',
  lost_found: 'Lost & Found',
  mhaz: 'MHAZ',
  resolved: 'Resolved',
}

export function Badge({ type, label, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border',
      TYPE_STYLES[type],
      className,
    )}>
      {label ?? TYPE_LABELS[type]}
    </span>
  )
}
