'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Send, Eye, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Comment, AlertType } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type TrailStatus = 'still_there' | 'cleared'

interface CommentThreadProps {
  alertType: AlertType
  alertId: string
  /** Open trail issues require the commenter to say whether it's still there. */
  requireTrailStatus?: boolean
  onStatusChange?: (confirmed: boolean) => void
}

export function CommentThread({
  alertType, alertId, requireTrailStatus, onStatusChange,
}: CommentThreadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TrailStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate } = useSWR<{ data: Comment[] }>(
    `/api/comments/${alertType}/${alertId}`,
    fetcher
  )

  const comments = data?.data ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !user) return
    if (requireTrailStatus && !status) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${alertType}/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) throw new Error('Failed to post comment')

      // The status the commenter chose is applied to the alert itself, so a
      // comment keeps the report fresh rather than just adding text under it
      if (requireTrailStatus && status) {
        const endpoint = status === 'cleared'
          ? `/api/alerts/trail/${alertId}/resolve`
          : `/api/alerts/trail/${alertId}/confirm`
        await fetch(endpoint, { method: status === 'cleared' ? 'PATCH' : 'POST' })
        onStatusChange?.(status === 'still_there')
        toast(status === 'cleared' ? 'Marked resolved' : 'Marked still there', 'success')
      }

      setBody('')
      setStatus(null)
      mutate()
    } catch {
      toast('Failed to post comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-0">
      {comments.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-muted border border-brand flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-[10px] font-bold text-brand">
                  {comment.user?.handle?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-primary">@{comment.user?.handle}</span>
                  <span className="text-[10px] text-muted">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border">
          {requireTrailStatus && (
            <div className="mb-2.5">
              <p className="text-[11px] font-medium text-secondary mb-1.5">
                Is this still there? <span className="text-citation-light">Required</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'still_there' as const, label: 'Still there', icon: <Eye size={13} />,
                    on: 'bg-trail-bg border-trail-border text-trail-light' },
                  { key: 'cleared' as const, label: "It's cleared", icon: <CheckCircle2 size={13} />,
                    on: 'bg-brand-muted border-brand text-brand' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStatus(opt.key)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium border transition-colors',
                      status === opt.key ? opt.on : 'bg-surface border-border text-secondary hover:text-primary',
                    )}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a comment…"
            className={cn(
              'flex-1 px-3 py-2 rounded-xl text-xs text-primary',
              'bg-surface border border-border',
              'focus:outline-none focus:border-brand transition-colors',
            )}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting || (requireTrailStatus && !status)}
            className="p-2 rounded-xl bg-brand text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-light transition-colors"
          >
            <Send size={14} />
          </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted text-center py-3 mt-3 border-t border-border">
          Sign in to comment
        </p>
      )}
    </div>
  )
}
