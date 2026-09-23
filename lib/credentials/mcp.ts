import { createAdminClient } from "@/lib/supabase/admin"

const SECRET_PREFIX = "arbyter/discovery/mcp"

type VaultResult = { data: unknown; error: { message: string } | null }

function secretName(organizationId: string, sourceId: string) {
  return `${SECRET_PREFIX}/${organizationId}/${sourceId}`
}

function secretDescription(organizationId: string, sourceId: string) {
  return `MCP authorization credential for discovery source ${sourceId} in organization ${organizationId}`
}

export async function createMcpSecret({
  organizationId,
  sourceId,
  secret,
}: {
  organizationId: string
  sourceId: string
  secret: string
}): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = (await admin.schema("vault").rpc("create_secret", {
    new_secret: secret,
    new_name: secretName(organizationId, sourceId),
    new_description: secretDescription(organizationId, sourceId),
    new_key_id: null,
  })) as VaultResult

  if (error || typeof data !== "string" || !data) {
    throw new Error("Unable to securely store the MCP credential.")
  }

  return data
}

export async function updateMcpSecret({
  secretReference,
  organizationId,
  sourceId,
  secret,
}: {
  secretReference: string
  organizationId: string
  sourceId: string
  secret: string
}): Promise<void> {
  const admin = createAdminClient()
  const expectedName = secretName(organizationId, sourceId)
  const { data: existing, error: lookupError } = await admin
    .schema("vault")
    .from("secrets")
    .select("id, name")
    .eq("id", secretReference)
    .eq("name", expectedName)
    .maybeSingle()

  if (lookupError || !existing) {
    throw new Error("Unable to securely update the MCP credential.")
  }

  const { error } = (await admin.schema("vault").rpc("update_secret", {
    secret_id: secretReference,
    new_secret: secret,
    new_name: secretName(organizationId, sourceId),
    new_description: secretDescription(organizationId, sourceId),
  })) as VaultResult

  if (error) {
    throw new Error("Unable to securely update the MCP credential.")
  }
}

export async function resolveMcpSourceAuthorization({
  organizationId,
  sourceId,
}: {
  organizationId: string
  sourceId: string
}): Promise<string | null> {
  const admin = createAdminClient()
  const { data: source, error: sourceError } = await admin
    .from("discovery_sources")
    .select("id, organization_id, source_type, configuration")
    .eq("id", sourceId)
    .eq("organization_id", organizationId)
    .eq("source_type", "mcp")
    .maybeSingle()

  if (sourceError || !source) {
    throw new Error("MCP discovery source is unavailable.")
  }

  const configuration = source.configuration ?? {}
  const secretReference =
    configuration &&
    typeof configuration === "object" &&
    typeof configuration.authorization_secret_reference === "string"
      ? configuration.authorization_secret_reference.trim()
      : ""

  if (!secretReference) return null

  const expectedName = secretName(organizationId, sourceId)
  const { data: secret, error: secretError } = await admin
    .schema("vault")
    .from("decrypted_secrets")
    .select("id, name, decrypted_secret")
    .eq("id", secretReference)
    .eq("name", expectedName)
    .maybeSingle()

  if (secretError || !secret?.decrypted_secret) {
    throw new Error("MCP authorization credential is unavailable.")
  }

  return secret.decrypted_secret
}
