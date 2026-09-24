# Stage 3 — Arbyter OS training dataset (10 hand-reviewed [T] examples)

Canonical 9-stage schema examples grounded in the **production Chat pipeline**
(`orchestration/index.ts` → `execution/engine.ts` → `lib/governance/*`) and the
**SPEC-V4-MASTER** document. Per Stage 2 decisions D1–D8.

## Contents

- `schema.json` — JSON Schema (draft 2020-12) for one training example.
  Regenerate with `node gen-schema.js` (hand-editing discouraged; the
  generator guarantees structural validity).
- `org-profiles.json` — the single shared replay profile `org-replay-alpha`:
  1 org, 2 users (owner, member), 1 active agent, 1 healthy agentmail
  connection (send+reply enabled, read disabled), identity declared but
  unused in selection (production-accurate). No credential values ever.
- `examples/ex-01..ex-10.json` — the 10 reviewed examples.
- `validate.js` — validator: JSON Schema check + profile-reference integrity +
  **decision-core replay** (re-implements `lib/governance` evaluator, weighted
  conflict resolver, missing-context upgrade, and risk engine; asserts each
  example's label, risk, and deciding-rule reason are what production yields).

Run: `node dataset/stage3/validate.js`

## Distribution (exactly as approved)

3 ALLOW, 2 REQUIRE_APPROVAL (rule-triggered + missing-context fail-closed),
1 BLOCK, 1 FLAG_FOR_REVIEW, 1 NO_ROUTE, 1 REJECT_ACCESS, 1 UNDELIVERABLE_REQUEST.

## Tags

All 10 examples are `[T]` (producible by today's pipeline). Spec-only verdicts
(QUARANTINE, MASK_REDACT), AIT identity, TTL/quorum approvals, and hash-chained
ledger fields are deliberately absent and may only enter at Stage 6, tagged.

## Stage 4 consumption

Stage 4 provisions `org-replay-alpha` in a disposable Supabase org (seed rules
per example, clean between examples), sends each `s1.request_text` through the
real pipeline, and diffs observed HTTP/DB outcomes against `s8`/`s9`.
Runtime-generated UUIDs (execution ids, approval ids) are `null` in examples
and must be excluded from equality checks.
