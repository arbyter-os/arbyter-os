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
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type TaskStatus = 'running' | 'pending' | 'completed' | 'blocked'
type Priority = 'critical' | 'high' | 'medium' | 'low'

type Task = {
  id: string
  title: string
  description: string | null
  agent: string
  priority: Priority
  status: TaskStatus
  due: string
  created: string
}

type Agent = {
  id: string
  name: string
  status?: string | null
}

function priorityClass(priority: Priority) {
  switch (priority) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'high':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-600'
  }
}

function statusClass(status: TaskStatus) {
  switch (status) {
    case 'running':
      return 'bg-blue-50 text-blue-700'
    case 'completed':
      return 'bg-green-50 text-green-700'
    case 'blocked':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function statusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />
    case 'running':
      return <Clock3 className="h-4 w-4" />
    case 'blocked':
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <Clock3 className="h-4 w-4" />
  }
}

function formatDate(date: string | null) {
  if (!date) return '—'

  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return date
  }

  return value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function normalizeStatus(value: string | null): TaskStatus {
  const normalized = (value ?? 'pending').toLowerCase()

  if (
    normalized === 'running' ||
    normalized === 'completed' ||
    normalized === 'blocked'
  ) {
    return normalized
  }

  return 'pending'
}

function normalizePriority(value: string | null): Priority {
  const normalized = (value ?? 'medium').toLowerCase()

  if (
    normalized === 'critical' ||
    normalized === 'high' ||
    normalized === 'medium' ||
    normalized === 'low'
  ) {
    return normalized
  }

  return 'medium'
}

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [agents, setAgents] = React.useState<Agent[]>([])

  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)

  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [priority, setPriority] = React.useState('All')

  const [showNewTask, setShowNewTask] = React.useState(false)

  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selectedAgent, setSelectedAgent] = React.useState('')
  const [selectedPriority, setSelectedPriority] =
    React.useState<Priority>('medium')

  const [error, setError] = React.useState<string | null>(null)

  async function getOrganizationId() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError

    if (!user) {
      throw new Error('You must be signed in.')
    }

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (userError) throw userError

    if (!userRecord?.organization_id) {
      throw new Error(
        'No organization is associated with your account.'
      )
    }

    return {
      user,
      organizationId: userRecord.organization_id,
    }
  }

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const { organizationId } = await getOrganizationId()

      const [
        { data: taskRows, error: taskError },
        { data: agentRows, error: agentError },
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select(
            `
              id,
              title,
              description,
              status,
              priority,
              created_at,
              agent_tasks (
                agent_id,
                assigned_at
              )
            `
          )
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false }),

        supabase
          .from('ai_agents')
          .select('id, name, status')
          .eq('organization_id', organizationId)
          .order('name', { ascending: true }),
      ])

      if (taskError) throw taskError
      if (agentError) throw agentError

      const agentList: Agent[] = (agentRows ?? []).map((agent) => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
      }))

      setAgents(agentList)

      const agentMap = new Map(
        agentList.map((agent) => [agent.id, agent.name])
      )

      const mappedTasks: Task[] = (taskRows ?? []).map((task) => {
        const assignment = Array.isArray(task.agent_tasks)
          ? task.agent_tasks[0]
          : task.agent_tasks

        const agentId = assignment?.agent_id ?? null

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          agent: agentId
            ? agentMap.get(agentId) ?? 'Unknown Agent'
            : 'Unassigned',
          priority: normalizePriority(task.priority),
          status: normalizeStatus(task.status),
          due: 'Not set',
          created: formatDate(task.created_at),
        }
      })

      setTasks(mappedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load tasks.'
      )
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  async function createTask() {
    setError(null)

    if (!title.trim()) {
      setError('Enter a task title.')
      return
    }

    if (!selectedAgent) {
      setError('Select an agent to assign this task to.')
      return
    }

    setCreating(true)

    try {
      const { user, organizationId } = await getOrganizationId()

      const { data: selectedAgentRecord, error: agentError } =
        await supabase
          .from('ai_agents')
          .select('id, name')
          .eq('id', selectedAgent)
          .eq('organization_id', organizationId)
          .maybeSingle()

      if (agentError) throw agentError

      if (!selectedAgentRecord) {
        throw new Error(
          'The selected agent does not belong to your organization.'
        )
      }

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          organization_id: organizationId,
          title: title.trim(),
          description: description.trim() || null,
          status: 'pending',
          priority: selectedPriority,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (taskError) throw taskError

      const { error: assignmentError } = await supabase
        .from('agent_tasks')
        .insert({
          task_id: task.id,
          agent_id: selectedAgent,
        })

      if (assignmentError) {
        await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id)

        throw assignmentError
      }

      setTitle('')
      setDescription('')
      setSelectedAgent('')
      setSelectedPriority('medium')
      setShowNewTask(false)

      await loadData()
    } catch (err) {
      console.error('Failed to create task:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create task.'
      )
    } finally {
      setCreating(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const query = search.toLowerCase()

    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.agent.toLowerCase().includes(query)

    const matchesStatus =
      status === 'All' || task.status === status.toLowerCase()

    const matchesPriority =
      priority === 'All' ||
      task.priority === priority.toLowerCase()

    return matchesSearch && matchesStatus && matchesPriority
  })

  const running = tasks.filter(
    (task) => task.status === 'running'
  ).length

  const pending = tasks.filter(
    (task) => task.status === 'pending'
  ).length

  const completed = tasks.filter(
    (task) => task.status === 'completed'
  ).length

  const blocked = tasks.filter(
    (task) => task.status === 'blocked'
  ).length

  return (
    <main className="flex flex-col gap-6">
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
          onClick={() => {
            setError(null)
            setShowNewTask(true)
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Running</p>
          <p className="mt-2 text-2xl font-semibold">{running}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Currently executing
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-2 text-2xl font-semibold">{pending}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Waiting for execution
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completed}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Successfully completed
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Blocked</p>
          <p className="mt-2 text-2xl font-semibold">{blocked}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Require intervention
          </p>
        </div>
      </section>

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

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">Task Queue</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Work assigned to and executed by AI agents.
          </p>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Loading tasks...
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
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
                        {task.status.charAt(0).toUpperCase() +
                          task.status.slice(1)}
                      </span>
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Assigned to {task.agent}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span>Due: {task.due}</span>
                    <span>Created: {task.created}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No tasks match your filters.
            </div>
          )}
        </div>
      </section>

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
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              />

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Task description"
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />

              <select
                value={selectedAgent}
                onChange={(event) =>
                  setSelectedAgent(event.target.value)
                }
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              >
                <option value="">Select an agent</option>

                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(event) =>
                  setSelectedPriority(
                    event.target.value as Priority
                  )
                }
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none"
              >
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
                <option value="high">High priority</option>
                <option value="critical">Critical priority</option>
              </select>
            </div>

            {agents.length === 0 && !loading && (
              <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-700">
                No agents are available in your organization.
                Create an agent first.
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setShowNewTask(false)
                }}
                disabled={creating}
                className="h-10 rounded-lg border px-4 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createTask}
                disabled={creating || agents.length === 0}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}