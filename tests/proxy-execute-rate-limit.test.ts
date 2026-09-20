import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

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

const rateLimitUrl = new URL("../lib/security/rate-limit.ts", import.meta.url).href
const nextServer = `data:text/javascript,${encodeURIComponent(nextServerStub)}`
const supabase = `data:text/javascript,${encodeURIComponent(supabaseStub)}`
const loader = `
const rateLimitUrl = ${JSON.stringify(rateLimitUrl)}
const nextServer = ${JSON.stringify(nextServer)}
const supabase = ${JSON.stringify(supabase)}
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return { url: nextServer, shortCircuit: true }
  if (specifier === "@supabase/ssr") return { url: supabase, shortCircuit: true }
  if (specifier === "@/lib/security/rate-limit") return { url: rateLimitUrl, shortCircuit: true }
  return nextResolve(specifier, context)
}
`

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

const { __setUser } = await import(supabase)
const proxyModule = await import("../proxy.ts")

function makeRequest(pathname) {
  const request = new Request(`http://localhost${pathname}`, { method: "POST" })
  Object.defineProperty(request, "nextUrl", {
    value: {
      pathname,
      clone() { return { pathname, clone: this.clone } },
    },
  })
  return request
}

async function run(pathname, userId) {
  __setUser({ id: userId })
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

test("preserves existing proxy behavior for unrelated POST endpoints", async () => {
  const userId = `execute-limit-unrelated-${Date.now()}-${Math.random()}`
  const response = await run("/api/discovery/mcp", userId)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10")
})
