import { assertJsonSchema, type JsonSchema } from "./json-schema"
import { RequestValidationError } from "./errors"

const id = { type: "string", minLength: 1, maxLength: 128, format: "uuid" } as const
const short = { type: "string", minLength: 1, maxLength: 256, format: "text" } as const
const medium = { type: "string", minLength: 1, maxLength: 4_096, format: "multiline-text" } as const
const description = { type: "string", maxLength: 4_096, format: "multiline-text" } as const
const isoDate = { type: "string", maxLength: 64, format: "iso-date" } as const
const email = { type: "string", minLength: 3, maxLength: 320, format: "email" } as const
const optionalId = { ...id } as const

export const API_SCHEMAS: Record<string, JsonSchema> = {
  "auth:login": { type: "object", properties: { email, password: { type: "string", minLength: 1, maxLength: 1024 } }, required: ["email", "password"], additionalProperties: false },
  "agentmail:send": { type: "object", properties: { to: { type: ["string", "array"], minLength: 3, maxLength: 320, format: "email", minItems: 1, maxItems: 100, items: email }, subject: { type: "string", minLength: 1, maxLength: 998, format: "text" }, text: { type: "string", minLength: 1, maxLength: 100_000, format: "multiline-text" } }, required: ["to", "subject", "text"], additionalProperties: false },
  "agents:create": { type: "object", properties: { name: short, description, agentType: short }, required: ["name"], additionalProperties: false },
  "agents:delete": { type: "object", properties: { agentId: id }, required: ["agentId"], additionalProperties: false },
  "agents:connections:create": { type: "object", properties: { agentId: id, connectionType: short, provider: short, endpointUrl: { type: "string", maxLength: 2_048, format: "url" }, environment: short, configuration: { type: "object" }, capabilities: { type: "object" } }, required: ["agentId", "provider"], additionalProperties: false },
  "agents:connections:update": { type: "object", properties: { connectionId: id, agentId: id, provider: short, endpointUrl: { type: "string", maxLength: 2_048, format: "url" }, environment: short, configuration: { type: "object" }, capabilities: { type: "object" } }, required: ["connectionId", "agentId"], additionalProperties: false },
  "agents:connections:delete": { type: "object", properties: { connectionId: id, agentId: id }, required: ["connectionId", "agentId"], additionalProperties: false },
  "agents:credentials": { type: "object", properties: { agentConnectionId: id, name: short, credentialType: short, secret: { type: "string", minLength: 1, maxLength: 16_384 }, expiresAt: { type: ["string", "null"], maxLength: 64, format: "iso-date" } }, required: ["agentConnectionId", "name", "secret"], additionalProperties: false },
  "agents:verify": { type: "object", properties: { agentId: id }, required: ["agentId"], additionalProperties: false },
  "approvals:resolve": { type: "object", properties: { decision: { type: "string", enum: ["approved", "rejected"] }, decisionNote: description }, required: ["decision"], additionalProperties: false },
  "connectors:execute": { type: "object", properties: { agentId: id, taskId: optionalId, agentConnectionId: optionalId, capability: { type: "string", enum: ["messages.send", "messages.read", "messages.reply"] }, environment: short, country: short, state: short, jurisdiction: short, sector: short, data: { type: "object" } }, required: ["agentId", "capability"], additionalProperties: false },
  "discovery:mcp": { type: "object", properties: { serverUrl: { type: "string", minLength: 8, maxLength: 2_048, format: "url" }, authorization: { type: "string", maxLength: 8_192 } }, required: ["serverUrl"], additionalProperties: false },
  "discovery:review": { type: "object", properties: { findingId: id, action: { type: "string", enum: ["confirm", "reject", "onboard"] } }, required: ["findingId", "action"], additionalProperties: false },
  "discovery:run": { type: "object", properties: { scanId: id }, required: ["scanId"], additionalProperties: false },
  "discovery:scans": { type: "object", properties: { sourceIds: { type: "array", maxItems: 100, items: id }, sourcesRequested: { type: "array", maxItems: 100, items: short } }, required: [], additionalProperties: false },
  "discovery:sources:create": { type: "object", properties: { sourceType: short, name: short, provider: short, environment: short, endpointUrl: { type: "string", maxLength: 2_048, format: "url" }, configuration: { type: "object" } }, required: ["sourceType"], additionalProperties: false },
  "discovery:sources:update": { type: "object", properties: { sourceId: id, sourceType: short, name: short, provider: short, environment: short, endpointUrl: { type: "string", maxLength: 2_048, format: "url" }, configuration: { type: "object" } }, required: ["sourceId"], additionalProperties: false },
  "execute": { type: "object", properties: { message: { type: "string", minLength: 1, maxLength: 64_000, format: "multiline-text" } }, required: ["message"], additionalProperties: false },
  "governance:action": { type: "object", properties: { action: short, agentId: optionalId, taskId: optionalId, tool: short, executionId: optionalId }, required: ["action"], additionalProperties: false },
  "governance:evaluate": { type: "object", properties: { action: short, tool: short, agentId: optionalId, taskId: optionalId, executionId: optionalId, agentConnectionId: optionalId, environment: short, country: short, state: short, jurisdiction: short, sector: short, data: { type: "object" } }, required: [], additionalProperties: false },
  "governance:policy:create": { type: "object", properties: { name: short, description, policyType: short, version: short, effectiveDate: isoDate, reviewDate: isoDate, sourceType: short, authority: short, jurisdiction: short, sector: short, sourceReference: { type: "string", maxLength: 2_048, format: "text" }, sourceUrl: { type: "string", maxLength: 2_048, format: "url" }, effectiveFrom: isoDate, effectiveUntil: isoDate }, required: ["name"], additionalProperties: false },
  "governance:rule:create": { type: "object", properties: { policyId: id, name: short, description, ruleType: short, effect: short, priority: { type: "integer", minimum: -1_000_000, maximum: 1_000_000 }, conditions: { type: "object" }, enabled: { type: "boolean" }, version: short, scope: { type: "object" }, exceptions: { type: "object" }, requirements: { type: "array", maxItems: 100, items: id } }, required: ["policyId", "name"], additionalProperties: false },
  "tasks:create": { type: "object", properties: { title: short, agentId: id, description, priority: { type: "string", enum: ["low", "medium", "high", "critical"] } }, required: ["title", "agentId"], additionalProperties: false },
  "tasks:execute": { type: "object", properties: { taskId: id, agentConnectionId: optionalId, capability: { type: "string", enum: ["messages.send", "messages.read", "messages.reply"] }, environment: short, country: short, state: short, jurisdiction: short, sector: short, data: { type: "object" } }, required: ["taskId", "capability"], additionalProperties: false },
  "test-mcp": { type: "object", properties: { jsonrpc: { type: "string", enum: ["2.0"] }, id: { type: ["string", "number", "null"], maxLength: 128 }, method: { type: "string", enum: ["initialize", "notifications/initialized", "tools/list", "tools/call", "resources/list", "prompts/list"] }, params: { type: "object" } }, required: ["method"], additionalProperties: false },
}

export function assertApiBody(body: unknown, key: string): void {
  const schema = API_SCHEMAS[key]
  if (!schema) throw new Error(`Missing API schema: ${key}`)
  assertJsonSchema(body, schema, `${key} request`)
}


export function assertApiParam(value: unknown, format: "uuid" | "nonempty" = "nonempty", label = "parameter"): void {
  if (typeof value !== "string" || value.length < 1 || value.length > 128) {
    throw new RequestValidationError(`${label} failed parameter validation`, [`${label} is invalid`])
  }
  if (format === "uuid" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new RequestValidationError(`${label} failed parameter validation`, [`${label} is invalid`])
  }
}

export function assertApiHeader(value: string | null | undefined, label = "header"): string {
  const normalized = value?.trim() ?? ""
  if (!normalized || normalized.length > 200 || !/^[A-Za-z0-9._~:/-]+$/.test(normalized)) {
    throw new RequestValidationError(`${label} failed header validation`, [`${label} is invalid`])
  }
  return normalized
}
