import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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

    const { data, error } = await supabase
      .from("approval_requests")
      .select(`
        id,
        organization_id,
        agent_id,
        execution_id,
        governance_decision_id,
        requested_by,
        assigned_to,
        title,
        description,
        risk_level,
        status,
        decision_note,
        requested_at,
        resolved_at,
        metadata,
        ai_agents (
          id,
          name,
          agent_type,
          status
        )
      `)
      .eq(
        "organization_id",
        userRecord.organization_id
      )
      .order("requested_at", {
        ascending: false,
      })

    if (error) {
      throw error
    }

    const approvals = (data ?? []).map(
      (approval) => {
        const agent = Array.isArray(
          approval.ai_agents
        )
          ? approval.ai_agents[0]
          : approval.ai_agents

        return {
          id: approval.id,
          agentId: approval.agent_id,
          executionId:
            approval.execution_id,
          governanceDecisionId:
            approval.governance_decision_id,
          requestedBy:
            approval.requested_by,
          assignedTo:
            approval.assigned_to,
          title: approval.title,
          description:
            approval.description,
          riskLevel:
            approval.risk_level,
          status: approval.status,
          decisionNote:
            approval.decision_note,
          requestedAt:
            approval.requested_at,
          resolvedAt:
            approval.resolved_at,
          metadata:
            approval.metadata ?? {},
          agent: agent
            ? {
                id: agent.id,
                name: agent.name,
                type: agent.agent_type,
                status: agent.status,
              }
            : null,
        }
      }
    )

    const pending = approvals.filter(
      (approval) =>
        approval.status === "pending"
    )

    return NextResponse.json({
      success: true,
      approvals,
      pending,
      pendingCount: pending.length,
    })
  } catch (error) {
    console.error(
      "Failed to load approvals:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load approvals.",
      },
      { status: 500 }
    )
  }
}