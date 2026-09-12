import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializeConnectors } from "@/lib/connectors";
import { getConnector } from "@/lib/connectors/registry";
import { executeConnectorAction } from "@/lib/connectors/runtime";
import type {
  ConnectorAction,
  ConnectorCapability,
  ConnectorContext,
} from "@/lib/connectors/types";

const GOVERNANCE_DECISIONS = {
  ALLOWED: "allowed",
  BLOCKED: "blocked",
  APPROVAL_REQUIRED: "approval_required",
} as const;

export async function POST(request: NextRequest) {
  try {
    initializeConnectors();

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      provider,
      action,
      payload,
      connectionId,
      agentId,
      taskId,
    } = body;

    if (!provider || !action || !payload) {
      return NextResponse.json(
        {
          error: "provider, action, and payload are required.",
        },
        { status: 400 }
      );
    }

    if (!connectionId || !agentId) {
      return NextResponse.json(
        {
          error: "connectionId and agentId are required.",
        },
        { status: 400 }
      );
    }

    const { data: userRecord, error: organizationError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (organizationError || !userRecord?.organization_id) {
      return NextResponse.json(
        { error: "Failed to resolve organization." },
        { status: 403 }
      );
    }

    const organizationId = userRecord.organization_id;

    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, organization_id")
      .eq("id", agentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found or unauthorized." },
        { status: 403 }
      );
    }

    const { data: connection, error: connectionError } = await supabase
      .from("agent_connections")
      .select(`
        id,
        organization_id,
        agent_id,
        provider,
        status,
        health_status,
        capabilities
      `)
      .eq("id", connectionId)
      .eq("agent_id", agentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Connection not found or unauthorized." },
        { status: 403 }
      );
    }

    if (connection.provider !== provider) {
      return NextResponse.json(
        { error: "Provider does not match the configured connection." },
        { status: 400 }
      );
    }

    const connector = getConnector(provider);

    if (!connector) {
      return NextResponse.json(
        { error: `Connector not found: ${provider}` },
        { status: 400 }
      );
    }

    if (!connector.capabilities.includes(action as ConnectorCapability)) {
      return NextResponse.json(
        {
          error: `Connector "${provider}" does not support action "${action}".`,
        },
        { status: 400 }
      );
    }

    const capabilities =
      connection.capabilities &&
      typeof connection.capabilities === "object"
        ? (connection.capabilities as Record<string, unknown>)
        : {};

    if (capabilities[action] !== true) {
      return NextResponse.json(
        {
          error: `Action "${action}" is not enabled for this connection.`,
        },
        { status: 403 }
      );
    }

    if (
      connection.status === "disconnected" ||
      connection.status === "failed"
    ) {
      return NextResponse.json(
        {
          error: `Connection is currently ${connection.status}.`,
        },
        { status: 409 }
      );
    }

    /*
     * Create execution record before the external action.
     */
    const { data: execution, error: executionError } = await supabase
      .from("agent_executions")
      .insert({
        organization_id: organizationId,
        agent_id: agentId,
        agent_connection_id: connectionId,
        task_id: taskId || null,
        execution_type: "tool_call",
        status: "running",
        input_data: payload,
        risk_level: "medium",
      })
      .select("id")
      .single();

    if (executionError || !execution) {
      console.error("Failed to create execution:", executionError);

      return NextResponse.json(
        { error: "Failed to create execution record." },
        { status: 500 }
      );
    }

    const executionId = execution.id;

    /*
     * Initial governance decision.
     *
     * Existing policy infrastructure remains the source of truth.
     * Until an applicable policy rule explicitly blocks or requires
     * approval, the execution is allowed to continue.
     */
    const { data: governanceDecision, error: governanceError } =
      await supabase
        .from("governance_decisions")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          agent_connection_id: connectionId,
          execution_id: executionId,
          task_id: taskId || null,
          decision: GOVERNANCE_DECISIONS.ALLOWED,
          risk_level: "medium",
          reason: "Connector execution passed connection and capability checks.",
          decided_by: user.id,
          metadata: {
            provider,
            action,
          },
        })
        .select("id, decision")
        .single();

    if (governanceError || !governanceDecision) {
      await supabase
        .from("agent_executions")
        .update({
          status: "failed",
          error_message: "Governance decision could not be created.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      return NextResponse.json(
        { error: "Governance decision could not be created." },
        { status: 500 }
      );
    }

    /*
     * Record the policy evaluation.
     */
    await supabase.from("policy_evaluations").insert({
      organization_id: organizationId,
      agent_id: agentId,
      execution_id: executionId,
      governance_decision_id: governanceDecision.id,
      result: "allowed",
      risk_level: "medium",
      explanation:
        "Execution allowed after organization, agent, connection, provider, and capability validation.",
      evaluation_context: {
        provider,
        action,
        connection_id: connectionId,
        task_id: taskId || null,
      },
    });

    /*
     * Record execution start in the audit/event layer.
     */
    await supabase.from("agent_events").insert({
      organization_id: organizationId,
      agent_id: agentId,
      agent_connection_id: connectionId,
      execution_id: executionId,
      event_type: "execution_started",
      metadata: {
        provider,
        action,
      },
    });

    const connectorAction: ConnectorAction = {
      action: action as ConnectorCapability,
      payload,
    };

    const context: ConnectorContext = {
      connectionId: connection.id,
      agentId: connection.agent_id,
      organizationId: connection.organization_id,
    };

    const startedAt = Date.now();

    const result = await executeConnectorAction(
      provider,
      connectorAction,
      context
    );

    const latencyMs = Date.now() - startedAt;

    /*
     * Connector request log.
     */
    await supabase.from("connector_request_logs").insert({
      organization_id: organizationId,
      agent_id: agentId,
      agent_connection_id: connectionId,
      execution_id: executionId,
      request_method: "POST",
      status: result.success ? "success" : "failed",
      response_status: result.success ? 200 : 400,
      latency_ms: latencyMs,
      request_metadata: {
        provider,
        action,
      },
      response_metadata: result.success
        ? { success: true }
        : { success: false, error: result.error },
      completed_at: new Date().toISOString(),
    });

    if (result.success) {
      await supabase
        .from("agent_executions")
        .update({
          status: "completed",
          output_data: result.data ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      await supabase.from("agent_events").insert({
        organization_id: organizationId,
        agent_id: agentId,
        agent_connection_id: connectionId,
        execution_id: executionId,
        event_type: "execution_completed",
        metadata: {
          provider,
          action,
          latency_ms: latencyMs,
        },
      });

      await supabase.from("audit_logs").insert({
        organization_id: organizationId,
        user_id: user.id,
        agent_id: agentId,
        action: "connector_execution_completed",
        entity_type: "agent_execution",
        entity_id: executionId,
        details: {
          provider,
          action,
          connection_id: connectionId,
          task_id: taskId || null,
          latency_ms: latencyMs,
        },
      });
    } else {
      await supabase
        .from("agent_executions")
        .update({
          status: "failed",
          error_message: result.error || "Connector execution failed.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", executionId);

      await supabase.from("agent_events").insert({
        organization_id: organizationId,
        agent_id: agentId,
        agent_connection_id: connectionId,
        execution_id: executionId,
        event_type: "execution_failed",
        metadata: {
          provider,
          action,
          error: result.error || "Connector execution failed.",
          latency_ms: latencyMs,
        },
      });

      await supabase.from("audit_logs").insert({
        organization_id: organizationId,
        user_id: user.id,
        agent_id: agentId,
        action: "connector_execution_failed",
        entity_type: "agent_execution",
        entity_id: executionId,
        details: {
          provider,
          action,
          connection_id: connectionId,
          task_id: taskId || null,
          error: result.error || "Connector execution failed.",
          latency_ms: latencyMs,
        },
      });
    }

    return NextResponse.json(
      {
        ...result,
        executionId,
        governanceDecisionId: governanceDecision.id,
      },
      {
        status: result.success ? 200 : 400,
      }
    );
  } catch (error) {
    console.error("Governed connector execution error:", error);

    return NextResponse.json(
      {
        error: "Failed to execute connector action.",
      },
      { status: 500 }
    );
  }
}