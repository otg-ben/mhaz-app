'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Layers, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterPanel } from './FilterPanel'
import { formatCoords } from '@/lib/mapbox/bounds'
import type { LeoAlert, TrailAlert, Citation, LostFoundPost, AlertType, TimeRange } from '@/types'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-secondary text-sm">Loading map…</p>
      </div>
    </div>
  ),
})

interface MapViewProps {
  leoAlerts: LeoAlert[]
  trailAlerts: TrailAlert[]
  citations: Citation[]
  lostFound: LostFoundPost[]
  activeTypes: Set<AlertType>
  onAlertClick: (type: AlertType, data: LeoAlert | TrailAlert | Citation | LostFoundPost) => void
  placingPin: boolean
  onPinPlaced: (lat: number, lng: number) => void
  onCancelPin: () => void
  highlightedId?: string
  mapStyle: 'topo' | 'satellite'
  onMapStyleToggle: () => void
  timeRange: TimeRange
  onToggleType: (type: AlertType) => void
  onTimeRangeChange: (range: TimeRange) => void
  showResolved: boolean
  onToggleResolved: () => void
  flyTo: { lat: number; lng: number; v: number } | null
}

export function MapView({
  leoAlerts,
  trailAlerts,
  citations,
  lostFound,
  activeTypes,
  onAlertClick,
  placingPin,
  onPinPlaced,
  onCancelPin,
  highlightedId,
  mapStyle,
  onMapStyleToggle,
  timeRange,
  onToggleType,
  onTimeRangeChange,
  showResolved,
  onToggleResolved,
  flyTo,
}: MapViewProps) {
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null)

  // Clear pending pin when placement mode exits
  useEffect(() => {
    if (!placingPin) setPendingPos(null)
  }, [placingPin])

  const handleConfirm = () => {
    if (pendingPos) onPinPlaced(pendingPos.lat, pendingPos.lng)
  }

  const handleCancel = () => {
    setPendingPos(null)
    onCancelPin()
  }

  return (
    <div className="relative w-full h-full">
      <MapClient
        leoAlerts={activeTypes.has('leo') ? leoAlerts : []}
        trailAlerts={activeTypes.has('trail') ? trailAlerts : []}
        citations={activeTypes.has('citation') ? citations : []}
        lostFound={activeTypes.has('lost_found') ? lostFound : []}
        onAlertClick={onAlertClick}
        placingPin={placingPin}
        pendingPos={pendingPos}
        onPendingPosChange={setPendingPos}
        highlightedId={highlightedId}
        mapStyle={mapStyle}
        flyTo={flyTo}
      />

      {/* Filter panel — top left, just below nav */}
      {!placingPin && (
        <FilterPanel
          activeTypes={activeTypes}
          onToggleType={onToggleType}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          showResolved={showResolved}
          onToggleResolved={onToggleResolved}
        />
      )}

      {/* Map style toggle — bottom left */}
      <button
        onClick={onMapStyleToggle}
        className={cn(
          'absolute bottom-20 left-3 z-10 md:bottom-6',
          'p-2.5 rounded-xl bg-surface/90 backdrop-blur-sm border border-border',
          'text-secondary hover:text-primary transition-colors shadow-pin',
        )}
        title={mapStyle === 'topo' ? 'Switch to satellite' : 'Switch to topo'}
      >
        <Layers size={18} />
      </button>

      {/* Pin placement overlay */}
      {placingPin && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {!pendingPos ? (
            /* No pin yet — instruction banner */
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
              <div className="flex items-center gap-2 bg-surface/95 backdrop-blur-sm border border-border px-4 py-2.5 rounded-2xl shadow-modal">
                <MapPin size={15} className="text-citation flex-shrink-0" />
                <span className="text-sm font-medium text-primary">Tap the map to place your pin</span>
              </div>
            </div>
          ) : (
            /* Pin placed — show coords + confirm/cancel */
            <>
              {/* Coords pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-surface/95 backdrop-blur-sm border border-border px-3 py-2 rounded-2xl shadow-modal">
                  <MapPin size={13} className="text-citation flex-shrink-0" />
                  <span className="text-xs font-mono text-secondary">
                    {formatCoords(pendingPos.lat, pendingPos.lng)}
                  </span>
                  <span className="text-[10px] text-muted">· drag to adjust</span>
                </div>
              </div>

              {/* Confirm / Cancel buttons */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto md:bottom-8">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-elevated border border-border text-secondary hover:text-primary transition-colors shadow-pin"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-citation text-white hover:bg-citation-light transition-colors shadow-modal active:scale-95"
                >
                  Confirm location
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
