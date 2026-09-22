import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPrivilegedMfaRequiredError, requirePrivilegedMfa } from "@/lib/security/privileged-auth";
import { scanMCPServer } from "@/lib/discovery/scanners/mcp";

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

    try {
      await requirePrivilegedMfa(supabase, user.id);
    } catch (error) {
      if (isPrivilegedMfaRequiredError(error)) {
        console.error("MCP discovery authorization failed:", error)
        return NextResponse.json({ error: "MCP discovery request was not authorized." }, { status: 403 });
      }
      console.error("MCP authorization lookup failed:", error);
      return NextResponse.json({ error: "MCP authorization is temporarily unavailable." }, { status: 503 });
    }

    const body = await readJsonBody(request)
    assertApiBody(body, "discovery:mcp");

    const serverUrl =
      typeof body?.serverUrl === "string"
        ? body.serverUrl.trim()
        : "";

    if (!serverUrl) {
      return NextResponse.json(
        { error: "serverUrl is required." },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {};

    if (
      typeof body?.authorization === "string" &&
      body.authorization.trim()
    ) {
      headers.Authorization = body.authorization.trim();
    }

    const result = await scanMCPServer({
      serverUrl,
      headers,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("MCP discovery error:", error);

    return NextResponse.json(
      {
        error: "MCP discovery failed.",
      },
      { status: 500 }
    );
  }
}