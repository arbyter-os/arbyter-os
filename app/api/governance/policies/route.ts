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

    const { data: userRecord, error: userError } =
      await supabase
        .from("users")
        .select("organization_id")
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

    const organizationId = userRecord.organization_id

    const { data: policies, error: policiesError } =
      await supabase
        .from("governance_policies")
        .select(
          `
          id,
          name,
          description,
          policy_type,
          status,
          version,
          effective_date,
          review_date,
          authority,
          jurisdiction,
          sector,
          source_type,
          created_at
          `
        )
        .eq("organization_id", organizationId)
        .order("created_at", {
          ascending: false,
        })

    if (policiesError) {
      throw policiesError
    }

    const { data: rules, error: rulesError } =
      await supabase
        .from("governance_policy_rules")
        .select(
          `
          id,
          policy_id,
          name,
          description,
          rule_type,
          effect,
          priority,
          enabled
          `
        )
        .eq("organization_id", organizationId)
        .order("priority", {
          ascending: false,
        })

    if (rulesError) {
      throw rulesError
    }

    return NextResponse.json({
      success: true,
      policies: policies ?? [],
      rules: rules ?? [],
    })
  } catch (error) {
    console.error(
      "Failed to load governance policies:",
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load governance policies.",
      },
      { status: 500 }
    )
  }
}