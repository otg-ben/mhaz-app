'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Shield, UserCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { UserProfile, UserRole } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminApprovalsPage() {
  const { isMod, isAdmin, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const [busy, setBusy] = useState<string | null>(null)

  const { data, mutate } = useSWR<{ data: UserProfile[] }>(
    isMod ? `/api/admin/users?status=${tab}` : null,
    fetcher,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isMod) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <p className="text-secondary">Access denied</p>
      </div>
    )
  }

  const users = data?.data ?? []

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast(msg, 'success')
      mutate()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id: string, handle: string) => {
    if (!confirm(`Reject and permanently delete @${handle}'s account?`)) return
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast('Account rejected', 'info')
      mutate()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button onClick={() => router.push('/')} className="p-1.5 -ml-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-mhaz" />
            <h1 className="text-sm font-bold text-primary">Account approvals</h1>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3 max-w-2xl mx-auto">
          {(['pending', 'approved'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors',
                tab === t
                  ? 'bg-brand text-base'
                  : 'bg-elevated border border-border text-secondary hover:text-primary',
              )}
            >
              {t}
              {t === 'pending' && tab === 'pending' && users.length > 0 && ` (${users.length})`}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {!data ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-secondary text-sm py-12">
            {tab === 'pending' ? 'No accounts waiting for approval.' : 'No approved accounts yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map(u => (
              <li key={u.id} className="rounded-2xl bg-surface border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-muted border border-brand flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-brand">
                      {u.handle?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-primary truncate">@{u.handle}</p>
                      {u.role && u.role !== 'user' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-mhaz-bg border border-mhaz-border text-[10px] font-semibold uppercase text-mhaz">
                          <Shield size={9} />{u.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary truncate">{u.email}</p>
                    <p className="text-[11px] text-secondary/70 mt-0.5">
                      signed up {timeAgo(u.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {tab === 'pending' ? (
                    <>
                      <Button
                        variant="primary" size="sm" className="flex-1"
                        loading={busy === u.id}
                        onClick={() => patch(u.id, { approved: true }, `@${u.handle} approved`)}
                      >
                        <Check size={14} />Approve
                      </Button>
                      <Button
                        variant="danger" size="sm"
                        loading={busy === u.id}
                        onClick={() => reject(u.id, u.handle)}
                      >
                        <X size={14} />Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <select
                          value={u.role ?? 'user'}
                          disabled={busy === u.id}
                          onChange={e => patch(u.id, { role: e.target.value as UserRole }, `@${u.handle} is now ${e.target.value}`)}
                          className="px-2.5 py-1.5 rounded-xl bg-elevated border border-border text-primary text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                          <option value="user">User</option>
                          <option value="mod">Mod</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        loading={busy === u.id}
                        onClick={() => patch(u.id, { approved: false }, `@${u.handle} access revoked`)}
                      >
                        Revoke access
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
