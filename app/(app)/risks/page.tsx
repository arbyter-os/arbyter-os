'use client'

import * as React from 'react'
import { Search, Plus, ChevronRight } from 'lucide-react'

type Risk = {
  id: number
  name: string
  system: string
  category: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  owner: string
  status: 'Open' | 'Investigating' | 'Mitigated'
  reviewed: string
}

const initialRisks: Risk[] = [
  {
    id: 1,
    name: 'Bias in candidate ranking',
    system: 'Hiring Recommendation Agent',
    category: 'Fairness',
    severity: 'High',
    owner: 'Risk Team',
    status: 'Open',
    reviewed: '2 days ago',
  },
  {
    id: 2,
    name: 'Unauthorized pricing adjustment',
    system: 'Pricing Optimization Agent',
    category: 'Governance',
    severity: 'Critical',
    owner: 'Compliance Team',
    status: 'Investigating',
    reviewed: 'Today',
  },
  {
    id: 3,
    name: 'Insufficient human oversight',
    system: 'Customer Support Agent',
    category: 'Human Oversight',
    severity: 'High',
    owner: 'AI Governance',
    status: 'Open',
    reviewed: '5 days ago',
  },
  {
    id: 4,
    name: 'Sensitive data exposure',
    system: 'Document Analysis Agent',
    category: 'Data Privacy',
    severity: 'Critical',
    owner: 'Security Team',
    status: 'Mitigated',
    reviewed: '1 day ago',
  },
  {
    id: 5,
    name: 'Model performance drift',
    system: 'Forecasting Agent',
    category: 'Model Risk',
    severity: 'Medium',
    owner: 'Risk Team',
    status: 'Open',
    reviewed: '7 days ago',
  },
]

function severityClass(severity: Risk['severity']) {
  if (severity === 'Critical') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (severity === 'High') {
    return 'border-orange-200 bg-orange-50 text-orange-700'
  }

  if (severity === 'Medium') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-600'
}

function statusClass(status: Risk['status']) {
  if (status === 'Investigating') {
    return 'bg-blue-50 text-blue-700'
  }

  if (status === 'Mitigated') {
    return 'bg-green-50 text-green-700'
  }

  return 'bg-gray-100 text-gray-600'
}

export default function RisksPage() {
  const [risks, setRisks] = React.useState<Risk[]>(initialRisks)
  const [search, setSearch] = React.useState('')
  const [severity, setSeverity] = React.useState('All')
  const [showNewRisk, setShowNewRisk] = React.useState(false)

  const filteredRisks = risks.filter((risk) => {
    const query = search.toLowerCase()

    const matchesSearch =
      risk.name.toLowerCase().includes(query) ||
      risk.system.toLowerCase().includes(query)

    const matchesSeverity =
      severity === 'All' || risk.severity === severity

    return matchesSearch && matchesSeverity
  })

  const counts = {
    total: risks.length,
    critical: risks.filter((risk) => risk.severity === 'Critical').length,
    high: risks.filter((risk) => risk.severity === 'High').length,
    medium: risks.filter((risk) => risk.severity === 'Medium').length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Risk Management
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            AI Risks
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Identify, assess, and manage risks across your AI environment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewRisk(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New Risk
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Total Risks', counts.total],
          ['Critical', counts.critical],
          ['High', counts.high],
          ['Medium', counts.medium],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search risks..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
          >
            <option value="All">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">AI System</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Reviewed</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {filteredRisks.map((risk) => (
                <tr
                  key={risk.id}
                  className="border-b last:border-0 transition hover:bg-muted/20"
                >
                  <td className="px-5 py-4 font-medium">
                    {risk.name}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {risk.system}
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {risk.category}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                        risk.severity
                      )}`}
                    >
                      {risk.severity}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {risk.owner}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                        risk.status
                      )}`}
                    >
                      {risk.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {risk.reviewed}
                  </td>

                  <td className="px-3 py-4">
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRisks.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No risks match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                New Risk
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add a risk to the AI governance environment.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Risk name"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <textarea
                placeholder="Description"
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                placeholder="AI system"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewRisk(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNewRisk(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Create Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}</div>