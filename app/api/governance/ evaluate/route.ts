import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const authResult = await supabase.auth.getUser()

    if (authResult.error) {
      return NextResponse.json({
        stage: "auth",
        error: authResult.error.message,
      })
    }

    if (!authResult.data.user) {
      return NextResponse.json({
        stage: "auth",
        error: "No authenticated user",
      })
    }

    const userId = authResult.data.user.id

    const userResult = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle()

    if (userResult.error) {
      return NextResponse.json({
        stage: "users_query",
        error: userResult.error.message,
        code: userResult.error.code,
      })
    }

    if (!userResult.data?.organization_id) {
      return NextResponse.json({
        stage: "organization",
        error: "No organization found",
      })
    }

    return NextResponse.json({
      success: true,
      stage: "supabase_connection",
      userId,
      organizationId: userResult.data.organization_id,
    })
  } catch (error) {
    return NextResponse.json({
      stage: "unexpected",
      error:
        error instanceof Error
          ? error.message
          : String(error),
      stack:
        error instanceof Error
          ? error.stack
          : undefined,
    })
  }
}