import { GoogleGenAI } from "@google/genai"
import type { LLMProvider, LLMStructuredRequest } from "./types.ts"
import { consumeGeminiBudget } from "../security/gemini-budget.ts"

export class GeminiProvider implements LLMProvider {
  private readonly client: GoogleGenAI
  private readonly model: string

  constructor(apiKey = process.env.GEMINI_API_KEY ?? "", model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.")
    this.client = new GoogleGenAI({ apiKey })
    this.model = model
  }

  async generateStructured<T>({ system, input, context }: LLMStructuredRequest): Promise<unknown> {
    if (!context?.userId) {
      throw new Error("Gemini request context is required.")
    }

    try {
      consumeGeminiBudget(context.userId)
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: input,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
        },
      })

      const text = response.text
      if (!text) throw new Error("Gemini returned no structured output.")

      try {
        return JSON.parse(text) as T
      } catch {
        throw new Error("Gemini returned invalid JSON.")
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Gemini returned ")) {
        throw error
      }
      if (error instanceof Error && (error.name === "GeminiBudgetExceededError" || error.message === "Gemini request context is required.")) {
        throw error
      }
      throw new Error("Gemini request failed.", { cause: error })
    }
  }
}
