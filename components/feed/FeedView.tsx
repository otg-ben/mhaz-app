'use client'

import useSWR from 'swr'
import { useMemo } from 'react'
import { FeedItem } from './FeedItem'
import { TimeRangeDropdown } from '@/components/ui/TimeRangeDropdown'
import { cn } from '@/lib/utils'
import type { LeoAlert, TrailAlert, Citation, LostFoundPost, AlertType, TimeRange } from '@/types'
import { RefreshCw } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type UnifiedItem =
  | { _type: 'leo';        data: LeoAlert }
  | { _type: 'trail';      data: TrailAlert }
  | { _type: 'citation';   data: Citation }
  | { _type: 'lost_found'; data: LostFoundPost }

const TYPE_FILTERS: { type: AlertType; label: string; on: string; off: string }[] = [
  { type: 'trail',      label: 'Trail',        on: 'bg-trail-bg border-trail-border text-trail-light',          off: 'bg-elevated border-border text-muted' },
  { type: 'leo',        label: 'LEO',          on: 'bg-leo-bg border-leo-border text-leo-light',                off: 'bg-elevated border-border text-muted' },
  { type: 'citation',   label: 'Citations',    on: 'bg-citation-bg border-citation-border text-citation-light', off: 'bg-elevated border-border text-muted' },
  { type: 'lost_found', label: 'Lost & Found', on: 'bg-lostfound-bg border-lostfound-border text-lostfound-light', off: 'bg-elevated border-border text-muted' },
]

function getMapCoords(type: AlertType, data: LeoAlert | TrailAlert | Citation | LostFoundPost) {
  if (type === 'lost_found') {
    const lf = data as LostFoundPost
    return lf.lat != null && lf.long != null ? { lat: lf.lat, lng: lf.long } : null
  }
  const a = data as LeoAlert
  return a.lat != null && a.long != null ? { lat: a.lat, lng: a.long } : null
}

interface FeedViewProps {
  activeTypes: Set<AlertType>
  onToggleType: (type: AlertType) => void
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  showResolved: boolean
  onToggleResolved: () => void
  onAlertClick: (type: AlertType, data: LeoAlert | TrailAlert | Citation | LostFoundPost) => void
  onShowOnMap: (id: string, lat?: number, lng?: number) => void
}

export function FeedView({
  activeTypes,
  onToggleType,
  timeRange,
  onTimeRangeChange,
  showResolved,
  onToggleResolved,
  onAlertClick,
  onShowOnMap,
}: FeedViewProps) {
  const { data: leoData,   isLoading: l1, mutate: m1 } = useSWR<{ data: LeoAlert[] }>(
    activeTypes.has('leo')        ? `/api/alerts/leo?range=${timeRange}` : null, fetcher)
  const { data: trailData, isLoading: l2, mutate: m2 } = useSWR<{ data: TrailAlert[] }>(
    activeTypes.has('trail')      ? `/api/alerts/trail?range=${timeRange}&resolved=${showResolved}` : null, fetcher)
  const { data: citData,   isLoading: l3, mutate: m3 } = useSWR<{ data: Citation[] }>(
    activeTypes.has('citation')   ? `/api/citations?range=${timeRange}` : null, fetcher)
  const { data: lostData,  isLoading: l4, mutate: m4 } = useSWR<{ data: LostFoundPost[] }>(
    activeTypes.has('lost_found') ? `/api/lost-found?range=${timeRange}` : null, fetcher)

  const loading = l1 || l2 || l3 || l4
  const refreshAll = () => { m1?.(); m2?.(); m3?.(); m4?.() }

  const items = useMemo<UnifiedItem[]>(() => {
    const all: UnifiedItem[] = [
      ...(leoData?.data   ?? []).map(d => ({ _type: 'leo'        as const, data: d })),
      ...(trailData?.data  ?? []).map(d => ({ _type: 'trail'     as const, data: d })),
      ...(citData?.data    ?? []).map(d => ({ _type: 'citation'  as const, data: d })),
      ...(lostData?.data   ?? []).map(d => ({ _type: 'lost_found'as const, data: d })),
    ]
    return all.sort((a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
    )
  }, [leoData, trailData, citData, lostData])

  return (
    <div className="flex flex-col h-full">

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">

        {/* Type toggles */}
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto scrollbar-none">
          {TYPE_FILTERS.map(({ type, label, on, off }) => (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                activeTypes.has(type) ? on : off,
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Time range dropdown + resolved toggle */}
        <div className="flex items-center gap-3 px-3 pb-2.5">
          <TimeRangeDropdown value={timeRange} onChange={onTimeRangeChange} />

          {activeTypes.has('trail') && (
            <label className="flex items-center gap-2 cursor-pointer ml-1" onClick={onToggleResolved}>
              <div className={cn(
                'relative w-8 h-4 rounded-full transition-colors flex-shrink-0',
                showResolved ? 'bg-brand' : 'bg-border',
              )}>
                <div className={cn(
                  'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
                  showResolved ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </div>
              <span className="text-xs text-secondary">Show Resolved Trail Alerts</span>
            </label>
          )}

          <button
            onClick={refreshAll}
            className="ml-auto p-1 rounded-lg text-muted hover:text-secondary transition-colors flex-shrink-0"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────── */}
      <div className="px-4 py-1.5 border-b border-border bg-surface">
        <p className="text-[11px] text-muted">
          {activeTypes.size === 0
            ? 'No types selected'
            : loading
            ? 'Loading…'
            : `${items.length} alert${items.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── Feed list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTypes.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-secondary text-sm mb-1">No types selected</p>
            <p className="text-muted text-xs">Use the filter pills above to choose what to show</p>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-secondary text-sm mb-1">No alerts found</p>
            <p className="text-muted text-xs">Try a wider time range or enable more types</p>
          </div>
        ) : (
          items.map(item => (
            <FeedItem
              key={`${item._type}-${item.data.id}`}
              type={item._type}
              data={item.data}
              onClick={() => onAlertClick(item._type, item.data)}
              onShowOnMap={() => {
                const coords = getMapCoords(item._type, item.data)
                onShowOnMap(item.data.id, coords?.lat, coords?.lng)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
