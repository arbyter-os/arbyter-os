export type PolicyDecision = "ALLOW" | "BLOCK" | "REQUIRES_APPROVAL"

export type PolicyContext = {
  userId: string
  intent: string
  action: string
  agentId: string
  toolNames: string[]
}

export function evaluatePolicy(context: PolicyContext): PolicyDecision {
  if (!context.userId || !context.agentId || !context.action) return "BLOCK"
  if (context.toolNames.some((name) => name === "unknown")) return "BLOCK"
  return "ALLOW"
}
