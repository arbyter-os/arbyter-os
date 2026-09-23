// Chat → execution bridge. Pure logic, no React: the component renders
// ChatBubble values, this module decides what they contain.
//
// Security properties:
// - The request contains ONLY { message }. No client-supplied organizationId,
//   agentId, connectionId, credential, or capability — those are server-derived.
// - Every bubble text is a fixed client-owned string. Response bodies are used
//   ONLY for branching (status fields), never interpolated as raw text, so
//   no provider/database/stack detail can ever reach the chat surface.

export type ChatBubble =
  | { role: "user"; kind: "text"; text: string }
  | { role: "assistant"; kind: "text"; text: string }
  | { role: "assistant"; kind: "status"; text: string; detail?: string }
  | { role: "assistant"; kind: "error"; text: string; detail?: string }

export type ExecutionOutcome =
  | { kind: "completed"; executionId?: string }
  | { kind: "no_compatible_agent" }
  | { kind: "no_agent_selected" }
  | { kind: "unsupported_multiple_capabilities" }
  | { kind: "awaiting_approval" }
  | { kind: "blocked" }
  | { kind: "failed" }

/** The ONLY request body Chat sends. Deliberately minimal. */
export function buildExecuteRequestBody(message: string): { message: string } {
  return { message }
}

/**
 * Maps a /api/execute HTTP response to the bubbles the UI should append.
 * Never throws; never renders server-supplied text.
 */
export async function executeMessageToBubbles(
  response: Response,
  fallbackDetailFromLogs: undefined = undefined
): Promise<ChatBubble[]> {
  // Parse defensively: the body is used only for status branching.
  let body: Record<string, unknown> = {}
  try {
    const parsed = await response.json()
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>
    }
  } catch {
    body = {}
  }

  const status = response.status

  if (status === 401) {
    return [{ role: "assistant", kind: "error", text: "Your session has expired. Please sign in again." }]
  }

  if (status === 403) {
    return [{
      role: "assistant",
      kind: "error",
      text: "This action requires an owner or admin with multi-factor authentication enabled.",
      detail: "Manage MFA in Settings.",
    }]
  }

  if (status === 413) {
    return [{ role: "assistant", kind: "error", text: "That message is too large to send." }]
  }

  if (status === 429) {
    return [{
      role: "assistant",
      kind: "error",
      text: "Rate limit reached. Please wait a moment and try again.",
    }]
  }

  if (status === 400) {
    return [{
      role: "assistant",
      kind: "error",
      text: "That message could not be turned into an agent action.",
      detail: body.code === "INTENT_MAPPING_FAILED" ? "Missing or invalid details (recipient, subject, or message)." : undefined,
    }]
  }

  if (status !== 200) {
    return [{ role: "assistant", kind: "error", text: "Something went wrong. Please try again." }]
  }

  // 200 — inspect the orchestration outcome.
  const orchestrationStatus =
    typeof body.status === "string" ? body.status : undefined
  const execution =
    body.execution && typeof body.execution === "object"
      ? (body.execution as Record<string, unknown>)
      : undefined

  if (orchestrationStatus === "no_compatible_agent") {
    return [{
      role: "assistant",
      kind: "status",
      text: "No agent in your organization can perform that yet.",
      detail: "Connect an agent with the right capabilities under Agents.",
    }]
  }

  if (orchestrationStatus === "no_agent_selected" || orchestrationStatus === "unsupported_multiple_capabilities") {
    return [{
      role: "assistant",
      kind: "status",
      text: "That request spans more than Arbyter can route to one agent.",
      detail: "Try an action a single connected agent supports.",
    }]
  }

  const executionStatus =
    execution && typeof execution.status === "string"
      ? (execution.status as string)
      : undefined

  if (executionStatus === "awaiting_approval" || executionStatus === "flagged") {
    return [{
      role: "assistant",
      kind: "status",
      text: "This action needs approval before it can run.",
      detail: "Review it under Approvals.",
    }]
  }

  if (executionStatus === "blocked") {
    return [{
      role: "assistant",
      kind: "status",
      text: "This action was blocked by governance policy.",
      detail: "See Risks & Policies for details.",
    }]
  }

  if (executionStatus === "failed") {
    return [{
      role: "assistant",
      kind: "error",
      text: "The agent action failed.",
      detail: "Check Audit for the execution record.",
    }]
  }

  if (executionStatus === "completed") {
    return [{
      role: "assistant",
      kind: "text",
      text: "Done — your agent action completed successfully.",
    }]
  }

  return [{ role: "assistant", kind: "error", text: "Something went wrong. Please try again." }]
}

/** Outcome classification used by tests and the UI for a completed 200 body. */
export function classifyOutcome(body: Record<string, unknown>): ExecutionOutcome {
  const execution =
    body.execution && typeof body.execution === "object"
      ? (body.execution as Record<string, unknown>)
      : undefined
  const executionStatus =
    execution && typeof execution.status === "string" ? execution.status : undefined

  switch (body.status) {
    case "no_compatible_agent":
      return { kind: "no_compatible_agent" }
    case "no_agent_selected":
      return { kind: "no_agent_selected" }
    case "unsupported_multiple_capabilities":
      return { kind: "unsupported_multiple_capabilities" }
    default:
      break
  }
  switch (executionStatus) {
    case "awaiting_approval":
    case "flagged":
      return { kind: "awaiting_approval" }
    case "blocked":
      return { kind: "blocked" }
    case "failed":
      return { kind: "failed" }
    case "completed":
      return {
        kind: "completed",
        executionId: typeof body.executionId === "string" ? body.executionId : undefined,
      }
    default:
      return { kind: "failed" }
  }
}
