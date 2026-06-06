'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Send } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Comment, AlertType } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface CommentThreadProps {
  alertType: AlertType
  alertId: string
}

export function CommentThread({ alertType, alertId }: CommentThreadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate } = useSWR<{ data: Comment[] }>(
    `/api/comments/${alertType}/${alertId}`,
    fetcher
  )

  const comments = data?.data ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !user) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${alertType}/${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      setBody('')
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
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 pt-4 border-t border-border">
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
            disabled={!body.trim() || submitting}
            className="p-2 rounded-xl bg-brand text-base disabled:opacity-40 hover:bg-brand-light transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted text-center py-3 mt-3 border-t border-border">
          Sign in to comment
        </p>
      )}
    </div>
  )
}
