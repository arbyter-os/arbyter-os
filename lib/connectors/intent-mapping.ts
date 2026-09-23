// Single, centralized translation layer between the LLM-generated Intent
// (free-form `parameters`) and each connector's strict payload contract.
//
// Why this exists: the intent prompt produces natural parameter names
// (recipient, document, message...) while connectors require exact fields
// (to, subject, text). Passing intent.parameters verbatim into a connector
// guaranteed "to, subject, and text are required." failures at the final hop.
//
// Security properties (do not weaken):
// - Values are strictly type-checked and length-capped before reaching a
//   connector, so untrusted LLM output cannot smuggle arbitrary shapes.
// - Unknown parameter keys are DROPPED, never forwarded, so intent parameters
//   cannot inject fields the connector contract does not define.
// - Mapping failures throw before an execution row is created, so a bad
//   contract can never burn governance/audit state or trigger side effects.

export class IntentMappingError extends Error {
  readonly code = "INTENT_MAPPING_FAILED"

  constructor(message: string) {
    super(message)
    this.name = "IntentMappingError"
  }
}

export type IntentMappingResult = {
  payload: Record<string, string>
  droppedKeys: string[]
}

const MAX_TO_LENGTH = 320
const MAX_SUBJECT_LENGTH = 256
const MAX_TEXT_LENGTH = 10_000

function asString(key: string, value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (typeof value === "boolean") return String(value)
  throw new IntentMappingError(
    `Intent parameter "${key}" must be a string, number, or boolean.`
  )
}

/** Normalizes an email-ish recipient: strips mailto: and display-name wrappers. */
function normalizeRecipient(raw: string): string {
  let candidate = raw
  const display = /<([^>]+)>/.exec(candidate)
  if (display) candidate = display[1]
  if (candidate.toLowerCase().startsWith("mailto:")) candidate = candidate.slice(7)
  candidate = candidate.trim()
  if (!candidate || candidate.length > MAX_TO_LENGTH) {
    throw new IntentMappingError("Intent parameter recipient is not a usable email address.")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    throw new IntentMappingError("Intent parameter recipient is not a usable email address.")
  }
  return candidate
}

function pick(
  params: Record<string, unknown>,
  keys: string[]
): { key: string; value: unknown } | null {
  for (const key of keys) {
    if (key in params && params[key] !== null && params[key] !== undefined) {
      return { key, value: params[key] }
    }
  }
  return null
}

function mapSend(params: Record<string, unknown>): { payload: Record<string, string>; droppedKeys: string[] } {
  const to = pick(params, ["to", "recipient", "email"])
  if (!to) {
    throw new IntentMappingError("A recipient is required to send a message.")
  }
  const toValue = normalizeRecipient(asString(to.key, to.value) ?? "")

  const subject = pick(params, ["subject", "title"])
  const document = pick(params, ["document", "report"])
  const subjectValue = (() => {
    const direct = subject ? asString(subject.key, subject.value) : null
    if (direct) return direct.slice(0, MAX_SUBJECT_LENGTH)
    const doc = document ? asString(document.key, document.value) : null
    if (doc) return doc.slice(0, MAX_SUBJECT_LENGTH)
    return "Message from Arbyter"
  })()

  const text = pick(params, ["text", "body", "message", "content"])
  const textValue = (() => {
    if (text) {
      const value = asString(text.key, text.value)
      if (value) return value.slice(0, MAX_TEXT_LENGTH)
    }
    const doc = document ? asString(document.key, document.value) : null
    if (doc) return doc.slice(0, MAX_TEXT_LENGTH)
    throw new IntentMappingError("A message body is required to send a message.")
  })()

  const droppedKeys = Object.keys(params).filter(
    (key) => !["to", "recipient", "email", "subject", "title", "text", "body", "message", "content", "document", "report"].includes(key)
  )

  return { payload: { to: toValue, subject: subjectValue, text: textValue }, droppedKeys }
}

function mapReply(params: Record<string, unknown>): { payload: Record<string, string>; droppedKeys: string[] } {
  const to = pick(params, ["to", "recipient", "email"])
  if (!to) {
    throw new IntentMappingError("A recipient is required to reply to a message.")
  }
  const toValue = normalizeRecipient(asString(to.key, to.value) ?? "")

  const text = pick(params, ["text", "body", "message", "content"])
  const textValue = text ? asString(text.key, text.value) : null
  if (!textValue) {
    throw new IntentMappingError("A message body is required to reply to a message.")
  }

  const droppedKeys = Object.keys(params).filter(
    (key) => !["to", "recipient", "email", "text", "body", "message", "content"].includes(key)
  )

  return { payload: { to: toValue, text: textValue.slice(0, MAX_TEXT_LENGTH) }, droppedKeys }
}

/**
 * Maps Intent parameters to a connector payload for the given capability.
 * Throws IntentMappingError when the parameters cannot satisfy the contract.
 */
export function mapIntentParametersToConnectorPayload({
  action,
  parameters,
}: {
  action: string
  parameters: Record<string, unknown>
}): IntentMappingResult {
  if (!parameters || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new IntentMappingError("Intent parameters must be an object.")
  }

  switch (action) {
    case "messages.send":
      return mapSend(parameters)
    case "messages.reply":
      return mapReply(parameters)
    case "messages.read":
      // No connector implements messages.read yet; forward an empty payload
      // rather than unvalidated free-form fields.
      return { payload: {}, droppedKeys: Object.keys(parameters) }
    default:
      throw new IntentMappingError(`No connector payload contract is defined for capability "${action}".`)
  }
}
