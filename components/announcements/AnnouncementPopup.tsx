'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Megaphone } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Announcement } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

/**
 * Shows the newest live announcement the user hasn't dismissed.
 * Polls so riders already in the app see one posted mid-session.
 */
export function AnnouncementPopup({ enabled }: { enabled: boolean }) {
  const [dismissing, setDismissing] = useState(false)

  const { data, mutate } = useSWR<{ data: Announcement | null }>(
    enabled ? '/api/announcements/active' : null,
    fetcher,
    { refreshInterval: 300000 },
  )
  const announcement = data?.data ?? null

  const dismiss = async () => {
    if (!announcement) return
    setDismissing(true)
    try {
      await fetch(`/api/announcements/${announcement.id}/dismiss`, { method: 'POST' })
    } finally {
      setDismissing(false)
      mutate()
    }
  }

  if (!announcement) return null

  return (
    <Modal open onClose={dismiss} title="" size="md">
      <div className="px-5 pb-6 pt-1 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-mhaz-bg border border-mhaz-border flex items-center justify-center mb-4">
          <Megaphone size={24} className="text-mhaz" />
        </div>

        <h2 className="text-lg font-bold text-primary leading-snug mb-2">
          {announcement.title}
        </h2>

        {announcement.body && (
          <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap text-left mb-4">
            {announcement.body}
          </p>
        )}

        <p className="text-[11px] text-muted mb-5">
          Posted by @{announcement.user?.handle ?? 'MHAZ'} · {formatDate(announcement.starts_at)}
        </p>

        <Button variant="primary" className="w-full" loading={dismissing} onClick={dismiss}>
          Got it
        </Button>
      </div>
    </Modal>
  )
}
