import type { SupabaseClient } from "@supabase/supabase-js"

type AuthorizedResourceIds = {
  agentId?: string
  taskId?: string
  executionId?: string
  agentConnectionId?: string
}

export async function authorizeApprovalResources(
  supabase: SupabaseClient,
  organizationId: string,
  agentId: string,
  taskId: string
): Promise<boolean> {
  const [{ data: agent, error: agentError }, { data: task, error: taskError }] =
    await Promise.all([
      supabase
        .from("ai_agents")
        .select("id")
        .eq("id", agentId)
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id")
        .eq("id", taskId)
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ])

  if (agentError || taskError || !agent || !task) {
    return false
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("agent_tasks")
    .select("agent_id")
    .eq("task_id", task.id)
    .eq("agent_id", agent.id)
    .maybeSingle()

  return !assignmentError && Boolean(assignment)
}

export async function authorizeGovernanceResources(
  supabase: SupabaseClient,
  organizationId: string,
  resources: AuthorizedResourceIds
): Promise<boolean> {
  const checks = await Promise.all([
    resources.agentId
      ? supabase
          .from("ai_agents")
          .select("id")
          .eq("id", resources.agentId)
          .eq("organization_id", organizationId)
          .maybeSingle()
      : Promise.resolve(null),
    resources.taskId
      ? supabase
          .from("tasks")
          .select("id")
          .eq("id", resources.taskId)
          .eq("organization_id", organizationId)
          .maybeSingle()
      : Promise.resolve(null),
    resources.executionId
      ? supabase
          .from("agent_executions")
          .select("id")
          .eq("id", resources.executionId)
          .eq("organization_id", organizationId)
          .maybeSingle()
      : Promise.resolve(null),
    resources.agentConnectionId
      ? supabase
          .from("agent_connections")
          .select("id")
          .eq("id", resources.agentConnectionId)
          .eq("organization_id", organizationId)
          .maybeSingle()
      : Promise.resolve(null),
  ])

  const requested = [
    resources.agentId,
    resources.taskId,
    resources.executionId,
    resources.agentConnectionId,
  ]

  return checks.every((check, index) => {
    if (!requested[index]) return true
    return Boolean(check && !check.error && check.data)
  })
}

export async function authorizeAgentOrganization(
  supabase: SupabaseClient,
  organizationId: string,
  agentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id")
    .eq("id", agentId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  return !error && Boolean(data)
}
