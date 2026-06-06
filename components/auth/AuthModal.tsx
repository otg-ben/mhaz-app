'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ open, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, handle)

      if (result.error) {
        setError(result.error)
        return
      }

      toast(mode === 'login' ? 'Welcome back!' : 'Account created!', 'success')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="px-5 py-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center mb-3">
            <span className="text-2xl font-black text-base">M</span>
          </div>
          <h2 className="text-lg font-bold text-primary">
            {mode === 'login' ? 'Sign in to MHAZ' : 'Join MHAZ'}
          </h2>
          <p className="text-xs text-secondary mt-1">
            {mode === 'login'
              ? 'Community trail safety for Marin MTB'
              : 'Submit alerts, comment, and follow updates'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Handle <span className="text-muted">(visible to community)</span>
              </label>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_handle"
                className={inputClass}
                required
                minLength={3}
                maxLength={24}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="text-xs text-citation-light bg-citation-bg border border-citation-border rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            className="text-brand hover:text-brand-light transition-colors font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </Modal>
  )
}

const inputClass = cn(
  'w-full px-3 py-2.5 rounded-xl text-sm text-primary',
  'bg-surface border border-border',
  'focus:outline-none focus:border-brand transition-colors',
  'placeholder:text-muted',
)
