'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

interface AddEventModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/** Combines a date input and a time input into an ISO timestamp. */
function toIso(date: string, time: string) {
  if (!date) return null
  return new Date(`${date}T${time || '00:00'}`).toISOString()
}

export function AddEventModal({ open, onClose, onSuccess }: AddEventModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hostedBy, setHostedBy] = useState('')
  const [locationText, setLocationText] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  const reset = () => {
    setTitle(''); setDescription(''); setHostedBy(''); setLocationText('')
    setDate(''); setStartTime('09:00'); setEndTime(''); setPhotos([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const starts_at = toIso(date, startTime)
    if (!title.trim() || !starts_at) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          hosted_by: hostedBy,
          location_text: locationText,
          starts_at,
          ends_at: endTime ? toIso(date, endTime) : null,
          image_url: photos[0] ?? null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create event')
      toast('Event posted!', 'success')
      reset()
      onSuccess()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Post a Ride or Event" size="md">
      <form onSubmit={handleSubmit} className="px-5 pb-6 pt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Title</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Saturday morning Tamarancho loop"
            className={inputClass} required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Start time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              End time <span className="text-muted font-normal">(optional)</span>
            </label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Meeting spot <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text" value={locationText} onChange={e => setLocationText(e.target.value)}
            placeholder="e.g. Tamarancho trailhead parking lot"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Hosted by <span className="text-muted font-normal">(optional — a club or group)</span>
          </label>
          <input
            type="text" value={hostedBy} onChange={e => setHostedBy(e.target.value)}
            placeholder="e.g. Marin Trail Crew"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Image <span className="text-muted font-normal">(optional)</span>
          </label>
          <PhotoPicker photos={photos} onChange={setPhotos} maxPhotos={1} />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Details</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Pace, distance, what to bring, who it's for…"
            rows={3} className={cn(inputClass, 'resize-none')}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" loading={submitting} className="flex-1">Post Event</Button>
        </div>
      </form>
    </Modal>
  )
}

const inputClass = cn(
  'w-full px-3 py-2.5 rounded-xl text-sm text-primary',
  'bg-surface border border-border',
  'focus:outline-none focus:border-brand transition-colors',
  '[&>option]:bg-elevated',
)
