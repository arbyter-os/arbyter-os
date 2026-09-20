import { initializeConnectors } from "../connectors/index.ts"
import { getConnector } from "../connectors/registry.ts"
import type { ConnectorCapability } from "../connectors/types.ts"
import { createClient } from "../supabase/server.ts"

export type AgentDiscoveryResult = {
  agentId: string
  agentName: string
  connectionId: string
  provider: string
  capabilities: Record<string, boolean>
}

type DiscoveryRow = {
  id: string
  agent_id: string
  provider: string
  status: string
  health_status: string | null
  capabilities: unknown
  ai_agents:
    | {
        id: string
        name: string
        status: string
        organization_id: string
      }
    | {
        id: string
        name: string
        status: string
        organization_id: string
      }[]
    | null
}

export function filterDiscoveryCandidates(
  rows: DiscoveryRow[],
  organizationId: string,
  requiredCapabilities: ConnectorCapability[]
): AgentDiscoveryResult[] {
  return rows
    .filter((connection) => {
      if (connection.status !== "connected") return false
      if (connection.health_status === "unhealthy") return false

      const agent = Array.isArray(connection.ai_agents)
        ? connection.ai_agents[0]
        : connection.ai_agents

      if (!agent || agent.organization_id !== organizationId) return false
      if (agent.status === "paused") return false
      if (!getConnector(connection.provider)) return false

      const capabilities =
        connection.capabilities &&
        typeof connection.capabilities === "object" &&
        !Array.isArray(connection.capabilities)
          ? (connection.capabilities as Record<string, boolean>)
          : {}

      return requiredCapabilities.every(
        (capability) => capabilities[capability] === true
      )
    })
    .map((connection) => {
      const agent = Array.isArray(connection.ai_agents)
        ? connection.ai_agents[0]
        : connection.ai_agents

      const capabilities =
        connection.capabilities &&
        typeof connection.capabilities === "object" &&
        !Array.isArray(connection.capabilities)
          ? (connection.capabilities as Record<string, boolean>)
          : {}

      return {
        agentId: agent!.id,
        agentName: agent!.name,
        connectionId: connection.id,
        provider: connection.provider,
        capabilities,
      }
    })
}

export async function discoverAgents({
  organizationId,
  requiredCapabilities,
}: {
  organizationId: string
  requiredCapabilities: ConnectorCapability[]
}): Promise<AgentDiscoveryResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("agent_connections")
    .select(
      "id, agent_id, provider, status, health_status, capabilities, ai_agents!inner(id, name, status, organization_id)"
    )
    .eq("organization_id", organizationId)
    .eq("ai_agents.organization_id", organizationId)

  if (error) {
    throw error
  }

  initializeConnectors()

  return filterDiscoveryCandidates(
    (data ?? []) as DiscoveryRow[],
    organizationId,
    requiredCapabilities
  )
}
