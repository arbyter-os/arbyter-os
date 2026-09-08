import { createClient } from '@/lib/supabase/server'
import AgentsClient from '@/components/agents/client'

export default async function AgentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: agents, error } = await supabase
    .from('ai_agents')
    .select(`
      id,
      name,
      description,
      agent_type,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load agents:', error)

    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Agents
        </h1>

        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Unable to load agents right now.
        </div>
      </main>
    )
  }

  const agentIds = (agents ?? []).map((agent) => agent.id)

  const { data: activities } = agentIds.length
    ? await supabase
        .from('agent_activity')
        .select('agent_id, created_at')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const { data: agentTasks } = agentIds.length
    ? await supabase
        .from('agent_tasks')
        .select('agent_id, assigned_at, completed_at')
        .in('agent_id', agentIds)
    : { data: [] }

  const lastActivityByAgent = new Map<string, string>()

  for (const activity of activities ?? []) {
    if (!lastActivityByAgent.has(activity.agent_id)) {
      lastActivityByAgent.set(
        activity.agent_id,
        activity.created_at
      )
    }
  }

  const taskCountByAgent = new Map<string, number>()

  for (const task of agentTasks ?? []) {
    taskCountByAgent.set(
      task.agent_id,
      (taskCountByAgent.get(task.agent_id) ?? 0) + 1
    )
  }

  const normalizedAgents = (agents ?? []).map((agent) => ({
    id: agent.id,
    name: agent.name,
    purpose:
      agent.description ||
      'AI agent registered in the Arbyter governance environment.',
    team: agent.agent_type || 'AI Operations',
    status:
      agent.status === 'paused'
        ? 'Paused'
        : agent.status === 'needs_review'
          ? 'Needs Review'
          : 'Active',
    risk: 'Medium' as const,
    tasks: taskCountByAgent.get(agent.id) ?? 0,
    lastActivity:
      lastActivityByAgent.get(agent.id) ?? 'No activity recorded',
  }))

  return <AgentsClient initialAgents={normalizedAgents} />
}