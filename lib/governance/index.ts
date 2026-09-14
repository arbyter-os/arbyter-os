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
import { generateActionRecommendations } from "./action-recommendations"

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

  return {
    decision,
    risk,
    applicableRules,
    triggeredRules,
    conflicts,
    regulatoryMappings,
    recommendations,
    actions,
  }
}