'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { CalendarDays, MapPin, User, Users, Check, X, Trash2, Send } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PhotoViewer } from '@/components/ui/PhotoViewer'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatEventWhen, goingCount, myRsvp } from '@/lib/events'
import { cn } from '@/lib/utils'
import type { EventPost, RsvpStatus } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface EventDetailModalProps {
  open: boolean
  onClose: () => void
  event: EventPost
  onUpdate: () => void
}

export function EventDetailModal({ open, onClose, event: initial, onUpdate }: EventDetailModalProps) {
  // Re-fetch so RSVP taps update the button state and attendee list immediately
  const { data, mutate } = useSWR<{ data: EventPost }>(`/api/events/${initial.id}`, fetcher)
  const event = data?.data ?? initial

  const { user } = useAuth()
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcast, setBroadcast] = useState('')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const isOwner = user?.id === event.user_id
  const mine = myRsvp(event, user?.id)
  const going = (event.rsvps ?? []).filter(r => r.status === 'going')
  const isPast = new Date(event.ends_at ?? event.starts_at) < new Date()

  const setRsvp = async (status: RsvpStatus) => {
    setBusy(true)
    try {
      // Tapping your current answer clears it
      const res = mine === status
        ? await fetch(`/api/events/${event.id}/rsvp`, { method: 'DELETE' })
        : await fetch(`/api/events/${event.id}/rsvp`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      onUpdate()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to RSVP', 'error')
    } finally {
      setBusy(false)
    }
  }

  const sendBroadcast = async () => {
    if (!broadcast.trim()) return
    setSendingBroadcast(true)
    try {
      const res = await fetch(`/api/events/${event.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: broadcast }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast(`Message sent to ${json.sent} ${json.sent === 1 ? 'rider' : 'riders'}`, 'success')
      setBroadcast('')
      setBroadcastOpen(false)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to send', 'error')
    } finally {
      setSendingBroadcast(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast('Event deleted', 'success')
      onUpdate()
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {viewerOpen && event.image_url && (
        <PhotoViewer photos={[event.image_url]} onClose={() => setViewerOpen(false)} />
      )}

      <Modal open={open} onClose={onClose} title="Ride / Event" size="md">
        <div className="px-5 pb-6 pt-1 space-y-4">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_url}
              alt=""
              onClick={() => setViewerOpen(true)}
              className="w-full max-h-56 object-cover rounded-2xl border border-border cursor-zoom-in"
            />
          )}

          <div>
            <h2 className="text-lg font-bold text-primary leading-snug">{event.title}</h2>
            {isPast && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-elevated border border-border text-[10px] font-semibold uppercase text-muted">
                This event has passed
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{event.description}</p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <MetaRow icon={<CalendarDays size={15} />} label="When" value={formatEventWhen(event)} />
            {event.location_text && <MetaRow icon={<MapPin size={15} />} label="Where" value={event.location_text} />}
            <MetaRow
              icon={<User size={15} />}
              label="Organizer"
              value={event.hosted_by ? `${event.hosted_by} · @${event.user?.handle ?? '—'}` : `@${event.user?.handle ?? '—'}`}
            />
          </div>

          {/* RSVP */}
          {!isPast && (
            <div>
              <p className="text-xs font-medium text-secondary mb-2">Are you going?</p>
              <div className="flex gap-2">
                <Button
                  variant={mine === 'going' ? 'primary' : 'secondary'}
                  size="sm" className="flex-1" loading={busy}
                  onClick={() => setRsvp('going')}
                >
                  <Check size={14} />Going
                </Button>
                <Button
                  variant={mine === 'not_going' ? 'danger' : 'secondary'}
                  size="sm" className="flex-1" loading={busy}
                  onClick={() => setRsvp('not_going')}
                >
                  <X size={14} />Can&apos;t make it
                </Button>
              </div>
              {mine && (
                <p className="text-[11px] text-muted mt-1.5">
                  Tap your answer again to clear it.
                </p>
              )}
            </div>
          )}

          {/* Attendees */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-muted" />
              <p className="text-xs font-medium text-secondary">
                {goingCount(event)} going
              </p>
            </div>
            {going.length === 0 ? (
              <p className="text-xs text-muted">No one has RSVP&apos;d yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {going.map(r => (
                  <span key={r.id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-elevated border border-border">
                    <span className="w-5 h-5 rounded-full bg-brand-muted border border-brand flex items-center justify-center">
                      <span className="text-[9px] font-bold text-brand">
                        {r.user?.handle?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </span>
                    <span className="text-[11px] text-secondary">@{r.user?.handle ?? '—'}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="space-y-3 pt-1">
              {/* Reach everyone who said they're coming */}
              {goingCount(event) > 0 && !isPast && (
                broadcastOpen ? (
                  <div className="rounded-2xl bg-surface border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-secondary">
                      Message {goingCount(event)} attending {goingCount(event) === 1 ? 'rider' : 'riders'}
                    </p>
                    <textarea
                      value={broadcast}
                      onChange={e => setBroadcast(e.target.value)}
                      rows={3}
                      placeholder="e.g. Start moved to 9:30 — trail's still wet at the top"
                      className="w-full px-3 py-2 rounded-xl text-sm text-primary bg-base border border-border focus:outline-none focus:border-brand transition-colors resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="secondary" size="sm" className="flex-1"
                        onClick={() => { setBroadcastOpen(false); setBroadcast('') }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary" size="sm" className="flex-1"
                        loading={sendingBroadcast}
                        disabled={!broadcast.trim()}
                        onClick={sendBroadcast}
                      >
                        <Send size={14} />Send
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted">
                      Sent as a direct message — riders can reply to you.
                    </p>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setBroadcastOpen(true)}>
                    <Send size={14} />Message attendees
                  </Button>
                )
              )}

              <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete} className="px-3">
                <Trash2 size={14} />Delete event
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface border border-border')}>
      <span className="text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm text-primary">{value}</p>
      </div>
    </div>
  )
}
