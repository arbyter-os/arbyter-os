import { checkRateLimit } from "./rate-limit.ts"

export const GEMINI_BUDGET_LIMIT = 10
export const GEMINI_BUDGET_WINDOW_MS = 60_000

export class GeminiBudgetExceededError extends Error {
  constructor() {
    super("Gemini usage budget exceeded.")
    this.name = "GeminiBudgetExceededError"
  }
}

/** Distributed per-user Gemini budget. Fails closed if the rate-limit service is unavailable. */
export async function consumeGeminiBudget(userId: string): Promise<void> {
  if (!userId.trim()) throw new Error("Gemini request context is required.")
  let result
  try {
    result = await checkRateLimit(`gemini:${userId}`, GEMINI_BUDGET_LIMIT, GEMINI_BUDGET_WINDOW_MS)
  } catch {
    throw new Error("Gemini budget service unavailable.")
  }
  if (!result.allowed) throw new GeminiBudgetExceededError()
}

export function resetGeminiBudgetForTests(): void {}
