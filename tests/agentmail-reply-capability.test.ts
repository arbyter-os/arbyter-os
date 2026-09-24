import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// Stage 4 finding D-3: the AgentMail connector only advertised
// "messages.send", so "messages.reply" executions failed at the capability
// check (lib/execution/engine.ts) before any execution row was created
// (HTTP 500, zero records) even though connections declared reply enabled.
//
// These tests load the REAL connector module (with its fetch boundary stubbed)
// and assert the reply path end-to-end through the connector contract.

const fetchCalls: { url: string; init: { method: string; body: string; headers: Record<string, string> } }[] = []

const validateExternalUrlStub = `
export async function validateExternalUrl(endpoint) {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://api.agentmail.to/")) {
    return { valid: false, reason: "unexpected endpoint in test" }
  }
  return { valid: true, url: new URL(endpoint) }
}
export async function fetchValidatedExternalUrl(validation, init) {
  globalThis.__fetchCalls.push({ url: String(validation.url), init })
  return {
    ok: true,
    status: 200,
    json: async () => ({ id: "msg-1", to: JSON.parse(init.body).to }),
  }
}
`

const stubUrl = (code: string) => `data:text/javascript,${encodeURIComponent(code)}`
const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
  `  if (specifier === "@/lib/security/validate-external-url") return { url: ${JSON.stringify(stubUrl(validateExternalUrlStub))}, shortCircuit: true }\n` +
  "  return nextResolve(specifier, context)\n" +
  "}\n"
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __fetchCalls: { url: string; init: { method: string; body: string; headers: Record<string, string> } }[] | undefined
}

const { agentMailConnector } = await import("../lib/connectors/agentmail.ts")

function freshCalls() {
  globalThis.__fetchCalls = []
  return globalThis.__fetchCalls
}

const baseContext = {
  connectionId: "conn-1",
  agentId: "agent-1",
  organizationId: "org-1",
  credential: { id: "cred-1", type: "api_key", secret: "test-secret" },
}

test("D-3: connector registry advertises messages.send and messages.reply", () => {
  assert.deepEqual([...agentMailConnector.capabilities].sort(), ["messages.reply", "messages.send"])
})

test("D-3: messages.reply executes through the connector contract with default subject", async () => {
  const calls = freshCalls()
  const result = await agentMailConnector.execute(
    {
      action: "messages.reply",
      payload: { data: { to: "dana@example.com", text: "The invoice was paid." } },
    },
    baseContext,
  )

  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  const body = JSON.parse(calls[0].init.body)
  assert.deepEqual(body.to, ["dana@example.com"])
  assert.equal(body.text, "The invoice was paid.")
  assert.equal(body.subject, "Reply from Arbyter")
})

test("D-3: messages.reply honors an explicit subject when the mapping supplies one", async () => {
  const calls = freshCalls()
  const result = await agentMailConnector.execute(
    {
      action: "messages.reply",
      payload: { data: { to: "dana@example.com", subject: "Re: invoice", text: "Paid." } },
    },
    baseContext,
  )
  assert.equal(result.success, true)
  assert.equal(JSON.parse(calls[0].init.body).subject, "Re: invoice")
})

test("D-3: messages.reply rejects payloads without to/text", async () => {
  freshCalls()
  const missingText = await agentMailConnector.execute(
    { action: "messages.reply", payload: { data: { to: "dana@example.com" } } },
    baseContext,
  )
  assert.equal(missingText.success, false)
  assert.match(missingText.error ?? "", /to and text are required/)

  const missingTo = await agentMailConnector.execute(
    { action: "messages.reply", payload: { data: { text: "hello" } } },
    baseContext,
  )
  assert.equal(missingTo.success, false)
  assert.match(missingTo.error ?? "", /to and text are required/)
})

test("D-3: messages.send keeps to/text strictness and derives a subject when absent", async () => {
  const calls = freshCalls()
  const result = await agentMailConnector.execute(
    { action: "messages.send", payload: { data: { to: "ali@example.com", subject: "Hi", text: "Hello" } } },
    baseContext,
  )
  assert.equal(result.success, true)
  const body = JSON.parse(calls[0].init.body)
  assert.deepEqual(body.to, ["ali@example.com"])
  assert.equal(body.subject, "Hi")
  assert.equal(body.text, "Hello")

  // Sends without an explicit subject fall back to the same fixed subject the
  // mapping layer (mapSend) uses, instead of failing at the wire.
  const defaulted = await agentMailConnector.execute(
    { action: "messages.send", payload: { data: { to: "ali@example.com", text: "Hello" } } },
    baseContext,
  )
  assert.equal(defaulted.success, true)
  assert.equal(JSON.parse(calls[1].init.body).subject, "Message from Arbyter")

  const missingText = await agentMailConnector.execute(
    { action: "messages.send", payload: { data: { to: "ali@example.com", subject: "Hi" } } },
    baseContext,
  )
  assert.equal(missingText.success, false)
  assert.match(missingText.error ?? "", /to and text are required/)
})

test("D-3: unsupported actions still fail closed", async () => {
  freshCalls()
  const result = await agentMailConnector.execute(
    { action: "messages.read", payload: {} },
    baseContext,
  )
  assert.equal(result.success, false)
  assert.match(result.error ?? "", /Unsupported AgentMail action/)
})
