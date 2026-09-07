'use client'

import { usePathname } from 'next/navigation'
import {
  Bell,
  Check,
  ChevronsUpDown,
  LogOut,
  type LucideIcon,
  Menu as MenuIcon,
  PanelLeft,
  Search,
  Settings,
  User,
} from 'lucide-react'

import { routeTitles } from '@/lib/mock-data/navigation'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'

const workspaces = ['Acme Global', 'Acme EU', 'Acme Labs']

const notifications: { title: string; meta: string; icon: LucideIcon }[] = [
  { title: 'Credit model flagged high-risk', meta: '2h ago', icon: Bell },
  { title: 'Control assessment completed', meta: '38m ago', icon: Check },
  { title: 'Policy conflict detected', meta: '1h ago', icon: Bell },
]

export function TopBar({
  onToggleCollapse,
  onOpenMobile,
}: {
  onToggleCollapse: () => void
  onOpenMobile: () => void
}) {
  const pathname = usePathname()
  const current = routeTitles[pathname] ?? 'Overview'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className="hidden size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <PanelLeft className="size-[1.15rem]" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-muted-foreground sm:block">Arbyter OS</li>
          <li className="hidden text-muted-foreground/40 sm:block" aria-hidden>
            /
          </li>
          <li className="truncate font-semibold text-foreground">{current}</li>
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Global search */}
        <button
          type="button"
          className="hidden h-9 w-56 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 md:flex xl:w-72"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Search className="size-[1.15rem]" />
        </button>

        {/* Notifications */}
        <Menu>
          <MenuTrigger
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          >
            <Bell className="size-[1.15rem]" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-background" />
          </MenuTrigger>
          <MenuContent className="w-80">
            <MenuLabel>Notifications</MenuLabel>
            <MenuSeparator />
            {notifications.map((n) => (
              <MenuItem key={n.title} className="items-start gap-2.5 py-2">
                <n.icon className="mt-0.5 size-4" />
                <span className="flex flex-col">
                  <span className="text-sm text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.meta}
                  </span>
                </span>
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>

        {/* Workspace selector */}
        <Menu>
          <MenuTrigger className="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm font-medium text-foreground transition-colors hover:border-ring/40 aria-expanded:border-ring/40 sm:flex">
            <span className="flex size-5 items-center justify-center rounded bg-primary/10 text-[0.625rem] font-bold text-primary">
              AG
            </span>
            <span className="max-w-28 truncate">Acme Global</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuLabel>Workspaces</MenuLabel>
            <MenuSeparator />
            {workspaces.map((w, i) => (
              <MenuItem key={w}>
                <span className="flex-1">{w}</span>
                {i === 0 ? <Check className="size-4 text-primary" /> : null}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>

        {/* User profile */}
        <Menu>
          <MenuTrigger
            aria-label="Account menu"
            className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-shadow hover:ring-2 hover:ring-ring/30 aria-expanded:ring-2 aria-expanded:ring-ring/30"
          >
            JD
          </MenuTrigger>
          <MenuContent align="end">
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium text-foreground">Jordan Diaz</p>
              <p className="text-xs text-muted-foreground">
                jordan@acme.com
              </p>
            </div>
            <MenuSeparator />
            <MenuItem>
              <User />
              Profile
            </MenuItem>
            <MenuItem>
              <Settings />
              Settings
            </MenuItem>
            <MenuSeparator />
            <MenuItem className="text-destructive [&_svg]:text-destructive">
              <LogOut />
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  )
}
