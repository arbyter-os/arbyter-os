import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { executeConnectorAction } from "@/lib/connectors/runtime"
import { resolveConnectionCredential } from "@/lib/credentials/runtime"
import { recordExecutionAudit } from "@/lib/execution/audit"

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
        ? (execution.input_data as Record<
            string,
            unknown
          >)
        : {}

    const connection =
      inputData.connection &&
      typeof inputData.connection === "object"
        ? (inputData.connection as Record<
            string,
            unknown
          >)
        : {}

    const task =
      inputData.task &&
      typeof inputData.task === "object"
        ? (inputData.task as Record<
            string,
            unknown
          >)
        : null

    const data =
      inputData.data &&
      typeof inputData.data === "object"
        ? (inputData.data as Record<
            string,
            unknown
          >)
        : {}

    const provider =
      typeof connection.provider === "string"
        ? connection.provider
        : null

    if (!provider) {
      throw new Error(
        "Execution does not contain a connector provider."
      )
    }

    const metadata =
      approval.metadata &&
      typeof approval.metadata === "object"
        ? approval.metadata as Record<
            string,
            unknown
          >
        : {}

    const action =
      typeof metadata.action === "string"
        ? metadata.action
        : null

    if (!action) {
      throw new Error(
        "Approved execution does not contain an executable action."
      )
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

    await supabase
      .from("agent_executions")
      .update({
        status: "running",
        error_message: null,
      })
      .eq("id", execution.id)
      .eq("organization_id", organizationId)

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
      await supabase
        .from("tasks")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", execution.task_id)
        .eq("organization_id", organizationId)
    }

    return NextResponse.json({
      success: true,
      status: "completed",
      executionId: execution.id,
      result: result.data ?? null,
    })
  } catch (error) {
    console.error(
      "Approved execution resume failed:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resume approved execution.",
      },
      { status: 500 }
    )
  }
}
