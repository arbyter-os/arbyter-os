import { strict as assert } from "node:assert"
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { register } from "node:module"
import { test } from "node:test"

// Consolidated security-boundary suite (Stage 6 P0 closure).
// Static invariants are asserted on the real sources; behavioral invariants
// are executed against the real engine with stubbed edges (loader pattern).

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, "..")

// Sources are normalized to LF so index/regex assertions are line-ending
// agnostic (the working tree may carry CRLF).
const engineSource = readFileSync(join(repoRoot, "lib", "execution", "engine.ts"), "utf8").replace(/\r\n/g, "\n")
const resumeSource = readFileSync(
  join(repoRoot, "app", "api", "approvals", "[approvalId]", "resume", "route.ts"),
  "utf8",
).replace(/\r\n/g, "\n")
const resolveSource = readFileSync(
  join(repoRoot, "app", "api", "approvals", "[approvalId]", "resolve", "route.ts"),
  "utf8",
).replace(/\r\n/g, "\n")
const credentialSource = readFileSync(join(repoRoot, "lib", "credentials", "runtime.ts"), "utf8")

/* ---- static boundary invariants ---- */

test("INVARIANT deny: governance BLOCK returns before credential/connector execution", () => {
  const blockGate = engineSource.match(/governance\.decision\.decision ===\s*"BLOCK"/)
  assert.ok(blockGate, "the BLOCK interdiction must be checked in the engine")
  const blockIndex = blockGate!.index ?? -1
  const credentialIndex = engineSource.indexOf("resolveConnectionCredential(")
  const connectorIndex = engineSource.indexOf("executeConnectorAction(")
  assert.ok(credentialIndex > blockIndex, "credential resolution must come after the BLOCK gate")
  assert.ok(connectorIndex > blockIndex, "connector execution must come after the BLOCK gate")
})

test("INVARIANT pause: a non-active agent cannot enter execution from the engine", () => {
  // F4: allowlist, not blocklist — only status === 'active' may proceed.
  assert.match(engineSource, /agent\.status !== "active"/)
  assert.match(engineSource, /Agent is not active\./)
})

test("INVARIANT identity: the engine gates execution behind verified agent identity", () => {
  const identityIndex = engineSource.indexOf("assertVerifiedAgentIdentity(")
  const credentialIndex = engineSource.indexOf("resolveConnectionCredential(")
  const connectorIndex = engineSource.indexOf("executeConnectorAction(")
  assert.ok(identityIndex > 0)
  assert.ok(credentialIndex > identityIndex, "credentials may not resolve before the identity gate")
  assert.ok(connectorIndex > identityIndex, "no connector action may precede the identity gate")
})

test("INVARIANT identity: the resume path enforces the same verified-identity gate", () => {
  const identityIndex = resumeSource.indexOf("assertVerifiedAgentIdentity(")
  const connectorIndex = resumeSource.indexOf("executeConnectorAction(")
  const credentialIndex = resumeSource.indexOf("resolveConnectionCredential(")
  assert.ok(identityIndex > 0, "resume must call the identity gate")
  assert.ok(credentialIndex > identityIndex, "resume credential resolution must follow the identity gate")
  assert.ok(connectorIndex > identityIndex, "resume connector execution must follow the identity gate")
})

test("INVARIANT pause (engine): only an ACTIVE agent may enter execution (allowlist, not blocklist)", () => {
  // F4: the engine must enforce the same allowlist as resume — any non-active
  // status (paused, quarantined, disabled-equivalent) fails closed.
  assert.match(engineSource, /status !== "active"/)
  assert.match(engineSource, /Agent is not active\./)
})

test("INVARIANT pause (resume): approved executions re-check agent state before executing", () => {
  assert.match(resumeSource, /from\("ai_agents"\)/)
  assert.match(resumeSource, /status !== "active"/)
  assert.match(resumeSource, /agent is not active/i)
})

test("INVARIANT expiry (resume): expired approvals can never resume", () => {
  assert.match(resumeSource, /expires_at/)
  assert.match(resumeSource, /Date\.now\(\) >= expiresAtMs/)
  assert.match(resumeSource, /has expired/i)
})

test("INVARIANT expiry (resolve): expired pending approvals cannot be approved", () => {
  assert.match(resolveSource, /expires_at/)
  assert.match(resolveSource, /has expired/i)
})

test("INVARIANT approval creation: expires_at is stamped at insert (TTL -> deny)", () => {
  const approvalSource = readFileSync(join(repoRoot, "lib", "execution", "approval.ts"), "utf8")
  assert.match(approvalSource, /expires_at:\s*new Date\(Date\.now\(\) \+ 24 \* 60 \* 60 \* 1000\)/)
})

test("INVARIANT expiry (schema): the migration enforces NOT NULL expires_at and the full lifecycle", () => {
  const migrationSource = readFileSync(
    join(repoRoot, "supabase", "migrations", "20260925120000_add_approval_expiration.sql"),
    "utf8",
  )
  assert.match(migrationSource, /alter column expires_at set not null/)
  assert.match(
    migrationSource,
    /'pending', 'approved', 'rejected', 'expired', 'consumed'/,
  )
})

test("INVARIANT tamper: the resume claim is bound to the exact approved execution context", () => {
  assert.match(resumeSource, /currentIntegrityHash !== approvedIntegrityHash/)
  assert.match(resumeSource, /\.eq\("input_data", execution\.input_data\)/)
})

test("INVARIANT cross-org: credential resolution is organization-scoped", () => {
  assert.match(credentialSource, /\.eq\("organization_id", organizationId\)/)
  assert.match(credentialSource, /\.eq\("agent_connection_id", connectionId\)/)
})

test("INVARIANT audit: every successful execution path records an audit record", () => {
  // engine: completed + failed + blocked + flagged/awaiting branches all call recordExecutionAudit
  const auditCalls = (engineSource.match(/recordExecutionAudit\(/g) ?? []).length
  assert.ok(auditCalls >= 4, `engine must audit all outcome branches (found ${auditCalls})`)
  // resume: failed + completed
  assert.match(resumeSource, /recordExecutionAudit\(/)
})

test("INVARIANT single engine: the legacy orchestrator cannot return", () => {
  assert.equal(existsSync(join(repoRoot, "lib", "orchestrator")), false)
  assert.equal(existsSync(join(repoRoot, "lib", "execution", "vertical-slice.ts")), false)
})

test("INVARIANT idempotency: direct connector bypass without a task requires an Idempotency-Key", () => {
  const source = readFileSync(join(repoRoot, "app", "api", "connectors", "execute", "route.ts"), "utf8")
  assert.match(source, /Idempotency-Key is required when taskId is omitted/)
})

/* ---- behavioral: replay attempts against the real engine ---- */

let identityRow: { data: unknown; error: unknown } = { data: null, error: null }
let governanceResult: unknown = { decision: { decision: "ALLOW", reason: null }, risk: "low" }

const supabaseServerStub = `
export function createClient() {
  const rows = {
    users: { data: { organization_id: "org-1", role: "owner" }, error: null },
    ai_agents: {
      data: { id: "agent-1", name: "Mail Agent", status: globalThis.__boundaryAgentStatus ?? "active" },
      error: null,
    },
    agent_identities: globalThis.__boundaryIdentityRow ?? { data: null, error: null },
    agent_connections: {
      data: [{
        id: "conn-1",
        provider: "agentmail",
        status: "connected",
        health_status: null,
        capabilities: { "messages.send": true },
        environment: null,
        configuration: {},
      }],
      error: null,
    },
  }
  function builder(table) {
    const state = table === "agent_identities"
      ? (globalThis.__boundaryIdentityRow ?? { data: null, error: null })
      : rows[table] ?? { data: null, error: null }
    const chain = {
      select() { return chain },
      eq() { return chain },
      order() { return chain },
      limit() { return chain },
      update() { return chain },
      async maybeSingle() { return state },
      then(resolve) { return Promise.resolve(state).then(resolve) },
    }
    return chain
  }
  return {
    // P1-2: the engine consumes the org execution quota through the user
    // client's rpc; allowed unless a case stubs an exhausted bucket.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__boundaryOrgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
      }
      return { data: null, error: null }
    },
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from(table) { return builder(table) },
  }
}
`

const supabaseAdminStub = `
export function createAdminClient() {
  globalThis.__boundaryAdminUpdates = globalThis.__boundaryAdminUpdates ?? []
  const updates = globalThis.__boundaryAdminUpdates
  return {
    // P1-2: org execution quota flows through checkRateLimitCost -> the
    // ADMIN client's rpc; allowed unless a case stubs an exhausted bucket.
    async rpc(fn) {
      if (fn === "check_rate_limit_cost") {
        return { data: [{ allowed: globalThis.__boundaryOrgQuotaAllowed ?? true, remaining: 0, retry_after_seconds: 1 }], error: null }
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
  return globalThis.__boundaryGovernance ?? { decision: { decision: "ALLOW", reason: null }, risk: "low" }
}
`

const connectorRuntimeStub = `
export async function executeConnectorAction() {
  globalThis.__boundaryConnectorRuns = (globalThis.__boundaryConnectorRuns ?? 0) + 1
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
  globalThis.__boundaryCredentialRuns = (globalThis.__boundaryCredentialRuns ?? 0) + 1
  return { id: "cred-1", type: "api_key", secret: "s" }
}
`

const auditStub = `
export async function recordExecutionAudit(context) {
  globalThis.__boundaryAudits = globalThis.__boundaryAudits ?? []
  globalThis.__boundaryAudits.push(context)
  return { id: "audit-1" }
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

const specs: Array<[string, string]> = [
  ["@/lib/supabase/server", supabaseServerStub],
  ["@/lib/supabase/admin", supabaseAdminStub],
  ["@/lib/governance", governanceStub],
  ["@/lib/connectors/runtime", connectorRuntimeStub],
  ["@/lib/connectors/registry", connectorRegistryStub],
  ["@/lib/credentials/runtime", credentialsStub],
  ["@/lib/execution/audit", auditStub],
  // The engine imports these three RELATIVELY ("./audit" etc.), so the
  // relative specifiers must be intercepted as well for the stubs to engage.
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
  var __boundaryIdentityRow: { data: unknown; error: unknown } | undefined
  // eslint-disable-next-line no-var
  var __boundaryGovernance: unknown
  // eslint-disable-next-line no-var
  var __boundaryConnectorRuns: number | undefined
  // eslint-disable-next-line no-var
  var __boundaryCredentialRuns: number | undefined
  // eslint-disable-next-line no-var
  var __boundaryAudits: Array<{ status: string }> | undefined
  // eslint-disable-next-line no-var
  var __boundaryAdminUpdates: Array<{ op: string; values: Record<string, unknown> }> | undefined
  // eslint-disable-next-line no-var
  var __boundaryAgentStatus: string | undefined
  // eslint-disable-next-line no-var
  var __boundaryOrgQuotaAllowed: boolean | undefined
}

const { executeAgentTask } = await import("../lib/execution/engine.ts")

// REAL agent_identities shape: `verified` is the only state column
// (no status/disabled; no embedded resources).
const verifiedIdentity = {
  verified: true,
}

function resetBoundary() {
  globalThis.__boundaryIdentityRow = { data: verifiedIdentity, error: null }
  globalThis.__boundaryGovernance = { decision: { decision: "ALLOW", reason: null }, risk: "low" }
  globalThis.__boundaryConnectorRuns = 0
  globalThis.__boundaryCredentialRuns = 0
  globalThis.__boundaryAudits = []
  globalThis.__boundaryAdminUpdates = []
  globalThis.__boundaryAgentStatus = "active"
}

const input = {
  organizationId: "org-1",
  agentId: "agent-1",
  requestedCapability: "messages.send" as const,
  data: { recipient: "a@example.com", document: "report" },
}

test("BEHAVIOR deny: governance DENY cannot execute (no credential, no connector, audit written)", async () => {
  resetBoundary()
  globalThis.__boundaryGovernance = { decision: { decision: "BLOCK", reason: "policy" }, risk: "high" }

  const result = await executeAgentTask(input)

  assert.equal(result.success, false)
  assert.equal(result.status, "blocked")
  assert.equal(globalThis.__boundaryConnectorRuns, 0)
  assert.equal(globalThis.__boundaryCredentialRuns, 0)
  assert.ok((globalThis.__boundaryAudits ?? []).some((a) => a.status === "blocked"))
})

test("BEHAVIOR quarantine/pause: a paused agent cannot execute at all", async () => {
  // Agent liveness is enforced by the engine's ai_agents.status check
  // ("Agent is paused.") BEFORE the identity gate; with a verified identity
  // but a paused agent (stubbed through the ai_agents row below), the engine
  // must still refuse to run the connector.
  resetBoundary()
  // F4: the engine uses the same ACTIVE-allowlist invariant as the resume
  // boundary. Verified identity alone is not sufficient when the engine's
  // own agent-status check fires.
  // NOTE: the engine signals a non-active agent by THROWING (pre-existing
  // behavior), unlike the identity gate which returns a blocked result. The
  // invariant is the same either way: no connector call, no credential
  // resolution.
  globalThis.__boundaryAgentStatus = "paused"

  await assert.rejects(
    () => executeAgentTask(input),
    /Agent is not active/,
  )

  assert.equal(globalThis.__boundaryConnectorRuns, 0)
  assert.equal(globalThis.__boundaryCredentialRuns, 0)
})

test("BEHAVIOR unverified agent cannot execute (replay of the P0-1 gate)", async () => {
  resetBoundary()
  globalThis.__boundaryIdentityRow = { data: { ...verifiedIdentity, verified: false }, error: null }

  const result = await executeAgentTask(input)

  assert.equal(result.status, "blocked")
  assert.equal(globalThis.__boundaryConnectorRuns, 0)
  assert.equal(globalThis.__boundaryCredentialRuns, 0)
})

test("BEHAVIOR cross-organization agent identity cannot execute", async () => {
  resetBoundary()
  // Cross-org rows are invisible under the (agent_id, organization_id)
  // filter, so the gate sees "missing" — the fail-closed path.
  globalThis.__boundaryIdentityRow = { data: null, error: null }

  const result = await executeAgentTask(input)

  assert.equal(result.status, "blocked")
  assert.equal(globalThis.__boundaryConnectorRuns, 0)
})

test("BEHAVIOR every successful execution produces an audit record", async () => {
  resetBoundary()

  const result = await executeAgentTask(input)

  assert.equal(result.success, true)
  assert.equal(globalThis.__boundaryConnectorRuns, 1)
  assert.ok((globalThis.__boundaryAudits ?? []).some((a) => a.status === "completed"))
})
