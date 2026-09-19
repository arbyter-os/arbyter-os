"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const sources = [
  {
    id: "mcp",
    name: "MCP",
    description: "Discover agents connected through MCP servers.",
  },
  {
    id: "api_gateway",
    name: "APIs & API Gateways",
    description: "Find agents and AI services exposed through APIs.",
  },
  {
    id: "aws",
    name: "AWS",
    description: "Discover AI workloads and agents across AWS.",
  },
  {
    id: "azure",
    name: "Azure",
    description: "Discover AI workloads and agents across Azure.",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    description: "Discover AI workloads and agents across GCP.",
  },
  {
    id: "internal_server",
    name: "Internal Servers",
    description: "Discover agents running inside your infrastructure.",
  },
  {
    id: "ai_platform",
    name: "AI Platforms",
    description: "Discover agents deployed through AI platforms.",
  },
  {
    id: "application",
    name: "Applications",
    description: "Look for AI-powered applications across your company.",
  },
];

type DiscoveryFinding = {
  id: string;
  name: string;
  description: string | null;
  classification: string | null;
  confidence: number | null;
  provider: string | null;
  framework: string | null;
  environment: string | null;
  endpoint: string | null;
  tools: unknown;
  capabilities: unknown;
  evidence: unknown;
  review_status: string | null;
  onboarding_status: string | null;
  discovered_at: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  onboarded_agent_id?: string | null;
};
export default function DiscoveryPage() {
  const supabase = createClient();

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [onboardedCount, setOnboardedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [lastScan, setLastScan] = useState("Never");
  const [loadingStats, setLoadingStats] = useState(true);

  const [findings, setFindings] = useState<DiscoveryFinding[]>([]);
  const [selectedFinding, setSelectedFinding] =
    useState<DiscoveryFinding | null>(null);
  const [loadingFindings, setLoadingFindings] = useState(true);
  const [reviewAction, setReviewAction] = useState<
  "confirm" | "reject" | "onboard" | null
>(null);

  const [mcpOpen, setMcpOpen] = useState(false);
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpAuth, setMcpAuth] = useState("none");
  const [mcpToken, setMcpToken] = useState("");
  const [mcpEnvironment, setMcpEnvironment] = useState("production");
  const [mcpSaving, setMcpSaving] = useState(false);
  const [mcpTesting, setMcpTesting] = useState(false);
  const [mcpMessage, setMcpMessage] = useState("");

  useEffect(() => {
    loadDiscoveryStats();
    loadDiscoveryFindings();
  }, []);

  async function getOrganizationId() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be signed in.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      throw new Error("Could not find your organization.");
    }

    return {
      user,
      organizationId: profile.organization_id,
    };
  }

  async function loadDiscoveryStats() {
    setLoadingStats(true);

    try {
      const { organizationId } = await getOrganizationId();

      const { data: findings, error: findingsError } = await supabase
        .from("discovery_findings")
        .select(
          "id, classification, review_status, onboarding_status, duplicate_of"
        )
        .eq("organization_id", organizationId)
        .neq("review_status", "rejected");

      if (findingsError) {
        throw findingsError;
      }

      const activeFindings = findings ?? [];

      setDiscoveredCount(activeFindings.length);

      setOnboardedCount(
        activeFindings.filter(
          (finding) => finding.onboarding_status === "onboarded"
        ).length
      );

      setReviewCount(
        activeFindings.filter(
          (finding) => finding.review_status === "unreviewed"
        ).length
      );

      setUnknownCount(
        activeFindings.filter(
          (finding) => finding.classification === "unknown"
        ).length
      );

      const { data: latestScan, error: scanError } = await supabase
        .from("discovery_scans")
        .select("completed_at, created_at, status")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!scanError && latestScan) {
        const timestamp = latestScan.completed_at ?? latestScan.created_at;

        if (timestamp) {
          setLastScan(
            new Date(timestamp).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })
          );
        }
      }
    } catch (error) {
      console.error("Discovery stats error:", error);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadDiscoveryFindings() {
    setLoadingFindings(true);

    try {
      const { organizationId } = await getOrganizationId();

      const { data, error } = await supabase
        .from("discovery_findings")
        .select(
          `
            id,
            name,
            description,
            classification,
            confidence,
            provider,
            framework,
            environment,
            endpoint,
            tools,
            capabilities,
            evidence,
            review_status,
            onboarding_status,
            discovered_at,
            first_seen_at,
            last_seen_at
          `
        )
        .eq("organization_id", organizationId)
        .neq("review_status", "rejected")
        .order("discovered_at", { ascending: false });

      if (error) {
        throw error;
      }

      setFindings((data ?? []) as DiscoveryFinding[]);
    } catch (error) {
      console.error("Discovery findings error:", error);
    } finally {
      setLoadingFindings(false);
    }
  }

  function toggleSource(id: string) {
    setSelectedSources((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function saveMcp() {
    setMcpMessage("");

    if (!mcpName.trim()) {
      setMcpMessage("Enter an MCP server name.");
      return;
    }

    if (!mcpUrl.trim()) {
      setMcpMessage("Enter the MCP server URL.");
      return;
    }

    try {
      new URL(mcpUrl.trim());
    } catch {
      setMcpMessage("Enter a valid URL.");
      return;
    }

    if (mcpAuth !== "none" && !mcpToken.trim()) {
      setMcpMessage("Enter the authentication value.");
      return;
    }

    setMcpSaving(true);

    try {
      const { user, organizationId } = await getOrganizationId();

      const configuration: Record<string, string> = {
        authentication_method: mcpAuth,
      };

      if (mcpToken.trim()) {
        configuration.authorization = mcpToken.trim();
      }

      const { data: existing, error: existingError } = await supabase
        .from("discovery_sources")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("source_type", "mcp")
        .eq("endpoint_url", mcpUrl.trim())
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        const { error } = await supabase
          .from("discovery_sources")
          .update({
            name: mcpName.trim(),
            provider: "MCP",
            environment: mcpEnvironment,
            status: "pending",
            access_mode: "read_only",
            endpoint_url: mcpUrl.trim(),
            configuration,
          })
          .eq("id", existing.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("discovery_sources")
          .insert({
            organization_id: organizationId,
            name: mcpName.trim(),
            source_type: "mcp",
            provider: "MCP",
            environment: mcpEnvironment,
            status: "pending",
            access_mode: "read_only",
            endpoint_url: mcpUrl.trim(),
            configuration,
            created_by: user.id,
          });

        if (error) {
          throw error;
        }
      }

      setSelectedSources((current) =>
        current.includes("mcp") ? current : [...current, "mcp"]
      );

      setMcpMessage("MCP server saved.");
      setMcpOpen(false);
    } catch (error) {
      console.error("MCP save error:", error);

      setMcpMessage(
        error instanceof Error ? error.message : "Could not save MCP server."
      );
    } finally {
      setMcpSaving(false);
    }
  }

  async function testMcp() {
    setMcpMessage("");

    if (!mcpUrl.trim()) {
      setMcpMessage("Enter the MCP server URL first.");
      return;
    }

    try {
      const url = new URL(mcpUrl.trim());

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        setMcpMessage("MCP URL must use HTTP or HTTPS.");
        return;
      }
    } catch {
      setMcpMessage("Enter a valid MCP server URL.");
      return;
    }

    setMcpTesting(true);
    setMcpMessage("Testing MCP connection...");

    try {
      const response = await fetch("/api/discovery/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverUrl: mcpUrl.trim(),
          authorization: mcpAuth === "none" ? "" : mcpToken.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.error || "MCP connection failed.");
      }

      setMcpMessage(
        `Connected. ${result.tools?.length ?? 0} tools, ${
          result.resources?.length ?? 0
        } resources, and ${result.prompts?.length ?? 0} prompts discovered.`
      );
    } catch (error) {
      console.error("MCP test error:", error);

      setMcpMessage(
        error instanceof Error ? error.message : "MCP connection failed."
      );
    } finally {
      setMcpTesting(false);
    }
  }

  async function startDiscovery() {
    if (selectedSources.length === 0) {
      setMessage("Select at least one discovery source.");
      return;
    }

    setStarting(true);
    setMessage("Preparing discovery scan...");

    try {
      const { user, organizationId } = await getOrganizationId();

      const { data: existingSources, error: sourceError } = await supabase
        .from("discovery_sources")
        .select("id, source_type, endpoint_url")
        .eq("organization_id", organizationId);

      if (sourceError) {
        throw sourceError;
      }

      const sourceIds: string[] = [];

      for (const sourceType of selectedSources) {
        const existing = existingSources?.find(
          (source) =>
            source.source_type === sourceType &&
            (sourceType !== "mcp" || Boolean(source.endpoint_url))
        );

        if (existing) {
          sourceIds.push(existing.id);
          continue;
        }

        const source = sources.find((item) => item.id === sourceType);

        const { data: created, error: createError } = await supabase
          .from("discovery_sources")
          .insert({
            organization_id: organizationId,
            name: source?.name ?? sourceType,
            source_type: sourceType,
            status: "pending",
            access_mode: "read_only",
            created_by: user.id,
          })
          .select("id")
          .single();

        if (createError) {
          throw createError;
        }

        sourceIds.push(created.id);
      }

      setMessage("Creating discovery scan...");

      const { data: scan, error: scanError } = await supabase
        .from("discovery_scans")
        .insert({
          organization_id: organizationId,
          requested_by: user.id,
          status: "queued",
          sources_requested: selectedSources,
        })
        .select("id")
        .single();

      if (scanError) {
        throw scanError;
      }

      const scanSources = sourceIds.map((sourceId) => ({
        organization_id: organizationId,
        scan_id: scan.id,
        source_id: sourceId,
        status: "queued",
      }));

      const { error: scanSourcesError } = await supabase
        .from("discovery_scan_sources")
        .insert(scanSources);

      if (scanSourcesError) {
        throw scanSourcesError;
      }

      setMessage("Discovery engine starting...");

      const response = await fetch("/api/discovery/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scanId: scan.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "The discovery engine failed to start."
        );
      }

      setMessage(
        `Discovery complete. ${result.totalFindings ?? 0} finding${
          result.totalFindings === 1 ? "" : "s"
        } discovered.`
      );

      await loadDiscoveryStats();
      await loadDiscoveryFindings();
    } catch (error) {
      console.error("Discovery error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while running discovery."
      );
    } finally {
      setStarting(false);
    }
  }

async function reviewFinding(
  action: "confirm" | "reject" | "onboard"
) {
  if (!selectedFinding) {
    return;
  }

  setReviewAction(action);
  setMessage("");

  try {
    const response = await fetch("/api/discovery/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        findingId: selectedFinding.id,
        action,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error || "Could not update the finding."
      );
    }

    if (action === "onboard") {
      setMessage(
        "Agent onboarded successfully. It is now registered in Arbyter."
      );
    } else if (action === "confirm") {
      setMessage(
        "Finding confirmed. You can now onboard this agent."
      );
    } else {
      setMessage("Finding rejected.");
    }

    await loadDiscoveryStats();
    await loadDiscoveryFindings();

    if (action === "reject") {
      setSelectedFinding(null);
    } else if (result.finding) {
      setSelectedFinding((current) =>
        current
          ? {
              ...current,
              review_status:
                result.finding.review_status,
              onboarding_status:
                result.finding.onboarding_status,
              onboarded_agent_id:
                result.finding.onboarded_agent_id ??
                current.onboarded_agent_id,
            }
          : current
      );
    }
  } catch (error) {
    console.error("Review finding error:", error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Could not update the discovery finding."
    );
  } finally {
    setReviewAction(null);
  }
}

  function getToolCount(finding: DiscoveryFinding) {
    if (Array.isArray(finding.tools)) {
      return finding.tools.length;
    }

    return 0;
  }

  function getEvidenceCount(
    finding: DiscoveryFinding,
    key: "resource_count" | "prompt_count"
  ) {
    if (
      finding.evidence &&
      typeof finding.evidence === "object" &&
      key in finding.evidence
    ) {
      const value = (finding.evidence as Record<string, unknown>)[key];

      return typeof value === "number" ? value : 0;
    }

    return 0;
  }

  function getCapabilityCount(finding: DiscoveryFinding) {
    if (
      finding.capabilities &&
      typeof finding.capabilities === "object"
    ) {
      return Object.values(
        finding.capabilities as Record<string, unknown>
      ).filter(Boolean).length;
    }

    return 0;
  }

  function formatClassification(classification: string | null) {
    if (!classification) {
      return "Unknown";
    }

    return classification
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1300BA]">
              Workforce Discovery
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-[#111113] md:text-5xl">
              Discover your AI workforce.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6b6b73]">
              Find AI agents and AI systems across your organization and bring
              them under Arbyter.
            </p>
          </div>

          <button
            onClick={startDiscovery}
            disabled={starting}
            className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? "Running Discovery..." : "Start Discovery"}
          </button>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Last scan", loadingStats ? "..." : lastScan],
            ["Discovered", loadingStats ? "..." : String(discoveredCount)],
            ["Onboarded", loadingStats ? "..." : String(onboardedCount)],
            ["Needs review", loadingStats ? "..." : String(reviewCount)],
            ["Unknown", loadingStats ? "..." : String(unknownCount)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#e6e7eb] bg-white p-5"
            >
              <div className="text-xs font-medium text-[#85858d]">
                {label}
              </div>

              <div className="mt-2 text-2xl font-semibold text-[#111113]">
                {value}
              </div>
            </div>
          ))}
        </div>

        <section className="mb-6 rounded-3xl border border-[#e6e7eb] bg-white p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1300BA]">
                Discovery Results
              </div>

              <h2 className="mt-2 text-2xl font-semibold text-[#111113]">
                Systems Arbyter discovered
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#77777f]">
                Review discovered systems before bringing them into the AI
                workforce.
              </p>
            </div>

            <div className="text-sm text-[#77777f]">
              {findings.length} discovered
            </div>
          </div>

          {loadingFindings ? (
            <div className="rounded-2xl border border-[#e6e7eb] bg-[#f8f9fc] p-5 text-sm text-[#77777f]">
              Loading discovery results...
            </div>
          ) : findings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dcdce2] bg-[#f8f9fc] p-8 text-center">
              <div className="text-sm font-semibold text-[#111113]">
                No discovery findings yet.
              </div>

              <p className="mt-1 text-sm text-[#77777f]">
                Run a discovery scan to find AI systems in your environment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((finding) => {
                const toolCount = getToolCount(finding);
                const resourceCount = getEvidenceCount(
                  finding,
                  "resource_count"
                );
                const promptCount = getEvidenceCount(
                  finding,
                  "prompt_count"
                );

                return (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedFinding(finding)}
                    className="w-full rounded-2xl border border-[#e6e7eb] bg-white p-5 text-left transition hover:border-[#1300BA] hover:bg-[#faf9ff]"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#111113]">
                            {finding.name}
                          </h3>

                          <span className="rounded-full bg-[#eeeafd] px-2.5 py-1 text-[11px] font-semibold text-[#1300BA]">
                            {formatClassification(finding.classification)}
                          </span>

                          {finding.review_status === "unreviewed" && (
                            <span className="rounded-full bg-[#fff7df] px-2.5 py-1 text-[11px] font-semibold text-[#8a6500]">
                              Needs review
                            </span>
                          )}
                        </div>

                        <p className="mt-2 truncate text-sm text-[#77777f]">
                          {finding.endpoint ?? "No endpoint recorded"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-[#66666e]">
                        <span className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                          {toolCount} tools
                        </span>

                        <span className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                          {resourceCount} resources
                        </span>

                        <span className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                          {promptCount} prompts
                        </span>

                        <span className="rounded-lg bg-[#f5f5f7] px-3 py-2">
                          {finding.confidence ?? 0}% confidence
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#e6e7eb] bg-white p-6 md:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-[#111113]">
              Where should Arbyter look?
            </h2>

            <p className="mt-1 text-sm text-[#77777f]">
              Select the environments you want Arbyter to discover.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {sources.map((source) => {
              const selected = selectedSources.includes(source.id);

              return (
                <div
                  key={source.id}
                  className={`rounded-2xl border p-5 transition ${
                    selected
                      ? "border-[#1300BA] bg-[#f7f5ff]"
                      : "border-[#e6e7eb] bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggleSource(source.id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div>
                      <h3 className="font-semibold text-[#111113]">
                        {source.name}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#77777f]">
                        {source.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        selected
                          ? "border-[#1300BA] bg-[#1300BA] text-white"
                          : "border-[#d4d4da] text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </button>

                  {source.id === "mcp" && (
                    <div className="mt-5 flex items-center justify-between border-t border-[#e8e8ed] pt-4">
                      <span className="text-xs text-[#77777f]">
                        {selected
                          ? "MCP selected"
                          : "No MCP server configured"}
                      </span>

                      <button
                        onClick={() => {
                          setMcpOpen(true);
                          setMcpMessage("");
                        }}
                        className="rounded-lg border border-[#d7d7de] bg-white px-3 py-2 text-xs font-semibold text-[#111113] transition hover:bg-[#f8f9fc]"
                      >
                        Configure MCP
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col gap-4 border-t border-[#ededf0] pt-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[#66666e]">
              <span className="font-semibold text-[#111113]">
                {selectedSources.length}
              </span>{" "}
              source{selectedSources.length === 1 ? "" : "s"} selected
            </div>

            <button
              onClick={startDiscovery}
              disabled={starting || selectedSources.length === 0}
              className="rounded-xl bg-[#111113] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {starting ? "Running Discovery..." : "Begin Discovery →"}
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-xl border border-[#e6e7eb] bg-[#f8f9fc] px-4 py-3 text-sm text-[#44444c]">
              {message}
            </div>
          )}
        </section>

        <section className="mt-6 flex flex-col gap-5 rounded-3xl border border-[#e6e7eb] bg-white p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="text-lg font-semibold text-[#111113]">
              Already know about an agent?
            </h2>

            <p className="mt-1 text-sm text-[#77777f]">
              Add an AI agent manually instead of discovering it automatically.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/agents/new";
            }}
            className="rounded-xl border border-[#dcdce2] px-5 py-3 text-sm font-semibold text-[#111113] transition hover:bg-[#f8f9fc]"
          >
            ＋ Add Agent Manually
          </button>
        </section>

        {selectedFinding && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5"
            onClick={() => setSelectedFinding(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto modal-surface rounded-3xl p-6 shadow-2xl md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1300BA]">
                    Discovery Finding
                  </div>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#111113]">
                    {selectedFinding.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eeeafd] px-3 py-1.5 text-xs font-semibold text-[#1300BA]">
                      {formatClassification(selectedFinding.classification)}
                    </span>

                    <span className="rounded-full bg-[#f5f5f7] px-3 py-1.5 text-xs font-semibold text-[#44444c]">
                      {selectedFinding.confidence ?? 0}% confidence
                    </span>

                    <span className="rounded-full bg-[#fff7df] px-3 py-1.5 text-xs font-semibold text-[#8a6500]">
                      {selectedFinding.review_status ?? "unreviewed"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFinding(null)}
                  className="text-2xl text-[#77777f] hover:text-[#111113]"
                >
                  ×
                </button>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f8f9fc] p-4">
                  <div className="text-xs text-[#85858d]">Tools</div>
                  <div className="mt-1 text-2xl font-semibold text-[#111113]">
                    {getToolCount(selectedFinding)}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f8f9fc] p-4">
                  <div className="text-xs text-[#85858d]">Resources</div>
                  <div className="mt-1 text-2xl font-semibold text-[#111113]">
                    {getEvidenceCount(
                      selectedFinding,
                      "resource_count"
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f8f9fc] p-4">
                  <div className="text-xs text-[#85858d]">Prompts</div>
                  <div className="mt-1 text-2xl font-semibold text-[#111113]">
                    {getEvidenceCount(
                      selectedFinding,
                      "prompt_count"
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-[#e6e7eb] p-5">
                <h3 className="text-sm font-semibold text-[#111113]">
                  Detection details
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-[#85858d]">Provider</div>
                    <div className="mt-1 text-sm font-medium text-[#111113]">
                      {selectedFinding.provider ?? "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[#85858d]">Framework</div>
                    <div className="mt-1 text-sm font-medium text-[#111113]">
                      {selectedFinding.framework ?? "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[#85858d]">Environment</div>
                    <div className="mt-1 text-sm font-medium text-[#111113]">
                      {selectedFinding.environment ?? "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-[#85858d]">Onboarding</div>
                    <div className="mt-1 text-sm font-medium text-[#111113]">
                      {selectedFinding.onboarding_status ??
                        "not_onboarded"}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs text-[#85858d]">Endpoint</div>

                  <div className="mt-1 break-all rounded-xl bg-[#f8f9fc] px-3 py-2 text-sm text-[#33333a]">
                    {selectedFinding.endpoint ?? "No endpoint recorded"}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#e6e7eb] p-5">
                <h3 className="text-sm font-semibold text-[#111113]">
                  Evidence
                </h3>

                <div className="mt-4 space-y-3 text-sm text-[#55555d]">
                  <div className="flex justify-between gap-4">
                    <span>Capabilities detected</span>
                    <span className="font-semibold text-[#111113]">
                      {getCapabilityCount(selectedFinding)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Tool definitions discovered</span>
                    <span className="font-semibold text-[#111113]">
                      {getToolCount(selectedFinding)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Resources discovered</span>
                    <span className="font-semibold text-[#111113]">
                      {getEvidenceCount(
                        selectedFinding,
                        "resource_count"
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Prompts discovered</span>
                    <span className="font-semibold text-[#111113]">
                      {getEvidenceCount(
                        selectedFinding,
                        "prompt_count"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="rounded-xl border border-[#dcdce2] px-5 py-3 text-sm font-semibold text-[#111113] hover:bg-[#f8f9fc]"
                >
                  Close
                </button>

                {selectedFinding.review_status === "unreviewed" && (
  <>
    <button
      onClick={() => reviewFinding("reject")}
      disabled={reviewAction !== null}
      className="rounded-xl border border-[#d8a4a4] px-5 py-3 text-sm font-semibold text-[#a32626] hover:bg-[#fff7f7] disabled:opacity-50"
    >
      {reviewAction === "reject"
        ? "Rejecting..."
        : "Reject Finding"}
    </button>

    <button
      onClick={() => reviewFinding("confirm")}
      disabled={reviewAction !== null}
      className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {reviewAction === "confirm"
        ? "Confirming..."
        : "Confirm Agent"}
    </button>
  </>
)}

  {selectedFinding.review_status === "confirmed" &&
    selectedFinding.onboarding_status !== "onboarded" && (
      <button
      onClick={() => reviewFinding("onboard")}
      disabled={reviewAction !== null}
      className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {reviewAction === "onboard"
        ? "Onboarding..."
        : "Onboard Agent →"}
    </button>
  )}

{selectedFinding.onboarding_status === "onboarded" && (
  <div className="rounded-xl bg-[#eef9f1] px-5 py-3 text-sm font-semibold text-[#26733b]">
    ✓ Agent onboarded
  </div>
)}

              </div>
            </div>
          </div>
        )}

        {mcpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
            <div className="w-full max-w-lg modal-surface rounded-3xl p-6 shadow-2xl md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1300BA]">
                    MCP Connection
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold text-[#111113]">
                    Connect an MCP server
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#77777f]">
                    Give Arbyter a read-only connection so it can inspect the
                    MCP server during discovery.
                  </p>
                </div>

                <button
                  onClick={() => setMcpOpen(false)}
                  className="text-2xl text-[#77777f] hover:text-[#111113]"
                >
                  ×
                </button>
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#44444c]">
                    Server name
                  </label>

                  <input
                    value={mcpName}
                    onChange={(event) => setMcpName(event.target.value)}
                    placeholder="Company MCP"
                    className="mt-2 w-full rounded-xl border border-[#dcdce2] px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#44444c]">
                    MCP server URL
                  </label>

                  <input
                    value={mcpUrl}
                    onChange={(event) => setMcpUrl(event.target.value)}
                    placeholder="https://mcp.example.com"
                    className="mt-2 w-full rounded-xl border border-[#dcdce2] px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#44444c]">
                      Environment
                    </label>

                    <select
                      value={mcpEnvironment}
                      onChange={(event) =>
                        setMcpEnvironment(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-[#dcdce2] bg-white px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44444c]">
                      Authentication
                    </label>

                    <select
                      value={mcpAuth}
                      onChange={(event) => setMcpAuth(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#dcdce2] bg-white px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer token</option>
                      <option value="api_key">API key / Authorization</option>
                    </select>
                  </div>
                </div>

                {mcpAuth !== "none" && (
                  <div>
                    <label className="text-xs font-semibold text-[#44444c]">
                      Authentication value
                    </label>

                    <input
                      type="password"
                      value={mcpToken}
                      onChange={(event) => setMcpToken(event.target.value)}
                      placeholder="Authentication value"
                      className="mt-2 w-full rounded-xl border border-[#dcdce2] px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                    />
                  </div>
                )}

                {mcpMessage && (
                  <div className="rounded-xl border border-[#e6e7eb] bg-[#f8f9fc] px-4 py-3 text-sm text-[#44444c]">
                    {mcpMessage}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={testMcp}
                    disabled={mcpTesting}
                    className="rounded-xl border border-[#1300BA] px-5 py-3 text-sm font-semibold text-[#1300BA] disabled:opacity-50"
                  >
                    {mcpTesting ? "Testing..." : "Test Connection"}
                  </button>

                  <button
                    onClick={saveMcp}
                    disabled={mcpSaving}
                    className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {mcpSaving ? "Saving..." : "Save MCP Server"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}