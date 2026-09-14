import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("approval_requests")
    .insert({
      organization_id: input.organizationId,
      agent_id: input.agentId,
      execution_id: input.executionId,
      governance_decision_id:
        input.governanceDecisionId ?? null,
      requested_by:
        input.requestedBy ?? null,
      title: input.title,
      description:
        input.description ?? null,
      risk_level: input.riskLevel,
      status: "pending",
      requested_at: new Date().toISOString(),
      metadata: input.metadata ?? {},
    })
    .select()
    .single()

  if (error) {
    throw new Error(
      `Failed to create approval request: ${error.message}`
    )
  }

  return data
} 