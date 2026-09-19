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

    if (authError) throw authError

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const taskId =
      typeof body?.taskId === "string" ? body.taskId : ""

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required." },
        { status: 400 }
      )
    }

    const { data: userRecord, error: userError } =
      await supabase
        .from("users")
        .select("organization_id, role")
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

    if (userRecord.role !== "owner" && userRecord.role !== "admin") {
      return NextResponse.json(
        { error: "Only an owner or admin can execute tasks." },
        { status: 403 }
      )
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority")
      .eq("id", taskId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (taskError) throw taskError

    if (!task) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      )
    }

    if (task.status === "completed") {
      return NextResponse.json(
        { error: "This task is already completed." },
        { status: 409 }
      )
    }

    const { data: assignment, error: assignmentError } =
      await supabase
        .from("agent_tasks")
        .select("agent_id")
        .eq("task_id", taskId)
        .maybeSingle()

    if (assignmentError) throw assignmentError

    if (!assignment?.agent_id) {
      return NextResponse.json(
        { error: "This task has no assigned agent." },
        { status: 400 }
      )
    }

    const agentId = assignment.agent_id

    const { data: agent, error: agentError } =
      await supabase
        .from("ai_agents")
        .select("id, name, status")
        .eq("id", agentId)
        .eq("organization_id", organizationId)
        .maybeSingle()

    if (agentError) throw agentError

    if (!agent) {
      return NextResponse.json(
        { error: "Assigned agent not found." },
        { status: 404 }
      )
    }

    const result = await executeAgentTask({
      organizationId,
      agentId,
      taskId: task.id,
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

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.status === "blocked"
              ? "Task execution was blocked."
              : result.status === "awaiting_approval"
                ? "Task execution requires approval."
                : result.status === "flagged"
                  ? "Task execution was flagged for review."
                  : "Task execution failed.",
          taskId: task.id,
          agentId,
          executionId: result.executionId,
          status: result.status,
          governance: result.governance,
          approval: "approval" in result ? result.approval : null,
          result: "result" in result ? result.result : null,
          audit: result.audit,
        },
        {
          status:
            result.status === "failed"
              ? 502
              : result.status === "awaiting_approval"
                ? 202
                : 403,
        }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: task.id,
      agentId,
      agentName: agent.name,
      executionId: result.executionId,
      status: result.status,
      governance: result.governance,
      result: result.result,
      audit: result.audit,
    })
  } catch (error) {
    console.error("Task execution failed:", error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute task.",
      },
      { status: 500 }
    )
  }
}
