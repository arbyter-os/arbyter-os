export type CapabilityAgent = { capabilities: string[] }

export function filterAgentsByCapabilities<T extends CapabilityAgent>(agents: T[], requiredCapabilities: string[]): T[] {
  const required = [...new Set(requiredCapabilities)]
  return agents.filter((agent) => required.every((capability) => agent.capabilities.includes(capability)))
}
