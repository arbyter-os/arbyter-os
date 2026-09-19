import type {
  Connector,
  ConnectorAction,
  ConnectorContext,
  ConnectorResult,
} from "./types";

const AGENTMAIL_INBOX = "creatorai@agentmail.to";

export const agentMailConnector: Connector = {
  provider: "agentmail",

  capabilities: [
    "messages.send",
  ],

  async execute(
    action: ConnectorAction,
    context: ConnectorContext
  ): Promise<ConnectorResult> {
    if (action.action !== "messages.send") {
      return {
        success: false,
        error: `Unsupported AgentMail action: ${action.action}`,
      };
    }

    const apiKey = context.credential?.secret;

    if (!apiKey) {
      return {
        success: false,
        error: "AgentMail connection credential is unavailable.",
      };
    }

    const { to, subject, text } = action.payload;

    if (!to || !subject || !text) {
      return {
        success: false,
        error: "to, subject, and text are required.",
      };
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
      const response = await fetch(
        `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(
          AGENTMAIL_INBOX
        )}/messages/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: recipients,
            subject,
            text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("AgentMail API error:", data);

        return {
          success: false,
          error: "AgentMail rejected the request.",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("AgentMail connector error:", error);

      return {
        success: false,
        error: "Failed to connect to AgentMail.",
      };
    }
  },
};
