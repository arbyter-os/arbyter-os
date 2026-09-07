'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Bot,
  ChevronRight,
} from 'lucide-react'

type Task = {
  id: number
  title: string
  agent: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'Running' | 'Pending' | 'Completed' | 'Blocked'
  due: string
  created: string
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Review candidate ranking decisions',
    agent: 'Hiring Recommendation Agent',
    priority: 'High',
    status: 'Running',
    due: 'Today, 2:00 PM',
    created: 'Today',
  },
  {
    id: 2,
    title: 'Validate pricing policy compliance',
    agent: 'Pricing Optimization Agent',
    priority: 'Critical',
    status: 'Blocked',
    due: 'Today, 12:30 PM',
    created: 'Today',
  },
  {
    id: 3,
    title: 'Process customer support queue',
    agent: 'Customer Support Agent',
    priority: 'Medium',
    status: 'Running',
    due: 'Today, 5:00 PM',
    created: 'Today',
  },
  {
    id: 4,
    title: 'Collect EU AI Act evidence',
    agent: 'Compliance Monitoring Agent',
    priority: 'High',
    status: 'Pending',
    due: 'Tomorrow',
    created: 'Today',
  },
  {
    id: 5,
    title: 'Analyze quarterly documents',
    agent: 'Document Analysis Agent',
    priority: 'Low',
    status: 'Completed',
    due: 'Completed',
    created: 'Yesterday',
  },
  {
    id: 6,
    title: 'Check forecasting model drift',
    agent: 'Forecasting Agent',
    priority: 'Medium',
    status: 'Pending',
    due: 'Sep 9, 2026',
    created: 'Sep 6, 2026',
  },
]

function priorityClass(priority: Task['priority']) {
  switch (priority) {
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

function statusClass(status: Task['status']) {
  switch (status) {
    case 'Running':
      return 'bg-blue-50 text-blue-700'
    case 'Completed':
      return 'bg-green-50 text-green-700'
    case 'Blocked':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function statusIcon(status: Task['status']) {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className="h-4 w-4" />
    case 'Running':
      return <Clock3 className="h-4 w-4" />
    case 'Blocked':
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Clock3 className="h-4 w-4" />
  }
}

export default function TasksPage() {
  const [tasks] = React.useState<Task[]>(initialTasks)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [priority, setPriority] = React.useState('All')
  const [showNewTask, setShowNewTask] = React.useState(false)

  const filteredTasks = tasks.filter((task) => {
    const query = search.toLowerCase()

    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.agent.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || task.status === status

    const matchesPriority =
      priority === 'All' || task.priority === priority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const running = tasks.filter(
    (task) => task.status === 'Running'
  ).length

  const pending = tasks.filter(
    (task) => task.status === 'Pending'
  ).length

  const completed = tasks.filter(
    (task) => task.status === 'Completed'
  ).length

  const blocked = tasks.filter(
    (task) => task.status === 'Blocked'
  ).length

  return (
    <main className="flex flex-col gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            AI Operations
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Tasks
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Assign, monitor, and govern the work performed by your AI agents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewTask(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Running
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {running}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Currently executing
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Pending
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {pending}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Waiting for execution
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Completed
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {completed}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Successfully completed
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Blocked
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {blocked}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Require intervention
          </p>
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
              placeholder="Search tasks..."
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
              <option value="Running">Running</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Task list */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Task Queue
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Work assigned to and executed by AI agents.
          </p>
        </div>

        <div className="divide-y">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-4 p-5 transition hover:bg-muted/20 lg:flex-row lg:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Bot className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {task.title}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                      task.status
                    )}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {statusIcon(task.status)}
                      {task.status}
                    </span>
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClass(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Assigned to {task.agent}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Due: {task.due}
                  </span>

                  <span>
                    Created: {task.created}
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

          {filteredTasks.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No tasks match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Create task modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Create Task
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Assign a new task to an AI agent.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task title"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <textarea
                placeholder="Task description"
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option>Hiring Recommendation Agent</option>
                <option>Pricing Optimization Agent</option>
                <option>Customer Support Agent</option>
                <option>Document Analysis Agent</option>
                <option>Forecasting Agent</option>
                <option>Compliance Monitoring Agent</option>
              </select>

              <select className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none">
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
                <option value="High">High priority</option>
                <option value="Critical">Critical priority</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTask(false)}
                className="h-10 rounded-lg border px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setShowNewTask(false)}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}