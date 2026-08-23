import { Mail, Siren } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertType } from '@/types'

interface BadgeProps {
  type: AlertType | 'mhaz' | 'resolved' | 'advisory'
  label?: string
  className?: string
}

const TYPE_STYLES: Record<string, string> = {
  leo: 'bg-leo-bg border-leo-border text-leo',
  trail: 'bg-trail-bg border-trail-border text-trail',
  citation: 'bg-citation-bg border-citation-border text-citation',
  lost_found: 'bg-lostfound-bg border-lostfound-border text-lostfound',
  mhaz: 'bg-mhaz-bg border-mhaz-border text-mhaz',
  advisory: 'bg-event-bg border-event-border text-event-light',
  resolved: 'bg-brand-muted border-brand text-brand',
}

const TYPE_LABELS: Record<string, string> = {
  leo: 'LEO',
  trail: 'Trail Issue',
  citation: 'Citation',
  lost_found: 'Lost & Found',
  mhaz: 'MHAZ',
  advisory: 'Advisory',
  resolved: 'Resolved',
}

// An icon on these two says at a glance where the item came from:
// an envelope for list mail, a siren for standing advisories.
const TYPE_ICONS: Record<string, React.ReactNode> = {
  mhaz: <Mail size={11} />,
  advisory: <Siren size={11} />,
}

export function Badge({ type, label, className }: BadgeProps) {
  const icon = TYPE_ICONS[type]

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border',
      TYPE_STYLES[type],
      className,
    )}>
      {icon}
      {label ?? TYPE_LABELS[type]}
    </span>
  )
}
