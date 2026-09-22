import { loadGovernanceRules, type GovernanceRule } from "./rule-loader"
import {
  getApplicableRules,
  type GovernanceContext,
} from "./applicability"
import { evaluateRule } from "./evaluator"
import {
  resolveConflicts,
  type ConflictResolution,
} from "./conflict-resolver"
import { analyzeConflicts } from "./conflict-analyzer"
import { calculateRisk } from "./risk-engine"
import { makeGovernanceDecision } from "./decision-engine"
import { generateRecommendations } from "./recommendation"
import { loadRegulatoryMappings } from "./regulatory-mapper"
import { loadRegulatoryLibrary } from "./regulatory-library"
import { generateActionRecommendations } from "./action-recommendations"
import { persistGovernanceEvaluation } from "./audit"

const CONTEXTUAL_FIELDS = [
  "country",
  "state",
  "jurisdiction",
  "sector",
] as const

type ContextualField = (typeof CONTEXTUAL_FIELDS)[number]

function hasRequiredContextValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ""
}

function getRuleContextRequirements(
  rule: GovernanceRule
): ContextualField[] {
  const requirements = new Set<ContextualField>()
  const scope = rule.scope ?? {}

  for (const field of CONTEXTUAL_FIELDS) {
    if (hasRequiredContextValue(scope[field])) {
      requirements.add(field)
    }
  }

  if (hasRequiredContextValue(rule.jurisdiction)) {
    requirements.add("jurisdiction")
  }

  if (hasRequiredContextValue(rule.sector)) {
    requirements.add("sector")
  }

  return [...requirements]
}

export function getMissingContextualRules(
  rules: GovernanceRule[],
  context: GovernanceContext
): Array<{ rule: GovernanceRule; fields: ContextualField[] }> {
  const now = new Date()

  return rules
    .filter((rule) => {
      if (!rule.enabled) return false

      if (
        rule.effectiveFrom &&
        new Date(rule.effectiveFrom) > now
      ) {
        return false
      }

      if (
        rule.effectiveUntil &&
        new Date(rule.effectiveUntil) < now
      ) {
        return false
      }

      return true
    })
    .map((rule) => {
      const requiredFields = getRuleContextRequirements(rule)
      const missingFields = requiredFields.filter(
        (field) => !hasRequiredContextValue(context[field])
      )

      return { rule, fields: missingFields }
    })
    .filter((entry) => entry.fields.length > 0)
}

export function applyMissingContextApproval(
  resolution: ConflictResolution,
  missingContextRules: Array<{
    rule: GovernanceRule
    fields: ContextualField[]
  }>
): ConflictResolution {
  if (missingContextRules.length === 0) {
    return resolution
  }

  if (
    resolution.effect === "block" ||
    resolution.effect === "require_approval"
  ) {
    return resolution
  }

  const missing = missingContextRules[0]

  return {
    ...resolution,
    effect: "require_approval",
    rule: missing.rule,
    reason: `Approval required because governance context is missing: ${missing.fields.join(
      ", "
    )}.`,
  }
}

export function applyUnevaluableRuleApproval(
  resolution: ConflictResolution,
  unevaluableRules: Array<{ rule: GovernanceRule; reason: string }>
): ConflictResolution {
  if (unevaluableRules.length === 0) return resolution

  if (resolution.effect === "block" || resolution.effect === "require_approval") {
    return resolution
  }

  const unevaluable = unevaluableRules[0]

  return {
    ...resolution,
    effect: "require_approval",
    rule: unevaluable.rule,
    reason: `Approval required because governance rule "${unevaluable.rule.name}" could not be safely evaluated: ${unevaluable.reason}`,
  }
}

export function evaluateGovernanceRules(
  rules: GovernanceRule[],
  context: GovernanceContext & Record<string, unknown>
) {
  const missingContextRules = getMissingContextualRules(rules, context)
  const applicableRules = getApplicableRules(rules, context)
  const evaluations = applicableRules.map((rule) => ({
    rule,
    result: evaluateRule(rule, context),
  }))

  const triggeredRules = evaluations
    .map(({ result }) => result)
    .filter((result): result is NonNullable<typeof result> => Boolean(result?.matched))

  const unevaluableRules = evaluations
    .map(({ result }) => result)
    .filter((result): result is NonNullable<typeof result> => Boolean(result && !result.evaluable))

  const conflicts = analyzeConflicts(triggeredRules)
  const baseResolution = resolveConflicts(triggeredRules)
  const contextResolution = applyMissingContextApproval(baseResolution, missingContextRules)
  const resolution = applyUnevaluableRuleApproval(
    contextResolution,
    unevaluableRules.map((result) => ({ rule: result.rule, reason: result.reason }))
  )
  const risk = calculateRisk(triggeredRules)
  const decision = makeGovernanceDecision(resolution, risk)

  return {
    decision,
    resolution,
    risk,
    applicableRules,
    triggeredRules,
    unevaluableRules,
    conflicts,
  }
}

export async function evaluateGovernance(
  organizationId: string,
  context: GovernanceContext & Record<string, unknown>
) {
  const rules = await loadGovernanceRules(
    organizationId
  )

  const regulatoryMappings =
    await loadRegulatoryMappings(
      organizationId
    )

  const regulatoryLibrary =
    await loadRegulatoryLibrary({
      country:
        typeof context.country === "string"
          ? context.country
          : undefined,

      state:
        typeof context.state === "string"
          ? context.state
          : undefined,

      sector:
        typeof context.sector === "string"
          ? context.sector
          : undefined,

      jurisdiction:
        typeof context.jurisdiction === "string"
          ? context.jurisdiction
          : undefined,
    })

  const governanceRules = evaluateGovernanceRules(
    rules,
    context
  )

  const {
    applicableRules,
    triggeredRules,
    conflicts,
    risk,
    decision,
    resolution,
  } = governanceRules

  const recommendations =
    generateRecommendations(
      decision,
      resolution.rule
    )

  const actions =
    generateActionRecommendations(
      decision,
      recommendations,
      conflicts
    )

  const auditContext = {
    ...context,

    agentId:
      typeof context.agentId === "string"
        ? context.agentId
        : undefined,

    taskId:
      typeof context.taskId === "string"
        ? context.taskId
        : undefined,

    executionId:
      typeof context.executionId === "string"
        ? context.executionId
        : undefined,

    agentConnectionId:
      typeof context.agentConnectionId === "string"
        ? context.agentConnectionId
        : undefined,
  }

  const audit =
    await persistGovernanceEvaluation(
      organizationId,
      decision,
      applicableRules,
      triggeredRules,
      auditContext
    )

  return {
    decision,
    risk,
    applicableRules,
    triggeredRules,
    conflicts,
    regulatoryMappings,
    regulatoryLibrary,
    recommendations,
    actions,
    audit,
  }
}