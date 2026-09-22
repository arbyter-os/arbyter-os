import { createAdminClient } from "@/lib/supabase/admin"
import type { DecisionResult } from "./decision-engine"
import type { GovernanceRule } from "./rule-loader"
import type { TriggeredRule } from "./evaluator"

export type GovernanceAuditContext = {
  agentId?: string
  taskId?: string
  executionId?: string
  agentConnectionId?: string
  [key: string]: unknown
}

function mapDecision(
  decision: DecisionResult["decision"]
): "pending" | "allowed" | "blocked" | "approval_required" {
  switch (decision) {
    case "ALLOW":
      return "allowed"

    case "BLOCK":
      return "blocked"

    case "REQUIRE_APPROVAL":
      return "approval_required"

    case "FLAG":
      return "pending"
  }
}

function mapPolicyResult(
  triggered: boolean
): "matched" | "not_matched" {
  return triggered ? "matched" : "not_matched"
}

export async function persistGovernanceEvaluation(
  organizationId: string,
  decision: DecisionResult,
  applicableRules: GovernanceRule[],
  triggeredRules: TriggeredRule[],
  context: GovernanceAuditContext = {}
) {
  const supabase = createAdminClient()

  const databaseDecision = mapDecision(
    decision.decision
  )

  const triggeredRuleIds = new Set(
    triggeredRules.map((item) => item.rule.id)
  )

  const { data: governanceDecision, error: decisionError } =
    await supabase
      .from("governance_decisions")
      .insert({
        organization_id: organizationId,
        agent_id: context.agentId ?? null,
        agent_connection_id:
          context.agentConnectionId ?? null,
        execution_id: context.executionId ?? null,
        task_id: context.taskId ?? null,
        decision: databaseDecision,
        risk_level: decision.risk,
        reason: decision.reason,
        policy_id: decision.ruleId ?? null,
        decided_at: new Date().toISOString(),
        metadata: {
          original_decision: decision.decision,
          context,
        },
      })
      .select("id")
      .single()

  if (decisionError) {
    throw new Error(
      `Failed to persist governance decision: ${decisionError.message}`
    )
  }

  if (applicableRules.length === 0) {
    return {
      governanceDecisionId: governanceDecision.id,
      policyEvaluationIds: [],
    }
  }

  const evaluations = applicableRules.map((rule) => {
    const triggered = triggeredRuleIds.has(rule.id)

    const triggeredRule = triggeredRules.find(
      (item) => item.rule.id === rule.id
    )

    return {
      organization_id: organizationId,
      agent_id: context.agentId ?? null,
      execution_id: context.executionId ?? null,
      governance_decision_id: governanceDecision.id,
      policy_id: rule.policyId,
      policy_rule_id: rule.id,
      result: mapPolicyResult(triggered),
      risk_level: decision.risk,
      explanation:
        triggeredRule?.reason ??
        "The rule was applicable but did not trigger.",
      evaluation_context: context,
      evaluated_at: new Date().toISOString(),
    }
  })

  const { data: policyEvaluations, error: evaluationError } =
    await supabase
      .from("policy_evaluations")
      .insert(evaluations)
      .select("id")

  if (evaluationError) {
    throw new Error(
      `Failed to persist policy evaluations: ${evaluationError.message}`
    )
  }

  return {
    governanceDecisionId: governanceDecision.id,
    policyEvaluationIds:
      policyEvaluations?.map((item) => item.id) ?? [],
  }
}