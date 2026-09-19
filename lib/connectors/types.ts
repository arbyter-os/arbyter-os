export type ConnectorCapability =
  | "messages.send"
  | "messages.read"
  | "messages.reply";

export type ConnectorAction = {
  action: ConnectorCapability;
  payload: Record<string, unknown>;
};

export type ConnectorContext = {
  connectionId: string;
  agentId: string;
  organizationId: string;
  credential?: {
    id: string;
    type: string;
    secret: string;
  };
};

export type ConnectorResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export interface Connector {
  provider: string;
  capabilities: ConnectorCapability[];

  execute(
    action: ConnectorAction,
    context: ConnectorContext
  ): Promise<ConnectorResult>;
}
