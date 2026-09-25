/**
 * Authoritative agent identity verification at the execution boundary.
 *
 * Security invariant (Stage 6 P0-1): no external action may execute unless the
 * executing agent carries a VERIFIED identity record in agent_identities that
 * belongs to the executing organization.
 *
 * Schema contract (supabase/schema-snapshot.json — agent_identities):
 *   agent_identities(id, organization_id, agent_id, external_agent_id,
 *   external_name, provider, version, owner_id, identity_metadata,
 *   verified, verified_at, created_at, updated_at)
 *
 * The ONLY identity state field is `verified` (boolean). There is no
 * `status` or `disabled` column on agent_identities, and no `disabled`
 * column on ai_agents — those fields must never be referenced here.
 * Agent liveness (paused/quarantined/disabled) is the ai_agents.status
 * check, which the CALLER performs (see below).
 *
 * Fail-closed semantics (this function):
 *  - missing identity row            -> rejected (also covers cross-org rows,
 *                                       which are invisible under the org
 *                                       scope and therefore look missing)
 *  - verified = false / null         -> rejected
 *  - identity lookup error           -> rejected (any error is fail-closed)
 *
 * Caller responsibilities (both call sites already perform these checks):
 *  - the executing agent row is loaded from ai_agents scoped by
 *    organization_id BEFORE this gate (org binding);
 *  - the agent's ai_agents.status === "active" is enforced by the caller
 *    immediately around this gate (engine: "Agent is paused." check +
 *    resume route: active-state re-check).
 *
 * This gate is independent of discovery (lib/discovery filters connection
 * state, not identity). Both the live engine (lib/execution/engine.ts) and
 * the approval resume path (app/api/approvals/[approvalId]/resume/route.ts)
 * call this function immediately before credential resolution and connector
 * execution.
 */

export class AgentIdentityVerificationError extends Error {
  readonly code = "AGENT_IDENTITY_NOT_VERIFIED"

  constructor(message = "Agent identity is not verified for execution.") {
    super(message)
    this.name = "AgentIdentityVerificationError"
  }
}

export function isAgentIdentityVerificationError(
  error: unknown,
): error is AgentIdentityVerificationError {
  return (
    error instanceof AgentIdentityVerificationError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { code?: unknown }).code === "AGENT_IDENTITY_NOT_VERIFIED")
  )
}

/* Minimal structural view of the Supabase client used here. The real client's
   PostgrestBuilder chain is thenable and deep-generic, so a strict structural
   signature fights type instantiation (TS2589); the codebase precedent
   (lib/execution/task-agent-authorization.ts) uses a permissive client type. */
type IdentitySupabaseClient = {
  from(table: string): any
}

/**
 * Asserts the executing agent has a VERIFIED identity row in
 * `agent_identities` for (agentId, organizationId). Selects ONLY real
 * columns of agent_identities — no joins, no embedded resources, so the
 * query is valid PostgREST regardless of FK configuration.
 *
 * Throws AgentIdentityVerificationError on every fail-closed condition.
 * Callers must invoke this immediately before resolving credentials and
 * executing the connector action, and must independently enforce
 * ai_agents.status === "active" (agent liveness) around this call.
 */
export async function assertVerifiedAgentIdentity({
  supabase,
  organizationId,
  agentId,
}: {
  supabase: IdentitySupabaseClient
  organizationId: string
  agentId: string
}): Promise<void> {
  let identity: { verified: boolean | null } | null
  let error: { message: string } | null = null

  try {
    const result = await supabase
      .from("agent_identities")
      // Only real agent_identities columns. No PostgREST embed: the org
      // binding is guaranteed by the callers' org-scoped ai_agents lookup
      // and by scoping THIS query to (agent_id, organization_id) — an
      // identity row of another organization cannot satisfy both filters.
      .select("verified")
      .eq("agent_id", agentId)
      .eq("organization_id", organizationId)
      .maybeSingle()
    identity = result.data
    error = result.error
  } catch {
    // Network/transport failure: fail closed.
    throw new AgentIdentityVerificationError(
      "Agent identity verification could not be completed.",
    )
  }

  // A DB error here is fail-closed: never execute on uncertain identity state.
  if (error) {
    throw new AgentIdentityVerificationError(
      "Agent identity verification could not be completed.",
    )
  }

  // Missing identity row for this (agent, organization) pair. Also covers the
  // cross-organization case: an identity row belongs to exactly one
  // organization_id, so a row of another org cannot match this filter and
  // looks exactly like "missing".
  if (!identity) {
    throw new AgentIdentityVerificationError(
      "No verified agent identity exists for this agent in this organization.",
    )
  }

  // Unverified identity: the verification flow (POST /api/agents/verify) has
  // either never run or explicitly recorded verified = false. Strict === true
  // rejects null as well.
  if (identity.verified !== true) {
    throw new AgentIdentityVerificationError(
      "Agent identity is not verified. Verify the agent before executing actions.",
    )
  }
}
