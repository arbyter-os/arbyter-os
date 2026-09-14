'use client'

import * as React from 'react'

import {
  activityItems,
  attentionItems,
  greeting,
  kpis,
  snapshotNodes,
  trend,
} from '@/lib/mock-data/overview'
import { PageHeader } from '@/components/dashboard/page-header'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Panel } from '@/components/dashboard/panel'
import { HealthChart } from '@/components/dashboard/health-chart'
import { AttentionList } from '@/components/dashboard/attention-list'
import { ActivityList } from '@/components/dashboard/activity-list'
import { GovernanceSnapshot } from '@/components/dashboard/governance-snapshot'
import ApprovalList from '@/components/dashboard/approval-list'
import {
  RangeSelector,
  type RangeValue,
} from '@/components/dashboard/range-selector'
import { createClient } from '@/lib/supabase/client'
import { loadPendingApprovals } from '@/lib/approvals/client'
import type { Approval } from '@/lib/approvals/types'

export default function OverviewPage() {
  const [range, setRange] =
    React.useState<RangeValue>('30d')

  const [agentCount, setAgentCount] =
    React.useState<number>(0)

  const [approvals, setApprovals] =
    React.useState<Approval[]>([])

  const [approvalsLoading, setApprovalsLoading] =
    React.useState(true)

  React.useEffect(() => {
    async function loadAgentCount() {
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error(
          'Failed to get current user:',
          userError
        )
        return
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
        console.error(
          'Failed to get user organization:',
          userRecordError
        )
        return
      }

      const {
        count,
        error: agentsError,
      } = await supabase
        .from('ai_agents')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq(
          'organization_id',
          userRecord.organization_id
        )

      if (agentsError) {
        console.error(
          'Failed to load agent count:',
          agentsError
        )
        return
      }

      setAgentCount(count ?? 0)
    }

    loadAgentCount()
  }, [])

  async function loadApprovals() {
    try {
      setApprovalsLoading(true)

      const pending =
        await loadPendingApprovals()

      setApprovals(pending)
    } catch (error) {
      console.error(
        'Failed to load pending approvals:',
        error
      )
    } finally {
      setApprovalsLoading(false)
    }
  }

  React.useEffect(() => {
    loadApprovals()
  }, [])

  const liveKpis = React.useMemo(() => {
    return kpis.map((kpi) =>
      kpi.id === 'agents'
        ? {
            ...kpi,
            value: String(agentCount),
            delta: `${
              agentCount === 1
                ? '1 agent'
                : `${agentCount} agents`
            } in your organization`,
          }
        : kpi
    )
  }, [agentCount])

  const liveSnapshotNodes =
    React.useMemo(() => {
      return snapshotNodes.map((node) =>
        node.id === 'agents'
          ? {
              ...node,
              count: agentCount,
            }
          : node
      )
    }, [agentCount])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        greeting={greeting}
        title="AI Governance Overview"
        description="Monitor your AI environment, manage risk, and keep governance controls under control."
        actions={
          <RangeSelector
            value={range}
            onChange={setRange}
          />
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveKpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            kpi={kpi}
          />
        ))}
      </div>

      {/* Pending approvals */}
      {!approvalsLoading &&
        approvals.length > 0 && (
          <Panel
            title="Pending Approvals"
            description={`${approvals.length} ${
              approvals.length === 1
                ? 'action'
                : 'actions'
            } require human authorization`}
            bodyClassName="pt-1"
          >
            <ApprovalList
              approvals={approvals}
              onResolved={loadApprovals}
            />
          </Panel>
        )}

      {/* Governance health */}
      <Panel
        title="AI Risk & Control Health"
        description="Risk exposure, control coverage, and compliance posture over time"
      >
        <HealthChart data={trend} />
      </Panel>

      {/* Attention + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Needs Attention"
          description="Issues requiring governance review"
          bodyClassName="pt-1"
        >
          <AttentionList
            items={attentionItems}
          />
        </Panel>

        <Panel
          title="Agent Activity"
          description="Recent actions across your AI agents"
          bodyClassName="pt-1"
        >
          <ActivityList
            items={activityItems}
          />
        </Panel>
      </div>

      {/* Governance snapshot */}
      <Panel
        title="Governance Snapshot"
        description="How agents, policies, controls, risks, and evidence connect"
      >
        <GovernanceSnapshot
          nodes={liveSnapshotNodes}
        />
      </Panel>
    </div>
  )
}