import test from "node:test"
import assert from "node:assert/strict"
import { assertApiBody } from "../validation/api-schemas"
import { validateJsonSchema } from "../validation/json-schema"

test("strict API schemas reject unknown fields and overlong values", () => {
  assert.throws(() => assertApiBody({ title: "x", agentId: "00000000-0000-4000-8000-000000000000", extra: true }, "tasks:create"))
  assert.throws(() => assertApiBody({ title: "x".repeat(300), agentId: "00000000-0000-4000-8000-000000000000" }, "tasks:create"))
})

test("strict API schemas validate UUIDs, enums and nested object types", () => {
  assert.throws(() => assertApiBody({ taskId: "not-a-uuid", capability: "messages.delete" }, "tasks:execute"))
  assert.doesNotThrow(() => assertApiBody({ taskId: "00000000-0000-4000-8000-000000000000", capability: "messages.send" }, "tasks:execute"))
  assert.deepEqual(validateJsonSchema({ value: "x" }, { type: "object", properties: { value: { type: "string", maxLength: 1 } }, additionalProperties: false }), [])
})


test("route parameter validation rejects malformed UUIDs", async () => {
  const { assertApiParam } = await import("../validation/api-schemas.ts")
  assert.doesNotThrow(() => assertApiParam("550e8400-e29b-41d4-a716-446655440000", "uuid"))
  assert.throws(() => assertApiParam("not-a-uuid", "uuid"))
  assert.throws(() => assertApiParam("", "nonempty"))
})

test("idempotency header validation rejects control characters and oversized values", async () => {
  const { assertApiHeader } = await import("../validation/api-schemas.ts")
  assert.equal(assertApiHeader("abc_123-xyz"), "abc_123-xyz")
  assert.throws(() => assertApiHeader("abc\nxyz"))
  assert.throws(() => assertApiHeader("x".repeat(201)))
})
