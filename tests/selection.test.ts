import { strict as assert } from "node:assert"
import { test } from "node:test"
import { selectAgent, type AgentSelectionInput } from "../lib/selection/index.ts"
import type { AgentDiscoveryResult } from "../lib/discovery/index.ts"
import type { ConnectorCapability } from "../lib/connectors/types.ts"

function candidate(overrides: Partial<AgentDiscoveryResult> = {}): AgentDiscoveryResult {
  return {
    agentId: "agent-1",
    agentName: "Sales Agent",
    connectionId: "connection-1",
    provider: "agentmail",
    capabilities: { "messages.send": true },
    ...overrides,
  }
}

test("returns null when there are no candidates", () => {
  const input: AgentSelectionInput = {
    candidates: [],
    requiredCapabilities: ["messages.send"],
  }

  assert.equal(selectAgent(input), null)
})

test("selects the first candidate", () => {
  const first = candidate()
  const second = candidate({ agentId: "agent-2" })

  assert.equal(
    selectAgent({
      candidates: [first, second],
      requiredCapabilities: ["messages.send"],
    }),
    first
  )
})

test("preserves the complete selected candidate object", () => {
  const selected = candidate({
    capabilities: { "messages.send": true, "messages.read": true },
  })

  assert.deepEqual(
    selectAgent({
      candidates: [selected],
      requiredCapabilities: ["messages.send", "messages.read"],
    }),
    selected
  )
})

test("does not mutate the candidates array", () => {
  const candidates = [candidate(), candidate({ agentId: "agent-2" })]
  const before = [...candidates]

  selectAgent({ candidates, requiredCapabilities: ["messages.send"] })

  assert.deepEqual(candidates, before)
})

test("accepts multiple required capabilities without re-validating them", () => {
  const selected = candidate({ capabilities: { "messages.send": true } })
  const requiredCapabilities: ConnectorCapability[] = [
    "messages.send",
    "messages.read",
  ]

  assert.equal(
    selectAgent({ candidates: [selected], requiredCapabilities }),
    selected
  )
})
