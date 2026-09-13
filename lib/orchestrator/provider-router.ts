import type { ExecutionProvider } from './types'

export type ProviderRoute = {
  provider: ExecutionProvider
  connectionId: string
}

export function resolveProviderRoute(
  provider: string,
  connectionId: string
): ProviderRoute {
  const supported: ExecutionProvider[] = [
    'mcp',
    'zapier',
    'api',
    'sdk',
    'webhook',
  ]

  if (!supported.includes(provider as ExecutionProvider)) {
    throw new Error(`Unsupported execution provider: ${provider}`)
  }

  return {
    provider: provider as ExecutionProvider,
    connectionId,
  }
}