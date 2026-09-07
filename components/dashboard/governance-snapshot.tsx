import { ArrowRight } from 'lucide-react'

import type { SnapshotNode } from '@/lib/types'

function Node({ node }: { node: SnapshotNode }) {
  const Icon = node.icon
  return (
    <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-background px-3 py-4 text-center transition-colors hover:border-ring/30">
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className="mt-2.5 text-lg font-bold tabular-nums text-foreground">
        {node.count}
      </span>
      <span className="text-sm font-medium text-foreground">{node.label}</span>
      <span className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">
        {node.description}
      </span>
    </div>
  )
}

export function GovernanceSnapshot({ nodes }: { nodes: SnapshotNode[] }) {
  return (
    <div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {nodes.map((node, i) => (
          <div
            key={node.id}
            className="flex flex-col items-center md:flex-row md:flex-1"
          >
            <Node node={node} />
            {i < nodes.length - 1 ? (
              <span
                className="flex shrink-0 items-center justify-center py-1 text-muted-foreground/40 md:px-1 md:py-0"
                aria-hidden="true"
              >
                <ArrowRight className="size-4 rotate-90 md:rotate-0" />
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground text-pretty">
        Every agent operates under policies, enforced by controls, measured
        against risks, and substantiated by evidence.
      </p>
    </div>
  )
}
