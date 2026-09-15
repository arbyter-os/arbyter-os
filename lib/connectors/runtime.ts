import { initializeConnectors } from "./index";
import { getConnector } from "./registry";
import type {
  ConnectorAction,
  ConnectorContext,
  ConnectorResult,
} from "./types";

export async function executeConnectorAction(
  provider: string,
  action: ConnectorAction,
  context: ConnectorContext
): Promise<ConnectorResult> {
  initializeConnectors();

  const connector = getConnector(provider);

  if (!connector) {
    return {
      success: false,
      error: `Connector not found: ${provider}`,
    };
  }

  if (!connector.capabilities.includes(action.action)) {
    return {
      success: false,
      error: `Capability "${action.action}" is not supported by ${provider}.`,
    };
  }

  try {
    return await connector.execute(action, context);
  } catch (error) {
    console.error(
      `Connector execution failed for ${provider}:`,
      error
    );

    return {
      success: false,
      error: "Connector execution failed.",
    };
  }
}