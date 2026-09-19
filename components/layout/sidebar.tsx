'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { footerNav, navSections } from '@/lib/mock-data/navigation'
import { Logo } from '@/components/layout/logo'
import type { NavItem } from '@/lib/types'

function NavLink({ item, active, collapsed, onNavigate }: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-white/72 text-sidebar-accent-foreground shadow-[0_8px_24px_rgba(19,0,186,.08)] ring-1 ring-white/80'
          : 'text-sidebar-foreground hover:bg-white/45 hover:text-foreground',
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />
      ) : null}
      <Icon
        className={cn(
          'size-4 shrink-0',
          active ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-hidden="true"
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
}

export function Sidebar({ collapsed = false, onNavigate, className }: {
  collapsed?: boolean
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside className={cn('liquid-glass-strong flex h-full flex-col overflow-hidden rounded-[1.35rem] shadow-[0_24px_70px_rgba(32,38,75,.14)]', className)}>
      <div className={cn('flex h-16 items-center border-b border-white/55 px-4', collapsed && 'justify-center px-0')}>
        <Logo collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            {!collapsed ? (
              <p className="px-2.5 pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            ) : (
              <div className="mx-2.5 mb-2 h-px bg-white/45" />
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/55 px-3 py-3">
        <ul className="flex flex-col gap-1">
          {footerNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(item.href)} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
