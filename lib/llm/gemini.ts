import type { LLMProvider, LLMStructuredRequest } from "./types"

export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey = process.env.GEMINI_API_KEY ?? "", model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash") {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.")
    this.apiKey = apiKey
    this.model = model
  }

  async generateStructured<T>({ system, input }: LLMStructuredRequest): Promise<unknown> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: input }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Gemini request failed.")
    }

    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) throw new Error("Gemini returned no structured output.")

    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error("Gemini returned invalid JSON.")
    }
  }
}
