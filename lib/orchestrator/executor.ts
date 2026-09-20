import type { ProviderRoute } from './provider-router'
import type {
  OrchestrationRequest,
  OrchestrationResult,
} from './types'
import {
  fetchValidatedExternalUrl,
  validateExternalUrl,
} from '../security/validate-external-url'

async function validateExecutionEndpoint(endpointUrl: string) {
  const validation = await validateExternalUrl(endpointUrl, {
    protocols: ['https:', 'http:'],
  })

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return validation
}

export async function executeProvider(
  route: ProviderRoute,
  request: OrchestrationRequest
): Promise<OrchestrationResult> {
  switch (route.provider) {
    case 'api':
      return executeApi(route, request)

    case 'webhook':
      return executeWebhook(route, request)

    case 'mcp':
    case 'zapier':
    case 'sdk':
      return {
        success: false,
        status: 'failed',
        provider: route.provider,
        error:
          `The ${route.provider} execution adapter is not connected yet.`,
      }

    default:
      return {
        success: false,
        status: 'failed',
        provider: route.provider,
        error: 'Unsupported execution provider.',
      }
  }
}

async function executeApi(
  route: ProviderRoute,
  request: OrchestrationRequest
): Promise<OrchestrationResult> {
  if (!route.endpointUrl) {
    return {
      success: false,
      status: 'failed',
      provider: 'api',
      error: 'API connection has no endpoint URL.',
    }
  }

  const validation = await validateExecutionEndpoint(route.endpointUrl)
  const response = await fetchValidatedExternalUrl(validation, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: request.action,
      tool: request.tool,
      input: request.input,
    }),
  })

  const text = await response.text()

  let output: unknown = text

  try {
    output = text ? JSON.parse(text) : null
  } catch {
    // Keep non-JSON responses as text.
  }

  if (!response.ok) {
    return {
      success: false,
      status: 'failed',
      provider: 'api',
      output,
      error: `API execution failed with status ${response.status}.`,
    }
  }

  return {
    success: true,
    status: 'completed',
    provider: 'api',
    output,
  }
}

async function executeWebhook(
  route: ProviderRoute,
  request: OrchestrationRequest
): Promise<OrchestrationResult> {
  if (!route.endpointUrl) {
    return {
      success: false,
      status: 'failed',
      provider: 'webhook',
      error: 'Webhook connection has no endpoint URL.',
    }
  }

  const validation = await validateExecutionEndpoint(route.endpointUrl)
  const response = await fetchValidatedExternalUrl(validation, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: request.action,
      tool: request.tool,
      input: request.input,
    }),
  })

  const text = await response.text()

  if (!response.ok) {
    return {
      success: false,
      status: 'failed',
      provider: 'webhook',
      error: `Webhook execution failed with status ${response.status}.`,
    }
  }

  return {
    success: true,
    status: 'completed',
    provider: 'webhook',
    output: text || null,
  }
}