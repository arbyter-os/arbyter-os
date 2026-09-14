import { createClient } from "@/lib/supabase/server"

export type RegulatoryRequirement = {
  id: string
  sourceId: string
  requirementCode: string | null
  title: string
  description: string
  controlObjective: string | null
  severity: string
  version: string | null
  effectiveFrom: string | null
  effectiveUntil: string | null
  metadata: Record<string, unknown>
  source: {
    id: string
    name: string
    authority: string
    jurisdiction: string
    country: string | null
    state: string | null
    sector: string | null
    sourceUrl: string | null
    sourceReference: string | null
    status: string
    version: string | null
    effectiveFrom: string | null
    effectiveUntil: string | null
  }
}

export type RegulatoryLibraryContext = {
  country?: string
  state?: string
  sector?: string
  jurisdiction?: string
}

function matchesScope(
  value: string | null,
  requested?: string
): boolean {
  if (!requested) {
    return true
  }

  if (!value) {
    return false
  }

  return value.toLowerCase() === requested.toLowerCase()
}

function isCurrentlyEffective(
  effectiveFrom: string | null,
  effectiveUntil: string | null
): boolean {
  const now = new Date()

  if (
    effectiveFrom &&
    new Date(effectiveFrom) > now
  ) {
    return false
  }

  if (
    effectiveUntil &&
    new Date(effectiveUntil) < now
  ) {
    return false
  }

  return true
}

export async function loadRegulatoryLibrary(
  context: RegulatoryLibraryContext = {}
): Promise<RegulatoryRequirement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("regulatory_requirements")
    .select(`
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
      metadata,
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
    `)

  if (error) {
    throw new Error(
      `Failed to load regulatory requirements: ${error.message}`
    )
  }

  return (data ?? [])
    .map((row) => {
      const source = Array.isArray(
        row.regulatory_sources
      )
        ? row.regulatory_sources[0]
        : row.regulatory_sources

      if (!source) {
        return null
      }

      if (source.status !== "active") {
        return null
      }

      if (
        !isCurrentlyEffective(
          row.effective_from,
          row.effective_until
        )
      ) {
        return null
      }

      if (
        !isCurrentlyEffective(
          source.effective_from,
          source.effective_until
        )
      ) {
        return null
      }

      if (
        context.country &&
        !matchesScope(
          source.country,
          context.country
        )
      ) {
        return null
      }

      if (
        context.state &&
        source.state &&
        !matchesScope(
          source.state,
          context.state
        )
      ) {
        return null
      }

      if (
        context.sector &&
        source.sector &&
        !matchesScope(
          source.sector,
          context.sector
        )
      ) {
        return null
      }

      if (
        context.jurisdiction &&
        !matchesScope(
          source.jurisdiction,
          context.jurisdiction
        )
      ) {
        return null
      }

      return {
        id: row.id,
        sourceId: row.source_id,
        requirementCode:
          row.requirement_code ?? null,
        title: row.title,
        description: row.description,
        controlObjective:
          row.control_objective ?? null,
        severity: row.severity,
        version: row.version ?? null,
        effectiveFrom:
          row.effective_from ?? null,
        effectiveUntil:
          row.effective_until ?? null,
        metadata: row.metadata ?? {},
        source: {
          id: source.id,
          name: source.name,
          authority: source.authority,
          jurisdiction: source.jurisdiction,
          country: source.country ?? null,
          state: source.state ?? null,
          sector: source.sector ?? null,
          sourceUrl:
            source.source_url ?? null,
          sourceReference:
            source.source_reference ?? null,
          status: source.status,
          version:
            source.version ?? null,
          effectiveFrom:
            source.effective_from ?? null,
          effectiveUntil:
            source.effective_until ?? null,
        },
      }
    })
    .filter(
      (
        requirement
      ): requirement is RegulatoryRequirement =>
        requirement !== null
    )
    .sort((a, b) => {
      const severityOrder: Record<
        string,
        number
      > = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      }

      return (
        (severityOrder[b.severity] ?? 0) -
        (severityOrder[a.severity] ?? 0)
      )
    })
}