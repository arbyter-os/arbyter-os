export type LLMStructuredRequest = {
  system: string
  input: string
}

export interface LLMProvider {
  generateStructured<T>(
    request: LLMStructuredRequest
  ): Promise<unknown>
}
