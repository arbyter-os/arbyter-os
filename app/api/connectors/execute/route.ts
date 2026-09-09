import { NextRequest, NextResponse } from "next/server";
import { initializeConnectors } from "@/lib/connectors";
import { executeConnectorAction } from "@/lib/connectors/runtime";
import type {
  ConnectorAction,
  ConnectorContext,
} from "@/lib/connectors/types";

export async function POST(request: NextRequest) {
  try {
    initializeConnectors();

    const body = await request.json();

    const {
      provider,
      action,
      payload,
      connectionId,
      agentId,
      organizationId,
    } = body;

    if (!provider || !action || !payload) {
      return NextResponse.json(
        {
          error: "provider, action, and payload are required.",
        },
        { status: 400 }
      );
    }

    const connectorAction: ConnectorAction = {
      action,
      payload,
    };

    const context: ConnectorContext = {
      connectionId: connectionId ?? "",
      agentId: agentId ?? "",
      organizationId: organizationId ?? "",
    };

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