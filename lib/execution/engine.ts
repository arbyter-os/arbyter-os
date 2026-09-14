import { createClient } from "@/lib/supabase/server"
import { evaluateGovernance } from "@/lib/governance"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { getConnector } from "@/lib/connectors/registry"

export type ExecutionInput = {
  organizationId: string
  agentId: string
  taskId?: string
  agentConnectionId?: string
  environment?: string
  country?: string
  state?: string
  jurisdiction?: string
  sector?: string
  data?: Record<string, unknown>
}

export async function executeAgentTask(
  input: ExecutionInput
) {
  const supabase = await createClient()

  const startedAt = new Date().toISOString()

  const { data: agent, error: agentError } =
    await supabase
      .from("ai_agents")
      .select("id, name, status")
      .eq("id", input.agentId)
      .eq("organization_id", input.organizationId)
      .maybeSingle()

  if (agentError) throw agentError

  if (!agent) {
    throw new Error("Agent not found.")
  }

  if (agent.status === "paused") {
    throw new Error("Agent is paused.")
  }

  let task = null

  if (input.taskId) {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority"
      )
      .eq("id", input.taskId)
      .eq("organization_id", input.organizationId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      throw new Error("Task not found.")
    }

    task = data
  }

  let connection = null

  if (input.agentConnectionId) {
    const { data, error } =
      await supabase
        .from("agent_connections")
        .select(
          "id, provider, status, health_status, capabilities"
        )
        .eq("id", input.agentConnectionId)
        .eq("agent_id", input.agentId)
        .eq(
          "organization_id",
          input.organizationId
        )
        .maybeSingle()

    if (error) throw error

    connection = data
  } else {
    const { data, error } =
      await supabase
        .from("agent_connections")
        .select(
          "id, provider, status, health_status, capabilities"
        )
        .eq("agent_id", input.agentId)
        .eq(
          "organization_id",
          input.organizationId
        )
        .order("updated_at", {
          ascending: false,
        })

    if (error) throw error

    connection =
      (data ?? []).find(
        (item) =>
          item.status === "connected" &&
          item.health_status !== "unhealthy" &&
          getConnector(item.provider) !==
            undefined
      ) ?? null
  }

  if (!connection) {
    throw new Error(
      "No usable connector connection found."
    )
  }

  const connector = getConnector(
    connection.provider
  )

  if (!connector) {
    throw new Error(
      `No connector is registered for ${connection.provider}.`
    )
  }

  const capabilities =
    connection.capabilities &&
    typeof connection.capabilities ===
      "object" &&
    !Array.isArray(connection.capabilities)
      ? (connection.capabilities as Record<
          string,
          boolean
        >)
      : {}

  const action = connector.capabilities.find(
    (capability) =>
      capabilities[capability] === true
  )

  if (!action) {
    throw new Error(
      "No executable connector capability is configured."
    )
  }

  const executionInput = {
    task: task
      ? {
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
        }
      : null,
    agent: {
      id: agent.id,
      name: agent.name,
      status: agent.status,
    },
    connection: {
      id: connection.id,
      provider: connection.provider,
    },
    data: input.data ?? {},
  }

  const { data: execution, error: executionError } =
    await supabase
      .from("agent_executions")
      .insert({
        organization_id:
          input.organizationId,
        agent_id: input.agentId,
        agent_connection_id:
          connection.id,
        task_id: input.taskId ?? null,
        execution_type: "task",
        status: "running",
        input_data: executionInput,
        output_data: {},
        risk_level: "low",
        started_at: startedAt,
      })
      .select()
      .single()

  if (executionError) {
    throw executionError
  }

  try {
    const governance =
      await evaluateGovernance(
        input.organizationId,
        {
          action,
          tool: connection.provider,
          agentId: input.agentId,
          taskId: input.taskId,
          executionId: execution.id,
          agentConnectionId: connection.id,

          agent: {
            id: agent.id,
            name: agent.name,
            status: agent.status,
          },

          task: task
            ? {
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
              }
            : undefined,

          connection: {
            id: connection.id,
            provider: connection.provider,
          },

          environment: input.environment,
          country: input.country,
          state: input.state,
          jurisdiction: input.jurisdiction,
          sector: input.sector,
          data: input.data,
        }
      )

    const riskLevel =
      governance.risk?.level ?? "low"

    if (
      governance.decision.decision ===
      "BLOCK"
    ) {
      await supabase
        .from("agent_executions")
        .update({
          status: "blocked",
          risk_level: riskLevel,
          output_data: {
            governance,
          },
          completed_at:
            new Date().toISOString(),
          error_message:
            governance.decision.reason ??
            "Execution blocked by governance.",
        })
        .eq("id", execution.id)

      return {
        success: false,
        executionId: execution.id,
        status: "blocked",
        governance,
      }
    }

    if (
      governance.decision.decision ===
        "REQUIRE_APPROVAL" ||
      governance.decision.decision ===
        "FLAG"
    ) {
      await supabase
        .from("agent_executions")
        .update({
          status:
            governance.decision.decision ===
            "REQUIRE_APPROVAL"
              ? "awaiting_approval"
              : "flagged",
          risk_level: riskLevel,
          output_data: {
            governance,
          },
        })
        .eq("id", execution.id)

      return {
        success: false,
        executionId: execution.id,
        status:
          governance.decision.decision ===
          "REQUIRE_APPROVAL"
            ? "awaiting_approval"
            : "flagged",
        governance,
      }
    }

    const result =
      await executeConnectorAction(
        connection.provider,
        {
          action,
          payload: {
            taskId: input.taskId,
            task: task
              ? {
                  title: task.title,
                  description:
                    task.description,
                  priority: task.priority,
                }
              : null,
            data: input.data ?? {},
          },
        },
        {
          connectionId: connection.id,
          agentId: input.agentId,
          organizationId:
            input.organizationId,
        }
      )

    if (!result.success) {
      await supabase
        .from("agent_executions")
        .update({
          status: "failed",
          risk_level: riskLevel,
          output_data: {
            governance,
            result,
          },
          error_message:
            result.error ??
            "Connector execution failed.",
          completed_at:
            new Date().toISOString(),
        })
        .eq("id", execution.id)

      return {
        success: false,
        executionId: execution.id,
        status: "failed",
        governance,
        result,
      }
    }

    await supabase
      .from("agent_executions")
      .update({
        status: "completed",
        risk_level: riskLevel,
        output_data: {
          governance,
          result: result.data ?? null,
        },
        completed_at:
          new Date().toISOString(),
      })
      .eq("id", execution.id)

    return {
      success: true,
      executionId: execution.id,
      status: "completed",
      governance,
      result: result.data ?? null,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Execution failed."

    await supabase
      .from("agent_executions")
      .update({
        status: "failed",
        error_message: message,
        output_data: {},
        completed_at:
          new Date().toISOString(),
      })
      .eq("id", execution.id)

    throw error
  }
}