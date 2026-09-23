// Execution errors bubble up from providers, network stacks and the database.
// Their raw messages can expose internal hostnames, endpoints, provider error
// bodies and schema details, and execution_audit_logs is readable by every
// organization member. Audit-facing records therefore get a fixed,
// category-based message; the full diagnostic stays in server-side logs only
// (never destroyed, never stored in member-readable rows).

export type ExecutionErrorCategory =
  | "timeout"
  | "rate_limited"
  | "auth"
  | "network"
  | "database"
  | "validation"
  | "execution_error"

const AUDIT_MESSAGE_BY_CATEGORY: Record<ExecutionErrorCategory, string> = {
  timeout: "The operation timed out before it could complete.",
  rate_limited: "The operation was rate-limited by an upstream service.",
  auth: "The operation was rejected due to an authorization or credential problem.",
  network: "The operation could not reach an upstream service.",
  database: "The operation could not be completed due to a database constraint.",
  validation: "The operation input was rejected as invalid.",
  execution_error: "The operation failed due to an internal execution error.",
}

function classify(raw: string): ExecutionErrorCategory {
  const s = raw.toLowerCase()
  if (
    s.includes("timeout") ||
    s.includes("timed out") ||
    s.includes("etimedout") ||
    s.includes("aborterror") ||
    s.includes("aborted")
  ) {
    return "timeout"
  }
  if (s.includes("rate limit") || s.includes("too many requests") || s.includes("429")) {
    return "rate_limited"
  }
  if (
    s.includes("unauthorized") ||
    s.includes("forbidden") ||
    s.includes("invalid api key") ||
    s.includes("401") ||
    s.includes("403")
  ) {
    return "auth"
  }
  if (
    s.includes("econnrefused") ||
    s.includes("econnreset") ||
    s.includes("enotfound") ||
    s.includes("etimedout") ||
    s.includes("fetch failed") ||
    s.includes("network")
  ) {
    return "network"
  }
  if (
    s.includes("row-level security") ||
    s.includes("permission denied") ||
    s.includes("duplicate key") ||
    s.includes("foreign key") ||
    s.includes("42501") ||
    s.includes("23505")
  ) {
    return "database"
  }
  if (
    s.includes("invalid input") ||
    s.includes("validation") ||
    s.includes("must be") ||
    s.includes("failed to update task status")
  ) {
    return "validation"
  }
  return "execution_error"
}

export type SanitizedExecutionError = {
  /** Fixed, safe message for audit records and API responses. */
  message: string
  /** Coarse category, safe for metrics and audit records. */
  category: ExecutionErrorCategory
  /** Full diagnostic detail — server-side logs only. */
  diagnostics: string
}

export function sanitizeExecutionError(error: unknown): SanitizedExecutionError {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error"

  const category = classify(raw)

  const stack = error instanceof Error ? error.stack : undefined
  const diagnostics = stack ?? raw

  return {
    message: AUDIT_MESSAGE_BY_CATEGORY[category],
    category,
    diagnostics,
  }
}
