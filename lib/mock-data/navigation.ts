import {
  Bot,
  LayoutGrid,
  Settings,
  Plug,
} from 'lucide-react'

import type { NavItem, NavSection } from '@/lib/types'

export const navSections: NavSection[] = [
  {
    label: 'Arbyter',
    items: [
      { label: 'Overview', href: '/overview', icon: LayoutGrid },
      { label: 'AI Workforce', href: '/agents', icon: Bot },
      { label: 'Connections', href: '/connections', icon: Plug },
    ],
  },
]

export const footerNav: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
]

/** Flat lookup used to resolve breadcrumb titles from a pathname. */
export const routeTitles: Record<string, string> = Object.fromEntries(
  [...navSections.flatMap((s) => s.items), ...footerNav].map((item) => [
    item.href,
    item.label,
  ]),
)
