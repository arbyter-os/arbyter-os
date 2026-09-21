import { createHash } from "node:crypto";

export type OnboardAgentInput = {
  findingId: string;
  organizationId: string;
  name: string;
  description: string;
  agentType: string;
};

export function deterministicAgentId(findingId: string): string {
  const digest = createHash("sha256")
    .update("arbyter-discovery-onboarding-v1\0", "utf8")
    .update(findingId, "utf8")
    .digest("hex");

  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-${((parseInt(digest.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${digest.slice(18, 20)}-${digest.slice(20, 32)}`;
}

export async function createOrResolveOnboardedAgent(
  supabase: any,
  input: OnboardAgentInput,
) {
  const agentId = deterministicAgentId(input.findingId);
  const { data: insertedAgent, error: agentError } = await supabase
    .from("ai_agents")
    .insert({
      id: agentId,
      organization_id: input.organizationId,
      name: input.name,
      description: input.description,
      agent_type: input.agentType,
      status: "active",
    })
    .select("id, name, status")
    .single();

  if (!agentError && insertedAgent) return insertedAgent;
  if (!agentError || agentError.code !== "23505") {
    throw new Error("Could not create the agent.");
  }

  const { data: existingAgent, error: existingAgentError } = await supabase
    .from("ai_agents")
    .select("id, name, status, organization_id")
    .eq("id", agentId)
    .maybeSingle();

  if (existingAgentError) throw existingAgentError;
  if (!existingAgent || existingAgent.organization_id !== input.organizationId) {
    throw new Error("Could not safely resolve the onboarded agent.");
  }

  return {
    id: existingAgent.id,
    name: existingAgent.name,
    status: existingAgent.status,
  };
}
