import assert from "node:assert/strict"
import test from "node:test"
import {
  buildApprovalIntegrityEnvelope,
  canonicalizeForHash,
  hashApprovalIntegrityEnvelope,
} from "./approval-integrity.ts"

function envelope(overrides: Partial<ReturnType<typeof buildApprovalIntegrityEnvelope>> = {}) {
  return buildApprovalIntegrityEnvelope({
    execution_id: "exec-1",
    agent_id: "agent-1",
    connection_id: "conn-1",
    provider: "mail",
    action: "messages.send",
    capability: "messages.send",
    input_data: {
      data: { recipient: "a@example.com", body: "hello" },
      connection: { id: "conn-1", provider: "mail" },
    },
    task_id: "task-1",
    ...overrides,
  })
}

test("unchanged approval envelope passes integrity verification", () => {
  const approved = envelope()
  assert.equal(hashApprovalIntegrityEnvelope(approved), hashApprovalIntegrityEnvelope(envelope()))
})

for (const field of [
  "input_data",
  "action",
  "provider",
  "task_id",
  "agent_id",
  "connection_id",
  "capability",
] as const) {
  test(`changing ${field} invalidates approval integrity`, () => {
    const approved = envelope()
    const changed = envelope({
      [field]: field === "input_data"
        ? { data: { recipient: "attacker@example.com", body: "hello" } }
        : field === "task_id"
          ? "task-2"
          : `${field}-changed`,
    })
    assert.notEqual(
      hashApprovalIntegrityEnvelope(approved),
      hashApprovalIntegrityEnvelope(changed),
    )
  })
}

test("changing multiple protected fields invalidates approval", () => {
  assert.notEqual(
    hashApprovalIntegrityEnvelope(envelope()),
    hashApprovalIntegrityEnvelope(
      envelope({
        action: "messages.delete",
        provider: "slack",
        capability: "messages.delete",
        task_id: "task-2",
        connection_id: "conn-2",
      }),
    ),
  )
})

test("canonicalization is deterministic regardless of property insertion order", () => {
  const first = envelope({
    input_data: {
      connection: { provider: "mail", id: "conn-1" },
      data: { recipient: "a@example.com", body: "hello" },
    },
  })
  const reordered = envelope({
    input_data: {
      data: { body: "hello", recipient: "a@example.com" },
      connection: { id: "conn-1", provider: "mail" },
    },
  })

  assert.equal(canonicalizeForHash(first), canonicalizeForHash(reordered))
  assert.equal(hashApprovalIntegrityEnvelope(first), hashApprovalIntegrityEnvelope(reordered))
})

test("canonicalization distinguishes arrays from objects", () => {
  assert.notEqual(
    canonicalizeForHash({ items: { "0": "a", "1": "b" } }),
    canonicalizeForHash({ items: ["a", "b"] }),
  )
})
