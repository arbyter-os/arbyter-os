import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  APPROVAL_AGENT_ID_METADATA_KEY,
  APPROVAL_EXECUTION_ID_METADATA_KEY,
  APPROVAL_INTEGRITY_ENVELOPE_METADATA_KEY,
  APPROVAL_INTEGRITY_HASH_METADATA_KEY,
  APPROVAL_SERVER_CREATED_METADATA_KEY,
  buildApprovalIntegrityEnvelope,
  hashApprovalIntegrityEnvelope,
} from "@/lib/security/approval-integrity"

export type ExecutionApprovalInput = {
  organizationId: string
  agentId: string
  executionId: string
  taskId?: string
  riskLevel: string
  title: string
  description?: string
  governanceDecisionId?: string
  metadata?: Record<string, unknown>
}

export async function createExecutionApproval(
  input: ExecutionApprovalInput
) {
  // P1-1: execution-linked approval rows are server-generated security state.
  // Authentication and the execution lookup use the USER client (the caller's
  // own session and RLS-scoped reads); the INSERT itself goes through the
  // service-role client — the only legitimate writer of execution-linked
  // approvals now that RLS forbids execution_id on every authenticated
  // insert (20260925160000_restrict_approval_inserts.sql). This makes the
  // engine's approval row unforged-able at the database layer and immune to
  // the direct-PostgREST approval-spam vector that proxy.ts cannot see.
  // Caller authentication/authorization has already been enforced by the
  // engine (auth, org binding, owner/admin role) before this point.
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    throw new Error(`Failed to authenticate approval requester: ${authError.message}`)
  }
  if (!user) {
    throw new Error("Execution approval requires an authenticated requester.")
  }

  const { data: execution, error: executionError } = await supabase
    .from("agent_executions")
    .select("id, agent_id, agent_connection_id, task_id, input_data, organization_id")
    .eq("id", input.executionId)
    .eq("agent_id", input.agentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle()

  if (executionError) {
    throw new Error(`Failed to load execution for approval: ${executionError.message}`)
  }

  if (!execution) {
    throw new Error("Execution for approval was not found or is not owned by the organization.")
  }

  if (!execution.agent_connection_id) {
    throw new Error("Execution for approval has no connector connection.")
  }

  const provider =
    typeof input.metadata?.provider === "string"
      ? input.metadata.provider
      : null
  const action =
    typeof input.metadata?.action === "string"
      ? input.metadata.action
      : null
  const capability =
    typeof input.metadata?.capability === "string"
      ? input.metadata.capability
      : action

  if (!provider || !action || !capability) {
    throw new Error("Execution approval is missing an integrity-protected connector context.")
  }

  const integrityEnvelope = buildApprovalIntegrityEnvelope({
    execution_id: execution.id,
    agent_id: execution.agent_id,
    connection_id: execution.agent_connection_id,
    provider,
    action,
    capability,
    input_data: execution.input_data,
    task_id: execution.task_id ?? null,
  })
  const integrityHash = hashApprovalIntegrityEnvelope(integrityEnvelope)

  const { data, error } = await createAdminClient()
    .from("approval_requests")
    .insert({
      organization_id: input.organizationId,
      agent_id: input.agentId,
      execution_id: input.executionId,
      governance_decision_id:
        input.governanceDecisionId ?? null,
      requested_by: user.id,
      title: input.title,
      description: input.description ?? null,
      risk_level: input.riskLevel,
      status: "pending",
      requested_at: new Date().toISOString(),
      // P0-3: absolute expiry, fixed at creation. TTL → deny: an approval that
      // is not resolved and resumed before expires_at can never execute. The
      // resolve/resume boundaries re-check expiry against current time.
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        ...(input.metadata ?? {}),
        task_id: input.taskId ?? null,
        capability,
        [APPROVAL_INTEGRITY_HASH_METADATA_KEY]: integrityHash,
        [APPROVAL_INTEGRITY_ENVELOPE_METADATA_KEY]: integrityEnvelope,
        [APPROVAL_EXECUTION_ID_METADATA_KEY]: execution.id,
        [APPROVAL_AGENT_ID_METADATA_KEY]: execution.agent_id,
        // F2: server-created marker. The authoritative engine created this
        // approval because governance REQUIRED approval; the resume boundary
        // roots provenance in the service-role-written governance_decisions
        // table (see lib/security/approval-provenance.ts), not in this
        // client-mutable metadata value.
        [APPROVAL_SERVER_CREATED_METADATA_KEY]: true,
      },
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