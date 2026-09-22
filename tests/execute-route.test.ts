import { strict as assert } from "node:assert"
import { register } from "node:module"
import { test } from "node:test"
import type { OrchestrationResult } from "../lib/orchestration/index.ts"
import { ConnectorExecutionAuthorizationError } from "../lib/security/authorize-connector-execution.ts"

const result: OrchestrationResult = {
  intent: {
    intent: "send_email",
    action: "send_email",
    parameters: {
      recipient: "test@example.com",
      message: "hello",
    },
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
  if (!request.body) throw new Error("Request body is required.")
  const reader = request.body.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > 256 * 1024) throw new RequestBodyLimitError("Request body too large.")
    chunks.push(value)
  }
  return JSON.parse(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8"))
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

const loader = "\n" +
  "const nextServer = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(nextServerStub)}`) + "\n" +
  "const orchestration = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(orchestrationStub)}`) + "\n" +
  "const authorization = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(authorizationStub)}`) + "\n" +
  "const requestSize = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(requestSizeStub)}`) + "\n" +
  "const requestBody = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(requestBodyStub)}`) + "\n" +
  "const privilegedAuth = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(privilegedAuthStub)}`) + "\n" +
  "const supabase = " + JSON.stringify(`data:text/javascript,${encodeURIComponent(supabaseStub)}`) + "\n" +
  "export async function resolve(specifier, context, nextResolve) {\n" +
  "  if (specifier === \"next/server\") return { url: nextServer, shortCircuit: true }\n" +
  "  if (specifier === \"@/lib/orchestration\") return { url: orchestration, shortCircuit: true }\n" +
  "  if (specifier === \"@/lib/security/authorize-connector-execution\") return { url: authorization, shortCircuit: true }\n" +
  "  if (specifier === \"@/lib/security/validate-request-size\") return { url: requestSize, shortCircuit: true }\n" +
  "  if (specifier === \"@/lib/security/privileged-auth\") return { url: privilegedAuth, shortCircuit: true }\n" +
  "  if (specifier === \"@/lib/supabase/server\") return { url: supabase, shortCircuit: true }\n" +
  "  return nextResolve(specifier, context)\n" +
  "}\n"


register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url)

const { handleExecuteRequest } = await import("../app/api/execute/route.ts")

type Orchestrator = (message: string) => Promise<OrchestrationResult>

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

async function run(body: string, orchestrate: Orchestrator) {
  return handleExecuteRequest(request(body), orchestrate)
}

test("valid POST accepts message and calls orchestration", async () => {
  let received = ""

  const response = await run(
    JSON.stringify({ message: "Send an email to test@example.com." }),
    async (message) => {
      received = message
      return result
    },
  )

  assert.equal(response.status, 200)
  assert.equal(received, "Send an email to test@example.com.")
  assert.deepEqual(await json(response), result)
})

test("missing message returns 400", async () => {
  const response = await run(JSON.stringify({}), async () => result)
  assert.equal(response.status, 400)
})

test("empty message returns 400", async () => {
  const response = await run(JSON.stringify({ message: "   " }), async () => result)
  assert.equal(response.status, 400)
})

test("non-string message returns 400", async () => {
  const response = await run(JSON.stringify({ message: 123 }), async () => result)
  assert.equal(response.status, 400)
})

test("malformed JSON returns 400", async () => {
  const response = await run("{\"message\":", async () => result)
  assert.equal(response.status, 400)
})


test("chunked request bodies over 256 KiB are rejected before JSON parsing", async () => {
  const oversized = new TextEncoder().encode(JSON.stringify({ message: "a".repeat(300 * 1024) }))
  // `duplex: "half"` is required by Node/undici for streamed request bodies but is missing from lib.dom's RequestInit.
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: { "content-type": "application/json" },
    duplex: "half",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(oversized)
        controller.close()
      },
    }),
  }
  const request = new Request("http://localhost/api/execute", init)

  const response = await handleExecuteRequest(request, async () => {
    throw new Error("orchestration must not run")
  })

  assert.equal(response.status, 413)
  assert.deepEqual(await json(response), { error: "Request body too large." })
})

test("message exactly at 32 KiB is accepted", async () => {
  const message = "a".repeat(32 * 1024)
  let called = false

  const response = await run(
    JSON.stringify({ message }),
    async () => {
      called = true
      return result
    },
  )

  assert.equal(response.status, 200)
  assert.equal(called, true)
})

test("message over 32 KiB returns 413", async () => {
  const message = "a".repeat(32 * 1024 + 1)
  let called = false

  const response = await run(
    JSON.stringify({ message }),
    async () => {
      called = true
      return result
    },
  )

  assert.equal(response.status, 413)
  assert.deepEqual(await json(response), { error: "Message is too large." })
  assert.equal(called, false)
})

test("multibyte UTF-8 message within 32 KiB is accepted", async () => {
  const message = "\u00e9".repeat(16 * 1024)
  let received = ""

  const response = await run(
    JSON.stringify({ message }),
    async (value) => {
      received = value
      return result
    },
  )

  assert.equal(response.status, 200)
  assert.equal(received, message)
})

test("multibyte UTF-8 message over 32 KiB returns 413", async () => {
  const message = "\u00e9".repeat(16 * 1024 + 1)
  let called = false

  const response = await run(
    JSON.stringify({ message }),
    async () => {
      called = true
      return result
    },
  )

  assert.equal(response.status, 413)
  assert.equal(called, false)
})

test("orchestration failure returns 500 without leaking the internal error", async () => {
  const response = await run(JSON.stringify({ message: "Send an email." }), async () => {
    throw new Error("connector failed")
  })

  assert.equal(response.status, 500)
  assert.deepEqual(await json(response), { error: "Execution orchestration failed." })
})

test("execution authorization failure returns 403", async () => {
  const response = await run(JSON.stringify({ message: "Send an email." }), async () => {
    throw new ConnectorExecutionAuthorizationError()
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await json(response), {
    error: "Execution request could not be completed.",
  })
})
