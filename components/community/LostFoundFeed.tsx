'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Plus, RefreshCw } from 'lucide-react'
import { FeedItem } from '@/components/feed/FeedItem'
import { cn } from '@/lib/utils'
import type { LostFoundPost, LostFoundType } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type Filter = 'all' | LostFoundType

interface LostFoundFeedProps {
  onPostClick: (post: LostFoundPost) => void
  onShowOnMap: (id: string, lat?: number, lng?: number) => void
  onCreate: () => void
  refreshKey?: number
}

export function LostFoundFeed({ onPostClick, onShowOnMap, onCreate, refreshKey }: LostFoundFeedProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [showResolved, setShowResolved] = useState(false)

  const { data, isLoading, mutate } = useSWR<{ data: LostFoundPost[] }>(
    `/api/lost-found?range=90d&k=${refreshKey ?? 0}`, fetcher,
  )

  const posts = useMemo(() => {
    let list = data?.data ?? []
    if (filter !== 'all') list = list.filter(p => p.type === filter)
    if (!showResolved) list = list.filter(p => p.status !== 'resolved')
    return list
  }, [data, filter, showResolved])

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'lost', 'found'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors capitalize',
                filter === f
                  ? 'bg-lostfound-bg border-lostfound-border text-lostfound-light'
                  : 'bg-elevated border-border text-muted hover:text-secondary',
              )}
            >
              {f}
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

        <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={() => setShowResolved(v => !v)}
            className="accent-brand w-3.5 h-3.5"
          />
          <span className="text-[11px] text-secondary">Show claimed &amp; recovered</span>
        </label>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-secondary text-sm mb-1">Nothing here yet</p>
            <p className="text-muted text-xs">
              Lost something on the trail, or found someone else&apos;s gear? Post it.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map(p => (
              <FeedItem
                key={p.id}
                type="lost_found"
                data={p}
                onClick={() => onPostClick(p)}
                onShowOnMap={
                  p.lat != null && p.long != null
                    ? () => onShowOnMap(p.id, p.lat!, p.long!)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Create */}
      <div className="p-3 border-t border-border bg-surface">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lostfound-bg border border-lostfound-border text-lostfound-light text-sm font-semibold hover:bg-lostfound/20 active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Post lost or found item
        </button>
      </div>
    </div>
  )
}
