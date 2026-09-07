import { cn } from '@/lib/utils'
import type { Status } from '@/lib/types'

const config: Record<Status, { label: string; className: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-success/10 text-success border-success/20',
  },
  active: {
    label: 'Active',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border-border',
  },
  review: {
    label: 'In review',
    className: 'bg-warning/15 text-warning-foreground border-warning/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/20',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  conflict: {
    label: 'Conflict',
    className: 'bg-warning/15 text-warning-foreground border-warning/30',
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const c = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        c.className,
        className,
      )}
    >
      {c.label}
    </span>
  )
}
