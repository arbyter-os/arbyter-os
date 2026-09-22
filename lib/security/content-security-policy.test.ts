import test from "node:test"
import assert from "node:assert/strict"
import { createContentSecurityPolicy } from "./content-security-policy.ts"

test("CSP uses a per-request nonce and does not allow inline scripts", () => {
  const first = createContentSecurityPolicy()
  const second = createContentSecurityPolicy()

  assert.notEqual(first.nonce, second.nonce)
  assert.ok(first.policy.includes(`script-src 'self' 'nonce-${first.nonce}'`))
  assert.ok(!first.policy.split("; ").some((directive) => directive.startsWith("script-src ") && directive.includes("unsafe-inline")))
  assert.doesNotMatch(first.policy, /unsafe-eval/)
  assert.match(first.policy, /style-src 'self' 'nonce-/)
  assert.match(first.policy, /style-src-attr 'unsafe-inline'/)
})

test("CSP keeps required application connection and worker sources", () => {
  const { policy } = createContentSecurityPolicy()

  assert.match(policy, /https:\/\/\*\.supabase\.co/)
  assert.match(policy, /wss:\/\/\*\.supabase\.co/)
  assert.match(policy, /https:\/\/\*\.vercel-insights\.com/)
  assert.match(policy, /worker-src 'self' blob:/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /frame-ancestors 'self'/)
  assert.doesNotMatch(policy, /img-src[^;]*https:/)
})
