/**
 * F2 — approval provenance verification at the resume boundary.
 *
 * Threat model: approval_requests rows are member-insertable by RLS design
 * (INSERT policy: same org + requested_by = auth.uid()). A member can copy a
 * blocked execution's input_data and self-compute the approval-integrity hash
 * (plain SHA-256 over canonical JSON of member-readable fields), producing a
 * forged approval that is indistinguishable from a server-created one by row
 * content alone. The integrity hash proves input IMMUTABILITY, not
 * PROVENANCE. Without a provenance check, the approval workflow can launder a
 * governance BLOCK into an executable action with one negligent owner click.
 *
 * The server-controlled provenance root is `governance_decisions`
 * (supabase/migrations/20260921240000_harden_governance_rls.sql): the table
 * has NO client INSERT/UPDATE/DELETE policies and all client table
 * privileges beyond SELECT were revoked — only the service-role client (the
 * engine's persistGovernanceEvaluation call) can write it. A row with
 * decision = 'approval_required' for an execution therefore exists if and
 * only if the authoritative engine evaluated that execution and required
 * human approval.
 *
 * Verification contract (all mandatory checks fail closed):
 *   1. execution binding:  approval.execution_id must resolve to the exact
 *      execution being resumed (the resume route fetches the execution BY
 *      approval.execution_id and this verifier re-asserts equality).
 *   2. agent binding:      approval.agent_id === execution.agent_id. A
 *      mismatched approval can never resume another agent's execution.
 *   3. execution eligibility: the execution status must be an approval-flow
 *      state ('awaiting_approval' or 'approved'). A BLOCKED or FAILED
 *      execution can never be moved to executable state by any approval.
 *   4. decision linkage:   when approval.governance_decision_id is set, the
 *      referenced governance decision must exist in the same organization,
 *      belong to the SAME execution, carry decision = 'approval_required',
 *      and reference the same agent. When it is not set (legacy approvals
 *      created before the linkage was wired), an approval_required decision
 *      must exist for this exact (execution_id, agent_id) pair.
 *   5. retarget hardening: when the decision's persisted evaluation context
 *      records the action/tool/connection it required, they must match the
 *      approval metadata and the execution's connection, so approval metadata
 *      cannot retarget the approved context.
 *
 * This module never trusts approval metadata for provenance decisions.
 */

import {
  APPROVAL_AGENT_ID_METADATA_KEY,
  APPROVAL_EXECUTION_ID_METADATA_KEY,
} from "./approval-integrity"

export class ApprovalProvenanceError extends Error {
  readonly code = "APPROVAL_PROVENANCE_INVALID"

  constructor(message = "Approval provenance could not be verified.") {
    super(message)
    this.name = "ApprovalProvenanceError"
  }
}

export function isApprovalProvenanceError(
  error: unknown,
): error is ApprovalProvenanceError {
  return error instanceof ApprovalProvenanceError
}

/** Execution statuses from which an approval may legitimately resume. */
export const APPROVAL_ELIGIBLE_EXECUTION_STATUSES: readonly string[] = [
  "awaiting_approval",
  "approved",
]

/** Mapped decision value persisted by lib/governance/audit.ts for
 *  governance.decision === "REQUIRE_APPROVAL". */
const DECISION_APPROVAL_REQUIRED = "approval_required"

/* Minimal structural client view (see lib/execution/agent-identity.ts for the
   rationale; the codebase precedent uses a permissive client type). */
type ProvenanceSupabaseClient = {
  from(table: string): any
}

type MinimalApproval = {
  id: string
  execution_id: string | null
  agent_id: string | null
  governance_decision_id: string | null
  metadata: unknown
}

type MinimalExecution = {
  id: string
  agent_id: string
  agent_connection_id: string | null
  status: string
}

export async function assertApprovalProvenance({
  supabase,
  organizationId,
  approval,
  execution,
}: {
  supabase: ProvenanceSupabaseClient
  organizationId: string
  approval: MinimalApproval
  execution: MinimalExecution
}): Promise<void> {
  // 1. Execution binding: the approval must point at the execution being
  //    resumed. The resume route loads the execution by approval.execution_id;
  //    re-assert so a future refactor cannot silently drop the linkage.
  if (!approval.execution_id || approval.execution_id !== execution.id) {
    throw new ApprovalProvenanceError(
      "This approval is not linked to the execution it claims to authorize.",
    )
  }

  // 2. Agent binding: the approval's agent must be the execution's agent.
  if (!approval.agent_id || approval.agent_id !== execution.agent_id) {
    throw new ApprovalProvenanceError(
      "This approval was not issued for the execution's agent.",
    )
  }

  // 3. Execution eligibility: only approval-flow states may resume. BLOCKED
  //    and FAILED executions (governance denied / connector failed) can never
  //    be made executable by an approval.
  if (!APPROVAL_ELIGIBLE_EXECUTION_STATUSES.includes(execution.status)) {
    throw new ApprovalProvenanceError(
      "This execution is not in a state that an approval can resume.",
    )
  }

  // Server-stamped consistency keys (stamped by createExecutionApproval with
  // trusted execution values). Not sufficient for provenance on their own,
  // but any mismatch means the approval row was hand-built or mutated.
  const metadata =
    approval.metadata && typeof approval.metadata === "object" && !Array.isArray(approval.metadata)
      ? (approval.metadata as Record<string, unknown>)
      : null
  if (metadata) {
    const stampedExecutionId = metadata[APPROVAL_EXECUTION_ID_METADATA_KEY]
    const stampedAgentId = metadata[APPROVAL_AGENT_ID_METADATA_KEY]
    if (
      (typeof stampedExecutionId === "string" && stampedExecutionId !== approval.execution_id) ||
      (typeof stampedAgentId === "string" && stampedAgentId !== approval.agent_id)
    ) {
      throw new ApprovalProvenanceError(
        "This approval's integrity metadata does not match the execution it references.",
      )
    }
  }

  // 4. Decision linkage (the server-controlled provenance root).
  const loadDecision = async (decisionId: string) => {
    const { data, error } = await supabase
      .from("governance_decisions")
      .select("id, agent_id, execution_id, decision, metadata")
      .eq("id", decisionId)
      .eq("organization_id", organizationId)
      .maybeSingle()
    if (error) {
      throw new ApprovalProvenanceError(
        "Approval provenance could not be verified.",
      )
    }
    return data as
      | { id: string; agent_id: string | null; execution_id: string | null; decision: string; metadata: unknown }
      | null
  }

  const verifyDecisionBinding = (
    decision: { agent_id: string | null; execution_id: string | null; decision: string; metadata: unknown },
  ) => {
    if (decision.decision !== DECISION_APPROVAL_REQUIRED) {
      throw new ApprovalProvenanceError(
        "The linked governance decision does not require approval.",
      )
    }
    if (decision.execution_id !== approval.execution_id) {
      throw new ApprovalProvenanceError(
        "The linked governance decision belongs to a different execution.",
      )
    }
    if (decision.agent_id !== null && decision.agent_id !== approval.agent_id) {
      throw new ApprovalProvenanceError(
        "The linked governance decision belongs to a different agent.",
      )
    }
  }

  // Retarget hardening: the engine persists the evaluated context (action,
  // tool, agentConnectionId) inside the decision's metadata. When present it
  // must match the approval metadata and the execution's connection, so a
  // hand-built approval cannot retarget the approved context.
  const verifyDecisionContext = (decision: { metadata: unknown }) => {
    const decisionMetadata =
      decision.metadata && typeof decision.metadata === "object" && !Array.isArray(decision.metadata)
        ? (decision.metadata as Record<string, unknown>)
        : null
    const context =
      decisionMetadata?.context && typeof decisionMetadata.context === "object"
        ? (decisionMetadata.context as Record<string, unknown>)
        : null
    if (!context) {
      return
    }
    if (metadata && typeof context.action === "string") {
      const approvalAction =
        typeof metadata.action === "string" ? metadata.action : null
      if (approvalAction && approvalAction !== context.action) {
        throw new ApprovalProvenanceError(
          "This approval's action does not match the governance decision that required it.",
        )
      }
    }
    if (typeof context.tool === "string") {
      const approvalProvider =
        metadata && typeof metadata.provider === "string" ? metadata.provider : null
      if (approvalProvider && approvalProvider !== context.tool) {
        throw new ApprovalProvenanceError(
          "This approval's provider does not match the governance decision that required it.",
        )
      }
    }
    if (typeof context.agentConnectionId === "string" && execution.agent_connection_id) {
      if (context.agentConnectionId !== execution.agent_connection_id) {
        throw new ApprovalProvenanceError(
          "The governance decision was made for a different connector connection.",
        )
      }
    }
  }

  if (approval.governance_decision_id) {
    const decision = await loadDecision(approval.governance_decision_id)
    if (!decision) {
      throw new ApprovalProvenanceError(
        "The governance decision linked to this approval could not be found.",
      )
    }
    verifyDecisionBinding(decision)
    verifyDecisionContext(decision)
    return
  }

  // Legacy approvals (created before the decision linkage was wired) carry no
  // governance_decision_id. Provenance then requires that a server-generated
  // approval_required decision exists for this exact execution + agent.
  const { data: legacyDecision, error: legacyError } = await supabase
    .from("governance_decisions")
    .select("id, agent_id, execution_id, decision, metadata")
    .eq("organization_id", organizationId)
    .eq("execution_id", approval.execution_id)
    .eq("decision", DECISION_APPROVAL_REQUIRED)
    .limit(1)
    .maybeSingle()

  if (legacyError) {
    throw new ApprovalProvenanceError(
      "Approval provenance could not be verified.",
    )
  }

  if (!legacyDecision) {
    throw new ApprovalProvenanceError(
      "No server-generated approval requirement exists for this execution.",
    )
  }

  if (legacyDecision.agent_id !== null && legacyDecision.agent_id !== approval.agent_id) {
    throw new ApprovalProvenanceError(
      "The approval requirement was recorded for a different agent.",
    )
  }

  verifyDecisionContext(legacyDecision)
}
