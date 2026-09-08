import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    createAdminClient()

    return NextResponse.json({
      success: true,
      message: "Server-side Supabase secret is configured.",
    })
  } catch (error) {
    console.error("Secret configuration test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Server-side Supabase secret is not configured.",
      },
      { status: 500 }
    )
  }
}