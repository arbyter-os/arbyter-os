import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/security/rate-limit"

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("X-DNS-Prefetch-Control", "off")
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  return origin === request.nextUrl.origin
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-arbyter-pathname", pathname)

  if (process.env.NODE_ENV === "production" && request.nextUrl.protocol !== "https:") {
    const url = request.nextUrl.clone()
    url.protocol = "https:"
    return NextResponse.redirect(url, 308)
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  if (MUTATING_METHODS.has(request.method) && pathname.startsWith("/api/") && !isAllowedOrigin(request)) {
    const blocked = NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 })
    applySecurityHeaders(blocked)
    return blocked
  }

  if (user && MUTATING_METHODS.has(request.method)) {
    let rateLimitKey: string | null = null
    if (pathname.startsWith("/api/discovery/mcp")) rateLimitKey = `discovery:mcp:${user.id}`
    else if (pathname.startsWith("/api/discovery/run")) rateLimitKey = `discovery:run:${user.id}`
    else if (pathname.startsWith("/api/agents/verify")) rateLimitKey = `agents:verify:${user.id}`
    else if (pathname === "/api/execute") rateLimitKey = `execute:${user.id}`

    if (rateLimitKey) {
      const limitValue = pathname === "/api/execute" ? 30 : 10
      const limit = checkRateLimit(rateLimitKey, limitValue, 60_000)
      if (!limit.allowed) {
        const limited = NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "X-RateLimit-Limit": String(limitValue), "X-RateLimit-Remaining": "0" } }
        )
        applySecurityHeaders(limited)
        return limited
      }
      response.headers.set("X-RateLimit-Limit", String(limitValue))
      response.headers.set("X-RateLimit-Remaining", String(limit.remaining))
    }
  }

  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth")
  const isProtectedPage = pathname.startsWith("/overview") || pathname.startsWith("/risks") || pathname.startsWith("/compliance") || pathname.startsWith("/investigate") || pathname.startsWith("/audit") || pathname.startsWith("/governance") || pathname.startsWith("/agents") || pathname.startsWith("/tasks") || pathname.startsWith("/policies") || pathname.startsWith("/controls") || pathname.startsWith("/insights") || pathname.startsWith("/reports") || pathname.startsWith("/settings") || pathname.startsWith("/help") || pathname.startsWith("/chat") || pathname.startsWith("/approvals")

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const redirect = NextResponse.redirect(url)
    applySecurityHeaders(redirect)
    return redirect
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/overview"
    const redirect = NextResponse.redirect(url)
    applySecurityHeaders(redirect)
    return redirect
  }

  applySecurityHeaders(response)
  return response
}

export async function proxy(request: NextRequest) { return updateSession(request) }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
