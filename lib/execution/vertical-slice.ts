import { createClient } from "@/lib/supabase/server"
import { generateIntent } from "@/lib/intent"
import { createSupabaseAgentRegistry } from "@/lib/agents/registry"
import { selectAgent } from "@/lib/routing"
import { evaluatePolicy } from "@/lib/policy"
import { getTool, validateToolInput } from "@/lib/tools/registry"
import { recordExecutionAudit } from "./audit"

export async function executeUserRequest(requestText: string) {
  const started = Date.now()
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error("You must be signed in.")

  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle()
  if (userError) throw userError
  if (!userRecord?.organization_id) throw new Error("No organization is associated with your account.")

  const intent = await generateIntent(requestText)
  const registry = createSupabaseAgentRegistry()
  const candidates = await registry.discover(intent.required_capabilities)
  const agent = selectAgent(intent, candidates)

  const toolNames = ["generate_sales_report", "send_email"]
  const policy = evaluatePolicy({
    userId: user.id,
    intent: intent.intent,
    action: intent.action,
    agentId: agent.id,
    toolNames,
  })

  const { data: execution, error: executionError } = await supabase
    .from("agent_executions")
    .insert({
      organization_id: userRecord.organization_id,
      agent_id: agent.id,
      execution_type: "request",
      status: policy === "ALLOW" ? "running" : policy === "BLOCK" ? "blocked" : "awaiting_approval",
      input_data: { request: requestText, intent, selectedAgent: agent, tools: toolNames },
      output_data: {},
      risk_level: "low",
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (executionError) throw executionError

  if (policy !== "ALLOW") {
    const audit = await recordExecutionAudit({
      organizationId: userRecord.organization_id,
      executionId: execution.id,
      agentId: agent.id,
      status: policy === "BLOCK" ? "blocked" : "awaiting_approval",
      riskLevel: "low",
      output: { policy },
      errorMessage: policy === "BLOCK" ? "Blocked by deterministic policy." : undefined,
    })
    return { executionId: execution.id, intent, candidates, agent, policy, status: policy === "BLOCK" ? "blocked" : "awaiting_approval", result: null, latencyMs: Date.now() - started, audit }
  }

  try {
    const reportTool = getTool("generate_sales_report")
    validateToolInput(reportTool, {})
    const report = await reportTool.execute({})

    const emailTool = getTool("send_email")
    const emailInput = {
      recipient: intent.entities.recipient ?? "Ali",
      subject: "Sales report",
      text: typeof report === "object" && report && "report" in report ? String((report as { report: unknown }).report) : String(report),
    }
    validateToolInput(emailTool, emailInput)
    const emailResult = await emailTool.execute(emailInput)

    const result = { report, email: emailResult }
    const audit = await recordExecutionAudit({
      organizationId: userRecord.organization_id,
      executionId: execution.id,
      agentId: agent.id,
      status: "completed",
      riskLevel: "low",
      output: { policy, selectedTool: "send_email", result },
    })

    return { executionId: execution.id, intent, candidates, agent, policy, status: "completed", result, latencyMs: Date.now() - started, audit }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed."
    const audit = await recordExecutionAudit({
      organizationId: userRecord.organization_id,
      executionId: execution.id,
      agentId: agent.id,
      status: "failed",
      riskLevel: "high",
      output: {},
      errorMessage: message,
    })
    return { executionId: execution.id, intent, candidates, agent, policy, status: "failed", result: null, error: message, latencyMs: Date.now() - started, audit }
  }
}
