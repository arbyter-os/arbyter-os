export type ExecutionProvider =
  | 'mcp'
  | 'zapier'
  | 'api'
  | 'sdk'
  | 'webhook'

export type OrchestrationRequest = {
  taskId: string
  agentId: string
  organizationId: string
  action: string
  provider?: ExecutionProvider
  tool?: string
  input: Record<string, unknown>
}

export type GovernanceContext = {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresApproval: boolean
  policyId?: string
}

export type OrchestrationResult = {
  success: boolean
  status:
    | 'completed'
    | 'blocked'
    | 'waiting_approval'
    | 'failed'
  provider?: ExecutionProvider
  output?: unknown
  error?: string
}