import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// End-to-end contract test: Intent-shaped parameters must survive
// executeAgentTask and arrive at the connector in the connector's own payload
// contract. The centralized mapping (lib/connectors/intent-mapping.ts) is the
// REAL module under test; only engine edges (supabase, governance, connector
// runtime, audit) are stubbed, following the loader pattern from
// tests/execute-route.test.ts.

const supabaseServerStub = `
export function createClient() {
  const rows = {
    users: { data: { organization_id: "org-1", role: "owner" }, error: null },
    ai_agents: { data: { id: "agent-1", name: "Mail Agent", status: "active" }, error: null },
    // P0-1: the engine's identity gate reads agent_identities before every
    // connector call; the stub provides a verified identity using the REAL
    // schema shape ('verified' is the only state column).
    agent_identities: {
      data: { verified: true },
      error: null,
    },
    agent_connections: {
      data: [{
        id: "conn-1",
        provider: "agentmail",
        status: "connected",
        health_status: null,
        capabilities: { "messages.send": true },
        environment: null,
      }],
      error: null,
    },
  }
  function builder(table) {
    const state = { table, result: rows[table] ?? { data: null, error: null } }
    const chain = {
      select() { return chain },
      eq() { return chain },
      order() { return chain },
      limit() { return chain },
      update() { return chain },
      async maybeSingle() { return state.result },
      then(resolve) { return Promise.resolve(state.result).then(resolve) },
    }
    return chain
  }
  return {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from(table) { return builder(table) },
  }
}
`

const supabaseAdminStub = `
export function createAdminClient() {
  let inserted = null
  return {
    get __inserted() { return inserted },
    // P1-2: org execution quota consumes the distributed limiter via rpc.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__orgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
      }
      return { data: null, error: null }
    },
    from() {
      const chain = {
        insert(values) { inserted = values; return chain },
        select() { return chain },
        update() { return chain },
        eq() { return chain },
        single() { return Promise.resolve({ data: { id: "exec-1" }, error: null }) },
        async maybeSingle() { return { data: { id: "audit-1" }, error: null } },
      }
      return chain
    },
  }
}
`

const governanceStub = `
export async function evaluateGovernance() {
  return { decision: { decision: "ALLOW", reason: null }, risk: "low" }
}
`

const connectorRuntimeStub = `
export async function executeConnectorAction(provider, action, context) {
  globalThis.__connectorCalls = globalThis.__connectorCalls ?? []
  globalThis.__connectorCalls.push({ provider, action, context })
  return { success: true, data: { sent: true } }
}
`

const connectorRegistryStub = `
export function getConnector(provider) {
  if (provider === "agentmail") {
    return { provider, capabilities: ["messages.send"], execute: async () => ({ success: true }) }
  }
  return undefined
}
export function registerConnector() {}
export function getRegisteredConnectors() { return [] }
`

const credentialsStub = `
export async function resolveConnectionCredential() {
  return { id: "cred-1", type: "api_key", secret: "test-secret" }
}
`

const auditStub = `
export async function recordExecutionAudit() {
  return { id: "audit-1" }
}
`

const approvalStub = `
export async function createExecutionApproval() {
  return { id: "approval-1" }
}
`

const errorSanitizerStub = `
export function sanitizeExecutionError(error) {
  return { category: "test", message: "sanitized", diagnostics: String(error?.message ?? error) }
}
`

function stubUrl(code: string) {
  return `data:text/javascript,${encodeURIComponent(code)}`
}

const specs: Array<[string, string]> = [
  ["@/lib/supabase/server", supabaseServerStub],
  ["@/lib/supabase/admin", supabaseAdminStub],
  ["@/lib/governance", governanceStub],
  ["@/lib/connectors/runtime", connectorRuntimeStub],
  ["@/lib/connectors/registry", connectorRegistryStub],
  ["@/lib/credentials/runtime", credentialsStub],
  ["@/lib/execution/audit", auditStub],
  ["@/lib/execution/approval", approvalStub],
  ["@/lib/execution/error-sanitizer", errorSanitizerStub],
]

const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
  specs
    .map(([specifier, code]) => {
      const url = JSON.stringify(stubUrl(code))
      const target = JSON.stringify(specifier)
      return `  if (specifier === ${target}) return { url: ${url}, shortCircuit: true }\n`
    })
    .join("") +
  "  return nextResolve(specifier, context)\n" +
  "}\n"

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __connectorCalls:
    | {
        provider: string
        action: { action: string; payload: { data?: Record<string, unknown> } & Record<string, unknown> }
        context: { credential?: { secret: string } }
      }[]
    | undefined
}

function lastConnectorCall() {
  const calls = globalThis.__connectorCalls ?? []
  return calls[calls.length - 1] ?? null
}

const { executeAgentTask } = await import("../lib/execution/engine.ts")
const { IntentMappingError } = await import("../lib/connectors/intent-mapping.ts")

test("E2E: intent-shaped parameters reach the connector in its own contract", async () => {
  ;(globalThis).__connectorCalls = []

  const result = await executeAgentTask({
    organizationId: "org-1",
    agentId: "agent-1",
    requestedCapability: "messages.send",
    data: {
      recipient: "Ali <ali@example.com>",
      document: "sales report",
    },
  })

  assert.equal(result.success, true)
  assert.equal(result.status, "completed")

  const call = lastConnectorCall()
  assert.ok(call, "connector must be invoked")
  assert.equal(call.provider, "agentmail")
  // The contract fix: connector receives ITS field names, values derived from
  // the intent parameters (recipient normalized, document becomes subject/text).
  assert.deepEqual(call.action.payload.data, {
    to: "ali@example.com",
    subject: "sales report",
    text: "sales report",
  })
  assert.equal(call.context.credential?.secret, "test-secret")
})

test("E2E: execution row persists the ORIGINAL intent data, not the mapped payload", async () => {
  ;(globalThis).__connectorCalls = []

  await executeAgentTask({
    organizationId: "org-1",
    agentId: "agent-1",
    requestedCapability: "messages.send",
    data: { recipient: "ali@example.com", message: "quarterly numbers" },
  })

  const call = lastConnectorCall()
  assert.deepEqual(call.action.payload.data, {
    to: "ali@example.com",
    subject: "Message from Arbyter",
    text: "quarterly numbers",
  })
})

test("E2E: contract violation throws before any execution row or connector call", async () => {  ;(globalThis).__connectorCalls = []

  await assert.rejects(
    executeAgentTask({
      organizationId: "org-1",
      agentId: "agent-1",
      requestedCapability: "messages.send",
      data: { recipient: "not-an-email" },
    }),
    (error: unknown) => error instanceof IntentMappingError
  )

  assert.equal(lastConnectorCall(), null, "connector must not run on contract violation")
})

test("E2E: unknown keys in intent parameters never reach the connector", async () => {
  ;(globalThis).__connectorCalls = []

  await executeAgentTask({
    organizationId: "org-1",
    agentId: "agent-1",
    requestedCapability: "messages.send",
    data: {
      to: "ali@example.com",
      subject: "Hi",
      text: "Hello from Arbyter",
      organization_id: "org-2",
      role: "owner",
      execution_id: "exec-999",
    },
  })

  const payload = lastConnectorCall().action.payload.data
  assert.deepEqual(payload, { to: "ali@example.com", subject: "Hi", text: "Hello from Arbyter" })
})
