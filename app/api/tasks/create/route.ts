import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    const body = await readJsonBody(request)
    assertApiBody(body, "tasks:create")
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const agentId = typeof body?.agentId === "string" ? body.agentId.trim() : ""
    const priority = typeof body?.priority === "string" ? body.priority : "medium"
    if (!title || !agentId) return NextResponse.json({ error: "Task title and agent are required." }, { status: 400 })
    if (!["low", "medium", "high", "critical"].includes(priority)) return NextResponse.json({ error: "Invalid priority." }, { status: 400 })

    const { data: profile, error: profileError } = await supabase.from("users").select("organization_id").eq("id", user.id).single()
    if (profileError || !profile?.organization_id) return NextResponse.json({ error: "No organization is associated with your account." }, { status: 403 })
    const organizationId = profile.organization_id

    const { data: agent, error: agentError } = await supabase.from("ai_agents").select("id").eq("id", agentId).eq("organization_id", organizationId).maybeSingle()
    if (agentError) throw agentError
    if (!agent) return NextResponse.json({ error: "Agent not found in your organization." }, { status: 404 })

    const { data: task, error: taskError } = await supabase.from("tasks").insert({ organization_id: organizationId, title, description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : null, status: "pending", priority, created_by: user.id }).select("id").single()
    if (taskError) throw taskError

    const { error: assignmentError } = await supabase.from("agent_tasks").insert({ task_id: task.id, agent_id: agent.id })
    if (assignmentError) {
      await supabase.from("tasks").delete().eq("id", task.id).eq("organization_id", organizationId)
      throw assignmentError
    }
    return NextResponse.json({ taskId: task.id })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Task creation error:", error)
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 })
  }
}