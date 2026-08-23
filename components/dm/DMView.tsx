'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { MessageCircle } from 'lucide-react'
import { DMThread } from './DMThread'
import { timeAgo, cn } from '@/lib/utils'
import type { DMConversation } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface DMViewProps {
  /** Set when arriving from a "Message @handle" button elsewhere in the app. */
  initialThreadUser?: { id: string; handle: string } | null
  onThreadOpened?: () => void
  onUnreadChange?: () => void
}

export function DMView({ initialThreadUser, onThreadOpened, onUnreadChange }: DMViewProps) {
  const [thread, setThread] = useState<{ id: string; handle: string } | null>(null)

  const { data, isLoading, mutate } = useSWR<{ data: DMConversation[] }>(
    '/api/dms', fetcher, { refreshInterval: 30000 },
  )
  const conversations = data?.data ?? []

  // Deep-link into a thread when another view hands us a user
  useEffect(() => {
    if (initialThreadUser) {
      setThread(initialThreadUser)
      onThreadOpened?.()
    }
  }, [initialThreadUser, onThreadOpened])

  if (thread) {
    return (
      <DMThread
        userId={thread.id}
        handle={thread.handle}
        onBack={() => { setThread(null); mutate() }}
        onRead={() => { mutate(); onUnreadChange?.() }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-base">
      <div className="px-4 py-3 border-b border-border bg-surface shrink-0">
        <p className="text-sm font-semibold text-primary">Messages</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-2">
            <MessageCircle size={28} className="text-muted" />
            <p className="text-secondary text-sm">No messages yet</p>
            <p className="text-muted text-xs">
              Start one from a lost &amp; found post to reach the person who posted it.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map(c => (
              <div
                key={c.userId}
                role="button"
                tabIndex={0}
                onClick={() => setThread({ id: c.userId, handle: c.handle })}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setThread({ id: c.userId, handle: c.handle }) } }}
                className="w-full cursor-pointer text-left px-4 py-3.5 hover:bg-elevated/50 active:bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-muted border border-brand flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-brand">{c.handle[0]?.toUpperCase() ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('text-sm truncate', c.unread > 0 ? 'font-bold text-primary' : 'font-semibold text-primary')}>
                        @{c.handle}
                      </p>
                      <span className="text-[11px] text-muted shrink-0">{timeAgo(c.lastAt)}</span>
                    </div>
                    <p className={cn('text-xs truncate mt-0.5', c.unread > 0 ? 'text-primary' : 'text-muted')}>
                      {c.lastFromMe && <span className="text-muted">You: </span>}
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-base text-[11px] font-bold flex items-center justify-center">
                      {c.unread > 9 ? '9+' : c.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
