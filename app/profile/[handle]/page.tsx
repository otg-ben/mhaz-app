'use client'

import { use } from 'react'
import useSWR from 'swr'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import type { UserProfile } from '@/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params)
  const { profile: myProfile } = useAuth()

  // Fetch profile data
  const { data } = useSWR<{ data: UserProfile }>(
    `/api/profile/${handle}`,
    fetcher
  )

  const profile = data?.data
  const isMe = myProfile?.handle === handle

  if (!profile) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-muted border-2 border-brand flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-brand">
              {profile.handle[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-primary">@{profile.handle}</h1>
            {profile.bio && <p className="text-sm text-secondary mt-1">{profile.bio}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        {isMe && (
          <p className="text-xs text-muted text-center py-4 bg-surface rounded-xl border border-border">
            Profile editing coming soon
          </p>
        )}
      </div>
    </div>
  )
}
