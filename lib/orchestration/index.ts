import type { Intent } from "../intent/index.ts"
import type { AgentDiscoveryResult } from "../discovery/index.ts"
import type { AgentSelectionResult } from "../selection/index.ts"
import type { ConnectorCapability } from "../connectors/types.ts"
import type { ExecutionInput } from "../execution/engine.ts"

export type OrchestrationDependencies = {
  getCurrentUser: () => Promise<{ id: string } | null>
  getOrganizationId: (userId: string) => Promise<string | null>
  authorizeExecution: (userId: string, organizationId: string) => Promise<void>
  generateIntent: (requestText: string) => Promise<Intent>
  discoverAgents: (input: {
    organizationId: string
    requiredCapabilities: ConnectorCapability[]
  }) => Promise<AgentDiscoveryResult[]>
  selectAgent: (input: {
    candidates: AgentDiscoveryResult[]
    requiredCapabilities: ConnectorCapability[]
  }) => AgentSelectionResult
  executeAgentTask: (input: ExecutionInput) => Promise<unknown>
}

export type OrchestrationResult = {
  intent: Intent
  candidates: AgentDiscoveryResult[]
  selectedAgent: AgentSelectionResult
  execution: unknown | null
  executionId?: string
  latencyMs: number
  status:
    | "completed"
    | "no_compatible_agent"
    | "no_agent_selected"
    | "unsupported_multiple_capabilities"
}

async function defaultDependencies(): Promise<OrchestrationDependencies> {
  const [{ createClient }, { authorizeConnectorExecution }, { generateIntent }, { discoverAgents }, { selectAgent }, { executeAgentTask }] =
    await Promise.all([
      import("../supabase/server.ts"),
      import("../security/authorize-connector-execution.ts"),
      import("../intent/index.ts"),
      import("../discovery/index.ts"),
      import("../selection/index.ts"),
      import("../execution/engine.ts"),
    ])

  return {
    getCurrentUser: async () => {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return data.user ? { id: data.user.id } : null
    },
    getOrganizationId: async (userId) => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle()
      if (error) throw error
      return data?.organization_id ?? null
    },
    authorizeExecution: async (userId, organizationId) => {
      const supabase = await createClient()
      await authorizeConnectorExecution({
        supabase,
        userId,
        organizationId,
      })
    },
    generateIntent,
    discoverAgents,
    selectAgent,
    executeAgentTask,
  }
}

export async function orchestrateUserRequest(
  requestText: string
): Promise<OrchestrationResult> {
  return orchestrateUserRequestWithDependencies(
    requestText,
    await defaultDependencies()
  )
}

export async function orchestrateUserRequestWithDependencies(
  requestText: string,
  dependencies: OrchestrationDependencies
): Promise<OrchestrationResult> {
  const started = Date.now()
  const user = await dependencies.getCurrentUser()

  if (!user) {
    throw new Error("You must be signed in.")
  }

  const organizationId = await dependencies.getOrganizationId(user.id)
  if (!organizationId) {
    throw new Error("No organization is associated with your account.")
  }

  await dependencies.authorizeExecution(user.id, organizationId)

  const intent = await dependencies.generateIntent(requestText)

  if (intent.required_capabilities.length !== 1) {
    return {
      intent,
      candidates: [],
      selectedAgent: null,
      execution: null,
      latencyMs: Date.now() - started,
      status: "unsupported_multiple_capabilities",
    }
  }

  const [requestedCapability] = intent.required_capabilities
  const candidates = await dependencies.discoverAgents({
    organizationId,
    requiredCapabilities: intent.required_capabilities,
  })

  if (candidates.length === 0) {
    return {
      intent,
      candidates,
      selectedAgent: null,
      execution: null,
      latencyMs: Date.now() - started,
      status: "no_compatible_agent",
    }
  }

  const selectedAgent = dependencies.selectAgent({
    candidates,
    requiredCapabilities: intent.required_capabilities,
  })

  if (!selectedAgent) {
    return {
      intent,
      candidates,
      selectedAgent: null,
      execution: null,
      latencyMs: Date.now() - started,
      status: "no_agent_selected",
    }
  }

  const execution = await dependencies.executeAgentTask({
    organizationId,
    agentId: selectedAgent.agentId,
    agentConnectionId: selectedAgent.connectionId,
    requestedCapability,
    data: intent.parameters,
  })

  const executionId =
    execution &&
    typeof execution === "object" &&
    "executionId" in execution &&
    typeof execution.executionId === "string"
      ? execution.executionId
      : undefined

  return {
    intent,
    candidates,
    selectedAgent,
    execution,
    executionId,
    latencyMs: Date.now() - started,
    status: "completed",
  }
}
