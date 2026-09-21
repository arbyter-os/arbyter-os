import assert from "node:assert/strict"
import test from "node:test"

import { evaluateGovernanceRules } from "./index"
import type { GovernanceRule } from "./rule-loader"

function rule(
  overrides: Partial<GovernanceRule> = {}
): GovernanceRule {
  return {
    id: "rule-1",
    policyId: "policy-1",
    policyName: "Policy",
    policyType: null,
    sourceType: "security",
    authority: null,
    jurisdiction: null,
    sector: null,
    sourceReference: null,
    sourceUrl: null,
    effectiveFrom: null,
    effectiveUntil: null,
    name: "Rule",
    description: null,
    ruleType: null,
    effect: "block",
    conditions: {},
    priority: 100,
    enabled: true,
    version: null,
    scope: {},
    exceptions: {},
    ...overrides,
  }
}

function numericRule(overrides: Partial<GovernanceRule> = {}) {
  return rule({
    conditions: { "data.amount": { gt: 1000 } },
    ...overrides,
  })
}

test("valid numeric value that matches produces BLOCK", () => {
  const result = evaluateGovernanceRules(
    [numericRule()],
    { data: { amount: 1500 } }
  )

  assert.equal(result.decision.decision, "BLOCK")
  assert.equal(result.triggeredRules.length, 1)
  assert.equal(result.unevaluableRules.length, 0)
})

test("valid numeric value that does not match remains ALLOW", () => {
  const result = evaluateGovernanceRules(
    [numericRule()],
    { data: { amount: 500 } }
  )

  assert.equal(result.decision.decision, "ALLOW")
  assert.equal(result.triggeredRules.length, 0)
  assert.equal(result.unevaluableRules.length, 0)
})

for (const [label, data] of [
  ["missing value", {}],
  ["undefined value", { amount: undefined }],
  ["null value", { amount: null }],
  ["wrong-type string", { amount: "1500" }],
] as const) {
  test(`numeric rule with ${label} requires approval`, () => {
    const result = evaluateGovernanceRules(
      [numericRule()],
      { data: data as Record<string, unknown> }
    )

    assert.equal(result.decision.decision, "REQUIRE_APPROVAL")
    assert.equal(result.unevaluableRules.length, 1)
  })
}

test("missing nested field cannot become a non-match", () => {
  const result = evaluateGovernanceRules(
    [rule({ conditions: { "data.customer.amount": { gt: 1000 } } })],
    { data: { customer: {} } }
  )

  assert.equal(result.decision.decision, "REQUIRE_APPROVAL")
  assert.equal(result.unevaluableRules.length, 1)
})

test("wrong nested field type cannot become a non-match", () => {
  const result = evaluateGovernanceRules(
    [rule({ conditions: { "data.customer.amount": { gt: 1000 } } })],
    { data: { customer: { amount: "1500" } } }
  )

  assert.equal(result.decision.decision, "REQUIRE_APPROVAL")
  assert.equal(result.unevaluableRules.length, 1)
})

test("a matched rule and an unevaluable rule cannot produce ALLOW", () => {
  const result = evaluateGovernanceRules(
    [
      rule({
        id: "matched",
        name: "Matched blocking rule",
        conditions: { "data.amount": { gt: 1000 } },
      }),
      rule({
        id: "unevaluable",
        name: "Unevaluable security rule",
        effect: "allow",
        conditions: { "data.customer.amount": { gt: 1000 } },
      }),
    ],
    { data: { amount: 1500, customer: {} } }
  )

  assert.equal(result.decision.decision, "BLOCK")
  assert.equal(result.unevaluableRules.length, 1)
})

test("an otherwise ALLOW result becomes REQUIRE_APPROVAL when a security rule is unevaluable", () => {
  const result = evaluateGovernanceRules(
    [
      rule({
        id: "allow-rule",
        name: "Ordinary allow rule",
        effect: "allow",
        conditions: { action: "send_email" },
      }),
      rule({
        id: "security-rule",
        name: "Security amount rule",
        effect: "block",
        conditions: { "data.amount": { gt: 1000 } },
      }),
    ],
    { action: "send_email", data: {} }
  )

  assert.equal(result.decision.decision, "REQUIRE_APPROVAL")
  assert.equal(result.decision.ruleId, "security-rule")
})

test("existing valid governance behavior remains unchanged for non-matching rules", () => {
  const result = evaluateGovernanceRules(
    [
      rule({
        id: "country-rule",
        effect: "block",
        scope: { country: "US" },
        conditions: { action: "send_email" },
      }),
    ],
    { country: "CA", action: "send_email" }
  )

  assert.equal(result.decision.decision, "ALLOW")
  assert.equal(result.triggeredRules.length, 0)
  assert.equal(result.unevaluableRules.length, 0)
})
