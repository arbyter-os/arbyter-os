import type { GovernanceRule } from "./rule-loader";

export type EvaluationContext = {
  [key: string]: unknown;
};

export type TriggeredRule = {
  rule: GovernanceRule;
  matched: boolean;
  reason: string;
};

function getValue(
  path: string,
  context: EvaluationContext
): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (
      value &&
      typeof value === "object" &&
      key in value
    ) {
      return (value as Record<string, unknown>)[key];
    }

    return undefined;
  }, context);
}

function matchesCondition(
  key: string,
  expected: unknown,
  context: EvaluationContext
): boolean {
  const actual = getValue(key, context);

  if (Array.isArray(expected)) {
    return expected.includes(actual);
  }

  if (
    expected &&
    typeof expected === "object" &&
    actual !== null &&
    typeof actual === "number"
  ) {
    const condition = expected as Record<string, unknown>;

    if ("gt" in condition) return actual > Number(condition.gt);
    if ("gte" in condition) return actual >= Number(condition.gte);
    if ("lt" in condition) return actual < Number(condition.lt);
    if ("lte" in condition) return actual <= Number(condition.lte);
    if ("eq" in condition) return actual === condition.eq;
    if ("neq" in condition) return actual !== condition.neq;
  }

  return actual === expected;
}

export function evaluateRule(
  rule: GovernanceRule,
  context: EvaluationContext
): TriggeredRule {
  const conditions = rule.conditions ?? {};
  const entries = Object.entries(conditions);

  if (entries.length === 0) {
    return {
      rule,
      matched: true,
      reason: "Rule has no conditions and therefore applies.",
    };
  }

  const failedCondition = entries.find(
    ([key, expected]) =>
      !matchesCondition(key, expected, context)
  );

  if (failedCondition) {
    return {
      rule,
      matched: false,
      reason: `Condition "${failedCondition[0]}" did not match.`,
    };
  }

  return {
    rule,
    matched: true,
    reason: "All rule conditions matched.",
  };
}

export function evaluateRules(
  rules: GovernanceRule[],
  context: EvaluationContext
): TriggeredRule[] {
  return rules.map((rule) => evaluateRule(rule, context));
}

export function getTriggeredRules(
  rules: GovernanceRule[],
  context: EvaluationContext
): TriggeredRule[] {
  return evaluateRules(rules, context).filter(
    (result) => result.matched
  );
}