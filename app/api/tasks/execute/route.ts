import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { getConnector } from "@/lib/connectors/registry"

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

    const { data: connections, error: connectionError } =
      await supabase
        .from("agent_connections")
        .select(
          "id, provider, status, health_status, capabilities"
        )
        .eq("agent_id", agentId)
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })

    if (connectionError) throw connectionError

    const connection = (connections ?? []).find(
      (item) =>
        item.status === "connected" &&
        item.health_status !== "unhealthy" &&
        getConnector(item.provider) !== undefined
    )

    if (!connection) {
      return NextResponse.json(
        {
          error:
            "The assigned agent has no usable connector connection.",
        },
        { status: 400 }
      )
    }

    const connector = getConnector(connection.provider)

    if (!connector) {
      return NextResponse.json(
        {
          error:
            "No connector is registered for this agent connection.",
        },
        { status: 400 }
      )
    }

    const configuredCapabilities = Array.isArray(
      connection.capabilities
    )
      ? connection.capabilities
      : []

    const action = connector.capabilities.find((capability) =>
      configuredCapabilities.includes(capability)
    )

    if (!action) {
      return NextResponse.json(
        {
          error:
            "The agent connection has no executable capability configured.",
        },
        { status: 400 }
      )
    }

    const payload = {
      taskId: task.id,
      task: {
        title: task.title,
        description: task.description,
        priority: task.priority,
      },
    }

    const { error: runningError } = await supabase
      .from("tasks")
      .update({ status: "running" })
      .eq("id", task.id)
      .eq("organization_id", organizationId)

    if (runningError) throw runningError

    const result = await executeConnectorAction(
      connection.provider,
      {
        action,
        payload,
      },
      {
        connectionId: connection.id,
        agentId,
        organizationId,
      }
    )

    if (!result.success) {
      await supabase
        .from("tasks")
        .update({ status: "blocked" })
        .eq("id", task.id)
        .eq("organization_id", organizationId)

      return NextResponse.json(
        {
          error: result.error ?? "Task execution failed.",
          taskId: task.id,
          agentId,
          provider: connection.provider,
          action,
        },
        { status: 502 }
      )
    }

    const { error: completedError } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", task.id)
      .eq("organization_id", organizationId)

    if (completedError) throw completedError

    return NextResponse.json({
      success: true,
      taskId: task.id,
      agentId,
      agentName: agent.name,
      provider: connection.provider,
      action,
      result: result.data ?? null,
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