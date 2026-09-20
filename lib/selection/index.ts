import type { AgentDiscoveryResult } from "../discovery/index.ts"
import type { ConnectorCapability } from "../connectors/types.ts"

export type AgentSelectionInput = {
  candidates: AgentDiscoveryResult[]
  requiredCapabilities: ConnectorCapability[]
}

export type AgentSelectionResult = AgentDiscoveryResult | null

export function selectAgent({
  candidates,
}: AgentSelectionInput): AgentSelectionResult {
  return candidates[0] ?? null
}
