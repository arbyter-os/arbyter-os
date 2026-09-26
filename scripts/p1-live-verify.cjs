// P1 live verification (throwaway resources only; all cleaned up on completion).
// Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY from .env.local
// Checks:
//  1. member JWT -> INSERT approval_requests (execution-less) -> denied by RLS
//  2. member JWT -> INSERT with execution_id (forgery)        -> denied by RLS
//  3. service-role INSERT (execution-linked)                  -> 201
//  4. quota RPCs hidden from anon/authenticated (404), callable by service role
//  5. exec:{org} bucket exhausts at limit 30
//  6. mail:{org} bucket exhausts at limit 20
//  cleanup: delete approval row, app users, org

const fs = require("fs");
const path = require("path");

const envText = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"]+)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const SVC_KEY = process.env.SUPABASE_SECRET_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!BASE || !SVC_KEY || !ANON_KEY) { console.error("MISSING ENV"); process.exit(1); }

const results = [];
const ok = (name, pass, detail) => {
  results.push({ name, pass });
  console.log((pass ? "PASS" : "FAIL") + "  " + name + (detail ? "  -- " + detail : ""));
};

const svcHeaders = (prefer) => {
  const h = { apikey: SVC_KEY, Authorization: "Bearer " + SVC_KEY, "Content-Type": "application/json" };
  if (prefer) h.Prefer = prefer;
  return h;
};
const userHeaders = (jwt) => ({ apikey: ANON_KEY, Authorization: "Bearer " + jwt, "Content-Type": "application/json" });

async function svcRest(restPath, method, body, prefer) {
  const r = await fetch(BASE + "/rest/v1" + restPath, { method, headers: svcHeaders(prefer), body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let out; try { out = JSON.parse(text); } catch { out = text; }
  return { status: r.status, body: out };
}
async function userRest(restPath, jwt, method, body) {
  const r = await fetch(BASE + "/rest/v1" + restPath, { method, headers: userHeaders(jwt), body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let out; try { out = JSON.parse(text); } catch { out = text; }
  return { status: r.status, body: out };
}
async function rpc(name, payload, headers) {
  const r = await fetch(BASE + "/rest/v1/rpc/" + name, { method: "POST", headers, body: JSON.stringify(payload) });
  const text = await r.text();
  let out; try { out = JSON.parse(text); } catch { out = text; }
  return { status: r.status, body: out };
}
async function adminCreateUser(email, password) {
  const r = await fetch(BASE + "/auth/v1/admin/users", { method: "POST", headers: svcHeaders(), body: JSON.stringify({ email, password, email_confirm: true }) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("create user " + email + ": " + r.status + " " + JSON.stringify(b).slice(0, 200));
  return b.id;
}
async function signIn(email, password) {
  const r = await fetch(BASE + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("signin " + email + ": " + r.status + " " + JSON.stringify(b).slice(0, 200));
  return b.access_token;
}

(async () => {
  const stamp = Date.now().toString(36);
  const password = "Xx9!vR" + stamp + "qQ";
  const memberEmail = "p1member-" + stamp + "@example.com";
  const ownerEmail = "p1owner-" + stamp + "@example.com";
  let orgId = null, approvalId = null, cleanupExecutionId = null, cleanupAgentId = null;
  const createdUserIds = [];

  const cleanup = async () => {
    if (approvalId) { try { await svcRest("/approval_requests?id=eq." + approvalId, "DELETE"); } catch {} }
    if (cleanupExecutionId) { try { await svcRest("/agent_executions?id=eq." + cleanupExecutionId, "DELETE"); } catch {} }
    if (cleanupAgentId) { try { await svcRest("/ai_agents?id=eq." + cleanupAgentId, "DELETE"); } catch {} }
    for (const uid of createdUserIds) { try { await fetch(BASE + "/auth/v1/admin/users/" + uid, { method: "DELETE", headers: svcHeaders() }); } catch {} }
    if (orgId) { try { await svcRest("/users?organization_id=eq." + orgId, "DELETE"); } catch {} }
    if (orgId) { try { await svcRest("/organizations?id=eq." + orgId, "DELETE"); } catch {} }
    console.log("cleanup done");
  };

  let exitCode = 0;
  try {
    // --- setup: org + users + app users rows ---
    const org = await svcRest("/organizations", "POST", { name: "P1-verify " + stamp, slug: "p1verify-" + stamp }, "return=representation");
    if (org.status !== 201) throw new Error("org create: " + org.status + " " + JSON.stringify(org.body).slice(0, 200));
    orgId = org.body[0].id;

    const uMember = await adminCreateUser(memberEmail, password);
    const uOwner = await adminCreateUser(ownerEmail, password);
    createdUserIds.push(uMember, uOwner);

    // A trigger may auto-create public.users rows on auth signup: update first, insert if absent.
    const ensureAppUser = async (uid, email, role) => {
      const upd = await svcRest("/users?id=eq." + uid, "PATCH", { role, organization_id: orgId }, "return=representation");
      if (upd.status === 200 && Array.isArray(upd.body) && upd.body.length > 0) return;
      const ins = await svcRest("/users", "POST", [{ id: uid, email, role, organization_id: orgId }], "return=representation");
      if (ins.status !== 201) throw new Error("app user upsert " + email + ": " + ins.status + " " + JSON.stringify(ins.body).slice(0, 300));
    };
    await ensureAppUser(uMember, memberEmail, "member");
    await ensureAppUser(uOwner, ownerEmail, "owner");
    console.log("org=" + orgId + " member=" + uMember + " owner=" + uOwner);

    const memberJwt = await signIn(memberEmail, password);

    // 1. member JWT INSERT approval_requests (execution-less) -> RLS deny
    const t1 = await userRest("/approval_requests", memberJwt, "POST", { organization_id: orgId, requested_by: uMember, title: "probe", risk_level: "low" });
    ok("1 member JWT INSERT approval_requests denied", t1.status === 403, "status=" + t1.status + " body=" + JSON.stringify(t1.body).slice(0, 150));

    // 2. member JWT INSERT with execution_id (forgery attempt) -> RLS deny
    const t2 = await userRest("/approval_requests", memberJwt, "POST", { organization_id: orgId, requested_by: uMember, execution_id: crypto.randomUUID(), title: "forge", risk_level: "low" });
    ok("2 member INSERT with execution_id denied", t2.status === 403, "status=" + t2.status + " body=" + JSON.stringify(t2.body).slice(0, 150));

    // 3. service-role execution-linked INSERT (engine shape) -> 201
    // agent_executions requires organization_id + agent_id (FK to ai_agents).
    const agent = await svcRest("/ai_agents", "POST", { organization_id: orgId, name: "P1 probe agent " + stamp, status: "inactive" }, "return=representation");
    if (agent.status !== 201) throw new Error("agent create: " + agent.status + " " + JSON.stringify(agent.body).slice(0, 300));
    cleanupAgentId = agent.body[0].id;
    const exec = await svcRest("/agent_executions", "POST", {
      organization_id: orgId,
      agent_id: cleanupAgentId,
      execution_type: "task",
      status: "awaiting_approval",
      input_data: {},
      output_data: {},
      risk_level: "high",
      started_at: new Date().toISOString(),
    }, "return=representation");
    if (exec.status !== 201) throw new Error("execution create: " + exec.status + " " + JSON.stringify(exec.body).slice(0, 300));
    const executionId = exec.body[0].id;
    cleanupExecutionId = executionId;
    const t3 = await svcRest("/approval_requests", "POST", {
      organization_id: orgId,
      execution_id: executionId,
      title: "svc execution-linked",
      risk_level: "high",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }, "return=representation");
    approvalId = Array.isArray(t3.body) && t3.body[0] && t3.body[0].id;
    ok("3 service-role execution-linked INSERT 201", t3.status === 201 && !!approvalId, "status=" + t3.status + " id=" + approvalId + " body=" + JSON.stringify(t3.body).slice(0, 250));

    // 5. exec:{org} bucket exhausts at 30 (runs before any other exec-key call)
    let firstDeny = 0, remaining = null, retryAfter = null, rpcError = null;
    for (let i = 0; i < 35; i++) {
      const r = await rpc("check_rate_limit_cost", { p_key: "exec:" + orgId, p_cost: 1, p_limit: 30, p_window_seconds: 60 }, svcHeaders());
      if (r.status !== 200) { rpcError = "call " + i + " status " + r.status + " " + JSON.stringify(r.body).slice(0, 200); break; }
      const row = Array.isArray(r.body) ? r.body[0] : r.body;
      if (!row.allowed) { firstDeny = i; retryAfter = row.retry_after_seconds; break; }
      remaining = row.remaining;
    }
    ok("5 exec bucket exhausts at 30", !rpcError && firstDeny === 30 && remaining === 0, "first-deny at call " + firstDeny + " (0-indexed; expect 30) remaining=" + remaining + " retry_after=" + retryAfter + (rpcError ? " rpcError=" + rpcError : ""));

    // 6. mail:{org} bucket exhausts at 20
    let mDeny = 0, mErr = null;
    for (let i = 0; i < 25; i++) {
      const r = await rpc("check_rate_limit_cost", { p_key: "mail:" + orgId, p_cost: 1, p_limit: 20, p_window_seconds: 60 }, svcHeaders());
      if (r.status !== 200) { mErr = "call " + i + " status " + r.status; break; }
      const row = Array.isArray(r.body) ? r.body[0] : r.body;
      if (!row.allowed) { mDeny = i; break; }
    }
    ok("6 mail bucket exhausts at 20", !mErr && mDeny === 20, "first-deny at call " + mDeny + " (expect 20)" + (mErr ? " err=" + mErr : ""));

    // 7. window semantics: limit=1 bucket, 2nd call denied
    const tkey = "verify:" + orgId + ":" + stamp;
    const r1 = await rpc("check_rate_limit_cost", { p_key: tkey, p_cost: 1, p_limit: 1, p_window_seconds: 60 }, svcHeaders());
    const row1 = Array.isArray(r1.body) ? r1.body[0] : r1.body;
    const r2 = await rpc("check_rate_limit_cost", { p_key: tkey, p_cost: 1, p_limit: 1, p_window_seconds: 60 }, svcHeaders());
    const row2 = Array.isArray(r2.body) ? r2.body[0] : r2.body;
    ok("7 limiter window semantics (allow then deny)", r1.status === 200 && row1.allowed === true && row2.allowed === false, "call1=" + JSON.stringify(row1) + " call2=" + JSON.stringify(row2));

    // 4. quota RPC visibility: anon/authenticated denied, service role allowed
    const a4 = await rpc("check_org_execution_quota", { p_organization_id: orgId }, { apikey: ANON_KEY, "Content-Type": "application/json" });
    const b4 = await rpc("check_org_execution_quota", { p_organization_id: orgId }, userHeaders(memberJwt));
    const c4 = await rpc("check_org_execution_quota", { p_organization_id: orgId }, svcHeaders());
    ok("4a quota RPC denied for anon", [401, 403, 404].includes(a4.status), "status=" + a4.status);
    ok("4b quota RPC denied for authenticated", [401, 403, 404].includes(b4.status), "status=" + b4.status);
    ok("4c quota RPC callable by service role", c4.status === 200, "status=" + c4.status + " body=" + JSON.stringify(c4.body).slice(0, 80));
  } catch (e) {
    console.error("SETUP/RUN ERROR:", e && e.message);
    exitCode = 1;
  }

  await cleanup();
  const fails = results.filter(r => !r.pass);
  console.log("\nSUMMARY: " + (results.length - fails.length) + "/" + results.length + " passed");
  if (fails.length || exitCode) process.exit(1);
})();
