# Arbyter OS Security Audit — 2026-09-21 (second pass, corrected)

This revises the earlier pass. Several of its claims were not true of the code as shipped; each
correction is marked **(corrected)**. "Verified" means executed here; "Not verified" means it could
not be executed in the review environment (no Postgres, no npm registry, no `pnpm`/`tsc`).

## 1. Rate limiting
- Limits are centralised and env-configurable in `lib/security/rate-limit-config.ts`; enforcement is in `proxy.ts` (per-IP for public/auth routes, per-user for authenticated writes) and fails closed.
- **(corrected)** The per-account exponential backoff did not work. `record_auth_failure()` in `20260921270000` declared a variable named `failures`, colliding with the column of the same name; PostgreSQL raises "column reference is ambiguous" on every call, so failures were never recorded. `20260921280000_fix_auth_backoff_functions.sql` fixes this, makes `check_auth_rate_limit()` read-only (no row per probed email), restores the empty `search_path` convention, and prunes stale rows. **Not verified against a live database — apply to staging and confirm a 4th–5th failed login returns 429 with a growing `Retry-After`.**
- **(corrected)** Signup / password reset "do not exist" was misleading. `handle_new_user()` in the schema snapshot provisions an organisation and owner for each new `auth.users` row, so Supabase Auth signup is most likely enabled. Those endpoints, and direct `POST /auth/v1/token?grant_type=password` calls using the public publishable key, bypass every app-level limit. Configure Supabase Auth rate limits and CAPTCHA, or disable signup if it is not intended.
- Remaining gaps: GET routes are not rate limited; the per-IP login limit is a fixed window (only the per-account limit backs off exponentially); a per-account limiter can be used to lock out a known email for up to the backoff cap.

## 2. Input validation
- **(corrected)** `agents/credentials` (secrets) and `execute` imported `assertApiBody` but never called it; `approvals/[id]/resolve`, `approvals/[id]/resume` and `tasks/[id]/execute` imported `assertApiParam` but never called it. All are now enforced. The old regression test only searched for the string "assertApiBody", so an import satisfied it; the replacement tests require actual calls and that every schema is used.
- **(corrected)** Schema-validation failures returned HTTP 500 in every route except login. They now return 400 (413 for oversized bodies) via `validationErrorResponse`; malformed JSON is 400. Only field paths and constraint names are returned, never submitted values.
- Validator fixes: own-property checks (`toString`/`constructor` no longer bypass `additionalProperties:false`), numeric `minimum`/`maximum`, calendar-valid ISO dates, `text`/`multiline-text` formats that reject control characters (blocks CRLF injection in subjects), bounded depth/key count and `__proto__` rejection in free-form objects.
- Agentmail `to` given as a single string is now validated as an email. `test-mcp`'s schema rejected all real JSON-RPC traffic (`jsonrpc`, `initialize`, `resources/list`, `prompts/list`); fixed.
- Remaining: identifier-like fields (`environment`, `provider`, `effect`, `ruleType`, `sourceType`, …) are length- and character-checked but not allow-listed, because the permitted values are not defined in this repository. Free-form `configuration`/`conditions`/`data` objects are bounded but not shape-checked.

## 3. Secrets
- Pattern scan of source and config: no hardcoded keys, tokens or private keys. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are read from client code; `.env*` is git-ignored.
- No `.git` directory was supplied, so history and pushed state are unverified. CI now runs gitleaks over full history.

## 4. Dependencies
- Next.js 16.3.3 is the patched release for the August 2026 critical advisories. `next.config.mjs` sets `images.unoptimized`, so the image-optimisation path is not in use.
- **(corrected)** `pnpm-lock.yaml` resolves `js-yaml@4.2.0`, inside the vulnerable range `>=4.0.0 <4.3.2` (GHSA-2883-xcg3-v3hh, High, CPU-exhaustion DoS). It is transitive; the likely path is the `shadcn` CLI, which is listed under `dependencies` and should be a devDependency. Reachability was not confirmed.
- **Action required (needs network):** `pnpm add -D shadcn`, add `pnpm.overrides: { "js-yaml@<4.3.2": "4.3.2" }`, run `pnpm install`, then `pnpm audit`. The lockfile was not edited by hand because integrity hashes cannot be fabricated. CI now runs `pnpm audit --audit-level=high`.

## 5. Error handling
- **(corrected)** `agents/verify` returned raw database `error.message` text in 11 responses; the previous regression test missed them (different key name, multi-line templates). All now log server-side and return fixed sentences. The MCP scanner and discovery scan runner no longer persist or return raw network/database errors. `poweredByHeader` is disabled.
- New test scans routes and discovery code for any interpolation or forwarding of `.message`.
- Remaining: `lib/execution/engine.ts` still stores raw exception text in the execution audit table (org-scoped, not returned by API routes).

## 6. File uploads
- Verified: no multipart parsing, storage writes, `type="file"` inputs or attachment handling anywhere. The test now checks for those sinks rather than route file names. If uploads are added, enforce size, magic-byte type checks, non-web-root storage and non-executable serving before merging.

## Verification
Status of the launch gates. Only what was actually executed is claimed.

| Gate | Result |
|---|---|
| Unit/regression tests (`pnpm test` equivalent) | **240 pass, 0 fail, 1 skipped** (live Gemini call needs a key). Run with stub packages for `next`, `@supabase/*` and `@google/genai` because the review sandbox has no registry access; the tests mock those modules themselves. Re-run in your environment with real dependencies. |
| `tsc --noEmit` | **Not run with the pinned toolchain.** A partial run (TypeScript 6.0.3, real `@types/node`, no React/Next/Supabase types) reported 24 errors, all in the five test files named in your report; they are fixed and the set of errors elsewhere is identical to the original zip (nothing introduced). Your run counted 25, so one error only appears with the real dependency types or TS 5.7.3. Run `pnpm exec tsc --noEmit` and send any remainder. |
| `pnpm audit` | **Not run** (no registry). `js-yaml@4.2.0` is still in the lockfile; see section 4. |
| `pnpm build` | **Not run.** |
| SQL migrations | **Not run** against Postgres. |

### Fixes made after the first launch-gate run
- **25 TypeScript errors (tests only, `tsconfig` untouched).** `validate-external-url.test.ts`: cast through `unknown` for the `dns.lookup` stub. `execute-route.test.ts`: `duplex: "half"` is required for streamed bodies but missing from `lib.dom`'s `RequestInit`, so it is now typed as `RequestInit & { duplex: "half" }`. `external-response-limit.test.ts`: `Parameters<typeof createServer>[0]` resolved to the options overload, not the request listener; now `RequestListener`. `gemini-budget.test.ts` and `proxy-execute-rate-limit.test.ts`: missing parameter annotations.
- **`no raw server-side outbound fetch remains outside the validated transport`.** The allow-list used `file.endsWith("lib/credentials/mcp.test.ts")` on paths built with `path.join`. On Windows those paths use backslashes, so the allow-list never matches and the two allow-listed files are reported as raw fetches. It now compares POSIX-normalised relative paths. The same pattern in `hardening-regression.test.ts` was fixed. On Linux the test passed before and after, so the failure was a portability defect in the test, not a raw `fetch(` in production code (a scan of `app/api` and `lib` finds `fetch(` only in the two allow-listed files). If your failure output lists any other file, treat that as a real finding.
- **`Cannot find module ...node_modules\next\headers`.** `next` has no `exports` map, so Node's ESM resolver will not add `.js` to `next/headers`. `scripts/ts-test-loader.mjs` now retries bare `next/*` subpaths with `.js`. Reproduced with a stub package: the three affected suites failed before the change and pass after.
