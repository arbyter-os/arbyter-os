import { strict as assert } from "node:assert"
import { test } from "node:test"
import {
  mapIntentParametersToConnectorPayload,
  IntentMappingError,
} from "../lib/connectors/intent-mapping.ts"

test("messages.send: to/recipient/email aliases and mailto/display-name normalization", () => {
  const { payload } = mapIntentParametersToConnectorPayload({
    action: "messages.send",
    parameters: { recipient: "Ali <ali@example.com>", message: "hello" },
  })
  assert.equal(payload.to, "ali@example.com")
  assert.equal(payload.subject, "Message from Arbyter")
  assert.equal(payload.text, "hello")

  const mailto = mapIntentParametersToConnectorPayload({
    action: "messages.send",
    parameters: { to: "mailto:bob@example.com", message: "ping" },
  })
  assert.equal(mailto.payload.to, "bob@example.com")
  assert.equal(mailto.payload.text, "ping")
})

test("messages.send: derives subject and text from document/message, caps lengths", () => {
  const { payload } = mapIntentParametersToConnectorPayload({
    action: "messages.send",
    parameters: { recipient: "ali@example.com", document: "Q3 report", message: "here are the numbers" },
  })
  assert.deepEqual(payload, { to: "ali@example.com", subject: "Q3 report", text: "here are the numbers" })

  const capped = mapIntentParametersToConnectorPayload({
    action: "messages.send",
    parameters: { to: "a@b.co", subject: "x".repeat(400), text: "y".repeat(20_000) },
  })
  assert.equal(capped.payload.subject.length, 256)
  assert.equal(capped.payload.text.length, 10_000)
})

test("messages.send: missing recipient or body throws IntentMappingError", () => {
  assert.throws(
    () => mapIntentParametersToConnectorPayload({ action: "messages.send", parameters: { text: "hi" } }),
    (error: unknown) => error instanceof IntentMappingError
  )
  assert.throws(
    () => mapIntentParametersToConnectorPayload({ action: "messages.send", parameters: { to: "a@b.co" } }),
    (error: unknown) => error instanceof IntentMappingError
  )
  assert.throws(
    () => mapIntentParametersToConnectorPayload({ action: "messages.send", parameters: { to: "not-an-email", text: "hi" } }),
    (error: unknown) => error instanceof IntentMappingError
  )
})

test("messages.reply: requires recipient and body, drops unknown keys", () => {
  const { payload, droppedKeys } = mapIntentParametersToConnectorPayload({
    action: "messages.reply",
    parameters: { to: "a@b.co", text: "reply text", sneaky: "value" },
  })
  assert.deepEqual(payload, { to: "a@b.co", text: "reply text" })
  assert.deepEqual(droppedKeys, ["sneaky"])
})

test("messages.read: forwards no fields; unknown capability is rejected", () => {
  const read = mapIntentParametersToConnectorPayload({
    action: "messages.read",
    parameters: { folder: "inbox" },
  })
  assert.deepEqual(read.payload, {})

  assert.throws(
    () => mapIntentParametersToConnectorPayload({ action: "files.upload", parameters: {} }),
    (error: unknown) => error instanceof IntentMappingError
  )
})

test("non-string scalar values coerce for free-form fields; recipient stays strictly validated", () => {
  // Recipient is an email contract: numeric junk must be rejected, not coerced.
  assert.throws(
    () =>
      mapIntentParametersToConnectorPayload({
        action: "messages.send",
        parameters: { to: 123, text: "hi" },
      }),
    (error: unknown) => error instanceof IntentMappingError
  )

  // Free-form fields coerce scalars.
  assert.throws(
    () =>
      mapIntentParametersToConnectorPayload({
        action: "messages.send",
        parameters: { to: { email: "a@b.co" }, text: "hi" },
      }),
    (error: unknown) => error instanceof IntentMappingError
  )

  const { payload, droppedKeys } = mapIntentParametersToConnectorPayload({
    action: "messages.send",
    parameters: { to: "a@b.co", text: "hi", internal_field: "x" },
  })
  assert.deepEqual(payload, { to: "a@b.co", subject: "Message from Arbyter", text: "hi" })
  assert.deepEqual(droppedKeys, ["internal_field"])
})
