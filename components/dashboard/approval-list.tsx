"use client"

import { useState } from "react"
import type { Approval } from "@/lib/approvals/types"

type Props = {
  approvals: Approval[]
  onResolved?: () => void
}

export default function ApprovalList({ approvals, onResolved }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function resolveApproval(approvalId: string, approved: boolean) {
    setLoadingId(approvalId)
    setMessage(null)

    try {
      const response = await fetch(`/api/approvals/${approvalId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          decisionNote: approved ? "Approved by administrator." : "Rejected by administrator.",
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data?.error ?? "Failed to resolve approval.")

      if (approved) {
        const resumeResponse = await fetch(`/api/approvals/${approvalId}/resume`, { method: "POST" })
        const resumeData = await resumeResponse.json()
        if (!resumeResponse.ok) {
          throw new Error(resumeData?.error ?? "Approval was granted, but execution could not be resumed.")
        }
        setMessage("Approved and execution resumed.")
      } else {
        setMessage("Approval rejected.")
      }

      onResolved?.()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.")
    } finally {
      setLoadingId(null)
    }
  }

  if (approvals.length === 0) {
    return (
      <div className="content-surface rounded-2xl p-6">
        <p className="text-sm text-muted-foreground">No pending approvals.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {message ? (
        <div className="rounded-xl border border-border/70 bg-black/[0.025] px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}

      {approvals.map((approval) => (
        <div key={approval.id} className="content-surface rounded-2xl p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">{approval.title}</h3>
              {approval.agent ? <p className="mt-1 text-sm text-muted-foreground">Agent: {approval.agent.name}</p> : null}
              {approval.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{approval.description}</p> : null}
            </div>
            <span className="w-fit rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-700">
              {approval.riskLevel}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loadingId === approval.id}
              onClick={() => resolveApproval(approval.id, true)}
              className="liquid-glass-interactive rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(19,0,186,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingId === approval.id ? "Processing..." : "Approve → Resume"}
            </button>
            <button
              type="button"
              disabled={loadingId === approval.id}
              onClick={() => resolveApproval(approval.id, false)}
              className="liquid-glass-interactive rounded-xl border border-border/70 bg-white/65 px-4 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
