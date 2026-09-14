import type { DecisionResult } from "./decision-engine";
import type { GovernanceRule } from "./rule-loader";

export type GovernanceRecommendation = {
  action: string;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
};

export function generateRecommendations(
  decision: DecisionResult,
  rule: GovernanceRule | null
): GovernanceRecommendation[] {
  if (!rule) {
    return [];
  }

  switch (decision.decision) {
    case "BLOCK":
      return [
        {
          action: "Stop the action and review the triggered rule.",
          reason: decision.reason,
          priority: decision.risk,
        },
      ];

    case "REQUIRE_APPROVAL":
      return [
        {
          action: "Request human approval before executing the action.",
          reason: decision.reason,
          priority: decision.risk,
        },
      ];

    case "FLAG":
      return [
        {
          action: "Investigate the action and review the applicable policy.",
          reason: decision.reason,
          priority: decision.risk,
        },
      ];

    case "ALLOW":
      return [
        {
          action: "Allow execution and continue monitoring.",
          reason: "The applicable governance rules allow this action.",
          priority: decision.risk,
        },
      ];
  }
}