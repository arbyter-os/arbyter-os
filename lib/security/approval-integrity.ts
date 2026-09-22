import { createHash } from "node:crypto"

/**
 * Deterministic JSON representation used by approval integrity hashes.
 * Object keys are sorted recursively so insertion order cannot change a digest.
 */
export function canonicalizeForHash(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeForHash).join(",")}]`
  }

  const object = value as Record<string, unknown>
  const keys = Object.keys(object).sort()
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${canonicalizeForHash(object[key])}`)
    .join(",")}}`
}

export type ApprovalIntegrityEnvelope = {
  execution_id: string
  agent_id: string
  connection_id: string
  provider: string
  action: string
  capability: string
  input_data: unknown
  task_id: string | null
}

export function buildApprovalIntegrityEnvelope(input: ApprovalIntegrityEnvelope): ApprovalIntegrityEnvelope {
  return {
    execution_id: input.execution_id,
    agent_id: input.agent_id,
    connection_id: input.connection_id,
    provider: input.provider,
    action: input.action,
    capability: input.capability,
    input_data: input.input_data,
    task_id: input.task_id,
  }
}

export function hashApprovalIntegrityEnvelope(envelope: ApprovalIntegrityEnvelope): string {
  return createHash("sha256")
    .update(canonicalizeForHash(buildApprovalIntegrityEnvelope(envelope)), "utf8")
    .digest("hex")
}

/**
 * Retained for compatibility with existing callers/tests. New approval
 * integrity must use hashApprovalIntegrityEnvelope instead.
 */
export function hashApprovalExecutionInput(inputData: unknown): string {
  return createHash("sha256")
    .update(canonicalizeForHash(inputData), "utf8")
    .digest("hex")
}

export const APPROVAL_EXECUTION_INPUT_HASH_METADATA_KEY =
  "approvalExecutionInputSha256"

export const APPROVAL_EXECUTION_ID_METADATA_KEY =
  "approvalExecutionId"

export const APPROVAL_AGENT_ID_METADATA_KEY =
  "approvalAgentId"

export const APPROVAL_INTEGRITY_HASH_METADATA_KEY =
  "approvalExecutionIntegritySha256"

export const APPROVAL_INTEGRITY_ENVELOPE_METADATA_KEY =
  "approvalExecutionIntegrityEnvelope"
