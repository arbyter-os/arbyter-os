import { RequestValidationError } from "../validation/errors.ts";

const DEFAULT_MAX_REQUEST_BODY_BYTES = 256 * 1024;

export class RequestBodyLimitError extends Error {
  readonly status = 413
  constructor(message = "Request body too large.") {
    super(message)
    this.name = "RequestBodyLimitError"
  }
}


export async function readJsonBody<T = Record<string, any>>(
  request: Request,
  maxBytes = DEFAULT_MAX_REQUEST_BODY_BYTES,
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new RequestValidationError("Invalid Content-Length.", ["Content-Length is invalid"]);
    }
    if (parsedLength > maxBytes) {
      throw new RequestBodyLimitError();
    }
  }

  if (!request.body) {
    throw new RequestValidationError("Request body is required.", ["A JSON request body is required"]);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("Request body too large.");
        throw new RequestBodyLimitError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total).toString("utf8");
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new RequestValidationError("Malformed JSON request body.", ["Request body is not valid JSON"]);
  }
}

export const MAX_JSON_REQUEST_BODY_BYTES = DEFAULT_MAX_REQUEST_BODY_BYTES;
