import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  executeGovernanceAction,
  type GovernanceActionContext,
} from "@/lib/governance/action-executor"
import type { GovernanceAction } from "@/lib/governance/action-recommendations"

const VALID_ACTIONS: GovernanceAction[] = [
  "approve",
  "block",
  "request_approval",
  "modify_policy",
  "pause_agent",
  "disable_tool",
  "retest",
  "investigate",
  "create_remediation",
  "view_regulation",
]

const ADMIN_ACTIONS = new Set<GovernanceAction>([
  "approve",
  "block",
  "modify_policy",
  "pause_agent",
  "disable_tool",
])

export async function POST(request: Request) {
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

    const body = await readJsonBody(request)
    assertApiBody(body, "governance:action")

    const action = body?.action as GovernanceAction

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: "A valid governance action is required." },
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
      ADMIN_ACTIONS.has(action) &&
      userRecord.role !== "owner" &&
      userRecord.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only an owner or admin can perform this governance action.",
        },
        { status: 403 }
      )
    }

    const context: GovernanceActionContext = {
      organizationId: userRecord.organization_id,
      agentId:
        typeof body.agentId === "string"
          ? body.agentId
          : undefined,
      taskId:
        typeof body.taskId === "string"
          ? body.taskId
          : undefined,
      tool:
        typeof body.tool === "string"
          ? body.tool
          : undefined,
      executionId:
        typeof body.executionId === "string"
          ? body.executionId
          : undefined,
      action,
    }

    const result = await executeGovernanceAction(context)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error(
      "Governance action execution failed:",
      error
    )

    return NextResponse.json(
      {
        error: "Governance action failed.",
      },
      { status: 500 }
    )
  }
}
