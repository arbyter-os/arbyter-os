import { strict as assert } from "node:assert"
import { test } from "node:test"
import { initializeConnectors } from "../lib/connectors/index.ts"
import {
  filterDiscoveryCandidates,
  type AgentDiscoveryResult,
} from "../lib/discovery/index.ts"
import type { ConnectorCapability } from "../lib/connectors/types.ts"

type DiscoveryRow = Parameters<typeof filterDiscoveryCandidates>[0][number]

initializeConnectors()

function row(overrides: Partial<DiscoveryRow> = {}): DiscoveryRow {
  return {
    id: "connection-1",
    agent_id: "agent-1",
    provider: "agentmail",
    status: "connected",
    health_status: "healthy",
    capabilities: { "messages.send": true },
    ai_agents: {
      id: "agent-1",
      name: "Sales Agent",
      status: "active",
      organization_id: "org-1",
    },
    ...overrides,
  }
}

function discover(
  rows: DiscoveryRow[],
  requiredCapabilities: ConnectorCapability[] = ["messages.send"]
): AgentDiscoveryResult[] {
  return filterDiscoveryCandidates(rows, "org-1", requiredCapabilities)
}

test("discovers a connected healthy agent with messages.send", () => {
  const result = discover([row()])

  assert.deepEqual(result, [
    {
      agentId: "agent-1",
      agentName: "Sales Agent",
      connectionId: "connection-1",
      provider: "agentmail",
      capabilities: { "messages.send": true },
    },
  ])
})

test("excludes a connection without messages.send", () => {
  assert.deepEqual(
    discover([row({ capabilities: { "messages.read": true } })]),
    []
  )
})

test("excludes a disconnected connection", () => {
  assert.deepEqual(discover([row({ status: "disconnected" })]), [])
})

test("excludes an unhealthy connection", () => {
  assert.deepEqual(discover([row({ health_status: "unhealthy" })]), [])
})

test("excludes a paused agent", () => {
  assert.deepEqual(
    discover([
      row({
        ai_agents: {
          id: "agent-1",
          name: "Sales Agent",
          status: "paused",
          organization_id: "org-1",
        },
      }),
    ]),
    []
  )
})

test("requires all requested capabilities", () => {
  assert.deepEqual(
    discover([row({ capabilities: { "messages.send": true } })], [
      "messages.send",
      "messages.read",
    ]),
    []
  )

  assert.equal(
    discover(
      [
        row({
          capabilities: {
            "messages.send": true,
            "messages.read": true,
          },
        }),
      ],
      ["messages.send", "messages.read"]
    ).length,
    1
  )
})

test("excludes a connection whose agent belongs to another organization", () => {
  assert.deepEqual(
    discover([
      row({
        ai_agents: {
          id: "agent-1",
          name: "Other Org Agent",
          status: "active",
          organization_id: "org-2",
        },
      }),
    ]),
    []
  )
})

test("returns all matching agents", () => {
  const result = discover([
    row(),
    row({
      id: "connection-2",
      agent_id: "agent-2",
      ai_agents: {
        id: "agent-2",
        name: "Support Agent",
        status: "active",
        organization_id: "org-1",
      },
    }),
  ])

  assert.equal(result.length, 2)
  assert.deepEqual(
    result.map((candidate) => candidate.agentId),
    ["agent-1", "agent-2"]
  )
})

test("excludes an unregistered connector provider", () => {
  assert.deepEqual(
    discover([row({ provider: "unregistered-provider" })]),
    []
  )
})
