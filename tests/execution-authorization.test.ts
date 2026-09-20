import { strict as assert } from "node:assert"
import { test } from "node:test"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  authorizeConnectorExecution,
  ConnectorExecutionAuthorizationError,
} from "../lib/security/authorize-connector-execution.ts"

type FakeSupabase = {
  role: string
  organizationId: string
  error?: Error
}

function supabaseFor(fake: FakeSupabase) {
  return {
    from() {
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        async maybeSingle() {
          if (fake.error) return { data: null, error: fake.error }
          return {
            data: {
              organization_id: fake.organizationId,
              role: fake.role,
            },
            error: null,
          }
        },
      }
    },
  } as unknown as SupabaseClient
}

test("owner is authorized", async () => {
  const role = await authorizeConnectorExecution({
    supabase: supabaseFor({ role: "owner", organizationId: "org-1" }),
    userId: "user-1",
    organizationId: "org-1",
  })

  assert.equal(role, "owner")
})

test("admin is authorized", async () => {
  const role = await authorizeConnectorExecution({
    supabase: supabaseFor({ role: "admin", organizationId: "org-1" }),
    userId: "user-1",
    organizationId: "org-1",
  })

  assert.equal(role, "admin")
})

test("ordinary member is rejected", async () => {
  await assert.rejects(
    authorizeConnectorExecution({
      supabase: supabaseFor({ role: "member", organizationId: "org-1" }),
      userId: "user-1",
      organizationId: "org-1",
    }),
    ConnectorExecutionAuthorizationError
  )
})

test("organization mismatch is rejected", async () => {
  await assert.rejects(
    authorizeConnectorExecution({
      supabase: supabaseFor({ role: "owner", organizationId: "org-2" }),
      userId: "user-1",
      organizationId: "org-1",
    }),
    ConnectorExecutionAuthorizationError
  )
})

test("database lookup failures are not converted into authorization success", async () => {
  const error = new Error("database unavailable")

  await assert.rejects(
    authorizeConnectorExecution({
      supabase: supabaseFor({
        role: "owner",
        organizationId: "org-1",
        error,
      }),
      userId: "user-1",
      organizationId: "org-1",
    }),
    /database unavailable/
  )
})
