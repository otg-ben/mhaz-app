'use client'

import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimeRangeDropdown } from '@/components/ui/TimeRangeDropdown'
import type { AlertType, TimeRange } from '@/types'

const TYPES: { type: AlertType; label: string; on: string; off: string }[] = [
  { type: 'trail',      label: 'Trail',        on: 'bg-trail-bg border-trail-border text-trail-light',          off: 'bg-elevated border-border text-muted' },
  { type: 'leo',        label: 'LEO',          on: 'bg-leo-bg border-leo-border text-leo-light',                off: 'bg-elevated border-border text-muted' },
  { type: 'citation',   label: 'Citations',    on: 'bg-citation-bg border-citation-border text-citation-light', off: 'bg-elevated border-border text-muted' },
  { type: 'lost_found', label: 'Lost & Found', on: 'bg-lostfound-bg border-lostfound-border text-lostfound-light', off: 'bg-elevated border-border text-muted' },
]

interface FilterPanelProps {
  activeTypes: Set<AlertType>
  onToggleType: (type: AlertType) => void
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  showResolved: boolean
  onToggleResolved: () => void
}

export function FilterPanel({ activeTypes, onToggleType, timeRange, onTimeRangeChange, showResolved, onToggleResolved }: FilterPanelProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isFiltered = activeTypes.size < 4

  return (
    <div ref={ref} className="absolute top-4 left-3 z-20">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-pin transition-all',
          'bg-surface/90 backdrop-blur-sm border text-sm font-semibold',
          open || isFiltered
            ? 'border-brand text-brand'
            : 'border-border text-secondary hover:text-primary',
        )}
      >
        <SlidersHorizontal size={15} />
        <span className="text-xs">Filter</span>
        {isFiltered && (
          <span className="w-4 h-4 rounded-full bg-brand text-base text-[10px] font-bold flex items-center justify-center leading-none">
            {activeTypes.size}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-2 p-3.5 bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-modal w-60 space-y-3.5 animate-fade-in">
          {/* Type toggles */}
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Show on map &amp; feed</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPES.map(({ type, label, on, off }) => (
                <button
                  key={type}
                  onClick={() => onToggleType(type)}
                  className={cn(
                    'px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                    activeTypes.has(type) ? on : off,
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Resolved toggle */}
          {activeTypes.has('trail') && (
            <>
              <label className="flex items-center justify-between cursor-pointer" onClick={onToggleResolved}>
                <span className="text-xs font-medium text-secondary">Show Resolved Trail Alerts</span>
                <div className={cn(
                  'relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ml-3',
                  showResolved ? 'bg-brand' : 'bg-border',
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
                    showResolved ? 'translate-x-4' : 'translate-x-0.5',
                  )} />
                </div>
              </label>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Time range */}
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Time range</p>
            <TimeRangeDropdown value={timeRange} onChange={onTimeRangeChange} className="w-full" />
          </div>
        </div>
      )}
    </div>
  )
}
