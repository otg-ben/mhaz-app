'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LostFoundFeed } from './LostFoundFeed'
import { EventsFeed } from '@/components/events/EventsFeed'
import { DiscussionFeed } from '@/components/discussion/DiscussionFeed'
import type { CommunityTab, LostFoundPost, EventPost } from '@/types'

interface CommunityViewProps {
  onPostClick: (post: LostFoundPost) => void
  onEventClick: (event: EventPost) => void
  onCreateLostFound: () => void
  refreshKey?: number
}

export function CommunityView({
  onPostClick, onEventClick, onCreateLostFound, refreshKey,
}: CommunityViewProps) {
  const [tab, setTab] = useState<CommunityTab>('lost_found')

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Segmented control */}
      <div className="flex gap-2 px-4 pt-3 pb-2 bg-surface border-b border-border">
        {([
          { key: 'lost_found' as const, label: 'Lost & Found' },
          { key: 'events' as const, label: 'Rides' },
          { key: 'discussion' as const, label: 'Discussion' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-colors',
              tab === t.key
                ? 'bg-brand text-base'
                : 'bg-elevated border border-border text-secondary hover:text-primary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'lost_found' ? (
          <LostFoundFeed
            onPostClick={onPostClick}
            onCreate={onCreateLostFound}
            refreshKey={refreshKey}
          />
        ) : tab === 'events' ? (
          <EventsFeed onEventClick={onEventClick} refreshKey={refreshKey} />
        ) : (
          <DiscussionFeed />
        )}
      </div>
    </div>
  )
}
