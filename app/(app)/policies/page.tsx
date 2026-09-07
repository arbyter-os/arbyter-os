'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  ShieldCheck,
  Bot,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

type Policy = {
  id: number
  name: string
  description: string
  category: string
  owner: string
  status: 'Active' | 'Draft' | 'Needs Review'
  enforcement: 'Automatic' | 'Manual'
  agents: number
  updated: string
}

const initialPolicies: Policy[] = [
  {
    id: 1,
    name: 'Human Approval for High-Impact Decisions',
    description:
      'Requires human approval before an AI agent executes decisions that may materially affect a person.',
    category: 'Human Oversight',
    owner: 'AI Governance',
    status: 'Active',
    enforcement: 'Automatic',
    agents: 9,
    updated: 'Today',
  },
  {
    id: 2,
    name: 'Sensitive Data Access',
    description:
      'Restricts AI agents from accessing or transmitting sensitive information without authorization.',
    category: 'Data Privacy',
    owner: 'Security Team',
    status: 'Active',
    enforcement: 'Automatic',
    agents: 14,
    updated: 'Yesterday',
  },
  {
    id: 3,
    name: 'Pricing Decision Limits',
    description:
      'Prevents pricing agents from making adjustments outside approved thresholds.',
    category: 'Financial Risk',
    owner: 'Revenue Team',
    status: 'Needs Review',
    enforcement: 'Automatic',
    agents: 3,
    updated: '2 days ago',
  },
  {
    id: 4,
    name: 'AI Decision Logging',
    description:
      'Requires material AI decisions and relevant reasoning context to be recorded for auditability.',
    category: 'Auditability',
    owner: 'Compliance Team',
    status: 'Active',
    enforcement: 'Automatic',
    agents: 18,
    updated: '3 days ago',
  },
  {
    id: 5,
    name: 'External AI Usage',
    description:
      'Defines requirements for using third-party AI services and external models.',
    category: 'Security',
    owner: 'Security Team',
    status: 'Active',
    enforcement: 'Manual',
    agents: 7,
    updated: '5 days ago',
  },
  {
    id: 6,
    name: 'Model Change Approval',
    description:
      'Requires review and approval before production AI models or critical configurations are changed.',
    category: 'Model Governance',
    owner: 'Risk Team',
    status: 'Draft',
    enforcement: 'Manual',
    agents: 5,
    updated: 'Sep 4, 2026',
  },
]

function statusClass(status: Policy['status']) {
  switch (status) {
    case 'Active':
      return 'bg-green-50 text-green-700'
    case 'Needs Review':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function PoliciesPage() {
  const [policies] = React.useState<Policy[]>(initialPolicies)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [category, setCategory] = React.useState('All')
  const [showNewPolicy, setShowNewPolicy] = React.useState(false)

  const categories = Array.from(
    new Set(policies.map((policy) => policy.category))
  )

  const filteredPolicies = policies.filter((policy) => {
    const query = search.toLowerCase()

    const matchesSearch =
      policy.name.toLowerCase().includes(query) ||
      policy.description.toLowerCase().includes(query) ||
      policy.owner.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || policy.status === status

    const matchesCategory =
      category === 'All' || policy.category === category

    return matchesSearch && matchesStatus && matchesCategory
  })

  const active = policies.filter(
    (policy) => policy.status === 'Active'
  ).length

  const review = policies.filter(
    (policy) => policy.status === 'Needs Review'
  ).length

  const automatic = policies.filter(
    (policy) => policy.enforcement === 'Automatic'
  ).length

  const coveredAgents = new Set(
    policies.flatMap((policy) =>
      Array.from({ length: policy.agents }, (_, index) => index)
    )
  ).size

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Governance Rules
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Policies
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Define the rules that determine how AI agents can operate, make decisions, and access resources.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewPolicy(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Policy
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Policies
            </p>

            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {policies.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Governance rules configured
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Active
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {active}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Currently enforced
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Needs Review
            </p>

            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {review}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Policies requiring attention
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Auto-Enforced
            </p>

            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {automatic}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Enforced automatically
          </p>
        </div>
      </section>

      {/* Policy enforcement */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">
              Policy Enforcement
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Arbyter turns governance rules into enforceable controls across AI agents.
            </p>
          </div>

          <div className="rounded-lg border bg-background px-3 py-2 text-sm">
            <span className="font-medium">
              {automatic}
            </span>{' '}
            of {policies.length} policies auto-enforced
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{
              width: `${(automatic / policies.length) * 100}%`,
            }}
          />
        </div>
      </section>

      {/* Filters */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search policies..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Policy list */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Policy Registry
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Central registry of rules governing your AI environment.
          </p>
        </div>

        <div className="divide-y">
          {filteredPolicies.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-muted/20 lg:flex-row lg:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {policy.name}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      policy.status
                    )}`}
                  >
                    {policy.status}
                  </span>

                  <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {policy.enforcement}
                  </span>
                </div>

                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  {policy.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Category: {policy.category}
                  </span>

                  <span>
                    Owner: {policy.owner}
                  </span>

                  <span>
                    Linked agents: {policy.agents}
                  </span>

                  <span>
                    Updated: {policy.updated}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}

          {filteredPolicies.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No policies match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Create policy modal */}
      {showNewPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Create Policy
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Define a governance rule for your AI environment.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Policy name"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <textarea
                placeholder="Describe what this policy requires or prohibits..."
                rows={4}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option>Human Oversight</option>
                <option>Data Privacy</option>
                <option>Security</option>
                <option>Auditability</option>
                <option>Financial Risk</option>
                <option>Model Governance</option>
              </select>

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option>Automatic enforcement</option>
                <option>Manual enforcement</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewPolicy(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNewPolicy(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Create Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}