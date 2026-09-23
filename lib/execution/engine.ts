import { createExecutionApproval } from "./approval"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { evaluateGovernance } from "@/lib/governance"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { getConnector } from "@/lib/connectors/registry"
import { resolveConnectionCredential } from "@/lib/credentials/runtime"
import { recordExecutionAudit } from "./audit"
import { sanitizeExecutionError } from "./error-sanitizer"
import { mapIntentParametersToConnectorPayload } from "@/lib/connectors/intent-mapping"

export type ExecutionInput = {
  organizationId: string
  agentId: string
  taskId?: string
  agentConnectionId?: string
  requestedCapability: import("@/lib/connectors/types").ConnectorCapability
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

  const supabase = await createClient()
  const { error } = await supabase
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

async function revalidateExecutionPrivilege(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", userId)
    .maybeSingle()

  if (
    error ||
    !data?.organization_id ||
    data.organization_id !== organizationId
  ) {
    throw new Error("Execution authorization could not be re-verified.")
  }

  if (data.role !== "owner" && data.role !== "admin") {
    throw new Error("Only an owner or admin can execute connector actions.")
  }
}

async function claimTask(
  organizationId: string,
  taskId: string | undefined
) {
  if (!taskId) {
    return
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to claim task for execution.")
  }

  if (!data) {
    throw new Error(
      "Task is already being executed or is not pending."
    )
  }
}

export async function executeAgentTask(
  input: ExecutionInput
) {
  const supabase = await createClient()
  const startedAt = new Date().toISOString()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Execution requires an authenticated user.")
  }

  const { data: caller, error: callerError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (callerError || !caller?.organization_id || caller.organization_id !== input.organizationId) {
    throw new Error("Execution authorization could not be verified.")
  }

  if (caller.role !== "owner" && caller.role !== "admin") {
    throw new Error("Only an owner or admin can execute connector actions.")
  }

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

    const { data: assignment, error: assignmentError } = await supabase
      .from("agent_tasks")
      .select("agent_id")
      .eq("task_id", input.taskId)
      .eq("agent_id", input.agentId)
      .maybeSingle()

    if (assignmentError || !assignment?.agent_id) {
      throw new Error("Task is not assigned to the requested agent.")
    }

    task = data
  }

  let connection = null

  if (input.agentConnectionId) {
    const { data, error } =
      await supabase
        .from("agent_connections")
        .select(
          "id, provider, status, health_status, capabilities, environment"
        )
        .eq("id", input.agentConnectionId)
        .eq("agent_id", input.agentId)
        .eq(
          "organization_id",
          input.organizationId
        )
        .eq("status", "connected")
        .maybeSingle()

    if (error) throw error

    if (data && data.health_status !== "unhealthy") {
      connection = data
    }
  } else {
    const { data, error } =
      await supabase
        .from("agent_connections")
        .select(
          "id, provider, status, health_status, capabilities, environment"
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

  const action = input.requestedCapability

  if (!connector.capabilities.includes(action)) {
    throw new Error(
      "Requested connector capability is not supported by this provider."
    )
  }

  if (capabilities[action] !== true) {
    throw new Error(
      "Requested connector capability is not enabled for this connection."
    )
  }

  // Contract enforcement: translate the LLM-generated intent parameters into
  // the connector's strict payload contract BEFORE any execution row is
  // created, so a contract violation cannot burn governance/audit state.
  // Governance and the persisted execution record keep receiving the ORIGINAL
  // intent data; only the final connector call receives the mapped payload.
  const connectorPayload = mapIntentParametersToConnectorPayload({
    action,
    parameters: input.data ?? {},
  })

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

  await claimTask(
    input.organizationId,
    input.taskId
  )

  const executionWriter = createAdminClient()

  const { data: execution, error: executionError } =
    await executionWriter
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
    await updateTaskStatus(
      input.organizationId,
      input.taskId,
      "pending"
    )
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

          // Governance context must come from trusted persisted state, not the
          // execution request. Caller-supplied jurisdiction/sector/country/state
          // values are intentionally ignored so they cannot bypass scoped rules.
          environment:
            typeof connection.environment === "string"
              ? connection.environment
              : undefined,
          data: input.data,
        }
      )

    const riskLevel = governance.risk ?? "low"

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
              capability: action,
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

    // TOCTOU hardening: the caller's role was verified at the start of this
    // request, but privileged state can change before the connector action
    // actually runs (role demotion, organization transfer). Re-verify
    // immediately before resolving credentials and executing, mirroring the
    // approval-resume revalidation path.
    await revalidateExecutionPrivilege(
      supabase,
      user.id,
      input.organizationId,
    )

    const credential =
      await resolveConnectionCredential({
        organizationId: input.organizationId,
        connectionId: connection.id,
      })

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

            data: connectorPayload.payload,
          },
        },
        {
          connectionId: connection.id,
          agentId: input.agentId,
          organizationId:
            input.organizationId,
          credential: credential ?? undefined,
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
    // Raw provider/infrastructure error text can expose internal endpoints,
    // provider error bodies and schema details, and execution audit rows are
    // member-readable. Store a fixed category message in the audit record and
    // keep the full diagnostic in server-side logs only.
    const sanitized = sanitizeExecutionError(error)
    console.error(
      `[execution] execution=${execution?.id ?? "unknown"} task=${input.taskId ?? "unknown"} category=${sanitized.category}:\n${sanitized.diagnostics}`,
    )

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
      errorMessage: sanitized.message,
    })

    throw error
  }
}
