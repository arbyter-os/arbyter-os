import type { ExecutionProvider } from './types'

const SUPPORTED_PROVIDERS: ExecutionProvider[] = [
  'mcp',
  'zapier',
  'api',
  'sdk',
  'webhook',
]

export type ConnectionRecord = {
  id: string
  provider: string | null
  connection_type: string | null
  status: string | null
  health_status: string | null
  configuration?: Record<string, unknown> | null
  endpoint_url?: string | null
}

export type ProviderRoute = {
  provider: ExecutionProvider
  connectionId: string
  connectionType: string | null
  endpointUrl: string | null
  configuration: Record<string, unknown>
}

export function resolveProviderRoute(
  connection: ConnectionRecord
): ProviderRoute {
  const provider = connection.provider?.toLowerCase().trim()

  if (!provider) {
    throw new Error('Agent connection has no provider configured.')
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as ExecutionProvider)) {
    throw new Error(`Unsupported execution provider: ${provider}`)
  }

  if (connection.status !== 'connected') {
    throw new Error('Agent connection is not connected.')
  }

  if (connection.health_status === 'unhealthy') {
    throw new Error('Agent connection is unhealthy.')
  }

  return {
    provider: provider as ExecutionProvider,
    connectionId: connection.id,
    connectionType: connection.connection_type,
    endpointUrl: connection.endpoint_url ?? null,
    configuration: connection.configuration ?? {},
  }
}