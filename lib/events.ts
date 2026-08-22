import { format, isSameDay } from 'date-fns'
import type { EventPost } from '@/types'

/** "Sat Sep 6 · 9:00 AM – 1:00 PM", collapsing same-day ranges. */
export function formatEventWhen(event: EventPost) {
  const start = new Date(event.starts_at)
  const startStr = format(start, 'EEE MMM d · h:mm a')
  if (!event.ends_at) return startStr

  const end = new Date(event.ends_at)
  return isSameDay(start, end)
    ? `${startStr} – ${format(end, 'h:mm a')}`
    : `${startStr} – ${format(end, 'EEE MMM d · h:mm a')}`
}

export function goingCount(event: EventPost) {
  return (event.rsvps ?? []).filter(r => r.status === 'going').length
}

export function myRsvp(event: EventPost, userId?: string) {
  if (!userId) return null
  return (event.rsvps ?? []).find(r => r.user_id === userId)?.status ?? null
}
