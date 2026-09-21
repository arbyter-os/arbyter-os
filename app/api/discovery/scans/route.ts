import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
    const body = await readJsonBody(request)
    assertApiBody(body, "discovery:scans")
    const sourceIds = Array.isArray(body?.sourceIds) ? body.sourceIds.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0) : []
    const sourcesRequested = Array.isArray(body?.sourcesRequested) ? body.sourcesRequested.filter((id: unknown): id is string => typeof id === "string") : []
    if (!sourceIds.length) return NextResponse.json({ error: "At least one discovery source is required." }, { status: 400 })
    const { data: profile, error: profileError } = await supabase.from("users").select("organization_id").eq("id", user.id).single()
    if (profileError || !profile?.organization_id) return NextResponse.json({ error: "Could not find your organization." }, { status: 403 })
    const organizationId = profile.organization_id

    const { data: sources, error: sourceError } = await supabase.from("discovery_sources").select("id").eq("organization_id", organizationId).in("id", sourceIds)
    if (sourceError) throw sourceError
    if ((sources?.length ?? 0) !== sourceIds.length) return NextResponse.json({ error: "One or more discovery sources do not belong to your organization." }, { status: 403 })

    const { data: scan, error: scanError } = await supabase.from("discovery_scans").insert({ organization_id: organizationId, requested_by: user.id, status: "queued", sources_requested: sourcesRequested }).select("id").single()
    if (scanError) throw scanError
    const { error: linkError } = await supabase.from("discovery_scan_sources").insert(sourceIds.map((sourceId: string) => ({ organization_id: organizationId, scan_id: scan.id, source_id: sourceId, status: "queued" })))
    if (linkError) {
      await supabase.from("discovery_scans").delete().eq("id", scan.id).eq("organization_id", organizationId)
      throw linkError
    }
    return NextResponse.json({ id: scan.id })
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Discovery scan creation error:", error)
    return NextResponse.json({ error: "Could not create discovery scan." }, { status: 500 })
  }
}