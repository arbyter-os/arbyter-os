import { NextResponse } from "next/server"
import { assertApiParam } from "@/lib/validation/api-schemas";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveConnectionCredential } from "@/lib/credentials/runtime";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60;
const WEBHOOK_REPLAY_RETENTION_SECONDS = MAX_TIMESTAMP_AGE_SECONDS;

function createReplayKey(connectionId: string, timestamp: string, body: Buffer) {
  return createHash("sha256")
    .update("arbyter-webhook-replay-v1\0", "utf8")
    .update(connectionId, "utf8")
    .update("\0", "utf8")
    .update(timestamp, "utf8")
    .update("\0", "utf8")
    .update(body)
    .digest("hex");
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : null;
  return code === "23505";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function hasJsonContentType(contentType: string | null) {
  if (!contentType) return false;
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

async function readBody(request: Request): Promise<Buffer | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) return null;
    if (parsedLength > MAX_BODY_BYTES) return null;
  }

  if (!request.body) {
    return Buffer.alloc(0);
  }

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, total);
}

function parseTimestamp(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;
  const timestamp = Number(value);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return null;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > MAX_TIMESTAMP_AGE_SECONDS) return null;

  return timestamp;
}

function parseSignature(value: string | null) {
  if (!value || !/^sha256=[0-9a-f]{64}$/.test(value)) return null;
  return Buffer.from(value.slice("sha256=".length), "hex");
}

function verifySignature(
  secret: string,
  timestamp: string,
  body: Buffer,
  providedSignature: Buffer,
) {
  const signedPayload = Buffer.concat([
    Buffer.from(`${timestamp}.`, "utf8"),
    body,
  ]);
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload)
    .digest();

  return (
    expectedSignature.length === providedSignature.length &&
    timingSafeEqual(expectedSignature, providedSignature)
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  const { connectionId } = await params;

  try {
    assertApiParam(connectionId, "uuid", "connectionId");
  } catch {
    return jsonError("Connection not found.", 404);
  }

  if (!connectionId || connectionId.trim().length === 0) {
    return jsonError("Connection not found.", 404);
  }

  if (!hasJsonContentType(request.headers.get("content-type"))) {
    return jsonError("Content-Type must be application/json.", 400);
  }

  const body = await readBody(request);
  if (body === null) {
    return jsonError("Request body is invalid or too large.", 400);
  }

  const timestampHeader = request.headers.get("x-arbyter-timestamp");
  const timestamp = parseTimestamp(timestampHeader);
  const signature = parseSignature(
    request.headers.get("x-arbyter-signature"),
  );

  if (!timestamp || !signature || !timestampHeader) {
    return jsonError("Invalid webhook signature.", 401);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Webhook verification is temporarily unavailable.", 503);
  }

  try {
    const { data: connection, error: connectionError } = await admin
      .from("agent_connections")
      .select(
        "id, organization_id, agent_id, connection_type, status, health_status, provider, environment, consecutive_failures",
      )
      .eq("id", connectionId)
      .maybeSingle();

    if (connectionError) {
      return jsonError("Unable to verify webhook connection.", 503);
    }

    if (!connection) {
      return jsonError("Connection not found.", 404);
    }

    if (
      String(connection.connection_type || "").trim().toLowerCase() !==
      "webhook"
    ) {
      return jsonError("Connection is not a webhook connection.", 400);
    }

    let credential;
    try {
      credential = await resolveConnectionCredential({
        organizationId: connection.organization_id,
        connectionId: connection.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("expired")) {
        return jsonError("Webhook credential is unavailable.", 401);
      }
      return jsonError("Webhook verification is temporarily unavailable.", 503);
    }

    if (!credential?.secret) {
      return jsonError("Webhook credential is unavailable.", 401);
    }

    if (!verifySignature(credential.secret, timestampHeader, body, signature)) {
      return jsonError("Invalid webhook signature.", 401);
    }

    try {
      JSON.parse(body.toString("utf8"));
    } catch {
      return jsonError("Request body must contain valid JSON.", 400);
    }

    const replayKey = createReplayKey(connection.id, timestampHeader, body);
    const replayExpiresAt = new Date(
      (timestamp + WEBHOOK_REPLAY_RETENTION_SECONDS) * 1000,
    ).toISOString();

    // The custom Arbyter webhook protocol does not define a provider event ID.
    // Use a digest of the authenticated connection, timestamp, and exact body.
    // The digest is stored instead of the body, signature, or webhook secret.
    // The UNIQUE constraint makes the reservation race-safe across instances.
    const { error: replayError } = await admin
      .from("webhook_replay_events")
      .insert({
        organization_id: connection.organization_id,
        agent_connection_id: connection.id,
        replay_key: replayKey,
        expires_at: replayExpiresAt,
      });

    if (replayError) {
      if (isUniqueViolation(replayError)) {
        return jsonError("Webhook replay detected.", 409);
      }
      return jsonError("Webhook verification is temporarily unavailable.", 503);
    }

    const checkedAt = new Date().toISOString();
    const { data: healthCheck, error: healthCheckError } = await admin
      .from("agent_health_checks")
      .insert({
        organization_id: connection.organization_id,
        agent_id: connection.agent_id,
        agent_connection_id: connection.id,
        status: "healthy",
        latency_ms: 0,
        response_status: 200,
        error_code: null,
        error_message: null,
        details: {
          verification_stage: "inbound_webhook_signature",
          verification_method: "hmac_sha256",
          provider: connection.provider,
          connection_type: connection.connection_type,
          environment: connection.environment,
          checked_at: checkedAt,
        },
        checked_at: checkedAt,
      })
      .select()
      .single();

    if (healthCheckError) {
      return jsonError("Webhook verification could not be recorded.", 500);
    }

    const { data: updatedConnection, error: updateError } = await admin
      .from("agent_connections")
      .update({
        status: "connected",
        health_status: "healthy",
        last_health_check_at: checkedAt,
        last_connected_at: checkedAt,
        last_seen_at: checkedAt,
        consecutive_failures: 0,
      })
      .eq("id", connection.id)
      .eq("organization_id", connection.organization_id)
      .select()
      .single();

    if (updateError) {
      return jsonError("Webhook verification could not be recorded.", 500);
    }

    const { error: eventError } = await admin
      .from("agent_connection_events")
      .insert({
        organization_id: connection.organization_id,
        agent_id: connection.agent_id,
        agent_connection_id: connection.id,
        event_type: "connected",
        status: "connected",
        message: "Inbound webhook signature verification succeeded.",
        metadata: {
          verification_method: "hmac_sha256",
          provider: connection.provider,
          connection_type: connection.connection_type,
          environment: connection.environment,
          identity_verified: true,
        },
        occurred_at: checkedAt,
      });

    if (eventError) {
      return jsonError("Webhook verification could not be recorded.", 500);
    }

    return NextResponse.json({
      success: true,
      connection: updatedConnection,
      healthCheck,
      verification: {
        status: "healthy",
        verified: true,
        verifiedAt: checkedAt,
        verificationMethod: "hmac_sha256",
      },
    });
  } catch {
    return jsonError("Webhook verification failed.", 500);
  }
}
