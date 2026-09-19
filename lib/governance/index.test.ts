import assert from "node:assert/strict"
import test from "node:test"

import {
  applyMissingContextApproval,
  getMissingContextualRules,
} from "./index"
import type { GovernanceRule } from "./rule-loader"
import type { GovernanceContext } from "./applicability"
import type { ConflictResolution } from "./conflict-resolver"

function rule(
  overrides: Partial<GovernanceRule> = {}
): GovernanceRule {
  return {
    id: "rule-1",
    policyId: "policy-1",
    policyName: "Policy",
    policyType: null,
    sourceType: "company",
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

function resolution(
  effect: ConflictResolution["effect"]
): ConflictResolution {
  return {
    effect,
    rule: null,
    reason: "Existing decision",
    triggeredRules: [],
  }
}

const missingContextCases: Array<{
  field: "country" | "state" | "jurisdiction" | "sector"
  context: GovernanceContext
}> = [
  { field: "country", context: {} },
  { field: "state", context: {} },
  { field: "jurisdiction", context: {} },
  { field: "sector", context: {} },
]

for (const { field, context } of missingContextCases) {
  test(`missing ${field} requires approval`, () => {
    const contextualRule = rule({
      scope: { [field]: field === "country" ? "US" : "required" },
    })

    const missing = getMissingContextualRules(
      [contextualRule],
      context
    )

    assert.equal(missing.length, 1)
    assert.deepEqual(missing[0].fields, [field])

    const result = applyMissingContextApproval(
      resolution("allow"),
      missing
    )

    assert.equal(result.effect, "require_approval")
  })
}

test("non-contextual rule remains unaffected", () => {
  const rules = [rule({ scope: { tool: "send_email" } })]
  const missing = getMissingContextualRules(rules, {})

  assert.equal(missing.length, 0)
  assert.equal(
    applyMissingContextApproval(resolution("allow"), missing).effect,
    "allow"
  )
})

test("missing contextual rule does not suppress unrelated rules", () => {
  const contextualRule = rule({
    id: "contextual",
    scope: { country: "US" },
  })
  const unrelatedRule = rule({
    id: "unrelated",
    scope: { tool: "send_email" },
  })

  const missing = getMissingContextualRules(
    [contextualRule, unrelatedRule],
    { tool: "send_email" }
  )

  assert.deepEqual(
    missing.map((entry) => entry.rule.id),
    ["contextual"]
  )

  const result = applyMissingContextApproval(
    resolution("allow"),
    missing
  )

  assert.equal(result.effect, "require_approval")
})

test("existing explicit BLOCK remains BLOCK", () => {
  const result = applyMissingContextApproval(
    resolution("block"),
    [
      {
        rule: rule({ scope: { country: "US" } }),
        fields: ["country"],
      },
    ]
  )

  assert.equal(result.effect, "block")
})

test("existing explicit REQUIRE_APPROVAL remains REQUIRE_APPROVAL", () => {
  const result = applyMissingContextApproval(
    resolution("require_approval"),
    [
      {
        rule: rule({ scope: { country: "US" } }),
        fields: ["country"],
      },
    ]
  )

  assert.equal(result.effect, "require_approval")
})

test("present but non-matching context remains ordinary non-applicability", () => {
  const contextualRule = rule({
    scope: { country: "US" },
  })

  const missing = getMissingContextualRules(
    [contextualRule],
    { country: "CA" }
  )

  assert.equal(missing.length, 0)
})