import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const here = dirname(fileURLToPath(import.meta.url))
const route = readFileSync(
  join(here, "../../app/api/approvals/[approvalId]/resume/route.ts"),
  "utf8",
)

test("resume verifies the complete approval integrity envelope", () => {
  assert.match(route, /buildApprovalIntegrityEnvelope\(\{/)
  for (const field of [
    "execution_id",
    "agent_id",
    "connection_id",
    "provider",
    "action",
    "capability",
    "input_data",
    "task_id",
  ]) {
    assert.match(route, new RegExp(`${field}:|${field},`))
  }
  assert.match(route, /hashApprovalIntegrityEnvelope\(integrityEnvelope\)/)
  assert.match(route, /currentIntegrityHash !== approvedIntegrityHash/)
})

test("invalid integrity is rejected before credential resolution or connector execution", () => {
  const integrityCheck = route.indexOf("currentIntegrityHash !== approvedIntegrityHash")
  const credentialResolution = route.indexOf("resolveConnectionCredential(")
  const connectorExecution = route.indexOf("executeConnectorAction(")

  assert.ok(integrityCheck >= 0)
  assert.ok(credentialResolution > integrityCheck)
  assert.ok(connectorExecution > integrityCheck)
})

test("resume keeps owner/admin authorization and organization isolation", () => {
  assert.match(route, /userRecord\.role !== "owner"[\s\S]*userRecord\.role !== "admin"/)
  assert.match(route, /\.eq\("organization_id", organizationId\)/)
  assert.match(route, /\.eq\("agent_id", execution\.agent_id\)/)
})

test("execution claim remains bound to the integrity-checked execution context", () => {
  assert.match(route, /\.eq\("agent_id", execution\.agent_id\)/)
  assert.match(route, /\.eq\("agent_connection_id", execution\.agent_connection_id\)/)
  assert.match(route, /\.eq\("task_id", execution\.task_id\)/)
  assert.match(route, /\.eq\("input_data", execution\.input_data\)/)
})
