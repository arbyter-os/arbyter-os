import { createClient } from "@/lib/supabase/server"
import type { GovernanceAction } from "./action-recommendations"
import { authorizeApprovalResources } from "./authorization"

export type GovernanceActionContext = {
  organizationId: string
  agentId?: string
  taskId?: string
  tool?: string
  executionId?: string
  action: GovernanceAction
}

export type GovernanceActionResult = {
  success: boolean
  action: GovernanceAction
  message: string
  requiresHuman: boolean
}

export async function executeGovernanceAction(
  context: GovernanceActionContext
): Promise<GovernanceActionResult> {
  const supabase = await createClient()

  switch (context.action) {
    case "approve":
      return {
        success: false,
        action: "approve",
        message: "Approval must be performed through the approval resolution workflow.",
        requiresHuman: true,
      }

    case "block":
      return {
        success: false,
        action: "block",
        message: "Blocking must be performed through the execution/governance workflow.",
        requiresHuman: true,
      }

    case "request_approval": {
      if (!context.agentId || !context.taskId) {
        return {
          success: false,
          action: "request_approval",
          message: "Agent and task are required to request approval.",
          requiresHuman: true,
        }
      }

      const authorized = await authorizeApprovalResources(
        supabase,
        context.organizationId,
        context.agentId,
        context.taskId
      )

      if (!authorized) {
        return {
          success: false,
          action: "request_approval",
          message: "Unable to create the approval request.",
          requiresHuman: true,
        }
      }

      const { error } = await supabase
        .from("approval_requests")
        .insert({
          organization_id: context.organizationId,
          agent_id: context.agentId,
          task_id: context.taskId,
          status: "pending",
        })

      if (error) {
        console.error("Governance approval request failed:", error)
        return {
          success: false,
          action: "request_approval",
          message: "Unable to create the approval request.",
          requiresHuman: true,
        }
      }

      return {
        success: true,
        action: "request_approval",
        message: "Human approval has been requested before execution.",
        requiresHuman: true,
      }
    }

    case "pause_agent": {
      if (!context.agentId) {
        return {
          success: false,
          action: "pause_agent",
          message: "Agent ID is required.",
          requiresHuman: true,
        }
      }

      const { data, error } = await supabase
        .from("ai_agents")
        .update({ status: "paused" })
        .eq("id", context.agentId)
        .eq("organization_id", context.organizationId)
        .select("id")
        .maybeSingle()

      if (error) {
        console.error("Governance pause-agent failed:", error)
        return {
          success: false,
          action: "pause_agent",
          message: "Unable to pause the agent.",
          requiresHuman: true,
        }
      }

      if (!data) {
        return {
          success: false,
          action: "pause_agent",
          message: "Agent was not found in the organization.",
          requiresHuman: true,
        }
      }

      return {
        success: true,
        action: "pause_agent",
        message: "Agent has been paused by governance.",
        requiresHuman: true,
      }
    }

    case "disable_tool": {
      if (!context.agentId || !context.tool) {
        return {
          success: false,
          action: "disable_tool",
          message: "Agent ID and tool are required.",
          requiresHuman: true,
        }
      }

      const { data, error } = await supabase
        .from("agent_permissions")
        .update({ enabled: false })
        .eq("agent_id", context.agentId)
        .eq("organization_id", context.organizationId)
        // agent_permissions has no `tool` column. The tool identity lives in
        // permission_key; filtering on a non-existent column made this
        // governance control fail closed-but-silently (PostgREST 42703).
        .eq("permission_key", context.tool)
        .select("id")
        .maybeSingle()

      if (error) {
        console.error("Governance disable-tool failed:", error)
        return {
          success: false,
          action: "disable_tool",
          message: "Unable to disable the tool.",
          requiresHuman: true,
        }
      }

      if (!data) {
        return {
          success: false,
          action: "disable_tool",
          message: "Tool permission was not found for the agent.",
          requiresHuman: true,
        }
      }

      return {
        success: true,
        action: "disable_tool",
        message: "Tool access has been disabled for the agent.",
        requiresHuman: true,
      }
    }

    // These actions previously returned success even though no state change
    // occurred. Fail closed until their concrete workflows are implemented.
    case "modify_policy":
    case "retest":
    case "investigate":
    case "create_remediation":
    case "view_regulation":
      return {
        success: false,
        action: context.action,
        message: "This governance action is not implemented yet.",
        requiresHuman: context.action !== "retest" && context.action !== "view_regulation",
      }

    default:
      return {
        success: false,
        action: context.action,
        message: "Unsupported governance action.",
        requiresHuman: true,
      }
  }
}