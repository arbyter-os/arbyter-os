import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"
import type { NextRequest } from "next/server"

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
let currentUser = null
export function __setUser(user) { currentUser = user }
export function createServerClient() {
  return { auth: { getUser: async () => ({ data: { user: currentUser } }) } }
}
`

const supabaseConfigStub = `
export function getSupabaseConfig() { return { url: "http://supabase.local", publishableKey: "test-key" } }
`

const privilegedAuthStub = `
export async function requirePrivilegedMfa() {}
export function isPrivilegedMfaRequiredError() { return false }
export function isPrivilegedAuthorizationError() { return false }
`

const cspStub = `export function createContentSecurityPolicy() { return { nonce: "test", policy: "default-src 'self'" } }`

const rateLimitStub = `
const buckets = new Map()
export async function checkRateLimit(key, limit, windowMs) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds: 1 }
  current.count += 1
  return { allowed: true, remaining: limit - current.count, retryAfterSeconds: 0 }
}
export function getClientIp() { return "127.0.0.1" }
`
const nextServer = `data:text/javascript,${encodeURIComponent(nextServerStub)}`
const supabase = `data:text/javascript,${encodeURIComponent(supabaseStub)}`
const rateLimit = `data:text/javascript,${encodeURIComponent(rateLimitStub)}`
const privilegedAuth = `data:text/javascript,${encodeURIComponent(privilegedAuthStub)}`
const supabaseConfig = `data:text/javascript,${encodeURIComponent(supabaseConfigStub)}`
const csp = `data:text/javascript,${encodeURIComponent(cspStub)}`
const loader = `
const rateLimitUrl = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(rateLimitStub)}`)}
const nextServer = ${JSON.stringify(nextServer)}
const supabase = ${JSON.stringify(supabase)}
const privilegedAuth = ${JSON.stringify(privilegedAuth)}
const supabaseConfig = ${JSON.stringify(supabaseConfig)}
const csp = ${JSON.stringify(csp)}
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return { url: nextServer, shortCircuit: true }
  if (specifier === "@supabase/ssr") return { url: supabase, shortCircuit: true }
  if (specifier === "@/lib/security/rate-limit") return { url: rateLimitUrl, shortCircuit: true }
  if (specifier === "@/lib/security/content-security-policy") return { url: csp, shortCircuit: true }
  if (specifier === "@/lib/security/privileged-auth") return { url: privilegedAuth, shortCircuit: true }
  if (specifier === "@/lib/security/supabase-config") return { url: supabaseConfig, shortCircuit: true }
  return nextResolve(specifier, context)
}
`

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

const { __setUser } = await import(supabase)
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

async function run(pathname: string, userId: string | null) {
  __setUser(userId === null ? null : { id: userId })
  return proxyModule.updateSession(makeRequest(pathname))
}

test("allows requests under the /api/execute limit", async () => {
  const userId = `execute-limit-under-${Date.now()}-${Math.random()}`
  for (let i = 0; i < 30; i += 1) {
    const response = await run("/api/execute", userId)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("X-RateLimit-Limit"), "30")
  }
})

test("enforces 30 requests per minute and returns 429", async () => {
  const userId = `execute-limit-over-${Date.now()}-${Math.random()}`
  for (let i = 0; i < 30; i += 1) await run("/api/execute", userId)
  const response = await run("/api/execute", userId)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get("X-RateLimit-Limit"), "30")
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0")
  assert.ok(Number(response.headers.get("Retry-After")) >= 1)
})

test("scopes the execute rate-limit bucket to the authenticated user", async () => {
  const firstUser = `execute-limit-user-a-${Date.now()}-${Math.random()}`
  const secondUser = `execute-limit-user-b-${Date.now()}-${Math.random()}`
  for (let i = 0; i < 30; i += 1) await run("/api/execute", firstUser)
  assert.equal((await run("/api/execute", firstUser)).status, 429)
  assert.equal((await run("/api/execute", secondUser)).status, 200)
})

test("MCP relay is now protected by privileged MFA", async () => {
  const userId = `execute-limit-mcp-${Date.now()}-${Math.random()}`
  const response = await run("/api/discovery/mcp", userId)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10")
})


test("covers privileged mutation rate-limit policies", () => {
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/agents", "POST"), { key: "agents:write", limit: 20, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/agents/connections", "POST"), { key: "agents:connections", limit: 10, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/discovery/scans", "POST"), { key: "discovery:scans", limit: 5, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/discovery/sources", "PATCH"), { key: "discovery:sources", limit: 10, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/discovery/review", "POST"), { key: "discovery:review", limit: 20, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/governance/evaluate", "POST"), { key: "governance:evaluate", limit: 30, windowMs: 60_000 })
  assert.deepEqual(proxyModule.getRateLimitPolicy("/api/approvals", "POST"), { key: "approvals:write", limit: 10, windowMs: 60_000 })
})

test("adds an unauthenticated per-connection/IP webhook rate-limit policy", () => {
  assert.deepEqual(proxyModule.getUnauthenticatedRateLimitPolicy("/api/webhooks/verify/connection-123", "POST"), {
    key: "webhook:verify", limit: 30, windowMs: 60_000,
  })
})

test("enforces the webhook verification rate limit per connection/IP", async () => {
  __setUser(null)
  const pathname = "/api/webhooks/verify/connection-rate-test"
  for (let i = 0; i < 30; i += 1) {
    const response = await run(pathname, null)
    assert.notEqual(response.status, 429)
  }
  const response = await run(pathname, null)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get("X-RateLimit-Limit"), "30")
})
