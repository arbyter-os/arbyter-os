'use client'

import * as React from 'react'
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Bot,
  ChevronRight,
  Plus,
} from 'lucide-react'

type GovernanceItem = {
  id: number
  name: string
  type: 'Policy' | 'Control'
  description: string
  owner: string
  status: 'Active' | 'Needs Review' | 'Draft'
  coverage: string
  linkedAgents: number
}

const governanceItems: GovernanceItem[] = [
  {
    id: 1,
    name: 'Human Oversight Policy',
    type: 'Policy',
    description:
      'Defines when human approval is required before an AI agent can make or execute a decision.',
    owner: 'AI Governance',
    status: 'Active',
    coverage: '94%',
    linkedAgents: 8,
  },
  {
    id: 2,
    name: 'Sensitive Data Handling',
    type: 'Policy',
    description:
      'Controls how AI agents access, process, retain, and transmit sensitive information.',
    owner: 'Security Team',
    status: 'Active',
    coverage: '91%',
    linkedAgents: 12,
  },
  {
    id: 3,
    name: 'AI Decision Logging',
    type: 'Control',
    description:
      'Ensures important AI decisions are recorded with sufficient context for later review.',
    owner: 'Compliance Team',
    status: 'Active',
    coverage: '88%',
    linkedAgents: 15,
  },
  {
    id: 4,
    name: 'Model Performance Monitoring',
    type: 'Control',
    description:
      'Monitors model performance and identifies potential drift or unexpected behavior.',
    owner: 'Risk Team',
    status: 'Needs Review',
    coverage: '76%',
    linkedAgents: 6,
  },
  {
    id: 5,
    name: 'External AI Usage',
    type: 'Policy',
    description:
      'Defines requirements for employees and agents using external AI services.',
    owner: 'Security Team',
    status: 'Active',
    coverage: '83%',
    linkedAgents: 10,
  },
  {
    id: 6,
    name: 'AI Incident Response',
    type: 'Control',
    description:
      'Provides a standardized process for detecting, escalating, investigating, and resolving AI incidents.',
    owner: 'Risk Team',
    status: 'Draft',
    coverage: '62%',
    linkedAgents: 4,
  },
]

function statusClass(status: GovernanceItem['status']) {
  switch (status) {
    case 'Active':
      return 'bg-green-50 text-green-700'
    case 'Needs Review':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function GovernancePage() {
  const [filter, setFilter] = React.useState<'All' | 'Policy' | 'Control'>(
    'All'
  )

  const filteredItems =
    filter === 'All'
      ? governanceItems
      : governanceItems.filter((item) => item.type === filter)

  const active = governanceItems.filter(
    (item) => item.status === 'Active'
  ).length

  const needsReview = governanceItems.filter(
    (item) => item.status === 'Needs Review'
  ).length

  const totalAgents = governanceItems.reduce(
    (sum, item) => sum + item.linkedAgents,
    0
  )

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            AI Governance
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Governance
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Define policies, enforce controls, and govern how AI agents operate across your organization.
          </p>
        </div>

        <button
          type="button"
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
              Policies & Controls
            </p>

            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {governanceItems.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Governance requirements
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Active
            </p>

            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </div>

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
            {needsReview}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Governance items requiring attention
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Agent Coverage
            </p>

            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {totalAgents}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Policy-linked agent relationships
          </p>
        </div>
      </section>

      {/* Governance flow */}
      <section className="rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">
            Governance Architecture
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            How Arbyter connects governance requirements to AI operations.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
          {[
            ['Agents', 'AI systems and autonomous workers'],
            ['Policies', 'Rules governing AI behavior'],
            ['Controls', 'Enforcement mechanisms'],
            ['Risks', 'Detected exposure and issues'],
            ['Evidence', 'Traceable governance record'],
          ].map(([title, description], index) => (
            <React.Fragment key={title}>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-sm font-semibold">
                  {title}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>

              {index < 4 && (
                <div className="hidden items-center justify-center md:flex">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap gap-2">
        {(['All', 'Policy', 'Control'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              filter === value
                ? 'bg-foreground text-background'
                : 'bg-background hover:bg-muted'
            }`}
          >
            {value === 'All' ? 'All' : `${value}s`}
          </button>
        ))}
      </section>

      {/* Governance list */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Policies & Controls
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Governance requirements currently configured in Arbyter.
          </p>
        </div>

        <div className="divide-y">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-muted/20 md:flex-row md:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                {item.type === 'Policy' ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {item.name}
                  </h3>

                  <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {item.type}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  {item.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Owner: {item.owner}
                  </span>

                  <span>
                    Coverage: {item.coverage}
                  </span>

                  <span>
                    Linked agents: {item.linkedAgents}
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
        </div>
      </section>
    </main>
  )
}