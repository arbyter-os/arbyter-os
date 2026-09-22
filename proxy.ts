import { createServerClient } from "@supabase/ssr"
import { createContentSecurityPolicy } from "@/lib/security/content-security-policy"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit"
import { getSupabaseConfig } from "@/lib/security/supabase-config"
import { isPrivilegedMfaRequiredError, requirePrivilegedMfa } from "@/lib/security/privileged-auth"
import { RATE_LIMITS } from "@/lib/security/rate-limit-config"

export async function updateSession(request: NextRequest) {
  const { nonce, policy } = createContentSecurityPolicy()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", policy)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const { url: supabaseUrl, publishableKey: supabasePublishableKey } = getSupabaseConfig()
  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/api/")) {
    if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
      const origin = request.headers.get("origin")
      if (origin) {
        try {
          if (new URL(origin).origin !== request.nextUrl.origin) {
            return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
          }
        } catch {
          return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
        }
      }
    }

    const contentLength = request.headers.get("content-length")
    if (contentLength) {
      const parsedLength = Number(contentLength)
      if (!Number.isFinite(parsedLength) || parsedLength < 0) {
        return NextResponse.json({ error: "Invalid Content-Length." }, { status: 400 })
      }
      if (parsedLength > 256 * 1024) {
        return NextResponse.json({ error: "Request body too large." }, { status: 413 })
      }
    }
  }

  const unauthenticatedPolicy = getUnauthenticatedRateLimitPolicy(pathname, request.method)
  if (!user && unauthenticatedPolicy) {
    const ip = getClientIp(request)
    if (!ip) {
      return NextResponse.json(
        { error: "Unable to establish request identity." },
        { status: 503 },
      )
    }
    const unauthenticatedKey = unauthenticatedPolicy.key === "webhook:verify"
      ? `${unauthenticatedPolicy.key}:connection:${pathname.split("/").pop()}:${ip}`
      : `${unauthenticatedPolicy.key}:${ip}`
    let limit: Awaited<ReturnType<typeof checkRateLimit>>
    try {
      // Webhook verification gets both a per-connection/IP bucket and a broader
      // per-IP bucket so an attacker cannot bypass the connection bucket by
      // rotating connection IDs.
      if (unauthenticatedPolicy.key === "webhook:verify") {
        const ipLimit = await checkRateLimit(
          `${unauthenticatedPolicy.key}:ip:${ip}`,
          RATE_LIMITS.webhookIp.limit,
          RATE_LIMITS.webhookIp.windowMs,
        )
        if (!ipLimit.allowed) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429, headers: {
              "Retry-After": String(ipLimit.retryAfterSeconds),
              "X-RateLimit-Limit": String(RATE_LIMITS.webhookIp.limit),
              "X-RateLimit-Remaining": "0",
            } },
          )
        }
      }
      limit = await checkRateLimit(unauthenticatedKey, unauthenticatedPolicy.limit, unauthenticatedPolicy.windowMs)
    } catch {
      return NextResponse.json(
        { error: "Rate limiting is temporarily unavailable. Please try again later." },
        { status: 503 },
      )
    }
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "X-RateLimit-Limit": String(unauthenticatedPolicy.limit),
          "X-RateLimit-Remaining": "0",
        } },
      )
    }
  }

  if (user) {
    const policy = getRateLimitPolicy(pathname, request.method)

    if (policy) {
      const rateLimitKey = `${policy.key}:${user.id}`
      let limit: Awaited<ReturnType<typeof checkRateLimit>>
      try {
        limit = await checkRateLimit(rateLimitKey, policy.limit, policy.windowMs)
      } catch {
        return NextResponse.json(
          { error: "Rate limiting is temporarily unavailable. Please try again later." },
          { status: 503 },
        )
      }
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(limit.retryAfterSeconds),
              "X-RateLimit-Limit": String(policy.limit),
              "X-RateLimit-Remaining": "0",
            },
          },
        )
      }
      response.headers.set("X-RateLimit-Limit", String(policy.limit))
      response.headers.set("X-RateLimit-Remaining", String(limit.remaining))
    }

    if (requiresPrivilegedMfa(pathname, request.method)) {
      try {
        await requirePrivilegedMfa(supabase, user.id)
      } catch (error) {
        if (isPrivilegedMfaRequiredError(error)) {
          return NextResponse.json(
            { error: "Additional authentication is required for this action." },
            { status: 403 },
          )
        }
        console.error("Privileged authorization lookup failed:", error)
        return NextResponse.json(
          { error: "Execution authorization is temporarily unavailable." },
          { status: 503 },
        )
      }
    }
  }

  response.headers.set("Content-Security-Policy", policy)

  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth")
  // The application route group is private by default. Only the landing page and
  // explicit authentication routes are public; new app pages cannot silently
  // become unauthenticated by forgetting to update a deny-list.
  const isPublicPage = pathname === "/" || isAuthPage
  const isProtectedPage = !pathname.startsWith("/api/") && !isPublicPage

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set("Content-Security-Policy", policy)
    return redirectResponse
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/overview"
    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.headers.set("Content-Security-Policy", policy)
    return redirectResponse
  }

  return response
}

type RateLimitPolicy = {
  key: string
  limit: number
  windowMs: number
}

// These limits protect authenticated operations with meaningful compute, external side effects,
// credential access, or governance impact. Limits are enforced by the distributed
// database-backed limiter in lib/security/rate-limit.ts.
export function getRateLimitPolicy(pathname: string, method: string): RateLimitPolicy | null {
  if (method !== "POST" && method !== "PATCH" && method !== "DELETE") return null

  if (pathname === "/api/test-mcp") {
    return { key: "test-mcp:user", limit: RATE_LIMITS.authenticatedTestMcp.limit, windowMs: RATE_LIMITS.authenticatedTestMcp.windowMs }
  }
  if (pathname === "/api/execute") {
    return { key: "execute", limit: RATE_LIMITS.execute.limit, windowMs: RATE_LIMITS.execute.windowMs }
  }
  if (pathname === "/api/connectors/execute") {
    return { key: "connectors:execute", limit: RATE_LIMITS.connectorExecute.limit, windowMs: RATE_LIMITS.connectorExecute.windowMs }
  }
  if (pathname === "/api/tasks/execute" || /^\/api\/tasks\/[^/]+\/execute$/.test(pathname)) {
    return { key: "tasks:execute", limit: RATE_LIMITS.taskExecute.limit, windowMs: RATE_LIMITS.taskExecute.windowMs }
  }
  if (pathname === "/api/agents/credentials") {
    return { key: "agents:credentials", limit: RATE_LIMITS.credentials.limit, windowMs: RATE_LIMITS.credentials.windowMs }
  }
  if (pathname === "/api/agents") {
    return { key: "agents:write", limit: RATE_LIMITS.agents.limit, windowMs: RATE_LIMITS.agents.windowMs }
  }
  if (pathname === "/api/agents/connections") {
    return { key: "agents:connections", limit: RATE_LIMITS.connections.limit, windowMs: RATE_LIMITS.connections.windowMs }
  }
  if (pathname === "/api/agentmail/send") {
    return { key: "agentmail:send", limit: RATE_LIMITS.agentmail.limit, windowMs: RATE_LIMITS.agentmail.windowMs }
  }
  if (pathname === "/api/governance/action") {
    return { key: "governance:action", limit: RATE_LIMITS.governanceAction.limit, windowMs: RATE_LIMITS.governanceAction.windowMs }
  }
  if (pathname === "/api/approvals" || /^\/api\/approvals\/[^/]+\/(?:resolve|resume)$/.test(pathname)) {
    return { key: "approvals:write", limit: RATE_LIMITS.approvals.limit, windowMs: RATE_LIMITS.approvals.windowMs }
  }
  if (pathname === "/api/discovery/scans") {
    return { key: "discovery:scans", limit: RATE_LIMITS.discoveryScans.limit, windowMs: RATE_LIMITS.discoveryScans.windowMs }
  }
  if (pathname === "/api/discovery/sources") {
    return { key: "discovery:sources", limit: RATE_LIMITS.discoverySources.limit, windowMs: RATE_LIMITS.discoverySources.windowMs }
  }
  if (pathname === "/api/discovery/review") {
    return { key: "discovery:review", limit: RATE_LIMITS.discoveryReview.limit, windowMs: RATE_LIMITS.discoveryReview.windowMs }
  }
  if (pathname === "/api/governance/evaluate") {
    return { key: "governance:evaluate", limit: RATE_LIMITS.governanceEvaluate.limit, windowMs: RATE_LIMITS.governanceEvaluate.windowMs }
  }
  if (pathname === "/api/governance/policies/create") {
    return { key: "governance:policies:create", limit: RATE_LIMITS.governancePolicyCreate.limit, windowMs: RATE_LIMITS.governancePolicyCreate.windowMs }
  }
  if (pathname === "/api/governance/rules/create") {
    return { key: "governance:rules:create", limit: RATE_LIMITS.governanceRuleCreate.limit, windowMs: RATE_LIMITS.governanceRuleCreate.windowMs }
  }
  if (pathname === "/api/tasks/create") {
    return { key: "tasks:create", limit: RATE_LIMITS.tasksCreate.limit, windowMs: RATE_LIMITS.tasksCreate.windowMs }
  }

  // Existing protected endpoints and limits are preserved.
  if (pathname.startsWith("/api/discovery/mcp")) {
    return { key: "discovery:mcp", limit: RATE_LIMITS.discoveryMcp.limit, windowMs: RATE_LIMITS.discoveryMcp.windowMs }
  }
  if (pathname.startsWith("/api/discovery/run")) {
    return { key: "discovery:run", limit: RATE_LIMITS.discoveryRun.limit, windowMs: RATE_LIMITS.discoveryRun.windowMs }
  }
  if (pathname.startsWith("/api/agents/verify")) {
    return { key: "agents:verify", limit: RATE_LIMITS.agentsVerify.limit, windowMs: RATE_LIMITS.agentsVerify.windowMs }
  }

  return null
}

export function getUnauthenticatedRateLimitPolicy(pathname: string, method: string): RateLimitPolicy | null {
  if (pathname === "/api/test-mcp" && method === "GET") {
    return { key: "test-mcp", limit: RATE_LIMITS.publicTestMcp.limit, windowMs: RATE_LIMITS.publicTestMcp.windowMs }
  }
  if (method !== "POST") return null
  if (pathname === "/api/auth/login") {
    return { key: "auth:login:ip", limit: RATE_LIMITS.loginIp.limit, windowMs: RATE_LIMITS.loginIp.windowMs }
  }
  if (pathname === "/api/test-mcp") {
    return { key: "test-mcp", limit: RATE_LIMITS.authenticatedTestMcp.limit, windowMs: RATE_LIMITS.authenticatedTestMcp.windowMs }
  }
  if (/^\/api\/webhooks\/verify\/[^/]+$/.test(pathname)) {
    return { key: "webhook:verify", limit: RATE_LIMITS.webhookConnectionIp.limit, windowMs: RATE_LIMITS.webhookConnectionIp.windowMs }
  }
  return null
}

function requiresPrivilegedMfa(pathname: string, method: string): boolean {
  if (method !== "POST" && method !== "PATCH" && method !== "DELETE") return false
  return (
    pathname === "/api/execute" ||
    pathname === "/api/connectors/execute" ||
    pathname === "/api/tasks/execute" ||
    /^\/api\/tasks\/[^/]+\/execute$/.test(pathname) ||
    pathname === "/api/agentmail/send" ||
    pathname === "/api/agents/credentials" ||
    pathname === "/api/approvals" ||
    /^\/api\/approvals\/[^/]+\/(?:resolve|resume)$/.test(pathname) ||
    pathname === "/api/governance/action" ||
    pathname === "/api/governance/rules/create" ||
    pathname === "/api/governance/policies/create" ||
    pathname === "/api/agents" ||
    pathname === "/api/agents/connections" ||
    pathname === "/api/discovery/review" ||
    pathname === "/api/discovery/mcp"
  )
}

export async function proxy(request: NextRequest) { return updateSession(request) }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
