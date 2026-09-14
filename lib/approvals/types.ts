export type ApprovalAgent = {
  id: string
  name: string
  type: string | null
  status: string | null
}

export type Approval = {
  id: string
  agentId: string | null
  executionId: string | null
  governanceDecisionId: string | null
  requestedBy: string | null
  assignedTo: string | null
  title: string
  description: string | null
  riskLevel: string
  status: string
  decisionNote: string | null
  requestedAt: string
  resolvedAt: string | null
  metadata: Record<string, unknown>
  agent: ApprovalAgent | null
}

export type ApprovalsResponse = {
  success: boolean
  approvals: Approval[]
  pending: Approval[]
  pendingCount: number
}