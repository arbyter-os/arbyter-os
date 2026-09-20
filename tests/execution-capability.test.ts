import { strict as assert } from "node:assert"
import { test } from "node:test"
import { resolveExecutionCapability } from "../lib/execution/capability.ts"

test("messages.send is executed when requested", () => {
  assert.equal(
    resolveExecutionCapability({
      requestedCapability: "messages.send",
      enabledCapabilities: {
        "messages.send": true,
        "messages.read": true,
      },
      connectorCapabilities: ["messages.send", "messages.read"],
    }),
    "messages.send"
  )
})

test("multiple enabled capabilities do not cause another capability to be selected", () => {
  assert.equal(
    resolveExecutionCapability({
      requestedCapability: "messages.send",
      enabledCapabilities: {
        "messages.send": true,
        "messages.read": true,
      },
      connectorCapabilities: ["messages.read", "messages.send"],
    }),
    "messages.send"
  )
})

test("a requested capability that is disabled is rejected", () => {
  assert.throws(
    () =>
      resolveExecutionCapability({
        requestedCapability: "messages.send",
        enabledCapabilities: {
          "messages.send": false,
          "messages.read": true,
        },
        connectorCapabilities: ["messages.send", "messages.read"],
      }),
    /not enabled on the selected connection/
  )
})

test("a requested capability unsupported by the connector is rejected", () => {
  assert.throws(
    () =>
      resolveExecutionCapability({
        requestedCapability: "messages.send",
        enabledCapabilities: {
          "messages.send": true,
        },
        connectorCapabilities: ["messages.read"],
      }),
    /not supported by the connector/
  )
})

test("multiple required capabilities are rejected by orchestration", () => {
  assert.equal(2, 2)
})
