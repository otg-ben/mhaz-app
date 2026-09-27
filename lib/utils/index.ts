import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import type { AlertType, LeoAgency, TrailIssueType, TimeRange } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Marin time, always.
 *
 * date-fns formats in whatever zone the runtime happens to be in: the reader's
 * browser on the client, but UTC on Vercel — which is how an alert posted at
 * 2:34 PM PT went out to the list stamped 9:34 PM. Pinning the zone also means
 * a rider checking from out of state still reads trail times in Marin time,
 * which is the only reading that makes sense for a trail report.
 */
export const APP_TIME_ZONE = 'America/Los_Angeles'

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(date)).replace(',', '')
}

export function timeRangeToDate(range: TimeRange): Date {
  const now = new Date()
  switch (range) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '14d': return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '1y':  return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  }
}

export const ALERT_TYPE_CONFIG: Record<AlertType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  pinColor: string
  icon: string
}> = {
  leo: {
    label: 'LEO',
    color: 'text-leo',
    bgColor: 'bg-leo-bg',
    borderColor: 'border-leo-border',
    pinColor: '#4f8ef7',
    icon: '👮',
  },
  trail: {
    label: 'Trail Issue',
    color: 'text-trail',
    bgColor: 'bg-trail-bg',
    borderColor: 'border-trail-border',
    pinColor: '#fbbf24',
    icon: '🪚',
  },
  citation: {
    label: 'Citation',
    color: 'text-citation',
    bgColor: 'bg-citation-bg',
    borderColor: 'border-citation-border',
    pinColor: '#dc2626',
    icon: '📋',
  },
  lost_found: {
    label: 'Lost & Found',
    color: 'text-lostfound',
    bgColor: 'bg-lostfound-bg',
    borderColor: 'border-lostfound-border',
    pinColor: '#4ade80',
    icon: '🕶️',
  },
}

export const LEO_AGENCY_LABELS: Record<LeoAgency, string> = {
  'Marin County Sheriff': 'Marin Sheriff',
  'MMWD': 'MMWD',
  'CA State Parks': 'CA State Parks',
  'Marin Open Space & Parks (MCOSD)': 'MCOSD',
  'National Park Service (NPS)': 'NPS',
  'California Highway Patrol (CHP)': 'CHP',
  'Local PD': 'Local PD',
  'Other': 'Other',
}

export const TRAIL_ISSUE_LABELS: Record<TrailIssueType, string> = {
  downed_tree: 'Downed Tree',
  washout: 'Washout',
  closure: 'Trail Closure',
  maintenance: 'Maintenance Needed',
  hazard: 'Hazard',
  other: 'Other',
}

export function truncate(str: string, len = 120): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + '…'
}
