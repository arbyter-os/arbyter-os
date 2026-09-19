import {
  BarChart3,
  Bot,
  CheckCircle,
  FileText,
  HelpCircle,
  LayoutGrid,
  ListChecks,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ScrollText,
} from 'lucide-react'

import type { NavItem, NavSection } from '@/lib/types'

export const navSections: NavSection[] = [
  {
    label: 'Command',
    items: [
      { label: 'Overview', href: '/overview', icon: LayoutGrid },
      { label: 'AI Workforce', href: '/agents', icon: Bot },
      { label: 'Tasks', href: '/tasks', icon: ListChecks },
    ],
  },
  {
    label: 'Control',
    items: [
      { label: 'Approvals', href: '/approvals', icon: CheckCircle },
      { label: 'Policies', href: '/policies', icon: FileText },
      { label: 'Controls', href: '/controls', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Trust',
    items: [
      { label: 'Risks', href: '/risks', icon: ShieldAlert },
      { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
      { label: 'Audit', href: '/audit', icon: ScrollText },
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
