import { createApprovalRequest } from "@/lib/approval/approvals"

export type ExecutionApprovalInput = {
  organizationId: string
  agentId: string
  executionId: string
  taskId?: string
  riskLevel: string
  title: string
  description?: string
  governanceDecisionId?: string
  requestedBy?: string
  metadata?: Record<string, unknown>
}

export async function createExecutionApproval(
  input: ExecutionApprovalInput
) {
  return createApprovalRequest(input)
}