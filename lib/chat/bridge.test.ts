import { strict as assert } from "node:assert"
import { test } from "node:test"
import {
  buildExecuteRequestBody,
  executeMessageToBubbles,
  classifyOutcome,
  type ChatBubble,
} from "./bridge.ts"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

test("request body contains ONLY the message field", () => {
  const body = buildExecuteRequestBody("Send the sales report to Ali")
  assert.deepEqual(Object.keys(body), ["message"])
  assert.equal(body.message, "Send the sales report to Ali")
})

test("200 + completed execution renders success bubble", async () => {
  const bubbles = await executeMessageToBubbles(
    jsonResponse(200, {
      status: "completed",
      executionId: "exec-1",
      intent: { intent: "send_email" },
      execution: { status: "completed" },
    })
  )
  assert.equal(bubbles.length, 1)
  assert.equal(bubbles[0].kind, "text")
  assert.match((bubbles[0] as { text: string }).text, /completed/i)
})

test("200 + no_compatible_agent renders connect-an-agent guidance", async () => {
  const bubbles = await executeMessageToBubbles(
    jsonResponse(200, { status: "no_compatible_agent", candidates: [], execution: null })
  )
  assert.equal(bubbles[0].kind, "status")
  assert.match((bubbles[0] as { text: string }).text, /No agent/i)
})

test("200 + awaiting_approval / blocked / failed map to their own states", async () => {
  for (const [executionStatus, pattern] of [
    ["awaiting_approval", /approval/i],
    ["blocked", /governance/i],
    ["failed", /failed/i],
  ] as const) {
    const bubbles = await executeMessageToBubbles(
      jsonResponse(200, {
        status: "completed",
        execution: { status: executionStatus },
      })
    )
    assert.match((bubbles[0] as { text: string }).text, pattern, executionStatus)
  }
})

test("401 / 403 / 413 / 429 / 500 each render their fixed safe error", async () => {
  const cases: Array<[number, RegExp]> = [
    [401, /sign in/i],
    [403, /owner or admin/i],
    [413, /too large/i],
    [429, /Rate limit/i],
    [500, /Something went wrong/i],
  ]
  for (const [status, pattern] of cases) {
    const bubbles = await executeMessageToBubbles(jsonResponse(status, { error: "x" }))
    assert.equal(bubbles[0].kind, "error", String(status))
    assert.match((bubbles[0] as { text: string }).text, pattern, String(status))
  }
})

test("server error text is NEVER rendered — even when the response contains hostile strings", async () => {
  const hostile = {
    error: "postgres: password=real-secret leaked <script>alert(1)</script>",
    stack: "at /srv/app/internal/secret-path",
    message: "INTERNAL detail vault_ref=abc",
  }
  const bubbles: ChatBubble[] = []
  for (const status of [400, 401, 403, 413, 429, 500]) {
    bubbles.push(...(await executeMessageToBubbles(jsonResponse(status, hostile))))
  }
  for (const bubble of bubbles) {
    const text = bubble.text + ("detail" in bubble ? bubble.detail ?? "" : "")
    assert.doesNotMatch(text, /real-secret|internal\/secret-path|vault_ref|alert\(1\)/)
  }
})

test("malformed JSON body from the API still produces a safe bubble", async () => {
  const response = new Response("<html>bad gateway</html>", { status: 502 })
  const bubbles = await executeMessageToBubbles(response)
  assert.equal(bubbles[0].kind, "error")
  assert.match((bubbles[0] as { text: string }).text, /Something went wrong/i)
})

test("classifyOutcome covers every documented 200 shape", () => {
  assert.equal(classifyOutcome({ status: "no_compatible_agent" }).kind, "no_compatible_agent")
  assert.equal(classifyOutcome({ status: "no_agent_selected" }).kind, "no_agent_selected")
  assert.equal(classifyOutcome({ status: "unsupported_multiple_capabilities" }).kind, "unsupported_multiple_capabilities")
  assert.equal(classifyOutcome({ status: "completed", execution: { status: "awaiting_approval" } }).kind, "awaiting_approval")
  assert.equal(classifyOutcome({ status: "completed", execution: { status: "blocked" } }).kind, "blocked")
  assert.equal(classifyOutcome({ status: "completed", execution: { status: "failed" } }).kind, "failed")
  assert.equal(classifyOutcome({ status: "completed", execution: { status: "completed" }, executionId: "e1" }).kind, "completed")
  assert.equal(classifyOutcome({}).kind, "failed")
})
