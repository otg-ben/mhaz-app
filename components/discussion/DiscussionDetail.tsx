'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PhotoViewer } from '@/components/ui/PhotoViewer'
import { Button } from '@/components/ui/Button'
import { ReactionBar } from './ReactionBar'
import { timeAgo } from '@/lib/utils'
import type { Discussion } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface DiscussionDetailProps {
  id: string
  onBack: () => void
  onDeleted: () => void
}

export function DiscussionDetail({ id, onBack, onDeleted }: DiscussionDetailProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)

  const { data, mutate } = useSWR<{ data: Discussion; error?: string }>(
    `/api/discussions/${id}`, fetcher,
    {
      // Stop polling once the thread is gone, or a reader left on a deleted
      // thread would 404 in a loop forever
      refreshInterval: latest => (latest?.data ? 20000 : 0),
    },
  )
  const thread = data?.data
  const missing = !!data && !data.data

  const reply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/discussions/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setDraft('')
      mutate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to reply', 'error')
    } finally {
      setSending(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this thread and all its replies?')) return
    try {
      const res = await fetch(`/api/discussions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast('Thread deleted', 'success')
      onDeleted()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-base px-8 text-center gap-3">
        <p className="text-secondary text-sm">This thread was deleted.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>Back to discussions</Button>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full bg-base">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isOwner = user?.id === thread.user_id

  return (
    <div className="flex flex-col h-full bg-base">
      {viewer !== null && thread.photos?.length > 0 && (
        <PhotoViewer photos={thread.photos} initialIndex={viewer} onClose={() => setViewer(null)} />
      )}

      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-surface shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors">
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-primary flex-1 truncate">Discussion</p>
        {isOwner && (
          <button onClick={remove} className="p-1.5 rounded-lg text-secondary hover:text-citation transition-colors" title="Delete thread">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Original post */}
        <div className="px-4 py-4 border-b border-border">
          {thread.title && <h2 className="text-base font-bold text-primary mb-1.5">{thread.title}</h2>}
          <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">{thread.body}</p>

          {thread.photos?.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {thread.photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p} src={p} alt="" onClick={() => setViewer(i)}
                  className="w-20 h-20 rounded-xl object-cover border border-border cursor-zoom-in"
                />
              ))}
            </div>
          )}

          <p className="text-xs text-muted mt-2">
            @{thread.user?.handle ?? '—'} · {timeAgo(thread.created_at)}
          </p>

          <div className="mt-2.5">
            <ReactionBar
              targetType="discussion" targetId={thread.id}
              reactions={thread.reactions ?? []} onChange={() => mutate()}
            />
          </div>
        </div>

        {/* Replies */}
        {(thread.replies ?? []).length === 0 ? (
          <p className="text-center text-muted text-xs py-8">No replies yet — start it off.</p>
        ) : (
          <div className="divide-y divide-border">
            {(thread.replies ?? []).map(r => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-muted border border-brand flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-brand">
                      {r.user?.handle?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted mb-0.5">
                      @{r.user?.handle ?? '—'} · {timeAgo(r.created_at)}
                    </p>
                    <p className="text-sm text-primary whitespace-pre-wrap break-words">{r.body}</p>
                    <div className="mt-1.5">
                      <ReactionBar
                        targetType="reply" targetId={r.id}
                        reactions={r.reactions ?? []} onChange={() => mutate()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={reply} className="flex items-center gap-2 p-3 border-t border-border bg-surface shrink-0">
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="Add a reply…"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm text-primary bg-base border border-border focus:outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit" disabled={!draft.trim() || sending}
          className="p-2.5 rounded-xl bg-brand text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-light active:scale-95 transition-all"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
