'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeRange } from '@/types'

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d',  label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y',  label: 'Last 12 mo' },
]

interface TimeRangeDropdownProps {
  value: TimeRange
  onChange: (r: TimeRange) => void
  className?: string
}

export function TimeRangeDropdown({ value, onChange, className }: TimeRangeDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const label = OPTIONS.find(o => o.value === value)?.label ?? value

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
          'bg-elevated border-border text-secondary hover:text-primary',
          open && 'border-brand text-brand',
        )}
      >
        <span>{label}</span>
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 bg-elevated border border-border rounded-2xl shadow-modal z-30 overflow-hidden animate-fade-in min-w-[120px]">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'w-full text-left px-4 py-3 text-sm font-medium transition-colors',
                'hover:bg-border/50',
                value === opt.value
                  ? 'text-brand bg-brand-muted'
                  : 'text-secondary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
