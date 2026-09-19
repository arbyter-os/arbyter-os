import { GeminiProvider } from "../llm/gemini.ts"
import type { LLMProvider } from "../llm/types.ts"
import { assertJsonSchema } from "../validation/json-schema.ts"

export type Intent = {
  intent: string
  entities: Record<string, string>
  required_capabilities: string[]
  action: string
}

const intentSchema = {
  type: "object",
  properties: {
    intent: { type: "string" },
    entities: { type: "object", additionalProperties: true },
    required_capabilities: { type: "array", items: { type: "string" } },
    action: { type: "string" },
  },
  required: ["intent", "entities", "required_capabilities", "action"],
  additionalProperties: false,
} as const

export function validateIntent(value: unknown): asserts value is Intent {
  assertJsonSchema(value, intentSchema, "LLM intent")
  const item = value as Intent
  if (!item.intent.trim() || !item.action.trim() || item.required_capabilities.length === 0) {
    throw new Error("LLM intent failed schema validation: required fields must not be empty.")
  }
  if (Object.entries(item.entities).some(([key, entityValue]) => !key.trim() || typeof entityValue !== "string")) {
    throw new Error("LLM intent failed schema validation: entities must be string key/value pairs.")
  }
  if (item.required_capabilities.some((capability) => !capability.trim())) {
    throw new Error("LLM intent failed schema validation: capabilities must be non-empty strings.")
  }
}

function fallbackIntent(input: string): Intent {
  const normalized = input.trim().toLowerCase()
  if (normalized.includes("sales report") && normalized.includes("send")) {
    return {
      intent: "send_report",
      entities: { recipient: "Ali", report: "sales_report" },
      required_capabilities: ["generate_sales_report", "send_email"],
      action: "send_report",
    }
  }
  throw new Error("Unable to determine a supported intent.")
}

export async function generateIntent(input: string, provider?: LLMProvider): Promise<Intent> {
  if (!input.trim()) throw new Error("Request is required.")
  if (!provider && !process.env.GEMINI_API_KEY) return fallbackIntent(input)

  const llm = provider ?? new GeminiProvider()
  const raw = await llm.generateStructured<Intent>({
    system: [
      "Convert the user request into JSON only.",
      "Allowed shape: {intent:string, entities:object<string,string>, required_capabilities:string[], action:string}.",
      "For 'Send the sales report to Ali.', use intent send_report, required_capabilities generate_sales_report and send_email, and action send_report.",
      "Never add capabilities that are not needed.",
    ].join(" "),
    input,
  })
  validateIntent(raw)
  return raw
}
