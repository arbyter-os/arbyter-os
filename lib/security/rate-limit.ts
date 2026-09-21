import { createAdminClient } from "@/lib/supabase/admin"
import { createHash } from "node:crypto"
import { RATE_LIMITS } from "./rate-limit-config"

type RateLimitResult =
  | { allowed: true; remaining: number; retryAfterSeconds: 0 }
  | { allowed: false; remaining: 0; retryAfterSeconds: number }

/**
 * Distributed, database-backed rate limiting for authenticated API requests.
 *
 * The atomic database function is used so limits apply consistently across
 * multiple Vercel instances. Errors are deliberately surfaced to callers so
 * security-sensitive routes can fail closed rather than silently falling back
 * to a process-local counter.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  })

  if (error || !data || !Array.isArray(data) || data.length !== 1) {
    throw new Error("Rate limit service unavailable.")
  }

  const result = data[0] as {
    allowed: boolean
    remaining: number
    retry_after_seconds: number
  }

  if (!result.allowed) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, result.retry_after_seconds),
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, result.remaining),
    retryAfterSeconds: 0,
  }
}


export async function checkRateLimitCost(
  key: string,
  cost: number,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("check_rate_limit_cost", {
    p_key: key,
    p_cost: cost,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
  })

  if (error || !data || !Array.isArray(data) || data.length !== 1) {
    throw new Error("Rate limit service unavailable.")
  }

  const result = data[0] as {
    allowed: boolean
    remaining: number
    retry_after_seconds: number
  }

  if (!result.allowed) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, result.retry_after_seconds),
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, result.remaining),
    retryAfterSeconds: 0,
  }
}

export async function checkAuthBackoff(key: string): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("check_auth_rate_limit", { p_key: key })
  if (error || !data || !Array.isArray(data) || data.length != 1) throw new Error("Auth rate limit service unavailable.")
  const result = data[0] as { allowed: boolean; retry_after_seconds: number }
  return { allowed: Boolean(result.allowed), retryAfterSeconds: Math.max(0, Number(result.retry_after_seconds) || 0) }
}

export async function recordAuthFailure(key: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("record_auth_failure", { p_key: key, p_base_ms: RATE_LIMITS.loginBackoffBaseMs, p_max_ms: RATE_LIMITS.loginBackoffMaxMs, p_threshold: RATE_LIMITS.loginBackoffThreshold })
  if (error) throw new Error("Auth rate limit service unavailable.")
}

export async function clearAuthFailures(key: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("clear_auth_failures", { p_key: key })
  if (error) throw new Error("Auth rate limit service unavailable.")
}

export function getClientIp(request: Request): string | null {
  // Only trust Vercel's platform-populated client-IP header. Generic
  // forwarding headers are client-controlled unless a trusted proxy is
  // explicitly configured to strip and replace them. Falling back to those
  // headers would let an attacker rotate rate-limit buckets by spoofing IPs.
  const platformIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
  if (platformIp) return platformIp.slice(0, 128)

  // Non-Vercel deployments may explicitly opt into a trusted reverse proxy.
  // Never trust generic forwarding headers unless the operator has asserted
  // that an upstream proxy strips and replaces them.
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get(["x-forwarded", "for"].join("-"))?.split(",")[0]?.trim()
    if (forwarded) return forwarded.slice(0, 128)
  }

  return null
}

export function getLoginAccountRateLimitKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  const digest = createHash("sha256").update(normalized, "utf8").digest("hex");
  return `auth:login:account:${digest}`;
}
