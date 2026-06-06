'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { MapView } from '@/components/map/MapView'
import { FeedView } from '@/components/feed/FeedView'
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal'
import { AddAlertModal } from '@/components/alerts/AddAlertModal'
import { AddAlertFAB } from '@/components/alerts/AddAlertFAB'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type {
  AlertType, LeoAlert, TrailAlert, Citation, LostFoundPost,
  TimeRange, SelectedAlert,
} from '@/types'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const ALL_TYPES = new Set<AlertType>(['leo', 'trail', 'citation', 'lost_found'])

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Auth gate — show spinner while resolving, landing screen if signed out
  if (authLoading) {
    return (
      <div className="h-screen-safe flex items-center justify-center bg-base">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthGate />
  }

  // View state
  const [activeView, setActiveView] = useState<'map' | 'feed'>('map')
  const [mapStyle, setMapStyle] = useState<'topo' | 'satellite'>('topo')

  // Filter state — unified across map + feed
  const [activeTypes, setActiveTypes] = useState<Set<AlertType>>(new Set(ALL_TYPES))
  const [timeRange, setTimeRange] = useState<TimeRange>('14d')
  const [showResolved, setShowResolved] = useState(false)

  const [highlightedId, setHighlightedId] = useState<string | undefined>()
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; v: number } | null>(null)

  // Modals
  const [authOpen, setAuthOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<SelectedAlert | null>(null)
  const [addAlertType, setAddAlertType] = useState<AlertType | null>(null)
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null)
  const [placingPinFor, setPlacingPinFor] = useState<AlertType | null>(null)

  // Map data (always fetches all types so map and feed stay in sync)
  const { data: leoData,   mutate: leoMutate }   = useSWR<{ data: LeoAlert[] }>(
    `/api/alerts/leo?range=${timeRange}`, fetcher)
  const { data: trailData, mutate: trailMutate } = useSWR<{ data: TrailAlert[] }>(
    `/api/alerts/trail?range=${timeRange}&resolved=${showResolved}`, fetcher)
  const { data: citData,   mutate: citMutate }   = useSWR<{ data: Citation[] }>(
    `/api/citations?range=${timeRange}`, fetcher)
  const { data: lostData,  mutate: lostMutate }  = useSWR<{ data: LostFoundPost[] }>(
    `/api/lost-found?range=${timeRange}`, fetcher)

  const refreshAll = useCallback(() => {
    leoMutate(); trailMutate(); citMutate(); lostMutate()
  }, [leoMutate, trailMutate, citMutate, lostMutate])

  const handleToggleType = useCallback((type: AlertType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) { next.delete(type) } else { next.add(type) }
      return next
    })
  }, [])

  const handleFABSelect = (type: AlertType) => {
    if (!user) { setAuthOpen(true); return }
    setPlacingPinFor(type)
    setActiveView('map')
  }

  const handlePinPlaced = useCallback((lat: number, lng: number) => {
    if (!isInValidRegion(lat, lng)) {
      toast('Please drop the pin within Marin County / southern Sonoma', 'error')
      return
    }
    setPendingPin({ lat, lng })
    setAddAlertType(placingPinFor)
    setPlacingPinFor(null)
  }, [placingPinFor, toast])

  const handleAddSuccess = () => {
    setPendingPin(null)
    setAddAlertType(null)
    refreshAll()
  }

  const handleShowOnMap = (id: string, lat?: number, lng?: number) => {
    setHighlightedId(id)
    setActiveView('map')
    if (lat != null && lng != null) {
      setFlyTo(prev => ({ lat, lng, v: (prev?.v ?? 0) + 1 }))
    }
    setTimeout(() => setHighlightedId(undefined), 3000)
  }

  const handleGoToMap = useCallback((lat: number, lng: number) => {
    setActiveView('map')
    setFlyTo(prev => ({ lat, lng, v: (prev?.v ?? 0) + 1 }))
  }, [])

  return (
    <div className="h-screen-safe flex flex-col overflow-hidden">
      <TopBar onAuthClick={() => setAuthOpen(true)} />

      <div className="flex-1 overflow-hidden pt-[52px] pb-16 md:pb-0">
        <div className="h-full flex">
          {/* Map */}
          <div className={cn(
            'transition-all duration-300',
            activeView === 'map' ? 'flex-1' : 'hidden md:flex md:flex-[3]',
          )}>
            <MapView
              leoAlerts={leoData?.data ?? []}
              trailAlerts={trailData?.data ?? []}
              citations={citData?.data ?? []}
              lostFound={lostData?.data ?? []}
              activeTypes={activeTypes}
              onAlertClick={(type, data) => setSelectedAlert({ type, data })}
              placingPin={!!placingPinFor}
              onPinPlaced={handlePinPlaced}
              onCancelPin={() => setPlacingPinFor(null)}
              highlightedId={highlightedId}
              mapStyle={mapStyle}
              onMapStyleToggle={() => setMapStyle(s => s === 'topo' ? 'satellite' : 'topo')}
              timeRange={timeRange}
              onToggleType={handleToggleType}
              onTimeRangeChange={setTimeRange}
              showResolved={showResolved}
              onToggleResolved={() => setShowResolved(v => !v)}
              flyTo={flyTo}
            />
          </div>

          {/* Feed */}
          <div className={cn(
            'flex flex-col border-l border-border bg-surface',
            activeView === 'feed' ? 'flex-1' : 'hidden md:flex md:w-[360px] md:flex-none',
          )}>
            <FeedView
              activeTypes={activeTypes}
              onToggleType={handleToggleType}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              showResolved={showResolved}
              onToggleResolved={() => setShowResolved(v => !v)}
              onAlertClick={(type, data) => setSelectedAlert({ type, data })}
              onShowOnMap={handleShowOnMap}
            />
          </div>
        </div>
      </div>

      {!placingPinFor && <AddAlertFAB onSelect={handleFABSelect} />}

      <BottomNav
        activeView={activeView}
        activeTab="leo"
        onViewChange={setActiveView}
        onTabChange={() => {}}
        onProfileClick={() => {}}
        onDMClick={() => {}}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {selectedAlert && (
        <AlertDetailModal
          open
          onClose={() => setSelectedAlert(null)}
          type={selectedAlert.type}
          data={selectedAlert.data}
          onUpdate={refreshAll}
          onGoToMap={handleGoToMap}
        />
      )}

      <AddAlertModal
        open={!!addAlertType && !!pendingPin}
        onClose={() => { setAddAlertType(null); setPendingPin(null) }}
        alertType={addAlertType}
        lat={pendingPin?.lat ?? null}
        lng={pendingPin?.lng ?? null}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="h-screen-safe flex flex-col items-center justify-center bg-base px-6 text-center">
      {/* Logo / wordmark */}
      <div className="mb-8 select-none">
        <div className="text-5xl mb-3">🚵</div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">MHAZ</h1>
        <p className="text-sm text-secondary mt-1">Marin County Trail Alerts</p>
      </div>

      {/* Pitch */}
      <p className="text-secondary text-sm max-w-xs mb-10 leading-relaxed">
        Real-time LEO alerts, trail issues, citations, and lost &amp; found — posted by the Marin MTB community, for the Marin MTB community.
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => { setMode('login'); setAuthOpen(true) }}
          className="w-full py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand/90 active:scale-95 transition-all shadow-modal"
        >
          Sign in
        </button>
        <button
          onClick={() => { setMode('register'); setAuthOpen(true) }}
          className="w-full py-3 rounded-2xl bg-elevated border border-border text-primary font-semibold text-sm hover:bg-border/30 active:scale-95 transition-all"
        >
          Create account
        </button>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={mode} />
    </div>
  )
}
