import type {
  OrchestrationRequest,
  OrchestrationResult,
} from './types'

export async function orchestrate(
  request: OrchestrationRequest
): Promise<OrchestrationResult> {
  return {
    success: false,
    status: 'blocked',
    provider: request.provider,
    error: 'Orchestrator execution is not connected yet.',
  }
}