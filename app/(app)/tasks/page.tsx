'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  created_at: string
  agent_tasks?: {
    agent_id: string
    ai_agents?: {
      id: string
      name: string
    }[] | null
  }[]
}

type Agent = {
  id: string
  name: string
  status: string
}

export default function TasksPage() {
  const supabase = useMemo(() => createClient(), [])

  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [agentId, setAgentId] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
        throw new Error('No organization is associated with your account.')
      }

      const organizationId = userRecord.organization_id

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          agent_tasks (
            agent_id,
            ai_agents (
              id,
              name
            )
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (taskError) throw taskError

      const { data: agentData, error: agentError } = await supabase
        .from('ai_agents')
        .select('id, name, status')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

      if (agentError) throw agentError

      const normalizedTasks: Task[] = (taskData ?? []).map((task) => ({
        ...task,
        agent_tasks: (task.agent_tasks ?? []).map((assignment) => ({
          agent_id: assignment.agent_id,
          ai_agents: Array.isArray(assignment.ai_agents)
            ? assignment.ai_agents
            : assignment.ai_agents
              ? [assignment.ai_agents]
              : [],
        })),
      }))

      setTasks(normalizedTasks)
      setAgents((agentData ?? []) as Agent[])
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

  useEffect(() => {
    loadData()
  }, [])

  async function createTask() {
    if (creating) return

    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    if (!agentId) {
      setError('Select an agent for this task.')
      return
    }

    if (!agents.some((agent) => agent.id === agentId)) {
      setError('Select an agent from your organization.')
      return
    }

    setCreating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
        throw new Error('No organization is associated with your account.')
      }

      const organizationId = userRecord.organization_id

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          organization_id: organizationId,
          title: title.trim(),
          description: description.trim() || null,
          status: 'pending',
          priority,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (taskError) throw taskError

      const { error: assignmentError } = await supabase
        .from('agent_tasks')
        .insert({
          task_id: task.id,
          agent_id: agentId,
        })

      if (assignmentError) {
        const { error: cleanupError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id)
          .eq('organization_id', organizationId)

        if (cleanupError) {
          console.error('Failed to remove unassigned task:', cleanupError)
        }

        throw assignmentError
      }

      setTitle('')
      setDescription('')
      setPriority('medium')
      setAgentId('')

      setSuccess('Task created successfully.')

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

  async function executeTask(taskId: string) {
    if (executingTaskId) return

    setError(null)
    setSuccess(null)
    setExecutingTaskId(taskId)

    try {
      const response = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
        }),
      })

      const text = await response.text()

      let data: any = {}

      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data?.error ??
            `Task execution failed (${response.status}).`
        )
      }

      setSuccess(
        `Task executed successfully through ${data.provider}.`
      )

      await loadData()
    } catch (err) {
      console.error('Failed to execute task:', err)

      await loadData()

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to execute task.'
      )
    } finally {
      setExecutingTaskId(null)
    }
  }

  const counts = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    running: tasks.filter((task) => task.status === 'running').length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
  }

  function getAgent(task: Task) {
    return task.agent_tasks?.[0]?.ai_agents?.[0]?.name ?? 'Unassigned'
  }

  function statusLabel(status: string) {
    return status.replace(/_/g, ' ')
  }

  return (
    <main className="min-h-full space-y-8 p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-neutral-500">
          Operations
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
          Tasks
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Assign work to agents and execute it through Arbyter.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ['Total', counts.total],
          ['Pending', counts.pending],
          ['Running', counts.running],
          ['Completed', counts.completed],
          ['Blocked', counts.blocked],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">
            Create task
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Define the work and assign an agent.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="h-11 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-neutral-400"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what the agent needs to do"
            rows={4}
            className="resize-none rounded-xl border border-neutral-200 p-4 text-sm outline-none focus:border-neutral-400"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
            >
              <option value="">Select agent</option>

              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-neutral-400"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
              <option value="critical">Critical priority</option>
            </select>
          </div>

          <div>
            <button
              onClick={createTask}
              disabled={creating}
              className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-neutral-950">
            Task queue
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-neutral-500">
            Loading tasks…
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-neutral-900">
              No tasks yet
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              Create your first task above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-neutral-950">
                      {task.title}
                    </h3>

                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs capitalize text-neutral-600">
                      {statusLabel(task.status)}
                    </span>

                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs capitalize text-neutral-600">
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                      {task.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-neutral-400">
                    Agent: {getAgent(task)}
                  </p>
                </div>

                {(task.status === 'pending' ||
                  task.status === 'blocked') && (
                  <button
                    onClick={() => executeTask(task.id)}
                    disabled={executingTaskId !== null}
                    className="shrink-0 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {executingTaskId === task.id
                      ? 'Executing…'
                      : 'Execute'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
