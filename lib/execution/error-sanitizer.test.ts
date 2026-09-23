import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeExecutionError } from "./error-sanitizer.ts";

test("maps provider timeouts to a fixed message without leaking details", () => {
  const err = new Error("connect ETIMEDOUT 10.0.4.12:5432 (internal host)");
  const result = sanitizeExecutionError(err);

  assert.equal(result.category, "timeout");
  assert.equal(result.message, "The operation timed out before it could complete.");
  assert.ok(!result.message.includes("10.0.4.12"));
});

test("maps rate limiting and auth failures to fixed messages", () => {
  assert.equal(sanitizeExecutionError(new Error("429 Too Many Requests")).category, "rate_limited");
  assert.equal(sanitizeExecutionError(new Error("Invalid API key provided")).category, "auth");
});

test("maps database and network errors to fixed messages", () => {
  assert.equal(
    sanitizeExecutionError(
      new Error('duplicate key value violates unique constraint "webhook_replay_digest"'),
    ).category,
    "database",
  );
  assert.equal(sanitizeExecutionError(new Error("fetch failed")).category, "network");
});

test("falls back to a generic message for unknown errors", () => {
  const result = sanitizeExecutionError(
    new Error("postgres@db.internal: password rejected for role"),
  );

  assert.equal(result.category, "execution_error");
  assert.equal(result.message, "The operation failed due to an internal execution error.");
  assert.ok(!result.message.includes("postgres@db.internal"));
});

test("preserves full diagnostics (stack) for server-side logging only", () => {
  const err = new Error("connect ETIMEDOUT 10.0.4.12:5432");
  const result = sanitizeExecutionError(err);

  assert.ok(result.diagnostics.includes("10.0.4.12"));
  assert.notEqual(result.diagnostics, result.message);
});

test("handles non-Error throwables and strings", () => {
  assert.equal(sanitizeExecutionError(undefined).category, "execution_error");
  assert.equal(sanitizeExecutionError({ weird: true }).category, "execution_error");
  assert.equal(sanitizeExecutionError("ECONNREFUSED 127.0.0.1:8080").category, "network");
});
