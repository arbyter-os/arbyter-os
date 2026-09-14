import {
  BarChart3,
  Bot,
  CheckCircle,
  FileText,
  HelpCircle,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Scale,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

import type { NavItem, NavSection } from '@/lib/types'

export const navSections: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/overview', icon: LayoutGrid },
      { label: 'Risks', href: '/risks', icon: ShieldAlert },
      { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
      { label: 'Investigate', href: '/investigate', icon: Search },
      { label: 'Audit', href: '/audit', icon: ScrollText },
      { label: 'Governance', href: '/governance', icon: Scale },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Agents', href: '/agents', icon: Bot },
      { label: 'Tasks', href: '/tasks', icon: ListChecks },
      { label: 'Approvals', href: '/approvals', icon: CheckCircle },
      { label: 'Policies', href: '/policies', icon: FileText },
      { label: 'Controls', href: '/controls', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Insights', href: '/insights', icon: Lightbulb },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
]

export const footerNav: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
]

/** Flat lookup used to resolve breadcrumb titles from a pathname. */
export const routeTitles: Record<string, string> = Object.fromEntries(
  [...navSections.flatMap((s) => s.items), ...footerNav].map((item) => [
    item.href,
    item.label,
  ]),
)