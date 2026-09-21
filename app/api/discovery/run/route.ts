import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runDiscoveryScan } from "@/lib/discovery/run-scan";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "discovery:run");

    const scanId =
      typeof body?.scanId === "string"
        ? body.scanId.trim()
        : "";

    if (!scanId) {
      return NextResponse.json(
        { error: "scanId is required." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Could not find your organization." },
        { status: 403 }
      );
    }

    const { data: scan, error: scanError } = await supabase
      .from("discovery_scans")
      .select("id, organization_id, requested_by, status")
      .eq("id", scanId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json(
        { error: "Discovery scan not found." },
        { status: 404 }
      );
    }

    if (
      scan.requested_by !== user.id &&
      scan.requested_by !== null
    ) {
      return NextResponse.json(
        { error: "You cannot run this discovery scan." },
        { status: 403 }
      );
    }

    if (
      scan.status !== "queued" &&
      scan.status !== "failed" &&
      scan.status !== "partial"
    ) {
      return NextResponse.json(
        {
          error: `Scan cannot be started from status: ${scan.status}`,
        },
        { status: 409 }
      );
    }

    const result = await runDiscoveryScan(scanId, profile.organization_id);

    return NextResponse.json(result);
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("Discovery run error:", error);

    return NextResponse.json(
      {
        error: "Failed to run discovery scan.",
      },
      { status: 500 }
    );
  }
}
