import type { ConnectorCapability } from "../connectors/types.ts"

export function resolveExecutionCapability(input: {
  requestedCapability?: ConnectorCapability
  enabledCapabilities: Record<string, boolean>
  connectorCapabilities: ConnectorCapability[]
}): ConnectorCapability {
  if (input.requestedCapability) {
    if (input.enabledCapabilities[input.requestedCapability] !== true) {
      throw new Error(
        `Requested connector capability "${input.requestedCapability}" is not enabled on the selected connection.`
      )
    }

    if (!input.connectorCapabilities.includes(input.requestedCapability)) {
      throw new Error(
        `Requested connector capability "${input.requestedCapability}" is not supported by the connector.`
      )
    }

    return input.requestedCapability
  }

  const action = input.connectorCapabilities.find(
    (capability) => input.enabledCapabilities[capability] === true
  )

  if (!action) {
    throw new Error("No executable connector capability is configured.")
  }

  return action
}
