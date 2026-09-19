import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeAgentTask } from "@/lib/execution/engine"

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

    const body = await request.json()
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle()

    if (userError) {
      console.error("Connector execution user lookup failed:", userError)
      return NextResponse.json({ error: "Unable to resolve your organization." }, { status: 403 })
    }

    if (!userRecord?.organization_id) {
      return NextResponse.json({ error: "No organization is associated with your account." }, { status: 403 })
    }

    if (typeof body?.agentId !== "string" || !body.agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 })
    }

    if (body.taskId !== undefined && typeof body.taskId !== "string") {
      return NextResponse.json({ error: "Task ID must be a string." }, { status: 400 })
    }

    if (body.agentConnectionId !== undefined && typeof body.agentConnectionId !== "string") {
      return NextResponse.json({ error: "Agent connection ID must be a string." }, { status: 400 })
    }

    const result = await executeAgentTask({
      organizationId: userRecord.organization_id,
      agentId: body.agentId,
      taskId: typeof body.taskId === "string" ? body.taskId : undefined,
      agentConnectionId: typeof body.agentConnectionId === "string" ? body.agentConnectionId : undefined,
      environment: typeof body.environment === "string" ? body.environment : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      state: typeof body.state === "string" ? body.state : undefined,
      jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction : undefined,
      sector: typeof body.sector === "string" ? body.sector : undefined,
      data: body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : undefined,
    })

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
    console.error("Connector execution failed:", error)
    return NextResponse.json({ error: "Connector execution failed." }, { status: 500 })
  }
}