import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const sourceRoute = readFileSync("./app/api/discovery/sources/route.ts", "utf8")
const runScan = readFileSync("./lib/discovery/run-scan.ts", "utf8")
const helper = readFileSync("./lib/credentials/mcp.ts", "utf8")
const client = readFileSync("./app/(app)/discovery/page.tsx", "utf8")
const mcpRoute = readFileSync("./app/api/discovery/mcp/route.ts", "utf8")

test("MCP source storage strips plaintext authorization before database persistence", () => {
  assert.ok(sourceRoute.includes("requestedMcpAuthorization(rawConfiguration)"))
  assert.ok(sourceRoute.includes("authorization_secret_reference"))
  assert.ok(sourceRoute.includes("configuration, created_by: user.id"))
  assert.ok(!sourceRoute.includes("configuration: rawConfiguration"))
  assert.ok(!sourceRoute.includes("result.authorization"))
})

test("MCP source storage uses the existing Supabase Vault mechanism", () => {
  assert.ok(sourceRoute.includes("createMcpSecret("))
  assert.ok(sourceRoute.includes("updateMcpSecret("))
  assert.ok(helper.includes('schema("vault").rpc("create_secret"'))
  assert.ok(helper.includes('schema("vault").rpc("update_secret"'))
  assert.ok(!/createHash|createCipher|createDecipher|AES|encrypt\(/i.test(helper))
})

test("MCP runtime resolves authorization from the organization-scoped source and Vault", () => {
  assert.ok(runScan.includes("resolveMcpSourceAuthorization("))
  assert.ok(helper.includes('.eq("id", sourceId)'))
  assert.ok(helper.includes('.eq("organization_id", organizationId)'))
  assert.ok(helper.includes('.schema("vault")'))
  assert.ok(helper.includes("decrypted_secrets"))
  assert.ok(!runScan.includes("configuration.authorization"))
})

test("MCP source API does not return the secret or Vault reference", () => {
  assert.ok(sourceRoute.includes("NextResponse.json({ id: data.id })"))
  assert.ok(!sourceRoute.includes("decrypted_secret"))
  assert.ok(!sourceRoute.includes("NextResponse.json({ authorization_secret_reference"))
})

test("MCP browser code sends the token only to the server and does not read it from saved sources", () => {
  assert.ok(client.includes("fetch('/api/discovery/sources'"))
  assert.ok(client.includes("configuration.authorization = mcpToken.trim()"))
  assert.ok(client.includes("configuration,\n          }),"))
  assert.ok(!client.includes("source.configuration.authorization"))
  assert.ok(!client.includes("decrypted_secret"))
})

test("MCP test endpoint does not return request authorization", () => {
  assert.ok(mcpRoute.includes("headers.Authorization = body.authorization.trim()"))
  assert.ok(!mcpRoute.includes("return NextResponse.json({ authorization"))
  assert.ok(!mcpRoute.includes("return NextResponse.json({ headers"))
})

test("MCP credential rotation updates the existing Vault secret", () => {
  assert.ok(sourceRoute.includes("previousReference"))
  assert.ok(sourceRoute.includes("secret: authorization"))
  assert.ok(sourceRoute.includes("updateMcpSecret("))
})

test("disabling MCP authorization clears the Vault value and removes its source reference", () => {
  assert.ok(sourceRoute.includes('secret: ""'))
  assert.ok(sourceRoute.includes("else if (previousReference)"))
  assert.ok(sourceRoute.includes("withMcpSecretReference(configuration, secretReference)"))
})

test("MCP secret values are not logged", () => {
  assert.ok(!/console\.(log|error|warn)[^\n]*(secret|authorization)/i.test(helper))
  assert.ok(!/console\.(log|error|warn)[^\n]*(secret|authorization)/i.test(runScan))
})
