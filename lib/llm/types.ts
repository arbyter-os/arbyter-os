export type LLMRequestContext = {
  userId: string
  [key: string]: unknown
}

export type LLMStructuredRequest = {
  system: string
  input: string
  context?: LLMRequestContext
}

export interface LLMProvider {
  generateStructured<T>(
    request: LLMStructuredRequest
  ): Promise<unknown>
}
