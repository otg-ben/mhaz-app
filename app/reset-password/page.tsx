'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Status = 'checking' | 'ready' | 'invalid' | 'done'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recovery links arrive as an implicit-flow hash, same as email confirmation
  useEffect(() => {
    const supabase = createClient()

    const run = async () => {
      const hash = window.location.hash
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.slice(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          window.history.replaceState(null, '', window.location.pathname)
          setStatus(error ? 'invalid' : 'ready')
          return
        }
      }
      if (hash.includes('error')) { setStatus('invalid'); return }

      // Already signed in (e.g. changing password from inside the app)
      const { data: { session } } = await supabase.auth.getSession()
      setStatus(session ? 'ready' : 'invalid')
    }

    run()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Use at least 6 characters'); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      setStatus('done')
      toast('Password updated', 'success')
      setTimeout(() => router.push('/'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen-safe flex flex-col items-center justify-center bg-base px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-muted border border-brand flex items-center justify-center mb-5">
        <KeyRound size={24} className="text-brand" />
      </div>

      {status === 'checking' && (
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      )}

      {status === 'invalid' && (
        <>
          <h1 className="text-lg font-bold text-primary mb-2">This link has expired</h1>
          <p className="text-secondary text-sm max-w-xs mb-6 leading-relaxed">
            Reset links are single-use and time-limited. Request a fresh one from the sign-in screen.
          </p>
          <Button variant="primary" className="w-full max-w-xs" onClick={() => router.push('/')}>
            Back to sign in
          </Button>
        </>
      )}

      {status === 'done' && (
        <>
          <h1 className="text-lg font-bold text-primary mb-2">Password updated</h1>
          <p className="text-secondary text-sm">Taking you back to MHAZ…</p>
        </>
      )}

      {status === 'ready' && (
        <>
          <h1 className="text-lg font-bold text-primary mb-1">Set a new password</h1>
          <p className="text-secondary text-sm mb-6">Pick something you&apos;ll remember.</p>

          <form onSubmit={submit} className="w-full max-w-xs space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">New password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={inputClass} required minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Confirm password</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className={inputClass} required minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-xs text-citation-light bg-citation-bg border border-citation-border rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" loading={saving} className="w-full">
              Update password
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

const inputClass = cn(
  'w-full px-3 py-2.5 rounded-xl text-sm text-primary',
  'bg-surface border border-border',
  'focus:outline-none focus:border-brand transition-colors',
)
