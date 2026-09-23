import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOVERNANCE_EFFECTS = new Set([
  "allow",
  "block",
  "require_approval",
  "flag",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

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

    const { data: userRecord, error: userError } =
      await supabase
        .from("users")
        .select("organization_id, role")
        .eq("id", user.id)
        .maybeSingle()

    if (userError) throw userError

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
            "Only an owner or admin can create governance rules.",
        },
        { status: 403 }
      )
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "governance:rule:create")

    const policyId =
      typeof body?.policyId === "string"
        ? body.policyId
        : ""

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : ""

    if (!policyId || !name) {
      return NextResponse.json(
        {
          error:
            "Policy ID and rule name are required.",
        },
        { status: 400 }
      )
    }

    if (name.length > 200) {
      return NextResponse.json(
        { error: "Rule name must be 200 characters or fewer." },
        { status: 400 }
      )
    }

    const effect =
      typeof body?.effect === "string" ? body.effect.trim().toLowerCase() : "flag"

    if (!GOVERNANCE_EFFECTS.has(effect)) {
      return NextResponse.json(
        { error: "Rule effect must be allow, block, require_approval, or flag." },
        { status: 400 }
      )
    }

    const priority = typeof body?.priority === "number" ? body.priority : 100
    if (!Number.isSafeInteger(priority) || priority < 0 || priority > 1_000_000) {
      return NextResponse.json(
        { error: "Rule priority must be an integer between 0 and 1000000." },
        { status: 400 }
      )
    }

    if (!isRecord(body?.conditions) && body?.conditions !== undefined) {
      return NextResponse.json({ error: "Rule conditions must be an object." }, { status: 400 })
    }

    if (!isRecord(body?.scope) && body?.scope !== undefined) {
      return NextResponse.json({ error: "Rule scope must be an object." }, { status: 400 })
    }

    if (!isRecord(body?.exceptions) && body?.exceptions !== undefined) {
      return NextResponse.json({ error: "Rule exceptions must be an object." }, { status: 400 })
    }

    const { data: policy, error: policyError } =
      await supabase
        .from("governance_policies")
        .select("id")
        .eq("id", policyId)
        .eq(
          "organization_id",
          userRecord.organization_id
        )
        .maybeSingle()

    if (policyError) throw policyError

    if (!policy) {
      return NextResponse.json(
        {
          error:
            "Governance policy not found.",
        },
        { status: 404 }
      )
    }

    const { data: rule, error: ruleError } =
      await supabase
        .from("governance_policy_rules")
        .insert({
          organization_id:
            userRecord.organization_id,
          policy_id: policyId,
          name,
          description:
            typeof body?.description === "string"
              ? body.description.trim() || null
              : null,
          rule_type:
            typeof body?.ruleType === "string"
              ? body.ruleType
              : "governance",
          effect,
          conditions:
            isRecord(body?.conditions) ? body.conditions : {},
          priority,
          enabled:
            typeof body?.enabled === "boolean"
              ? body.enabled
              : true,
          version:
            typeof body?.version === "string"
              ? body.version
              : "1.0",
          scope:
            isRecord(body?.scope) ? body.scope : {},
          exceptions:
            isRecord(body?.exceptions) ? body.exceptions : {},
        })
        .select()
        .single()

    if (ruleError) throw ruleError

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error(
      "Failed to create governance rule:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to create governance rule.",
      },
      { status: 500 }
    )
  }
}