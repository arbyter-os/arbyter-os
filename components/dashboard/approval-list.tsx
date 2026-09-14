'use client'

import * as React from 'react'
import type { Approval } from '@/lib/approvals/types'

type ApprovalListProps = {
  approvals: Approval[]
  loading?: boolean
  onResolve?: (
    approvalId: string,
    decision: 'approved' | 'rejected'
  ) => Promise<void>
}

function riskClass(risk: string) {
  switch (risk.toLowerCase()) {
    case 'critical':
      return 'text-red-600'
    case 'high':
      return 'text-orange-600'
    case 'medium':
      return 'text-amber-600'
    default:
      return 'text-muted-foreground'
  }
}

export function ApprovalList({
  approvals,
  loading = false,
  onResolve,
}: ApprovalListProps) {
  const [resolvingId, setResolvingId] =
    React.useState<string | null>(null)

  async function resolve(
    approvalId: string,
    decision: 'approved' | 'rejected'
  ) {
    if (!onResolve) return

    try {
      setResolvingId(approvalId)
      await onResolve(approvalId, decision)
    } finally {
      setResolvingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-xl border bg-muted/30"
          />
        ))}
      </div>
    )
  }

  if (approvals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm font-medium">
          No pending approvals
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Governance approvals will appear here when an agent
          requires human authorization.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y rounded-xl border">
      {approvals.map((approval) => {
        const resolving =
          resolvingId === approval.id

        return (
          <div
            key={approval.id}
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">
                  {approval.title}
                </p>

                <span
                  className={`text-xs font-medium ${riskClass(
                    approval.riskLevel
                  )}`}
                >
                  {approval.riskLevel}
                </span>
              </div>

              {approval.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {approval.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {approval.agent && (
                  <span>
                    Agent: {approval.agent.name}
                  </span>
                )}

                <span>
                  {new Date(
                    approval.requestedAt
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            {approval.status === 'pending' &&
              onResolve && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() =>
                      resolve(
                        approval.id,
                        'rejected'
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() =>
                      resolve(
                        approval.id,
                        'approved'
                      )
                    }
                    className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
          </div>
        )
      })}
    </div>
  )
} 