import { createClient } from "@/lib/supabase/server"
import type { GovernanceAction } from "./action-recommendations"

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
        success: true,
        action: "approve",
        message: "Governance approved the action.",
        requiresHuman: false,
      }

    case "block":
      return {
        success: true,
        action: "block",
        message: "The governed action has been blocked.",
        requiresHuman: false,
      }

    case "request_approval": {
      if (!context.agentId || !context.taskId) {
        return {
          success: false,
          action: "request_approval",
          message:
            "Agent and task are required to request approval.",
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
        return {
          success: false,
          action: "request_approval",
          message: error.message,
          requiresHuman: true,
        }
      }

      return {
        success: true,
        action: "request_approval",
        message:
          "Human approval has been requested before execution.",
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

      const { error } = await supabase
        .from("ai_agents")
        .update({ status: "paused" })
        .eq("id", context.agentId)
        .eq("organization_id", context.organizationId)

      if (error) {
        return {
          success: false,
          action: "pause_agent",
          message: error.message,
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
          message:
            "Agent ID and tool are required.",
          requiresHuman: true,
        }
      }

      const { error } = await supabase
        .from("agent_permissions")
        .update({ enabled: false })
        .eq("agent_id", context.agentId)
        .eq("organization_id", context.organizationId)
        .eq("tool", context.tool)

      if (error) {
        return {
          success: false,
          action: "disable_tool",
          message: error.message,
          requiresHuman: true,
        }
      }

      return {
        success: true,
        action: "disable_tool",
        message:
          "Tool access has been disabled for the agent.",
        requiresHuman: true,
      }
    }

    case "modify_policy":
      return {
        success: true,
        action: "modify_policy",
        message:
          "Policy modification requires an authorized administrator.",
        requiresHuman: true,
      }

    case "retest":
      return {
        success: true,
        action: "retest",
        message:
          "The action should be evaluated again against the current governance state.",
        requiresHuman: false,
      }

    case "investigate":
      return {
        success: true,
        action: "investigate",
        message:
          "The action has been marked for governance investigation.",
        requiresHuman: true,
      }

    case "create_remediation":
      return {
        success: true,
        action: "create_remediation",
        message:
          "A remediation workflow should be created for this governance finding.",
        requiresHuman: true,
      }

    case "view_regulation":
      return {
        success: true,
        action: "view_regulation",
        message:
          "The applicable regulation should be displayed for review.",
        requiresHuman: false,
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