import type { DecisionResult } from "./decision-engine"
import type { GovernanceConflict } from "./conflict-analyzer"
import type { GovernanceRecommendation } from "./recommendation"

export type GovernanceAction =
  | "approve"
  | "block"
  | "request_approval"
  | "modify_policy"
  | "pause_agent"
  | "disable_tool"
  | "retest"
  | "investigate"
  | "create_remediation"
  | "view_regulation"

export type GovernanceActionRecommendation = {
  action: GovernanceAction
  label: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  requiresHuman: boolean
}

export function generateActionRecommendations(
  decision: DecisionResult,
  recommendations: GovernanceRecommendation[] = [],
  conflicts: GovernanceConflict[] = []
): GovernanceActionRecommendation[] {
  const actions: GovernanceActionRecommendation[] = []

  if (conflicts.length > 0) {
    actions.push({
      action: "investigate",
      label: "Investigate conflict",
      description:
        "Review the governance rules that produced conflicting requirements.",
      priority: "high",
      requiresHuman: true,
    })

    actions.push({
      action: "modify_policy",
      label: "Resolve policy conflict",
      description:
        "Modify or explicitly resolve the conflicting governance rules.",
      priority: "high",
      requiresHuman: true,
    })
  }

  switch (decision.decision) {
    case "BLOCK":
      actions.push({
        action: "block",
        label: "Block action",
        description:
          "Prevent the governed action from executing.",
        priority: decision.risk,
        requiresHuman: false,
      })

      actions.push({
        action: "investigate",
        label: "Investigate",
        description:
          "Review why the action violated governance requirements.",
        priority: decision.risk,
        requiresHuman: true,
      })

      actions.push({
        action: "view_regulation",
        label: "View applicable regulation",
        description:
          "Review the regulatory requirement behind the decision.",
        priority: decision.risk,
        requiresHuman: false,
      })

      break

    case "REQUIRE_APPROVAL":
      actions.push({
        action: "request_approval",
        label: "Request human approval",
        description:
          "Send the action for human approval before execution.",
        priority: decision.risk,
        requiresHuman: true,
      })

      actions.push({
        action: "retest",
        label: "Re-test",
        description:
          "Evaluate the action again after the relevant context or policy changes.",
        priority: "medium",
        requiresHuman: false,
      })

      break

    case "FLAG":
      actions.push({
        action: "investigate",
        label: "Investigate",
        description:
          "Review the flagged action and determine whether intervention is required.",
        priority: decision.risk,
        requiresHuman: true,
      })

      actions.push({
        action: "retest",
        label: "Re-test",
        description:
          "Evaluate the action again with updated context.",
        priority: "medium",
        requiresHuman: false,
      })

      break

    case "ALLOW":
      actions.push({
        action: "approve",
        label: "Allow execution",
        description:
          "Allow the action to proceed under the current governance rules.",
        priority: decision.risk,
        requiresHuman: false,
      })

      break
  }

  if (
    decision.risk === "high" ||
    decision.risk === "critical"
  ) {
    actions.push({
      action: "pause_agent",
      label: "Pause agent",
      description:
        "Temporarily stop the agent when continued activity presents unacceptable risk.",
      priority: decision.risk,
      requiresHuman: true,
    })

    actions.push({
      action: "disable_tool",
      label: "Disable tool",
      description:
        "Temporarily remove access to the affected tool.",
      priority: decision.risk,
      requiresHuman: true,
    })
  }

  if (recommendations.length > 0) {
    actions.push({
      action: "create_remediation",
      label: "Create remediation",
      description:
        "Create a tracked remediation item from the governance recommendation.",
      priority: recommendations[0].priority,
      requiresHuman: true,
    })
  }

  return actions
}