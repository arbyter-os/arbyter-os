import { NextResponse } from "next/server"
import { executeUserRequest } from "@/lib/execution/vertical-slice"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body?.request === "string" ? body.request.trim() : ""
    if (!text || text.length > 4000) {
      return NextResponse.json({ error: "request must be a non-empty string of at most 4000 characters." }, { status: 400 })
    }

    const result = await executeUserRequest(text)
    return NextResponse.json(result, {
      status: result.status === "awaiting_approval" ? 202 : result.status === "blocked" ? 403 : result.status === "failed" ? 502 : 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed."
    const status = message === "You must be signed in." ? 401 : message.startsWith("No agent") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
