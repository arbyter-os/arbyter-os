'use client'

import * as React from 'react'
import {
  Search,
  Download,
  ShieldCheck,
  AlertTriangle,
  User,
  Bot,
} from 'lucide-react'

type AuditEvent = {
  id: number
  action: string
  actor: string
  actorType: 'AI Agent' | 'User' | 'System'
  resource: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  timestamp: string
  details: string
}

const events: AuditEvent[] = [
  {
    id: 1,
    action: 'Policy violation detected',
    actor: 'Pricing Optimization Agent',
    actorType: 'AI Agent',
    resource: 'Pricing Policy',
    severity: 'Critical',
    timestamp: 'Today, 10:42 AM',
    details: 'Agent attempted a pricing adjustment outside approved limits.',
  },
  {
    id: 2,
    action: 'Risk reviewed',
    actor: 'Risk Team',
    actorType: 'User',
    resource: 'Bias in candidate ranking',
    severity: 'High',
    timestamp: 'Today, 9:18 AM',
    details: 'Risk assessment reviewed and assigned for remediation.',
  },
  {
    id: 3,
    action: 'Evidence collected',
    actor: 'Arbyter System',
    actorType: 'System',
    resource: 'EU AI Act Controls',
    severity: 'Low',
    timestamp: 'Today, 8:52 AM',
    details: 'Control evidence automatically collected from connected systems.',
  },
  {
    id: 4,
    action: 'Investigation opened',
    actor: 'AI Governance',
    actorType: 'User',
    resource: 'Human approval bypass',
    severity: 'High',
    timestamp: 'Yesterday, 4:35 PM',
    details: 'Investigation created after a control violation was detected.',
  },
  {
    id: 5,
    action: 'Agent activity recorded',
    actor: 'Document Analysis Agent',
    actorType: 'AI Agent',
    resource: 'Document Processing',
    severity: 'Medium',
    timestamp: 'Yesterday, 2:14 PM',
    details: 'Agent processed a new document and generated an analysis.',
  },
  {
    id: 6,
    action: 'Control updated',
    actor: 'Compliance Team',
    actorType: 'User',
    resource: 'Human Oversight Control',
    severity: 'Medium',
    timestamp: 'Sep 5, 2026',
    details: 'Control requirements and assigned owner were updated.',
  },
]

function severityClass(severity: AuditEvent['severity']) {
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

function actorIcon(actorType: AuditEvent['actorType']) {
  if (actorType === 'AI Agent') {
    return <Bot className="h-4 w-4" />
  }

  if (actorType === 'User') {
    return <User className="h-4 w-4" />
  }

  return <ShieldCheck className="h-4 w-4" />
}

export default function AuditPage() {
  const [search, setSearch] = React.useState('')
  const [severity, setSeverity] = React.useState('All')
  const [expanded, setExpanded] = React.useState<number | null>(null)

  const filteredEvents = events.filter((event) => {
    const query = search.toLowerCase()

    const matchesSearch =
      event.action.toLowerCase().includes(query) ||
      event.actor.toLowerCase().includes(query) ||
      event.resource.toLowerCase().includes(query)

    const matchesSeverity =
      severity === 'All' || event.severity === severity

    return matchesSearch && matchesSeverity
  })

  const critical = events.filter(
    (event) => event.severity === 'Critical'
  ).length

  const high = events.filter(
    (event) => event.severity === 'High'
  ).length

  const agents = events.filter(
    (event) => event.actorType === 'AI Agent'
  ).length

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Governance Evidence
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Audit
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Maintain a complete record of AI activity, governance actions, and compliance evidence.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-4 text-sm font-medium transition hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Export Audit
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">
            Total Events
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {events.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Recorded governance activity
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Critical
            </p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {critical}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Require immediate attention
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">
            High Priority
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {high}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Significant governance events
          </p>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">
            Agent Events
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {agents}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Actions recorded from AI agents
          </p>
        </div>
      </section>

      {/* Audit log */}
      <section className="overflow-hidden glass rounded-2xl">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search audit events..."
              className="h-10 w-full rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-10 rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm px-3 text-sm outline-none"
          >
            <option value="All">All severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="divide-y">
          {filteredEvents.map((event) => (
            <div key={event.id}>
              <button
                type="button"
                onClick={() =>
                  setExpanded(
                    expanded === event.id ? null : event.id
                  )
                }
                className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/35 md:flex-row md:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm">
                  {actorIcon(event.actorType)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {event.action}
                    </p>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${severityClass(
                        event.severity
                      )}`}
                    >
                      {event.severity}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.actor} · {event.resource}
                  </p>
                </div>

                <div className="shrink-0 text-left md:text-right">
                  <p className="text-sm text-muted-foreground">
                    {event.timestamp}
                  </p>
                </div>
              </button>

              {expanded === event.id && (
                <div className="border-t border-white/55 bg-white/25 px-5 py-4 pl-20">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Event Details
                  </p>

                  <p className="mt-2 text-sm">
                    {event.details}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No audit events match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Audit integrity */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/65 bg-white/40 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div>
            <h2 className="font-semibold">
              Audit Integrity
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Arbyter continuously records governance events to create a traceable evidence layer for your AI environment.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}