import { createClient } from '@/lib/supabase/server'
import type {
  GovernanceContext,
  OrchestrationRequest,
} from './types'

export async function evaluateGovernance(
  request: OrchestrationRequest & {
    organizationId: string
  }
): Promise<GovernanceContext> {
  const supabase = await createClient()

  const { data: assignments, error: assignmentError } =
    await supabase
      .from('policy_assignments')
      .select('policy_id')
      .eq('agent_id', request.agentId)

  if (assignmentError) {
    throw assignmentError
  }

  if (!assignments?.length) {
    return {
      riskLevel: 'medium',
      requiresApproval: true,
    }
  }

  const policyIds = assignments.map((item) => item.policy_id)

  const { data: rules, error: rulesError } =
    await supabase
      .from('governance_policy_rules')
      .select(
        'id, policy_id, name, rule_type, effect, conditions, priority, enabled'
      )
      .in('policy_id', policyIds)
      .eq('organization_id', request.organizationId)
      .eq('enabled', true)
      .order('priority', { ascending: true })

  if (rulesError) {
    throw rulesError
  }

  let riskLevel: GovernanceContext['riskLevel'] = 'medium'
  let requiresApproval = false
  let policyId: string | undefined

  for (const rule of rules ?? []) {
    const conditions =
      rule.conditions &&
      typeof rule.conditions === 'object'
        ? rule.conditions
        : {}

    const providerMatches =
      !conditions.provider ||
      conditions.provider === request.provider

    const actionMatches =
      !conditions.action ||
      conditions.action === request.action

    const toolMatches =
      !conditions.tool ||
      conditions.tool === request.tool

    if (!providerMatches || !actionMatches || !toolMatches) {
      continue
    }

    policyId = rule.policy_id

    if (rule.effect === 'deny') {
      return {
        riskLevel: 'critical',
        requiresApproval: false,
        policyId,
      }
    }

    if (
      rule.effect === 'require_approval' ||
      rule.rule_type === 'approval'
    ) {
      requiresApproval = true
    }

    if (
      rule.conditions &&
      typeof rule.conditions === 'object' &&
      'risk_level' in rule.conditions
    ) {
      const value = rule.conditions.risk_level

      if (
        value === 'low' ||
        value === 'medium' ||
        value === 'high' ||
        value === 'critical'
      ) {
        riskLevel = value
      }
    }
  }

  return {
    riskLevel,
    requiresApproval,
    policyId,
  }
}