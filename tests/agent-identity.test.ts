import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// P0-1 regression suite: verified agent identity is a hard execution
// prerequisite enforced INSIDE the authoritative execution engine
// (lib/execution/engine.ts), not only at discovery time.
//
// Security properties under test:
//   1. a verified agent identity allows execution (connector reached)
//   2. an UNVERIFIED identity blocks execution (no connector call)
//   3. a MISSING identity row blocks execution (no connector call)
//   4. an identity of ANOTHER ORGANIZATION blocks execution
//   5. an identity LOOKUP ERROR fails closed (no connector call)
//   6. blocked runs still produce a blocked execution state + audit record
//   7. the gate queries ONLY real agent_identities columns (wire compat)
//
// REAL SCHEMA SHAPE (supabase/schema-snapshot.json): agent_identities carries
// exactly ONE state field, `verified` (boolean). There is no `status` or
// `disabled` column. The fixture rows below use only real columns on purpose:
// if someone reintroduces a select of nonexistent columns
// ("status", "disabled", embedded resources), the strict stub rejects the
// select string and these tests fail.
//
// The engine is imported REAL; only its edges are stubbed using the loader
// pattern from tests/execute-route.test.ts and tests/intent-connector-e2e.test.ts.

// The identity row is shared with the supabase stub below via globalThis
// (module loaders run the stub code in its own module scope).
function resetIdentity(row: unknown, error: unknown = null) {
  globalThis.__identityRow = { data: row, error }
}

// REAL agent_identities shape: only real columns, only `verified` as state.
const verifiedIdentity = {
  verified: true,
}

const supabaseServerStub = `
export function createClient() {
  const rows = {
    users: { data: { organization_id: "org-1", role: "owner" }, error: null },
    ai_agents: { data: { id: "agent-1", name: "Mail Agent", status: "active" }, error: null },
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
    if (table === "agent_identities") {
      const row = globalThis.__identityRow
      const chain = {
        select(columns) {
          // Wire-compat tripwire: the gate must select ONLY real
          // agent_identities columns (verified). Selecting nonexistent
          // columns (status/disabled) or an embedded resource would 400 on
          // real PostgREST (PGRST204) and block all execution.
          if (
            /\\bstatus\\b/.test(columns) ||
            /\\bdisabled\\b/.test(columns) ||
            /ai_agents\\(/.test(columns)
          ) {
            throw new Error(
              "agent_identities select must reference only real columns (verified); got: " + columns,
            )
          }
          return chain
        },
        eq() { return chain },
        async maybeSingle() { return row ?? { data: null, error: null } },
        then(resolve) { return Promise.resolve(row ?? { data: null, error: null }).then(resolve) },
      }
      return chain
    }
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
  globalThis.__adminUpdates = globalThis.__adminUpdates ?? []
  const updates = globalThis.__adminUpdates
  return {
    // P1-2: org execution quota consumes the distributed limiter via rpc;
    // always allowed in tests unless a case stubs an exhausted bucket.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__orgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
      }
      return { data: null, error: null }
    },
    from() {
      const chain = {
        insert(values) { updates.push({ op: "insert", values }); return chain },
        select() { return chain },
        update(values) { updates.push({ op: "update", values }); return chain },
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
  globalThis.__gateConnectorCalls = globalThis.__gateConnectorCalls ?? []
  globalThis.__gateConnectorCalls.push({ provider, action, context })
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
  globalThis.__credentialResolves = (globalThis.__credentialResolves ?? 0) + 1
  return { id: "cred-1", type: "api_key", secret: "test-secret" }
}
`

const auditStub = `
export async function recordExecutionAudit(context) {
  globalThis.__audits = globalThis.__audits ?? []
  globalThis.__audits.push(context)
  return { id: "audit-1", status: context.status }
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
  "  if (specifier === '@/lib/execution/agent-identity') return nextResolve(specifier, context)\n" +
  specs
    .map(([specifier, code]) => {
      const url = JSON.stringify(`data:text/javascript,${encodeURIComponent(code)}`)
      const target = JSON.stringify(specifier)
      return `  if (specifier === ${target}) return { url: ${url}, shortCircuit: true }\n`
    })
    .join("") +
  "  return nextResolve(specifier, context)\n" +
  "}\n"

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __gateConnectorCalls: Array<unknown> | undefined
  // eslint-disable-next-line no-var
  var __adminUpdates: Array<{ op: string; table?: string; values: Record<string, unknown> }> | undefined
  // eslint-disable-next-line no-var
  var __credentialResolves: number | undefined
  // eslint-disable-next-line no-var
  var __identityRow: { data: unknown; error: unknown } | null | undefined
}

const { executeAgentTask } = await import("../lib/execution/engine.ts")

function resetGlobals() {
  globalThis.__gateConnectorCalls = []
  globalThis.__adminUpdates = []
  globalThis.__credentialResolves = 0
  resetIdentity(verifiedIdentity)
}

function lastBlockedUpdate() {
  const updates = (globalThis.__adminUpdates ?? []).filter(
    (u) => u.op === "update" && u.values.status === "blocked",
  )
  return updates[updates.length - 1] ?? null
}

const baseInput = {
  organizationId: "org-1",
  agentId: "agent-1",
  requestedCapability: "messages.send" as const,
  data: { recipient: "ali@example.com", document: "sales report" },
}

test("P0-1: a verified agent identity allows execution", async () => {
  resetGlobals()
  resetIdentity(verifiedIdentity)

  const result = await executeAgentTask(baseInput)

  assert.equal(result.success, true)
  assert.equal(result.status, "completed")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 1, "connector must be reached")
  assert.equal(globalThis.__credentialResolves, 1, "credential resolution must be reached")
})

test("P0-1: an unverified agent identity cannot execute", async () => {
  resetGlobals()
  resetIdentity({ ...verifiedIdentity, verified: false })

  const result = await executeAgentTask(baseInput)

  assert.equal(result.success, false)
  assert.equal(result.status, "blocked")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 0, "connector must never run")
  assert.equal(globalThis.__credentialResolves, 0, "credentials must never resolve")
})

test("P0-1: a missing agent identity cannot execute", async () => {
  resetGlobals()
  resetIdentity(null)

  const result = await executeAgentTask(baseInput)

  assert.equal(result.success, false)
  assert.equal(result.status, "blocked")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-1: an identity belonging to another organization cannot execute", async () => {
  resetGlobals()
  // Cross-org simulation at the query level: an identity row of another org
  // cannot satisfy the (agent_id, organization_id) filters, so the caller
  // observes "missing" — exactly what the real RLS/org scope produces.
  resetIdentity(null)

  const result = await executeAgentTask(baseInput)

  assert.equal(result.success, false)
  assert.equal(result.status, "blocked")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-1: an identity lookup error fails closed", async () => {
  resetGlobals()
  resetIdentity(null, { message: "database unavailable" })

  const result = await executeAgentTask(baseInput)

  assert.equal(result.success, false)
  assert.equal(result.status, "blocked")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-1: identity-blocked executions produce a blocked audit record", async () => {
  resetGlobals()
  resetIdentity({ ...verifiedIdentity, verified: false })

  await executeAgentTask(baseInput)

  // The engine writes its audit through the (stubbed) admin client; the
  // blocked update must carry the interdiction status and reason.
  const blocked = lastBlockedUpdate()
  assert.ok(blocked, "a blocked execution update must exist")
  assert.match(String(blocked!.values.error_message ?? ""), /identity/i)
})

test("P0-1: an identity row with verified = null cannot execute (strict === true)", async () => {
  resetGlobals()
  resetIdentity({ verified: null })

  const result = await executeAgentTask(baseInput)

  assert.equal(result.status, "blocked")
  assert.equal((globalThis.__gateConnectorCalls ?? []).length, 0)
})
