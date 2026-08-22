'use client'

import { useState } from 'react'
import { Clock, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'

/**
 * Shown to signed-in accounts that an admin hasn't approved yet.
 * RLS blocks their data access regardless — this just explains why.
 */
export function PendingApproval() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [checking, setChecking] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    await refreshProfile()
    setChecking(false)
    toast('Still awaiting approval', 'info')
  }

  return (
    <div className="h-screen-safe flex flex-col items-center justify-center bg-base px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-mhaz-bg border border-mhaz-border flex items-center justify-center mb-6">
        <Clock size={28} className="text-mhaz" />
      </div>

      <h1 className="text-2xl font-bold text-primary mb-2">Account pending</h1>
      <p className="text-secondary text-sm max-w-xs leading-relaxed mb-8">
        Your account is waiting for approval from a MHAZ admin. You&apos;ll get access
        as soon as it&apos;s reviewed — no need to sign up again.
      </p>

      <div className="w-full max-w-xs rounded-2xl bg-surface border border-border p-4 mb-8 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-muted border border-brand flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-brand">
              {profile?.handle?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">
              {profile?.handle ?? 'Your account'}
            </p>
            <p className="text-xs text-secondary truncate">{profile?.email ?? user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button variant="primary" onClick={handleCheck} loading={checking}>
          <RefreshCw size={15} />
          Check again
        </Button>
        <Button variant="ghost" onClick={signOut}>
          <LogOut size={15} />
          Sign out
        </Button>
      </div>
    </div>
  )
}
