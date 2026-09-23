import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { MAX_JSON_REQUEST_BODY_BYTES, readJsonBody } from "./request-body.ts";
import { createOrResolveOnboardedAgent, deterministicAgentId } from "../discovery/onboarding.ts";
import { assertTaskAssignedToAgent } from "../execution/task-agent-authorization.ts";

const root = path.resolve(import.meta.dirname, "../..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("JSON request bodies are bounded", async () => {
  assert.equal(MAX_JSON_REQUEST_BODY_BYTES, 256 * 1024);
  const request = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ ok: true }),
    headers: { "content-type": "application/json" },
  });
  assert.deepEqual(await readJsonBody(request), { ok: true });

  const oversized = new Request("http://localhost", {
    method: "POST",
    body: "x".repeat(MAX_JSON_REQUEST_BODY_BYTES + 1),
  });
  await assert.rejects(readJsonBody(oversized), /too large/i);
});

test("production test MCP endpoint is disabled while development remains implemented", () => {
  const source = read("app/api/test-mcp/route.ts");
  assert.match(source, /process\.env\.ALLOW_TEST_MCP/);
  assert.doesNotMatch(source, /NODE_ENV === ["']production["']/);
  assert.match(source, /status:\s*404/);
  assert.match(source, /method === ["']initialize["']/);
  assert.match(source, /method === ["']tools\/list["']/);
});

test("CSP is restrictive, nonce-based, and does not permit unsafe-eval", () => {
  const config = read("next.config.mjs");
  const csp = read("lib/security/content-security-policy.ts");
  const proxy = read("proxy.ts");
  assert.match(csp, /createContentSecurityPolicy/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /script-src 'self' 'nonce-/);
  assert.ok(!csp.split("; ").some((directive) => directive.startsWith("script-src ") && directive.includes("unsafe-inline")));
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.match(csp, /style-src-attr 'unsafe-inline'/);
  assert.match(csp, /supabase\.co/);
  assert.match(proxy, /Content-Security-Policy/);
  assert.doesNotMatch(config, /unsafe-eval/);
});

test("discovery onboarding uses a stable per-finding agent identity", () => {
  const first = deterministicAgentId("finding-1");
  assert.equal(first, deterministicAgentId("finding-1"));
  assert.notEqual(first, deterministicAgentId("finding-2"));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const route = read("app/api/discovery/review/route.ts");
  assert.match(route, /createOrResolveOnboardedAgent/);
});

test("discovery onboarding resolves a concurrent unique insert instead of creating a second agent", async () => {
  const source = read("lib/discovery/onboarding.ts");
  assert.match(source, /agentError\.code !== ["']23505["']/);
  assert.match(source, /existingAgent/);
  assert.match(source, /organization_id !== input\.organizationId/);

  let created = false;
  const fakeSupabase = {
    from() {
      return {
        insert() {
          return this;
        },
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async single() {
          if (!created) {
            created = true;
            return { data: { id: deterministicAgentId("finding"), name: "Agent", status: "active" }, error: null };
          }
          return { data: null, error: { code: "23505" } };
        },
        async maybeSingle() {
          return {
            data: { id: deterministicAgentId("finding"), name: "Agent", status: "active", organization_id: "org" },
            error: null,
          };
        },
      };
    },
  };

  const input = { findingId: "finding", organizationId: "org", name: "Agent", description: "", agentType: "MCP" };
  const results = await Promise.all([
    createOrResolveOnboardedAgent(fakeSupabase, input),
    createOrResolveOnboardedAgent(fakeSupabase, input),
  ]);
  assert.equal(results[0].id, results[1].id);
});

test("connector execution enforces the existing task-agent relationship", () => {
  const route = read("app/api/connectors/execute/route.ts");
  assert.match(route, /assertTaskAssignedToAgent/);
  assert.match(route, /body\.taskId, body\.agentId/);
  assert.match(route, /status: 403/);
});

test("task-agent authorization fails closed on missing relationship", async () => {
  const supabase = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: null, error: null }; },
      };
    },
  };
  await assert.rejects(
    assertTaskAssignedToAgent(supabase, "task", "agent"),
    /not assigned/i,
  );
});

test("rate limiting covers the requested high-impact routes", () => {
  const source = read("proxy.ts");
  for (const marker of [
    "/api/connectors/execute",
    "/api/tasks/execute",
    "/api/tasks/create",
    "/api/agents/credentials",
    "/api/agents/connections",
    "/api/agentmail/send",
    "/api/governance/action",
    "/api/governance/evaluate",
    "/api/governance/policies/create",
    "/api/governance/rules/create",
    "/api/approvals",
    "/api/discovery/scans",
    "/api/discovery/sources",
    "/api/discovery/review",
  ]) assert.match(source, new RegExp(marker.replaceAll("/", "\\/")));
  assert.match(source, /pathname === \"\/api\/test-mcp\"/);
  assert.match(source, /key: \"test-mcp\", limit: RATE_LIMITS\.authenticatedTestMcp\.limit/);
  assert.match(source, /unauthenticatedPolicy\.key\}:ip:/);
  assert.match(source, /key: \"webhook:verify\", limit: RATE_LIMITS\.webhookConnectionIp\.limit/);
  assert.doesNotMatch(source, /process-local/);
  assert.match(source, /database-backed/);
});

test("client IP extraction does not trust spoofable generic forwarding headers", () => {
  const source = read("lib/security/rate-limit.ts");
  assert.match(source, /x-vercel-forwarded-for/);
  assert.doesNotMatch(source, /headers\.get\("x-forwarded-for"\)/);
  assert.doesNotMatch(source, /headers\.get\("x-real-ip"\)/);
});

test("AgentMail recipient cost is charged only after message validation", () => {
  const source = read("app/api/agentmail/send/route.ts");
  const validation = source.indexOf("Subject or message content is invalid or too large.");
  const limiter = source.indexOf("checkRateLimitCost(");
  assert.ok(validation >= 0);
  assert.ok(limiter > validation);
});

test("AgentMail does not log provider response bodies", () => {
  const source = read("lib/connectors/agentmail.ts");
  assert.match(source, /AgentMail API error.*status: response\.status/);
  assert.doesNotMatch(source, /AgentMail API error:\",\s*data/);
});

test("API error responses no longer expose raw exception messages", () => {
  const apiRoot = path.join(root, "app/api");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") files.push(full);
    }
  };
  walk(apiRoot);
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (file.split(path.sep).join("/").endsWith("webhooks/verify/[connectionId]/route.ts")) continue;
    assert.doesNotMatch(source, /error:\s*error instanceof Error \? error\.message/);
    assert.doesNotMatch(source, /error:\s*\n\s*error instanceof Error\s*\n\s*\? error\.message/);
  }
});

test("MCP discovery is HTTPS-only regardless of credentials", () => {
  const source = read("lib/discovery/scanners/mcp.ts");
  assert.doesNotMatch(source, /"https:",\s*"http:"/);
  assert.match(source, /protocols:\s*\["https:"\]/);
  assert.match(source, /validateExternalUrl/);
});

test("environment files are ignored except the intentional example", () => {
  const source = read(".gitignore");
  assert.match(source, /^\.env$/m);
  assert.match(source, /^\.env\.\*$/m);
  assert.match(source, /^!\.env\.example$/m);
});

test("external response limiting remains in the pinned transport", () => {
  const source = read("lib/security/validate-external-url.ts");
  assert.match(source, /MAX_EXTERNAL_RESPONSE_BYTES/);
  assert.match(source, /External response is too large/);
  assert.match(source, /declaredLength/);
});

test("discovery worker requires explicit organization context", () => {
  const source = read("lib/discovery/run-scan.ts");
  assert.match(source, /runDiscoveryScan\(scanId: string, organizationId: string\)/);
  assert.match(source, /eq\("organization_id", organizationId\)/);
  assert.match(source, /Discovery scan organization context is required/);
});

test("execution requires an explicitly requested capability instead of selecting the first enabled capability", () => {
  const engine = read("lib/execution/engine.ts");
  assert.match(engine, /requestedCapability/);
  assert.doesNotMatch(engine, /connector\.capabilities\.find\(/);
  assert.match(engine, /capabilities\[action\] !== true/);
  const connectorRoute = read("app/api/connectors/execute/route.ts");
  const taskRoute = read("app/api/tasks/execute/route.ts");
  const taskIdRoute = read("app/api/tasks/[taskId]/execute/route.ts");
  for (const source of [connectorRoute, taskRoute, taskIdRoute]) {
    assert.match(source, /A valid connector capability is required/);
    assert.match(source, /requestedCapability/);
  }
});

test("approval resume revalidates current connection health, capability, and task assignment", () => {
  const source = read("app/api/approvals/[approvalId]/resume/route.ts");
  assert.match(source, /currentConnection/);
  assert.match(source, /status !== ["']connected["']/);
  assert.match(source, /health_status === ["']unhealthy["']/);
  assert.match(source, /currentCapabilities\[action\] !== true/);
  assert.match(source, /assertTaskAssignedToAgent/);
});


test("login uses a server endpoint with distributed IP-based rate limiting", () => {
  const login = read("app/(app)/login/page.tsx")
  const route = read("app/api/auth/login/route.ts")
  const proxy = read("proxy.ts")
  assert.match(login, /\/api\/auth\/login/)
  assert.match(route, /signInWithPassword/)
  assert.match(proxy, /auth:login:ip/)
  assert.match(proxy, /getClientIp/)
  assert.match(proxy, /status: 413/)
})

test("execution primitive independently requires authenticated owner/admin context", () => {
  const engine = read("lib/execution/engine.ts")
  assert.match(engine, /supabase\.auth\.getUser\(\)/)
  assert.match(engine, /caller\.organization_id !== input\.organizationId/)
  assert.match(engine, /caller\.role !== ["']owner["']/)
})

test("taskless connector execution requires an idempotency key", () => {
  const route = read("app/api/connectors/execute/route.ts")
  const migration = read("supabase/migrations/20260920182000_add_connector_execution_idempotency.sql")
  assert.match(route, /Idempotency-Key/)
  assert.match(route, /connector_execution_idempotency/)
  assert.match(migration, /unique \(organization_id, idempotency_key\)/)
})

test("agent configuration routes require owner/admin", () => {
  for (const file of ["app/api/agents/route.ts", "app/api/agents/connections/route.ts"]) {
    const source = read(file)
    assert.match(source, /roleRecord\?\.role !== ["']owner["']/)
  }
})

test("MFA is required for privileged write operations at the proxy boundary", () => {
  const source = read("proxy.ts")
  assert.match(source, /requiresPrivilegedMfa/)
  assert.match(source, /requirePrivilegedMfa/)
  assert.match(read("lib/security/privileged-auth.ts"), /getAuthenticatorAssuranceLevel/)
  assert.match(read("lib/security/privileged-auth.ts"), /aal2/)
})

test("the Intent/Gemini execute pipeline is guarded before model invocation", () => {
  const route = read("app/api/execute/route.ts")
  const proxy = read("proxy.ts")
  const budget = read("lib/security/gemini-budget.ts")
  const gemini = read("lib/llm/gemini.ts")
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /authorizeConnectorExecution/)
  assert.match(route, /validateMessageSize/)
  assert.match(route, /status: 413/)
  assert.match(proxy, /pathname === ["']\/api\/execute["']/)
  assert.match(proxy, /key: ["']execute["'], limit: RATE_LIMITS\.execute\.limit/)
  assert.match(budget, /gemini:\$\{userId\}/)
  assert.match(gemini, /await consumeGeminiBudget\(context\.userId\)/)
})
