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

    if (authError) throw authError

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body?.action) {
      return NextResponse.json(
        { error: "action is required." },
        { status: 400 }
      )
    }

    const { data: userRecord, error: userError } =
      await supabase
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle()

    if (userError) throw userError

    if (!userRecord?.organization_id) {
      return NextResponse.json(
        { error: "No organization is associated with your account." },
        { status: 403 }
      )
    }

    const organizationId = userRecord.organization_id

    const context = {
      action: body.action,
      tool: body.tool,
      jurisdiction: body.jurisdiction,
      country: body.country,
      state: body.state,
      sector: body.sector,
      agent: body.agent,
      task: body.task,
      data: body.data,
      environment: body.environment,
      ...body.context,
    }

    const result = await evaluateGovernance(
      organizationId,
      context
    )

    return NextResponse.json({
      success: true,
      decision: result.decision,
      risk: result.risk,
      applicableRules: result.applicableRules,
      triggeredRules: result.triggeredRules,
      recommendations: result.recommendations,
    })
    } catch (error) {
    console.error("Governance evaluation failed:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Governance evaluation failed.",
        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    )
  }
    