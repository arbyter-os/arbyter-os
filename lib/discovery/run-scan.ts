import { createClient } from "@/lib/supabase/server";
import { scanMCPServer } from "@/lib/discovery/scanners/mcp";
import { processDiscoveryFinding } from "@/lib/discovery/process-finding";

export async function runDiscoveryScan(scanId: string) {
  const supabase = await createClient();

  const { data: scan, error: scanError } = await supabase
    .from("discovery_scans")
    .select("*")
    .eq("id", scanId)
    .single();

  if (scanError || !scan) {
    throw new Error("Discovery scan not found.");
  }

  await updateScan(supabase, scanId, {
    status: "preparing",
    started_at: new Date().toISOString(),
    error_message: null,
  });

  const { data: scanSources, error: sourcesError } = await supabase
    .from("discovery_scan_sources")
    .select(`
      *,
      discovery_sources (*)
    `)
    .eq("scan_id", scanId);

  if (sourcesError) {
    await failScan(supabase, scanId, sourcesError.message);
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
      await updateScanSource(supabase, scanSource.id, {
        status: "connecting",
        started_at: new Date().toISOString(),
        error_message: null,
      });

      await updateScan(supabase, scanId, {
        status: "connecting",
      });

      if (source.source_type !== "mcp") {
        await updateScanSource(supabase, scanSource.id, {
          status: "skipped",
          completed_at: new Date().toISOString(),
          error_message:
            "This discovery source does not have a scanner yet.",
        });

        continue;
      }

      if (!source.endpoint_url) {
        throw new Error("MCP source does not have an endpoint URL.");
      }

      await updateScanSource(supabase, scanSource.id, {
        status: "scanning",
      });

      await updateScan(supabase, scanId, {
        status: "scanning",
      });

      const headers: Record<string, string> = {};

      const configuration = source.configuration ?? {};

      if (
        typeof configuration.authorization === "string" &&
        configuration.authorization.trim()
      ) {
        headers.Authorization = configuration.authorization.trim();
      }

      const result = await scanMCPServer({
        serverUrl: source.endpoint_url,
        headers,
      });

      if (!result.success) {
        throw new Error(result.error ?? "MCP scan failed.");
      }

      await updateScan(supabase, scanId, {
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

      if (!findingResult.duplicate) {
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
      }

      await updateScanSource(supabase, scanSource.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        findings_count: findingResult.duplicate ? 0 : 1,
      });
    } catch (error) {
      hasErrors = true;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown discovery error.";

      await updateScanSource(supabase, scanSource.id, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      });
    }
  }

  await updateScan(supabase, scanId, {
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
  values: Record<string, unknown>
) {
  const { error } = await supabase
    .from("discovery_scans")
    .update(values)
    .eq("id", scanId);

  if (error) {
    throw error;
  }
}

async function updateScanSource(
  supabase: any,
  scanSourceId: string,
  values: Record<string, unknown>
) {
  const { error } = await supabase
    .from("discovery_scan_sources")
    .update(values)
    .eq("id", scanSourceId);

  if (error) {
    throw error;
  }
}

async function failScan(
  supabase: any,
  scanId: string,
  message: string
) {
  await supabase
    .from("discovery_scans")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("id", scanId);
}