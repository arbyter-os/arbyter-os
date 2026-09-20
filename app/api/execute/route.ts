import { NextRequest, NextResponse } from "next/server"
import { orchestrateUserRequest } from "@/lib/orchestration"

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON request body." },
      { status: 400 },
    )
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    )
  }

  const message = (body as { message?: unknown }).message

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 },
    )
  }

  try {
    const result = await orchestrateUserRequest(message)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Execution orchestration error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Execution orchestration failed.",
      },
      { status: 500 },
    )
  }
}
