import test from "node:test"
import assert from "node:assert/strict"
import { validateJsonSchema, MAX_JSON_DEPTH } from "./json-schema.ts"
import { API_SCHEMAS, assertApiBody, assertApiParam } from "./api-schemas.ts"
import { RequestValidationError, validationErrorResponse } from "./errors.ts"

const strict = { type: "object", properties: { a: { type: "string" } }, required: ["a"], additionalProperties: false } as const
const uuid = "550e8400-e29b-41d4-a716-446655440000"

test("inherited Object.prototype names cannot satisfy required or slip past additionalProperties:false", () => {
  assert.ok(validateJsonSchema({ a: "x", toString: "y" }, strict).length > 0)
  assert.ok(validateJsonSchema({ a: "x", constructor: 1 }, strict).length > 0)
  assert.ok(validateJsonSchema({}, { ...strict, required: ["toString"] }).length > 0)
})

test("free-form objects reject __proto__ keys, excessive depth and excessive key counts", () => {
  const free = { type: "object", properties: { data: { type: "object" } }, additionalProperties: false } as const
  assert.ok(validateJsonSchema(JSON.parse('{"data":{"__proto__":{"admin":true}}}'), free).length > 0)
  let deep: Record<string, unknown> = {}
  const top = deep
  for (let i = 0; i < MAX_JSON_DEPTH + 2; i++) { const next = {}; deep.k = next; deep = next as Record<string, unknown> }
  assert.ok(validateJsonSchema({ data: top }, free).length > 0)
  const wide = Object.fromEntries(Array.from({ length: 600 }, (_, i) => [`k${i}`, i]))
  assert.ok(validateJsonSchema({ data: wide }, free).length > 0)
  assert.deepEqual(validateJsonSchema({ data: { ok: { nested: [1, 2, 3] } } }, free), [])
})

test("numeric bounds, calendar-valid dates and single-line text are enforced", () => {
  assert.ok(validateJsonSchema(5, { type: "integer", minimum: 6 }).length > 0)
  assert.ok(validateJsonSchema(5, { type: "integer", maximum: 4 }).length > 0)
  assert.deepEqual(validateJsonSchema(5, { type: "integer", minimum: 5, maximum: 5 }), [])
  for (const bad of ["2026-13-45", "2026-02-30", "2026-09-21Tgarbage", "2026-09-21T25:00:00Z", "tomorrow"]) {
    assert.ok(validateJsonSchema(bad, { type: "string", format: "iso-date" }).length > 0, bad)
  }
  for (const ok of ["2026-09-21", "2026-09-21T10:30:00Z", "2028-02-29T00:00:00.000+05:30"]) {
    assert.deepEqual(validateJsonSchema(ok, { type: "string", format: "iso-date" }), [], ok)
  }
  assert.ok(validateJsonSchema("a\r\nBcc: x@y.z", { type: "string", format: "text" }).length > 0)
  assert.ok(validateJsonSchema("nul\u0000byte", { type: "string", format: "multiline-text" }).length > 0)
  assert.deepEqual(validateJsonSchema("line one\nline two\ttabbed", { type: "string", format: "multiline-text" }), [])
})

test("agentmail: a single string recipient is validated as an email, and CRLF is rejected in the subject", () => {
  const base = { subject: "Hi", text: "Body" }
  assert.doesNotThrow(() => assertApiBody({ ...base, to: "a@example.com" }, "agentmail:send"))
  assert.doesNotThrow(() => assertApiBody({ ...base, to: ["a@example.com", "b@example.com"] }, "agentmail:send"))
  assert.throws(() => assertApiBody({ ...base, to: "not an email" }, "agentmail:send"), RequestValidationError)
  assert.throws(() => assertApiBody({ ...base, to: "x".repeat(5000) }, "agentmail:send"), RequestValidationError)
  assert.throws(() => assertApiBody({ ...base, to: [] }, "agentmail:send"), RequestValidationError)
  assert.throws(() => assertApiBody({ ...base, to: "a@example.com", subject: "Hi\r\nBcc: v@example.com" }, "agentmail:send"), RequestValidationError)
})

test("credentials: unknown fields, bad dates and oversized values are rejected; null expiry is allowed", () => {
  const ok = { agentConnectionId: uuid, name: "Prod key", secret: "s3cret" }
  assert.doesNotThrow(() => assertApiBody(ok, "agents:credentials"))
  assert.doesNotThrow(() => assertApiBody({ ...ok, expiresAt: null }, "agents:credentials"))
  assert.doesNotThrow(() => assertApiBody({ ...ok, expiresAt: "2027-01-01T00:00:00Z" }, "agents:credentials"))
  assert.throws(() => assertApiBody({ ...ok, extra: 1 }, "agents:credentials"))
  assert.throws(() => assertApiBody({ ...ok, expiresAt: "2027-13-99" }, "agents:credentials"))
  assert.throws(() => assertApiBody({ ...ok, name: "x".repeat(300) }, "agents:credentials"))
})

test("test-mcp schema accepts real JSON-RPC 2.0 traffic the discovery scanner sends", () => {
  for (const method of ["initialize", "notifications/initialized", "tools/list", "tools/call", "resources/list", "prompts/list"]) {
    assert.doesNotThrow(() => assertApiBody({ jsonrpc: "2.0", id: 1, method, params: {} }, "test-mcp"), method)
  }
  assert.throws(() => assertApiBody({ jsonrpc: "1.0", id: 1, method: "tools/list" }, "test-mcp"))
  assert.throws(() => assertApiBody({ jsonrpc: "2.0", id: 1, method: "shutdown" }, "test-mcp"))
})

test("validation failures map to 400/413 responses; other errors are not swallowed", async () => {
  let thrown: unknown
  try { assertApiBody({ agentId: "nope" }, "agents:verify") } catch (error) { thrown = error }
  const response = validationErrorResponse(thrown)
  assert.equal(response?.status, 400)
  const payload = (await response!.json()) as { error: string; issues?: string[] }
  assert.equal(payload.error, "Invalid request.")
  assert.ok(payload.issues?.every((issue) => !issue.includes("nope")), "submitted values must not be echoed")

  assert.equal(validationErrorResponse(Object.assign(new Error("too big"), { name: "RequestBodyLimitError" }))?.status, 413)
  assert.equal(validationErrorResponse(new Error("connection to db failed at 10.0.0.5")), null)
  assert.equal(validationErrorResponse("string"), null)
})

test("path parameters must be UUIDs", () => {
  assert.doesNotThrow(() => assertApiParam(uuid, "uuid", "id"))
  assert.throws(() => assertApiParam("1; drop table", "uuid", "id"), RequestValidationError)
})
