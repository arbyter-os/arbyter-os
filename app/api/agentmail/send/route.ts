import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeConnectorAction } from "@/lib/connectors/runtime";
import { resolveConnectionCredential } from "@/lib/credentials/runtime";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const { data: userRecord, error: userError } =
      await supabase
        .from("users")
        .select("organization_id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (userError) throw userError;

    if (!userRecord?.organization_id) {
      return NextResponse.json(
        { error: "No organization is associated with your account." },
        { status: 403 }
      );
    }

    if (userRecord.role !== "owner" && userRecord.role !== "admin") {
      return NextResponse.json(
        {
          error: "Only an owner or admin can send through AgentMail.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { to, subject, text } = body ?? {};

    if (!to || !subject || !text) {
      return NextResponse.json(
        {
          error: "to, subject, and text are required.",
        },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    const { data: connection, error: connectionError } =
      await supabase
        .from("agent_connections")
        .select(
          "id, agent_id, provider, status, health_status, capabilities"
        )
        .eq("organization_id", userRecord.organization_id)
        .eq("provider", "agentmail")
        .eq("status", "connected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (connectionError) throw connectionError;

    if (!connection) {
      return NextResponse.json(
        { error: "No connected AgentMail connection was found." },
        { status: 404 }
      );
    }

    if (connection.health_status === "unhealthy") {
      return NextResponse.json(
        { error: "The AgentMail connection is unhealthy." },
        { status: 409 }
      );
    }

    const capabilities =
      connection.capabilities &&
      typeof connection.capabilities === "object" &&
      !Array.isArray(connection.capabilities)
        ? (connection.capabilities as Record<string, boolean>)
        : {};

    if (capabilities["messages.send"] !== true) {
      return NextResponse.json(
        {
          error: "messages.send is not enabled for the AgentMail connection.",
        },
        { status: 403 }
      );
    }

    const credential = await resolveConnectionCredential({
      organizationId: userRecord.organization_id,
      connectionId: connection.id,
    });

    if (!credential) {
      return NextResponse.json(
        { error: "No active AgentMail credential is configured." },
        { status: 409 }
      );
    }

    const result = await executeConnectorAction(
      connection.provider,
      {
        action: "messages.send",
        payload: {
          to: recipients,
          subject,
          text,
        },
      },
      {
        connectionId: connection.id,
        agentId: connection.agent_id,
        organizationId: userRecord.organization_id,
        credential,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "AgentMail execution failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data ?? null,
    });
  } catch (error) {
    console.error("AgentMail integration error:", error);

    return NextResponse.json(
      {
        error: "Failed to execute AgentMail request.",
      },
      { status: 500 }
    );
  }
}
