import { cn } from '@/lib/utils'
import type { Kpi } from '@/lib/types'

const toneClasses: Record<Kpi['tone'], string> = {
  positive: 'text-success',
  negative: 'text-destructive',
  neutral: 'text-muted-foreground',
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-ring/30">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
          {kpi.value}
        </span>
        <span className={cn('text-sm font-medium', toneClasses[kpi.tone])}>
          {kpi.delta}
        </span>
      </div>
    </div>
  )
}
