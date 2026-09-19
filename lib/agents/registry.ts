import { createClient } from "@/lib/supabase/server"
import { filterAgentsByCapabilities as filterByCapabilities } from "./capabilities"

export type RegisteredAgent = {
  id: string
  name: string
  description: string
  status: string
  verified: boolean
  capabilities: string[]
  endpoint?: string
  provider?: string
}

export type AgentRegistry = {
  discover(requiredCapabilities: string[]): Promise<RegisteredAgent[]>
}

const capabilityAliases: Record<string, string> = { "messages.send": "send_email" }

function normalizedCapabilities(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  return Object.entries(value as Record<string, unknown>)
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => capabilityAliases[name] ?? name)
}

export function filterAgentsByCapabilities(agents: RegisteredAgent[], requiredCapabilities: string[]): RegisteredAgent[] {
  return filterByCapabilities(agents, requiredCapabilities)
}

export function createSupabaseAgentRegistry(): AgentRegistry {
  return {
    async discover(requiredCapabilities) {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error("You must be signed in.")

      const { data: userRecord, error: userError } = await supabase
        .from("users").select("organization_id").eq("id", user.id).maybeSingle()
      if (userError) throw userError
      if (!userRecord?.organization_id) throw new Error("No organization is associated with your account.")

      const { data: agents, error: agentsError } = await supabase
        .from("ai_agents").select("id, name, description, status")
        .eq("organization_id", userRecord.organization_id).eq("status", "active")
      if (agentsError) throw agentsError

      const result: RegisteredAgent[] = []
      for (const agent of agents ?? []) {
        const { data: connection, error: connectionError } = await supabase
          .from("agent_connections")
          .select("provider, endpoint_url, capabilities, status, health_status")
          .eq("agent_id", agent.id).eq("organization_id", userRecord.organization_id)
          .eq("status", "connected").neq("health_status", "unhealthy")
          .order("created_at", { ascending: false }).limit(1).maybeSingle()
        if (connectionError) throw connectionError
        if (!connection) continue

        const { data: identity, error: identityError } = await supabase
          .from("agent_identities").select("verified")
          .eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
        if (identityError) throw identityError

        result.push({
          id: agent.id, name: agent.name, description: agent.description ?? "",
          status: agent.status ?? "active", verified: Boolean(identity?.verified),
          capabilities: normalizedCapabilities(connection.capabilities),
          endpoint: connection.endpoint_url ?? undefined, provider: connection.provider ?? undefined,
        })
      }

      return filterAgentsByCapabilities(result, requiredCapabilities)
    },
  }
}
