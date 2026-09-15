import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const body = await request.json()

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
          effect:
            typeof body?.effect === "string"
              ? body.effect
              : "flag",
          conditions:
            body?.conditions &&
            typeof body.conditions === "object"
              ? body.conditions
              : {},
          priority:
            typeof body?.priority === "number"
              ? body.priority
              : 100,
          enabled:
            typeof body?.enabled === "boolean"
              ? body.enabled
              : true,
          version:
            typeof body?.version === "string"
              ? body.version
              : "1.0",
          scope:
            body?.scope &&
            typeof body.scope === "object"
              ? body.scope
              : {},
          exceptions:
            body?.exceptions &&
            typeof body.exceptions === "object"
              ? body.exceptions
              : {},
        })
        .select()
        .single()

    if (ruleError) throw ruleError

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error) {
    console.error(
      "Failed to create governance rule:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create governance rule.",
      },
      { status: 500 }
    )
  }
}