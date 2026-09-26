import { NextRequest, NextResponse } from "next/server"
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { orchestrateUserRequest } from "@/lib/orchestration"
import type { OrchestrationResult } from "@/lib/orchestration"
import {
  authorizeConnectorExecution,
  isConnectorExecutionAuthorizationError,
} from "@/lib/security/authorize-connector-execution"
import { validateMessageSize } from "@/lib/security/validate-request-size"
import { readJsonBody, RequestBodyLimitError } from "@/lib/security/request-body"
import { createClient } from "@/lib/supabase/server"
import {
  isPrivilegedMfaRequiredError,
  requirePrivilegedMfa,
} from "@/lib/security/privileged-auth"
import { GeminiBudgetExceededError, GEMINI_BUDGET_WINDOW_MS } from "@/lib/security/gemini-budget"
import { OrgExecutionQuotaExceededError, OrgQuotaUnavailableError, ORG_EXECUTION_QUOTA_LIMIT_MESSAGE } from "@/lib/security/org-quota"
import { IntentMappingError } from "@/lib/connectors/intent-mapping"

type Orchestrator = (message: string) => Promise<OrchestrationResult>

export async function handleExecuteRequest(
  request: Request,
  orchestrate: Orchestrator = orchestrateUserRequest,
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle()
    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "Execution authorization is temporarily unavailable." }, { status: 503 })
    }
    await authorizeConnectorExecution({
      supabase,
      userId: user.id,
      organizationId: profile.organization_id,
    })
    await requirePrivilegedMfa(supabase, user.id)
  } catch (error) {
    if (isConnectorExecutionAuthorizationError(error)) {
      return NextResponse.json({ error: "Only an owner or admin can execute connectors." }, { status: 403 })
    }
    if (isPrivilegedMfaRequiredError(error)) {
      // Defense-in-depth: the proxy normally maps this first. Keep the route
      // correct when invoked directly (tests, future callers).
      return NextResponse.json(
        { error: "Multi-factor authentication is required for this action." },
        { status: 403 },
      )
    }
    console.error("Execution authorization lookup failed:", error)
    return NextResponse.json({ error: "Execution authorization is temporarily unavailable." }, { status: 503 })
  }

  let body: unknown

  try {
    body = await readJsonBody<unknown>(request)
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return NextResponse.json(
        { error: "Request body too large." },
        { status: 413 },
      )
    }

    return NextResponse.json(
      { error: "Malformed JSON request body." },
      { status: 400 },
    )
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    )
  }

  const message = (body as { message?: unknown }).message

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 },
    )
  }

  if (!validateMessageSize(message)) {
    return NextResponse.json(
      { error: "Message is too large." },
      { status: 413 },
    )
  }

  try {
    assertApiBody(body, "execute")
  } catch (error) {
    return validationErrorResponse(error) ?? NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  try {
    const result = await orchestrate(message)
    return NextResponse.json(result)
  } catch (error) {
    if (isConnectorExecutionAuthorizationError(error)) {
      return NextResponse.json(
        { error: "Execution request could not be completed." },
        { status: 403 },
      )
    }

    if (isPrivilegedMfaRequiredError(error)) {
      // Defense-in-depth: the proxy normally maps this first. Keep the route
      // correct when invoked directly (tests, future callers).
      return NextResponse.json(
        { error: "Multi-factor authentication is required for this action." },
        { status: 403 },
      )
    }

    // Per-user LLM budget exhausted: a rate-limit condition, not a server fault.
    if (error instanceof GeminiBudgetExceededError) {
      return NextResponse.json(
        { error: "Gemini usage budget exceeded. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(GEMINI_BUDGET_WINDOW_MS / 1000)) },
        },
      )
    }

    // P1-2: organization-wide execution quota (shared across all members and
    // entry routes). A rate-limit condition, not a server fault.
    if (error instanceof OrgExecutionQuotaExceededError) {
      return NextResponse.json(
        { error: ORG_EXECUTION_QUOTA_LIMIT_MESSAGE },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      )
    }
    if (error instanceof OrgQuotaUnavailableError) {
      console.error("Execution org quota lookup failed:", error)
      return NextResponse.json(
        { error: "Execution quota service is temporarily unavailable." },
        { status: 503 },
      )
    }

    // Intent parameters cannot satisfy the connector contract: client-fixable
    // request problem. The client gets a fixed message + code; the specific
    // contract reason stays in server logs only (six-point hardening rule).
    if (error instanceof IntentMappingError) {
      console.warn("Intent-to-connector mapping failed:", error.message)
      return NextResponse.json(
        { error: "The request could not be mapped to a connector action.", code: "INTENT_MAPPING_FAILED" },
        { status: 400 },
      )
    }

    console.error("Execution orchestration error:", error)
    return NextResponse.json(
      { error: "Execution orchestration failed." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return handleExecuteRequest(request)
}
