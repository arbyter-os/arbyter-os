import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260921260000_harden_discovery_findings_rls.sql"),
  "utf8",
);
const processFinding = fs.readFileSync(
  path.join(root, "lib/discovery/process-finding.ts"),
  "utf8",
);
const reviewRoute = fs.readFileSync(
  path.join(root, "app/api/discovery/review/route.ts"),
  "utf8",
);

test("discovery_findings RLS is enabled and client privileges are reduced to authenticated SELECT", () => {
  assert.match(migration, /alter table public\.discovery_findings enable row level security/i);
  assert.match(migration, /revoke all on table public\.discovery_findings from anon, authenticated/i);
  assert.match(migration, /grant select on table public\.discovery_findings to authenticated/i);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete|all)/i);
});

test("discovery_findings has no authenticated mutation policies", () => {
  assert.doesNotMatch(migration, /for (?:insert|update|delete)\s+to\s+authenticated/i);
  assert.match(migration, /create policy[\s\S]*for select/i);
  assert.match(migration, /organization_id = public\.get_user_organization_id\(\)/i);
});

test("anonymous access is not granted", () => {
  assert.match(migration, /revoke all on table public\.discovery_findings from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant .* to anon/i);
});

test("discovery scanner findings are persisted through the service-role client", () => {
  assert.match(processFinding, /import \{ createAdminClient \} from "@\/lib\/supabase\/admin"/);
  assert.match(processFinding, /const supabase = createAdminClient\(\)/);
  assert.match(processFinding, /\.from\("discovery_findings"\)\s*\n\s*\.insert\(/);
});

test("admin review writes use the service-role client while session checks remain route-level", () => {
  assert.match(reviewRoute, /createAdminClient/);
  assert.match(reviewRoute, /profile\.role !== "owner" && profile\.role !== "admin"/);
  assert.match(reviewRoute, /\.eq\("organization_id", organizationId\)/);
  assert.match(reviewRoute, /const findingWriter = createAdminClient\(\)/);
  assert.match(reviewRoute, /findingWriter[\s\S]*?\.from\("discovery_findings"\)[\s\S]*?\.update\(/);
});

test("protected server-controlled finding fields are not exposed as client-write policy", () => {
  for (const field of [
    "review_status",
    "onboarding_status",
    "onboarded_agent_id",
    "classification",
    "confidence",
    "endpoint",
    "scan_id",
    "source_id",
    "organization_id",
  ]) {
    assert.doesNotMatch(migration, new RegExp(`for\s+update[\s\S]{0,500}${field}`, "i"));
    assert.doesNotMatch(migration, new RegExp(`for\s+insert[\s\S]{0,500}${field}`, "i"));
  }
});
