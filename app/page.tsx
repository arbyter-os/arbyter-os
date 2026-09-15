"use client"

import { useEffect, useState } from "react"

type Risk = {
  id: string
  title: string
  description: string | null
  severity: string
  status: string
  category: string | null
  agent_id: string | null
  created_at: string
}

type Agent = {
  id: string
  name: string
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  async function loadRisks() {
    try {
      setLoading(true)

      const response = await fetch("/api/risks", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to load risks.")
      }

      const data = await response.json()

      setRisks(data.risks ?? [])
      setAgents(data.agents ?? [])
    } catch (error) {
      console.error("Failed to load risks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRisks()
  }, [])

  function getAgentName(agentId: string | null) {
    if (!agentId) return "System"

    return (
      agents.find((agent) => agent.id === agentId)?.name ??
      "Unknown agent"
    )
  }

  const critical = risks.filter(
    (risk) => risk.severity.toLowerCase() === "critical"
  ).length

  const high = risks.filter(
    (risk) => risk.severity.toLowerCase() === "high"
  ).length

  const open = risks.filter(
    (risk) =>
      !["resolved", "closed"].includes(
        risk.status.toLowerCase()
      )
  ).length

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-8 text-black md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-black/40">
            Risk
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                Know what can go wrong.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-black/55">
                Monitor risks across your AI agents, understand
                their impact, and take action before they become
                incidents.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Open Risks
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : open}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Critical
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : critical}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              High
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : high}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Agents Monitored
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : agents.length}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Active Risks
            </h2>

            <p className="mt-1 text-sm text-black/45">
              Risks detected across your governed AI environment.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm text-black/45">
              Loading risks...
            </div>
          ) : risks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-base font-medium">
                No risks detected.
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
                Arbyter will surface agent risks here as they
                are detected by governance, monitoring and
                execution controls.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {risks.map((risk) => {
                const severity =
                  risk.severity.toLowerCase()

                const severityClass =
                  severity === "critical"
                    ? "bg-red-50 text-red-700"
                    : severity === "high"
                      ? "bg-orange-50 text-orange-700"
                      : severity === "medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-black/[0.05] text-black/55"

                return (
                  <div
                    key={risk.id}
                    className="px-6 py-6"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {risk.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${severityClass}`}
                          >
                            {risk.severity}
                          </span>

                          <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] text-black/55">
                            {risk.status}
                          </span>
                        </div>

                        {risk.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
                            {risk.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/40">
                          <span>
                            Agent:{" "}
                            {getAgentName(risk.agent_id)}
                          </span>

                          {risk.category && (
                            <span>
                              Category: {risk.category}
                            </span>
                          )}

                          <span>
                            Detected:{" "}
                            {new Date(
                              risk.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/[0.03]"
                      >
                        Investigate →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}