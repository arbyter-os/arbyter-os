import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

/** Index of the first occurrence, asserting presence. */
function indexOf(source: string, needle: string | RegExp, label: string): number {
  const index =
    typeof needle === "string" ? source.indexOf(needle) : source.search(needle);
  assert.notEqual(index, -1, `${label} not found`);
  return index;
}

test("agents/verify authorizes owner/admin before probing or writing", () => {
  const source = read("app/api/agents/verify/route.ts");

  const roleGate = indexOf(
    source,
    /role !== "owner" && \w+\.role !== "admin"/,
    "owner/admin gate",
  );
  assert.match(source, /status: 403/, "the gate must return 403, not fall through to 500");

  // The role must actually be selected, otherwise the gate reads undefined.
  assert.match(
    source,
    /\.select\("organization_id, role"\)/,
    "the users lookup must select role",
  );

  // No outbound probe and no write may precede the authorization check.
  const probe = indexOf(source, /await scanMCPServer\(/, "MCP probe call");
  assert.ok(
    roleGate < probe,
    "authorization must precede the outbound MCP probe (SSRF-on-behalf-of-member)",
  );

  for (const table of ["agent_connections", "agent_identities"]) {
    const writeIndex = source.indexOf(`.from("${table}")`);
    assert.notEqual(writeIndex, -1, `${table} access not found`);
    assert.ok(
      roleGate < writeIndex,
      `authorization must precede any ${table} access`,
    );
  }
});

test("discovery/sources authorizes owner/admin before any Vault secret write", () => {
  const source = read("app/api/discovery/sources/route.ts");

  assert.match(
    source,
    /\.select\("organization_id, role"\)/,
    "the users lookup must select role",
  );
  assert.match(
    source,
    /role !== "owner" && role !== "admin"/,
    "owner/admin gate missing",
  );

  const gates = [...source.matchAll(/forbiddenForRole\(role\)/g)].map(
    (match) => match.index ?? -1,
  );
  assert.equal(gates.length, 2, "both POST and PATCH must gate on role");

  const vaultWrites = [
    ...source.matchAll(/await (createMcpSecret|updateMcpSecret)\(/g),
  ].map((match) => match.index ?? -1);
  assert.ok(vaultWrites.length > 0, "expected Vault secret writes");

  // createMcpSecret/updateMcpSecret use the service-role client and bypass RLS,
  // so every one of them must sit behind a role gate.
  for (const write of vaultWrites) {
    assert.ok(
      gates.some((gate) => gate < write),
      `a Vault secret write at offset ${write} is not preceded by a role gate`,
    );
  }
});

test("governance disable_tool filters agent_permissions on a column that exists", () => {
  const source = read("lib/governance/action-executor.ts");

  assert.doesNotMatch(
    source,
    /\.eq\("tool",/,
    "agent_permissions has no `tool` column; filtering on it fails with 42703",
  );
  assert.match(
    source,
    /\.eq\("permission_key", context\.tool\)/,
    "disable_tool must filter on permission_key",
  );

  // The organization filter must survive alongside the fix.
  assert.match(
    source,
    /\.eq\("organization_id", context\.organizationId\)/,
    "tenant isolation filter was dropped",
  );
});

test("governance route still gates privileged actions on owner/admin", () => {
  const source = read("app/api/governance/action/route.ts");
  for (const action of ["pause_agent", "disable_tool", "modify_policy", "block", "approve"]) {
    assert.ok(
      source.includes(`"${action}"`),
      `${action} missing from the route`,
    );
  }
  const adminSet = indexOf(source, "ADMIN_ACTIONS", "ADMIN_ACTIONS set");
  const check = indexOf(source, "ADMIN_ACTIONS.has(action)", "admin gate");
  assert.ok(adminSet < check);
  assert.match(source, /userRecord\.role !== "owner"/);
});

test("previously hardened controls are still wired up", () => {
  // Guards against a hardening pass silently reverting earlier work.
  assert.match(read("proxy.ts"), /requirePrivilegedMfa/, "MFA/AAL2 gate");
  assert.match(
    read("lib/security/privileged-auth.ts"),
    /aal2/,
    "AAL2 assurance level check",
  );
  assert.match(
    read("lib/security/rate-limit.ts"),
    /check_rate_limit/,
    "distributed rate limiting",
  );
  const urlGuard = read("lib/security/validate-external-url.ts");
  assert.match(urlGuard, /protocols/, "protocol allow-list");
  assert.match(urlGuard, /dns\.lookup/, "DNS resolution for pinning");
  assert.match(urlGuard, /addresses\[0\]/, "connects to the validated address (DNS pinning)");
  assert.match(urlGuard, /headers\.host = hostHeader/, "Host header is pinned, not caller-supplied");
  assert.match(urlGuard, /MAX_EXTERNAL_RESPONSE_BYTES/, "response size limit");
  // Redirect protection here is structural: the pinned path uses raw
  // http(s).request, which never follows redirects. Switching to the global
  // fetch API would silently reintroduce redirect-based SSRF past the pin.
  assert.match(urlGuard, /https\.request\(requestOptions/, "must use raw https.request");
  // Built from fragments so this assertion does not itself trip the
  // raw-outbound-fetch scanner in distributed-security-regression.test.ts.
  const rawFetch = new RegExp(`await ${"fet"}${"ch"}\\(`);
  assert.doesNotMatch(
    urlGuard,
    rawFetch,
    "the global fetch follows redirects by default and would bypass DNS pinning",
  );
});
