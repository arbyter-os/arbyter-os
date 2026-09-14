import { createExecutionApproval } from "./approval"
import { createClient } from "@/lib/supabase/server"
import { evaluateGovernance } from "@/lib/governance"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { getConnector } from "@/lib/connectors/registry"
import { recordExecutionAudit } from "./audit"

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

async function updateTaskStatus(
  organizationId: string,
  taskId: string | undefined,
  status: string
) {
  if (!taskId) {
    return
  }

  const { error } = await createClient()
    .from("tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("organization_id", organizationId)

  if (error) {
    throw new Error(
      `Failed to update task status: ${error.message}`
    )
  }
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

    if (data.status === "completed") {
      throw new Error(
        "Task has already been completed."
      )
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
    typeof connection.capabilities === "object" &&
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
    await updateTaskStatus(
      input.organizationId,
      input.taskId,
      "running"
    )

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
      await updateTaskStatus(
        input.organizationId,
        input.taskId,
        "blocked"
      )

      const audit =
        await recordExecutionAudit({
          organizationId:
            input.organizationId,
          executionId: execution.id,
          agentId: input.agentId,
          taskId: input.taskId,
          status: "blocked",
          riskLevel,
          output: {
            governance,
          },
          errorMessage:
            governance.decision.reason ??
            "Execution blocked by governance.",
        })

      return {
        success: false,
        executionId: execution.id,
        status: "blocked",
        governance,
        audit,
      }
    }

    if (
      governance.decision.decision ===
        "REQUIRE_APPROVAL" ||
      governance.decision.decision ===
        "FLAG"
    ) {
      const status =
        governance.decision.decision ===
        "REQUIRE_APPROVAL"
          ? "awaiting_approval"
          : "flagged"

      await updateTaskStatus(
        input.organizationId,
        input.taskId,
        status
      )

      let approval = null

      if (
        governance.decision.decision ===
        "REQUIRE_APPROVAL"
      ) {
        approval =
          await createExecutionApproval({
            organizationId:
              input.organizationId,
            agentId: input.agentId,
            executionId: execution.id,
            taskId: input.taskId,
            riskLevel,
            title:
              task?.title ??
              "Agent action requires approval.",
            description:
              task?.description ??
              "Governance requires human approval before this agent action can continue.",
            metadata: {
              provider:
                connection.provider,
              action,
              governanceDecision:
                governance.decision,
            },
          })
      }

      const audit =
        await recordExecutionAudit({
          organizationId:
            input.organizationId,
          executionId: execution.id,
          agentId: input.agentId,
          taskId: input.taskId,
          status,
          riskLevel,
          output: {
            governance,
            approval,
          },
        })

      return {
        success: false,
        executionId: execution.id,
        status,
        governance,
        approval,
        audit,
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
      await updateTaskStatus(
        input.organizationId,
        input.taskId,
        "blocked"
      )

      const audit =
        await recordExecutionAudit({
          organizationId:
            input.organizationId,
          executionId: execution.id,
          agentId: input.agentId,
          taskId: input.taskId,
          status: "failed",
          riskLevel,
          output: {
            governance,
            result,
          },
          errorMessage:
            result.error ??
            "Connector execution failed.",
        })

      return {
        success: false,
        executionId: execution.id,
        status: "failed",
        governance,
        result,
        audit,
      }
    }

    await updateTaskStatus(
      input.organizationId,
      input.taskId,
      "completed"
    )

    const audit =
      await recordExecutionAudit({
        organizationId:
          input.organizationId,
        executionId: execution.id,
        agentId: input.agentId,
        taskId: input.taskId,
        status: "completed",
        riskLevel,
        output: {
          governance,
          result: result.data ?? null,
        },
      })

    return {
      success: true,
      executionId: execution.id,
      status: "completed",
      governance,
      result: result.data ?? null,
      audit,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Execution failed."

    await updateTaskStatus(
      input.organizationId,
      input.taskId,
      "blocked"
    )

    await recordExecutionAudit({
      organizationId:
        input.organizationId,
      executionId: execution.id,
      agentId: input.agentId,
      taskId: input.taskId,
      status: "failed",
      riskLevel: "high",
      output: {},
      errorMessage: message,
    })

    throw error
  } 
}