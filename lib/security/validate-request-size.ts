export const MAX_MESSAGE_BYTES = 32 * 1024

export function validateMessageSize(message: string): boolean {
  return Buffer.byteLength(message, "utf8") <= MAX_MESSAGE_BYTES
}
