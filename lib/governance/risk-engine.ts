import type { TriggeredRule } from "./evaluator";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function normalizeRisk(value: unknown): RiskLevel {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }

  return "medium";
}

export function calculateRisk(
  triggeredRules: TriggeredRule[]
): RiskLevel {
  if (triggeredRules.length === 0) {
    return "low";
  }

  let highestRisk: RiskLevel = "low";

  for (const result of triggeredRules) {
    const risk = normalizeRisk(
      (result.rule.conditions as Record<string, unknown>)?.risk
    );

    if (RISK_WEIGHT[risk] > RISK_WEIGHT[highestRisk]) {
      highestRisk = risk;
    }

    if (result.rule.effect?.toLowerCase() === "block") {
      if (RISK_WEIGHT.high > RISK_WEIGHT[highestRisk]) {
        highestRisk = "high";
      }
    }
  }

  return highestRisk;
}