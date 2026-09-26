import { createHash } from "node:crypto"
import { assertApiBody, assertApiHeader } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { readJsonBody } from "@/lib/security/request-body";
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeAgentTask } from "@/lib/execution/engine"
import { assertTaskAssignedToAgent } from "@/lib/execution/task-agent-authorization"
import {
  requirePrivilegedMfa,
  isPrivilegedMfaRequiredError,
  isPrivilegedAuthorizationError,
} from "@/lib/security/privileged-auth"
import type { ConnectorCapability } from "@/lib/connectors/types"
import { OrgExecutionQuotaExceededError, OrgQuotaUnavailableError, ORG_EXECUTION_QUOTA_LIMIT_MESSAGE } from "@/lib/security/org-quota"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    }

    // P0-4: privileged MFA must hold at THIS route boundary, not only in
    // middleware or deeper in the engine. Direct connector execution is a
    // privileged external action.
    try {
      await requirePrivilegedMfa(supabase, user.id)
    } catch (error) {
      if (isPrivilegedMfaRequiredError(error)) {
        return NextResponse.json(
          { error: "Multi-factor authentication is required for this action." },
          { status: 403 },
        )
      }
      if (isPrivilegedAuthorizationError(error)) {
        return NextResponse.json(
          { error: "Only an owner or admin can perform this action." },
          { status: 403 },
        )
      }
      console.error("Connector execution authorization lookup failed:", error)
      return NextResponse.json(
        { error: "Execution authorization is temporarily unavailable." },
        { status: 503 },
      )
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "connectors:execute")
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle()

    if (userError) {
      console.error("Connector execution user lookup failed:", userError)
      return NextResponse.json({ error: "Unable to resolve your organization." }, { status: 403 })
    }

    if (!userRecord?.organization_id) {
      return NextResponse.json({ error: "No organization is associated with your account." }, { status: 403 })
    }

    if (userRecord.role !== "owner" && userRecord.role !== "admin") {
      return NextResponse.json(
        { error: "Only an owner or admin can execute connector actions." },
        { status: 403 }
      )
    }

    if (typeof body?.agentId !== "string" || !body.agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 })
    }

    if (body.taskId !== undefined && typeof body.taskId !== "string") {
      return NextResponse.json({ error: "Task ID must be a string." }, { status: 400 })
    }

    let idempotencyKey = ""
    try {
      const rawIdempotencyKey = request.headers.get("Idempotency-Key")
      if (rawIdempotencyKey !== null) idempotencyKey = assertApiHeader(rawIdempotencyKey, "Idempotency-Key")
    } catch {
      return NextResponse.json({ error: "Invalid Idempotency-Key." }, { status: 400 })
    }
    if (!body.taskId && !idempotencyKey) {
      return NextResponse.json({ error: "Idempotency-Key is required when taskId is omitted." }, { status: 400 })
    }
    if (body.agentConnectionId !== undefined && typeof body.agentConnectionId !== "string") {
      return NextResponse.json({ error: "Agent connection ID must be a string." }, { status: 400 })
    }

    if (typeof body.capability !== "string" || !["messages.send", "messages.read", "messages.reply"].includes(body.capability)) {
      return NextResponse.json({ error: "A valid connector capability is required." }, { status: 400 })
    }

    if (typeof body.taskId === "string") {
      try {
        await assertTaskAssignedToAgent(supabase, body.taskId, body.agentId)
      } catch (error) {
        console.error("Connector task-agent authorization failed:", error)
        return NextResponse.json(
          { error: "The requested task is not assigned to this agent." },
          { status: 403 },
        )
      }
    }

    const admin = !body.taskId ? (await import("@/lib/supabase/admin")).createAdminClient() : null
    const requestHash = !body.taskId
      ? createHash("sha256").update(JSON.stringify({
          agentId: body.agentId,
          agentConnectionId: body.agentConnectionId ?? null,
          capability: body.capability,
          environment: body.environment ?? null,
          country: body.country ?? null,
          state: body.state ?? null,
          jurisdiction: body.jurisdiction ?? null,
          sector: body.sector ?? null,
          data: body.data ?? null,
        })).digest("hex")
      : null

    if (admin && requestHash) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { data: existing, error: existingError } = await admin
        .from("connector_execution_idempotency")
        .select("id, request_hash, execution_id, expires_at")
        .eq("organization_id", userRecord.organization_id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()

      if (existingError) throw existingError
      if (existing && new Date(existing.expires_at).getTime() > Date.now()) {
        if (existing.request_hash !== requestHash) {
          return NextResponse.json({ error: "Idempotency-Key was already used for a different request." }, { status: 409 })
        }
        return NextResponse.json({
          error: "This idempotent connector execution has already been accepted.",
          executionId: existing.execution_id ?? undefined,
        }, { status: 409 })
      }

      if (existing) {
        await admin.from("connector_execution_idempotency")
          .delete()
          .eq("organization_id", userRecord.organization_id)
          .eq("idempotency_key", idempotencyKey)
          .lt("expires_at", new Date().toISOString())
      }

      const { error: reserveError } = await admin
        .from("connector_execution_idempotency")
        .insert({
          organization_id: userRecord.organization_id,
          idempotency_key: idempotencyKey,
          request_hash: requestHash,
          expires_at: expiresAt,
        })

      if (reserveError) {
        if (reserveError.code === "23505") {
          return NextResponse.json({ error: "This idempotent connector execution is already in progress." }, { status: 409 })
        }
        throw reserveError
      }
    }

    const result = await executeAgentTask({
      organizationId: userRecord.organization_id,
      agentId: body.agentId,
      taskId: typeof body.taskId === "string" ? body.taskId : undefined,
      agentConnectionId: typeof body.agentConnectionId === "string" ? body.agentConnectionId : undefined,
      requestedCapability: body.capability as ConnectorCapability,
      environment: typeof body.environment === "string" ? body.environment : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      state: typeof body.state === "string" ? body.state : undefined,
      jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction : undefined,
      sector: typeof body.sector === "string" ? body.sector : undefined,
      data: body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : undefined,
    })

    if (admin && requestHash && result.executionId) {
      const { error: idempotencyUpdateError } = await admin
        .from("connector_execution_idempotency")
        .update({ execution_id: result.executionId })
        .eq("organization_id", userRecord.organization_id)
        .eq("idempotency_key", idempotencyKey)
        .eq("request_hash", requestHash)
      if (idempotencyUpdateError) {
        console.error("Connector idempotency state update failed:", idempotencyUpdateError.message)
      }
    }

    const status = result.status === "awaiting_approval"
      ? 202
      : result.status === "flagged"
        ? 202
        : result.status === "blocked"
          ? 403
          : result.success
            ? 200
            : 502

    return NextResponse.json({
      success: result.success,
      executionId: result.executionId,
      status: result.status,
      governance: result.governance,
      result: "result" in result ? result.result : undefined,
    }, { status })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    // P1-2: organization-wide execution quota conditions (shared bucket
    // across every member and entry route).
    if (error instanceof OrgExecutionQuotaExceededError) {
      return NextResponse.json(
        { error: ORG_EXECUTION_QUOTA_LIMIT_MESSAGE },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      )
    }
    if (error instanceof OrgQuotaUnavailableError) {
      console.error("Connector execution org quota lookup failed:", error)
      return NextResponse.json(
        { error: "Execution quota service is temporarily unavailable." },
        { status: 503 },
      )
    }
    console.error("Connector execution failed:", error)
    return NextResponse.json({ error: "Connector execution failed." }, { status: 500 })
  }
}