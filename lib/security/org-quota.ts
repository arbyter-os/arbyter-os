import { checkRateLimitCost } from "./rate-limit"
import { RATE_LIMITS } from "./rate-limit-config"

/**
 * P1-2/P1-3: organization-wide abuse quotas.
 *
 * Per-user limits (proxy.ts) bound one account, not one organization: N
 * privileged members sum linearly across the five execution-bearing routes
 * (30+10+10+10+10 requests/min each), and every request fans out into LLM
 * calls, vault decryptions, governance evaluations, external sends, and
 * execution/audit row growth.
 *
 * Both quotas share ONE key per organization across every entry route, so
 * endpoint rotation cannot multiply the allowance:
 *   - exec:{orgId} — execution-bearing requests (execute, connectors/execute,
 *     tasks/execute, tasks/:id/execute, approvals resume), consumed once per
 *     execution attempt at the authoritative choke points.
 *   - mail:{orgId} — AgentMail sends, a shared provider-account resource.
 *
 * Enforced server-side (engine/resume route), so direct-PostgREST style
 * bypasses of proxy.ts do not apply, and distributed across serverless
 * instances by the same database-backed limiter. Fails CLOSED: an org whose
 * quota service errors loses its execution capability temporarily rather
 * than executing unbounded (matching the fail-closed posture of every other
 * security control on these paths).
 */

/** Fixed client-facing messages (never interpolate provider/DB errors). */
export const ORG_EXECUTION_QUOTA_LIMIT_MESSAGE =
  "Organization execution rate limit exceeded. Please try again later."
export const ORG_MAIL_QUOTA_LIMIT_MESSAGE =
  "Organization AgentMail rate limit exceeded. Please try again later."

export const ORG_QUOTA_EXECUTION = {
  limit: RATE_LIMITS.orgExecutionQuota.limit,
  windowMs: RATE_LIMITS.orgExecutionQuota.windowMs,
}

export const ORG_QUOTA_AGENTMAIL = {
  limit: RATE_LIMITS.orgMailQuota.limit,
  windowMs: RATE_LIMITS.orgMailQuota.windowMs,
}

export class OrgExecutionQuotaExceededError extends Error {
  readonly code = "ORG_EXECUTION_QUOTA_EXCEEDED"
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(ORG_EXECUTION_QUOTA_LIMIT_MESSAGE)
    this.name = "OrgExecutionQuotaExceededError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class OrgMailQuotaExceededError extends Error {
  readonly code = "ORG_MAIL_QUOTA_EXCEEDED"
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(ORG_MAIL_QUOTA_LIMIT_MESSAGE)
    this.name = "OrgMailQuotaExceededError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class OrgQuotaUnavailableError extends Error {
  readonly code = "ORG_QUOTA_UNAVAILABLE"

  constructor() {
    super("Organization quota service is unavailable.")
    this.name = "OrgQuotaUnavailableError"
  }
}

function isOrgQuotaExceededError(error: unknown): error is
  | OrgExecutionQuotaExceededError
  | OrgMailQuotaExceededError {
  return (
    error instanceof OrgExecutionQuotaExceededError ||
    error instanceof OrgMailQuotaExceededError
  )
}

export { isOrgQuotaExceededError }

/**
 * Consume one execution slot from the organization bucket. Throws
 * OrgExecutionQuotaExceededError when the org bucket is exhausted and
 * OrgQuotaUnavailableError when the limiter itself is unavailable
 * (fail-closed).
 */
export async function consumeOrgExecutionQuota(organizationId: string): Promise<void> {
  if (!organizationId?.trim()) {
    throw new OrgQuotaUnavailableError()
  }

  let result
  try {
    result = await checkRateLimitCost(
      `exec:${organizationId}`,
      1,
      ORG_QUOTA_EXECUTION.limit,
      ORG_QUOTA_EXECUTION.windowMs,
    )
  } catch {
    // Limiter outage: fail closed — the org temporarily loses execution
    // capability rather than running unbounded.
    throw new OrgQuotaUnavailableError()
  }
  if (!result.allowed) {
    throw new OrgExecutionQuotaExceededError(result.retryAfterSeconds)
  }
}

/** Consume one AgentMail send slot from the organization bucket. */
export async function consumeOrgMailQuota(organizationId: string): Promise<void> {
  if (!organizationId?.trim()) {
    throw new OrgQuotaUnavailableError()
  }

  let result
  try {
    result = await checkRateLimitCost(
      `mail:${organizationId}`,
      1,
      ORG_QUOTA_AGENTMAIL.limit,
      ORG_QUOTA_AGENTMAIL.windowMs,
    )
  } catch {
    throw new OrgQuotaUnavailableError()
  }
  if (!result.allowed) {
    throw new OrgMailQuotaExceededError(result.retryAfterSeconds)
  }
}
