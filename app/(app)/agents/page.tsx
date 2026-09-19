import { createClient } from '@/lib/supabase/server'
import AgentsClient from './client'

export default async function AgentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  /*
   * Resolve the organization belonging to the authenticated user.
   * All agent data below is scoped to this organization.
   */
  const {
    data: userRecord,
    error: userError,
  } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (userError || !userRecord?.organization_id) {
    console.error(
      'Failed to resolve user organization:',
      userError
    )

    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Agents
        </h1>

        <div className="glass rounded-2xl p-6 text-sm text-destructive">
          Unable to determine your organization.
        </div>
      </main>
    )
  }

  const organizationId = userRecord.organization_id

  /*
   * Load only agents belonging to the authenticated user's
   * organization.
   */
  const {
    data: agents,
    error: agentsError,
  } = await supabase
    .from('ai_agents')
    .select(`
      id,
      name,
      description,
      agent_type,
      status,
      created_at
    `)
    .eq('organization_id', organizationId)
    .order('created_at', {
      ascending: false,
    })

  if (agentsError) {
    console.error(
      'Failed to load agents:',
      agentsError
    )

    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Agents
        </h1>

        <div className="glass rounded-2xl p-6 text-sm text-destructive">
          Failed to load agents: {agentsError.message}
        </div>
      </main>
    )
  }

  const agentIds = (agents ?? []).map(
    (agent) => agent.id
  )

  /*
   * Activity is optional.
   *
   * If there are no agents, there is nothing to query.
   */
  const {
    data: activities,
    error: activitiesError,
  } = agentIds.length
    ? await supabase
        .from('agent_activity')
        .select('agent_id, created_at')
        .eq(
          'organization_id',
          organizationId
        )
        .in('agent_id', agentIds)
        .order('created_at', {
          ascending: false,
        })
    : {
        data: [],
        error: null,
      }

  /*
   * Activity is supplementary data.
   *
   * Do NOT make the entire Agents page unusable merely because
   * activity telemetry is unavailable.
   */
  if (activitiesError) {
    console.error(
      'Failed to load agent activity:',
      activitiesError
    )
  }

  /*
   * Tasks are also supplementary.
   *
   * agent_tasks currently has restrictive RLS in the database,
   * so failure here must not prevent the actual agent inventory
   * from rendering.
   */
  const {
    data: agentTasks,
    error: agentTasksError,
  } = agentIds.length
    ? await supabase
        .from('agent_tasks')
        .select(
          'agent_id, assigned_at, completed_at'
        )
        .eq(
          'organization_id',
          organizationId
        )
        .in('agent_id', agentIds)
    : {
        data: [],
        error: null,
      }

  if (agentTasksError) {
    console.error(
      'Failed to load agent tasks:',
      agentTasksError
    )
  }

  /*
   * Determine the latest activity for every agent.
   */
  const lastActivityByAgent =
    new Map<string, string>()

  for (const activity of activities ?? []) {
    if (
      !activity.agent_id ||
      !activity.created_at
    ) {
      continue
    }

    if (
      !lastActivityByAgent.has(
        activity.agent_id
      )
    ) {
      lastActivityByAgent.set(
        activity.agent_id,
        activity.created_at
      )
    }
  }

  /*
   * Count tasks per agent.
   */
  const taskCountByAgent =
    new Map<string, number>()

  for (const task of agentTasks ?? []) {
    if (!task.agent_id) {
      continue
    }

    taskCountByAgent.set(
      task.agent_id,
      (taskCountByAgent.get(
        task.agent_id
      ) ?? 0) + 1
    )
  }

  /*
   * Convert database records into the shape expected
   * by AgentsClient.
   */
  const normalizedAgents = (
    agents ?? []
  ).map((agent) => ({
    id: agent.id,

    name: agent.name,

    purpose:
      agent.description ||
      'AI agent registered in the Arbyter governance environment.',

    team:
      agent.agent_type ||
      'AI Operations',

    status:
      agent.status === 'paused'
        ? ('Paused' as const)
        : agent.status ===
            'needs_review'
          ? ('Needs Review' as const)
          : ('Active' as const),

    /*
     * Risk will later come from Arbyter's actual
     * risk/governance system.
     *
     * For now this remains explicitly a default,
     * rather than pretending we have calculated risk.
     */
    risk: 'Medium' as const,

    tasks:
      taskCountByAgent.get(
        agent.id
      ) ?? 0,

    lastActivity:
      lastActivityByAgent.get(
        agent.id
      ) ?? 'No activity recorded',
  }))

  return (
    <AgentsClient
      initialAgents={normalizedAgents}
    />
  )
}