'use client'

import * as React from 'react'
import {
  Bot,
  FileText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

import { PageHeader } from '@/components/dashboard/page-header'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Panel } from '@/components/dashboard/panel'
import { HealthChart } from '@/components/dashboard/health-chart'
import { AttentionList } from '@/components/dashboard/attention-list'
import { ActivityList } from '@/components/dashboard/activity-list'
import { GovernanceSnapshot } from '@/components/dashboard/governance-snapshot'
import ApprovalList from '@/components/dashboard/approval-list'
import { RangeSelector, type RangeValue } from '@/components/dashboard/range-selector'
import { createClient } from '@/lib/supabase/client'
import { loadPendingApprovals } from '@/lib/approvals/client'
import type {
  ActivityItem,
  AttentionItem,
  Kpi,
  SnapshotNode,
  TrendPoint,
} from '@/lib/types'
import type { Approval } from '@/lib/approvals/types'

const RANGE_DAYS: Record<RangeValue, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

function formatRelativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function bucketTrend(
  days: number,
  activities: Array<{ created_at: string }>,
  decisions: Array<{ created_at: string; risk_level: string; approved: boolean | null }>,
  connections: Array<{ created_at: string; health_status: string }>,
): TrendPoint[] {
  const now = Date.now()
  const buckets = 12
  const bucketMs = (days * 24 * 60 * 60 * 1000) / buckets

  return Array.from({ length: buckets }, (_, index) => {
    const end = now - (buckets - 1 - index) * bucketMs
    const start = end - bucketMs
    const inBucket = <T extends { created_at: string }>(rows: T[]) =>
      rows.filter((row) => {
        const time = new Date(row.created_at).getTime()
        return time >= start && time <= end
      })

    const activityCount = inBucket(activities).length
    const bucketDecisions = inBucket(decisions)
    const risky = bucketDecisions.filter((d) => d.risk_level === 'high' || d.risk_level === 'critical').length
    const resolved = bucketDecisions.filter((d) => d.approved !== null).length
    const bucketConnections = inBucket(connections)
    const healthy = bucketConnections.filter((c) => c.health_status === 'healthy').length

    const riskExposure = Math.min(100, risky === 0 ? 0 : Math.round((risky / Math.max(bucketDecisions.length, 1)) * 100))
    const controlCoverage = bucketConnections.length
      ? Math.round((healthy / bucketConnections.length) * 100)
      : 0
    const compliancePosture = bucketDecisions.length
      ? Math.round((resolved / bucketDecisions.length) * 100)
      : activityCount > 0
        ? 100
        : 0

    return {
      date: new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      riskExposure,
      controlCoverage,
      compliancePosture,
    }
  })
}

export default function OverviewPage() {
  const [range, setRange] = React.useState<RangeValue>('30d')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [kpis, setKpis] = React.useState<Kpi[]>([])
  const [trend, setTrend] = React.useState<TrendPoint[]>([])
  const [attentionItems, setAttentionItems] = React.useState<AttentionItem[]>([])
  const [activityItems, setActivityItems] = React.useState<ActivityItem[]>([])
  const [snapshotNodes, setSnapshotNodes] = React.useState<SnapshotNode[]>([])
  const [approvals, setApprovals] = React.useState<Approval[]>([])
  const [approvalsLoading, setApprovalsLoading] = React.useState(true)

  const loadOverview = React.useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError ?? new Error('No authenticated user')

      const { data: userRecord, error: userRecordError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (userRecordError || !userRecord?.organization_id) {
        throw userRecordError ?? new Error('No organization found for user')
      }

      const organizationId = userRecord.organization_id
      const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000).toISOString()

      const [
        agentsResult,
        connectionsResult,
        decisionsResult,
        activitiesResult,
        tasksResult,
      ] = await Promise.all([
        supabase
          .from('ai_agents')
          .select('id,name,status,created_at')
          .eq('organization_id', organizationId),
        supabase
          .from('agent_connections')
          .select('agent_id,health_status,status,created_at,last_seen_at')
          .eq('organization_id', organizationId),
        supabase
          .from('agent_decisions')
          .select('id,agent_id,decision,reasoning,risk_level,approved,created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', since)
          .order('created_at', { ascending: false }),
        supabase
          .from('agent_activity')
          .select('id,agent_id,action,description,status,created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('tasks')
          .select('id,status,priority,created_at')
          .eq('organization_id', organizationId)
          .in('status', ['pending', 'running', 'blocked']),
      ])

      const firstError =
        agentsResult.error ??
        connectionsResult.error ??
        decisionsResult.error ??
        activitiesResult.error ??
        tasksResult.error

      if (firstError) throw firstError

      const agents = agentsResult.data ?? []
      const connections = connectionsResult.data ?? []
      const decisions = decisionsResult.data ?? []
      const activities = activitiesResult.data ?? []
      const tasks = tasksResult.data ?? []

      const agentMap = new Map(agents.map((agent) => [agent.id, agent.name]))
      const activeRisks = decisions.filter(
        (decision) =>
          (decision.risk_level === 'high' || decision.risk_level === 'critical') &&
          decision.approved !== true,
      ).length
      const healthyAgentIds = new Set(
        connections
          .filter((connection) => connection.health_status === 'healthy')
          .map((connection) => connection.agent_id),
      )

      setKpis([
        {
          id: 'agents',
          label: 'AI Agents',
          value: String(agents.length),
          delta: `${agents.filter((a) => a.status === 'active').length} active`,
          tone: 'positive',
          icon: Bot,
        },
        {
          id: 'risks',
          label: 'Active Risks',
          value: String(activeRisks),
          delta: `${decisions.filter((d) => d.risk_level === 'critical' && d.approved !== true).length} critical`,
          tone: activeRisks > 0 ? 'negative' : 'positive',
          icon: ShieldAlert,
        },
        {
          id: 'health',
          label: 'Healthy Agents',
          value: String(healthyAgentIds.size),
          delta: agents.length ? `${Math.round((healthyAgentIds.size / agents.length) * 100)}% of agents` : 'No agents connected',
          tone: healthyAgentIds.size === agents.length && agents.length > 0 ? 'positive' : 'neutral',
          icon: ShieldCheck,
        },
        {
          id: 'tasks',
          label: 'Open Tasks',
          value: String(tasks.length),
          delta: `${tasks.filter((task) => task.priority === 'critical' || task.priority === 'high').length} high priority`,
          tone: tasks.some((task) => task.status === 'blocked') ? 'negative' : 'neutral',
          icon: FileText,
        },
      ])

      setTrend(bucketTrend(RANGE_DAYS[range], activities, decisions, connections))

      const attention: AttentionItem[] = decisions
        .filter((decision) => decision.approved !== true && (decision.risk_level === 'high' || decision.risk_level === 'critical'))
        .slice(0, 6)
        .map((decision) => ({
          id: decision.id,
          severity: decision.risk_level as AttentionItem['severity'],
          title: decision.decision || 'High-risk decision requires review',
          system: agentMap.get(decision.agent_id) ?? 'Unknown agent',
          meta: `${decision.risk_level} risk · ${formatRelativeTime(decision.created_at)}`,
        }))

      const blockedTasks = tasks.filter((task) => task.status === 'blocked').slice(0, 3)
      for (const task of blockedTasks) {
        attention.push({
          id: task.id,
          severity: task.priority as AttentionItem['severity'],
          title: task.status === 'blocked' ? 'Task is blocked' : 'Task requires attention',
          system: 'Task system',
          meta: `${task.priority} priority`,
        })
      }
      setAttentionItems(attention.slice(0, 6))

      setActivityItems(
        activities.slice(0, 8).map((activity) => ({
          id: activity.id,
          agent: agentMap.get(activity.agent_id) ?? 'Unknown agent',
          agentRole: 'Agent',
          action: activity.description || activity.action,
          timestamp: formatRelativeTime(activity.created_at),
          status: activity.status === 'conflict' ? 'conflict' : activity.status === 'escalated' ? 'escalated' : activity.status === 'active' ? 'active' : 'completed',
        })),
      )

      setSnapshotNodes([
        { id: 'agents', label: 'Agents', count: agents.length, icon: Bot, description: 'AI agents connected to Arbyter' },
        { id: 'connections', label: 'Connections', count: connections.length, icon: SlidersHorizontal, description: 'Agent connection records' },
        { id: 'risks', label: 'Risks', count: activeRisks, icon: ShieldAlert, description: 'Unresolved high-risk decisions' },
        { id: 'tasks', label: 'Tasks', count: tasks.length, icon: FileText, description: 'Open operational tasks' },
        { id: 'activity', label: 'Activity', count: activities.length, icon: ShieldCheck, description: 'Agent actions in selected range' },
      ])
    } catch (loadError) {
      console.error('Failed to load overview:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [range])

  const loadApprovals = React.useCallback(async () => {
    try {
      setApprovalsLoading(true)
      setApprovals(await loadPendingApprovals())
    } catch (loadError) {
      console.error('Failed to load pending approvals:', loadError)
    } finally {
      setApprovalsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadOverview()
    loadApprovals()
  }, [loadOverview, loadApprovals])

  return (
    <div className="flex flex-col gap-8 pb-4">
      <PageHeader
        greeting={loading ? 'Loading' : 'Live organization view'}
        title="AI Governance Overview"
        description="Live operational data from your Arbyter organization."
        actions={<RangeSelector value={range} onChange={setRange} />}
      />

      {error ? (
        <Panel title="Overview unavailable" description={error}>
          <button
            type="button"
            onClick={loadOverview}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
        </Panel>
      ) : null}

      <section aria-label="Governance metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </section>

      {!approvalsLoading && approvals.length > 0 ? (
        <section aria-label="Pending approvals">
          <Panel
            title="Pending Approvals"
            description={`${approvals.length} ${approvals.length === 1 ? 'action' : 'actions'} require human authorization`}
            bodyClassName="pt-1"
          >
            <ApprovalList approvals={approvals} onResolved={loadApprovals} />
          </Panel>
        </section>
      ) : null}

      <section aria-label="Governance health">
        <Panel
          title="Live Risk & Control Health"
          description="Calculated from real agent connections, decisions, and activity in the selected range."
        >
          <HealthChart data={trend} />
        </Panel>
      </section>

      <section aria-label="Operational activity" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Needs Attention" description="Unresolved high-risk decisions and blocked tasks" bodyClassName="pt-1">
          <AttentionList items={attentionItems} />
        </Panel>

        <Panel title="Agent Activity" description="Recent actions recorded by your agents" bodyClassName="pt-1">
          <ActivityList items={activityItems} />
        </Panel>
      </section>

      <section aria-label="Governance snapshot">
        <Panel
          title="Live Organization Snapshot"
          description="Current agents, connections, risks, tasks, and activity from Supabase."
        >
          <GovernanceSnapshot nodes={snapshotNodes} />
        </Panel>
      </section>
    </div>
  )
}
