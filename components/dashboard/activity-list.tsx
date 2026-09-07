import { StatusBadge } from '@/components/ui/status-badge'
import type { ActivityItem } from '@/lib/types'

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => (
        <li
          key={item.id}
          data-first={i === 0}
          className="flex items-center gap-3 py-3.5 data-[first=false]:border-t data-[first=false]:border-border"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary">
            {item.agent
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">
              <span className="font-medium">{item.agent}</span>{' '}
              <span className="text-muted-foreground">{item.action}</span>
            </p>
            <p className="text-xs text-muted-foreground/80">{item.timestamp}</p>
          </div>
          <StatusBadge status={item.status} />
        </li>
      ))}
    </ul>
  )
}
