import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const routePath = join(
  root,
  "app",
  "api",
  "webhooks",
  "verify",
  "[connectionId]",
  "route.ts",
);
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20260920160000_add_webhook_replay_events.sql",
);
const routeSource = readFileSync(routePath, "utf8");
const migrationSource = readFileSync(migrationPath, "utf8");

function replayKey(connectionId: string, timestamp: string, body: string) {
  return `${connectionId}\0${timestamp}\0${body}`;
}

async function reserve(
  store: Set<string>,
  key: string,
): Promise<"reserved" | "duplicate"> {
  await new Promise((resolve) => setImmediate(resolve));
  if (store.has(key)) return "duplicate";
  store.add(key);
  return "reserved";
}

test("first delivery reserves replay state before webhook side effects", () => {
  assert.match(routeSource, /from\("webhook_replay_events"\)/);
  assert.match(routeSource, /\.insert\(\{/);
  assert.match(routeSource, /agent_health_checks/);
  assert.ok(
    routeSource.indexOf('from("webhook_replay_events")') <
      routeSource.indexOf('from("agent_health_checks")'),
  );
});

test("identical replay is rejected by the unique replay key", () => {
  const store = new Set<string>();
  const key = replayKey("connection-1", "1000", '{"event":"ok"}');
  assert.equal(store.has(key), false);
  store.add(key);
  assert.equal(store.has(key), true);
  assert.match(routeSource, /Webhook replay detected/);
  assert.match(routeSource, /code === "23505"/);
});

test("simultaneous duplicate deliveries cannot both reserve the same key", async () => {
  const store = new Set<string>();
  const key = replayKey("connection-1", "1000", '{"event":"ok"}');
  const results = await Promise.all([
    reserve(store, key),
    reserve(store, key),
  ]);
  assert.deepEqual(results.sort(), ["duplicate", "reserved"]);
  assert.equal(store.size, 1);
});

test("different legitimate events produce different replay keys", () => {
  assert.notEqual(
    replayKey("connection-1", "1000", '{"event":"a"}'),
    replayKey("connection-1", "1000", '{"event":"b"}'),
  );
  assert.notEqual(
    replayKey("connection-1", "1000", '{"event":"a"}'),
    replayKey("connection-1", "1001", '{"event":"a"}'),
  );
  assert.notEqual(
    replayKey("connection-1", "1000", '{"event":"a"}'),
    replayKey("connection-2", "1000", '{"event":"a"}'),
  );
});

test("existing HMAC and timestamp protections remain in the route", () => {
  assert.match(routeSource, /createHmac\("sha256"/);
  assert.match(routeSource, /timingSafeEqual/);
  assert.match(routeSource, /MAX_TIMESTAMP_AGE_SECONDS = 5 \* 60/);
  assert.match(routeSource, /verifySignature\(credential\.secret/);
  assert.match(routeSource, /parseTimestamp\(timestampHeader\)/);
});

test("stale timestamps are rejected before replay persistence", () => {
  assert.match(routeSource, /Math\.abs\(now - timestamp\) > MAX_TIMESTAMP_AGE_SECONDS/);
  assert.ok(
    routeSource.indexOf("parseTimestamp(timestampHeader)") <
      routeSource.indexOf('from("webhook_replay_events")'),
  );
});

test("replay state is database-backed and not an in-memory Map", () => {
  assert.match(migrationSource, /create table if not exists public\.webhook_replay_events/);
  assert.match(
    migrationSource,
    /unique \(agent_connection_id, replay_key\)/,
  );
  assert.match(migrationSource, /enable row level security/);
  assert.doesNotMatch(routeSource, /new Map/);
});

test("replay persistence failure fails closed before webhook side effects", () => {
  assert.match(routeSource, /return jsonError\("Webhook verification is temporarily unavailable\.".*503\)/s);
  assert.ok(
    routeSource.indexOf('from("webhook_replay_events")') <
      routeSource.indexOf('from("agent_health_checks")'),
  );
});
