import { createAdminClient } from "@/lib/supabase/admin"

export type ExecutionAuditContext = {
  organizationId: string
  executionId: string
  agentId: string
  taskId?: string
  status:
    | "running"
    | "completed"
    | "failed"
    | "blocked"
    | "awaiting_approval"
    | "flagged"
  riskLevel?: string
  output?: unknown
  errorMessage?: string
}

export async function recordExecutionAudit(
  context: ExecutionAuditContext
) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("agent_executions")
    .update({
      status: context.status,
      risk_level:
        context.riskLevel ?? "low",
      output_data:
        context.output ?? {},
      error_message:
        context.errorMessage ?? null,
      completed_at:
        context.status === "running" ||
        context.status ===
          "awaiting_approval" ||
        context.status === "flagged"
          ? null
          : new Date().toISOString(),
    })
    .eq("id", context.executionId)
    .eq(
      "organization_id",
      context.organizationId
    )
    .eq("agent_id", context.agentId)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(
      `Failed to record execution audit: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      "Execution record was not found."
    )
  }

  return data
}