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

function connectionStateFromData(
  connection:
    | {
        status: string | null
        health_status: string | null
        last_connected_at: string | null
      }
    | null,
  verified: boolean
): ConnectionState {
  if (!connection) {
    return 'Registered'
  }

  if (
    connection.health_status === 'healthy' &&
    verified
  ) {
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
  const [agents, setAgents] =
    React.useState<Agent[]>(initialAgents)

  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('All')
  const [risk, setRisk] = React.useState('All')

  const [showNewAgent, setShowNewAgent] =
    React.useState(false)

  const [selectedAgent, setSelectedAgent] =
    React.useState<Agent | null>(null)

  const [showConnectionSetup, setShowConnectionSetup] =
    React.useState(false)

  const [isEditingConnection, setIsEditingConnection] =
    React.useState(false)

  const [connection, setConnection] =
    React.useState<ConnectionRecord | null>(null)

  const [connectionState, setConnectionState] =
    React.useState<ConnectionState>('Registered')

  const [connectionForm, setConnectionForm] =
    React.useState<ConnectionForm>({
      connectionType: 'webhook',
      provider: '',
      endpointUrl: '',
      environment: 'production',
    })

  const [isLoadingConnection, setIsLoadingConnection] =
    React.useState(false)

  const [isCreatingConnection, setIsCreatingConnection] =
    React.useState(false)

  const [isSavingConnection, setIsSavingConnection] =
    React.useState(false)

  const [isDeletingConnection, setIsDeletingConnection] =
    React.useState(false)

  const [isDeletingAgent, setIsDeletingAgent] =
    React.useState(false)

  const [isVerifying, setIsVerifying] =
    React.useState(false)

  const [connectionError, setConnectionError] =
    React.useState<string | null>(null)

  const [verificationMessage, setVerificationMessage] =
    React.useState<string | null>(null)

  const [agentName, setAgentName] =
    React.useState('')

  const [agentDescription, setAgentDescription] =
    React.useState('')

  const [agentType, setAgentType] =
    React.useState('general')

  const [isCreating, setIsCreating] =
    React.useState(false)

  const [createError, setCreateError] =
    React.useState<string | null>(null)

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

  function resetForm() {
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
    setVerificationMessage(null)
    setIsEditingConnection(false)
  }

  function closeAgentModal() {
    setSelectedAgent(null)
    setConnection(null)
    setShowConnectionSetup(false)
    setIsEditingConnection(false)
    resetConnectionForm()
  }

  async function openAgent(agent: Agent) {
    setSelectedAgent(agent)
    setShowConnectionSetup(false)
    setIsEditingConnection(false)
    setConnectionError(null)
    setVerificationMessage(null)
    setIsLoadingConnection(true)
    setConnectionState('Registered')
    setConnection(null)

    try {
      const supabase = createClient()

      const { data: connectionData, error: connectionError } =
        await supabase
          .from('agent_connections')
          .select(
            'id, status, health_status, last_connected_at, connection_type, provider, endpoint_url, environment'
          )
          .eq('agent_id', agent.id)
          .order('created_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle()

      if (connectionError) {
        throw connectionError
      }

      if (connectionData) {
        setConnection(connectionData)

        setConnectionForm({
          connectionType:
            connectionData.connection_type ||
            'webhook',
          provider:
            connectionData.provider || '',
          endpointUrl:
            connectionData.endpoint_url || '',
          environment:
            connectionData.environment ||
            'production',
        })

        const { data: identity, error: identityError } =
          await supabase
            .from('agent_identities')
            .select('verified')
            .eq('agent_id', agent.id)
            .order('created_at', {
              ascending: false,
            })
            .limit(1)
            .maybeSingle()

        if (identityError) {
          throw identityError
        }

        setConnectionState(
          connectionStateFromData(
            connectionData,
            identity?.verified === true
          )
        )
      } else {
        setConnectionState('Registered')
      }
    } catch (error) {
      console.error(
        'Failed to load agent connection:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Unable to load the connection state.'
      )
    } finally {
      setIsLoadingConnection(false)
    }
  }

  function beginConnectionSetup() {
    setConnectionError(null)
    setVerificationMessage(null)
    setIsEditingConnection(false)
    setShowConnectionSetup(true)
  }

  function beginEditConnection() {
    if (!connection) {
      return
    }

    setConnectionForm({
      connectionType:
        connection.connection_type ||
        'webhook',
      provider:
        connection.provider || '',
      endpointUrl:
        connection.endpoint_url || '',
      environment:
        connection.environment ||
        'production',
    })

    setConnectionError(null)
    setVerificationMessage(null)
    setIsEditingConnection(true)
    setShowConnectionSetup(true)
  }

  function validateConnectionForm() {
    if (!connectionForm.provider.trim()) {
      setConnectionError(
        'Please enter the agent provider.'
      )
      return false
    }

    if (!connectionForm.endpointUrl.trim()) {
      setConnectionError(
        'Please enter the agent endpoint URL.'
      )
      return false
    }

    try {
      const parsedUrl = new URL(
        connectionForm.endpointUrl.trim()
      )

      if (
        parsedUrl.protocol !== 'http:' &&
        parsedUrl.protocol !== 'https:'
      ) {
        setConnectionError(
          'The endpoint URL must use http:// or https://.'
        )
        return false
      }
    } catch {
      setConnectionError(
        'Please enter a valid endpoint URL, such as https://example.com/.'
      )
      return false
    }

    return true
  }

  async function handleCreateConnection() {
    if (!selectedAgent) {
      return
    }

    if (!validateConnectionForm()) {
      return
    }

    setIsCreatingConnection(true)
    setConnectionError(null)
    setVerificationMessage(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'You must be signed in to connect an agent.'
        )
      }

      const {
        data: userRecord,
        error: userRecordError,
      } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (
        userRecordError ||
        !userRecord?.organization_id
      ) {
        throw new Error(
          'Could not determine your organization.'
        )
      }

      const {
        data: existingConnection,
        error: existingConnectionError,
      } = await supabase
        .from('agent_connections')
        .select('id')
        .eq('agent_id', selectedAgent.id)
        .limit(1)
        .maybeSingle()

      if (existingConnectionError) {
        throw existingConnectionError
      }

      if (existingConnection) {
        throw new Error(
          'This agent already has a connection. Use Edit Connection instead.'
        )
      }

      const {
        data: newConnection,
        error: connectionInsertError,
      } = await supabase
        .from('agent_connections')
        .insert({
          organization_id:
            userRecord.organization_id,
          agent_id: selectedAgent.id,
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
          capabilities: {},
          configuration: {},
          consecutive_failures: 0,
        })
        .select(
          'id, status, health_status, last_connected_at, connection_type, provider, endpoint_url, environment'
        )
        .single()

      if (
        connectionInsertError ||
        !newConnection
      ) {
        throw new Error(
          connectionInsertError?.message ||
            'Failed to create the connection.'
        )
      }

      const { error: eventError } =
        await supabase
          .from('agent_connection_events')
          .insert({
            organization_id:
              userRecord.organization_id,
            agent_id: selectedAgent.id,
            agent_connection_id:
              newConnection.id,
            event_type: 'connection_setup',
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

      if (eventError) {
        console.error(
          'Connection event could not be recorded:',
          eventError
        )
      }

      setConnection(newConnection)
      setConnectionState('Connection Setup')
      setShowConnectionSetup(false)
      setIsEditingConnection(false)
      resetConnectionForm()
    } catch (error) {
      console.error(
        'Failed to create agent connection:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to create the connection.'
      )
    } finally {
      setIsCreatingConnection(false)
    }
  }

  async function handleUpdateConnection() {
    if (!selectedAgent || !connection) {
      return
    }

    if (!validateConnectionForm()) {
      return
    }

    setIsSavingConnection(true)
    setConnectionError(null)
    setVerificationMessage(null)

    try {
      const supabase = createClient()

      const { data: updatedConnection, error } =
        await supabase
          .from('agent_connections')
          .update({
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
          })
          .eq('id', connection.id)
          .eq('agent_id', selectedAgent.id)
          .select(
            'id, status, health_status, last_connected_at, connection_type, provider, endpoint_url, environment'
          )
          .single()

      if (error || !updatedConnection) {
        throw new Error(
          error?.message ||
            'Failed to update the connection.'
        )
      }

      await supabase
        .from('agent_connection_events')
        .insert({
          organization_id:
            connection.id,
          agent_id: selectedAgent.id,
          agent_connection_id:
            connection.id,
          event_type: 'connection_updated',
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
        .then(({ error: eventError }) => {
          if (eventError) {
            console.error(
              'Connection update event could not be recorded:',
              eventError
            )
          }
        })

      setConnection(updatedConnection)
      setConnectionState('Connection Setup')
      setShowConnectionSetup(false)
      setIsEditingConnection(false)
      setVerificationMessage(
        'Connection configuration updated. Verify the connection before treating it as connected.'
      )
    } catch (error) {
      console.error(
        'Failed to update agent connection:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to update the connection.'
      )
    } finally {
      setIsSavingConnection(false)
    }
  }

  async function handleDeleteConnection() {
    if (!selectedAgent || !connection) {
      return
    }

    const confirmed = window.confirm(
      `Delete the connection configuration for "${selectedAgent.name}"?\n\nThis removes the connection record. The AI agent itself will remain registered.`
    )

    if (!confirmed) {
      return
    }

    setIsDeletingConnection(true)
    setConnectionError(null)
    setVerificationMessage(null)

    try {
      const supabase = createClient()

      const { error } =
        await supabase
          .from('agent_connections')
          .delete()
          .eq('id', connection.id)
          .eq('agent_id', selectedAgent.id)

      if (error) {
        throw new Error(
          `Could not delete the connection: ${error.message}`
        )
      }

      setConnection(null)
      setConnectionState('Registered')
      setShowConnectionSetup(false)
      setIsEditingConnection(false)
      resetConnectionForm()

      setVerificationMessage(
        'Connection deleted. The agent remains registered in Arbyter.'
      )
    } catch (error) {
      console.error(
        'Failed to delete agent connection:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to delete the connection.'
      )
    } finally {
      setIsDeletingConnection(false)
    }
  }

  async function handleDeleteAgent() {
    if (!selectedAgent) {
      return
    }

    const confirmed = window.confirm(
      `Delete "${selectedAgent.name}" permanently?\n\nThis removes the agent registration. This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setIsDeletingAgent(true)
    setConnectionError(null)

    try {
      const supabase = createClient()

      const { error } =
        await supabase
          .from('ai_agents')
          .delete()
          .eq('id', selectedAgent.id)

      if (error) {
        throw new Error(
          `Could not delete this agent. The database may contain dependent records that must be handled first.\n\n${error.message}`
        )
      }

      setAgents((current) =>
        current.filter(
          (agent) =>
            agent.id !== selectedAgent.id
        )
      )

      closeAgentModal()
    } catch (error) {
      console.error(
        'Failed to delete agent:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to delete the agent.'
      )
    } finally {
      setIsDeletingAgent(false)
    }
  }

  async function handleVerifyConnection() {
    if (!selectedAgent) {
      return
    }

    setIsVerifying(true)
    setConnectionError(null)
    setVerificationMessage(null)

    try {
      const response = await fetch(
        '/api/agents/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: selectedAgent.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Connection verification failed.'
        )
      }

      setConnectionState('Connection Setup')

      setVerificationMessage(
        data?.message ||
          'Verification attempt recorded.'
      )
    } catch (error) {
      console.error(
        'Failed to verify agent connection:',
        error
      )

      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Connection verification failed.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  async function handleCreateAgent() {
    if (!agentName.trim()) {
      setCreateError(
        'Please enter an agent name.'
      )
      return
    }

    if (!agentDescription.trim()) {
      setCreateError(
        'Please describe what this agent does.'
      )
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'You must be signed in to create an agent.'
        )
      }

      const {
        data: userRecord,
        error: userRecordError,
      } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (
        userRecordError ||
        !userRecord?.organization_id
      ) {
        throw new Error(
          'Could not determine your organization.'
        )
      }

      const {
        data: newAgent,
        error: insertError,
      } = await supabase
        .from('ai_agents')
        .insert({
          organization_id:
            userRecord.organization_id,
          name: agentName.trim(),
          description:
            agentDescription.trim(),
          agent_type: agentType,
          status: 'active',
        })
        .select(
          'id, name, description, agent_type, status, created_at'
        )
        .single()

      if (insertError || !newAgent) {
        throw new Error(
          insertError?.message ||
            'Failed to create the agent.'
        )
      }

      const normalizedAgent: Agent = {
        id: newAgent.id,
        name: newAgent.name,
        purpose:
          newAgent.description ||
          'AI agent registered in the Arbyter governance environment.',
        team:
          newAgent.agent_type ||
          'AI Operations',
        status:
          newAgent.status === 'paused'
            ? 'Paused'
            : newAgent.status ===
                'needs_review'
              ? 'Needs Review'
              : 'Active',
        risk: 'Medium',
        tasks: 0,
        lastActivity:
          'No activity recorded',
      }

      setAgents((current) => [
        normalizedAgent,
        ...current,
      ])

      resetForm()
      setShowNewAgent(false)

      window.location.reload()
    } catch (error) {
      console.error(
        'Failed to create agent:',
        error
      )

      setCreateError(
        error instanceof Error
          ? error.message
          : 'Failed to create the agent.'
      )
    } finally {
      setIsCreating(false)
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
            resetForm()
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
            Currently registered as active
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
              Critical-risk agents should be reviewed before
              continuing unrestricted operation.
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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search agents..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
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
              value={risk}
              onChange={(event) =>
                setRisk(event.target.value)
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

      {/* Agent list */}
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
                onClick={() => openAgent(agent)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={`Open ${agent.name}`}
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

      {/* Agent detail modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b p-6">
              <div>
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
                onClick={closeAgentModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Lifecycle */}
              <div>
                <div className="flex items-center justify-between">
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
                  {(
                    [
                      'Registered',
                      'Connection Setup',
                      'Connected',
                      'Verified',
                      'Healthy',
                      'Surveillance Active',
                    ] as ConnectionState[]
                  ).map((state) => {
                    const states: ConnectionState[] = [
                      'Registered',
                      'Connection Setup',
                      'Connected',
                      'Verified',
                      'Healthy',
                      'Surveillance Active',
                    ]

                    const currentIndex =
                      states.indexOf(
                        connectionState
                      )

                    const stateIndex =
                      states.indexOf(state)

                    const complete =
                      stateIndex <= currentIndex

                    const isCurrent =
                      state === connectionState

                    return (
                      <div
                        key={state}
                        className={`rounded-xl border p-3 ${
                          isCurrent
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
                  })}
                </div>
              </div>

              {/* Current state */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0" />

                  <div>
                    <p className="text-sm font-medium">
                      Current connection state
                    </p>

                    <p className="mt-1 text-sm">
                      {isLoadingConnection
                        ? 'Loading...'
                        : connectionState}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Registration is not treated as a live
                      surveillance connection.
                    </p>
                  </div>
                </div>
              </div>

              {connectionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm whitespace-pre-line text-red-700">
                  {connectionError}
                </div>
              )}

              {verificationMessage && (
                <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                  {verificationMessage}
                </div>
              )}

              {/* Registered state */}
              {connectionState === 'Registered' &&
                !showConnectionSetup && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={beginConnectionSetup}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                    >
                      <Link2 className="h-4 w-4" />
                      Connect Agent
                    </button>
                  </div>
                )}

              {/* Existing connection */}
              {connectionState !== 'Registered' &&
                !showConnectionSetup && (
                  <div className="rounded-xl border p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                        <div>
                          <p className="text-sm font-medium">
                            Connection configuration found
                          </p>

                          {connection && (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
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
                          )}

                          <p className="mt-3 text-xs text-muted-foreground">
                            The connection exists in Supabase. Run
                            verification before treating the agent
                            as connected.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={beginEditConnection}
                          disabled={
                            isDeletingConnection ||
                            isVerifying
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={
                            handleVerifyConnection
                          }
                          disabled={
                            isVerifying ||
                            isLoadingConnection ||
                            isDeletingConnection
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {isVerifying
                            ? 'Verifying...'
                            : 'Verify Connection'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <button
                        type="button"
                        onClick={
                          handleDeleteConnection
                        }
                        disabled={
                          isDeletingConnection ||
                          isVerifying
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isDeletingConnection
                          ? 'Deleting...'
                          : 'Delete Connection'}
                      </button>
                    </div>
                  </div>
                )}

              {/* Connection setup / edit */}
              {showConnectionSetup && (
                <div className="rounded-xl border p-5">
                  <div>
                    <h3 className="font-semibold">
                      {isEditingConnection
                        ? 'Edit Agent Connection'
                        : 'Connect AI Agent'}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {isEditingConnection
                        ? 'Update the connection configuration. The connection returns to setup state until it is verified again.'
                        : 'Register the real connection details. Arbyter will not claim the agent is connected until the connection is actually verified.'}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium">
                        Connection type
                      </label>

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
                            })
                          )
                        }
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium">
                        Provider
                      </label>

                      <input
                        type="text"
                        value={
                          connectionForm.provider
                        }
                        onChange={(event) =>
                          setConnectionForm(
                            (current) => ({
                              ...current,
                              provider:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="e.g. OpenAI, Anthropic, Internal"
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium">
                        Agent endpoint
                      </label>

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
                            })
                          )
                        }
                        placeholder="https://..."
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium">
                        Environment
                      </label>

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
                            })
                          )
                        }
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      This configuration step does not execute
                      requests against the endpoint. Actual
                      connector verification remains a server-side
                      operation.
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !isCreatingConnection &&
                            !isSavingConnection
                          ) {
                            setShowConnectionSetup(
                              false
                            )
                            setIsEditingConnection(
                              false
                            )

                            if (connection) {
                              setConnectionForm({
                                connectionType:
                                  connection.connection_type ||
                                  'webhook',
                                provider:
                                  connection.provider ||
                                  '',
                                endpointUrl:
                                  connection.endpoint_url ||
                                  '',
                                environment:
                                  connection.environment ||
                                  'production',
                              })
                            } else {
                              resetConnectionForm()
                            }

                            setConnectionError(null)
                          }
                        }}
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 rounded-lg border px-4 text-sm font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          isEditingConnection
                            ? handleUpdateConnection
                            : handleCreateConnection
                        }
                        disabled={
                          isCreatingConnection ||
                          isSavingConnection
                        }
                        className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isEditingConnection
                          ? isSavingConnection
                            ? 'Saving...'
                            : 'Save Changes'
                          : isCreatingConnection
                            ? 'Registering...'
                            : 'Register Connection'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger zone */}
              <div className="rounded-xl border border-red-200 p-5">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Danger zone
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Permanently remove this agent registration.
                      This does not mean surveillance data should be
                      silently destroyed or bypass governance controls.
                    </p>

                    <button
                      type="button"
                      onClick={handleDeleteAgent}
                      disabled={
                        isDeletingAgent ||
                        isDeletingConnection ||
                        isCreatingConnection ||
                        isSavingConnection ||
                        isVerifying
                      }
                      className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isDeletingAgent
                        ? 'Deleting Agent...'
                        : 'Delete Agent'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent modal */}
      {showNewAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Add AI Agent
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Register an AI agent in the Arbyter governance
                environment.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={agentName}
                onChange={(event) =>
                  setAgentName(event.target.value)
                }
                placeholder="Agent name"
                disabled={isCreating}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <textarea
                value={agentDescription}
                onChange={(event) =>
                  setAgentDescription(
                    event.target.value
                  )
                }
                placeholder="What does this agent do?"
                rows={3}
                disabled={isCreating}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              <select
                value={agentType}
                onChange={(event) =>
                  setAgentType(event.target.value)
                }
                disabled={isCreating}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                New agents are registered in Arbyter. They are
                not considered connected or under active
                surveillance until a real connection is
                configured and verified.
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
                  if (!isCreating) {
                    resetForm()
                    setShowNewAgent(false)
                  }
                }}
                disabled={isCreating}
                className="h-10 rounded-lg border px-4 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating
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