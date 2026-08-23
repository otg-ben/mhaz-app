'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import { formatDate, cn } from '@/lib/utils'
import type { Announcement } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface AddAnnouncementModalProps {
  open: boolean
  onClose: () => void
}

export function AddAnnouncementModal({ open, onClose }: AddAnnouncementModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scheduled, setScheduled] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('08:00')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate } = useSWR<{ data: Announcement[] }>(open ? '/api/announcements' : null, fetcher)
  const existing = data?.data ?? []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          starts_at: scheduled && date ? new Date(`${date}T${time}`).toISOString() : null,
          ends_at: endDate ? new Date(`${endDate}T23:59`).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast(scheduled && date ? 'Announcement scheduled' : 'Announcement posted', 'success')
      setTitle(''); setBody(''); setScheduled(false); setDate(''); setEndDate('')
      mutate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to post', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    toast('Announcement removed', 'info')
    mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="Post an announcement" size="md">
      <form onSubmit={submit} className="px-5 pb-6 pt-4 space-y-4">
        <p className="text-xs text-secondary leading-relaxed">
          This pops up for every rider the next time they open the app. Each person sees it once.
        </p>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Title</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Trail closure on Repack this weekend"
            className={inputClass} required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">Message</label>
          <textarea
            value={body} onChange={e => setBody(e.target.value)}
            rows={4} placeholder="The details riders need to know…"
            className={cn(inputClass, 'resize-none')}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={scheduled} onChange={() => setScheduled(v => !v)} className="accent-brand w-3.5 h-3.5" />
          <span className="text-xs text-secondary">Schedule for later</span>
        </label>

        {scheduled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Stop showing after <span className="text-muted font-normal">(optional)</span>
          </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Close</Button>
          <Button type="submit" variant="primary" loading={submitting} className="flex-1">
            {scheduled && date ? 'Schedule' : 'Post now'}
          </Button>
        </div>

        {existing.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-secondary mb-2">Recent announcements</p>
            <ul className="space-y-1.5">
              {existing.slice(0, 5).map(a => {
                const pending = new Date(a.starts_at) > new Date()
                return (
                  <li key={a.id} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-surface border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{a.title}</p>
                      <p className="text-[11px] text-muted">
                        {pending ? `scheduled for ${formatDate(a.starts_at)}` : formatDate(a.starts_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      className="p-1 rounded-lg text-muted hover:text-citation transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  )
}

const inputClass = cn(
  'w-full px-3 py-2.5 rounded-xl text-sm text-primary',
  'bg-surface border border-border',
  'focus:outline-none focus:border-brand transition-colors',
)
