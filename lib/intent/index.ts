import { GeminiProvider } from "@/lib/llm/gemini"
import type { LLMProvider } from "@/lib/llm/types"

export type Intent = {
  intent: string
  entities: Record<string, string>
  required_capabilities: string[]
  action: string
}

function isIntent(value: unknown): value is Intent {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return (
    typeof item.intent === "string" &&
    !!item.entities &&
    typeof item.entities === "object" &&
    !Array.isArray(item.entities) &&
    Array.isArray(item.required_capabilities) &&
    item.required_capabilities.every((entry) => typeof entry === "string") &&
    typeof item.action === "string"
  )
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

export async function generateIntent(
  input: string,
  provider: LLMProvider = new GeminiProvider()
): Promise<Intent> {
  if (!input.trim()) throw new Error("Request is required.")

  let raw: unknown
  try {
    raw = await provider.generateStructured<Intent>({
      system: [
        "Convert the user request into JSON only.",
        "Allowed shape: {intent:string, entities:object<string,string>, required_capabilities:string[], action:string}.",
        "For 'Send the sales report to Ali.', use intent send_report, required_capabilities generate_sales_report and send_email, and action send_report.",
        "Never add capabilities that are not needed.",
      ].join(" "),
      input,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "GEMINI_API_KEY is not configured.") {
      return fallbackIntent(input)
    }
    throw error
  }

  if (!isIntent(raw)) throw new Error("LLM intent failed schema validation.")
  return raw
}
