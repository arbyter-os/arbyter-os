import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

// Stage 4 finding D-1: the vault schema is not exposed through PostgREST
// ("Only the following schemas are exposed: public"), so the credential
// resolver must not read vault.decrypted_secrets over the REST API. The real
// lib/credentials/runtime.ts module is loaded; only the admin Supabase client
// is stubbed, and it records which access paths were used.

const calls: { rpc: unknown[]; vaultReads: number } = { rpc: [], vaultReads: 0 }

const supabaseAdminStub = `
export function createAdminClient() {
  // Read the shared state lazily on every call: the test sets it per-case,
  // after this stub module has already been evaluated.
  const state = () => globalThis.__credentialStubState
  function chain(table) {
    return {
      select() { return chain(table) },
      eq() { return chain(table) },
      order() { return chain(table) },
      limit() { return chain(table) },
      async maybeSingle() { return state().credentialRow },
    }
  }
  return {
    from(table) { return chain(table) },
    schema(scheme) {
      if (scheme === "vault") state().vaultReads += 1
      return {
        from() {
          return {
            select() { return this },
            eq() { return this },
            async maybeSingle() { return { data: null, error: null } },
          }
        },
        rpc() {
          return Promise.resolve({ data: null, error: { message: "unused in this test" } })
        },
      }
    },
    async rpc(fn, args) {
      state().rpcCalls.push({ fn, args })
      return { data: state().rpcResult, error: state().rpcError }
    },
  }
}
`

const stubUrl = (code: string) => `data:text/javascript,${encodeURIComponent(code)}`
const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
  `  if (specifier === "@/lib/supabase/admin") return { url: ${JSON.stringify(stubUrl(supabaseAdminStub))}, shortCircuit: true }\n` +
  "  return nextResolve(specifier, context)\n" +
  "}\n"
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __credentialStubState: {
    credentialRow: { data: unknown; error: unknown }
    rpcCalls: { fn: string; args: Record<string, unknown> }[]
    rpcResult: unknown
    rpcError: unknown
    vaultReads: number
  }
}

const { resolveConnectionCredential } = await import("../lib/credentials/runtime.ts")

const here = dirname(fileURLToPath(import.meta.url))
const runtimeSource = readFileSync(join(here, "..", "lib", "credentials", "runtime.ts"), "utf8")

function freshState() {
  globalThis.__credentialStubState = {
    credentialRow: {
      data: {
        id: "cred-1",
        credential_type: "api_key",
        secret_reference: "11111111-2222-3333-4444-555555555555",
        status: "active",
        expires_at: null,
      },
      error: null,
    },
    rpcCalls: [],
    rpcResult: "resolved-secret-value",
    rpcError: null,
    vaultReads: 0,
  }
  return globalThis.__credentialStubState
}

test("D-1: resolution goes through the resolve_connection_secret RPC with scoped args", async () => {
  const state = freshState()
  const resolved = await resolveConnectionCredential({
    organizationId: "org-1",
    connectionId: "conn-1",
  })

  assert.equal(resolved?.secret, "resolved-secret-value")
  assert.equal(resolved?.id, "cred-1")
  assert.equal(state.rpcCalls.length, 1)
  assert.equal(state.rpcCalls[0].fn, "resolve_connection_secret")
  assert.deepEqual(state.rpcCalls[0].args, {
    p_organization_id: "org-1",
    p_connection_id: "conn-1",
  })
  assert.equal(state.vaultReads, 0, "no direct vault schema access is permitted")
})

test("D-1: RPC failure keeps the fixed client-facing sentence", async () => {
  const state = freshState()
  state.rpcError = { message: "permission denied for function resolve_connection_secret" }
  await assert.rejects(
    resolveConnectionCredential({ organizationId: "org-1", connectionId: "conn-1" }),
    /Connection credential is unavailable\./,
  )
  assert.equal(state.vaultReads, 0)
})

test("D-1: runtime source never reads vault.decrypted_secrets via PostgREST", () => {
  assert.ok(!runtimeSource.includes('.schema("vault")'), "vault schema access over PostgREST is banned in the resolver")
  assert.ok(runtimeSource.includes("resolve_connection_secret"), "resolver must use the RPC path")
})
