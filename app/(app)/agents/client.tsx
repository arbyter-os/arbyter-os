'use client'

import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Link2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AgentStatus = 'Active' | 'Paused' | 'Needs Review'
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

type Agent = {
  id: string
  name: string
  purpose: string
  team: string
  status: AgentStatus
  risk: RiskLevel
  tasks: number
  lastActivity: string
}

type AgentsClientProps = {
  initialAgents: Agent[]
}

type ConnectionState =
  | 'Registered'
  | 'Connection Setup'
  | 'Connected'
  | 'Verified'
  | 'Healthy'
  | 'Surveillance Active'

type ConnectionForm = {
  connectionType: string
  provider: string
  endpointUrl: string
  environment: string
}

type ConnectionRecord = {
  id: string
  status: string | null
  health_status: string | null
  last_connected_at: string | null
  connection_type: string | null
  provider: string | null
  endpoint_url: string | null
  environment: string | null
}

const LIFECYCLE_STATES: ConnectionState[] = [
  'Registered',
  'Connection Setup',
  'Connected',
  'Verified',
  'Healthy',
  'Surveillance Active',
]

function getStatusClass(status: AgentStatus) {
  if (status === 'Active') {
    return 'bg-green-50 text-green-700'
  }

  if (status === 'Needs Review') {
    return 'bg-yellow-50 text-yellow-700'
  }

  return 'bg-gray-100 text-gray-600'
}

function getRiskClass(risk: RiskLevel) {
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

function getConnectionState(
  connection: ConnectionRecord | null,
  verified: boolean,
): ConnectionState {
  if (!connection) {
    return 'Registered'
  }

  if (connection.health_status === 'healthy' && verified) {
    return 'Healthy'
  }

  if (verified) {
    return 'Verified'
  }

  if (
    connection.status === 'connected' ||
    connection.last_connected_at
  ) {
    return 'Connected'
  }

  return 'Connection Setup'
}

export default function AgentsClient({
  initialAgents,
}: AgentsClientProps) {
  const [agents, setAgents] = React.useState<Agent[]>(
    initialAgents,
  )

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [riskFilter, setRiskFilter] = React.useState('All')

  const [showNewAgent, setShowNewAgent] =
    React.useState(false)

  const [selectedAgent, setSelectedAgent] =
    React.useState<Agent | null>(null)

  const [connection, setConnection] =
    React.useState<ConnectionRecord | null>(null)

  const [connectionState, setConnectionState] =
    React.useState<ConnectionState>('Registered')

  const [loadingConnection, setLoadingConnection] =
    React.useState(false)

  const [showConnectionForm, setShowConnectionForm] =
    React.useState(false)

  const [editingConnection, setEditingConnection] =
    React.useState(false)

  const [connectionForm, setConnectionForm] =
    React.useState<ConnectionForm>({
      connectionType: 'webhook',
      provider: '',
      endpointUrl: '',
      environment: 'production',
    })

  const [connectionError, setConnectionError] =
    React.useState<string | null>(null)

  const [message, setMessage] =
    React.useState<string | null>(null)

  const [savingConnection, setSavingConnection] =
    React.useState(false)

  const [deletingConnection, setDeletingConnection] =
    React.useState(false)

  const [verifying, setVerifying] =
    React.useState(false)

  const [deletingAgent, setDeletingAgent] =
    React.useState(false)

  const [agentName, setAgentName] =
    React.useState('')

  const [agentDescription, setAgentDescription] =
    React.useState('')

  const [agentType, setAgentType] =
    React.useState('general')

  const [creatingAgent, setCreatingAgent] =
    React.useState(false)

  const [createError, setCreateError] =
    React.useState<string | null>(null)

  const filteredAgents = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return agents.filter((agent) => {
      const matchesSearch =
        !query ||
        agent.name.toLowerCase().includes(query) ||
        agent.purpose.toLowerCase().includes(query) ||
        agent.team.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        agent.status === statusFilter

      const matchesRisk =
        riskFilter === 'All' ||
        agent.risk === riskFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRisk
      )
    })
  }, [
    agents,
    search,
    statusFilter,
    riskFilter,
  ])

  const activeAgents = agents.filter(
    (agent) => agent.status === 'Active',
  ).length

  const reviewAgents = agents.filter(
    (agent) => agent.status === 'Needs Review',
  ).length

  const criticalAgents = agents.filter(
    (agent) => agent.risk === 'Critical',
  ).length

  const totalTasks = agents.reduce(
    (total, agent) => total + agent.tasks,
    0,
  )

  /*
   * Open immediately.
   *
   * The old implementation waited for Supabase before the
   * modal could feel ready. This version renders the modal
   * first and loads connection information separately.
   */
  function openAgent(agent: Agent) {
    setSelectedAgent(agent)

    setConnection(null)
    setConnectionState('Registered')
    setLoadingConnection(true)

    setShowConnectionForm(false)
    setEditingConnection(false)

    setConnectionError(null)
    setMessage(null)

    loadConnection(agent.id)
  }

  async function loadConnection(agentId: string) {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('agent_connections')
        .select(
          `
            id,
            status,
            health_status,
            last_connected_at,
            connection_type,
            provider,
            endpoint_url,
            environment
          `,
        )
        .eq('agent_id', agentId)
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        setConnection(null)
        setConnectionState('Registered')
        return
      }

      setConnection(data)

      setConnectionForm({
        connectionType:
          data.connection_type || 'webhook',
        provider: data.provider || '',
        endpointUrl: data.endpoint_url || '',
        environment:
          data.environment || 'production',
      })

      const { data: identity } = await supabase
        .from('agent_identities')
        .select('verified')
        .eq('agent_id', agentId)
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      setConnectionState(
        getConnectionState(
          data,
          identity?.verified === true,
        ),
      )
    } catch (error) {
      console.error(
        'Failed to load agent connection:',
        error,
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Unable to load connection information.',
      )
    } finally {
      setLoadingConnection(false)
    }
  }

  function closeAgent() {
    if (
      loadingConnection &&
      !selectedAgent
    ) {
      return
    }

    setSelectedAgent(null)
    setConnection(null)
    setConnectionError(null)
    setMessage(null)
    setShowConnectionForm(false)
    setEditingConnection(false)
  }

  React.useEffect(() => {
    if (!selectedAgent) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAgent()
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [selectedAgent])

  function resetAgentForm() {
    setAgentName('')
    setAgentDescription('')
    setAgentType('general')
    setCreateError(null)
  }

  function resetConnectionForm() {
    setConnectionForm({
      connectionType: 'webhook',
      provider: '',
      endpointUrl: '',
      environment: 'production',
    })

    setConnectionError(null)
    setEditingConnection(false)
  }

  function startConnectionSetup() {
    setConnectionError(null)
    setMessage(null)
    setEditingConnection(false)
    setShowConnectionForm(true)
  }

  function startConnectionEdit() {
    if (!connection) {
      return
    }

    setConnectionForm({
      connectionType:
        connection.connection_type || 'webhook',
      provider: connection.provider || '',
      endpointUrl:
        connection.endpoint_url || '',
      environment:
        connection.environment || 'production',
    })

    setConnectionError(null)
    setMessage(null)
    setEditingConnection(true)
    setShowConnectionForm(true)
  }

  function validateConnection() {
    if (!connectionForm.provider.trim()) {
      setConnectionError(
        'Please enter the agent provider.',
      )
      return false
    }

    if (!connectionForm.endpointUrl.trim()) {
      setConnectionError(
        'Please enter the agent endpoint URL.',
      )
      return false
    }

    try {
      const url = new URL(
        connectionForm.endpointUrl.trim(),
      )

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        setConnectionError(
          'The endpoint URL must use http:// or https://.',
        )
        return false
      }
    } catch {
      setConnectionError(
        'Please enter a valid endpoint URL.',
      )
      return false
    }

    return true
  }

  async function getOrganizationId() {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error(
        'You must be signed in.',
      )
    }

    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (error || !data?.organization_id) {
      throw new Error(
        'Could not determine your organization.',
      )
    }

    return data.organization_id
  }

  async function saveConnection() {
    if (!selectedAgent) {
      return
    }

    if (!validateConnection()) {
      return
    }

    setSavingConnection(true)
    setConnectionError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const organizationId =
        await getOrganizationId()

      const payload = {
        connection_type:
          connectionForm.connectionType,
        provider:
          connectionForm.provider.trim(),
        endpoint_url:
          connectionForm.endpointUrl.trim(),
        environment:
          connectionForm.environment,
        status: 'pending',
        health_status: 'unknown',
        last_connected_at: null,
        last_seen_at: null,
        last_health_check_at: null,
        consecutive_failures: 0,
      }

      if (editingConnection && connection) {
        const { data, error } = await supabase
          .from('agent_connections')
          .update(payload)
          .eq('id', connection.id)
          .eq(
            'agent_id',
            selectedAgent.id,
          )
          .eq(
            'organization_id',
            organizationId,
          )
          .select(
            `
              id,
              status,
              health_status,
              last_connected_at,
              connection_type,
              provider,
              endpoint_url,
              environment
            `,
          )
          .single()

        if (error || !data) {
          throw new Error(
            error?.message ||
              'Failed to update the connection.',
          )
        }

        await supabase
          .from('agent_connection_events')
          .insert({
            organization_id:
              organizationId,
            agent_id: selectedAgent.id,
            agent_connection_id: connection.id,
            event_type:
              'connection_updated',
            status: 'pending',
            message:
              'Agent connection configuration updated.',
            metadata: {
              connection_type:
                connectionForm.connectionType,
              provider:
                connectionForm.provider.trim(),
              environment:
                connectionForm.environment,
            },
          })

        setConnection(data)
        setConnectionState(
          'Connection Setup',
        )
        setShowConnectionForm(false)
        setEditingConnection(false)

        setMessage(
          'Connection updated. Verify it before treating the agent as connected.',
        )
      } else {
        const { data: existing } =
          await supabase
            .from('agent_connections')
            .select('id')
            .eq(
              'agent_id',
              selectedAgent.id,
            )
            .limit(1)
            .maybeSingle()

        if (existing) {
          throw new Error(
            'This agent already has a connection. Use Edit Connection instead.',
          )
        }

        const { data, error } =
          await supabase
            .from('agent_connections')
            .insert({
              organization_id:
                organizationId,
              agent_id:
                selectedAgent.id,
              ...payload,
              capabilities: {},
              configuration: {},
            })
            .select(
              `
                id,
                status,
                health_status,
                last_connected_at,
                connection_type,
                provider,
                endpoint_url,
                environment
              `,
            )
            .single()

        if (error || !data) {
          throw new Error(
            error?.message ||
              'Failed to create the connection.',
          )
        }

        await supabase
          .from('agent_connection_events')
          .insert({
            organization_id:
              organizationId,
            agent_id: selectedAgent.id,
            agent_connection_id: data.id,
            event_type:
              'connection_setup',
            status: 'pending',
            message:
              'Agent connection configuration created.',
            metadata: {
              connection_type:
                connectionForm.connectionType,
              provider:
                connectionForm.provider.trim(),
              environment:
                connectionForm.environment,
            },
          })

        setConnection(data)
        setConnectionState(
          'Connection Setup',
        )
        setShowConnectionForm(false)

        setMessage(
          'Connection registered. Verify it before treating the agent as connected.',
        )
      }
    } catch (error) {
      console.error(
        'Failed to save connection:',
        error,
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to save the connection.',
      )
    } finally {
      setSavingConnection(false)
    }
  }

  async function deleteConnection() {
    if (!selectedAgent || !connection) {
      return
    }

    if (
      !window.confirm(
        `Delete the connection configuration for "${selectedAgent.name}"?`,
      )
    ) {
      return
    }

    setDeletingConnection(true)
    setConnectionError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const organizationId =
        await getOrganizationId()

      const { error } = await supabase
        .from('agent_connections')
        .delete()
        .eq('id', connection.id)
        .eq(
          'agent_id',
          selectedAgent.id,
        )
        .eq(
          'organization_id',
          organizationId,
        )

      if (error) {
        throw new Error(error.message)
      }

      setConnection(null)
      setConnectionState('Registered')
      setShowConnectionForm(false)
      setEditingConnection(false)

      resetConnectionForm()

      setMessage(
        'Connection deleted. The agent remains registered.',
      )
    } catch (error) {
      console.error(
        'Failed to delete connection:',
        error,
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to delete the connection.',
      )
    } finally {
      setDeletingConnection(false)
    }
  }

  async function verifyConnection() {
    if (!selectedAgent) {
      return
    }

    setVerifying(true)
    setConnectionError(null)
    setMessage(null)

    try {
      const response = await fetch(
        '/api/agents/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Accept:
              'application/json',
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({
            agentId:
              selectedAgent.id,
          }),
        },
      )

      const contentType =
        response.headers.get(
          'content-type',
        ) || ''

      let data: {
        success?: boolean
        message?: string
        error?: string
      } = {}

      if (
        contentType.includes(
          'application/json',
        )
      ) {
        data = await response.json()
      } else {
        const text =
          await response.text()

        throw new Error(
          text ||
            `Verification failed with HTTP ${response.status}.`,
        )
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            data.error ||
            'Connection verification failed.',
        )
      }

      setMessage(
        data.message ||
          'Connection verification completed.',
      )

      await loadConnection(
        selectedAgent.id,
      )
    } catch (error) {
      console.error(
        'Failed to verify connection:',
        error,
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Connection verification failed.',
      )
    } finally {
      setVerifying(false)
    }
  }

  async function deleteAgent() {
    if (!selectedAgent) {
      return
    }

    if (
      !window.confirm(
        `Delete "${selectedAgent.name}" permanently?\n\nThis removes the agent registration.`,
      )
    ) {
      return
    }

    setDeletingAgent(true)
    setConnectionError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const organizationId =
        await getOrganizationId()

      const { data, error } =
        await supabase
          .from('ai_agents')
          .delete()
          .eq(
            'id',
            selectedAgent.id,
          )
          .eq(
            'organization_id',
            organizationId,
          )
          .select('id')

      if (error) {
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        throw new Error(
          'The agent was not deleted. Check the ai_agents DELETE policy.',
        )
      }

      setAgents((current) =>
        current.filter(
          (agent) =>
            agent.id !==
            selectedAgent.id,
        ),
      )

      closeAgent()
    } catch (error) {
      console.error(
        'Failed to delete agent:',
        error,
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to delete the agent.',
      )
    } finally {
      setDeletingAgent(false)
    }
  }

  async function createAgent() {
    if (!agentName.trim()) {
      setCreateError(
        'Please enter an agent name.',
      )
      return
    }

    if (!agentDescription.trim()) {
      setCreateError(
        'Please describe what this agent does.',
      )
      return
    }

    setCreatingAgent(true)
    setCreateError(null)

    try {
      const supabase = createClient()
      const organizationId =
        await getOrganizationId()

      const { data, error } =
        await supabase
          .from('ai_agents')
          .insert({
            organization_id:
              organizationId,
            name:
              agentName.trim(),
            description:
              agentDescription.trim(),
            agent_type:
              agentType,
            status: 'active',
          })
          .select(
            `
              id,
              name,
              description,
              agent_type,
              status
            `,
          )
          .single()

      if (error || !data) {
        throw new Error(
          error?.message ||
            'Failed to create the agent.',
        )
      }

      const newAgent: Agent = {
        id: data.id,
        name: data.name,
        purpose:
          data.description ||
          'AI agent registered in the Arbyter governance environment.',
        team:
          data.agent_type ||
          'AI Operations',
        status:
          data.status === 'paused'
            ? 'Paused'
            : data.status ===
                'needs_review'
              ? 'Needs Review'
              : 'Active',
        risk: 'Medium',
        tasks: 0,
        lastActivity:
          'No activity recorded',
      }

      setAgents((current) => [
        newAgent,
        ...current,
      ])

      resetAgentForm()
      setShowNewAgent(false)
    } catch (error) {
      console.error(
        'Failed to create agent:',
        error,
      )

      setCreateError(
        error instanceof Error
          ? error.message
          : 'Failed to create the agent.',
      )
    } finally {
      setCreatingAgent(false)
    }
  }

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
            Discover, connect, monitor, and govern every AI
            agent operating across your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetAgentForm()
            setShowNewAgent(true)
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </button>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Agents"
          value={agents.length}
          description="Registered in Arbyter"
          icon={<Bot className="h-4 w-4" />}
        />

        <SummaryCard
          label="Active"
          value={activeAgents}
          description="Currently registered as active"
          icon={<Activity className="h-4 w-4" />}
        />

        <SummaryCard
          label="Needs Review"
          value={reviewAgents}
          description="Governance attention required"
          icon={
            <AlertTriangle className="h-4 w-4" />
          }
        />

        <SummaryCard
          label="Tasks Executed"
          value={totalTasks.toLocaleString()}
          description="Across registered agents"
          icon={
            <ShieldCheck className="h-4 w-4" />
          }
        />
      </section>

      {/* Critical notice */}
      {criticalAgents > 0 && (
        <section className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-medium">
              {criticalAgents}{' '}
              {criticalAgents === 1
                ? 'agent requires'
                : 'agents require'}{' '}
              immediate review
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Critical-risk agents should be reviewed before
              unrestricted operation.
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
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search agents..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">
                All statuses
              </option>
              <option value="Active">
                Active
              </option>
              <option value="Paused">
                Paused
              </option>
              <option value="Needs Review">
                Needs Review
              </option>
            </select>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value,
                )
              }
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
            >
              <option value="All">
                All risk levels
              </option>
              <option value="Critical">
                Critical
              </option>
              <option value="High">
                High
              </option>
              <option value="Medium">
                Medium
              </option>
              <option value="Low">
                Low
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* Agent inventory */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            AI Agent Inventory
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Every registered agent and its current governance
            posture.
          </p>
        </div>

        <div className="divide-y">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => openAgent(agent)}
              className="group flex w-full cursor-pointer flex-col gap-4 p-5 text-left transition hover:bg-muted/30 focus:outline-none focus-visible:bg-muted/30 lg:flex-row lg:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background transition group-hover:border-foreground/20">
                <Bot className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">
                    {agent.name}
                  </h3>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                      agent.status,
                    )}`}
                  >
                    {agent.status}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getRiskClass(
                      agent.risk,
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
                    Last activity:{' '}
                    {agent.lastActivity}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end">
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </button>
          ))}

          {filteredAgents.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              No agents match your filters.
            </div>
          )}
        </div>
      </section>

      {/* Agent detail modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-in fade-in duration-150"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !deletingAgent &&
              !deletingConnection &&
              !savingConnection &&
              !verifying
            ) {
              closeAgent()
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b p-6">
              <div className="min-w-0 pr-4">
                <p className="text-sm text-muted-foreground">
                  AI Agent
                </p>

                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {selectedAgent.name}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedAgent.purpose}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAgent}
                disabled={
                  deletingAgent ||
                  deletingConnection ||
                  savingConnection ||
                  verifying
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close agent details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Lifecycle */}
              <section>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Connection lifecycle
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Arbyter only activates surveillance after a
                      real connection and verified signal source.
                    </p>
                  </div>

                  <CircleDot className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LIFECYCLE_STATES.map(
                    (state, index) => {
                      const currentIndex =
                        LIFECYCLE_STATES.indexOf(
                          connectionState,
                        )

                      const complete =
                        index <= currentIndex

                      const current =
                        state ===
                        connectionState

                      return (
                        <div
                          key={state}
                          className={`rounded-xl border p-3 transition ${
                            current
                              ? 'border-foreground bg-muted/40'
                              : complete
                                ? 'bg-muted/20'
                                : 'opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {complete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <CircleDot className="h-4 w-4" />
                            )}

                            <span className="text-xs font-medium">
                              {state}
                            </span>
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
              </section>

              {/* Current state */}
              <section className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>
                    <p className="text-sm font-medium">
                      Current connection state
                    </p>

                    <p className="mt-1 text-sm">
                      {loadingConnection
                        ? 'Loading connection...'
                        : connectionState}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Registration alone is never treated as a
                      live surveillance connection.
                    </p>
                  </div>
                </div>
              </section>

              {/* Errors */}
              {connectionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {connectionError}
                </div>
              )}

              {message && (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                  {message}
                </div>
              )}

              {/* Loading */}
              {loadingConnection && (
                <div className="rounded-xl border bg-muted/20 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />

                    <p className="text-sm text-muted-foreground">
                      Loading connection details...
                    </p>
                  </div>
                </div>
              )}

              {/* No connection */}
              {!loadingConnection &&
                !connection &&
                !showConnectionForm && (
                  <section className="rounded-xl border p-5">
                    <div className="flex items-start gap-3">
                      <Link2 className="mt-0.5 h-4 w-4" />

                      <div>
                        <p className="text-sm font-medium">
                          No connection configured
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          This agent is registered but has not yet
                          been connected to an external signal
                          source.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        startConnectionSetup
                      }
                      className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                    >
                      <Link2 className="h-4 w-4" />
                      Connect Agent
                    </button>
                  </section>
                )}

              {/* Existing connection */}
              {!loadingConnection &&
                connection &&
                !showConnectionForm && (
                  <section className="rounded-xl border p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            Connection configuration
                          </p>

                          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                            <p>
                              Type:{' '}
                              {connection.connection_type ||
                                'Unknown'}
                            </p>

                            <p>
                              Provider:{' '}
                              {connection.provider ||
                                'Unknown'}
                            </p>

                            <p className="break-all">
                              Endpoint:{' '}
                              {connection.endpoint_url ||
                                'Not configured'}
                            </p>

                            <p>
                              Environment:{' '}
                              {connection.environment ||
                                'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={
                            startConnectionEdit
                          }
                          disabled={
                            deletingConnection ||
                            verifying
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={
                            verifyConnection
                          }
                          disabled={
                            verifying ||
                            deletingConnection
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {verifying
                            ? 'Verifying...'
                            : 'Verify'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <button
                        type="button"
                        onClick={
                          deleteConnection
                        }
                        disabled={
                          deletingConnection ||
                          verifying
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />

                        {deletingConnection
                          ? 'Deleting...'
                          : 'Delete Connection'}
                      </button>
                    </div>
                  </section>
                )}

              {/* Connection form */}
              {showConnectionForm && (
                <section className="rounded-xl border p-5">
                  <div>
                    <h3 className="font-semibold">
                      {editingConnection
                        ? 'Edit Agent Connection'
                        : 'Connect AI Agent'}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Configure the real connection details.
                      Arbyter will not claim the agent is connected
                      until verification succeeds.
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    <FormField label="Connection type">
                      <select
                        value={
                          connectionForm.connectionType
                        }
                        onChange={(event) =>
                          setConnectionForm(
                            (current) => ({
                              ...current,
                              connectionType:
                                event.target.value,
                            }),
                          )
                        }
                        disabled={
                          savingConnection
                        }
                        className="form-input"
                      >
                        <option value="webhook">
                          Webhook
                        </option>

                        <option value="api">
                          REST API
                        </option>

                        <option value="sdk">
                          SDK
                        </option>

                        <option value="mcp">
                          MCP
                        </option>
                      </select>
                    </FormField>

                    <FormField label="Provider">
                      <input
                        value={
                          connectionForm.provider
                        }
                        onChange={(event) =>
                          setConnectionForm(
                            (current) => ({
                              ...current,
                              provider:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="e.g. OpenAI, Anthropic, Internal"
                        disabled={
                          savingConnection
                        }
                        className="form-input"
                      />
                    </FormField>

                    <FormField label="Agent endpoint">
                      <input
                        type="url"
                        value={
                          connectionForm.endpointUrl
                        }
                        onChange={(event) =>
                          setConnectionForm(
                            (current) => ({
                              ...current,
                              endpointUrl:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="https://..."
                        disabled={
                          savingConnection
                        }
                        className="form-input"
                      />
                    </FormField>

                    <FormField label="Environment">
                      <select
                        value={
                          connectionForm.environment
                        }
                        onChange={(event) =>
                          setConnectionForm(
                            (current) => ({
                              ...current,
                              environment:
                                event.target.value,
                            }),
                          )
                        }
                        disabled={
                          savingConnection
                        }
                        className="form-input"
                      >
                        <option value="production">
                          Production
                        </option>

                        <option value="staging">
                          Staging
                        </option>

                        <option value="development">
                          Development
                        </option>
                      </select>
                    </FormField>

                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      Saving this form only stores the connection
                      configuration. It does not execute a request.
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowConnectionForm(
                            false,
                          )
                          setEditingConnection(
                            false,
                          )
                          setConnectionError(
                            null,
                          )
                        }}
                        disabled={
                          savingConnection
                        }
                        className="h-10 rounded-lg border px-4 text-sm font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          saveConnection
                        }
                        disabled={
                          savingConnection
                        }
                        className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                      >
                        {savingConnection
                          ? 'Saving...'
                          : editingConnection
                            ? 'Save Changes'
                            : 'Register Connection'}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Danger zone */}
              <section className="rounded-xl border border-red-200 p-5">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Danger zone
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Permanently remove this agent registration.
                    </p>

                    <button
                      type="button"
                      onClick={
                        deleteAgent
                      }
                      disabled={
                        deletingAgent ||
                        deletingConnection ||
                        savingConnection ||
                        verifying
                      }
                      className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />

                      {deletingAgent
                        ? 'Deleting Agent...'
                        : 'Delete Agent'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent modal */}
      {showNewAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-in fade-in duration-150"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !creatingAgent
            ) {
              resetAgentForm()
              setShowNewAgent(false)
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add AI Agent
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Register an AI agent in the Arbyter governance
                  environment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!creatingAgent) {
                    resetAgentForm()
                    setShowNewAgent(false)
                  }
                }}
                disabled={
                  creatingAgent
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={agentName}
                onChange={(event) =>
                  setAgentName(
                    event.target.value,
                  )
                }
                placeholder="Agent name"
                disabled={creatingAgent}
                className="form-input"
              />

              <textarea
                value={agentDescription}
                onChange={(event) =>
                  setAgentDescription(
                    event.target.value,
                  )
                }
                placeholder="What does this agent do?"
                rows={3}
                disabled={creatingAgent}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />

              <select
                value={agentType}
                onChange={(event) =>
                  setAgentType(
                    event.target.value,
                  )
                }
                disabled={creatingAgent}
                className="form-input"
              >
                <option value="general">
                  General AI Agent
                </option>

                <option value="risk">
                  Risk
                </option>

                <option value="compliance">
                  Compliance
                </option>

                <option value="policy">
                  Policy
                </option>

                <option value="investigation">
                  Investigation
                </option>

                <option value="evidence">
                  Evidence
                </option>
              </select>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                Registration does not mean the agent is connected
                or under active surveillance.
              </div>

              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!creatingAgent) {
                    resetAgentForm()
                    setShowNewAgent(false)
                  }
                }}
                disabled={creatingAgent}
                className="h-10 rounded-lg border px-4 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createAgent}
                disabled={creatingAgent}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {creatingAgent
                  ? 'Adding...'
                  : 'Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <span className="text-muted-foreground">
          {icon}
        </span>
      </div>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium">
        {label}
      </label>

      {children}
    </div>
  )
}