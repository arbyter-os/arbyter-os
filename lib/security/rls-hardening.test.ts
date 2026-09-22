import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  hasAdminGuard,
  hasOrgGuard,
  isUnrestricted,
  parseMigration,
  policiesFor,
  type ParsedPolicy,
} from "./rls-policy-parser.ts";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

function indexOf(source: string, needle: string | RegExp, label: string): number {
  const index =
    typeof needle === "string" ? source.indexOf(needle) : source.search(needle);
  assert.notEqual(index, -1, `${label} not found`);
  return index;
}

const HARDENING = parseMigration(
  read("supabase/migrations/20260920190000_harden_sensitive_rls.sql"),
);
const SECOND_PASS = parseMigration(
  read("supabase/migrations/20260920200000_harden_identity_decision_discovery_rls.sql"),
);

const THIRD_PASS = parseMigration(
  read("supabase/migrations/20260920210000_restrict_secret_bearing_select.sql"),
);

const ALL_POLICIES: ParsedPolicy[] = [
  ...HARDENING.policies,
  ...SECOND_PASS.policies,
  ...THIRD_PASS.policies,
];

// Tables whose INSERT/UPDATE/DELETE must require owner/admin AND org match.
const ADMIN_WRITE_TABLES = [
  "agent_connections",
  "agent_credentials",
  "agent_capabilities",
  "agent_environments",
  "agent_permissions",
  "agent_tools",
  "agent_versions",
  "agent_webhooks",
  "agent_endpoints",
  "ai_agents",
  "agent_identities",
  "discovery_sources",
];

test("the SECURITY DEFINER helper pins an empty search_path", () => {
  const helper = HARDENING.functions.find(
    (fn) => fn.name === "is_current_user_org_admin",
  );
  if (!helper) throw new Error("is_current_user_org_admin must be defined");
  assert.equal(helper.securityDefiner, true);
  assert.equal(
    helper.searchPath,
    "",
    "search_path must be '' so operators cannot be resolved from a writable schema",
  );
});

test("every parsed policy is scoped to the authenticated role only", () => {
  for (const policy of ALL_POLICIES) {
    assert.deepEqual(
      policy.roles,
      ["authenticated"],
      `${policy.table}.${policy.command} "${policy.name}" must target authenticated only`,
    );
  }
});

test("no policy has a trivially satisfiable USING or WITH CHECK", () => {
  for (const policy of ALL_POLICIES) {
    assert.equal(
      isUnrestricted(policy.using),
      false,
      `${policy.table}.${policy.command} "${policy.name}" has USING (true)`,
    );
    assert.equal(
      isUnrestricted(policy.withCheck),
      false,
      `${policy.table}.${policy.command} "${policy.name}" has WITH CHECK (true)`,
    );
  }
});

test("agent_credentials, agent_webhooks, discovery_sources SELECT is owner/admin only", () => {
  for (const table of ["agent_credentials", "agent_webhooks", "discovery_sources"]) {
    const selects = policiesFor({ ...HARDENING, policies: ALL_POLICIES }, table, "select");
    assert.equal(
      selects.length,
      1,
      `${table} must have exactly one SELECT policy after the third pass`,
    );
    const policy = selects[0];
    assert.ok(
      hasAdminGuard(policy.using) && hasOrgGuard(policy.using),
      `${table} SELECT must require owner/admin and org match; ordinary members must not read secret_reference/credential_reference/endpoint_url`,
    );
  }
});

// ---------------------------------------------------------------------------
// Scenario matrix.
//
// No live Postgres is available in this environment (no psql/pg_ctl, no
// network egress), so this is NOT SQL execution against real rows. It is a
// symbolic evaluation of each policy's extracted USING/WITH CHECK predicate
// against four callers, using the same admin-guard/org-guard detectors the
// earlier tests use to catch mutants. It answers "does this policy's
// predicate structurally require both an admin role and an org match", which
// is what determines the outcome for these four scenarios given how every
// policy in this codebase is written (organization_id equality against the
// caller's own row, optionally ANDed with is_current_user_org_admin()). It
// would not catch a bug in operator semantics (e.g. a stray OR) inside a
// clause that both detectors otherwise match — this is a static-analysis
// check, not proof of runtime behavior.
// ---------------------------------------------------------------------------

type Scenario = "member-same-org" | "member-cross-org" | "admin-same-org" | "admin-cross-org";

function decide(policy: ParsedPolicy, command: "insert" | "update" | "delete", scenario: Scenario): boolean {
  const expr = command === "insert" ? policy.withCheck : policy.using;
  const requiresAdmin = hasAdminGuard(expr);
  const requiresOrgMatch = hasOrgGuard(expr);
  const isAdmin = scenario.startsWith("admin");
  const sameOrg = scenario.endsWith("same-org");
  if (requiresAdmin && !isAdmin) return false;
  if (requiresOrgMatch && !sameOrg) return false;
  return true;
}

test("scenario matrix: admin-write tables deny every member scenario and cross-org admin", () => {
  const scenarios: Scenario[] = [
    "member-same-org",
    "member-cross-org",
    "admin-same-org",
    "admin-cross-org",
  ];
  for (const table of ADMIN_WRITE_TABLES) {
    for (const command of ["insert", "update", "delete"] as const) {
      const policy = policiesFor({ ...HARDENING, policies: ALL_POLICIES }, table, command)[0];
      if (!policy) continue; // agent_deployments has no delete policy; covered separately
      for (const scenario of scenarios) {
        const allowed = decide(policy, command, scenario);
        if (scenario === "admin-same-org") {
          assert.equal(allowed, true, `${table}.${command}: admin-same-org must be permitted`);
        } else {
          assert.equal(allowed, false, `${table}.${command}: ${scenario} must be denied`);
        }
      }
    }
  }
});

test("scenario matrix: agent_decisions lets a same-org member insert only unapproved rows", () => {
  const insert = policiesFor({ ...SECOND_PASS, policies: ALL_POLICIES }, "agent_decisions", "insert")[0];
  assert.ok(insert);
  // The org guard is present but the admin guard is deliberately absent from
  // the top-level AND (it appears only inside the OR branch), so the generic
  // decide() helper (which treats the admin guard as a hard AND) understates
  // member access here. Assert the actual OR-shaped predicate directly.
  const check = insert.withCheck ?? "";
  assert.ok(hasOrgGuard(check), "INSERT must still require organization_id match");
  assert.match(check, /is_current_user_org_admin\(\)\s*\n?\s*or/i, "admin bypass must be an OR, not the only path");
  assert.match(check, /approved,\s*false\)\s*=\s*false/i, "member path must require approved = false");
  assert.match(check, /approved_by\s+is\s+null/i, "member path must forbid setting approved_by");
});

test("admin-write tables gate INSERT, UPDATE and DELETE on owner/admin plus org", () => {
  for (const table of ADMIN_WRITE_TABLES) {
    for (const command of ["insert", "update", "delete"] as const) {
      const matches = policiesFor(
        { ...HARDENING, policies: ALL_POLICIES },
        table,
        command,
      );
      assert.equal(
        matches.length,
        1,
        `${table} must have exactly one ${command} policy, found ${matches.length}`,
      );
      const policy = matches[0];

      if (command === "insert") {
        assert.equal(policy.using, null, `${table} INSERT must not define USING`);
        assert.ok(
          hasAdminGuard(policy.withCheck),
          `${table} INSERT WITH CHECK must call is_current_user_org_admin()`,
        );
        assert.ok(
          hasOrgGuard(policy.withCheck),
          `${table} INSERT WITH CHECK must bind organization_id`,
        );
        continue;
      }

      assert.ok(
        hasAdminGuard(policy.using) && hasOrgGuard(policy.using),
        `${table} ${command} USING must require owner/admin and org match`,
      );

      if (command === "update") {
        assert.ok(
          hasAdminGuard(policy.withCheck) && hasOrgGuard(policy.withCheck),
          `${table} UPDATE must also constrain WITH CHECK, or rows can be moved cross-org`,
        );
      } else {
        assert.equal(
          policy.withCheck,
          null,
          `${table} DELETE must not define WITH CHECK`,
        );
      }
    }
  }
});

test("agent_deployments is append-only: no authenticated DELETE policy is created", () => {
  assert.equal(
    policiesFor({ ...HARDENING, policies: ALL_POLICIES }, "agent_deployments", "delete")
      .length,
    0,
    "adding a DELETE policy would grant deletion of deployment history",
  );
  // ...and the migration explicitly drops any legacy one rather than ignoring it.
  assert.ok(
    HARDENING.dropped.some(
      (d) =>
        d.table === "agent_deployments" && /delete/i.test(d.name),
    ),
    "the migration must explicitly drop a legacy agent_deployments delete policy",
  );
  for (const command of ["insert", "update"] as const) {
    const policy = policiesFor(
      { ...HARDENING, policies: ALL_POLICIES },
      "agent_deployments",
      command,
    )[0];
    assert.ok(policy, `agent_deployments ${command} policy missing`);
    const guarded = command === "insert" ? policy.withCheck : policy.using;
    assert.ok(hasAdminGuard(guarded) && hasOrgGuard(guarded));
  }
});

test("ai_agents UPDATE is owner/admin only (disclosed capability, not a member grant)", () => {
  const update = policiesFor(
    { ...HARDENING, policies: ALL_POLICIES },
    "ai_agents",
    "update",
  )[0];
  assert.ok(update, "ai_agents UPDATE policy is required by governance pause_agent");
  assert.ok(hasAdminGuard(update.using) && hasAdminGuard(update.withCheck));
});

test("agent_decisions: members may record, but may not approve", () => {
  const insert = policiesFor(
    { ...SECOND_PASS, policies: ALL_POLICIES },
    "agent_decisions",
    "insert",
  )[0];
  assert.ok(insert, "agent_decisions INSERT policy missing");
  assert.ok(hasOrgGuard(insert.withCheck));
  assert.match(
    insert.withCheck ?? "",
    /approved/i,
    "member INSERT must constrain the approved flag",
  );
  assert.match(
    insert.withCheck ?? "",
    /approved_by\s+is\s+null/i,
    "member INSERT must forbid setting approved_by",
  );

  const update = policiesFor(
    { ...SECOND_PASS, policies: ALL_POLICIES },
    "agent_decisions",
    "update",
  )[0];
  assert.ok(update, "agent_decisions UPDATE policy missing");
  assert.ok(
    hasAdminGuard(update.using) && hasAdminGuard(update.withCheck),
    "flipping approved must require owner/admin",
  );

  assert.equal(
    policiesFor({ ...SECOND_PASS, policies: ALL_POLICIES }, "agent_decisions", "delete")
      .length,
    0,
    "agent_decisions is an audit trail; DELETE must stay denied",
  );
});

test("agents/verify does not self-reference validationError on an invalid endpoint", () => {
  const source = read("app/api/agents/verify/route.ts");

  assert.doesNotMatch(
    source,
    /const validationError = validationError;/,
    "self-referencing const is a ReferenceError (temporal dead zone) at runtime",
  );
  assert.match(
    source,
    /const validationError = endpointValidation\.error;/,
    "must read the actual validation failure reason from endpointValidation.error",
  );

  // The four downstream uses (health check row, connection event, and the
  // two response bodies) must consume the corrected binding.
  const usages = [...source.matchAll(/\bvalidationError\b/g)].length;
  assert.ok(usages >= 4, "expected the declaration plus at least 3 downstream uses");
});

test("discovery scan runner reads discovery_sources via the service-role client, scoped to scan_id and organization_id", () => {
  const source = read("lib/discovery/run-scan.ts");

  assert.match(source, /import \{ createAdminClient \} from "@\/lib\/supabase\/admin";/);

  const adminInit = indexOf(source, "const admin = createAdminClient();", "admin client init");
  const joinRead = indexOf(source, "discovery_sources (*)", "discovery_sources join");
  assert.ok(
    adminInit < joinRead,
    "the discovery_sources join must use the admin client, not the user-scoped one",
  );

  // The read must stay scoped even though RLS is bypassed.
  const readBlockEnd = source.indexOf(");", joinRead) + 2;
  const readBlock = source.slice(joinRead, readBlockEnd);
  assert.match(readBlock, /\.eq\("scan_id", scanId\)/);
  assert.match(
    readBlock,
    /\.eq\("organization_id", organizationId\)/,
    "defense in depth: the admin client bypasses RLS, so the org filter must be explicit",
  );

  // Every other operation in the file must remain on the user-scoped client
  // (updateScan/updateScanSource/failScan all take `supabase` as a parameter);
  // only the one elevated read should exist.
  const adminUseCount = [...source.matchAll(/\badmin\s*\n?\s*\.from\(/g)].length;
  assert.equal(
    adminUseCount,
    1,
    "only the discovery_sources join should use the service-role client",
  );
});

test("app/api/discovery/run authorizes the caller before invoking the elevated read", () => {
  const source = read("app/api/discovery/run/route.ts");
  const authCheck = indexOf(
    source,
    /scan\.requested_by !== user\.id/,
    "requester check",
  );
  const invoke = indexOf(source, "runDiscoveryScan(scanId", "runDiscoveryScan call");
  assert.ok(
    authCheck < invoke,
    "the route must authorize the caller against this scan before the admin-client read inside runDiscoveryScan runs",
  );
});
test("legacy permissive write policies are explicitly dropped", () => {
  const allDropped = [...HARDENING.dropped, ...SECOND_PASS.dropped];
  const required: [string, RegExp][] = [
    ["agent_identities", /create|update|delete/i],
    ["discovery_sources", /create|update|delete/i],
    ["agent_decisions", /create|update/i],
  ];
  for (const [table, pattern] of required) {
    const drops = allDropped.filter(
      (d) => d.table === table && pattern.test(d.name),
    );
    assert.ok(
      drops.length >= 2,
      `${table} must drop its legacy member-write policies, found ${drops.length}`,
    );
  }
});

test("SELECT policies are unmodified except the three disclosed secret-bearing tables", () => {
  const DISCLOSED_SELECT_RESTRICTIONS = new Set([
    "agent_credentials",
    "agent_webhooks",
    "discovery_sources",
  ]);
  for (const policy of ALL_POLICIES) {
    if (policy.command !== "select") continue;
    assert.ok(
      DISCLOSED_SELECT_RESTRICTIONS.has(policy.table),
      `${policy.table}: SELECT was redefined ("${policy.name}") without being in the disclosed list`,
    );
  }
  // And every disclosed table actually has its restriction.
  for (const table of DISCLOSED_SELECT_RESTRICTIONS) {
    assert.equal(
      policiesFor({ ...HARDENING, policies: ALL_POLICIES }, table, "select").length,
      1,
    );
  }
});

test("the hardening migrations never grant client writes to users or organizations", () => {
  for (const policy of ALL_POLICIES) {
    assert.ok(
      !["users", "organizations"].includes(policy.table),
      `policy "${policy.name}" must not target ${policy.table}`,
    );
  }
});
