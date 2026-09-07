import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/types'

const config: Record<Severity, { label: string; dot: string; text: string }> = {
  critical: {
    label: 'Critical',
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
  high: {
    label: 'High',
    dot: 'bg-warning',
    text: 'text-warning-foreground',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-chart-3',
    text: 'text-muted-foreground',
  },
  low: {
    label: 'Low',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
  },
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  const c = config[severity]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} aria-hidden="true" />
      <span className={c.text}>{c.label}</span>
    </span>
  )
}
