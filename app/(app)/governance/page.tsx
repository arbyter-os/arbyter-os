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

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] =
    useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [policyType, setPolicyType] = useState("company")
  const [jurisdiction, setJurisdiction] = useState("")
  const [sector, setSector] = useState("")

  const [rulePolicyId, setRulePolicyId] =
    useState<string | null>(null)
  const [ruleName, setRuleName] = useState("")
  const [ruleDescription, setRuleDescription] =
    useState("")
  const [ruleType, setRuleType] =
    useState("governance")
  const [ruleEffect, setRuleEffect] =
    useState("flag")
  const [rulePriority, setRulePriority] =
    useState("100")
  const [ruleAction, setRuleAction] =
    useState("messages.send")
  const [ruleCreating, setRuleCreating] =
    useState(false)
  const [ruleError, setRuleError] =
    useState<string | null>(null)

  async function loadGovernance() {
    try {
      setLoading(true)

      const response = await fetch(
        "/api/governance/policies",
        { cache: "no-store" }
      )

      if (!response.ok) {
        throw new Error(
          "Failed to load governance policies."
        )
      }

      const data = await response.json()

      setPolicies(data.policies ?? [])
      setRules(data.rules ?? [])
    } catch (error) {
      console.error(
        "Failed to load governance:",
        error
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGovernance()
  }, [])

  async function createPolicy() {
    if (!name.trim()) {
      setCreateError("Policy name is required.")
      return
    }

    try {
      setCreating(true)
      setCreateError(null)

      const response = await fetch(
        "/api/governance/policies/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || null,
            policyType,
            jurisdiction:
              jurisdiction.trim() || null,
            sector:
              sector.trim() || null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to create governance policy."
        )
      }

      setName("")
      setDescription("")
      setPolicyType("company")
      setJurisdiction("")
      setSector("")
      setShowCreate(false)

      await loadGovernance()
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create governance policy."
      )
    } finally {
      setCreating(false)
    }
  }

  async function createRule() {
    if (!rulePolicyId) {
      setRuleError("Policy is required.")
      return
    }

    if (!ruleName.trim()) {
      setRuleError("Rule name is required.")
      return
    }

    try {
      setRuleCreating(true)
      setRuleError(null)

      const response = await fetch(
        "/api/governance/rules/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            policyId: rulePolicyId,
            name: ruleName.trim(),
            description:
              ruleDescription.trim() || null,
            ruleType,
            effect: ruleEffect,
            priority:
              Number(rulePriority) || 100,
            enabled: true,
            conditions: {
              action: ruleAction,
            },
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to create governance rule."
        )
      }

      setRuleName("")
      setRuleDescription("")
      setRuleType("governance")
      setRuleEffect("flag")
      setRulePriority("100")
      setRuleAction("messages.send")
      setRulePolicyId(null)

      await loadGovernance()
    } catch (error) {
      setRuleError(
        error instanceof Error
          ? error.message
          : "Failed to create governance rule."
      )
    } finally {
      setRuleCreating(false)
    }
  }

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
              onClick={() => {
                setCreateError(null)
                setShowCreate(true)
              }}
              className="rounded-xl bg-primary px-5 py-3 shadow-lg shadow-primary/15 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              + New Policy
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="content-surface rounded-2xl p-6">
            <p className="text-sm text-black/45">
              Policies
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : policies.length}
            </p>
          </div>

          <div className="content-surface rounded-2xl p-6">
            <p className="text-sm text-black/45">
              Active Rules
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : enabledRules}
            </p>
          </div>

          <div className="content-surface rounded-2xl p-6">
            <p className="text-sm text-black/45">
              Governance State
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {loading ? "—" : "Active"}
            </p>
          </div>
        </div>

        <section className="content-surface rounded-2xl">
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
                              Jurisdiction:{" "}
                              {policy.jurisdiction}
                            </span>
                          )}

                          {policy.sector && (
                            <span>
                              Sector: {policy.sector}
                            </span>
                          )}

                          {policy.source_type && (
                            <span>
                              Source:{" "}
                              {policy.source_type}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setRulePolicyId(policy.id)
                          setRuleError(null)
                        }}
                        className="content-surface rounded-xl px-4 py-2 text-sm font-medium hover:bg-black/[0.03]"
                      >
                        + Add Rule
                      </button>
                    </div>

                    {policyRules.length > 0 && (
                      <div className="mt-5 space-y-2">
                        {policyRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="content-surface rounded-2xl px-4 py-3"
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg modal-surface rounded-3xl p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  New Governance Policy
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  Define a policy that will govern your agents.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-xl text-black/35 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Policy name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Customer Data Protection"
                  className="w-full content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="What does this policy control?"
                  rows={3}
                  className="w-full resize-none content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Policy type
                </label>

                <select
                  value={policyType}
                  onChange={(event) =>
                    setPolicyType(event.target.value)
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="company">
                    Company
                  </option>
                  <option value="regulatory">
                    Regulatory
                  </option>
                  <option value="security">
                    Security
                  </option>
                  <option value="framework">
                    Framework
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Jurisdiction
                </label>

                <input
                  value={jurisdiction}
                  onChange={(event) =>
                    setJurisdiction(event.target.value)
                  }
                  placeholder="e.g. India, EU, California"
                  className="w-full content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sector
                </label>

                <input
                  value={sector}
                  onChange={(event) =>
                    setSector(event.target.value)
                  }
                  placeholder="e.g. Finance, Healthcare, General"
                  className="w-full content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="content-surface rounded-xl px-4 py-3 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={creating}
                  onClick={createPolicy}
                  className="rounded-xl bg-primary px-5 py-3 shadow-lg shadow-primary/15 text-sm font-medium text-white disabled:opacity-40"
                >
                  {creating
                    ? "Creating..."
                    : "Create Policy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rulePolicyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg modal-surface rounded-3xl p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Add Governance Rule
                </h2>

                <p className="mt-1 text-sm text-black/45">
                  Define how Arbyter should handle a specific agent action.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRulePolicyId(null)}
                className="text-xl text-black/35 hover:text-black"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Rule name
                </label>

                <input
                  value={ruleName}
                  onChange={(event) =>
                    setRuleName(event.target.value)
                  }
                  placeholder="e.g. Email requires approval"
                  className="w-full content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={ruleDescription}
                  onChange={(event) =>
                    setRuleDescription(event.target.value)
                  }
                  placeholder="Describe what this rule controls."
                  rows={3}
                  className="w-full resize-none content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Action
                </label>

                <select
                  value={ruleAction}
                  onChange={(event) =>
                    setRuleAction(event.target.value)
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  <option value="messages.send">
                    Send message
                  </option>
                  <option value="messages.read">
                    Read message
                  </option>
                  <option value="messages.reply">
                    Reply to message
                  </option>
                  <option value="data.access">
                    Access data
                  </option>
                  <option value="finance.transfer">
                    Financial transfer
                  </option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Effect
                  </label>

                  <select
                    value={ruleEffect}
                    onChange={(event) =>
                      setRuleEffect(event.target.value)
                    }
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="allow">
                      Allow
                    </option>
                    <option value="flag">
                      Flag
                    </option>
                    <option value="require_approval">
                      Require approval
                    </option>
                    <option value="block">
                      Block
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>

                  <input
                    type="number"
                    value={rulePriority}
                    onChange={(event) =>
                      setRulePriority(event.target.value)
                    }
                    className="w-full content-surface rounded-xl px-4 py-3 text-sm outline-none focus:border-black/30"
                  />
                </div>
              </div>

              {ruleError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ruleError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRulePolicyId(null)}
                  className="content-surface rounded-xl px-4 py-3 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={ruleCreating}
                  onClick={createRule}
                  className="rounded-xl bg-primary px-5 py-3 shadow-lg shadow-primary/15 text-sm font-medium text-white disabled:opacity-40"
                >
                  {ruleCreating
                    ? "Creating..."
                    : "Create Rule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}