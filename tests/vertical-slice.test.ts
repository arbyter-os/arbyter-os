import { strict as assert } from "node:assert"
import { test } from "node:test"
import { GeminiProvider } from "../lib/llm/gemini.ts"
import { generateIntent, validateIntent } from "../lib/intent/index.ts"
import type { LLMProvider } from "../lib/llm/types.ts"

test("intent engine transforms natural language into the expected structured result", async () => {
  const provider: LLMProvider = {
    async generateStructured() {
      return {
        intent: "send_report",
        action: "send_email",
        parameters: {
          recipient: "Ali",
          document: "sales report",
        },
        required_capabilities: ["send_email"],
      }
    },
  }

  const intent = await generateIntent("Send the sales report to Ali", provider)

  assert.deepEqual(intent, {
    intent: "send_report",
    action: "send_email",
    parameters: {
      recipient: "Ali",
      document: "sales report",
    },
    required_capabilities: ["send_email"],
  })
})

test("intent engine rejects invalid input before calling Gemini", async () => {
  let called = false
  const provider: LLMProvider = {
    async generateStructured() {
      called = true
      return {}
    },
  }

  await assert.rejects(() => generateIntent("   ", provider), /Request is required/)
  assert.equal(called, false)
})

test("intent validation requires required_capabilities", () => {
  assert.throws(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: "Ali" },
  }))

  assert.throws(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: "Ali" },
    required_capabilities: [""],
  }))

  assert.throws(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: "Ali" },
    required_capabilities: [42],
  }))
})

test("intent validation rejects other malformed Gemini output", () => {
  assert.throws(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: 42 },
    required_capabilities: ["send_email"],
  }))

  assert.throws(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: "Ali" },
    required_capabilities: ["send_email"],
    extra: true,
  }))

  assert.doesNotThrow(() => validateIntent({
    intent: "send_report",
    action: "send_email",
    parameters: { recipient: "Ali", document: "sales report" },
    required_capabilities: ["send_email"],
  }))
})

test("Gemini provider makes a real request when GEMINI_API_KEY is configured", { skip: !process.env.GEMINI_API_KEY }, async () => {
  const provider = new GeminiProvider()
  const result = await provider.generateStructured({
    system: "Return JSON only with a single key named ok whose value is the string yes.",
    input: "Respond with the requested JSON.",
  })

  assert.deepEqual(result, { ok: "yes" })
})

test("Gemini provider fails clearly when GEMINI_API_KEY is missing", () => {
  assert.throws(() => new GeminiProvider(""), /GEMINI_API_KEY is not configured/)
})
