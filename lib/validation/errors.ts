/**
 * Raised when a request is rejected by schema, parameter, header or body-shape
 * validation. Routes translate it to a 4xx response; anything that is NOT a
 * RequestValidationError must keep falling through to the generic 500 handler so
 * internal failures are never described to clients.
 */
export class RequestValidationError extends Error {
  readonly status = 400
  readonly issues: readonly string[]

  constructor(message: string, issues: readonly string[] = []) {
    super(message)
    this.name = "RequestValidationError"
    this.issues = issues
  }
}

const MAX_ISSUES = 10
const MAX_ISSUE_LENGTH = 200

/**
 * Returns a ready-to-send 4xx Response for request-validation failures
 * (400 invalid input / malformed JSON, 413 oversized body), or null for any other
 * error so the caller can fall through to its normal logging + generic 500.
 *
 * Only field paths and constraint names are returned (for example
 * "$.title is too long"); submitted values and internal details never are.
 */
export function validationErrorResponse(error: unknown): Response | null {
  if (error instanceof RequestValidationError) {
    const issues = error.issues.slice(0, MAX_ISSUES).map((issue) => issue.slice(0, MAX_ISSUE_LENGTH))
    return Response.json(
      issues.length ? { error: "Invalid request.", issues } : { error: "Invalid request." },
      { status: 400 },
    )
  }
  if (error instanceof Error && error.name === "RequestBodyLimitError") {
    return Response.json({ error: "Request body too large." }, { status: 413 })
  }
  return null
}
