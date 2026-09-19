'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ChevronRight,
} from 'lucide-react'

type Control = {
  id: number
  name: string
  description: string
  category: string
  framework: string
  owner: string
  status: 'Effective' | 'Needs Attention' | 'Not Implemented'
  coverage: number
  evidence: number
  updated: string
}

const initialControls: Control[] = [
  {
    id: 1,
    name: 'Human Approval Gate',
    description:
      'Requires human authorization before high-impact AI decisions are executed.',
    category: 'Human Oversight',
    framework: 'EU AI Act',
    owner: 'AI Governance',
    status: 'Effective',
    coverage: 96,
    evidence: 12,
    updated: 'Today',
  },
  {
    id: 2,
    name: 'AI Decision Logging',
    description:
      'Records material AI decisions, actors, timestamps, and relevant context.',
    category: 'Auditability',
    framework: 'NIST AI RMF',
    owner: 'Compliance Team',
    status: 'Effective',
    coverage: 92,
    evidence: 18,
    updated: 'Today',
  },
  {
    id: 3,
    name: 'Sensitive Data Access Control',
    description:
      'Limits AI access to sensitive data based on authorization and purpose.',
    category: 'Data Privacy',
    framework: 'ISO/IEC 42001',
    owner: 'Security Team',
    status: 'Needs Attention',
    coverage: 74,
    evidence: 8,
    updated: 'Yesterday',
  },
  {
    id: 4,
    name: 'Model Performance Monitoring',
    description:
      'Monitors production models for performance degradation and unexpected drift.',
    category: 'Model Risk',
    framework: 'NIST AI RMF',
    owner: 'Risk Team',
    status: 'Needs Attention',
    coverage: 68,
    evidence: 6,
    updated: '2 days ago',
  },
  {
    id: 5,
    name: 'Agent Permission Review',
    description:
      'Periodically reviews tools, data sources, and permissions available to AI agents.',
    category: 'Security',
    framework: 'ISO/IEC 42001',
    owner: 'Security Team',
    status: 'Effective',
    coverage: 89,
    evidence: 14,
    updated: '3 days ago',
  },
  {
    id: 6,
    name: 'AI Incident Response',
    description:
      'Defines escalation and response procedures for AI-related incidents.',
    category: 'Incident Management',
    framework: 'EU AI Act',
    owner: 'Risk Team',
    status: 'Not Implemented',
    coverage: 35,
    evidence: 2,
    updated: 'Sep 4, 2026',
  },
]

function statusClass(status: Control['status']) {
  switch (status) {
    case 'Effective':
      return 'bg-green-50 text-green-700'
    case 'Needs Attention':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-red-50 text-red-700'
  }
}

function coverageClass(coverage: number) {
  if (coverage >= 85) return 'text-green-700'
  if (coverage >= 60) return 'text-yellow-700'
  return 'text-red-700'
}

export default function ControlsPage() {
  const [controls] = React.useState<Control[]>(initialControls)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [framework, setFramework] = React.useState('All')
  const [showNewControl, setShowNewControl] = React.useState(false)

  const filteredControls = controls.filter((control) => {
    const query = search.toLowerCase()

    const matchesSearch =
      control.name.toLowerCase().includes(query) ||
      control.description.toLowerCase().includes(query) ||
      control.category.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || control.status === status

    const matchesFramework =
      framework === 'All' || control.framework === framework

    return matchesSearch && matchesStatus && matchesFramework
  })

  const effective = controls.filter(
    (control) => control.status === 'Effective'
  ).length

  const attention = controls.filter(
    (control) => control.status === 'Needs Attention'
  ).length

  const notImplemented = controls.filter(
    (control) => control.status === 'Not Implemented'
  ).length

  const averageCoverage = Math.round(
    controls.reduce((sum, control) => sum + control.coverage, 0) /
      controls.length
  )

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Governance Enforcement
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Controls
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor the safeguards that enforce your AI policies and demonstrate compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewControl(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Control
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="content-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Controls
            </p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {controls.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Configured safeguards
          </p>
        </div>

        <div className="content-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Effective
            </p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {effective}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Operating as expected
          </p>
        </div>

        <div className="content-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Needs Attention
            </p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {attention}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Requiring remediation
          </p>
        </div>

        <div className="content-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Avg. Coverage
            </p>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {averageCoverage}%
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Across all controls
          </p>
        </div>
      </section>

      {/* Coverage */}
      <section className="content-surface rounded-2xl p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Control Coverage
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Overall effectiveness of configured governance safeguards.
            </p>
          </div>

          <p className={`text-lg font-semibold ${coverageClass(averageCoverage)}`}>
            {averageCoverage}%
          </p>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{ width: `${averageCoverage}%` }}
          />
        </div>
      </section>

      {/* Filters */}
      <section className="overflow-hidden content-surface rounded-2xl">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search controls..."
              className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Effective">Effective</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Not Implemented">Not Implemented</option>
            </select>

            <select
              value={framework}
              onChange={(event) => setFramework(event.target.value)}
              className="h-10 rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
            >
              <option value="All">All frameworks</option>
              <option value="EU AI Act">EU AI Act</option>
              <option value="NIST AI RMF">NIST AI RMF</option>
              <option value="ISO/IEC 42001">ISO/IEC 42001</option>
            </select>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="overflow-hidden content-surface rounded-2xl">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Control Registry
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Safeguards mapped to policies, frameworks, and evidence.
          </p>
        </div>

        <div className="divide-y">
          {filteredControls.map((control) => (
            <div
              key={control.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-white/35 xl:flex-row xl:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {control.name}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      control.status
                    )}`}
                  >
                    {control.status}
                  </span>
                </div>

                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  {control.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Category: {control.category}
                  </span>

                  <span>
                    Framework: {control.framework}
                  </span>

                  <span>
                    Owner: {control.owner}
                  </span>

                  <span>
                    Evidence: {control.evidence}
                  </span>

                  <span>
                    Updated: {control.updated}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 xl:w-36 xl:justify-end">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Coverage
                  </p>

                  <p
                    className={`mt-1 text-sm font-semibold ${coverageClass(
                      control.coverage
                    )}`}
                  >
                    {control.coverage}%
                  </p>
                </div>

                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredControls.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No controls match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Add control modal */}
      {showNewControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg modal-surface rounded-2xl p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Add Control
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a safeguard that can enforce an AI governance policy.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Control name"
                className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
              />

              <textarea
                placeholder="Describe what this control enforces..."
                rows={4}
                className="w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 py-2 text-sm outline-none"
              />

              <select className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none">
                <option>Human Oversight</option>
                <option>Data Privacy</option>
                <option>Security</option>
                <option>Auditability</option>
                <option>Model Risk</option>
                <option>Incident Management</option>
              </select>

              <select className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none">
                <option>EU AI Act</option>
                <option>NIST AI RMF</option>
                <option>ISO/IEC 42001</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewControl(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNewControl(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Add Control
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}