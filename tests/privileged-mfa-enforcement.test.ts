import { strict as assert } from "node:assert"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

// P0-4 regression suite: privileged MFA enforcement.
//
// Security properties under test:
//   1. insufficient AAL (aal1) is rejected for privileged access (default env)
//   2. ARBYTER_REQUIRE_MFA=false is IGNORED in production (AAL2 still required)
//   3. ARBYTER_REQUIRE_MFA=false still skips AAL2 outside production
//      (documented local testing escape hatch; role check intact)
//   4. the owner/admin role check is NEVER skipped by the escape hatch
//   5. every privileged execution-capable route calls requirePrivilegedMfa at
//      its own boundary (defense in depth beyond proxy.ts middleware)
//   6. the approval resume route fails closed on insufficient AAL

type Role = "owner" | "admin" | "member"

function makeSupabaseStub(role: Role, assurance: { currentLevel: string; error?: Error }) {
  return {
    from(_table: string) {
      return {
        select(_cols: string) {
          return this
        },
        eq(_col: string, _val: string) {
          return this
        },
        async maybeSingle() {
          return { data: { role }, error: null }
        },
      }
    },
    auth: {
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          return { data: { currentLevel: assurance.currentLevel }, error: assurance.error ?? null }
        },
      },
    },
  }
}

function withEnv(value: string | undefined, nodeEnv: string | undefined, fn: () => Promise<void>) {
  return async () => {
    const env = process.env as Record<string, string | undefined>
    const previousFlag = env.ARBYTER_REQUIRE_MFA
    const previousNodeEnv = env.NODE_ENV
    try {
      if (value === undefined) delete env.ARBYTER_REQUIRE_MFA
      else env.ARBYTER_REQUIRE_MFA = value
      if (nodeEnv === undefined) delete env.NODE_ENV
      else env.NODE_ENV = nodeEnv
      await fn()
    } finally {
      if (previousFlag === undefined) delete env.ARBYTER_REQUIRE_MFA
      else env.ARBYTER_REQUIRE_MFA = previousFlag
      if (previousNodeEnv === undefined) delete env.NODE_ENV
      else env.NODE_ENV = previousNodeEnv
    }
  }
}

async function loadModule() {
  // Fresh import per test so module-level env reads are re-evaluated lazily
  // (the flag is read per-call, but a clean module state avoids surprises).
  return import("../lib/security/privileged-auth.ts?" + Date.now())
}

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, "..")

const AAL1 = { currentLevel: "aal1" }
const AAL2 = { currentLevel: "aal2" }

test(
  "P0-4: insufficient AAL (aal1) cannot obtain privileged access (default env)",
  withEnv(undefined, "test", async () => {
    const { requirePrivilegedMfa, isPrivilegedMfaRequiredError } = await loadModule()
    try {
      await requirePrivilegedMfa(makeSupabaseStub("owner", AAL1), "user-1")
      assert.fail("aal1 owner must be rejected")
    } catch (error) {
      assert.ok(isPrivilegedMfaRequiredError(error))
    }
  }),
)

test(
  "P0-4: aal2 owner/admin passes (default env)",
  withEnv(undefined, "test", async () => {
    const { requirePrivilegedMfa } = await loadModule()
    const role = await requirePrivilegedMfa(makeSupabaseStub("owner", AAL2), "user-1")
    assert.equal(role, "owner")
    const adminRole = await requirePrivilegedMfa(makeSupabaseStub("admin", AAL2), "user-1")
    assert.equal(adminRole, "admin")
  }),
)

test(
  "P0-4: production IGNORES ARBYTER_REQUIRE_MFA=false (AAL2 still required)",
  withEnv("false", "production", async () => {
    const { requirePrivilegedMfa, isPrivilegedMfaRequiredError } = await loadModule()
    try {
      await requirePrivilegedMfa(makeSupabaseStub("owner", AAL1), "user-1")
      assert.fail("production must not accept aal1 even with the escape hatch set")
    } catch (error) {
      assert.ok(isPrivilegedMfaRequiredError(error))
    }
  }),
)

test(
  "P0-4: Vercel production also IGNORES ARBYTER_REQUIRE_MFA=false",
  withEnv("false", "development", async () => {
    process.env.VERCEL_ENV = "production"
    try {
      const { requirePrivilegedMfa, isPrivilegedMfaRequiredError } = await loadModule()
      try {
        await requirePrivilegedMfa(makeSupabaseStub("admin", AAL1), "user-1")
        assert.fail("vercel production must not accept aal1 with the escape hatch set")
      } catch (error) {
        assert.ok(isPrivilegedMfaRequiredError(error))
      }
    } finally {
      delete process.env.VERCEL_ENV
    }
  }),
)

test(
  "P0-4: outside production the escape hatch still skips ONLY the AAL2 check",
  withEnv("false", "test", async () => {
    const { requirePrivilegedMfa } = await loadModule()
    const role = await requirePrivilegedMfa(makeSupabaseStub("owner", AAL1), "user-1")
    assert.equal(role, "owner", "aal1 owner passes outside production with the hatch")
  }),
)

test(
  "P0-4: the role check is NEVER skipped by the escape hatch (member always rejected)",
  withEnv("false", "production", async () => {
    const { requirePrivilegedMfa, isPrivilegedAuthorizationError } = await loadModule()
    try {
      await requirePrivilegedMfa(makeSupabaseStub("member", AAL2), "user-1")
      assert.fail("member must be rejected")
    } catch (error) {
      assert.ok(isPrivilegedAuthorizationError(error))
    }
  }),
)

test("P0-4: every privileged execution route enforces MFA at its own boundary", () => {
  const routes = [
    "app/api/execute/route.ts",
    "app/api/connectors/execute/route.ts",
    "app/api/tasks/execute/route.ts",
    "app/api/tasks/[taskId]/execute/route.ts",
    "app/api/agentmail/send/route.ts",
    "app/api/approvals/[approvalId]/resume/route.ts",
  ]
  for (const route of routes) {
    const source = readFileSync(join(repoRoot, route), "utf8")
    assert.match(
      source,
      /requirePrivilegedMfa\(/,
      `${route} must call requirePrivilegedMfa at the route boundary`,
    )
    assert.match(
      source,
      /isPrivilegedMfaRequiredError\(/,
      `${route} must handle the MFA-required outcome`,
    )
  }
})

test("P0-4: proxy.ts keeps middleware-level MFA coverage (defense in depth)", () => {
  const source = readFileSync(join(repoRoot, "proxy.ts"), "utf8")
  assert.match(source, /requirePrivilegedMfa\(/)
  // The privileged route list in the proxy must still cover every route the
  // app-level gate covers.
  for (const path of [
    '"/api/execute"',
    '"/api/connectors/execute"',
    '"/api/tasks/execute"',
    '"/api/agentmail/send"',
    '"/api/approvals"',
  ]) {
    assert.ok(source.includes(path), `proxy must keep rate/MFA coverage for ${path}`)
  }
})
