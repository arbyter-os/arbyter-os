'use client'

import { useEffect, useMemo, useState } from 'react'
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

type ConnectionRecord = {
  id: string
  status: string | null
  health_status: string | null
  last_connected_at: string | null
  connection_type: string | null
  provider: string | null
  endpoint_url: string | null
  environment: string | null
  capabilities: Record<string, boolean> | null
}

type ConnectionForm = {
  connectionType: 'webhook' | 'api' | 'sdk' | 'mcp'
  provider: string
  endpointUrl: string
  environment: 'production' | 'staging' | 'development'
  authenticationMethod: 'api_key' | 'oauth' | 'none'
  credentialLabel: string
  webhookSecretLabel: string
  mcpTransport: 'http' | 'sse' | 'stdio'
  sdkPackage: string
  capabilities: {
    messagesSend: boolean
    messagesRead: boolean
    messagesReply: boolean
  }
}

const supabase = createClient()

const emptyConnectionForm: ConnectionForm = {
  connectionType: 'api',
  provider: '',
  endpointUrl: '',
  environment: 'production',
  authenticationMethod: 'api_key',
  credentialLabel: '',
  webhookSecretLabel: '',
  mcpTransport: 'http',
  sdkPackage: '',
  capabilities: {
    messagesSend: false,
    messagesRead: false,
    messagesReply: false,
  },
}

function getStatusClasses(status: AgentStatus) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'Paused':
      return 'bg-muted text-muted-foreground'
    case 'Needs Review':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }
}

function getRiskClasses(risk: RiskLevel) {
  switch (risk) {
    case 'Low':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'Medium':
      return 'text-amber-600 dark:text-amber-400'
    case 'High':
      return 'text-orange-600 dark:text-orange-400'
    case 'Critical':
      return 'text-red-600 dark:text-red-400'
  }
}

function getConnectionState(
  connection: ConnectionRecord | null,
  verified: boolean
) {
  if (!connection) return 'Registered'

  if (
    connection.health_status === 'healthy' &&
    verified
  ) {
    return 'Healthy'
  }

  if (verified) return 'Verified'

  if (
    connection.status === 'connected' ||
    connection.last_connected_at
  ) {
    return 'Connected'
  }

  return 'Connection Setup'
}

function formatDate(value: string | null) {
  if (!value) return 'Never'

  try {
    return new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | AgentStatus>('All')
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All')

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  const [connection, setConnection] = useState<ConnectionRecord | null>(null)
  const [verified, setVerified] = useState(false)
  const [connectionState, setConnectionState] = useState('Registered')
  const [loadingConnection, setLoadingConnection] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [editingConnection, setEditingConnection] = useState(false)

  const [connectionForm, setConnectionForm] =
    useState<ConnectionForm>(emptyConnectionForm)

  const [message, setMessage] = useState<string | null>(null)

  const [showAddAgent, setShowAddAgent] = useState(false)
  const [creatingAgent, setCreatingAgent] = useState(false)

  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentPurpose, setNewAgentPurpose] = useState('')
  const [newAgentType, setNewAgentType] = useState('general')
  const [newAgentTeam, setNewAgentTeam] = useState('')

  const [deletingAgent, setDeletingAgent] = useState(false)

  async function loadAgents() {
    setLoadingAgents(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in to view agents.')
        setAgents([])
        return
      }

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) throw userError

      if (!userRecord?.organization_id) {
        setError('No organization is associated with your account.')
        setAgents([])
        return
      }

      const { data, error: agentsError } = await supabase
        .from('ai_agents')
        .select(
          'id, name, description, agent_type, status, created_at'
        )
        .eq('organization_id', userRecord.organization_id)
        .order('created_at', { ascending: false })

      if (agentsError) throw agentsError

      const mappedAgents: Agent[] = (data ?? []).map((agent) => {
        const rawStatus = String(agent.status ?? 'active').toLowerCase()

        let status: AgentStatus = 'Active'

        if (rawStatus === 'paused' || rawStatus === 'inactive') {
          status = 'Paused'
        } else if (
          rawStatus === 'needs_review' ||
          rawStatus === 'review'
        ) {
          status = 'Needs Review'
        }

        return {
          id: agent.id,
          name: agent.name,
          purpose: agent.description ?? 'No purpose specified',
          team: agent.agent_type ?? 'General',
          status,
          risk: 'Low',
          tasks: 0,
          lastActivity: agent.created_at
            ? formatDate(agent.created_at)
            : 'Never',
        }
      })

      setAgents(mappedAgents)
    } catch (err) {
      console.error('Failed to load agents:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load agents.'
      )
    } finally {
      setLoadingAgents(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadConnection(agentId: string) {
    setLoadingConnection(true)
    setConnectionError(null)

    try {
      const { data, error: connectionError } = await supabase
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
            environment,
            capabilities
          `
        )
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (connectionError) throw connectionError

      const { data: identity, error: identityError } =
        await supabase
          .from('agent_identities')
          .select('verified')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

      if (identityError) {
        console.warn('Unable to load agent identity:', identityError)
      }

      const nextConnection = data as ConnectionRecord | null
      const nextVerified = Boolean(identity?.verified)

      setConnection(nextConnection)
      setVerified(nextVerified)
      setConnectionState(
        getConnectionState(nextConnection, nextVerified)
      )

      if (nextConnection) {
        const capabilities = nextConnection.capabilities ?? {}

        setConnectionForm({
          connectionType:
            nextConnection.connection_type === 'webhook' ||
            nextConnection.connection_type === 'sdk' ||
            nextConnection.connection_type === 'mcp'
              ? nextConnection.connection_type
              : 'api',

          provider: nextConnection.provider ?? '',
          endpointUrl: nextConnection.endpoint_url ?? '',

          environment:
            nextConnection.environment === 'staging' ||
            nextConnection.environment === 'development'
              ? nextConnection.environment
              : 'production',

          authenticationMethod: 'api_key',
          credentialLabel: '',
          webhookSecretLabel: '',
          mcpTransport: 'http',
          sdkPackage: '',

          capabilities: {
            messagesSend: Boolean(capabilities['messages.send']),
            messagesRead: Boolean(capabilities['messages.read']),
            messagesReply: Boolean(capabilities['messages.reply']),
          },
        })
      } else {
        setConnectionForm(emptyConnectionForm)
      }
    } catch (err) {
      console.error('Failed to load connection:', err)

      setConnectionError(
        err instanceof Error
          ? err.message
          : 'Failed to load connection.'
      )
    } finally {
      setLoadingConnection(false)
    }
  }

  function openAgent(agent: Agent) {
    // Open immediately. Connection data loads after the panel is visible.
    setSelectedAgent(agent)
    setShowAgentPanel(true)

    setConnection(null)
    setVerified(false)
    setConnectionState('Registered')
    setLoadingConnection(true)

    setShowConnectionForm(false)
    setEditingConnection(false)

    setConnectionError(null)
    setMessage(null)

    void loadConnection(agent.id)
  }

  function closeAgentPanel() {
    setShowAgentPanel(false)

    window.setTimeout(() => {
      setSelectedAgent(null)
      setConnection(null)
      setConnectionError(null)
      setMessage(null)
    }, 180)
  }

  function startNewConnection() {
    setEditingConnection(false)

    setConnectionForm({
      ...emptyConnectionForm,
      capabilities: {
        messagesSend: false,
        messagesRead: false,
        messagesReply: false,
      },
    })

    setShowConnectionForm(true)
    setMessage(null)
    setConnectionError(null)
  }

  function startEditConnection() {
    if (!connection) return

    setEditingConnection(true)
    setShowConnectionForm(true)
    setMessage(null)
    setConnectionError(null)
  }

  function updateCapability(
    capability:
      | 'messagesSend'
      | 'messagesRead'
      | 'messagesReply',
    value: boolean
  ) {
    setConnectionForm((current) => ({
      ...current,
      capabilities: {
        ...current.capabilities,
        [capability]: value,
      },
    }))
  }

  async function saveConnection() {
    if (!selectedAgent) return

    setMessage(null)
    setConnectionError(null)

    if (!connectionForm.provider.trim()) {
      setConnectionError('Provider is required.')
      return
    }

    if (
      connectionForm.connectionType !== 'sdk' &&
      connectionForm.connectionType !== 'mcp' &&
      !connectionForm.endpointUrl.trim()
    ) {
      setConnectionError('Endpoint URL is required.')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setConnectionError('You must be signed in.')
        return
      }

      const { data: userRecord, error: userError } =
        await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle()

      if (userError) throw userError

      if (!userRecord?.organization_id) {
        setConnectionError(
          'No organization is associated with your account.'
        )
        return
      }

      const capabilities = {
        'messages.send':
          connectionForm.capabilities.messagesSend,
        'messages.read':
          connectionForm.capabilities.messagesRead,
        'messages.reply':
          connectionForm.capabilities.messagesReply,
      }

      const configuration = {
        authentication_method:
          connectionForm.authenticationMethod,
        ...(connectionForm.credentialLabel
          ? {
              credential_label:
                connectionForm.credentialLabel,
            }
          : {}),
        ...(connectionForm.webhookSecretLabel
          ? {
              webhook_secret_label:
                connectionForm.webhookSecretLabel,
            }
          : {}),
        ...(connectionForm.mcpTransport
          ? {
              mcp_transport: connectionForm.mcpTransport,
            }
          : {}),
        ...(connectionForm.sdkPackage
          ? {
              sdk_package: connectionForm.sdkPackage,
            }
          : {}),
      }

      if (editingConnection && connection) {
        const { error: updateError } = await supabase
          .from('agent_connections')
          .update({
            connection_type:
              connectionForm.connectionType,
            provider: connectionForm.provider.trim(),
            endpoint_url:
              connectionForm.endpointUrl.trim() || null,
            environment: connectionForm.environment,
            configuration,
            capabilities,
          })
          .eq('id', connection.id)
          .eq('agent_id', selectedAgent.id)
          .eq(
            'organization_id',
            userRecord.organization_id
          )

        if (updateError) throw updateError

        await supabase
          .from('agent_connection_events')
          .insert({
            organization_id: userRecord.organization_id,
            agent_id: selectedAgent.id,
            connection_id: connection.id,
            event_type: 'connected',
            metadata: {
              source: 'agents_ui',
              action: 'updated',
            },
          })

        setMessage('Connection updated successfully.')
      } else {
        const { data: newConnection, error: insertError } =
          await supabase
            .from('agent_connections')
            .insert({
              organization_id: userRecord.organization_id,
              agent_id: selectedAgent.id,
              connection_type:
                connectionForm.connectionType,
              provider:
                connectionForm.provider.trim(),
              endpoint_url:
                connectionForm.endpointUrl.trim() || null,
              environment: connectionForm.environment,
              status: 'pending',
              configuration,
              capabilities,
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
                environment,
                capabilities
              `
            )
            .single()

        if (insertError) throw insertError

        await supabase
          .from('agent_connection_events')
          .insert({
            organization_id: userRecord.organization_id,
            agent_id: selectedAgent.id,
            agent_connection_id: newConnection.id,
            event_type: 'created',
            metadata: {
              source: 'agents_ui',
            },
          })

        setMessage('Connection created successfully.')
      }

      setShowConnectionForm(false)
      setEditingConnection(false)

      await loadConnection(selectedAgent.id)
    } catch (err) {
      console.error('Failed to save connection:', err)

      setConnectionError(
        err instanceof Error
          ? err.message
          : 'Failed to save connection.'
      )
    }
  }

  async function deleteConnection() {
    if (!connection || !selectedAgent) return

    const confirmed = window.confirm(
      'Remove this agent connection?'
    )

    if (!confirmed) return

    setMessage(null)
    setConnectionError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setConnectionError('You must be signed in.')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userRecord?.organization_id) {
        setConnectionError(
          'No organization is associated with your account.'
        )
        return
      }

      const { error } = await supabase
        .from('agent_connections')
        .delete()
        .eq('id', connection.id)
        .eq('agent_id', selectedAgent.id)
        .eq(
          'organization_id',
          userRecord.organization_id
        )

      if (error) throw error

      setConnection(null)
      setVerified(false)
      setConnectionState('Registered')
      setShowConnectionForm(false)
      setEditingConnection(false)

      setMessage('Connection removed.')
    } catch (err) {
      console.error('Failed to delete connection:', err)

      setConnectionError(
        err instanceof Error
          ? err.message
          : 'Failed to remove connection.'
      )
    }
  }

  async function verifyConnection() {
    if (!selectedAgent || !connection) return

    setMessage(null)
    setConnectionError(null)

    try {
      const response = await fetch('/api/agents/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          connectionId: connection.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Verification failed.'
        )
      }

      setMessage(
        data?.message ||
          'Connection verified successfully.'
      )

      await loadConnection(selectedAgent.id)
    } catch (err) {
      console.error('Verification failed:', err)

      setConnectionError(
        err instanceof Error
          ? err.message
          : 'Verification failed.'
      )
    }
  }

  async function createAgent() {
    if (!newAgentName.trim()) return

    setCreatingAgent(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in to create an agent.')
        return
      }

      const { data: userRecord, error: userError } =
        await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle()

      if (userError) throw userError

      if (!userRecord?.organization_id) {
        setError(
          'No organization is associated with your account.'
        )
        return
      }

      const { data, error: insertError } =
        await supabase
          .from('ai_agents')
          .insert({
            organization_id: userRecord.organization_id,
            name: newAgentName.trim(),
            description:
              newAgentPurpose.trim() || null,
            agent_type:
              newAgentType.trim() || 'general',
            status: 'active',
          })
          .select(
            'id, name, description, agent_type, status, created_at'
          )
          .single()

      if (insertError) throw insertError

      const newAgent: Agent = {
        id: data.id,
        name: data.name,
        purpose:
          data.description ?? 'No purpose specified',
        team: data.agent_type ?? 'General',
        status: 'Active',
        risk: 'Low',
        tasks: 0,
        lastActivity: data.created_at
          ? formatDate(data.created_at)
          : 'Never',
      }

      setAgents((current) => [
        newAgent,
        ...current,
      ])

      setNewAgentName('')
      setNewAgentPurpose('')
      setNewAgentType('general')
      setNewAgentTeam('')
      setShowAddAgent(false)

      openAgent(newAgent)
    } catch (err) {
      console.error('Failed to create agent:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create agent.'
      )
    } finally {
      setCreatingAgent(false)
    }
  }

  async function deleteAgent() {
    if (!selectedAgent) return

    const confirmed = window.confirm(
      `Delete "${selectedAgent.name}"? This cannot be undone.`
    )

    if (!confirmed) return

    setDeletingAgent(true)
    setConnectionError(null)
    setMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setConnectionError('You must be signed in.')
        return
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userRecord?.organization_id) {
        setConnectionError(
          'No organization is associated with your account.'
        )
        return
      }

      const { error: deleteError } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', selectedAgent.id)
        .eq(
          'organization_id',
          userRecord.organization_id
        )

      if (deleteError) throw deleteError

      setAgents((current) =>
        current.filter(
          (agent) => agent.id !== selectedAgent.id
        )
      )

      closeAgentPanel()
    } catch (err) {
      console.error('Failed to delete agent:', err)

      setConnectionError(
        err instanceof Error
          ? err.message
          : 'Failed to delete agent.'
      )
    } finally {
      setDeletingAgent(false)
    }
  }

  const filteredAgents = useMemo(() => {
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

  const activeCount = agents.filter(
    (agent) => agent.status === 'Active'
  ).length

  const reviewCount = agents.filter(
    (agent) => agent.status === 'Needs Review'
  ).length

  const taskCount = agents.reduce(
    (total, agent) => total + agent.tasks,
    0
  )

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              AI Environment
            </div>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Agents
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage AI agents, connections, permissions,
              and operational state.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAgent(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:opacity-90 active:scale-[0.98]"
          >
            <span className="mr-2 text-lg leading-none">
              +
            </span>
            Add Agent
          </button>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Agents"
            value={agents.length}
          />

          <SummaryCard
            label="Active"
            value={activeCount}
          />

          <SummaryCard
            label="Needs Review"
            value={reviewCount}
          />

          <SummaryCard
            label="Tasks Executed"
            value={taskCount}
          />
        </div>

        {/* Notice */}
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
              !
            </div>

            <div>
              <p className="text-sm font-medium">
                Agent governance is active
              </p>

              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Connections, verification, health, and
                capabilities are managed through Arbyter.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search agents..."
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'All'
                    | AgentStatus
                )
              }
              className="h-10 rounded-xl border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Needs Review">
                Needs Review
              </option>
            </select>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value as
                    | 'All'
                    | RiskLevel
                )
              }
              className="h-10 rounded-xl border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All Risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Agent inventory */}
        <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="text-sm font-semibold">
              Agent Inventory
            </div>

            <div className="mt-0.5 text-xs text-muted-foreground">
              {filteredAgents.length} agent
              {filteredAgents.length === 1 ? '' : 's'}
            </div>
          </div>

          {loadingAgents ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                AI
              </div>

              <p className="mt-4 text-sm font-medium">
                No agents found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing your filters or create a new
                agent.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => openAgent(agent)}
                  aria-label={`Open ${agent.name}`}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition duration-150 hover:bg-muted/40 active:bg-muted/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-sm font-semibold">
                    {agent.name
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {agent.name}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(
                          agent.status
                        )}`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{agent.team}</span>
                      <span>{agent.tasks} tasks</span>
                      <span>
                        Risk:{' '}
                        <span
                          className={getRiskClasses(
                            agent.risk
                          )}
                        >
                          {agent.risk}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="text-xs text-muted-foreground">
                      Last activity
                    </div>
                    <div className="mt-1 text-xs font-medium">
                      {agent.lastActivity}
                    </div>
                  </div>

                  <div className="ml-1 text-xl text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5">
                    ›
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent detail side panel */}
      {showAgentPanel && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close agent panel"
            onClick={closeAgentPanel}
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-150"
          />

          <aside
            className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedAgent
                ? `${selectedAgent.name} details`
                : 'Agent details'
            }
          >
            {/* Panel header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </div>

                <h2 className="mt-0.5 truncate text-lg font-semibold">
                  {selectedAgent?.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAgentPanel}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background text-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Panel body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {selectedAgent && (
                <div className="space-y-6 p-5">
                  {/* Agent overview */}
                  <section>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-muted/40 text-lg font-semibold">
                        {selectedAgent.name
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">
                            {selectedAgent.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              selectedAgent.status
                            )}`}
                          >
                            {selectedAgent.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedAgent.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <InfoCard
                        label="Team"
                        value={selectedAgent.team}
                      />

                      <InfoCard
                        label="Risk"
                        value={selectedAgent.risk}
                      />

                      <InfoCard
                        label="Tasks"
                        value={String(
                          selectedAgent.tasks
                        )}
                      />

                      <InfoCard
                        label="Last Activity"
                        value={selectedAgent.lastActivity}
                      />
                    </div>
                  </section>

                  {/* Connection */}
                  <section className="rounded-2xl border bg-card">
                    <div className="border-b px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Connection
                          </h3>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Connect this agent to its execution
                            environment.
                          </p>
                        </div>

                        <ConnectionStateBadge
                          state={connectionState}
                        />
                      </div>
                    </div>

                    <div className="p-4">
                      {loadingConnection ? (
                        <div className="space-y-3">
                          <div className="h-12 animate-pulse rounded-xl bg-muted" />
                          <div className="h-20 animate-pulse rounded-xl bg-muted" />
                        </div>
                      ) : connectionError ? (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                          {connectionError}
                        </div>
                      ) : showConnectionForm ? (
                        <div className="space-y-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Connection Type">
                              <select
                                value={
                                  connectionForm.connectionType
                                }
                                onChange={(event) =>
                                  setConnectionForm(
                                    (current) => ({
                                      ...current,
                                      connectionType:
                                        event.target.value as ConnectionForm['connectionType'],
                                    })
                                  )
                                }
                                className="form-control"
                              >
                                <option value="api">
                                  REST API
                                </option>
                                <option value="webhook">
                                  Webhook
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
                                    })
                                  )
                                }
                                placeholder="e.g. agentmail"
                                className="form-control"
                              />
                            </FormField>
                          </div>

                          {connectionForm.connectionType !==
                            'sdk' &&
                            connectionForm.connectionType !==
                              'mcp' && (
                              <FormField label="Endpoint URL">
                                <input
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
                                  className="form-control"
                                />
                              </FormField>
                            )}

                          <div className="grid gap-4 sm:grid-cols-2">
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
                                        event.target.value as ConnectionForm['environment'],
                                    })
                                  )
                                }
                                className="form-control"
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

                            <FormField label="Authentication">
                              <select
                                value={
                                  connectionForm.authenticationMethod
                                }
                                onChange={(event) =>
                                  setConnectionForm(
                                    (current) => ({
                                      ...current,
                                      authenticationMethod:
                                        event.target.value as ConnectionForm['authenticationMethod'],
                                    })
                                  )
                                }
                                className="form-control"
                              >
                                <option value="api_key">
                                  API Key
                                </option>
                                <option value="oauth">
                                  OAuth
                                </option>
                                <option value="none">
                                  None
                                </option>
                              </select>
                            </FormField>
                          </div>

                          <FormField label="Credential Label">
                            <input
                              value={
                                connectionForm.credentialLabel
                              }
                              onChange={(event) =>
                                setConnectionForm(
                                  (current) => ({
                                    ...current,
                                    credentialLabel:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Optional label only — never enter the secret here"
                              className="form-control"
                            />
                          </FormField>

                          {/* Capabilities */}
                          <div className="rounded-2xl border bg-muted/20 p-4">
                            <div>
                              <h4 className="text-sm font-semibold">
                                Capabilities
                              </h4>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Choose what this connection is
                                allowed to execute.
                              </p>
                            </div>

                            <div className="mt-4 space-y-2">
                              <CapabilityRow
                                title="Send messages"
                                description="Allow the agent to send outbound messages."
                                checked={
                                  connectionForm.capabilities
                                    .messagesSend
                                }
                                onChange={(value) =>
                                  updateCapability(
                                    'messagesSend',
                                    value
                                  )
                                }
                                available
                              />

                              <CapabilityRow
                                title="Read messages"
                                description="Read incoming messages and mailbox data."
                                checked={
                                  connectionForm.capabilities
                                    .messagesRead
                                }
                                onChange={() => {}}
                                comingSoon
                              />

                              <CapabilityRow
                                title="Reply to messages"
                                description="Reply to an existing message thread."
                                checked={
                                  connectionForm.capabilities
                                    .messagesReply
                                }
                                onChange={() => {}}
                                comingSoon
                              />
                            </div>
                          </div>

                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowConnectionForm(false)
                                setEditingConnection(false)
                              }}
                              className="h-10 rounded-xl border px-4 text-sm font-medium transition hover:bg-muted"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={saveConnection}
                              className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
                            >
                              {editingConnection
                                ? 'Save Changes'
                                : 'Create Connection'}
                            </button>
                          </div>
                        </div>
                      ) : connection ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border bg-muted/20 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <DetailItem
                                label="Provider"
                                value={
                                  connection.provider ||
                                  'Not specified'
                                }
                              />

                              <DetailItem
                                label="Type"
                                value={
                                  connection.connection_type ||
                                  'Not specified'
                                }
                              />

                              <DetailItem
                                label="Environment"
                                value={
                                  connection.environment ||
                                  'Not specified'
                                }
                              />

                              <DetailItem
                                label="Health"
                                value={
                                  connection.health_status ||
                                  'Unknown'
                                }
                              />
                            </div>

                            {connection.endpoint_url && (
                              <div className="mt-4 border-t pt-4">
                                <DetailItem
                                  label="Endpoint"
                                  value={
                                    connection.endpoint_url
                                  }
                                />
                              </div>
                            )}
                          </div>

                          <div className="rounded-xl border bg-muted/20 p-4">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Capabilities
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <CapabilityPill
                                label="Send messages"
                                enabled={Boolean(
                                  connection.capabilities?.[
                                    'messages.send'
                                  ]
                                )}
                              />

                              <CapabilityPill
                                label="Read messages"
                                enabled={false}
                                comingSoon
                              />

                              <CapabilityPill
                                label="Reply to messages"
                                enabled={false}
                                comingSoon
                              />
                            </div>
                          </div>

                          {message && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
                              {message}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={verifyConnection}
                              className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
                            >
                              Verify Connection
                            </button>

                            <button
                              type="button"
                              onClick={startEditConnection}
                              className="h-10 rounded-xl border px-4 text-sm font-medium transition hover:bg-muted"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={deleteConnection}
                              className="h-10 rounded-xl border border-red-500/20 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/5 dark:text-red-400"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last connected:{' '}
                            {formatDate(
                              connection.last_connected_at
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed p-6 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-xs font-semibold">
                            API
                          </div>

                          <p className="mt-3 text-sm font-medium">
                            No connection configured
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Connect this agent to an external
                            service or execution environment.
                          </p>

                          <button
                            type="button"
                            onClick={startNewConnection}
                            className="mt-4 h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
                          >
                            Set Up Connection
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Lifecycle */}
                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold">
                        Connection Lifecycle
                      </h3>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Current operational state of this agent.
                      </p>
                    </div>

                    <Lifecycle
                      currentState={connectionState}
                    />
                  </section>

                  {/* Danger zone */}
                  <section className="rounded-2xl border border-red-500/15 bg-red-500/[0.02] p-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Danger Zone
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Permanently remove this agent from the
                        organization.
                      </p>
                    </div>

                    {connectionError && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
                        {connectionError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={deleteAgent}
                      disabled={deletingAgent}
                      className="mt-4 h-10 rounded-xl border border-red-500/20 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/5 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
                    >
                      {deletingAgent
                        ? 'Deleting...'
                        : 'Delete Agent'}
                    </button>
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Add agent modal */}
      {showAddAgent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close add agent dialog"
            onClick={() => setShowAddAgent(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-150"
          />

          <div
            className="relative w-full max-w-lg rounded-2xl border bg-background shadow-2xl animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-label="Add Agent"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">
                  Add Agent
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Register a new AI agent in Arbyter.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAgent(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-lg text-muted-foreground transition hover:bg-muted"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-5">
              <FormField label="Agent Name">
                <input
                  value={newAgentName}
                  onChange={(event) =>
                    setNewAgentName(event.target.value)
                  }
                  placeholder="e.g. Research Agent"
                  className="form-control"
                  autoFocus
                />
              </FormField>

              <FormField label="Purpose">
                <textarea
                  value={newAgentPurpose}
                  onChange={(event) =>
                    setNewAgentPurpose(event.target.value)
                  }
                  placeholder="What is this agent responsible for?"
                  rows={3}
                  className="form-control resize-none py-2.5"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Agent Type">
                  <input
                    value={newAgentType}
                    onChange={(event) =>
                      setNewAgentType(event.target.value)
                    }
                    placeholder="general"
                    className="form-control"
                  />
                </FormField>

                <FormField label="Team">
                  <input
                    value={newAgentTeam}
                    onChange={(event) =>
                      setNewAgentTeam(event.target.value)
                    }
                    placeholder="Optional"
                    className="form-control"
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddAgent(false)}
                  className="h-10 rounded-xl border px-4 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={createAgent}
                  disabled={
                    creatingAgent ||
                    !newAgentName.trim()
                  }
                  className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingAgent
                    ? 'Creating...'
                    : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border bg-muted/20 px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-medium">
        {value}
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 break-all text-sm font-medium">
        {value}
      </div>
    </div>
  )
}

function ConnectionStateBadge({
  state,
}: {
  state: string
}) {
  const healthy = state === 'Healthy'
  const verified = state === 'Verified'
  const connected = state === 'Connected'

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        healthy
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : verified
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : connected
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
      }`}
    >
      {state}
    </span>
  )
}

function CapabilityRow({
  title,
  description,
  checked,
  onChange,
  available,
  comingSoon,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  available?: boolean
  comingSoon?: boolean
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        comingSoon
          ? 'cursor-default opacity-60'
          : 'cursor-pointer hover:bg-background'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={comingSoon}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {title}
          </span>

          {available && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Available
            </span>
          )}

          {comingSoon && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming soon
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </label>
  )
}

function CapabilityPill({
  label,
  enabled,
  comingSoon,
}: {
  label: string
  enabled: boolean
  comingSoon?: boolean
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        comingSoon
          ? 'bg-muted text-muted-foreground'
          : enabled
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {label}
      {comingSoon
        ? ' · Coming soon'
        : enabled
          ? ' · Enabled'
          : ' · Disabled'}
    </span>
  )
}

function Lifecycle({
  currentState,
}: {
  currentState: string
}) {
  const states = [
    'Registered',
    'Connection Setup',
    'Connected',
    'Verified',
    'Healthy',
    'Surveillance Active',
  ]

  const currentIndex = Math.max(
    states.indexOf(currentState),
    0
  )

  return (
    <div className="space-y-2">
      {states.map((state, index) => {
        const completed = index <= currentIndex
        const current = state === currentState

        return (
          <div
            key={state}
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
              current
                ? 'border-foreground/15 bg-muted/40'
                : 'border-transparent'
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                completed
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {completed ? '✓' : index + 1}
            </div>

            <div className="flex-1">
              <div className="text-sm font-medium">
                {state}
              </div>

              {current && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Current state
                </div>
              )}
            </div>
          </div>
        )
      })}
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
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
      </label>

      {children}
    </div>
  )
}
