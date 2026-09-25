import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  authorizeApprovalResources,
  authorizeAgentOrganization,
  authorizeGovernanceResources,
} from "./authorization"

type Row = Record<string, unknown>

type TableState = {
  rows: Row[]
}

function fakeSupabase(tables: Record<string, TableState>) {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {}

      const builder = {
        select() {
          return builder
        },
        eq(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        async maybeSingle() {
          const rows = tables[table]?.rows ?? []
          const row = rows.find((candidate) =>
            Object.entries(filters).every(
              ([key, value]) => candidate[key] === value
            )
          )
          return { data: row ?? null, error: null }
        },
      }

      return builder
    },
  } as never
}

function authorizationTables() {
  return {
    ai_agents: {
      rows: [
        { id: "agent-a", organization_id: "org-a" },
        { id: "agent-b", organization_id: "org-b" },
      ],
    },
    tasks: {
      rows: [
        { id: "task-a", organization_id: "org-a" },
        { id: "task-b", organization_id: "org-b" },
      ],
    },
    agent_tasks: {
      rows: [{ task_id: "task-a", agent_id: "agent-a" }],
    },
    agent_executions: {
      rows: [{ id: "execution-a", organization_id: "org-a" }],
    },
    agent_connections: {
      rows: [{ id: "connection-a", organization_id: "org-a" }],
    },
  }
}

test("request_approval authorization accepts same-org assigned agent and task", async () => {
  const result = await authorizeApprovalResources(
    fakeSupabase(authorizationTables()),
    "org-a",
    "agent-a",
    "task-a"
  )

  assert.equal(result, true)
})

test("request_approval rejects an agent from another organization", async () => {
  const result = await authorizeApprovalResources(
    fakeSupabase(authorizationTables()),
    "org-a",
    "agent-b",
    "task-a"
  )

  assert.equal(result, false)
})

test("request_approval rejects a task from another organization", async () => {
  const result = await authorizeApprovalResources(
    fakeSupabase(authorizationTables()),
    "org-a",
    "agent-a",
    "task-b"
  )

  assert.equal(result, false)
})

test("request_approval rejects nonexistent resources", async () => {
  const result = await authorizeApprovalResources(
    fakeSupabase(authorizationTables()),
    "org-a",
    "missing-agent",
    "missing-task"
  )

  assert.equal(result, false)
})

test("request_approval rejects a task/agent mismatch", async () => {
  const tables = authorizationTables()
  tables.agent_tasks.rows = []

  const result = await authorizeApprovalResources(
    fakeSupabase(tables),
    "org-a",
    "agent-a",
    "task-a"
  )

  assert.equal(result, false)
})

test("governance agent authorization is organization-scoped", async () => {
  const tables = authorizationTables()

  assert.equal(
    await authorizeAgentOrganization(
      fakeSupabase(tables),
      "org-a",
      "agent-a"
    ),
    true
  )
  assert.equal(
    await authorizeAgentOrganization(
      fakeSupabase(tables),
      "org-a",
      "agent-b"
    ),
    false
  )
  assert.equal(
    await authorizeAgentOrganization(
      fakeSupabase(tables),
      "org-a",
      "missing-agent"
    ),
    false
  )
})

test("governance API resource authorization is organization-scoped", async () => {
  const tables = authorizationTables()

  assert.equal(
    await authorizeGovernanceResources(fakeSupabase(tables), "org-a", {
      agentId: "agent-a",
      taskId: "task-a",
      executionId: "execution-a",
      agentConnectionId: "connection-a",
    }),
    true
  )

  assert.equal(
    await authorizeGovernanceResources(fakeSupabase(tables), "org-a", {
      agentId: "agent-b",
    }),
    false
  )

  assert.equal(
    await authorizeGovernanceResources(fakeSupabase(tables), "org-a", {
      taskId: "task-b",
    }),
    false
  )

  assert.equal(
    await authorizeGovernanceResources(fakeSupabase(tables), "org-a", {
      executionId: "missing-execution",
    }),
    false
  )

  assert.equal(
    await authorizeGovernanceResources(fakeSupabase(tables), "org-a", {
      agentConnectionId: "missing-connection",
    }),
    false
  )
})

test("authorization occurs before the approval write", () => {
  const source = readFileSync(
    resolve(process.cwd(), "lib/governance/action-executor.ts"),
    "utf8"
  )
  const authorizationIndex = source.indexOf("authorizeApprovalResources(")
  const approvalWriteIndex = source.indexOf('.from("approval_requests")')

  assert.ok(authorizationIndex >= 0)
  assert.ok(approvalWriteIndex > authorizationIndex)
})

test("org-scoped agent authorization survives as the governance guard (P0-5)", () => {
  // P0-5: the legacy lib/orchestrator engine was removed. Its governance
  // module (lib/orchestrator/governance.ts) was the only caller of
  // authorizeAgentOrganization with a policy_assignments lookup behind it.
  // The surviving production boundary is lib/execution/engine.ts, which
  // resolves the agent via an organization-scoped ai_agents query before any
  // execution. Lock that ordering in as the replacement invariant.
  const source = readFileSync(
    resolve(process.cwd(), "lib/execution/engine.ts"),
    "utf8"
  )
  const agentIndex = source.indexOf('.from("ai_agents")')
  const executionIndex = source.indexOf("executeConnectorAction(")
  const identityIndex = source.indexOf("assertVerifiedAgentIdentity(")

  assert.ok(agentIndex >= 0, "engine must load the agent from ai_agents scoped by organization")
  assert.ok(source.includes('.eq("organization_id", input.organizationId)'))
  assert.ok(identityIndex > agentIndex, "the verified-identity gate must follow the org-scoped agent lookup")
  assert.ok(executionIndex > identityIndex, "no connector execution may precede the identity gate")
})

test("governance API uses a generic unauthorized resource response", () => {
  const source = readFileSync(
    resolve(process.cwd(), "app/api/governance/evaluate/route.ts"),
    "utf8"
  )

  assert.match(source, /authorizeGovernanceResources\(/)
  assert.match(
    source,
    /The requested governance resource is not authorized\./
  )
  assert.match(source, /status: 403/)
})
