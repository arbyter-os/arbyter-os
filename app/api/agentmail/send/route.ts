import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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