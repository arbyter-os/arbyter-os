import { readJsonBody } from "@/lib/security/request-body";
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assertApiBody } from "@/lib/validation/api-schemas"

import { validationErrorResponse } from "@/lib/validation/errors"
async function getContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { supabase, user: null, organizationId: null }

  const { data: profile, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle()

  return { supabase, user, organizationId: error ? null : profile?.organization_id ?? null }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, organizationId } = await getContext()
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    if (!organizationId) return NextResponse.json({ error: "No organization is associated with your account." }, { status: 403 })

    const { data: roleRecord, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
    if (roleError) throw roleError
    if (roleRecord?.role !== "owner" && roleRecord?.role !== "admin") {
      return NextResponse.json({ error: "Only an owner or admin can modify agent configuration." }, { status: 403 })
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "agents:create")
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "Agent name is required." }, { status: 400 })

    const { data, error } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: organizationId,
        name,
        description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : null,
        agent_type: typeof body?.agentType === "string" && body.agentType.trim() ? body.agentType.trim() : "general",
        status: "active",
      })
      .select("id, name, description, agent_type, status, created_at")
      .single()

    if (error) throw error
    return NextResponse.json({ agent: data })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Agent creation error:", error)
    return NextResponse.json({ error: "Failed to create agent." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user, organizationId } = await getContext()
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    if (!organizationId) return NextResponse.json({ error: "No organization is associated with your account." }, { status: 403 })

    const { data: roleRecord, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
    if (roleError) throw roleError
    if (roleRecord?.role !== "owner" && roleRecord?.role !== "admin") {
      return NextResponse.json({ error: "Only an owner or admin can modify agent configuration." }, { status: 403 })
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "agents:delete")
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : ""
    if (!agentId) return NextResponse.json({ error: "agentId is required." }, { status: 400 })

    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", agentId)
      .eq("organization_id", organizationId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Agent deletion error:", error)
    return NextResponse.json({ error: "Failed to delete agent." }, { status: 500 })
  }
}