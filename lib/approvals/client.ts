import type { Approval, ApprovalsResponse } from "./types"

export async function loadApprovals(): Promise<ApprovalsResponse> {
  const response = await fetch("/api/approvals", {
    method: "GET",
    cache: "no-store",
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data?.error ?? "Failed to load approvals."
    )
  }

  return data
}

export async function loadPendingApprovals(): Promise<Approval[]> {
  const data = await loadApprovals()
  return data.pending
}