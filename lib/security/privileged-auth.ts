import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Testing escape hatch ONLY: when explicitly set to "false", the AAL2 portion
 * of the privileged-MFA gate is skipped. Default (unset, any other value) is
 * fail-secure: MFA remains required. This loosens NOTHING else — the
 * owner/admin role check, authentication, and org isolation still run.
 *
 * P0-4: production must never silently disable privileged MFA. In production
 * environments the escape hatch is ignored (AAL2 stays required) and the
 * attempt is logged; the role check is unaffected either way.
 */
function isMfaRequirementDisabled(): boolean {
  if (process.env.ARBYTER_REQUIRE_MFA !== "false") return false
  if (isProductionEnvironment()) {
    console.warn(
      "ARBYTER_REQUIRE_MFA=false is ignored in production; privileged actions still require AAL2.",
    )
    return false
  }
  return true
}

/** True when the process runs in a production deployment environment. */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  )
}
export class PrivilegedAuthorizationError extends Error {
  readonly code = "PRIVILEGED_AUTHORIZATION_REQUIRED"

  constructor(message = "Only an owner or admin can perform this action.") {
    super(message)
    this.name = "PrivilegedAuthorizationError"
  }
}

export class PrivilegedMfaRequiredError extends Error {
  readonly code = "PRIVILEGED_MFA_REQUIRED"

  constructor() {
    super("Multi-factor authentication is required for this action.")
    this.name = "PrivilegedMfaRequiredError"
  }
}

export async function requireOwnerOrAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<"owner" | "admin"> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  if (data?.role !== "owner" && data?.role !== "admin") {
    throw new PrivilegedAuthorizationError()
  }
  return data.role
}

export async function requirePrivilegedMfa(
  supabase: SupabaseClient,
  userId: string,
): Promise<"owner" | "admin"> {
  // Role authorization ALWAYS runs — only the AAL2 check below is skippable.
  const role = await requireOwnerOrAdmin(supabase, userId)
  if (isMfaRequirementDisabled()) {
    return role
  }
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || data?.currentLevel !== "aal2") {
    throw new PrivilegedMfaRequiredError()
  }
  return role
}

export function isPrivilegedAuthorizationError(error: unknown): error is PrivilegedAuthorizationError {
  return error instanceof PrivilegedAuthorizationError
}

export function isPrivilegedMfaRequiredError(error: unknown): error is PrivilegedMfaRequiredError {
  return error instanceof PrivilegedMfaRequiredError
}
