import { createClient } from "@/lib/supabase/server"

export type RegulatoryMapping = {
  requirementId: string
  requirementTitle: string
  requirementDescription: string | null
  authority: string | null
  jurisdiction: string | null
  country: string | null
  state: string | null
  sector: string | null
  version: string | null
  effectiveFrom: string | null
  effectiveUntil: string | null
  ruleId: string
  ruleName: string
  ruleEffect: string | null
  rulePriority: number
  relationship: string
}

export async function loadRegulatoryMappings(
  organizationId: string
): Promise<RegulatoryMapping[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("governance_rule_requirements")
    .select(`
      relationship,
      requirement_id,
      rule_id,
      regulatory_requirements (
        id,
        title,
        description,
        authority,
        jurisdiction,
        country,
        state,
        sector,
        version,
        effective_from,
        effective_until
      ),
      governance_policy_rules (
        id,
        name,
        effect,
        priority
      )
    `)
    .eq("organization_id", organizationId)

  if (error) {
    throw new Error(
      `Failed to load regulatory mappings: ${error.message}`
    )
  }

  return (data ?? [])
    .map((row) => {
      const requirement = Array.isArray(
        row.regulatory_requirements
      )
        ? row.regulatory_requirements[0]
        : row.regulatory_requirements

      const rule = Array.isArray(
        row.governance_policy_rules
      )
        ? row.governance_policy_rules[0]
        : row.governance_policy_rules

      if (!requirement || !rule) {
        return null
      }

      return {
        requirementId: requirement.id,
        requirementTitle: requirement.title,
        requirementDescription:
          requirement.description ?? null,
        authority: requirement.authority ?? null,
        jurisdiction: requirement.jurisdiction ?? null,
        country: requirement.country ?? null,
        state: requirement.state ?? null,
        sector: requirement.sector ?? null,
        version: requirement.version ?? null,
        effectiveFrom:
          requirement.effective_from ?? null,
        effectiveUntil:
          requirement.effective_until ?? null,
        ruleId: rule.id,
        ruleName: rule.name,
        ruleEffect: rule.effect ?? null,
        rulePriority: rule.priority ?? 0,
        relationship: row.relationship,
      }
    })
    .filter(
      (mapping): mapping is RegulatoryMapping =>
        mapping !== null
    )
}