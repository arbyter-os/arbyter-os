import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"
import type { OrchestrationResult } from "../lib/orchestration/index.ts"

// Route-level error-contract tests using the REAL budget and mapping modules:
// - GeminiBudgetExceededError must map to 429 with Retry-After (not 500)
// - IntentMappingError must map to 400 with the contract message
// The MFA 403 mapping is covered by the existing proxy tests; here the
// privileged-auth stub keeps the auth path happy.

const result: OrchestrationResult = {
  intent: {
    intent: "send_email",
    action: "send_email",
    parameters: { to: "test@example.com", text: "hello" },
    required_capabilities: ["messages.send"],
  },
  candidates: [],
  selectedAgent: null,
  execution: null,
  latencyMs: 1,
  status: "no_compatible_agent",
}

const nextServerStub = `
export class NextRequest extends Request {}
export class NextResponse extends Response {
  static json(body, init) {
    const headers = new Headers(init?.headers)
    headers.set("content-type", "application/json")
    return new Response(JSON.stringify(body), { ...init, headers })
  }
}
`

const orchestrationStub = `
export async function orchestrateUserRequest() {
  throw new Error("real orchestration must not run in route unit tests")
}
`

const authorizationStub = `
export class ConnectorExecutionAuthorizationError extends Error {
  constructor() { super("Only an owner or admin can execute connectors."); this.code = "CONNECTOR_EXECUTION_FORBIDDEN" }
}
export function isConnectorExecutionAuthorizationError(error) {
  return error?.code === "CONNECTOR_EXECUTION_FORBIDDEN"
}
export async function authorizeConnectorExecution() {}
`

const supabaseStub = `
export function createClient() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from() {
      return {
        select() { return this },
        eq() { return this },
        async maybeSingle() { return { data: { organization_id: "org-1" }, error: null } },
      }
    },
  }
}
`

const requestBodyStub = `
export class RequestBodyLimitError extends Error {}
export async function readJsonBody(request) {
  return request.json()
}
`

const privilegedAuthStub = `
export async function requirePrivilegedMfa() {}
export function isPrivilegedMfaRequiredError() { return false }
`

const requestSizeStub = `
export const MAX_MESSAGE_BYTES = 32 * 1024
export function validateMessageSize(message) {
  return Buffer.byteLength(message, "utf8") <= MAX_MESSAGE_BYTES
}
`

// api-schemas stub: accept the execute body shape without the real schema engine.
const apiSchemasStub = `
export function assertApiBody(body, key) {
  if (key !== "execute") throw new Error("unexpected schema key: " + key)
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid")
  const keys = Object.keys(body)
  if (keys.length !== 1 || typeof body.message !== "string" || body.message.length < 1 || body.message.length > 64000) {
    throw new Error("invalid execute body")
  }
}
export function validationErrorResponse(error) {
  return null
}
`

const validationErrorsStub = `
export function validationErrorResponse(error) {
  return null
}
`

function stubUrl(code: string) {
  return `data:text/javascript,${encodeURIComponent(code)}`
}

const specs: Array<[string, string]> = [
  ["next/server", nextServerStub],
  ["@/lib/orchestration", orchestrationStub],
  ["@/lib/security/authorize-connector-execution", authorizationStub],
  ["@/lib/security/validate-request-size", requestSizeStub],
  ["@/lib/security/privileged-auth", privilegedAuthStub],
  ["@/lib/supabase/server", supabaseStub],
  ["@/lib/security/request-body", requestBodyStub],
  ["@/lib/validation/api-schemas", apiSchemasStub],
  ["@/lib/validation/errors", validationErrorsStub],
]

const loader =
  "export async function resolve(specifier, context, nextResolve) {\n" +
  specs
    .map(([specifier, code]) => {
      const url = JSON.stringify(stubUrl(code))
      const target = JSON.stringify(specifier)
      return `  if (specifier === ${target}) return { url: ${url}, shortCircuit: true }\n`
    })
    .join("") +
  "  return nextResolve(specifier, context)\n" +
  "}\n"

register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

const { handleExecuteRequest } = await import("../app/api/execute/route.ts")

function request(body: string): Request {
  return new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  })
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

test("GeminiBudgetExceededError maps to 429 with Retry-After", async () => {
  const { GeminiBudgetExceededError } = await import("../lib/security/gemini-budget.ts")

  const response = await handleExecuteRequest(request(JSON.stringify({ message: "hi" })), async () => {
    throw new GeminiBudgetExceededError()
  })

  assert.equal(response.status, 429)
  assert.equal(response.headers.get("retry-after"), "60")
  const body = await json(response)
  assert.match(String(body.error), /budget exceeded/i)
})

test("IntentMappingError maps to 400 with fixed message and code", async () => {
  const { IntentMappingError } = await import("../lib/connectors/intent-mapping.ts")

  const response = await handleExecuteRequest(request(JSON.stringify({ message: "hi" })), async () => {
    throw new IntentMappingError("A recipient is required to send a message.")
  })

  assert.equal(response.status, 400)
  const body = await json(response)
  // Fixed message + stable code; the specific contract reason stays in logs.
  assert.equal(body.error, "The request could not be mapped to a connector action.")
  assert.equal(body.code, "INTENT_MAPPING_FAILED")
})

test("ordinary orchestration failures still map to 500", async () => {
  const response = await handleExecuteRequest(request(JSON.stringify({ message: "hi" })), async () => {
    throw new Error("boom")
  })

  assert.equal(response.status, 500)
  const body = await json(response)
  assert.equal(body.error, "Execution orchestration failed.")
})

test("valid request still succeeds end-to-end", async () => {
  const response = await handleExecuteRequest(request(JSON.stringify({ message: "hi" })), async () => result)

  assert.equal(response.status, 200)
  assert.deepEqual(await json(response), result)
})
