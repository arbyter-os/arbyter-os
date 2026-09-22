import assert from "node:assert/strict"
import { register } from "node:module"
import test from "node:test"

const rateLimitStub = `
let calls = []
export async function checkRateLimit(key, limit, windowMs) {
  calls.push({ key, limit, windowMs })
  const count = calls.filter((item) => item.key === key).length
  return count <= limit
    ? { allowed: true, remaining: limit - count, retryAfterSeconds: 0 }
    : { allowed: false, remaining: 0, retryAfterSeconds: 1 }
}
export function __calls() { return calls }
`
const rateLimit = `data:text/javascript,${encodeURIComponent(rateLimitStub)}`
const loader = `
const rateLimit = ${JSON.stringify(rateLimit)}
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "./rate-limit.ts") return { url: rateLimit, shortCircuit: true }
  return nextResolve(specifier, context)
}
`
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

const { consumeGeminiBudget, GEMINI_BUDGET_LIMIT, GEMINI_BUDGET_WINDOW_MS, GeminiBudgetExceededError } = await import("../lib/security/gemini-budget.ts")
const { __calls } = await import(rateLimit)

test("Gemini budget uses a per-user distributed rate-limit key", async () => {
  await consumeGeminiBudget("user-1")
  const calls = __calls()
  assert.deepEqual(calls[0], { key: "gemini:user-1", limit: GEMINI_BUDGET_LIMIT, windowMs: GEMINI_BUDGET_WINDOW_MS })
})

test("11th request is rejected by the budget result", async () => {
  for (let i = 0; i < GEMINI_BUDGET_LIMIT; i += 1) await consumeGeminiBudget("user-2")
  await assert.rejects(() => consumeGeminiBudget("user-2"), GeminiBudgetExceededError)
})

test("separate users have separate budget keys", async () => {
  await consumeGeminiBudget("user-a")
  await consumeGeminiBudget("user-b")
  const keys = __calls().slice(-2).map((call: { key: string }) => call.key)
  assert.deepEqual(keys, ["gemini:user-a", "gemini:user-b"])
})

test("missing user context is rejected", async () => {
  await assert.rejects(() => consumeGeminiBudget(""), /Gemini request context is required/)
})
