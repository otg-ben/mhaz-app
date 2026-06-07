'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { timeAgo } from '@/lib/utils'
import type { MhazEmail } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EmailFeed() {
  const { data, mutate } = useSWR<{ data: MhazEmail[] }>('/api/mhaz-emails', fetcher)
  const [syncing, setSyncing] = useState(false)
  const didSync = useRef(false)

  // Fire background sync once on mount
  useEffect(() => {
    if (didSync.current) return
    didSync.current = true

    setSyncing(true)
    fetch('/api/mhaz-emails/sync', { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.ingested > 0) mutate()
      })
      .finally(() => setSyncing(false))
  }, [mutate])

  const emails = data?.data ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-primary">MHAZ List</h2>
          <p className="text-[11px] text-muted">From the Google Group</p>
        </div>
        {syncing && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <div className="w-3 h-3 border border-brand border-t-transparent rounded-full animate-spin" />
            Syncing…
          </div>
        )}
      </div>

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
              <EmailRow key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmailRow({ email }: { email: MhazEmail }) {
  const [expanded, setExpanded] = useState(false)

  // Strip "[MHAZ]" prefix from subject for cleaner display
  const subject = email.subject.replace(/^\[MHAZ\]\s*/i, '').trim()

  return (
    <button
      onClick={() => setExpanded(v => !v)}
      className="w-full text-left px-4 py-3 hover:bg-elevated transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-primary leading-snug line-clamp-2">
          {subject}
        </span>
        <span className="text-[10px] text-muted shrink-0 mt-0.5">
          {timeAgo(email.received_at)}
        </span>
      </div>
      <p className="text-[11px] text-secondary mb-1">
        {email.sender_name || email.sender_email}
      </p>
      <p className={`text-xs text-muted whitespace-pre-wrap leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {email.body}
      </p>
    </button>
  )
}
