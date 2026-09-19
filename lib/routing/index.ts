import type { Intent } from "@/lib/intent"
import type { RegisteredAgent } from "@/lib/agents/registry"

export function selectAgent(intent: Intent, candidates: RegisteredAgent[]): RegisteredAgent {
  const ranked = candidates
    .map((agent) => ({
      agent,
      matched: intent.required_capabilities.filter((capability) => agent.capabilities.includes(capability)).length,
    }))
    .filter(({ matched }) => matched > 0)
    .sort((a, b) => b.matched - a.matched || Number(b.agent.verified) - Number(a.agent.verified))

  if (!ranked[0]) throw new Error("No agent matches the requested capabilities.")
  return ranked[0].agent
}
