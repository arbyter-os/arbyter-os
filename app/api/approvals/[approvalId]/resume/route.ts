import { NextResponse } from "next/server"
import { assertApiParam } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { resolveConnectionCredential } from "@/lib/credentials/runtime"
import { recordExecutionAudit } from "@/lib/execution/audit"
import { assertTaskAssignedToAgent } from "@/lib/execution/task-agent-authorization"
import { getConnector } from "@/lib/connectors/registry"
import {
  APPROVAL_INTEGRITY_HASH_METADATA_KEY,
  buildApprovalIntegrityEnvelope,
  hashApprovalIntegrityEnvelope,
} from "@/lib/security/approval-integrity"

type RouteContext = {
  params: Promise<{
    approvalId: string
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
        { error: "You must be signed in." },
        { status: 401 }
      )
    }

    const { approvalId } = await context.params
    assertApiParam(approvalId, "uuid", "approvalId")

    if (!approvalId) {
      return NextResponse.json(
        { error: "Approval ID is required." },
        { status: 400 }
      )
    }

    const { data: userRecord, error: userError } =
      await supabase
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

    if (
      userRecord.role !== "owner" &&
      userRecord.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an owner or admin can resume an approved execution.",
        },
        { status: 403 }
      )
    }

    const organizationId =
      userRecord.organization_id

    const {
      data: approval,
      error: approvalError,
    } = await supabase
      .from("approval_requests")
      .select(
        `
        id,
        agent_id,
        execution_id,
        requested_by,
        status,
        risk_level,
        title,
        description,
        metadata
        `
      )
      .eq("id", approvalId)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (approvalError) {
      throw approvalError
    }

    if (!approval) {
      return NextResponse.json(
        { error: "Approval request not found." },
        { status: 404 }
      )
    }

    if (approval.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "Only an approved request can be resumed.",
        },
        { status: 409 }
      )
    }

    if (!approval.requested_by || typeof approval.requested_by !== "string") {
      return NextResponse.json(
        { error: "This approval request has no valid requester and cannot be resumed." },
        { status: 409 },
      )
    }

    const { data: requesterRecord, error: requesterError } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("id", approval.requested_by)
      .maybeSingle()

    if (requesterError) {
      throw requesterError
    }

    if (
      !requesterRecord ||
      requesterRecord.organization_id !== organizationId
    ) {
      return NextResponse.json(
        { error: "This approval request has inconsistent requester information and cannot be processed." },
        { status: 409 },
      )
    }

    if (approval.requested_by === user.id) {
      return NextResponse.json(
        { error: "The requester cannot resume their own approval request." },
        { status: 409 },
      )
    }

    if (!approval.execution_id) {
      return NextResponse.json(
        {
          error:
            "This approval is not linked to an execution.",
        },
        { status: 400 }
      )
    }

    const {
      data: execution,
      error: executionError,
    } = await supabase
      .from("agent_executions")
      .select(
        `
        id,
        agent_id,
        agent_connection_id,
        task_id,
        status,
        input_data,
        risk_level
        `
      )
      .eq("id", approval.execution_id)
      .eq("organization_id", organizationId)
      .maybeSingle()

    if (executionError) {
      throw executionError
    }

    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found." },
        { status: 404 }
      )
    }

    if (execution.status === "completed") {
      return NextResponse.json({
        success: true,
        status: "completed",
        executionId: execution.id,
      })
    }

    if (execution.status === "running") {
      return NextResponse.json(
        {
          error: "This approved execution is already running.",
          executionId: execution.id,
        },
        { status: 409 }
      )
    }

    if (!execution.agent_connection_id) {
      return NextResponse.json(
        {
          error:
            "Approved execution is not linked to a connector connection.",
        },
        { status: 409 }
      )
    }

    const inputData =
      execution.input_data &&
      typeof execution.input_data === "object"
        ? (execution.input_data as Record<string, unknown>)
        : {}

    const task =
      inputData.task &&
      typeof inputData.task === "object"
        ? (inputData.task as Record<string, unknown>)
        : null

    const data =
      inputData.data &&
      typeof inputData.data === "object"
        ? (inputData.data as Record<string, unknown>)
        : {}

    const metadata =
      approval.metadata &&
      typeof approval.metadata === "object"
        ? approval.metadata as Record<string, unknown>
        : {}

    const approvedIntegrityHash =
      typeof metadata[APPROVAL_INTEGRITY_HASH_METADATA_KEY] === "string"
        ? metadata[APPROVAL_INTEGRITY_HASH_METADATA_KEY]
        : null
    const action =
      typeof metadata.action === "string"
        ? metadata.action
        : null
    const capability =
      typeof metadata.capability === "string"
        ? metadata.capability
        : null

    if (!approvedIntegrityHash || !action || !capability) {
      return NextResponse.json(
        { error: "This approval does not contain a complete integrity record and must be re-approved." },
        { status: 409 },
      )
    }

    const { data: currentConnection, error: currentConnectionError } =
      await supabase
        .from("agent_connections")
        .select("id, provider, status, health_status, capabilities, agent_id")
        .eq("id", execution.agent_connection_id)
        .eq("agent_id", execution.agent_id)
        .eq("organization_id", organizationId)
        .maybeSingle()

    if (currentConnectionError) {
      throw currentConnectionError
    }

    if (!currentConnection) {
      return NextResponse.json(
        { error: "The approved connector connection is no longer available." },
        { status: 409 },
      )
    }

    const integrityEnvelope = buildApprovalIntegrityEnvelope({
      execution_id: execution.id,
      agent_id: execution.agent_id,
      connection_id: execution.agent_connection_id,
      provider: currentConnection.provider,
      action,
      capability,
      input_data: execution.input_data,
      task_id: execution.task_id ?? null,
    })
    const currentIntegrityHash = hashApprovalIntegrityEnvelope(integrityEnvelope)
    const provider = currentConnection.provider

    if (currentIntegrityHash !== approvedIntegrityHash) {
      return NextResponse.json(
        { error: "The approved execution context has changed since approval. A new approval is required." },
        { status: 409 },
      )
    }

    if (
      currentConnection.status !== "connected" ||
      currentConnection.health_status === "unhealthy"
    ) {
      return NextResponse.json(
        { error: "The approved connector connection is no longer available." },
        { status: 409 },
      )
    }

    const currentConnector = getConnector(currentConnection.provider)
    if (!currentConnector || !currentConnector.capabilities.includes(capability as never)) {
      return NextResponse.json(
        { error: "The approved connector capability is no longer available." },
        { status: 409 },
      )
    }

    if (capability !== action) {
      return NextResponse.json(
        { error: "The approved action and capability no longer match." },
        { status: 409 },
      )
    }

    const currentCapabilities =
      currentConnection.capabilities &&
      typeof currentConnection.capabilities === "object" &&
      !Array.isArray(currentConnection.capabilities)
        ? (currentConnection.capabilities as Record<string, boolean>)
        : {}

    if (currentCapabilities[action] !== true) {
      return NextResponse.json(
        { error: "The approved connector capability is no longer enabled." },
        { status: 409 },
      )
    }

    if (execution.task_id) {
      try {
        await assertTaskAssignedToAgent(
          supabase,
          execution.task_id,
          execution.agent_id,
        )
      } catch (error) {
        console.error("Approved execution task-agent authorization failed:", error)
        return NextResponse.json(
          { error: "The approved task is no longer assigned to this agent." },
          { status: 409 },
        )
      }
    }

    const credential =
      await resolveConnectionCredential({
        organizationId,
        connectionId:
          execution.agent_connection_id,
      })

    if (!credential) {
      return NextResponse.json(
        {
          error:
            "No active credential is configured for the approved connection.",
        },
        { status: 409 }
      )
    }

    const executionWriter = createAdminClient()
    const { data: claimedExecution, error: claimError } =
      await executionWriter
        .from("agent_executions")
        .update({
          status: "running",
          error_message: null,
        })
        .eq("id", execution.id)
        .eq("organization_id", organizationId)
        .eq("agent_id", execution.agent_id)
        .eq("agent_connection_id", execution.agent_connection_id)
        .eq("task_id", execution.task_id)
        .eq("status", execution.status)
        // Keep the claim tied to the exact execution context we integrity-checked.
        // If another org member changed input_data before the claim, the
        // conditional update fails closed.
        .eq("input_data", execution.input_data)
        .select("id")
        .maybeSingle()

    if (claimError) {
      throw claimError
    }

    if (!claimedExecution) {
      return NextResponse.json(
        {
          error:
            "This approved execution was already claimed by another request.",
          executionId: execution.id,
        },
        { status: 409 }
      )
    }

    const result =
      await executeConnectorAction(
        provider,
        {
          action: action as never,
          payload: {
            taskId: execution.task_id,
            task,
            data,
          },
        },
        {
          connectionId:
            execution.agent_connection_id,
          agentId: execution.agent_id,
          organizationId,
          credential,
        }
      )

    if (!result.success) {
      await recordExecutionAudit({
        organizationId,
        executionId: execution.id,
        agentId: execution.agent_id,
        taskId: execution.task_id ?? undefined,
        status: "failed",
        riskLevel: execution.risk_level,
        output: {
          result,
        },
        errorMessage:
          result.error ??
          "Approved execution failed.",
      })

      return NextResponse.json(
        {
          success: false,
          status: "failed",
          executionId: execution.id,
          result,
        },
        { status: 502 }
      )
    }

    await recordExecutionAudit({
      organizationId,
      executionId: execution.id,
      agentId: execution.agent_id,
      taskId: execution.task_id ?? undefined,
      status: "completed",
      riskLevel: execution.risk_level,
      output: {
        result: result.data ?? null,
        resumedFromApproval: approval.id,
      },
    })

    if (execution.task_id) {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", execution.task_id)
        .eq("organization_id", organizationId)

      if (taskError) {
        throw taskError
      }
    }

    return NextResponse.json({
      success: true,
      status: "completed",
      executionId: execution.id,
      result: result.data ?? null,
    })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error(
      "Approved execution resume failed:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to resume approved execution.",
      },
      { status: 500 }
    )
  }
}
