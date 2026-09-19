import { strict as assert } from "node:assert"
import { test } from "node:test"
import { generateIntent, validateIntent } from "../lib/intent/index.ts"
import { filterAgentsByCapabilities } from "../lib/agents/capabilities.ts"
import { selectAgent } from "../lib/routing/index.ts"
import { evaluatePolicy } from "../lib/policy/index.ts"
import { getTool, validateToolInput, validateToolOutput } from "../lib/tools/registry.ts"
import { assertJsonSchema } from "../lib/validation/json-schema.ts"

test("intent engine produces the expected structured intent without Gemini", async () => {
  delete process.env.GEMINI_API_KEY
  const intent = await generateIntent("Send the sales report to Ali.")
  assert.deepEqual(intent, {
    intent: "send_report",
    entities: { recipient: "Ali", report: "sales_report" },
    required_capabilities: ["generate_sales_report", "send_email"],
    action: "send_report",
  })
})

test("intent validation rejects malformed LLM output", () => {
  assert.throws(() => validateIntent({ intent: "send_report", entities: {}, required_capabilities: [], action: "send_report" }))
  assert.throws(() => validateIntent({ intent: "send_report", entities: { recipient: 42 }, required_capabilities: ["send_email"], action: "send_report" }))
})

test("agent discovery requires every requested capability", () => {
  const agents = [
    { id: "a", capabilities: ["send_email"] },
    { id: "b", capabilities: ["generate_sales_report", "send_email"] },
  ]
  assert.deepEqual(filterAgentsByCapabilities(agents, ["generate_sales_report", "send_email"]).map((agent) => agent.id), ["b"])
})

test("routing selects an agent satisfying the full capability set", () => {
  const selected = selectAgent(
    { required_capabilities: ["generate_sales_report", "send_email"] },
    [
      { id: "a", name: "Email", capabilities: ["send_email"], verified: true },
      { id: "b", name: "Report", capabilities: ["generate_sales_report", "send_email"], verified: false },
    ],
  )
  assert.equal(selected.id, "b")
})

test("policy is deterministic and supports approval", () => {
  delete process.env.ARBYTER_REQUIRE_EMAIL_APPROVAL
  assert.equal(evaluatePolicy({ userId: "u", intent: "send_report", action: "send_report", agentId: "a", toolNames: ["send_email"] }), "ALLOW")
  process.env.ARBYTER_REQUIRE_EMAIL_APPROVAL = "true"
  assert.equal(evaluatePolicy({ userId: "u", intent: "send_report", action: "send_report", agentId: "a", toolNames: ["send_email"] }), "REQUIRES_APPROVAL")
  delete process.env.ARBYTER_REQUIRE_EMAIL_APPROVAL
  assert.equal(evaluatePolicy({ userId: "", intent: "send_report", action: "send_report", agentId: "a", toolNames: ["send_email"] }), "BLOCK")
})

test("tool input/output schemas reject invalid data and accept valid data", async () => {
  const tool = getTool("send_email")
  assert.throws(() => validateToolInput(tool, { recipient: "Ali" }))
  assert.throws(() => validateToolInput(tool, { recipient: "Ali", subject: "x", text: "y", extra: true }))
  const result = await tool.execute({ recipient: "Ali", subject: "Sales report", text: "Report" })
  validateToolOutput(tool, result)
  assert.equal((result as { sent: boolean }).sent, true)
})

test("generic schema validator enforces types and additional properties", () => {
  assert.doesNotThrow(() => assertJsonSchema({ name: "Arbyter" }, { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false }))
  assert.throws(() => assertJsonSchema({ name: 42 }, { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false }))
})
