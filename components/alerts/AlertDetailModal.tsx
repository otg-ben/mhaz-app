'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { MapPin, Clock, User, Bell, BellOff, CheckCircle2, Trash2, Edit2, Navigation } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PhotoViewer } from '@/components/ui/PhotoViewer'
import { CommentThread } from './CommentThread'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatDate, LEO_AGENCY_LABELS, TRAIL_ISSUE_LABELS } from '@/lib/utils'
import { formatCoords } from '@/lib/mapbox/bounds'
import type { LeoAlert, TrailAlert, Citation, LostFoundPost, AlertType } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface AlertDetailModalProps {
  open: boolean
  onClose: () => void
  type: AlertType
  data: LeoAlert | TrailAlert | Citation | LostFoundPost
  onUpdate: () => void
  onGoToMap?: (lat: number, lng: number) => void
}

export function AlertDetailModal({ open, onClose, type, data, onUpdate, onGoToMap }: AlertDetailModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [resolveLoading, setResolveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const photos = type === 'trail' ? ((data as TrailAlert).photos ?? []) : []

  const isOwner = user?.id === data.user_id
  const createdAt = new Date(data.created_at)
  const canEdit = isOwner && (Date.now() - createdAt.getTime()) < 24 * 60 * 60 * 1000

  // Follow state
  const { data: followData, mutate: mutatFollow } = useSWR<{ following: boolean }>(
    user ? `/api/follows/${type}/${data.id}` : null,
    fetcher
  )
  const following = followData?.following ?? false

  const toggleFollow = async () => {
    if (!user) { toast('Sign in to follow alerts', 'info'); return }
    try {
      await fetch(`/api/follows/${type}/${data.id}`, {
        method: following ? 'DELETE' : 'POST',
      })
      mutatFollow()
      toast(following ? 'Unfollowed' : 'Following — you\'ll get email updates', 'success')
    } catch {
      toast('Failed to update follow', 'error')
    }
  }

  const handleResolve = async () => {
    if (!user) return
    setResolveLoading(true)
    try {
      const endpoint =
        type === 'trail' ? `/api/alerts/trail/${data.id}/resolve` :
        `/api/lost-found/${data.id}/resolve`
      const res = await fetch(endpoint, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      toast('Marked as resolved', 'success')
      onUpdate()
      onClose()
    } catch {
      toast('Failed to resolve', 'error')
    } finally {
      setResolveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this alert?')) return
    setDeleteLoading(true)
    try {
      const endpoint =
        type === 'leo' ? `/api/alerts/leo/${data.id}` :
        type === 'trail' ? `/api/alerts/trail/${data.id}` :
        type === 'citation' ? `/api/citations/${data.id}` :
        `/api/lost-found/${data.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast('Alert deleted', 'success')
      onUpdate()
      onClose()
    } catch {
      toast('Failed to delete', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getTypeLabel = () => {
    if (type === 'leo') return LEO_AGENCY_LABELS[(data as LeoAlert).agency]
    if (type === 'trail') return TRAIL_ISSUE_LABELS[(data as TrailAlert).issue_type]
    if (type === 'citation') return LEO_AGENCY_LABELS[(data as Citation).agency]
    if (type === 'lost_found') return (data as LostFoundPost).type === 'lost' ? 'Lost Item' : 'Found Item'
    return ''
  }

  const isResolved =
    (type === 'trail' && (data as TrailAlert).status === 'resolved') ||
    (type === 'lost_found' && (data as LostFoundPost).status === 'resolved')

  const canResolve = user && !isResolved && (type === 'trail' || type === 'lost_found')

  const hasCoords = type !== 'lost_found' || (data as LostFoundPost).lat != null

  return (
    <>
    {viewerIndex !== null && (
      <PhotoViewer
        photos={photos}
        initialIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    )}
    <Modal open={open} onClose={onClose} size="lg">
      <div className="px-5 pt-5 pb-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge type={type} />
              {(data as LeoAlert).source === 'mhaz' && <Badge type="mhaz" />}
              {isResolved && <Badge type="resolved" />}
            </div>
            <h2 className="text-xl font-semibold text-primary">{getTypeLabel()}</h2>
          </div>
          {/* Follow button */}
          {user && (
            <button
              onClick={toggleFollow}
              className="flex-shrink-0 p-2 rounded-xl border border-border hover:bg-elevated transition-colors"
              title={following ? 'Unfollow' : 'Follow'}
            >
              {following
                ? <BellOff size={16} className="text-brand" />
                : <Bell size={16} className="text-secondary" />
              }
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-base text-secondary leading-relaxed">
          {(data as { description: string }).description || <span className="text-muted italic">No description provided</span>}
        </p>

        {/* Go to Map */}
        {onGoToMap && (() => {
          const lat = (data as LeoAlert).lat
          const lng = (data as LeoAlert).long
          const lf = data as LostFoundPost
          const hasCoords = type !== 'lost_found'
            ? (lat != null && lng != null)
            : (lf.lat != null && lf.long != null)
          const coords = type === 'lost_found'
            ? { lat: lf.lat!, lng: lf.long! }
            : { lat, lng }
          if (!hasCoords) return null
          return (
            <button
              onClick={() => { onGoToMap(coords.lat, coords.lng); onClose() }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border text-base text-secondary hover:text-primary hover:border-brand transition-colors w-full"
            >
              <Navigation size={16} className="text-brand flex-shrink-0" />
              <span className="font-medium">Go to map</span>
              <span className="text-sm text-muted ml-auto font-mono">
                {Math.abs(coords.lat).toFixed(4)}°, {Math.abs(coords.lng).toFixed(4)}°
              </span>
            </button>
          )
        })()}

        {/* Photos (trail alerts only) */}
        {photos.length > 0 && (
          <div className="flex gap-2">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => setViewerIndex(i)}
                className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 hover:opacity-90 active:scale-95 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {photos.length > 1 && i === 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    1/{photos.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetaItem icon={<User size={15} />} label="Posted by" value={`@${(data as LeoAlert).user?.handle ?? '—'}`} />
          <MetaItem icon={<Clock size={15} />} label="Posted" value={formatDate(data.created_at)} />
          {hasCoords && type !== 'lost_found' && (
            <MetaItem
              icon={<MapPin size={15} />}
              label="Location"
              value={formatCoords(
                (data as LeoAlert).lat,
                (data as LeoAlert).long,
              )}
              className="col-span-2"
            />
          )}
          {type === 'citation' && (
            <MetaItem
              icon={<Clock size={15} />}
              label="Incident date"
              value={formatDate((data as Citation).incident_date)}
              className="col-span-2"
            />
          )}
          {type === 'trail' && isResolved && (data as TrailAlert).resolved_at && (
            <MetaItem
              icon={<CheckCircle2 size={15} />}
              label="Resolved by"
              value={`@${(data as TrailAlert).resolver?.handle ?? '—'} · ${formatDate((data as TrailAlert).resolved_at!)}`}
              className="col-span-2"
            />
          )}
          {type === 'trail' && isResolved && (data as TrailAlert).resolution_notes && (
            <MetaItem
              label="Resolution notes"
              value={(data as TrailAlert).resolution_notes!}
              className="col-span-2"
            />
          )}
        </div>

        {/* Actions */}
        {(canResolve || canEdit) && (
          <div className="flex gap-2 pt-1">
            {canResolve && (
              <Button
                variant="primary"
                size="sm"
                loading={resolveLoading}
                onClick={handleResolve}
                className="flex-1"
              >
                <CheckCircle2 size={14} />
                Mark Resolved
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="ghost" size="sm" className="px-3">
                  <Edit2 size={14} />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleteLoading}
                  onClick={handleDelete}
                  className="px-3"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">
            Comments
          </h3>
          <CommentThread alertType={type} alertId={data.id} />
        </div>
      </div>
    </Modal>
    </>
  )
}

function MetaItem({
  icon,
  label,
  value,
  className,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <div className="flex items-center gap-1 text-xs text-muted uppercase tracking-wide font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-base text-secondary">{value}</p>
    </div>
  )
}

function cn(...args: (string | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
