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
import {
  RangeSelector,
  type RangeValue,
} from '@/components/dashboard/range-selector'

export default function OverviewPage() {
  const [range, setRange] = React.useState<RangeValue>('30d')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        greeting={greeting}
        title="AI Governance Overview"
        description="Monitor your AI environment, manage risk, and keep governance controls under control."
        actions={<RangeSelector value={range} onChange={setRange} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

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
          <AttentionList items={attentionItems} />
        </Panel>
        <Panel
          title="Agent Activity"
          description="Recent actions across your AI agents"
          bodyClassName="pt-1"
        >
          <ActivityList items={activityItems} />
        </Panel>
      </div>

      {/* Governance snapshot */}
      <Panel
        title="Governance Snapshot"
        description="How agents, policies, controls, risks, and evidence connect"
      >
        <GovernanceSnapshot nodes={snapshotNodes} />
      </Panel>
    </div>
  )
}
