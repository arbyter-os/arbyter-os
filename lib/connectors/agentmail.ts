import { fetchValidatedExternalUrl, validateExternalUrl } from "@/lib/security/validate-external-url";

import type {
  Connector,
  ConnectorAction,
  ConnectorContext,
  ConnectorResult,
} from "./types";

const AGENTMAIL_INBOX = "creatorai@agentmail.to";

/** Fixed subject used when a reply arrives without an explicit subject field. */
const REPLY_DEFAULT_SUBJECT = "Reply from Arbyter";

export const agentMailConnector: Connector = {
  provider: "agentmail",

  capabilities: ["messages.send", "messages.reply"],

  async execute(
    action: ConnectorAction,
    context: ConnectorContext
  ): Promise<ConnectorResult> {
    if (action.action !== "messages.send" && action.action !== "messages.reply") {
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

    const to = payload.to;
    const text = payload.text;

    if (!to || !text) {
      return {
        success: false,
        error: "to and text are required.",
      };
    }

    // The intent-mapping contract for messages.reply is { to, text } with no
    // subject; AgentMail's send endpoint requires one, so replies without an
    // explicit subject use a fixed default (mirrors mapSend's default).
    const subject =
      typeof payload.subject === "string" && payload.subject.trim()
        ? payload.subject
        : action.action === "messages.reply"
          ? REPLY_DEFAULT_SUBJECT
          : "Message from Arbyter";

    const recipients = Array.isArray(to) ? to : [to];

    try {
      const endpoint = `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(AGENTMAIL_INBOX)}/messages/send`;
      const operation = action.action;
      const validation = await validateExternalUrl(endpoint, { protocols: ["https:"] });
      if (!validation.valid) {
        console.error("AgentMail connector endpoint validation failed", { operation });
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
        console.error("AgentMail API error", { operation, status: response.status });
        return { success: false, error: "AgentMail rejected the request." };
      }

      return { success: true, data };
    } catch {
      console.error("AgentMail connector request failed", { operation: action.action });
      return { success: false, error: "Failed to connect to AgentMail." };
    }
  },
};
