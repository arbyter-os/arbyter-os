import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const read = (relative: string) =>
  // Normalise CRLF to LF so multi-line and ordering assertions hold on Windows checkouts too.
  fs.readFileSync(path.join(process.cwd(), relative), "utf8").replace(/\r\n/g, "\n")

const executionApproval = read("lib/execution/approval.ts")
const genericApproval = read("lib/approvals/approval.ts")
const engine = read("lib/execution/engine.ts")
const resolveRoute = read("app/api/approvals/[approvalId]/resolve/route.ts")
const resumeRoute = read("app/api/approvals/[approvalId]/resume/route.ts")

function indexOf(source: string, needle: string, label: string): number {
  const index = source.indexOf(needle)
  assert.notEqual(index, -1, `${label} not found`)
  return index
}

test("execution approval captures requester from the authenticated server session", () => {
  assert.match(executionApproval, /supabase\.auth\.getUser\(\)/)
  assert.match(executionApproval, /requested_by:\s*user\.id/)
  assert.doesNotMatch(executionApproval, /requestedBy\??\s*:/)
  assert.doesNotMatch(executionApproval, /input\.requestedBy/)
})

test("generic approval creation captures requester server-side and does not accept caller identity", () => {
  assert.match(genericApproval, /supabase\.auth\.getUser\(\)/)
  assert.match(genericApproval, /requested_by:\s*user\.id/)
  assert.doesNotMatch(genericApproval, /requestedBy\??\s*:/)
  assert.doesNotMatch(genericApproval, /input\.requestedBy/)
})

test("execution engine already obtains the authenticated user before creating an approval", () => {
  const auth = indexOf(engine, "const { data: { user }, error: authError }", "engine authentication")
  const approval = indexOf(engine, "createExecutionApproval({", "execution approval creation")
  assert.ok(auth < approval, "approval creation must occur after server-side authentication")
})

test("client-supplied requested_by cannot override the execution approval requester", () => {
  assert.doesNotMatch(executionApproval, /requested_by:\s*input\./)
  assert.doesNotMatch(genericApproval, /requested_by:\s*input\./)
  assert.doesNotMatch(executionApproval, /requestedBy\?:/)
  assert.doesNotMatch(genericApproval, /requestedBy\?:/)
})

test("resolve and resume reject requester records that are missing or belong to another organization", () => {
  assert.match(resolveRoute, /from\("users"\)/)
  assert.match(resolveRoute, /requesterRecord\.organization_id !== organizationId/)
  assert.match(resumeRoute, /from\("users"\)/)
  assert.match(resumeRoute, /requesterRecord\.organization_id !== organizationId/)
})

test("resolve rejects missing requester and self-approval before mutating the approval", () => {
  const requesterCheck = indexOf(resolveRoute, "approval.requested_by === user.id", "resolve self-approval check")
  const update = indexOf(resolveRoute, '.from("approval_requests")\n      .update({', "resolve approval update")
  assert.ok(requesterCheck < update)
  assert.match(resolveRoute, /!approval\.requested_by \|\| typeof approval\.requested_by !== "string"/)
  assert.match(resolveRoute, /The requester cannot approve their own approval request/)
})

test("resume rejects missing requester and self-approval before credential resolution or connector execution", () => {
  const requesterCheck = indexOf(resumeRoute, "approval.requested_by === user.id", "resume self-approval check")
  const credential = indexOf(resumeRoute, "resolveConnectionCredential(", "credential resolution")
  const connector = indexOf(resumeRoute, "executeConnectorAction(", "connector execution")
  assert.ok(requesterCheck < credential)
  assert.ok(requesterCheck < connector)
  assert.match(resumeRoute, /!approval\.requested_by \|\| typeof approval\.requested_by !== "string"/)
  assert.match(resumeRoute, /The requester cannot resume their own approval request/)
})

test("existing approval authorization, integrity, task-agent, and capability checks remain in resume", () => {
  assert.match(resumeRoute, /userRecord\.role !== "owner"/)
  assert.match(resumeRoute, /buildApprovalIntegrityEnvelope\(/)
  assert.match(resumeRoute, /hashApprovalIntegrityEnvelope\(/)
  assert.match(resumeRoute, /assertTaskAssignedToAgent\(/)
  assert.match(resumeRoute, /currentConnector\.capabilities\.includes\(capability as never\)/)
  assert.match(resumeRoute, /currentCapabilities\[action\] !== true/)
})

test("cross-organization approval remains scoped to the authenticated organization", () => {
  assert.match(resolveRoute, /\.eq\("organization_id", organizationId\)/)
  assert.match(resumeRoute, /\.eq\("organization_id", organizationId\)/)
})
