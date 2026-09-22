import { readJsonBody } from "@/lib/security/request-body";
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import {
  createMcpSecret,
  updateMcpSecret,
} from "@/lib/credentials/mcp"

async function context() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { supabase, user: null, organizationId: null }
  const { data: profile, error } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
  return {
    supabase,
    user,
    organizationId: error ? null : profile?.organization_id ?? null,
    role: error ? null : profile?.role ?? null,
  }
}

// discovery_sources carries the scanner's outbound endpoint_url and a
// Vault-backed credential reference, so creating or editing one is an
// owner/admin action under the hardened RLS policies. This gate must run
// BEFORE createMcpSecret/updateMcpSecret, which use the service-role client
// and would otherwise let a member write Vault secrets even though the
// subsequent row write is denied.
function forbiddenForRole(role: string | null) {
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json(
      { error: "Only an owner or admin can manage discovery sources." },
      { status: 403 }
    )
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}

function buildMcpConfiguration(configuration: unknown) {
  const input = isRecord(configuration) ? configuration : {}
  const result: Record<string, string> = {}

  if (typeof input.authentication_method === "string") {
    result.authentication_method = input.authentication_method.trim()
  }

  return result
}

function requestedMcpAuthorization(configuration: unknown) {
  if (!isRecord(configuration)) return ""
  return typeof configuration.authorization === "string"
    ? configuration.authorization.trim()
    : ""
}

function withMcpSecretReference(configuration: Record<string, string>, secretReference: string | null) {
  if (secretReference) {
    return { ...configuration, authorization_secret_reference: secretReference }
  }

  return configuration
}

export async function POST(request: Request) {
  try {
    const { supabase, user, organizationId, role } = await context()
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    if (!organizationId) return NextResponse.json({ error: "Could not find your organization." }, { status: 403 })
    const forbidden = forbiddenForRole(role)
    if (forbidden) return forbidden
    const body = await readJsonBody(request)
    assertApiBody(body, "discovery:sources:create")
    const sourceType = typeof body?.sourceType === "string" ? body.sourceType.trim() : ""
    if (!sourceType) return NextResponse.json({ error: "sourceType is required." }, { status: 400 })

    const isMcp = sourceType.toLowerCase() === "mcp"
    const sourceId = crypto.randomUUID()
    const rawConfiguration = body?.configuration
    let configuration = isMcp ? buildMcpConfiguration(rawConfiguration) : rawConfiguration && typeof rawConfiguration === "object" && !Array.isArray(rawConfiguration) ? rawConfiguration : {}
    let mcpSecretReference: string | null = null

    if (isMcp) {
      const authorization = requestedMcpAuthorization(rawConfiguration)
      if (authorization) {
        mcpSecretReference = await createMcpSecret({
          organizationId,
          sourceId,
          secret: authorization,
        })
        configuration = withMcpSecretReference(configuration, mcpSecretReference)
      }
    }

    try {
      const { data, error } = await supabase.from("discovery_sources").insert({ id: sourceId, organization_id: organizationId, name: typeof body?.name === "string" ? body.name.trim() : sourceType, source_type: sourceType, provider: typeof body?.provider === "string" ? body.provider : null, environment: typeof body?.environment === "string" ? body.environment : null, status: "pending", access_mode: "read_only", endpoint_url: typeof body?.endpointUrl === "string" && body.endpointUrl.trim() ? body.endpointUrl.trim() : null, configuration, created_by: user.id }).select("id").single()
      if (error) throw error
      return NextResponse.json({ id: data.id })
    } catch (error) {
      if (mcpSecretReference) {
        try {
          await updateMcpSecret({
            secretReference: mcpSecretReference,
            organizationId,
            sourceId,
            secret: "",
          })
        } catch {
          // Do not replace the original persistence error with cleanup failure.
        }
      }
      throw error
    }
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Discovery source creation error:", error)
    return NextResponse.json({ error: "Could not save discovery source." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user, organizationId, role } = await context()
    if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    if (!organizationId) return NextResponse.json({ error: "Could not find your organization." }, { status: 403 })
    const forbidden = forbiddenForRole(role)
    if (forbidden) return forbidden
    const body = await readJsonBody(request)
    assertApiBody(body, "discovery:sources:update")
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId.trim() : ""
    if (!sourceId) return NextResponse.json({ error: "sourceId is required." }, { status: 400 })

    const { data: existing, error: existingError } = await supabase
      .from("discovery_sources")
      .select("id, source_type, configuration")
      .eq("id", sourceId)
      .eq("organization_id", organizationId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: "Discovery source not found." }, { status: 404 })
    }

    const isMcp = existing.source_type?.toLowerCase() === "mcp"
    const rawConfiguration = body?.configuration
    let configuration = isMcp ? buildMcpConfiguration(rawConfiguration) : rawConfiguration && typeof rawConfiguration === "object" && !Array.isArray(rawConfiguration) ? rawConfiguration : {}

    if (isMcp) {
      const previousConfiguration = isRecord(existing.configuration) ? existing.configuration : {}
      const previousReference = typeof previousConfiguration.authorization_secret_reference === "string"
        ? previousConfiguration.authorization_secret_reference.trim()
        : ""
      const authorization = requestedMcpAuthorization(rawConfiguration)

      if (authorization) {
        if (previousReference) {
          await updateMcpSecret({
            secretReference: previousReference,
            organizationId,
            sourceId,
            secret: authorization,
          })
          configuration = withMcpSecretReference(configuration, previousReference)
        } else {
          const secretReference = await createMcpSecret({
            organizationId,
            sourceId,
            secret: authorization,
          })
          configuration = withMcpSecretReference(configuration, secretReference)
        }
      } else if (previousReference) {
        await updateMcpSecret({
          secretReference: previousReference,
          organizationId,
          sourceId,
          secret: "",
        })
      }
    }

    const updates = {
      name: typeof body?.name === "string" ? body.name.trim() : undefined,
      provider: typeof body?.provider === "string" ? body.provider : undefined,
      environment: typeof body?.environment === "string" ? body.environment : undefined,
      status: "pending",
      access_mode: "read_only",
      endpoint_url: typeof body?.endpointUrl === "string" && body.endpointUrl.trim() ? body.endpointUrl.trim() : null,
      configuration,
    }
    const { data, error } = await supabase.from("discovery_sources").update(updates).eq("id", sourceId).eq("organization_id", organizationId).select("id").single()
    if (error) throw error
    return NextResponse.json({ id: data.id })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Discovery source update error:", error)
    return NextResponse.json({ error: "Could not update discovery source." }, { status: 500 })
  }
}