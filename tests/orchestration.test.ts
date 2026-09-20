import { strict as assert } from "node:assert"
import { test } from "node:test"
import {
  orchestrateUserRequestWithDependencies,
  type OrchestrationDependencies,
} from "../lib/orchestration/index.ts"
import type { Intent } from "../lib/intent/index.ts"
import type { AgentDiscoveryResult } from "../lib/discovery/index.ts"

const intent: Intent = {
  intent: "send_email",
  action: "send_email",
  parameters: {
    recipient: "test@example.com",
    message: "hello",
  },
  required_capabilities: ["messages.send"],
}

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

function dependencies(
  overrides: Partial<OrchestrationDependencies> = {}
): OrchestrationDependencies {
  return {
    getCurrentUser: async () => ({ id: "user-1" }),
    getOrganizationId: async () => "org-1",
    generateIntent: async () => intent,
    discoverAgents: async () => [],
    selectAgent: ({ candidates }) => candidates[0] ?? null,
    executeAgentTask: async () => ({
      success: true,
      executionId: "execution-1",
      status: "completed",
    }),
    ...overrides,
  }
}

test("no matching agents returns without executing", async () => {
  let executed = false

  const result = await orchestrateUserRequestWithDependencies(
    "Send an email to test@example.com saying hello.",
    dependencies({
      executeAgentTask: async () => {
        executed = true
        return { success: true }
      },
    })
  )

  assert.equal(result.status, "no_compatible_agent")
  assert.equal(result.selectedAgent, null)
  assert.equal(result.execution, null)
  assert.equal(executed, false)
})

test("matching candidate is passed to execution", async () => {
  const selected = candidate()
  let received: unknown

  const result = await orchestrateUserRequestWithDependencies(
    "Send an email to test@example.com saying hello.",
    dependencies({
      discoverAgents: async () => [selected],
      executeAgentTask: async (input) => {
        received = input
        return { success: true, executionId: "execution-1" }
      },
    })
  )

  assert.equal(result.selectedAgent, selected)
  assert.deepEqual(received, {
    organizationId: "org-1",
    agentId: "agent-1",
    agentConnectionId: "connection-1",
    data: intent.parameters,
  })
})

test("selected connectionId is passed through", async () => {
  const selected = candidate({ connectionId: "connection-42" })
  let connectionId: string | undefined

  await orchestrateUserRequestWithDependencies(
    "Send an email to test@example.com saying hello.",
    dependencies({
      discoverAgents: async () => [selected],
      executeAgentTask: async (input) => {
        connectionId = input.agentConnectionId
        return { success: true }
      },
    })
  )

  assert.equal(connectionId, "connection-42")
})

test("intent capabilities are preserved", async () => {
  let discoveredCapabilities: string[] = []
  let selectedCapabilities: string[] = []

  await orchestrateUserRequestWithDependencies(
    "Send an email to test@example.com saying hello.",
    dependencies({
      discoverAgents: async ({ requiredCapabilities }) => {
        discoveredCapabilities = [...requiredCapabilities]
        return [candidate()]
      },
      selectAgent: ({ requiredCapabilities, candidates }) => {
        selectedCapabilities = [...requiredCapabilities]
        return candidates[0] ?? null
      },
    })
  )

  assert.deepEqual(discoveredCapabilities, ["messages.send"])
  assert.deepEqual(selectedCapabilities, ["messages.send"])
})

test("execution result and executionId are returned", async () => {
  const execution = {
    success: true,
    executionId: "execution-99",
    status: "completed",
    result: { delivered: true },
  }

  const result = await orchestrateUserRequestWithDependencies(
    "Send an email to test@example.com saying hello.",
    dependencies({
      discoverAgents: async () => [candidate()],
      executeAgentTask: async () => execution,
    })
  )

  assert.deepEqual(result.execution, execution)
  assert.equal(result.executionId, "execution-99")
})

test("execution failure is surfaced", async () => {
  await assert.rejects(
    orchestrateUserRequestWithDependencies(
      "Send an email to test@example.com saying hello.",
      dependencies({
        discoverAgents: async () => [candidate()],
        executeAgentTask: async () => {
          throw new Error("connector failed")
        },
      })
    ),
    /connector failed/
  )
})
