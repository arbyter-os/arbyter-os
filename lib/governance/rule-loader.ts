import { createClient } from "@/lib/supabase/server";

export type GovernanceRule = {
  id: string;
  policyId: string;
  policyName: string;
  policyType: string | null;
  sourceType: string | null;
  authority: string | null;
  jurisdiction: string | null;
  sector: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  name: string;
  description: string | null;
  ruleType: string | null;
  effect: string | null;
  conditions: Record<string, unknown>;
  priority: number;
  enabled: boolean;
  version: string | null;
  scope: Record<string, unknown>;
  exceptions: Record<string, unknown>;
};

export async function loadGovernanceRules(
  organizationId: string
): Promise<GovernanceRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
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
      exceptions,
      governance_policies!inner (
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
      )
    `)
    .eq("organization_id", organizationId)
    .eq("enabled", true)
    .eq("governance_policies.status", "active");

  if (error) {
    throw new Error(`Failed to load governance rules: ${error.message}`);
  }

  const now = new Date();

  return (data ?? [])
    .filter((row) => {
      const policy = Array.isArray(row.governance_policies)
        ? row.governance_policies[0]
        : row.governance_policies;

      if (!policy) return false;

      if (
        policy.effective_from &&
        new Date(policy.effective_from) > now
      ) {
        return false;
      }

      if (
        policy.effective_until &&
        new Date(policy.effective_until) < now
      ) {
        return false;
      }

      return true;
    })
    .map((row) => {
      const policy = Array.isArray(row.governance_policies)
        ? row.governance_policies[0]
        : row.governance_policies;

      return {
        id: row.id,
        policyId: row.policy_id,
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
        name: row.name,
        description: row.description,
        ruleType: row.rule_type,
        effect: row.effect,
        conditions: row.conditions ?? {},
        priority: row.priority ?? 0,
        enabled: row.enabled,
        version: row.version,
        scope: row.scope ?? {},
        exceptions: row.exceptions ?? {},
      };
    });
}