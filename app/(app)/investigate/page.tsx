 'use client'

import * as React from 'react'
import {
  Search,
  Plus,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Clock3,
} from 'lucide-react'

type Investigation = {
  id: number
  title: string
  agent: string
  type: string
  severity: 'Critical' | 'High' | 'Medium'
  status: 'Open' | 'Investigating' | 'Resolved'
  updated: string
}

const investigations: Investigation[] = [
  {
    id: 1,
    title: 'Unexpected pricing decision',
    agent: 'Pricing Optimization Agent',
    type: 'Policy Violation',
    severity: 'Critical',
    status: 'Investigating',
    updated: '18 minutes ago',
  },
  {
    id: 2,
    title: 'Candidate ranking anomaly',
    agent: 'Hiring Recommendation Agent',
    type: 'Risk Event',
    severity: 'High',
    status: 'Open',
    updated: '2 hours ago',
  },
  {
    id: 3,
    title: 'Unusual document access',
    agent: 'Document Analysis Agent',
    type: 'Security Event',
    severity: 'High',
    status: 'Investigating',
    updated: '5 hours ago',
  },
  {
    id: 4,
    title: 'Human approval bypass detected',
    agent: 'Customer Support Agent',
    type: 'Control Violation',
    severity: 'Medium',
    status: 'Resolved',
    updated: 'Yesterday',
  },
  {
    id: 5,
    title: 'Forecast confidence dropped',
    agent: 'Forecasting Agent',
    type: 'Model Risk',
    severity: 'Medium',
    status: 'Open',
    updated: 'Yesterday',
  },
]

function severityClass(severity: Investigation['severity']) {
  if (severity === 'Critical') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (severity === 'High') {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }

  return 'border-yellow-200 bg-yellow-50 text-yellow-700'
}

function statusClass(status: Investigation['status']) {
  if (status === 'Investigating') {
    return 'bg-blue-50 text-blue-700'
  }

  if (status === 'Resolved') {
    return 'bg-green-50 text-green-700'
  }

  return 'bg-gray-100 text-gray-600'
}

export default function InvestigatePage() {
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [showNew, setShowNew] = React.useState(false)

  const filteredInvestigations = investigations.filter((item) => {
    const query = search.toLowerCase()

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.agent.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || item.status === status

    return matchesSearch && matchesStatus
  })

  const openCount = investigations.filter(
    (item) => item.status === 'Open'
  ).length

  const investigatingCount = investigations.filter(
    (item) => item.status === 'Investigating'
  ).length

  const criticalCount = investigations.filter(
    (item) => item.severity === 'Critical'
  ).length

  const resolvedCount = investigations.filter(
    (item) => item.status === 'Resolved'
  ).length

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            AI Investigation
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Investigate
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Investigate incidents, policy violations, unusual agent activity, and AI risk events.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Investigation
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Open
            </p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {openCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Require investigation
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Investigating
            </p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {investigatingCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Currently being reviewed
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Critical
            </p>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {criticalCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Highest priority events
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Resolved
            </p>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-3 text-2xl font-semibold">
            {resolvedCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Successfully closed
          </p>
        </div>
      </section>

      {/* Investigation table */}
      <section className="overflow-hidden glass rounded-2xl">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search investigations..."
              className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">
              Investigating
            </option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-white/55 bg-white/25 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">
                  Investigation
                </th>
                <th className="px-5 py-3">
                  AI Agent
                </th>
                <th className="px-5 py-3">
                  Event Type
                </th>
                <th className="px-5 py-3">
                  Severity
                </th>
                <th className="px-5 py-3">
                  Status
                </th>
                <th className="px-5 py-3">
                  Updated
                </th>
                <th className="px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {filteredInvestigations.map((item) => (
                <tr
                  key={item.id}
                  className="border-b last:border-0 hover:bg-white/35"
                >
                  <td className="px-5 py-4 font-medium">
                    {item.title}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {item.agent}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {item.type}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {item.updated}
                  </td>

                  <td className="px-3 py-4">
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvestigations.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No investigations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* New investigation modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg glass-strong rounded-2xl p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                New Investigation
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Start an investigation into an AI event or governance issue.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Investigation title"
                className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
              />

              <textarea
                placeholder="Describe what happened..."
                rows={4}
                className="w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                placeholder="AI agent or system"
                className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Start Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}