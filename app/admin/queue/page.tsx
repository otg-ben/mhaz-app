'use client'

import useSWR from 'swr'
import { useAuth } from '@/contexts/AuthContext'
import { timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'
import type { MhazQueueItem, AlertType } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminQueuePage() {
  const { isAdmin, loading } = useAuth()
  const { toast } = useToast()

  const { data, mutate } = useSWR<{ data: MhazQueueItem[] }>(
    isAdmin ? '/api/admin/mhaz/queue' : null,
    fetcher
  )

  if (loading) return <div className="flex items-center justify-center h-screen bg-base"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
  if (!isAdmin) return <div className="flex items-center justify-center h-screen bg-base"><p className="text-secondary">Access denied</p></div>

  const items = data?.data ?? []
  const pending = items.filter(i => i.approved === null)

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mhaz/queue/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast('Approved and published', 'success')
      mutate()
    } catch {
      toast('Failed to approve', 'error')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mhaz/queue/${id}/reject`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast('Rejected', 'info')
      mutate()
    } catch {
      toast('Failed to reject', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-primary">MHAZ Ingestion Queue</h1>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-mhaz-bg border border-mhaz-border text-mhaz text-xs font-semibold rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12 text-secondary text-sm">
            Queue is empty — all caught up
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(item => (
              <div key={item.id} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        type={item.classification === 'unclassified' ? 'mhaz' : (item.classification.replace('_issue', '') as AlertType)}
                        label={item.classification}
                      />
                      <span className="text-[10px] text-muted">
                        {Math.round((item.confidence ?? 0) * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm font-medium text-primary">{item.subject}</p>
                    <p className="text-xs text-muted">{item.sender} · {timeAgo(item.received_at)}</p>
                  </div>
                </div>
                <p className="text-xs text-secondary bg-base rounded-xl px-3 py-2 font-mono whitespace-pre-wrap line-clamp-4">
                  {item.raw_email_body}
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleApprove(item.id)} className="flex-1">
                    Approve & Publish
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleReject(item.id)} className="flex-1">
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
