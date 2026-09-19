import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

    if (userError) throw userError;

    if (!userRecord?.organization_id) {
      return NextResponse.json(
        { error: "No organization is associated with your account." },
        { status: 403 }
      );
    }

    const apiKey = process.env.AGENTMAIL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AGENTMAIL_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { to, subject, text } = body;

    if (!to || !subject || !text) {
      return NextResponse.json(
        {
          error: "to, subject, and text are required.",
        },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch(
      "https://api.agentmail.to/v0/inboxes/creatorai@agentmail.to/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject,
          text,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AgentMail API error:", data);

      return NextResponse.json(
        {
          error: "AgentMail rejected the request.",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("AgentMail integration error:", error);

    return NextResponse.json(
      {
        error: "Failed to connect to AgentMail.",
      },
      { status: 500 }
    );
  }
}