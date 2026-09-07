import type { LucideIcon } from 'lucide-react'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type Status =
  | 'healthy'
  | 'active'
  | 'pending'
  | 'review'
  | 'completed'
  | 'escalated'
  | 'conflict'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  /** Direction/tone used to color the delta chip. */
  tone: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
}

export interface TrendPoint {
  date: string
  riskExposure: number
  controlCoverage: number
  compliancePosture: number
}

export interface AttentionItem {
  id: string
  severity: Severity
  title: string
  system: string
  meta: string
}

export interface ActivityItem {
  id: string
  agent: string
  agentRole: string
  action: string
  timestamp: string
  status: Status
}

export interface SnapshotNode {
  id: string
  label: string
  count: number
  icon: LucideIcon
  description: string
}

export type RiskStatus = 'open' | 'investigating' | 'mitigated' | 'closed'

export type RiskCategory =
  | 'Fairness'
  | 'Governance'
  | 'Human Oversight'
  | 'Data Privacy'
  | 'Security'
  | 'Transparency'
  | 'Robustness'

export interface RiskControl {
  id: string
  name: string
  coverage: string
}

export interface RiskLink {
  id: string
  name: string
}

export interface RiskAgent {
  id: string
  name: string
  role: string
}

export interface RiskEvidence {
  id: string
  name: string
  date: string
}

export interface RiskActivity {
  id: string
  actor: string
  action: string
  timestamp: string
}

export interface Risk {
  id: string
  name: string
  description: string
  aiSystem: string
  category: RiskCategory
  severity: Severity
  owner: string
  status: RiskStatus
  /** Human-readable "last reviewed" label, e.g. "2 days ago". */
  lastReviewed: string
  /** Numeric days-ago used for sorting; lower = more recent. */
  lastReviewedDays: number
  detectedDate: string
  impact: string
  controls: RiskControl[]
  relatedPolicies: RiskLink[]
  relatedAgents: RiskAgent[]
  evidence: RiskEvidence[]
  activity: RiskActivity[]
}
