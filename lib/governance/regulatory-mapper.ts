import { createClient } from "@/lib/supabase/server"

export type RegulatoryMapping = {
  requirementId: string
  requirementCode: string | null
  requirementTitle: string
  requirementDescription: string
  controlObjective: string | null
  severity: string
  authority: string
  jurisdiction: string
  country: string | null
  state: string | null
  sector: string | null
  version: string | null
  effectiveFrom: string | null
  effectiveUntil: string | null
  sourceId: string
  sourceName: string
  sourceUrl: string | null
  sourceReference: string | null
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
        source_id,
        requirement_code,
        title,
        description,
        control_objective,
        severity,
        version,
        effective_from,
        effective_until,

        regulatory_sources (
          id,
          name,
          authority,
          jurisdiction,
          country,
          state,
          sector,
          source_url,
          source_reference,
          status,
          version,
          effective_from,
          effective_until
        )
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

  const now = new Date()

  return (data ?? [])
    .map((row) => {
      const requirement = Array.isArray(
        row.regulatory_requirements
      )
        ? row.regulatory_requirements[0]
        : row.regulatory_requirements

      if (!requirement) {
        return null
      }

      const source = Array.isArray(
        requirement.regulatory_sources
      )
        ? requirement.regulatory_sources[0]
        : requirement.regulatory_sources

      const rule = Array.isArray(
        row.governance_policy_rules
      )
        ? row.governance_policy_rules[0]
        : row.governance_policy_rules

      if (!source || !rule) {
        return null
      }

      if (source.status !== "active") {
        return null
      }

      if (
        requirement.effective_from &&
        new Date(requirement.effective_from) > now
      ) {
        return null
      }

      if (
        requirement.effective_until &&
        new Date(requirement.effective_until) < now
      ) {
        return null
      }

      if (
        source.effective_from &&
        new Date(source.effective_from) > now
      ) {
        return null
      }

      if (
        source.effective_until &&
        new Date(source.effective_until) < now
      ) {
        return null
      }

      return {
        requirementId: requirement.id,
        requirementCode:
          requirement.requirement_code ?? null,
        requirementTitle: requirement.title,
        requirementDescription:
          requirement.description,
        controlObjective:
          requirement.control_objective ?? null,
        severity: requirement.severity,

        authority: source.authority,
        jurisdiction: source.jurisdiction,
        country: source.country ?? null,
        state: source.state ?? null,
        sector: source.sector ?? null,

        version:
          requirement.version ??
          source.version ??
          null,

        effectiveFrom:
          requirement.effective_from ??
          source.effective_from ??
          null,

        effectiveUntil:
          requirement.effective_until ??
          source.effective_until ??
          null,

        sourceId: source.id,
        sourceName: source.name,
        sourceUrl:
          source.source_url ?? null,
        sourceReference:
          source.source_reference ?? null,

        ruleId: rule.id,
        ruleName: rule.name,
        ruleEffect: rule.effect ?? null,
        rulePriority: rule.priority ?? 0,

        relationship: row.relationship,
      }
    })
    .filter(
      (
        mapping
      ): mapping is RegulatoryMapping =>
        mapping !== null
    )
}