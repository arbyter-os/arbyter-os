import type { RiskLevel } from "./risk-engine";
import type { ConflictResolution } from "./conflict-resolver";

export type GovernanceDecision =
  | "ALLOW"
  | "BLOCK"
  | "REQUIRE_APPROVAL"
  | "FLAG";

export type DecisionResult = {
  decision: GovernanceDecision;
  risk: RiskLevel;
  ruleId: string | null;
  reason: string;
};

export function makeGovernanceDecision(
  resolution: ConflictResolution,
  risk: RiskLevel
): DecisionResult {
  const effect = resolution.effect;

  if (effect === "block") {
    return {
      decision: "BLOCK",
      risk,
      ruleId: resolution.rule?.id ?? null,
      reason: resolution.reason,
    };
  }

  if (effect === "require_approval") {
    return {
      decision: "REQUIRE_APPROVAL",
      risk,
      ruleId: resolution.rule?.id ?? null,
      reason: resolution.reason,
    };
  }

  if (effect === "flag") {
    return {
      decision: "FLAG",
      risk,
      ruleId: resolution.rule?.id ?? null,
      reason: resolution.reason,
    };
  }

  return {
    decision: "ALLOW",
    risk,
    ruleId: resolution.rule?.id ?? null,
    reason: resolution.reason,
  };
}