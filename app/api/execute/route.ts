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
import { isPrivilegedMfaRequiredError, requirePrivilegedMfa } from "@/lib/security/privileged-auth"

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
