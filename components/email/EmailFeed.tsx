'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { timeAgo, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import type { MhazEmail } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EmailFeed() {
  const { data, mutate } = useSWR<{ data: MhazEmail[] }>('/api/mhaz-emails', fetcher)
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState<MhazEmail | null>(null)
  const didSync = useRef(false)

  useEffect(() => {
    if (didSync.current) return
    didSync.current = true

    setSyncing(true)
    fetch('/api/mhaz-emails/sync', { method: 'POST' })
      .then(r => r.json())
      .then(res => { if (res.ingested > 0) mutate() })
      .finally(() => setSyncing(false))
  }, [mutate])

  const emails = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Syncing indicator — only shown when active */}
      {syncing && (
        <div className="flex items-center justify-center gap-2 py-2 border-b border-border text-xs text-muted shrink-0">
          <div className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin" />
          Syncing…
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 && !syncing ? (
          <div className="flex flex-col items-center justify-center h-full text-muted text-sm gap-2">
            <span className="text-2xl">📭</span>
            <span>No messages yet</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {emails.map(email => (
              <EmailRow key={email.id} email={email} onClick={() => setSelected(email)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <EmailDetailModal email={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function EmailRow({ email, onClick }: { email: MhazEmail; onClick: () => void }) {
  const subject = email.subject.replace(/^\[MHAZ\]\s*/i, '').trim()

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 hover:bg-elevated/50 transition-colors active:bg-elevated border-b border-border last:border-0"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-lg font-semibold text-primary leading-snug line-clamp-2">
          {subject}
        </span>
        <span className="text-sm text-muted shrink-0 mt-0.5">
          {timeAgo(email.received_at)}
        </span>
      </div>
      <p className="text-base text-secondary mb-2">
        {email.sender_name || email.sender_email}
      </p>
      <p className="text-base text-muted leading-relaxed line-clamp-2">
        {email.body}
      </p>
    </button>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function EmailDetailModal({ email, onClose }: { email: MhazEmail; onClose: () => void }) {
  const subject = email.subject.replace(/^\[MHAZ\]\s*/i, '').trim()

  return (
    <Modal open onClose={onClose} size="lg">
      <div className="px-5 py-5">
        {/* Subject */}
        <h2 className="text-xl font-bold text-primary leading-snug mb-3 pr-8">
          {subject}
        </h2>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 pb-4 border-b border-border">
          <span className="text-base font-medium text-secondary">
            {email.sender_name || email.sender_email}
          </span>
          {email.sender_name && (
            <span className="text-sm text-muted">{email.sender_email}</span>
          )}
          <span className="text-sm text-muted ml-auto">{formatDate(email.received_at)}</span>
        </div>

        {/* Body */}
        <p className="text-base text-primary leading-relaxed whitespace-pre-wrap">
          {email.body}
        </p>
      </div>
    </Modal>
  )
}
