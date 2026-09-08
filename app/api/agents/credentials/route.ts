import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

type CredentialRequest = {
  agentConnectionId?: string
  name?: string
  credentialType?: string
  secret?: string
  expiresAt?: string | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate the current user.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    // 2. Resolve the user's organization.
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Unable to resolve your organization." },
        { status: 403 }
      )
    }

    const organizationId = profile.organization_id

    // 3. Parse and validate the request.
    const body = (await request.json()) as CredentialRequest

    const agentConnectionId = body.agentConnectionId?.trim()
    const name = body.name?.trim()
    const credentialType = body.credentialType?.trim() || "api_key"
    const secret = body.secret

    if (!agentConnectionId) {
      return NextResponse.json(
        { error: "agentConnectionId is required." },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: "Credential name is required." },
        { status: 400 }
      )
    }

    if (!secret || typeof secret !== "string") {
      return NextResponse.json(
        { error: "Credential secret is required." },
        { status: 400 }
      )
    }

    if (secret.length > 10000) {
      return NextResponse.json(
        { error: "Credential secret is too large." },
        { status: 400 }
      )
    }

    // 4. Verify the connection belongs to this organization.
    const { data: connection, error: connectionError } = await supabase
      .from("agent_connections")
      .select("id, organization_id, agent_id, provider, connection_type")
      .eq("id", agentConnectionId)
      .eq("organization_id", organizationId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Agent connection not found." },
        { status: 404 }
      )
    }

    // 5. Use the privileged client only on the server.
    const admin = createAdminClient()

    // 6. Store the actual secret in Supabase Vault.
    //
    // IMPORTANT:
    // The secret itself is never written to agent_credentials.
    // Only the UUID returned by Vault is stored there.
    const vaultName = `arbyter/${organizationId}/${agentConnectionId}/${name}`

    const { data: vaultSecretId, error: vaultError } = await admin.rpc(
      "create_secret",
      {
        new_secret: secret,
        new_name: vaultName,
        new_description: `Arbyter credential for ${connection.provider || "custom"} agent connection`,
        new_key_id: null,
      }
    )

    if (vaultError || !vaultSecretId) {
      console.error("Vault credential creation failed:", vaultError)

      return NextResponse.json(
        { error: "Unable to securely store the credential." },
        { status: 500 }
      )
    }

    // 7. Store only metadata + opaque Vault reference.
    const { data: credential, error: credentialError } = await admin
      .from("agent_credentials")
      .insert({
        organization_id: organizationId,
        agent_connection_id: agentConnectionId,
        name,
        credential_type: credentialType,
        secret_reference: vaultSecretId,
        status: "active",
        expires_at: body.expiresAt || null,
        last_rotated_at: new Date().toISOString(),
        metadata: {
          provider: connection.provider,
          connection_type: connection.connection_type,
        },
      })
      .select(
        "id, organization_id, agent_connection_id, name, credential_type, status, expires_at, last_rotated_at, created_at, updated_at"
      )
      .single()

    // 8. If the database insert fails, remove the Vault secret so we
    // don't leave an orphaned secret behind.
    if (credentialError || !credential) {
      console.error("Credential metadata creation failed:", credentialError)

      await admin.rpc("delete_secret", {
        secret_id: vaultSecretId,
      })

      return NextResponse.json(
        { error: "Unable to save credential metadata." },
        { status: 500 }
      )
    }

    // 9. Never return the secret or the Vault reference to the browser.
    return NextResponse.json(
      {
        success: true,
        credential: {
          id: credential.id,
          name: credential.name,
          credentialType: credential.credential_type,
          status: credential.status,
          expiresAt: credential.expires_at,
          lastRotatedAt: credential.last_rotated_at,
          createdAt: credential.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Credential endpoint error:", error)

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    )
  }
}