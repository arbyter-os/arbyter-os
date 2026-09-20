import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateExternalUrl } from "@/lib/security/validate-external-url";
import { scanMCPServer } from "@/lib/discovery/scanners/mcp";

const VERIFY_TIMEOUT_MS = 8000;

async function validateEndpoint(rawUrl: string) {
  return validateExternalUrl(rawUrl, {
    protocols: ["https:"],
  });
}

function normalizeConnectionType(connectionType: string | null) {
  return (connectionType || "api").trim().toLowerCase();
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be signed in.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const agentId =
      typeof body?.agentId === "string"
        ? body.agentId.trim()
        : "";

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent ID is required.",
        },
        { status: 400 },
      );
    }

    const {
      data: userRecord,
      error: userRecordError,
    } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userRecordError || !userRecord?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not resolve your organization.",
        },
        { status: 403 },
      );
    }

    const organizationId = userRecord.organization_id;

    const {
      data: agent,
      error: agentError,
    } = await supabase
      .from("ai_agents")
      .select("id, name, organization_id, status")
      .eq("id", agentId)
      .eq("organization_id", organizationId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found in your organization.",
        },
        { status: 404 },
      );
    }

    const {
      data: connection,
      error: connectionError,
    } = await supabase
      .from("agent_connections")
      .select(
        `
          id,
          agent_id,
          organization_id,
          connection_type,
          provider,
          endpoint_url,
          environment,
          status,
          health_status,
          last_connected_at,
          last_seen_at,
          consecutive_failures
        `,
      )
      .eq("agent_id", agentId)
      .eq("organization_id", organizationId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (connectionError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Could not load the agent connection: ${connectionError.message}`,
        },
        { status: 500 },
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This agent does not have a connection configured yet.",
        },
        { status: 400 },
      );
    }

    const connectionType = normalizeConnectionType(
      connection.connection_type,
    );

    if (
      connectionType === "webhook" ||
      connectionType === "webhooks"
    ) {
      const checkedAt = new Date().toISOString();

      const message =
        "Webhook connections cannot be verified with an outbound GET request. Configure the webhook receiver and validate an incoming signed event instead.";

      await supabase
        .from("agent_connection_events")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          event_type: "connection_failed",
          status: "error",
          message,
          metadata: {
            verification_method: "inbound_webhook_event",
            connection_type: connection.connection_type,
            provider: connection.provider,
            environment: connection.environment,
          },
          occurred_at: checkedAt,
        });

      return NextResponse.json(
        {
          success: false,
          verificationRequired: true,
          verificationMethod: "inbound_webhook_event",
          connectionStatus: connection.status,
          healthStatus: connection.health_status,
          message,
        },
        { status: 400 },
      );
    }

    if (connectionType === "sdk") {
      const checkedAt = new Date().toISOString();

      const message =
        "SDK connections require an SDK/runtime handshake or telemetry signal. An HTTP endpoint probe is not a valid SDK verification method.";

      await supabase
        .from("agent_connection_events")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          event_type: "connection_failed",
          status: "error",
          message,
          metadata: {
            verification_method: "sdk_runtime_handshake",
            connection_type: connection.connection_type,
            provider: connection.provider,
            environment: connection.environment,
          },
          occurred_at: checkedAt,
        });

      return NextResponse.json(
        {
          success: false,
          verificationRequired: true,
          verificationMethod: "sdk_runtime_handshake",
          message,
        },
        { status: 400 },
      );
    }

    if (connectionType === "mcp") {
      if (!connection.endpoint_url) {
        return NextResponse.json(
          {
            success: false,
            message: "This MCP connection does not have an endpoint URL.",
          },
          { status: 400 },
        );
      }

      const endpointValidation = await validateEndpoint(
        connection.endpoint_url,
      );

      if (!endpointValidation.valid) {
        const checkedAt = new Date().toISOString();
        const currentFailures = Number(
          connection.consecutive_failures || 0,
        );
        const message = endpointValidation.error;

        await supabase.from("agent_health_checks").insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          status: "failed",
          latency_ms: 0,
          response_status: null,
          error_code: "INVALID_ENDPOINT",
          error_message: message,
          details: {
            verification_stage: "endpoint_validation",
            provider: connection.provider,
            connection_type: connection.connection_type,
            environment: connection.environment,
            checked_at: checkedAt,
          },
          checked_at: checkedAt,
        });

        await supabase
          .from("agent_connections")
          .update({
            status: "error",
            health_status: "unhealthy",
            last_health_check_at: checkedAt,
            consecutive_failures: currentFailures + 1,
          })
          .eq("id", connection.id)
          .eq("organization_id", organizationId);

        await supabase
          .from("agent_identities")
          .update({
            verified: false,
            verified_at: null,
          })
          .eq("agent_id", agentId)
          .eq("organization_id", organizationId);

        await supabase.from("agent_connection_events").insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          event_type: "connection_failed",
          status: "error",
          message,
          metadata: {
            reason: "invalid_or_unsafe_endpoint",
            verification_method: "mcp_transport_handshake",
            identity_verified: false,
          },
          occurred_at: checkedAt,
        });

        return NextResponse.json(
          {
            success: false,
            message,
            connectionStatus: "error",
            healthStatus: "unhealthy",
            verified: false,
          },
          { status: 400 },
        );
      }

      const startedAt = Date.now();
      const checkedAt = new Date().toISOString();
      const scan = await scanMCPServer({
        serverUrl: endpointValidation.url.toString(),
      });
      const latencyMs = Date.now() - startedAt;
      const isHealthy = scan.success && typeof scan.protocol === "string" && scan.protocol.length > 0;
      const verificationStatus = isHealthy ? "healthy" : "unhealthy";
      const nextConnectionStatus = isHealthy ? "connected" : "error";
      const nextHealthStatus = isHealthy ? "healthy" : "unhealthy";
      const errorMessage = isHealthy
        ? null
        : scan.error ?? "MCP handshake verification failed.";
      const nextFailures = isHealthy
        ? 0
        : Number(connection.consecutive_failures || 0) + 1;

      const {
        data: healthCheck,
        error: healthCheckError,
      } = await supabase
        .from("agent_health_checks")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          status: verificationStatus,
          latency_ms: latencyMs,
          response_status: isHealthy ? 200 : null,
          error_code: isHealthy ? null : "MCP_VERIFICATION_FAILED",
          error_message: errorMessage,
          details: {
            verification_stage: "mcp_transport_handshake",
            provider: connection.provider,
            connection_type: connection.connection_type,
            environment: connection.environment,
            endpoint_host: endpointValidation.url.hostname,
            protocol: scan.protocol ?? null,
            server_name: scan.serverName ?? null,
            tools_count: scan.tools.length,
            resources_count: scan.resources.length,
            prompts_count: scan.prompts.length,
            checked_at: checkedAt,
          },
          checked_at: checkedAt,
        })
        .select()
        .single();

      if (healthCheckError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `The MCP server was checked, but the health result could not be recorded: ${healthCheckError.message}`,
          },
          { status: 500 },
        );
      }

      const {
        data: updatedConnection,
        error: updateConnectionError,
      } = await supabase
        .from("agent_connections")
        .update({
          status: nextConnectionStatus,
          health_status: nextHealthStatus,
          last_health_check_at: checkedAt,
          ...(isHealthy
            ? {
                last_connected_at: checkedAt,
                last_seen_at: checkedAt,
                consecutive_failures: 0,
              }
            : {
                consecutive_failures: nextFailures,
              }),
        })
        .eq("id", connection.id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (updateConnectionError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `MCP health check succeeded, but the connection state could not be updated: ${updateConnectionError.message}`,
            healthCheck,
          },
          { status: 500 },
        );
      }

      const { data: existingIdentity, error: identityLookupError } = await supabase
        .from("agent_identities")
        .select("id")
        .eq("agent_id", agentId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (identityLookupError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `MCP verification completed, but the agent identity could not be checked: ${identityLookupError.message}`,
            healthCheck,
            connection: updatedConnection,
          },
          { status: 500 },
        );
      }

      let identityError = null;
      if (existingIdentity) {
        const { error } = await supabase
          .from("agent_identities")
          .update({
            verified: isHealthy,
            verified_at: isHealthy ? checkedAt : null,
          })
          .eq("id", existingIdentity.id)
          .eq("organization_id", organizationId);
        identityError = error;
      } else {
        const { error } = await supabase
          .from("agent_identities")
          .insert({
            organization_id: organizationId,
            agent_id: agentId,
            verified: isHealthy,
            verified_at: isHealthy ? checkedAt : null,
          });
        identityError = error;
      }

      if (identityError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `MCP verification completed, but agent verification could not be recorded: ${identityError.message}`,
            healthCheck,
            connection: updatedConnection,
          },
          { status: 500 },
        );
      }

      const { error: eventError } = await supabase
        .from("agent_connection_events")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          event_type: isHealthy ? "connected" : "connection_failed",
          status: isHealthy ? "connected" : "error",
          message: isHealthy
            ? "MCP transport handshake succeeded. Agent identity verified."
            : errorMessage,
          metadata: {
            verification_method: "mcp_transport_handshake",
            endpoint_host: endpointValidation.url.hostname,
            protocol: scan.protocol ?? null,
            server_name: scan.serverName ?? null,
            tools_count: scan.tools.length,
            resources_count: scan.resources.length,
            prompts_count: scan.prompts.length,
            identity_verified: isHealthy,
          },
          occurred_at: checkedAt,
        });

      if (eventError) {
        return NextResponse.json(
          {
            success: false,
            message:
              `MCP verification completed, but the connection event could not be recorded: ${eventError.message}`,
            healthCheck,
            connection: updatedConnection,
            verified: isHealthy,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: isHealthy,
        agent: {
          id: agent.id,
          name: agent.name,
        },
        connection: updatedConnection,
        healthCheck,
        verification: {
          status: verificationStatus,
          verified: isHealthy,
          verifiedAt: isHealthy ? checkedAt : null,
          latencyMs,
          responseStatus: isHealthy ? 200 : null,
          endpointHost: endpointValidation.url.hostname,
          protocol: scan.protocol ?? null,
        },
        message: isHealthy
          ? "MCP transport handshake succeeded. The agent is now Connected, Healthy, and Verified."
          : errorMessage,
      });
    }

    if (!connection.endpoint_url) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This API connection does not have an endpoint URL.",
        },
        { status: 400 },
      );
    }

    const endpointValidation = await validateEndpoint(
      connection.endpoint_url,
    );

    if (!endpointValidation.valid) {
      const checkedAt = new Date().toISOString();

      const currentFailures = Number(
        connection.consecutive_failures || 0,
      );

      await supabase
        .from("agent_health_checks")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          status: "failed",
          latency_ms: 0,
          response_status: null,
          error_code: "INVALID_ENDPOINT",
          error_message: endpointValidation.error,
          details: {
            verification_stage: "endpoint_validation",
            provider: connection.provider,
            connection_type: connection.connection_type,
            environment: connection.environment,
            checked_at: checkedAt,
          },
          checked_at: checkedAt,
        });

      await supabase
        .from("agent_connections")
        .update({
          status: "error",
          health_status: "unhealthy",
          last_health_check_at: checkedAt,
          consecutive_failures: currentFailures + 1,
        })
        .eq("id", connection.id)
        .eq("organization_id", organizationId);

      await supabase
        .from("agent_identities")
        .update({
          verified: false,
          verified_at: null,
        })
        .eq("agent_id", agentId)
        .eq("organization_id", organizationId);

      await supabase
        .from("agent_connection_events")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connection.id,
          event_type: "connection_failed",
          status: "error",
          message: endpointValidation.error,
          metadata: {
            reason: "invalid_or_unsafe_endpoint",
            identity_verified: false,
          },
          occurred_at: checkedAt,
        });

      return NextResponse.json(
        {
          success: false,
          message: endpointValidation.error,
          connectionStatus: "error",
          healthStatus: "unhealthy",
          verified: false,
        },
        { status: 400 },
      );
    }

    const targetUrl = endpointValidation.url.toString();

    const startedAt = Date.now();
    const checkedAt = new Date().toISOString();

    let response: Response | null = null;
    let latencyMs = 0;
    let verificationStatus = "failed";

    let responseStatus: number | null = null;
    let errorCode: string | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        VERIFY_TIMEOUT_MS,
      );

      try {
        response = await fetch(targetUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept: "application/json, text/plain, */*",
            "User-Agent": "Arbyter-Connector-Verifier/1.0",
          },
          cache: "no-store",
        });
      } finally {
        clearTimeout(timeout);
      }

      latencyMs = Date.now() - startedAt;
      responseStatus = response.status;

      if (
        response.status >= 200 &&
        response.status < 400
      ) {
        verificationStatus = "healthy";
      } else {
        verificationStatus = "unhealthy";
        errorCode = "HTTP_ERROR";
        errorMessage =
          `Endpoint returned HTTP ${response.status}.`;
      }
    } catch (error) {
      latencyMs = Date.now() - startedAt;

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        errorCode = "TIMEOUT";
        errorMessage =
          `Endpoint did not respond within ${VERIFY_TIMEOUT_MS}ms.`;
      } else if (error instanceof Error) {
        errorCode = "CONNECTION_FAILED";
        errorMessage = error.message;
      } else {
        errorCode = "CONNECTION_FAILED";
        errorMessage =
          "The endpoint could not be reached.";
      }

      verificationStatus = "unhealthy";
    }

    const isHealthy = verificationStatus === "healthy";

    const nextConnectionStatus = isHealthy
      ? "connected"
      : "error";

    const nextHealthStatus = isHealthy
      ? "healthy"
      : "unhealthy";

    const nextFailures = isHealthy
      ? 0
      : Number(connection.consecutive_failures || 0) + 1;

    const {
      data: healthCheck,
      error: healthCheckError,
    } = await supabase
      .from("agent_health_checks")
      .insert({
        organization_id: organizationId,
        agent_id: agentId,
        agent_connection_id: connection.id,
        status: verificationStatus,
        latency_ms: latencyMs,
        response_status: responseStatus,
        error_code: errorCode,
        error_message: errorMessage,
        details: {
          verification_stage: "endpoint_reachability",
          provider: connection.provider,
          connection_type: connection.connection_type,
          environment: connection.environment,
          endpoint_host:
            endpointValidation.url.hostname,
          checked_at: checkedAt,
          timeout_ms: VERIFY_TIMEOUT_MS,
        },
        checked_at: checkedAt,
      })
      .select()
      .single();

    if (healthCheckError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `The endpoint was checked, but the health result could not be recorded: ${healthCheckError.message}`,
        },
        { status: 500 },
      );
    }

    const {
      data: updatedConnection,
      error: updateConnectionError,
    } = await supabase
      .from("agent_connections")
      .update({
        status: nextConnectionStatus,
        health_status: nextHealthStatus,
        last_health_check_at: checkedAt,
        ...(isHealthy
          ? {
              last_connected_at: checkedAt,
              last_seen_at: checkedAt,
              consecutive_failures: 0,
            }
          : {
              consecutive_failures: nextFailures,
            }),
      })
      .eq("id", connection.id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (updateConnectionError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Health check succeeded, but the connection state could not be updated: ${updateConnectionError.message}`,
          healthCheck,
        },
        { status: 500 },
      );
    }

    const {
      data: existingIdentity,
      error: identityLookupError,
    } = await supabase
      .from("agent_identities")
      .select("id")
      .eq("agent_id", agentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (identityLookupError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Connection verification completed, but the agent identity could not be checked: ${identityLookupError.message}`,
          healthCheck,
          connection: updatedConnection,
        },
        { status: 500 },
      );
    }

    let identityError = null;

    if (existingIdentity) {
      const { error } = await supabase
        .from("agent_identities")
        .update({
          verified: isHealthy,
          verified_at: isHealthy ? checkedAt : null,
        })
        .eq("id", existingIdentity.id)
        .eq("organization_id", organizationId);

      identityError = error;
    } else {
      const { error } = await supabase
        .from("agent_identities")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          verified: isHealthy,
          verified_at: isHealthy ? checkedAt : null,
        });

      identityError = error;
    }

    if (identityError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Connection verification completed, but agent verification could not be recorded: ${identityError.message}`,
          healthCheck,
          connection: updatedConnection,
        },
        { status: 500 },
      );
    }

    const { error: eventError } = await supabase
      .from("agent_connection_events")
      .insert({
        organization_id: organizationId,
        agent_id: agentId,
        agent_connection_id: connection.id,
        event_type: isHealthy
          ? "connected"
          : "connection_failed",
        status: isHealthy ? "connected" : "error",
        message: isHealthy
          ? "Endpoint responded successfully. Agent identity verified."
          : errorMessage ??
            "Endpoint verification failed.",
        metadata: {
          http_status: responseStatus,
          latency_ms: latencyMs,
          endpoint_host:
            endpointValidation.url.hostname,
          identity_verified: isHealthy,
          verification_method: "endpoint_reachability",
        },
        occurred_at: checkedAt,
      });

    if (eventError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Verification completed, but the connection event could not be recorded: ${eventError.message}`,
          healthCheck,
          connection: updatedConnection,
          verified: isHealthy,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: isHealthy,

      agent: {
        id: agent.id,
        name: agent.name,
      },

      connection: updatedConnection,

      healthCheck,

      verification: {
        status: verificationStatus,
        verified: isHealthy,
        verifiedAt: isHealthy ? checkedAt : null,
        latencyMs,
        responseStatus,
        endpointHost:
          endpointValidation.url.hostname,
      },

      message: isHealthy
        ? "Endpoint responded successfully. The agent is now Connected, Healthy, and Verified."
        : errorMessage ??
          "Endpoint verification failed.",
    });
  } catch (error) {
    console.error("Agent verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected verification error occurred.",
      },
      { status: 500 },
    );
  }
}
