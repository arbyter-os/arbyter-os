import { RequestValidationError } from "./errors"

export type JsonSchema = {
  type?: string | readonly string[]
  properties?: Readonly<Record<string, JsonSchema>>
  required?: readonly string[]
  additionalProperties?: boolean
  items?: JsonSchema
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  minimum?: number
  maximum?: number
  pattern?: string
  enum?: readonly unknown[]
  format?: "uuid" | "email" | "url" | "iso-date" | "text" | "multiline-text"
}

const hasOwn = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key)

// Free-form `{ type: "object" }` fields (configuration, data, params, conditions...)
// are otherwise unbounded apart from the 256 KB body limit. Bound depth and key count
// so they cannot be used for algorithmic-complexity abuse downstream, and refuse
// `__proto__` keys, which JSON.parse creates as an own property and which are a
// prototype-pollution vector if the value is ever merged into another object.
export const MAX_JSON_DEPTH = 8
export const MAX_JSON_KEYS = 500

function boundedJsonErrors(value: unknown, path: string): string[] {
  const errors: string[] = []
  let keys = 0
  const stack: Array<{ node: unknown; depth: number }> = [{ node: value, depth: 0 }]
  while (stack.length) {
    const { node, depth } = stack.pop()!
    if (!node || typeof node !== "object") continue
    if (depth > MAX_JSON_DEPTH) { errors.push(`${path} is nested too deeply`); break }
    const entries = Array.isArray(node) ? node.map((item, index) => [String(index), item] as const) : Object.entries(node)
    for (const [key, child] of entries) {
      keys += 1
      if (keys > MAX_JSON_KEYS) { errors.push(`${path} has too many keys`); return errors }
      if (key === "__proto__") { errors.push(`${path} contains a forbidden key`); return errors }
      stack.push({ node: child, depth: depth + 1 })
    }
  }
  return errors
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value)
  if (!match) return false
  const [, y, mo, d, h = "0", mi = "0", sec = "0"] = match
  const year = Number(y), month = Number(mo), day = Number(d)
  if (month < 1 || month > 12 || day < 1) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth && Number(h) <= 23 && Number(mi) <= 59 && Number(sec) <= 59
}

function typeMatches(value: unknown, type: string | readonly string[]): boolean {
  if (Array.isArray(type)) return type.some((candidate) => typeMatches(value, candidate))
  switch (type) {
    case "object": return !!value && typeof value === "object" && !Array.isArray(value)
    case "array": return Array.isArray(value)
    case "string": return typeof value === "string"
    case "boolean": return typeof value === "boolean"
    case "number": return typeof value === "number" && Number.isFinite(value)
    case "integer": return typeof value === "number" && Number.isInteger(value)
    case "null": return value === null
    default: return false
  }
}

export function validateJsonSchema(value: unknown, schema: JsonSchema, path = "$", errors: string[] = []): string[] {
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) { errors.push(`${path} has an invalid value`); return errors }
  if (schema.type && !typeMatches(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`)
    return errors
  }

  if ((schema.type === "string" || (Array.isArray(schema.type) && schema.type.includes("string"))) && typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is too short`)
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} is too long`)
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path} has an invalid format`)
    if (schema.format === "uuid" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) errors.push(`${path} must be a UUID`)
    if (schema.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`${path} must be an email address`)
    if (schema.format === "url") { try { const url = new URL(value); if (!["https:", "http:"].includes(url.protocol)) throw new Error() } catch { errors.push(`${path} must be a valid URL`) } }
    // "text": single-line printable text. Rejects every control character (NUL, CR, LF, TAB, DEL, C1)
    // and the Unicode line/paragraph separators, which is what header/log injection relies on.
    if (schema.format === "text" && /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(value)) errors.push(`${path} contains forbidden characters`)
    // "multiline-text": as above but LF, CR and TAB are allowed.
    if (schema.format === "multiline-text" && /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value)) errors.push(`${path} contains forbidden characters`)
    if (schema.format === "iso-date" && !isCalendarDate(value)) errors.push(`${path} must be an ISO date`)
  }

  if ((schema.type === "number" || schema.type === "integer" || (Array.isArray(schema.type) && (schema.type.includes("number") || schema.type.includes("integer")))) && typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is too small`)
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} is too large`)
  }

  if ((schema.type === "array" || (Array.isArray(schema.type) && schema.type.includes("array"))) && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has too few items`)
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`)
  }

  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>
    for (const key of schema.required ?? []) {
      if (!hasOwn(object, key)) errors.push(`${path}.${key} is required`)
    }
    const properties = schema.properties ?? {}
    if (!schema.properties) errors.push(...boundedJsonErrors(object, path))
    for (const [key, child] of Object.entries(properties)) {
      if (hasOwn(object, key)) validateJsonSchema(object[key], child, `${path}.${key}`, errors)
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(object)) {
        if (!hasOwn(properties, key)) errors.push(`${path}.${key} is not allowed`)
      }
    }
  }

  if ((schema.type === "array" || (Array.isArray(schema.type) && schema.type.includes("array"))) && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateJsonSchema(item, schema.items!, `${path}[${index}]`, errors))
  }

  return errors
}

export function assertJsonSchema(value: unknown, schema: JsonSchema, label = "value"): void {
  const errors = validateJsonSchema(value, schema)
  if (errors.length) throw new RequestValidationError(`${label} failed schema validation: ${errors.join("; ")}`, errors)
}
