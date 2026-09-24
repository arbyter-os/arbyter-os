import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"
import type { NextRequest } from "next/server"

// Stage 4 finding D-4 regression.
//
// requirePrivilegedMfa() intentionally runs the owner/admin role check before
// the AAL2 check, so for a non-privileged member it throws
// PrivilegedAuthorizationError on privileged paths such as /api/execute. The
// proxy's catch previously mapped only PrivilegedMfaRequiredError to 403 and
// let every other error fall into the generic 503 "temporarily unavailable"
// handler — reporting a normal authorization denial as an infrastructure
// outage while also logging it as a failure.
//
// This test loads the REAL @/lib/security/privileged-auth module (so the error
// classes are genuine instances) and stubs only the Supabase SSR client, the
// rate limiter, CSP, and config. It asserts the full semantics triad:
//   member            -> 403 "Only an owner or admin can perform this action."
//   owner without AAL2 -> 403 "Additional authentication is required..."
//   lookup failure     -> 503 "Execution authorization is temporarily unavailable."

const nextServerStub = `
export class NextRequest extends Request {}
export class NextResponse extends Response {
  static next() { return new Response(null, { status: 200 }) }
  static json(body, init) {
    const headers = new Headers(init?.headers)
    headers.set("content-type", "application/json")
    return new Response(JSON.stringify(body), { ...init, headers })
  }
  static redirect(url, init) { return Response.redirect(url, init?.status ?? 307) }
}
`

const supabaseStub = `
let session = { user: null, role: null, roleError: null, aal: "aal2", aalError: null }
export function __setSession(next) { session = { ...session, ...next } }
export function createServerClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: session.user }, error: null }),
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({
          data: { currentLevel: session.aal },
          error: session.aalError,
        }),
      },
    },
    from(table) {
      if (table !== "users") throw new Error("unexpected table " + table)
      return {
        select() { return this },
        eq() { return this },
        async maybeSingle() {
          return session.roleError
            ? { data: null, error: session.roleError }
            : { data: { role: session.role }, error: null }
        },
      }
    },
  }
}
`

const supabaseConfigStub = `
export function getSupabaseConfig() { return { url: "http://supabase.local", publishableKey: "test-key" } }
`

const rateLimitStub = `
export async function checkRateLimit() {
  return { allowed: true, remaining: 29, retryAfterSeconds: 0 }
}
export function getClientIp() { return "127.0.0.1" }
`

const cspStub = `export function createContentSecurityPolicy() { return { nonce: "test", policy: "default-src 'self'" } }`

const supabase = `data:text/javascript,${encodeURIComponent(supabaseStub)}`
const supabaseConfig = `data:text/javascript,${encodeURIComponent(supabaseConfigStub)}`
const rateLimit = `data:text/javascript,${encodeURIComponent(rateLimitStub)}`
const csp = `data:text/javascript,${encodeURIComponent(cspStub)}`
const nextServer = `data:text/javascript,${encodeURIComponent(nextServerStub)}`

const loader = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return { url: ${JSON.stringify(nextServer)}, shortCircuit: true }
  if (specifier === "@supabase/ssr") return { url: ${JSON.stringify(supabase)}, shortCircuit: true }
  if (specifier === "@/lib/security/rate-limit") return { url: ${JSON.stringify(rateLimit)}, shortCircuit: true }
  if (specifier === "@/lib/security/content-security-policy") return { url: ${JSON.stringify(csp)}, shortCircuit: true }
  if (specifier === "@/lib/security/supabase-config") return { url: ${JSON.stringify(supabaseConfig)}, shortCircuit: true }
  return nextResolve(specifier, context)
}
`

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __d4setSession: ((next: Record<string, unknown>) => void) | undefined
}

const { __setSession } = await import(supabase)
globalThis.__d4setSession = __setSession
const proxyModule = await import("../proxy.ts")

function makeRequest(pathname: string): NextRequest {
  const request = new Request(`http://localhost${pathname}`, { method: "POST" })
  Object.defineProperty(request, "nextUrl", {
    value: {
      pathname,
      clone() { return { pathname, clone: this.clone } },
    },
  })
  return request as unknown as NextRequest
}

async function run(pathname: string) {
  return proxyModule.updateSession(makeRequest(pathname))
}

test("D-4: member on /api/execute is a 403 authorization denial, not a 503", async () => {
  __setSession({ user: { id: "member-1" }, role: "member", roleError: null })
  const response = await run("/api/execute")
  assert.equal(response.status, 403, "member denial must be 403")
  const body = (await response.json()) as { error: string }
  assert.equal(body.error, "Only an owner or admin can perform this action.")
})

test("D-4: owner without AAL2 still gets the distinct MFA 403", async () => {
  __setSession({ user: { id: "owner-1" }, role: "owner", roleError: null, aal: "aal1" })
  const response = await run("/api/execute")
  assert.equal(response.status, 403)
  const body = (await response.json()) as { error: string }
  assert.equal(body.error, "Additional authentication is required for this action.")
})

test("D-4: genuine role-lookup failure keeps the 503 infrastructure semantics", async () => {
  __setSession({ user: { id: "owner-2" }, role: "owner", roleError: { message: "connection terminated" } })
  const response = await run("/api/execute")
  assert.equal(response.status, 503, "real lookup failures must stay 503")
  const body = (await response.json()) as { error: string }
  assert.equal(body.error, "Execution authorization is temporarily unavailable.")
})

test("D-4: privileged owner with AAL2 passes the proxy gate", async () => {
  __setSession({ user: { id: "owner-3" }, role: "owner", roleError: null, aal: "aal2" })
  const response = await run("/api/execute")
  assert.equal(response.status, 200)
})
