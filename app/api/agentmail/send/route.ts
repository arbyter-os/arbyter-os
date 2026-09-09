import { NextRequest, NextResponse } from "next/server";
import { AgentMailClient } from "agentmail";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AGENTMAIL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AgentMail API key is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { to, subject, text } = body;

    if (!to || !subject || !text) {
      return NextResponse.json(
        {
          error: "Missing required fields: to, subject, text.",
        },
        { status: 400 }
      );
    }

    const client = new AgentMailClient({
      apiKey,
    });

    const response = await client.inboxes.messages.send({
      inboxId: "creatorai@agentmail.to",
      to: [to],
      subject,
      text,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
      data: response,
    });
  } catch (error) {
    console.error("AgentMail send error:", error);

    return NextResponse.json(
      {
        error: "Failed to send email through AgentMail.",
      },
      { status: 500 }
    );
  }
}