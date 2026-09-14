import { loadGovernanceRules } from "./rule-loader"
import {
  getApplicableRules,
  type GovernanceContext,
} from "./applicability"
import { getTriggeredRules } from "./evaluator"
import { resolveConflicts } from "./conflict-resolver"
import { analyzeConflicts } from "./conflict-analyzer"
import { calculateRisk } from "./risk-engine"
import { makeGovernanceDecision } from "./decision-engine"
import { generateRecommendations } from "./recommendation"
import { loadRegulatoryMappings } from "./regulatory-mapper"
import { loadRegulatoryLibrary } from "./regulatory-library"
import { generateActionRecommendations } from "./action-recommendations"
import { persistGovernanceEvaluation } from "./audit"

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

  const applicableRules = getApplicableRules(
    rules,
    context
  )

  const triggeredRules = getTriggeredRules(
    applicableRules,
    context
  )

  const conflicts = analyzeConflicts(
    triggeredRules
  )

  const resolution = resolveConflicts(
    triggeredRules
  )

  const risk = calculateRisk(
    triggeredRules
  )

  const decision = makeGovernanceDecision(
    resolution,
    risk
  )

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