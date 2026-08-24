'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { MapView } from '@/components/map/MapView'
import { FeedView } from '@/components/feed/FeedView'
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal'
import { AddAlertModal } from '@/components/alerts/AddAlertModal'
import { AddAlertFAB } from '@/components/alerts/AddAlertFAB'
import { BottomNav } from '@/components/layout/BottomNav'
import { CommunityView } from '@/components/community/CommunityView'
import { EventDetailModal } from '@/components/events/EventDetailModal'
import { DMView } from '@/components/dm/DMView'
import { AnnouncementPopup } from '@/components/announcements/AnnouncementPopup'
import { TopBar } from '@/components/layout/TopBar'
import { AuthModal } from '@/components/auth/AuthModal'
import { PendingApproval } from '@/components/auth/PendingApproval'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { isInValidRegion } from '@/lib/mapbox/bounds'
import type {
  AlertType, FeedFilterType, LeoAlert, TrailAlert, Citation,
  TimeRange, SelectedAlert, ActiveView, EventPost,
} from '@/types'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const ALL_TYPES = new Set<FeedFilterType>(['advisory', 'leo', 'trail', 'citation', 'mhaz'])

export default function HomePage() {
  const { user, profile, isApproved, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // All hooks must be declared before any conditional return
  const [activeView, setActiveView] = useState<ActiveView>('map')
  const [mapStyle, setMapStyle] = useState<'topo' | 'satellite'>('topo')
  const [activeTypes, setActiveTypes] = useState<Set<FeedFilterType>>(new Set(ALL_TYPES))
  const [timeRange, setTimeRange] = useState<TimeRange>('14d')
  const [showResolved, setShowResolved] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | undefined>()
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; v: number } | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<SelectedAlert | null>(null)
  const [addAlertType, setAddAlertType] = useState<AlertType | null>(null)
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null)
  const [placingPinFor, setPlacingPinFor] = useState<AlertType | null>(null)
  const [placingAdvisory, setPlacingAdvisory] = useState(false)
  const [addAdvisory, setAddAdvisory] = useState(false)
  const [initialPinPos, setInitialPinPos] = useState<{ lat: number; lng: number } | null>(null)
  const [communityKey, setCommunityKey] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState<EventPost | null>(null)
  const [dmTarget, setDmTarget] = useState<{ id: string; handle: string } | null>(null)

  const { data: leoData,   mutate: leoMutate }   = useSWR<{ data: LeoAlert[] }>(
    user ? `/api/alerts/leo?range=${timeRange}` : null, fetcher)
  const { data: trailData, mutate: trailMutate } = useSWR<{ data: TrailAlert[] }>(
    user ? `/api/alerts/trail?range=${timeRange}&resolved=${showResolved}` : null, fetcher)
  const { data: citData,   mutate: citMutate }   = useSWR<{ data: Citation[] }>(
    user ? `/api/citations?range=${timeRange}` : null, fetcher)

  const { data: unreadData, mutate: unreadMutate } = useSWR<{ count: number }>(
    user ? '/api/dms/unread' : null, fetcher, { refreshInterval: 30000 })

  const refreshAll = useCallback(() => {
    leoMutate(); trailMutate(); citMutate()
  }, [leoMutate, trailMutate, citMutate])

  const handleToggleType = useCallback((type: FeedFilterType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) { next.delete(type) } else { next.add(type) }
      return next
    })
  }, [])

  // Lost & found is posted straight from the Community tab — no pin required
  const handleCreateLostFound = useCallback(() => {
    setPendingPin(null)
    setAddAdvisory(false)
    setAddAlertType('lost_found')
  }, [])

  // Profile pages link back here as /?dm=<id>&handle=<handle>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('dm')
    const handle = params.get('handle')
    if (id && handle) {
      setDmTarget({ id, handle })
      setActiveView('dms')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handleFABSelect = (type: AlertType, advisory = false) => {
    setPlacingPinFor(type)
    setPlacingAdvisory(advisory)
    setActiveView('map')

    // Jump to user's current location and pre-place the pin there
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        if (!isInValidRegion(lat, lng)) return
        setFlyTo(prev => ({ lat, lng, v: (prev?.v ?? 0) + 1 }))
        setInitialPinPos({ lat, lng })
      },
      () => {}, // denied or unavailable — fall back to manual tap
      { timeout: 8000, maximumAge: 30000 }
    )
  }

  const handlePinPlaced = useCallback((lat: number, lng: number) => {
    if (!isInValidRegion(lat, lng)) {
      toast('Please drop the pin within Marin County / southern Sonoma', 'error')
      return
    }
    setPendingPin({ lat, lng })
    setAddAlertType(placingPinFor)
    setAddAdvisory(placingAdvisory)
    setPlacingPinFor(null)
  }, [placingPinFor, placingAdvisory, toast])

  const handleAddSuccess = () => {
    setPendingPin(null)
    setAddAlertType(null)
    setAddAdvisory(false)
    setInitialPinPos(null)
    setCommunityKey(k => k + 1)
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

  // Auth gate — after all hooks
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

  // Signed in but not yet let in by an admin — RLS blocks their data either way
  if (profile && !isApproved) {
    return <PendingApproval />
  }

  return (
    <div className="h-screen-safe flex flex-col overflow-hidden">
      <TopBar onAuthClick={() => setAuthOpen(true)} />

      <div className="flex-1 overflow-hidden pt-[52px] pb-16">
        <div className="h-full flex">
          {/* Map */}
          <div className={cn(
            'transition-all duration-300',
            activeView === 'map' ? 'flex-1'
              : activeView === 'feed' ? 'hidden md:flex md:flex-[3]'
              : 'hidden md:flex md:flex-1',
          )}>
            <MapView
              leoAlerts={leoData?.data ?? []}
              trailAlerts={trailData?.data ?? []}
              citations={citData?.data ?? []}
              activeTypes={activeTypes}
              onAlertClick={(type, data) => setSelectedAlert({ type, data })}
              placingPin={!!placingPinFor}
              onPinPlaced={handlePinPlaced}
              onCancelPin={() => { setPlacingPinFor(null); setPlacingAdvisory(false); setInitialPinPos(null) }}
              initialPinPos={initialPinPos}
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
            'flex-col border-l border-border bg-surface',
            activeView === 'feed' ? 'flex flex-1'
              : activeView === 'map' ? 'hidden md:flex md:w-[360px] md:flex-none'
              : 'hidden',
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

          {/* Community — lost & found + events */}
          <div className={cn(
            'flex-col border-l border-border',
            activeView === 'community' ? 'flex flex-1 md:w-[420px] md:flex-none' : 'hidden',
          )}>
            <CommunityView
              onPostClick={post => setSelectedAlert({ type: 'lost_found', data: post })}
              onEventClick={setSelectedEvent}
              onCreateLostFound={handleCreateLostFound}
              refreshKey={communityKey}
            />
          </div>

          {/* Direct messages */}
          <div className={cn(
            'flex-col border-l border-border bg-surface',
            activeView === 'dms' ? 'flex flex-1 md:w-[420px] md:flex-none' : 'hidden',
          )}>
            <DMView
              initialThreadUser={dmTarget}
              onThreadOpened={() => setDmTarget(null)}
              onUnreadChange={() => unreadMutate()}
            />
          </div>
        </div>
      </div>

      {!placingPinFor && (activeView === 'map' || activeView === 'feed') && (
        <AddAlertFAB onSelect={handleFABSelect} />
      )}

      <BottomNav
        activeView={activeView}
        onViewChange={setActiveView}
        unreadDMs={unreadData?.count ?? 0}
      />

      <AnnouncementPopup enabled={!!user && isApproved} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {selectedAlert && (
        <AlertDetailModal
          open
          onClose={() => setSelectedAlert(null)}
          type={selectedAlert.type}
          data={selectedAlert.data}
          onUpdate={refreshAll}
          onGoToMap={handleGoToMap}
          onMessageUser={(id, handle) => {
            setSelectedAlert(null)
            setDmTarget({ id, handle })
            setActiveView('dms')
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          open
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          onUpdate={() => setCommunityKey(k => k + 1)}
        />
      )}

      <AddAlertModal
        open={!!addAlertType && (!!pendingPin || addAlertType === 'lost_found')}
        onClose={() => { setAddAlertType(null); setPendingPin(null); setAddAdvisory(false) }}
        alertType={addAlertType}
        advisory={addAdvisory}
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
