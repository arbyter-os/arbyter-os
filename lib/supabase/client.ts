import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if ((!url || !publishableKey) && typeof window !== "undefined") {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    )
  }

  return createBrowserClient(
    // Client components are rendered while statically generating pages. Use
    // inert values there so a missing local configuration does not break the
    // build; browser calls still fail fast with the actionable error above.
    url ?? "https://build-placeholder.invalid",
    publishableKey ?? "build-placeholder-key"
  )
}
