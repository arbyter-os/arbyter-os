type SupabaseConfig = {
  url: string
  publishableKey: string
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured.")
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Supabase URL is invalid.")
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Supabase URL must use HTTPS.")
  }

  return { url: parsed.origin, publishableKey }
}

export function getSupabaseAdminConfig(): SupabaseConfig & { secretKey: string } {
  const { url, publishableKey } = getSupabaseConfig()
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!secretKey) throw new Error("Supabase admin credentials are not configured.")
  return { url, publishableKey, secretKey }
}
