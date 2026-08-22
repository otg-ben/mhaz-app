'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LostFoundFeed } from './LostFoundFeed'
import type { CommunityTab, LostFoundPost } from '@/types'

interface CommunityViewProps {
  onPostClick: (post: LostFoundPost) => void
  onCreateLostFound: () => void
  refreshKey?: number
}

export function CommunityView({
  onPostClick, onCreateLostFound, refreshKey,
}: CommunityViewProps) {
  const [tab, setTab] = useState<CommunityTab>('lost_found')

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Segmented control */}
      <div className="flex gap-2 px-4 pt-3 pb-2 bg-surface border-b border-border">
        {([
          { key: 'lost_found' as const, label: 'Lost & Found' },
          { key: 'events' as const, label: 'Rides & Events' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="text-3xl mb-3">🚵</div>
            <p className="text-secondary text-sm mb-1">Rides &amp; events coming next</p>
            <p className="text-muted text-xs">
              Group rides, trail work days, and community events with RSVPs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
