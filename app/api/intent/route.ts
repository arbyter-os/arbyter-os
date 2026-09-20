import { NextRequest, NextResponse } from "next/server"
import { generateIntent } from "@/lib/intent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 })
    }

    if (typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "message is required." }, { status: 400 })
    }

    const intent = await generateIntent(body.message)
    return NextResponse.json(intent)
  } catch (error) {
    console.error("Intent Engine test error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Intent Engine request failed." },
      { status: 500 },
    )
  }
}
