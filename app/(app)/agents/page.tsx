import { createClient } from '@/lib/supabase/server'
import AgentsClient from './client'

export default async function AgentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (userError || !userRecord?.organization_id) {
    console.error('Failed to resolve user organization:', userError)

    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">AI Workforce</h1>
        <div className="glass rounded-2xl p-6 text-sm text-destructive">
          Unable to determine your organization.
        </div>
      </main>
    )
  }

  const { data, error: agentsError } = await supabase
    .from('ai_agents')
    .select('id, name, description, agent_type, status, created_at')
    .eq('organization_id', userRecord.organization_id)
    .order('created_at', { ascending: false })

  if (agentsError) {
    console.error('Failed to load agents:', agentsError)

    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">AI Workforce</h1>
        <div className="glass rounded-2xl p-6 text-sm text-destructive">
          Failed to load agents: {agentsError.message}
        </div>
      </main>
    )
  }

  const initialAgents = (data ?? []).map((agent) => {
    const rawStatus = String(agent.status ?? 'active').toLowerCase()

    let status: 'Active' | 'Paused' | 'Needs Review' = 'Active'

    if (rawStatus === 'paused' || rawStatus === 'inactive') {
      status = 'Paused'
    } else if (rawStatus === 'needs_review' || rawStatus === 'review') {
      status = 'Needs Review'
    }

    return {
      id: agent.id,
      name: agent.name,
      purpose: agent.description ?? 'No purpose specified',
      team: agent.agent_type ?? 'General',
      status,
      risk: 'Low' as const,
      tasks: 0,
      lastActivity: agent.created_at
        ? new Date(agent.created_at).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'Never',
    }
  })

  return <AgentsClient initialAgents={initialAgents} />
}
