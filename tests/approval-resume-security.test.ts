import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// P0-2 (plus resume-side P0-1/P0-4) regression suite for
// app/api/approvals/[approvalId]/resume/route.ts.
//
// Security properties under test:
//   1. an approved execution with a verified, active agent resumes normally
//   2. approved THEN PAUSED agent cannot resume (fail closed, no connector call)
//   3. approved THEN DISABLED agent cannot resume (fail closed)
//   4. approved THEN connection disabled cannot resume (fail closed)
//   5. unverified agent identity cannot resume (fail closed, execution blocked)
//   6. insufficient AAL (MFA) cannot resume at the route boundary
//   7. pending / rejected approvals can never resume
//
// The route is imported REAL; its edges (supabase, connector runtime,
// credentials, audit, registry) are stubbed with the loader pattern from
// tests/execute-route.test.ts. The identity gate, privileged-auth and the
// approval-integrity hash are exercised for real.

// Table-keyed stub state (table name -> row or null).
type ResumeState = Record<string, unknown>

function setState(overrides: Partial<ResumeState> = {}) {
  globalThis.__resumeState = {
    // Keyed by TABLE NAME so the stub's from(table) lookup works.
    users: { id: "resumer-1", organization_id: "org-1", role: "owner" },
    // REAL agent_identities shape: `verified` is the only state column.
    agent_identities: { verified: true },
    // REAL ai_agents shape: no `disabled` column; status carries liveness.
    ai_agents: { id: "agent-1", status: "active" },
    agent_connections: {
      id: "conn-1",
      provider: "agentmail",
      status: "connected",
      health_status: "healthy",
      capabilities: { "messages.send": true },
      agent_id: "agent-1",
    },
    // F2: the server-generated provenance root. governance_decisions has NO
    // client INSERT/UPDATE policies (service-role-only writes), so a row with
    // decision = 'approval_required' for this execution is exactly the
    // evidence resume requires. The default happy-path fixture carries one;
    // forgery tests remove or corrupt it.
    governance_decisions: {
      id: "decision-1",
      agent_id: "agent-1",
      execution_id: "exec-1",
      decision: "approval_required",
      metadata: {},
    },
    approval_requests: {
      id: "11111111-1111-4111-8111-111111111111",
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "approved",
      risk_level: "high",
      title: "Approved send",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "approved",
      input_data: { task: null, data: { to: "a@example.com", text: "hello" } },
      risk_level: "high",
    },
    ...overrides,
  }
}

const nextServerStub = `
export class NextRequest extends Request {}
export class NextResponse extends Response {
  static json(body, init) {
    const headers = new Headers(init?.headers)
    headers.set("content-type", "application/json")
    return new Response(JSON.stringify(body), { ...init, headers })
  }
}
`

const supabaseServerStub = `
export function createClient() {
  const state = globalThis.__resumeState
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "resumer-1" } }, error: null }),
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: globalThis.__aalLevel ?? "aal2" }, error: null }
        },
      },
    },
    from(table) {
      const row = state[table]
      const chain = {
        select() { return chain },
        eq() { return chain },
        order() { return chain },
        limit() { return chain },
        update() { return chain },
        insert(values) {
          globalThis.__adminInserts = globalThis.__adminInserts ?? []
          globalThis.__adminInserts.push({ table, values })
          return chain
        },
        single() { return Promise.resolve({ data: { id: "approval-1" }, error: null }) },
        async maybeSingle() { return row ? { data: row, error: null } : { data: null, error: null } },
        then(resolve) { return Promise.resolve(row ? { data: row, error: null } : { data: null, error: null }).then(resolve) },
      }
      return chain
    },
  }
}
`

const supabaseAdminStub = `
export function createAdminClient() {
  globalThis.__adminUpdates = globalThis.__adminUpdates ?? []
  const updates = globalThis.__adminUpdates
  return {
    // P1-2: org execution quota consumes the distributed limiter via rpc;
    // allowed unless a case stubs an exhausted bucket via __orgQuotaAllowed.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__orgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
      }
      return { data: null, error: null }
    },
    from(table) {
      const chain = {
        insert(values) { updates.push({ op: "insert", table, values }); return chain },
        select() { return chain },
        update(values) { updates.push({ op: "update", table, values }); return chain },
        eq() { return chain },
        single() { return Promise.resolve({ data: { id: "row-1" }, error: null }) },
        async maybeSingle() { return { data: { id: "claimed" }, error: null } },
        then(resolve) { updates.push({ op: "awaited" }); return Promise.resolve({ data: null, error: null }).then(resolve) },
      }
      return chain
    },
  }
}
`

const connectorRuntimeStub = `
export async function executeConnectorAction(provider, action, context) {
  globalThis.__resumeConnectorCalls = globalThis.__resumeConnectorCalls ?? []
  globalThis.__resumeConnectorCalls.push({ provider, action, context })
  return { success: true, data: { sent: true } }
}
`

const connectorRegistryStub = `
export function getConnector(provider) {
  if (provider === "agentmail") {
    return { provider, capabilities: ["messages.send", "messages.reply"], execute: async () => ({ success: true }) }
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

const specs: Array<[string, string]> = [
  ["next/server", nextServerStub],
  ["@/lib/supabase/server", supabaseServerStub],
  ["@/lib/supabase/admin", supabaseAdminStub],
  ["@/lib/connectors/runtime", connectorRuntimeStub],
  ["@/lib/connectors/registry", connectorRegistryStub],
  ["@/lib/credentials/runtime", credentialsStub],
  ["@/lib/execution/audit", auditStub],
]

const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
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
  var __resumeState: Record<string, unknown> | undefined
  // eslint-disable-next-line no-var
  var __approvalMetadata: Record<string, unknown> | undefined
  // eslint-disable-next-line no-var
  var __aalLevel: string | undefined
  // eslint-disable-next-line no-var
  var __resumeConnectorCalls: Array<unknown> | undefined
  // eslint-disable-next-line no-var
  var __adminUpdates: Array<{ op: string; table?: string; values: Record<string, unknown> }> | undefined
  // eslint-disable-next-line no-var
  var __adminInserts: Array<{ table: string; values: Record<string, unknown> }> | undefined
  // eslint-disable-next-line no-var
  var __audits: Array<{ status: string }> | undefined
  // eslint-disable-next-line no-var
  var __credentialResolves: number | undefined
}

// Real integrity module: the approval metadata must carry the hash the route
// recomputes, so build it from the same envelope values the stub returns.
const { hashApprovalIntegrityEnvelope, APPROVAL_INTEGRITY_HASH_METADATA_KEY } =
  await import("../lib/security/approval-integrity.ts")

const executionInputData = { task: null, data: { to: "a@example.com", text: "hello" } }
globalThis.__approvalMetadata = {
  action: "messages.send",
  capability: "messages.send",
  [APPROVAL_INTEGRITY_HASH_METADATA_KEY]: hashApprovalIntegrityEnvelope({
    execution_id: "exec-1",
    agent_id: "agent-1",
    connection_id: "conn-1",
    provider: "agentmail",
    action: "messages.send",
    capability: "messages.send",
    input_data: executionInputData,
    task_id: null,
  }),
}

const { POST } = await import("../app/api/approvals/[approvalId]/resume/route.ts")
const { POST: RESOLVE_POST } = await import("../app/api/approvals/[approvalId]/resolve/route.ts")
const { createExecutionApproval } = await import("../lib/execution/approval.ts")

function resetGlobals() {
  globalThis.__resumeConnectorCalls = []
  globalThis.__adminUpdates = []
  globalThis.__audits = []
  globalThis.__credentialResolves = 0
  globalThis.__aalLevel = "aal2"
  setState()
}

const APPROVAL_ID = "11111111-1111-4111-8111-111111111111"

async function callResume() {
  const request = new Request("http://localhost/api/approvals/x/resume", { method: "POST" })
  const context = { params: Promise.resolve({ approvalId: APPROVAL_ID }) }
  const response = await POST(request, context)
  const body = (await response.json()) as Record<string, unknown>
  return { status: response.status, body }
}

async function callResolve(decision: "approved" | "rejected") {
  const request = new Request("http://localhost/api/approvals/x/resolve", {
    method: "POST",
    body: JSON.stringify({ decision }),
  })
  const context = { params: Promise.resolve({ approvalId: APPROVAL_ID }) }
  const response = await RESOLVE_POST(request, context)
  const body = (await response.json()) as Record<string, unknown>
  return { status: response.status, body }
}

test("P0-2: an approved execution with a verified, active agent resumes and executes", async () => {
  resetGlobals()
  const { status, body } = await callResume()
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 1, "connector must run exactly once")
  assert.equal(globalThis.__credentialResolves, 1)
})

test("P0-2: approved then PAUSED agent cannot resume", async () => {
  resetGlobals()
  setState({ ai_agents: { id: "agent-1", status: "paused" } })

  const { status, body } = await callResume()

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /not active/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0, "connector must never run")
  assert.equal(globalThis.__credentialResolves, 0, "credentials must never resolve")
  // fail closed: the execution row is blocked, not left running
  const blocked = (globalThis.__adminUpdates ?? []).find(
    (u) => u.op === "update" && u.values.status === "blocked",
  )
  assert.ok(blocked, "execution must be blocked")
})

test("P0-2: approved then DISABLED agent cannot resume", async () => {
  resetGlobals()
  // "Disabled" agents are modeled through ai_agents.status (there is no
  // disabled column): any non-active status must fail closed.
  setState({ ai_agents: { id: "agent-1", status: "disabled" } })

  const { status } = await callResume()

  assert.equal(status, 409)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
  const blocked = (globalThis.__adminUpdates ?? []).find(
    (u) => u.op === "update" && u.values.status === "blocked",
  )
  assert.ok(blocked, "execution must be blocked")
})

test("P0-2: approved then connection disabled cannot resume", async () => {
  resetGlobals()
  setState({
    agent_connections: {
      id: "conn-1",
      provider: "agentmail",
      status: "error",
      health_status: "healthy",
      capabilities: { "messages.send": true },
      agent_id: "agent-1",
    },
  })

  const { status, body } = await callResume()

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /no longer available/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-1 (resume): an unverified agent identity cannot resume", async () => {
  resetGlobals()
  setState({
    agent_identities: { verified: false },
  })

  const { status, body } = await callResume()

  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /identity/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
  const blocked = (globalThis.__adminUpdates ?? []).find(
    (u) => u.op === "update" && u.values.status === "blocked",
  )
  assert.ok(blocked, "execution must be blocked")
})

test("P0-1 (resume): a missing agent identity cannot resume", async () => {
  resetGlobals()
  setState({ agent_identities: null })

  const { status } = await callResume()

  assert.equal(status, 403)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
})

test("P0-4 (resume): insufficient AAL cannot resume at the route boundary", async () => {
  resetGlobals()
  globalThis.__aalLevel = "aal1"

  const { status, body } = await callResume()

  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /multi-factor/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-3 (pre-existing): a pending approval cannot resume", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "pending",
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
    },
  })

  const { status } = await callResume()
  assert.equal(status, 409)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
})

test("P0-3 (pre-existing): a rejected approval cannot resume", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "rejected",
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  })

  const { status } = await callResume()
  assert.equal(status, 409)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
})

/* ------------------------- P0-3: approval expiration ------------------------- */

test("P0-3: an approval before expiry can still resume", async () => {
  resetGlobals()
  // default fixture: expires_at = now + 1h
  const { status, body } = await callResume()
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 1)
})

test("P0-3: an approval after expiry cannot resume", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "approved",
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: new Date(Date.now() - 1000).toISOString(), // expired 1s ago
    },
  })

  const { status, body } = await callResume()

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /expired/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0, "connector must never run")
  assert.equal(globalThis.__credentialResolves, 0, "credentials must never resolve")
  // the boundary transitions the approval to the terminal 'expired' status
  const expired = (globalThis.__adminUpdates ?? []).find(
    (u) => u.op === "update" && u.values?.status === "expired",
  )
  assert.ok(expired, "approval must be transitioned to 'expired'")
})

test("P0-3: an expired approval replay cannot resume", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "expired", // already transitioned by a previous boundary hit
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    },
  })

  const { status, body } = await callResume()

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /approved request can be resumed/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
  assert.equal(globalThis.__credentialResolves, 0)
})

test("P0-3: an approval missing expires_at is refused (fail closed)", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "approved",
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: null, // legacy/missing expiry: must NOT be an infinite window
    },
  })

  const { status, body } = await callResume()

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /expired|expiry/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
})

test("P0-3: an expired pending approval cannot be approved at the resolve boundary", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      requested_by: "requester-1",
      status: "pending",
      risk_level: "high",
      title: "t",
      description: null,
      metadata: globalThis.__approvalMetadata,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    },
  })

  const { status, body } = await callResolve("approved")

  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /expired/i)
  assert.equal((globalThis.__resumeConnectorCalls ?? []).length, 0)
})

test("P0-3: createExecutionApproval stamps a future absolute expires_at", async () => {
  // Focused creation-side test: the approval writer must set expires_at at
  // insert time (TTL -> deny lifecycle anchor). The REAL approval module runs
  // against the suite's stubbed admin/server clients; capture the insert via
  // the admin stub's update/insert journal.
  globalThis.__adminInserts = []

  const before = Date.now()
  await createExecutionApproval({
    organizationId: "org-1",
    agentId: "agent-1",
    executionId: "exec-1",
    taskId: undefined,
    riskLevel: "high",
    title: "t",
    metadata: { provider: "agentmail", action: "messages.send", capability: "messages.send" },
  })
  const after = Date.now()

  const inserts = (globalThis.__adminUpdates ?? []).filter(
    (r) => r.table === "approval_requests" && (r.values as Record<string, unknown>).status === "pending",
  )
  assert.ok(inserts.length >= 1, "a pending approval insert must have been captured")
  const inserted = inserts[inserts.length - 1]!.values as Record<string, unknown>
  const expiresAt = new Date(inserted.expires_at as string).getTime()
  assert.ok(Number.isFinite(expiresAt), "expires_at must be set")
  assert.ok(expiresAt > before, "expires_at must be in the future at creation")
  assert.ok(expiresAt <= after + 24 * 60 * 60 * 1000 + 1000, "expires_at must be the 24h TTL")
})
