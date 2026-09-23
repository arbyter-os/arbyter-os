import { strict as assert } from "node:assert"
import { test } from "node:test"

// Behavioral tests for the ARBYTER_REQUIRE_MFA testing escape hatch in
// lib/security/privileged-auth.ts. The REAL module is imported (its
// @supabase/supabase-js import is type-only) — no module stubbing.
//
// Contract under test:
// - Default (unset) / "true" / any non-"false" value → AAL2 strictly required.
//   (Fail-secure parse: a typo like "FALSE" or "0" must NOT disable MFA.)
// - Exactly "false" → ONLY the AAL2 check is skipped.
// - The owner/admin role check is NEVER skipped, regardless of the flag.

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

async function loadModule() {
  return import("../lib/security/privileged-auth.ts")
}

function withEnv(value: string | undefined, fn: () => Promise<void>) {
  return async () => {
    const previous = process.env.ARBYTER_REQUIRE_MFA
    try {
      if (value === undefined) delete process.env.ARBYTER_REQUIRE_MFA
      else process.env.ARBYTER_REQUIRE_MFA = value
      await fn()
    } finally {
      if (previous === undefined) delete process.env.ARBYTER_REQUIRE_MFA
      else process.env.ARBYTER_REQUIRE_MFA = previous
    }
  }
}

const AAL1 = { currentLevel: "aal1" }
const AAL2 = { currentLevel: "aal2" }

test("default: unset flag keeps AAL2 required (AAL1 privileged user denied)", async () => {
  const m = await loadModule()
  await withEnv(undefined, async () => {
    await assert.rejects(
      m.requirePrivilegedMfa(makeSupabaseStub("owner", AAL1) as never, "user-1"),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.equal(error.name, "PrivilegedMfaRequiredError")
        return true
      },
    )
  })()
})

test('default: "true" keeps AAL2 required', withEnv("true", async () => {
  const m = await loadModule()
  await assert.rejects(
    m.requirePrivilegedMfa(makeSupabaseStub("admin", AAL1) as never, "user-1"),
    (error: unknown) => error instanceof Error && error.name === "PrivilegedMfaRequiredError",
  )
}))

test('fail-secure parse: "FALSE" (and other non-"false" values) keep AAL2 required', withEnv("FALSE", async () => {
  const m = await loadModule()
  await assert.rejects(
    m.requirePrivilegedMfa(makeSupabaseStub("owner", AAL1) as never, "user-1"),
    (error: unknown) => error instanceof Error && error.name === "PrivilegedMfaRequiredError",
  )
}))

test('exactly "false" skips ONLY the AAL2 check (AAL1 owner passes)', withEnv("false", async () => {
  const m = await loadModule()
  const role = await m.requirePrivilegedMfa(makeSupabaseStub("owner", AAL1) as never, "user-1")
  assert.equal(role, "owner")
}))

test('exactly "false" still denies ordinary members — role check is never skipped', withEnv("false", async () => {
  const m = await loadModule()
  await assert.rejects(      m.requirePrivilegedMfa(makeSupabaseStub("member", AAL1) as never, "user-1"),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.equal(error.name, "PrivilegedAuthorizationError")
      return true
    },
  )
}))

test('with "false", the MFA API erroring does not block a privileged owner', withEnv("false", async () => {
  const m = await loadModule()
  const role = await m.requirePrivilegedMfa(
    makeSupabaseStub("owner", { currentLevel: "aal1", error: new Error("mfa api down") }) as never,
    "user-1",
  )
  assert.equal(role, "owner")
}))

test("flag has no effect on the normal AAL2 path (privileged owner allowed)", withEnv(undefined, async () => {
  const m = await loadModule()
  const role = await m.requirePrivilegedMfa(makeSupabaseStub("owner", AAL2) as never, "user-1")
  assert.equal(role, "owner")
}))
