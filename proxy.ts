import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/auth")

  const isProtectedPage =
    pathname.startsWith("/overview") ||
    pathname.startsWith("/risks") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/investigate") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/governance") ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/policies") ||
    pathname.startsWith("/controls") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings")

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

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}