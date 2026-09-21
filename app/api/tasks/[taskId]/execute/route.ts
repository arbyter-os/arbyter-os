import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server"
import { assertApiParam } from "@/lib/validation/api-schemas"
import { createClient } from "@/lib/supabase/server"
import { executeAgentTask } from "@/lib/execution/engine"
import type { ConnectorCapability } from "@/lib/connectors/types"

type TaskExecutionBody = {
  taskId?: unknown
  capability?: unknown
  agentConnectionId?: unknown
  environment?: unknown
  country?: unknown
  state?: unknown
  jurisdiction?: unknown
  sector?: unknown
  data?: unknown
}

const CONNECTOR_CAPABILITIES: readonly ConnectorCapability[] = [
  "messages.send",
  "messages.read",
  "messages.reply",
]

function isConnectorCapability(value: unknown): value is ConnectorCapability {
  return typeof value === "string" && (CONNECTOR_CAPABILITIES as readonly string[]).includes(value)
}

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
    assertApiParam(taskId, "uuid", "taskId")

    if (!taskId) {
      return NextResponse.json(
        {
          error: "Task ID is required.",
        },
        { status: 400 }
      )
    }

    const body: TaskExecutionBody = await readJsonBody<TaskExecutionBody>(request).catch(
      () => ({}) as TaskExecutionBody
    )

    assertApiBody(body, "tasks:execute")

    const {
      data: userRecord,
      error: userError,
    } = await supabase
      .from("users")
      .select("organization_id, role")
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

    if (userRecord.role !== "owner" && userRecord.role !== "admin") {
      return NextResponse.json(
        { error: "Only an owner or admin can execute tasks." },
        { status: 403 }
      )
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", taskId)
      .eq("organization_id", userRecord.organization_id)
      .maybeSingle()

    if (taskError) throw taskError

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 })
    }

    if (task.status === "completed") {
      return NextResponse.json(
        { error: "This task is already completed." },
        { status: 409 }
      )
    }

    if (!isConnectorCapability(body.capability)) {
      return NextResponse.json(
        { error: "A valid connector capability is required." },
        { status: 400 },
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
      requestedCapability: body.capability,

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
          ? body.data as Record<string, unknown>
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
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error(
      "Task execution failed:",
      error
    )

    return NextResponse.json(
      {
        error: "Task execution failed.",
      },
      { status: 500 }
    )
  }
}