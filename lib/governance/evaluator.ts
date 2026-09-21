import type { GovernanceRule } from "./rule-loader";

export type EvaluationContext = {
  [key: string]: unknown;
};

export type TriggeredRule = {
  rule: GovernanceRule;
  matched: boolean;
  evaluable: boolean;
  reason: string;
};

function getValue(
  path: string,
  context: EvaluationContext
): { found: boolean; value: unknown } {
  const segments = path.split(".");
  let value: unknown = context;

  for (const key of segments) {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "object" ||
      !(key in (value as Record<string, unknown>))
    ) {
      return { found: false, value: undefined };
    }

    value = (value as Record<string, unknown>)[key];
  }

  return { found: true, value };
}

function primitiveType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesCondition(
  key: string,
  expected: unknown,
  context: EvaluationContext
): { matched: boolean; evaluable: boolean; reason?: string } {
  const resolved = getValue(key, context);

  // A condition is security-sensitive by default: if its value cannot be
  // resolved to a concrete value, it is unevaluable rather than a mismatch.
  if (!resolved.found || resolved.value === null || resolved.value === undefined) {
    return {
      matched: false,
      evaluable: false,
      reason: `Condition "${key}" could not be evaluated because its value is missing or null.`,
    };
  }

  const actual = resolved.value;

  if (Array.isArray(expected)) {
    if (expected.length === 0) {
      return { matched: false, evaluable: true };
    }

    const expectedTypes = new Set(
      expected.filter((value) => value !== null && value !== undefined).map(primitiveType)
    );

    if (!expectedTypes.has(primitiveType(actual))) {
      return {
        matched: false,
        evaluable: false,
        reason: `Condition "${key}" received a value of type ${primitiveType(actual)}, but expected one of: ${[...expectedTypes].join(", ")}.`,
      };
    }

    return { matched: expected.includes(actual), evaluable: true };
  }

  if (expected && typeof expected === "object") {
    const condition = expected as Record<string, unknown>;
    const operator = ["gt", "gte", "lt", "lte", "eq", "neq"].find(
      (name) => name in condition
    );

    if (operator) {
      const operand = condition[operator];

      if (["gt", "gte", "lt", "lte"].includes(operator)) {
        if (typeof actual !== "number" || typeof operand !== "number" || !Number.isFinite(actual) || !Number.isFinite(operand)) {
          return {
            matched: false,
            evaluable: false,
            reason: `Condition "${key}" requires numeric values for ${operator}.`,
          };
        }

        switch (operator) {
          case "gt": return { matched: actual > operand, evaluable: true };
          case "gte": return { matched: actual >= operand, evaluable: true };
          case "lt": return { matched: actual < operand, evaluable: true };
          case "lte": return { matched: actual <= operand, evaluable: true };
        }
      }

      if (operator === "eq" || operator === "neq") {
        if (operand === null || operand === undefined || primitiveType(actual) !== primitiveType(operand)) {
          return {
            matched: false,
            evaluable: false,
            reason: `Condition "${key}" received a value of type ${primitiveType(actual)}, but expected ${primitiveType(operand)}.`,
          };
        }

        return {
          matched: operator === "eq" ? actual === operand : actual !== operand,
          evaluable: true,
        };
      }
    }

    return {
      matched: false,
      evaluable: false,
      reason: `Condition "${key}" uses an unsupported condition expression.`,
    };
  }

  if (primitiveType(actual) !== primitiveType(expected)) {
    return {
      matched: false,
      evaluable: false,
      reason: `Condition "${key}" received a value of type ${primitiveType(actual)}, but expected ${primitiveType(expected)}.`,
    };
  }

  return { matched: actual === expected, evaluable: true };
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
      evaluable: true,
      reason: "Rule has no conditions and therefore applies.",
    };
  }

  for (const [key, expected] of entries) {
    const result = matchesCondition(key, expected, context);

    if (!result.evaluable) {
      return {
        rule,
        matched: false,
        evaluable: false,
        reason: result.reason ?? `Condition "${key}" could not be evaluated.`,
      };
    }

    if (!result.matched) {
      return {
        rule,
        matched: false,
        evaluable: true,
        reason: `Condition "${key}" did not match.`,
      };
    }
  }

  return {
    rule,
    matched: true,
    evaluable: true,
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
