import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeAgentTask } from "@/lib/execution/engine"

type RouteContext = {
  params: Promise<{
    taskId: string
  }>
}

export async function POST(
  request: Request,
  context: RouteContext
) {
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
        {
          error: "You must be signed in.",
        },
        { status: 401 }
      )
    }

    const { taskId } = await context.params

    if (!taskId) {
      return NextResponse.json(
        {
          error: "Task ID is required.",
        },
        { status: 400 }
      )
    }

    const body = await request.json().catch(
      () => ({})
    )

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

    const { data: assignment, error: assignmentError } =
      await supabase
        .from("agent_tasks")
        .select("agent_id")
        .eq("task_id", taskId)
        .maybeSingle()

    if (assignmentError) {
      throw assignmentError
    }

    if (!assignment?.agent_id) {
      return NextResponse.json(
        {
          error:
            "No agent is assigned to this task.",
        },
        { status: 400 }
      )
    }

    const result = await executeAgentTask({
      organizationId:
        userRecord.organization_id,
      agentId: assignment.agent_id,
      taskId,

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
        typeof body.data === "object" &&
        !Array.isArray(body.data)
          ? body.data
          : undefined,
    })

    const status =
      result.status === "blocked"
        ? 403
        : result.status === "awaiting_approval" ||
            result.status === "flagged"
          ? 202
          : result.success
            ? 200
            : 502

    return NextResponse.json(
      {
        success: result.success,
        taskId,
        executionId: result.executionId,
        status: result.status,
        governance: result.governance,
        result:
          "result" in result
            ? result.result
            : undefined,
        audit:
          "audit" in result
            ? result.audit
            : undefined,
      },
      { status }
    )
  } catch (error) {
    console.error(
      "Task execution failed:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Task execution failed.",
      },
      { status: 500 }
    )
  }
}