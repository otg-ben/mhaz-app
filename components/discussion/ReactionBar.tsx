'use client'

import { useState } from 'react'
import { SmilePlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { REACTION_EMOJIS, type Reaction, type ReactionEmoji } from '@/types'

interface ReactionBarProps {
  targetType: 'discussion' | 'reply'
  targetId: string
  reactions: Reaction[]
  onChange: () => void
}

export function ReactionBar({ targetType, targetId, reactions, onChange }: ReactionBarProps) {
  const { user } = useAuth()
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)

  // Only show emojis someone actually used, so the row stays short
  const counts = REACTION_EMOJIS
    .map(emoji => ({
      emoji,
      count: reactions.filter(r => r.emoji === emoji).length,
      mine: reactions.some(r => r.emoji === emoji && r.user_id === user?.id),
    }))
    .filter(r => r.count > 0)

  const toggle = async (emoji: ReactionEmoji) => {
    setBusy(true)
    setPicking(false)
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, emoji }),
      })
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {counts.map(({ emoji, count, mine }) => (
        <button
          key={emoji}
          disabled={busy}
          onClick={e => { e.stopPropagation(); toggle(emoji) }}
          className={cn(
            'flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full border text-xs transition-colors',
            mine
              ? 'bg-brand-muted border-brand text-brand'
              : 'bg-elevated border-border text-secondary hover:text-primary',
          )}
        >
          <span className="text-[13px] leading-none">{emoji}</span>
          <span className="font-medium">{count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={e => { e.stopPropagation(); setPicking(p => !p) }}
          className="p-1 rounded-full text-muted hover:text-primary hover:bg-elevated transition-colors"
          title="Add reaction"
        >
          <SmilePlus size={15} />
        </button>

        {picking && (
          <>
            <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setPicking(false) }} />
            <div className="absolute bottom-full left-0 mb-1 z-20 flex gap-0.5 px-1.5 py-1 rounded-xl bg-elevated border border-border shadow-modal">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={e => { e.stopPropagation(); toggle(emoji) }}
                  className="text-lg leading-none p-1 rounded-lg hover:bg-surface transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
