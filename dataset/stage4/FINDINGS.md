# Stage 4 — Production Pipeline Replay Findings

Replay of the 10 Stage 3 `[T]` examples against the real production Chat pipeline
(dev server :3210, throwaway org `6e0791cb-4718-416b-9036-61699ef6f1df` in the live
Supabase project). No application code was modified. Raw evidence preserved in
`.stage4/results/ex-*.json` (HTTP status/body, executions, decisions, evaluations,
approvals per example) and server logs in `.stage4/dev.log`.

## Per-example results

| Example | Expected label | Observed decision core | Observed HTTP | Verdict |
|---|---|---|---|---|
| ex-01 allow-basic-send | ALLOW | decision `allowed` (risk=medium, correct rule) + 1 matched eval | 500; execution row `failed` | FAIL (2 bugs) |
| ex-02 allow-reply | ALLOW | none | 500 pre-records | FAIL (capability gap) |
| ex-03 allow-no-rules | ALLOW | decision `allowed` (risk=low, no rule) + 0 evals | 500; execution row `failed` | FAIL (bug) |
| ex-04 approval-rule-triggered | REQUIRE_APPROVAL | decision `approval_required` (risk=medium, correct rule) + 1 matched eval + approval `pending` | 500; execution row `failed` | PARTIAL FAIL (bug) |
| ex-05 approval-missing-context | REQUIRE_APPROVAL | decision `approval_required` (risk=low, reason=missing jurisdiction) + 0 evals + approval `pending` | 500; execution row `failed` | PARTIAL FAIL (bug) |
| ex-06 block | BLOCK | decision `blocked` (risk=high, correct rule) + 1 matched eval | 500; execution row `failed` | FAIL (bug) |
| ex-07 flag-for-review | FLAG_FOR_REVIEW | decision `pending` (FLAG mapped, risk=medium, correct rule) + 1 matched eval | 500; execution row `failed` | FAIL (bug) |
| ex-08 no-route | NO_ROUTE / no_compatible_agent | — | 200, status `no_compatible_agent`, zero records | PASS |
| ex-09 reject-access | REJECT_ACCESS 403 | — | **503** "Execution authorization is temporarily unavailable." | FAIL (member blocked pre-authz; unresolved) |
| ex-10 undeliverable-mapping | UNDELIVERABLE_REQUEST 400 | — | 400 `{error, code:'INTENT_MAPPING_FAILED'}`, zero records | PASS |

Governance decision core (evaluator, resolver, missing-context upgrade, risk engine)
matched the Stage 3 dataset in **all 7 examples that reached governance** — labels,
deciding rules (via dataset-ID→UUID map), risk levels, and matched/unmatched evaluation
rows were exactly as predicted, including ex-05's zero-evaluations nuance and ex-07's
FLAG→`pending` mapping. Every mismatch below originates **downstream of the decision**.

## Divergence table

| # | Symptom | Evidence | Category |
|---|---|---|---|
| D-1 | PostgREST exposes only `public`; `vault.decrypted_secrets` unreachable from app (406 PGRST106 "Only the following schemas are exposed: public"). Credential resolution throws on every ALLOW path. Direct SQL resolves the secret; PostgREST probe fails. | `.stage4/results/ex-01..03` logs; `.stage4/dev.log` `[execution] … Connection credential is unavailable.` | genuine bug (project config/implementation contract gap; would also break production Vercel) |
| D-2 | `agent_executions_status_check` allows only `started/running/completed/failed/cancelled`, but audit writer persists `blocked/awaiting_approval/flagged` → constraint violation; governance interdictions recorded as `failed`, HTTP 500. | `pg_constraint` output; `.stage4/dev.log` `[execution] … violates check constraint "agent_executions_status_check"` | genuine bug (code↔DB contract mismatch; affects ex-04…07) |
| D-3 | AgentMail connector registry advertises only `messages.send`; `messages.reply` throws at `engine.ts:266` before any execution row (HTTP 500, zero records) despite connection capability `reply:true`. | `.stage4/results/ex-02-allow-reply.json`; `.stage4/dev.log` `Requested connector capability is not supported by this provider.` | implementation divergence from dataset premise (Stage 1 gap: reply capability not wired end-to-end) |
| D-4 | Member actor gets 503 from route profile lookup, while the identical REST query with the member's fresh JWT returns 200 (same RLS policy). Harness could not authenticate member in-app. | `.stage4/results/ex-09-reject-access.json`; `.stage4/probe-member*.js` transcripts | unresolved ambiguity (evidence preserved; needs owner-side investigation) |
| D-5 | Gemini transient 503 "high demand" on intent generation; request never reaches decision stage; no records. | `.stage4/dev.log` two occurrences (ex-01 first attempt, ex-07 first attempt) | expected runtime nondeterminism |
| D-6 | Ex-08's canonical intent parse produced slightly different `intent`/`parameters` wording than the dataset's `s2` (same capability `messages.read`, same terminal outcome). | `.stage4/results/ex-08-no-route.json` HTTP body | dataset assumption (Stage 3 canonical-parse pinning; LLM nondeterminism, already on D8 record) |

## Cleanup verification (final state)

All zero: auth_users 0, profile_rows 0, org_rows 0, agents 0, connections 0,
credentials 0, policies 0, decisions 0, evaluations 0, approvals 0, executions 0,
vault_secrets 0, rate_limit_buckets 0. Dev server stopped (PID killed).

## Stage 3 validator re-run

VALIDATION PASSED — 10 examples, 0 failure(s) (dataset artifacts unchanged by Stage 4).

## Remediation status (Stage 4 remediation pass)

- D-1 FIXED (code, not yet applied to any environment): new migration
  `20260924110000_resolve_connection_secret_rpc.sql` (service-role-only SECURITY
  DEFINER RPC resolving the secret inside the database) + `lib/credentials/runtime.ts`
  now resolves via that RPC instead of PostgREST vault reads.
  Regression: `tests/credentials-vault-rpc.test.ts`. NOTE: the same
  `schema("vault")` mechanism is still used by vault WRITE paths
  (`app/api/agents/credentials/route.ts`, `lib/credentials/mcp.ts`) — flagged as
  follow-up, intentionally not expanded in this pass.
- D-2 FIXED (code, not yet applied to any environment): migration
  `20260924100000_align_agent_executions_status_check.sql` widens the status check
  to include `blocked`, `awaiting_approval`, `flagged`.
  Regression: `tests/execution-status-contract.test.ts`.
- D-3 FIXED (code): `lib/connectors/agentmail.ts` now advertises and executes
  `messages.reply` (contract {to, text} + default subject), send path unchanged.
  Regression: `tests/agentmail-reply-capability.test.ts`.
- D-4 RESOLVED (investigation pass): root cause was NOT RLS/session/Supabase. proxy.ts runs
  requirePrivilegedMfa on /api/execute for all users; that function performs the owner/admin
  role check first, so a member throws PrivilegedAuthorizationError, which the proxy's catch
  did not map — it fell into the generic 503 handler. Fix: map isPrivilegedAuthorizationError
  to 403 "Only an owner or admin can perform this action." (mirrors the route's contract).
  Regression: tests/proxy-member-authorization.test.ts (4 tests). Live E2E confirmed: ex-09
  now returns HTTP 403 with zero execution rows. Preserved Stage 4 evidence coheres: each
  dev log contained exactly 2x "Privileged authorization lookup failed: PrivilegedAuthorizationError".
- D-5, D-6: no action required (nondeterminism / dataset parse pinning).

All fixes verified: 288 tests pass / 0 fail / 1 skipped, `tsc --noEmit` clean,
`next build` succeeds, Stage 3 validator still passes. NOT deployed; migrations
not applied to any environment.
