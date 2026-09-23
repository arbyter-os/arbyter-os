import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("privileged RLS helper requires AAL2 for owner/admin access", () => {
  const source = read("supabase/migrations/20260921230000_require_aal2_for_privileged_rls.sql")
  assert.match(source, /u\.role = any \(array\['owner'::text, 'admin'::text\]\)/)
  assert.match(source, /coalesce\(auth\.jwt\(\)->>'aal', 'aal1'\) = 'aal2'/)
})

test("login performs a post-password MFA factor check", () => {
  const source = read("app/api/auth/login/route.ts")
  assert.match(source, /signInWithPassword/)
  assert.match(source, /mfa\.listFactors\(\)/)
  assert.match(source, /mfaRequired: hasVerifiedTotp/)
})

test("execution governance ignores caller-supplied jurisdictional context", () => {
  const source = read("lib/execution/engine.ts")
  assert.match(source, /Caller-supplied jurisdiction\/sector\/country\/state/)
  assert.match(source, /connection\.environment/)
  assert.doesNotMatch(source, /environment: input\.environment,\s*country: input\.country,\s*state: input\.state,\s*jurisdiction: input\.jurisdiction,\s*sector: input\.sector/)
})

test("AgentMail uses the governed execution pipeline", () => {
  const source = read("app/api/agentmail/send/route.ts")
  assert.match(source, /executeAgentTask/)
  assert.match(source, /requestedCapability: "messages\.send"/)
  assert.match(source, /approval: "approval" in result \? result\.approval : undefined/)
  assert.doesNotMatch(source, /executeConnectorAction/)
})
