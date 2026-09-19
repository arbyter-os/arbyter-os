import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const body = await request.json();

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
    console.error("MCP discovery error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "MCP discovery failed.",
      },
      { status: 500 }
    );
  }
}
