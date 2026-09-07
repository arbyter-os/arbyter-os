import { ChevronRight } from 'lucide-react'

import { SeverityBadge } from '@/components/ui/severity-badge'
import type { AttentionItem } from '@/lib/types'

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => (
        <li key={item.id}>
          <button
            type="button"
            className="group flex w-full items-center gap-4 py-3.5 text-left transition-colors data-[first=false]:border-t data-[first=false]:border-border"
            data-first={i === 0}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <SeverityBadge severity={item.severity} />
                <p className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="text-foreground/70">{item.system}</span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                {item.meta}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  )
}
