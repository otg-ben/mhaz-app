'use client'

import { Bell, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onAuthClick: () => void
}

export function TopBar({ onAuthClick }: TopBarProps) {
  const { user, profile, isAdmin, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-base font-black text-base leading-none">M</span>
          </div>
          <span className="text-sm font-bold text-primary tracking-wide">MHAZ</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin/queue')}
                  className="p-2 rounded-lg text-mhaz hover:bg-elevated transition-colors"
                  title="Admin Queue"
                >
                  <Shield size={18} />
                </button>
              )}
              <button
                className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
              </button>
              <button
                onClick={() => profile && router.push(`/profile/${profile.handle}`)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-elevated transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-muted border border-brand flex items-center justify-center">
                  <span className="text-xs font-bold text-brand">
                    {profile?.handle?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-sm text-secondary hidden md:block">
                  {profile?.handle}
                </span>
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-secondary hover:text-citation transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={onAuthClick}
              className={cn(
                'px-4 py-1.5 rounded-xl text-sm font-medium',
                'bg-brand text-base hover:bg-brand-light transition-colors',
              )}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
