import { GeminiProvider } from "../llm/gemini.ts"
import type { LLMProvider, LLMRequestContext } from "../llm/types.ts"
import type { ConnectorCapability } from "../connectors/types.ts"
import { assertJsonSchema } from "../validation/json-schema.ts"

export type Intent = {
  intent: string
  action: string
  parameters: Record<string, string>
  required_capabilities: ConnectorCapability[]
}

const connectorCapabilities = ["messages.send", "messages.read", "messages.reply"] as const

const intentSchema = {
  type: "object",
  properties: {
    intent: { type: "string" },
    action: { type: "string" },
    parameters: { type: "object", additionalProperties: true },
    required_capabilities: {
      type: "array",
      items: { type: "string", enum: connectorCapabilities },
    },
  },
  required: ["intent", "action", "parameters", "required_capabilities"],
  additionalProperties: false,
} as const

export function validateIntent(value: unknown): asserts value is Intent {
  assertJsonSchema(value, intentSchema, "Gemini intent")
  const item = value as Intent

  if (!item.intent.trim() || !item.action.trim()) {
    throw new Error("Gemini intent failed schema validation: intent and action must not be empty.")
  }

  for (const [key, parameter] of Object.entries(item.parameters)) {
    if (!key.trim() || typeof parameter !== "string" || !parameter.trim()) {
      throw new Error("Gemini intent failed schema validation: parameters must be non-empty string key/value pairs.")
    }
  }

  if (item.required_capabilities.some((capability) => !connectorCapabilities.includes(capability))) {
    throw new Error("Gemini intent failed schema validation: required_capabilities must use canonical connector capabilities.")
  }
}

export async function generateIntent(
  input: string,
  provider?: LLMProvider,
  context?: LLMRequestContext,
): Promise<Intent> {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Request is required.")
  }

  const llm = provider ?? new GeminiProvider()
  const raw = await llm.generateStructured<Intent>({
    system: [
      "Convert the user's request into a single structured intent/action result.",
      "Return JSON only; do not return markdown, explanations, or extra fields.",
      "The exact shape is {intent:string, action:string, parameters:object<string,string>, required_capabilities:string[]}.",
      "Use parameters for information extracted from the user's request, such as recipient or document.",
      "required_capabilities must use only the canonical ConnectorCapability values: messages.send, messages.read, messages.reply.",
      "For sending an email/message, use required_capabilities:['messages.send'] while keeping the intent/action names unchanged.",
      "Example: 'Send the sales report to Ali' => {intent:'send_report', action:'send_email', parameters:{recipient:'Ali', document:'sales report'}, required_capabilities:['messages.send']}.",
      "Do not invent values or capabilities that are not present or reasonably implied by the user's request.",
    ].join(" "),
    input: input.trim(),
    context,
  })

  validateIntent(raw)
  return raw
}
