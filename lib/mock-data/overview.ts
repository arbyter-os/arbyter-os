import {
  Bot,
  FileText,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

import type {
  ActivityItem,
  AttentionItem,
  Kpi,
  SnapshotNode,
  TrendPoint,
} from '@/lib/types'

export const kpis: Kpi[] = [
  {
    id: 'agents',
    label: 'AI Agents',
    value: '42',
    delta: '+6 this month',
    tone: 'positive',
    icon: Bot,
  },
  {
    id: 'risks',
    label: 'Active Risks',
    value: '7',
    delta: '2 critical',
    tone: 'negative',
    icon: ShieldAlert,
  },
  {
    id: 'compliance',
    label: 'Compliance Coverage',
    value: '94%',
    delta: '+4.2%',
    tone: 'positive',
    icon: ShieldCheck,
  },
  {
    id: 'tasks',
    label: 'Open Tasks',
    value: '18',
    delta: '5 overdue',
    tone: 'neutral',
    icon: FileText,
  },
]

/**
 * 12 weekly points of governance telemetry. Values are percentages (0–100).
 * riskExposure trends down (good), coverage and posture trend up.
 */
export const trend: TrendPoint[] = [
  { date: 'Wk 1', riskExposure: 48, controlCoverage: 71, compliancePosture: 78 },
  { date: 'Wk 2', riskExposure: 45, controlCoverage: 73, compliancePosture: 79 },
  { date: 'Wk 3', riskExposure: 51, controlCoverage: 74, compliancePosture: 80 },
  { date: 'Wk 4', riskExposure: 43, controlCoverage: 77, compliancePosture: 82 },
  { date: 'Wk 5', riskExposure: 39, controlCoverage: 79, compliancePosture: 83 },
  { date: 'Wk 6', riskExposure: 41, controlCoverage: 80, compliancePosture: 85 },
  { date: 'Wk 7', riskExposure: 36, controlCoverage: 83, compliancePosture: 86 },
  { date: 'Wk 8', riskExposure: 33, controlCoverage: 84, compliancePosture: 88 },
  { date: 'Wk 9', riskExposure: 35, controlCoverage: 86, compliancePosture: 89 },
  { date: 'Wk 10', riskExposure: 29, controlCoverage: 88, compliancePosture: 91 },
  { date: 'Wk 11', riskExposure: 26, controlCoverage: 90, compliancePosture: 92 },
  { date: 'Wk 12', riskExposure: 23, controlCoverage: 92, compliancePosture: 94 },
]

export const attentionItems: AttentionItem[] = [
  {
    id: 'atn-1',
    severity: 'critical',
    title: 'High-risk AI system requires review',
    system: 'Credit Decisioning Model',
    meta: 'Flagged 2h ago',
  },
  {
    id: 'atn-2',
    severity: 'high',
    title: 'EU AI Act control mapping incomplete',
    system: 'Governance Framework',
    meta: '3 controls unmapped',
  },
  {
    id: 'atn-3',
    severity: 'medium',
    title: 'Hiring model documentation expires in 8 days',
    system: 'Talent Screening Agent',
    meta: 'Due Sep 15',
  },
  {
    id: 'atn-4',
    severity: 'medium',
    title: 'Agent permissions exceed current policy',
    system: 'Pricing Optimization Agent',
    meta: 'Policy drift detected',
  },
]

export const activityItems: ActivityItem[] = [
  {
    id: 'act-1',
    agent: 'Risk Analyst',
    agentRole: 'Risk',
    action: 'Reviewed pricing model exposure',
    timestamp: '12 min ago',
    status: 'completed',
  },
  {
    id: 'act-2',
    agent: 'Compliance Agent',
    agentRole: 'Compliance',
    action: 'Completed control assessment',
    timestamp: '38 min ago',
    status: 'completed',
  },
  {
    id: 'act-3',
    agent: 'Policy Monitor',
    agentRole: 'Policy',
    action: 'Detected policy conflict',
    timestamp: '1h ago',
    status: 'conflict',
  },
  {
    id: 'act-4',
    agent: 'Evidence Agent',
    agentRole: 'Evidence',
    action: 'Generated compliance evidence',
    timestamp: '2h ago',
    status: 'active',
  },
  {
    id: 'act-5',
    agent: 'Investigation Agent',
    agentRole: 'Investigate',
    action: 'Escalated a high-risk decision',
    timestamp: '3h ago',
    status: 'escalated',
  },
]

export const snapshotNodes: SnapshotNode[] = [
  {
    id: 'agents',
    label: 'Agents',
    count: 42,
    icon: Bot,
    description: 'Orchestrated AI agents',
  },
  {
    id: 'policies',
    label: 'Policies',
    count: 28,
    icon: FileText,
    description: 'Active governance policies',
  },
  {
    id: 'controls',
    label: 'Controls',
    count: 156,
    icon: SlidersHorizontal,
    description: 'Mapped operating controls',
  },
  {
    id: 'risks',
    label: 'Risks',
    count: 7,
    icon: ShieldAlert,
    description: 'Open risk exposures',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    count: 312,
    icon: ShieldCheck,
    description: 'Collected evidence records',
  },
]

export const greeting = 'Good morning'
