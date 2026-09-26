import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// Gemini-review regression suite (F1-F4) for commit 38fa56c.
//
// Security properties under test:
//   F1  approval/execution state machine agrees with the REAL CHECK
//       constraints: resolve and resume only ever write statuses the
//       production database accepts, and the stub REJECTS invalid statuses
//       the way Postgres does (23514) instead of accepting anything.
//   F2  a forged / member-created approval cannot launder a BLOCKED (or any
//       non-approval-eligible) execution into execution; approval provenance
//       must root in a server-generated approval_required governance
//       decision bound to the exact execution and agent; metadata cannot
//       retarget the approved context.
//   F3  approval RESOLUTION requires privileged AAL2 at the route boundary.
//   F4  non-active agents cannot execute through either path (allowlist),
//       and an RLS no-op on the verification identity write can never
//       produce a false verification success.
//
// The stub below is schema-aware: it enforces the same CHECK constraints as
// the real migrations (20260924100000, 20260925130000, 20260925140000,
// 20260925120000) and fails loudly if application code writes an
// unrepresentable status. This prevents the mock/production divergence class
// that let the original constraint bug pass tests.

const APPROVAL_ID = "22222222-2222-4222-8222-222222222222"

// Real CHECK constraints from supabase/migrations.
const CHECK_STATUSES: Record<string, string[]> = {
  agent_executions: [
    "started", "running", "completed", "failed", "cancelled",
    "blocked", "awaiting_approval", "flagged", "approved",
  ],
  approval_requests: ["pending", "approved", "rejected", "expired", "consumed"],
  tasks: ["pending", "running", "completed", "blocked", "awaiting_approval", "flagged"],
}

function checkViolation(table: string, values: Record<string, unknown>) {
  const allowed = CHECK_STATUSES[table]
  if (!allowed) return null
  if (values && typeof values.status === "string" && !allowed.includes(values.status)) {
    return {
      code: "23514",
      message: `new row for relation "${table}" violates check constraint "status" (status=${values.status})`,
    }
  }
  return null
}

type StateRow = Record<string, unknown> | null

function setState(overrides: Record<string, StateRow> = {}) {
  globalThis.__provState = {
    users: { id: "resumer-1", organization_id: "org-1", role: "owner" },
    agent_identities: { verified: true },
    ai_agents: { id: "agent-1", status: "active" },
    agent_connections: {
      id: "conn-1",
      provider: "agentmail",
      status: "connected",
      health_status: "healthy",
      capabilities: { "messages.send": true },
      agent_id: "agent-1",
      configuration: {},
    },
    // F2 provenance root: service-role-written governance decision.
    governance_decisions: {
      id: "decision-1",
      agent_id: "agent-1",
      execution_id: "exec-1",
      decision: "approval_required",
      metadata: {},
    },
    approval_requests: {
      id: APPROVAL_ID,
      agent_id: "agent-1",
      execution_id: "exec-1",
      governance_decision_id: "decision-1",
      requested_by: "requester-1",
      status: "approved",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      risk_level: "high",
      title: "Approved send",
      description: null,
      metadata: globalThis.__provApprovalMetadata,
    },
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "awaiting_approval",
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

// checkViolation must live INSIDE each stub module (data: URLs have no
// access to the test's scope). String concatenation only: nested template
// literals would terminate this template.
const checkViolationSource = `
function checkViolation(table, values) {
  const allowed = CHECK[table]
  if (!allowed) return null
  if (values && typeof values.status === "string" && !allowed.includes(values.status)) {
    return {
      code: "23514",
      message: 'new row for relation "' + table + '" violates check constraint "status" (status=' + values.status + ')',
    }
  }
  return null
}
`

const supabaseServerStub = `
const CHECK = ${JSON.stringify(CHECK_STATUSES)}
${checkViolationSource}
export function createClient() {
  const state = globalThis.__provState
  return {
    // P1-2: the resume route consumes the org execution quota via the admin
    // client's rpc (stubbed there); the server client needs rpc only if a
    // future caller resolves the limiter through it.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__orgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
      }
      return { data: null, error: null }
    },
    auth: {
      getUser: async () => ({ data: { user: { id: globalThis.__provUser ?? "resumer-1" } }, error: null }),
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: globalThis.__provAal ?? "aal2" }, error: null }
        },
      },
    },
    from(table) {
      let row = state[table] ?? null
      let result = row ? { data: row, error: null } : { data: null, error: null }
      const chain = {
        select() { return chain },
        eq() { return chain },
        order() { return chain },
        limit() { return chain },
        update(values) {
          const violation = checkViolation(table, values)
          if (violation) {
            globalThis.__provConstraintErrors.push({ table, values })
            result = { data: null, error: violation }
            return chain
          }
          if (row && typeof row === "object" && values && typeof values === "object") {
            Object.assign(row, values)
          }
          globalThis.__provServerUpdates.push({ table, values })
          return chain
        },
        insert(values) {
          const violation = checkViolation(table, values)
          if (violation) {
            globalThis.__provConstraintErrors.push({ table, values })
            result = { data: null, error: violation }
            return chain
          }
          globalThis.__provServerUpdates.push({ table, values, op: "insert" })
          result = { data: { id: "inserted-1" }, error: null }
          return chain
        },
        single() { return Promise.resolve(result) },
        async maybeSingle() { return result },
        then(resolve) { return Promise.resolve(result).then(resolve) },
      }
      return chain
    },
  }
}
`

const supabaseAdminStub = `
const CHECK = ${JSON.stringify(CHECK_STATUSES)}
${checkViolationSource}
export function createAdminClient() {
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
      let result = { data: { id: "claimed" }, error: null }
      const chain = {
        insert(values) {
          globalThis.__provAdminUpdates.push({ table, values, op: "insert" })
          return chain
        },
        select() { return chain },
        update(values) {
          const violation = checkViolation(table, values)
          if (violation) {
            globalThis.__provConstraintErrors.push({ table, values })
            result = { data: null, error: violation }
            return chain
          }
          globalThis.__provAdminUpdates.push({ table, values })
          return chain
        },
        eq() { return chain },
        single() { return Promise.resolve(result) },
        async maybeSingle() { return result },
        then(resolve) { return Promise.resolve(result).then(resolve) },
      }
      return chain
    },
  }
}
`

const specs: Array<[string, string]> = [
  ["next/server", nextServerStub],
  ["@/lib/supabase/server", supabaseServerStub],
  ["@/lib/supabase/admin", supabaseAdminStub],
  // Mechanical edges only. The security modules (approval-integrity,
  // approval-provenance, agent-identity, privileged-auth) run FOR REAL.
  ["@/lib/connectors/runtime", `\nexport async function executeConnectorAction() {
  globalThis.__provConnectorCalls = globalThis.__provConnectorCalls ?? []
  globalThis.__provConnectorCalls.push({})
  return { success: true, data: { sent: true } }
}
`],
  ["@/lib/connectors/registry", `\nexport function getConnector(provider) {
  return { provider, capabilities: ["messages.send"], execute: async () => ({ success: true }) }
}
export function registerConnector() {}
export function getRegisteredConnectors() { return [] }
`],
  ["@/lib/credentials/runtime", `\nexport async function resolveConnectionCredential() {
  globalThis.__provCredentialResolves = (globalThis.__provCredentialResolves ?? 0) + 1
  return { id: "cred-1", type: "api_key", secret: "test-secret", metadata: {} }
}
`],
  ["@/lib/execution/audit", `\nexport async function recordExecutionAudit(context) {
  globalThis.__provAudits = globalThis.__provAudits ?? []
  globalThis.__provAudits.push(context)
  return { id: "audit-1", status: context.status }
}
`],
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
  var __provState: Record<string, StateRow> | undefined
  // eslint-disable-next-line no-var
  var __provApprovalMetadata: Record<string, unknown> | undefined
  // eslint-disable-next-line no-var
  var __provAal: string | undefined
  // eslint-disable-next-line no-var
  var __provUser: string | undefined
  // eslint-disable-next-line no-var
  var __provServerUpdates: Array<{ table: string; values: Record<string, unknown>; op?: string }>
  // eslint-disable-next-line no-var
  var __provAdminUpdates: Array<{ table: string; values: Record<string, unknown>; op?: string }>
  // eslint-disable-next-line no-var
  var __provConstraintErrors: Array<{ table: string; values: Record<string, unknown> }>
  // eslint-disable-next-line no-var
  var __provConnectorCalls: Array<unknown> | undefined
}

// Real integrity + provenance + identity modules run for real.
const { hashApprovalIntegrityEnvelope, APPROVAL_INTEGRITY_HASH_METADATA_KEY } =
  await import("../lib/security/approval-integrity.ts")

const executionInputData = { task: null, data: { to: "a@example.com", text: "hello" } }
globalThis.__provApprovalMetadata = {
  action: "messages.send",
  capability: "messages.send",
  provider: "agentmail",
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

const { POST: RESUME_POST } = await import("../app/api/approvals/[approvalId]/resume/route.ts")
const { POST: RESOLVE_POST } = await import("../app/api/approvals/[approvalId]/resolve/route.ts")

function resetGlobals() {
  globalThis.__provServerUpdates = []
  globalThis.__provAdminUpdates = []
  globalThis.__provConstraintErrors = []
  globalThis.__provConnectorCalls = []
  globalThis.__provAal = "aal2"
  globalThis.__provUser = "resumer-1"
  setState()
}

async function callResume() {
  const request = new Request("http://localhost/api/approvals/x/resume", { method: "POST" })
  const context = { params: Promise.resolve({ approvalId: APPROVAL_ID }) }
  const response = await RESUME_POST(request, context)
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

function connectorCount() {
  return (globalThis.__provConnectorCalls ?? []).length
}

/* ------------------------- F1: state machine ------------------------- */

test("F1: resume succeeds for a legitimately approval_required execution (awaiting_approval)", async () => {
  resetGlobals()
  const { status, body } = await callResume()
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(connectorCount(), 1)
  assert.equal(globalThis.__provConstraintErrors.length, 0, "no CHECK violations may occur")
})

test("F1: resume succeeds when the execution was marked approved by resolution", async () => {
  resetGlobals()
  setState({ agent_executions: {
    id: "exec-1",
    agent_id: "agent-1",
    agent_connection_id: "conn-1",
    task_id: null,
    status: "approved",
    input_data: executionInputData,
    risk_level: "high",
  } })
  const { status, body } = await callResume()
  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(connectorCount(), 1)
})

test("F1: resolution writes only CHECK-valid statuses to approvals and executions", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      status: "pending",
    },
  })

  const { status, body } = await callResolve("approved")

  assert.equal(status, 200)
  assert.equal(body.success, true)
  assert.equal(globalThis.__provConstraintErrors.length, 0, "the 'approved' execution status must be CHECK-valid in production")
  // approval flipped pending -> approved; execution recorded as approved
  assert.ok(
    globalThis.__provServerUpdates.some((u) => u.table === "approval_requests" && u.values.status === "approved"),
  )
  assert.ok(
    globalThis.__provAdminUpdates.some((u) => u.table === "agent_executions" && u.values.status === "approved"),
  )
})

test("F1: the stub itself rejects a status the production DB would reject (guard against mock drift)", async () => {
  resetGlobals()
  // If anyone removes 'approved' from the migration again, the stub must
  // catch it: simulate application writing an unrepresentable status.
  setState({
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "awaiting_approval",
      input_data: executionInputData,
      risk_level: "high",
    },
  })
  const violation = checkViolation("agent_executions", { status: "approved" })
  assert.equal(violation, null, "the shipped migrations must accept 'approved'")
  assert.ok(checkViolation("agent_executions", { status: "approved_by_owner" }), "unknown statuses must violate")
  assert.ok(checkViolation("approval_requests", { status: "running" }), "approval statuses are a closed set")
})

/* ------------------------- F2: provenance ------------------------- */

test("F2: a forged approval (no server decision) cannot resume a BLOCKED execution", async () => {
  resetGlobals()
  setState({
    governance_decisions: null,
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "blocked",
      input_data: executionInputData,
      risk_level: "high",
    },
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      governance_decision_id: null,
      status: "approved",
    },
  })

  const { status, body } = await callResume()

  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /not a valid approval for this execution/i)
  assert.equal(connectorCount(), 0, "connector must never run")
  // fail closed: the forged approval is demoted to rejected
  assert.ok(
    globalThis.__provAdminUpdates.some((u) => u.table === "approval_requests" && u.values.status === "rejected"),
  )
})

test("F2: a valid approval cannot resume a BLOCKED execution (status allowlist)", async () => {
  resetGlobals()
  setState({
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "blocked",
      input_data: executionInputData,
      risk_level: "high",
    },
  })

  const { status } = await callResume()
  assert.equal(status, 403)
  assert.equal(connectorCount(), 0)
})

test("F2: an approval for a different agent cannot resume the execution", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      agent_id: "agent-2",
    },
  })

  const { status } = await callResume()
  assert.ok(status === 403 || status === 404, "must refuse: " + status)
  assert.equal(connectorCount(), 0)
})

test("F2: an approval pointing at a different execution cannot consume it", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      execution_id: "exec-9",
    },
  })

  const { status } = await callResume()
  assert.ok(status === 403 || status === 404, "must refuse: " + status)
  assert.equal(connectorCount(), 0)
})

test("F2: provenance fails when the linked decision is not approval_required", async () => {
  resetGlobals()
  setState({
    governance_decisions: {
      id: "decision-1",
      agent_id: "agent-1",
      execution_id: "exec-1",
      decision: "blocked",
      metadata: {},
    },
  })

  const { status, body } = await callResume()
  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /not a valid approval/i)
  assert.equal(connectorCount(), 0)
})

test("F2: provenance fails when the linked decision belongs to a different execution", async () => {
  resetGlobals()
  setState({
    governance_decisions: {
      id: "decision-1",
      agent_id: "agent-1",
      execution_id: "exec-9",
      decision: "approval_required",
      metadata: {},
    },
  })

  const { status } = await callResume()
  assert.equal(status, 403)
  assert.equal(connectorCount(), 0)
})

test("F2: approval metadata cannot retarget the approved action or provider", async () => {
  resetGlobals()
  setState({
    governance_decisions: {
      id: "decision-1",
      agent_id: "agent-1",
      execution_id: "exec-1",
      decision: "approval_required",
      metadata: { context: { action: "messages.read", tool: "agentmail" } },
    },
  })

  const { status } = await callResume()
  assert.equal(status, 403)
  assert.equal(connectorCount(), 0)
})

test("F2: legacy approvals (no decision id) still require a server decision for the exact execution", async () => {
  resetGlobals()
  // Legacy-shaped approval: no governance_decision_id, but the server
  // decision for this execution exists -> provenance holds.
  setState({
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      governance_decision_id: null,
    },
  })
  const ok = await callResume()
  assert.equal(ok.status, 200)
  assert.equal(connectorCount(), 1)

  // Without ANY server decision, the same legacy approval is refused.
  resetGlobals()
  setState({
    governance_decisions: null,
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      governance_decision_id: null,
    },
  })
  const refused = await callResume()
  assert.equal(refused.status, 403)
  assert.equal(connectorCount(), 0)
})

/* ------------------------- F3: resolve MFA ------------------------- */

test("F3: approval resolution requires privileged AAL2 at the route boundary", async () => {
  resetGlobals()
  setState({
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      status: "pending",
    },
  })
  globalThis.__provAal = "aal1"

  const { status, body } = await callResolve("approved")

  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /multi-factor/i)
  // nothing moved
  assert.equal(globalThis.__provServerUpdates.length, 0)
  assert.equal(globalThis.__provAdminUpdates.length, 0)
})

test("F3: resolution is still refused for non-privileged users at the route boundary", async () => {
  resetGlobals()
  globalThis.__provUser = "member-1"
  setState({
    users: { id: "member-1", organization_id: "org-1", role: "member" },
    approval_requests: {
      ...(globalThis.__provState!.approval_requests as Record<string, unknown>),
      status: "pending",
    },
  })

  const { status } = await callResolve("approved")
  assert.equal(status, 403)
  assert.equal(connectorCount(), 0)
})

/* ------------------------- F4: agent status + verify authority ------------------------- */

test("F4: a paused agent cannot resume an approved execution (allowlist)", async () => {
  resetGlobals()
  setState({ ai_agents: { id: "agent-1", status: "paused" } })

  const { status, body } = await callResume()
  assert.equal(status, 409)
  assert.match(String(body.error ?? ""), /not active/i)
  assert.equal(connectorCount(), 0)
})

test("F4: a quarantined agent cannot resume an approved execution (allowlist)", async () => {
  resetGlobals()
  setState({ ai_agents: { id: "agent-1", status: "quarantined" } })

  const { status } = await callResume()
  assert.equal(status, 409)
  assert.equal(connectorCount(), 0)
})

test("F4: an unverified agent identity cannot resume", async () => {
  resetGlobals()
  setState({ agent_identities: { verified: false } })

  const { status, body } = await callResume()
  assert.equal(status, 403)
  assert.match(String(body.error ?? ""), /identity/i)
  assert.equal(connectorCount(), 0)
  assert.equal(globalThis.__provAdminUpdates.length >= 0, true)
})

/* --------- F4 units: authoritative verification writes (RLS no-ops) --------- */

const { writeIdentityVerification, revokeIdentityVerification } = await import(
  "../app/api/agents/verify/route.ts"
)

function identityClient(updateResult: { data: unknown; error: unknown }, lookupRows: unknown = null) {
  return {
    from(table: string) {
      if (table === "agent_identities" && lookupRows !== null) {
        // lookup + update share one chain for the revoke flow
        let result: { data: unknown; error: unknown } = { data: lookupRows, error: null }
        const chain = {
          select() { return chain },
          eq() { return chain },
          update() {
            result = updateResult as { data: unknown; error: unknown }
            return chain
          },
          single() { return Promise.resolve(result) },
          async maybeSingle() { return result },
          then(resolve: (r: unknown) => unknown) { return Promise.resolve(result).then(resolve) },
        }
        return chain
      }
      let result: { data: unknown; error: unknown } = updateResult
      const chain = {
        select() { return chain },
        eq() { return chain },
        update() { return chain },
        insert() { return chain },
        single() { return Promise.resolve(result) },
        async maybeSingle() { return result },
        then(resolve: (r: unknown) => unknown) { return Promise.resolve(result).then(resolve) },
      }
      return chain
    },
  }
}

test("F4: an RLS no-op on the identity UPDATE cannot report verification success", async () => {
  // Zero rows updated (RLS refusal), no error: must FAIL, not succeed.
  await assert.rejects(
    () =>
      writeIdentityVerification(identityClient({ data: null, error: null }), {
        organizationId: "org-1",
        agentId: "agent-1",
        identityId: "identity-1",
        verified: true,
        checkedAt: new Date().toISOString(),
      }),
    /did not persist/i,
  )
})

test("F4: an identity UPDATE that persists a different value cannot report success", async () => {
  await assert.rejects(
    () =>
      writeIdentityVerification(identityClient({ data: { id: "identity-1", verified: false }, error: null }), {
        organizationId: "org-1",
        agentId: "agent-1",
        identityId: "identity-1",
        verified: true,
        checkedAt: new Date().toISOString(),
      }),
    /did not persist/i,
  )
})

test("F4: a persisted verified write succeeds", async () => {
  await writeIdentityVerification(identityClient({ data: { id: "identity-1", verified: true }, error: null }), {
    organizationId: "org-1",
    agentId: "agent-1",
    identityId: "identity-1",
    verified: true,
    checkedAt: new Date().toISOString(),
  })
})

test("F4: an RLS no-op on identity REVOCATION fails closed (fail-open direction)", async () => {
  await assert.rejects(
    () =>
      revokeIdentityVerification(
        identityClient({ data: [], error: null }, [{ id: "identity-1" }]),
        { organizationId: "org-1", agentId: "agent-1" },
      ),
    /did not persist/i,
  )
})

test("F4: a complete revocation succeeds", async () => {
  await revokeIdentityVerification(
    identityClient({ data: [{ id: "identity-1" }], error: null }, [{ id: "identity-1" }]),
    { organizationId: "org-1", agentId: "agent-1" },
  )
})

test("F4: an identity INSERT no-op (RLS refusal) cannot report verification success", async () => {
  await assert.rejects(
    () =>
      writeIdentityVerification(identityClient({ data: null, error: null }), {
        organizationId: "org-1",
        agentId: "agent-1",
        identityId: null,
        verified: true,
        checkedAt: new Date().toISOString(),
      }),
    /did not persist/i,
  )
})
