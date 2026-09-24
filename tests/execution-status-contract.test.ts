import { strict as assert } from "node:assert"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Stage 4 finding D-2: the application persists 'blocked',
// 'awaiting_approval' and 'flagged' into agent_executions.status after
// governance interdictions (lib/execution/audit.ts + lib/execution/engine.ts),
// but the live database check constraint accepted only
// started/running/completed/failed/cancelled. Every governed interdiction
// violated the constraint, the audit update failed, and the request surfaced
// as HTTP 500 with the execution row stuck at 'failed'.
//
// This regression locks the code-side audit contract to the migration-side
// constraint so they can no longer drift apart silently.

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, "..")

const auditSource = readFileSync(join(repoRoot, "lib", "execution", "audit.ts"), "utf8")
const engineSource = readFileSync(join(repoRoot, "lib", "execution", "engine.ts"), "utf8")
const migrationSource = readFileSync(
  join(repoRoot, "supabase", "migrations", "20260924100000_align_agent_executions_status_check.sql"),
  "utf8",
)

const AUDIT_TYPE_STATUSES = ["running", "completed", "failed", "blocked", "awaiting_approval", "flagged"] as const
const CONSTRAINT_STATUSES = [...AUDIT_TYPE_STATUSES, "started", "cancelled"] as const

test("D-2: audit context type declares every status the engine can record", () => {
  for (const status of AUDIT_TYPE_STATUSES) {
    assert.ok(
      auditSource.includes(`"${status}"`),
      `lib/execution/audit.ts must declare "${status}" in ExecutionAuditContext`,
    )
  }
})

test("D-2: engine persists governance interdictions with their real statuses", () => {
  assert.ok(engineSource.includes('status: "blocked"'), "BLOCK branch must persist status 'blocked'")
  assert.ok(
    engineSource.includes('"awaiting_approval"'),
    "REQUIRE_APPROVAL branch must persist status 'awaiting_approval'",
  )
  assert.ok(engineSource.includes('status\n          ? "awaiting_approval"\n          : "flagged"') || engineSource.includes('"flagged"'), "FLAG branch must persist status 'flagged'")
})

test("D-2: migration constraint accepts the union of code-persisted statuses", () => {
  for (const status of CONSTRAINT_STATUSES) {
    assert.ok(
      migrationSource.includes(`'${status}'::text`),
      `agent_executions_status_check migration must accept "${status}"`,
    )
  }
  assert.ok(migrationSource.includes("drop constraint agent_executions_status_check"))
})

test("D-2: no other agent_executions status writer exists outside the contract", () => {
  const statusLiterals = [...engineSource.matchAll(/status:\s*\n?\s*"([a-z_]+)"/g)].map((m) => m[1])
  const unique = new Set(statusLiterals)
  for (const status of unique) {
    assert.ok(
      (CONSTRAINT_STATUSES as readonly string[]).includes(status),
      `engine writes unexpected status "${status}" not covered by the DB constraint`,
    )
  }
})
