import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRateLimit } from "@/lib/security/rate-limit"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (user && request.method === "POST") {
    let rateLimitKey: string | null = null
    if (pathname.startsWith("/api/discovery/mcp")) rateLimitKey = `discovery:mcp:${user.id}`
    else if (pathname.startsWith("/api/discovery/run")) rateLimitKey = `discovery:run:${user.id}`
    else if (pathname.startsWith("/api/agents/verify")) rateLimitKey = `agents:verify:${user.id}`
    else if (pathname === "/api/execute") rateLimitKey = `execute:${user.id}`

    if (rateLimitKey) {
      const limitValue = pathname === "/api/execute" ? 30 : 10
      const limit = checkRateLimit(rateLimitKey, limitValue, 60_000)
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "X-RateLimit-Limit": String(limitValue), "X-RateLimit-Remaining": "0" } }
        )
      }
      response.headers.set("X-RateLimit-Limit", String(limitValue))
      response.headers.set("X-RateLimit-Remaining", String(limit.remaining))
    }
  }

  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth")
  const isProtectedPage = pathname.startsWith("/overview") || pathname.startsWith("/risks") || pathname.startsWith("/compliance") || pathname.startsWith("/investigate") || pathname.startsWith("/audit") || pathname.startsWith("/governance") || pathname.startsWith("/agents") || pathname.startsWith("/tasks") || pathname.startsWith("/policies") || pathname.startsWith("/controls") || pathname.startsWith("/insights") || pathname.startsWith("/reports") || pathname.startsWith("/settings")

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/overview"
    return NextResponse.redirect(url)
  }

  return response
}

export async function proxy(request: NextRequest) { return updateSession(request) }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
