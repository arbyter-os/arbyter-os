import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { readJsonBody } from "@/lib/security/request-body"
import { checkRateLimit, checkAuthBackoff, clearAuthFailures, getLoginAccountRateLimitKey, recordAuthFailure } from "@/lib/security/rate-limit"
import { RATE_LIMITS } from "@/lib/security/rate-limit-config"
import { assertApiBody } from "@/lib/validation/api-schemas"
import { RequestValidationError } from "@/lib/validation/errors"

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const body = await readJsonBody(request)
    assertApiBody(body, "auth:login")
    const email = body.email.trim()
    const password = body.password



    try {
      const accountKey = getLoginAccountRateLimitKey(email)
      const backoff = await checkAuthBackoff(accountKey)
      if (!backoff.allowed) {
        return NextResponse.json({ error: "Too many sign-in attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(backoff.retryAfterSeconds) } })
      }
      const accountLimit = await checkRateLimit(accountKey, RATE_LIMITS.loginAccount.limit, RATE_LIMITS.loginAccount.windowMs)
      if (!accountLimit.allowed) {
        return NextResponse.json(
          { error: "Too many sign-in attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } },
        )
      }
    } catch {
      return NextResponse.json(
        { error: "Rate limiting is temporarily unavailable. Please try again later." },
        { status: 503 },
      )
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      try { await recordAuthFailure(getLoginAccountRateLimitKey(email)) } catch (rateError) { console.error("Login auth backoff update failed:", rateError) }
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    try { await clearAuthFailures(getLoginAccountRateLimitKey(email)) } catch (rateError) { console.error("Login auth backoff reset failed:", rateError) }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) {
      return NextResponse.json(
        { error: "Unable to verify multi-factor authentication status." },
        { status: 503 },
      )
    }

    const hasVerifiedTotp = factors.totp?.some((factor) => factor.status === "verified") ?? false

    return NextResponse.json({
      success: true,
      mfaRequired: hasVerifiedTotp,
    })
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json({ error: "Invalid login request." }, { status: 400 })
    }
    console.error("Login request failed:", error instanceof Error ? error.name : "unknown")
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 })
  }
}
