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

export async function POST(request: NextRequest) {
  try {
    initializeConnectors();

    const supabase = await createClient();

    // 1. Authenticate the current user
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
    } = body;

    // 2. Validate request
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

    // 3. Resolve the user's organization
    const { data: userRecord, error: organizationError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (organizationError) {
      console.error(
        "Failed to resolve organization:",
        organizationError
      );

      return NextResponse.json(
        { error: "Failed to resolve organization." },
        { status: 500 }
      );
    }

    if (!userRecord?.organization_id) {
      return NextResponse.json(
        {
          error: "User is not associated with an organization.",
        },
        { status: 403 }
      );
    }

    const organizationId = userRecord.organization_id;

    // 4. Verify the agent belongs to this organization
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id, organization_id")
      .eq("id", agentId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (agentError) {
      console.error("Failed to verify agent:", agentError);

      return NextResponse.json(
        { error: "Failed to verify agent." },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        {
          error: "Agent not found or does not belong to this organization.",
        },
        { status: 403 }
      );
    }

    // 5. Load the exact connection for this organization + agent
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

    if (connectionError) {
      console.error(
        "Failed to load agent connection:",
        connectionError
      );

      return NextResponse.json(
        { error: "Failed to load agent connection." },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          error:
            "Connection not found or does not belong to this agent and organization.",
        },
        { status: 403 }
      );
    }

    // 6. Make sure the requested provider matches the stored connection
    if (connection.provider !== provider) {
      return NextResponse.json(
        {
          error: "Provider does not match the configured connection.",
        },
        { status: 400 }
      );
    }

    // 7. Make sure the connector actually exists
    const connector = getConnector(provider);

    if (!connector) {
      return NextResponse.json(
        {
          error: `Connector not found: ${provider}`,
        },
        { status: 400 }
      );
    }

    // 8. Make sure the connector supports the requested action
    if (
      !connector.capabilities.includes(
        action as ConnectorCapability
      )
    ) {
      return NextResponse.json(
        {
          error: `Connector "${provider}" does not support action "${action}".`,
        },
        { status: 400 }
      );
    }

    // 9. Check the capability granted to this specific connection
    const capabilities =
      connection.capabilities &&
      typeof connection.capabilities === "object"
        ? connection.capabilities as Record<string, unknown>
        : {};

    const capabilityEnabled = capabilities[action] === true;

    if (!capabilityEnabled) {
      return NextResponse.json(
        {
          error: `Action "${action}" is not enabled for this connection.`,
        },
        { status: 403 }
      );
    }

    // 10. Do not execute a connection that is explicitly disconnected/failed
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

    // 11. Build the generic connector action
    const connectorAction: ConnectorAction = {
      action: action as ConnectorCapability,
      payload,
    };

    const context: ConnectorContext = {
      connectionId: connection.id,
      agentId: connection.agent_id,
      organizationId: connection.organization_id,
    };

    // 12. Execute through the generic Connector Runtime
    const result = await executeConnectorAction(
      provider,
      connectorAction,
      context
    );

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Connector runtime error:", error);

    return NextResponse.json(
      {
        error: "Failed to execute connector action.",
      },
      { status: 500 }
    );
  }
}