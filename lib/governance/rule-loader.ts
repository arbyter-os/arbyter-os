import { createClient } from "@/lib/supabase/server"

export type GovernanceRule = {
  id: string
  policyId: string
  policyName: string
  policyType: string | null
  sourceType: string | null
  authority: string | null
  jurisdiction: string | null
  sector: string | null
  sourceReference: string | null
  sourceUrl: string | null
  effectiveFrom: string | null
  effectiveUntil: string | null
  name: string
  description: string | null
  ruleType: string | null
  effect: string | null
  conditions: Record<string, unknown>
  priority: number
  enabled: boolean
  version: string | null
  scope: Record<string, unknown>
  exceptions: Record<string, unknown>
}

export async function loadGovernanceRules(
  organizationId: string
): Promise<GovernanceRule[]> {
  const supabase = await createClient()

  const { data: policies, error: policiesError } = await supabase
    .from("governance_policies")
    .select(`
      id,
      name,
      policy_type,
      status,
      source_type,
      authority,
      jurisdiction,
      sector,
      source_reference,
      source_url,
      effective_from,
      effective_until
    `)
    .eq("organization_id", organizationId)
    .eq("status", "active")

  if (policiesError) {
    throw new Error(
      `Failed to load governance policies: ${policiesError.message}`
    )
  }

  if (!policies || policies.length === 0) {
    return []
  }

  const now = new Date()

  const activePolicies = policies.filter((policy) => {
    if (
      policy.effective_from &&
      new Date(policy.effective_from) > now
    ) {
      return false
    }

    if (
      policy.effective_until &&
      new Date(policy.effective_until) < now
    ) {
      return false
    }

    return true
  })

  if (activePolicies.length === 0) {
    return []
  }

  const policyIds = activePolicies.map((policy) => policy.id)

  const { data: rules, error: rulesError } = await supabase
    .from("governance_policy_rules")
    .select(`
      id,
      policy_id,
      name,
      description,
      rule_type,
      effect,
      conditions,
      priority,
      enabled,
      version,
      scope,
      exceptions
    `)
    .eq("organization_id", organizationId)
    .eq("enabled", true)
    .in("policy_id", policyIds)

  if (rulesError) {
    throw new Error(
      `Failed to load governance rules: ${rulesError.message}`
    )
  }

  const policyMap = new Map(
    activePolicies.map((policy) => [policy.id, policy])
  )

  return (rules ?? [])
    .map((rule) => {
      const policy = policyMap.get(rule.policy_id)

      if (!policy) {
        return null
      }

      return {
        id: rule.id,
        policyId: rule.policy_id,
        policyName: policy.name,
        policyType: policy.policy_type,
        sourceType: policy.source_type,
        authority: policy.authority,
        jurisdiction: policy.jurisdiction,
        sector: policy.sector,
        sourceReference: policy.source_reference,
        sourceUrl: policy.source_url,
        effectiveFrom: policy.effective_from,
        effectiveUntil: policy.effective_until,
        name: rule.name,
        description: rule.description,
        ruleType: rule.rule_type,
        effect: rule.effect,
        conditions: rule.conditions ?? {},
        priority: rule.priority ?? 0,
        enabled: rule.enabled,
        version: rule.version,
        scope: rule.scope ?? {},
        exceptions: rule.exceptions ?? {},
      }
    })
    .filter(
      (rule): rule is GovernanceRule => rule !== null
    )
}