import { readJsonBody } from "@/lib/security/request-body";
import { assertApiBody } from "@/lib/validation/api-schemas"
import { validationErrorResponse } from "@/lib/validation/errors"
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeAgentTask } from "@/lib/execution/engine";
import { checkRateLimitCost } from "@/lib/security/rate-limit";
import {
  requirePrivilegedMfa,
  isPrivilegedMfaRequiredError,
  isPrivilegedAuthorizationError,
} from "@/lib/security/privileged-auth";

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

    // P0-4: privileged MFA must hold at THIS route boundary, not only in
    // middleware. This route triggers a real external send.
    try {
      await requirePrivilegedMfa(supabase, user.id);
    } catch (error) {
      if (isPrivilegedMfaRequiredError(error)) {
        return NextResponse.json(
          { error: "Multi-factor authentication is required for this action." },
          { status: 403 },
        );
      }
      if (isPrivilegedAuthorizationError(error)) {
        return NextResponse.json(
          { error: "Only an owner or admin can perform this action." },
          { status: 403 },
        );
      }
      console.error("AgentMail authorization lookup failed:", error);
      return NextResponse.json(
        { error: "Execution authorization is temporarily unavailable." },
        { status: 503 },
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

    const body = await readJsonBody(request);
    assertApiBody(body, "agentmail:send");
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

    if (
      recipients.length === 0 ||
      recipients.length > 100 ||
      recipients.some(
        (recipient) =>
          typeof recipient !== "string" ||
          recipient.trim().length === 0 ||
          recipient.length > 320
      )
    ) {
      return NextResponse.json(
        { error: "Provide between 1 and 100 valid recipient addresses." },
        { status: 400 }
      );
    }

    if (
      typeof subject !== "string" ||
      typeof text !== "string" ||
      subject.trim().length === 0 ||
      text.trim().length === 0 ||
      subject.length > 998 ||
      text.length > 100_000
    ) {
      return NextResponse.json(
        { error: "Subject or message content is invalid or too large." },
        { status: 400 }
      );
    }

    try {
      const recipientLimit = await checkRateLimitCost(
        `agentmail:recipients:${user.id}`,
        recipients.length,
        100,
        60_000,
      );
      if (!recipientLimit.allowed) {
        return NextResponse.json(
          { error: "AgentMail recipient rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(recipientLimit.retryAfterSeconds),
              "X-RateLimit-Limit": "100",
              "X-RateLimit-Remaining": "0",
            },
          },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Rate limiting is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

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

    const result = await executeAgentTask({
      organizationId: userRecord.organization_id,
      agentId: connection.agent_id,
      agentConnectionId: connection.id,
      requestedCapability: "messages.send",
      data: {
        to: recipients,
        subject,
        text,
      },
    })

    if (!result.success) {
      const status = result.status === "awaiting_approval"
        ? 202
        : result.status === "blocked"
          ? 403
          : result.status === "flagged"
            ? 202
            : 502
      return NextResponse.json(
        {
          success: false,
          executionId: result.executionId,
          status: result.status,
          governance: result.governance,
          approval: "approval" in result ? result.approval : undefined,
          error: result.status === "awaiting_approval"
            ? "AgentMail send requires approval before it can execute."
            : result.status === "blocked"
              ? "AgentMail send was blocked by governance."
              : "AgentMail execution failed.",
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      governance: result.governance,
      result: result.result ?? null,
    });
  } catch (error) {
    const invalidRequest = validationErrorResponse(error)
    if (invalidRequest) return invalidRequest
    console.error("AgentMail integration error:", error);

    return NextResponse.json(
      {
        error: "Failed to execute AgentMail request.",
      },
      { status: 500 }
    );
  }
}