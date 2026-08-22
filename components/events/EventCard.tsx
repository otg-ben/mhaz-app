'use client'

import { CalendarDays, MapPin, Users } from 'lucide-react'
import { formatEventWhen, goingCount } from '@/lib/events'
import { cn } from '@/lib/utils'
import type { EventPost } from '@/types'

interface EventCardProps {
  event: EventPost
  onClick: () => void
  past?: boolean
}

export function EventCard({ event, onClick, past }: EventCardProps) {
  const going = goingCount(event)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 hover:bg-elevated/60 transition-colors',
        past && 'opacity-60',
      )}
    >
      <div className="flex gap-3">
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt=""
            className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded-md bg-event-bg border border-event-border text-[10px] font-semibold uppercase tracking-wide text-event-light">
              {past ? 'Past' : 'Ride / Event'}
            </span>
          </div>

          <p className="text-[15px] font-semibold text-primary leading-snug line-clamp-2">
            {event.title}
          </p>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-secondary">
            <CalendarDays size={13} className="shrink-0" />
            <span className="truncate">{formatEventWhen(event)}</span>
          </div>

          {event.location_text && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">{event.location_text}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {going} going
            </span>
            <span>·</span>
            <span>{event.hosted_by || `@${event.user?.handle ?? '—'}`}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
