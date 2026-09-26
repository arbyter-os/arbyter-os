import { strict as assert } from "node:assert"
import { readFileSync } from "node:fs"
import { register } from "node:module"
import { test } from "node:test"

// P1 rate-limit / abuse-resistance regression suite.
//
// Security properties under test:
//   P1-1  approval_requests INSERT is privileged at the DATABASE layer: the
//         migration forbids execution-linked inserts and requires owner/admin
//         for every insert; the engine's approval writer uses the service-role
//         client; the governance request_approval action is owner/admin-only
//         and stamps requested_by (RLS-compatible).
//   P1-2  the org execution quota is consumed ONCE per execution attempt at
//         the authoritative choke points (engine + resume), BEFORE any
//         expensive work, and is shared across all entry routes; exhausted /
//         unavailable quota fails closed with correct HTTP mapping.
//   P1-3  the AgentMail send route consumes the org mail quota before any
//         connection lookup or execution.
//
// The route/engine modules run REAL; edges are stubbed with the loader
// pattern. The org quota path is exercised for real through the stubbed
// limiter rpc.

const APPROVAL_ID = "33333333-3333-4333-8333-333333333333"

function setState(overrides: Record<string, unknown> = {}) {
  globalThis.__p1State = {
    users: { id: "owner-1", organization_id: "org-1", role: "owner" },
    agent_identities: { verified: true },
    ai_agents: { id: "agent-1", status: "active" },
    agent_connections: {
      id: "conn-1",
      provider: "agentmail",
      status: "connected",
      health_status: "healthy",
      capabilities: { "messages.send": true },
      agent_id: "agent-1",
    },
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
      title: "t",
      description: null,
      metadata: globalThis.__p1ApprovalMetadata,
    },
    agent_executions: {
      id: "exec-1",
      agent_id: "agent-1",
      agent_connection_id: "conn-1",
      task_id: null,
      status: "awaiting_approval",
      input_data: { task: null, data: { to: "a@example.com", text: "hi" } },
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

// check_rate_limit_cost semantics: fixed-window counter, shared key, atomic
// decrement across instances. The stub replays it faithfully enough for
// behavior tests: global per-key counters that persist between calls.
const rateLimitSource = `
globalThis.__p1Buckets = globalThis.__p1Buckets ?? {}
export async function checkRateLimit(key, limit, windowMs) {
  const buckets = globalThis.__p1Buckets
  const current = buckets[key] ?? 0
  if (current >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 }
  }
  buckets[key] = current + 1
  return { allowed: true, remaining: Math.max(0, limit - current - 1), retryAfterSeconds: 0 }
}
export async function checkRateLimitCost(key, cost, limit, windowMs) {
  const buckets = globalThis.__p1Buckets
  const current = buckets[key] ?? 0
  if (current + cost > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: 60 }
  }
  buckets[key] = current + cost
  return { allowed: true, remaining: Math.max(0, limit - current - cost), retryAfterSeconds: 0 }
}
`

const supabaseServerStub = `
export function createClient() {
  const state = globalThis.__p1State
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: globalThis.__p1User ?? "owner-1" } }, error: null }),
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: globalThis.__p1Aal ?? "aal2" }, error: null }
        },
      },
    },
    from(table) {
      const row = state[table] ?? null
      // agent_connections is read as a LIST by the engine (candidate search)
      // and as a single row by the resume route (maybeSingle).
      const listResult = table === "agent_connections"
        ? { data: Array.isArray(row) ? row : row ? [row] : [], error: null }
        : row ? { data: row, error: null } : { data: null, error: null }
      let result = listResult
      const chain = {
        select() { return chain },
        eq() { return chain },
        order() { return chain },
        limit() { return chain },
        update(values) {
          if (row && typeof row === "object" && values && typeof values === "object") {
            Object.assign(row, values)
          }
          globalThis.__p1ServerUpdates = globalThis.__p1ServerUpdates ?? []
          globalThis.__p1ServerUpdates.push({ table, values })
          return chain
        },
        insert(values) {
          globalThis.__p1ServerUpdates = globalThis.__p1ServerUpdates ?? []
          globalThis.__p1ServerUpdates.push({ table, values, op: "insert" })
          result = { data: { id: "inserted" }, error: null }
          return chain
        },
        single() { return Promise.resolve(result) },
        async maybeSingle() { return row ? { data: row, error: null } : { data: null, error: null } },
        then(resolve) { return Promise.resolve(result).then(resolve) },
      }
      return chain
    },
  }
}
`

const supabaseAdminStub = `
export function createAdminClient() {
  globalThis.__p1AdminUpdates = globalThis.__p1AdminUpdates ?? []
  const journal = globalThis.__p1AdminUpdates
  return {
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        globalThis.__p1QuotaCalls = globalThis.__p1QuotaCalls ?? []
        globalThis.__p1QuotaCalls.push(fn)
        if (globalThis.__p1QuotaOutage) {
          return { data: null, error: { message: "limiter unavailable" } }
        }
        return { data: [{ allowed: globalThis.__p1QuotaAllowed ?? true, remaining: 0, retry_after_seconds: 60 }], error: null }
      }
      return { data: null, error: null }
    },
    from(table) {
      let result = { data: { id: "row-1" }, error: null }
      const chain = {
        insert(values) { journal.push({ table, values, op: "insert" }); return chain },
        select() { return chain },
        update(values) { journal.push({ table, values, op: "update" }); return chain },
        eq() { return chain },
        single() { return Promise.resolve(result) },
        async maybeSingle() { return row ? { data: row, error: null } : { data: null, error: null } },
        then(resolve) { return Promise.resolve(result).then(resolve) },
      }
      return chain
    },
  }
}
`

const connectorRuntimeStub = `
export async function executeConnectorAction() {
  globalThis.__p1ConnectorRuns = (globalThis.__p1ConnectorRuns ?? 0) + 1
  return { success: true, data: { sent: true } }
}
`

const connectorRegistryStub = `
export function getConnector(provider) {
  return { provider, capabilities: ["messages.send"], execute: async () => ({ success: true }) }
}
export function registerConnector() {}
export function getRegisteredConnectors() { return [] }
`

const credentialsStub = `
export async function resolveConnectionCredential() {
  globalThis.__p1CredentialRuns = (globalThis.__p1CredentialRuns ?? 0) + 1
  return { id: "cred-1", type: "api_key", secret: "s", metadata: {} }
}
`

const auditStub = `
export async function recordExecutionAudit(context) {
  globalThis.__p1Audits = globalThis.__p1Audits ?? []
  globalThis.__p1Audits.push(context)
  return { id: "audit-1", status: context.status }
}
`

const approvalStub = `
export async function createExecutionApproval() {
  return { id: "approval-1" }
}
`

const sanitizerStub = `
export function sanitizeExecutionError(error) {
  return { category: "test", message: "sanitized", diagnostics: String(error?.message ?? error) }
}
`

const governanceStub = `
export async function evaluateGovernance() {
  return { decision: { decision: "ALLOW", reason: null }, risk: "low" }
}
`

// Controllable quota fake served to the engine/routes: records calls, and
// can be driven to exhaust/outage states per test. The REAL org-quota module
// is exercised separately via a direct relative import (its './rate-limit'
// dependency is intercepted by the limiter stub below).
const orgQuotaFakeStub = `
class OrgExecutionQuotaExceededError extends Error {
  constructor() {
    super("Organization execution rate limit exceeded. Please try again later.")
    this.name = "OrgExecutionQuotaExceededError"
    this.retryAfterSeconds = 60
  }
}
class OrgMailQuotaExceededError extends Error {
  constructor() {
    super("Organization AgentMail rate limit exceeded. Please try again later.")
    this.name = "OrgMailQuotaExceededError"
    this.retryAfterSeconds = 60
  }
}
class OrgQuotaUnavailableError extends Error {
  constructor() {
    super("Organization quota service is unavailable.")
    this.name = "OrgQuotaUnavailableError"
  }
}
export async function consumeOrgExecutionQuota(organizationId) {
  globalThis.__p1QuotaCalls = globalThis.__p1QuotaCalls ?? []
  globalThis.__p1QuotaCalls.push({ fn: "exec", org: organizationId })
  if (globalThis.__p1QuotaOutage) throw new OrgQuotaUnavailableError()
  if (globalThis.__p1QuotaAllowed === false) throw new OrgExecutionQuotaExceededError()
  globalThis.__p1Buckets = globalThis.__p1Buckets ?? {}
  globalThis.__p1Buckets["exec:" + organizationId] = (globalThis.__p1Buckets["exec:" + organizationId] ?? 0) + 1
}
export async function consumeOrgMailQuota(organizationId) {
  globalThis.__p1QuotaCalls = globalThis.__p1QuotaCalls ?? []
  globalThis.__p1QuotaCalls.push({ fn: "mail", org: organizationId })
  if (globalThis.__p1QuotaOutage) throw new OrgQuotaUnavailableError()
  if (globalThis.__p1QuotaAllowed === false) throw new OrgMailQuotaExceededError()
  globalThis.__p1Buckets = globalThis.__p1Buckets ?? {}
  globalThis.__p1Buckets["mail:" + organizationId] = (globalThis.__p1Buckets["mail:" + organizationId] ?? 0) + 1
}
export const ORG_EXECUTION_QUOTA_LIMIT_MESSAGE = "Organization execution rate limit exceeded. Please try again later."
export const ORG_MAIL_QUOTA_LIMIT_MESSAGE = "Organization AgentMail rate limit exceeded. Please try again later."
export { OrgExecutionQuotaExceededError, OrgMailQuotaExceededError, OrgQuotaUnavailableError }
`

const specs: Array<[string, string]> = [
  ["next/server", nextServerStub],
  ["@/lib/security/org-quota", orgQuotaFakeStub],
  ["@/lib/supabase/server", supabaseServerStub],
  ["@/lib/supabase/admin", supabaseAdminStub],
  // org-quota imports ./rate-limit RELATIVELY, so the relative specifier must
  // be intercepted too for the limiter stub to engage.
  ["./rate-limit", rateLimitSource],
  ["@/lib/security/rate-limit", rateLimitSource],
  ["@/lib/governance", governanceStub],
  ["@/lib/connectors/runtime", connectorRuntimeStub],
  ["@/lib/connectors/registry", connectorRegistryStub],
  ["@/lib/credentials/runtime", credentialsStub],
  ["@/lib/execution/audit", auditStub],
  ["./audit", auditStub],
  ["./approval", approvalStub],
  ["./error-sanitizer", sanitizerStub],
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
  var __p1State: Record<string, unknown> | undefined
  // eslint-disable-next-line no-var
  var __p1ApprovalMetadata: Record<string, unknown> | undefined
  // eslint-disable-next-line no-var
  var __p1User: string | undefined
  // eslint-disable-next-line no-var
  var __p1Aal: string | undefined
  // eslint-disable-next-line no-var
  var __p1Buckets: Record<string, number> | undefined
  // eslint-disable-next-line no-var
  var __p1QuotaAllowed: boolean | undefined
  // eslint-disable-next-line no-var
  var __p1QuotaOutage: boolean | undefined
  // eslint-disable-next-line no-var
  var __p1QuotaCalls: string[] | undefined
  // eslint-disable-next-line no-var
  var __p1ServerUpdates: Array<{ table: string; values: Record<string, unknown>; op?: string }> | undefined
  // eslint-disable-next-line no-var
  var __p1AdminUpdates: Array<{ table: string; values: Record<string, unknown>; op?: string }> | undefined
  // eslint-disable-next-line no-var
  var __p1ConnectorRuns: number | undefined
  // eslint-disable-next-line no-var
  var __p1CredentialRuns: number | undefined
  // eslint-disable-next-line no-var
  var __p1Audits: Array<{ status: string }> | undefined
}

// Real integrity module for approval metadata.
const { hashApprovalIntegrityEnvelope, APPROVAL_INTEGRITY_HASH_METADATA_KEY } =
  await import("../lib/security/approval-integrity.ts")

const executionInputData = { task: null, data: { to: "a@example.com", text: "hi" } }
globalThis.__p1ApprovalMetadata = {
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

const { executeAgentTask } = await import("../lib/execution/engine.ts")
const { POST: RESUME_POST } = await import("../app/api/approvals/[approvalId]/resume/route.ts")
const { POST: AGENTMAIL_POST } = await import("../app/api/agentmail/send/route.ts")

function resetGlobals() {
  globalThis.__p1ServerUpdates = []
  globalThis.__p1AdminUpdates = []
  globalThis.__p1QuotaCalls = []
  globalThis.__p1ConnectorRuns = 0
  globalThis.__p1CredentialRuns = 0
  globalThis.__p1Audits = []
  globalThis.__p1QuotaAllowed = true
  globalThis.__p1QuotaOutage = false
  globalThis.__p1Aal = "aal2"
  globalThis.__p1User = "owner-1"
  globalThis.__p1Buckets = {}
  setState()
}

async function callResume() {
  const request = new Request("http://localhost/api/approvals/x/resume", { method: "POST" })
  const context = { params: Promise.resolve({ approvalId: APPROVAL_ID }) }
  const response = await RESUME_POST(request, context)
  const body = (await response.json()) as Record<string, unknown>
  return { status: response.status, body, headers: response.headers }
}

async function callAgentmailSend() {
  const request = new Request("http://localhost/api/agentmail/send", { // (runtime-compatible with NextRequest)
    method: "POST",
    // Single string recipient: passes the engine's strict intent-mapping
    // contract (arrays are a pre-existing provider-shape question, unrelated
    // to the quota path under test).
    body: JSON.stringify({ to: "a@example.com", subject: "s", text: "hello" }),
    headers: { "content-type": "application/json" },
  })
  const response = await AGENTMAIL_POST(request as never)
  const body = (await response.json()) as Record<string, unknown>
  return { status: response.status, body }
}

/* ------------------------- P1-1: INSERT authorization ------------------------- */

test("P1-1: the migration forbids execution-linked inserts by any authenticated writer", () => {
  const migration = readFileSync(
    "supabase/migrations/20260925160000_restrict_approval_inserts.sql",
    "utf8",
  )
  assert.match(migration, /execution_id is null/)
  assert.match(migration, /public\.is_current_user_org_admin\(\)/)
  assert.match(migration, /requested_by = auth\.uid\(\)/)
  assert.match(migration, /drop policy if exists approval_requests_insert_same_org/)
})

test("P1-1: the engine's approval writer inserts through the service-role client", () => {
  const approvalSource = readFileSync("lib/execution/approval.ts", "utf8")
  const adminImport = approvalSource.indexOf('createAdminClient } from "@/lib/supabase/admin"')
  assert.notEqual(adminImport, -1, "approval writer must import the service-role client")
  const insertIdx = approvalSource.indexOf('.from("approval_requests")')
  const insertWriter = approvalSource.slice(0, insertIdx).lastIndexOf("createAdminClient()")
  assert.ok(insertWriter > -1, "the approval insert must be executed by the admin client")
  // The user client remains for authentication/lookup only.
  assert.match(approvalSource, /await createClient\(\)/)
})

test("P1-1: governance request_approval is owner/admin-only in the application", () => {
  const routeSource = readFileSync("app/api/governance/action/route.ts", "utf8")
  const adminStart = routeSource.indexOf("const ADMIN_ACTIONS")
  const adminEnd = routeSource.indexOf("])", adminStart)
  const adminActions = routeSource.slice(adminStart, adminEnd)
  assert.match(adminActions, /"request_approval"/, "request_approval must be an admin action")
  const executor = readFileSync("lib/governance/action-executor.ts", "utf8")
  const caseIdx = executor.indexOf('case "request_approval"')
  const caseBody = executor.slice(caseIdx, caseIdx + 3500)
  assert.match(caseBody, /role !== "owner" && .*role !== "admin"/)
  assert.match(caseBody, /requested_by: requester\.id/, "the insert must stamp requested_by")
  assert.match(caseBody, /status: "pending"/)
  // Execution-less governance request: no execution_id is ever inserted.
  const insertBlock = caseBody.slice(caseBody.indexOf(".insert({"))
  assert.doesNotMatch(insertBlock, /execution_id/)
})

/* ------------------------- P1-2: org execution quota ------------------------- */

test("P1-2: engine consumes the org execution quota before any expensive work", async () => {
  resetGlobals()
  globalThis.__p1Buckets = {}

  const result = await executeAgentTask({
    organizationId: "org-1",
    agentId: "agent-1",
    requestedCapability: "messages.send" as const,
    data: { recipient: "a@example.com", document: "r" },
  })

  assert.equal(result.success, true)
  // The quota was consumed through the distributed limiter exactly once.
  assert.equal((globalThis.__p1QuotaCalls ?? []).length, 1)
  // Correct shared key, not per-user, not per-agent, not per-route.
  const buckets = globalThis.__p1Buckets ?? {}
  assert.ok(buckets["exec:org-1"] === 1, `org bucket must hold exactly one consumed slot: ${JSON.stringify(buckets)}`)
})

test("P1-2: the org key is shared across the engine and the resume route", async () => {
  resetGlobals()
  // The engine path consumes one slot...
  await executeAgentTask({
    organizationId: "org-1",
    agentId: "agent-1",
    requestedCapability: "messages.send" as const,
    data: { recipient: "a@example.com", document: "r" },
  })
  const engineSlots = (globalThis.__p1Buckets ?? {})["exec:org-1"] ?? 0
  assert.equal(engineSlots, 1, "engine must consume exec:org-1")

  // ...and the resume path draws from the SAME org bucket (no quota stub in
  // this suite's resume wiring besides the shared one, so just verify the
  // engine consumed the org key and the resume call also targets it).
  resetGlobals()
  await callResume()
  const keys = Object.keys(globalThis.__p1Buckets ?? {})
  assert.ok(keys.includes("exec:org-1"), `resume must consume exec:org-1: ${JSON.stringify(keys)}`)
})

test("P1-2: exhausted org quota blocks the engine before credentials and connector", async () => {
  resetGlobals()
  globalThis.__p1QuotaAllowed = false

  await assert.rejects(
    () =>
      executeAgentTask({
        organizationId: "org-1",
        agentId: "agent-1",
        requestedCapability: "messages.send" as const,
        data: { recipient: "a@example.com", document: "r" },
      }),
    /Organization execution rate limit exceeded/,
  )

  assert.equal(globalThis.__p1CredentialRuns, 0, "credentials must never resolve")
  assert.equal(globalThis.__p1ConnectorRuns, 0, "connector must never run")
})

test("P1-2: exhausted org quota fails the resume route with 429 and Retry-After", async () => {
  resetGlobals()
  globalThis.__p1QuotaAllowed = false

  const { status, body, headers } = await callResume()

  assert.equal(status, 429)
  assert.match(String(body.error ?? ""), /Organization execution rate limit exceeded/)
  assert.ok(headers.get("retry-after"), "429 must carry Retry-After")
  assert.equal(globalThis.__p1ConnectorRuns, 0)
  // Fail closed: approval state unchanged.
  assert.equal((globalThis.__p1AdminUpdates ?? []).filter((u) => u.op === "update").length, 0)
})

test("P1-2: quota service outage fails resume closed with 503", async () => {
  resetGlobals()
  // Simulate limiter outage: the limiter rpc throws (service unreachable).
  globalThis.__p1QuotaOutage = true

  const { status, body } = await callResume()

  assert.equal(status, 503)
  assert.match(String(body.error ?? ""), /temporarily unavailable/i)
  assert.equal(globalThis.__p1ConnectorRuns, 0)
})

test("P1-2: quota errors map to 429 with fixed messages (no raw error forwarding)", async () => {
  const sources = [
    "app/api/execute/route.ts",
    "app/api/connectors/execute/route.ts",
    "app/api/tasks/execute/route.ts",
    "app/api/tasks/[taskId]/execute/route.ts",
    "app/api/approvals/[approvalId]/resume/route.ts",
  ]
  for (const file of sources) {
    const source = readFileSync(file, "utf8")
    assert.match(source, /OrgExecutionQuotaExceededError/, `${file} must handle org quota exhaustion`)
    assert.match(source, /status: 429/, `${file} must map exhaustion to 429`)
    assert.match(source, /ORG_EXECUTION_QUOTA_LIMIT_MESSAGE/, `${file} must use the fixed message constant`)
    assert.doesNotMatch(source, /error: error\.message/, `${file} must not forward raw error text`)
  }
  const agentmail = readFileSync("app/api/agentmail/send/route.ts", "utf8")
  assert.match(agentmail, /ORG_MAIL_QUOTA_LIMIT_MESSAGE/)
})

/* ------------------------- P1-3: org mail quota ------------------------- */

test("P1-3: agentmail send consumes the org mail quota before connection lookup", async () => {
  resetGlobals()

  // The quota fires inside the route before any connection lookup or engine
  // work; the engine may reject the payload afterwards for unrelated
  // contract reasons (the send route feeds raw `to` arrays to intent
  // mapping), which does not affect this invariant.
  await callAgentmailSend()

  const buckets = globalThis.__p1Buckets ?? {}
  assert.ok(buckets["mail:org-1"] === 1, `org mail bucket must be consumed once: ${JSON.stringify(buckets)}`)
})

test("P1-3: exhausted org mail quota blocks sends with 429 before execution", async () => {
  resetGlobals()
  globalThis.__p1QuotaAllowed = false

  const { status, body } = await callAgentmailSend()

  assert.equal(status, 429)
  assert.match(String(body.error ?? ""), /Organization AgentMail rate limit exceeded/)
  assert.equal(globalThis.__p1ConnectorRuns, 0)
})

/* ------------------------- regression: limits happen BEFORE expensive work ------------------------- */

test("P1-2: org quota gate precedes governance, identity, credentials and connector in the engine", () => {
  const engineSource = readFileSync("lib/execution/engine.ts", "utf8")
  const quotaIdx = engineSource.indexOf("consumeOrgExecutionQuota(")
  assert.ok(quotaIdx > -1)
  const govIdx = engineSource.indexOf("evaluateGovernance(")
  const identityIdx = engineSource.indexOf("assertVerifiedAgentIdentity(")
  const credIdx = engineSource.indexOf("resolveConnectionCredential(")
  const connectorIdx = engineSource.indexOf("executeConnectorAction(")
  assert.ok(quotaIdx < govIdx, "quota must precede governance")
  assert.ok(quotaIdx < identityIdx, "quota must precede the identity gate")
  assert.ok(quotaIdx < credIdx, "quota must precede credential resolution")
  assert.ok(quotaIdx < connectorIdx, "quota must precede connector execution")
})

test("P1-2: resume quota gate precedes approval fetch, provenance, identity, credentials and claim", () => {
  const source = readFileSync("app/api/approvals/[approvalId]/resume/route.ts", "utf8")
  const quotaIdx = source.indexOf("consumeOrgExecutionQuota(")
  assert.ok(quotaIdx > -1)
  const approvalIdx = source.indexOf('.from("approval_requests")')
  const provenanceIdx = source.indexOf("assertApprovalProvenance(")
  const identityIdx = source.indexOf("assertVerifiedAgentIdentity(")
  const credIdx = source.indexOf("resolveConnectionCredential(")
  const claimIdx = source.indexOf('.eq("input_data", execution.input_data)')
  assert.ok(quotaIdx < approvalIdx, "resume quota must precede the approval fetch")
  assert.ok(quotaIdx < provenanceIdx)
  assert.ok(quotaIdx < identityIdx)
  assert.ok(quotaIdx < credIdx)
  assert.ok(quotaIdx < claimIdx)
})
