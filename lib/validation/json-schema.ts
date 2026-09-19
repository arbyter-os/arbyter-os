export type JsonSchema = {
  type?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean
  items?: JsonSchema
}

function typeMatches(value: unknown, type: string): boolean {
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
  if (schema.type && !typeMatches(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`)
    return errors
  }

  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const object = value as Record<string, unknown>
    for (const key of schema.required ?? []) {
      if (!(key in object)) errors.push(`${path}.${key} is required`)
    }
    const properties = schema.properties ?? {}
    for (const [key, child] of Object.entries(properties)) {
      if (key in object) validateJsonSchema(object[key], child, `${path}.${key}`, errors)
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(object)) {
        if (!(key in properties)) errors.push(`${path}.${key} is not allowed`)
      }
    }
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateJsonSchema(item, schema.items!, `${path}[${index}]`, errors))
  }

  return errors
}

export function assertJsonSchema(value: unknown, schema: JsonSchema, label = "value"): void {
  const errors = validateJsonSchema(value, schema)
  if (errors.length) throw new Error(`${label} failed schema validation: ${errors.join("; ")}`)
}
