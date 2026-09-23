import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseMigration, policiesFor } from "./rls-policy-parser.ts";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const migrationSource = read(
  "supabase/migrations/20260921250000_harden_execution_audit_rls.sql",
);
const migration = parseMigration(migrationSource);

const TABLES = [
  "agent_executions",
  "execution_steps",
  "agent_events",
  "agent_activity",
  "agent_health_checks",
  "agent_connection_events",
] as const;

const WRITE_COMMANDS = ["insert", "update", "delete"] as const;

function selectPolicy(table: string) {
  const matches = policiesFor(migration, table, "select");
  assert.equal(matches.length, 1, `${table} must have exactly one SELECT policy`);
  return matches[0];
}

test("all execution/audit tables explicitly enable RLS and remove legacy policies", () => {
  for (const table of TABLES) {
    assert.match(
      migrationSource,
      new RegExp(
        `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
        "i",
      ),
      `${table} must explicitly enable RLS`,
    );
  }

  assert.match(
    migrationSource,
    /from\s+pg_policies[\s\S]*tablename\s+in\s*\(/i,
    "migration must remove legacy policies without relying on unknown policy names",
  );
});

test("authenticated clients have no INSERT, UPDATE, or DELETE policies on server-controlled records", () => {
  for (const table of TABLES) {
    for (const command of WRITE_COMMANDS) {
      assert.equal(
        policiesFor(migration, table, command).length,
        0,
        `${table} must have no authenticated ${command.toUpperCase()} policy`,
      );
    }
  }
});

test("execution/audit SELECT policies are authenticated and organization-scoped", () => {
  for (const table of TABLES) {
    const policy = selectPolicy(table);
    assert.deepEqual(policy.roles, ["authenticated"], `${table} SELECT must be authenticated-only`);
    assert.match(
      policy.using ?? "",
      /organization_id\s*=\s*public\.get_user_organization_id\(\)/i,
      `${table} SELECT must use the existing organization helper`,
    );
  }
});

test("client table privileges are reduced to SELECT so RLS cannot be bypassed by TRUNCATE or direct DML", () => {
  for (const table of TABLES) {
    assert.match(
      migrationSource,
      new RegExp(`public\\.${table}`, "i"),
      `${table} must be included in the privilege hardening`,
    );
  }
  assert.match(
    migrationSource,
    /revoke\s+all\s+on\s+table[\s\S]*from\s+anon,\s*authenticated/i,
    "client roles must lose direct table write privileges",
  );
  assert.match(
    migrationSource,
    /grant\s+select\s+on\s+table[\s\S]*to\s+authenticated/i,
    "authenticated clients must retain read privilege",
  );
});

test("server execution/audit writers use the existing service-role client", () => {
  const sources = [
    ["lib/execution/engine.ts", /const\s+executionWriter\s*=\s*createAdminClient\(\)/],
    ["lib/execution/audit.ts", /const\s+supabase\s*=\s*createAdminClient\(\)/],
    ["app/api/approvals/[approvalId]/resolve/route.ts", /const\s+executionWriter\s*=\s*createAdminClient\(\)/],
    ["app/api/approvals/[approvalId]/resume/route.ts", /const\s+executionWriter\s*=\s*createAdminClient\(\)/],
    ["app/api/agents/connections/route.ts", /createAdminClient\(\)\.from\("agent_connection_events"\)/g],
    ["app/api/agents/verify/route.ts", /createAdminClient\(\)[\s\S]{0,80}\.from\("(?:agent_health_checks|agent_connection_events)"\)/g],
    ["app/api/webhooks/verify/[connectionId]/route.ts", /admin\s*=\s*createAdminClient\(\)/],
  ] as const;

  for (const [file, pattern] of sources) {
    const source = read(file);
    assert.match(source, pattern, `${file} must use the existing service-role writer`);
  }
});

test("execution engine has no authenticated-client write path for agent_executions", () => {
  const source = read("lib/execution/engine.ts");
  assert.doesNotMatch(
    source,
    /const\s+supabase[\s\S]{0,400}\.from\("agent_executions"\)\s*\.(?:insert|update|delete)/,
    "execution engine must not write agent_executions through the session client",
  );
});

test("connection-event server writes use the correct organization-scoped column", () => {
  const source = read("app/api/agents/connections/route.ts");
  assert.doesNotMatch(source, /\.from\("agent_connection_events"\)[\s\S]{0,300}\bconnection_id\s*:/);
  assert.match(source, /agent_connection_id:\s*data\.id/);
  assert.match(source, /agent_connection_id:\s*connectionId/);
});
