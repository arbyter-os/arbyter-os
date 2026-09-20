import assert from "node:assert/strict"
import test from "node:test"
import {
  consumeGeminiBudget,
  GEMINI_BUDGET_LIMIT,
  GEMINI_BUDGET_WINDOW_MS,
  GeminiBudgetExceededError,
  resetGeminiBudgetForTests,
} from "../lib/security/gemini-budget.ts"

test.beforeEach(() => resetGeminiBudgetForTests())

test("first request for a user is allowed", () => {
  assert.doesNotThrow(() => consumeGeminiBudget("user-1", 0))
})

test("requests below 10 per minute are allowed", () => {
  for (let i = 0; i < GEMINI_BUDGET_LIMIT - 1; i += 1) {
    assert.doesNotThrow(() => consumeGeminiBudget("user-1", i))
  }
})

test("the 11th request in the same minute is rejected", () => {
  for (let i = 0; i < GEMINI_BUDGET_LIMIT; i += 1) {
    consumeGeminiBudget("user-1", i)
  }

  assert.throws(
    () => consumeGeminiBudget("user-1", GEMINI_BUDGET_WINDOW_MS - 1),
    GeminiBudgetExceededError,
  )
})

test("separate users have separate budgets", () => {
  for (let i = 0; i < GEMINI_BUDGET_LIMIT; i += 1) {
    consumeGeminiBudget("user-1", i)
  }

  assert.doesNotThrow(() => consumeGeminiBudget("user-2", GEMINI_BUDGET_LIMIT))
})

test("the budget window resets", () => {
  for (let i = 0; i < GEMINI_BUDGET_LIMIT; i += 1) {
    consumeGeminiBudget("user-1", i)
  }

  assert.doesNotThrow(() => consumeGeminiBudget("user-1", GEMINI_BUDGET_WINDOW_MS))
})

test("missing user context is rejected", () => {
  assert.throws(() => consumeGeminiBudget("", 0), /Gemini request context is required/)
})
