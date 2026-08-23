'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Mail, MapPin, MessageCircle, Shield, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { formatDate, cn } from '@/lib/utils'
import type { UserProfile } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProfilePage({ params }: { params: { handle: string } }) {
  const { handle } = params
  const { profile: myProfile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const { data, error, isLoading, mutate } = useSWR<{ data: UserProfile }>(
    `/api/profile/${handle}`, fetcher,
  )
  const profile = data?.data
  const isMe = !!profile && profile.id === myProfile?.id

  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [wantedHandle, setWantedHandle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '')
      setLocation(profile.location ?? '')
    }
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-secondary text-sm">No rider found with that name.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/')}>Back to MHAZ</Button>
      </div>
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { bio, location }
      if (wantedHandle.trim()) body.requested_handle = wantedHandle.trim()

      const res = await fetch(`/api/profile/${profile.handle}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error)

      toast(
        wantedHandle.trim() ? 'Saved — your name change is awaiting admin approval' : 'Profile updated',
        'success',
      )
      setWantedHandle('')
      setEditing(false)
      mutate()
      refreshProfile()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 -ml-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-bold text-primary">Rider profile</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-muted border-2 border-brand flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-brand">
              {profile.handle[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-primary">@{profile.handle}</h2>
              {profile.role && profile.role !== 'user' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-mhaz-bg border border-mhaz-border text-[10px] font-semibold uppercase text-mhaz">
                  <Shield size={9} />{profile.role}
                </span>
              )}
            </div>
            {profile.bio && !editing && (
              <p className="text-sm text-secondary mt-1 whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>

        {!editing && (
          <div className="space-y-2 mb-6">
            <Row icon={<Mail size={15} />} label="Email" value={profile.email} />
            {profile.location && <Row icon={<MapPin size={15} />} label="Location" value={profile.location} />}
            <Row icon={<CalendarDays size={15} />} label="Joined" value={formatDate(profile.created_at)} />
          </div>
        )}

        {isMe && profile.pending_handle && !editing && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-mhaz-bg border border-mhaz-border mb-4">
            <Clock size={15} className="text-mhaz mt-0.5 shrink-0" />
            <p className="text-xs text-mhaz-light">
              Name change to <strong>@{profile.pending_handle}</strong> is waiting on an admin.
            </p>
          </div>
        )}

        {isMe ? (
          editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Bio</label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)} rows={3}
                  placeholder="What you ride, where you ride it…"
                  className={cn(inputClass, 'resize-none')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Location</label>
                <input
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Fairfax" className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">
                  Change display name <span className="text-muted font-normal">(needs admin approval)</span>
                </label>
                <input
                  type="text" value={wantedHandle} onChange={e => setWantedHandle(e.target.value)}
                  placeholder={profile.handle} className={inputClass}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => { setEditing(false); setWantedHandle('') }}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" loading={saving} onClick={save}>Save</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )
        ) : (
          <Button
            variant="secondary" className="w-full"
            onClick={() => router.push(`/?dm=${profile.id}&handle=${encodeURIComponent(profile.handle)}`)}
          >
            <MessageCircle size={15} />
            Message @{profile.handle}
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-surface border border-border">
      <span className="text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm text-primary break-words">{value}</p>
      </div>
    </div>
  )
}

const inputClass = cn(
  'w-full px-3 py-2.5 rounded-xl text-sm text-primary',
  'bg-surface border border-border',
  'focus:outline-none focus:border-brand transition-colors',
)
