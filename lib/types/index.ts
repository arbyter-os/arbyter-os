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
