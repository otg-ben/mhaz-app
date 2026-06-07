'use client'

import { Map, List, Mail, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActiveTab } from '@/types'

interface BottomNavProps {
  activeView: 'map' | 'feed' | 'email'
  activeTab: ActiveTab
  onViewChange: (view: 'map' | 'feed' | 'email') => void
  onTabChange: (tab: ActiveTab) => void
  onProfileClick: () => void
  onDMClick: () => void
  unreadDMs?: number
}

export function BottomNav({
  activeView,
  onViewChange,
  onProfileClick,
  onDMClick,
  unreadDMs = 0,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        <NavButton
          icon={<Map size={22} />}
          label="Map"
          active={activeView === 'map'}
          onClick={() => onViewChange('map')}
        />
        <NavButton
          icon={<List size={22} />}
          label="Feed"
          active={activeView === 'feed'}
          onClick={() => onViewChange('feed')}
        />
        <NavButton
          icon={<Mail size={22} />}
          label="MHAZ List"
          active={activeView === 'email'}
          onClick={() => onViewChange('email')}
        />
        <NavButton
          icon={
            <div className="relative">
              <MessageCircle size={22} />
              {unreadDMs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-citation text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                  {unreadDMs > 9 ? '9+' : unreadDMs}
                </span>
              )}
            </div>
          }
          label="DMs"
          active={false}
          onClick={onDMClick}
        />
        <NavButton
          icon={<User size={22} />}
          label="Profile"
          active={false}
          onClick={onProfileClick}
        />
      </div>
    </nav>
  )
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px]',
        active ? 'text-brand' : 'text-muted hover:text-secondary',
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
