import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

test("rate limiter is distributed and fails closed when the backing service is unavailable", () => {
  const limiter = read("lib/security/rate-limit.ts");
  const proxy = read("proxy.ts");
  const migration = read("supabase/migrations/20260920173000_add_distributed_rate_limit.sql");

  assert.doesNotMatch(limiter, /new Map|const buckets/);
  assert.match(limiter, /rpc\("check_rate_limit"/);
  assert.match(proxy, /await checkRateLimit\(/);
  assert.match(proxy, /Rate limiting is temporarily unavailable/);
  assert.match(proxy, /status: 503/);
  assert.match(migration, /create table if not exists public\.rate_limit_buckets/);
  assert.match(migration, /for update/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute .* to service_role/);
});

test("server-side outbound AgentMail traffic uses validated pinned HTTPS transport", () => {
  const agentMail = read("lib/connectors/agentmail.ts");
  assert.match(agentMail, /validateExternalUrl\(endpoint, \{ protocols: \["https:"\] \}\)/);
  assert.match(agentMail, /fetchValidatedExternalUrl\(validation/);
  assert.doesNotMatch(agentMail, /await fetch\(/);
  assert.match(agentMail, /Authorization: `Bearer \$\{apiKey\}`/);
});

test("no raw server-side outbound fetch remains outside the validated transport", () => {
  const candidates: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) candidates.push(full);
    }
  };
  walk(path.join(root, "app/api"));
  walk(path.join(root, "lib"));

  // Compare POSIX-style relative paths so the allow-list also matches on Windows, where
  // path.join() yields backslashes and an endsWith("lib/...") check would silently never match.
  const relative = (file: string) => path.relative(root, file).split(path.sep).join("/");
  const allowed = new Set(["lib/credentials/mcp.test.ts", "lib/approvals/client.ts"]);
  const rawFetchFiles = candidates.map(relative).filter((file) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    return /\bfetch\s*\(/.test(source) && !allowed.has(file);
  });

  assert.deepEqual(rawFetchFiles, [], rawFetchFiles.join("\n"));
});
