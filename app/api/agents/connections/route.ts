import { readJsonBody } from "@/lib/security/request-body";
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { assertApiBody } from "@/lib/validation/api-schemas"

import { validationErrorResponse } from "@/lib/validation/errors"
async function getContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { supabase, user: null, organizationId: null }
  const { data: profile, error } = await supabase.from("users").select("organization_id").eq("id", user.id).maybeSingle()
  return { supabase, user, organizationId: error ? null : profile?.organization_id ?? null }
}

function connectionFields(body: any) {
  return {
    connection_type: typeof body?.connectionType === "string" ? body.connectionType : "api",
    provider: typeof body?.provider === "string" ? body.provider.trim() : "",
    endpoint_url: typeof body?.endpointUrl === "string" && body.endpointUrl.trim() ? body.endpointUrl.trim() : null,
    environment: typeof body?.environment === "string" ? body.environment : "production",
    configuration: body?.configuration && typeof body.configuration === "object" && !Array.isArray(body.configuration) ? body.configuration : {},
    capabilities: body?.capabilities && typeof body.capabilities === "object" && !Array.isArray(body.capabilities) ? body.capabilities : {},
  }
}

async function verifyAgent(supabase: any, agentId: string, organizationId: string) {
  const { data, error } = await supabase.from("ai_agents").select("id").eq("id", agentId).eq("organization_id", organizationId).maybeSingle()
  if (error) throw error
  return Boolean(data)
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
    assertApiBody(body, "agents:connections:update")
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : ""
    if (!agentId || !(await verifyAgent(supabase, agentId, organizationId))) return NextResponse.json({ error: "Agent not found." }, { status: 404 })
    const fields = connectionFields(body)
    const { data, error } = await supabase.from("agent_connections").insert({ organization_id: organizationId, agent_id: agentId, ...fields, status: "pending" }).select("id, status, health_status, last_connected_at, connection_type, provider, endpoint_url, environment, capabilities").single()
    if (error) throw error
    await createAdminClient().from("agent_connection_events").insert({ organization_id: organizationId, agent_id: agentId, agent_connection_id: data.id, event_type: "created", metadata: { source: "agents_ui" } })
    return NextResponse.json({ connection: data })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Connection creation error:", error)
    return NextResponse.json({ error: "Failed to create connection." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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
    assertApiBody(body, "agents:connections:create")
    const connectionId = typeof body?.connectionId === "string" ? body.connectionId.trim() : ""
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : ""
    if (!connectionId || !agentId) return NextResponse.json({ error: "connectionId and agentId are required." }, { status: 400 })
    if (!(await verifyAgent(supabase, agentId, organizationId))) return NextResponse.json({ error: "Agent not found." }, { status: 404 })
    const fields = connectionFields(body)
    const { data, error } = await supabase.from("agent_connections").update(fields).eq("id", connectionId).eq("agent_id", agentId).eq("organization_id", organizationId).select("id, status, health_status, last_connected_at, connection_type, provider, endpoint_url, environment, capabilities").single()
    if (error) throw error
    await createAdminClient().from("agent_connection_events").insert({ organization_id: organizationId, agent_id: agentId, agent_connection_id: connectionId, event_type: "connected", metadata: { source: "agents_ui", action: "updated" } })
    return NextResponse.json({ connection: data })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Connection update error:", error)
    return NextResponse.json({ error: "Failed to update connection." }, { status: 500 })
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
    assertApiBody(body, "agents:connections:delete")
    const connectionId = typeof body?.connectionId === "string" ? body.connectionId.trim() : ""
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : ""
    if (!connectionId || !agentId) return NextResponse.json({ error: "connectionId and agentId are required." }, { status: 400 })
    const { error } = await supabase.from("agent_connections").delete().eq("id", connectionId).eq("agent_id", agentId).eq("organization_id", organizationId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Connection deletion error:", error)
    return NextResponse.json({ error: "Failed to delete connection." }, { status: 500 })
  }
}