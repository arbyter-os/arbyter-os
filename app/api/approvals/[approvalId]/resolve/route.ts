import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
        {
          error: "You must be signed in.",
        },
        { status: 401 }
      )
    }

    const { approvalId } = await context.params

    if (!approvalId) {
      return NextResponse.json(
        {
          error: "Approval ID is required.",
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    const decision =
      body?.decision === "approved" ||
      body?.decision === "rejected"
        ? body.decision
        : null

    if (!decision) {
      return NextResponse.json(
        {
          error:
            'Decision must be "approved" or "rejected".',
        },
        { status: 400 }
      )
    }

    const decisionNote =
      typeof body?.decisionNote === "string"
        ? body.decisionNote
        : null

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

    if (
      userRecord.role !== "owner" &&
      userRecord.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only organization owners or admins can resolve approvals.",
        },
        { status: 403 }
      )
    }

    const { data: approval, error: approvalError } =
      await supabase
        .from("approval_requests")
        .select(
          `
          id,
          organization_id,
          agent_id,
          execution_id,
          title,
          status
          `
        )
        .eq("id", approvalId)
        .eq(
          "organization_id",
          userRecord.organization_id
        )
        .maybeSingle()

    if (approvalError) {
      throw approvalError
    }

    if (!approval) {
      return NextResponse.json(
        {
          error: "Approval request not found.",
        },
        { status: 404 }
      )
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "This approval request has already been resolved.",
        },
        { status: 409 }
      )
    }

    const resolvedAt =
      new Date().toISOString()

    const { data: updatedApproval, error: updateError } =
      await supabase
        .from("approval_requests")
        .update({
          status: decision,
          assigned_to: user.id,
          decision_note: decisionNote,
          resolved_at: resolvedAt,
        })
        .eq("id", approval.id)
        .eq(
          "organization_id",
          userRecord.organization_id
        )
        .select()
        .single()

    if (updateError) {
      throw updateError
    }

    if (approval.execution_id) {
      const executionStatus =
        decision === "approved"
          ? "approved"
          : "blocked"

      const { error: executionError } =
        await supabase
          .from("agent_executions")
          .update({
            status: executionStatus,
            output_data: {
              approval: {
                approvalId: approval.id,
                decision,
                decisionNote,
                resolvedAt,
                resolvedBy: user.id,
              },
            },
            error_message:
              decision === "rejected"
                ? decisionNote ??
                  "Execution rejected by human approval."
                : null,
            completed_at:
              decision === "rejected"
                ? resolvedAt
                : null,
          })
          .eq("id", approval.execution_id)
          .eq(
            "organization_id",
            userRecord.organization_id
          )

      if (executionError) {
        throw executionError
      }
    }

    if (approval.execution_id) {
      const { data: execution } =
        await supabase
          .from("agent_executions")
          .select("task_id")
          .eq("id", approval.execution_id)
          .maybeSingle()

      if (execution?.task_id) {
        const taskStatus =
          decision === "approved"
            ? "pending"
            : "blocked"

        const { error: taskError } =
          await supabase
            .from("tasks")
            .update({
              status: taskStatus,
              updated_at: resolvedAt,
            })
            .eq(
              "id",
              execution.task_id
            )
            .eq(
              "organization_id",
              userRecord.organization_id
            )

        if (taskError) {
          throw taskError
        }
      }
    }

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      executionStatus:
        decision === "approved"
          ? "approved"
          : "blocked",
      nextTaskStatus:
        decision === "approved"
          ? "pending"
          : "blocked",
    })
  } catch (error) {
    console.error(
      "Approval resolution failed:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Approval resolution failed.",
      },
      { status: 500 }
    )
  }
}