import { randomBytes } from "node:crypto"

export function createContentSecurityPolicy(): { nonce: string; policy: string } {
  const nonce = randomBytes(16).toString("base64")
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://*.vercel-insights.com",
    "https://vitals.vercel-insights.com",
  ].join(" ")

  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources}`,
    "frame-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ].join("; ")

  return { nonce, policy }
}
