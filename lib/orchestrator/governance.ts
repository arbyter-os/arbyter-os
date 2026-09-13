import type {
  GovernanceContext,
  OrchestrationRequest,
} from './types'

export function evaluateGovernance(
  request: OrchestrationRequest
): GovernanceContext {
  return {
    riskLevel: 'medium',
    requiresApproval: false,
  }
}