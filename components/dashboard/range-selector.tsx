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
      className="liquid-glass-interactive inline-flex max-w-full items-center gap-0.5 rounded-xl p-1"
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
              'min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              active
                ? 'bg-primary/[0.08] text-primary shadow-sm ring-1 ring-primary/10'
                : 'text-muted-foreground hover:bg-white/35 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
