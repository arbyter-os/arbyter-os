import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"

// P0-6 regression suite: the AgentMail outbound identity (the inbox in the
// request path) must be organization-bound, not one hardcoded shared inbox.
//
// Provider model (agentmail SDK 0.5.27): the sender identity is the inbox_id
// in the URL path; the API key authenticates the whole account.
//
// Resolution order under test:
//   1. credential metadata .agentmail_inbox            (per-org/per-connection)
//   2. connectionConfiguration .agentmail_inbox        (owner-set)
//   3. AGENTMAIL_INBOX env                             (deploy default)
//   4. shared default ONLY outside production; in production this FAILS CLOSED.

const fetchCalls: { url: string; init: { method: string; body: string } }[] = []

const validateExternalUrlStub = `
export async function validateExternalUrl(endpoint) {
  return { valid: true, url: new URL(endpoint) }
}
export async function fetchValidatedExternalUrl(validation, init) {
  globalThis.__inboxFetchCalls.push({ url: String(validation.url), init })
  return { ok: true, status: 200, json: async () => ({ id: "msg-1" }) }
}
`

const stubUrl = (code: string) => `data:text/javascript,${encodeURIComponent(code)}`
const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
  `  if (specifier === "@/lib/security/validate-external-url") return { url: ${JSON.stringify(stubUrl(validateExternalUrlStub))}, shortCircuit: true }\n` +
  "  return nextResolve(specifier, context)\n" +
  "}\n"
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

declare global {
  // eslint-disable-next-line no-var
  var __inboxFetchCalls: { url: string; init: { method: string; body: string } }[] | undefined
}

const { agentMailConnector } = await import("../lib/connectors/agentmail.ts")

function freshCalls() {
  globalThis.__inboxFetchCalls = []
  return globalThis.__inboxFetchCalls
}

function lastInbox() {
  const calls = globalThis.__inboxFetchCalls ?? []
  const match = calls[calls.length - 1]?.url.match(/\/v0\/inboxes\/([^/]+)\//)
  return match ? decodeURIComponent(match[1]!) : null
}

const baseContext = {
  connectionId: "conn-1",
  agentId: "agent-1",
  organizationId: "org-1",
  credential: { id: "cred-1", type: "api_key", secret: "test-secret" },
}

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>) {
  return async () => {
    const previous: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(vars)) {
      previous[k] = process.env[k]
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    try {
      await fn()
    } finally {
      for (const [k, v] of Object.entries(previous)) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
    }
  }
}

test(
  "P0-6: the credential-bound inbox is used as the outbound sender identity",
  withEnv({ NODE_ENV: "production", VERCEL_ENV: undefined, AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      {
        ...baseContext,
        credential: {
          ...baseContext.credential!,
          metadata: { agentmail_inbox: "org1-mail@agentmail.to" },
        },
      },
    )
    assert.equal(result.success, true)
    assert.equal(lastInbox(), "org1-mail@agentmail.to", "the org-bound inbox must be the sender identity")
  }),
)

test(
  "P0-6: the connection-configuration inbox is used when no credential binding exists",
  withEnv({ NODE_ENV: "production", AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      { ...baseContext, connectionConfiguration: { agentmail_inbox: "owner-set@agentmail.to" } },
    )
    assert.equal(result.success, true)
    assert.equal(lastInbox(), "owner-set@agentmail.to")
  }),
)

test(
  "P0-6: credential binding wins over connection configuration",
  withEnv({ NODE_ENV: "test", AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      {
        ...baseContext,
        credential: { ...baseContext.credential!, metadata: { agentmail_inbox: "from-credential@agentmail.to" } },
        connectionConfiguration: { agentmail_inbox: "from-connection@agentmail.to" },
      },
    )
    assert.equal(result.success, true)
    assert.equal(lastInbox(), "from-credential@agentmail.to")
  }),
)

test(
  "P0-6: an invalid configured inbox fails closed (no request)",
  withEnv({ NODE_ENV: "production", AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      {
        ...baseContext,
        credential: { ...baseContext.credential!, metadata: { agentmail_inbox: "not-an-email" } },
      },
    )
    assert.equal(result.success, false)
    assert.equal(freshCalls().length, 0)
  }),
)

test(
  "P0-6: production without any org-bound inbox FAILS CLOSED (no shared identity, no request)",
  withEnv({ NODE_ENV: "production", VERCEL_ENV: undefined, AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      baseContext,
    )
    assert.equal(result.success, false)
    assert.match(result.error ?? "", /sender identity/i)
    assert.equal(freshCalls().length, 0, "no outbound request may leave with a shared identity in production")
  }),
)

test(
  "P0-6: outside production the documented shared default still works (backwards compatibility)",
  withEnv({ NODE_ENV: "test", VERCEL_ENV: undefined, AGENTMAIL_INBOX: undefined }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      baseContext,
    )
    assert.equal(result.success, true)
    assert.equal(lastInbox(), "creatorai@agentmail.to")
  }),
)

test(
  "P0-6: the AGENTMAIL_INBOX deployment default applies when no per-org binding exists",
  withEnv({ NODE_ENV: "production", VERCEL_ENV: undefined, AGENTMAIL_INBOX: "deploy-default@agentmail.to" }, async () => {
    freshCalls()
    const result = await agentMailConnector.execute(
      { action: "messages.send", payload: { data: { to: "a@example.com", text: "hi" } } },
      baseContext,
    )
    assert.equal(result.success, true)
    assert.equal(lastInbox(), "deploy-default@agentmail.to")
  }),
)
