import { createClient } from '@/lib/supabase/server'
import { evaluateGovernance } from './governance'
import { resolveProviderRoute } from './provider-router'
import type {
  OrchestrationRequest,
  OrchestrationResult,
} from './types'

export async function orchestrate(
  request: OrchestrationRequest
): Promise<OrchestrationResult> {
  const supabase = await createClient()

  const { data: connection, error: connectionError } =
    await supabase
      .from('agent_connections')
      .select(
        'id, provider, connection_type, status, health_status, configuration, endpoint_url'
      )
      .eq('agent_id', request.agentId)
      .eq('organization_id', request.organizationId)
      .eq('status', 'connected')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

  if (connectionError) {
    throw connectionError
  }

  if (!connection) {
    return {
      success: false,
      status: 'blocked',
      error: 'No connected execution connection was found for this agent.',
    }
  }

  const route = resolveProviderRoute(connection)

  if (
    request.provider &&
    request.provider !== route.provider
  ) {
    return {
      success: false,
      status: 'blocked',
      provider: route.provider,
      error:
        'The requested provider does not match the agent connection.',
    }
  }

  const governance = await evaluateGovernance({
    ...request,
    provider: route.provider,
  })

  if (governance.requiresApproval) {
    return {
      success: false,
      status: 'waiting_approval',
      provider: route.provider,
      error: 'Governance approval is required before execution.',
    }
  }

  if (
    governance.riskLevel === 'critical' &&
    governance.policyId
  ) {
    return {
      success: false,
      status: 'blocked',
      provider: route.provider,
      error:
        'Execution was blocked by a governance policy.',
    }
  }

  return {
    success: false,
    status: 'blocked',
    provider: route.provider,
    error:
      'Governance passed, but the execution provider is not connected yet.',
  }
}