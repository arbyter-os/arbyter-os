import type { SupabaseClient } from "@supabase/supabase-js"

export class ConnectorExecutionAuthorizationError extends Error {
  readonly code = "CONNECTOR_EXECUTION_FORBIDDEN"

  constructor(message = "Only an owner or admin can execute connectors.") {
    super(message)
    this.name = "ConnectorExecutionAuthorizationError"
  }
}

type ExecutionAuthorizationInput = {
  supabase: SupabaseClient
  userId: string
  organizationId: string
}

export async function authorizeConnectorExecution({
  supabase,
  userId,
  organizationId,
}: ExecutionAuthorizationInput): Promise<"owner" | "admin"> {
  const { data, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (
    !data?.organization_id ||
    data.organization_id !== organizationId
  ) {
    throw new ConnectorExecutionAuthorizationError()
  }

  if (data.role !== "owner" && data.role !== "admin") {
    throw new ConnectorExecutionAuthorizationError()
  }

  return data.role
}

export function isConnectorExecutionAuthorizationError(
  error: unknown
): error is ConnectorExecutionAuthorizationError {
  return error instanceof ConnectorExecutionAuthorizationError
}
