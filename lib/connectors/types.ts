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
    /** Credential-row metadata (agent_credentials.metadata): provider-specific
     *  organization bindings such as the AgentMail sender inbox live here. */
    metadata?: unknown;
  };
  /** Connection-level configuration (agent_connections.configuration):
   *  owner-controlled connector settings, e.g. agentmail_inbox. */
  connectionConfiguration?: Record<string, unknown>;
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
