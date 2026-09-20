import { strict as assert } from "node:assert"
import { test } from "node:test"
import { handleExecuteRequest } from "../app/api/execute/route.ts"
import type { OrchestrationResult } from "../lib/orchestration/index.ts"

const result: OrchestrationResult = {
  intent: {
    intent: "send_email",
    action: "send_email",
    parameters: {
      recipient: "test@example.com",
      message: "hello",
    },
    required_capabilities: ["messages.send"],
  },
  candidates: [],
  selectedAgent: null,
  execution: null,
  latencyMs: 1,
  status: "no_compatible_agent",
}

function request(body: string): Request {
  return new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

test("valid POST accepts message and calls orchestration", async () => {
  let received = ""

  const response = await handleExecuteRequest(
    request(JSON.stringify({ message: "Send an email to test@example.com." })),
    async (message) => {
      received = message
      return result
    },
  )

  assert.equal(response.status, 200)
  assert.equal(received, "Send an email to test@example.com.")
  assert.deepEqual(await json(response), result)
})

test("missing message returns 400", async () => {
  const response = await handleExecuteRequest(
    request(JSON.stringify({})),
    async () => result,
  )

  assert.equal(response.status, 400)
})

test("empty message returns 400", async () => {
  const response = await handleExecuteRequest(
    request(JSON.stringify({ message: "   " })),
    async () => result,
  )

  assert.equal(response.status, 400)
})

test("non-string message returns 400", async () => {
  const response = await handleExecuteRequest(
    request(JSON.stringify({ message: 123 })),
    async () => result,
  )

  assert.equal(response.status, 400)
})

test("malformed JSON returns 400", async () => {
  const response = await handleExecuteRequest(
    request("{\"message\":"),
    async () => result,
  )

  assert.equal(response.status, 400)
})

test("orchestration failure returns 500 with the error", async () => {
  const response = await handleExecuteRequest(
    request(JSON.stringify({ message: "Send an email." })),
    async () => {
      throw new Error("connector failed")
    },
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await json(response), { error: "connector failed" })
})
