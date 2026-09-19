"use client"

import { useEffect, useState } from "react"
import type { Approval } from "@/lib/approvals/types"

type Props = {
  approvals: Approval[]
  onResolved?: () => void
}

export default function ApprovalList({
  approvals,
  onResolved,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function resolveApproval(
    approvalId: string,
    approved: boolean
  ) {
    setLoadingId(approvalId)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/approvals/${approvalId}/resolve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved,
            decisionNote: approved
              ? "Approved by administrator."
              : "Rejected by administrator.",
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ?? "Failed to resolve approval."
        )
      }

      if (approved) {
        const resumeResponse = await fetch(
          `/api/approvals/${approvalId}/resume`,
          {
            method: "POST",
          }
        )

        const resumeData =
          await resumeResponse.json()

        if (!resumeResponse.ok) {
          throw new Error(
            resumeData?.error ??
              "Approval was granted, but execution could not be resumed."
          )
        }

        setMessage("Approved and execution resumed.")
      } else {
        setMessage("Approval rejected.")
      }

      onResolved?.()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      )
    } finally {
      setLoadingId(null)
    }
  }

  if (approvals.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-black/50">
          No pending approvals.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {message && (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70">
          {message}
        </div>
      )}

      {approvals.map((approval) => (
        <div
          key={approval.id}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-black">
                {approval.title}
              </h3>

              {approval.agent && (
                <p className="mt-1 text-sm text-black/50">
                  Agent: {approval.agent.name}
                </p>
              )}

              {approval.description && (
                <p className="mt-3 text-sm leading-6 text-black/65">
                  {approval.description}
                </p>
              )}
            </div>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              {approval.riskLevel}
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={loadingId === approval.id}
              onClick={() =>
                resolveApproval(
                  approval.id,
                  true
                )
              }
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loadingId === approval.id
                ? "Processing..."
                : "Approve → Resume"}
            </button>

            <button
              type="button"
              disabled={loadingId === approval.id}
              onClick={() =>
                resolveApproval(
                  approval.id,
                  false
                )
              }
              className="glass rounded-xl px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 