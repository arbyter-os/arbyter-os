'use client'

import { useEffect, useRef, useState } from 'react'
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

type OpenMenu = 'notifications' | 'workspace' | 'account' | null

export function TopBar({
  onToggleCollapse,
  onOpenMobile,
}: {
  onToggleCollapse: () => void
  onOpenMobile: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const headerRef = useRef<HTMLElement>(null)

  const current = routeTitles[pathname] ?? 'Overview'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('Arbyter')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)

  const searchResults = searchItems.filter((item) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      item.label.toLowerCase().includes(query) ||
      item.href.toLowerCase().includes(query)
    )
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

          if (organization?.name) setOrganizationName(organization.name)
        }
      }

      setLoadingProfile(false)
    }

    void loadProfile()
  }, [router])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        setOpenMenu(null)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setOpenMenu(null)
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
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

  function toggleMenu(menu: Exclude<OpenMenu, null>) {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu))
  }

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
    <header
      ref={headerRef}
      className="sticky top-3 z-40 mx-3 flex h-14 items-center gap-2 rounded-[1.25rem] liquid-glass px-3 md:mx-6 md:px-4 lg:mx-8"
    >
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
          onClick={() => {
            setSearchOpen(true)
            setOpenMenu(null)
          }}
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
          onClick={() => {
            setSearchOpen(true)
            setOpenMenu(null)
          }}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground md:hidden"
        >
          <Search className="size-[1.15rem]" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={openMenu === 'notifications'}
            onClick={() => toggleMenu('notifications')}
            className="relative flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground aria-expanded:bg-white/60 aria-expanded:text-foreground"
          >
            <Bell className="size-[1.15rem]" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-white/70" />
          </button>

          {openMenu === 'notifications' ? (
            <div className="absolute right-0 top-full z-[120] mt-2 w-80 rounded-2xl border border-white/75 bg-white/78 p-1 text-foreground shadow-[0_20px_60px_rgba(32,38,75,.18)] backdrop-blur-2xl">
              <div className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                Notifications
              </div>
              <div className="my-1 h-px bg-border/60" />
              {notifications.map((n) => (
                <button
                  key={n.title}
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/65"
                >
                  <n.icon className="mt-0.5 size-4 text-muted-foreground" />
                  <span className="flex flex-col">
                    <span className="text-sm">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.meta}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Workspace menu"
            aria-expanded={openMenu === 'workspace'}
            onClick={() => toggleMenu('workspace')}
            className="hidden h-10 items-center gap-2 rounded-xl border border-white/65 bg-white/40 px-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-white/60 aria-expanded:bg-white/65 sm:flex"
          >
            <span className="flex size-5 items-center justify-center rounded-lg bg-primary/10 text-[0.625rem] font-bold text-primary">
              {workspaceInitials}
            </span>
            <span className="max-w-28 truncate">
              {loadingProfile ? 'Loading…' : organizationName}
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>

          {openMenu === 'workspace' ? (
            <div className="absolute right-0 top-full z-[120] mt-2 min-w-56 rounded-2xl border border-white/75 bg-white/78 p-1 text-foreground shadow-[0_20px_60px_rgba(32,38,75,.18)] backdrop-blur-2xl">
              <div className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                Workspace
              </div>
              <div className="my-1 h-px bg-border/60" />
              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-white/65"
              >
                <span className="flex-1">{organizationName}</span>
                <Check className="size-4 text-primary" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={openMenu === 'account'}
            onClick={() => toggleMenu('account')}
            className="flex size-10 items-center justify-center rounded-full bg-white/72 text-xs font-semibold text-primary shadow-sm ring-1 ring-white/70 transition-shadow hover:ring-2 hover:ring-primary/25 aria-expanded:ring-2 aria-expanded:ring-primary/25"
          >
            {loadingProfile ? '…' : initials}
          </button>

          {openMenu === 'account' ? (
            <div className="absolute right-0 top-full z-[120] mt-2 w-64 rounded-2xl border border-white/75 bg-white/78 p-1 text-foreground shadow-[0_20px_60px_rgba(32,38,75,.18)] backdrop-blur-2xl">
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium">
                  {loadingProfile ? 'Loading…' : displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {loadingProfile ? '' : email}
                </p>
              </div>

              <div className="my-1 h-px bg-border/60" />

              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  router.push('/settings')
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-white/65"
              >
                <User className="size-4 text-muted-foreground" />
                Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenMenu(null)
                  router.push('/settings')
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-white/65"
              >
                <Settings className="size-4 text-muted-foreground" />
                Settings
              </button>

              <div className="my-1 h-px bg-border/60" />

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-destructive hover:bg-red-500/5"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/20 p-4 pt-20 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false)
              setSearchQuery('')
            }}
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
                          <span className="block text-sm font-medium">
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
