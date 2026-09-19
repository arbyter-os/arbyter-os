'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  X,
} from 'lucide-react'

import { footerNav, navSections, routeTitles } from '@/lib/mock-data/navigation'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const searchItems = [...navSections.flatMap((section) => section.items), ...footerNav]

const notifications: {
  title: string
  meta: string
  icon: LucideIcon
}[] = [
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
  const router = useRouter()
  const current = routeTitles[pathname] ?? 'Overview'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('Arbyter')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const searchResults = searchItems.filter((item) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query)
  })

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setFullName(profile.full_name ?? '')

        if (profile.organization_id) {
          const { data: organization } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .maybeSingle()

          if (organization?.name) {
            setOrganizationName(organization.name)
          }
        }
      }

      setLoadingProfile(false)
    }

    loadProfile()
  }, [router])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const displayName = fullName.trim() || email.split('@')[0] || 'User'

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'

  const workspaceInitials =
    organizationName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A'

  async function handleSignOut() {
    setLoadingProfile(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out failed:', error)
      setLoadingProfile(false)
      return
    }

    window.location.href = '/login'
  }

  return (
    <header className="sticky top-3 z-30 mx-3 flex h-14 items-center gap-2 rounded-[1.25rem] liquid-glass px-3 md:mx-6 md:px-4 lg:mx-8">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className="hidden size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground lg:flex"
      >
        <PanelLeft className="size-[1.15rem]" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm">
          <li className="hidden text-muted-foreground sm:block">Arbyter OS</li>
          <li className="hidden text-muted-foreground/40 sm:block" aria-hidden>/</li>
          <li className="truncate font-semibold text-foreground">{current}</li>
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-white/75 bg-white/45 px-3 text-sm text-muted-foreground shadow-inner transition-colors hover:bg-white/60 md:flex xl:w-72"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <kbd className="ml-auto rounded-lg border border-white/60 bg-white/50 px-1.5 py-0.5 font-mono text-[0.625rem] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground md:hidden"
        >
          <Search className="size-[1.15rem]" />
        </button>

        <Menu>
          <MenuTrigger
            aria-label="Notifications"
            className="relative flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground aria-expanded:bg-white/60 aria-expanded:text-foreground"
          >
            <Bell className="size-[1.15rem]" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-white/70" />
          </MenuTrigger>

          <MenuContent align="end" className="w-80">
            <MenuLabel>Notifications</MenuLabel>
            <MenuSeparator />
            {notifications.map((n) => (
              <MenuItem key={n.title} className="items-start gap-2.5 py-2">
                <n.icon className="mt-0.5 size-4" />
                <span className="flex flex-col">
                  <span className="text-sm text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.meta}</span>
                </span>
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>

        <Menu>
          <MenuTrigger className="hidden h-10 items-center gap-2 rounded-xl border border-white/65 bg-white/40 px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-white/60 aria-expanded:bg-white/65 sm:flex">
            <span className="flex size-5 items-center justify-center rounded-lg bg-primary/10 text-[0.625rem] font-bold text-primary">
              {workspaceInitials}
            </span>
            <span className="max-w-28 truncate">
              {loadingProfile ? 'Loading…' : organizationName}
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </MenuTrigger>

          <MenuContent align="end">
            <MenuLabel>Workspace</MenuLabel>
            <MenuSeparator />
            <MenuItem>
              <span className="flex-1">{organizationName}</span>
              <Check className="size-4 text-primary" />
            </MenuItem>
          </MenuContent>
        </Menu>

        <Menu>
          <MenuTrigger
            aria-label="Account menu"
            className="flex size-10 items-center justify-center rounded-full bg-white/72 text-xs font-semibold text-primary shadow-sm ring-1 ring-white/70 transition-shadow hover:ring-2 hover:ring-primary/25 aria-expanded:ring-2 aria-expanded:ring-primary/25"
          >
            {loadingProfile ? '…' : initials}
          </MenuTrigger>

          <MenuContent align="end" className="w-64">
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium text-foreground">
                {loadingProfile ? 'Loading…' : displayName}
              </p>
              <p className="text-xs text-muted-foreground">
                {loadingProfile ? '' : email}
              </p>
            </div>

            <MenuSeparator />

            <MenuItem onSelect={() => router.push('/settings')}>
              <User />
              Profile
            </MenuItem>

            <MenuItem onSelect={() => router.push('/settings')}>
              <Settings />
              Settings
            </MenuItem>

            <MenuSeparator />

            <MenuItem
              onSelect={handleSignOut}
              className="text-destructive [&_svg]:text-destructive"
            >
              <LogOut />
              Sign out
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/20 p-4 pt-20 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[1.4rem] border border-white/75 bg-white/78 shadow-[0_24px_80px_rgba(32,38,75,.2)] backdrop-blur-2xl">
            <div className="flex items-center gap-3 border-b border-white/60 px-4">
              <Search className="size-5 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Arbyter…"
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchOpen(false)
                }}
                aria-label="Close search"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/60 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {searchResults.length ? (
                <div className="space-y-1">
                  {searchResults.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchQuery('')
                          router.push(item.href)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/65"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.href}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No Arbyter pages match “{searchQuery}”.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
