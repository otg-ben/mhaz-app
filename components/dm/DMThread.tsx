'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DirectMessage, UserProfile } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface DMThreadProps {
  userId: string
  handle: string
  onBack: () => void
  onRead: () => void
}

export function DMThread({ userId, handle, onBack, onRead }: DMThreadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, mutate } = useSWR<{ data: DirectMessage[]; user: Pick<UserProfile, 'id' | 'handle'> }>(
    `/api/dms/${userId}`, fetcher, { refreshInterval: 15000 },
  )
  const messages = data?.data ?? []
  const them = data?.user?.handle ?? handle

  // Opening the thread marks their messages read — refresh the nav badge
  useEffect(() => { if (data) onRead() }, [data, onRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return

    setSending(true)
    try {
      const res = await fetch(`/api/dms/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setDraft('')
      mutate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-base">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-surface shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-muted border border-brand flex items-center justify-center">
          <span className="text-xs font-bold text-brand">{them[0]?.toUpperCase() ?? '?'}</span>
        </div>
        <p className="text-sm font-semibold text-primary">@{them}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {!data ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted text-xs py-8">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map(m => {
            const mine = m.sender_id === user?.id
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[78%] px-3 py-2 rounded-2xl',
                  mine
                    ? 'bg-brand-muted border border-brand rounded-br-md'
                    : 'bg-elevated border border-border rounded-bl-md',
                )}>
                  <p className="text-sm text-primary whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="text-[10px] text-muted mt-1">{timeAgo(m.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-border bg-surface shrink-0">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Message @${them}`}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-primary bg-base border border-border focus:outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="p-2.5 rounded-xl bg-brand text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-light active:scale-95 transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
