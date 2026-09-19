export type RoutingIntent = { required_capabilities: string[] }
export type RoutingAgent = { id: string; name: string; capabilities: string[]; verified: boolean }

export function selectAgent(intent: RoutingIntent, candidates: RoutingAgent[]): RoutingAgent {
  const required = [...new Set(intent.required_capabilities)]
  const ranked = candidates
    .map((agent) => ({
      agent,
      matched: required.filter((capability) => agent.capabilities.includes(capability)).length,
    }))
    .filter(({ matched }) => matched === required.length)
    .sort((a, b) => Number(b.agent.verified) - Number(a.agent.verified))

  if (!ranked[0]) throw new Error("No agent matches all requested capabilities.")
  return ranked[0].agent
}
