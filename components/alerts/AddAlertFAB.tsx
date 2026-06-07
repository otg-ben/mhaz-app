'use client'

import { useState } from 'react'
import { Plus, X, AlertTriangle, ShieldAlert, FileWarning, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertType } from '@/types'

interface AddAlertFABProps {
  onSelect: (type: AlertType) => void
  disabled?: boolean
}

const ALERT_OPTIONS: {
  type: AlertType
  label: string
  icon: React.ReactNode
  color: string
  bgColor: string
}[] = [
  { type: 'leo', label: 'LEO Sighting', icon: <ShieldAlert size={18} />, color: 'text-leo-light', bgColor: 'bg-leo-bg border-leo-border' },
  { type: 'trail', label: 'Trail Issue', icon: <AlertTriangle size={18} />, color: 'text-trail-light', bgColor: 'bg-trail-bg border-trail-border' },
  { type: 'citation', label: 'Citation', icon: <FileWarning size={18} />, color: 'text-citation-light', bgColor: 'bg-citation-bg border-citation-border' },
  { type: 'lost_found', label: 'Lost & Found', icon: <Search size={18} />, color: 'text-lostfound-light', bgColor: 'bg-lostfound-bg border-lostfound-border' },
]

export function AddAlertFAB({ onSelect, disabled }: AddAlertFABProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (type: AlertType) => {
    setOpen(false)
    onSelect(type)
  }

  return (
    <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-2 md:bottom-6">
      {/* Options */}
      {open && (
        <div className="flex flex-col items-end gap-2 animate-slide-up">
          {ALERT_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl border',
                'text-sm font-medium shadow-modal backdrop-blur-sm',
                opt.bgColor, opt.color,
                'hover:scale-[1.02] active:scale-[0.98] transition-transform',
              )}
            >
              {opt.label}
              <span className={opt.color}>{opt.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-14 h-14 rounded-full shadow-modal flex items-center justify-center',
          'transition-all active:scale-95',
          open
            ? 'bg-border text-secondary rotate-45'
            : 'bg-brand text-base hover:bg-brand-light',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        {open ? <X size={22} /> : <Plus size={22} />}
      </button>
    </div>
  )
}
