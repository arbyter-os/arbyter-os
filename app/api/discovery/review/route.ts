import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReviewAction = "confirm" | "reject" | "onboard";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = await request.json();
    const findingId = typeof body.findingId === "string" ? body.findingId.trim() : "";
    const action = body.action as ReviewAction;

    if (!findingId || !["confirm", "reject", "onboard"].includes(action)) {
      return NextResponse.json({ error: "Invalid finding or action." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: "Could not find your organization." }, { status: 403 });
    }

    if (action === "onboard" && profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only an owner or admin can onboard discovered agents." },
        { status: 403 },
      );
    }

    const organizationId = profile.organization_id;
    const { data: finding, error: findingError } = await supabase
      .from("discovery_findings")
      .select(`
        id, organization_id, name, description, classification, provider,
        framework, environment, endpoint, review_status, onboarding_status,
        onboarded_agent_id
      `)
      .eq("id", findingId)
      .eq("organization_id", organizationId)
      .single();

    if (findingError || !finding) {
      return NextResponse.json({ error: "Discovery finding not found." }, { status: 404 });
    }

    if (action === "confirm") {
      const { data: updated, error } = await supabase
        .from("discovery_findings")
        .update({
          review_status: "confirmed",
          onboarding_status: finding.onboarding_status === "onboarded" ? "onboarded" : "not_onboarded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", findingId)
        .eq("organization_id", organizationId)
        .select("id, review_status, onboarding_status, onboarded_agent_id")
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, action, finding: updated });
    }

    if (action === "reject") {
      const { data: updated, error } = await supabase
        .from("discovery_findings")
        .update({
          review_status: "rejected",
          onboarding_status: "skipped",
          updated_at: new Date().toISOString(),
        })
        .eq("id", findingId)
        .eq("organization_id", organizationId)
        .select("id, review_status, onboarding_status, onboarded_agent_id")
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, action, finding: updated });
    }

    if (finding.review_status !== "confirmed") {
      return NextResponse.json({ error: "Confirm the finding before onboarding it." }, { status: 409 });
    }

    if (finding.onboarded_agent_id) {
      return NextResponse.json({
        success: true,
        action,
        agentId: finding.onboarded_agent_id,
        message: "This finding is already onboarded.",
      });
    }

    const agentName = finding.name?.trim() || "Discovered AI Agent";
    const agentType = finding.framework?.trim() || finding.provider?.trim() || finding.classification || "discovered_agent";

    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        organization_id: organizationId,
        name: agentName,
        description: finding.description || "Agent discovered by Arbyter Discovery.",
        agent_type: agentType,
        status: "active",
      })
      .select("id, name, status")
      .single();

    if (agentError || !agent) throw new Error("Could not create the agent.");

    const { data: updated, error: updateError } = await supabase
      .from("discovery_findings")
      .update({
        review_status: "confirmed",
        onboarding_status: "onboarded",
        onboarded_agent_id: agent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", findingId)
      .eq("organization_id", organizationId)
      .select("id, review_status, onboarding_status, onboarded_agent_id")
      .single();

    if (updateError) {
      return NextResponse.json({
        error: "The agent was created, but the discovery finding could not be linked.",
        agentId: agent.id,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, action, agentId: agent.id, agent, finding: updated });
  } catch (error) {
    console.error("Discovery review error:", error);
    return NextResponse.json({ error: "Discovery review failed." }, { status: 500 });
  }
}