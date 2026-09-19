'use client'

import { cn } from '@/lib/utils'

export type RangeValue = '7d' | '30d' | '90d'

const options: { value: RangeValue; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeValue
  onChange: (value: RangeValue) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Date range"
      className="inline-flex items-center gap-0.5 rounded-xl border border-white/65 bg-white/40 p-1 shadow-sm backdrop-blur-md"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
