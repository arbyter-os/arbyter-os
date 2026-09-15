"use client"

import { useEffect, useState } from "react"

type Policy = {
  id: string
  name: string
  description: string | null
  policy_type: string
  status: string
  version: string
  effective_date: string | null
  review_date: string | null
  authority: string | null
  jurisdiction: string | null
  sector: string | null
  source_type: string | null
  created_at: string
}

type Rule = {
  id: string
  policy_id: string
  name: string
  description: string | null
  rule_type: string
  effect: string
  priority: number
  enabled: boolean
}

export default function GovernancePage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  async function loadGovernance() {
    try {
      setLoading(true)

      const response = await fetch(
        "/api/governance/policies",
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to load governance policies.")
      }

      const data = await response.json()

      setPolicies(data.policies ?? [])
      setRules(data.rules ?? [])
    } catch (error) {
      console.error("Failed to load governance:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGovernance()
  }, [])

  const enabledRules = rules.filter(
    (rule) => rule.enabled
  ).length

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-8 text-black md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-black/40">
            Governance
          </p>

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                Govern every agent action.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-black/55">
                Define the rules, policies, permissions and
                regulatory controls that govern how your AI
                agents operate.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              + New Policy
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Policies
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : policies.length}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Active Rules
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : enabledRules}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <p className="text-sm text-black/45">
              Governance State
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : "Active"}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-black/10 bg-white">
          <div className="border-b border-black/10 px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight">
              Policies
            </h2>

            <p className="mt-1 text-sm text-black/45">
              Company and regulatory policies controlling agent behavior.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm text-black/45">
              Loading governance policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-base font-medium">
                No governance policies yet.
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
                Create your first policy to define what agents
                can do, what requires approval, and what must
                be blocked.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {policies.map((policy) => {
                const policyRules = rules.filter(
                  (rule) =>
                    rule.policy_id === policy.id
                )

                return (
                  <div
                    key={policy.id}
                    className="px-6 py-6"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {policy.name}
                          </h3>

                          <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-black/60">
                            v{policy.version}
                          </span>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                            {policy.status}
                          </span>
                        </div>

                        {policy.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
                            {policy.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/40">
                          {policy.authority && (
                            <span>
                              Authority: {policy.authority}
                            </span>
                          )}

                          {policy.jurisdiction && (
                            <span>
                              Jurisdiction: {policy.jurisdiction}
                            </span>
                          )}

                          {policy.sector && (
                            <span>
                              Sector: {policy.sector}
                            </span>
                          )}

                          {policy.source_type && (
                            <span>
                              Source: {policy.source_type}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs text-black/40">
                        {policyRules.length}{" "}
                        {policyRules.length === 1
                          ? "rule"
                          : "rules"}
                      </span>
                    </div>

                    {policyRules.length > 0 && (
                      <div className="mt-5 space-y-2">
                        {policyRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <div>
                                <p className="text-sm font-medium">
                                  {rule.name}
                                </p>

                                {rule.description && (
                                  <p className="mt-1 text-xs leading-5 text-black/45">
                                    {rule.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] text-black/55">
                                  {rule.rule_type}
                                </span>

                                <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium">
                                  {rule.effect}
                                </span>

                                <span
                                  className={
                                    rule.enabled
                                      ? "text-xs text-emerald-600"
                                      : "text-xs text-black/30"
                                  }
                                >
                                  {rule.enabled
                                    ? "Enabled"
                                    : "Disabled"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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