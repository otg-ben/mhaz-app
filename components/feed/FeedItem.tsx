'use client'

import { MapPin, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { timeAgo, LEO_AGENCY_LABELS, TRAIL_ISSUE_LABELS, truncate } from '@/lib/utils'
import type { LeoAlert, TrailAlert, Citation, LostFoundPost, AlertType } from '@/types'

interface FeedItemProps {
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
  onClick: () => void
  onShowOnMap?: () => void
  commentCount?: number
}

export function FeedItem({ type, data, onClick, onShowOnMap, commentCount = 0 }: FeedItemProps) {
  const getSubtitle = () => {
    if (type === 'leo') return LEO_AGENCY_LABELS[(data as LeoAlert).agency]
    if (type === 'trail') {
      const t = data as TrailAlert
      return `${TRAIL_ISSUE_LABELS[t.issue_type]}${t.status === 'resolved' ? ' · Resolved' : ''}`
    }
    if (type === 'citation') return LEO_AGENCY_LABELS[(data as Citation).agency]
    if (type === 'lost_found') {
      const l = data as LostFoundPost
      return `${l.type === 'lost' ? 'Lost' : 'Found'}${l.status === 'resolved' ? ' · Resolved' : ''}`
    }
    return ''
  }

  const hasLocation = (type !== 'lost_found') ||
    (type === 'lost_found' && (data as LostFoundPost).lat != null)

  const isResolved =
    (type === 'trail' && (data as TrailAlert).status === 'resolved') ||
    (type === 'lost_found' && (data as LostFoundPost).status === 'resolved')

  const isMhaz = (data as LeoAlert).source === 'mhaz'

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 hover:bg-elevated/50 transition-colors border-b border-border last:border-0 active:bg-elevated"
    >
      <div className="flex items-start gap-3">
        {/* Left: type indicator */}
        <div className="flex-shrink-0 mt-0.5">
          <Badge type={type} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-primary">{getSubtitle()}</span>
            {isMhaz && <Badge type="mhaz" />}
            {isResolved && <Badge type="resolved" />}
          </div>
          <p className="text-xs text-secondary leading-relaxed mb-2">
            {truncate((data as { description: string }).description)}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span>@{(data as LeoAlert).user?.handle ?? '—'}</span>
              <span>{timeAgo(data.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <MessageCircle size={12} />
                  <span>{commentCount}</span>
                </div>
              )}
              {hasLocation && onShowOnMap && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShowOnMap() }}
                  className="flex items-center gap-1 text-[11px] text-brand hover:text-brand-light transition-colors"
                >
                  <MapPin size={12} />
                  <span>Map</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
