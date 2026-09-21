import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanMCPServer } from "@/lib/discovery/scanners/mcp";
import { processDiscoveryFinding } from "@/lib/discovery/process-finding";
import { resolveMcpSourceAuthorization } from "@/lib/credentials/mcp";

export async function runDiscoveryScan(scanId: string, organizationId: string) {
  if (!organizationId) {
    throw new Error("Discovery scan organization context is required.");
  }
  const supabase = await createClient();

  const { data: scan, error: scanError } = await supabase
    .from("discovery_scans")
    .select("*")
    .eq("id", scanId)
    .eq("organization_id", organizationId)
    .single();

  if (scanError || !scan) {
    throw new Error("Discovery scan not found.");
  }

  await updateScan(supabase, scanId, organizationId, {
    status: "preparing",
    started_at: new Date().toISOString(),
    error_message: null,
  });

  // discovery_sources SELECT is owner/admin-only under RLS (it carries
  // credential_reference and endpoint_url), but running a scan is a member
  // action: app/api/discovery/run/route.ts already authorizes the caller
  // against this exact scanId/organizationId (and scan.requested_by) before
  // calling here. Use the service-role client for this one read, scoped
  // defensively to both scan_id and organization_id even though RLS is
  // bypassed, rather than widen the discovery_sources SELECT policy back to
  // all members.
  const admin = createAdminClient();
  const { data: scanSources, error: sourcesError } = await admin
    .from("discovery_scan_sources")
    .select(`
      *,
      discovery_sources (*)
    `)
    .eq("scan_id", scanId)
    .eq("organization_id", organizationId);

  if (sourcesError) {
    console.error("Discovery scan sources lookup failed:", sourcesError);
    await failScan(supabase, scanId, organizationId, "Discovery sources could not be loaded.");
    throw sourcesError;
  }

  let totalFindings = 0;
  let confirmedAgents = 0;
  let likelyAgents = 0;
  let unknownSystems = 0;
  let aiServices = 0;
  let hasErrors = false;

  for (const scanSource of scanSources ?? []) {
    const source = scanSource.discovery_sources;

    if (!source) {
      hasErrors = true;
      continue;
    }

    try {
      await updateScanSource(supabase, scanSource.id, organizationId, {
        status: "connecting",
        started_at: new Date().toISOString(),
        error_message: null,
      });

      await updateScan(supabase, scanId, organizationId, {
        status: "connecting",
      });

      if (source.source_type !== "mcp") {
        await updateScanSource(supabase, scanSource.id, organizationId, {
          status: "skipped",
          completed_at: new Date().toISOString(),
          findings_count: 0,
          error_message:
            "This discovery source does not have a scanner yet.",
        });

        continue;
      }

      if (!source.endpoint_url) {
        throw new Error("MCP source does not have an endpoint URL.");
      }

      await updateScanSource(supabase, scanSource.id, organizationId, {
        status: "scanning",
      });

      await updateScan(supabase, scanId, organizationId, {
        status: "scanning",
      });

      const headers: Record<string, string> = {};
      const mcpAuthorization = await resolveMcpSourceAuthorization({
        organizationId: scan.organization_id,
        sourceId: source.id,
      });

      if (mcpAuthorization) {
        headers.Authorization = mcpAuthorization;
      }

      const result = await scanMCPServer({
        serverUrl: source.endpoint_url,
        headers,
      });

      if (!result.success) {
        throw new Error(result.error ?? "MCP scan failed.");
      }

      await updateScan(supabase, scanId, organizationId, {
        status: "analyzing",
      });

      const findingResult = await processDiscoveryFinding({
        organizationId: scan.organization_id,
        scanId,
        sourceId: source.id,

        name:
          result.serverName ??
          source.name ??
          "Discovered MCP Server",

        description:
          "MCP server discovered by Arbyter.",

        provider: source.provider ?? undefined,
        framework: "MCP",
        environment: source.environment ?? "unknown",
        endpoint: source.endpoint_url,

        tools: result.tools,
        capabilities: {
          tools: result.tools.length > 0,
          resources: result.resources.length > 0,
          prompts: result.prompts.length > 0,
        },

        evidence: {
          server_name: result.serverName,
          protocol_version: result.protocol,
          tool_count: result.tools.length,
          resource_count: result.resources.length,
          prompt_count: result.prompts.length,
        },

        rawMetadata: {
          tools: result.tools,
          resources: result.resources,
          prompts: result.prompts,
        },
      });

      /*
       * A duplicate means the agent was already discovered.
       * It should NOT create another finding row,
       * but it SHOULD count as a discovered finding for this scan.
       */
      totalFindings += 1;

      if (findingResult.classification === "confirmed_agent") {
        confirmedAgents += 1;
      }

      if (findingResult.classification === "likely_agent") {
        likelyAgents += 1;
      }

      if (findingResult.classification === "unknown") {
        unknownSystems += 1;
      }

      await updateScanSource(supabase, scanSource.id, organizationId, {
        status: "completed",
        completed_at: new Date().toISOString(),

        // Existing findings still count as discovered.
        findings_count: 1,

        metadata: {
          duplicate: findingResult.duplicate,
          finding_id: findingResult.findingId,
          classification: findingResult.classification ?? null,
          confidence: findingResult.confidence ?? null,
        },
      });
    } catch (error) {
      hasErrors = true;

      // Full detail stays in server logs; the stored (user-visible) message is generic.
      console.error("Discovery scan source failed:", error);
      const message = "Discovery failed for this source.";

      await updateScanSource(supabase, scanSource.id, organizationId, {
        status: "failed",
        completed_at: new Date().toISOString(),
        findings_count: 0,
        error_message: message,
      });
    }
  }

  await updateScan(supabase, scanId, organizationId, {
    status: hasErrors ? "partial" : "completed",
    completed_at: new Date().toISOString(),

    total_findings: totalFindings,
    confirmed_agents: confirmedAgents,
    likely_agents: likelyAgents,
    ai_services: aiServices,
    unknown_systems: unknownSystems,
  });

  return {
    success: true,
    scanId,

    totalFindings,
    confirmedAgents,
    likelyAgents,
    aiServices,
    unknownSystems,

    status: hasErrors ? "partial" : "completed",
  };
}

async function updateScan(
  supabase: any,
  scanId: string,
  organizationId: string,
  values: Record<string, unknown>
) {
  const { error } = await supabase
    .from("discovery_scans")
    .update(values)
    .eq("id", scanId)
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }
}

async function updateScanSource(
  supabase: any,
  scanSourceId: string,
  organizationId: string,
  values: Record<string, unknown>
) {
  const { data: scanSource, error: lookupError } = await supabase
    .from("discovery_scan_sources")
    .select("id, scan_id, discovery_scans!inner(organization_id)")
    .eq("id", scanSourceId)
    .eq("discovery_scans.organization_id", organizationId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!scanSource) throw new Error("Discovery scan source not found.");

  const { error } = await supabase
    .from("discovery_scan_sources")
    .update(values)
    .eq("id", scanSourceId)
    .eq("scan_id", scanSource.scan_id);

  if (error) throw error;
}

async function failScan(
  supabase: any,
  scanId: string,
  organizationId: string,
  message: string
) {
  await supabase
    .from("discovery_scans")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", scanId)
    .eq("organization_id", organizationId);
}