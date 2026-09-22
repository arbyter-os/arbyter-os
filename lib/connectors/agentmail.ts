import { fetchValidatedExternalUrl, validateExternalUrl } from "@/lib/security/validate-external-url";

import type {
  Connector,
  ConnectorAction,
  ConnectorContext,
  ConnectorResult,
} from "./types";

const AGENTMAIL_INBOX = "creatorai@agentmail.to";

export const agentMailConnector: Connector = {
  provider: "agentmail",

  capabilities: ["messages.send"],

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

    const nestedData = action.payload.data;
    const payload =
      nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)
        ? { ...nestedData, ...action.payload }
        : action.payload;

    const { to, subject, text } = payload;

    if (!to || !subject || !text) {
      return {
        success: false,
        error: "to, subject, and text are required.",
      };
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
      const endpoint = `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(AGENTMAIL_INBOX)}/messages/send`;
      const validation = await validateExternalUrl(endpoint, { protocols: ["https:"] });
      if (!validation.valid) {
        console.error("AgentMail connector endpoint validation failed", { operation: "messages.send" });
        return { success: false, error: "AgentMail endpoint is unavailable." };
      }

      const response = await fetchValidatedExternalUrl(validation, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: recipients, subject, text }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("AgentMail API error", { operation: "messages.send", status: response.status });
        return { success: false, error: "AgentMail rejected the request." };
      }

      return { success: true, data };
    } catch {
      console.error("AgentMail connector request failed", { operation: "messages.send" });
      return { success: false, error: "Failed to connect to AgentMail." };
    }
  },
};
