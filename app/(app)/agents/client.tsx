'use client'

import * as React from 'react'
import {
  Bot,
  Plus,
  Search,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

type Agent = {
  id: string
  name: string
  purpose: string
  team: string
  status: 'Active' | 'Paused' | 'Needs Review'
  risk: 'Low' | 'Medium' | 'High' | 'Critical'
  tasks: number
  lastActivity: string
}

type AgentsClientProps = {
  initialAgents: Agent[]
}

function statusClass(status: Agent['status']) {
  switch (status) {
    case 'Active':
      return 'bg-green-50 text-green-700'
    case 'Needs Review':
      return 'bg-yellow-50 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function riskClass(risk: Agent['risk']) {
  switch (risk) {
    case 'Critical':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'High':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'Medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-600'
  }
}

export default function AgentsClient({
  initialAgents,
}: AgentsClientProps) {
  const [agents] = React.useState<Agent[]>(initialAgents)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [risk, setRisk] = React.useState('All')
  const [showNewAgent, setShowNewAgent] = React.useState(false)

  const filteredAgents = agents.filter((agent) => {
    const query = search.toLowerCase()

    const matchesSearch =
      agent.name.toLowerCase().includes(query) ||
      agent.purpose.toLowerCase().includes(query) ||
      agent.team.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || agent.status === status

    const matchesRisk =
      risk === 'All' || agent.risk === risk

    return matchesSearch && matchesStatus && matchesRisk
  })

  const active = agents.filter(
    (agent) => agent.status === 'Active'
  ).length

  const needsReview = agents.filter(
    (agent) => agent.status === 'Needs Review'
  ).length

  const critical = agents.filter(
    (agent) => agent.risk === 'Critical'
  ).length

  const totalTasks = agents.reduce(
    (sum, agent) => sum + agent.tasks,
    0
  )

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            AI Environment
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Agents
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Discover, monitor, and govern every AI agent operating across your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewAgent(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Agents
            </p>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {agents.length}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Registered in Arbyter
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Active
            </p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {active}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Currently operating
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
            Governance attention required
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Tasks Executed
            </p>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="mt-2 text-2xl font-semibold">
            {totalTasks.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Across registered agents
          </p>
        </div>
      </section>

      {/* Critical notice */}
      {critical > 0 && (
        <section className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-medium">
              {critical} agent requires immediate review
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Critical-risk agents should be reviewed before continuing unrestricted operation.
            </p>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agents..."
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
              <option value="Paused">Paused</option>
              <option value="Needs Review">Needs Review</option>
            </select>

            <select
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All risk levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Agent list */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            AI Agent Inventory
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Every registered agent and its current governance posture.
          </p>
        </div>

        <div className="divide-y">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-muted/20 lg:flex-row lg:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Bot className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {agent.name}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      agent.status
                    )}`}
                  >
                    {agent.status}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${riskClass(
                      agent.risk
                    )}`}
                  >
                    {agent.risk} risk
                  </span>
                </div>

                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  {agent.purpose}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Team: {agent.team}
                  </span>

                  <span>
                    Tasks: {agent.tasks}
                  </span>

                  <span>
                    Last activity: {agent.lastActivity}
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

          {filteredAgents.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No agents match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Add Agent modal */}
      {showNewAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Add AI Agent
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Register an AI agent in the Arbyter governance environment.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Agent name"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <textarea
                placeholder="What does this agent do?"
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />

              <input
                type="text"
                placeholder="Owning team"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option value="Low">Low risk</option>
                <option value="Medium">Medium risk</option>
                <option value="High">High risk</option>
                <option value="Critical">Critical risk</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewAgent(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNewAgent(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}