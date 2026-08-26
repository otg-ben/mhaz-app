'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { MessageSquare, Plus, RefreshCw, X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { Button } from '@/components/ui/Button'
import { DiscussionDetail } from './DiscussionDetail'
import { timeAgo, cn } from '@/lib/utils'
import type { Discussion } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function DiscussionFeed() {
  const { toast } = useToast()
  const [openId, setOpenId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [posting, setPosting] = useState(false)

  const { data, isLoading, mutate } = useSWR<{ data: Discussion[] }>('/api/discussions', fetcher)
  const threads = data?.data ?? []

  if (openId) {
    return (
      <DiscussionDetail
        id={openId}
        onBack={() => { setOpenId(null); mutate() }}
        onDeleted={() => { setOpenId(null); mutate() }}
      />
    )
  }

  const post = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, photos }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast('Posted', 'success')
      setTitle(''); setBody(''); setPhotos([]); setComposing(false)
      mutate()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to post', 'error')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center gap-2">
        <p className="text-xs font-medium text-secondary flex-1">
          {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
        </p>
        <button
          onClick={() => mutate()}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && !data ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-2">
            <MessageSquare size={28} className="text-muted" />
            <p className="text-secondary text-sm">Nothing here yet</p>
            <p className="text-muted text-xs">
              Trail conditions, gear questions, who&apos;s riding this weekend — anything goes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className="w-full text-left px-4 py-3.5 hover:bg-elevated/50 active:bg-elevated transition-colors"
              >
                {t.title && <p className="text-[15px] font-semibold text-primary leading-snug">{t.title}</p>}
                <p className={cn('text-sm text-secondary line-clamp-2 leading-relaxed', t.title && 'mt-0.5')}>
                  {t.body}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-muted">
                  <span>@{t.user?.handle ?? '—'}</span>
                  <span>·</span>
                  <span>{timeAgo(t.last_active_at)}</span>
                  {(t.reply_count ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />{t.reply_count}
                      </span>
                    </>
                  )}
                  {(t.reactions?.length ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>{Array.from(new Set((t.reactions ?? []).map(r => r.emoji))).join(' ')}</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {composing ? (
        <form onSubmit={post} className="p-3 border-t border-border bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-secondary">New thread</p>
            <button type="button" onClick={() => setComposing(false)} className="p-1 rounded-lg text-muted hover:text-primary">
              <X size={15} />
            </button>
          </div>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className={inputClass}
          />
          <textarea
            value={body} onChange={e => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={3} className={cn(inputClass, 'resize-none')}
          />
          <PhotoPicker photos={photos} onChange={setPhotos} maxPhotos={3} />
          <Button type="submit" variant="primary" className="w-full" loading={posting} disabled={!body.trim()}>
            Post thread
          </Button>
        </form>
      ) : (
        <div className="p-3 border-t border-border bg-surface">
          <button
            onClick={() => setComposing(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-muted border border-brand text-brand text-sm font-semibold hover:bg-brand/20 active:scale-[0.98] transition-all"
          >
            <Plus size={16} />
            Start a discussion
          </button>
        </div>
      )}
    </div>
  )
}

const inputClass = cn(
  'w-full px-3 py-2 rounded-xl text-sm text-primary',
  'bg-base border border-border',
  'focus:outline-none focus:border-brand transition-colors',
)
