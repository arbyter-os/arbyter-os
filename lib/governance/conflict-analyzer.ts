import type { GovernanceRule } from "./rule-loader"
import type { TriggeredRule } from "./evaluator"
import type { GovernanceEffect } from "./conflict-resolver"

export type GovernanceConflict = {
  id: string
  type: "effect_conflict" | "precedence_conflict" | "scope_overlap"
  severity: "low" | "medium" | "high" | "critical"
  ruleIds: string[]
  ruleNames: string[]
  effects: GovernanceEffect[]
  reason: string
  requiresResolution: boolean
}

function normalizeEffect(value: string | null): GovernanceEffect {
  if (
    value === "allow" ||
    value === "block" ||
    value === "require_approval" ||
    value === "flag"
  ) {
    return value
  }

  return "flag"
}

function scopesOverlap(
  first: GovernanceRule,
  second: GovernanceRule
): boolean {
  const firstScope = first.scope ?? {}
  const secondScope = second.scope ?? {}

  const keys = [
    "jurisdiction",
    "country",
    "state",
    "sector",
    "action",
    "tool",
  ]

  return keys.every((key) => {
    const a = firstScope[key]
    const b = secondScope[key]

    if (a === undefined || a === null || a === "") return true
    if (b === undefined || b === null || b === "") return true

    if (Array.isArray(a)) return a.includes(b)
    if (Array.isArray(b)) return b.includes(a)

    return a === b
  })
}

function getSeverity(
  effects: GovernanceEffect[]
): GovernanceConflict["severity"] {
  if (effects.includes("block") && effects.includes("allow")) {
    return "critical"
  }

  if (
    effects.includes("block") ||
    effects.includes("require_approval")
  ) {
    return "high"
  }

  return "medium"
}

export function analyzeConflicts(
  triggeredRules: TriggeredRule[]
): GovernanceConflict[] {
  const conflicts: GovernanceConflict[] = []

  for (let i = 0; i < triggeredRules.length; i++) {
    for (let j = i + 1; j < triggeredRules.length; j++) {
      const first = triggeredRules[i].rule
      const second = triggeredRules[j].rule

      if (!scopesOverlap(first, second)) continue

      const firstEffect = normalizeEffect(first.effect)
      const secondEffect = normalizeEffect(second.effect)

      if (firstEffect === secondEffect) continue

      const effects = [firstEffect, secondEffect]

      conflicts.push({
        id: `${first.id}:${second.id}`,
        type: "effect_conflict",
        severity: getSeverity(effects),
        ruleIds: [first.id, second.id],
        ruleNames: [first.name, second.name],
        effects,
        reason: `Rules "${first.name}" and "${second.name}" apply to overlapping scopes but produce different effects.`,
        requiresResolution: true,
      })
    }
  }

  return conflicts
}