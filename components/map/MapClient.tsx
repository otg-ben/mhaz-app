'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_BOUNDS,
  isInValidRegion,
} from '@/lib/mapbox/bounds'
import { ALERT_TYPE_CONFIG } from '@/lib/utils'
import type { LeoAlert, TrailAlert, Citation, LostFoundPost, AlertType } from '@/types'
import { timeAgo, LEO_AGENCY_LABELS, TRAIL_ISSUE_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface MapClientProps {
  leoAlerts: LeoAlert[]
  trailAlerts: TrailAlert[]
  citations: Citation[]
  lostFound: LostFoundPost[]
  onAlertClick: (type: AlertType, data: LeoAlert | TrailAlert | Citation | LostFoundPost) => void
  placingPin: boolean
  pendingPos: { lat: number; lng: number } | null
  onPendingPosChange: (pos: { lat: number; lng: number }) => void
  highlightedId?: string
  mapStyle: 'topo' | 'satellite'
  flyTo: { lat: number; lng: number; v: number } | null
}

const MAPBOX_STYLES = {
  topo: 'mapbox://styles/mapbox/outdoors-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

interface PopupInfo {
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
  lat: number
  lng: number
}

export default function MapClient({
  leoAlerts,
  trailAlerts,
  citations,
  lostFound,
  onAlertClick,
  placingPin,
  pendingPos,
  onPendingPosChange,
  highlightedId,
  mapStyle,
  flyTo,
}: MapClientProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null)

  useEffect(() => {
    if (placingPin) setPopupInfo(null)
  }, [placingPin])

  // Fly to location when requested
  useEffect(() => {
    if (!flyTo || !mapRef.current) return
    mapRef.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: 14,
      duration: 1200,
      essential: true,
    })
  }, [flyTo])

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!placingPin) return
    const { lat, lng } = e.lngLat
    if (!isInValidRegion(lat, lng)) return
    onPendingPosChange({ lat, lng })
  }, [placingPin, onPendingPosChange])

  return (
    <Map
      ref={(ref) => { mapRef.current = ref?.getMap() ?? null }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: MAP_CENTER[0],
        latitude: MAP_CENTER[1],
        zoom: MAP_DEFAULT_ZOOM,
      }}
      minZoom={MAP_MIN_ZOOM}
      maxBounds={MAP_MAX_BOUNDS}
      mapStyle={MAPBOX_STYLES[mapStyle]}
      onClick={handleMapClick}
      cursor={placingPin ? 'crosshair' : 'grab'}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />

      {/* Pending / placement pin */}
      {placingPin && pendingPos && (
        <Marker
          longitude={pendingPos.lng}
          latitude={pendingPos.lat}
          anchor="bottom"
          draggable
          onDrag={(e) => {
            onPendingPosChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })
          }}
          onDragEnd={(e) => {
            const { lat, lng } = e.lngLat
            if (isInValidRegion(lat, lng)) {
              onPendingPosChange({ lat, lng })
            }
          }}
        >
          <PendingPin />
        </Marker>
      )}

      {/* LEO Pins */}
      {leoAlerts.map(alert => (
        <AlertMarker
          key={alert.id}
          id={alert.id}
          lat={alert.lat}
          lng={alert.long}
          type="leo"
          highlighted={highlightedId === alert.id}
          onClick={() => setPopupInfo({ type: 'leo', data: alert, lat: alert.lat, lng: alert.long })}
        />
      ))}

      {/* Trail Issue Pins */}
      {trailAlerts.map(alert => (
        <AlertMarker
          key={alert.id}
          id={alert.id}
          lat={alert.lat}
          lng={alert.long}
          type="trail"
          highlighted={highlightedId === alert.id}
          resolved={alert.status === 'resolved'}
          onClick={() => setPopupInfo({ type: 'trail', data: alert, lat: alert.lat, lng: alert.long })}
        />
      ))}

      {/* Citation Pins */}
      {citations.map(alert => (
        <AlertMarker
          key={alert.id}
          id={alert.id}
          lat={alert.lat}
          lng={alert.long}
          type="citation"
          highlighted={highlightedId === alert.id}
          onClick={() => setPopupInfo({ type: 'citation', data: alert, lat: alert.lat, lng: alert.long })}
        />
      ))}

      {/* Lost & Found Pins */}
      {lostFound.filter(p => p.lat && p.long).map(post => (
        <AlertMarker
          key={post.id}
          id={post.id}
          lat={post.lat!}
          lng={post.long!}
          type="lost_found"
          highlighted={highlightedId === post.id}
          onClick={() => setPopupInfo({ type: 'lost_found', data: post, lat: post.lat!, lng: post.long! })}
        />
      ))}

      {/* Popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.lng}
          latitude={popupInfo.lat}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeButton={false}
          className="mhaz-popup"
          offset={16}
        >
          <PopupCard
            type={popupInfo.type}
            data={popupInfo.data}
            onViewDetail={() => {
              onAlertClick(popupInfo.type, popupInfo.data)
              setPopupInfo(null)
            }}
          />
        </Popup>
      )}
    </Map>
  )
}

// ─── Pending / placement pin ──────────────────────────────────────────────────

function PendingPin() {
  return (
    <div
      className="relative select-none"
      style={{ cursor: 'grab', touchAction: 'none' }}
    >
      {/* Pulsing ring */}
      <span
        className="absolute rounded-full animate-ping"
        style={{
          width: 44, height: 44,
          top: -30, left: -8,
          background: 'rgba(239,68,68,0.25)',
          pointerEvents: 'none',
        }}
      />
      {/* Pin SVG */}
      <svg
        width="32" height="42" viewBox="0 0 28 36" fill="none"
        style={{ filter: 'drop-shadow(0 3px 8px rgba(239,68,68,0.55))' }}
      >
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
          fill="#ef4444"
        />
        {/* White crosshair dot */}
        <circle cx="14" cy="14" r="5" fill="white" opacity="0.95" />
        <line x1="14" y1="10.5" x2="14" y2="17.5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10.5" y1="14" x2="17.5" y2="14" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ─── Alert Marker ─────────────────────────────────────────────────────────────

interface AlertMarkerProps {
  id: string
  lat: number
  lng: number
  type: AlertType
  onClick: () => void
  highlighted?: boolean
  resolved?: boolean
}

function AlertMarker({ lat, lng, type, onClick, highlighted, resolved }: AlertMarkerProps) {
  const config = ALERT_TYPE_CONFIG[type]
  const color = resolved ? '#6e7681' : config.pinColor

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick() }}
    >
      <div
        className="relative cursor-pointer transition-transform hover:scale-110"
        style={{ filter: highlighted ? `drop-shadow(0 0 8px ${color})` : undefined }}
      >
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path
            d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill={color}
            opacity={resolved ? 0.5 : 1}
          />
          <circle cx="14" cy="14" r="6" fill="white" opacity="0.9" />
        </svg>
        <span className="absolute top-[6px] left-0 right-0 text-center text-[11px] leading-none">
          {config.icon}
        </span>
      </div>
    </Marker>
  )
}

// ─── Popup Card ───────────────────────────────────────────────────────────────

function PopupCard({
  type,
  data,
  onViewDetail,
}: {
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
  onViewDetail: () => void
}) {
  const getSubtitle = () => {
    if (type === 'leo') return LEO_AGENCY_LABELS[(data as LeoAlert).agency]
    if (type === 'trail') return TRAIL_ISSUE_LABELS[(data as TrailAlert).issue_type]
    if (type === 'citation') return LEO_AGENCY_LABELS[(data as Citation).agency]
    if (type === 'lost_found') return (data as LostFoundPost).type === 'lost' ? 'Lost Item' : 'Found Item'
    return ''
  }

  return (
    <div
      className="bg-elevated border border-border rounded-xl p-3 min-w-[200px] max-w-[260px] cursor-pointer hover:bg-border/30 transition-colors"
      onClick={onViewDetail}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge type={type} />
        {type === 'trail' && (data as TrailAlert).status === 'resolved' && (
          <Badge type="resolved" />
        )}
      </div>
      <p className="text-xs font-medium text-primary mb-0.5">{getSubtitle()}</p>
      <p className="text-xs text-secondary line-clamp-2 mb-2">
        {(data as { description: string }).description}
      </p>
      <div className="flex items-center justify-between text-[10px] text-muted">
        <span>@{(data as LeoAlert).user?.handle ?? '—'}</span>
        <span>{timeAgo(data.created_at)}</span>
      </div>
      <p className="text-[10px] text-brand mt-1.5 font-medium">Tap to view details →</p>
    </div>
  )
}
