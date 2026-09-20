export const GEMINI_BUDGET_LIMIT = 10
export const GEMINI_BUDGET_WINDOW_MS = 60_000

export class GeminiBudgetExceededError extends Error {
  constructor() {
    super("Gemini usage budget exceeded.")
    this.name = "GeminiBudgetExceededError"
  }
}

type Bucket = {
  windowStartedAt: number
  count: number
}

const buckets = new Map<string, Bucket>()

export function consumeGeminiBudget(userId: string, now = Date.now()): void {
  if (!userId.trim()) {
    throw new Error("Gemini request context is required.")
  }

  const current = buckets.get(userId)
  if (!current || now - current.windowStartedAt >= GEMINI_BUDGET_WINDOW_MS) {
    buckets.set(userId, { windowStartedAt: now, count: 1 })
    return
  }

  if (current.count >= GEMINI_BUDGET_LIMIT) {
    throw new GeminiBudgetExceededError()
  }

  current.count += 1
}

export function resetGeminiBudgetForTests(): void {
  buckets.clear()
}
