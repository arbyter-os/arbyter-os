import { strict as assert } from "node:assert"
import { test } from "node:test"
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

// P0-5 static regression guard: the legacy second execution engine
// (lib/orchestrator/* — orchestrate/executeProvider, which could perform
// unauthenticated, un-audited external HTTP requests) and the mock-only
// vertical slice (lib/execution/vertical-slice.ts) were removed from the
// repository. This guard ensures they cannot silently return: no such file
// may exist, and no module anywhere in the app/lib surface may import them.

const repoRoot = join(import.meta.dirname ?? ".", "..", "..")
const appRoot = process.cwd()

test("P0-5: the legacy orchestrator engine must not exist", () => {
  assert.equal(
    existsSync(join(appRoot, "lib", "orchestrator")),
    false,
    "lib/orchestrator/ must stay deleted; the only execution architecture is lib/execution/engine.ts",
  )
  assert.equal(
    existsSync(join(appRoot, "lib", "orchestrator", "executor.ts")),
    false,
  )
  assert.equal(
    existsSync(join(appRoot, "lib", "execution", "vertical-slice.ts")),
    false,
    "lib/execution/vertical-slice.ts must stay deleted",
  )
})

function listTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) listTsFiles(full, acc)
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

test("P0-5: no module may import the removed legacy engine", () => {
  const legacyImportPattern =
    /from\s+["'][^"']*(?:lib\/)?orchestrator(?:\/[a-z-]+)?["']|from\s+["'][^"']*vertical-slice["']/
  const files = [
    ...listTsFiles(join(appRoot, "app")),
    ...listTsFiles(join(appRoot, "lib")),
    ...listTsFiles(join(appRoot, "scripts")),
  ]
  const offenders: string[] = []
  for (const file of files) {
    const source = readFileSync(file, "utf8")
    if (legacyImportPattern.test(source)) offenders.push(file)
  }
  assert.deepEqual(
    offenders,
    [],
    `no module may import the removed legacy execution engine; offenders: ${offenders.join(", ")}`,
  )
})

test("P0-5: lib/execution/engine.ts remains the single authoritative execution entry", () => {
  const engineSource = readFileSync(join(appRoot, "lib", "execution", "engine.ts"), "utf8")
  assert.match(engineSource, /export async function executeAgentTask/)
  // The engine must keep its security gates: governance interdiction before
  // execution, the verified-identity gate, TOCTOU privilege re-validation,
  // and audit recording.
  assert.match(engineSource, /evaluateGovernance\(/)
  assert.match(engineSource, /assertVerifiedAgentIdentity\(/)
  assert.match(engineSource, /revalidateExecutionPrivilege\(/)
  assert.match(engineSource, /recordExecutionAudit\(/)

  // Every live caller must funnel through the engine. /api/execute reaches it
  // one hop out (lib/orchestration/index.ts -> executeAgentTask).
  const callers = [
    ["app/api/connectors/execute/route.ts", ["executeAgentTask"]],
    ["app/api/tasks/execute/route.ts", ["executeAgentTask"]],
    ["app/api/tasks/[taskId]/execute/route.ts", ["executeAgentTask"]],
    ["app/api/agentmail/send/route.ts", ["executeAgentTask"]],
    ["lib/orchestration/index.ts", ["executeAgentTask"]],
    ["app/api/execute/route.ts", ["orchestrateUserRequest"]],
  ] as const
  for (const [caller, needles] of callers) {
    const source = readFileSync(join(appRoot, caller), "utf8")
    assert.ok(
      needles.some((n) => source.includes(n)),
      `${caller} must use the authoritative engine path`,
    )
  }
})
