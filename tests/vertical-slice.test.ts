import { strict as assert } from "node:assert"
import { test } from "node:test"
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
