import { GeminiProvider } from "@/lib/llm/gemini"
import type { LLMProvider } from "@/lib/llm/types"

export type Intent = {
  intent: string
  entities: Record<string, string>
  required_capabilities: string[]
  action: string
}

function isIntent(value: unknown): value is Intent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  if (typeof item.intent !== "string" || item.intent.trim() === "") return false
  if (typeof item.action !== "string" || item.action.trim() === "") return false
  if (!item.entities || typeof item.entities !== "object" || Array.isArray(item.entities)) return false
  if (!Array.isArray(item.required_capabilities) || item.required_capabilities.length === 0) return false

  const entities = item.entities as Record<string, unknown>
  const capabilities = item.required_capabilities as unknown[]
  return Object.entries(entities).every(([key, value]) => key.trim() !== "" && typeof value === "string") &&
    capabilities.every((entry) => typeof entry === "string" && entry.trim() !== "")
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

  if (!isIntent(raw)) throw new Error("LLM intent failed schema validation.")
  return raw
}
