import { GeminiProvider } from "../llm/gemini.ts"
import type { LLMProvider } from "../llm/types.ts"
import { assertJsonSchema } from "../validation/json-schema.ts"

export type Intent = {
  intent: string
  action: string
  parameters: Record<string, string>
}

const intentSchema = {
  type: "object",
  properties: {
    intent: { type: "string" },
    action: { type: "string" },
    parameters: { type: "object", additionalProperties: true },
  },
  required: ["intent", "action", "parameters"],
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
}

export async function generateIntent(input: string, provider?: LLMProvider): Promise<Intent> {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Request is required.")
  }

  const llm = provider ?? new GeminiProvider()
  const raw = await llm.generateStructured<Intent>({
    system: [
      "Convert the user's request into a single structured intent/action result.",
      "Return JSON only; do not return markdown, explanations, or extra fields.",
      "The exact shape is {intent:string, action:string, parameters:object<string,string>}.",
      "Use parameters for information extracted from the user's request, such as recipient or document.",
      "Example: 'Send the sales report to Ali' => {intent:'send_report', action:'send_email', parameters:{recipient:'Ali', document:'sales report'}}.",
      "Do not invent values that are not present or reasonably implied by the user's request.",
    ].join(" "),
    input: input.trim(),
  })

  validateIntent(raw)
  return raw
}
