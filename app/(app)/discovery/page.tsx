“use client”;

import { useState } from “react”;
import { createClient } from “@/lib/supabase/client”;

const sources = [
{
id: “mcp”,
name: “MCP”,
description: “Discover agents connected through MCP servers.”,
},
{
id: “api_gateway”,
name: “APIs & API Gateways”,
description: “Find agents and AI services exposed through APIs.”,
},
{
id: “aws”,
name: “AWS”,
description: “Discover AI workloads and agents across AWS.”,
},
{
id: “azure”,
name: “Azure”,
description: “Discover AI workloads and agents across Azure.”,
},
{
id: “gcp”,
name: “Google Cloud”,
description: “Discover AI workloads and agents across GCP.”,
},
{
id: “internal_server”,
name: “Internal Servers”,
description: “Discover agents running inside your infrastructure.”,
},
{
id: “ai_platform”,
name: “AI Platforms”,
description: “Discover agents deployed through AI platforms.”,
},
{
id: “application”,
name: “Applications”,
description: “Look for AI-powered applications across your company.”,
},
];

export default function DiscoveryPage() {
const supabase = createClient();

const [selectedSources, setSelectedSources] = useState<string[]>([]);
const [starting, setStarting] = useState(false);
const [message, setMessage] = useState(””);

const [showMcpSetup, setShowMcpSetup] = useState(false);
const [mcpName, setMcpName] = useState(””);
const [mcpUrl, setMcpUrl] = useState(””);
const [mcpAuthType, setMcpAuthType] = useState(“none”);
const [mcpToken, setMcpToken] = useState(””);
const [mcpEnvironment, setMcpEnvironment] = useState(“production”);
const [savingMcp, setSavingMcp] = useState(false);
const [testingMcp, setTestingMcp] = useState(false);
const [mcpStatus, setMcpStatus] = useState(””);

function toggleSource(id: string) {
setSelectedSources((current) =>
current.includes(id)
? current.filter((source) => source !== id)
: […current, id]
);
}

async function configureMcp() {
setMcpStatus(””);

if (!mcpName.trim()) {
  setMcpStatus("Enter a name for this MCP server.");
  return;
}
if (!mcpUrl.trim()) {
  setMcpStatus("Enter the MCP server URL.");
  return;
}
try {
  new URL(mcpUrl.trim());
} catch {
  setMcpStatus("Enter a valid MCP server URL.");
  return;
}
if (
  mcpAuthType !== "none" &&
  !mcpToken.trim()
) {
  setMcpStatus("Enter the authentication token.");
  return;
}
setSavingMcp(true);
try {
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
  const configuration: Record<string, string> = {
    authentication_method: mcpAuthType,
  };
  if (mcpToken.trim()) {
    configuration.authorization = mcpToken.trim();
  }
  const { data: existing } = await supabase
    .from("discovery_sources")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("source_type", "mcp")
    .eq("endpoint_url", mcpUrl.trim())
    .maybeSingle();
  if (existing) {
    const { error: updateError } = await supabase
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
    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from("discovery_sources")
      .insert({
        organization_id: profile.organization_id,
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
    if (insertError) {
      throw insertError;
    }
  }
  setSelectedSources((current) =>
    current.includes("mcp")
      ? current
      : [...current, "mcp"]
  );
  setMcpStatus("MCP server saved successfully.");
  setShowMcpSetup(false);
} catch (error) {
  console.error("MCP save error:", error);
  setMcpStatus(
    error instanceof Error
      ? error.message
      : "Could not save MCP server."
  );
} finally {
  setSavingMcp(false);
}

}

async function testMcpConnection() {
setMcpStatus(””);

if (!mcpUrl.trim()) {
  setMcpStatus("Enter the MCP server URL first.");
  return;
}
try {
  new URL(mcpUrl.trim());
} catch {
  setMcpStatus("Enter a valid MCP server URL.");
  return;
}
setTestingMcp(true);
setMcpStatus("Testing MCP connection...");
try {
  const response = await fetch("/api/discovery/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serverUrl: mcpUrl.trim(),
      authorization:
        mcpAuthType !== "none"
          ? mcpToken.trim()
          : "",
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(
      result?.error ?? "MCP connection failed."
    );
  }
  setMcpStatus(
    `Connected. ${
      result.tools?.length ?? 0
    } tools, ${
      result.resources?.length ?? 0
    } resources, and ${
      result.prompts?.length ?? 0
    } prompts discovered.`
  );
} catch (error) {
  console.error("MCP test error:", error);
  setMcpStatus(
    error instanceof Error
      ? error.message
      : "MCP connection failed."
  );
} finally {
  setTestingMcp(false);
}

}

async function startDiscovery() {
if (selectedSources.length === 0) {
setMessage(“Select at least one discovery source.”);
return;
}

setStarting(true);
setMessage("Preparing discovery scan...");
try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("You must be signed in to start discovery.");
  }
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.organization_id) {
    throw new Error("Could not find your organization.");
  }
  const organizationId = profile.organization_id;
  const { data: existingSources, error: sourceError } = await supabase
    .from("discovery_sources")
    .select("id, source_type, endpoint_url")
    .eq("organization_id", organizationId);
  if (sourceError) {
    throw sourceError;
  }
  const sourceIds: string[] = [];
  for (const sourceType of selectedSources) {
    const existing =
      sourceType === "mcp"
        ? existingSources?.find(
            (source) =>
              source.source_type === "mcp" &&
              Boolean(source.endpoint_url)
          )
        : existingSources?.find(
            (source) => source.source_type === sourceType
          );
    if (existing) {
      sourceIds.push(existing.id);
      continue;
    }
    const source = sources.find(
      (item) => item.id === sourceType
    );
    const { data: created, error: createError } =
      await supabase
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
      result?.error ??
        "The discovery engine failed to start."
    );
  }
  setMessage(
    `Discovery complete. ${
      result.totalFindings ?? 0
    } finding${
      result.totalFindings === 1 ? "" : "s"
    } discovered.`
  );
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

return (
    {/* Header */}
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1300BA]">
          Workforce Discovery
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#111113] md:text-5xl">
          Discover your AI workforce.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#6b6b73]">
          Find AI agents and AI systems across your organization and
          bring them under Arbyter.
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
    {/* Stats */}
    <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
      {[
        ["Last scan", "Never"],
        ["Discovered", "0"],
        ["Onboarded", "0"],
        ["Needs review", "0"],
        ["Unknown", "0"],
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
    {/* Discovery sources */}
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
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => toggleSource(source.id)}
                  className="flex-1 text-left"
                >
                  <h3 className="font-semibold text-[#111113]">
                    {source.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#77777f]">
                    {source.description}
                  </p>
                </button>
                <button
                  onClick={() => toggleSource(source.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    selected
                      ? "border-[#1300BA] bg-[#1300BA] text-white"
                      : "border-[#d4d4da] text-transparent"
                  }`}
                >
                  ✓
                </button>
              </div>
              {source.id === "mcp" && (
                <div className="mt-5 flex items-center justify-between border-t border-[#e8e8ed] pt-4">
                  <span className="text-xs text-[#77777f]">
                    {selected
                      ? "MCP source selected"
                      : "No MCP server connected"}
                  </span>
                  <button
                    onClick={() => setShowMcpSetup(true)}
                    className="rounded-lg border border-[#d7d7de] bg-white px-3 py-2 text-xs font-semibold text-[#111113] hover:bg-[#f8f9fc]"
                  >
                    Configure MCP
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Selection */}
      <div className="mt-7 flex flex-col gap-4 border-t border-[#ededf0] pt-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#66666e]">
          <span className="font-semibold text-[#111113]">
            {selectedSources.length}
          </span>{" "}
          source{selectedSources.length === 1 ? "" : "s"} selected
        </div>
        <button
          onClick={startDiscovery}
          disabled={
            starting ||
            selectedSources.length === 0
          }
          className="rounded-xl bg-[#111113] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {starting
            ? "Running Discovery..."
            : "Begin Discovery →"}
        </button>
      </div>
      {message && (
        <div className="mt-5 rounded-xl border border-[#e6e7eb] bg-[#f8f9fc] px-4 py-3 text-sm text-[#44444c]">
          {message}
        </div>
      )}
    </section>
    {/* Manual agent */}
    <section className="mt-6 flex flex-col gap-5 rounded-3xl border border-[#e6e7eb] bg-white p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div>
        <h2 className="text-lg font-semibold text-[#111113]">
          Already know about an agent?
        </h2>
        <p className="mt-1 text-sm text-[#77777f]">
          Add an AI agent manually instead of discovering it
          automatically.
        </p>
      </div>
      <button
        className="rounded-xl border border-[#dcdce2] px-5 py-3 text-sm font-semibold text-[#111113] transition hover:bg-[#f8f9fc]"
        onClick={() => {
          window.location.href = "/agents/new";
        }}
      >
        ＋ Add Agent Manually
      </button>
    </section>
    {/* MCP setup modal */}
    {showMcpSetup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1300BA]">
                MCP Connection
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-[#111113]">
                Connect an MCP server
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#77777f]">
                Give Arbyter a read-only connection so it can
                inspect the MCP server and discover available
                capabilities.
              </p>
            </div>
            <button
              onClick={() => setShowMcpSetup(false)}
              className="text-xl text-[#77777f] hover:text-[#111113]"
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
                onChange={(event) =>
                  setMcpName(event.target.value)
                }
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
                onChange={(event) =>
                  setMcpUrl(event.target.value)
                }
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
                  <option value="production">
                    Production
                  </option>
                  <option value="staging">
                    Staging
                  </option>
                  <option value="development">
                    Development
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#44444c]">
                  Authentication
                </label>
                <select
                  value={mcpAuthType}
                  onChange={(event) =>
                    setMcpAuthType(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#dcdce2] bg-white px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                >
                  <option value="none">
                    None
                  </option>
                  <option value="bearer">
                    Bearer token
                  </option>
                  <option value="api_key">
                    API key / Authorization
                  </option>
                </select>
              </div>
            </div>
            {mcpAuthType !== "none" && (
              <div>
                <label className="text-xs font-semibold text-[#44444c]">
                  Authentication value
                </label>
                <input
                  type="password"
                  value={mcpToken}
                  onChange={(event) =>
                    setMcpToken(event.target.value)
                  }
                  placeholder="Bearer token or authorization value"
                  className="mt-2 w-full rounded-xl border border-[#dcdce2] px-4 py-3 text-sm outline-none focus:border-[#1300BA]"
                />
                <p className="mt-2 text-xs leading-5 text-[#888890]">
                  This is sent only to the MCP connection
                  during discovery.
                </p>
              </div>
            )}
            {mcpStatus && (
              <div className="rounded-xl border border-[#e6e7eb] bg-[#f8f9fc] px-4 py-3 text-sm text-[#44444c]">
                {mcpStatus}
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                onClick={() =>
                  setShowMcpSetup(false)
                }
                className="rounded-xl border border-[#dcdce2] px-5 py-3 text-sm font-semibold text-[#111113] hover:bg-[#f8f9fc]"
              >
                Cancel
              </button>
              <button
                onClick={testMcpConnection}
                disabled={testingMcp}
                className="rounded-xl border border-[#1300BA] px-5 py-3 text-sm font-semibold text-[#1300BA] disabled:opacity-50"
              >
                {testingMcp
                  ? "Testing..."
                  : "Test Connection"}
              </button>
              <button
                onClick={configureMcp}
                disabled={savingMcp}
                className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingMcp
                  ? "Saving..."
                  : "Save MCP Server"}
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