import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { evaluateGovernance } from "@/lib/governance"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw authError
    }

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      data: userRecord,
      error: userError,
    } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle()

    if (userError) {
      throw userError
    }

    if (!userRecord?.organization_id) {
      return NextResponse.json(
        {
          error:
            "No organization is associated with your account.",
        },
        { status: 403 }
      )
    }

    const organizationId =
      userRecord.organization_id

    const context = {
      action:
        typeof body?.action === "string"
          ? body.action
          : undefined,

      tool:
        typeof body?.tool === "string"
          ? body.tool
          : undefined,

      agentId:
        typeof body?.agentId === "string"
          ? body.agentId
          : undefined,

      taskId:
        typeof body?.taskId === "string"
          ? body.taskId
          : undefined,

      executionId:
        typeof body?.executionId === "string"
          ? body.executionId
          : undefined,

      agentConnectionId:
        typeof body?.agentConnectionId === "string"
          ? body.agentConnectionId
          : undefined,

      environment:
        typeof body?.environment === "string"
          ? body.environment
          : undefined,

      country:
        typeof body?.country === "string"
          ? body.country
          : undefined,

      state:
        typeof body?.state === "string"
          ? body.state
          : undefined,

      jurisdiction:
        typeof body?.jurisdiction === "string"
          ? body.jurisdiction
          : undefined,

      sector:
        typeof body?.sector === "string"
          ? body.sector
          : undefined,

      data:
        body?.data &&
        typeof body.data === "object"
          ? body.data
          : undefined,
    }

    const result = await evaluateGovernance(
      organizationId,
      context
    )

    return NextResponse.json({
      success: true,

      decision: result.decision,

      risk: result.risk,

      applicableRules:
        result.applicableRules,

      triggeredRules:
        result.triggeredRules,

      conflicts:
        result.conflicts,

      regulatoryMappings:
        result.regulatoryMappings,

      regulatoryLibrary:
        result.regulatoryLibrary,

      recommendations:
        result.recommendations,

      actions:
        result.actions,

      audit:
        result.audit,
    })
  } catch (error) {
    console.error(
      "Governance evaluation failed:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Governance evaluation failed.",
      },
      { status: 500 }
    )
  }
}