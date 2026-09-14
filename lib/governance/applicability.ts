import type { GovernanceRule } from "./rule-loader";

export type GovernanceContext = {
  jurisdiction?: string;
  sector?: string;
  country?: string;
  state?: string;
  dataTypes?: string[];
  action?: string;
  tool?: string;
};

function matchesValue(
  ruleValue: unknown,
  contextValue: unknown
): boolean {
  if (ruleValue === undefined || ruleValue === null || ruleValue === "") {
    return true;
  }

  if (Array.isArray(ruleValue)) {
    return ruleValue.includes(contextValue);
  }

  return ruleValue === contextValue;
}

function matchesScope(
  rule: GovernanceRule,
  context: GovernanceContext
): boolean {
  const scope = rule.scope ?? {};

  if (
    scope.jurisdiction &&
    !matchesValue(scope.jurisdiction, context.jurisdiction)
  ) {
    return false;
  }

  if (
    scope.country &&
    !matchesValue(scope.country, context.country)
  ) {
    return false;
  }

  if (
    scope.state &&
    !matchesValue(scope.state, context.state)
  ) {
    return false;
  }

  if (
    scope.sector &&
    !matchesValue(scope.sector, context.sector)
  ) {
    return false;
  }

  if (
    scope.action &&
    !matchesValue(scope.action, context.action)
  ) {
    return false;
  }

  if (
    scope.tool &&
    !matchesValue(scope.tool, context.tool)
  ) {
    return false;
  }

  return true;
}

function matchesExceptions(
  rule: GovernanceRule,
  context: GovernanceContext
): boolean {
  const exceptions = rule.exceptions ?? {};

  if (
    exceptions.jurisdiction &&
    matchesValue(exceptions.jurisdiction, context.jurisdiction)
  ) {
    return false;
  }

  if (
    exceptions.sector &&
    matchesValue(exceptions.sector, context.sector)
  ) {
    return false;
  }

  if (
    exceptions.action &&
    matchesValue(exceptions.action, context.action)
  ) {
    return false;
  }

  if (
    exceptions.tool &&
    matchesValue(exceptions.tool, context.tool)
  ) {
    return false;
  }

  return true;
}

export function isRuleApplicable(
  rule: GovernanceRule,
  context: GovernanceContext
): boolean {
  if (!rule.enabled) return false;

  const now = new Date();

  if (
    rule.effectiveFrom &&
    new Date(rule.effectiveFrom) > now
  ) {
    return false;
  }

  if (
    rule.effectiveUntil &&
    new Date(rule.effectiveUntil) < now
  ) {
    return false;
  }

  if (
    rule.jurisdiction &&
    !matchesValue(rule.jurisdiction, context.jurisdiction)
  ) {
    return false;
  }

  if (
    rule.sector &&
    !matchesValue(rule.sector, context.sector)
  ) {
    return false;
  }

  if (!matchesScope(rule, context)) {
    return false;
  }

  if (!matchesExceptions(rule, context)) {
    return false;
  }

  return true;
}

export function getApplicableRules(
  rules: GovernanceRule[],
  context: GovernanceContext
): GovernanceRule[] {
  return rules
    .filter((rule) => isRuleApplicable(rule, context))
    .sort((a, b) => b.priority - a.priority);
}