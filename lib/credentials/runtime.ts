import { createAdminClient } from "@/lib/supabase/admin"

export type ResolvedConnectionCredential = {
  id: string
  type: string
  secret: string
}

export async function resolveConnectionCredential({
  organizationId,
  connectionId,
}: {
  organizationId: string
  connectionId: string
}): Promise<ResolvedConnectionCredential | null> {
  const admin = createAdminClient()

  const { data: credential, error } = await admin
    .from("agent_credentials")
    .select(
      "id, credential_type, secret_reference, status, expires_at"
    )
    .eq("organization_id", organizationId)
    .eq("agent_connection_id", connectionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to resolve connection credential.")
  }

  if (!credential) {
    return null
  }

  if (
    credential.expires_at &&
    new Date(credential.expires_at).getTime() <= Date.now()
  ) {
    throw new Error("Connection credential has expired.")
  }

  if (!credential.secret_reference) {
    throw new Error("Connection credential is unavailable.")
  }

  const { data: secret, error: secretError } = await admin
    .schema("vault")
    .from("decrypted_secrets")
    .select("id, decrypted_secret")
    .eq("id", credential.secret_reference)
    .maybeSingle()

  if (secretError || !secret?.decrypted_secret) {
    throw new Error("Connection credential is unavailable.")
  }

  return {
    id: credential.id,
    type: credential.credential_type,
    secret: secret.decrypted_secret,
  }
}
