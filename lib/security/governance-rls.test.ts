import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parseMigration, policiesFor, type ParsedPolicy } from "./rls-policy-parser.ts";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const migrationSource = read(
  "supabase/migrations/20260921240000_harden_governance_rls.sql",
);
const migration = parseMigration(migrationSource);

const GOVERNANCE_TABLES = [
  "governance_policies",
  "governance_policy_rules",
  "governance_decisions",
  "policy_evaluations",
  "regulatory_requirements",
  "governance_rule_requirements",
] as const;

function policy(table: string, command: ParsedPolicy["command"]): ParsedPolicy {
  const matches = policiesFor(migration, table, command);
  assert.equal(
    matches.length,
    1,
    `${table}.${command} must have exactly one explicit authenticated policy`,
  );
  return matches[0];
}

function assertOrgGuard(expression: string | null, label: string) {
  assert.match(
    expression ?? "",
    /organization_id\s*=\s*public\.get_user_organization_id\(\)/i,
    `${label} must be organization-scoped`,
  );
}

function assertAdminAal2Guard(expression: string | null, label: string) {
  assert.match(
    expression ?? "",
    /public\.is_current_user_org_admin\(\)/i,
    `${label} must use the existing owner/admin + AAL2 helper`,
  );
  assertOrgGuard(expression, label);
}

test("all six governance tables have RLS enabled in the forward migration", () => {
  for (const table of GOVERNANCE_TABLES) {
    assert.match(
      migrationSource,
      new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i"),
      `${table} must explicitly enable RLS`,
    );
  }
});

test("governance policy definitions deny ordinary members all writes and keep writes AAL2 owner/admin + org scoped", () => {
  for (const table of ["governance_policies", "governance_policy_rules"]) {
    for (const command of ["insert", "update", "delete"] as const) {
      const p = policy(table, command);
      const expression = command === "insert" ? p.withCheck : p.using;
      assertAdminAal2Guard(expression, `${table}.${command}`);
      if (command === "update") {
        assertAdminAal2Guard(p.withCheck, `${table}.update WITH CHECK`);
      }
      assert.deepEqual(p.roles, ["authenticated"]);
    }
  }
});

test("governance policy reads are organization-scoped", () => {
  for (const table of ["governance_policies", "governance_policy_rules"]) {
    const p = policy(table, "select");
    assertOrgGuard(p.using, `${table}.select`);
    assert.deepEqual(p.roles, ["authenticated"]);
  }
});

test("members cannot directly forge governance decisions or policy evaluations", () => {
  for (const table of ["governance_decisions", "policy_evaluations"]) {
    assert.equal(
      policiesFor(migration, table, "insert").length,
      0,
      `${table} must have no authenticated INSERT policy`,
    );
    assert.equal(
      policiesFor(migration, table, "update").length,
      0,
      `${table} must have no authenticated UPDATE policy`,
    );
    assert.equal(
      policiesFor(migration, table, "delete").length,
      0,
      `${table} must have no authenticated DELETE policy`,
    );

    const select = policy(table, "select");
    assertOrgGuard(select.using, `${table}.select`);
  }
});

test("governance rule mappings are organization-scoped and client read-only", () => {
  const select = policy("governance_rule_requirements", "select");
  assertOrgGuard(select.using, "governance_rule_requirements.select");

  for (const command of ["insert", "update", "delete"] as const) {
    assert.equal(
      policiesFor(migration, "governance_rule_requirements", command).length,
      0,
      `governance_rule_requirements must have no authenticated ${command.toUpperCase()} policy`,
    );
  }
});

test("regulatory requirements remain authenticated read-only reference data", () => {
  const select = policy("regulatory_requirements", "select");
  assert.deepEqual(select.roles, ["authenticated"]);
  assert.match(select.using ?? "", /auth\.uid\(\)\s*\)\s+is\s+not\s+null/i);

  for (const command of ["insert", "update", "delete"] as const) {
    assert.equal(
      policiesFor(migration, "regulatory_requirements", command).length,
      0,
      `regulatory_requirements must have no authenticated ${command.toUpperCase()} policy`,
    );
  }
});

test("migration removes legacy policies before recreating the six-table allowlist", () => {
  const tablesWithDrops = new Set(migration.dropped.map((item) => item.table));
  for (const table of GOVERNANCE_TABLES) {
    assert.equal(
      tablesWithDrops.has(table),
      false,
      `${table} should not depend on a hard-coded legacy policy name; dynamic cleanup must cover it`,
    );
  }
  assert.match(
    migrationSource,
    /from\s+pg_policies[\s\S]*tablename\s+in\s*\(/i,
    "migration must dynamically remove unknown legacy policies on the six governance tables",
  );
});

test("governance audit persistence uses the trusted service-role client after client writes are removed", () => {
  const source = read("lib/governance/audit.ts");
  assert.match(source, /import\s+\{\s*createAdminClient\s*\}\s+from\s+"@\/lib\/supabase\/admin"/);
  assert.match(source, /const\s+supabase\s*=\s*createAdminClient\(\)/);
  assert.doesNotMatch(source, /createClient\(\)/);
});
