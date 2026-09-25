import { fetchValidatedExternalUrl, validateExternalUrl } from "@/lib/security/validate-external-url";

import type {
  Connector,
  ConnectorAction,
  ConnectorContext,
  ConnectorResult,
} from "./types";

/**
 * P0-6 — outbound organization identity.
 *
 * Provider behavior (agentmail SDK 0.5.27, reference.md): the SENDER identity
 * is the inbox_id embedded in the request path (`/v0/inboxes/{inbox_id}/messages/send`);
 * the API key authenticates the whole AgentMail ACCOUNT, not a single inbox.
 * A single hardcoded inbox therefore means every organization's outbound mail
 * shares one identity — the credential is per-org, the visible sender is not.
 *
 * The smallest safe organization-bound model without redesigning the connector
 * system: the inbox is resolved per call, in this order —
 *   1. credential metadata, stored by /api/agents/credentials at creation time
 *      (metadata.agentmail_inbox) — the per-org/per-connection binding;
 *   2. the connection's configuration.agentmail_inbox (owner-controlled);
 *   3. AGENTMAIL_INBOX env (deploy-level default);
 *   4. the historical shared inbox ONLY outside production (fail-closed in
 *      production: no silently shared outbound identity in a real deployment).
 */
const DEFAULT_SHARED_INBOX = "creatorai@agentmail.to";

function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function resolveSenderInbox(
  context: ConnectorContext,
): { inbox: string; source: "credential" | "connection" | "deployment" | "shared-default" } | { error: string } {
  const raw =
    (context.credential?.metadata as Record<string, unknown> | undefined)?.agentmail_inbox ??
    (context.connectionConfiguration as Record<string, unknown> | undefined)?.agentmail_inbox;

  if (typeof raw === "string" && raw.trim()) {
    if (!/^[^\s@]+@[^\s@]+$/.test(raw.trim())) {
      return { error: "Configured AgentMail inbox is not a valid email address." };
    }
    return { inbox: raw.trim(), source: (context.credential?.metadata as Record<string, unknown> | undefined)?.agentmail_inbox ? "credential" : "connection" };
  }

  const deploymentInbox = process.env.AGENTMAIL_INBOX?.trim();
  if (deploymentInbox) {
    return { inbox: deploymentInbox, source: "deployment" };
  }

  if (isProductionDeployment()) {
    return {
      error:
        "No organization-bound AgentMail inbox is configured (credential metadata, connection configuration or AGENTMAIL_INBOX); refusing to send from a shared identity in production.",
    };
  }

  return { inbox: DEFAULT_SHARED_INBOX, source: "shared-default" };
}

/** Fixed subject used when a reply arrives without an explicit subject field. */
const REPLY_DEFAULT_SUBJECT = "Reply from Arbyter";

export const agentMailConnector: Connector = {
  provider: "agentmail",

  capabilities: ["messages.send", "messages.reply"],

  async execute(
    action: ConnectorAction,
    context: ConnectorContext
  ): Promise<ConnectorResult> {
    // P0-6: resolve the outbound identity before anything else. Fail-closed
    // when production would otherwise send from a shared inbox.
    const inboxResolution = resolveSenderInbox(context);
    if ("error" in inboxResolution) {
      console.error("AgentMail inbox resolution failed", { organizationId: context.organizationId, connectionId: context.connectionId });
      return { success: false, error: "AgentMail sender identity is not configured." };
    }
    const agentMailInbox = inboxResolution.inbox;
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
      const endpoint = `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(agentMailInbox)}/messages/send`;
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
