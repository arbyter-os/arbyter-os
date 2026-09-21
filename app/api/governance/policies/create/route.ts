import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
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
            "Only an owner or admin can create governance policies.",
        },
        { status: 403 }
      )
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "governance:policy:create")

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : ""

    if (!name) {
      return NextResponse.json(
        { error: "Policy name is required." },
        { status: 400 }
      )
    }

    const { data: policy, error: policyError } =
      await supabase
        .from("governance_policies")
        .insert({
          organization_id:
            userRecord.organization_id,
          name,
          description:
            typeof body?.description === "string"
              ? body.description.trim() || null
              : null,
          policy_type:
            typeof body?.policyType === "string"
              ? body.policyType
              : "company",
          status: "active",
          version:
            typeof body?.version === "string"
              ? body.version
              : "1.0",
          effective_date:
            typeof body?.effectiveDate === "string"
              ? body.effectiveDate
              : new Date()
                  .toISOString()
                  .slice(0, 10),
          review_date:
            typeof body?.reviewDate === "string"
              ? body.reviewDate
              : null,
          source_type:
            typeof body?.sourceType === "string"
              ? body.sourceType
              : "company",
          authority:
            typeof body?.authority === "string"
              ? body.authority
              : null,
          jurisdiction:
            typeof body?.jurisdiction === "string"
              ? body.jurisdiction
              : null,
          sector:
            typeof body?.sector === "string"
              ? body.sector
              : null,
          source_reference:
            typeof body?.sourceReference === "string"
              ? body.sourceReference
              : null,
          source_url:
            typeof body?.sourceUrl === "string"
              ? body.sourceUrl
              : null,
          effective_from:
            typeof body?.effectiveFrom === "string"
              ? body.effectiveFrom
              : null,
          effective_until:
            typeof body?.effectiveUntil === "string"
              ? body.effectiveUntil
              : null,
        })
        .select()
        .single()

    if (policyError) throw policyError

    return NextResponse.json({
      success: true,
      policy,
    })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error(
      "Failed to create governance policy:",
      error
    )

    return NextResponse.json(
      {
        error: "Failed to create governance policy.",
      },
      { status: 500 }
    )
  }
}
