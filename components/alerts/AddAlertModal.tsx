'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { useToast } from '@/contexts/ToastContext'
import { formatCoords } from '@/lib/mapbox/bounds'
import type { AlertType, LeoAgency, TrailIssueType } from '@/types'
import { cn } from '@/lib/utils'

const LEO_AGENCIES: LeoAgency[] = [
  'Marin County Sheriff', 'MMWD', 'CA State Parks',
  'Marin Open Space & Parks (MCOSD)', 'National Park Service (NPS)',
  'California Highway Patrol (CHP)', 'Local PD', 'Other',
]

const TRAIL_ISSUE_TYPES: { value: TrailIssueType; label: string }[] = [
  { value: 'downed_tree', label: 'Downed Tree' },
  { value: 'washout', label: 'Washout' },
  { value: 'closure', label: 'Trail Closure' },
  { value: 'maintenance', label: 'Maintenance Needed' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'other', label: 'Other' },
]

interface AddAlertModalProps {
  open: boolean
  onClose: () => void
  alertType: AlertType | null
  lat: number | null
  lng: number | null
  onSuccess: () => void
}

export function AddAlertModal({
  open,
  onClose,
  alertType,
  lat,
  lng,
  onSuccess,
}: AddAlertModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  // LEO fields
  const [agency, setAgency] = useState<LeoAgency>('Marin County Sheriff')
  const [description, setDescription] = useState('')

  // Trail fields
  const [issueType, setIssueType] = useState<TrailIssueType>('downed_tree')
  const [photos, setPhotos] = useState<string[]>([])

  // Citation fields
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().slice(0, 16) // datetime-local format
  )

  const title =
    alertType === 'leo' ? 'Report LEO Sighting' :
    alertType === 'trail' ? 'Report Trail Issue' :
    alertType === 'citation' ? 'Report Citation' :
    alertType === 'lost_found' ? 'Post Lost & Found' : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lat || !lng || !alertType) return
    setSubmitting(true)

    try {
      const endpoint =
        alertType === 'leo' ? '/api/alerts/leo' :
        alertType === 'trail' ? '/api/alerts/trail' :
        alertType === 'citation' ? '/api/citations' :
        '/api/lost-found'

      const body: Record<string, unknown> = { lat, long: lng, description }
      if (alertType === 'leo' || alertType === 'citation') body.agency = agency
      if (alertType === 'trail') { body.issue_type = issueType; body.photos = photos }
      if (alertType === 'citation') body.incident_date = new Date(incidentDate).toISOString()
      if (alertType === 'lost_found') body.type = 'lost' // default; could add toggle

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Submission failed')
      }

      toast('Alert posted!', 'success')
      setDescription('')
      setPhotos([])
      onSuccess()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="px-5 pb-6 pt-4 space-y-4">
        {/* Location display */}
        {lat && lng && (
          <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-xl border border-border">
            <span className="text-xs text-muted">📍</span>
            <span className="text-xs text-secondary font-mono">{formatCoords(lat, lng)}</span>
          </div>
        )}

        {/* LEO / Citation: Agency */}
        {(alertType === 'leo' || alertType === 'citation') && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Agency</label>
            <select
              value={agency}
              onChange={e => setAgency(e.target.value as LeoAgency)}
              className={inputClass}
              required
            >
              {LEO_AGENCIES.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {/* Trail: Issue type */}
        {alertType === 'trail' && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TRAIL_ISSUE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIssueType(t.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-medium border transition-colors text-left',
                    issueType === t.value
                      ? 'bg-trail-bg border-trail-border text-trail-light'
                      : 'bg-surface border-border text-secondary hover:text-primary',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Citation: Date/time */}
        {alertType === 'citation' && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Date & Time of Incident</label>
            <input
              type="datetime-local"
              value={incidentDate}
              onChange={e => setIncidentDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        )}

        {/* Lost & Found: Type */}
        {alertType === 'lost_found' && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['lost', 'found'].map(t => (
                <button key={t} type="button" className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize',
                  'bg-lostfound-bg border-lostfound-border text-lostfound',
                )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trail: Photos */}
        {alertType === 'trail' && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Photos <span className="text-muted font-normal">(up to 3, optional)</span>
            </label>
            <PhotoPicker photos={photos} onChange={setPhotos} maxPhotos={3} />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Description
            <span className="text-muted ml-1 font-normal">
              {alertType === 'leo' ? '(optional — direction, description)' :
               alertType === 'trail' ? '(location, severity, etc.)' :
               alertType === 'citation' ? '(circumstances)' : '(item description)'}
            </span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              alertType === 'leo' ? 'e.g. Ranger truck parked at trailhead, heading north on foot' :
              alertType === 'trail' ? 'e.g. Large pine across trail, impassable. About 100m past fork.' :
              alertType === 'citation' ? 'e.g. Issued on Repack Rd, alleged illegal trail use' :
              'Describe the item and where you lost/found it'
            }
            rows={3}
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} className="flex-1">
            Post Alert
          </Button>
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
