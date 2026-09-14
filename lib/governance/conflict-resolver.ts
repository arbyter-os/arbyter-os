import type { GovernanceRule } from "./rule-loader";
import type { TriggeredRule } from "./evaluator";

export type GovernanceEffect =
  | "allow"
  | "block"
  | "require_approval"
  | "flag";

export type ConflictResolution = {
  effect: GovernanceEffect;
  rule: GovernanceRule | null;
  reason: string;
  triggeredRules: TriggeredRule[];
};

const SOURCE_WEIGHT: Record<string, number> = {
  government: 400,
  regulatory: 400,
  security: 300,
  framework: 250,
  company: 200,
  system: 100,
};

const EFFECT_WEIGHT: Record<GovernanceEffect, number> = {
  block: 400,
  require_approval: 300,
  flag: 200,
  allow: 100,
};

function getRuleWeight(rule: GovernanceRule): number {
  const sourceWeight = SOURCE_WEIGHT[
    rule.sourceType?.toLowerCase() ?? ""
  ] ?? 0;

  const effect =
    (rule.effect?.toLowerCase() ?? "flag") as GovernanceEffect;

  const effectWeight = EFFECT_WEIGHT[effect] ?? 0;

  return rule.priority + sourceWeight + effectWeight;
}

export function resolveConflicts(
  triggeredRules: TriggeredRule[]
): ConflictResolution {
  if (triggeredRules.length === 0) {
    return {
      effect: "allow",
      rule: null,
      reason: "No governance rules were triggered.",
      triggeredRules: [],
    };
  }

  const sorted = [...triggeredRules].sort(
    (a, b) => getRuleWeight(b.rule) - getRuleWeight(a.rule)
  );

  const winner = sorted[0];
  const effect =
    (winner.rule.effect?.toLowerCase() ?? "flag") as GovernanceEffect;

  return {
    effect,
    rule: winner.rule,
    reason: `Decision determined by rule "${winner.rule.name}" with priority ${winner.rule.priority}.`,
    triggeredRules,
  };
}