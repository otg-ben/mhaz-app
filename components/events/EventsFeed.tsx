'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, RefreshCw } from 'lucide-react'
import { EventCard } from './EventCard'
import { cn } from '@/lib/utils'
import type { EventPost, EventScope } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface EventsFeedProps {
  onEventClick: (event: EventPost) => void
  refreshKey?: number
}

export function EventsFeed({ onEventClick, refreshKey }: EventsFeedProps) {
  const [scope, setScope] = useState<EventScope>('upcoming')
  const [addOpen, setAddOpen] = useState(false)

  const { data, isLoading, mutate } = useSWR<{ data: EventPost[] }>(
    `/api/events?scope=${scope}&k=${refreshKey ?? 0}`, fetcher,
  )
  const events = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-2">
        {(['upcoming', 'past'] as const).map(s => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors capitalize',
              scope === s
                ? 'bg-event-bg border-event-border text-event-light'
                : 'bg-elevated border-border text-muted hover:text-secondary',
            )}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => mutate()}
          className="ml-auto p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-secondary text-sm mb-1">
              {scope === 'upcoming' ? 'No upcoming rides or events' : 'Nothing in the past yet'}
            </p>
            {scope === 'upcoming' && (
              <p className="text-muted text-xs">Organizing a group ride or trail work day? Post it.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map(e => (
              <EventCard key={e.id} event={e} past={scope === 'past'} onClick={() => onEventClick(e)} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-surface">
        <button
          onClick={() => setAddOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-event-bg border border-event-border text-event-light text-sm font-semibold hover:bg-event/20 active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Post a ride or event
        </button>
      </div>

      <AddEventModalLazy open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => mutate()} />
    </div>
  )
}

// Keeps the create form out of the initial Community render
import { AddEventModal } from './AddEventModal'
function AddEventModalLazy(props: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  if (!props.open) return null
  return <AddEventModal {...props} />
}
