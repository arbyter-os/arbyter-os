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
export function isConnectorExecutionAuthorizationError(error) {
  return error?.code === "CONNECTOR_EXECUTION_FORBIDDEN"
}
`

const loader = `
const nextServer = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(nextServerStub)}`)}
const orchestration = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(orchestrationStub)}`)}
const authorization = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(authorizationStub)}`)}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return { url: nextServer, shortCircuit: true }
  if (specifier === "@/lib/orchestration") return { url: orchestration, shortCircuit: true }
  if (specifier === "@/lib/security/authorize-connector-execution") return { url: authorization, shortCircuit: true }
  return nextResolve(specifier, context)
}
`

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

test("orchestration failure returns 500 with the error", async () => {
  const response = await run(JSON.stringify({ message: "Send an email." }), async () => {
    throw new Error("connector failed")
  })

  assert.equal(response.status, 500)
  assert.deepEqual(await json(response), { error: "connector failed" })
})

test("execution authorization failure returns 403", async () => {
  const response = await run(JSON.stringify({ message: "Send an email." }), async () => {
    throw new ConnectorExecutionAuthorizationError()
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await json(response), {
    error: "Only an owner or admin can execute connectors.",
  })
})
