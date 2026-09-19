"use client";

import { useState } from "react";
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

export default function DiscoveryPage() {
  const supabase = createClient();

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  function toggleSource(id: string) {
    setSelectedSources((current) =>
      current.includes(id)
        ? current.filter((source) => source !== id)
        : [...current, id]
    );
  }

  async function startDiscovery() {
    if (selectedSources.length === 0) {
      setMessage("Select at least one discovery source.");
      return;
    }

    setStarting(true);
    setMessage("");

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
        .select("id, source_type")
        .eq("organization_id", organizationId);

      if (sourceError) {
        throw sourceError;
      }

      const sourceIds: string[] = [];

      for (const sourceType of selectedSources) {
        const existing = existingSources?.find(
          (source) => source.source_type === sourceType
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

      setMessage(
        `Discovery scan created successfully. ${selectedSources.length} source${
          selectedSources.length === 1 ? "" : "s"
        } queued.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting discovery."
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
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
              Find AI agents and AI systems across your organization and bring
              them under Arbyter.
            </p>
          </div>

          <button
            onClick={startDiscovery}
            disabled={starting}
            className="rounded-xl bg-[#1300BA] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Discovery"}
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
              <div className="text-xs font-medium text-[#85858d]">{label}</div>
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
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`group rounded-2xl border p-5 text-left transition ${
                    selected
                      ? "border-[#1300BA] bg-[#f7f5ff]"
                      : "border-[#e6e7eb] bg-white hover:border-[#c9c9d2]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
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
                  </div>
                </button>
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
              disabled={starting || selectedSources.length === 0}
              className="rounded-xl bg-[#111113] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {starting ? "Preparing scan..." : "Begin Discovery →"}
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
              Add an AI agent manually instead of discovering it automatically.
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
      </div>
    </main>
  );
}