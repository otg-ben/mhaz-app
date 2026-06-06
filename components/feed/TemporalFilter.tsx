'use client'

import { cn } from '@/lib/utils'
import { TIME_RANGE_LABELS } from '@/types'
import type { TimeRange } from '@/types'

const OPTIONS: TimeRange[] = ['24h', '7d', '14d', '30d', '90d', '1y']

interface TemporalFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  className?: string
}

export function TemporalFilter({ value, onChange, className }: TemporalFilterProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-none', className)}>
      {OPTIONS.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            value === opt
              ? 'bg-brand text-base'
              : 'bg-elevated text-secondary hover:text-primary hover:bg-border',
          )}
        >
          {TIME_RANGE_LABELS[opt]}
        </button>
      ))}
    </div>
  )
}
